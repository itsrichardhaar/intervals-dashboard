import { describe, it, expect } from "vitest";
import { buildBudgetAlert, buildFlaggedTaskAlert } from "./projectAlerts";

describe("buildBudgetAlert", () => {
  const baseInput = {
    projectName: "Acme Website",
    budgetPercent: 85,
    loggedHours: 34,
    estimatedHours: 40,
  };

  it("includes 'Budget alert' in the subject", () => {
    const { subject } = buildBudgetAlert(baseInput);
    expect(subject).toContain("Budget alert");
  });

  it("includes the project name in the subject", () => {
    const { subject } = buildBudgetAlert(baseInput);
    expect(subject).toContain("Acme Website");
  });

  it("includes the percent in the subject", () => {
    const { subject } = buildBudgetAlert(baseInput);
    expect(subject).toContain("85%");
  });

  it("includes the project name in the body", () => {
    const { html } = buildBudgetAlert(baseInput);
    expect(html).toContain("Acme Website");
  });

  it("includes the budget percent in the body", () => {
    const { html } = buildBudgetAlert(baseInput);
    expect(html).toContain("85%");
  });

  it("shows logged and estimated hours", () => {
    const { html } = buildBudgetAlert(baseInput);
    expect(html).toContain("34.0h");
    expect(html).toContain("40.0h");
  });

  it("uses a yellow accent color", () => {
    const { html } = buildBudgetAlert(baseInput);
    expect(html).toContain("#eab308");
  });

  it("mentions 80% budget threshold in the message", () => {
    const { html } = buildBudgetAlert(baseInput);
    expect(html).toContain("80%");
  });
});

describe("buildFlaggedTaskAlert", () => {
  const baseInput = {
    assigneeName: "Carol",
    assigneeEmail: "carol@example.com",
    taskTitle: "Implement login flow",
    projectName: "Auth Overhaul",
  };

  it("includes 'Missing estimate' in the subject", () => {
    const { subject } = buildFlaggedTaskAlert(baseInput);
    expect(subject).toContain("Missing estimate");
  });

  it("includes the task title in the subject", () => {
    const { subject } = buildFlaggedTaskAlert(baseInput);
    expect(subject).toContain("Implement login flow");
  });

  it("includes the project name in the subject", () => {
    const { subject } = buildFlaggedTaskAlert(baseInput);
    expect(subject).toContain("Auth Overhaul");
  });

  it("addresses the assignee by name", () => {
    const { html } = buildFlaggedTaskAlert(baseInput);
    expect(html).toContain("Carol");
  });

  it("includes the task title in the body", () => {
    const { html } = buildFlaggedTaskAlert(baseInput);
    expect(html).toContain("Implement login flow");
  });

  it("includes the project name in the body", () => {
    const { html } = buildFlaggedTaskAlert(baseInput);
    expect(html).toContain("Auth Overhaul");
  });

  it("uses a red accent color", () => {
    const { html } = buildFlaggedTaskAlert(baseInput);
    expect(html).toContain("#ef4444");
  });

  it("instructs the user to add an estimate in Intervals", () => {
    const { html } = buildFlaggedTaskAlert(baseInput);
    expect(html).toContain("estimate");
    expect(html).toContain("Intervals");
  });
});
