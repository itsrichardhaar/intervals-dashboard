export type TaskStatus =
  | "open"
  | "in_progress"
  | "in_internal_review"
  | "in_client_review"
  | "closed";

export type TimeWindow = "weekly" | "monthly" | "quarterly";

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
  capacityHours: number;
  freeHours: number;
  flaggedTasks: TaskInput[];
}

import { startOfCurrentWeek, endOfCurrentWeek, startOfCurrentQuarter, endOfCurrentQuarter } from "@/lib/dates";

export const QUALIFYING_STATUSES: TaskStatus[] = [
  "open",
  "in_progress",
  "in_internal_review",
  "in_client_review",
];

/** Capacity hours per time window. */
export const CAPACITY_HOURS: Record<TimeWindow, number> = {
  weekly: 40,
  monthly: 160,
  quarterly: 480,
};

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

/**
 * Tailwind CSS classes for a bandwidth progress bar fill.
 * Thresholds: ≥90 → red, ≥70 → yellow, else green.
 */
export function bandwidthBarColor(pct: number): string {
  if (pct >= 90) return "bg-red-500";
  if (pct >= 70) return "bg-yellow-400";
  return "bg-green-500";
}

/**
 * Tailwind CSS text color class for a bandwidth percentage label.
 * Thresholds: ≥90 → red, ≥70 → yellow, else green.
 */
export function bandwidthTextColor(pct: number): string {
  if (pct >= 90) return "text-red-400";
  if (pct >= 70) return "text-yellow-400";
  return "text-green-400";
}

/**
 * Hex color for use in HTML email templates.
 * Thresholds: ≥90 → red, ≥70 → yellow, else green.
 */
export function bandwidthHexColor(pct: number): string {
  if (pct >= 90) return "#ef4444";
  if (pct >= 70) return "#eab308";
  return "#22c55e";
}

function isInTimeWindow(dueDate: Date | null, window: TimeWindow): boolean {
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

  if (window === "quarterly") {
    return dueDate >= startOfCurrentQuarter() && dueDate <= endOfCurrentQuarter();
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

  const capacity = CAPACITY_HOURS[window];
  const bandwidthPercent = Math.min(
    100,
    Math.round((totalRemainingHours / capacity) * 100)
  );
  const availableBandwidthPercent = 100 - bandwidthPercent;
  const freeHours = Math.max(0, capacity - totalRemainingHours);

  return {
    bandwidthPercent,
    availableBandwidthPercent,
    remainingHours: totalRemainingHours,
    capacityHours: capacity,
    freeHours,
    flaggedTasks,
  };
}
