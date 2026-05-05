import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calculateProjectStatus } from "@/lib/calculators/projectStatus";
import ProjectStatusControl from "@/components/ProjectStatusControl";

type ProjectStatus = "on_track" | "at_risk" | "blocked";

function BudgetBar({ logged, estimated }: { logged: number; estimated: number }) {
  if (estimated === 0) {
    return <span className="text-gray-600 text-xs">No estimates</span>;
  }
  const rawPct = Math.round((logged / estimated) * 100);
  const overBudget = rawPct > 100;
  const barPct = Math.min(100, rawPct);
  const barColor = overBudget
    ? "bg-red-500"
    : rawPct >= 90
      ? "bg-red-500"
      : rawPct >= 80
        ? "bg-yellow-400"
        : "bg-green-500";
  const textColor = overBudget ? "text-red-400" : "text-gray-400";

  return (
    <div className="space-y-1 min-w-[8rem]">
      <div className={`flex items-center justify-between text-xs tabular-nums ${textColor}`}>
        <span>
          {logged.toFixed(0)}h / {estimated.toFixed(0)}h
        </span>
        <span className={overBudget ? "font-medium" : ""}>{rawPct}%</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${barPct}%` }} />
      </div>
      {overBudget && (
        <p className="text-xs text-red-400/70">Over budget</p>
      )}
    </div>
  );
}

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await prisma.intervalsProject.findMany({
    orderBy: [{ clientName: "asc" }, { name: "asc" }],
    include: {
      tasks: {
        select: {
          id: true,
          status: true,
          estimatedHours: true,
          loggedHours: true,
          dueDate: true,
          assignee: { select: { id: true, name: true } },
        },
      },
      projectStatusOverride: true,
    },
  });

  const enriched = projects.map((p) => {
    const totalEstimated = p.tasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);
    const totalLogged = p.tasks.reduce((s, t) => s + t.loggedHours, 0);

    const autoStatus = calculateProjectStatus({
      estimatedHours: totalEstimated,
      loggedHours: totalLogged,
      startDate: p.startDate,
      dueDate: p.dueDate,
      tasks: p.tasks.map((t) => ({ dueDate: t.dueDate, status: t.status })),
    });

    const override = p.projectStatusOverride;
    const effectiveStatus: ProjectStatus = (override?.status as ProjectStatus) ?? autoStatus;

    const memberMap = new Map<string, string>();
    for (const t of p.tasks) {
      if (t.assignee) memberMap.set(t.assignee.id, t.assignee.name);
    }

    return {
      ...p,
      totalEstimated,
      totalLogged,
      effectiveStatus,
      hasOverride: !!override,
      blockedReason: override?.reason ?? null,
      teamMembers: Array.from(memberMap.values()),
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white mb-1">Projects</h1>
        <p className="text-gray-500 text-sm">{enriched.length} active projects</p>
      </div>

      <div className="rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left px-4 py-3 text-gray-400 font-medium w-[30%]">
                Project
              </th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell w-[20%]">
                Client
              </th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium w-[12%]">
                Status
              </th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium hidden lg:table-cell w-[22%]">
                Budget
              </th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium hidden xl:table-cell">
                Team
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {enriched.map((p) => (
              <tr key={p.id} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-white font-medium leading-snug hover:text-blue-300 transition-colors"
                  >
                    {p.name}
                  </Link>
                  {p.clientName && (
                    <p className="text-gray-500 text-xs mt-0.5 md:hidden">{p.clientName}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                  {p.clientName ?? <span className="text-gray-700">—</span>}
                </td>
                <td className="px-4 py-3">
                  <ProjectStatusControl
                    projectId={p.id}
                    status={p.effectiveStatus}
                    hasOverride={p.hasOverride}
                    blockedReason={p.blockedReason}
                  />
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <BudgetBar logged={p.totalLogged} estimated={p.totalEstimated} />
                </td>
                <td className="px-4 py-3 hidden xl:table-cell">
                  {p.teamMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {p.teamMembers.slice(0, 4).map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300"
                        >
                          {name.split(" ")[0]}
                        </span>
                      ))}
                      {p.teamMembers.length > 4 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-500">
                          +{p.teamMembers.length - 4}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-700 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
            {enriched.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-600">
                  No active projects found. Run a sync to populate data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
