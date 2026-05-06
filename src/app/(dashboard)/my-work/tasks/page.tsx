import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeTaskStatus, isOverdue } from "@/lib/calculators/bandwidth";
import FilteredTaskList, { type SerializedTask } from "@/components/FilteredTaskList";

export default async function AllMyTasksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const mapping = await prisma.userIntervalsMapping.findUnique({
    where: { userId: session.user.id },
  });

  const rawTasks = mapping
    ? await prisma.intervalsTask.findMany({
        where: { assigneeId: mapping.intervalsPersonId },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { dueDate: "asc" },
      })
    : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasks: SerializedTask[] = rawTasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    normalizedStatus: normalizeTaskStatus(t.status),
    overdue: isOverdue(t.dueDate),
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    estimatedHours: t.estimatedHours,
    loggedHours: t.loggedHours,
    project: { id: t.project.id, name: t.project.name },
  }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* No mapping warning */}
      {!mapping && (
        <div>
          <h1 className="text-xl font-semibold text-dash-text mb-6">All My Tasks</h1>
          <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg px-4 py-3">
            <span className="text-yellow-400 mt-0.5">⚠</span>
            <p className="text-yellow-300 text-sm">
              Your account is not linked to Intervals yet.{" "}
              <a href="/settings" className="underline hover:text-yellow-200">
                Go to Settings to fix this.
              </a>
            </p>
          </div>
        </div>
      )}

      {mapping && <FilteredTaskList tasks={tasks} />}
    </div>
  );
}
