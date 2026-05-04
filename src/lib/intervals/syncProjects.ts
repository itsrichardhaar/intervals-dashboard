import { prisma } from "@/lib/prisma";
import { intervalsGet } from "./client";

interface IntervalsProject {
  id: string;
  name: string;
  clientname: string;
  status?: string;
  projectstatus?: string;
  budget: string;
  estimatedhours: string;
  startdate: string;
  duedate: string;
}

interface IntervalsProjectResponse {
  project: IntervalsProject | IntervalsProject[];
}

const CONCURRENCY = 10;

async function runInBatches<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  batchSize = CONCURRENCY
): Promise<string[]> {
  const errors: string[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(
      batch.map((item) => fn(item).catch((err) => errors.push(String(err))))
    );
  }
  return errors;
}

export async function syncProjects(): Promise<{ synced: number; errors: string[] }> {
  const data = await intervalsGet<IntervalsProjectResponse>("/project/?limit=250");
  const raw = data.project;
  const projects = Array.isArray(raw) ? raw : raw ? [raw] : [];

  let synced = 0;
  const errors = await runInBatches(projects, async (project) => {
    await prisma.intervalsProject.upsert({
      where: { intervalsId: String(project.id) },
      update: {
        name: project.name,
        clientName: project.clientname || null,
        status: project.status ?? project.projectstatus ?? "active",
        estimatedHours: project.estimatedhours ? parseFloat(project.estimatedhours) : null,
        budgetAmount: project.budget ? parseFloat(project.budget) : null,
        startDate: project.startdate ? new Date(project.startdate) : null,
        dueDate: project.duedate ? new Date(project.duedate) : null,
        syncedAt: new Date(),
      },
      create: {
        intervalsId: String(project.id),
        name: project.name,
        clientName: project.clientname || null,
        status: project.status ?? project.projectstatus ?? "active",
        estimatedHours: project.estimatedhours ? parseFloat(project.estimatedhours) : null,
        budgetAmount: project.budget ? parseFloat(project.budget) : null,
        startDate: project.startdate ? new Date(project.startdate) : null,
        dueDate: project.duedate ? new Date(project.duedate) : null,
      },
    });
    synced++;
  });

  return { synced, errors };
}
