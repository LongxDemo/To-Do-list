import { NextRequest, NextResponse } from "next/server";
import { addTask, getTasks, setTaskStatus, type Priority, type Status } from "@/lib/tasks";

const VALID_PRIORITIES: Priority[] = ["low", "medium", "high"];
const VALID_STATUSES: Status[] = ["todo", "in_progress", "complete"];

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = process.env.TASKS_API_TOKEN;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await getTasks();
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = process.env.TASKS_API_TOKEN;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const priority: Priority = VALID_PRIORITIES.includes(body.priority) ? body.priority : "medium";
  const status: Status = VALID_STATUSES.includes(body.status) ? body.status : "todo";
  const dueDate = typeof body.dueDate === "string" && body.dueDate ? body.dueDate : null;
  const category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : null;

  const task = await addTask({ title: body.title, dueDate, priority, category, status });
  return NextResponse.json({ task }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = process.env.TASKS_API_TOKEN;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "status must be one of: " + VALID_STATUSES.join(", ") }, { status: 400 });
  }

  await setTaskStatus(body.id, body.status);
  return NextResponse.json({ ok: true });
}
