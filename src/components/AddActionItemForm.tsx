"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  projectId: string;
  users: User[];
}

export default function AddActionItemForm({ projectId, users }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState(users[0]?.id ?? "");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      return;
    }

    setDescription("");
    setDueDate("");
    setIsOpen(false);
    startTransition(() => router.refresh());
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-md transition-colors"
      >
        + Add action item
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">New action item</p>
        <button
          type="button"
          onClick={() => { setIsOpen(false); setError(null); setDescription(""); setDueDate(""); }}
          className="text-gray-500 hover:text-white text-xs"
        >
          Cancel
        </button>
      </div>

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the action item…"
        className="w-full text-sm bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
        autoFocus
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Assign to</label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full text-sm bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-gray-500"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Due date (optional)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full text-sm bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-gray-500"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!description.trim() || !assigneeId || isPending}
          className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white px-4 py-1.5 rounded-md transition-colors"
        >
          {isPending ? "Saving…" : "Add item"}
        </button>
      </div>
    </form>
  );
}
