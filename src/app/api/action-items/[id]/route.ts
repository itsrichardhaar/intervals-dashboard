import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const item = await prisma.actionItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Action item not found." }, { status: 404 });
  }

  const updated = await prisma.actionItem.update({
    where: { id },
    data: { completedAt: new Date() },
  });

  return NextResponse.json({ actionItem: updated });
}
