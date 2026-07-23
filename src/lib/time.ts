import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export type ActiveEntry = { taskId: string; startedAt: string } | null;

let ensured: Promise<unknown> | null = null;

// Same lazy-migration pattern as tasks.ts — serverless functions get a fresh
// instance per cold start, so create the table on first use.
function ensureTable() {
  if (!ensured) {
    ensured = sql`
      CREATE TABLE IF NOT EXISTS time_entries (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        ended_at TIMESTAMPTZ
      )
    `;
  }
  return ensured;
}

// One timer running at a time: starting a new one stops whatever else was running.
export async function startTimer(taskId: string): Promise<void> {
  await ensureTable();
  await sql`UPDATE time_entries SET ended_at = now() WHERE ended_at IS NULL`;
  await sql`INSERT INTO time_entries (id, task_id) VALUES (${randomUUID()}, ${taskId})`;
}

export async function stopActiveTimer(): Promise<void> {
  await ensureTable();
  await sql`UPDATE time_entries SET ended_at = now() WHERE ended_at IS NULL`;
}

export async function getActiveEntry(): Promise<ActiveEntry> {
  await ensureTable();
  const rows = (await sql`
    SELECT task_id, started_at::text AS started_at
    FROM time_entries WHERE ended_at IS NULL
    ORDER BY started_at DESC LIMIT 1
  `) as { task_id: string; started_at: string }[];
  const row = rows[0];
  return row ? { taskId: row.task_id, startedAt: row.started_at } : null;
}

// Total logged seconds per task, counting the still-running entry (if any) up to now().
export async function getTotalsByTask(): Promise<Record<string, number>> {
  await ensureTable();
  const rows = (await sql`
    SELECT task_id, SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at)))::float AS seconds
    FROM time_entries
    GROUP BY task_id
  `) as { task_id: string; seconds: number }[];
  const totals: Record<string, number> = {};
  for (const r of rows) totals[r.task_id] = r.seconds;
  return totals;
}
