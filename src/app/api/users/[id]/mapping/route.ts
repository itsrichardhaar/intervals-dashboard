import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: userId } = await params;
  const body = await req.json();
  const { intervalsPersonId } = body as { intervalsPersonId: string | null };

  // Clear mapping
  if (!intervalsPersonId) {
    await prisma.userIntervalsMapping.deleteMany({ where: { userId } });
    return NextResponse.json({ success: true });
  }

  // Verify the person exists
  const person = await prisma.intervalsPerson.findUnique({ where: { id: intervalsPersonId } });
  if (!person) return NextResponse.json({ error: "Intervals person not found." }, { status: 404 });

  // Upsert mapping as manual
  await prisma.userIntervalsMapping.upsert({
    where: { userId },
    update: { intervalsPersonId, matchType: "manual" },
    create: { userId, intervalsPersonId, matchType: "manual" },
  });

  return NextResponse.json({ success: true });
}
