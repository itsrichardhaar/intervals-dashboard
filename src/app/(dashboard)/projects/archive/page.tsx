import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ProjectArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; order?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { q, sort, order } = await searchParams;
  const searchQuery = q?.trim().toLowerCase() ?? "";
  const sortBy = sort === "closeDate" ? "dueDate" : "name";
  const sortOrder = order === "desc" ? "desc" : "asc";

  const projects = await prisma.intervalsProject.findMany({
    where: {
      status: { not: "active" },
      ...(searchQuery
        ? {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { clientName: { contains: searchQuery, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: sortBy === "dueDate"
      ? [{ dueDate: sortOrder }, { name: "asc" }]
      : [{ name: sortOrder }],
    include: {
      _count: {
        select: { weeklyStatusUpdates: true, actionItems: true },
      },
    },
  });

  function sortLink(field: string) {
    const newOrder =
      sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    params.set("sort", field);
    params.set("order", newOrder);
    return `?${params.toString()}`;
  }

  function SortArrow({ field }: { field: string }) {
    if (sortBy !== field) return <span className="text-dash-text-dim ml-1">↕</span>;
    return (
      <span className="text-dash-text-muted ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/projects"
              className="text-xs text-dash-text-dim hover:text-dash-text transition-colors"
            >
              ← Active Projects
            </Link>
          </div>
          <h1 className="text-xl font-semibold text-dash-text">Project Archive</h1>
          <p className="text-dash-text-dim text-sm mt-0.5">
            {projects.length} archived project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={searchQuery}
          placeholder="Search by name or client…"
          className="flex-1 max-w-sm text-sm bg-dash-surface border border-dash-border rounded-md px-3 py-2 text-dash-text placeholder-dash-text-dim focus:outline-none focus:border-dash-border"
        />
        {sort && <input type="hidden" name="sort" value={sort} />}
        {order && <input type="hidden" name="order" value={order} />}
        <button
          type="submit"
          className="text-sm bg-dash-surface-2 hover:bg-dash-inset text-dash-text-muted px-4 py-2 rounded-md transition-colors"
        >
          Search
        </button>
        {searchQuery && (
          <Link
            href={sort ? `?sort=${sort}&order=${order}` : "?"}
            className="text-sm text-dash-text-dim hover:text-dash-text px-3 py-2 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {projects.length === 0 ? (
        <p className="text-dash-text-dim text-sm">
          {searchQuery ? "No archived projects match your search." : "No archived projects yet."}
        </p>
      ) : (
        <div className="rounded-lg border border-dash-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dash-surface">
              <tr>
                <th className="text-left px-4 py-3 text-dash-text-muted font-medium">
                  <Link href={sortLink("name")} className="flex items-center hover:text-dash-text transition-colors">
                    Project <SortArrow field="name" />
                  </Link>
                </th>
                <th className="text-left px-4 py-3 text-dash-text-muted font-medium hidden md:table-cell">
                  Client
                </th>
                <th className="text-left px-4 py-3 text-dash-text-muted font-medium hidden lg:table-cell">
                  <Link href={sortLink("closeDate")} className="flex items-center hover:text-dash-text transition-colors">
                    Closed <SortArrow field="closeDate" />
                  </Link>
                </th>
                <th className="text-right px-4 py-3 text-dash-text-muted font-medium hidden xl:table-cell">
                  History
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dash-border">
              {projects.map((p) => (
                <tr key={p.id} className="bg-dash-bg hover:bg-dash-surface transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${p.id}`}
                      className="text-dash-text hover:text-dash-accent transition-colors"
                    >
                      {p.name}
                    </Link>
                    {p.clientName && (
                      <p className="text-dash-text-dim text-xs mt-0.5 md:hidden">
                        {p.clientName}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-dash-text-muted hidden md:table-cell">
                    {p.clientName ?? <span className="text-dash-text-dim">—</span>}
                  </td>
                  <td className="px-4 py-3 text-dash-text-muted hidden lg:table-cell">
                    {formatDate(p.dueDate)}
                  </td>
                  <td className="px-4 py-3 text-right hidden xl:table-cell">
                    <span className="text-xs text-dash-text-dim tabular-nums">
                      {p._count.weeklyStatusUpdates} update
                      {p._count.weeklyStatusUpdates !== 1 ? "s" : ""}
                      {p._count.actionItems > 0 && (
                        <> · {p._count.actionItems} item{p._count.actionItems !== 1 ? "s" : ""}</>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
