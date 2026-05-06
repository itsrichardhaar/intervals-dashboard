import { describe, it, expect } from "vitest";
import { filterTasks, DEFAULT_TASK_FILTER, ALL_STATUSES, type TaskFilterSpec } from "./taskFilters";
import type { TaskStatus } from "./calculators/bandwidth";

interface StubTask {
  id: string;
  normalizedStatus: TaskStatus;
}

function task(id: string, normalizedStatus: TaskStatus): StubTask {
  return { id, normalizedStatus };
}

const allTasks: StubTask[] = [
  task("o",   "open"),
  task("ip",  "in_progress"),
  task("iir", "in_internal_review"),
  task("icr", "in_client_review"),
  task("cl",  "closed"),
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
