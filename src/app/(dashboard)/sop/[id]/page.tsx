import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SopStatusActions from "@/components/SopStatusActions";
import SopPrintArea from "@/components/SopPrintArea";
import SopBodyRenderer from "@/components/SopBodyRenderer";
import { Pencil } from "lucide-react";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
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
  published: "bg-green-900/40 text-green-300 border-green-800/40",
  draft:     "bg-yellow-900/40 text-yellow-300 border-yellow-800/40",
  archived:  "bg-dash-surface-2 text-dash-text-dim border-dash-border",
};

function displayName(u: { name: string | null; email: string | null }) {
  return u.name ?? u.email ?? "—";
}

export default async function SopReadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const sop = await prisma.sop.findUnique({
    where: { id },
    include: {
      category:  { select: { id: true, name: true } },
      author:    { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!sop) notFound();

  const isEditable = sop.status !== "archived";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[sop.status] ?? STATUS_BADGE.draft}`}>
              {sop.status.charAt(0).toUpperCase() + sop.status.slice(1)}
            </span>
            {sop.category && (
              <span className="text-xs bg-dash-surface-2 text-dash-text-muted px-2 py-0.5 rounded-full">
                {sop.category.name}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-dash-text leading-tight">{sop.title}</h1>
          <p className="text-xs text-dash-text-dim">
            By {displayName(sop.author)}
            {" · "}
            Last edited by {displayName(sop.updatedBy)} {timeAgo(sop.updatedAt)}
          </p>
        </div>
        {isEditable && (
          <Link
            href={`/sop/${sop.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dash-border text-sm text-dash-text-muted hover:text-dash-text hover:bg-dash-surface-2 transition-colors shrink-0"
          >
            <Pencil size={13} />
            Edit
          </Link>
        )}
      </div>

      {/* Printable content */}
      <SopPrintArea title={sop.title}>
        {/* Purpose & Scope */}
        {(sop.purpose || sop.scope) && (
          <div className="bg-dash-surface border border-dash-border rounded-lg divide-y divide-dash-border">
            {sop.purpose && (
              <div className="px-4 py-3 space-y-1">
                <p className="text-xs font-medium text-dash-text-dim uppercase tracking-wide">Purpose</p>
                <p className="text-sm text-dash-text">{sop.purpose}</p>
              </div>
            )}
            {sop.scope && (
              <div className="px-4 py-3 space-y-1">
                <p className="text-xs font-medium text-dash-text-dim uppercase tracking-wide">Scope</p>
                <p className="text-sm text-dash-text">{sop.scope}</p>
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="bg-dash-surface border border-dash-border rounded-lg px-6 py-5">
          <SopBodyRenderer content={sop.body as Record<string, unknown> | null} />
        </div>
      </SopPrintArea>

      {/* Status actions */}
      <div className="flex items-center justify-between pt-2 border-t border-dash-border">
        <SopStatusActions id={sop.id} status={sop.status} />
        <Link href="/sop" className="text-xs text-dash-text-dim hover:text-dash-text transition-colors">
          ← All SOPs
        </Link>
      </div>

    </div>
  );
}
