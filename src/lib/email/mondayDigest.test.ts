import { describe, it, expect } from "vitest";
import { buildDigestEmail } from "./mondayDigest";

describe("buildDigestEmail", () => {
  const baseInput = {
    name: "Alice",
    email: "alice@example.com",
    bandwidthPercent: 75,
    tasks: [
      {
        title: "Design mockups",
        projectName: "Acme Rebrand",
        dueDate: new Date("2026-05-07T00:00:00.000Z"),
      },
    ],
    openActionItemCount: 2,
    flaggedTaskCount: 0,
  };

  it("includes the user's name in the subject and body", () => {
    const { subject, html } = buildDigestEmail(baseInput);
    expect(subject).toContain("Alice");
    expect(html).toContain("Alice");
  });

  it("includes bandwidth percent in subject and body", () => {
    const { subject, html } = buildDigestEmail(baseInput);
    expect(subject).toContain("75%");
    expect(html).toContain("75%");
  });

  it("colors bandwidth green when under 70%", () => {
    const { html } = buildDigestEmail({ ...baseInput, bandwidthPercent: 50 });
    expect(html).toContain("#22c55e");
  });

  it("colors bandwidth yellow when 70–89%", () => {
    const { html } = buildDigestEmail({ ...baseInput, bandwidthPercent: 80 });
    expect(html).toContain("#eab308");
  });

  it("colors bandwidth red when 90%+", () => {
    const { html } = buildDigestEmail({ ...baseInput, bandwidthPercent: 95 });
    expect(html).toContain("#ef4444");
  });

  it("includes task title and project name in the table", () => {
    const { html } = buildDigestEmail(baseInput);
    expect(html).toContain("Design mockups");
    expect(html).toContain("Acme Rebrand");
  });

  it("shows 'No tasks due this week' when task list is empty", () => {
    const { html } = buildDigestEmail({ ...baseInput, tasks: [] });
    expect(html).toContain("No tasks due this week");
  });

  it("includes open action item count when > 0", () => {
    const { html } = buildDigestEmail({ ...baseInput, openActionItemCount: 3 });
    expect(html).toContain("3");
    expect(html).toContain("open action item");
  });

  it("omits action item section when count is 0", () => {
    const { html } = buildDigestEmail({ ...baseInput, openActionItemCount: 0 });
    expect(html).not.toContain("open action item");
  });

  it("includes flagged task warning when count > 0", () => {
    const { html } = buildDigestEmail({ ...baseInput, flaggedTaskCount: 2 });
    expect(html).toContain("need");
    expect(html).toContain("estimate");
  });

  it("omits flagged task warning when count is 0", () => {
    const { html } = buildDigestEmail({ ...baseInput, flaggedTaskCount: 0 });
    expect(html).not.toContain("need");
  });

  it("uses singular form for one action item", () => {
    const { html } = buildDigestEmail({ ...baseInput, openActionItemCount: 1 });
    expect(html).toContain("1</strong> open action item.");
  });

  it("uses singular form for one flagged task", () => {
    const { html } = buildDigestEmail({ ...baseInput, flaggedTaskCount: 1 });
    expect(html).toContain("1</strong> task");
    expect(html).toContain("needs");
  });
});
