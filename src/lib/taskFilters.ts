import type { TaskStatus } from "@/lib/calculators/bandwidth";

export type { TaskStatus };

export const ALL_STATUSES: TaskStatus[] = [
  "open",
  "in_progress",
  "in_internal_review",
  "in_client_review",
  "closed",
];

export interface TaskFilterSpec {
  statuses: TaskStatus[];
}

/** Default: all active statuses checked, Closed unchecked */
export const DEFAULT_TASK_FILTER: TaskFilterSpec = {
  statuses: ["open", "in_progress", "in_internal_review", "in_client_review"],
};

/**
 * Pure function: filter tasks by status.
 * Returns only tasks whose normalizedStatus is in filter.statuses.
 * An empty statuses array returns an empty list.
 */
export function filterTasks<T extends { normalizedStatus: TaskStatus }>(
  tasks: T[],
  filter: TaskFilterSpec,
): T[] {
  const allowed = new Set(filter.statuses);
  if (allowed.size === 0) return [];
  return tasks.filter((t) => allowed.has(t.normalizedStatus));
}
