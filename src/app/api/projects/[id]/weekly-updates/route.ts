import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateWeeklyUpdateInput } from "@/lib/weeklyStatusUpdates";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const project = await prisma.intervalsProject.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { status, summary } = body as { status: string; summary: string };

  const validationError = validateWeeklyUpdateInput({ status, summary });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const update = await prisma.weeklyStatusUpdate.create({
    data: {
      projectId,
      status,
      summary: summary.trim(),
      authorId: session.user.id,
    },
    include: { author: { select: { name: true } } },
  });

  return NextResponse.json({ update }, { status: 201 });
}
