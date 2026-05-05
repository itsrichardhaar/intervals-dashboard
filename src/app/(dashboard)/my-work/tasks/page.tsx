import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  normalizeTaskStatus,
  isOverdue,
  QUALIFYING_STATUSES,
  type TaskStatus,
} from "@/lib/calculators/bandwidth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: TaskStatus | "closed" }) {
  const styles: Record<string, string> = {
    open: "bg-gray-700 text-gray-300",
    in_progress: "bg-blue-900/60 text-blue-300",
    in_internal_review: "bg-purple-900/60 text-purple-300",
    in_client_review: "bg-indigo-900/60 text-indigo-300",
    closed: "bg-green-900/60 text-green-300",
  };
  const labels: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    in_internal_review: "Internal Review",
    in_client_review: "Client Review",
    closed: "Closed",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? "bg-gray-700 text-gray-300"}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AllMyTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { show } = await searchParams;
  const showClosed = show === "all";

  const mapping = await prisma.userIntervalsMapping.findUnique({
    where: { userId: session.user.id },
  });

  const rawTasks = mapping
    ? await prisma.intervalsTask.findMany({
        where: {
          assigneeId: mapping.intervalsPersonId,
          ...(showClosed ? {} : { status: { not: "closed" } }),
        },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { dueDate: "asc" },
      })
    : [];

  // Sort: overdue first, then by due date asc, then no-date tasks last
  const tasks = rawTasks
    .map((t) => ({
      ...t,
      normalizedStatus: normalizeTaskStatus(t.status),
    }))
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

  const openCount = tasks.filter((t) => QUALIFYING_STATUSES.includes(t.normalizedStatus)).length;
  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate) && QUALIFYING_STATUSES.includes(t.normalizedStatus)).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white mb-1">All My Tasks</h1>
          <p className="text-gray-500 text-sm">
            {openCount} open task{openCount !== 1 ? "s" : ""}
            {overdueCount > 0 && (
              <span className="ml-2 text-red-400">{overdueCount} overdue</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/my-work/tasks"
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              !showClosed ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            Open
          </a>
          <a
            href="/my-work/tasks?show=all"
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              showClosed ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            All
          </a>
        </div>
      </div>

      {/* No mapping warning */}
      {!mapping && (
        <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg px-4 py-3">
          <span className="text-yellow-400 mt-0.5">⚠</span>
          <p className="text-yellow-300 text-sm">
            Your account is not linked to Intervals yet.{" "}
            <a href="/settings" className="underline hover:text-yellow-200">
              Go to Settings to fix this.
            </a>
          </p>
        </div>
      )}

      {/* Task table */}
      {mapping && (
        tasks.length === 0 ? (
          <p className="text-gray-600 text-sm">
            {showClosed ? "No tasks assigned to you." : "No open tasks — you're all clear."}
          </p>
        ) : (
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Task</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">Project</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Due</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium hidden lg:table-cell">Est / Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {tasks.map((task) => {
                  const overdue = isOverdue(task.dueDate) && QUALIFYING_STATUSES.includes(task.normalizedStatus);
                  return (
                    <tr
                      key={task.id}
                      className={`${overdue ? "bg-red-950/30" : "bg-gray-950"} hover:bg-gray-900`}
                    >
                      <td className="px-4 py-3">
                        <span className={`font-medium ${overdue ? "text-red-300" : "text-white"}`}>
                          {task.title}
                        </span>
                        {!task.estimatedHours && QUALIFYING_STATUSES.includes(task.normalizedStatus) && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-900/50 text-yellow-400">
                            No estimate
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{task.project.name}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={task.normalizedStatus} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={overdue ? "text-red-400 font-medium" : "text-gray-400"}>
                          {formatDate(task.dueDate)}
                        </span>
                        {overdue && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-900/60 text-red-300">
                            Overdue
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 hidden lg:table-cell tabular-nums">
                        {task.estimatedHours !== null ? `${task.estimatedHours}h` : "—"}
                        {" / "}
                        {task.loggedHours > 0 ? `${task.loggedHours}h` : "0h"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
