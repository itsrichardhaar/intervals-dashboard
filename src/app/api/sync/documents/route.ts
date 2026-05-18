import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron/auth";
import { prisma } from "@/lib/prisma";
import { syncDocuments } from "@/lib/intervals/syncDocuments";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const log = await prisma.syncLog.create({ data: { status: "running" } });

  try {
    const result = await syncDocuments();
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        completedAt: new Date(),
        status: result.errors.length === 0 ? "success" : "partial",
        resourcesSynced: `documents:${result.synced}`,
        errorMessage: result.errors.length > 0 ? result.errors.slice(0, 5).join("\n") : null,
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { completedAt: new Date(), status: "failed", errorMessage: message },
    });
    console.error("syncDocuments failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
