import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calculateProjectStatus } from "@/lib/calculators/projectStatus";
import {
  calculateBandwidth,
  normalizeTaskStatus,
  isOverdue,
  type TaskInput,
  type TaskStatus,
} from "@/lib/calculators/bandwidth";
import { isCarriedOver, isActionItemOverdue } from "@/lib/actionItems";
import ProjectStatusControl from "@/components/ProjectStatusControl";
import CompleteActionItemButton from "@/components/CompleteActionItemButton";
import AddWeeklyStatusUpdateForm from "@/components/AddWeeklyStatusUpdateForm";
import AddActionItemForm from "@/components/AddActionItemForm";

type ProjectStatus = "on_track" | "at_risk" | "blocked";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_BADGE: Record<string, string> = {
  open: "bg-gray-700 text-gray-300",
  in_progress: "bg-blue-900/60 text-blue-300",
  in_internal_review: "bg-purple-900/60 text-purple-300",
  in_client_review: "bg-indigo-900/60 text-indigo-300",
  closed: "bg-green-900/60 text-green-300",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  in_internal_review: "Internal Review",
  in_client_review: "Client Review",
  closed: "Closed",
};

const UPDATE_STATUS_STYLES: Record<string, string> = {
  on_track: "bg-green-900/50 text-green-300 border border-green-700/50",
  at_risk:  "bg-yellow-900/50 text-yellow-300 border border-yellow-700/50",
  blocked:  "bg-red-900/50 text-red-300 border border-red-700/50",
};

