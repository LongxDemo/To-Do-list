import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export type Priority = "low" | "medium" | "high";
export type Status = "todo" | "in_progress" | "complete";

export type Task = {
  id: string;
  title: string;
  status: Status;
  createdAt: string;
  dueDate: string | null;
  priority: Priority;
  category: string | null;
};

let ensured: Promise<unknown> | null = null;

// Serverless functions get a fresh instance per cold start, so create/migrate
// the table on first use instead of relying on a separate migration step.
function ensureTable() {
  if (!ensured) {
    ensured = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          due_date DATE,
          priority TEXT NOT NULL DEFAULT 'medium',
          category TEXT,
          status TEXT NOT NULL DEFAULT 'todo'
        )
      `;
      await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE`;
      await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium'`;
      await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category TEXT`;
      await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'todo'`;
      // Backfill status from the old boolean column for rows created before this migration.
      await sql`UPDATE tasks SET status = 'complete' WHERE completed = true AND status = 'todo'`;
    })();
  }
  return ensured;
}

type TaskRow = {
  id: string;
  title: string;
  status: Status;
  created_at: string;
  due_date: string | null;
  priority: Priority;
  category: string | null;
};

function toTask(r: TaskRow): Task {
  return {
    id: r.id,
    title: r.title,
    status: r.status,
    createdAt: r.created_at,
    dueDate: r.due_date,
    priority: r.priority,
    category: r.category,
  };
}

export async function getTasks(): Promise<Task[]> {
  await ensureTable();
  // Cast due_date to text in SQL so Postgres formats it directly as
  // "YYYY-MM-DD" — reading it back as a JS Date and reformatting client-side
  // shifts the calendar day whenever the server's local timezone isn't UTC.
  const rows = (await sql`
    SELECT id, title, status, created_at, due_date::text AS due_date, priority, category
    FROM tasks
    ORDER BY
      CASE status WHEN 'in_progress' THEN 0 WHEN 'todo' THEN 1 ELSE 2 END,
      due_date ASC NULLS LAST,
      created_at ASC
  `) as TaskRow[];
  return rows.map(toTask);
}

export async function addTask(input: {
  title: string;
  dueDate?: string | null;
  priority?: Priority;
  category?: string | null;
  status?: Status;
}): Promise<Task> {
  const title = input.title.trim();
  const dueDate = input.dueDate || null;
  const priority = input.priority ?? "medium";
  const category = input.category?.trim() || null;
  const status = input.status ?? "todo";
  await ensureTable();
  const rows = (await sql`
    INSERT INTO tasks (id, title, due_date, priority, category, status, completed)
    VALUES (${randomUUID()}, ${title}, ${dueDate}, ${priority}, ${category}, ${status}, ${status === "complete"})
    RETURNING id, title, status, created_at, due_date::text AS due_date, priority, category
  `) as TaskRow[];
  return toTask(rows[0]);
}

const STATUS_CYCLE: Record<Status, Status> = {
  todo: "in_progress",
  in_progress: "complete",
  complete: "todo",
};

export async function cycleTaskStatus(id: string): Promise<void> {
  await ensureTable();
  const rows = (await sql`SELECT status FROM tasks WHERE id = ${id}`) as { status: Status }[];
  const current = rows[0]?.status ?? "todo";
  const next = STATUS_CYCLE[current];
  await sql`UPDATE tasks SET status = ${next}, completed = ${next === "complete"} WHERE id = ${id}`;
}

export async function setTaskStatus(id: string, status: Status): Promise<void> {
  await ensureTable();
  await sql`UPDATE tasks SET status = ${status}, completed = ${status === "complete"} WHERE id = ${id}`;
}

export async function setTaskDueDate(id: string, dueDate: string | null): Promise<void> {
  await ensureTable();
  await sql`UPDATE tasks SET due_date = ${dueDate} WHERE id = ${id}`;
}

export async function deleteTask(id: string): Promise<void> {
  await ensureTable();
  await sql`DELETE FROM tasks WHERE id = ${id}`;
}

export async function editTask(
  id: string,
  input: { title: string; dueDate: string | null; priority: Priority; category: string | null }
): Promise<void> {
  const title = input.title.trim();
  if (!title) return;
  const category = input.category?.trim() || null;
  await ensureTable();
  await sql`
    UPDATE tasks
    SET title = ${title}, due_date = ${input.dueDate}, priority = ${input.priority}, category = ${category}
    WHERE id = ${id}
  `;
}

export async function renameTask(id: string, title: string): Promise<void> {
  const trimmed = title.trim();
  if (!trimmed) return;
  await ensureTable();
  await sql`UPDATE tasks SET title = ${trimmed} WHERE id = ${id}`;
}
