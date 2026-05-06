"use client";

import { useEffect, useState } from "react";

type Theme = "mid" | "dark" | "light";

const THEMES: { value: Theme; label: string }[] = [
  { value: "mid",   label: "Mid"   },
  { value: "dark",  label: "Dark"  },
  { value: "light", label: "Light" },
];

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("dash-theme", theme);
}

export default function ThemeToggle() {
  const [active, setActive] = useState<Theme>("mid");

  useEffect(() => {
    const saved = localStorage.getItem("dash-theme") as Theme | null;
    if (saved === "mid" || saved === "dark" || saved === "light") {
      setActive(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  function handleSelect(theme: Theme) {
    setActive(theme);
    applyTheme(theme);
  }

  return (
    <div className="flex items-center rounded-md overflow-hidden border border-dash-border">
      {THEMES.map((t) => (
        <button
          key={t.value}
          onClick={() => handleSelect(t.value)}
          className={`flex-1 px-2 py-1 text-xs font-medium transition-colors ${
            active === t.value
              ? "bg-dash-surface-2 text-dash-accent"
              : "text-dash-text-dim hover:text-dash-text-muted hover:bg-dash-surface-2/50"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
