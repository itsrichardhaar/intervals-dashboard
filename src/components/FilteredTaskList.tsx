"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  filterTasks,
  DEFAULT_TASK_FILTER,
  ALL_STATUSES,
  type TaskFilterSpec,
  type TaskStatus,
} from "@/lib/taskFilters";

const SESSION_KEY = "dash-task-filter";

export interface SerializedTask {
  id: string;
  title: string;
  status: string;
  normalizedStatus: TaskStatus;
  overdue: boolean;
  dueDate: string | null; // ISO string
  estimatedHours: number | null;
  loggedHours: number;
  project: { id: string; name: string };
}

const STATUS_LABELS: Record<string, string> = {
  open:               "Open",
  in_progress:        "In Progress",
  in_internal_review: "Internal Review",
  in_client_review:   "Client Review",
  closed:             "Closed",
};

const STATUS_BADGE: Record<string, string> = {
  open:               "bg-dash-surface-2 text-dash-text-muted",
  in_progress:        "bg-blue-900/60 text-blue-300",
  in_internal_review: "bg-purple-900/60 text-purple-300",
  in_client_review:   "bg-indigo-900/60 text-indigo-300",
  closed:             "bg-green-900/60 text-green-300",
};

function loadFilterFromSession(): TaskFilterSpec {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<TaskFilterSpec>;
      if (Array.isArray(parsed.statuses) && parsed.statuses.length > 0) {
        return { statuses: parsed.statuses as TaskStatus[] };
      }
    }
  } catch {}
  return { ...DEFAULT_TASK_FILTER };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FilteredTaskList({ tasks }: { tasks: SerializedTask[] }) {
  const [filter, setFilter] = useState<TaskFilterSpec>(DEFAULT_TASK_FILTER);
  const [initialized, setInitialized] = useState(false);

  // Load from sessionStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setFilter(loadFilterFromSession());
    setInitialized(true);
  }, []);

  // Persist filter changes to sessionStorage
  useEffect(() => {
    if (!initialized) return;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(filter));
    } catch {}
  }, [filter, initialized]);

  const filtered = useMemo(() => filterTasks(tasks, filter), [tasks, filter]);
  const overdueCount = filtered.filter((t) => t.overdue).length;

  function toggleStatus(status: TaskStatus) {
    setFilter((f) => {
      const current = new Set(f.statuses);
      if (current.has(status)) current.delete(status);
      else current.add(status);
      return { statuses: ALL_STATUSES.filter((s) => current.has(s)) };
    });
  }

  // Suppress rendering until sessionStorage state is loaded to avoid filter flash
  if (!initialized) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-dash-text mb-1">All My Tasks</h1>
          <p className="text-dash-text-dim text-sm">
            {filtered.length} task{filtered.length !== 1 ? "s" : ""}
            {overdueCount > 0 && (
              <span className="ml-2 text-red-400">{overdueCount} overdue</span>
            )}
          </p>
        </div>

        {/* Status filter checkboxes */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {ALL_STATUSES.map((s) => {
            const checked = filter.statuses.includes(s);
            return (
              <label key={s} className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleStatus(s)}
                  className="w-3.5 h-3.5 accent-[var(--dash-accent)] cursor-pointer"
                />
                <span className={`text-xs ${checked ? "text-dash-text" : "text-dash-text-dim"}`}>
                  {STATUS_LABELS[s]}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* No mapping warning is shown by parent (server component) */}

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-dash-text-dim text-sm">No tasks match the current filter.</p>
      ) : (
        <div className="rounded-lg border border-dash-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dash-surface">
              <tr>
                <th className="text-left px-4 py-3 text-dash-text-muted font-medium">Task</th>
                <th className="text-left px-4 py-3 text-dash-text-muted font-medium hidden sm:table-cell">Project</th>
                <th className="text-left px-4 py-3 text-dash-text-muted font-medium">Status</th>
                <th className="text-left px-4 py-3 text-dash-text-muted font-medium hidden md:table-cell">Due</th>
                <th className="text-right px-4 py-3 text-dash-text-muted font-medium hidden lg:table-cell">Est / Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dash-border">
              {filtered.map((task) => (
                <tr
                  key={task.id}
                  className={`${task.overdue ? "bg-red-950/30" : "bg-dash-bg"} hover:bg-dash-surface`}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${task.project.id}`}
                      className={`font-medium hover:text-dash-accent transition-colors ${task.overdue ? "text-red-300" : "text-dash-text"}`}
                    >
                      {task.title}
                    </Link>
                    {!task.estimatedHours && task.normalizedStatus !== "closed" && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-900/50 text-yellow-400">
                        No estimate
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-dash-text-muted hidden sm:table-cell">
                    {task.project.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[task.normalizedStatus] ?? "bg-dash-surface-2 text-dash-text-muted"}`}>
                      {STATUS_LABELS[task.normalizedStatus] ?? task.normalizedStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={task.overdue ? "text-red-400 font-medium" : "text-dash-text-muted"}>
                      {formatDate(task.dueDate)}
                    </span>
                    {task.overdue && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-900/60 text-red-300">
                        Overdue
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-dash-text-muted hidden lg:table-cell tabular-nums">
                    {task.estimatedHours !== null ? `${task.estimatedHours}h` : "—"}
                    {" / "}
                    {task.loggedHours > 0 ? `${task.loggedHours}h` : "0h"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
