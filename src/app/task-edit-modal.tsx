"use client";

import { useState, useTransition } from "react";
import type { Priority, Status, Task } from "@/lib/tasks";
import { cycleStatusAction, deleteTaskAction, editTaskAction } from "./actions";

const STATUS_STYLE: Record<Status, { label: string; className: string }> = {
  todo: {
    label: "TO DO",
    className: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
  },
  in_progress: {
    label: "IN PROGRESS",
    className: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  },
  complete: {
    label: "COMPLETE",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
};

export function TaskEditModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [category, setCategory] = useState(task.category ?? "");
  const [isPending, startTransition] = useTransition();
  const statusStyle = STATUS_STYLE[task.status];

  function save() {
    startTransition(() => {
      editTaskAction(task.id, {
        title,
        dueDate: dueDate || null,
        priority,
        category: category.trim() || null,
      });
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-black/10 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => startTransition(() => cycleStatusAction(task.id))}
            className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide transition-transform active:scale-95 ${statusStyle.className}`}
            title="Click to change status"
          >
            {statusStyle.label}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className="mb-3 w-full rounded-lg border border-black/10 bg-zinc-50 px-3 py-2 text-sm text-black outline-none focus:border-violet-300 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-violet-700"
        />

        <div className="mb-3 flex gap-2">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Due date"
            className="flex-1 rounded-md border border-black/10 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-600 outline-none focus:border-violet-300 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-400"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            aria-label="Priority"
            className="rounded-md border border-black/10 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-600 outline-none focus:border-violet-300 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-400"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="mb-4 w-full rounded-md border border-black/10 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-600 outline-none focus:border-violet-300 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-400"
        />

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              startTransition(() => deleteTaskAction(task.id));
              onClose();
            }}
            className="text-xs font-medium text-red-500 hover:text-red-600"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white transition-transform active:scale-95 hover:bg-violet-700 disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
