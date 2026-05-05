import { describe, it, expect } from "vitest";
import { buildOverdueAlert, buildDueTomorrowAlert } from "./taskAlerts";

const baseInput = {
  assigneeName: "Bob",
  assigneeEmail: "bob@example.com",
  task: {
    title: "Write unit tests",
    projectName: "Platform Upgrade",
    dueDate: new Date("2026-05-15T12:00:00.000Z"),
  },
};

describe("buildOverdueAlert", () => {
  it("includes 'Overdue' in the subject", () => {
    const { subject } = buildOverdueAlert(baseInput);
    expect(subject).toContain("Overdue");
  });

  it("includes task title and project name in the subject", () => {
    const { subject } = buildOverdueAlert(baseInput);
    expect(subject).toContain("Write unit tests");
    expect(subject).toContain("Platform Upgrade");
  });

  it("addresses the assignee by name in the body", () => {
    const { html } = buildOverdueAlert(baseInput);
    expect(html).toContain("Bob");
  });

  it("includes the task title in the body", () => {
    const { html } = buildOverdueAlert(baseInput);
    expect(html).toContain("Write unit tests");
  });

  it("includes the project name in the body", () => {
    const { html } = buildOverdueAlert(baseInput);
    expect(html).toContain("Platform Upgrade");
  });

  it("includes a red accent color", () => {
    const { html } = buildOverdueAlert(baseInput);
    expect(html).toContain("#ef4444");
  });

  it("mentions 'past its due date' in the message", () => {
    const { html } = buildOverdueAlert(baseInput);
    expect(html).toContain("past its due date");
  });

  it("includes the formatted due date", () => {
    const { html } = buildOverdueAlert(baseInput);
    expect(html).toContain("May 15");
  });
});

describe("buildDueTomorrowAlert", () => {
  it("includes 'Due tomorrow' in the subject", () => {
    const { subject } = buildDueTomorrowAlert(baseInput);
    expect(subject).toContain("Due tomorrow");
  });

  it("includes task title and project name in the subject", () => {
    const { subject } = buildDueTomorrowAlert(baseInput);
    expect(subject).toContain("Write unit tests");
    expect(subject).toContain("Platform Upgrade");
  });

  it("addresses the assignee by name", () => {
    const { html } = buildDueTomorrowAlert(baseInput);
    expect(html).toContain("Bob");
  });

  it("includes the task title in the body", () => {
    const { html } = buildDueTomorrowAlert(baseInput);
    expect(html).toContain("Write unit tests");
  });

  it("includes a yellow accent color", () => {
    const { html } = buildDueTomorrowAlert(baseInput);
    expect(html).toContain("#eab308");
  });

  it("mentions 'due tomorrow' in the message body", () => {
    const { html } = buildDueTomorrowAlert(baseInput);
    expect(html.toLowerCase()).toContain("due tomorrow");
  });
});
