import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  validateActionItemInput,
  isCarriedOver,
  isActionItemOverdue,
} from "./actionItems";

// ─── validateActionItemInput ──────────────────────────────────────────────────

describe("validateActionItemInput", () => {
  it("returns null for valid input with description and assignee", () => {
    expect(
      validateActionItemInput({ description: "Review mockups", assigneeId: "user_abc" })
    ).toBeNull();
  });

  it("returns error for empty description", () => {
    expect(
      validateActionItemInput({ description: "", assigneeId: "user_abc" })
    ).toBe("Description is required");
  });

  it("returns error for whitespace-only description", () => {
    expect(
      validateActionItemInput({ description: "   ", assigneeId: "user_abc" })
    ).toBe("Description is required");
  });

  it("returns error when assigneeId is missing", () => {
    expect(
      validateActionItemInput({ description: "Review mockups", assigneeId: "" })
    ).toBe("Assignee is required");
  });

  it("accepts description without due date (due date is optional, handled by caller)", () => {
    expect(
      validateActionItemInput({ description: "Send invoice", assigneeId: "user_xyz" })
    ).toBeNull();
  });
});

// ─── isCarriedOver ────────────────────────────────────────────────────────────

const MONDAY = new Date("2026-05-04T09:00:00.000Z"); // a known Monday

describe("isCarriedOver", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MONDAY);
  });
  afterEach(() => vi.useRealTimers());

  it("returns true for open item created before start of current week", () => {
    const lastWeek = new Date("2026-04-28T10:00:00.000Z"); // prior week
    expect(isCarriedOver({ createdAt: lastWeek, completedAt: null })).toBe(true);
  });

  it("returns false for open item created this week", () => {
    const today = new Date("2026-05-04T08:00:00.000Z");
    expect(isCarriedOver({ createdAt: today, completedAt: null })).toBe(false);
  });

  it("returns false for completed item from prior week", () => {
    const lastWeek = new Date("2026-04-28T10:00:00.000Z");
    const completed = new Date("2026-05-01T10:00:00.000Z");
    expect(isCarriedOver({ createdAt: lastWeek, completedAt: completed })).toBe(false);
  });
});

// ─── isActionItemOverdue ──────────────────────────────────────────────────────

const NOW = new Date("2026-05-05T12:00:00.000Z");

describe("isActionItemOverdue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("returns true for open item with past due date", () => {
    const yesterday = new Date("2026-05-04T00:00:00.000Z");
    expect(isActionItemOverdue({ dueDate: yesterday, completedAt: null })).toBe(true);
  });

  it("returns false for open item with future due date", () => {
    const tomorrow = new Date("2026-05-06T00:00:00.000Z");
    expect(isActionItemOverdue({ dueDate: tomorrow, completedAt: null })).toBe(false);
  });

  it("returns false for open item with no due date", () => {
    expect(isActionItemOverdue({ dueDate: null, completedAt: null })).toBe(false);
  });

  it("returns false for completed item with past due date", () => {
    const yesterday = new Date("2026-05-04T00:00:00.000Z");
    const completed = new Date("2026-05-05T10:00:00.000Z");
    expect(isActionItemOverdue({ dueDate: yesterday, completedAt: completed })).toBe(false);
  });
});
