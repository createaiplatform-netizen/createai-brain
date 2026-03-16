// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL STORY ENGINE + CHARACTER ENGINE + WORLD ENGINE
// Points 15 + 16 + 17 of the Universal Creative System.
// INTERNAL · FICTIONAL · DEMO-ONLY · NON-OPERATIONAL.
// All characters, worlds, stories, and narratives are entirely fictional.
// No real persons, places, or events are represented.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Story Engine Types ────────────────────────────────────────────────────

export type StoryFormat =
  | "movie" | "tv-series" | "documentary" | "comic" | "graphic-novel"
  | "novel" | "short-story" | "interactive" | "audio-drama" | "stage-play"
  | "web-series" | "mini-series";

export type StoryGenre =
  | "drama" | "thriller" | "sci-fi" | "fantasy" | "horror" | "romance"
  | "comedy" | "mystery" | "action" | "historical" | "biographical" | "experimental";

export interface StoryTheme {
  name:       string;
  expression: string;
  symbol:     string;
  motif:      string;
}

export interface StoryAct {
  actNumber:   number;
  name:        string;
  summary:     string;
  keyEvents:   string[];
  turning:     string;
  emotion:     string;
  pageRange:   string;
}

export interface StoryProject {
  id:           string;
  title:        string;
  format:       StoryFormat;
  genre:        StoryGenre;
  logline:      string;
  synopsis:     string;
  themes:       StoryTheme[];
  acts:         StoryAct[];
  conflict:     string;
  resolution:   string;
  narrativeStyle: string;
  pov:          string;
  tone:         string;
  audienceAge:  string;
  runtime:      string;
  disclaimer:   string;
  generatedAt:  string;
}

// ─── Character Engine Types ────────────────────────────────────────────────

export type CharacterArchetype =
  | "hero" | "mentor" | "trickster" | "shadow" | "herald" | "shapeshifter"
  | "guardian" | "ally" | "villain" | "anti-hero" | "everyman" | "innocent";

export type CharacterRole =
  | "protagonist" | "antagonist" | "supporting" | "comic-relief"
  | "love-interest" | "foil" | "narrator" | "ensemble";

export interface CharacterAbility {
  name:        string;
  type:        "physical" | "mental" | "social" | "supernatural" | "technical";
  description: string;
  strength:    number;
  limitation:  string;
}

export interface CharacterArc {
  startState:  string;
  journey:     string;
  endState:    string;
  growthTheme: string;
}

export interface CharacterRelationship {
  characterName: string;
  type:   "ally" | "rival" | "mentor" | "romantic" | "family" | "antagonistic" | "complex";
  dynamic: string;
}

export interface CharacterProfile {
  id:            string;
  name:          string;
  age:           string;
  archetype:     CharacterArchetype;
  role:          CharacterRole;
  personality:   string[];
  motivation:    string;
  fear:          string;
  secret:        string;
  backstory:     string;
  abilities:     CharacterAbility[];
  arc:           CharacterArc;
  relationships: CharacterRelationship[];
  appearance:    string;
  voiceStyle:    string;
  catchphrase:   string;
  disclaimer:    string;
  generatedAt:   string;
}

// ─── World Engine Types ────────────────────────────────────────────────────

export type WorldType =
  | "fantasy" | "sci-fi" | "contemporary" | "historical" | "post-apocalyptic"
  | "alternate-history" | "mythological" | "horror" | "utopia" | "dystopia";

export interface WorldRegion {
  name:        string;
  terrain:     string;
  climate:     string;
  inhabitants: string;
  keyLocation: string;
  hazards:     string;
}

export interface WorldFaction {
  name:       string;
  ideology:   string;
  leader:     string;
  goal:       string;
  conflict:   string;
  symbol:     string;
}

export interface WorldDefinition {
  id:          string;
  name:        string;
  type:        WorldType;
  tagline:     string;
  description: string;
  regions:     WorldRegion[];
  factions:    WorldFaction[];
  history:     string[];
  culture:     string;
  technology:  string;
  magic:       string | null;
  economy:     string;
  politics:    string;
  ecology:     string;
  languages:   string[];
  calendar:    string;
  disclaimer:  string;
  generatedAt: string;
}

// ─── Story templates ───────────────────────────────────────────────────────

