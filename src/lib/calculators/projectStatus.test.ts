import { describe, it, expect, beforeEach, vi } from "vitest";
import { calculateProjectStatus, ProjectStatusInput } from "./projectStatus";

const NOW = new Date("2025-05-05T10:00:00.000Z");

function makeInput(overrides: Partial<ProjectStatusInput> = {}): ProjectStatusInput {
  return {
    estimatedHours: 80,
    loggedHours: 40,
    startDate: new Date("2025-04-01"),
    dueDate: new Date("2025-06-01"),
    tasks: [],
    ...overrides,
  };
}

function daysAgo(days: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - days);
  return d;
}

describe("calculateProjectStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  it("returns on_track for a healthy project", () => {
    const result = calculateProjectStatus(makeInput());
    expect(result).toBe("on_track");
  });

  it("returns at_risk when budget >80% burned with remaining work", () => {
    const result = calculateProjectStatus(
      makeInput({ estimatedHours: 100, loggedHours: 85 })
    );
    expect(result).toBe("at_risk");
  });

  it("returns on_track when budget >80% burned but no remaining work (complete)", () => {
    // loggedHours >= estimatedHours means no remaining work
    const result = calculateProjectStatus(
      makeInput({ estimatedHours: 100, loggedHours: 100 })
    );
    expect(result).toBe("on_track");
  });

  it("returns at_risk when a task is overdue by more than 3 days", () => {
    const result = calculateProjectStatus(
      makeInput({
        tasks: [{ dueDate: daysAgo(4), status: "open" }],
      })
    );
    expect(result).toBe("at_risk");
  });

  it("returns on_track when a task is overdue by exactly 3 days (boundary)", () => {
    const result = calculateProjectStatus(
      makeInput({
        tasks: [{ dueDate: daysAgo(3), status: "open" }],
      })
    );
    expect(result).toBe("on_track");
  });

  it("returns at_risk when a task is overdue by 4 days", () => {
    const result = calculateProjectStatus(
      makeInput({
        tasks: [{ dueDate: daysAgo(4), status: "open" }],
      })
    );
    expect(result).toBe("at_risk");
  });

  it("ignores closed tasks for overdue check", () => {
    const result = calculateProjectStatus(
      makeInput({
        tasks: [{ dueDate: daysAgo(10), status: "closed" }],
      })
    );
    expect(result).toBe("on_track");
  });

  it("handles project with no tasks", () => {
    const result = calculateProjectStatus(makeInput({ tasks: [] }));
    expect(result).toBe("on_track");
  });

  it("handles project with zero estimated hours gracefully", () => {
    const result = calculateProjectStatus(
      makeInput({ estimatedHours: 0, loggedHours: 0 })
    );
    expect(result).toBe("on_track");
  });

  it("returns at_risk with multiple overdue tasks", () => {
    const result = calculateProjectStatus(
      makeInput({
        tasks: [
          { dueDate: daysAgo(5), status: "open" },
          { dueDate: daysAgo(7), status: "in_progress" },
        ],
      })
    );
    expect(result).toBe("at_risk");
  });

  it("never returns blocked (blocked is manual only)", () => {
    const result = calculateProjectStatus(
      makeInput({ estimatedHours: 100, loggedHours: 99 })
    );
    expect(result).not.toBe("blocked");
  });
});
