import { useMemo } from "react"

// ─── Context-Smart Adaptive Theming Engine ────────────────────────────────────
// Base: warm natural identity — sage #7a9068, sand #c4a97a, cream #faf9f6
// Principle: every creation spawns its full presence, styled right for its purpose.

export type ContextType =
  | "default"     // base warm sage/olive identity
  | "family"      // cozy, golden-hour — home and togetherness
  | "story"       // literary, paper-warm — narrative and imagination
  | "art"         // expressive, layered — creative depth
  | "video"       // cinematic, deep — motion and presence
  | "memory"      // nostalgic, golden — precious moments
  | "challenge"   // energetic, motivating — achievement and drive
  | "invention"   // curious, exploratory — ideas and possibility
  | "journey"     // grounded, milestone-aware — growth and progress
  | "plan"        // structured, calm — rhythm and organisation
  | "rewards"     // warm-gold, celebratory — recognition and joy
  | "store"       // refined, editorial — value and craft
  | "business"    // clean, authoritative — professional and structured
  | "health"      // calm, breathable — clarity and care
  | "legal"       // precise, minimal — trust and authority
  | "portal"      // immersive, layered — discovery and depth
  | "marketing"   // bold, expressive — reach and impact

export interface ContextTheme {
  primary:       string
  sand:          string
  bg:            string
  cardBg:        string
  text:          string
  muted:         string
  border:        string
  softBg:        string
  accentBg:      string
  gradient:      string
  heroGradient:  string
  iconBg:        string
  iconColor:     string
  tagBg:         string
  tagColor:      string
  headingWeight: 700 | 800 | 900
  radius:        number
  cardRadius:    number
  shadow:        string
  cardShadow:    string
  transition:    string
  feel:          string
}

const BASE: ContextTheme = {
  primary:       "#7a9068",
  sand:          "#c4a97a",
  bg:            "#faf9f6",
  cardBg:        "#ffffff",
  text:          "#1a1916",
  muted:         "#6b6660",
  border:        "rgba(122,144,104,0.12)",
  softBg:        "#f0f3ed",
  accentBg:      "#e3eadf",
  gradient:      "linear-gradient(135deg, #e3eadf 0%, #f0f3ed 100%)",
  heroGradient:  "linear-gradient(160deg, #e8ede4 0%, #f0f3ed 60%, #f5f0e8 100%)",
  iconBg:        "#e3eadf",
  iconColor:     "#7a9068",
  tagBg:         "rgba(122,144,104,0.10)",
  tagColor:      "#7a9068",
  headingWeight: 800,
  radius:        16,
  cardRadius:    16,
  shadow:        "0 2px 12px rgba(122,144,104,0.07)",
  cardShadow:    "0 2px 12px rgba(122,144,104,0.07), 0 1px 3px rgba(0,0,0,0.04)",
  transition:    "all 0.2s ease",
  feel:          "warm and grounded",
}