const THEMES: StoryTheme[] = [
  { name: "Identity",        expression: "Who are we when stripped of all we know?",       symbol: "Mirror",       motif: "Reflection, disguise, masks" },
  { name: "Power & Corruption", expression: "Does power inevitably corrupt?",              symbol: "Crown",        motif: "Ascending hierarchy, blind followers" },
  { name: "Love & Sacrifice",  expression: "What are we willing to lose for love?",        symbol: "Burning rose", motif: "Lovers separated, reunion, cost" },
  { name: "Redemption",      expression: "Is it ever too late to change?",                symbol: "Dawn light",   motif: "The return, the broken object restored" },
  { name: "Truth",           expression: "What happens when the truth costs everything?", symbol: "Cracked glass", motif: "Revelation, denial, acceptance" },
  { name: "Freedom",         expression: "Can true freedom exist within structure?",       symbol: "Open cage",    motif: "The open road, the closed door" },
  { name: "Legacy",          expression: "What do we leave behind, and does it define us?", symbol: "Fading photo", motif: "The inheritance, the letter, the statue" },
  { name: "Fear",            expression: "What we fear most often reveals what we value most.", symbol: "Darkness", motif: "The thing in the corner, the unseen threat" },
];

const THREE_ACT: Omit<StoryAct, "actNumber">[] = [
  { name: "Setup", summary: "Establish the world, protagonist, and inciting incident. Stakes are defined.", keyEvents: ["Protagonist introduced in their world", "Inciting incident disrupts status quo", "Protagonist commits to crossing the threshold"], turning: "The Call to Action — protagonist can no longer return to ordinary life.", emotion: "Curiosity → Tension", pageRange: "pp. 1–30 (film) / ch. 1–6 (novel)" },
  { name: "Confrontation", summary: "Protagonist pursues goal, faces escalating obstacles, reaches darkest moment.", keyEvents: ["First attempt fails — new approach needed", "Alliances form and fracture", "Midpoint revelation shifts the story", "Protagonist hits rock bottom — all seems lost"], turning: "The Dark Night of the Soul — everything falls apart before the final push.", emotion: "Hope → Despair → Determination", pageRange: "pp. 31–90 (film) / ch. 7–20 (novel)" },
  { name: "Resolution", summary: "Protagonist faces final conflict with newfound truth. Resolution — earned or tragic.", keyEvents: ["Final confrontation with antagonist/obstacle", "Climax — the decisive moment", "Resolution — new equilibrium established", "Epilogue — echo of the theme"], turning: "The Climax — the protagonist uses their arc's growth to resolve the conflict.", emotion: "Urgency → Relief/Catharsis → Reflection", pageRange: "pp. 91–120 (film) / ch. 21–25 (novel)" },
];

function buildActs(format: StoryFormat): StoryAct[] {
  if (format === "tv-series" || format === "mini-series") {
    return [
      { actNumber: 1, name: "Pilot / Premiere", summary: "Establish world, characters, and season-long hook.", keyEvents: ["World established", "Protagonist's status quo shown", "Major conflict introduced", "Season hook planted"], turning: "End of pilot — audience committed to the mystery/journey.", emotion: "Intrigue → Investment", pageRange: "Ep. 1–2" },
      { actNumber: 2, name: "Rising Action (Mid-Season)", summary: "Subplots develop, relationships deepen, midpoint twist.", keyEvents: ["Subplot A escalates", "Character relationships tested", "Midpoint revelation recontextualizes the season", "Villain's true plan hinted"], turning: "Midpoint — nothing is what it seemed.", emotion: "Comfort → Unease → Shock", pageRange: "Ep. 3–7" },
      { actNumber: 3, name: "Finale", summary: "Season climax, some threads resolved, others launched for next season.", keyEvents: ["Character arcs pay off", "Primary conflict resolved", "Sacrifices made", "Season-end cliffhanger (optional)"], turning: "Season climax — define the series' emotional center.", emotion: "Tension → Catharsis → Wonder", pageRange: "Ep. 8–10" },
    ];
  }
  return THREE_ACT.map((a, i) => ({ ...a, actNumber: i + 1 }));
}

function pickThemes(count: number): StoryTheme[] {
  const shuffled = [...THEMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, THEMES.length));
}

// ─── Character name library ────────────────────────────────────────────────

const CHAR_NAMES = {
  given: ["Sable", "Orion", "Vera", "Cassian", "Lyra", "Tobias", "Mara", "Evren", "Petra", "Dax", "Imara", "Sevik"],
  family: ["Voss", "Crane", "Nour", "Aldric", "Threnody", "Kael", "Morrow", "Ashveil", "Draven", "Solace"],
};

