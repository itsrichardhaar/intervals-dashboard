import type { TimeWindow } from "./calculators/bandwidth";

/** ISO Monday-based week start at local midnight. */
export function startOfCurrentWeek(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  now.setDate(now.getDate() + diff);
  return now;
}

/** ISO Monday-based week end (Sunday at 23:59:59.999 local). */
export function endOfCurrentWeek(): Date {
  const start = startOfCurrentWeek();
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** Returns true when date falls within the current ISO (Monday–Sunday) week. */
export function isThisWeek(date: Date | null): boolean {
  if (!date) return false;
  return date >= startOfCurrentWeek() && date <= endOfCurrentWeek();
}

/** Midnight today (local). Used for email dedup windows. */
export function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Safe parse of the `window` query param; defaults to "weekly". */
export function parseTimeWindow(raw: string | undefined): TimeWindow {
  if (raw === "weekly" || raw === "monthly" || raw === "total") return raw;
  return "weekly";
}
