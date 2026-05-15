"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import CategoryCombobox from "@/components/CategoryCombobox";
import {
  Bold, Italic, List, ListOrdered, Heading2, Heading3, Undo, Redo,
} from "lucide-react";

interface Category { id: string; name: string }

interface SopData {
  id?: string;
  title?: string;
  purpose?: string | null;
  scope?: string | null;
  body?: Record<string, unknown> | null;
  categoryName?: string;
}

interface Props {
  categories: Category[];
  initial?: SopData;
}

export default function SopEditor({ categories, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [purpose, setPurpose] = useState(initial?.purpose ?? "");
  const [scope, setScope] = useState(initial?.scope ?? "");
  const [categoryName, setCategoryName] = useState(initial?.categoryName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write your procedure here…" }),
    ],
    content: initial?.body ?? "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[240px] text-dash-text",
      },
    },
  });

  async function handleSave() {
    if (!title.trim()) { setError("Title is required"); return; }
    setError(null);
    setSaving(true);

    const payload = {
      title,
      purpose,
      scope,
      body: editor?.getJSON() ?? null,
      categoryName: categoryName || undefined,
    };

    try {
      const res = initial?.id
        ? await fetch(`/api/sop/${initial.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/sop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save");
        return;
      }

      const sop = await res.json();
      router.push(`/sop/${sop.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-dash-text-dim uppercase tracking-wide">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Client Onboarding Process"
          className="w-full px-3 py-2 rounded-md border border-dash-border bg-dash-surface text-sm text-dash-text placeholder:text-dash-text-dim focus:outline-none focus:ring-1 focus:ring-dash-accent"
        />
      </div>

      {/* Purpose */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-dash-text-dim uppercase tracking-wide">Purpose</label>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Why this process exists — the outcome it ensures"
          rows={2}
          className="w-full px-3 py-2 rounded-md border border-dash-border bg-dash-surface text-sm text-dash-text placeholder:text-dash-text-dim focus:outline-none focus:ring-1 focus:ring-dash-accent resize-none"
        />
      </div>

      {/* Scope */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-dash-text-dim uppercase tracking-wide">Scope</label>
        <textarea
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          placeholder="Who performs this process and when it applies"
          rows={2}
          className="w-full px-3 py-2 rounded-md border border-dash-border bg-dash-surface text-sm text-dash-text placeholder:text-dash-text-dim focus:outline-none focus:ring-1 focus:ring-dash-accent resize-none"
        />
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-dash-text-dim uppercase tracking-wide">Category</label>
        <CategoryCombobox categories={categories} value={categoryName} onChange={setCategoryName} />
      </div>

      {/* Body editor */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-dash-text-dim uppercase tracking-wide">Procedure</label>
        <div className="rounded-md border border-dash-border bg-dash-surface overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-dash-border flex-wrap">
            {[
              { icon: Bold,         action: () => editor?.chain().focus().toggleBold().run(),        active: editor?.isActive("bold") },
              { icon: Italic,       action: () => editor?.chain().focus().toggleItalic().run(),      active: editor?.isActive("italic") },
              { icon: Heading2,     action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive("heading", { level: 2 }) },
              { icon: Heading3,     action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: editor?.isActive("heading", { level: 3 }) },
              { icon: List,         action: () => editor?.chain().focus().toggleBulletList().run(),  active: editor?.isActive("bulletList") },
              { icon: ListOrdered,  action: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive("orderedList") },
            ].map(({ icon: Icon, action, active }, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); action(); }}
                className={`p-1.5 rounded transition-colors ${active ? "bg-dash-surface-2 text-dash-accent" : "text-dash-text-dim hover:text-dash-text hover:bg-dash-surface-2"}`}
              >
                <Icon size={14} />
              </button>
            ))}
            <div className="w-px h-4 bg-dash-border mx-1" />
            {[
              { icon: Undo, action: () => editor?.chain().focus().undo().run() },
              { icon: Redo, action: () => editor?.chain().focus().redo().run() },
            ].map(({ icon: Icon, action }, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); action(); }}
                className="p-1.5 rounded text-dash-text-dim hover:text-dash-text hover:bg-dash-surface-2 transition-colors"
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
          <div className="px-4 py-3">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-md bg-dash-accent text-black text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving…" : initial?.id ? "Save changes" : "Save as draft"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-md text-sm text-dash-text-muted hover:text-dash-text transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