export const CONTEXT_THEMES: Record<ContextType, ContextTheme> = {

  default: BASE,

  family: {
    ...BASE,
    softBg:       "#f5f0e8",
    accentBg:     "#ede5d4",
    gradient:     "linear-gradient(135deg, #ede5d4 0%, #f5f0e8 100%)",
    heroGradient: "linear-gradient(160deg, #ede5d4 0%, #f5f0e8 60%, #faf6ef 100%)",
    iconBg:       "#ede5d4",
    iconColor:    "#8c7c5e",
    tagBg:        "rgba(196,169,122,0.12)",
    tagColor:     "#8c7c5e",
    radius:       20,
    cardRadius:   20,
    feel:         "cozy and familial",
  },

  story: {
    ...BASE,
    primary:      "#8c7c5e",
    sand:         "#c4a97a",
    softBg:       "#f8f3eb",
    accentBg:     "#f0e8d8",
    gradient:     "linear-gradient(135deg, #f0e8d8 0%, #f8f3eb 100%)",
    heroGradient: "linear-gradient(160deg, #f0e8d8 0%, #f8f3eb 60%, #fdf9f5 100%)",
    iconBg:       "#f0e8d8",
    iconColor:    "#8c7c5e",
    tagBg:        "rgba(140,124,94,0.10)",
    tagColor:     "#8c7c5e",
    headingWeight: 900,
    radius:       14,
    cardRadius:   14,
    shadow:       "0 4px 20px rgba(140,124,94,0.10)",
    cardShadow:   "0 4px 20px rgba(140,124,94,0.10), 0 1px 4px rgba(0,0,0,0.04)",
    feel:         "literary and warm",
  },

  art: {
    ...BASE,
    primary:      "#6b8f5e",
    softBg:       "#edf2e8",
    accentBg:     "#dce8d4",
    gradient:     "linear-gradient(135deg, #dce8d4 0%, #edf2e8 100%)",
    heroGradient: "linear-gradient(160deg, #dce8d4 0%, #edf2e8 60%, #f4f8f0 100%)",
    iconBg:       "#dce8d4",
    iconColor:    "#6b8f5e",
    tagBg:        "rgba(107,143,94,0.10)",
    tagColor:     "#6b8f5e",
    radius:       18,
    cardRadius:   18,
    shadow:       "0 6px 24px rgba(107,143,94,0.12)",
    cardShadow:   "0 6px 24px rgba(107,143,94,0.12), 0 1px 4px rgba(0,0,0,0.04)",
    feel:         "expressive and layered",
  },

  video: {
    ...BASE,
    primary:      "#5a6b52",
    bg:           "#f6f5f2",
    softBg:       "#e8ede4",
    accentBg:     "#d8e0d2",
    gradient:     "linear-gradient(135deg, #d8e0d2 0%, #e8ede4 100%)",
    heroGradient: "linear-gradient(160deg, #2c3a28 0%, #3d4f37 100%)",
    iconBg:       "#d8e0d2",
    iconColor:    "#5a6b52",
    tagBg:        "rgba(90,107,82,0.12)",
    tagColor:     "#5a6b52",
    headingWeight: 900,
    radius:       14,
    cardRadius:   12,
    shadow:       "0 8px 32px rgba(90,107,82,0.15)",
    cardShadow:   "0 8px 32px rgba(90,107,82,0.15), 0 2px 6px rgba(0,0,0,0.06)",
    transition:   "all 0.25s cubic-bezier(0.4,0,0.2,1)",
    feel:         "cinematic and focused",
  },

  memory: {
    ...BASE,
    primary:      "#b8905a",
    sand:         "#d4aa70",
    softBg:       "#faf2e4",
    accentBg:     "#f5e8cc",
    gradient:     "linear-gradient(135deg, #f5e8cc 0%, #faf2e4 100%)",
    heroGradient: "linear-gradient(160deg, #f5e8cc 0%, #faf2e4 60%, #fefaf4 100%)",
    iconBg:       "#f5e8cc",
    iconColor:    "#b8905a",
    tagBg:        "rgba(184,144,90,0.10)",
    tagColor:     "#b8905a",
    radius:       20,
    cardRadius:   20,
    shadow:       "0 4px 20px rgba(184,144,90,0.12)",
    cardShadow:   "0 4px 20px rgba(184,144,90,0.12), 0 1px 4px rgba(0,0,0,0.04)",
    feel:         "nostalgic and golden",
  },

  challenge: {
    ...BASE,
    primary:      "#6d8a4e",
    softBg:       "#ecf4e4",
    accentBg:     "#d8eccc",
    gradient:     "linear-gradient(135deg, #d8eccc 0%, #ecf4e4 100%)",
    heroGradient: "linear-gradient(160deg, #d8eccc 0%, #ecf4e4 60%, #f4f8ee 100%)",
    iconBg:       "#d8eccc",
    iconColor:    "#6d8a4e",
    tagBg:        "rgba(109,138,78,0.10)",
    tagColor:     "#6d8a4e",
    headingWeight: 900,
    radius:       14,
    cardRadius:   14,
    shadow:       "0 6px 24px rgba(109,138,78,0.14)",
    cardShadow:   "0 6px 24px rgba(109,138,78,0.14), 0 2px 6px rgba(0,0,0,0.05)",
    transition:   "all 0.18s ease",
    feel:         "energetic and motivating",
  },

  invention: {
    ...BASE,
    primary:      "#7a8a5e",
    softBg:       "#f0f2e4",
    accentBg:     "#e4e8cc",
    gradient:     "linear-gradient(135deg, #e4e8cc 0%, #f0f2e4 100%)",
    heroGradient: "linear-gradient(160deg, #e4e8cc 0%, #f0f2e4 60%, #f8f8f0 100%)",
    iconBg:       "#e4e8cc",
    iconColor:    "#7a8a5e",
    tagBg:        "rgba(122,138,94,0.10)",
    tagColor:     "#7a8a5e",
    radius:       16,
    cardRadius:   16,
    feel:         "curious and exploratory",
  },

  journey: {
    ...BASE,
    softBg:       "#f0f4ec",
    accentBg:     "#e0ebd8",
    gradient:     "linear-gradient(135deg, #e0ebd8 0%, #f0f4ec 100%)",
    heroGradient: "linear-gradient(160deg, #e0ebd8 0%, #f0f4ec 60%, #f8faf6 100%)",
    iconBg:       "#e0ebd8",
    iconColor:    "#7a9068",
    tagBg:        "rgba(122,144,104,0.10)",
    tagColor:     "#7a9068",
    headingWeight: 800,
    feel:         "grounded and progressive",
  },

  plan: {
    ...BASE,
    softBg:       "#f2f5f0",
    accentBg:     "#e8ede4",
    gradient:     "linear-gradient(135deg, #e8ede4 0%, #f2f5f0 100%)",
    heroGradient: "linear-gradient(160deg, #e8ede4 0%, #f2f5f0 60%, #f8faf6 100%)",
    iconBg:       "#e8ede4",
    iconColor:    "#7a9068",
    radius:       14,
    cardRadius:   14,
    shadow:       "0 2px 8px rgba(122,144,104,0.06)",
    cardShadow:   "0 2px 8px rgba(122,144,104,0.06)",
    feel:         "structured and calm",
  },

  rewards: {
    ...BASE,
    primary:      "#c4a97a",
    sand:         "#e0c99a",
    softBg:       "#fdf7ee",
    accentBg:     "#f8edda",
    gradient:     "linear-gradient(135deg, #f8edda 0%, #fdf7ee 100%)",
    heroGradient: "linear-gradient(160deg, #f8edda 0%, #fdf7ee 60%, #fefcf6 100%)",
    iconBg:       "#f8edda",
    iconColor:    "#c4a97a",
    tagBg:        "rgba(196,169,122,0.12)",
    tagColor:     "#a87c40",
    radius:       20,
    cardRadius:   20,
    shadow:       "0 4px 20px rgba(196,169,122,0.14)",
    cardShadow:   "0 4px 20px rgba(196,169,122,0.14), 0 1px 4px rgba(0,0,0,0.04)",
    feel:         "warm and celebratory",
  },

  store: {
    ...BASE,
    softBg:       "#f5f6f4",
    accentBg:     "#ebeee8",
    gradient:     "linear-gradient(135deg, #ebeee8 0%, #f5f6f4 100%)",
    heroGradient: "linear-gradient(160deg, #ebeee8 0%, #f5f6f4 100%)",
    iconBg:       "#ebeee8",
    iconColor:    "#7a9068",
    headingWeight: 700,
    radius:       12,
    cardRadius:   12,
    shadow:       "0 2px 8px rgba(0,0,0,0.05)",
    cardShadow:   "0 2px 8px rgba(0,0,0,0.05)",
    feel:         "refined and editorial",
  },

  business: {
    ...BASE,
    primary:      "#4a6b5a",
    bg:           "#f8f9f8",
    softBg:       "#edf2ee",
    accentBg:     "#dde8e2",
    gradient:     "linear-gradient(135deg, #dde8e2 0%, #edf2ee 100%)",
    heroGradient: "linear-gradient(160deg, #dde8e2 0%, #edf2ee 60%, #f4f8f5 100%)",
    iconBg:       "#dde8e2",
    iconColor:    "#4a6b5a",
    tagBg:        "rgba(74,107,90,0.10)",
    tagColor:     "#4a6b5a",
    headingWeight: 700,
    radius:       10,
    cardRadius:   10,
    shadow:       "0 2px 8px rgba(0,0,0,0.06)",
    cardShadow:   "0 2px 8px rgba(0,0,0,0.06)",
    feel:         "clean and authoritative",
  },

  health: {
    ...BASE,
    primary:      "#5a8870",
    bg:           "#f8faf9",
    softBg:       "#edf5f0",
    accentBg:     "#ddf0e8",
    gradient:     "linear-gradient(135deg, #ddf0e8 0%, #edf5f0 100%)",
    heroGradient: "linear-gradient(160deg, #ddf0e8 0%, #edf5f0 60%, #f4faf6 100%)",
    iconBg:       "#ddf0e8",
    iconColor:    "#5a8870",
    tagBg:        "rgba(90,136,112,0.10)",
    tagColor:     "#5a8870",
    radius:       14,
    cardRadius:   14,
    shadow:       "0 1px 4px rgba(0,0,0,0.04)",
    cardShadow:   "0 1px 4px rgba(0,0,0,0.05)",
    feel:         "calm and clear",
  },

  legal: {
    ...BASE,
    primary:      "#4a5a6a",
    sand:         "#8a9aaa",
    bg:           "#f8f9fa",
    softBg:       "#edf0f4",
    accentBg:     "#e2e8ef",
    gradient:     "linear-gradient(135deg, #e2e8ef 0%, #edf0f4 100%)",
    heroGradient: "linear-gradient(160deg, #e2e8ef 0%, #edf0f4 60%, #f4f6f8 100%)",
    iconBg:       "#e2e8ef",
    iconColor:    "#4a5a6a",
    tagBg:        "rgba(74,90,106,0.09)",
    tagColor:     "#4a5a6a",
    headingWeight: 700,
    radius:       8,
    cardRadius:   8,
    shadow:       "0 1px 4px rgba(0,0,0,0.06)",
    cardShadow:   "0 1px 4px rgba(0,0,0,0.06)",
    feel:         "precise and trustworthy",
  },

  portal: {
    ...BASE,
    softBg:       "#f0f3ee",
    accentBg:     "#e2ead8",
    gradient:     "linear-gradient(135deg, #e2ead8 0%, #f0f3ee 100%)",
    heroGradient: "linear-gradient(160deg, #e2ead8 0%, #edf2e8 50%, #f5f0e8 100%)",
    iconBg:       "#e2ead8",
    iconColor:    "#7a9068",
    radius:       18,
    cardRadius:   20,
    shadow:       "0 8px 32px rgba(122,144,104,0.10)",
    cardShadow:   "0 8px 32px rgba(122,144,104,0.10), 0 2px 8px rgba(0,0,0,0.04)",
    feel:         "immersive and layered",
  },

  marketing: {
    ...BASE,
    softBg:       "#f0f4ec",
    accentBg:     "#e0ead4",
    gradient:     "linear-gradient(135deg, #7a9068 0%, #5d7a52 100%)",
    heroGradient: "linear-gradient(160deg, #5d7a52 0%, #7a9068 50%, #8fa07a 100%)",
    iconBg:       "#e0ead4",
    iconColor:    "#7a9068",
    headingWeight: 900,
    radius:       20,
    cardRadius:   20,
    shadow:       "0 8px 32px rgba(122,144,104,0.18)",
    cardShadow:   "0 8px 32px rgba(122,144,104,0.18), 0 2px 8px rgba(0,0,0,0.05)",
    transition:   "all 0.22s cubic-bezier(0.4,0,0.2,1)",
    feel:         "bold and expressive",
  },
}

export function getContextTheme(context: ContextType = "default"): ContextTheme {
  return CONTEXT_THEMES[context] ?? CONTEXT_THEMES.default
}

export function creationTypeToContext(type: string): ContextType {
  const map: Record<string, ContextType> = {
    story:     "story",
    art:       "art",
    video:     "video",
    memory:    "memory",
    challenge: "challenge",
    invention: "invention",
    game:      "art",
    app:       "invention",
    idea:      "invention",
    family:    "family",
    journey:   "journey",
    plan:      "plan",
    rewards:   "rewards",
    store:     "store",
    business:  "business",
    health:    "health",
    legal:     "legal",
    portal:    "portal",
    marketing: "marketing",
  }
  return (map[type] as ContextType) ?? "default"
}

export function useContextTheme(context: ContextType = "default"): ContextTheme {
  return useMemo(() => getContextTheme(context), [context])
}