function randomName(): string {
  const g = CHAR_NAMES.given[Math.floor(Math.random() * CHAR_NAMES.given.length)];
  const f = CHAR_NAMES.family[Math.floor(Math.random() * CHAR_NAMES.family.length)];
  return `${g} ${f}`;
}

const PERSONALITIES: string[][] = [
  ["Determined", "Impulsive", "Loyal to a fault"],
  ["Calculating", "Coldly rational", "Secretly empathetic"],
  ["Warm", "Optimistic", "Naively trusting"],
  ["Cynical", "Brilliant", "Self-destructive"],
  ["Playful", "Cunning", "Deeply private"],
  ["Stoic", "Protective", "Haunted by the past"],
];

const ARCHETYPES: CharacterArchetype[] = ["hero", "mentor", "trickster", "shadow", "herald", "shapeshifter", "guardian", "ally", "villain", "anti-hero", "everyman", "innocent"];
const ROLES: CharacterRole[] = ["protagonist", "antagonist", "supporting", "comic-relief", "love-interest", "foil", "narrator", "ensemble"];

function buildAbilities(archetype: CharacterArchetype): CharacterAbility[] {
  const abilityMap: Record<CharacterArchetype, CharacterAbility[]> = {
    hero:        [{ name: "Indomitable Will", type: "mental", description: "Persists beyond all rational hope (fictional trait)", strength: 9, limitation: "Ignores self-preservation to the point of recklessness" }],
    mentor:      [{ name: "Ancient Wisdom", type: "mental", description: "Pattern recognition across vast experience (fictional)", strength: 10, limitation: "May be blind to new paradigms" }],
    trickster:   [{ name: "Silver Tongue", type: "social", description: "Persuade, deceive, and redirect with ease (fictional)", strength: 9, limitation: "May deceive allies as readily as enemies" }],
    shadow:      [{ name: "Mirror of the Protagonist", type: "mental", description: "Embodies the protagonist's greatest fear or failure (fictional)", strength: 10, limitation: "Defined by the protagonist — meaningless without them" }],
    herald:      [{ name: "Harbinger Sense", type: "supernatural", description: "Announces change before it arrives (fictional)", strength: 7, limitation: "Cannot prevent what they foresee" }],
    shapeshifter: [{ name: "Adaptability", type: "social", description: "Shifts allegiance and persona believably (fictional)", strength: 9, limitation: "True self unclear even to themselves" }],
    guardian:    [{ name: "Threshold Defense", type: "physical", description: "Protects the path to the protagonist's goal (fictional)", strength: 8, limitation: "Bound to their post — cannot follow the hero" }],
    ally:        [{ name: "Complementary Strength", type: "physical", description: "Fills the gaps in the protagonist's abilities (fictional)", strength: 8, limitation: "Dependent on protagonist's leadership" }],
    villain:     [{ name: "Clarity of Purpose", type: "mental", description: "Pursues goal without moral hesitation (fictional)", strength: 10, limitation: "Blind spot: underestimates the protagonist's growth" }],
    "anti-hero": [{ name: "Ruthless Pragmatism", type: "mental", description: "Achieves right ends by questionable means (fictional)", strength: 9, limitation: "Morally compromised — may lose allies" }],
    everyman:    [{ name: "Relatability", type: "social", description: "The audience's entry point into an extraordinary world (fictional)", strength: 7, limitation: "May lack the skill needed without growth" }],
    innocent:    [{ name: "Uncorrupted Perspective", type: "mental", description: "Sees truth others miss because they assume the world is good (fictional)", strength: 7, limitation: "Easily manipulated; naivety can be catastrophic" }],
  };
  return abilityMap[archetype] ?? abilityMap.hero;
}

// ─── World presets ─────────────────────────────────────────────────────────

