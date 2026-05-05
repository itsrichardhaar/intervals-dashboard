import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/intervals/syncAuth";
import {
  sendOverdueAlert,
  sendDueTomorrowAlert,
  sendBudgetAlert,
  sendFlaggedTaskAlert,
} from "@/lib/email/sender";

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const [overdueTasks, dueTomorrowTasks, activeProjects, flaggedTasks] = await Promise.all([
    prisma.intervalsTask.findMany({
      where: { dueDate: { lt: todayStart }, status: { not: "closed" }, assigneeId: { not: null } },
      select: { id: true },
    }),
    prisma.intervalsTask.findMany({
      where: { dueDate: { gte: tomorrowStart, lte: tomorrowEnd }, status: { not: "closed" }, assigneeId: { not: null } },
      select: { id: true },
    }),
    prisma.intervalsProject.findMany({
      where: { status: "active", estimatedHours: { gt: 0 } },
      select: { id: true },
    }),
    prisma.intervalsTask.findMany({
      where: { status: { not: "closed" }, estimatedHours: null, assigneeId: { not: null } },
      select: { id: true },
    }),
  ]);

  const sent: string[] = [];
  const errors: string[] = [];

  for (const { id } of overdueTasks) {
    const r = await sendOverdueAlert(id);
    if (r === "sent") sent.push(`overdue:${id}`);
    else if (r === "error") errors.push(`overdue:${id}`);
  }

  for (const { id } of dueTomorrowTasks) {
    const r = await sendDueTomorrowAlert(id);
    if (r === "sent") sent.push(`due_tomorrow:${id}`);
    else if (r === "error") errors.push(`due_tomorrow:${id}`);
  }

  for (const { id } of activeProjects) {
    const r = await sendBudgetAlert(id);
    if (r === "sent") sent.push(`budget:${id}`);
    else if (r === "error") errors.push(`budget:${id}`);
  }

  for (const { id } of flaggedTasks) {
    const r = await sendFlaggedTaskAlert(id);
    if (r === "sent") sent.push(`flagged:${id}`);
    else if (r === "error") errors.push(`flagged:${id}`);
  }

  return NextResponse.json({ sent, errors });
}
