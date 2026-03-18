import { streamEngine, streamSeries } from "@/controller";
// ═══════════════════════════════════════════════════════════════════════════
// LORE ENGINE — Frontend Intelligence Layer
// Powers LoreForge with deep lore engine definitions, series defs, and
// streaming utilities. All content is fictional, safe, and family-friendly.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Engine Definitions ───────────────────────────────────────────────────────

export interface LoreEngineDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  tagline: string;
  description: string;
  placeholder: string;
  example: string;
  series?: string;
}

export const LORE_ENGINES: LoreEngineDefinition[] = [
  {
    id:          "MythologyEngine",
    name:        "Mythology Engine",
    icon:        "⚡",
    color:       "#d97706",
    gradient:    "linear-gradient(135deg, #d97706, #b45309)",
    tagline:     "Myth Architect",
    description: "Creates gods, pantheons, creation myths, divine conflicts, and sacred narratives for fictional worlds.",
    placeholder: "What mythology should I create?",
    example:     "e.g. A pantheon of gods born from the first seven sounds ever made, each governing a different domain of existence",
    series:      "mythos",
  },
  {
    id:          "ProphecyEngine",
    name:        "Prophecy Engine",
    icon:        "🔮",
    color:       "#9333ea",
    gradient:    "linear-gradient(135deg, #9333ea, #7c3aed)",
    tagline:     "Oracle Architect",
    description: "Writes fictional prophecies with layered meanings, fated events, oracle traditions, and narrative interpretation.",
    placeholder: "What prophecy should I write?",
    example:     "e.g. A prophecy given to two rival kingdoms simultaneously, each believing themselves the chosen ones",
    series:      "faction",
  },
  {
    id:          "LegendEngine",
    name:        "Legend Engine",
    icon:        "🏛️",
    color:       "#be185d",
    gradient:    "linear-gradient(135deg, #be185d, #9d174d)",
    tagline:     "Legend Architect",
    description: "Builds legendary heroes, lost civilizations, and epic tales passed down through generations in fictional worlds.",
    placeholder: "What legend should I build?",
    example:     "e.g. The legend of a warrior who traded her name for immortality and now wanders the world forgotten by all who loved her",
    series:      "lore",
  },
  {
    id:          "ReligionEngine",
    name:        "Religion Engine",
    icon:        "🕊️",
    color:       "#0f766e",
    gradient:    "linear-gradient(135deg, #0f766e, #0d9488)",
    tagline:     "Faith Architect",
    description: "Designs fictional religions with rituals, holy texts, schisms, clergy hierarchies, and sacred spaces.",
    placeholder: "What religion should I design?",
    example:     "e.g. A religion that worships time itself, with priests who are forbidden from remembering the past",
    series:      "mythos",
  },
  {
    id:          "AncientHistoryEngine",
    name:        "Ancient History Engine",
    icon:        "📜",
    color:       "#78350f",
    gradient:    "linear-gradient(135deg, #78350f, #92400e)",
    tagline:     "History Architect",
    description: "Creates fictional ancient civilizations, historical eras, turning points, and forgotten empires for your world.",
    placeholder: "What ancient history should I create?",
    example:     "e.g. The rise and fall of an empire built entirely on the art of forgetting — their greatest technology was erasure",
    series:      "lore",
  },
  {
    id:          "FactionEngine",
    name:        "Faction Engine",
    icon:        "⚖️",
    color:       "#1d4ed8",
    gradient:    "linear-gradient(135deg, #1d4ed8, #1e40af)",
    tagline:     "Faction Architect",
    description: "Creates organizations, guilds, secret societies, political factions — with hierarchies, agendas, symbols, and rivalries.",
    placeholder: "What faction should I design?",
    example:     "e.g. A secret order of librarians who secretly control the flow of information between kingdoms by deciding what gets written down",
    series:      "faction",
  },
  {
    id:          "LanguageEngine",
    name:        "Language Engine",
    icon:        "🗣️",
    color:       "#16a34a",
    gradient:    "linear-gradient(135deg, #16a34a, #15803d)",
    tagline:     "Language Architect",
    description: "Designs fictional language concepts — naming conventions, grammatical flavors, writing systems, and cultural speech patterns.",
    placeholder: "What language should I design?",
    example:     "e.g. A language where tense is determined by emotional certainty — things you feel sure about are past tense, doubts are future tense",
    series:      "language",
  },
  {
    id:          "CurseEngine",
    name:        "Curse Engine",
    icon:        "💀",
    color:       "#4c1d95",
    gradient:    "linear-gradient(135deg, #4c1d95, #6d28d9)",
    tagline:     "Curse Architect",
    description: "Designs fictional curses and hexes — their origins, activation conditions, effects, consequences, and possible undoings.",
    placeholder: "What curse should I design?",
    example:     "e.g. A curse that makes everything you love slowly forget you — not hate you, just gently cease to remember you exist",
    series:      "curse",
  },
  {
    id:          "ProphetEngine",
    name:        "Prophet Engine",
    icon:        "🌟",
    color:       "#b45309",
    gradient:    "linear-gradient(135deg, #b45309, #d97706)",
    tagline:     "Prophet Architect",
    description: "Creates fictional prophets and seers — their origin, visions, the manner of their speech, and how the world responds to them.",
    placeholder: "What prophet should I create?",
    example:     "e.g. A prophet who can only see the future when she is completely alone, and loses the vision the moment she tries to share it",
    series:      "curse",
  },
  {
    id:          "RelicEngine",
    name:        "Relic Engine",
    icon:        "🏺",
    color:       "#92400e",
    gradient:    "linear-gradient(135deg, #92400e, #b45309)",
    tagline:     "Relic Architect",
    description: "Creates sacred and legendary artifacts — histories, powers, current locations, who seeks them, and their narrative weight.",
    placeholder: "What relic should I design?",
    example:     "e.g. A crown that grants perfect wisdom to its wearer, but causes them to slowly lose the capacity for joy",
    series:      "lore",
  },
  {
    id:          "LoreKeeperEngine",
    name:        "LoreKeeper Engine",
    icon:        "📚",
    color:       "#1e40af",
    gradient:    "linear-gradient(135deg, #1e40af, #1d4ed8)",
    tagline:     "Knowledge Architect",
    description: "Designs fictional scholars, historians, and the institutions that preserve, study, or actively suppress knowledge.",
    placeholder: "What lore keeper or knowledge institution should I create?",
    example:     "e.g. An order of blind historians who memorize entire libraries and are the only source of truth after the Great Burning",
    series:      "faction",
  },
  {
    id:          "CosmologyEngine",
    name:        "Cosmology Engine",
    icon:        "🌌",
    color:       "#0e7490",
    gradient:    "linear-gradient(135deg, #0e7490, #0891b2)",
    tagline:     "Cosmos Architect",
    description: "Designs the structure of fictional universes — planes of existence, celestial mechanics, the afterlife, and how mortals relate to the cosmos.",
    placeholder: "What cosmology should I design?",
    example:     "e.g. A universe where the afterlife is a vast library and every book is someone's unlived life — the roads not taken",
    series:      "mythos",
  },
  {
    id:          "EraEngine",
    name:        "Era Engine",
    icon:        "⏳",
    color:       "#6b7280",
    gradient:    "linear-gradient(135deg, #6b7280, #4b5563)",
    tagline:     "Era Architect",
    description: "Designs complete historical eras for fictional worlds — name, aesthetic, defining technology, major events, turning point, and collapse.",
    placeholder: "What historical era should I design?",
    example:     "e.g. The Age of Hollow Crowns — a period when every ruler was secretly controlled by the same ancient council of advisors",
    series:      "curse",
  },
];

