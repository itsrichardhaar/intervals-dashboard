import { prisma } from "@/lib/prisma";
import { intervalsGet } from "./client";

interface IntervalsDocument {
  id: string;
  projectid: string;
  title: string;
  url?: string | null;
}

interface IntervalsDocumentResponse {
  listcount: number;
  document: IntervalsDocument | IntervalsDocument[];
}

export async function syncDocuments(): Promise<{ synced: number; errors: string[] }> {
  const data = await intervalsGet<IntervalsDocumentResponse>(`/document/?limit=2000`);
  const raw = data.document;
  const all: IntervalsDocument[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (all.length === 0) return { synced: 0, errors: [] };

  // Pre-fetch project FK map
  const dbProjects = await prisma.intervalsProject.findMany({
    select: { id: true, intervalsId: true },
  });
  const projectMap = new Map(dbProjects.map((p) => [p.intervalsId, p.id]));

  const valid = all.filter((d) => projectMap.has(String(d.projectid)));
  if (valid.length === 0) return { synced: 0, errors: [] };

  const intervalsIds = valid.map((d) => String(d.id));
  const titles       = valid.map((d) => d.title);
  const projectIds   = valid.map((d) => projectMap.get(String(d.projectid))!);
  const urls         = valid.map((d) => d.url ?? null);

  await prisma.$executeRaw`
    INSERT INTO "IntervalsDocument"
      (id, "intervalsId", "projectId", title, url, "syncedAt")
    SELECT
      gen_random_uuid()::text,
      unnest(${intervalsIds}::text[]),
      unnest(${projectIds}::text[]),
      unnest(${titles}::text[]),
      unnest(${urls}::text[]),
      NOW()
    ON CONFLICT ("intervalsId") DO UPDATE SET
      title       = EXCLUDED.title,
      "projectId" = EXCLUDED."projectId",
      url         = EXCLUDED.url,
      "syncedAt"  = EXCLUDED."syncedAt"
  `;

  return { synced: valid.length, errors: [] };
}
