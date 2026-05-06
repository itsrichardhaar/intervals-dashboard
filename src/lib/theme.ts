export type Theme = "mid" | "dark" | "light";

export interface ThemePrefs {
  theme: Theme;
  brightness: number; // 50–150, default 100
  hue: number;        // 0–359, accent hue rotation, default 0
  intensity: number;  // 0–100, accent tint in surfaces, default 0
}

export const DEFAULT_PREFS: ThemePrefs = {
  theme: "mid",
  brightness: 100,
  hue: 0,
  intensity: 0,
};

// All lightness values are percentages (0–100)
// Surface colors (bg, surface, surface2, inset, border) start at saturation 0
// Text colors stay at their base hue/saturation regardless of brightness/intensity
const BASE: Record<Theme, {
  bg: number; surface: number; surface2: number; inset: number; border: number;
  textH: number; textS: number; textL: number;
  textMutedS: number; textMutedL: number;
  textDimS: number; textDimL: number;
  accentH: number; accentS: number; accentL: number;
}> = {
  mid: {
    bg: 10.2, surface: 14.5, surface2: 18.8, inset: 22.7, border: 21.2,
    textH: 60, textS: 5,    textL: 90.9,
    textMutedS: 2,           textMutedL: 59.6,
    textDimS: 1,             textDimL: 34.9,
    accentH: 38, accentS: 91, accentL: 55,
  },
  dark: {
    bg: 5.1, surface: 8.6, surface2: 12.5, inset: 16.1, border: 16.5,
    textH: 60, textS: 5,    textL: 92.9,
    textMutedS: 2,           textMutedL: 53.3,
    textDimS: 1,             textDimL: 28.2,
    accentH: 38, accentS: 91, accentL: 55,
  },
  light: {
    bg: 93.7, surface: 100, surface2: 91, inset: 86.3, border: 83.1,
    textH: 0, textS: 0,     textL: 10.2,
    textMutedS: 0,           textMutedL: 41.6,
    textDimS: 0,             textDimL: 66.7,
    accentH: 38, accentS: 88, accentL: 40,
  },
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)} ${Math.round(s * 10) / 10}% ${Math.round(l * 10) / 10}%)`;
}

export type ThemeVarMap = Record<string, string>;

/**
 * Pure function: compute all 10 --dash-* CSS variable values from preferences.
 *
 * brightness: 50–150 (100 = default). Scales surface lightness in HSL space.
 * hue: 0–359. Rotates the accent hue by this many degrees.
 * intensity: 0–100. Blends the accent hue into neutral surface colours.
 */
export function computeThemeVars(
  theme: Theme,
  brightness: number,
  hue: number,
  intensity: number,
): ThemeVarMap {
  const b = BASE[theme];
  const brightnessScale = brightness / 100;

  // Accent after hue rotation
  const accentH = (b.accentH + hue) % 360;
  const accentStr = hsl(accentH, b.accentS, b.accentL);

  // Surface tinting: at max intensity, surfaces carry up to 8% (dark) or 6% (light) saturation
  const maxSurfaceSat = theme === "light" ? 6 : 8;
  const surfaceSat = (clamp(intensity, 0, 100) / 100) * maxSurfaceSat;

  // Brightness: scale surface lightness, clamped to visible range
  function scaleL(baseL: number): number {
    return clamp(baseL * brightnessScale, 1, 99);
  }

  return {
    "--dash-bg":          hsl(accentH, surfaceSat, scaleL(b.bg)),
    "--dash-surface":     hsl(accentH, surfaceSat, scaleL(b.surface)),
    "--dash-surface-2":   hsl(accentH, surfaceSat, scaleL(b.surface2)),
    "--dash-inset":       hsl(accentH, surfaceSat, scaleL(b.inset)),
    "--dash-text":        hsl(b.textH, b.textS, b.textL),
    "--dash-text-muted":  hsl(b.textH, b.textMutedS, b.textMutedL),
    "--dash-text-dim":    hsl(b.textH, b.textDimS, b.textDimL),
    "--dash-border":      hsl(accentH, surfaceSat, scaleL(b.border)),
    "--dash-accent":      accentStr,
    "--dash-accent-soft": `color-mix(in srgb, ${accentStr} 15%, transparent)`,
  };
}

/** The inline script string for flash prevention. Keep in sync with computeThemeVars. */
export const FLASH_PREVENTION_SCRIPT = `(function(){
  var B={mid:{bg:10.2,su:14.5,s2:18.8,inn:22.7,bd:21.2,tH:60,tS:5,tL:90.9,tmS:2,tmL:59.6,tdS:1,tdL:34.9,aH:38,aS:91,aL:55},dark:{bg:5.1,su:8.6,s2:12.5,inn:16.1,bd:16.5,tH:60,tS:5,tL:92.9,tmS:2,tmL:53.3,tdS:1,tdL:28.2,aH:38,aS:91,aL:55},light:{bg:93.7,su:100,s2:91,inn:86.3,bd:83.1,tH:0,tS:0,tL:10.2,tmS:0,tmL:41.6,tdS:0,tdL:66.7,aH:38,aS:88,aL:40}};
  function h(hv,s,l){return 'hsl('+Math.round(hv)+' '+Math.round(s*10)/10+'% '+Math.round(l*10)/10+'%)';}
  try{
    var p={};try{p=JSON.parse(localStorage.getItem('dash-prefs')||'{}');}catch(e){}
    var t=['mid','dark','light'].indexOf(p.theme)>=0?p.theme:'mid';
    var bri=typeof p.brightness==='number'?p.brightness:100;
    var hu=typeof p.hue==='number'?p.hue:0;
    var it=typeof p.intensity==='number'?p.intensity:0;
    var b=B[t];
    var sc=bri/100;
    var cl=function(l){return Math.max(1,Math.min(99,l*sc));};
    var aH=(b.aH+hu)%360;
    var sat=(Math.max(0,Math.min(100,it))/100)*(t==='light'?6:8);
    var acc=h(aH,b.aS,b.aL);
    var el=document.documentElement;
    el.style.setProperty('--dash-bg',h(aH,sat,cl(b.bg)));
    el.style.setProperty('--dash-surface',h(aH,sat,cl(b.su)));
    el.style.setProperty('--dash-surface-2',h(aH,sat,cl(b.s2)));
    el.style.setProperty('--dash-inset',h(aH,sat,cl(b.inn)));
    el.style.setProperty('--dash-border',h(aH,sat,cl(b.bd)));
    el.style.setProperty('--dash-text',h(b.tH,b.tS,b.tL));
    el.style.setProperty('--dash-text-muted',h(b.tH,b.tmS,b.tmL));
    el.style.setProperty('--dash-text-dim',h(b.tH,b.tdS,b.tdL));
    el.style.setProperty('--dash-accent',acc);
    el.style.setProperty('--dash-accent-soft','color-mix(in srgb, '+acc+' 15%, transparent)');
  }catch(e){}
})();`;
