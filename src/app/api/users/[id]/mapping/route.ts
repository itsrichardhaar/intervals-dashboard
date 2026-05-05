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

  // Validate that the target user exists before operating on them.
  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!targetUser) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // Parse and validate the request body at runtime — do not rely on TS casts.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("intervalsPersonId" in body)) {
    return NextResponse.json({ error: "Missing intervalsPersonId field." }, { status: 400 });
  }

  const raw = (body as Record<string, unknown>).intervalsPersonId;

  // Accept only a non-empty string or explicit null/undefined (clear mapping).
  if (raw !== null && raw !== undefined && (typeof raw !== "string" || raw.trim() === "")) {
    return NextResponse.json({ error: "intervalsPersonId must be a non-empty string or null." }, { status: 400 });
  }

  const intervalsPersonId = (raw === null || raw === undefined) ? null : (raw as string).trim();

  // Clear mapping
  if (!intervalsPersonId) {
    await prisma.userIntervalsMapping.deleteMany({ where: { userId } });
    return NextResponse.json({ success: true });
  }

  // Verify the Intervals person exists.
  const person = await prisma.intervalsPerson.findUnique({ where: { id: intervalsPersonId } });
  if (!person) return NextResponse.json({ error: "Intervals person not found." }, { status: 404 });

  // Upsert mapping as manual.
  await prisma.userIntervalsMapping.upsert({
    where: { userId },
    update: { intervalsPersonId, matchType: "manual" },
    create: { userId, intervalsPersonId, matchType: "manual" },
  });

  return NextResponse.json({ success: true });
}
