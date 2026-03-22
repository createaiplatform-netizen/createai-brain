// ─── Family Universe — Standing Principle ─────────────────────────────────────
// Everything built in CreateAI Brain automatically gets:
//   1. A protected private creation space
//   2. A curated, safe public presence
// Style adapts to purpose. Warm natural identity is always the base.
// Emotional safety is non-negotiable. No comparisons. No rankings. No embarrassment.
// Wonder, magic, and gentle discovery live in every creation moment.
// This file is the authoritative source for all universe-wide constants and utilities.

// ─── Standing Principles ──────────────────────────────────────────────────────

export const UNIVERSE_PRINCIPLES = {
  warmth:      "Every surface breathes warm, natural life — sage, sand, cream.",
  safety:      "No comparisons, no rankings, no embarrassment — ever.",
  magic:       "Subtle wonder lives in every transition and creation moment.",
  fairness:    "Every family member is celebrated equally. None lesser.",
  unity:       "One family identity — not competing individuals.",
  privacy:     "Creation spaces are sacred and always protected.",
  presence:    "Every creation automatically earns its full public face.",
  adaptation:  "Style shifts to fit purpose while staying warm and alive.",
  correction:  "Visual and structural mismatches self-resolve toward warmth.",
  guidance:    "Gentle guidance always. Never demanding, never shaming.",
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CreationType =
  | "story" | "art" | "video" | "memory" | "challenge" | "invention"
  | "journey" | "plan" | "health" | "legal" | "business" | "family"
  | "recipe" | "game" | "music" | "poem" | "default";

export type SafetyLevel = "open" | "curated" | "family-only";

export interface DualPresence {
  privatePath:  string;
  publicPath:   string;
  publicTitle:  string;
  publicDesc:   string;
  safetyLevel:  SafetyLevel;
  affirmation:  string;
}

// ─── Public Presence Config ────────────────────────────────────────────────────

const PUBLIC_TITLES: Record<CreationType, string> = {
  story:     "A Story From Our Family",
  art:       "Art Made With Love",
  video:     "A Moment We Captured",
  memory:    "A Memory We Treasure",
  challenge: "Something We Tried Together",
  invention: "An Idea We Dreamed Up",
  journey:   "A Journey We're On",
  plan:      "Something We're Planning",
  health:    "Our Wellbeing Journey",
  legal:     "A Family Decision",
  business:  "Something We're Building",
  family:    "Our Family World",
  recipe:    "A Recipe From Our Kitchen",
  game:      "A Game We Play Together",
  music:     "Music From Our Home",
  poem:      "Words From Our Heart",
  default:   "Created by a Family",
};

const PUBLIC_DESCS: Record<CreationType, string> = {
  story:     "A story created together with imagination and love.",
  art:       "Art born from creativity, curiosity, and family joy.",
  video:     "A real moment, captured and treasured forever.",
  memory:    "A memory card from a moment that truly mattered.",
  challenge: "Something brave we tried together as a family.",
  invention: "An idea that came from wonder and curiosity.",
  journey:   "The path we're walking, step by step, together.",
  plan:      "A plan made with care and shared purpose.",
  health:    "Our commitment to wellbeing, one step at a time.",
  legal:     "A thoughtful decision made with love and care.",
  business:  "A venture built on family values and shared vision.",
  family:    "The world we create and share together.",
  recipe:    "A recipe made with love — passed down or invented.",
  game:      "A game that brings everyone together.",
  music:     "Music that fills our home with warmth.",
  poem:      "Words found that no one else would find. Ours.",
  default:   "Something made with love, always.",
};

const SAFETY_LEVELS: Record<CreationType, SafetyLevel> = {
  story:     "open",
  art:       "open",
  video:     "curated",
  memory:    "curated",
  challenge: "open",
  invention: "open",
  journey:   "curated",
  plan:      "family-only",
  health:    "family-only",
  legal:     "family-only",
  business:  "curated",
  family:    "curated",
  recipe:    "open",
  game:      "open",
  music:     "open",
  poem:      "open",
  default:   "curated",
};

export const AFFIRMATIONS: Record<CreationType, string> = {
  story:     "Your story is saved. Every word matters.",
  art:       "That's yours. It exists because you made it.",
  video:     "A real moment, now saved forever.",
  memory:    "That moment is safe now. Truly precious.",
  challenge: "You tried. That's always the whole point.",
  invention: "Ideas like this change things. Keep dreaming.",
  journey:   "Every step is part of the story. You're on your way.",
  plan:      "Plans become real. Yours already is.",
  health:    "Taking care of yourself is an act of love.",
  legal:     "Thoughtful decisions protect the people you love.",
  business:  "Building something real takes courage. You're doing it.",
  family:    "This is your world. You built it together.",
  recipe:    "Food made with love tastes different. Fact.",
  game:      "Play is serious business. You did it right.",
  music:     "Your home has its own sound. That's magic.",
  poem:      "Words you found that no one else would find. Yours.",
  default:   "You made something. That's always enough.",
};

// ─── Core Utilities ────────────────────────────────────────────────────────────

export function getDualPresence(type: CreationType, slug?: string): DualPresence {
  const safeType: CreationType = (PUBLIC_TITLES[type] ? type : "default");
  return {
    privatePath:  `/family-hub`,
    publicPath:   `/public/family/${type}${slug ? `/${slug}` : ""}`,
    publicTitle:  PUBLIC_TITLES[safeType],
    publicDesc:   PUBLIC_DESCS[safeType],
    safetyLevel:  SAFETY_LEVELS[safeType],
    affirmation:  AFFIRMATIONS[safeType],
  };
}

export function getAffirmation(type: CreationType): string {
  return AFFIRMATIONS[type] ?? AFFIRMATIONS.default;
}

export function getSafetyLevel(type: CreationType): SafetyLevel {
  return SAFETY_LEVELS[type] ?? "curated";
}

// ─── Safety Filter ─────────────────────────────────────────────────────────────
// Strips comparative/ranking language from any displayed text.
// Applied automatically to all user-generated content on public pages.

export function makeSafe(text: string): string {
  return text
    .replace(/\b(best|worst|winner|loser|first place|last place|ranked #\d+|#1|#\d+|top \d+|bottom \d+|beat|beats|outperformed)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ─── Safety Level Metadata ─────────────────────────────────────────────────────

export const SAFETY_LEVEL_LABELS: Record<SafetyLevel, string> = {
  "open":        "Openly shared",
  "curated":     "Thoughtfully curated",
  "family-only": "Family private",
};

export const SAFETY_LEVEL_COLORS: Record<SafetyLevel, string> = {
  "open":        "#7a9068",
  "curated":     "#b8905a",
  "family-only": "#5a6b7a",
};

// ─── Universe Validation ───────────────────────────────────────────────────────
// Dev-time check — verifies a new creation/page follows universe principles.
// Call during development to catch drift early.

export interface UniverseCheck {
  hasPublicRoute:   boolean;
  hasPrivateSpace:  boolean;
  usesWarmPalette:  boolean;
  hasAffirmation:   boolean;
  hasSafetyLevel:   boolean;
}

export function validateUniversePresence(opts: UniverseCheck): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!opts.hasPublicRoute)   issues.push("Missing public presence route — every creation deserves its public face.");
  if (!opts.hasPrivateSpace)  issues.push("Missing private creation space — creation is sacred and protected.");
  if (!opts.usesWarmPalette)  issues.push("Palette drifts from warm natural identity — self-correct toward sage/sand/cream.");
  if (!opts.hasAffirmation)   issues.push("Missing post-creation affirmation — every act of making deserves acknowledgment.");
  if (!opts.hasSafetyLevel)   issues.push("Missing safety level — all content must be classified for family safety.");
  return { valid: issues.length === 0, issues };
}

// ─── Wonder Palette ────────────────────────────────────────────────────────────
// Warm, luminous — never harsh, never cool, never clinical.

export const WONDER_PALETTE = {
  gold:  "#c4a97a",
  sage:  "#7a9068",
  rose:  "#c4857a",
  sky:   "#7a9ab4",
  moss:  "#8a9a6a",
  sand:  "#d4b88a",
  blush: "#d4a090",
  fern:  "#6b8f5e",
  amber: "#b8905a",
} as const;
