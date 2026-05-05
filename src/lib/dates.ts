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

/** First day of the current calendar quarter at local midnight. */
export function startOfCurrentQuarter(): Date {
  const now = new Date();
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), quarterStartMonth, 1);
}

/** Last moment of the current calendar quarter (23:59:59.999 local). */
export function endOfCurrentQuarter(): Date {
  const now = new Date();
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const d = new Date(now.getFullYear(), quarterStartMonth + 3, 0); // day 0 of next month = last day of quarter
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Midnight today (local). Used for email dedup windows. */
export function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Safe parse of the `window` query param; defaults to "weekly". */
export function parseTimeWindow(raw: string | undefined): TimeWindow {
  if (raw === "weekly" || raw === "monthly" || raw === "quarterly") return raw;
  return "weekly";
}
