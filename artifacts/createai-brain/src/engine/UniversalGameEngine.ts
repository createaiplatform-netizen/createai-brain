// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL GAME ENGINE + GAME MECHANICS ENGINE
// Points 13 + 14 of the Universal Creative System.
// INTERNAL · FICTIONAL · DEMO-ONLY · NON-OPERATIONAL.
// All game structures, maps, characters, mechanics, and outcomes are fictional.
// No real game engine, physics simulation, or AI behavior is implemented.
// ═══════════════════════════════════════════════════════════════════════════

export type GameType =
  | "rpg" | "platformer" | "strategy" | "puzzle" | "simulation"
  | "adventure" | "action" | "horror" | "sports" | "educational"
  | "sandbox" | "survival";

export type GamePlatform = "pc" | "console" | "mobile" | "web" | "vr" | "arcade";
export type GamePerspective = "first-person" | "third-person" | "top-down" | "side-scroller" | "isometric";

// ─── Interfaces ────────────────────────────────────────────────────────────

export interface GameMechanic {
  id:          string;
  name:        string;
  category:    string;
  description: string;
  playerAction: string;
  systemResponse: string;
  reward:      string;
  penalty:     string;
  difficulty:  "easy" | "medium" | "hard" | "adaptive";
}

export interface GameLevel {
  index:       number;
  name:        string;
  environment: string;
  objective:   string;
  enemies:     string[];
  obstacles:   string[];
  collectibles: string[];
  boss:        string | null;
  reward:      string;
  estimatedTime: string;
  difficultyRating: number;
}

export interface NPCProfile {
  id:       string;
  name:     string;
  role:     "ally" | "enemy" | "neutral" | "merchant" | "questgiver" | "boss";
  faction:  string;
  dialogue: string[];
  behavior: string;
  abilities: string[];
  loot:     string[];
  backstory: string;
}

export interface SkillTree {
  name:       string;
  description: string;
  nodes: {
    id:           string;
    name:         string;
    tier:         number;
    cost:         number;
    effect:       string;
    prerequisite: string | null;
  }[];
}

export interface GameHUD {
  elements: string[];
  minimap:  boolean;
  healthDisplay: string;
  resourceBars:  string[];
  questTracker:  boolean;
  notifications: string;
}

export interface ProgressionSystem {
  type:        string;
  levels:      number;
  xpCurve:     string;
  rewards:     string[];
  prestige:    boolean;
  seasons:     boolean;
  description: string;
}

export interface GameLoop {
  phase:    string;
  duration: string;
  actions:  string[];
  outcome:  string;
}

export interface GameProject {
  id:            string;
  title:         string;
  type:          GameType;
  genre:         string;
  platform:      GamePlatform[];
  perspective:   GamePerspective;
  logline:       string;
  synopsis:      string;
  targetAudience: string;
  ratingTarget:  string;
  mechanics:     GameMechanic[];
  levels:        GameLevel[];
  npcs:          NPCProfile[];
  skillTree:     SkillTree;
  hud:           GameHUD;
  progression:   ProgressionSystem;
  gameLoop:      GameLoop[];
  storyArc:      string;
  worldName:     string;
  worldDesc:     string;
  assetList:     string[];
  technicalNotes: string;
  safetyNote:    string;
  generatedAt:   string;
}

// ─── Genre presets ─────────────────────────────────────────────────────────

const GENRE_PRESETS: Record<GameType, { genres: string[]; perspectives: GamePerspective[]; platforms: GamePlatform[] }> = {
  rpg:         { genres: ["Fantasy RPG", "Sci-Fi RPG", "Dark Fantasy", "JRPG", "Western RPG"], perspectives: ["third-person", "isometric"], platforms: ["pc", "console"] },
  platformer:  { genres: ["2D Platformer", "Metroidvania", "3D Platformer", "Run & Gun"], perspectives: ["side-scroller", "third-person"], platforms: ["pc", "console", "mobile"] },
  strategy:    { genres: ["Turn-Based Strategy", "Real-Time Strategy", "Tower Defense", "4X"], perspectives: ["top-down", "isometric"], platforms: ["pc", "mobile"] },
  puzzle:      { genres: ["Logic Puzzle", "Physics Puzzle", "Match-3", "Escape Room"], perspectives: ["top-down", "first-person"], platforms: ["mobile", "web", "pc"] },
  simulation:  { genres: ["Life Sim", "City Builder", "Flight Sim", "Farming Sim", "Business Sim"], perspectives: ["isometric", "third-person"], platforms: ["pc", "console"] },
  adventure:   { genres: ["Point & Click", "Narrative Adventure", "Action-Adventure", "Survival Horror"], perspectives: ["third-person", "first-person"], platforms: ["pc", "console"] },
  action:      { genres: ["Beat 'em Up", "Hack & Slash", "Third-Person Shooter", "Arena Brawler"], perspectives: ["third-person", "first-person"], platforms: ["pc", "console"] },
  horror:      { genres: ["Survival Horror", "Psychological Horror", "Cosmic Horror"], perspectives: ["first-person", "third-person"], platforms: ["pc", "console"] },
  sports:      { genres: ["Football", "Basketball", "Racing", "Extreme Sports", "E-Sports Manager"], perspectives: ["third-person", "first-person"], platforms: ["pc", "console", "mobile"] },
  educational: { genres: ["STEM Learning", "Language Learning", "History Exploration", "Financial Literacy"], perspectives: ["isometric", "top-down"], platforms: ["web", "mobile", "pc"] },
  sandbox:     { genres: ["Open World", "Creative Sandbox", "Procedural World"], perspectives: ["third-person", "first-person"], platforms: ["pc", "console"] },
  survival:    { genres: ["Survival Crafting", "Post-Apocalyptic", "Wilderness Survival", "Space Survival"], perspectives: ["first-person", "third-person"], platforms: ["pc", "console"] },
};