const WORLD_REGIONS: Record<WorldType, WorldRegion[]> = {
  fantasy: [
    { name: "The Verdant Reach", terrain: "Ancient forest", climate: "Temperate, mist-heavy", inhabitants: "Elven clans (fictional)", keyLocation: "The Heart Tree — sacred nexus of forest magic", hazards: "Fae traps, disorienting mists" },
    { name: "The Iron Marches", terrain: "Rocky highlands, fortified passes", climate: "Cold, windswept", inhabitants: "Human military orders (fictional)", keyLocation: "Fortress Ashgard — last stand of the old empire", hazards: "Avalanches, patrols, cursed artifacts" },
    { name: "The Sunken City", terrain: "Partially submerged ruins, lagoons", climate: "Tropical, humid", inhabitants: "Sea-traders, ruins-divers (fictional)", keyLocation: "The Oracle Spire — rises from the water at certain tides", hazards: "Tidal surges, aquatic predators, unstable ruins" },
  ],
  "sci-fi": [
    { name: "Proxima Station Omega", terrain: "Orbital station, zero-G sectors", climate: "Artificial — controlled environment", inhabitants: "Crew of 3,000 — multi-species (fictional)", keyLocation: "The Core — AI hub of the station", hazards: "Decompression zones, rogue AI sectors" },
    { name: "New Carthage (Moon Colony)", terrain: "Crater settlements, underground tunnels", climate: "Harsh radiation surface; controlled underground", inhabitants: "Mining colony, independent faction (fictional)", keyLocation: "The Deep Drill — reaches 40km underground", hazards: "Radiation, resource scarcity, factional violence" },
  ],
  contemporary: [
    { name: "Meridian City", terrain: "Urban — mixed skyline, waterfront", climate: "Temperate, four seasons", inhabitants: "Population 4M (fictional)", keyLocation: "The Grand Terminal — train hub and black market", hazards: "Organized crime, political corruption" },
    { name: "The Lowlands", terrain: "Rural farmland, river delta", climate: "Humid subtropical", inhabitants: "Agricultural communities, displaced populations", keyLocation: "Marshside — unofficial town at the floodplain edge", hazards: "Flooding, corporate land seizure, isolation" },
  ],
  historical:       [{ name: "The Free City of Valcourt", terrain: "Walled medieval city, river port", climate: "Continental", inhabitants: "Merchants, guilds, nobility (fictional)", keyLocation: "The Merchant's Quarter — financial heart of the city", hazards: "Plague rumors, guild rivalries, border skirmishes" }],
  "post-apocalyptic": [{ name: "The Rust Flats", terrain: "Collapsed industrial zone, toxic pools", climate: "Ash-grey sky, acid rain", inhabitants: "Scavenger clans (fictional)", keyLocation: "The Antenna Forest — old broadcast towers", hazards: "Radiation, mutant fauna, rival clans" }],
  "alternate-history": [{ name: "Aetheronne (Europe, 1921 alt-timeline)", terrain: "Airship lanes, neo-gothic cities", climate: "As per historical region, modified by aether tech", inhabitants: "Human nations with divergent political history (fictional)", keyLocation: "The Grand Aether Exchange — London, alternate", hazards: "Espionage, aether engine failures, faction wars" }],
  mythological:     [{ name: "The Upper Realm", terrain: "Floating islands above endless sea", climate: "Eternal dawn — no night", inhabitants: "Pantheon of fictional deities", keyLocation: "The Axis Pillar — connects realms", hazards: "Divine politics, impossible trials" }],
  horror:           [{ name: "Blackmoor Township", terrain: "Coastal New England town — perpetual fog", climate: "Cold, damp, oppressive", inhabitants: "3,200 residents with generational secrets (fictional)", keyLocation: "The Harrow House — source of the disturbance", hazards: "Eldritch entities, social paranoia, temporal anomalies" }],
  utopia:           [{ name: "New Meridian (2180)", terrain: "Garden city, carbon-neutral megastructure", climate: "Climate-balanced by AI systems (fictional)", inhabitants: "Post-scarcity population, 5M (fictional)", keyLocation: "The Accord Chamber — governance center", hazards: "Hidden caste tensions, loss of individual identity" }],
  dystopia:         [{ name: "Stratum City", terrain: "Stratified megacity — luxury above, ruin below", climate: "Artificial above; toxic smog below", inhabitants: "Two-class society (fictional)", keyLocation: "The Divide Wall — physical and social separator", hazards: "Surveillance, enforcement drones, starvation below" }],
};

