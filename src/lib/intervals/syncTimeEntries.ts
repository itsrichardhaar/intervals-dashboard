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
  // Use larger pages to reduce API round-trips (fewer calls = faster)
  const LIMIT = 2000;
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

  const records = entries.map((entry) => ({
    intervalsId: String(entry.id),
    taskId: entry.taskid ? (taskMap.get(String(entry.taskid)) ?? null) : null,
    personId: entry.personid ? (personMap.get(String(entry.personid)) ?? null) : null,
    projectId: entry.projectid ? (projectMap.get(String(entry.projectid)) ?? null) : null,
    hours: parseFloat(entry.time) || 0,
    date: new Date(entry.date),
  }));

  // Bulk insert — skip records already in DB (idempotent on intervalsId)
  const result = await prisma.intervalsTimeEntry.createMany({
    data: records,
    skipDuplicates: true,
  });

  // Recompute loggedHours from the full DB using a single bulk SQL update
  const grouped = await prisma.intervalsTimeEntry.groupBy({
    by: ["taskId"],
    where: { taskId: { not: null } },
    _sum: { hours: true },
  });

  if (grouped.length > 0) {
    const taskIds = grouped.map((g) => g.taskId!);
    const hours = grouped.map((g) => g._sum.hours ?? 0);

    await prisma.$executeRaw`
      UPDATE "IntervalsTask" AS t
      SET "loggedHours" = v.hours
      FROM (
        SELECT unnest(${taskIds}::text[]) AS id, unnest(${hours}::float8[]) AS hours
      ) v
      WHERE t.id = v.id
    `;
  }

  return { synced: result.count, errors: [] };
}