// ─── Mechanic templates ────────────────────────────────────────────────────

function buildMechanics(type: GameType): GameMechanic[] {
  const mechLibrary: Record<GameType, GameMechanic[]> = {
    rpg: [
      { id: "m1", name: "Turn-Based Combat", category: "Combat", description: "Players and enemies take turns performing actions in combat (fictional logic)", playerAction: "Choose Attack / Skill / Item / Defend / Flee", systemResponse: "Calculate damage using fictional formula: ATK × skill modifier vs DEF roll", reward: "XP, loot, story progression", penalty: "HP loss; party member incapacitation", difficulty: "adaptive" },
      { id: "m2", name: "Skill Tree Progression", category: "Progression", description: "Players spend Skill Points to unlock abilities in branching tree (mock data)", playerAction: "Allocate Skill Points after leveling up", systemResponse: "Unlock new abilities, passive bonuses, or stat increases", reward: "Expanded combat/utility options", penalty: "Opportunity cost of unchosen paths", difficulty: "easy" },
      { id: "m3", name: "Quest System", category: "Narrative", description: "Multi-step quests with branching outcomes (all fictional)", playerAction: "Accept quest from NPC, complete objectives, return", systemResponse: "Update quest log, trigger story beat, award reward", reward: "XP, gold, story content", penalty: "Failed quests lock certain paths", difficulty: "medium" },
      { id: "m4", name: "Crafting System", category: "Economy", description: "Combine materials to create weapons, armor, consumables (mock)", playerAction: "Open crafting menu, select recipe, confirm", systemResponse: "Consume materials, generate item based on fictional recipe", reward: "Superior equipment unavailable via normal loot", penalty: "Material consumption, failed crafts consume materials", difficulty: "medium" },
    ],
    platformer: [
      { id: "m1", name: "Jump & Run", category: "Movement", description: "Core movement loop with variable jump height (fictional physics)", playerAction: "Analog stick/WASD + jump button", systemResponse: "Apply mock velocity and gravity curves to character", reward: "Level progression, collectibles", penalty: "Fall damage, respawn at checkpoint", difficulty: "adaptive" },
      { id: "m2", name: "Wall-Jump / Grapple", category: "Movement", description: "Advanced traversal mechanics on surfaces (mock physics)", playerAction: "Jump near wall, press jump again; or aim grapple hook", systemResponse: "Launch character off wall at calculated angle", reward: "Reach new areas, speed runs", penalty: "Miss timing = fall", difficulty: "medium" },
      { id: "m3", name: "Collectible System", category: "Progression", description: "Stars/coins/gems scattered across levels (fictional economy)", playerAction: "Move through collectible, auto-collect", systemResponse: "Increment counter, unlock reward at thresholds", reward: "Cosmetics, extra lives, unlocks", penalty: "None (collection optional)", difficulty: "easy" },
    ],
    strategy: [
      { id: "m1", name: "Resource Management", category: "Economy", description: "Gather, manage, and spend multiple resource types (mock)", playerAction: "Build collectors, assign workers, trade", systemResponse: "Increment resource counters per tick (fictional simulation)", reward: "Ability to build/train/research", penalty: "Starvation, inability to build, morale drops", difficulty: "hard" },
      { id: "m2", name: "Tech Tree Research", category: "Progression", description: "Research upgrades to unlock advanced units/buildings", playerAction: "Select research node, commit research points", systemResponse: "After fictional time cost, unlock node and apply bonuses", reward: "Military advantage, economic efficiency", penalty: "Research cost, opportunity cost", difficulty: "medium" },
      { id: "m3", name: "Turn-Based Tactics", category: "Combat", description: "Position and move units on grid, engage enemies", playerAction: "Select unit, move to hex, choose attack/ability", systemResponse: "Calculate hit chance, damage, flanking bonuses (mock)", reward: "Territory control, enemy elimination", penalty: "Unit loss, territory loss", difficulty: "hard" },
    ],
    puzzle: [
      { id: "m1", name: "Logic Puzzle", category: "Core", description: "Solve spatial or logic challenges to progress (fictional rules)", playerAction: "Manipulate objects, switches, tiles per puzzle rules", systemResponse: "Validate solution state, trigger progression if correct", reward: "Level completion, story reveal", penalty: "Stuck in level until solved", difficulty: "adaptive" },
      { id: "m2", name: "Hint System", category: "Accessibility", description: "Tiered hints available for each puzzle", playerAction: "Request hint (costs in-game currency or cooldown)", systemResponse: "Reveal partial or full solution guidance", reward: "Progress despite difficulty", penalty: "Hint cost, diminished score", difficulty: "easy" },
    ],
    simulation:  [{ id: "m1", name: "Resource & Budget Loop", category: "Core", description: "Balance income vs. expenditure over time (fictional economy)", playerAction: "Build structures, set policies, manage events", systemResponse: "Simulate fictional economy tick, update metrics", reward: "City/org growth, unlock advanced features", penalty: "Deficit, failure state", difficulty: "adaptive" }],
    adventure:   [{ id: "m1", name: "Dialogue Tree", category: "Narrative", description: "Branch dialogue choices drive story (fictional outcomes)", playerAction: "Select dialogue option from menu", systemResponse: "Trigger response, update relationship flags, advance story", reward: "Story content, NPC relationship", penalty: "Locked story branches", difficulty: "easy" }],
    action:      [{ id: "m1", name: "Combo System", category: "Combat", description: "Chain attacks for escalating damage and style score (mock)", playerAction: "Press attack buttons in sequence/timing", systemResponse: "Detect combo string, apply multiplier, trigger animation", reward: "Style score, damage multiplier, special move unlock", penalty: "Drop combo = reset multiplier", difficulty: "medium" }],
    horror:      [{ id: "m1", name: "Sanity / Fear System", category: "Atmosphere", description: "Prolonged threat exposure degrades sanity meter (fictional)", playerAction: "Avoid or encounter frightening entities/events", systemResponse: "Decrement sanity; trigger visual/audio distortion effects", reward: "Story revelation; sanity restored by safe zones", penalty: "Hallucinations, gameplay distortions, game over", difficulty: "hard" }],
    sports:      [{ id: "m1", name: "Skill Timing", category: "Core", description: "Precision timing mechanics for shots/passes/tackles (mock)", playerAction: "Press action button at correct timing window", systemResponse: "Calculate success based on timing accuracy + stat modifiers", reward: "Successful play, crowd reaction, score", penalty: "Miss, turnover, injury (simulated)", difficulty: "adaptive" }],
    educational: [{ id: "m1", name: "Knowledge Check Gate", category: "Progression", description: "Answer questions correctly to advance (fictional curriculum)", playerAction: "Read content, answer multiple-choice or fill-in question", systemResponse: "Validate answer, provide explanation, grant passage or retry", reward: "Level unlock, badge, knowledge point", penalty: "Retry question, hint revealed", difficulty: "adaptive" }],
    sandbox:     [{ id: "m1", name: "Freeform Building", category: "Core", description: "Place and remove blocks/assets in a 3D space (mock engine)", playerAction: "Select material, place/remove in grid", systemResponse: "Update world state, physics mock (structural integrity display)", reward: "Creative expression, shareable creation", penalty: "None in creative mode; resource cost in survival", difficulty: "easy" }],
    survival:    [{ id: "m1", name: "Hunger/Thirst/Health Loop", category: "Core", description: "Manage vitals alongside threat avoidance (mock simulation)", playerAction: "Hunt, gather, craft shelter, avoid enemies", systemResponse: "Decrement vitals per tick; trigger consequences at thresholds", reward: "Survival, base progression, story unlock", penalty: "Debuffs, unconsciousness, game over", difficulty: "hard" }],
  };
  return mechLibrary[type] ?? mechLibrary.rpg;
}

