"use client";

import { useState } from "react";
import type { Task } from "@/lib/tasks";
import { khmerHolidayOn } from "@/lib/khmer-holidays";
import { TaskEditModal } from "../task-edit-modal";

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
const MAX_VISIBLE_PER_DAY = 5;

export type CalendarCell = { dateStr: string | null; day: number | null; tasks: Task[] };

export function CalendarGrid({ cells, todayStr }: { cells: CalendarCell[]; todayStr: string }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <div className="grid grid-cols-7 border-b border-black/10 dark:border-white/10">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
          >
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const isToday = cell.dateStr === todayStr;
          const holiday = cell.dateStr ? khmerHolidayOn(cell.dateStr) : null;
          const visible = cell.tasks.slice(0, MAX_VISIBLE_PER_DAY);
          const overflow = cell.tasks.length - visible.length;

          return (
            <div
              key={i}
              className={`min-h-[10rem] border-b border-r border-black/5 p-2 dark:border-white/5 ${
                cell.day === null
                  ? "bg-zinc-50/50 dark:bg-zinc-950/50"
                  : holiday
                    ? "bg-rose-50/70 dark:bg-rose-500/5"
                    : ""
              }`}
            >
              {cell.day !== null && (
                <>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                        isToday ? "bg-violet-600 text-white" : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {cell.day}
                    </div>
                    {holiday && (
                      <span
                        title={holiday}
                        className="truncate text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400"
                      >
                        {holiday}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {visible.map((task) => (
                      <button
                        type="button"
                        key={task.id}
                        title={task.title}
                        onClick={() => setSelectedTask(task)}
                        className={`flex w-full items-center gap-1.5 truncate rounded px-2 py-1 text-left text-xs font-medium transition-transform active:scale-95 ${STATUS_CHIP[task.status]}`}
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[task.status]}`}
                        />
                        <span className="truncate">{task.title}</span>
                      </button>
                    ))}
                    {overflow > 0 && (
                      <div className="px-2 text-xs text-zinc-400 dark:text-zinc-500">
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

      {selectedTask && (
        <TaskEditModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
