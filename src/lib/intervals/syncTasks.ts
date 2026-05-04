import { prisma } from "@/lib/prisma";
import { intervalsGet } from "./client";

interface IntervalsTask {
  id: string;
  title: string;
  projectid: string;
  assigneeid: string;
  status: string;
  estimate: string;    // actual field name from API
  datedue: string;     // actual field name from API
}

interface IntervalsTaskResponse {
  listcount: number;
  task: IntervalsTask | IntervalsTask[];
}

function normalizeStatus(status: string): string {
  const s = status.toLowerCase().trim();
  if (s === "open") return "open";
  if (s.includes("in progress") || s === "inprogress") return "in_progress";
  if (s.includes("internal review")) return "in_internal_review";
  if (s.includes("client review")) return "in_client_review";
  if (s === "closed" || s === "complete" || s === "completed") return "closed";
  return s.replace(/\s+/g, "_");
}

async function fetchAllTasks(): Promise<IntervalsTask[]> {
  // /task/ does not support `page` — use a limit large enough for all records
  const data = await intervalsGet<IntervalsTaskResponse>(`/task/?limit=3000`);
  const raw = data.task;
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
}

export async function syncTasks(): Promise<{ synced: number; errors: string[] }> {
  const tasks = await fetchAllTasks();

  const [projects, people] = await Promise.all([
    prisma.intervalsProject.findMany({ select: { id: true, intervalsId: true } }),
    prisma.intervalsPerson.findMany({ select: { id: true, intervalsId: true } }),
  ]);
  const projectMap = new Map(projects.map((p) => [p.intervalsId, p.id]));
  const personMap = new Map(people.map((p) => [p.intervalsId, p.id]));

  // Only sync tasks belonging to projects we have in our DB
  const validTasks = tasks.filter((t) => projectMap.has(String(t.projectid)));
  if (validTasks.length === 0) return { synced: 0, errors: [] };

  // Build typed arrays for a single bulk upsert — one DB round-trip regardless of record count
  const intervalsIds = validTasks.map((t) => String(t.id));
  const titles = validTasks.map((t) => t.title);
  const projectIds = validTasks.map((t) => projectMap.get(String(t.projectid))!);
  const assigneeIds = validTasks.map((t) =>
    t.assigneeid ? (personMap.get(String(t.assigneeid)) ?? null) : null
  );
  const statuses = validTasks.map((t) => normalizeStatus(t.status));
  const estimatedHours = validTasks.map((t) =>
    t.estimate ? parseFloat(t.estimate) : null
  );
  const dueDates = validTasks.map((t) =>
    t.datedue ? new Date(t.datedue) : null
  );

  await prisma.$executeRaw`
    INSERT INTO "IntervalsTask" (id, "intervalsId", title, "projectId", "assigneeId", status, "estimatedHours", "dueDate", "loggedHours", "syncedAt")
    SELECT
      gen_random_uuid()::text,
      unnest(${intervalsIds}::text[]),
      unnest(${titles}::text[]),
      unnest(${projectIds}::text[]),
      unnest(${assigneeIds}::text[]),
      unnest(${statuses}::text[]),
      unnest(${estimatedHours}::float8[]),
      unnest(${dueDates}::timestamptz[]),
      0,
      NOW()
    ON CONFLICT ("intervalsId") DO UPDATE SET
      title            = EXCLUDED.title,
      "projectId"      = EXCLUDED."projectId",
      "assigneeId"     = EXCLUDED."assigneeId",
      status           = EXCLUDED.status,
      "estimatedHours" = EXCLUDED."estimatedHours",
      "dueDate"        = EXCLUDED."dueDate",
      "syncedAt"       = EXCLUDED."syncedAt"
  `;

  return { synced: validTasks.length, errors: [] };
}
