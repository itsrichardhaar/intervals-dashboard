import Link from "next/link";

type SopRow = {
  id: string;
  title: string;
  status: string;
  category: { id: string; name: string } | null;
  author: { id: string; name: string | null; email: string | null };
  updatedBy: { id: string; name: string | null; email: string | null };
  updatedAt: string | Date;
};

function displayName(u: { name: string | null; email: string | null }) {
  return u.name ?? u.email ?? "—";
}

function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const STATUS_BADGE: Record<string, string> = {
  published: "bg-green-900/40 text-green-300",
  draft:     "bg-yellow-900/40 text-yellow-300",
  archived:  "bg-dash-surface-2 text-dash-text-dim",
};

export default function SopTable({ sops, emptyMessage }: { sops: SopRow[]; emptyMessage: string }) {
  if (sops.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-dash-text-dim">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dash-border text-xs text-dash-text-dim uppercase tracking-wide">
            <th className="text-left px-4 py-3 font-medium">Title</th>
            <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Category</th>
            <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Author</th>
            <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Last Edited By</th>
            <th className="text-left px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-dash-border">
          {sops.map((sop) => (
            <tr key={sop.id} className="hover:bg-dash-surface-2/50 transition-colors group">
              <td className="px-4 py-3">
                <Link
                  href={`/sop/${sop.id}`}
                  className="font-medium text-dash-text hover:text-dash-accent transition-colors"
                >
                  {sop.title}
                </Link>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                {sop.category ? (
                  <span className="text-xs bg-dash-surface-2 text-dash-text-muted px-2 py-0.5 rounded-full">
                    {sop.category.name}
                  </span>
                ) : (
                  <span className="text-dash-text-dim">—</span>
                )}
              </td>
              <td className="px-4 py-3 hidden md:table-cell text-dash-text-muted">
                {displayName(sop.author)}
              </td>
              <td className="px-4 py-3 hidden lg:table-cell text-dash-text-muted">
                {displayName(sop.updatedBy)}
              </td>
              <td className="px-4 py-3 text-dash-text-dim tabular-nums">
                {timeAgo(sop.updatedAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 justify-end">
                  <Link
                    href={`/sop/${sop.id}`}
                    className="text-xs text-dash-text-dim hover:text-dash-text transition-colors"
                  >
                    View
                  </Link>
                  {sop.status !== "archived" && (
                    <Link
                      href={`/sop/${sop.id}/edit`}
                      className="text-xs text-dash-text-dim hover:text-dash-accent transition-colors"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