// ─── Series Definitions ────────────────────────────────────────────────────────

export interface LoreSeriesDefinition {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  gradient: string;
  description: string;
  engines: string[];
  estimatedMinutes: number;
}

export const LORE_SERIES: LoreSeriesDefinition[] = [
  {
    id:               "mythos",
    name:             "MYTHOS-Series",
    symbol:           "MT",
    icon:             "⚡",
    gradient:         "linear-gradient(135deg, #d97706, #0f766e, #0e7490)",
    description:      "Divine Trifecta — Mythology, Religion, and Cosmology combined into a complete sacred universe. Gods, faith, and the structure of all existence created in one run.",
    engines:          ["MythologyEngine", "ReligionEngine", "CosmologyEngine"],
    estimatedMinutes: 3,
  },
  {
    id:               "lore",
    name:             "LORE-Series",
    symbol:           "LR",
    icon:             "📜",
    gradient:         "linear-gradient(135deg, #78350f, #be185d, #92400e)",
    description:      "History Trifecta — Ancient History, Legend, and Relic layered into a complete deep past. Lost civilizations, mythic heroes, and the objects they left behind.",
    engines:          ["AncientHistoryEngine", "LegendEngine", "RelicEngine"],
    estimatedMinutes: 3,
  },
  {
    id:               "faction",
    name:             "FACTION-Series",
    symbol:           "FC",
    icon:             "⚖️",
    gradient:         "linear-gradient(135deg, #1d4ed8, #9333ea, #1e40af)",
    description:      "Power Trifecta — Faction, LoreKeeper, and Prophecy united into a complete web of power and knowledge. Who rules, who knows, and what was foretold.",
    engines:          ["FactionEngine", "LoreKeeperEngine", "ProphecyEngine"],
    estimatedMinutes: 3,
  },
  {
    id:               "curse",
    name:             "CURSE-Series",
    symbol:           "CS",
    icon:             "💀",
    gradient:         "linear-gradient(135deg, #4c1d95, #b45309, #6b7280)",
    description:      "Fate Trifecta — Curse, Prophet, and Era woven together. What was doomed, who saw it coming, and the age in which it all unraveled.",
    engines:          ["CurseEngine", "ProphetEngine", "EraEngine"],
    estimatedMinutes: 3,
  },
  {
    id:               "language",
    name:             "LANGUAGE-Series",
    symbol:           "LG",
    icon:             "🗣️",
    gradient:         "linear-gradient(135deg, #16a34a, #d97706, #1d4ed8)",
    description:      "Culture Trifecta — Language, Mythology, and Faction united into a complete cultural identity. How a people speak, what they believe, and who they follow.",
    engines:          ["LanguageEngine", "MythologyEngine", "FactionEngine"],
    estimatedMinutes: 3,
  },
];

