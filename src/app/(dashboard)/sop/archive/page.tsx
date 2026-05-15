import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SopTable from "@/components/SopTable";

export default async function SopArchivePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sops = await prisma.sop.findMany({
    where: { status: "archived" },
    orderBy: { updatedAt: "desc" },
    include: {
      category:  { select: { id: true, name: true } },
      author:    { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-dash-text">Archive</h1>
        <p className="text-sm text-dash-text-dim mt-0.5">Retired SOPs — read-only</p>
      </div>

      <div className="bg-dash-surface border border-dash-border rounded-lg overflow-hidden">
        <SopTable sops={sops} emptyMessage="No archived SOPs." />
      </div>
    </div>
  );
}
