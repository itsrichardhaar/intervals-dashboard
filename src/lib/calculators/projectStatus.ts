import { QUALIFYING_STATUSES } from "./bandwidth";

export type AutoProjectStatus = "on_track" | "at_risk";

export interface ProjectStatusInput {
  estimatedHours: number;
  loggedHours: number;
  startDate: Date | null;
  dueDate: Date | null;
  tasks: Array<{ dueDate: Date | null; status: string }>;
}

const BUDGET_AT_RISK_THRESHOLD = 0.8;
const OVERDUE_DAYS_THRESHOLD = 3;

function daysDiff(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function hasOverdueTasks(
  tasks: ProjectStatusInput["tasks"],
  now: Date
): boolean {
  return tasks.some((task) => {
    if (!task.dueDate) return false;
    if (!(QUALIFYING_STATUSES as string[]).includes(task.status)) return false;
    const daysOverdue = daysDiff(task.dueDate, now);
    return daysOverdue > OVERDUE_DAYS_THRESHOLD;
  });
}

export function calculateProjectStatus(
  input: ProjectStatusInput
): AutoProjectStatus {
  const now = new Date();

  // At risk: budget >80% burned with work remaining
  if (
    input.estimatedHours > 0 &&
    input.loggedHours / input.estimatedHours > BUDGET_AT_RISK_THRESHOLD &&
    input.loggedHours < input.estimatedHours
  ) {
    return "at_risk";
  }

  // At risk: 1+ tasks overdue by more than 3 days
  if (hasOverdueTasks(input.tasks, now)) {
    return "at_risk";
  }

  return "on_track";
}
