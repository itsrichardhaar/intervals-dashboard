import { normalizeTaskStatus, isOverdue, type TaskStatus } from "@/lib/calculators/bandwidth";

/** Statuses shown on Daily Focus — actionable work only */
export const DAILY_FOCUS_STATUSES: TaskStatus[] = ["open", "in_progress"];

export interface DailyFocusTask {
  id: string;
  title: string;
  status: string;       // raw Intervals status string
  dueDate: Date | null;
  estimatedHours: number | null;
  loggedHours: number;
  project: { id: string; name: string };
}

export interface DailyFocusTaskNormalized extends DailyFocusTask {
  normalizedStatus: TaskStatus;
  overdue: boolean;
}

/**
 * Filter raw tasks to Daily Focus candidates (Open or In Progress only),
 * then sort them: overdue first, then ascending by due date, then no-due-date last.
 * Tasks sharing a due date have no secondary sort.
 */
export function sortDailyFocusTasks(
  tasks: DailyFocusTask[],
  today: Date = new Date(),
): DailyFocusTaskNormalized[] {
  // Normalise today to midnight for consistent day-level comparisons
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const normalised = tasks
    .map((t) => ({
      ...t,
      normalizedStatus: normalizeTaskStatus(t.status),
      overdue: t.dueDate !== null && t.dueDate < todayStart,
    }))
    .filter((t) => DAILY_FOCUS_STATUSES.includes(t.normalizedStatus));

  return normalised.sort((a, b) => {
    const aNoDate = a.dueDate === null;
    const bNoDate = b.dueDate === null;

    // No-due-date tasks always go last
    if (aNoDate && !bNoDate) return 1;
    if (!aNoDate && bNoDate) return -1;
    if (aNoDate && bNoDate) return 0;

    // Overdue tasks go before future/today tasks
    if (a.overdue && !b.overdue) return -1;
    if (!a.overdue && b.overdue) return 1;

    // Within overdue or within future: ascending by due date
    return a.dueDate!.getTime() - b.dueDate!.getTime();
  });
}
