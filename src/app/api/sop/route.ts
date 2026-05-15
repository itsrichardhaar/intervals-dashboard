import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "published";

  const sops = await prisma.sop.findMany({
    where: { status },
    orderBy: { updatedAt: "desc" },
    include: {
      category:  { select: { id: true, name: true } },
      author:    { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(sops);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, purpose, scope, body: content, categoryName } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  let categoryId: string | undefined;
  if (categoryName?.trim()) {
    const category = await prisma.sopCategory.upsert({
      where:  { name: categoryName.trim() },
      update: {},
      create: { name: categoryName.trim() },
    });
    categoryId = category.id;
  }

  const sop = await prisma.sop.create({
    data: {
      title:      title.trim(),
      purpose:    purpose?.trim() || null,
      scope:      scope?.trim() || null,
      body:       content ?? null,
      status:     "draft",
      categoryId: categoryId ?? null,
      authorId:   session.user.id,
      updatedById: session.user.id,
    },
  });

  return NextResponse.json(sop, { status: 201 });
}
