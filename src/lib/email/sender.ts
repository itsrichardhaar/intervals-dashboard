import { prisma } from "@/lib/prisma";
import { getResend, FROM_ADDRESS } from "./resend";
import { buildOverdueAlert, buildDueTomorrowAlert } from "./taskAlerts";
import { buildBudgetAlert, buildFlaggedTaskAlert } from "./projectAlerts";
import { buildDigestEmail } from "./mondayDigest";
import { calculateBandwidth, normalizeTaskStatus } from "@/lib/calculators/bandwidth";

export type SendResult = "sent" | "skipped" | "error";

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function currentWeekStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); // ISO Monday
  return d;
}

function currentWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(weekStart.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ── Task alerts ───────────────────────────────────────────────────────────────

export async function sendOverdueAlert(taskId: string): Promise<SendResult> {
  const existing = await prisma.emailSentLog.findFirst({
    where: { taskId, alertType: "overdue", sentAt: { gte: todayStart() } },
  });
  if (existing) return "skipped";

  const task = await prisma.intervalsTask.findUnique({
    where: { id: taskId },
    include: { project: true, assignee: true },
  });
  if (!task?.assignee?.email || !task.dueDate) return "skipped";

  const { subject, html } = buildOverdueAlert({
    assigneeName: task.assignee.name,
    assigneeEmail: task.assignee.email,
    task: { title: task.title, projectName: task.project.name, dueDate: task.dueDate },
  });

  try {
    await getResend().emails.send({ from: FROM_ADDRESS, to: task.assignee.email, subject, html });
    await prisma.emailSentLog.create({ data: { taskId, alertType: "overdue" } });
    return "sent";
  } catch (err) {
    console.error("[email] sendOverdueAlert failed for taskId=%s:", taskId, err);
    return "error";
  }
}

export async function sendDueTomorrowAlert(taskId: string): Promise<SendResult> {
  const existing = await prisma.emailSentLog.findFirst({
    where: { taskId, alertType: "due_tomorrow", sentAt: { gte: todayStart() } },
  });
  if (existing) return "skipped";

  const task = await prisma.intervalsTask.findUnique({
    where: { id: taskId },
    include: { project: true, assignee: true },
  });
  if (!task?.assignee?.email || !task.dueDate) return "skipped";

  const { subject, html } = buildDueTomorrowAlert({
    assigneeName: task.assignee.name,
    assigneeEmail: task.assignee.email,
    task: { title: task.title, projectName: task.project.name, dueDate: task.dueDate },
  });

  try {
    await getResend().emails.send({ from: FROM_ADDRESS, to: task.assignee.email, subject, html });
    await prisma.emailSentLog.create({ data: { taskId, alertType: "due_tomorrow" } });
    return "sent";
  } catch (err) {
    console.error("[email] sendDueTomorrowAlert failed for taskId=%s:", taskId, err);
    return "error";
  }
}

export async function sendFlaggedTaskAlert(taskId: string): Promise<SendResult> {
  const existing = await prisma.emailSentLog.findFirst({
    where: { taskId, alertType: "flagged_task", sentAt: { gte: todayStart() } },
  });
  if (existing) return "skipped";

  const task = await prisma.intervalsTask.findUnique({
    where: { id: taskId },
    include: { project: true, assignee: true },
  });
  if (!task?.assignee?.email) return "skipped";

  const { subject, html } = buildFlaggedTaskAlert({
    assigneeName: task.assignee.name,
    assigneeEmail: task.assignee.email,
    taskTitle: task.title,
    projectName: task.project.name,
  });

  try {
    await getResend().emails.send({ from: FROM_ADDRESS, to: task.assignee.email, subject, html });
    await prisma.emailSentLog.create({ data: { taskId, alertType: "flagged_task" } });
    return "sent";
  } catch (err) {
    console.error("[email] sendFlaggedTaskAlert failed for taskId=%s:", taskId, err);
    return "error";
  }
}

// ── Project alerts ────────────────────────────────────────────────────────────

export async function sendBudgetAlert(projectId: string): Promise<SendResult> {
  const alertEmail = process.env.ALERT_EMAIL;
  if (!alertEmail) return "skipped";

  const existing = await prisma.emailSentLog.findFirst({
    where: { projectId, alertType: "budget_warning", sentAt: { gte: todayStart() } },
  });
  if (existing) return "skipped";

  const project = await prisma.intervalsProject.findUnique({
    where: { id: projectId },
    include: { tasks: { select: { loggedHours: true } } },
  });
  if (!project?.estimatedHours) return "skipped";

  const loggedHours = project.tasks.reduce((s, t) => s + t.loggedHours, 0);
  const budgetPercent = Math.round((loggedHours / project.estimatedHours) * 100);
  if (budgetPercent < 80) return "skipped";

  const { subject, html } = buildBudgetAlert({
    projectName: project.name,
    budgetPercent,
    loggedHours,
    estimatedHours: project.estimatedHours,
  });

  try {
    await getResend().emails.send({ from: FROM_ADDRESS, to: alertEmail, subject, html });
    await prisma.emailSentLog.create({ data: { projectId, alertType: "budget_warning" } });
    return "sent";
  } catch (err) {
    console.error("[email] sendBudgetAlert failed for projectId=%s:", projectId, err);
    return "error";
  }
}

// ── Digest ────────────────────────────────────────────────────────────────────

export async function sendMondayDigest(userId: string): Promise<SendResult> {
  const weekStart = currentWeekStart();
  const weekEnd = currentWeekEnd(weekStart);

  const existing = await prisma.emailSentLog.findFirst({
    where: { userId, alertType: "monday_digest", sentAt: { gte: weekStart } },
  });
  if (existing) return "skipped";

  const mapping = await prisma.userIntervalsMapping.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!mapping?.user.email || !mapping.user.name) return "skipped";

  const { user } = mapping;

  const tasks = await prisma.intervalsTask.findMany({
    where: { assigneeId: mapping.intervalsPersonId },
    include: { project: { select: { name: true } } },
  });

  const { bandwidthPercent, flaggedTasks } = calculateBandwidth(
    tasks.map((t) => ({
      id: t.id,
      title: t.title,
      projectName: t.project.name,
      status: normalizeTaskStatus(t.status),
      estimatedHours: t.estimatedHours,
      loggedHours: t.loggedHours,
      dueDate: t.dueDate,
    })),
    "weekly"
  );

  const dueThisWeek = tasks
    .filter((t) => t.dueDate && t.dueDate >= weekStart && t.dueDate <= weekEnd && t.status !== "closed")
    .map((t) => ({ title: t.title, projectName: t.project.name, dueDate: t.dueDate! }));

  const openActionItemCount = await prisma.actionItem.count({
    where: { assignedToId: userId, completedAt: null },
  });

  const { subject, html } = buildDigestEmail({
    name: user.name!,
    email: user.email,
    bandwidthPercent,
    tasks: dueThisWeek,
    openActionItemCount,
    flaggedTaskCount: flaggedTasks.length,
  });

  try {
    await getResend().emails.send({ from: FROM_ADDRESS, to: user.email, subject, html });
    await prisma.emailSentLog.create({ data: { userId, alertType: "monday_digest" } });
    return "sent";
  } catch (err) {
    console.error("[email] sendMondayDigest failed for userId=%s:", userId, err);
    return "error";
  }
}
