import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateActionItemInput } from "@/lib/actionItems";

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
  const { description, assigneeId, dueDate } = body as {
    description: string;
    assigneeId: string;
    dueDate?: string;
  };

  const validationError = validateActionItemInput({ description, assigneeId });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
  if (!assignee) return NextResponse.json({ error: "Assignee not found" }, { status: 400 });

  const item = await prisma.actionItem.create({
    data: {
      description: description.trim(),
      projectId,
      assigneeId,
      createdById: session.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: { assignee: { select: { name: true } } },
  });

  return NextResponse.json({ item }, { status: 201 });
}
