/**
 * A project is considered stale when no weekly status update has been posted
 * during the current ISO week (Monday–Sunday).
 *
 * @param latestUpdateAt  createdAt of the most recent WeeklyStatusUpdate, or null if none exist
 * @param weekStart       Monday midnight of the current ISO week (local time)
 */
export function isStaleProject(
  latestUpdateAt: Date | null,
  weekStart: Date,
): boolean {
  if (latestUpdateAt === null) return true;
  return latestUpdateAt < weekStart;
}

/** Returns midnight on the Monday that starts the ISO week containing `now`. */
export function currentISOWeekStart(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sun, 1 = Mon … 6 = Sat
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}