const UPDATE_STATUS_LABELS: Record<string, string> = {
  on_track: "On Track",
  at_risk:  "At Risk",
  blocked:  "Blocked",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [project, actionItems, statusUpdates, users, milestones, documents] =
    await Promise.all([
      prisma.intervalsProject.findUnique({
        where: { id },
        include: {
          tasks: {
            orderBy: { dueDate: "asc" },
            include: { assignee: { select: { id: true, name: true } } },
          },
          projectStatusOverride: true,
        },
      }),
      prisma.actionItem.findMany({
        where: { projectId: id, completedAt: null },
        orderBy: { createdAt: "asc" },
        include: { assignee: { select: { id: true, name: true, email: true } } },
      }),
      prisma.weeklyStatusUpdate.findMany({
        where: { projectId: id },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { author: { select: { name: true, email: true } } },
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
      prisma.intervalsMilestone.findMany({
        where: { projectId: id },
        orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
      }),
      prisma.intervalsDocument.findMany({
        where: { projectId: id },
        orderBy: { title: "asc" },
      }),
    ]);

  if (!project) notFound();

  const isArchived = project.status === "inactive";

  // ── Per-assignee bandwidth ────────────────────────────────────────────────
  const assigneeIds = [
    ...new Set(project.tasks.map((t) => t.assigneeId).filter(Boolean)),
  ] as string[];

  const [allAssigneeTasks, assigneeMappings] = await Promise.all([
    assigneeIds.length > 0
      ? prisma.intervalsTask.findMany({
          where: { assigneeId: { in: assigneeIds } },
          select: {
            id: true,
            assigneeId: true,
            status: true,
            estimatedHours: true,
            loggedHours: true,
            dueDate: true,
            project: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    assigneeIds.length > 0
      ? prisma.userIntervalsMapping.findMany({
          where: { intervalsPersonId: { in: assigneeIds } },
          select: { intervalsPersonId: true },
        })
      : Promise.resolve([]),
  ]);

  const linkedPersonIds = new Set(assigneeMappings.map((m) => m.intervalsPersonId));
  const bandwidthByAssignee = new Map<string, number | null>();
  for (const personId of assigneeIds) {
    if (!linkedPersonIds.has(personId)) {
      bandwidthByAssignee.set(personId, null);
      continue;
    }
    const personTasks: TaskInput[] = allAssigneeTasks
      .filter((t) => t.assigneeId === personId)
      .map((t) => ({
        id: t.id,
        title: "",
        projectName: t.project.name,
        status: normalizeTaskStatus(t.status),
        estimatedHours: t.estimatedHours,
        loggedHours: t.loggedHours,
        dueDate: t.dueDate,
      }));
    const { bandwidthPercent } = calculateBandwidth(personTasks, "weekly");
    bandwidthByAssignee.set(personId, bandwidthPercent);
  }

  // ── Compute status ────────────────────────────────────────────────────────
  const totalEstimated = project.tasks.reduce(
    (s, t) => s + (t.estimatedHours ?? 0),
    0
  );
  const totalLogged = project.tasks.reduce((s, t) => s + t.loggedHours, 0);

  const autoStatus = calculateProjectStatus({
    estimatedHours: totalEstimated,
    loggedHours: totalLogged,
    startDate: project.startDate,
    dueDate: project.dueDate,
    tasks: project.tasks.map((t) => ({
      dueDate: t.dueDate,
      status: normalizeTaskStatus(t.status),
    })),
  });

  const override = project.projectStatusOverride;
  const effectiveStatus: ProjectStatus =
    (override?.status as ProjectStatus) ?? autoStatus;

  // ── Group tasks by assignee ───────────────────────────────────────────────
  const unassigned: typeof project.tasks = [];
  const byAssignee = new Map<string, { name: string; personId: string; tasks: typeof project.tasks }>();

  for (const task of project.tasks) {
    if (!task.assignee) {
      unassigned.push(task);
    } else {
      const existing = byAssignee.get(task.assignee.id);
      if (existing) {
        existing.tasks.push(task);
      } else {
        byAssignee.set(task.assignee.id, {
          name: task.assignee.name,
          personId: task.assignee.id,
          tasks: [task],
        });
      }
    }
  }

  // Sort assignee groups alphabetically
  const assigneeGroups = Array.from(byAssignee.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  if (unassigned.length > 0) {
    assigneeGroups.push({ name: "Unassigned", personId: "", tasks: unassigned });
  }

  const budgetPct =
    totalEstimated > 0
      ? Math.round((totalLogged / totalEstimated) * 100)
      : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Breadcrumb */}
      <Link
        href={isArchived ? "/projects/archive" : "/projects"}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        ← {isArchived ? "Archive" : "Projects"}
      </Link>

      {/* Archived notice */}
      {isArchived && (
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
          <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">Archived</span>
          <span className="text-gray-600 text-xs">This project is no longer active. History is read-only.</span>
        </div>
      )}

      {/* Project header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
          {project.clientName && (
            <p className="text-gray-400 mt-1">{project.clientName}</p>
          )}
        </div>
        <ProjectStatusControl
          projectId={project.id}
          status={effectiveStatus}
          hasOverride={!!override}
          blockedReason={override?.reason ?? null}
        />
      </div>

      {/* Budget summary */}
      {totalEstimated > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Budget hours</span>
            <span
              className={`tabular-nums font-medium ${
                budgetPct !== null && budgetPct > 100 ? "text-red-400" : "text-white"
              }`}
            >
              {totalLogged.toFixed(1)}h logged / {totalEstimated.toFixed(1)}h estimated
              {budgetPct !== null && (
                <span className="text-gray-500 font-normal ml-2">({budgetPct}%)</span>
              )}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${
                budgetPct !== null && budgetPct > 100
                  ? "bg-red-500"
                  : budgetPct !== null && budgetPct >= 80
                    ? "bg-yellow-400"
                    : "bg-green-500"
              }`}
              style={{ width: `${Math.min(100, budgetPct ?? 0)}%` }}
            />
          </div>
          {budgetPct !== null && budgetPct > 100 && (
            <p className="text-xs text-red-400/70">
              {(totalLogged - totalEstimated).toFixed(1)}h over budget
            </p>
          )}
        </div>
      )}

      {/* Tasks by assignee */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
          Tasks
          <span className="ml-2 text-gray-600 normal-case font-normal">
            {project.tasks.length} total
          </span>
        </h2>

        {project.tasks.length === 0 ? (
          <p className="text-gray-600 text-sm">No tasks on this project yet.</p>
        ) : (
          <div className="space-y-4">
            {assigneeGroups.map((group) => (
              <div key={group.name} className="rounded-lg border border-gray-800 overflow-hidden">
                <div className="bg-gray-900 px-4 py-2.5 border-b border-gray-800 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-300">{group.name}</span>
                    <span className="ml-2 text-xs text-gray-600">
                      {group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {group.personId && (() => {
                    const bw = bandwidthByAssignee.get(group.personId);
                    if (bw === undefined) return null;
                    if (bw === null) return (
                      <span className="text-xs text-gray-600">Not linked</span>
                    );
                    const color = bw >= 90 ? "text-red-400" : bw >= 70 ? "text-yellow-400" : "text-green-400";
                    return (
                      <span className={`text-xs font-medium tabular-nums ${color}`}>
                        {bw}% bandwidth
                      </span>
                    );
                  })()}
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-800">
                    {group.tasks.map((task) => {
                      const norm = normalizeTaskStatus(task.status);
                      const flagged = !task.estimatedHours;
                      const overdue = isOverdue(task.dueDate);
                      return (
                        <tr
                          key={task.id}
                          className={`${flagged ? "bg-yellow-950/20" : "bg-gray-950"} hover:bg-gray-900 transition-colors`}
                        >
                          <td className="px-4 py-2.5 max-w-0 w-full">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium truncate ${
                                  overdue ? "text-red-300" : "text-white"
                                }`}
                              >
                                {task.title}
                              </span>
                              {flagged && (
                                <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-900/50 text-yellow-400">
                                  Missing estimate
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap hidden sm:table-cell">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[norm] ?? "bg-gray-700 text-gray-300"}`}
                            >
                              {STATUS_LABEL[norm] ?? task.status}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-2.5 text-xs whitespace-nowrap hidden md:table-cell ${
                              overdue ? "text-red-400" : "text-gray-500"
                            }`}
                          >
                            {formatDate(task.dueDate)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500 text-right whitespace-nowrap hidden lg:table-cell tabular-nums">
                            {task.estimatedHours != null
                              ? `${task.estimatedHours}h`
                              : "—"}{" "}
                            / {task.loggedHours > 0 ? `${task.loggedHours}h` : "0h"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Action items */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Action Items
          </h2>
          {!isArchived && <AddActionItemForm projectId={project.id} users={users} />}
        </div>

        {actionItems.length === 0 ? (
          <p className="text-gray-600 text-sm">No open action items.</p>
        ) : (
          <div className="space-y-2">
            {actionItems.map((item) => {
              const overdue = isActionItemOverdue({ dueDate: item.dueDate, completedAt: null });
              const carriedOver = isCarriedOver({ createdAt: item.createdAt, completedAt: null });
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-white text-sm">{item.description}</p>
                      {carriedOver && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-900/50 text-yellow-300">
                          Carried over
                        </span>
                      )}
                      {overdue && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-900/50 text-red-300">
                          Overdue
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{item.assignee.name ?? item.assignee.email}</span>
                      {item.dueDate && (
                        <span className={overdue ? "text-red-400" : ""}>
                          Due {formatDate(item.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <CompleteActionItemButton id={item.id} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Weekly status updates */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Status Updates
          </h2>
          {!isArchived && <AddWeeklyStatusUpdateForm projectId={project.id} />}
        </div>

        {statusUpdates.length === 0 ? (
          <p className="text-gray-600 text-sm">No updates yet.</p>
        ) : (
          <div className="space-y-3">
            {statusUpdates.map((update) => (
              <div
                key={update.id}
                className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 space-y-2"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                      UPDATE_STATUS_STYLES[update.status] ?? "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {UPDATE_STATUS_LABELS[update.status] ?? update.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {update.author.name ?? update.author.email} ·{" "}
                    {formatDateTime(update.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {update.summary}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Milestones */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
          Milestones
        </h2>
        {milestones.length === 0 ? (
          <p className="text-gray-600 text-sm">No milestones for this project.</p>
        ) : (
          <div className="rounded-lg border border-gray-800 overflow-hidden divide-y divide-gray-800">
            {milestones.map((m) => {
              const overdueMilestone =
                !m.completed && m.dueDate !== null && m.dueDate < new Date();
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-4 px-4 py-3 ${
                    m.completed ? "bg-gray-900/40" : "bg-gray-950"
                  }`}
                >
                  <span
                    className={`text-sm ${
                      m.completed ? "text-gray-500 line-through" : overdueMilestone ? "text-red-300" : "text-white"
                    }`}
                  >
                    {m.title}
                  </span>
                  {m.dueDate && (
                    <span
                      className={`ml-auto text-xs whitespace-nowrap ${
                        m.completed
                          ? "text-gray-600"
                          : overdueMilestone
                            ? "text-red-400"
                            : "text-gray-500"
                      }`}
                    >
                      {overdueMilestone && "⚠ "}
                      {formatDate(m.dueDate)}
                    </span>
                  )}
                  {m.completed && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-900/40 text-green-600">
                      Done
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Documents */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
          Documents
        </h2>
        {documents.length === 0 ? (
          <p className="text-gray-600 text-sm">No documents for this project.</p>
        ) : (
          <div className="rounded-lg border border-gray-800 overflow-hidden divide-y divide-gray-800">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center px-4 py-3 bg-gray-950">
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {doc.title}
                  </a>
                ) : (
                  <span className="text-sm text-gray-300">{doc.title}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
