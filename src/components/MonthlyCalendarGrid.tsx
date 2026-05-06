"use client";

import { useState } from "react";
import Link from "next/link";

export interface CalendarItem {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  dueDate: string; // ISO string (serialized from server)
  type: "task" | "milestone";
  closed: boolean;
  overdue: boolean;
  dueToday: boolean;
}

interface Props {
  year: number;
  month: number; // 0-indexed
  items: CalendarItem[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE = 3;

function itemStyle(item: CalendarItem): string {
  if (item.closed) return "bg-dash-surface-2 text-dash-text-dim";
  if (item.overdue) return "bg-red-900/50 text-red-300";
  if (item.dueToday) return "bg-yellow-900/50 text-yellow-300";
  return "bg-green-900/40 text-green-300";
}

export default function MonthlyCalendarGrid({ year, month, items }: Props) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun
  const totalCells = startPad + lastDay.getDate();
  const rows = Math.ceil(totalCells / 7);

  // Group items by day-of-month
  const byDay = new Map<number, CalendarItem[]>();
  for (const item of items) {
    const d = new Date(item.dueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      const list = byDay.get(day) ?? [];
      list.push(item);
      byDay.set(day, list);
    }
  }

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  return (
    <div className="rounded-lg border border-dash-border overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-dash-surface border-b border-dash-border">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center py-2 text-xs font-medium text-dash-text-dim"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7" style={{ gridTemplateRows: `repeat(${rows}, minmax(80px, auto))` }}>
        {Array.from({ length: rows * 7 }, (_, i) => {
          const day = i - startPad + 1;
          const inMonth = day >= 1 && day <= lastDay.getDate();
          const dayItems = inMonth ? (byDay.get(day) ?? []) : [];
          const isExpanded = expandedDay === day;
          const visible = isExpanded ? dayItems : dayItems.slice(0, MAX_VISIBLE);
          const overflow = dayItems.length - MAX_VISIBLE;

          return (
            <div
              key={i}
              className={`border-b border-r border-dash-border p-1.5 min-h-[80px] ${
                !inMonth ? "bg-dash-surface/30" : "bg-dash-bg"
              } ${isToday(day) ? "ring-1 ring-inset ring-blue-700" : ""}`}
            >
              {inMonth && (
                <>
                  <p
                    className={`text-xs mb-1 ${
                      isToday(day)
                        ? "text-blue-400 font-semibold"
                        : "text-dash-text-dim"
                    }`}
                  >
                    {day}
                  </p>
                  <div className="space-y-0.5">
                    {visible.map((item) => (
                      <Link
                        key={item.id}
                        href={`/projects/${item.projectId}`}
                        title={`${item.title} — ${item.projectName}`}
                      >
                        <div
                          className={`px-1.5 py-0.5 rounded text-xs truncate leading-tight ${itemStyle(item)}`}
                        >
                          {item.type === "milestone" && (
                            <span className="mr-0.5 opacity-70">◆</span>
                          )}
                          {item.title}
                        </div>
                      </Link>
                    ))}
                    {!isExpanded && overflow > 0 && (
                      <button
                        onClick={() => setExpandedDay(day)}
                        className="text-xs text-dash-text-dim hover:text-dash-text-muted pl-1"
                      >
                        +{overflow} more
                      </button>
                    )}
                    {isExpanded && dayItems.length > MAX_VISIBLE && (
                      <button
                        onClick={() => setExpandedDay(null)}
                        className="text-xs text-dash-text-dim hover:text-dash-text-muted pl-1"
                      >
                        Show less
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
