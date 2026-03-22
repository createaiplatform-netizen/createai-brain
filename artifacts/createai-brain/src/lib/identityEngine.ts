// ─── Identity Engine ──────────────────────────────────────────────────────────
// Generates consistent, warm, unique identities for family members.
// All generation is deterministic — same input → same output.

export interface FamilyIdentity {
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  gradientFrom: string;
  gradientTo: string;
}

const ADULT_NAMES = [
  "Oak", "Willow", "Cedar", "Maple", "River", "Harbor", "Meadow", "Clover",
  "Birch", "Sage", "Jasper", "Aspen", "Fern", "Haven", "Brooks", "Forrest",
];

const CHILD_NAMES = [
  "Bloom", "Spark", "Ember", "Cricket", "Pebble", "Firefly", "Clover", "Acorn",
  "Dew", "Sprout", "Whistle", "Glow", "Flutter", "Meadow", "Puddle", "Rainbow",
];

const EMOJIS = [
  "🌱", "🌿", "🍃", "🌸", "🌺", "🌻", "🌼", "🍀",
  "🌲", "🌳", "🦋", "🐝", "⭐", "🌙", "☀️", "🌈",
  "🎐", "🪷", "🪸", "🌾", "🍂", "🐚", "🌊", "🔮",
];

// Warm, safe palette — sage/olive family
const PALETTES = [
  { color: "#7a9068", from: "#7a9068", to: "#5a7048" },
  { color: "#c4a97a", from: "#c4a97a", to: "#a48a5a" },
  { color: "#6a8db5", from: "#6a8db5", to: "#4a6d95" },
  { color: "#9a7ab5", from: "#9a7ab5", to: "#7a5a95" },
  { color: "#e8826a", from: "#e8826a", to: "#c8624a" },
  { color: "#6aab8a", from: "#6aab8a", to: "#4a8b6a" },
  { color: "#d4845a", from: "#d4845a", to: "#b4643a" },
  { color: "#5a7a68", from: "#5a7a68", to: "#3a5a48" },
  { color: "#8a7a68", from: "#8a7a68", to: "#6a5a48" },
  { color: "#6a8a78", from: "#6a8a78", to: "#4a6a58" },
];

function hashString(s: string): number {
  let h = 0;
  for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export function generateIdentity(userId: string, memberType: "adult" | "child" = "adult"): FamilyIdentity {
  const h = hashString(userId);
  const names = memberType === "child" ? CHILD_NAMES : ADULT_NAMES;
  const palette = PALETTES[h % PALETTES.length];

  return {
    displayName: names[h % names.length],
    avatarEmoji: EMOJIS[(h * 7) % EMOJIS.length],
    avatarColor: palette.color,
    gradientFrom: palette.from,
    gradientTo: palette.to,
  };
}

export function getInitials(displayName: string): string {
  return displayName.slice(0, 2).toUpperCase();
}

export interface AvatarProps {
  identity: FamilyIdentity;
  size?: number;
  showEmoji?: boolean;
}

// Generates inline styles for an avatar element
export function avatarStyle(identity: FamilyIdentity, size = 44) {
  return {
    width: size,
    height: size,
    borderRadius: size * 0.45,
    background: `linear-gradient(135deg, ${identity.gradientFrom}, ${identity.gradientTo})`,
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0 as const,
    fontSize: size * 0.45,
  };
}
