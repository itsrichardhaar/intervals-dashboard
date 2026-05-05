"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type ProjectStatus = "on_track" | "at_risk" | "blocked";

interface Props {
  projectId: string;
  status: ProjectStatus;
  hasOverride: boolean;
  blockedReason?: string | null;
}

const BADGE_STYLES: Record<ProjectStatus, string> = {
  on_track: "bg-green-900/50 text-green-300 border border-green-700/50",
  at_risk:  "bg-yellow-900/50 text-yellow-300 border border-yellow-700/50",
  blocked:  "bg-red-900/50 text-red-300 border border-red-700/50",
};

const BADGE_LABELS: Record<ProjectStatus, string> = {
  on_track: "On Track",
  at_risk:  "At Risk",
  blocked:  "Blocked",
};

export default function ProjectStatusControl({ projectId, status, hasOverride, blockedReason }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [showReasonForm, setShowReasonForm] = useState(false);
  const [reason, setReason] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function setStatus(newStatus: ProjectStatus, reasonText?: string) {
    const res = await fetch(`/api/projects/${projectId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, reason: reasonText }),
    });
    if (res.ok) {
      startTransition(() => router.refresh());
    }
  }

  async function clearOverride() {
    const res = await fetch(`/api/projects/${projectId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clear: true }),
    });
    if (res.ok) {
      startTransition(() => router.refresh());
    }
  }

  if (showReasonForm) {
    return (
      <div className="flex flex-col gap-2 items-end">
        <textarea
          className="w-56 text-xs bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-red-600"
          rows={2}
          placeholder="Reason for blocked status…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={() => { setShowReasonForm(false); setReason(""); }}
            className="text-xs text-gray-400 hover:text-white px-2 py-1"
          >
            Cancel
          </button>
          <button
            disabled={!reason.trim() || isPending}
            onClick={() => {
              setShowReasonForm(false);
              setStatus("blocked", reason.trim());
              setReason("");
            }}
            className="text-xs bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white px-3 py-1 rounded-md"
          >
            Set Blocked
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-opacity ${BADGE_STYLES[status]} ${isPending ? "opacity-50" : "hover:opacity-80"}`}
      >
        {BADGE_LABELS[status]}
        <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 py-1">
          {(["on_track", "at_risk"] as ProjectStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => { setIsOpen(false); setStatus(s); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-700 transition-colors ${status === s && hasOverride ? "text-white font-medium" : "text-gray-300"}`}
            >
              {BADGE_LABELS[s]}
              {status === s && hasOverride && <span className="ml-1 text-gray-500">✓</span>}
            </button>
          ))}
          <button
            onClick={() => { setIsOpen(false); setShowReasonForm(true); }}
            className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-700 transition-colors ${status === "blocked" ? "text-white font-medium" : "text-gray-300"}`}
          >
            Blocked
            {status === "blocked" && <span className="ml-1 text-gray-500">✓</span>}
          </button>
          {hasOverride && (
            <>
              <div className="my-1 border-t border-gray-700" />
              <button
                onClick={() => { setIsOpen(false); clearOverride(); }}
                className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-700 hover:text-gray-300 transition-colors"
              >
                Reset to auto
              </button>
            </>
          )}
        </div>
      )}

      {status === "blocked" && blockedReason && (
        <p className="mt-1 text-xs text-red-400/70 max-w-40 text-right">{blockedReason}</p>
      )}
    </div>
  );
}
