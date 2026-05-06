import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_THEMES = ["mid", "dark", "light"];

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { theme, brightness, hue, intensity } = body as Record<string, unknown>;

  if (!VALID_THEMES.includes(theme as string)) {
    return NextResponse.json({ error: "theme must be one of: mid, dark, light" }, { status: 400 });
  }
  if (typeof brightness !== "number" || brightness < 50 || brightness > 150) {
    return NextResponse.json({ error: "brightness must be a number between 50 and 150" }, { status: 400 });
  }
  if (typeof hue !== "number" || hue < 0 || hue > 359) {
    return NextResponse.json({ error: "hue must be a number between 0 and 359" }, { status: 400 });
  }
  if (typeof intensity !== "number" || intensity < 0 || intensity > 100) {
    return NextResponse.json({ error: "intensity must be a number between 0 and 100" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      preferences: {
        theme: theme as string,
        brightness: brightness as number,
        hue: hue as number,
        intensity: intensity as number,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
