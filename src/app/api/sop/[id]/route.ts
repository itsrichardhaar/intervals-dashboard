import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft:     ["published", "archived"],
  published: ["draft", "archived"],
  archived:  ["draft"],
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sop = await prisma.sop.findUnique({
    where: { id },
    include: {
      category:  { select: { id: true, name: true } },
      author:    { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!sop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(sop);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, purpose, scope, body: content, categoryName, status } = body;

  const existing = await prisma.sop.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (status && status !== existing.status) {
    const allowed = VALID_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${existing.status} to ${status}` },
        { status: 400 }
      );
    }
  }

  let categoryId = existing.categoryId;
  if (categoryName !== undefined) {
    if (!categoryName?.trim()) {
      categoryId = null;
    } else {
      const category = await prisma.sopCategory.upsert({
        where:  { name: categoryName.trim() },
        update: {},
        create: { name: categoryName.trim() },
      });
      categoryId = category.id;
    }
  }

  const sop = await prisma.sop.update({
    where: { id },
    data: {
      ...(title !== undefined    && { title: title.trim() }),
      ...(purpose !== undefined  && { purpose: purpose?.trim() || null }),
      ...(scope !== undefined    && { scope: scope?.trim() || null }),
      ...(content !== undefined  && { body: content }),
      ...(status !== undefined   && { status }),
      categoryId,
      updatedById: session.user.id,
    },
    include: {
      category:  { select: { id: true, name: true } },
      author:    { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(sop);
}
