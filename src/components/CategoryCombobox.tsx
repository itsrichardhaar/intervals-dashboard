"use client";

import { useState, useRef, useEffect } from "react";

interface Category { id: string; name: string }

interface Props {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
}

export default function CategoryCombobox({ categories, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setInput(value); }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(input.toLowerCase())
  );
  const exactMatch = categories.some(
    (c) => c.name.toLowerCase() === input.toLowerCase()
  );

  function select(name: string) {
    setInput(name);
    onChange(name);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={input}
        placeholder="Category (type to search or create)"
        className="w-full px-3 py-2 rounded-md border border-dash-border bg-dash-surface text-sm text-dash-text placeholder:text-dash-text-dim focus:outline-none focus:ring-1 focus:ring-dash-accent"
        onChange={(e) => { setInput(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && (input.length > 0 || filtered.length > 0) && (
        <div className="absolute z-10 mt-1 w-full bg-dash-surface border border-dash-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-dash-text hover:bg-dash-surface-2 transition-colors"
              onMouseDown={(e) => { e.preventDefault(); select(c.name); }}
            >
              {c.name}
            </button>
          ))}
          {input.trim() && !exactMatch && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-dash-accent hover:bg-dash-surface-2 transition-colors"
              onMouseDown={(e) => { e.preventDefault(); select(input.trim()); }}
            >
              Create &ldquo;{input.trim()}&rdquo;
            </button>
          )}
          {filtered.length === 0 && !input.trim() && (
            <p className="px-3 py-2 text-sm text-dash-text-dim">No categories yet</p>
          )}
        </div>
      )}
    </div>
  );
}
