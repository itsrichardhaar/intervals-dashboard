"use client";

import { useTheme } from "./ThemeProvider";
import type { Theme } from "@/lib/theme";

const THEMES: { value: Theme; label: string }[] = [
  { value: "mid",   label: "Mid"   },
  { value: "dark",  label: "Dark"  },
  { value: "light", label: "Light" },
];

function SliderRow({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm text-dash-text-muted w-36 shrink-0">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-[var(--dash-accent)]"
      />
      <span className="text-sm text-dash-text-muted w-16 text-right tabular-nums">
        {value}{unit}
      </span>
    </div>
  );
}

export default function DisplayCustomization() {
  const { prefs, setTheme, setBrightness, setHue, setIntensity } = useTheme();

  return (
    <section>
      <h2 className="text-sm font-medium text-dash-text-muted uppercase tracking-wide mb-4">
        Display Customization
      </h2>

      <div className="space-y-6 max-w-lg">
        {/* Theme */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-dash-text-muted w-36 shrink-0">Theme</span>
          <div className="flex gap-2">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                  prefs.theme === t.value
                    ? "bg-dash-surface-2 text-dash-accent border-dash-accent/50"
                    : "text-dash-text-muted border-dash-border hover:border-dash-text-dim hover:text-dash-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brightness */}
        <SliderRow
          label="Brightness"
          value={prefs.brightness}
          min={50}
          max={150}
          unit="%"
          onChange={setBrightness}
        />

        {/* Color Intensity */}
        <SliderRow
          label="Color Intensity"
          value={prefs.intensity}
          min={0}
          max={100}
          unit="%"
          onChange={setIntensity}
        />

        {/* Color Hue */}
        <div className="flex items-center gap-4">
          <label className="text-sm text-dash-text-muted w-36 shrink-0">Color Hue</label>
          <input
            type="range"
            min={0}
            max={359}
            value={prefs.hue}
            onChange={(e) => setHue(Number(e.target.value))}
            className="flex-1"
            style={{
              background: `linear-gradient(to right, ${
                Array.from({ length: 13 }, (_, i) =>
                  `hsl(${Math.round((i / 12) * 359)} 80% 55%)`
                ).join(", ")
              })`,
              WebkitAppearance: "none",
              appearance: "none",
              height: "6px",
              borderRadius: "3px",
            }}
          />
          <span className="text-sm text-dash-text-muted w-16 text-right tabular-nums">
            {prefs.hue}°
          </span>
        </div>

        {/* Accent preview */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-dash-text-muted w-36 shrink-0">Accent preview</span>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-6 h-6 rounded-full border border-dash-border"
              style={{ background: "var(--dash-accent)" }}
            />
            <span className="text-sm text-dash-accent font-medium">Active item</span>
          </div>
        </div>

        {/* Reset */}
        <div>
          <button
            onClick={() => {
              setBrightness(100);
              setHue(0);
              setIntensity(0);
            }}
            className="text-xs text-dash-text-dim hover:text-dash-text-muted border border-dash-border hover:border-dash-text-dim px-3 py-1.5 rounded-md transition-colors"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </section>
  );
}
