import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/intervals/syncAuth";

export const maxDuration = 15;

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = process.env.INTERVALS_API_TOKEN ?? "";
  const credentials = Buffer.from(`${token}:x`).toString("base64");
  const headers = { Authorization: `Basic ${credentials}`, Accept: "application/json" };

  const [personRes, projectPage2Res, taskPage2Res, timeRes] = await Promise.all([
    fetch("https://api.myintervals.com/person/?limit=5", { headers }).then(r => r.json()),
    fetch("https://api.myintervals.com/project/?limit=5&page=2", { headers }).then(r => r.json()),
    fetch("https://api.myintervals.com/task/?limit=5&page=2", { headers }).then(r => r.json()),
    fetch("https://api.myintervals.com/time/?limit=5&page=2", { headers }).then(r => r.json()),
  ]);

  return NextResponse.json({
    person_no_page: { error: personRes.error ?? null, hasData: !!personRes.person },
    project_page2: { error: projectPage2Res.error ?? null, hasData: !!projectPage2Res.project },
    task_page2: { error: taskPage2Res.error ?? null, hasData: !!taskPage2Res.task },
    time_page2: { error: timeRes.error ?? null, hasData: !!timeRes.time },
  });
}
