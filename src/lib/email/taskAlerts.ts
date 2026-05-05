import { escapeHtml } from "./escape";
import type { EmailContent } from "./resend";
export type { EmailContent };

export interface AlertTask {
  title: string;
  projectName: string;
  dueDate: Date;
}

export interface AlertInput {
  assigneeName: string;
  assigneeEmail: string;
  task: AlertTask;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function buildOverdueAlert(input: AlertInput): EmailContent {
  const { assigneeName, task } = input;
  const safeAssigneeName = escapeHtml(assigneeName);
  const safeTitle = escapeHtml(task.title);
  const safeProjectName = escapeHtml(task.projectName);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#111827;font-family:system-ui,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px">
    <div style="background:#1f2937;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px">
      <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em">Overdue task</p>
      <h2 style="color:#f9fafb;font-size:18px;margin:0 0 4px">${safeTitle}</h2>
      <p style="color:#6b7280;font-size:13px;margin:0">${safeProjectName} &middot; Was due ${formatDate(task.dueDate)}</p>
    </div>
    <p style="color:#d1d5db;font-size:14px;margin:0">Hi ${safeAssigneeName}, this task is past its due date and still open. Please update its status or reschedule.</p>
    <hr style="border:none;border-top:1px solid #374151;margin:32px 0">
    <p style="color:#4b5563;font-size:12px;margin:0">Project Dashboard alert</p>
  </div>
</body></html>`;

  return {
    subject: `Overdue: ${task.title} (${task.projectName})`,
    html,
  };
}

export function buildDueTomorrowAlert(input: AlertInput): EmailContent {
  const { assigneeName, task } = input;
  const safeAssigneeName = escapeHtml(assigneeName);
  const safeTitle = escapeHtml(task.title);
  const safeProjectName = escapeHtml(task.projectName);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#111827;font-family:system-ui,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px">
    <div style="background:#1f2937;border-left:4px solid #eab308;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px">
      <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em">Due tomorrow</p>
      <h2 style="color:#f9fafb;font-size:18px;margin:0 0 4px">${safeTitle}</h2>
      <p style="color:#6b7280;font-size:13px;margin:0">${safeProjectName} &middot; Due ${formatDate(task.dueDate)}</p>
    </div>
    <p style="color:#d1d5db;font-size:14px;margin:0">Hi ${safeAssigneeName}, this is a reminder that the above task is due tomorrow.</p>
    <hr style="border:none;border-top:1px solid #374151;margin:32px 0">
    <p style="color:#4b5563;font-size:12px;margin:0">Project Dashboard alert</p>
  </div>
</body></html>`;

  return {
    subject: `Due tomorrow: ${task.title} (${task.projectName})`,
    html,
  };
}