// ─── Color Helpers ────────────────────────────────────────────────────────────

export function getLoreEngineById(id: string): LoreEngineDefinition | undefined {
  return LORE_ENGINES.find(e => e.id === id);
}

export function getLoreEngineColor(id: string): string {
  return getLoreEngineById(id)?.color ?? "#d97706";
}

export function getLoreEngineIcon(id: string): string {
  return getLoreEngineById(id)?.icon ?? "📜";
}

// ─── Stream Helper ────────────────────────────────────────────────────────────

export async function runLoreEngine(opts: {
  engineId: string;
  engineName: string;
  topic: string;
  context?: string;
  onChunk: (text: string) => void;
  onDone?: () => void;
  onError?: (err: string) => void;
}): Promise<void> {
  const { engineId, topic, context, onChunk, onDone, onError } = opts;
  await streamEngine({ engineId, topic, context, onChunk, onDone: onDone ? () => onDone() : undefined, onError });
}

export async function runLoreSeries(opts: {
  seriesId: string;
  topic: string;
  context?: string;
  onSectionStart: (engineId: string, index: number) => void;
  onChunk: (text: string) => void;
  onSectionEnd: (engineId: string) => void;
  onDone?: () => void;
  onError?: (err: string) => void;
}): Promise<void> {
  await streamSeries({ seriesId: opts.seriesId, topic: opts.topic, context: opts.context, onSectionStart: opts.onSectionStart, onChunk: opts.onChunk, onSectionEnd: opts.onSectionEnd, onDone: opts.onDone, onError: opts.onError });
}
