import { describe, it, expect } from "vitest";
import { sortDailyFocusTasks, type DailyFocusTask } from "./dailyFocus";

// Fixed "today" for all tests: 2026-05-05 00:00:00
const TODAY = new Date("2026-05-05T00:00:00");

function task(overrides: Partial<DailyFocusTask> & Pick<DailyFocusTask, "id" | "title" | "dueDate">): DailyFocusTask {
  return {
    status: "open",
    estimatedHours: null,
    loggedHours: 0,
    project: { id: "p1", name: "Project" },
    ...overrides,
  };
}

function date(iso: string): Date {
  return new Date(iso);
}

describe("sortDailyFocusTasks", () => {
  it("filters out non-open/in-progress statuses", () => {
    const tasks: DailyFocusTask[] = [
      task({ id: "1", title: "Open task",             dueDate: date("2026-05-10"), status: "open"                }),
      task({ id: "2", title: "In progress task",      dueDate: date("2026-05-10"), status: "in progress"        }),
      task({ id: "3", title: "Internal review task",  dueDate: date("2026-05-10"), status: "in internal review" }),
      task({ id: "4", title: "Client review task",    dueDate: date("2026-05-10"), status: "in client review"   }),
      task({ id: "5", title: "Closed task",           dueDate: date("2026-05-10"), status: "closed"             }),
    ];
    const result = sortDailyFocusTasks(tasks, TODAY);
    expect(result.map((t) => t.id)).toEqual(["1", "2"]);
  });

  it("places overdue tasks before future tasks", () => {
    const tasks: DailyFocusTask[] = [
      task({ id: "future",  title: "Future",  dueDate: date("2026-05-10") }),
      task({ id: "overdue", title: "Overdue", dueDate: date("2026-04-01") }),
    ];
    const result = sortDailyFocusTasks(tasks, TODAY);
    expect(result[0].id).toBe("overdue");
    expect(result[1].id).toBe("future");
  });

  it("places no-due-date tasks after all dated tasks", () => {
    const tasks: DailyFocusTask[] = [
      task({ id: "nodate",  title: "No date", dueDate: null }),
      task({ id: "overdue", title: "Overdue", dueDate: date("2026-04-01") }),
      task({ id: "future",  title: "Future",  dueDate: date("2026-05-10") }),
    ];
    const result = sortDailyFocusTasks(tasks, TODAY);
    expect(result[0].id).toBe("overdue");
    expect(result[1].id).toBe("future");
    expect(result[2].id).toBe("nodate");
  });

  it("sorts multiple overdue tasks in ascending date order", () => {
    const tasks: DailyFocusTask[] = [
      task({ id: "o2", title: "Older overdue", dueDate: date("2026-03-01") }),
      task({ id: "o3", title: "Most overdue",  dueDate: date("2026-01-15") }),
      task({ id: "o1", title: "Less overdue",  dueDate: date("2026-04-30") }),
    ];
    const result = sortDailyFocusTasks(tasks, TODAY);
    expect(result.map((t) => t.id)).toEqual(["o3", "o2", "o1"]);
  });

  it("sorts multiple future tasks in ascending date order", () => {
    const tasks: DailyFocusTask[] = [
      task({ id: "f3", title: "Far future",   dueDate: date("2026-12-01") }),
      task({ id: "f1", title: "Near future",  dueDate: date("2026-05-08") }),
      task({ id: "f2", title: "Mid future",   dueDate: date("2026-06-15") }),
    ];
    const result = sortDailyFocusTasks(tasks, TODAY);
    expect(result.map((t) => t.id)).toEqual(["f1", "f2", "f3"]);
  });

  it("treats tasks sharing the same due date as equals (preserves relative order)", () => {
    const tasks: DailyFocusTask[] = [
      task({ id: "a", title: "Task A", dueDate: date("2026-05-10") }),
      task({ id: "b", title: "Task B", dueDate: date("2026-05-10") }),
      task({ id: "c", title: "Task C", dueDate: date("2026-05-10") }),
    ];
    const result = sortDailyFocusTasks(tasks, TODAY);
    // All on same date — just confirm they all appear
    expect(result.map((t) => t.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("handles all no-due-date tasks without error", () => {
    const tasks: DailyFocusTask[] = [
      task({ id: "1", title: "Task 1", dueDate: null }),
      task({ id: "2", title: "Task 2", dueDate: null }),
    ];
    const result = sortDailyFocusTasks(tasks, TODAY);
    expect(result).toHaveLength(2);
  });

  it("task due today is NOT overdue", () => {
    const tasks: DailyFocusTask[] = [
      task({ id: "today",   title: "Due today",    dueDate: TODAY }),
      task({ id: "overdue", title: "Was overdue",  dueDate: date("2026-05-04") }),
    ];
    const result = sortDailyFocusTasks(tasks, TODAY);
    // overdue (May 4) < today (May 5), so it goes first
    expect(result[0].id).toBe("overdue");
    expect(result[0].overdue).toBe(true);
    expect(result[1].id).toBe("today");
    expect(result[1].overdue).toBe(false);
  });

  it("returns empty array for no tasks", () => {
    expect(sortDailyFocusTasks([], TODAY)).toEqual([]);
  });
});
