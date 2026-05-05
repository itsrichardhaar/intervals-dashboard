"use client";

import { useState, useEffect, useCallback } from "react";

interface IntervalsPerson {
  id: string;
  name: string;
  email: string | null;
}

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  intervalsMapping: {
    matchType: string;
    intervalsPerson: { name: string } | null;
  } | null;
}

function MappingCell({
  user,
  people,
  onSaved,
}: {
  user: UserRecord;
  people: IntervalsPerson[];
  onSaved: (userId: string, mapping: UserRecord["intervalsMapping"]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/users/${user.id}/mapping`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intervalsPersonId: selected || null }),
    });
    setSaving(false);
    if (!res.ok) return;

    const chosenPerson = people.find((p) => p.id === selected) ?? null;
    onSaved(user.id, chosenPerson ? { matchType: "manual", intervalsPerson: { name: chosenPerson.name } } : null);
    setEditing(false);
    setSelected("");
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        {user.intervalsMapping ? (
          <span className="text-green-400 text-xs">
            {user.intervalsMapping.matchType === "auto" ? "Auto" : "Manual"} →{" "}
            {user.intervalsMapping.intervalsPerson?.name}
          </span>
        ) : (
          <span className="text-yellow-500 text-xs">Not linked</span>
        )}
        <button
          onClick={() => {
            setSelected(
              people.find((p) => p.name === user.intervalsMapping?.intervalsPerson?.name)?.id ?? ""
            );
            setEditing(true);
          }}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors ml-1"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">— No mapping —</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.email ? ` (${p.email})` : ""}
          </option>
        ))}
      </select>
      <button
        onClick={save}
        disabled={saving}
        className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded transition-colors"
      >
        {saving ? "…" : "Save"}
      </button>
      <button
        onClick={() => { setEditing(false); setSelected(""); }}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [people, setPeople] = useState<IntervalsPerson[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (data.users) setUsers(data.users);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetch("/api/intervals-people")
      .then((r) => r.json())
      .then((d) => { if (d.people) setPeople(d.people); });
  }, [fetchUsers]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setTempPassword("");
    setLoading(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
    } else {
      setTempPassword(data.tempPassword);
      setName("");
      setEmail("");
      fetchUsers();
    }
  }

  function handleMappingSaved(userId: string, mapping: UserRecord["intervalsMapping"]) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, intervalsMapping: mapping } : u))
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">
      <h1 className="text-xl font-semibold text-white">Settings</h1>

      {/* Invite User */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">
          Invite Team Member
        </h2>
        <form onSubmit={handleInvite} className="space-y-3 max-w-sm">
          <input
            required
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            required
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {tempPassword && (
            <div className="bg-green-900/30 border border-green-700 rounded-md p-3">
              <p className="text-green-400 text-sm font-medium">Account created!</p>
              <p className="text-gray-300 text-sm mt-1">
                Temporary password:{" "}
                <span className="font-mono font-semibold text-white">{tempPassword}</span>
              </p>
              <p className="text-gray-500 text-xs mt-1">Share this with the team member directly. It will only be shown once.</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-medium rounded-md transition-colors"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
      </section>

      {/* Team Members */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">
          Team Members
        </h2>
        <div className="rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Intervals Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((user) => (
                <tr key={user.id} className="bg-gray-950 hover:bg-gray-900">
                  <td className="px-4 py-3 text-white">{user.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-300">{user.email}</td>
                  <td className="px-4 py-3">
                    <MappingCell user={user} people={people} onSaved={handleMappingSaved} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-600 text-sm">
                    No team members yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
