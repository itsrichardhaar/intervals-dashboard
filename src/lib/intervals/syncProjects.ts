import { prisma } from "@/lib/prisma";
import { intervalsGet } from "./client";

interface IntervalsProject {
  id: string;
  name: string;
  clientname: string;
  status: string;
  budget: string;
  estimatedhours: string;
  startdate: string;
  duedate: string;
}

interface IntervalsProjectResponse {
  project: IntervalsProject | IntervalsProject[];
}

export async function syncProjects(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  const data = await intervalsGet<IntervalsProjectResponse>("/project/?limit=250");
  const raw = data.project;
  const projects = Array.isArray(raw) ? raw : raw ? [raw] : [];

  for (const project of projects) {
    try {
      await prisma.intervalsProject.upsert({
        where: { intervalsId: String(project.id) },
        update: {
          name: project.name,
          clientName: project.clientname || null,
          status: project.status,
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
          status: project.status,
          estimatedHours: project.estimatedhours ? parseFloat(project.estimatedhours) : null,
          budgetAmount: project.budget ? parseFloat(project.budget) : null,
          startDate: project.startdate ? new Date(project.startdate) : null,
          dueDate: project.duedate ? new Date(project.duedate) : null,
        },
      });
      synced++;
    } catch (err) {
      errors.push(`Project ${project.id}: ${String(err)}`);
    }
  }

  return { synced, errors };
}
