import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const body = await req.json();

  // Verify project exists
  const project = await prisma.intervalsProject.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Clear override
  if (body.clear === true) {
    await prisma.projectStatusOverride.deleteMany({ where: { projectId } });
    return NextResponse.json({ ok: true });
  }

  const { status, reason } = body as { status: string; reason?: string };
  const valid = ["on_track", "at_risk", "blocked"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (status === "blocked" && !reason?.trim()) {
    return NextResponse.json({ error: "Reason required for Blocked status" }, { status: 400 });
  }

  await prisma.projectStatusOverride.upsert({
    where: { projectId },
    update: { status, reason: reason?.trim() ?? null, setById: session.user.id, setAt: new Date() },
    create: { projectId, status, reason: reason?.trim() ?? null, setById: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
