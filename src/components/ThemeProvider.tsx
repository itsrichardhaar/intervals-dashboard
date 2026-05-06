"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  computeThemeVars,
  DEFAULT_PREFS,
  type Theme,
  type ThemePrefs,
} from "@/lib/theme";

const STORAGE_KEY = "dash-prefs";
const DB_SYNC_DELAY_MS = 600;

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

function loadLocalPrefs(): ThemePrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<ThemePrefs>;
    const validThemes: Theme[] = ["mid", "dark", "light"];
    if (!validThemes.includes(p.theme as Theme)) return null;
    return {
      theme:      p.theme as Theme,
      brightness: typeof p.brightness === "number" ? p.brightness : DEFAULT_PREFS.brightness,
      hue:        typeof p.hue        === "number" ? p.hue        : DEFAULT_PREFS.hue,
      intensity:  typeof p.intensity  === "number" ? p.intensity  : DEFAULT_PREFS.intensity,
    };
  } catch {
    return null;
  }
}

function saveLocalPrefs(prefs: ThemePrefs): void {
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

async function syncToDb(prefs: ThemePrefs): Promise<void> {
  try {
    await fetch("/api/users/me/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
  } catch {}
}

interface Props {
  children: React.ReactNode;
  /** Preferences loaded server-side from the database. Used as fallback when
   *  localStorage has no saved prefs (e.g. first login from a new device). */
  serverPrefs?: ThemePrefs | null;
}

export default function ThemeProvider({ children, serverPrefs }: Props) {
  // null = not yet loaded from storage (avoids overwriting real prefs with defaults on mount)
  const [prefs, setPrefs] = useState<ThemePrefs | null>(null);
  const dbSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMount = useRef(true);

  // On mount: resolve initial prefs from localStorage → serverPrefs → DEFAULT_PREFS
  useEffect(() => {
    const local = loadLocalPrefs();
    const resolved = local ?? serverPrefs ?? DEFAULT_PREFS;
    setPrefs(resolved);
    applyVars(resolved);
    // If we got prefs from server (new device), save them to localStorage right away
    if (!local && (serverPrefs ?? null) !== null) {
      saveLocalPrefs(resolved);
    }
    isMount.current = false;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On every prefs change after mount: apply CSS vars + persist
  useEffect(() => {
    if (isMount.current || prefs === null) return;
    applyVars(prefs);
    saveLocalPrefs(prefs);
    // Debounce DB sync to avoid hammering on slider drag
    if (dbSyncTimer.current) clearTimeout(dbSyncTimer.current);
    dbSyncTimer.current = setTimeout(() => syncToDb(prefs), DB_SYNC_DELAY_MS);
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
