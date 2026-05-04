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

  const data = await intervalsGet<IntervalsTaskResponse>("/task/?limit=500");
  const raw = data.task;
  const tasks = Array.isArray(raw) ? raw : raw ? [raw] : [];

  // Pre-fetch FK maps in bulk — eliminates N+1 queries
  const [projects, people] = await Promise.all([
    prisma.intervalsProject.findMany({ select: { id: true, intervalsId: true } }),
    prisma.intervalsPerson.findMany({ select: { id: true, intervalsId: true } }),
  ]);

  const projectMap = new Map(projects.map((p) => [p.intervalsId, p.id]));
  const personMap = new Map(people.map((p) => [p.intervalsId, p.id]));

  for (const task of tasks) {
    try {
      const projectId = projectMap.get(String(task.projectid));
      if (!projectId) continue;

      const assigneeId = task.assigneeid ? (personMap.get(String(task.assigneeid)) ?? null) : null;

      await prisma.intervalsTask.upsert({
        where: { intervalsId: String(task.id) },
        update: {
          title: task.title,
          projectId,
          assigneeId,
          status: normalizeStatus(task.status),
          estimatedHours: task.estimatedhours ? parseFloat(task.estimatedhours) : null,
          dueDate: task.duedate ? new Date(task.duedate) : null,
          syncedAt: new Date(),
        },
        create: {
          intervalsId: String(task.id),
          title: task.title,
          projectId,
          assigneeId,
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