// ─── Level generator ───────────────────────────────────────────────────────

function buildLevels(type: GameType, worldName: string, count: number): GameLevel[] {
  const envByType: Record<GameType, string[]> = {
    rpg:         ["Ancient Ruins", "Dark Forest", "Frozen Tundra", "Lava Caverns", "Celestial Citadel"],
    platformer:  ["Grassy Meadows", "Industrial Factory", "Underwater Reef", "Sky Islands", "Neon City"],
    strategy:    ["River Delta", "Mountain Pass", "Desert Ruins", "Volcanic Archipelago", "Arctic Stronghold"],
    puzzle:      ["Laboratory", "Ancient Temple", "Clockwork Tower", "Mirror Maze", "Crystal Cavern"],
    simulation:  ["Coastal Town", "Mountain Valley", "Desert Oasis", "Island Archipelago", "Megacity"],
    adventure:   ["Haunted Mansion", "Tropical Jungle", "Underground Catacombs", "Floating Fortress", "Alien Ship"],
    action:      ["City Streets", "Military Base", "Rooftop Arena", "Underground Bunker", "Orbital Station"],
    horror:      ["Abandoned Hospital", "Dark Forest", "Sunken Town", "Victorian Mansion", "Void Realm"],
    sports:      ["Home Stadium", "Away Venue", "Championship Arena", "Training Facility", "World Cup Final"],
    educational: ["Learning Hub", "History Museum", "Science Lab", "Math World", "Library Archive"],
    sandbox:     ["Plains Biome", "Mountain Range", "Ocean Shore", "Desert Expanse", "Sky Realm"],
    survival:    ["Crash Site", "Dense Forest", "Frozen Wastes", "Underground Bunker", "Post-Collapse City"],
  };
  const envs = envByType[type] ?? envByType.rpg;
  return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    index: i,
    name: `${worldName} — ${["Prologue", "The Discovery", "Rising Tension", "The Confrontation", "Endgame"][i] ?? `Level ${i + 1}`}`,
    environment: envs[i] ?? envs[0],
    objective: ["Reach the exit", "Defeat the guardian", "Collect 3 artifacts", "Survive the assault", "Unlock the final gate"][i] ?? "Complete the objective",
    enemies: [["Goblin Scout", "Cave Rat"], ["Shadow Knight", "Stone Golem"], ["Frost Wraith", "Blizzard Drake"], ["Magma Elemental", "Infernal Hound"], ["Void Titan", "Celestial Warden"]][i] ?? ["Basic Enemy A", "Basic Enemy B"],
    obstacles: [["Hidden pitfalls", "Locked doors"], ["Rolling boulders", "Poison gas"], ["Ice patches", "Blizzard events"], ["Lava floors", "Eruption zones"], ["Gravity shifts", "Dimensional rifts"]][i] ?? ["Obstacle A"],
    collectibles: [["3× Gold Coins"], ["1× Rare Scroll"], ["5× Herb Bundles"], ["2× Elemental Shards"], ["1× Legendary Relic"]][i] ?? ["Standard Collectible"],
    boss: i === 4 ? "Final Boss — [Name TBD per story context]" : i > 0 ? `Mini-Boss: ${["Pit Warlord", "Stone Colossus", "Frost Lich", "Magma Lord"][i - 1]}` : null,
    reward: ["+100 XP, Starter Gear", "+500 XP, Rare Weapon", "+1000 XP, Skill Point", "+2000 XP, Epic Armor", "+5000 XP, Final Achievement"][i] ?? "Standard Reward",
    estimatedTime: ["15 min", "25 min", "30 min", "35 min", "60+ min"][i] ?? "20 min",
    difficultyRating: i + 1,
  }));
}

