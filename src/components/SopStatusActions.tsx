"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  status: string;
}

const TRANSITIONS: Record<string, { label: string; next: string; variant: "primary" | "ghost" | "danger" }[]> = {
  draft:     [{ label: "Publish",   next: "published", variant: "primary" }, { label: "Archive", next: "archived", variant: "danger" }],
  published: [{ label: "Unpublish", next: "draft",     variant: "ghost"   }, { label: "Archive", next: "archived", variant: "danger" }],
  archived:  [{ label: "Restore to Draft", next: "draft", variant: "ghost" }],
};

export default function SopStatusActions({ id, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const actions = TRANSITIONS[status] ?? [];

  async function transition(next: string) {
    setError(null);
    const res = await fetch(`/api/sop/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to update status");
      return;
    }

    startTransition(() => {
      if (next === "archived") router.push("/sop/archive");
      else router.refresh();
    });
  }

  const variantClass = {
    primary: "bg-dash-accent text-black hover:opacity-90",
    ghost:   "border border-dash-border text-dash-text-muted hover:text-dash-text hover:bg-dash-surface-2",
    danger:  "border border-red-800/50 text-red-400 hover:bg-red-900/20",
  };

  return (
    <div className="flex items-center gap-2">
      {actions.map((a) => (
        <button
          key={a.next}
          onClick={() => transition(a.next)}
          disabled={isPending}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${variantClass[a.variant]}`}
        >
          {a.label}
        </button>
      ))}
      {error && <p className="text-xs text-red-400 ml-2">{error}</p>}
    </div>
  );
}
