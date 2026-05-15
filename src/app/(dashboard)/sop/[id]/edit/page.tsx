import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SopEditor from "@/components/SopEditor";

export default async function EditSopPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const [sop, categories] = await Promise.all([
    prisma.sop.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.sopCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!sop) notFound();
  if (sop.status === "archived") redirect(`/sop/${id}`);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-dash-text">Edit SOP</h1>
        <p className="text-sm text-dash-text-dim mt-0.5">
          {sop.status === "published" ? "Changes go live immediately on save" : "Draft — not yet published"}
        </p>
      </div>
      <SopEditor
        categories={categories}
        initial={{
          id:           sop.id,
          title:        sop.title,
          purpose:      sop.purpose,
          scope:        sop.scope,
          body:         sop.body as Record<string, unknown> | null,
          categoryName: sop.category?.name ?? "",
        }}
      />
    </div>
  );
}
