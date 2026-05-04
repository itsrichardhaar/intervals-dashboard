"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
}

export default function CompleteActionItemButton({ id }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setError(null);
    const res = await fetch(`/api/action-items/${id}`, {
      method: "PATCH",
    });
    if (!res.ok) {
      setError("Failed to complete.");
      return;
    }
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="shrink-0">
      <button
        onClick={handleComplete}
        disabled={isPending}
        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 hover:text-white text-xs font-medium rounded-md transition-colors border border-gray-700"
      >
        {isPending ? "Saving…" : "Complete"}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
