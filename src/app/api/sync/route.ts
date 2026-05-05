import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/cron/auth";
import { syncPeople } from "@/lib/intervals/syncPeople";
import { syncProjects } from "@/lib/intervals/syncProjects";
import { syncTasks } from "@/lib/intervals/syncTasks";
import { syncTimeEntries } from "@/lib/intervals/syncTimeEntries";
import { syncMilestones } from "@/lib/intervals/syncMilestones";
import { syncDocuments } from "@/lib/intervals/syncDocuments";

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = await prisma.syncLog.create({
    data: { status: "running" },
  });

  const resourcesSynced: string[] = [];
  const allErrors: string[] = [];

  const runners: Array<{ name: string; fn: () => Promise<{ synced: number; errors: string[] }> }> = [
    { name: "people",      fn: syncPeople },
    { name: "projects",    fn: syncProjects },
    { name: "tasks",       fn: syncTasks },
    { name: "time_entries", fn: syncTimeEntries },
    { name: "milestones",  fn: syncMilestones },
    { name: "documents",   fn: syncDocuments },
  ];

  for (const { name, fn } of runners) {
    try {
      const result = await fn();
      resourcesSynced.push(`${name}:${result.synced}`);
      if (result.errors.length > 0) allErrors.push(...result.errors);
    } catch (err) {
      allErrors.push(`${name}: ${String(err)}`);
    }
  }

  const status = allErrors.length === 0 ? "success" : resourcesSynced.length > 0 ? "partial" : "failed";

  await prisma.syncLog.update({
    where: { id: log.id },
    data: {
      completedAt: new Date(),
      status,
      resourcesSynced: resourcesSynced.join(", "),
      errorMessage: allErrors.length > 0 ? allErrors.slice(0, 10).join("\n") : null,
    },
  });

  return NextResponse.json({ status, resourcesSynced, errors: allErrors });
}
