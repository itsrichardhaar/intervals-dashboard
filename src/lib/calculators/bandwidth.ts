export type TaskStatus =
  | "open"
  | "in_progress"
  | "in_internal_review"
  | "in_client_review"
  | "closed";

export type TimeWindow = "weekly" | "monthly" | "total";

export interface TaskInput {
  id: string;
  title: string;
  projectName: string;
  status: TaskStatus;
  estimatedHours: number | null;
  loggedHours: number;
  dueDate: Date | null;
}

export interface BandwidthResult {
  bandwidthPercent: number;
  availableBandwidthPercent: number;
  remainingHours: number;
  flaggedTasks: TaskInput[];
}

import { startOfCurrentWeek, endOfCurrentWeek } from "@/lib/dates";

export const QUALIFYING_STATUSES: TaskStatus[] = [
  "open",
  "in_progress",
  "in_internal_review",
  "in_client_review",
];

const STATUS_NORMALIZATION_MAP: Record<string, TaskStatus> = {
  open: "open",
  "in progress": "in_progress",
  in_progress: "in_progress",
  "in internal review": "in_internal_review",
  in_internal_review: "in_internal_review",
  "in client review": "in_client_review",
  in_client_review: "in_client_review",
  closed: "closed",
};

export function normalizeTaskStatus(raw: string): TaskStatus {
  return STATUS_NORMALIZATION_MAP[raw.toLowerCase()] ?? "open";
}

/** Day-level precision: a task due today is not overdue until tomorrow. */
export function isOverdue(date: Date | null): boolean {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

const WORK_WEEK_HOURS = 40;

function isInTimeWindow(dueDate: Date | null, window: TimeWindow): boolean {
  if (window === "total") return true;
  if (!dueDate) return false;

  if (window === "weekly") {
    return dueDate >= startOfCurrentWeek() && dueDate <= endOfCurrentWeek();
  }

  if (window === "monthly") {
    const now = new Date();
    return (
      dueDate.getFullYear() === now.getFullYear() &&
      dueDate.getMonth() === now.getMonth()
    );
  }

  return false;
}

export function calculateBandwidth(
  tasks: TaskInput[],
  window: TimeWindow
): BandwidthResult {
  const flaggedTasks: TaskInput[] = [];
  let totalRemainingHours = 0;

  for (const task of tasks) {
    if (!QUALIFYING_STATUSES.includes(task.status)) continue;
    if (!isInTimeWindow(task.dueDate, window)) continue;

    if (task.estimatedHours === null || task.estimatedHours === 0) {
      flaggedTasks.push(task);
      continue;
    }

    const remaining = Math.max(0, task.estimatedHours - task.loggedHours);
    totalRemainingHours += remaining;
  }

  const bandwidthPercent = Math.min(
    100,
    Math.round((totalRemainingHours / WORK_WEEK_HOURS) * 100)
  );
  const availableBandwidthPercent = 100 - bandwidthPercent;

  return {
    bandwidthPercent,
    availableBandwidthPercent,
    remainingHours: totalRemainingHours,
    flaggedTasks,
  };
}
