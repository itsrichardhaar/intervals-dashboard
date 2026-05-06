"use client";

import { useState, useEffect } from "react";

interface SyncStatusResponse {
  lastSync: {
    completedAt: string | null;
    startedAt: string;
    status: string; // "running" | "success" | "partial" | "failed"
  } | null;
}

function minutesAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
}

function formatAgo(minutes: number): string {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function SyncHealthBadge() {
  const [data, setData] = useState<SyncStatusResponse | null>(null);
  // Tick every 30 s so the relative label stays fresh
  const [, setTick] = useState(0);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/sync/status");
      if (res.ok) setData(await res.json());
    } catch {}
  }

  useEffect(() => {
    fetchStatus();
    const poll = setInterval(fetchStatus, 120_000);
    const tick = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, []);

  if (!data) return null;

  const { lastSync } = data;

  if (!lastSync) {
    return (
      <p className="text-xs text-yellow-400 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
        Never synced
      </p>
    );
  }

  if (lastSync.status === "failed") {
    return (
      <p className="text-xs text-red-400 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
        Sync failed
      </p>
    );
  }

  if (lastSync.status === "running") {
    return (
      <p className="text-xs text-blue-400 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
        Syncing…
      </p>
    );
  }

  const ref = lastSync.completedAt ?? lastSync.startedAt;
  const mins = minutesAgo(ref);
  const color = mins <= 15 ? "text-green-400" : mins <= 30 ? "text-yellow-400" : "text-red-400";
  const dot   = mins <= 15 ? "bg-green-400"  : mins <= 30 ? "bg-yellow-400"  : "bg-red-400";

  return (
    <p className={`text-xs ${color} flex items-center gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
      Synced {formatAgo(mins)}
    </p>
  );
}
