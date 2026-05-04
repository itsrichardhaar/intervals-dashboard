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
  time: IntervalsTimeEntry | IntervalsTimeEntry[];
}

export async function syncTimeEntries(): Promise<{ synced: number; errors: string[] }> {
  const year = new Date().getFullYear();
  const data = await intervalsGet<IntervalsTimeResponse>(
    `/time/?limit=1000&datestart=${year}-01-01`
  );
  const raw = data.time;
  const entries = Array.isArray(raw) ? raw : raw ? [raw] : [];

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
  const loggedHoursMap = new Map<string, number>();
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
          if (taskId) loggedHoursMap.set(taskId, (loggedHoursMap.get(taskId) ?? 0) + hours);
          synced++;
        } catch (err) {
          errors.push(`TimeEntry ${entry.id}: ${String(err)}`);
        }
      })
    );
  }

  // Bulk update loggedHours on tasks concurrently
  await Promise.all(
    Array.from(loggedHoursMap.entries()).map(([taskId, hours]) =>
      prisma.intervalsTask.update({ where: { id: taskId }, data: { loggedHours: hours } })
    )
  );

  return { synced, errors };
}
