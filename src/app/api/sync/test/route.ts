import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/intervals/syncAuth";

export const maxDuration = 15;

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = process.env.INTERVALS_API_TOKEN ?? "";
  const credentials = Buffer.from(`${token}:x`).toString("base64");
  const headers = { Authorization: `Basic ${credentials}`, Accept: "application/json" };

  const [offsetProject, offsetTask, offsetTime, highLimitProject, highLimitTask] = await Promise.all([
    fetch("https://api.myintervals.com/project/?limit=5&offset=5", { headers }).then(r => r.json()),
    fetch("https://api.myintervals.com/task/?limit=5&offset=5", { headers }).then(r => r.json()),
    fetch("https://api.myintervals.com/time/?limit=5&offset=5", { headers }).then(r => r.json()),
    fetch("https://api.myintervals.com/project/?limit=2000", { headers }).then(r => r.json()),
    fetch("https://api.myintervals.com/task/?limit=3000", { headers }).then(r => r.json()),
  ]);

  return NextResponse.json({
    project_offset: { error: offsetProject.error ?? null, hasData: !!offsetProject.project, listcount: offsetProject.listcount },
    task_offset: { error: offsetTask.error ?? null, hasData: !!offsetTask.task },
    time_offset: { error: offsetTime.error ?? null, hasData: !!offsetTime.time },
    project_limit2000: { error: highLimitProject.error ?? null, listcount: highLimitProject.listcount, count: Array.isArray(highLimitProject.project) ? highLimitProject.project.length : (highLimitProject.project ? 1 : 0) },
    task_limit3000: { error: highLimitTask.error ?? null, listcount: highLimitTask.listcount, count: Array.isArray(highLimitTask.task) ? highLimitTask.task.length : (highLimitTask.task ? 1 : 0) },
  });
}
