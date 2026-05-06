import { describe, it, expect, vi, afterEach } from "vitest";
import {
  filterTasks,
  filterTasksByDate,
  DEFAULT_TASK_FILTER,
  ALL_STATUSES,
  type TaskFilterSpec,
  type DateBucket,
} from "./taskFilters";
import type { TaskStatus } from "./calculators/bandwidth";

// ─── Stub types ───────────────────────────────────────────────────────────────

interface StubTask {
  id: string;
  normalizedStatus: TaskStatus;
  overdue: boolean;
  dueDate: string | null; // ISO string
}

function task(
  id: string,
  normalizedStatus: TaskStatus,
  dueDate: string | null,
  overdue = false,
): StubTask {
  return { id, normalizedStatus, dueDate, overdue };
}

// ─── filterTasks (status filter) ──────────────────────────────────────────────

const allTasks: StubTask[] = [
  task("o",   "open",               "2026-06-01"),
  task("ip",  "in_progress",        "2026-06-01"),
  task("iir", "in_internal_review", "2026-06-01"),
  task("icr", "in_client_review",   "2026-06-01"),
  task("cl",  "closed",             "2026-06-01"),
];

describe("filterTasks", () => {
  it("returns all active tasks when using DEFAULT_TASK_FILTER (Closed excluded)", () => {
    const result = filterTasks(allTasks, DEFAULT_TASK_FILTER);
    expect(result.map((t) => t.id)).toEqual(["o", "ip", "iir", "icr"]);
    expect(result.find((t) => t.id === "cl")).toBeUndefined();
  });

  it("returns all tasks when all statuses are included", () => {
    const filter: TaskFilterSpec = { statuses: [...ALL_STATUSES] };
    const result = filterTasks(allTasks, filter);
    expect(result).toHaveLength(5);
  });

  it("returns empty list when no statuses are checked", () => {
    const filter: TaskFilterSpec = { statuses: [] };
    expect(filterTasks(allTasks, filter)).toHaveLength(0);
  });

  it("includes only open tasks when only open is checked", () => {
    const filter: TaskFilterSpec = { statuses: ["open"] };
    const result = filterTasks(allTasks, filter);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("o");
  });

  it("includes only in_progress tasks when only in_progress is checked", () => {
    const filter: TaskFilterSpec = { statuses: ["in_progress"] };
    const result = filterTasks(allTasks, filter);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ip");
  });

  it("includes only in_internal_review when only that is checked", () => {
    const filter: TaskFilterSpec = { statuses: ["in_internal_review"] };
    const result = filterTasks(allTasks, filter);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("iir");
  });

  it("includes only in_client_review when only that is checked", () => {
    const filter: TaskFilterSpec = { statuses: ["in_client_review"] };
    const result = filterTasks(allTasks, filter);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("icr");
  });

  it("includes only closed when only closed is checked", () => {
    const filter: TaskFilterSpec = { statuses: ["closed"] };
    const result = filterTasks(allTasks, filter);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("cl");
  });

  it("correctly combines two statuses", () => {
    const filter: TaskFilterSpec = { statuses: ["open", "closed"] };
    const result = filterTasks(allTasks, filter);
    expect(result.map((t) => t.id)).toEqual(["o", "cl"]);
  });

  it("excludes a specific status when unchecked", () => {
    const filter: TaskFilterSpec = { statuses: ["open", "in_progress", "in_client_review"] };
    const result = filterTasks(allTasks, filter);
    expect(result.find((t) => t.id === "iir")).toBeUndefined();
    expect(result.find((t) => t.id === "cl")).toBeUndefined();
    expect(result).toHaveLength(3);
  });

  it("returns empty list when tasks array is empty", () => {
    expect(filterTasks([], DEFAULT_TASK_FILTER)).toHaveLength(0);
  });
});

// ─── filterTasksByDate (date bucket filter) ────────────────────────────────────

// Pin date to 2026-05-06 Wednesday
const PINNED = new Date("2026-05-06T12:00:00");
// Week: Mon 2026-05-04 … Sun 2026-05-10
// Month: May 2026

afterEach(() => {
  vi.useRealTimers();
});

function withTime(tasks: StubTask[]): StubTask[] {
  return tasks;
}

const dateTasks: StubTask[] = [
  task("overdue",     "open", "2026-04-30", true),  // before today → overdue
  task("thisweek",    "open", "2026-05-08"),          // within this week
  task("thismonth",   "open", "2026-05-25"),          // within this month, not this week
  task("nextmonth",   "open", "2026-06-15"),          // future, not this month
  task("nodate",      "open", null),                  // no due date
];

describe("filterTasksByDate", () => {
  it("returns all tasks when no bucket is selected (null)", () => {
    const result = filterTasksByDate(dateTasks, null, PINNED);
    expect(result).toHaveLength(5);
  });

  it("'overdue' bucket returns only overdue tasks", () => {
    const result = filterTasksByDate(dateTasks, "overdue", PINNED);
    expect(result.map((t) => t.id)).toEqual(["overdue"]);
  });

  it("'this_week' bucket returns tasks due within the current ISO week", () => {
    const result = filterTasksByDate(dateTasks, "this_week", PINNED);
    expect(result.map((t) => t.id)).toEqual(["thisweek"]);
  });

  it("'this_week' does NOT include overdue tasks", () => {
    const result = filterTasksByDate(dateTasks, "this_week", PINNED);
    expect(result.find((t) => t.id === "overdue")).toBeUndefined();
  });

  it("'this_month' bucket returns tasks due in current month but not overdue", () => {
    const result = filterTasksByDate(dateTasks, "this_month", PINNED);
    // Includes thisweek + thismonth (all of May that aren't overdue)
    expect(result.map((t) => t.id)).toContain("thisweek");
    expect(result.map((t) => t.id)).toContain("thismonth");
    expect(result.find((t) => t.id === "overdue")).toBeUndefined();
    expect(result.find((t) => t.id === "nextmonth")).toBeUndefined();
    expect(result.find((t) => t.id === "nodate")).toBeUndefined();
  });

  it("'no_due_date' bucket returns only tasks with null dueDate", () => {
    const result = filterTasksByDate(dateTasks, "no_due_date", PINNED);
    expect(result.map((t) => t.id)).toEqual(["nodate"]);
  });

  it("status + date bucket combined narrows results", () => {
    const mixed: StubTask[] = [
      task("open-overdue",    "open",      "2026-04-30", true),
      task("closed-overdue",  "closed",    "2026-04-30", true),
      task("open-future",     "open",      "2026-06-01"),
    ];
    const statusFiltered = filterTasks(mixed, { statuses: ["open"] });
    const dateFiltered   = filterTasksByDate(statusFiltered, "overdue", PINNED);
    expect(dateFiltered.map((t) => t.id)).toEqual(["open-overdue"]);
  });

  it("task due exactly today is NOT in the overdue bucket", () => {
    const todayTask: StubTask = task("today", "open", PINNED.toISOString().slice(0, 10), false);
    const result = filterTasksByDate([todayTask], "overdue", PINNED);
    expect(result).toHaveLength(0);
  });

  it("task due exactly today IS in this_week bucket", () => {
    const todayTask: StubTask = task("today", "open", PINNED.toISOString().slice(0, 10), false);
    const result = filterTasksByDate([todayTask], "this_week", PINNED);
    expect(result).toHaveLength(1);
  });
});
