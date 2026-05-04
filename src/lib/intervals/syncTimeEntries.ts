import { prisma } from "@/lib/prisma";
import { intervalsGet } from "./client";

interface IntervalsTimeEntry {
  id: string;
  taskid: string;
  personid: string;
  projectid: string;
  time: string;
  date: string;
}

interface IntervalsTimeResponse {
  listcount: number;
  time: IntervalsTimeEntry | IntervalsTimeEntry[];
}

async function fetchAllTimeEntries(): Promise<IntervalsTimeEntry[]> {
  const LIMIT = 1000;
  // Cap at 30,000 entries per run to stay within the 60s function timeout
  const MAX_ENTRIES = 30000;

  const first = await intervalsGet<IntervalsTimeResponse>(`/time/?limit=${LIMIT}&offset=0`);
  const total = first.listcount ?? 0;
  const raw = first.time;
  const firstPage: IntervalsTimeEntry[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (total <= LIMIT) return firstPage;

  const totalToFetch = Math.min(total, MAX_ENTRIES);
  const allEntries = [...firstPage];

  for (let offset = LIMIT; offset < totalToFetch; offset += LIMIT) {
    const d = await intervalsGet<IntervalsTimeResponse>(`/time/?limit=${LIMIT}&offset=${offset}`);
    const r = d.time;
    allEntries.push(...(Array.isArray(r) ? r : r ? [r] : []));
  }

  return allEntries;
}

export async function syncTimeEntries(): Promise<{ synced: number; errors: string[] }> {
  const entries = await fetchAllTimeEntries();

  // Pre-fetch FK maps in bulk
  const [tasks, people, projects] = await Promise.all([
    prisma.intervalsTask.findMany({ select: { id: true, intervalsId: true } }),
    prisma.intervalsPerson.findMany({ select: { id: true, intervalsId: true } }),
    prisma.intervalsProject.findMany({ select: { id: true, intervalsId: true } }),
  ]);
  const taskMap = new Map(tasks.map((t) => [t.intervalsId, t.id]));
  const personMap = new Map(people.map((p) => [p.intervalsId, p.id]));
  const projectMap = new Map(projects.map((p) => [p.intervalsId, p.id]));

  let synced = 0;
  const errors: string[] = [];
  const BATCH = 20;

  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (entry) => {
        const taskId = entry.taskid ? (taskMap.get(String(entry.taskid)) ?? null) : null;
        const personId = entry.personid ? (personMap.get(String(entry.personid)) ?? null) : null;
        const projectId = entry.projectid ? (projectMap.get(String(entry.projectid)) ?? null) : null;
        const hours = parseFloat(entry.time) || 0;
        try {
          await prisma.intervalsTimeEntry.upsert({
            where: { intervalsId: String(entry.id) },
            update: { taskId, personId, projectId, hours, date: new Date(entry.date), syncedAt: new Date() },
            create: { intervalsId: String(entry.id), taskId, personId, projectId, hours, date: new Date(entry.date) },
          });
          synced++;
        } catch (err) {
          errors.push(`TimeEntry ${entry.id}: ${String(err)}`);
        }
      })
    );
  }

  // Recompute loggedHours for all tasks from the full DB
  const grouped = await prisma.intervalsTimeEntry.groupBy({
    by: ["taskId"],
    where: { taskId: { not: null } },
    _sum: { hours: true },
  });

  await Promise.all(
    grouped.map(({ taskId, _sum }) =>
      taskId
        ? prisma.intervalsTask.update({ where: { id: taskId }, data: { loggedHours: _sum.hours ?? 0 } })
        : Promise.resolve()
    )
  );

  return { synced, errors };
}
