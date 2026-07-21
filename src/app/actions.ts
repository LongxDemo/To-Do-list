"use server";

import { revalidatePath } from "next/cache";
import {
  addTask,
  cycleTaskStatus,
  deleteTask,
  renameTask,
  type Priority,
} from "@/lib/tasks";

export async function addTaskAction(formData: FormData) {
  const title = formData.get("title");
  const dueDate = formData.get("dueDate");
  const priority = formData.get("priority");
  const category = formData.get("category");
  if (typeof title !== "string") return;

  await addTask({
    title,
    dueDate: typeof dueDate === "string" && dueDate ? dueDate : null,
    priority: (typeof priority === "string" ? priority : "medium") as Priority,
    category: typeof category === "string" ? category : null,
  });
  revalidatePath("/");
}

export async function cycleStatusAction(id: string) {
  await cycleTaskStatus(id);
  revalidatePath("/");
}

export async function deleteTaskAction(id: string) {
  await deleteTask(id);
  revalidatePath("/");
}

export async function renameTaskAction(id: string, title: string) {
  await renameTask(id, title);
  revalidatePath("/");
}
