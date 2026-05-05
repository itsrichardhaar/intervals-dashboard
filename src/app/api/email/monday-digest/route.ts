import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/intervals/syncAuth";
import { getResend, FROM_ADDRESS } from "@/lib/email/resend";
import { buildDigestEmail } from "@/lib/email/mondayDigest";
import { calculateBandwidth, normalizeTaskStatus } from "@/lib/calculators/bandwidth";

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day + (day === 0 ? -6 : 1)); // ISO Monday

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const mappings = await prisma.userIntervalsMapping.findMany({
    include: {
      user: true,
      intervalsPerson: true,
    },
  });

  const sent: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const mapping of mappings) {
    const user = mapping.user;
    if (!user.email || !user.name) {
      skipped.push(user.id);
      continue;
    }

    // Skip if we already sent a digest this week
    const existing = await prisma.emailSentLog.findFirst({
      where: {
        userId: user.id,
        alertType: "monday_digest",
        sentAt: { gte: startOfWeek },
      },
    });
    if (existing) {
      skipped.push(user.email);
      continue;
    }

    const tasks = await prisma.intervalsTask.findMany({
      where: { assigneeId: mapping.intervalsPersonId },
      include: { project: true },
    });

    const taskInputs = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      projectName: t.project.name,
      status: normalizeTaskStatus(t.status),
      estimatedHours: t.estimatedHours,
      loggedHours: t.loggedHours,
      dueDate: t.dueDate,
    }));

    const { bandwidthPercent, flaggedTasks } = calculateBandwidth(taskInputs, "weekly");

    const dueThisWeek = tasks
      .filter(
        (t) =>
          t.dueDate &&
          t.dueDate >= startOfWeek &&
          t.dueDate <= endOfWeek &&
          t.status !== "closed"
      )
      .map((t) => ({
        title: t.title,
        projectName: t.project.name,
        dueDate: t.dueDate!,
      }));

    const openActionItemCount = await prisma.actionItem.count({
      where: { assignedToId: user.id, completedAt: null },
    });

    const { subject, html } = buildDigestEmail({
      name: user.name,
      email: user.email,
      bandwidthPercent,
      tasks: dueThisWeek,
      openActionItemCount,
      flaggedTaskCount: flaggedTasks.length,
    });

    try {
      const resend = getResend();
      await resend.emails.send({ from: FROM_ADDRESS, to: user.email, subject, html });
      await prisma.emailSentLog.create({ data: { userId: user.id, alertType: "monday_digest" } });
      sent.push(user.email);
    } catch (err) {
      // Log the full error server-side; return only a safe identifier in the response.
      console.error(`[monday-digest] Failed to send to userId=${user.id}:`, err);
      errors.push(user.id);
    }
  }

  return NextResponse.json({ sent, skipped, errors });
}
