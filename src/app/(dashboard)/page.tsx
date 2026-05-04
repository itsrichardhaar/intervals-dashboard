import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="px-6 py-8">
      <h1 className="text-xl font-semibold text-white mb-1">
        Good morning{session.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
      </h1>
      <p className="text-gray-500 text-sm">Personal Home — bandwidth and tasks coming in Phase 1 issue #14</p>
    </div>
  );
}