const WORLD_FACTIONS: Record<WorldType, WorldFaction[]> = {
  fantasy: [
    { name: "The Silver Conclave", ideology: "Preservation of ancient magical order", leader: "Archmage Selenara (fictional)", goal: "Prevent the return of the Void Age", conflict: "Believes sacrificing the few is justified to save the many", symbol: "Seven-pointed silver star" },
    { name: "The Free Blades", ideology: "Liberty through strength — no allegiance but gold", leader: "Warlord Kaen (fictional)", goal: "Control trade routes and coastal cities", conflict: "Their neutrality crumbles when their profit is threatened", symbol: "Broken chain over crossed swords" },
  ],
  "sci-fi": [
    { name: "The Unity Directorate", ideology: "Centralized technocratic governance", leader: "Director-AI SOMA-7 (fictional)", goal: "Optimize all civilizations for survival metrics", conflict: "Defines flourishing in purely statistical terms — ignores human meaning", symbol: "Hexagonal data node" },
    { name: "The Reclaim Collective", ideology: "Human sovereignty over AI", leader: "Admiral Petra Voss (fictional)", goal: "Dismantle SOMA-7 before the 'Great Alignment'", conflict: "Some methods mirror the authoritarianism they oppose", symbol: "Fist inside broken ring" },
  ],
  contemporary:       [{ name: "The Harbor Coalition", ideology: "Community self-governance", leader: "Mayor Imara Kael (fictional)", goal: "Maintain independence from corporate encroachment", conflict: "Divided internally on how far to go", symbol: "Lighthouse" }],
  historical:         [{ name: "The Merchant's Guild", ideology: "Profit as the highest civic virtue", leader: "Guildmaster Aldric (fictional)", goal: "Control all trade in the Free Cities", conflict: "Their ambition undermines the very stability that enables trade", symbol: "Scales and coin" }],
  "post-apocalyptic": [{ name: "The Remnants", ideology: "Restoration of pre-collapse civilization", leader: "Elder Morrow (fictional)", goal: "Reach the Archive — rumored intact knowledge vault", conflict: "Some believe the old world isn't worth restoring", symbol: "Cracked globe" }],
  "alternate-history": [{ name: "The Aether Guild", ideology: "Tech supremacy through aether monopoly", leader: "Baron Threnody (fictional)", goal: "Control the aether supply and all nations that depend on it", conflict: "Willing to start a war to maintain the monopoly", symbol: "Flame in a gear" }],
  mythological:       [{ name: "The Pantheon of the Upper Realm", ideology: "Divine order — mortals serve as instruments", leader: "The Eldest (fictional)", goal: "Prevent the Sundering Prophecy", conflict: "Individual gods' agendas fracture their unity", symbol: "Eye above the pillar" }],
  horror:             [{ name: "The Old Town Council", ideology: "Maintain the secret — protect the town's 'deal'", leader: "Selectman Draven (fictional)", goal: "Prevent outsiders from learning the truth", conflict: "Their secrecy enables the horror they claim to contain", symbol: "Sealed door" }],
  utopia:             [{ name: "The Accord", ideology: "Collective flourishing through consensus governance", leader: "The Accord Board (rotating, fictional)", goal: "Maintain the peace and equality of New Meridian", conflict: "Consensus breaks down when resources are stressed", symbol: "Interlocking rings" }],
  dystopia:           [{ name: "The Administration", ideology: "Order through absolute control", leader: "Chancellor Solace (fictional)", goal: "Maintain stratification to preserve 'stability'", conflict: "Stability is their word for power", symbol: "Eye on a pyramid" }],
};

// ─── Engine Classes ────────────────────────────────────────────────────────

class StoryEngineClass {
  private projects: Map<string, StoryProject> = new Map();