// ─── NPC generator ─────────────────────────────────────────────────────────

const NPC_NAMES = ["Aldric", "Seraphine", "Korven", "Nyx", "Thane", "Isolde", "Draven", "Lyra"];
const FACTIONS = ["Order of the Dawn", "Shadow Guild", "Iron Pact", "Free Cities", "Void Cult", "Merchant League"];
const NPC_ROLES: NPCProfile["role"][] = ["ally", "enemy", "neutral", "merchant", "questgiver", "boss"];

function buildNPCs(count: number): NPCProfile[] {
  return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    id: `npc_${i}`,
    name: NPC_NAMES[i] ?? `Character ${i + 1}`,
    role: NPC_ROLES[i % NPC_ROLES.length],
    faction: FACTIONS[i % FACTIONS.length],
    dialogue: [
      `"Welcome, traveler. The ${FACTIONS[i % FACTIONS.length]} has need of your skills." [Fictional]`,
      `"Beware the shadows ahead — I have seen what lurks there." [Fictional]`,
      `"Return with proof of your deed and I shall reward you." [Fictional]`,
    ],
    behavior: ["Patrol area, attack on sight", "Passive until provoked", "Follow player, assist in combat", "Stand at post, offer quests", "Guard objective, escalate to combat if threatened"][i % 5],
    abilities: [["Basic Attack", "Shield Bash"], ["Shadow Strike", "Vanish"], ["Heal Ally", "Rally"], ["Trade", "Barter"], ["Power Strike", "Battle Cry"]][i % 5],
    loot: [["Gold ×10", "Iron Sword"], ["Shadow Cloak", "Void Shard"], ["Healing Potion ×3"], ["Rare Map", "Merchant Key"], ["Boss Key", "Epic Armor Piece"]][i % 5],
    backstory: `${NPC_NAMES[i] ?? `Character ${i + 1}`} is a fictional character created for demo purposes. No real person is represented. [Internal only]`,
  }));
}

// ─── Skill tree builder ────────────────────────────────────────────────────

