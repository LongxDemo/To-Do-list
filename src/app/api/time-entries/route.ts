import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getActiveEntry, getTotalsByTask, logTimeEntry, startTimer, stopActiveTimer } from "@/lib/time";

function authorized(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = process.env.TASKS_API_TOKEN;
  return Boolean(expected) && auth === `Bearer ${expected}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [active, totals] = await Promise.all([getActiveEntry(), getTotalsByTask()]);
  return NextResponse.json({ active, totals });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || (body.action !== "start" && body.action !== "stop" && body.action !== "log")) {
    return NextResponse.json({ error: "action must be 'start', 'stop', or 'log'" }, { status: 400 });
  }

  if (body.action === "start") {
    if (typeof body.taskId !== "string" || !body.taskId) {
      return NextResponse.json({ error: "taskId is required to start" }, { status: 400 });
    }
    await startTimer(body.taskId);
  } else if (body.action === "stop") {
    await stopActiveTimer();
  } else {
    if (typeof body.taskId !== "string" || !body.taskId) {
      return NextResponse.json({ error: "taskId is required to log" }, { status: 400 });
    }
    if (typeof body.startedAt !== "string" || typeof body.endedAt !== "string") {
      return NextResponse.json({ error: "startedAt and endedAt are required to log" }, { status: 400 });
    }
    await logTimeEntry(body.taskId, body.startedAt, body.endedAt);
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
