import { prisma } from "@/lib/prisma";
import { intervalsGet } from "./client";

interface IntervalsTask {
  id: string;
  title: string;
  projectid: string;
  assigneeid: string;
  status: string;
  estimate: string;    // actual field name from API
  datedue: string;     // actual field name from API
}

interface IntervalsTaskResponse {
  listcount: number;
  task: IntervalsTask | IntervalsTask[];
}

function normalizeStatus(status: string): string {
  const s = status.toLowerCase().trim();
  if (s === "open") return "open";
  if (s.includes("in progress") || s === "inprogress") return "in_progress";
  if (s.includes("internal review")) return "in_internal_review";
  if (s.includes("client review")) return "in_client_review";
  if (s === "closed" || s === "complete" || s === "completed") return "closed";
  return s.replace(/\s+/g, "_");
}

async function fetchAllTasks(): Promise<IntervalsTask[]> {
  // /task/ does not support `page` — use a limit large enough for all records
  const data = await intervalsGet<IntervalsTaskResponse>(`/task/?limit=3000`);
  const raw = data.task;
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
}

export async function syncTasks(): Promise<{ synced: number; errors: string[] }> {
  const tasks = await fetchAllTasks();

  const [projects, people] = await Promise.all([
    prisma.intervalsProject.findMany({ select: { id: true, intervalsId: true } }),
    prisma.intervalsPerson.findMany({ select: { id: true, intervalsId: true } }),
  ]);
  const projectMap = new Map(projects.map((p) => [p.intervalsId, p.id]));
  const personMap = new Map(people.map((p) => [p.intervalsId, p.id]));

  // Filter out tasks with no matching project (orphaned in Intervals)
  const validTasks = tasks.filter((t) => projectMap.has(String(t.projectid)));

  // Batch transaction — compatible with PgBouncer transaction mode
  await prisma.$transaction(
    validTasks.map((task) => {
      const projectId = projectMap.get(String(task.projectid))!;
      const assigneeId = task.assigneeid ? (personMap.get(String(task.assigneeid)) ?? null) : null;
      return prisma.intervalsTask.upsert({
        where: { intervalsId: String(task.id) },
        update: {
          title: task.title,
          projectId,
          assigneeId,
          status: normalizeStatus(task.status),
          estimatedHours: task.estimate ? parseFloat(task.estimate) : null,
          dueDate: task.datedue ? new Date(task.datedue) : null,
          syncedAt: new Date(),
        },
        create: {
          intervalsId: String(task.id),
          title: task.title,
          projectId,
          assigneeId,
          status: normalizeStatus(task.status),
          estimatedHours: task.estimate ? parseFloat(task.estimate) : null,
          dueDate: task.datedue ? new Date(task.datedue) : null,
        },
      });
    })
  );

  return { synced: validTasks.length, errors: [] };
}