function buildSkillTree(type: GameType): SkillTree {
  const trees: Record<GameType, SkillTree> = {
    rpg: {
      name: "Adventurer's Path",
      description: "Three branches: Warrior (melee/defense), Mage (spells/utility), Rogue (agility/stealth). All fictional.",
      nodes: [
        { id: "w1", name: "Power Strike",    tier: 1, cost: 1, effect: "+15% melee damage (mock)",           prerequisite: null },
        { id: "w2", name: "Fortress Stance", tier: 2, cost: 2, effect: "+20% defense when stationary (mock)", prerequisite: "w1" },
        { id: "m1", name: "Mana Surge",      tier: 1, cost: 1, effect: "+25% spell power (mock)",            prerequisite: null },
        { id: "m2", name: "Time Warp",       tier: 2, cost: 3, effect: "Slow time 3 sec cooldown (mock)",    prerequisite: "m1" },
        { id: "r1", name: "Shadow Step",     tier: 1, cost: 1, effect: "Short-range blink (mock)",            prerequisite: null },
        { id: "r2", name: "Poison Blade",    tier: 2, cost: 2, effect: "Attacks apply mock DoT",             prerequisite: "r1" },
      ],
    },
    platformer: {
      name: "Movement Mastery",
      description: "Unlock advanced traversal and combat abilities. Fictional power progression.",
      nodes: [
        { id: "p1", name: "Double Jump",  tier: 1, cost: 1, effect: "2× jump in air (mock physics)",   prerequisite: null },
        { id: "p2", name: "Wall Run",     tier: 2, cost: 2, effect: "Run on walls 2 sec (mock)",        prerequisite: "p1" },
        { id: "a1", name: "Spin Attack",  tier: 1, cost: 1, effect: "AOE melee (mock)",                 prerequisite: null },
        { id: "a2", name: "Ground Slam",  tier: 2, cost: 2, effect: "Shockwave on landing (mock)",       prerequisite: "a1" },
      ],
    },
    strategy:    { name: "Command Doctrine", description: "Military and economic upgrades. All fictional.", nodes: [{ id: "e1", name: "Efficient Harvesting", tier: 1, cost: 2, effect: "+20% resource yield", prerequisite: null }, { id: "m1", name: "Elite Infantry", tier: 2, cost: 3, effect: "+30% troop HP", prerequisite: "e1" }] },
    puzzle:      { name: "Mind Expansion",   description: "Cognitive power-ups (mock).", nodes: [{ id: "h1", name: "Photographic Memory", tier: 1, cost: 1, effect: "See 3-move preview", prerequisite: null }] },
    simulation:  { name: "City Expertise",   description: "Unlock advanced city management tools.", nodes: [{ id: "z1", name: "Urban Planning", tier: 1, cost: 2, effect: "Unlock zoning overlays", prerequisite: null }] },
    adventure:   { name: "Explorer's Edge",  description: "Traverse and interact more effectively.", nodes: [{ id: "i1", name: "Keen Eye", tier: 1, cost: 1, effect: "Reveal hidden objects", prerequisite: null }] },
    action:      { name: "Combat Arts",      description: "Master offensive and defensive techniques.", nodes: [{ id: "c1", name: "Berserker Mode", tier: 1, cost: 2, effect: "+50% attack speed, -20% defense", prerequisite: null }] },
    horror:      { name: "Survival Instinct", description: "Manage fear and survive longer.", nodes: [{ id: "s1", name: "Iron Will", tier: 1, cost: 1, effect: "Sanity drain -25%", prerequisite: null }] },
    sports:      { name: "Athletic Mastery", description: "Improve player stats and team chemistry.", nodes: [{ id: "a1", name: "Speed Training", tier: 1, cost: 1, effect: "+15% sprint speed", prerequisite: null }] },
    educational: { name: "Knowledge Path",   description: "Unlock bonus content and achievements.", nodes: [{ id: "k1", name: "Speed Reader", tier: 1, cost: 1, effect: "+20% study efficiency", prerequisite: null }] },
    sandbox:     { name: "Builder's Codex",  description: "Unlock advanced building materials and tools.", nodes: [{ id: "b1", name: "Master Builder", tier: 1, cost: 3, effect: "Unlock advanced material tier", prerequisite: null }] },
    survival:    { name: "Survivor's Code",  description: "Improve crafting, stamina, and combat.", nodes: [{ id: "c1", name: "Efficient Crafter", tier: 1, cost: 1, effect: "Crafting time -30%", prerequisite: null }] },
  };
  return trees[type] ?? trees.rpg;
}

// ─── HUD builder ───────────────────────────────────────────────────────────

