import { prisma } from "@/lib/prisma";
import { intervalsGet } from "./client";

interface IntervalsPerson {
  id: string;
  firstname: string;
  lastname: string;
  active: string; // "t" | "f"
}

interface IntervalsPersonResponse {
  listcount: number;
  person: IntervalsPerson | IntervalsPerson[];
}

async function fetchAllPeople(): Promise<IntervalsPerson[]> {
  const PAGE_SIZE = 250;
  const first = await intervalsGet<IntervalsPersonResponse>(`/person/?limit=${PAGE_SIZE}&page=1`);
  const total = first.listcount ?? 0;
  const raw = first.person;
  const firstPage = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (total <= PAGE_SIZE) return firstPage;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      intervalsGet<IntervalsPersonResponse>(`/person/?limit=${PAGE_SIZE}&page=${i + 2}`)
        .then((d) => { const r = d.person; return Array.isArray(r) ? r : r ? [r] : []; })
    )
  );

  return [firstPage, ...remaining].flat();
}

export async function syncPeople(): Promise<{ synced: number; errors: string[] }> {
  const people = await fetchAllPeople();
  let synced = 0;
  const errors: string[] = [];

  // Only sync active people — inactive are historical contractors/clients
  const active = people.filter((p) => p.active === "t");

  await Promise.all(
    active.map(async (person) => {
      try {
        await prisma.intervalsPerson.upsert({
          where: { intervalsId: String(person.id) },
          update: {
            name: `${person.firstname} ${person.lastname}`.trim(),
            active: true,
            syncedAt: new Date(),
          },
          create: {
            intervalsId: String(person.id),
            name: `${person.firstname} ${person.lastname}`.trim(),
            active: true,
          },
        });
        synced++;
      } catch (err) {
        errors.push(`Person ${person.id}: ${String(err)}`);
      }
    })
  );

  // Mark previously active people as inactive if they're no longer in the active list
  const activeIds = active.map((p) => String(p.id));
  await prisma.intervalsPerson.updateMany({
    where: { intervalsId: { notIn: activeIds }, active: true },
    data: { active: false },
  });

  return { synced, errors };
}
