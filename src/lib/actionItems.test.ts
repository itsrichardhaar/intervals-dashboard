import { describe, it, expect } from "vitest";
import { validateActionItemInput } from "./actionItems";

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

  it("accepts description with optional due date (due date handled by caller)", () => {
    // due date is optional — validation only checks description and assignee
    expect(
      validateActionItemInput({ description: "Send invoice", assigneeId: "user_xyz" })
    ).toBeNull();
  });
});
