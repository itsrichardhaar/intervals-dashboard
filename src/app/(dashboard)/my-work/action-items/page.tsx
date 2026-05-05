import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isCarriedOver, isActionItemOverdue } from "@/lib/actionItems";
import CompleteActionItemButton from "@/components/CompleteActionItemButton";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MyActionItemsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [openItems, recentlyCompleted] = await Promise.all([
    prisma.actionItem.findMany({
      where: { assigneeId: session.user.id, completedAt: null },
      include: { project: { select: { name: true } }, task: { select: { title: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.actionItem.findMany({
      where: {
        assigneeId: session.user.id,
        completedAt: { not: null, gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: { project: { select: { name: true } }, task: { select: { title: true } } },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),
  ]);

  const overdueItems = openItems.filter((i) => isActionItemOverdue({ dueDate: i.dueDate, completedAt: i.completedAt }));
  const carriedItems = openItems.filter((i) => isCarriedOver({ createdAt: i.createdAt, completedAt: i.completedAt }));

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white mb-1">My Action Items</h1>
        <p className="text-gray-500 text-sm">
          {openItems.length} open
          {overdueItems.length > 0 && (
            <span className="ml-2 text-red-400">{overdueItems.length} overdue</span>
          )}
          {carriedItems.length > 0 && (
            <span className="ml-2 text-yellow-400">{carriedItems.length} carried over</span>
          )}
        </p>
      </div>

      {/* Open items */}
      {openItems.length === 0 ? (
        <p className="text-gray-600 text-sm">No open action items — you&apos;re all caught up.</p>
      ) : (
        <section className="space-y-2">
          {openItems.map((item) => {
            const overdue = isActionItemOverdue({ dueDate: item.dueDate, completedAt: item.completedAt });
            const carriedOver = isCarriedOver({ createdAt: item.createdAt, completedAt: item.completedAt });
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 border rounded-lg px-4 py-3 ${
                  overdue ? "bg-red-950/30 border-red-900/50" : "bg-gray-900 border-gray-800"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className={`text-sm font-medium ${overdue ? "text-red-200" : "text-white"}`}>
                      {item.description}
                    </p>
                    {overdue && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-300">
                        Overdue
                      </span>
                    )}
                    {carriedOver && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-900/50 text-yellow-300">
                        Carried over
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {item.project && <span>{item.project.name}</span>}
                    {item.task && <span>on: {item.task.title}</span>}
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
        </section>
      )}

      {/* Recently completed */}
      {recentlyCompleted.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Completed this week
          </h2>
          <div className="space-y-1.5">
            {recentlyCompleted.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 bg-gray-900/50 border border-gray-800/50 rounded-lg px-4 py-2.5"
              >
                <span className="text-green-600 mt-0.5 text-sm">✓</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 line-through">{item.description}</p>
                  {item.project && (
                    <p className="text-xs text-gray-700 mt-0.5">{item.project.name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
