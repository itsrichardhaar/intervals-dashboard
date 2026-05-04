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
  const errors: string[] = [];
  let synced = 0;

  // Only fetch current year to stay within rate limits and timeout
  const year = new Date().getFullYear();
  const data = await intervalsGet<IntervalsTimeResponse>(
    `/time/?limit=1000&datestart=${year}-01-01`
  );
  const raw = data.time;
  const entries = Array.isArray(raw) ? raw : raw ? [raw] : [];

  // Pre-fetch FK maps in bulk — eliminates N+1 queries
  const [tasks, people, projects] = await Promise.all([
    prisma.intervalsTask.findMany({ select: { id: true, intervalsId: true } }),
    prisma.intervalsPerson.findMany({ select: { id: true, intervalsId: true } }),
    prisma.intervalsProject.findMany({ select: { id: true, intervalsId: true } }),
  ]);

  const taskMap = new Map(tasks.map((t) => [t.intervalsId, t.id]));
  const personMap = new Map(people.map((p) => [p.intervalsId, p.id]));
  const projectMap = new Map(projects.map((p) => [p.intervalsId, p.id]));

  // Track logged hours per task to update in bulk at the end
  const loggedHoursMap = new Map<string, number>();

  for (const entry of entries) {
    try {
      const taskId = entry.taskid ? (taskMap.get(String(entry.taskid)) ?? null) : null;
      const personId = entry.personid ? (personMap.get(String(entry.personid)) ?? null) : null;
      const projectId = entry.projectid ? (projectMap.get(String(entry.projectid)) ?? null) : null;
      const hours = parseFloat(entry.time) || 0;

      await prisma.intervalsTimeEntry.upsert({
        where: { intervalsId: String(entry.id) },
        update: { taskId, personId, projectId, hours, date: new Date(entry.date), syncedAt: new Date() },
        create: { intervalsId: String(entry.id), taskId, personId, projectId, hours, date: new Date(entry.date) },
      });

      // Accumulate hours per task
      if (taskId) {
        loggedHoursMap.set(taskId, (loggedHoursMap.get(taskId) ?? 0) + hours);
      }

      synced++;
    } catch (err) {
      errors.push(`TimeEntry ${entry.id}: ${String(err)}`);
    }
  }

  // Bulk update loggedHours on tasks — one query per task that has entries
  const taskUpdates = Array.from(loggedHoursMap.entries()).map(([taskId, hours]) =>
    prisma.intervalsTask.update({ where: { id: taskId }, data: { loggedHours: hours } })
  );
  await Promise.all(taskUpdates);

  return { synced, errors };
}
