import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/intervals/syncAuth";
import { syncProjects } from "@/lib/intervals/syncProjects";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await syncProjects();
  return NextResponse.json(result);
}
