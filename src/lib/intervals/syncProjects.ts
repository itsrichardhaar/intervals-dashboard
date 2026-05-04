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
  // /project/ does not support `page` — use a limit large enough for all records
  const data = await intervalsGet<IntervalsProjectResponse>(`/project/?limit=2000`);
  const raw = data.project;
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
}

export async function syncProjects(): Promise<{ synced: number; errors: string[] }> {
  const all = await fetchAllProjects();

  // Only sync active projects — inactive are archived historical records
  const projects = all.filter((p) => p.active === "t");
  if (projects.length === 0) return { synced: 0, errors: [] };

  // Build typed arrays for a single bulk upsert — one DB round-trip regardless of record count
  const intervalsIds = projects.map((p) => String(p.id));
  const names = projects.map((p) => p.name);
  const clientNames = projects.map((p) => p.client || null);
  const statuses = projects.map((p) => (p.active === "t" ? "active" : "inactive"));
  const budgets = projects.map((p) => (p.budget ? parseFloat(p.budget) : null));
  const startDates = projects.map((p) => (p.datestart ? new Date(p.datestart) : null));
  const dueDates = projects.map((p) => (p.dateend ? new Date(p.dateend) : null));

  await prisma.$executeRaw`
    INSERT INTO "IntervalsProject" (id, "intervalsId", name, "clientName", status, "budgetAmount", "startDate", "dueDate", "syncedAt")
    SELECT
      gen_random_uuid()::text,
      unnest(${intervalsIds}::text[]),
      unnest(${names}::text[]),
      unnest(${clientNames}::text[]),
      unnest(${statuses}::text[]),
      unnest(${budgets}::float8[]),
      unnest(${startDates}::timestamptz[]),
      unnest(${dueDates}::timestamptz[]),
      NOW()
    ON CONFLICT ("intervalsId") DO UPDATE SET
      name         = EXCLUDED.name,
      "clientName" = EXCLUDED."clientName",
      status       = EXCLUDED.status,
      "budgetAmount" = EXCLUDED."budgetAmount",
      "startDate"  = EXCLUDED."startDate",
      "dueDate"    = EXCLUDED."dueDate",
      "syncedAt"   = EXCLUDED."syncedAt"
  `;

  // Mark previously-active projects as inactive if they're no longer active in Intervals
  await prisma.intervalsProject.updateMany({
    where: { intervalsId: { notIn: intervalsIds }, status: "active" },
    data: { status: "inactive" },
  });

  return { synced: projects.length, errors: [] };
}