function buildHUD(type: GameType): GameHUD {
  const huds: Record<GameType, GameHUD> = {
    rpg:         { elements: ["Health Bar", "Mana Bar", "XP Progress", "Minimap", "Quest Tracker", "Hotbar", "Buff Icons"], minimap: true, healthDisplay: "Segmented bar with numeric overlay", resourceBars: ["Mana", "Stamina", "Gold Counter"], questTracker: true, notifications: "Top-right toast notifications for quest/loot" },
    platformer:  { elements: ["Lives Counter", "Score Display", "Timer", "Collectible Count", "Checkpoint Indicator"], minimap: false, healthDisplay: "Heart icons", resourceBars: ["Shield Meter"], questTracker: false, notifications: "Center-screen popups for pickups" },
    strategy:    { elements: ["Resource Counters", "Minimap", "Turn Counter", "Alert Log", "Unit Panel", "Tech Tree Button"], minimap: true, healthDisplay: "Unit HP bars on selection", resourceBars: ["Food", "Gold", "Wood", "Stone", "Population"], questTracker: true, notifications: "Bottom-left event log" },
    puzzle:      { elements: ["Move Counter", "Timer", "Hint Button", "Score", "Level Progress"], minimap: false, healthDisplay: "Lives icons", resourceBars: ["Hint Tokens"], questTracker: false, notifications: "Center overlay for success/fail" },
    simulation:  { elements: ["Budget Display", "Happiness Meter", "Population Counter", "Date/Time", "Alert Panel", "Stats Dashboard"], minimap: true, healthDisplay: "City health/happiness bar", resourceBars: ["Budget", "Power", "Water", "Food"], questTracker: true, notifications: "Sidebar notification feed" },
    adventure:   { elements: ["Health Bar", "Inventory Shortcut", "Objective Display", "Compass", "Interaction Prompt"], minimap: true, healthDisplay: "Numeric + bar", resourceBars: ["Stamina"], questTracker: true, notifications: "Speech bubble + overlay" },
    action:      { elements: ["Health", "Ammo/Energy", "Score Multiplier", "Special Meter", "Enemy HP Bars", "Wave Counter"], minimap: false, healthDisplay: "Gradient health bar", resourceBars: ["Ammo", "Special Gauge", "Shield"], questTracker: false, notifications: "Kill feed + event log" },
    horror:      { elements: ["Sanity Meter", "Health", "Inventory", "Flashlight Battery", "Heartbeat Indicator"], minimap: false, healthDisplay: "Vignette pulse + numeric", resourceBars: ["Sanity", "Battery", "Ammo"], questTracker: false, notifications: "Ambient sound cues; minimal UI intentional" },
    sports:      { elements: ["Scoreboard", "Timer", "Stamina Bars", "Formation View", "Instant Replay Button"], minimap: false, healthDisplay: "Player stamina bars", resourceBars: ["Team Energy", "Momentum Meter"], questTracker: false, notifications: "Score events, referee calls" },
    educational: { elements: ["Progress Bar", "Score", "Lives/Attempts", "Knowledge Points", "Achievement Icons"], minimap: false, healthDisplay: "Attempt counter", resourceBars: ["Knowledge Points"], questTracker: true, notifications: "Celebratory overlay for correct answers" },
    sandbox:     { elements: ["Block Counter", "Tool Selector", "Day/Night Cycle", "Coordinates", "Creative Menu"], minimap: true, healthDisplay: "None (creative) / HP bar (survival)", resourceBars: ["Hunger", "Stamina"], questTracker: false, notifications: "Item pickup popups" },
    survival:    { elements: ["Health", "Hunger", "Thirst", "Temperature", "Stamina", "Inventory Bar", "Threat Indicator"], minimap: true, healthDisplay: "Multi-stat bars with icons", resourceBars: ["Hunger", "Thirst", "Temperature", "Stamina"], questTracker: true, notifications: "Warning indicators at stat thresholds" },
  };
  return huds[type] ?? huds.rpg;
}

// ─── Progression builder ───────────────────────────────────────────────────

function buildProgression(type: GameType): ProgressionSystem {
  const progs: Record<GameType, ProgressionSystem> = {
    rpg:         { type: "XP / Level Up", levels: 50, xpCurve: "Exponential — XP required doubles every 5 levels (mock formula)", rewards: ["Skill Points", "Stat Upgrades", "New Abilities", "Story Unlocks"], prestige: true, seasons: false, description: "Classic RPG level progression. Prestige resets level but grants bonus stats." },
    platformer:  { type: "Star Rank", levels: 30, xpCurve: "Linear — fixed star requirements per level", rewards: ["Lives", "Cosmetics", "Bonus Levels", "Soundtrack Unlocks"], prestige: false, seasons: false, description: "Collect stars across levels to unlock new worlds and bonus stages." },
    strategy:    { type: "Era Advancement", levels: 5, xpCurve: "Milestone-based — advance Era when researching all required technologies", rewards: ["New Units", "Advanced Buildings", "Map Events"], prestige: false, seasons: true, description: "Advance through historical/fictional eras by completing research milestones." },
    puzzle:      { type: "Star Ratings", levels: 100, xpCurve: "Per-puzzle rating based on moves/time", rewards: ["Hint Tokens", "Cosmetic Themes", "Bonus Chapters"], prestige: false, seasons: false, description: "Earn 1–3 stars per puzzle based on efficiency. Accumulate for chapter unlocks." },
    simulation:  { type: "City Rank", levels: 20, xpCurve: "Population milestones drive rank advancement", rewards: ["Building Unlocks", "Landmark Access", "Policy Options"], prestige: false, seasons: false, description: "Grow population and happiness to advance city rank and unlock features." },
    adventure:   { type: "Story Chapters", levels: 12, xpCurve: "Linear story chapters; no grinding", rewards: ["Story Content", "Character Development", "Area Unlocks"], prestige: false, seasons: false, description: "Progress through the narrative; no level-grinding required." },
    action:      { type: "Score / Rank", levels: 100, xpCurve: "Score accumulation with combo multipliers", rewards: ["Cosmetics", "Harder Modes", "Story Extras"], prestige: true, seasons: true, description: "High-score competitive progression. Seasonal rankings reset with cosmetic rewards." },
    horror:      { type: "Survival Chapters", levels: 8, xpCurve: "Linear chapter completion", rewards: ["Story Unlocks", "New Endings", "Challenge Modes"], prestige: false, seasons: false, description: "Progress through survival chapters with branching outcomes." },
    sports:      { type: "Season Ladder", levels: 30, xpCurve: "Match wins + performance ratings accumulate", rewards: ["Better Players", "Stadium Upgrades", "Trophy Room"], prestige: false, seasons: true, description: "Seasonal league ladder with promotion/relegation system." },
    educational: { type: "Knowledge Points", levels: 50, xpCurve: "Points per correct answer, bonus for streaks", rewards: ["Certificates", "Bonus Modules", "Avatar Items"], prestige: false, seasons: false, description: "Mastery-based progression. Advance by demonstrating knowledge." },
    sandbox:     { type: "Creative Milestones", levels: 0, xpCurve: "No fixed level cap — milestone-based", rewards: ["New Material Sets", "Tool Unlocks", "Share Features"], prestige: false, seasons: true, description: "Milestone-based progression with seasonal creative challenges." },
    survival:    { type: "Days Survived", levels: 100, xpCurve: "Each in-game day = 1 progress unit", rewards: ["Better Recipes", "Base Upgrades", "Story Revelations"], prestige: true, seasons: false, description: "Survive as long as possible. Prestige resets world but carries crafting knowledge." },
  };
  return progs[type] ?? progs.rpg;
}

