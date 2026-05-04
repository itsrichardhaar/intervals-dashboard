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
  // /person/ does not support the `page` parameter — fetch all in one request
  const data = await intervalsGet<IntervalsPersonResponse>(`/person/?limit=1000`);
  const raw = data.person;
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
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
