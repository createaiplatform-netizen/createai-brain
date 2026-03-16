// ─── Theme Engine — Accent Color + Brand Profile System ──────────────────────
// Light/dark toggle is handled by Tailwind. This engine provides:
//   - Accent color palette (10 colors) for per-project branding
//   - Brand profile generator (gradient, tint, surface, button style)
//   - Simple brand profile per project stored in Creation metadata

// ─── Accent Color Palette ─────────────────────────────────────────────────────
export interface AccentColor {
  id: string;
  name: string;
  hex: string;
  gradient: string;    // Tailwind gradient classes
  tint: string;        // Tailwind bg tint classes
  textClass: string;   // Tailwind text class
  ringClass: string;   // Tailwind ring/focus class
}

export const ACCENT_COLORS: AccentColor[] = [
  { id: "blue",    name: "Blue",    hex: "#007AFF", gradient: "from-blue-600 to-blue-700",          tint: "bg-blue-50",     textClass: "text-blue-600",    ringClass: "ring-blue-500/30" },
  { id: "purple",  name: "Purple",  hex: "#BF5AF2", gradient: "from-purple-600 to-violet-700",      tint: "bg-purple-50",   textClass: "text-purple-600",  ringClass: "ring-purple-500/30" },
  { id: "green",   name: "Green",   hex: "#34C759", gradient: "from-green-600 to-emerald-700",      tint: "bg-green-50",    textClass: "text-green-600",   ringClass: "ring-green-500/30" },
  { id: "red",     name: "Red",     hex: "#FF2D55", gradient: "from-rose-600 to-red-700",           tint: "bg-rose-50",     textClass: "text-rose-600",    ringClass: "ring-rose-500/30" },
  { id: "orange",  name: "Orange",  hex: "#FF9500", gradient: "from-orange-500 to-amber-600",       tint: "bg-orange-50",   textClass: "text-orange-600",  ringClass: "ring-orange-500/30" },
  { id: "teal",    name: "Teal",    hex: "#30B0C7", gradient: "from-teal-500 to-cyan-600",          tint: "bg-teal-50",     textClass: "text-teal-600",    ringClass: "ring-teal-500/30" },
  { id: "indigo",  name: "Indigo",  hex: "#5856D6", gradient: "from-indigo-600 to-purple-700",     tint: "bg-indigo-50",   textClass: "text-indigo-600",  ringClass: "ring-indigo-500/30" },
  { id: "pink",    name: "Pink",    hex: "#FF2D95", gradient: "from-pink-500 to-rose-600",          tint: "bg-pink-50",     textClass: "text-pink-600",    ringClass: "ring-pink-500/30" },
  { id: "slate",   name: "Slate",   hex: "#636366", gradient: "from-slate-600 to-gray-700",         tint: "bg-slate-50",    textClass: "text-slate-600",   ringClass: "ring-slate-500/30" },
  { id: "gold",    name: "Gold",    hex: "#D4AF37", gradient: "from-yellow-500 to-amber-600",       tint: "bg-yellow-50",   textClass: "text-yellow-700",  ringClass: "ring-yellow-500/30" },
];

// ─── Brand Profile ────────────────────────────────────────────────────────────
export interface BrandProfile {
  accentColor: AccentColor;
  heroGradient: string;        // CSS gradient string
  surfaceColor: string;        // Tailwind bg class for cards/surfaces
  buttonStyle: React.CSSProperties;
  badgeStyle: React.CSSProperties;
  isDark: boolean;
}

// Safe React import hint for callers
declare const React: { CSSProperties: unknown };

export function getBrandProfile(colorIdOrHex: string): BrandProfile {
  const accent = ACCENT_COLORS.find(c => c.id === colorIdOrHex || c.hex === colorIdOrHex)
    ?? ACCENT_COLORS[0]; // fallback to blue

  return {
    accentColor: accent,
    heroGradient: `linear-gradient(135deg, ${accent.hex}dd, ${shiftHue(accent.hex, 20)}cc)`,
    surfaceColor: accent.tint,
    buttonStyle: { backgroundColor: accent.hex, color: "#fff" },
    badgeStyle: { backgroundColor: accent.hex + "20", color: accent.hex, border: `1px solid ${accent.hex}40` },
    isDark: isDarkColor(accent.hex),
  };
}

export function getAccentById(id: string): AccentColor {
  return ACCENT_COLORS.find(c => c.id === id) ?? ACCENT_COLORS[0];
}

// ─── Preset Theme Bundles ─────────────────────────────────────────────────────
export interface ThemeBundle {
  id: string;
  name: string;
  icon: string;
  description: string;
  accentId: string;
  cardStyle: "rounded" | "sharp" | "pill";
  density: "compact" | "comfortable" | "spacious";
}

export const PRESET_THEMES: ThemeBundle[] = [
  { id: "midnight",   name: "Midnight",   icon: "🌙", description: "Dark, minimal, high contrast",    accentId: "blue",   cardStyle: "rounded", density: "comfortable" },
  { id: "daybreak",   name: "Daybreak",   icon: "🌅", description: "Clean, bright, airy",             accentId: "teal",   cardStyle: "rounded", density: "spacious" },
  { id: "executive",  name: "Executive",  icon: "👔", description: "Corporate, structured, serious",  accentId: "slate",  cardStyle: "sharp",   density: "compact" },
  { id: "creative",   name: "Creative",   icon: "🎨", description: "Vibrant, expressive, energetic",  accentId: "purple", cardStyle: "pill",    density: "comfortable" },
  { id: "growth",     name: "Growth",     icon: "📈", description: "Warm, optimistic, action-driven", accentId: "green",  cardStyle: "rounded", density: "comfortable" },
  { id: "fire",       name: "Fire",       icon: "🔥", description: "Bold, urgent, high energy",       accentId: "red",    cardStyle: "rounded", density: "compact" },
];

// ─── Color Utilities ──────────────────────────────────────────────────────────
function isDarkColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

function shiftHue(hex: string, deg: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const max = Math.max(r, g, b); const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 510;
    if (max !== min) {
      const d = max - min; s = d / (l > 0.5 ? 510 - max - min : max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = ((h * 60 + deg) % 360 + 360) % 360;
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const p = 2 * l - q;
    const toRgb = (t: number) => { t = ((t % 1) + 1) % 1; if (t < 1/6) return p + (q-p)*6*t; if (t < 1/2) return q; if (t < 2/3) return p+(q-p)*(2/3-t)*6; return p; };
    const hN = h / 360;
    return `#${[toRgb(hN+1/3), toRgb(hN), toRgb(hN-1/3)].map(v => Math.round(v*255).toString(16).padStart(2,"0")).join("")}`;
  } catch { return hex; }
}

// ─── CSS Variable Application ─────────────────────────────────────────────────
export function applyAccentToDocument(accentId: string): void {
  const color = ACCENT_COLORS.find(c => c.id === accentId);
  if (!color) return;
  document.documentElement.style.setProperty("--color-accent", color.hex);
}

export function resetAccentOnDocument(): void {
  document.documentElement.style.removeProperty("--color-accent");
}
