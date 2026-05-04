import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const last = await prisma.syncLog.findFirst({
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json({ lastSync: last });
}
