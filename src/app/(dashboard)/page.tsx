import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import {
  calculateBandwidth,
  normalizeTaskStatus,
  isOverdue,
  QUALIFYING_STATUSES,
  type TaskInput,
  type TaskStatus,
} from "@/lib/calculators/bandwidth";
import { startOfCurrentWeek, isThisWeek, parseTimeWindow } from "@/lib/dates";
import CompleteActionItemButton from "@/components/CompleteActionItemButton";
import TimeWindowToggle from "@/components/TimeWindowToggle";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    open: "bg-gray-700 text-gray-300",
    in_progress: "bg-blue-900/60 text-blue-300",
    in_internal_review: "bg-purple-900/60 text-purple-300",
    in_client_review: "bg-indigo-900/60 text-indigo-300",
    closed: "bg-green-900/60 text-green-300",
  };
  const labels: Record<TaskStatus, string> = {
    open: "Open",
    in_progress: "In Progress",
    in_internal_review: "Internal Review",
    in_client_review: "Client Review",
    closed: "Closed",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function BandwidthBar({ percent }: { percent: number }) {
  const color =
    percent >= 90
      ? "bg-red-500"
      : percent >= 70
        ? "bg-yellow-400"
        : "bg-green-500";

  const textColor =
    percent >= 90
      ? "text-red-400"
      : percent >= 70
        ? "text-yellow-400"
        : "text-green-400";

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <p className={`text-4xl font-bold tabular-nums ${textColor}`}>
          {percent}%
          <span className="text-sm font-normal text-gray-400 ml-2">
            of your week is committed
          </span>
        </p>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { window: windowParam } = await searchParams;
  const timeWindow = parseTimeWindow(windowParam);

  const userId = session.user.id;
  const firstName = session.user.name?.split(" ")[0] ?? "";

  // ── 1. Check Intervals mapping ──────────────────────────────────────────────
  const mapping = await prisma.userIntervalsMapping.findUnique({
    where: { userId },
    include: { intervalsPerson: true },
  });

  // ── 2. Fetch tasks assigned to this user ────────────────────────────────────
  const rawTasks = mapping
    ? await prisma.intervalsTask.findMany({
        where: { assigneeId: mapping.intervalsPersonId },
        include: { project: { select: { id: true, name: true, clientName: true } } },
        orderBy: { dueDate: "asc" },
      })
    : [];

  // ── 3. Map to TaskInput ─────────────────────────────────────────────────────
  const tasks: TaskInput[] = rawTasks.map((t) => ({
    id: t.id,
    title: t.title,
    projectName: t.project.name,
    status: normalizeTaskStatus(t.status),
    estimatedHours: t.estimatedHours ?? null,
    loggedHours: t.loggedHours,
    dueDate: t.dueDate,
  }));

  // ── 4. Calculate bandwidth ──────────────────────────────────────────────────
  const bandwidth = calculateBandwidth(tasks, timeWindow);

  // ── 5. Tasks this week (sorted: overdue first, then by due date) ────────────
  const tasksThisWeek = tasks
    .filter(
      (t) =>
        QUALIFYING_STATUSES.includes(t.status) && isThisWeek(t.dueDate)
    )
    .sort((a, b) => {
      const aOver = isOverdue(a.dueDate);
      const bOver = isOverdue(b.dueDate);
      if (aOver && !bOver) return -1;
      if (!aOver && bOver) return 1;
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });

  // ── 6. Derive active projects from tasks ───────────────────────────────────
  const activeProjectMap = new Map<string, { id: string; name: string; clientName: string | null; openTaskCount: number }>();
  for (const t of rawTasks) {
    if (!QUALIFYING_STATUSES.includes(normalizeTaskStatus(t.status))) continue;
    const existing = activeProjectMap.get(t.project.id);
    if (existing) {
      existing.openTaskCount++;
    } else {
      activeProjectMap.set(t.project.id, { id: t.project.id, name: t.project.name, clientName: t.project.clientName, openTaskCount: 1 });
    }
  }
  const activeProjects = Array.from(activeProjectMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  // ── 7. Fetch action items ───────────────────────────────────────────────────
  const actionItems = await prisma.actionItem.findMany({
    where: { assigneeId: userId, completedAt: null },
    include: { project: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const weekStart = startOfCurrentWeek();
  const now = new Date();
  // actionItems now referenced below (renamed from step 6 → step 7, no code change needed)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white mb-1">
          Good morning{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-gray-500 text-sm">Personal Home</p>
      </div>

      {/* Intervals not linked notice */}
      {!mapping && (
        <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg px-4 py-3">
          <span className="text-yellow-400 mt-0.5">⚠</span>
          <p className="text-yellow-300 text-sm">
            Your account is not linked to Intervals yet.{" "}
            <Link href="/settings" className="underline hover:text-yellow-200">
              Go to Settings to fix this.
            </Link>
          </p>
        </div>
      )}

      {/* ── Bandwidth ── */}
      {mapping && (
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bandwidth</p>
            <Suspense>
              <TimeWindowToggle current={timeWindow} />
            </Suspense>
          </div>
          <BandwidthBar percent={bandwidth.bandwidthPercent} />
          <p className="text-gray-400 text-sm">
            You have{" "}
            <span className="text-white font-medium">
              {bandwidth.availableBandwidthPercent}% available
            </span>{" "}
            this week
            {bandwidth.remainingHours > 0 && (
              <>
                {" "}
                ({bandwidth.remainingHours.toFixed(1)}h remaining of 40h)
              </>
            )}
          </p>
        </section>
      )}

      {/* ── My Action Items ── */}
      {actionItems.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            My Action Items
          </h2>
          <div className="space-y-2">
            {actionItems.map((item) => {
              const carriedOver = item.createdAt < weekStart;
              const overdue =
                item.dueDate !== null && item.dueDate < now;

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-white text-sm">{item.description}</p>
                      {carriedOver && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-900/50 text-yellow-300">
                          Carried over
                        </span>
                      )}
                      {overdue && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-300">
                          Overdue
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {item.project && (
                        <span>{item.project.name}</span>
                      )}
                      {item.dueDate && (
                        <span>Due {formatDate(item.dueDate)}</span>
                      )}
                    </div>
                  </div>
                  <CompleteActionItemButton id={item.id} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Tasks This Week ── */}
      {mapping && (
        <section>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            Tasks This Week
          </h2>
          {tasksThisWeek.length === 0 ? (
            <p className="text-gray-600 text-sm">
              No tasks due this week.
            </p>
          ) : (
            <div className="rounded-lg border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Task
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">
                      Project
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Due
                    </th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium hidden md:table-cell">
                      Est / Logged
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium hidden lg:table-cell">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {tasksThisWeek.map((task) => {
                    const overdue = isOverdue(task.dueDate);
                    return (
                      <tr
                        key={task.id}
                        className={`${overdue ? "bg-red-950/30" : "bg-gray-950"} hover:bg-gray-900`}
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`font-medium ${overdue ? "text-red-300" : "text-white"}`}
                          >
                            {task.title}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                          {task.projectName}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-medium ${overdue ? "text-red-400" : "text-gray-300"}`}
                          >
                            {formatDate(task.dueDate)}
                          </span>
                          {overdue && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-900/60 text-red-300">
                              Overdue
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400 hidden md:table-cell tabular-nums">
                          {task.estimatedHours !== null
                            ? `${task.estimatedHours}h`
                            : "—"}{" "}
                          /{" "}
                          {task.loggedHours > 0
                            ? `${task.loggedHours}h`
                            : "0h"}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <StatusBadge status={task.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── My Active Projects ── */}
      {mapping && activeProjects.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            My Active Projects
          </h2>
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Project</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">Client</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Open Tasks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {activeProjects.map((p) => (
                  <tr key={p.id} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/projects/${p.id}`} className="text-white font-medium hover:text-blue-300 transition-colors">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                      {p.clientName ?? <span className="text-gray-700">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 tabular-nums">
                      {p.openTaskCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Flagged Tasks ── */}
      {mapping && bandwidth.flaggedTasks.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            Flagged Tasks — Estimates Missing
          </h2>
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">
                    Task
                  </th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">
                    Project
                  </th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">
                    Flag
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {bandwidth.flaggedTasks.map((task) => (
                  <tr key={task.id} className="bg-gray-950 hover:bg-gray-900">
                    <td className="px-4 py-3 text-white font-medium">
                      {task.title}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                      {task.projectName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/60 text-red-300">
                        Missing estimate
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