// ─── Game Loop builder ─────────────────────────────────────────────────────

function buildGameLoop(type: GameType): GameLoop[] {
  const loops: Record<GameType, GameLoop[]> = {
    rpg: [
      { phase: "Explore",   duration: "Variable",  actions: ["Move through world", "Discover locations", "Gather resources"], outcome: "New areas revealed, items collected" },
      { phase: "Encounter", duration: "2–10 min",  actions: ["Engage enemies in turn-based combat", "Use skills/items"], outcome: "XP gained, loot dropped, HP/MP consumed" },
      { phase: "Rest",      duration: "1 min",     actions: ["Camp or visit inn", "Restore HP/MP", "Save game"], outcome: "Resources restored, progress saved" },
      { phase: "Progress",  duration: "Milestone", actions: ["Level up, allocate skills", "Advance quest"], outcome: "Character stronger, story advances" },
    ],
    platformer: [
      { phase: "Run",      duration: "Continuous", actions: ["Move, jump, collect"], outcome: "Level progress, score increases" },
      { phase: "Challenge", duration: "10–30 sec",  actions: ["Avoid obstacle, defeat enemy"], outcome: "Checkpoint reached or life lost" },
      { phase: "Complete",  duration: "End of level", actions: ["Reach goal", "Bonus tallied"], outcome: "Star rating, next level unlocked" },
    ],
    strategy: [
      { phase: "Build",   duration: "5–15 min", actions: ["Construct buildings, gather resources"], outcome: "Economy established" },
      { phase: "Research",duration: "3–5 min",  actions: ["Queue research, manage population"], outcome: "New options unlocked" },
      { phase: "Combat",  duration: "5–20 min", actions: ["Engage enemy forces, capture territory"], outcome: "Map state changes" },
      { phase: "Recover", duration: "2–5 min",  actions: ["Repair, reinforce, regroup"], outcome: "Ready for next engagement" },
    ],
    puzzle:      [{ phase: "Analyze", duration: "1–5 min", actions: ["Study puzzle layout"], outcome: "Mental model formed" }, { phase: "Solve", duration: "1–30 min", actions: ["Execute solution sequence"], outcome: "Level complete or retry" }],
    simulation:  [{ phase: "Plan", duration: "Open-ended", actions: ["Zone areas, set budgets"], outcome: "City/org develops" }, { phase: "Manage", duration: "Continuous", actions: ["Handle events, adjust policies"], outcome: "Metrics shift" }, { phase: "Expand", duration: "Milestone", actions: ["Reach population threshold, unlock tier"], outcome: "New content available" }],
    adventure:   [{ phase: "Explore", duration: "Variable", actions: ["Move, interact, examine"], outcome: "Clues revealed, areas unlocked" }, { phase: "Solve", duration: "Variable", actions: ["Use items, talk to NPCs, solve puzzles"], outcome: "Progress gates open" }],
    action:      [{ phase: "Engage",  duration: "Continuous", actions: ["Attack, dodge, combo"], outcome: "Score multiplier rises" }, { phase: "Rest", duration: "Between waves", actions: ["Upgrade, heal"], outcome: "Prepared for next challenge" }],
    horror:      [{ phase: "Navigate", duration: "Variable", actions: ["Move carefully, avoid threats"], outcome: "Progress without detection" }, { phase: "Survive", duration: "Encounter", actions: ["Hide, flee, solve"], outcome: "Threat passed or failed" }],
    sports:      [{ phase: "Prepare", duration: "Pre-match", actions: ["Set lineup, review tactics"], outcome: "Tactical advantage" }, { phase: "Play", duration: "Match", actions: ["Execute moves, respond to AI"], outcome: "Score updates" }, { phase: "Review", duration: "Post-match", actions: ["Stats review, morale update"], outcome: "Season standing changes" }],
    educational: [{ phase: "Learn", duration: "5–10 min", actions: ["Read content, watch demo"], outcome: "Knowledge acquired" }, { phase: "Test", duration: "2–5 min", actions: ["Answer questions"], outcome: "Score, progress, or retry" }],
    sandbox:     [{ phase: "Create", duration: "Open-ended", actions: ["Build, terraform, design"], outcome: "World modified" }, { phase: "Share", duration: "Optional", actions: ["Publish creation"], outcome: "Community visibility" }],
    survival:    [{ phase: "Gather", duration: "Day cycle", actions: ["Collect food, materials, water"], outcome: "Resources stockpiled" }, { phase: "Build", duration: "Evening", actions: ["Craft shelter, tools"], outcome: "Base improved" }, { phase: "Survive Night", duration: "Night cycle", actions: ["Defend from threats, maintain warmth"], outcome: "Day progresses or fail" }],
  };
  return loops[type] ?? loops.rpg;
}