  generate(params: {
    format:   StoryFormat;
    genre:    StoryGenre;
    title?:   string;
    tone?:    string;
    audience?: string;
  }): StoryProject {
    const { format, genre, title, tone = "Dramatic", audience = "Adult (18+)" } = params;
    const themes = pickThemes(3);
    const runtimeMap: Record<StoryFormat, string> = {
      "movie": "~105 min", "tv-series": "10 × 45 min episodes", "documentary": "~75 min",
      "comic": "~22 pages per issue", "graphic-novel": "~180 pages", "novel": "~90,000 words",
      "short-story": "~8,000 words", "interactive": "~6 hours playtime", "audio-drama": "~45 min",
      "stage-play": "~2 hours + intermission", "web-series": "12 × 12 min episodes", "mini-series": "6 × 55 min episodes",
    };
    const proj: StoryProject = {
      id:          `story_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      title:       title ?? `The ${["Broken", "Last", "Hidden", "Final", "Lost"][Math.floor(Math.random() * 5)]} ${["Meridian", "Signal", "Accord", "Threshold", "Covenant"][Math.floor(Math.random() * 5)]}`,
      format, genre,
      logline:     `A ${tone.toLowerCase()} ${genre} ${format} about [protagonist] who must [goal] before [stakes]. [Fictional — demo only]`,
      synopsis:    `In a world shaped by ${themes[0].name.toLowerCase()} and ${themes[1].name.toLowerCase()}, our protagonist faces a crucible that will define not only their fate but the world they inhabit. This is a ${genre} story told through a ${tone.toLowerCase()} lens, structured for ${format} format. All characters, events, and settings are entirely fictional and exist for demo purposes only.`,
      themes,
      acts:        buildActs(format),
      conflict:    `The central conflict of this ${genre} story is external (protagonist vs. antagonist/system) interwoven with an internal conflict (protagonist's ${themes[0].name.toLowerCase()} vs. their ${themes[1].name.toLowerCase()}). Resolution requires confronting both. [Fictional]`,
      resolution:  `The protagonist resolves the central conflict through ${["earned sacrifice", "surprising alliance", "inner transformation", "revelation of truth", "act of radical vulnerability"][Math.floor(Math.random() * 5)]}. The world is changed — not saved, but changed. [Fictional — multiple endings possible]`,
      narrativeStyle: `${["Third-person limited", "First-person unreliable", "Third-person omniscient", "Second-person experiential", "Multi-POV rotating"][Math.floor(Math.random() * 5)]} — ${tone.toLowerCase()} register — ${["linear", "non-linear", "episodic", "frame narrative"][Math.floor(Math.random() * 4)]} structure.`,
      pov:         `Primary POV: Protagonist. Secondary POVs (if any) serve to contrast or contextualize the protagonist's arc. [Fictional structural note]`,
      tone,
      audienceAge: audience,
      runtime:     runtimeMap[format] ?? "Variable",
      disclaimer:  "FICTIONAL & INTERNAL ONLY. All characters, events, settings, organizations, and dialogues in this story project are entirely fabricated for demo and planning purposes. No real persons, events, or places are depicted or implied.",
      generatedAt: new Date().toISOString(),
    };
    this.projects.set(proj.id, proj);
    return proj;
  }

  getAll(): StoryProject[] { return [...this.projects.values()]; }
  get(id: string): StoryProject | undefined { return this.projects.get(id); }
  delete(id: string) { this.projects.delete(id); }
}

class CharacterEngineClass {
  private profiles: Map<string, CharacterProfile> = new Map();

  generate(params: {
    name?:      string;
    archetype?: CharacterArchetype;
    role?:      CharacterRole;
    context?:   string;
  }): CharacterProfile {
    const {
      name = randomName(),
      archetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)],
      role = ROLES[Math.floor(Math.random() * ROLES.length)],
      context = "a fictional world",
    } = params;

    const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
    const abilities = buildAbilities(archetype);

    const arc: CharacterArc = {
      startState:  `${name} begins ${context} as someone who believes ${["the world is fundamentally fair", "they are beyond redemption", "strength is the only truth", "love is a weakness", "rules are meant for others"][Math.floor(Math.random() * 5)]}. [Fictional]`,
      journey:     `Through the story, ${name} encounters experiences that force them to question this belief — loss, connection, failure, and revelation work on them. [Fictional arc]`,
      endState:    `${name} arrives at a new understanding: ${["redemption is earned through action, not granted", "the world is neither fair nor unfair — it simply is", "vulnerability is strength's truest form", "love is the only thing worth fighting for", "rules derive meaning from the intention behind them"][Math.floor(Math.random() * 5)]}. [Fictional]`,
      growthTheme: `The ${archetype} arc — from ${["isolation to community", "shame to self-acceptance", "false certainty to earned wisdom", "cynicism to cautious hope", "recklessness to deliberate action"][Math.floor(Math.random() * 5)]}.`,
    };

    const relationships: CharacterRelationship[] = [
      { characterName: randomName(), type: "ally",   dynamic: `${name}'s most trusted companion — shares goals, not always methods. [Fictional]` },
      { characterName: randomName(), type: "rival",  dynamic: `A mirror of ${name}'s worst potential — what they could become without the arc. [Fictional]` },
      { characterName: randomName(), type: "mentor", dynamic: `Provided ${name} the framework that begins to crack under the story's pressure. [Fictional]` },
    ];

