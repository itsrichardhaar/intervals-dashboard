import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/intervals/syncAuth";
import { syncPeople } from "@/lib/intervals/syncPeople";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await syncPeople();
  return NextResponse.json(result);
}
