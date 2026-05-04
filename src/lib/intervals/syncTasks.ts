import { prisma } from "@/lib/prisma";
import { intervalsGet } from "./client";

interface IntervalsTask {
  id: string;
  title: string;
  projectid: string;
  assigneeid: string;
  status: string;
  estimatedhours: string;
  duedate: string;
}

interface IntervalsTaskResponse {
  task: IntervalsTask | IntervalsTask[];
}

// Normalize Intervals task status strings to our internal values
function normalizeStatus(status: string): string {
  const s = status.toLowerCase().trim();
  if (s === "open") return "open";
  if (s.includes("in progress") || s === "inprogress") return "in_progress";
  if (s.includes("internal review") || s.includes("internal")) return "in_internal_review";
  if (s.includes("client review") || s.includes("client")) return "in_client_review";
  if (s === "closed" || s === "complete" || s === "completed") return "closed";
  return s.replace(/\s+/g, "_");
}

export async function syncTasks(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  // Fetch all non-closed tasks; also fetch recently closed to keep archive accurate
  const data = await intervalsGet<IntervalsTaskResponse>("/task/?limit=500");
  const raw = data.task;
  const tasks = Array.isArray(raw) ? raw : raw ? [raw] : [];

  for (const task of tasks) {
    try {
      // Resolve project FK
      const project = await prisma.intervalsProject.findUnique({
        where: { intervalsId: String(task.projectid) },
        select: { id: true },
      });
      if (!project) continue;

      // Resolve person FK (optional)
      let assignee = null;
      if (task.assigneeid) {
        assignee = await prisma.intervalsPerson.findUnique({
          where: { intervalsId: String(task.assigneeid) },
          select: { id: true },
        });
      }

      await prisma.intervalsTask.upsert({
        where: { intervalsId: String(task.id) },
        update: {
          title: task.title,
          projectId: project.id,
          assigneeId: assignee?.id ?? null,
          status: normalizeStatus(task.status),
          estimatedHours: task.estimatedhours ? parseFloat(task.estimatedhours) : null,
          dueDate: task.duedate ? new Date(task.duedate) : null,
          syncedAt: new Date(),
        },
        create: {
          intervalsId: String(task.id),
          title: task.title,
          projectId: project.id,
          assigneeId: assignee?.id ?? null,
          status: normalizeStatus(task.status),
          estimatedHours: task.estimatedhours ? parseFloat(task.estimatedhours) : null,
          dueDate: task.duedate ? new Date(task.duedate) : null,
        },
      });
      synced++;
    } catch (err) {
      errors.push(`Task ${task.id}: ${String(err)}`);
    }
  }

  return { synced, errors };
}
