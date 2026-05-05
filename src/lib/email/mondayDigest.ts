import { escapeHtml } from "./escape";
import type { EmailContent } from "./resend";
import { bandwidthHexColor } from "@/lib/calculators/bandwidth";
export type { EmailContent };

export interface DigestTask {
  title: string;
  projectName: string;
  dueDate: Date;
}

export interface DigestInput {
  name: string;
  email: string;
  bandwidthPercent: number;
  tasks: DigestTask[];
  openActionItemCount: number;
  flaggedTaskCount: number;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function buildDigestEmail(input: DigestInput): EmailContent {
  const { name, bandwidthPercent, tasks, openActionItemCount, flaggedTaskCount } = input;

  const safeName = escapeHtml(name);
  const bandwidthColor = bandwidthHexColor(bandwidthPercent);

  const taskRows = tasks
    .map(
      (t) =>
        `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #374151;color:#d1d5db">${escapeHtml(t.title)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #374151;color:#6b7280">${escapeHtml(t.projectName)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #374151;color:#6b7280;white-space:nowrap">${formatDate(t.dueDate)}</td>
        </tr>`
    )
    .join("");

  const taskSection =
    tasks.length > 0
      ? `<table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr>
              <th style="text-align:left;padding:6px 8px;color:#9ca3af;font-size:12px;font-weight:600;border-bottom:1px solid #374151">Task</th>
              <th style="text-align:left;padding:6px 8px;color:#9ca3af;font-size:12px;font-weight:600;border-bottom:1px solid #374151">Project</th>
              <th style="text-align:left;padding:6px 8px;color:#9ca3af;font-size:12px;font-weight:600;border-bottom:1px solid #374151">Due</th>
            </tr>
          </thead>
          <tbody>${taskRows}</tbody>
        </table>`
      : `<p style="color:#6b7280;margin:16px 0">No tasks due this week.</p>`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#111827;font-family:system-ui,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px">
    <h1 style="color:#f9fafb;font-size:20px;margin:0 0 4px">Good morning, ${safeName}!</h1>
    <p style="color:#6b7280;margin:0 0 32px;font-size:14px">Here's your week ahead.</p>

    <div style="background:#1f2937;border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px">Bandwidth this week</p>
      <p style="color:${bandwidthColor};font-size:36px;font-weight:700;margin:0;line-height:1">${bandwidthPercent}%</p>
      <p style="color:#6b7280;font-size:13px;margin:4px 0 0">of your 40-hour week is committed</p>
    </div>

    <h2 style="color:#d1d5db;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px">Tasks Due This Week</h2>
    ${taskSection}

    ${openActionItemCount > 0 ? `<p style="color:#d1d5db;font-size:14px;margin:16px 0">You have <strong>${openActionItemCount}</strong> open action item${openActionItemCount !== 1 ? "s" : ""}.</p>` : ""}
    ${flaggedTaskCount > 0 ? `<p style="color:#fbbf24;font-size:14px;margin:8px 0">&#9888; <strong>${flaggedTaskCount}</strong> task${flaggedTaskCount !== 1 ? "s" : ""} need${flaggedTaskCount === 1 ? "s" : ""} an estimate.</p>` : ""}

    <hr style="border:none;border-top:1px solid #374151;margin:32px 0">
    <p style="color:#4b5563;font-size:12px;margin:0">Sent by your Project Dashboard · Unsubscribe not supported in v1</p>
  </div>
</body>
</html>`;

  return {
    subject: `${name}'s week ahead — ${bandwidthPercent}% bandwidth`,
    html,
  };
}
