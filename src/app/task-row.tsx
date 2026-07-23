"use client";

import { useEffect, useState, useTransition } from "react";
import type { Status, Task } from "@/lib/tasks";
import {
  cycleStatusAction,
  deleteTaskAction,
  renameTaskAction,
  startTimerAction,
  stopTimerAction,
} from "./actions";

function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0 && m === 0) return "< 1m";
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

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

const PRIORITY_STYLE: Record<Task["priority"], string> = {
  high: "text-red-500",
  medium: "text-amber-500",
  low: "text-emerald-500",
};

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function formatDueDate(dueDate: string | null, complete: boolean) {
  if (!dueDate) return null;
  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  let label: string;
  if (diffDays === 0) label = "Today";
  else if (diffDays === 1) label = "Tomorrow";
  else if (diffDays === -1) label = "Yesterday";
  else label = due.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return { label, overdue: diffDays < 0 && !complete };
}

export function TaskRow({
  task,
  totalSeconds,
  isTiming,
  activeStartedAt,
}: {
  task: Task;
  totalSeconds: number;
  isTiming: boolean;
  activeStartedAt: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [isPending, startTransition] = useTransition();
  const [liveSeconds, setLiveSeconds] = useState(0);

  useEffect(() => {
    if (!isTiming || !activeStartedAt) {
      setLiveSeconds(0);
      return;
    }
    const startedMs = new Date(activeStartedAt).getTime();
    const tick = () => setLiveSeconds((Date.now() - startedMs) / 1000);
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isTiming, activeStartedAt]);

  const due = formatDueDate(task.dueDate, task.status === "complete");
  const statusStyle = STATUS_STYLE[task.status];
  const displaySeconds = isTiming ? totalSeconds + liveSeconds : totalSeconds;

  function commitRename() {
    setEditing(false);
    const trimmed = title.trim();
    if (!trimmed || trimmed === task.title) {
      setTitle(task.title);
      return;
    }
    startTransition(() => {
      renameTaskAction(task.id, trimmed);
    });
  }

  return (
    <div
      className={`group grid grid-cols-[7.5rem_1fr_9rem_5rem_5rem_7rem_2rem] items-center gap-3 border-b border-black/5 px-3 py-2.5 transition-colors hover:bg-violet-50/60 dark:border-white/5 dark:hover:bg-violet-500/5 ${
        isPending ? "opacity-60" : ""
      }`}
      style={{ animation: "task-in 0.25s ease-out" }}
    >
      <button
        type="button"
        onClick={() => startTransition(() => cycleStatusAction(task.id))}
        className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide transition-transform active:scale-95 ${statusStyle.className}`}
        title="Click to change status"
      >
        {statusStyle.label}
      </button>

      <div className="min-w-0">
        {editing ? (
          <input
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setTitle(task.title);
                setEditing(false);
              }
            }}
            className="w-full rounded border border-violet-300 bg-transparent px-1 text-sm text-black outline-none dark:border-violet-700 dark:text-zinc-50"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={`block w-full truncate text-left text-sm ${
              task.status === "complete"
                ? "text-zinc-400 line-through dark:text-zinc-500"
                : "text-black dark:text-zinc-50"
            }`}
          >
            {task.title}
          </button>
        )}
      </div>

      <div className="min-w-0">
        {task.category && (
          <span className="block w-fit max-w-full truncate rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
            {task.category}
          </span>
        )}
      </div>

      <div className={`text-xs font-medium ${PRIORITY_STYLE[task.priority]}`}>
        {PRIORITY_LABEL[task.priority]}
      </div>

      <div
        className={`text-xs ${
          due?.overdue
            ? "font-semibold text-red-500"
            : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {due ? (due.overdue ? "Overdue" : due.label) : ""}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() =>
            startTransition(() => (isTiming ? stopTimerAction() : startTimerAction(task.id)))
          }
          aria-label={isTiming ? "Stop timer" : "Start timer"}
          title={isTiming ? "Stop timer" : "Start timer"}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] transition-transform active:scale-95 ${
            isTiming
              ? "bg-red-500 text-white"
              : "bg-zinc-200 text-zinc-500 hover:bg-violet-100 hover:text-violet-700 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-violet-500/20 dark:hover:text-violet-300"
          }`}
        >
          {isTiming ? "■" : "▶"}
        </button>
        <span
          className={`text-xs tabular-nums ${
            isTiming
              ? "font-semibold text-red-500"
              : displaySeconds > 0
                ? "text-zinc-500 dark:text-zinc-400"
                : "text-zinc-300 dark:text-zinc-600"
          }`}
        >
          {formatDuration(displaySeconds)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => startTransition(() => deleteTaskAction(task.id))}
        aria-label="Delete task"
        className="justify-self-end rounded-full p-1 text-sm text-zinc-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 focus-visible:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
