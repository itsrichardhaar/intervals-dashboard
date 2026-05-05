import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/intervals/syncAuth";
import { getResend, FROM_ADDRESS } from "@/lib/email/resend";
import { buildOverdueAlert, buildDueTomorrowAlert } from "@/lib/email/taskAlerts";
import { buildBudgetAlert, buildFlaggedTaskAlert } from "@/lib/email/projectAlerts";

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = getResend();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const sent: string[] = [];
  const errors: string[] = [];

  // ── 1. Overdue tasks ──────────────────────────────────────────────────────
  const overdueTasks = await prisma.intervalsTask.findMany({
    where: {
      dueDate: { lt: todayStart },
      status: { not: "closed" },
      assigneeId: { not: null },
    },
    include: { project: true, assignee: true },
  });

  for (const task of overdueTasks) {
    if (!task.assignee?.email) continue;

    const existing = await prisma.emailSentLog.findFirst({
      where: { taskId: task.id, alertType: "overdue", sentAt: { gte: todayStart } },
    });
    if (existing) continue;

    const { subject, html } = buildOverdueAlert({
      assigneeName: task.assignee.name,
      assigneeEmail: task.assignee.email,
      task: { title: task.title, projectName: task.project.name, dueDate: task.dueDate! },
    });

    try {
      await resend.emails.send({ from: FROM_ADDRESS, to: task.assignee.email, subject, html });
      await prisma.emailSentLog.create({ data: { taskId: task.id, alertType: "overdue" } });
      sent.push(`overdue:${task.id}`);
    } catch (err) {
      console.error(`[alerts] overdue send failed for taskId=${task.id}:`, err);
      errors.push(`overdue:${task.id}`);
    }
  }

  // ── 2. Due-tomorrow tasks ─────────────────────────────────────────────────
  const dueTomorrowTasks = await prisma.intervalsTask.findMany({
    where: {
      dueDate: { gte: tomorrowStart, lte: tomorrowEnd },
      status: { not: "closed" },
      assigneeId: { not: null },
    },
    include: { project: true, assignee: true },
  });

  for (const task of dueTomorrowTasks) {
    if (!task.assignee?.email) continue;

    const existing = await prisma.emailSentLog.findFirst({
      where: { taskId: task.id, alertType: "due_tomorrow", sentAt: { gte: todayStart } },
    });
    if (existing) continue;

    const { subject, html } = buildDueTomorrowAlert({
      assigneeName: task.assignee.name,
      assigneeEmail: task.assignee.email,
      task: { title: task.title, projectName: task.project.name, dueDate: task.dueDate! },
    });

    try {
      await resend.emails.send({ from: FROM_ADDRESS, to: task.assignee.email, subject, html });
      await prisma.emailSentLog.create({ data: { taskId: task.id, alertType: "due_tomorrow" } });
      sent.push(`due_tomorrow:${task.id}`);
    } catch (err) {
      console.error(`[alerts] due_tomorrow send failed for taskId=${task.id}:`, err);
      errors.push(`due_tomorrow:${task.id}`);
    }
  }

  // ── 3. Budget alerts (projects > 80% of estimated hours) ─────────────────
  const alertEmail = process.env.ALERT_EMAIL;
  if (alertEmail) {
    const activeProjects = await prisma.intervalsProject.findMany({
      where: { status: "active", estimatedHours: { gt: 0 } },
    });

    for (const project of activeProjects) {
      if (!project.estimatedHours) continue;

      const agg = await prisma.intervalsTimeEntry.aggregate({
        where: { projectId: project.id },
        _sum: { hours: true },
      });

      const loggedHours = agg._sum.hours ?? 0;
      const budgetPercent = Math.round((loggedHours / project.estimatedHours) * 100);
      if (budgetPercent < 80) continue;

      const existing = await prisma.emailSentLog.findFirst({
        where: { projectId: project.id, alertType: "budget_warning", sentAt: { gte: todayStart } },
      });
      if (existing) continue;

      const { subject, html } = buildBudgetAlert({
        projectName: project.name,
        budgetPercent,
        loggedHours,
        estimatedHours: project.estimatedHours,
      });

      try {
        await resend.emails.send({ from: FROM_ADDRESS, to: alertEmail, subject, html });
        await prisma.emailSentLog.create({ data: { projectId: project.id, alertType: "budget_warning" } });
        sent.push(`budget:${project.id}`);
      } catch (err) {
        console.error(`[alerts] budget send failed for projectId=${project.id}:`, err);
        errors.push(`budget:${project.id}`);
      }
    }
  }

  // ── 4. Flagged task alerts (open tasks with no estimate) ──────────────────
  const flaggedTasks = await prisma.intervalsTask.findMany({
    where: {
      status: { not: "closed" },
      estimatedHours: null,
      assigneeId: { not: null },
    },
    include: { project: true, assignee: true },
  });

  for (const task of flaggedTasks) {
    if (!task.assignee?.email) continue;

    const existing = await prisma.emailSentLog.findFirst({
      where: { taskId: task.id, alertType: "flagged_task", sentAt: { gte: todayStart } },
    });
    if (existing) continue;

    const { subject, html } = buildFlaggedTaskAlert({
      assigneeName: task.assignee.name,
      assigneeEmail: task.assignee.email,
      taskTitle: task.title,
      projectName: task.project.name,
    });

    try {
      await resend.emails.send({ from: FROM_ADDRESS, to: task.assignee.email, subject, html });
      await prisma.emailSentLog.create({ data: { taskId: task.id, alertType: "flagged_task" } });
      sent.push(`flagged:${task.id}`);
    } catch (err) {
      console.error(`[alerts] flagged_task send failed for taskId=${task.id}:`, err);
      errors.push(`flagged:${task.id}`);
    }
  }

  return NextResponse.json({ sent, errors });
}
