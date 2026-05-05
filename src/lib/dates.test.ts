import { describe, it, expect, vi, afterEach } from "vitest";
import {
  startOfCurrentWeek,
  endOfCurrentWeek,
  isThisWeek,
  todayStart,
  parseTimeWindow,
} from "./dates";

// Pin to Tuesday 2026-05-05 12:00:00 local
// ISO week: Mon 2026-04-27 … Sun 2026-05-03? No — week of 2026-05-05 is Mon 2026-05-04..Sun 2026-05-10
// Let's compute: 2026-05-05 is a Tuesday (day=2), diff = 1-2 = -1 → Mon 2026-05-04
const PINNED_DATE = new Date("2026-05-05T12:00:00");

afterEach(() => {
  vi.useRealTimers();
});

function pin(date = PINNED_DATE) {
  vi.useFakeTimers();
  vi.setSystemTime(date);
}

// ── startOfCurrentWeek ────────────────────────────────────────────────────────

describe("startOfCurrentWeek", () => {
  it("returns the preceding Monday at midnight (Tuesday input)", () => {
    pin(); // Tuesday 2026-05-05
    const result = startOfCurrentWeek();
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(4); // May (0-indexed)
    expect(result.getDate()).toBe(4);  // Monday May 4
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it("returns today when today is Monday", () => {
    pin(new Date("2026-05-04T09:00:00")); // Monday
    const result = startOfCurrentWeek();
    expect(result.getDate()).toBe(4);
  });

  it("handles Sunday correctly (rolls back 6 days)", () => {
    pin(new Date("2026-05-10T08:00:00")); // Sunday
    const result = startOfCurrentWeek();
    expect(result.getDate()).toBe(4); // Monday May 4
  });
});

// ── endOfCurrentWeek ──────────────────────────────────────────────────────────

describe("endOfCurrentWeek", () => {
  it("returns Sunday at 23:59:59.999 of the current week", () => {
    pin(); // Tuesday 2026-05-05 → week Mon May 4 … Sun May 10
    const result = endOfCurrentWeek();
    expect(result.getDate()).toBe(10); // Sunday May 10
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });
});

// ── isThisWeek ────────────────────────────────────────────────────────────────

describe("isThisWeek", () => {
  it("returns false for null", () => {
    pin();
    expect(isThisWeek(null)).toBe(false);
  });

  it("returns true for a date within the current week", () => {
    pin(); // week = Mon May 4 – Sun May 10
    expect(isThisWeek(new Date("2026-05-06T10:00:00"))).toBe(true);
  });

  it("returns true for Monday (week start)", () => {
    pin();
    expect(isThisWeek(new Date("2026-05-04T00:00:00"))).toBe(true);
  });

  it("returns true for Sunday (week end, early morning)", () => {
    pin();
    expect(isThisWeek(new Date("2026-05-10T08:00:00"))).toBe(true);
  });

  it("returns false for last week", () => {
    pin();
    expect(isThisWeek(new Date("2026-04-30T12:00:00"))).toBe(false);
  });

  it("returns false for next week", () => {
    pin();
    expect(isThisWeek(new Date("2026-05-11T12:00:00"))).toBe(false);
  });
});

// ── todayStart ────────────────────────────────────────────────────────────────

describe("todayStart", () => {
  it("returns today at midnight", () => {
    pin(); // 2026-05-05 12:00
    const result = todayStart();
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(5);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });
});

// ── parseTimeWindow ───────────────────────────────────────────────────────────

describe("parseTimeWindow", () => {
  it("passes through 'weekly'", () => {
    expect(parseTimeWindow("weekly")).toBe("weekly");
  });

  it("passes through 'monthly'", () => {
    expect(parseTimeWindow("monthly")).toBe("monthly");
  });

  it("passes through 'total'", () => {
    expect(parseTimeWindow("total")).toBe("total");
  });

  it("defaults to 'weekly' for undefined", () => {
    expect(parseTimeWindow(undefined)).toBe("weekly");
  });

  it("defaults to 'weekly' for unknown strings", () => {
    expect(parseTimeWindow("yearly")).toBe("weekly");
    expect(parseTimeWindow("")).toBe("weekly");
  });
});
