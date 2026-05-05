export type WeeklyUpdateStatus = "on_track" | "at_risk" | "blocked";

const VALID_STATUSES: WeeklyUpdateStatus[] = ["on_track", "at_risk", "blocked"];

export function validateWeeklyUpdateInput(data: {
  status: string;
  summary: string;
}): string | null {
  if (!VALID_STATUSES.includes(data.status as WeeklyUpdateStatus)) {
    return "Invalid status";
  }
  if (!data.summary?.trim()) {
    return "Summary is required";
  }
  return null;
}

export function getLatestUpdates<T extends { createdAt: Date }>(
  updates: T[],
  limit: number
): T[] {
  return [...updates]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}
