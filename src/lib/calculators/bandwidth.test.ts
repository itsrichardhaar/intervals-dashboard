import { describe, it, expect, beforeEach, vi } from "vitest";
import { calculateBandwidth, TaskInput } from "./bandwidth";

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

describe("calculateBandwidth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MONDAY);
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

  it("total filter includes all open tasks regardless of due date", () => {
    const farFuture = new Date("2030-01-01T10:00:00.000Z");
    const tasks = [
      makeTask({ dueDate: farFuture, estimatedHours: 8 }),
      makeTask({ id: "t2", dueDate: null, estimatedHours: 8 }),
    ];
    const result = calculateBandwidth(tasks, "total");
    expect(result.remainingHours).toBe(16);
  });

  it("total filter excludes tasks with no due date from weekly and monthly but includes in total", () => {
    const tasks = [makeTask({ dueDate: null, estimatedHours: 8 })];
    expect(calculateBandwidth(tasks, "weekly").remainingHours).toBe(0);
    expect(calculateBandwidth(tasks, "monthly").remainingHours).toBe(0);
    expect(calculateBandwidth(tasks, "total").remainingHours).toBe(8);
  });
});
