import Link from "next/link";
import { getTasks, type Task } from "@/lib/tasks";
import { addTaskAction } from "./actions";
import { TaskRow } from "./task-row";

type Filter = "all" | "today" | "overdue" | "completed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
];

function isToday(dueDate: string | null) {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return due.getTime() === today.getTime();
}

function isOverdue(task: Task) {
  if (!task.dueDate || task.status === "complete") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${task.dueDate}T00:00:00`);
  return due.getTime() < today.getTime();
}

function filterTasks(tasks: Task[], filter: Filter) {
  switch (filter) {
    case "today":
      return tasks.filter((t) => isToday(t.dueDate));
    case "overdue":
      return tasks.filter(isOverdue);
    case "completed":
      return tasks.filter((t) => t.status === "complete");
    default:
      return tasks;
  }
}

function hrefFor(filter: Filter, category: string | null) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (category) params.set("category", category);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; category?: string }>;
}) {
  const { filter: rawFilter, category: rawCategory } = await searchParams;
  const filter: Filter = FILTERS.some((f) => f.key === rawFilter)
    ? (rawFilter as Filter)
    : "all";
  const category = rawCategory || null;

  const tasks = await getTasks();
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "complete").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const counts: Record<Filter, number> = {
    all: total,
    today: tasks.filter((t) => isToday(t.dueDate)).length,
    overdue: tasks.filter(isOverdue).length,
    completed: done,
  };

  const categories = Array.from(
    new Set(tasks.map((t) => t.category).filter((c): c is string => !!c))
  ).sort((a, b) => a.localeCompare(b));
  const categoryCounts: Record<string, number> = {};
  for (const cat of categories) {
    categoryCounts[cat] = tasks.filter((t) => t.category === cat).length;
  }
  const uncategorizedCount = tasks.filter((t) => !t.category).length;

  const visible = filterTasks(tasks, filter).filter((t) => {
    if (!category) return true;
    if (category === "__none__") return !t.category;
    return t.category === category;
  });

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <aside className="flex w-56 shrink-0 flex-col gap-1 border-r border-black/5 bg-violet-50/70 px-3 py-6 dark:border-white/5 dark:bg-violet-500/5">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
            ✓
          </span>
          <span className="text-sm font-semibold text-black dark:text-zinc-50">
            My Tasks
          </span>
        </div>
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={hrefFor(f.key, category)}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-violet-600 text-white"
                : "text-zinc-600 hover:bg-violet-100 dark:text-zinc-400 dark:hover:bg-violet-500/10"
            }`}
          >
            <span>{f.label}</span>
            <span
              className={`text-xs ${
                filter === f.key ? "text-violet-200" : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {counts[f.key]}
            </span>
          </Link>
        ))}

        <Link
          href="/calendar"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-violet-100 dark:text-zinc-400 dark:hover:bg-violet-500/10"
        >
          <span>📅 Calendar</span>
        </Link>

        {categories.length > 0 && (
          <>
            <div className="mb-1 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Categories
            </div>
            <Link
              href={hrefFor(filter, null)}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                !category
                  ? "bg-violet-600 text-white"
                  : "text-zinc-600 hover:bg-violet-100 dark:text-zinc-400 dark:hover:bg-violet-500/10"
              }`}
            >
              <span>All categories</span>
              <span
                className={`text-xs ${
                  !category ? "text-violet-200" : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {total}
              </span>
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={hrefFor(filter, cat)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  category === cat
                    ? "bg-violet-600 text-white"
                    : "text-zinc-600 hover:bg-violet-100 dark:text-zinc-400 dark:hover:bg-violet-500/10"
                }`}
              >
                <span className="truncate">{cat}</span>
                <span
                  className={`shrink-0 text-xs ${
                    category === cat ? "text-violet-200" : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {categoryCounts[cat]}
                </span>
              </Link>
            ))}
            {uncategorizedCount > 0 && (
              <Link
                href={hrefFor(filter, "__none__")}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  category === "__none__"
                    ? "bg-violet-600 text-white"
                    : "text-zinc-600 hover:bg-violet-100 dark:text-zinc-400 dark:hover:bg-violet-500/10"
                }`}
              >
                <span>No category</span>
                <span
                  className={`text-xs ${
                    category === "__none__" ? "text-violet-200" : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {uncategorizedCount}
                </span>
              </Link>
            )}
          </>
        )}
      </aside>

      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-baseline justify-between">
            <h1 className="text-xl font-bold text-black dark:text-zinc-50">
              {FILTERS.find((f) => f.key === filter)?.label}
              {category && (
                <span className="text-zinc-400 dark:text-zinc-500">
                  {" · "}
                  {category === "__none__" ? "No category" : category}
                </span>
              )}
            </h1>
            {total > 0 && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {done}/{total} done
              </span>
            )}
          </div>

          {total > 0 && (
            <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-violet-600 transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}

          <form
            action={addTaskAction}
            className="mb-6 rounded-xl border border-black/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-zinc-900"
          >
            <div className="flex gap-2">
              <input
                type="text"
                name="title"
                placeholder="+ Add a task…"
                required
                autoComplete="off"
                className="flex-1 rounded-lg border border-transparent bg-zinc-50 px-3 py-2 text-sm text-black outline-none focus:border-violet-300 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-violet-700"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-transform active:scale-95 hover:bg-violet-700"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="date"
                name="dueDate"
                aria-label="Due date"
                className="rounded-md border border-black/10 bg-zinc-50 px-2 py-1 text-xs text-zinc-600 outline-none focus:border-violet-300 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-400"
              />
              <select
                name="priority"
                defaultValue="medium"
                aria-label="Priority"
                className="rounded-md border border-black/10 bg-zinc-50 px-2 py-1 text-xs text-zinc-600 outline-none focus:border-violet-300 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input
                type="text"
                name="category"
                placeholder="Category"
                autoComplete="off"
                list="category-options"
                className="min-w-0 flex-1 rounded-md border border-black/10 bg-zinc-50 px-2 py-1 text-xs text-zinc-600 outline-none focus:border-violet-300 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-400"
              />
              <datalist id="category-options">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </form>

          {total > 0 && (
            <div className="grid grid-cols-[7.5rem_1fr_9rem_5rem_5rem_2rem] gap-3 border-b border-black/10 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:border-white/10 dark:text-zinc-500">
              <span>Status</span>
              <span>Task</span>
              <span>Category</span>
              <span>Priority</span>
              <span>Due</span>
              <span />
            </div>
          )}

          <div className="rounded-b-xl border border-t-0 border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
            {visible.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                {total === 0 ? "No tasks yet — add one above." : "Nothing here."}
              </p>
            ) : (
              visible.map((task) => <TaskRow key={task.id} task={task} />)
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
