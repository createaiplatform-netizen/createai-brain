// ─── Family Universe Theming System ──────────────────────────────────────────
// One theme per family member. Each theme drives colors, accent, motif, copy tone,
// and default dashboard modules for a uniquely styled but shared-component experience.

export interface FamilyTheme {
  id: string;
  name: string;
  displayName: string;
  emoji: string;
  // Palette
  primary: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  bg: string;
  bgAlt: string;
  text: string;
  muted: string;
  border: string;
  // Gradient for hero/header
  gradientFrom: string;
  gradientTo: string;
  // Character
  motif: string;
  tagline: string;
  tone: "warm" | "bold" | "playful" | "calm" | "earthy" | "elegant" | "cozy" | "industrial";
  // Default quick-action modules shown on home tab
  modules: string[];
}

export const FAMILY_THEMES: Record<string, FamilyTheme> = {

  // 1 ─── Nathan — outdoorsman, kind-hearted, hunting/fishing
  nathan: {
    id: "nathan",
    name: "Nathan",
    displayName: "Nathan",
    emoji: "🎣",
    primary:      "#2d5a1b",
    primaryLight: "#4a7c33",
    accent:       "#8b6914",
    accentLight:  "#c4a43a",
    bg:           "#f3f6ef",
    bgAlt:        "#e8ede3",
    text:         "#1a2010",
    muted:        "#5a6650",
    border:       "rgba(45,90,27,0.12)",
    gradientFrom: "#2d5a1b",
    gradientTo:   "#8b6914",
    motif:        "Forest & Water",
    tagline:      "Out in the wild, steady as the current.",
    tone:         "earthy",
    modules:      ["tools", "memory", "journal", "habits"],
  },

  // 2 ─── Nolan — brilliant, big-picture thinker, dog lover
  nolan: {
    id: "nolan",
    name: "Nolan",
    displayName: "Nolan",
    emoji: "🐕",
    primary:      "#1e3a8a",
    primaryLight: "#2563eb",
    accent:       "#0891b2",
    accentLight:  "#22d3ee",
    bg:           "#f0f4fb",
    bgAlt:        "#e1eaf8",
    text:         "#0f1f3d",
    muted:        "#4b5e8a",
    border:       "rgba(30,58,138,0.12)",
    gradientFrom: "#1e3a8a",
    gradientTo:   "#0891b2",
    motif:        "Innovation & Loyalty",
    tagline:      "Big picture, steady paws.",
    tone:         "bold",
    modules:      ["discover", "tools", "habits", "assistant"],
  },

  // 3 ─── Carolina — bilingual, elegant, balanced
  carolina: {
    id: "carolina",
    name: "Carolina",
    displayName: "Carolina",
    emoji: "🌺",
    primary:      "#92400e",
    primaryLight: "#b45309",
    accent:       "#d97706",
    accentLight:  "#fbbf24",
    bg:           "#fdf8f0",
    bgAlt:        "#f5ede0",
    text:         "#3b1f05",
    muted:        "#78563a",
    border:       "rgba(146,64,14,0.12)",
    gradientFrom: "#92400e",
    gradientTo:   "#d97706",
    motif:        "Balance & Grace",
    tagline:      "Elegance in every language.",
    tone:         "elegant",
    modules:      ["memory", "journal", "family", "safety"],
  },

  // 4 ─── Jenny — sister, ride-or-die, loves cruises, funny
  jenny: {
    id: "jenny",
    name: "Jenny",
    displayName: "Jenny",
    emoji: "⚓",
    primary:      "#0369a1",
    primaryLight: "#0ea5e9",
    accent:       "#06b6d4",
    accentLight:  "#67e8f9",
    bg:           "#f0faff",
    bgAlt:        "#e0f4fd",
    text:         "#082f49",
    muted:        "#2e7da8",
    border:       "rgba(3,105,161,0.12)",
    gradientFrom: "#0369a1",
    gradientTo:   "#06b6d4",
    motif:        "Ocean & Adventure",
    tagline:      "Life is a cruise — enjoy every port.",
    tone:         "playful",
    modules:      ["create", "memory", "messages", "tools"],
  },

  // 5 ─── Shawny "Deuce" — heavy equipment operator
  deuce: {
    id: "deuce",
    name: "Shawny",
    displayName: "Shawny (Deuce)",
    emoji: "🏗️",
    primary:      "#374151",
    primaryLight: "#4b5563",
    accent:       "#92400e",
    accentLight:  "#d97706",
    bg:           "#f4f4f3",
    bgAlt:        "#e8e8e5",
    text:         "#111827",
    muted:        "#6b7280",
    border:       "rgba(55,65,81,0.14)",
    gradientFrom: "#374151",
    gradientTo:   "#92400e",
    motif:        "Built Tough, Heart of Gold",
    tagline:      "Deuce does it right the first time.",
    tone:         "industrial",
    modules:      ["tools", "habits", "journal", "memory"],
  },

  // 6 ─── Shelly — cousin/best friend, supportive, cozy
  shelly: {
    id: "shelly",
    name: "Shelly",
    displayName: "Shelly",
    emoji: "🌸",
    primary:      "#be185d",
    primaryLight: "#db2777",
    accent:       "#9d174d",
    accentLight:  "#f472b6",
    bg:           "#fdf2f8",
    bgAlt:        "#fce7f3",
    text:         "#4a0024",
    muted:        "#9d4a7a",
    border:       "rgba(190,24,93,0.12)",
    gradientFrom: "#be185d",
    gradientTo:   "#f472b6",
    motif:        "Connection & Comfort",
    tagline:      "Always here, always warm.",
    tone:         "cozy",
    modules:      ["messages", "memory", "safety", "family"],
  },

  // 7 ─── Dennis — husband, steady, reliable
  dennis: {
    id: "dennis",
    name: "Dennis",
    displayName: "Dennis",
    emoji: "🤝",
    primary:      "#2563eb",
    primaryLight: "#3b82f6",
    accent:       "#d4a373",
    accentLight:  "#e9c46a",
    bg:           "#f8f9ff",
    bgAlt:        "#eef1fc",
    text:         "#0f1730",
    muted:        "#4b5897",
    border:       "rgba(37,99,235,0.11)",
    gradientFrom: "#2563eb",
    gradientTo:   "#d4a373",
    motif:        "Steady & Reliable",
    tagline:      "The one you can always count on.",
    tone:         "calm",
    modules:      ["tools", "bills", "habits", "assistant"],
  },

  // 8 ─── Nakyllah — daughter, animals/horses, mother of Hadley Jo
  nakyllah: {
    id: "nakyllah",
    name: "Nakyllah",
    displayName: "Nakyllah",
    emoji: "🐴",
    primary:      "#7c3aed",
    primaryLight: "#a78bfa",
    accent:       "#34d399",
    accentLight:  "#86efac",
    bg:           "#fdf4ff",
    bgAlt:        "#f5e8fe",
    text:         "#2d1f4a",
    muted:        "#7c5da0",
    border:       "rgba(124,58,237,0.12)",
    gradientFrom: "#7c3aed",
    gradientTo:   "#34d399",
    motif:        "Countryside & Gentle Hearts",
    tagline:      "Where animals and love run free.",
    tone:         "warm",
    modules:      ["memory", "journal", "create", "family"],
  },

  // 9 ─── Terri — mom, wise, farm/Appaloosa lover
  terri: {
    id: "terri",
    name: "Terri",
    displayName: "Terri",
    emoji: "🌻",
    primary:      "#b45309",
    primaryLight: "#d97706",
    accent:       "#65a30d",
    accentLight:  "#a3e635",
    bg:           "#fefce8",
    bgAlt:        "#fef3c7",
    text:         "#3b2006",
    muted:        "#92714a",
    border:       "rgba(180,83,9,0.12)",
    gradientFrom: "#b45309",
    gradientTo:   "#65a30d",
    motif:        "Farm & Wisdom",
    tagline:      "Rooted in the land, rising with the sun.",
    tone:         "warm",
    modules:      ["tools", "memory", "habits", "journal"],
  },

  // 10 ─── Dad — farmer, kind beneath a rough exterior
  dad: {
    id: "dad",
    name: "Dad",
    displayName: "Dad",
    emoji: "🚜",
    primary:      "#78350f",
    primaryLight: "#92400e",
    accent:       "#d97706",
    accentLight:  "#f59e0b",
    bg:           "#fdf7f0",
    bgAlt:        "#f5ead9",
    text:         "#2c1810",
    muted:        "#8b6244",
    border:       "rgba(120,53,15,0.12)",
    gradientFrom: "#78350f",
    gradientTo:   "#d97706",
    motif:        "Home on the Land",
    tagline:      "Tough outside, gold inside.",
    tone:         "earthy",
    modules:      ["tools", "habits", "memory", "bills"],
  },
};

// Default / fallback — Sara's sage theme
export const DEFAULT_FAMILY_THEME: FamilyTheme = {
  id:           "default",
  name:         "Sara",
  displayName:  "Sara",
  emoji:        "🌿",
  primary:      "#7a9068",
  primaryLight: "#9caf88",
  accent:       "#c4a97a",
  accentLight:  "#e0c898",
  bg:           "#faf9f6",
  bgAlt:        "#f0f3ed",
  text:         "#1a1916",
  muted:        "#6b6660",
  border:       "rgba(122,144,104,0.13)",
  gradientFrom: "#7a9068",
  gradientTo:   "#c4a97a",
  motif:        "Growth & Intention",
  tagline:      "Building something real, together.",
  tone:         "warm",
  modules:      ["home", "family", "memory", "tools", "assistant"],
};

export function getTheme(id: string | null | undefined): FamilyTheme {
  if (!id) return DEFAULT_FAMILY_THEME;
  return FAMILY_THEMES[id] ?? DEFAULT_FAMILY_THEME;
}

export function getAllThemes(): FamilyTheme[] {
  return [DEFAULT_FAMILY_THEME, ...Object.values(FAMILY_THEMES)];
}
