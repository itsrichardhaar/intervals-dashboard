import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calculateProjectStatus } from "@/lib/calculators/projectStatus";
import ProjectStatusControl from "@/components/ProjectStatusControl";
import ProjectFilterBar from "@/components/ProjectFilterBar";

function BudgetBar({ logged, estimated }: { logged: number; estimated: number }) {
  if (estimated === 0) {
    return <span className="text-dash-text-dim text-xs">No estimates</span>;
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
  const textColor = overBudget ? "text-red-400" : "text-dash-text-muted";

  return (
    <div className="space-y-1 min-w-[8rem]">
      <div className={`flex items-center justify-between text-xs tabular-nums ${textColor}`}>
        <span>
          {logged.toFixed(0)}h / {estimated.toFixed(0)}h
        </span>
        <span className={overBudget ? "font-medium" : ""}>{rawPct}%</span>
      </div>
      <div className="w-full bg-dash-surface-2 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${barPct}%` }} />
      </div>
      {overBudget && (
        <p className="text-xs text-red-400/70">Over budget</p>
      )}
    </div>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

// Deterministic color from name string
function nameColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const palette = [
    "bg-blue-800 text-blue-200",
    "bg-purple-800 text-purple-200",
    "bg-green-800 text-green-200",
    "bg-rose-800 text-rose-200",
    "bg-orange-800 text-orange-200",
    "bg-teal-800 text-teal-200",
    "bg-pink-800 text-pink-200",
    "bg-indigo-800 text-indigo-200",
  ];
  return palette[h % palette.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function TeamChips({ members }: { members: string[] }) {
  const shown = members.slice(0, 4);
  const overflow = members.length - 4;
  return (
    <div className="flex items-center gap-1">
      {shown.map((name) => (
        <span
          key={name}
          title={name}
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${nameColor(name)}`}
        >
          {initials(name)}
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium bg-dash-inset text-dash-text-muted">
          +{overflow}
        </span>
      )}
    </div>
  );
}

const VALID_STATUSES = ["on_track", "at_risk", "blocked"] as const;
type ProjectStatus = typeof VALID_STATUSES[number];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { client: clientParam, status: statusParam } = await searchParams;
  const currentClient = clientParam?.trim() || null;
  const currentStatuses = (statusParam?.split(",").filter(
    (s): s is ProjectStatus => VALID_STATUSES.includes(s as ProjectStatus)
  )) ?? [];

  const projects = await prisma.intervalsProject.findMany({
    where: { status: "active" },
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
      weeklyStatusUpdates: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { author: { select: { name: true } } },
      },
      milestones: {
        where: { completed: false },
        orderBy: { dueDate: "asc" },
        take: 1,
        select: { title: true, dueDate: true },
      },
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

    const latestUpdate = p.weeklyStatusUpdates[0] ?? null;
    const nextMilestone = p.milestones[0] ?? null;

    return {
      ...p,
      totalEstimated,
      totalLogged,
      effectiveStatus,
      hasOverride: !!override,
      blockedReason: override?.reason ?? null,
      teamMembers: Array.from(memberMap.values()),
      latestUpdate,
      nextMilestone,
    };
  });

  // Distinct client names for the filter dropdown (from ALL projects, not filtered)
  const allClients = [...new Set(
    projects.map((p) => p.clientName).filter((c): c is string => c !== null && c !== "")
  )].sort();

  // Apply active filters
  const filtered = enriched.filter((p) => {
    if (currentClient && p.clientName !== currentClient) return false;
    if (currentStatuses.length > 0 && !currentStatuses.includes(p.effectiveStatus)) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-dash-text mb-1">Projects</h1>
          <p className="text-dash-text-dim text-sm">
            {filtered.length} of {enriched.length} active project{enriched.length !== 1 ? "s" : ""}
          </p>
        </div>
        <ProjectFilterBar
          clients={allClients}
          currentClient={currentClient}
          currentStatuses={currentStatuses}
        />
      </div>

      <div className="rounded-lg border border-dash-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-dash-surface">
            <tr>
              <th className="text-left px-4 py-3 text-dash-text-muted font-medium w-[28%]">
                Project
              </th>
              <th className="text-left px-4 py-3 text-dash-text-muted font-medium hidden md:table-cell w-[15%]">
                Client
              </th>
              <th className="text-left px-4 py-3 text-dash-text-muted font-medium w-[12%]">
                Status
              </th>
              <th className="text-left px-4 py-3 text-dash-text-muted font-medium hidden lg:table-cell w-[18%]">
                Budget
              </th>
              <th className="text-left px-4 py-3 text-dash-text-muted font-medium hidden xl:table-cell">
                Latest Update
              </th>
              <th className="text-left px-4 py-3 text-dash-text-muted font-medium hidden 2xl:table-cell">
                Next Milestone
              </th>
              <th className="text-left px-4 py-3 text-dash-text-muted font-medium hidden lg:table-cell">
                Team
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dash-border">
            {filtered.map((p) => (
              <tr key={p.id} className="bg-dash-bg hover:bg-dash-surface transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-dash-text font-medium leading-snug hover:text-dash-accent transition-colors"
                  >
                    {p.name}
                  </Link>
                  {p.clientName && (
                    <p className="text-dash-text-dim text-xs mt-0.5 md:hidden">{p.clientName}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-dash-text-muted hidden md:table-cell">
                  {p.clientName ?? <span className="text-dash-text-dim">—</span>}
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
                <td className="px-4 py-3 hidden 2xl:table-cell">
                  {p.nextMilestone ? (
                    <div>
                      <p className="text-dash-text text-xs truncate max-w-[140px]">{p.nextMilestone.title}</p>
                      {p.nextMilestone.dueDate && (
                        <p className="text-dash-text-dim text-xs mt-0.5">
                          {p.nextMilestone.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-dash-text-dim text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <TeamChips members={p.teamMembers} />
                </td>
                <td className="px-4 py-3 hidden xl:table-cell">
                  {p.latestUpdate ? (
                    <Link href={`/projects/${p.id}`} className="block group">
                      <p className="text-dash-text text-xs line-clamp-2 group-hover:text-dash-accent transition-colors">
                        {p.latestUpdate.summary}
                      </p>
                      <p className="text-dash-text-dim text-xs mt-0.5">
                        {p.latestUpdate.author.name ?? "Unknown"} ·{" "}
                        {timeAgo(p.latestUpdate.createdAt)}
                      </p>
                    </Link>
                  ) : (
                    <Link
                      href={`/projects/${p.id}`}
                      className="text-xs text-dash-text-dim hover:text-dash-text-muted transition-colors"
                    >
                      No updates yet →
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-dash-text-dim">
                  {enriched.length === 0
                    ? "No active projects found. Run a sync to populate data."
                    : "No projects match the current filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
