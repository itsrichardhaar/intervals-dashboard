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
        className="px-3 py-1.5 bg-dash-surface-2 hover:bg-dash-inset disabled:opacity-50 text-dash-text-muted hover:text-dash-text text-xs font-medium rounded-md transition-colors border border-dash-border"
      >
        {isPending ? "Saving…" : "Complete"}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
