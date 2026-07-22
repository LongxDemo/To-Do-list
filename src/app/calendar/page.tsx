import Link from "next/link";
import { getTasks, type Task } from "@/lib/tasks";

const STATUS_DOT: Record<Task["status"], string> = {
  todo: "bg-zinc-400 dark:bg-zinc-500",
  in_progress: "bg-sky-500",
  complete: "bg-emerald-500",
};

const STATUS_CHIP: Record<Task["status"], string> = {
  todo: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  in_progress: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  complete:
    "bg-emerald-100 text-emerald-700 line-through dark:bg-emerald-500/20 dark:text-emerald-300",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_PER_DAY = 3;

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

  const cells: { dateStr: string | null; day: number | null }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startWeekday + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push({ dateStr: null, day: null });
    } else {
      cells.push({ dateStr: `${year}-${pad2(month)}-${pad2(dayNum)}`, day: dayNum });
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

        <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <div className="grid grid-cols-7 border-b border-black/10 dark:border-white/10">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
              >
                {wd}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const dayTasks = cell.dateStr ? tasksByDate.get(cell.dateStr) ?? [] : [];
              const isToday = cell.dateStr === todayStr;
              const visible = dayTasks.slice(0, MAX_VISIBLE_PER_DAY);
              const overflow = dayTasks.length - visible.length;

              return (
                <div
                  key={i}
                  className={`min-h-[6.5rem] border-b border-r border-black/5 p-1.5 dark:border-white/5 ${
                    cell.day === null ? "bg-zinc-50/50 dark:bg-zinc-950/50" : ""
                  }`}
                >
                  {cell.day !== null && (
                    <>
                      <div
                        className={`mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                          isToday
                            ? "bg-violet-600 text-white"
                            : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {cell.day}
                      </div>
                      <div className="flex flex-col gap-1">
                        {visible.map((task) => (
                          <div
                            key={task.id}
                            title={task.title}
                            className={`flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_CHIP[task.status]}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[task.status]}`}
                            />
                            <span className="truncate">{task.title}</span>
                          </div>
                        ))}
                        {overflow > 0 && (
                          <div className="px-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                            +{overflow} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
