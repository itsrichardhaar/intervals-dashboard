import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/intervals/syncAuth";

export const maxDuration = 10;

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = process.env.INTERVALS_API_TOKEN ?? "";
  const credentials = Buffer.from(`${token}:x`).toString("base64");

  const res = await fetch("https://api.myintervals.com/person/?limit=1&page=1", {
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
    },
  });

  const body = await res.text();

  return NextResponse.json({
    tokenLength: token.length,
    tokenPrefix: token.slice(0, 4),
    intervalsStatus: res.status,
    intervalsBody: body.slice(0, 500),
  });
}
