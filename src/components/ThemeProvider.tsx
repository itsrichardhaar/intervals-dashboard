"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  computeThemeVars,
  DEFAULT_PREFS,
  type Theme,
  type ThemePrefs,
} from "@/lib/theme";

const STORAGE_KEY = "dash-prefs";

interface ThemeContextValue {
  prefs: ThemePrefs;
  setTheme: (theme: Theme) => void;
  setBrightness: (value: number) => void;
  setHue: (value: number) => void;
  setIntensity: (value: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function loadPrefs(): ThemePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<ThemePrefs>;
      const validThemes: Theme[] = ["mid", "dark", "light"];
      return {
        theme:      validThemes.includes(p.theme as Theme) ? (p.theme as Theme) : DEFAULT_PREFS.theme,
        brightness: typeof p.brightness === "number" ? p.brightness : DEFAULT_PREFS.brightness,
        hue:        typeof p.hue        === "number" ? p.hue        : DEFAULT_PREFS.hue,
        intensity:  typeof p.intensity  === "number" ? p.intensity  : DEFAULT_PREFS.intensity,
      };
    }
  } catch {}
  return { ...DEFAULT_PREFS };
}

function savePrefs(prefs: ThemePrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

function applyVars(prefs: ThemePrefs): void {
  const vars = computeThemeVars(prefs.theme, prefs.brightness, prefs.hue, prefs.intensity);
  const el = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    el.style.setProperty(key, value);
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // null = not yet loaded from localStorage (avoids saving defaults over real prefs on mount)
  const [prefs, setPrefs] = useState<ThemePrefs | null>(null);
  const initialized = useRef(false);

  // On mount: read localStorage and apply immediately
  useEffect(() => {
    const loaded = loadPrefs();
    initialized.current = true;
    setPrefs(loaded);
    applyVars(loaded);
  }, []);

  // On every prefs change after mount: apply vars + persist
  useEffect(() => {
    if (!initialized.current || prefs === null) return;
    applyVars(prefs);
    savePrefs(prefs);
  }, [prefs]);

  const resolved = prefs ?? DEFAULT_PREFS;

  function setTheme(theme: Theme) {
    setPrefs((p) => ({ ...(p ?? DEFAULT_PREFS), theme }));
  }
  function setBrightness(brightness: number) {
    setPrefs((p) => ({ ...(p ?? DEFAULT_PREFS), brightness }));
  }
  function setHue(hue: number) {
    setPrefs((p) => ({ ...(p ?? DEFAULT_PREFS), hue }));
  }
  function setIntensity(intensity: number) {
    setPrefs((p) => ({ ...(p ?? DEFAULT_PREFS), intensity }));
  }

  return (
    <ThemeContext.Provider value={{ prefs: resolved, setTheme, setBrightness, setHue, setIntensity }}>
      {children}
    </ThemeContext.Provider>
  );
}
