import { prisma } from "@/lib/prisma";
import { intervalsGet } from "./client";

interface IntervalsPerson {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  active: string; // "t" | "f"
}

interface IntervalsPersonResponse {
  person: IntervalsPerson | IntervalsPerson[];
}

export async function syncPeople(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  const data = await intervalsGet<IntervalsPersonResponse>("/person/");
  const raw = data.person;
  const people = Array.isArray(raw) ? raw : raw ? [raw] : [];

  for (const person of people) {
    try {
      await prisma.intervalsPerson.upsert({
        where: { intervalsId: String(person.id) },
        update: {
          name: `${person.firstname} ${person.lastname}`.trim(),
          email: person.email || null,
          active: person.active === "t",
          syncedAt: new Date(),
        },
        create: {
          intervalsId: String(person.id),
          name: `${person.firstname} ${person.lastname}`.trim(),
          email: person.email || null,
          active: person.active === "t",
        },
      });
      synced++;
    } catch (err) {
      errors.push(`Person ${person.id}: ${String(err)}`);
    }
  }

  return { synced, errors };
}
