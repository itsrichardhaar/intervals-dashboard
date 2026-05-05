import { prisma } from "@/lib/prisma";
import { intervalsGet } from "./client";

interface IntervalsMilestone {
  id: string;
  projectid: string;
  title: string;
  duedate: string | null;
  completed: string; // "t" | "f"
}

interface IntervalsMilestoneResponse {
  listcount: number;
  milestone: IntervalsMilestone | IntervalsMilestone[];
}

export async function syncMilestones(): Promise<{ synced: number; errors: string[] }> {
  const data = await intervalsGet<IntervalsMilestoneResponse>(`/milestone/?limit=2000`);
  const raw = data.milestone;
  const all: IntervalsMilestone[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (all.length === 0) return { synced: 0, errors: [] };

  // Pre-fetch project FK map (Intervals ID → internal UUID)
  const dbProjects = await prisma.intervalsProject.findMany({
    select: { id: true, intervalsId: true },
  });
  const projectMap = new Map(dbProjects.map((p) => [p.intervalsId, p.id]));

  const valid = all.filter((m) => projectMap.has(String(m.projectid)));
  if (valid.length === 0) return { synced: 0, errors: [] };

  const intervalsIds = valid.map((m) => String(m.id));
  const titles       = valid.map((m) => m.title);
  const projectIds   = valid.map((m) => projectMap.get(String(m.projectid))!);
  const dueDates     = valid.map((m) => (m.duedate ? new Date(m.duedate) : null));
  const completeds   = valid.map((m) => m.completed === "t");

  await prisma.$executeRaw`
    INSERT INTO "IntervalsMilestone"
      (id, "intervalsId", "projectId", title, "dueDate", completed, "syncedAt")
    SELECT
      gen_random_uuid()::text,
      unnest(${intervalsIds}::text[]),
      unnest(${projectIds}::text[]),
      unnest(${titles}::text[]),
      unnest(${dueDates}::timestamptz[]),
      unnest(${completeds}::bool[]),
      NOW()
    ON CONFLICT ("intervalsId") DO UPDATE SET
      title       = EXCLUDED.title,
      "projectId" = EXCLUDED."projectId",
      "dueDate"   = EXCLUDED."dueDate",
      completed   = EXCLUDED.completed,
      "syncedAt"  = EXCLUDED."syncedAt"
  `;

  return { synced: valid.length, errors: [] };
}
