import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const last = await prisma.syncLog.findFirst({
    orderBy: { startedAt: "desc" },
  });

  if (last?.status === "running") {
    const ageMs = Date.now() - new Date(last.startedAt).getTime();
    if (ageMs > STALE_THRESHOLD_MS) {
      return NextResponse.json({ lastSync: { ...last, status: "stale" } });
    }
  }

  return NextResponse.json({ lastSync: last });
}
