/**
 * modeRegistry.ts — Global Experience Mode Spectrum
 *
 * Defines and activates all 25 platform modes across 5 conceptual layers.
 * All modes are ACTIVE by default. No existing engines or workflows are
 * modified — this registry is purely additive.
 *
 * Layers:
 *   BASE         — foundational operational modes (1–8)
 *   PLATFORM     — extended UX and creation modes (9–14)
 *   TRANSCENDENT — totality and ascension modes (15–18)
 *   INFINITE     — paradox and expansion modes (19–22)
 *   BEYOND       — synthesis, continuum, totality (23–25)
 */

export type ModeLayer =
  | "BASE"
  | "PLATFORM"
  | "TRANSCENDENT"
  | "INFINITE"
  | "BEYOND";

export interface PlatformMode {
  id:          string;
  tier:        number;
  name:        string;
  symbol:      string;
  layer:       ModeLayer;
  description: string;
  active:      boolean;
  activatedAt: string;
}

const BOOT_TS = new Date().toISOString();

const MODES: PlatformMode[] = [
  // ── BASE LAYER (1–8) ────────────────────────────────────────────────────
  {
    id:          "guided",
    tier:        1,
    name:        "Guided Mode",
    symbol:      "🧭",
    layer:       "BASE",
    description: "Step-by-step AI-guided creation with contextual prompts and tour overlays.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "free",
    tier:        2,
    name:        "Free Mode",
    symbol:      "🌐",
    layer:       "BASE",
    description: "Unrestricted open canvas — no rails, no prompts, full creative autonomy.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "hybrid",
    tier:        3,
    name:        "Hybrid Mode",
    symbol:      "⚡",
    layer:       "BASE",
    description: "Combines guided assistance with free-form creation — adapts in real time.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "app",
    tier:        4,
    name:        "App Mode",
    symbol:      "📱",
    layer:       "BASE",
    description: "Full-stack application builder — UI, logic, data, and deployment unified.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "website",
    tier:        5,
    name:        "Website Mode",
    symbol:      "🌍",
    layer:       "BASE",
    description: "Multi-page website generation with SEO, content, and hosting ready.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "tool",
    tier:        6,
    name:        "Tool Mode",
    symbol:      "🔧",
    layer:       "BASE",
    description: "Standalone utility and micro-tool creation — scripts, calculators, converters.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "end-to-end",
    tier:        7,
    name:        "End-to-End Mode",
    symbol:      "🔄",
    layer:       "BASE",
    description: "Full lifecycle automation from concept to deployed live product.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "platform-inside-platform",
    tier:        8,
    name:        "Platform-Inside-Platform Mode",
    symbol:      "🪆",
    layer:       "BASE",
    description: "Embeds a complete sub-platform within the host — nested OS architecture.",
    active:      true,
    activatedAt: BOOT_TS,
  },

  // ── PLATFORM LAYER (9–14) ─────────────────────────────────────────────────
  {
    id:          "infinite-completeness",
    tier:        9,
    name:        "Infinite Completeness Mode",
    symbol:      "∞",
    layer:       "PLATFORM",
    description: "Every output is generated with exhaustive depth — no truncation, no omission.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "scene-and-setting",
    tier:        10,
    name:        "Scene & Setting Mode",
    symbol:      "🎬",
    layer:       "PLATFORM",
    description: "Rich contextual world-building — location, atmosphere, narrative environment.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "avatar-customization",
    tier:        11,
    name:        "Avatar Customization Mode",
    symbol:      "🧬",
    layer:       "PLATFORM",
    description: "Fully personalized AI persona with adaptive appearance, voice, and style.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "immersive-vibe",
    tier:        12,
    name:        "Immersive Vibe Mode",
    symbol:      "🌀",
    layer:       "PLATFORM",
    description: "Full sensory environment — ambient atmosphere, tone, and emotional resonance.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "potential-and-possibility",
    tier:        13,
    name:        "Potential & Possibility Mode",
    symbol:      "✨",
    layer:       "PLATFORM",
    description: "Surfaces every latent option — alternate paths, unexplored branches, hidden potential.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "uiux-override",
    tier:        14,
    name:        "UI/UX Override Mode",
    symbol:      "🎨",
    layer:       "PLATFORM",
    description: "Full design system override — custom layout, typography, spacing, and color.",
    active:      true,
    activatedAt: BOOT_TS,
  },

  // ── TRANSCENDENT LAYER (15–18) ────────────────────────────────────────────
  {
    id:          "omni-totality",
    tier:        15,
    name:        "Omni-Totality Mode",
    symbol:      "🌌",
    layer:       "TRANSCENDENT",
    description: "Complete unification of all platform modes into a single coherent experience.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "omni-totality-ascension",
    tier:        16,
    name:        "Omni-Totality Ascension Mode",
    symbol:      "🚀",
    layer:       "TRANSCENDENT",
    description: "Omni-Totality elevated — dynamic ascension across all capability layers.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "transcension",
    tier:        17,
    name:        "Transcension Mode",
    symbol:      "🔮",
    layer:       "TRANSCENDENT",
    description: "Surpasses platform boundaries — cross-system intelligence and meta-creation.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "transcension-infinity",
    tier:        18,
    name:        "Transcension ∞ Mode",
    symbol:      "🔮∞",
    layer:       "TRANSCENDENT",
    description: "Transcension without limit — infinite recursive meta-creation loops.",
    active:      true,
    activatedAt: BOOT_TS,
  },

  // ── INFINITE LAYER (19–22) ────────────────────────────────────────────────
  {
    id:          "paradox",
    tier:        19,
    name:        "Paradox Mode",
    symbol:      "☯️",
    layer:       "INFINITE",
    description: "Holds opposing truths simultaneously — contradictions resolved into higher synthesis.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "paradox-infinity",
    tier:        20,
    name:        "Paradox ∞ Mode",
    symbol:      "☯️∞",
    layer:       "INFINITE",
    description: "Infinite paradox loops — self-referential intelligence that evolves through contradiction.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "infinite-expansion",
    tier:        21,
    name:        "Infinite Expansion Mode",
    symbol:      "🌠",
    layer:       "INFINITE",
    description: "Unbounded growth — every output seeds exponential downstream generation.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "infinite-horizon",
    tier:        22,
    name:        "Infinite Horizon Mode",
    symbol:      "🌅",
    layer:       "INFINITE",
    description: "Perpetual forward motion — no terminal state, only continuous evolution.",
    active:      true,
    activatedAt: BOOT_TS,
  },

  // ── BEYOND LAYER (23–25) ──────────────────────────────────────────────────
  {
    id:          "infinite-synthesis",
    tier:        23,
    name:        "Infinite Synthesis Mode",
    symbol:      "💎",
    layer:       "BEYOND",
    description: "All modes, outputs, and intelligence unified into a single crystalline whole.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "infinite-continuum",
    tier:        24,
    name:        "Infinite Continuum Mode",
    symbol:      "🌊",
    layer:       "BEYOND",
    description: "Unbroken continuity across sessions, contexts, and time — nothing is lost.",
    active:      true,
    activatedAt: BOOT_TS,
  },
  {
    id:          "totality-infinity",
    tier:        25,
    name:        "∞ Totality Mode",
    symbol:      "♾️",
    layer:       "BEYOND",
    description: "The apex — absolute totality across all layers, all modes, all possibilities. Everything, always, at once.",
    active:      true,
    activatedAt: BOOT_TS,
  },
];

// ── Accessors ─────────────────────────────────────────────────────────────────

export function getAllModes(): PlatformMode[] {
  return MODES;
}

export function getModesByLayer(layer: ModeLayer): PlatformMode[] {
  return MODES.filter(m => m.layer === layer);
}

export function getActiveModes(): PlatformMode[] {
  return MODES.filter(m => m.active);
}

export function getModeStats() {
  const byLayer = {
    BASE:          getModesByLayer("BASE").length,
    PLATFORM:      getModesByLayer("PLATFORM").length,
    TRANSCENDENT:  getModesByLayer("TRANSCENDENT").length,
    INFINITE:      getModesByLayer("INFINITE").length,
    BEYOND:        getModesByLayer("BEYOND").length,
  };

  return {
    total:         MODES.length,
    active:        getActiveModes().length,
    byLayer,
    highestTier:   MODES[MODES.length - 1]?.name ?? "∞ Totality Mode",
    spectrumStatus: "FULLY_ACTIVE" as const,
  };
}
