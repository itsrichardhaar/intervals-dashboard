import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

export function verifyCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Fail closed: if the secret is not configured, deny all requests.
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;

  const expected = `Bearer ${secret}`;

  // Use timing-safe comparison to prevent secret leakage via timing attacks.
  try {
    const a = Buffer.from(authHeader);
    const b = Buffer.from(expected);
    // Buffers must be the same length for timingSafeEqual; check length first
    // (length mismatch itself is not secret, so this is safe).
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
