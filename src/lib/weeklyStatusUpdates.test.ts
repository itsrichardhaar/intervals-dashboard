import { describe, it, expect } from "vitest";
import { validateWeeklyUpdateInput, getLatestUpdates } from "./weeklyStatusUpdates";

describe("validateWeeklyUpdateInput", () => {
  it("returns null for valid on_track input", () => {
    expect(validateWeeklyUpdateInput({ status: "on_track", summary: "Looking good" })).toBeNull();
  });

  it("returns null for valid at_risk input", () => {
    expect(validateWeeklyUpdateInput({ status: "at_risk", summary: "Behind on auth tasks" })).toBeNull();
  });

  it("returns null for valid blocked input", () => {
    expect(validateWeeklyUpdateInput({ status: "blocked", summary: "Waiting on client approval" })).toBeNull();
  });

  it("returns error for unknown status", () => {
    const err = validateWeeklyUpdateInput({ status: "unknown", summary: "Summary" });
    expect(err).toBe("Invalid status");
  });

  it("returns error for empty status string", () => {
    expect(validateWeeklyUpdateInput({ status: "", summary: "Summary" })).toBe("Invalid status");
  });

  it("returns error for empty summary", () => {
    expect(validateWeeklyUpdateInput({ status: "on_track", summary: "" })).toBe("Summary is required");
  });

  it("returns error for whitespace-only summary", () => {
    expect(validateWeeklyUpdateInput({ status: "at_risk", summary: "   " })).toBe("Summary is required");
  });
});

describe("getLatestUpdates", () => {
  function makeUpdate(createdAt: Date) {
    return { id: createdAt.toISOString(), createdAt };
  }

  const d1 = new Date("2026-05-01T10:00:00Z");
  const d2 = new Date("2026-05-03T10:00:00Z");
  const d3 = new Date("2026-05-05T10:00:00Z");
  const d4 = new Date("2026-05-07T10:00:00Z");

  it("returns updates ordered newest first", () => {
    const updates = [makeUpdate(d1), makeUpdate(d3), makeUpdate(d2)];
    const result = getLatestUpdates(updates, 10);
    expect(result.map((u) => u.createdAt)).toEqual([d3, d2, d1]);
  });

  it("returns at most N updates", () => {
    const updates = [makeUpdate(d1), makeUpdate(d2), makeUpdate(d3), makeUpdate(d4)];
    const result = getLatestUpdates(updates, 2);
    expect(result).toHaveLength(2);
    expect(result[0].createdAt).toEqual(d4);
    expect(result[1].createdAt).toEqual(d3);
  });

  it("returns all updates when fewer than limit exist", () => {
    const updates = [makeUpdate(d1), makeUpdate(d2)];
    const result = getLatestUpdates(updates, 6);
    expect(result).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(getLatestUpdates([], 6)).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const updates = [makeUpdate(d2), makeUpdate(d1), makeUpdate(d3)];
    const original = [...updates];
    getLatestUpdates(updates, 10);
    expect(updates).toEqual(original);
  });
});
