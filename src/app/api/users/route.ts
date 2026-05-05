import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      intervalsMapping: {
        select: {
          matchType: true,
          intervalsPerson: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const rawName = typeof body?.name === "string" ? body.name.trim() : "";
  const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!rawName || !rawEmail) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  // Basic server-side email format check (reject obvious non-emails that bypass browser validation).
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(rawEmail)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const name = rawName;
  const email = rawEmail;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  const tempPassword = generateTempPassword();
  const hashed = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: { name, email, password: hashed },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return NextResponse.json({ user, tempPassword }, { status: 201 });
}
