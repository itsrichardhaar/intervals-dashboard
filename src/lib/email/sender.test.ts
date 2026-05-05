import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendOverdueAlert, sendDueTomorrowAlert, sendFlaggedTaskAlert, sendBudgetAlert } from "./sender";

// ── Prisma mock ───────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailSentLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    intervalsTask: {
      findUnique: vi.fn(),
    },
    intervalsProject: {
      findUnique: vi.fn(),
    },
    actionItem: {
      count: vi.fn(),
    },
  },
}));

const mockSend = vi.fn();

vi.mock("./resend", () => ({
  getResend: vi.fn(() => ({ emails: { send: mockSend } })),
  FROM_ADDRESS: "test@example.com",
}));

import { prisma } from "@/lib/prisma";

const mockLog = prisma.emailSentLog as unknown as {
  findFirst: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
};
const mockTask = prisma.intervalsTask as unknown as { findUnique: ReturnType<typeof vi.fn> };
const mockProject = prisma.intervalsProject as unknown as { findUnique: ReturnType<typeof vi.fn> };

function makeTask(overrides = {}) {
  return {
    id: "task-1",
    title: "Write tests",
    status: "open",
    dueDate: new Date("2026-05-01"),
    estimatedHours: 8,
    loggedHours: 2,
    project: { id: "proj-1", name: "Alpha Project" },
    assignee: { id: "person-1", name: "Alice", email: "alice@example.com" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLog.findFirst.mockResolvedValue(null);
  mockLog.create.mockResolvedValue({});
  mockSend.mockResolvedValue({});
});

// ── sendOverdueAlert ──────────────────────────────────────────────────────────

describe("sendOverdueAlert", () => {
  it("returns 'sent' and writes log when email sends successfully", async () => {
    mockTask.findUnique.mockResolvedValue(makeTask());

    const result = await sendOverdueAlert("task-1");

    expect(result).toBe("sent");
    expect(mockLog.create).toHaveBeenCalledWith({
      data: { taskId: "task-1", alertType: "overdue" },
    });
  });

  it("returns 'skipped' when a log entry already exists today", async () => {
    mockLog.findFirst.mockResolvedValue({ id: "log-1" });

    const result = await sendOverdueAlert("task-1");

    expect(result).toBe("skipped");
    expect(mockTask.findUnique).not.toHaveBeenCalled();
  });

  it("returns 'skipped' when the task has no assignee email", async () => {
    mockTask.findUnique.mockResolvedValue(makeTask({ assignee: { name: "Ghost", email: null } }));

    const result = await sendOverdueAlert("task-1");

    expect(result).toBe("skipped");
    expect(mockLog.create).not.toHaveBeenCalled();
  });

  it("returns 'skipped' when the task is not found", async () => {
    mockTask.findUnique.mockResolvedValue(null);

    const result = await sendOverdueAlert("task-missing");

    expect(result).toBe("skipped");
  });

  it("returns 'error' when Resend throws", async () => {
    mockTask.findUnique.mockResolvedValue(makeTask());
    mockSend.mockRejectedValue(new Error("Resend down"));

    const result = await sendOverdueAlert("task-1");

    expect(result).toBe("error");
    expect(mockLog.create).not.toHaveBeenCalled();
  });
});

// ── sendDueTomorrowAlert ──────────────────────────────────────────────────────

describe("sendDueTomorrowAlert", () => {
  it("returns 'sent' on success", async () => {
    mockTask.findUnique.mockResolvedValue(makeTask());

    const result = await sendDueTomorrowAlert("task-1");

    expect(result).toBe("sent");
    expect(mockLog.create).toHaveBeenCalledWith({
      data: { taskId: "task-1", alertType: "due_tomorrow" },
    });
  });

  it("returns 'skipped' when already logged today", async () => {
    mockLog.findFirst.mockResolvedValue({ id: "log-2" });

    const result = await sendDueTomorrowAlert("task-1");

    expect(result).toBe("skipped");
  });
});

// ── sendFlaggedTaskAlert ──────────────────────────────────────────────────────

describe("sendFlaggedTaskAlert", () => {
  it("returns 'sent' on success", async () => {
    mockTask.findUnique.mockResolvedValue(makeTask({ estimatedHours: null }));

    const result = await sendFlaggedTaskAlert("task-1");

    expect(result).toBe("sent");
    expect(mockLog.create).toHaveBeenCalledWith({
      data: { taskId: "task-1", alertType: "flagged_task" },
    });
  });

  it("returns 'skipped' when already logged today", async () => {
    mockLog.findFirst.mockResolvedValue({ id: "log-3" });

    const result = await sendFlaggedTaskAlert("task-1");

    expect(result).toBe("skipped");
  });
});

// ── sendBudgetAlert ───────────────────────────────────────────────────────────

describe("sendBudgetAlert", () => {
  beforeEach(() => {
    vi.stubEnv("ALERT_EMAIL", "admin@example.com");
  });

  it("returns 'skipped' when ALERT_EMAIL is not set", async () => {
    vi.unstubAllEnvs();
    const result = await sendBudgetAlert("proj-1");
    expect(result).toBe("skipped");
  });

  it("returns 'skipped' when project budget is under 80%", async () => {
    mockProject.findUnique.mockResolvedValue({
      id: "proj-1",
      name: "Beta Project",
      estimatedHours: 100,
      tasks: [{ loggedHours: 50 }],
    });

    const result = await sendBudgetAlert("proj-1");

    expect(result).toBe("skipped");
    expect(mockLog.create).not.toHaveBeenCalled();
  });

  it("returns 'sent' when project budget exceeds 80%", async () => {
    mockProject.findUnique.mockResolvedValue({
      id: "proj-1",
      name: "Beta Project",
      estimatedHours: 100,
      tasks: [{ loggedHours: 85 }],
    });

    const result = await sendBudgetAlert("proj-1");

    expect(result).toBe("sent");
    expect(mockLog.create).toHaveBeenCalledWith({
      data: { projectId: "proj-1", alertType: "budget_warning" },
    });
  });

  it("returns 'skipped' when already logged today", async () => {
    mockLog.findFirst.mockResolvedValue({ id: "log-4" });

    const result = await sendBudgetAlert("proj-1");

    expect(result).toBe("skipped");
    expect(mockProject.findUnique).not.toHaveBeenCalled();
  });
});
