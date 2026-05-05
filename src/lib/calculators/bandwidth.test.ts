import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  calculateBandwidth,
  normalizeTaskStatus,
  isOverdue,
  bandwidthBarColor,
  bandwidthTextColor,
  bandwidthHexColor,
  CAPACITY_HOURS,
  type TaskInput,
} from "./bandwidth";

const MONDAY = new Date("2025-05-05T10:00:00.000Z"); // A Monday

function makeTask(overrides: Partial<TaskInput> = {}): TaskInput {
  return {
    id: "task-1",
    title: "Test Task",
    projectName: "Test Project",
    status: "open",
    estimatedHours: 8,
    loggedHours: 0,
    dueDate: MONDAY,
    ...overrides,
  };
}

describe("normalizeTaskStatus", () => {
  it("passes through already-canonical statuses", () => {
    expect(normalizeTaskStatus("open")).toBe("open");
    expect(normalizeTaskStatus("in_progress")).toBe("in_progress");
    expect(normalizeTaskStatus("in_internal_review")).toBe("in_internal_review");
    expect(normalizeTaskStatus("in_client_review")).toBe("in_client_review");
    expect(normalizeTaskStatus("closed")).toBe("closed");
  });

  it("normalizes Intervals API space-separated strings", () => {
    expect(normalizeTaskStatus("in progress")).toBe("in_progress");
    expect(normalizeTaskStatus("in internal review")).toBe("in_internal_review");
    expect(normalizeTaskStatus("in client review")).toBe("in_client_review");
  });

  it("is case-insensitive", () => {
    expect(normalizeTaskStatus("In Progress")).toBe("in_progress");
    expect(normalizeTaskStatus("OPEN")).toBe("open");
    expect(normalizeTaskStatus("Closed")).toBe("closed");
  });

  it("falls back to 'open' for unrecognized strings", () => {
    expect(normalizeTaskStatus("unknown")).toBe("open");
    expect(normalizeTaskStatus("")).toBe("open");
  });
});

describe("isOverdue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-07T14:00:00.000Z")); // Wednesday at 2pm
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false for null", () => {
    expect(isOverdue(null)).toBe(false);
  });

  it("returns false for a task due today (day-level precision)", () => {
    expect(isOverdue(new Date("2025-05-07T09:00:00.000Z"))).toBe(false);
  });

  it("returns false for a task due in the future", () => {
    expect(isOverdue(new Date("2025-05-08T00:00:00.000Z"))).toBe(false);
  });

  it("returns true for a task due yesterday", () => {
    expect(isOverdue(new Date("2025-05-06T23:59:59.000Z"))).toBe(true);
  });

  it("returns true for a task due last week", () => {
    expect(isOverdue(new Date("2025-04-30T10:00:00.000Z"))).toBe(true);
  });
});

