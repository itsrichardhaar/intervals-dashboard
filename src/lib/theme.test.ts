import { describe, it, expect } from "vitest";
import { computeThemeVars } from "./theme";

const EXPECTED_KEYS = [
  "--dash-bg",
  "--dash-surface",
  "--dash-surface-2",
  "--dash-inset",
  "--dash-text",
  "--dash-text-muted",
  "--dash-text-dim",
  "--dash-border",
  "--dash-accent",
  "--dash-accent-soft",
];

// Extract the lightness component from an hsl(...) string, e.g. "hsl(38 0% 10.2%)" → 10.2
function extractL(hslStr: string): number {
  const m = hslStr.match(/[\d.]+%\s*\)/);
  return m ? parseFloat(m[0]) : NaN;
}

describe("computeThemeVars", () => {
  it("returns all 10 expected CSS variable keys", () => {
    const vars = computeThemeVars("mid", 100, 0, 0);
    expect(Object.keys(vars)).toHaveLength(10);
    for (const key of EXPECTED_KEYS) {
      expect(vars).toHaveProperty(key);
    }
  });

  it("Mid/Dark/Light produce distinct surface values", () => {
    const mid   = computeThemeVars("mid",   100, 0, 0);
    const dark  = computeThemeVars("dark",  100, 0, 0);
    const light = computeThemeVars("light", 100, 0, 0);
    expect(mid["--dash-bg"]).not.toBe(dark["--dash-bg"]);
    expect(mid["--dash-bg"]).not.toBe(light["--dash-bg"]);
    expect(dark["--dash-bg"]).not.toBe(light["--dash-bg"]);
    expect(mid["--dash-surface"]).not.toBe(dark["--dash-surface"]);
    expect(mid["--dash-surface"]).not.toBe(light["--dash-surface"]);
  });

  it("brightness 50 produces darker surfaces than brightness 100 (lower lightness)", () => {
    const normal = computeThemeVars("mid", 100, 0, 0);
    const dim    = computeThemeVars("mid",  50, 0, 0);
    expect(extractL(dim["--dash-bg"])).toBeLessThan(extractL(normal["--dash-bg"]));
    expect(extractL(dim["--dash-surface"])).toBeLessThan(extractL(normal["--dash-surface"]));
    expect(extractL(dim["--dash-surface-2"])).toBeLessThan(extractL(normal["--dash-surface-2"]));
    expect(extractL(dim["--dash-inset"])).toBeLessThan(extractL(normal["--dash-inset"]));
  });

  it("brightness 150 produces brighter surfaces than brightness 100 (higher lightness)", () => {
    const normal  = computeThemeVars("mid", 100, 0, 0);
    const bright  = computeThemeVars("mid", 150, 0, 0);
    expect(extractL(bright["--dash-bg"])).toBeGreaterThan(extractL(normal["--dash-bg"]));
    expect(extractL(bright["--dash-surface"])).toBeGreaterThan(extractL(normal["--dash-surface"]));
  });

  it("intensity 100 tints surfaces with accent hue (non-zero saturation)", () => {
    const flat   = computeThemeVars("mid", 100, 0,   0);
    const tinted = computeThemeVars("mid", 100, 0, 100);
    // At intensity 0, surface saturation is 0%
    expect(flat["--dash-bg"]).toContain(" 0% ");
    // At intensity 100, surface saturation is non-zero
    expect(tinted["--dash-bg"]).not.toContain(" 0% ");
    expect(tinted["--dash-surface"]).not.toContain(" 0% ");
  });

  it("intensity 0 produces neutral (zero-saturation) surfaces", () => {
    for (const theme of ["mid", "dark", "light"] as const) {
      const vars = computeThemeVars(theme, 100, 0, 0);
      expect(vars["--dash-bg"]).toContain(" 0% ");
      expect(vars["--dash-surface"]).toContain(" 0% ");
    }
  });

  it("hue rotation changes the accent output", () => {
    const orange  = computeThemeVars("mid", 100,   0, 0);
    const shifted = computeThemeVars("mid", 100,  90, 0);
    const more    = computeThemeVars("mid", 100, 180, 0);
    expect(orange["--dash-accent"]).not.toBe(shifted["--dash-accent"]);
    expect(orange["--dash-accent"]).not.toBe(more["--dash-accent"]);
    expect(shifted["--dash-accent"]).not.toBe(more["--dash-accent"]);
  });

  it("hue rotation is applied consistently to accent-soft", () => {
    const a = computeThemeVars("mid", 100,  0, 0);
    const b = computeThemeVars("mid", 100, 90, 0);
    // accent-soft is derived from accent, so they should differ too
    expect(a["--dash-accent-soft"]).not.toBe(b["--dash-accent-soft"]);
  });

  it("brightness clamps to valid range (never < 1% or > 99%)", () => {
    const veryDim    = computeThemeVars("mid",   1, 0, 0); // extreme low
    const veryBright = computeThemeVars("mid", 200, 0, 0); // extreme high
    for (const key of ["--dash-bg", "--dash-surface", "--dash-surface-2"]) {
      expect(extractL(veryDim[key])).toBeGreaterThanOrEqual(1);
      expect(extractL(veryBright[key])).toBeLessThanOrEqual(99);
    }
  });

  it("text colors are unaffected by brightness changes", () => {
    const normal = computeThemeVars("mid", 100, 0, 0);
    const bright = computeThemeVars("mid", 150, 0, 0);
    const dim    = computeThemeVars("mid",  50, 0, 0);
    expect(normal["--dash-text"]).toBe(bright["--dash-text"]);
    expect(normal["--dash-text"]).toBe(dim["--dash-text"]);
    expect(normal["--dash-text-muted"]).toBe(bright["--dash-text-muted"]);
    expect(normal["--dash-text-dim"]).toBe(dim["--dash-text-dim"]);
  });
});
