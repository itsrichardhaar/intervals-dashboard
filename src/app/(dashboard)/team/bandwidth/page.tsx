import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import {
  calculateBandwidth,
  normalizeTaskStatus,
  bandwidthBarColor,
  bandwidthTextColor,
  type TaskInput,
} from "@/lib/calculators/bandwidth";
import { parseTimeWindow } from "@/lib/dates";
import TimeWindowToggle from "@/components/TimeWindowToggle";

function BandwidthRow({
  name,
  email,
  percent,
  available,
  remaining,
}: {
  name: string | null;
  email: string;
  percent: number;
  available: number;
  remaining: number;
}) {
  const color = bandwidthBarColor(percent);
  const textColor = bandwidthTextColor(percent);

  return (
    <tr className="bg-dash-bg hover:bg-dash-surface transition-colors">
      <td className="px-4 py-4">
        <p className="text-dash-text font-medium text-sm">{name ?? email}</p>
        {name && <p className="text-dash-text-dim text-xs mt-0.5">{email}</p>}
      </td>
      <td className="px-4 py-4 w-[40%]">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-semibold tabular-nums ${textColor}`}>{percent}%</span>
            <span className="text-dash-text-dim tabular-nums">{available}% available</span>
          </div>
          <div className="w-full bg-dash-surface-2 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${color} transition-all`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-right hidden md:table-cell">
        <span className="text-sm tabular-nums text-dash-text">
          {remaining.toFixed(1)}h
        </span>
        <p className="text-xs text-dash-text-dim">remaining</p>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TeamBandwidthPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { window: windowParam } = await searchParams;
  const timeWindow = parseTimeWindow(windowParam);

  // Two queries: all users + all tasks for mapped persons
  const [users, mappings, allTasks] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.userIntervalsMapping.findMany({
      select: { userId: true, intervalsPersonId: true },
    }),
    prisma.intervalsTask.findMany({
      select: {
        id: true,
        title: true,
        assigneeId: true,
        status: true,
        estimatedHours: true,
        loggedHours: true,
        dueDate: true,
        project: { select: { name: true } },
      },
    }),
  ]);

  // Index mappings by userId and by intervalsPersonId
  const mappingByUserId = new Map(mappings.map((m) => [m.userId, m.intervalsPersonId]));

  // Group tasks by assigneeId (intervalsPersonId)
  const tasksByPerson = new Map<string, TaskInput[]>();
  for (const task of allTasks) {
    if (!task.assigneeId) continue;
    const list = tasksByPerson.get(task.assigneeId) ?? [];
    list.push({
      id: task.id,
      title: task.title,
      projectName: task.project.name,
      status: normalizeTaskStatus(task.status),
      estimatedHours: task.estimatedHours ?? null,
      loggedHours: task.loggedHours,
      dueDate: task.dueDate,
    });
    tasksByPerson.set(task.assigneeId, list);
  }

  const rows = users.map((user) => {
    const personId = mappingByUserId.get(user.id);
    if (!personId) return { user, linked: false, bandwidth: null };

    const tasks = tasksByPerson.get(personId) ?? [];
    const bandwidth = calculateBandwidth(tasks, timeWindow);
    return { user, linked: true, bandwidth };
  });

  const linked = rows.filter((r) => r.linked);
  const unlinked = rows.filter((r) => !r.linked);

  const windowLabel =
    timeWindow === "weekly"
      ? "this week"
      : timeWindow === "monthly"
        ? "this month"
        : "this quarter";

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-dash-text mb-1">Team Bandwidth</h1>
          <p className="text-dash-text-dim text-sm">
            {linked.length} linked member{linked.length !== 1 ? "s" : ""} ·{" "}
            remaining capacity {windowLabel}
          </p>
        </div>
        <Suspense>
          <TimeWindowToggle current={timeWindow} />
        </Suspense>
      </div>

      {linked.length > 0 && (
        <div className="rounded-lg border border-dash-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-dash-surface">
              <tr>
                <th className="text-left px-4 py-3 text-dash-text-muted text-sm font-medium">
                  Team member
                </th>
                <th className="text-left px-4 py-3 text-dash-text-muted text-sm font-medium w-[40%]">
                  Bandwidth
                </th>
                <th className="text-right px-4 py-3 text-dash-text-muted text-sm font-medium hidden md:table-cell">
                  Remaining
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dash-border">
              {linked.map(({ user, bandwidth }) => (
                <BandwidthRow
                  key={user.id}
                  name={user.name}
                  email={user.email}
                  percent={bandwidth!.bandwidthPercent}
                  available={bandwidth!.availableBandwidthPercent}
                  remaining={bandwidth!.remainingHours}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {unlinked.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-dash-text-muted uppercase tracking-wide mb-3">
            Not linked to Intervals
          </h2>
          <div className="rounded-lg border border-dash-border divide-y divide-dash-border overflow-hidden">
            {unlinked.map(({ user }) => (
              <div
                key={user.id}
                className="flex items-center justify-between px-4 py-3 bg-dash-bg"
              >
                <div>
                  <p className="text-dash-text-muted text-sm">{user.name ?? user.email}</p>
                  {user.name && (
                    <p className="text-dash-text-dim text-xs">{user.email}</p>
                  )}
                </div>
                <span className="text-xs text-dash-text-dim bg-dash-surface-2 px-2 py-1 rounded">
                  No Intervals mapping
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