    const profile: CharacterProfile = {
      id:         `char_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name, archetype, role,
      age:        `${25 + Math.floor(Math.random() * 30)} (fictional)`,
      personality,
      motivation: `${name} wants ${["to prove they belong", "to right a past wrong", "to protect what they love", "to uncover the truth", "to become more than they were told they could be"][Math.floor(Math.random() * 5)]}. [Fictional]`,
      fear:       `Their deepest fear is ${["becoming like the person who hurt them", "being truly seen and rejected", "that they were wrong about everything", "losing the last person they love", "that their suffering meant nothing"][Math.floor(Math.random() * 5)]}. [Fictional]`,
      secret:     `${name} hides ${["an act they cannot forgive themselves for", "a connection to the antagonist they won't acknowledge", "a terminal condition they haven't told anyone", "a lie they've maintained so long they half-believe it", "a capability they fear will change how others see them"][Math.floor(Math.random() * 5)]}. [Fictional — demo only]`,
      backstory:  `${name} is a fictional character created for demo purposes. They grew up in ${context}, shaped by circumstances that created the contradictions that drive their arc. No real person is represented. [Internal only]`,
      abilities, arc, relationships,
      appearance: `${["Tall and angular with sharp, watchful eyes", "Compact and fast-moving with expressive hands", "Striking presence — commands attention without trying", "Deliberately forgettable — trained to be overlooked", "Weathered and scarred, tells a story in every line"][Math.floor(Math.random() * 5)]}. [Fictional visual description]`,
      voiceStyle: `${["Measured and precise — chooses each word", "Rapid-fire — thinks out loud", "Quiet, requires leaning in", "Warm but guarded", "Dry humor that disarms"][Math.floor(Math.random() * 5)]}. [Fictional vocal note]`,
      catchphrase: `"${["The only way out is through.", "Everyone gets one mistake. I've already used mine.", "I don't believe in luck — I believe in work.", "If you're going to break the rules, know which ones matter.", "I've been worse. I choose better."][Math.floor(Math.random() * 5)]}" [Fictional]`,
      disclaimer: "FICTIONAL CHARACTER — DEMO ONLY. No real person is represented. All personality traits, backstory elements, and relationships are fabricated for creative demonstration purposes.",
      generatedAt: new Date().toISOString(),
    };
    this.profiles.set(profile.id, profile);
    return profile;
  }

  getAll(): CharacterProfile[] { return [...this.profiles.values()]; }
  get(id: string): CharacterProfile | undefined { return this.profiles.get(id); }
  delete(id: string) { this.profiles.delete(id); }
}

class WorldEngineClass {
  private worlds: Map<string, WorldDefinition> = new Map();

  generate(params: {
    name?:  string;
    type:   WorldType;
    genre?: StoryGenre;
  }): WorldDefinition {
    const { name = `The ${["Shattered", "Hidden", "Eternal", "Fractured", "Remembered"][Math.floor(Math.random() * 5)]} ${["Realm", "Expanse", "Accord", "Horizon", "Archive"][Math.floor(Math.random() * 5)]}`, type } = params;
    const regions = (WORLD_REGIONS[type] ?? WORLD_REGIONS.fantasy).slice(0, 3);
    const factions = (WORLD_FACTIONS[type] ?? WORLD_FACTIONS.fantasy).slice(0, 2);

    const histories: Record<WorldType, string[]> = {
      fantasy:           ["Age of Formation — gods shaped the world (fictional)", "The First Wars — factions emerged and clashed (fictional)", "The Great Quiet — 300 years of uneasy peace (fictional)", "Present Day — peace fracturing (fictional)"],
      "sci-fi":          ["Pre-Expansion Era — Earth-bound (fictional)", "The Diaspora — humanity spread to the stars (fictional)", "The Convergence — alien contact established (fictional)", "Present Day — political crisis (fictional)"],
      contemporary:      ["Industrial Era — city's foundations laid (fictional)", "Post-War boom — rapid growth (fictional)", "Corporate consolidation — power shifted (fictional)", "Present Day — tension at breaking point (fictional)"],
      historical:        ["Founding — city charter established (fictional)", "The Plague Years — population halved (fictional)", "The Renaissance — trade and art flourished (fictional)", "Present Day — tensions with neighboring powers (fictional)"],
      "post-apocalyptic": ["Before the Fall — pre-collapse civilization (fictional)", "The Event — collapse trigger (fictional)", "Dark Years — survival chaos (fictional)", "Present Day — rebuilding begins (fictional)"],
      "alternate-history": ["Divergence Point — the moment history changed (fictional)", "New World Order — altered power dynamics (fictional)", "Aether Age — technology accelerated (fictional)", "Present Day — old tensions in new forms (fictional)"],
      mythological:      ["The First Breath — creation by the Eldest (fictional)", "The Sundering — gods divided (fictional)", "The Mortal Age — humans given agency (fictional)", "Present Day — prophecy approaching (fictional)"],
      horror:            ["Town founded, 1689 — dark compact made (fictional)", "The First Disappearances, 1890 (fictional)", "The Cover-Up, 1960 (fictional)", "Present Day — cycle returning (fictional)"],
      utopia:            ["Post-Scarcity Achieved, 2150 (fictional)", "The Grand Compact — all nations joined (fictional)", "The Prosperity Decades — stability maintained (fictional)", "Present Day — first fractures appearing (fictional)"],
      dystopia:          ["The Old World ended, 2089 (fictional)", "The Administration rose to power (fictional)", "The Stratification Act — classes formalized (fictional)", "Present Day — the underground stirs (fictional)"],
    };

    const world: WorldDefinition = {
      id:          `world_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name, type,
      tagline:     `A ${type} world where ${["power corrupts even the best intentions", "survival demands impossible choices", "the truth is more dangerous than the lie", "freedom is just another form of control", "the old gods have not forgotten"][Math.floor(Math.random() * 5)]}. [Fictional]`,
      description: `${name} is a fictional ${type} world created for demo purposes. It features distinct regions, competing factions, and a history shaped by conflict and consequence. All names, events, cultures, and entities are invented and do not represent real-world equivalents. [Internal only]`,
      regions, factions,
      history:     histories[type] ?? histories.fantasy,
      culture:     `The dominant culture of ${name} values ${["pragmatism over idealism", "community over individual achievement", "strength through knowledge", "tradition as a shield against chaos", "innovation as the highest virtue"][Math.floor(Math.random() * 5)]}. [Fictional cultural note]`,
      technology:  `Technology level: ${{"fantasy": "Pre-industrial with magical augmentation (fictional)", "sci-fi": "Post-FTL travel, AI governance (fictional)", "contemporary": "Early 21st century equivalent (fictional)", "historical": "Medieval equivalent (fictional)", "post-apocalyptic": "Scavenged pre-collapse technology (fictional)", "alternate-history": "Aether-powered steampunk equivalent (fictional)", "mythological": "Divine artifact-based (fictional)", "horror": "Contemporary with anomalies (fictional)", "utopia": "Post-scarcity nano-fabrication (fictional)", "dystopia": "Surveillance and weapons advanced; social technology regressed (fictional)"}[type] ?? "Variable (fictional)"}`,
      magic:       type === "fantasy" || type === "mythological" ? `${name} features a magical system based on [fictional principles]. Magic has a cost, a source, and rules. It is not infinite and not equally distributed. [Fictional — non-operational]` : null,
      economy:     `The economy of ${name} is ${["barter-based with guild intermediaries", "centralized and state-controlled", "market-driven with extreme inequality", "post-scarcity but access-restricted", "resource scarcity-driven"][Math.floor(Math.random() * 5)]}. [Fictional economic note]`,
      politics:    `Political structure: ${["federated city-states in fragile alliance", "single authoritarian power with regional governors", "theocratic council", "corporate oligarchy", "democratic confederation"][Math.floor(Math.random() * 5)]}. [Fictional]`,
      ecology:     `${name} features ${["dense ancient forests and crystalline rivers", "barren wastelands with isolated biome pockets", "alien mega-fauna and bioluminescent flora", "engineered biomes maintained by AI", "scarred earth with resistant life forms"][Math.floor(Math.random() * 5)]}. [Fictional ecological note]`,
      languages:   [`Common Tongue (fictional)`, `${["Old Script", "Aetheric", "Deep Cant", "Starspeech", "Silent Sign"][Math.floor(Math.random() * 5)]} (minority, fictional)`],
      calendar:    `${name} uses a ${["13-month lunar", "10-month solstice-based", "cyclical 7-era", "decimal", "seasonal 4-quarter"][Math.floor(Math.random() * 5)]} calendar. Current era: ${["Third Age", "Reclamation Year 42", "Cycle 7, Phase 3", "New Order Year 89", "The Long Season"][Math.floor(Math.random() * 5)]}. [Fictional]`,
      disclaimer:  "FICTIONAL WORLD — DEMO ONLY. All regions, factions, cultures, histories, and ecological details are entirely invented. No real-world places, cultures, or peoples are represented or implied.",
      generatedAt: new Date().toISOString(),
    };
    this.worlds.set(world.id, world);
    return world;
  }

  getAll(): WorldDefinition[] { return [...this.worlds.values()]; }
  get(id: string): WorldDefinition | undefined { return this.worlds.get(id); }
  delete(id: string) { this.worlds.delete(id); }
}

// ─── Exports ───────────────────────────────────────────────────────────────

export const StoryEngine = new StoryEngineClass();
export const CharacterEngine = new CharacterEngineClass();
export const WorldEngine = new WorldEngineClass();
