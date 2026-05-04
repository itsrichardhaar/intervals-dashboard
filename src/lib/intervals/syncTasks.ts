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
  const PAGE_SIZE = 500;
  const first = await intervalsGet<IntervalsTaskResponse>(`/task/?limit=${PAGE_SIZE}&page=1`);
  const total = first.listcount ?? 0;
  const raw = first.task;
  const firstPage = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (total <= PAGE_SIZE) return firstPage;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const remaining: IntervalsTask[][] = [];
  for (let page = 2; page <= totalPages; page++) {
    const d = await intervalsGet<IntervalsTaskResponse>(`/task/?limit=${PAGE_SIZE}&page=${page}`);
    const r = d.task;
    remaining.push(Array.isArray(r) ? r : r ? [r] : []);
  }

  return [firstPage, ...remaining].flat();
}

export async function syncTasks(): Promise<{ synced: number; errors: string[] }> {
  const tasks = await fetchAllTasks();

  const [projects, people] = await Promise.all([
    prisma.intervalsProject.findMany({ select: { id: true, intervalsId: true } }),
    prisma.intervalsPerson.findMany({ select: { id: true, intervalsId: true } }),
  ]);
  const projectMap = new Map(projects.map((p) => [p.intervalsId, p.id]));
  const personMap = new Map(people.map((p) => [p.intervalsId, p.id]));

  let synced = 0;
  const errors: string[] = [];
  const BATCH = 20;

  for (let i = 0; i < tasks.length; i += BATCH) {
    const batch = tasks.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (task) => {
        const projectId = projectMap.get(String(task.projectid));
        if (!projectId) return;
        const assigneeId = task.assigneeid ? (personMap.get(String(task.assigneeid)) ?? null) : null;
        try {
          await prisma.intervalsTask.upsert({
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
          synced++;
        } catch (err) {
          errors.push(`Task ${task.id}: ${String(err)}`);
        }
      })
    );
  }

  return { synced, errors };
}
