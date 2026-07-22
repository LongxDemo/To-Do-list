import Link from "next/link";
import { getTasks, type Task } from "@/lib/tasks";
import { CalendarGrid, type CalendarCell } from "./calendar-grid";

function parseMonth(raw: string | undefined): { year: number; month: number } {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [year, month] = raw.split("-").map(Number);
    if (month >= 1 && month <= 12) return { year, month };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: rawMonth } = await searchParams;
  const { year, month } = parseMonth(rawMonth);

  const tasks = await getTasks();
  const tasksByDate = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const list = tasksByDate.get(task.dueDate) ?? [];
    list.push(task);
    tasksByDate.set(task.dueDate, list);
  }

  const firstOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  const todayStr = new Date().toLocaleDateString("en-CA");

  const cells: CalendarCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startWeekday + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push({ dateStr: null, day: null, tasks: [] });
    } else {
      const dateStr = `${year}-${pad2(month)}-${pad2(dayNum)}`;
      cells.push({ dateStr, day: dayNum, tasks: tasksByDate.get(dateStr) ?? [] });
    }
  }

  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 px-8 py-8 font-sans dark:bg-zinc-950">
      <div className="w-full max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-violet-100 dark:text-zinc-400 dark:hover:bg-violet-500/10"
            >
              ← List view
            </Link>
            <h1 className="text-xl font-bold text-black dark:text-zinc-50">
              {monthLabel(year, month)}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/calendar?month=${shiftMonth(year, month, -1)}`}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-violet-100 dark:text-zinc-400 dark:hover:bg-violet-500/10"
            >
              ‹ Prev
            </Link>
            <Link
              href={`/calendar?month=${shiftMonth(year, month, 0)}`}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white"
            >
              Today
            </Link>
            <Link
              href={`/calendar?month=${shiftMonth(year, month, 1)}`}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-violet-100 dark:text-zinc-400 dark:hover:bg-violet-500/10"
            >
              Next ›
            </Link>
          </div>
        </div>

        <CalendarGrid cells={cells} todayStr={todayStr} />
      </div>
    </div>
  );
}
