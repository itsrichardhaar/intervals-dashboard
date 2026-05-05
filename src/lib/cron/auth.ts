import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Verifies that an incoming request carries the correct cron bearer token.
 * Fails closed: returns false when CRON_SECRET is not configured.
 * Uses timing-safe comparison to prevent secret leakage via timing attacks.
 */
export function verifyCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;

  const expected = `Bearer ${secret}`;

  try {
    const a = Buffer.from(authHeader);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
