"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Status = "on_track" | "at_risk" | "blocked";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "on_track", label: "On Track" },
  { value: "at_risk",  label: "At Risk"  },
  { value: "blocked",  label: "Blocked"  },
];

interface Props {
  projectId: string;
}

export default function AddWeeklyStatusUpdateForm({ projectId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>("on_track");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch(`/api/projects/${projectId}/weekly-updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, summary }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      return;
    }

    setSummary("");
    setStatus("on_track");
    setIsOpen(false);
    startTransition(() => router.refresh());
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-dash-text-dim hover:text-dash-text border border-dash-border hover:border-dash-text-dim px-3 py-1.5 rounded-md transition-colors"
      >
        + Add status update
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-dash-surface border border-dash-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-dash-text">New status update</p>
        <button
          type="button"
          onClick={() => { setIsOpen(false); setError(null); setSummary(""); }}
          className="text-dash-text-dim hover:text-dash-text text-xs"
        >
          Cancel
        </button>
      </div>

      <div className="flex gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
              status === opt.value
                ? opt.value === "on_track"
                  ? "bg-green-900/50 text-green-300 border-green-700"
                  : opt.value === "at_risk"
                    ? "bg-yellow-900/50 text-yellow-300 border-yellow-700"
                    : "bg-red-900/50 text-red-300 border-red-700"
                : "text-dash-text-muted border-dash-border hover:border-dash-text-dim"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="What happened this week? Any blockers?"
        rows={3}
        className="w-full text-sm bg-dash-surface-2 border border-dash-border rounded-md px-3 py-2 text-dash-text placeholder-dash-text-dim resize-none focus:outline-none focus:border-dash-text-dim"
        autoFocus
      />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!summary.trim() || isPending}
          className="text-xs bg-dash-inset hover:bg-dash-surface-2 disabled:opacity-40 text-dash-text px-4 py-1.5 rounded-md transition-colors"
        >
          {isPending ? "Saving…" : "Post update"}
        </button>
      </div>
    </form>
  );
}