// ─── Engine Class ─────────────────────────────────────────────────────────

class UniversalGameEngineClass {
  private projects: Map<string, GameProject> = new Map();

  generate(params: {
    type:           GameType;
    title?:         string;
    genre?:         string;
    worldName?:     string;
    targetAudience?: string;
  }): GameProject {
    const { type, title, genre, worldName = "The Realm", targetAudience = "General audience (13+)" } = params;
    const preset = GENRE_PRESETS[type];
    const selectedGenre = genre ?? preset.genres[0];
    const platform = preset.platforms.slice(0, 2);
    const perspective = preset.perspectives[0];

    const proj: GameProject = {
      id:          `game_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      title:       title ?? `${worldName}: ${["Chronicles", "Legends", "Uprising", "Odyssey", "Realms"][Math.floor(Math.random() * 5)]}`,
      type,
      genre:       selectedGenre,
      platform,
      perspective,
      logline:     `In the world of ${worldName}, a ${targetAudience.toLowerCase()} must overcome legendary trials in a ${selectedGenre} adventure. [Fictional — demo only]`,
      synopsis:    `${worldName} is a fictional world on the brink of transformation. The player assumes the role of a ${["chosen hero", "reluctant rogue", "brilliant strategist", "lone survivor"][Math.floor(Math.random() * 4)]} who must navigate a world of conflict, mystery, and discovery. All lore, characters, and events are entirely fictional and created for demo purposes only. This synopsis is not a real game proposal.`,
      targetAudience,
      ratingTarget: type === "horror" ? "M (17+)" : type === "educational" ? "E (Everyone)" : type === "action" ? "T (13+)" : "T (13+)",
      mechanics:    buildMechanics(type),
      levels:       buildLevels(type, worldName, 5),
      npcs:         buildNPCs(5),
      skillTree:    buildSkillTree(type),
      hud:          buildHUD(type),
      progression:  buildProgression(type),
      gameLoop:     buildGameLoop(type),
      storyArc:     `Act 1 — The Call to ${worldName}: Protagonist discovers their role in the conflict.\nAct 2 — Rising Stakes: Alliances form, betrayals occur, world expands.\nAct 3 — The Reckoning: Final confrontation, resolution, epilogue. Multiple endings. [Fictional]`,
      worldName,
      worldDesc:    `${worldName} is a fictional ${selectedGenre} world with unique geography, factions, history, and culture. All lore is demo-only and non-factual.`,
      assetList:    [
        "Character models × 12 (placeholder)",
        "Environment tilesets × 8 (placeholder)",
        "UI kit — HUD + menus (placeholder)",
        "SFX library — 150 mock audio cues",
        "Original soundtrack — 12 tracks (mock descriptions)",
        "Particle effects — 30 types (mock)",
        "Cutscene storyboards × 6 (mock)",
      ],
      technicalNotes: `Target: 60fps on mid-range hardware. Mock engine: [Fictional Engine v1.0]. Recommended: 16GB RAM, GPU 8GB VRAM. Multiplayer: Optional co-op/PvP (fictional spec). All technical notes are demo placeholders — no real engine is specified.`,
      safetyNote:   "FICTIONAL & INTERNAL ONLY. This game design document is entirely fabricated for demo purposes. No real game is in development. All characters, worlds, mechanics, and lore are non-factual placeholders.",
      generatedAt:  new Date().toISOString(),
    };

    this.projects.set(proj.id, proj);
    return proj;
  }

  getAll(): GameProject[] { return [...this.projects.values()]; }
  get(id: string): GameProject | undefined { return this.projects.get(id); }
  delete(id: string) { this.projects.delete(id); }

  getTypeLabel(type: GameType): string {
    const labels: Record<GameType, string> = {
      rpg: "Role-Playing Game", platformer: "Platformer", strategy: "Strategy",
      puzzle: "Puzzle", simulation: "Simulation", adventure: "Adventure",
      action: "Action", horror: "Horror", sports: "Sports / Athletic",
      educational: "Educational", sandbox: "Sandbox / Open World", survival: "Survival",
    };
    return labels[type] ?? type;
  }
}

export const GameEngine = new UniversalGameEngineClass();
