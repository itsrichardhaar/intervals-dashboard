import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sortDailyFocusTasks, type DailyFocusTask } from "@/lib/dailyFocus";
import { isOverdue } from "@/lib/calculators/bandwidth";

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function DailyFocusPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const mapping = await prisma.userIntervalsMapping.findUnique({
    where: { userId: session.user.id },
  });

  const rawTasks = mapping
    ? await prisma.intervalsTask.findMany({
        where: {
          assigneeId: mapping.intervalsPersonId,
          status: { in: ["open", "in progress"] },
        },
        include: { project: { select: { id: true, name: true } } },
      })
    : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasks = sortDailyFocusTasks(
    rawTasks as DailyFocusTask[],
    today,
  );

  const overdueCount = tasks.filter((t) => t.overdue).length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-dash-text mb-1">Daily Focus</h1>
        <p className="text-dash-text-dim text-sm">
          {tasks.length > 0
            ? `${tasks.length} task${tasks.length !== 1 ? "s" : ""} to work on`
            : "Nothing on your plate right now"}
          {overdueCount > 0 && (
            <span className="ml-2 text-red-400">{overdueCount} overdue</span>
          )}
        </p>
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

      {/* Empty state */}
      {mapping && tasks.length === 0 && (
        <div className="rounded-lg border border-dash-border bg-dash-surface px-6 py-10 text-center">
          <p className="text-dash-text-muted text-sm">
            You're all clear — no open or in-progress tasks assigned to you.
          </p>
          <Link
            href="/my-work/tasks"
            className="inline-block mt-3 text-xs text-dash-accent hover:opacity-80 transition-opacity"
          >
            View all my tasks →
          </Link>
        </div>
      )}

      {/* Task list */}
      {mapping && tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((task) => {
            const overdue = task.overdue;
            const noDate = task.dueDate === null;
            const dueToday =
              !noDate &&
              !overdue &&
              task.dueDate!.toDateString() === today.toDateString();

            return (
              <Link
                key={task.id}
                href={`/projects/${task.project.id}`}
                className="block"
              >
                <div
                  className={`rounded-lg border px-4 py-3 transition-colors ${
                    overdue
                      ? "bg-red-950/30 border-red-900/50 hover:bg-red-950/40"
                      : dueToday
                        ? "bg-yellow-950/20 border-yellow-900/40 hover:bg-yellow-950/30"
                        : "bg-dash-surface border-dash-border hover:bg-dash-surface-2"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Title + project */}
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${overdue ? "text-red-300" : "text-dash-text"}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-dash-text-dim mt-0.5 truncate">{task.project.name}</p>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      {/* Status */}
                      {task.normalizedStatus === "in_progress" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-900/60 text-blue-300">
                          In Progress
                        </span>
                      )}

                      {/* Due date / overdue / no date */}
                      {overdue && (
                        <>
                          <span className="text-xs text-red-400 tabular-nums">{formatDate(task.dueDate)}</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-900/60 text-red-300">
                            Overdue
                          </span>
                        </>
                      )}
                      {dueToday && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-900/50 text-yellow-300">
                          Due today
                        </span>
                      )}
                      {!overdue && !dueToday && !noDate && (
                        <span className="text-xs text-dash-text-dim tabular-nums">{formatDate(task.dueDate)}</span>
                      )}
                      {noDate && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-dash-surface-2 text-dash-text-dim border border-dash-border">
                          No due date
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer link */}
      {mapping && tasks.length > 0 && (
        <div className="pt-2">
          <Link
            href="/my-work/tasks"
            className="text-xs text-dash-text-dim hover:text-dash-text-muted transition-colors"
          >
            View all tasks (including Internal Review &amp; Client Review) →
          </Link>
        </div>
      )}
    </div>
  );
}
