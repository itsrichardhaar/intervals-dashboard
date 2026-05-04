import { prisma } from "@/lib/prisma";
import { intervalsGet } from "./client";

interface IntervalsProject {
  id: string;
  name: string;
  client: string;
  active: string; // "t" | "f"
  budget: string;
  datestart: string;
  dateend: string | null;
}

interface IntervalsProjectResponse {
  listcount: number;
  project: IntervalsProject | IntervalsProject[];
}

async function fetchAllProjects(): Promise<IntervalsProject[]> {
  const PAGE_SIZE = 250;
  const first = await intervalsGet<IntervalsProjectResponse>(`/project/?limit=${PAGE_SIZE}&page=1`);
  const total = first.listcount ?? 0;
  const raw = first.project;
  const firstPage = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (total <= PAGE_SIZE) return firstPage;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      intervalsGet<IntervalsProjectResponse>(`/project/?limit=${PAGE_SIZE}&page=${i + 2}`)
        .then((d) => { const r = d.project; return Array.isArray(r) ? r : r ? [r] : []; })
    )
  );

  return [firstPage, ...remaining].flat();
}

export async function syncProjects(): Promise<{ synced: number; errors: string[] }> {
  const projects = await fetchAllProjects();
  let synced = 0;
  const errors: string[] = [];
  const BATCH = 20;

  for (let i = 0; i < projects.length; i += BATCH) {
    const batch = projects.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (project) => {
        try {
          await prisma.intervalsProject.upsert({
            where: { intervalsId: String(project.id) },
            update: {
              name: project.name,
              clientName: project.client || null,
              status: project.active === "t" ? "active" : "inactive",
              budgetAmount: project.budget ? parseFloat(project.budget) : null,
              startDate: project.datestart ? new Date(project.datestart) : null,
              dueDate: project.dateend ? new Date(project.dateend) : null,
              syncedAt: new Date(),
            },
            create: {
              intervalsId: String(project.id),
              name: project.name,
              clientName: project.client || null,
              status: project.active === "t" ? "active" : "inactive",
              budgetAmount: project.budget ? parseFloat(project.budget) : null,
              startDate: project.datestart ? new Date(project.datestart) : null,
              dueDate: project.dateend ? new Date(project.dateend) : null,
            },
          });
          synced++;
        } catch (err) {
          errors.push(`Project ${project.id}: ${String(err)}`);
        }
      })
    );
  }

  return { synced, errors };
}
