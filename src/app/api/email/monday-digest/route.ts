import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/intervals/syncAuth";
import { sendMondayDigest } from "@/lib/email/sender";

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mappings = await prisma.userIntervalsMapping.findMany({
    select: { userId: true },
  });

  const sent: string[] = [];
  const errors: string[] = [];

  for (const { userId } of mappings) {
    const r = await sendMondayDigest(userId);
    if (r === "sent") sent.push(userId);
    else if (r === "error") errors.push(userId);
  }

  return NextResponse.json({ sent, errors });
}
