import { streamEngine, streamSeries } from "@/controller";
// ═══════════════════════════════════════════════════════════════════════════
// IMAGINATION ENGINE — Frontend Intelligence Layer
// Powers the ImaginationLab with creative engine definitions, colors, and
// streaming utilities. All content is fictional, safe, and family-friendly.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Engine Definitions ───────────────────────────────────────────────────────

export interface ImaginationEngineDefinition {
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

export const IMAGINATION_ENGINES: ImaginationEngineDefinition[] = [
  {
    id:          "StoryEngine",
    name:        "Story Engine",
    icon:        "📖",
    color:       "#8b5cf6",
    gradient:    "linear-gradient(135deg, #8b5cf6, #6366f1)",
    tagline:     "Narrative Architect",
    description: "Builds complete story structures — premise, three-act arc, story beats, and thematic core for any genre.",
    placeholder: "What kind of story should I build?",
    example:     "e.g. A coming-of-age fantasy story about a girl who discovers she can communicate with ancient trees",
    series:      "imag",
  },
  {
    id:          "CharacterEngine",
    name:        "Character Engine",
    icon:        "🧑‍🎨",
    color:       "#ec4899",
    gradient:    "linear-gradient(135deg, #ec4899, #f43f5e)",
    tagline:     "Character Architect",
    description: "Designs rich fictional characters with personality, backstory, motivation, arc, and voice.",
    placeholder: "Describe the character you want to create",
    example:     "e.g. A reluctant wizard who lost their memory and must rediscover who they are through their adventures",
    series:      "imag",
  },
  {
    id:          "WorldbuildingEngine",
    name:        "Worldbuilding Engine",
    icon:        "🌍",
    color:       "#10b981",
    gradient:    "linear-gradient(135deg, #10b981, #059669)",
    tagline:     "World Architect",
    description: "Creates entire fictional worlds — geography, cultures, history, power systems, and story hooks.",
    placeholder: "What world do you want to build?",
    example:     "e.g. A floating archipelago of sky islands where different civilizations each control a different element",
    series:      "imag",
  },
  {
    id:          "CreatureEngine",
    name:        "Creature Engine",
    icon:        "🐉",
    color:       "#f59e0b",
    gradient:    "linear-gradient(135deg, #f59e0b, #d97706)",
    tagline:     "Creature Architect",
    description: "Invents original fantasy and sci-fi creatures with biology, behavior, lore, and story role.",
    placeholder: "What kind of creature do you want to invent?",
    example:     "e.g. A bioluminescent deep-sea dragon that feeds on starlight and can walk between dreams",
    series:      "quest",
  },
  {
    id:          "SuperpowerEngine",
    name:        "Superpower Engine",
    icon:        "⚡",
    color:       "#f97316",
    gradient:    "linear-gradient(135deg, #f97316, #ef4444)",
    tagline:     "Ability Architect",
    description: "Designs fictional superpowers with rules, limitations, tiers, origins, and dramatic story uses.",
    placeholder: "What superpower should I design?",
    example:     "e.g. The ability to rewind a single object or place in time by up to 24 hours, but only while asleep",
    series:      "quest",
  },
  {
    id:          "AdventureEngine",
    name:        "Adventure Engine",
    icon:        "🗺️",
    color:       "#06b6d4",
    gradient:    "linear-gradient(135deg, #06b6d4, #0891b2)",
    tagline:     "Adventure Architect",
    description: "Creates complete adventure scenarios — journey maps, challenges, team roles, climax, and resolution.",
    placeholder: "What adventure should the Engine design?",
    example:     "e.g. A group of misfits must cross a continent to deliver a baby phoenix before the winter eclipse",
    series:      "quest",
  },
  {
    id:          "ComicPlotEngine",
    name:        "Comic Plot Engine",
    icon:        "💥",
    color:       "#d946ef",
    gradient:    "linear-gradient(135deg, #d946ef, #a855f7)",
    tagline:     "Comic Architect",
    description: "Generates comic book plot arcs — issues, heroes, villains, visual set pieces, and cliffhangers.",
    placeholder: "What kind of comic story should I plot?",
    example:     "e.g. A teen superhero team that discovers their city is built on top of a sleeping god who is waking up",
    series:      "quest",
  },
  {
    id:          "GameIdeaEngine",
    name:        "Game Idea Engine",
    icon:        "🎮",
    color:       "#3b82f6",
    gradient:    "linear-gradient(135deg, #3b82f6, #6366f1)",
    tagline:     "Game Architect",
    description: "Invents original game concepts with core loop, unique mechanics, world, progression, and art direction.",
    placeholder: "What kind of game should I invent?",
    example:     "e.g. A puzzle platformer where your shadow is an independent AI that sometimes disagrees with your decisions",
    series:      "fiction-tech",
  },
  {
    id:          "FutureTechFictionEngine",
    name:        "Future Tech Fiction",
    icon:        "🚀",
    color:       "#22d3ee",
    gradient:    "linear-gradient(135deg, #22d3ee, #06b6d4)",
    tagline:     "Fictional Tech Architect",
    description: "Imagines fantastic fictional future technologies for stories — narrative descriptions, societal impact, story conflicts. Purely fictional, no real-world technical content.",
    placeholder: "What fictional future technology should I imagine?",
    example:     "e.g. A device that lets people visit their own memories as if they were a video game level",
    series:      "fiction-tech",
  },
  {
    id:          "BlueprintFictionEngine",
    name:        "Blueprint Fiction Engine",
    icon:        "📐",
    color:       "#64748b",
    gradient:    "linear-gradient(135deg, #64748b, #475569)",
    tagline:     "Prop Architect",
    description: "Creates narrative blueprints — fictional artifacts, vehicles, structures, and story props with lore and story function. Entirely fictional storytelling props.",
    placeholder: "What fictional artifact or object should I design?",
    example:     "e.g. An ancient compass that points toward your greatest regret instead of north",
    series:      "fiction-tech",
  },
  {
    id:          "QuestEngine",
    name:        "Quest Engine",
    icon:        "⚔️",
    color:       "#dc2626",
    gradient:    "linear-gradient(135deg, #dc2626, #991b1b)",
    tagline:     "Quest Architect",
    description: "Designs complete quest lines — objectives, journey stages, NPCs, puzzles, choice points, and rewards.",
    placeholder: "What quest should I design?",
    example:     "e.g. A side quest where you must reunite a cursed musician with the melody she gave away to save her village",
    series:      "imag",
  },
  {
    id:          "DreamscapeEngine",
    name:        "Dreamscape Engine",
    icon:        "🌅",
    color:       "#a78bfa",
    gradient:    "linear-gradient(135deg, #a78bfa, #f9a8d4)",
    tagline:     "Atmosphere Architect",
    description: "Generates moods, color palettes, atmospheric scenes, sensory textures, and emotional environments for fictional worlds and stories.",
    placeholder: "What mood or atmosphere should I generate?",
    example:     "e.g. The emotional landscape of an ancient library on a floating island at the moment the last librarian disappears",
    series:      "dreamscape",
  },
  {
    id:          "MagicSystemEngine",
    name:        "Magic System Engine",
    icon:        "🪄",
    color:       "#7c3aed",
    gradient:    "linear-gradient(135deg, #7c3aed, #c084fc)",
    tagline:     "Magic Architect",
    description: "Designs rules-based magic systems with sources, costs, hard limits, side effects, internal logic, and narrative consequences for fictional worlds.",
    placeholder: "What kind of magic system should I design?",
    example:     "e.g. A magic system where practitioners must sacrifice a cherished memory each time they cast a spell — the more powerful the spell, the more precious the memory lost",
    series:      "arcane",
  },
];

// ─── Series Definitions ────────────────────────────────────────────────────────

export interface ImaginationSeriesDefinition {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  gradient: string;
  description: string;
  engines: string[];
  estimatedMinutes: number;
}

export const IMAGINATION_SERIES: ImaginationSeriesDefinition[] = [
  {
    id:               "imag",
    name:             "IMAG-Series",
    symbol:           "IM",
    icon:             "✨",
    gradient:         "linear-gradient(135deg, #8b5cf6, #ec4899, #10b981)",
    description:      "Narrative Trifecta — Story, Character, and World united into a single creative universe. Run all three in sequence to build a complete fictional world ready for any medium.",
    engines:          ["StoryEngine", "CharacterEngine", "WorldbuildingEngine"],
    estimatedMinutes: 3,
  },
  {
    id:               "quest",
    name:             "QUEST-Series",
    symbol:           "QS",
    icon:             "⚔️",
    gradient:         "linear-gradient(135deg, #f59e0b, #d946ef, #06b6d4)",
    description:      "Adventure Trifecta — Creature, Superpower, and Adventure layered to create rich, playable action-adventure scenarios for games, stories, and tabletop play.",
    engines:          ["CreatureEngine", "SuperpowerEngine", "AdventureEngine"],
    estimatedMinutes: 3,
  },
  {
    id:               "fiction-tech",
    name:             "FICTION-TECH-Series",
    symbol:           "FT",
    icon:             "🚀",
    gradient:         "linear-gradient(135deg, #3b82f6, #22d3ee, #64748b)",
    description:      "Technology Fiction Trifecta — Game, Future Tech, and Blueprint Fiction combined to build a richly detailed fictional sci-fi or speculative world with props, games, and technologies.",
    engines:          ["GameIdeaEngine", "FutureTechFictionEngine", "BlueprintFictionEngine"],
    estimatedMinutes: 3,
  },
  {
    id:               "dreamscape",
    name:             "DREAMSCAPE-Series",
    symbol:           "DS",
    icon:             "🌅",
    gradient:         "linear-gradient(135deg, #a78bfa, #f9a8d4, #10b981)",
    description:      "Atmosphere Trifecta — Dreamscape, World, and Character united into one immersive sensory universe. Mood, environment, and inhabitants crafted together in a single creative run.",
    engines:          ["DreamscapeEngine", "WorldbuildingEngine", "CharacterEngine"],
    estimatedMinutes: 3,
  },
  {
    id:               "arcane",
    name:             "ARCANE-Series",
    symbol:           "AR",
    icon:             "🪄",
    gradient:         "linear-gradient(135deg, #7c3aed, #c084fc, #ec4899)",
    description:      "Magic Trifecta — Magic System, Character, and World combined into one complete arcane universe. Rules of magic, the people shaped by it, and the world it has formed — all in one run.",
    engines:          ["MagicSystemEngine", "CharacterEngine", "WorldbuildingEngine"],
    estimatedMinutes: 3,
  },
];

// ─── Color Helpers ────────────────────────────────────────────────────────────

export function getEngineById(id: string): ImaginationEngineDefinition | undefined {
  return IMAGINATION_ENGINES.find(e => e.id === id);
}

export function getEngineColor(id: string): string {
  return getEngineById(id)?.color ?? "#8b5cf6";
}

export function getEngineIcon(id: string): string {
  return getEngineById(id)?.icon ?? "✨";
}

// ─── Stream Helper ────────────────────────────────────────────────────────────

export async function runImaginationEngine(opts: {
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

export async function runImaginationSeries(opts: {
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
