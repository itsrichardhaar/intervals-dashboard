import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SopEditor from "@/components/SopEditor";

export default async function NewSopPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const categories = await prisma.sopCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-dash-text">New SOP</h1>
        <p className="text-sm text-dash-text-dim mt-0.5">Saved as a draft until you publish it</p>
      </div>
      <SopEditor categories={categories} />
    </div>
  );
}
