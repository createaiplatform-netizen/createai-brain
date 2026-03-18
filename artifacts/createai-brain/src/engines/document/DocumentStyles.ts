// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT STYLES — Design tokens and style helpers for the Document Engine
// Single source of truth for all document visual constants.
// ═══════════════════════════════════════════════════════════════════════════

import type { DocStatus, DocConfidentiality, DocTheme } from "./DocumentSchema";

// ─── Brand tokens ────────────────────────────────────────────────────────────

export const DOC_BRAND = {
  accent:        "#6366f1",
  accentLight:   "#818cf8",
  accentGlow:    "rgba(99,102,241,0.15)",
  accentFaint:   "rgba(99,102,241,0.08)",
  accentBorder:  "rgba(99,102,241,0.25)",
  text:          "#f1f5f9",
  textMuted:     "#94a3b8",
  textFaint:     "#64748b",
  border:        "rgba(255,255,255,0.08)",
  borderLight:   "rgba(255,255,255,0.05)",
  surface:       "rgba(255,255,255,0.04)",
  surfaceHigh:   "rgba(255,255,255,0.07)",
  surfaceCard:   "rgba(255,255,255,0.03)",
  bg:            "#0f0f1a",
  bgCard:        "rgba(8,10,22,0.85)",
  success:       "#34d399",
  successFaint:  "rgba(52,211,153,0.10)",
  successBorder: "rgba(52,211,153,0.25)",
  warn:          "#fbbf24",
  warnFaint:     "rgba(251,191,36,0.10)",
  warnBorder:    "rgba(251,191,36,0.25)",
  danger:        "#f87171",
  dangerFaint:   "rgba(248,113,113,0.10)",
  dangerBorder:  "rgba(248,113,113,0.25)",
  info:          "#38bdf8",
  infoFaint:     "rgba(56,189,248,0.10)",
  infoBorder:    "rgba(56,189,248,0.25)",
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const DOC_FONT = {
  sans:  '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono:  '"JetBrains Mono", "Fira Code", "SF Mono", "Consolas", monospace',
  serif: '"Georgia", "Times New Roman", serif',
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const DOC_SPACE = {
  headerH:    52,
  footerH:    40,
  sidePad:    20,
  sectionGap: 18,
  blockGap:   12,
  cardPad:    18,
  compact:    12,
} as const;

// ─── Spacer heights ──────────────────────────────────────────────────────────

export const SPACER_H: Record<string, number> = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 32,
  xl: 48,
};

// ─── Heading sizes ────────────────────────────────────────────────────────────

export const HEADING_SIZE: Record<number, number>   = { 1: 20, 2: 16, 3: 14, 4: 12 };
export const HEADING_WEIGHT: Record<number, number> = { 1: 700, 2: 600, 3: 600, 4: 500 };

// ─── Status styles ────────────────────────────────────────────────────────────

export const STATUS_STYLE: Record<DocStatus, { bg: string; text: string; border: string; label: string }> = {
  draft:    { bg: "rgba(251,191,36,0.10)",  text: "#fbbf24", border: "rgba(251,191,36,0.28)",  label: "DRAFT"    },
  review:   { bg: "rgba(99,102,241,0.10)",  text: "#818cf8", border: "rgba(99,102,241,0.28)",  label: "REVIEW"   },
  final:    { bg: "rgba(52,211,153,0.10)",  text: "#34d399", border: "rgba(52,211,153,0.28)",  label: "FINAL"    },
  approved: { bg: "rgba(52,211,153,0.14)",  text: "#34d399", border: "rgba(52,211,153,0.40)",  label: "APPROVED" },
  archived: { bg: "rgba(148,163,184,0.10)", text: "#94a3b8", border: "rgba(148,163,184,0.28)", label: "ARCHIVED" },
};

// ─── Confidentiality styles ───────────────────────────────────────────────────

export const CONF_STYLE: Record<DocConfidentiality, { bg: string; text: string; border: string; label: string }> = {
  public:       { bg: "rgba(52,211,153,0.08)",  text: "#34d399", border: "rgba(52,211,153,0.20)",  label: "PUBLIC"       },
  internal:     { bg: "rgba(99,102,241,0.08)",  text: "#818cf8", border: "rgba(99,102,241,0.20)",  label: "INTERNAL"     },
  confidential: { bg: "rgba(251,191,36,0.08)",  text: "#fbbf24", border: "rgba(251,191,36,0.20)",  label: "CONFIDENTIAL" },
  restricted:   { bg: "rgba(248,113,113,0.10)", text: "#f87171", border: "rgba(248,113,113,0.25)", label: "RESTRICTED"   },
};

// ─── Callout styles ───────────────────────────────────────────────────────────

export const CALLOUT_STYLE = {
  info:    { border: "#38bdf8", bg: "rgba(56,189,248,0.08)",  icon: "ℹ️" },
  warn:    { border: "#fbbf24", bg: "rgba(251,191,36,0.08)",  icon: "⚠️" },
  success: { border: "#34d399", bg: "rgba(52,211,153,0.08)",  icon: "✅" },
  danger:  { border: "#f87171", bg: "rgba(248,113,113,0.08)", icon: "🚨" },
  default: { border: "#6366f1", bg: "rgba(99,102,241,0.08)",  icon: "ℹ️" },
} as const;

// ─── Theme accent overrides ───────────────────────────────────────────────────

export const THEME_ACCENT: Record<DocTheme, string> = {
  default:   "#6366f1",
  legal:     "#64748b",
  medical:   "#06b6d4",
  technical: "#10b981",
  creative:  "#a855f7",
  financial: "#f59e0b",
};

// ─── Doc type icon ────────────────────────────────────────────────────────────

export function docTypeIcon(type: string): string {
  const t = (type ?? "").toLowerCase();
  if (t.includes("legal") || t.includes("contract") || t.includes("agreement") || t.includes("sop")) return "⚖️";
  if (t.includes("medical") || t.includes("health") || t.includes("clinical"))                        return "🏥";
  if (t.includes("financial") || t.includes("budget") || t.includes("invoice") || t.includes("tax"))  return "📊";
  if (t.includes("business") || t.includes("plan") || t.includes("strategy"))                         return "💼";
  if (t.includes("marketing") || t.includes("campaign") || t.includes("brand"))                       return "📣";
  if (t.includes("technical") || t.includes("spec") || t.includes("api") || t.includes("engineer"))   return "⚙️";
  if (t.includes("research") || t.includes("study") || t.includes("analysis"))                        return "🔬";
  if (t.includes("proposal") || t.includes("pitch") || t.includes("deck"))                            return "📋";
  if (t.includes("guide") || t.includes("manual") || t.includes("handbook"))                          return "📖";
  if (t.includes("note") || t.includes("memo"))                                                        return "📝";
  if (t.includes("report"))                                                                             return "📑";
  if (t.includes("template"))                                                                           return "📐";
  if (t.includes("letter") || t.includes("email") || t.includes("correspondence"))                    return "✉️";
  if (t.includes("recipe") || t.includes("food") || t.includes("family"))                             return "🏠";
  if (t.includes("creative") || t.includes("story") || t.includes("script"))                          return "✨";
  if (t.includes("video") || t.includes("film"))                                                       return "🎬";
  if (t.includes("meeting") || t.includes("minutes") || t.includes("agenda"))                         return "📅";
  if (t.includes("project"))                                                                            return "🗂️";
  return "📄";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatDocDate(iso?: string): string {
  if (!iso) return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  try { return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return iso; }
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
