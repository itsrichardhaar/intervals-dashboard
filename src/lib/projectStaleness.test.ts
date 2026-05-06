import { describe, it, expect } from "vitest";
import { isStaleProject, currentISOWeekStart } from "./projectStaleness";

// Pinned week: Monday 2026-05-04 00:00:00 local
const WEEK_START = new Date("2026-05-04T00:00:00");

describe("isStaleProject", () => {
  it("returns true when latestUpdateAt is null (no updates ever)", () => {
    expect(isStaleProject(null, WEEK_START)).toBe(true);
  });

  it("returns true when last update is one second before week start", () => {
    const beforeWeek = new Date("2026-05-03T23:59:59");
    expect(isStaleProject(beforeWeek, WEEK_START)).toBe(true);
  });

  it("returns true when last update is days before week start", () => {
    const lastWeek = new Date("2026-04-28T15:00:00");
    expect(isStaleProject(lastWeek, WEEK_START)).toBe(true);
  });

  it("returns false when last update is exactly at week start (boundary — not stale)", () => {
    expect(isStaleProject(new Date("2026-05-04T00:00:00"), WEEK_START)).toBe(false);
  });

  it("returns false when last update is shortly after week start", () => {
    const afterWeek = new Date("2026-05-04T00:00:01");
    expect(isStaleProject(afterWeek, WEEK_START)).toBe(false);
  });

  it("returns false when last update is mid-week", () => {
    const midWeek = new Date("2026-05-06T09:30:00");
    expect(isStaleProject(midWeek, WEEK_START)).toBe(false);
  });
});

describe("currentISOWeekStart", () => {
  it("returns the preceding Monday for a Wednesday", () => {
    const wed = new Date("2026-05-06T12:00:00"); // Wednesday
    const start = currentISOWeekStart(wed);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(4); // May
    expect(start.getDate()).toBe(4);  // Monday May 4
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  it("returns the same day (midnight) when given a Monday", () => {
    const mon = new Date("2026-05-04T08:00:00");
    const start = currentISOWeekStart(mon);
    expect(start.getDate()).toBe(4);
    expect(start.getHours()).toBe(0);
  });

  it("returns the preceding Monday when given a Sunday", () => {
    const sun = new Date("2026-05-10T20:00:00"); // Sunday
    const start = currentISOWeekStart(sun);
    expect(start.getDate()).toBe(4); // Monday May 4
  });
});
