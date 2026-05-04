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

  const data = await intervalsGet<IntervalsTimeResponse>("/time/?limit=1000");
  const raw = data.time;
  const entries = Array.isArray(raw) ? raw : raw ? [raw] : [];

  // Upsert each time entry
  for (const entry of entries) {
    try {
      const task = entry.taskid
        ? await prisma.intervalsTask.findUnique({
            where: { intervalsId: String(entry.taskid) },
            select: { id: true },
          })
        : null;

      const person = entry.personid
        ? await prisma.intervalsPerson.findUnique({
            where: { intervalsId: String(entry.personid) },
            select: { id: true },
          })
        : null;

      const project = entry.projectid
        ? await prisma.intervalsProject.findUnique({
            where: { intervalsId: String(entry.projectid) },
            select: { id: true },
          })
        : null;

      await prisma.intervalsTimeEntry.upsert({
        where: { intervalsId: String(entry.id) },
        update: {
          taskId: task?.id ?? null,
          personId: person?.id ?? null,
          projectId: project?.id ?? null,
          hours: parseFloat(entry.time) || 0,
          date: new Date(entry.date),
          syncedAt: new Date(),
        },
        create: {
          intervalsId: String(entry.id),
          taskId: task?.id ?? null,
          personId: person?.id ?? null,
          projectId: project?.id ?? null,
          hours: parseFloat(entry.time) || 0,
          date: new Date(entry.date),
        },
      });
      synced++;
    } catch (err) {
      errors.push(`TimeEntry ${entry.id}: ${String(err)}`);
    }
  }

  // Update loggedHours on each task by summing its time entries
  if (synced > 0) {
    const tasks = await prisma.intervalsTask.findMany({ select: { id: true } });
    for (const task of tasks) {
      const aggregate = await prisma.intervalsTimeEntry.aggregate({
        where: { taskId: task.id },
        _sum: { hours: true },
      });
      await prisma.intervalsTask.update({
        where: { id: task.id },
        data: { loggedHours: aggregate._sum.hours ?? 0 },
      });
    }
  }

  return { synced, errors };
}
