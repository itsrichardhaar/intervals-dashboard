import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/intervals/syncAuth";
import { syncTasks } from "@/lib/intervals/syncTasks";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await syncTasks();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("syncTasks failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
