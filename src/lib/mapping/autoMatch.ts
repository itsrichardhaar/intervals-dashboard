import { prisma } from "@/lib/prisma";

export async function autoMatchUserToIntervals(userId: string, email: string): Promise<boolean> {
  // Skip if already mapped
  const existing = await prisma.userIntervalsMapping.findUnique({ where: { userId } });
  if (existing) return false;

  // Find Intervals person by email
  const person = await prisma.intervalsPerson.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!person) return false;

  // Check the person isn't already claimed by another user
  const alreadyClaimed = await prisma.userIntervalsMapping.findUnique({
    where: { intervalsPersonId: person.id },
  });
  if (alreadyClaimed) return false;

  await prisma.userIntervalsMapping.create({
    data: { userId, intervalsPersonId: person.id, matchType: "auto" },
  });

  return true;
}
