import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SopTable from "@/components/SopTable";
import { Plus } from "lucide-react";

export default async function SopOverviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sops = await prisma.sop.findMany({
    where: { status: "published" },
    orderBy: { updatedAt: "desc" },
    include: {
      category:  { select: { id: true, name: true } },
      author:    { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-dash-text">SOPs</h1>
          <p className="text-sm text-dash-text-dim mt-0.5">Published standard operating procedures</p>
        </div>
        <Link
          href="/sop/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-dash-accent text-black text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          New SOP
        </Link>
      </div>

      <div className="bg-dash-surface border border-dash-border rounded-lg overflow-hidden">
        <SopTable sops={sops} emptyMessage="No published SOPs yet." />
      </div>
    </div>
  );
}