describe("calculateBandwidth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MONDAY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 0% bandwidth for empty task list", () => {
    const result = calculateBandwidth([], "weekly");
    expect(result.bandwidthPercent).toBe(0);
    expect(result.availableBandwidthPercent).toBe(100);
    expect(result.flaggedTasks).toHaveLength(0);
  });

  it("calculates bandwidth for a single qualifying task", () => {
    const tasks = [makeTask({ estimatedHours: 20, loggedHours: 0 })];
    const result = calculateBandwidth(tasks, "weekly");
    expect(result.bandwidthPercent).toBe(50);
    expect(result.availableBandwidthPercent).toBe(50);
    expect(result.remainingHours).toBe(20);
  });

  it("uses remaining hours (estimated minus logged)", () => {
    const tasks = [makeTask({ estimatedHours: 20, loggedHours: 10 })];
    const result = calculateBandwidth(tasks, "weekly");
    expect(result.remainingHours).toBe(10);
    expect(result.bandwidthPercent).toBe(25);
  });

  it("clamps bandwidth to 100% when remaining hours exceed 40", () => {
    const tasks = [makeTask({ estimatedHours: 60, loggedHours: 0 })];
    const result = calculateBandwidth(tasks, "weekly");
    expect(result.bandwidthPercent).toBe(100);
    expect(result.availableBandwidthPercent).toBe(0);
  });

  it("does not go negative when logged hours exceed estimated", () => {
    const tasks = [makeTask({ estimatedHours: 5, loggedHours: 10 })];
    const result = calculateBandwidth(tasks, "weekly");
    expect(result.remainingHours).toBe(0);
    expect(result.bandwidthPercent).toBe(0);
  });

  it("excludes closed tasks from calculation", () => {
    const tasks = [makeTask({ status: "closed", estimatedHours: 40 })];
    const result = calculateBandwidth(tasks, "weekly");
    expect(result.bandwidthPercent).toBe(0);
  });

  it("flags tasks with null estimated hours and excludes from calculation", () => {
    const tasks = [makeTask({ estimatedHours: null })];
    const result = calculateBandwidth(tasks, "weekly");
    expect(result.bandwidthPercent).toBe(0);
    expect(result.flaggedTasks).toHaveLength(1);
    expect(result.flaggedTasks[0].id).toBe("task-1");
  });

  it("flags tasks with 0 estimated hours", () => {
    const tasks = [makeTask({ estimatedHours: 0 })];
    const result = calculateBandwidth(tasks, "weekly");
    expect(result.flaggedTasks).toHaveLength(1);
  });

  it("handles mix of qualifying and flagged tasks", () => {
    const tasks = [
      makeTask({ id: "t1", estimatedHours: 16, loggedHours: 0 }),
      makeTask({ id: "t2", estimatedHours: null }),
    ];
    const result = calculateBandwidth(tasks, "weekly");
    expect(result.remainingHours).toBe(16);
    expect(result.bandwidthPercent).toBe(40);
    expect(result.flaggedTasks).toHaveLength(1);
  });

  it("all qualifying statuses are included", () => {
    const statuses = [
      "open",
      "in_progress",
      "in_internal_review",
      "in_client_review",
    ] as const;

    for (const status of statuses) {
      const result = calculateBandwidth(
        [makeTask({ status, estimatedHours: 8 })],
        "weekly"
      );
      expect(result.remainingHours).toBe(8);
    }
  });

  it("weekly filter excludes tasks due outside current week", () => {
    const nextMonth = new Date("2025-06-10T10:00:00.000Z");
    const tasks = [makeTask({ dueDate: nextMonth, estimatedHours: 8 })];
    const result = calculateBandwidth(tasks, "weekly");
    expect(result.bandwidthPercent).toBe(0);
  });

  it("monthly filter includes tasks due this month", () => {
    const laterThisMonth = new Date("2025-05-28T10:00:00.000Z");
    const tasks = [makeTask({ dueDate: laterThisMonth, estimatedHours: 8 })];
    const result = calculateBandwidth(tasks, "monthly");
    expect(result.remainingHours).toBe(8);
  });

  it("monthly filter excludes tasks due next month", () => {
    const nextMonth = new Date("2025-06-10T10:00:00.000Z");
    const tasks = [makeTask({ dueDate: nextMonth, estimatedHours: 8 })];
    const result = calculateBandwidth(tasks, "monthly");
    expect(result.bandwidthPercent).toBe(0);
  });

  it("quarterly filter includes tasks due in the current calendar quarter", () => {
    // Pinned to 2025-05-05 (Q2: Apr–Jun 2025)
    const inQ2 = new Date("2025-05-28T10:00:00.000Z");
    const tasks = [makeTask({ dueDate: inQ2, estimatedHours: 8 })];
    const result = calculateBandwidth(tasks, "quarterly");
    expect(result.remainingHours).toBe(8);
  });

  it("quarterly filter excludes tasks due outside current quarter", () => {
    const nextQ = new Date("2025-07-10T10:00:00.000Z"); // Q3
    const tasks = [makeTask({ dueDate: nextQ, estimatedHours: 8 })];
    const result = calculateBandwidth(tasks, "quarterly");
    expect(result.remainingHours).toBe(0);
  });

  it("quarterly filter excludes tasks with no due date", () => {
    const tasks = [makeTask({ dueDate: null, estimatedHours: 8 })];
    expect(calculateBandwidth(tasks, "weekly").remainingHours).toBe(0);
    expect(calculateBandwidth(tasks, "monthly").remainingHours).toBe(0);
    expect(calculateBandwidth(tasks, "quarterly").remainingHours).toBe(0);
  });

  it("uses 40h capacity for weekly, 160h for monthly, 480h for quarterly", () => {
    // 8h remaining task
    const task = makeTask({ estimatedHours: 8 });
    expect(calculateBandwidth([task], "weekly").bandwidthPercent).toBe(20);   // 8/40
    expect(calculateBandwidth([task], "monthly").bandwidthPercent).toBe(5);   // 8/160
    expect(calculateBandwidth([task], "quarterly").bandwidthPercent).toBe(2); // 8/480 ≈ 1.67 → 2
  });

  it("returns correct freeHours and capacityHours", () => {
    const task = makeTask({ estimatedHours: 10, loggedHours: 2 }); // 8h remaining
    const result = calculateBandwidth([task], "weekly");
    expect(result.capacityHours).toBe(40);
    expect(result.freeHours).toBe(32); // 40 - 8
    expect(result.remainingHours).toBe(8);
  });
});

// ── CAPACITY_HOURS ────────────────────────────────────────────────────────────

describe("CAPACITY_HOURS", () => {
  it("weekly = 40, monthly = 160, quarterly = 480", () => {
    expect(CAPACITY_HOURS.weekly).toBe(40);
    expect(CAPACITY_HOURS.monthly).toBe(160);
    expect(CAPACITY_HOURS.quarterly).toBe(480);
  });
});

// ── bandwidthBarColor ─────────────────────────────────────────────────────────

describe("bandwidthBarColor", () => {
  it("returns red bar at 90%", () => expect(bandwidthBarColor(90)).toBe("bg-red-500"));
  it("returns red bar above 90%", () => expect(bandwidthBarColor(100)).toBe("bg-red-500"));
  it("returns yellow bar at 70%", () => expect(bandwidthBarColor(70)).toBe("bg-yellow-400"));
  it("returns yellow bar between 70 and 89%", () => expect(bandwidthBarColor(75)).toBe("bg-yellow-400"));
  it("returns green bar below 70%", () => expect(bandwidthBarColor(69)).toBe("bg-green-500"));
  it("returns green bar at 0%", () => expect(bandwidthBarColor(0)).toBe("bg-green-500"));
});

// ── bandwidthTextColor ────────────────────────────────────────────────────────

describe("bandwidthTextColor", () => {
  it("returns red text at 90%", () => expect(bandwidthTextColor(90)).toBe("text-red-400"));
  it("returns yellow text at 70%", () => expect(bandwidthTextColor(70)).toBe("text-yellow-400"));
  it("returns green text below 70%", () => expect(bandwidthTextColor(50)).toBe("text-green-400"));
});

// ── bandwidthHexColor ─────────────────────────────────────────────────────────

describe("bandwidthHexColor", () => {
  it("returns red hex at 90%", () => expect(bandwidthHexColor(90)).toBe("#ef4444"));
  it("returns yellow hex at 70%", () => expect(bandwidthHexColor(70)).toBe("#eab308"));
  it("returns green hex below 70%", () => expect(bandwidthHexColor(50)).toBe("#22c55e"));
});
