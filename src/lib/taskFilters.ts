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

// ─── Date bucket filter ───────────────────────────────────────────────────────

export type DateBucket = "overdue" | "this_week" | "this_month" | "no_due_date";

/** Start of the ISO week containing `now` (Monday midnight). */
function weekStart(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon…
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

/** Exclusive end of the ISO week (next Monday midnight). */
function weekEnd(now: Date): Date {
  const start = weekStart(now);
  return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
}

/** Start of the calendar month containing `now`. */
function monthStart(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Exclusive end of the calendar month (first day of next month). */
function monthEnd(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/**
 * Pure function: filter tasks by a due-date bucket.
 * null means no date filter — all tasks pass through.
 * Tasks are provided with `dueDate` as ISO string | null and `overdue: boolean`.
 */
export function filterTasksByDate<T extends { dueDate: string | null; overdue: boolean }>(
  tasks: T[],
  bucket: DateBucket | null,
  now: Date = new Date(),
): T[] {
  if (bucket === null) return tasks;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  switch (bucket) {
    case "overdue":
      return tasks.filter((t) => t.overdue);

    case "this_week": {
      const wStart = weekStart(now);
      const wEnd   = weekEnd(now);
      return tasks.filter((t) => {
        if (!t.dueDate || t.overdue) return false;
        const d = new Date(t.dueDate);
        d.setHours(0, 0, 0, 0);
        return d >= wStart && d < wEnd;
      });
    }

    case "this_month": {
      const mStart = monthStart(now);
      const mEnd   = monthEnd(now);
      return tasks.filter((t) => {
        if (!t.dueDate || t.overdue) return false;
        const d = new Date(t.dueDate);
        d.setHours(0, 0, 0, 0);
        return d >= mStart && d < mEnd;
      });
    }

    case "no_due_date":
      return tasks.filter((t) => t.dueDate === null);
  }
}
