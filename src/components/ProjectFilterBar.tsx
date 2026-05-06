"use client";

import { useRouter } from "next/navigation";

type ProjectStatus = "on_track" | "at_risk" | "blocked";

interface Props {
  clients: string[];
  currentClient: string | null;
  currentStatuses: ProjectStatus[];
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string; active: string; inactive: string }[] = [
  {
    value: "on_track",
    label: "On Track",
    active:   "bg-green-900/50 text-green-300 border-green-700",
    inactive: "text-dash-text-muted border-dash-border hover:border-dash-text-dim",
  },
  {
    value: "at_risk",
    label: "At Risk",
    active:   "bg-yellow-900/50 text-yellow-300 border-yellow-700",
    inactive: "text-dash-text-muted border-dash-border hover:border-dash-text-dim",
  },
  {
    value: "blocked",
    label: "Blocked",
    active:   "bg-red-900/50 text-red-300 border-red-700",
    inactive: "text-dash-text-muted border-dash-border hover:border-dash-text-dim",
  },
];

function buildUrl(client: string | null, statuses: ProjectStatus[]): string {
  const params = new URLSearchParams();
  if (client) params.set("client", client);
  if (statuses.length > 0) params.set("status", statuses.join(","));
  const qs = params.toString();
  return qs ? `/projects?${qs}` : "/projects";
}

export default function ProjectFilterBar({ clients, currentClient, currentStatuses }: Props) {
  const router = useRouter();
  const hasAnyFilter = currentClient !== null || currentStatuses.length > 0;

  function handleClientChange(client: string) {
    router.replace(buildUrl(client || null, currentStatuses));
  }

  function toggleStatus(status: ProjectStatus) {
    const next = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    router.replace(buildUrl(currentClient, next));
  }

  function clearAll() {
    router.replace("/projects");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Client dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-dash-text-dim">Client</label>
        <select
          value={currentClient ?? ""}
          onChange={(e) => handleClientChange(e.target.value)}
          className="text-xs bg-dash-surface-2 border border-dash-border rounded-md px-2 py-1.5 text-dash-text focus:outline-none focus:ring-1 focus:ring-dash-accent"
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-1.5">
        {STATUS_OPTIONS.map((opt) => {
          const active = currentStatuses.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleStatus(opt.value)}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${active ? opt.active : opt.inactive}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Clear button */}
      {hasAnyFilter && (
        <button
          onClick={clearAll}
          className="text-xs text-dash-text-dim hover:text-dash-text-muted transition-colors ml-1"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
