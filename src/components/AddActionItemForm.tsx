"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Task {
  id: string;
  title: string;
}

interface Props {
  projectId: string;
  users: User[];
  tasks?: Task[];
}

export default function AddActionItemForm({ projectId, users, tasks }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState(users[0]?.id ?? "");
  const [dueDate, setDueDate] = useState("");
  const [taskId, setTaskId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setDescription("");
    setDueDate("");
    setTaskId("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch(`/api/projects/${projectId}/action-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        assigneeId,
        dueDate: dueDate || undefined,
        taskId: taskId || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      return;
    }

    reset();
    setIsOpen(false);
    startTransition(() => router.refresh());
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-dash-text-dim hover:text-dash-text border border-dash-border hover:border-dash-text-dim px-3 py-1.5 rounded-md transition-colors"
      >
        + Add action item
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-dash-surface border border-dash-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-dash-text">New action item</p>
        <button
          type="button"
          onClick={() => { setIsOpen(false); reset(); }}
          className="text-dash-text-dim hover:text-dash-text text-xs"
        >
          Cancel
        </button>
      </div>

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the action item…"
        className="w-full text-sm bg-dash-surface-2 border border-dash-border rounded-md px-3 py-2 text-dash-text placeholder-dash-text-dim focus:outline-none focus:border-dash-text-dim"
        autoFocus
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-dash-text-dim mb-1">Assign to</label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full text-sm bg-dash-surface-2 border border-dash-border rounded-md px-3 py-2 text-dash-text focus:outline-none focus:border-dash-text-dim"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-dash-text-dim mb-1">Due date (optional)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full text-sm bg-dash-surface-2 border border-dash-border rounded-md px-3 py-2 text-dash-text focus:outline-none focus:border-dash-text-dim"
          />
        </div>
      </div>

      {tasks && tasks.length > 0 && (
        <div>
          <label className="block text-xs text-dash-text-dim mb-1">Link to task (optional)</label>
          <select
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="w-full text-sm bg-dash-surface-2 border border-dash-border rounded-md px-3 py-2 text-dash-text focus:outline-none focus:border-dash-text-dim"
          >
            <option value="">— No task —</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!description.trim() || !assigneeId || isPending}
          className="text-xs bg-dash-inset hover:bg-dash-surface-2 disabled:opacity-40 text-dash-text px-4 py-1.5 rounded-md transition-colors"
        >
          {isPending ? "Saving…" : "Add item"}
        </button>
      </div>
    </form>
  );
}
