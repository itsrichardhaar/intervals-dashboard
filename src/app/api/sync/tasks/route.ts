import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/intervals/syncAuth";
import { syncTasks } from "@/lib/intervals/syncTasks";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await syncTasks();
  return NextResponse.json(result);
}
