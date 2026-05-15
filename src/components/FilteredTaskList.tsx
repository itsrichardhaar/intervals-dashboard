"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  filterTasks,
  filterTasksByDate,
  DEFAULT_TASK_FILTER,
  ALL_STATUSES,
  type TaskFilterSpec,
  type TaskStatus,
  type DateBucket,
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

const DATE_BUCKETS: { value: DateBucket; label: string }[] = [
  { value: "overdue",     label: "Overdue"       },
  { value: "this_week",   label: "This Week"     },
  { value: "this_month",  label: "This Month"    },
  { value: "no_due_date", label: "No Due Date"   },
];

interface SavedFilter {
  statuses: TaskStatus[];
  dateBucket: DateBucket | null;
}

function loadFilterFromSession(): { spec: TaskFilterSpec; bucket: DateBucket | null } {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedFilter>;
      const spec: TaskFilterSpec = Array.isArray(parsed.statuses) && parsed.statuses.length > 0
        ? { statuses: parsed.statuses as TaskStatus[] }
        : { ...DEFAULT_TASK_FILTER };
      const validBuckets: DateBucket[] = ["overdue", "this_week", "this_month", "no_due_date"];
      const bucket = parsed.dateBucket && validBuckets.includes(parsed.dateBucket)
        ? parsed.dateBucket
        : null;
      return { spec, bucket };
    }
  } catch {}
  return { spec: { ...DEFAULT_TASK_FILTER }, bucket: null };
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
  const [dateBucket, setDateBucket] = useState<DateBucket | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load from sessionStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const { spec, bucket } = loadFilterFromSession();
    setFilter(spec);
    setDateBucket(bucket);
    setInitialized(true);
  }, []);

  // Persist filter changes to sessionStorage
  useEffect(() => {
    if (!initialized) return;
    try {
      const saved: SavedFilter = { statuses: filter.statuses, dateBucket };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(saved));
    } catch {}
  }, [filter, dateBucket, initialized]);

  const filtered = useMemo(() => {
    const byStatus = filterTasks(tasks, filter);
    return filterTasksByDate(byStatus, dateBucket);
  }, [tasks, filter, dateBucket]);

  const overdueCount = filtered.filter((t) => t.overdue).length;

  function toggleStatus(status: TaskStatus) {
    setFilter((f) => {
      const current = new Set(f.statuses);
      if (current.has(status)) current.delete(status);
      else current.add(status);
      return { statuses: ALL_STATUSES.filter((s) => current.has(s)) };
    });
  }

  function selectBucket(bucket: DateBucket) {
    setDateBucket((prev) => (prev === bucket ? null : bucket));
  }

  // Suppress rendering until sessionStorage state is loaded to avoid filter flash
  if (!initialized) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-dash-text mb-1">All My Tasks</h1>
        <p className="text-dash-text-dim text-sm">
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
          {overdueCount > 0 && (
            <span className="ml-2 text-red-400">{overdueCount} overdue</span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* Status checkboxes */}
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

        {/* Date bucket pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-dash-text-dim mr-1">Due:</span>
          {DATE_BUCKETS.map((b) => {
            const active = dateBucket === b.value;
            return (
              <button
                key={b.value}
                onClick={() => selectBucket(b.value)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  active
                    ? b.value === "overdue"
                      ? "bg-red-900/50 text-red-300 border-red-700"
                      : "bg-dash-inset text-dash-accent border-dash-accent/50"
                    : "text-dash-text-muted border-dash-border hover:border-dash-text-dim"
                }`}
              >
                {b.label}
              </button>
            );
          })}
          {dateBucket && (
            <button
              onClick={() => setDateBucket(null)}
              className="text-xs text-dash-text-dim hover:text-dash-text-muted transition-colors ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

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
                  <td className="px-4 py-3 max-w-[200px]">
                    <Link
                      href={`/projects/${task.project.id}`}
                      className={`block truncate font-medium hover:text-dash-accent transition-colors ${task.overdue ? "text-red-300" : "text-dash-text"}`}
                    >
                      {task.title}
                    </Link>
                    {!task.estimatedHours && task.normalizedStatus !== "closed" && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-900/50 text-yellow-400 whitespace-nowrap">
                        No estimate
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-dash-text-muted hidden sm:table-cell max-w-[160px]">
                    <span className="block truncate">{task.project.name}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${STATUS_BADGE[task.normalizedStatus] ?? "bg-dash-surface-2 text-dash-text-muted"}`}>
                      {STATUS_LABELS[task.normalizedStatus] ?? task.normalizedStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap">
                    <span className={task.overdue ? "text-red-400 font-medium" : "text-dash-text-muted"}>
                      {formatDate(task.dueDate)}
                    </span>
                    {task.overdue && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-900/60 text-red-300 whitespace-nowrap">
                        Overdue
                      </span>
                    )}
                    {!task.dueDate && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-dash-surface-2 text-dash-text-dim border border-dash-border whitespace-nowrap">
                        No due date
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-dash-text-muted hidden lg:table-cell tabular-nums whitespace-nowrap">
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
