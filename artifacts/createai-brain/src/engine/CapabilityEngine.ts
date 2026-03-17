// ═══════════════════════════════════════════════════════════════════════════
// CAPABILITY ENGINE — Central Orchestrator for CreateAI Brain
// Registers 39 engines (29 regular + 10 meta-agents) and 15 series.
// Connects to real AI API for generation.
// Auto-saves outputs to /api/documents.
// ═══════════════════════════════════════════════════════════════════════════

export type EngineCategory =
  | "universal" | "meta-agent" | "intelligence" | "creative" | "workflow"
  | "integration" | "data" | "platform" | "series" | "imagination";

export type EngineStatus = "active" | "idle" | "running" | "complete";

export interface EngineDefinition {
  id: string;
  name: string;
  category: EngineCategory;
  icon: string;
  color: string;
  description: string;
  series?: string;
  capabilities: string[];
  status: EngineStatus;
  runCount: number;
}

export interface SeriesDefinition {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  description: string;
  engines: string[];
  capabilities: string[];
}

export interface CapabilityRunOptions {
  engineId: string;
  engineName?: string;
  topic: string;
  context?: string;
  mode?: string;
  agentId?: string;
  onChunk: (text: string) => void;
  onDone?: () => void;
  onError?: (err: string) => void;
}

export interface MetaAgentRunOptions {
  agentId: string;
  task: string;
  context?: string;
  domain?: string;
  onChunk: (text: string) => void;
  onDone?: () => void;
  onError?: (err: string) => void;
}

// ─── All Engines Registry ─────────────────────────────────────────────────────

export const ALL_ENGINES: EngineDefinition[] = [
  // Universal Engines
  {
    id: "InfiniteExpansionEngine",
    name: "Infinite Expansion Engine",
    category: "universal",
    icon: "♾️",
    color: "#6366f1",
    description: "Expands any idea infinitely across all domains. Core expansion layer of the platform.",
    series: "Ω-Series",
    capabilities: ["Infinite idea expansion", "Cross-domain innovation", "Module generation", "Opportunity surfacing"],
    status: "active",
    runCount: 0,
  },
  {
    id: "UniversalCreativeEngine",
    name: "Universal Creative Engine",
    category: "creative",
    icon: "🎬",
    color: "#FF2D55",
    description: "Generates complete creative production packages for any medium — video, course, podcast, script.",
    capabilities: ["Scripts", "Storyboards", "Podcast outlines", "Course structures", "Documentary treatments"],
    status: "active",
    runCount: 0,
  },
  {
    id: "UniversalWorkflowEngine",
    name: "Universal Workflow Engine",
    category: "workflow",
    icon: "⚙️",
    color: "#FF9500",
    description: "Designs complete workflows for any industry or process with automation opportunities.",
    capabilities: ["Workflow design", "Stage mapping", "Role assignment", "Automation opportunities", "SLA definition"],
    status: "active",
    runCount: 0,
  },
  {
    id: "UniversalStrategyEngine",
    name: "Universal Strategy Engine",
    category: "intelligence",
    icon: "🧭",
    color: "#007AFF",
    description: "Generates comprehensive strategic roadmaps with milestones, positioning, and revenue models.",
    capabilities: ["Strategic roadmaps", "Competitive positioning", "Revenue modeling", "Risk analysis", "Milestone planning"],
    status: "active",
    runCount: 0,
  },
  {
    id: "UniversalStoryEngine",
    name: "Universal Story Engine",
    category: "creative",
    icon: "📖",
    color: "#BF5AF2",
    description: "Creates complete narrative universes with characters, world-building, and plot structures.",
    capabilities: ["Character development", "World-building", "Plot structure", "Scene breakdowns", "Thematic frameworks"],
    status: "active",
    runCount: 0,
  },
  {
    id: "UniversalGameEngine",
    name: "Universal Game Engine",
    category: "creative",
    icon: "🎮",
    color: "#30B0C7",
    description: "Designs complete game systems: mechanics, progression, economy, and player journey.",
    capabilities: ["Game mechanics", "Progression systems", "Economy design", "Level design", "Player journey maps"],
    status: "active",
    runCount: 0,
  },
  {
    id: "UniversalConnectionEngine",
    name: "Universal Connection Engine",
    category: "integration",
    icon: "🕸️",
    color: "#34C759",
    description: "Maps cross-domain connections and surfaces innovation opportunities across disciplines.",
    capabilities: ["Cross-domain mapping", "Pattern recognition", "Innovation bridges", "Integration pathways"],
    status: "active",
    runCount: 0,
  },
  // Meta-Agents
  {
    id: "ORACLE",
    name: "Oracle",
    category: "meta-agent",
    icon: "🔮",
    color: "#5856D6",
    description: "Predictive intelligence — trend forecasting, risk modeling, cross-temporal analysis.",
    capabilities: ["Trend forecasting", "Risk modeling", "Pattern prediction", "Signal detection", "Scenario planning"],
    status: "active",
    runCount: 0,
  },
  {
    id: "FORGE",
    name: "Forge",
    category: "meta-agent",
    icon: "⚡",
    color: "#FF9500",
    description: "Content & package builder — infinite generation, module packaging, distribution.",
    capabilities: ["Content generation", "Module packaging", "Distribution design", "Asset bundling"],
    status: "active",
    runCount: 0,
  },
  {
    id: "NEXUS",
    name: "Nexus",
    category: "meta-agent",
    icon: "🕸️",
    color: "#007AFF",
    description: "Cross-domain integration — workflow automation, API bridging, multi-system orchestration.",
    capabilities: ["Integration architecture", "Workflow automation", "System bridging", "API design"],
    status: "active",
    runCount: 0,
  },
  {
    id: "SENTINEL",
    name: "Sentinel",
    category: "meta-agent",
    icon: "🛡️",
    color: "#34C759",
    description: "Risk & compliance — real-time risk checks, regulatory compliance, quality assurance.",
    capabilities: ["Risk assessment", "Compliance mapping", "Quality gates", "Integrity checks"],
    status: "active",
    runCount: 0,
  },
  {
    id: "PULSE",
    name: "Pulse",
    category: "meta-agent",
    icon: "💓",
    color: "#FF2D55",
    description: "Engagement AI — emotional journey design, sentiment analysis, engagement optimization.",
    capabilities: ["Emotional mapping", "Engagement design", "Sentiment analysis", "Friction reduction"],
    status: "active",
    runCount: 0,
  },
  {
    id: "VECTOR",
    name: "Vector",
    category: "meta-agent",
    icon: "📊",
    color: "#BF5AF2",
    description: "Data pattern recognition — signal extraction, insight synthesis, narrative generation.",
    capabilities: ["Pattern extraction", "Data narrative", "Signal analysis", "Insight synthesis"],
    status: "active",
    runCount: 0,
  },
  // Intelligence Engines
  {
    id: "ProjectIntelligence",
    name: "Project Intelligence",
    category: "intelligence",
    icon: "🧠",
    color: "#6366f1",
    description: "Intelligent project analysis — recommendations, risk assessment, milestone planning.",
    capabilities: ["Project recommendations", "Risk assessment", "Resource planning", "Success metrics"],
    status: "active",
    runCount: 0,
  },
  {
    id: "BrainGen",
    name: "BrainGen",
    category: "universal",
    icon: "✨",
    color: "#FFD60A",
    description: "Universal instant content generator — any type of content, any topic, any format.",
    capabilities: ["Social posts", "Emails", "Blog content", "Pitches", "Reports", "Any content type"],
    status: "active",
    runCount: 0,
  },
  // Platform Engines
  {
    id: "RegulatoryEngine",
    name: "Regulatory Engine",
    category: "platform",
    icon: "📋",
    color: "#FF3B30",
    description: "Regulatory compliance frameworks for any industry or jurisdiction.",
    capabilities: ["Compliance mapping", "Regulatory requirements", "Audit checklists", "Risk areas"],
    status: "active",
    runCount: 0,
  },
  {
    id: "BackendBlueprintEngine",
    name: "Backend Blueprint Engine",
    category: "platform",
    icon: "🏗️",
    color: "#636366",
    description: "Complete backend architecture specifications — APIs, data models, security patterns.",
    capabilities: ["API design", "Data modeling", "Security patterns", "Infrastructure blueprints"],
    status: "active",
    runCount: 0,
  },
  {
    id: "TemplateLibrary",
    name: "Template Library",
    category: "platform",
    icon: "📄",
    color: "#34C759",
    description: "Complete ready-to-use templates for any business document or structured content.",
    capabilities: ["Business templates", "Form design", "Report structures", "Proposal frameworks"],
    status: "active",
    runCount: 0,
  },
  {
    id: "ConversationEngine",
    name: "Conversation Engine",
    category: "workflow",
    icon: "💬",
    color: "#007AFF",
    description: "Conversational flow design — chatbot scripts, dialogue trees, interaction frameworks.",
    capabilities: ["Dialogue design", "Intent handling", "Escalation flows", "Tone guidelines"],
    status: "active",
    runCount: 0,
  },
  {
    id: "IntegrationEngine",
    name: "Integration Engine",
    category: "integration",
    icon: "🔌",
    color: "#BF5AF2",
    description: "System integration specifications — data mapping, authentication, error handling.",
    capabilities: ["Integration specs", "Data mapping", "Auth design", "Error strategies"],
    status: "active",
    runCount: 0,
  },
  {
    id: "ExportEngine",
    name: "Export Engine",
    category: "platform",
    icon: "📤",
    color: "#FF9500",
    description: "Export and reporting specifications — report designs, dashboard layouts, distribution.",
    capabilities: ["Report design", "Export formats", "Dashboard specs", "Distribution strategies"],
    status: "active",
    runCount: 0,
  },
  {
    id: "ThemeEngine",
    name: "Theme Engine",
    category: "platform",
    icon: "🎨",
    color: "#FF2D55",
    description: "Design system specifications — color systems, typography, component libraries.",
    capabilities: ["Color systems", "Typography scales", "Component specs", "Brand guidelines"],
    status: "active",
    runCount: 0,
  },
  {
    id: "guideEngine",
    name: "Guide Engine",
    category: "platform",
    icon: "🗺️",
    color: "#30B0C7",
    description: "Comprehensive guides, tutorials, and educational content for any product or process.",
    capabilities: ["Onboarding guides", "Tutorial flows", "Help documentation", "Educational content"],
    status: "active",
    runCount: 0,
  },
  {
    id: "InviteGeneratorEngine",
    name: "Invite Generator",
    category: "workflow",
    icon: "📧",
    color: "#34C759",
    description: "Complete invite and onboarding campaigns — copy, sequences, activation prompts.",
    capabilities: ["Invite copy", "Welcome sequences", "Onboarding emails", "Referral structures"],
    status: "active",
    runCount: 0,
  },
  {
    id: "InteractionEngine",
    name: "Interaction Engine",
    category: "platform",
    icon: "🖱️",
    color: "#636366",
    description: "Interactive system design — user interaction flows, state machines, UX patterns.",
    capabilities: ["Interaction flows", "State management", "UX patterns", "User journeys"],
    status: "active",
    runCount: 0,
  },

  // ── Expansion Layer B1 — Intelligence Engines ───────────────────────────
  {
    id: "ResearchEngine",
    name: "Research Engine",
    category: "intelligence",
    icon: "🔬",
    color: "#007AFF",
    description: "Deep research synthesis — literature reviews, domain analysis, evidence summaries, and citation-structured reports.",
    capabilities: ["Literature synthesis", "Domain analysis", "Evidence mapping", "Research reports", "Citation structures"],
    status: "active",
    runCount: 0,
  },
  {
    id: "PersonaEngine",
    name: "Persona Engine",
    category: "intelligence",
    icon: "👤",
    color: "#BF5AF2",
    description: "User persona creation — ICP definition, psychographic profiling, behavior mapping, and empathy frameworks.",
    capabilities: ["Persona creation", "ICP definition", "Psychographic profiling", "Behavior mapping", "Empathy maps"],
    status: "active",
    runCount: 0,
  },
  {
    id: "MarketResearchEngine",
    name: "Market Research Engine",
    category: "intelligence",
    icon: "📈",
    color: "#34C759",
    description: "Market sizing, competitive landscape mapping, opportunity analysis, and go-to-market intelligence.",
    capabilities: ["Market sizing", "Competitive mapping", "Opportunity analysis", "GTM intelligence", "Industry benchmarks"],
    status: "active",
    runCount: 0,
  },
  {
    id: "CritiqueEngine",
    name: "Critique Engine",
    category: "intelligence",
    icon: "🧐",
    color: "#FF3B30",
    description: "Critical analysis, quality review, red team thinking, assumption challenges, and structured feedback.",
    capabilities: ["Critical analysis", "Red team thinking", "Quality review", "Assumption challenges", "Structured critique"],
    status: "active",
    runCount: 0,
  },
  {
    id: "LearningEngine",
    name: "Learning Engine",
    category: "intelligence",
    icon: "🎓",
    color: "#5856D6",
    description: "Learning path design, curriculum development, skill gap analysis, and knowledge transfer frameworks.",
    capabilities: ["Learning paths", "Curriculum design", "Skill gap analysis", "Knowledge transfer", "Competency frameworks"],
    status: "active",
    runCount: 0,
  },

  // ── Expansion Layer B2 — Workflow Engines ───────────────────────────────
  {
    id: "PricingEngine",
    name: "Pricing Engine",
    category: "workflow",
    icon: "💰",
    color: "#FFD60A",
    description: "Pricing strategy design — packaging, tier structures, competitive pricing analysis, and revenue optimization.",
    capabilities: ["Pricing strategy", "Tier design", "Packaging", "Competitive benchmarks", "Revenue models"],
    status: "active",
    runCount: 0,
  },
  {
    id: "FeedbackEngine",
    name: "Feedback Engine",
    category: "workflow",
    icon: "📊",
    color: "#34C759",
    description: "Feedback collection systems, NPS frameworks, user research protocols, and insight synthesis pipelines.",
    capabilities: ["Feedback systems", "NPS design", "User research", "Insight synthesis", "Survey frameworks"],
    status: "active",
    runCount: 0,
  },
  {
    id: "CommunicationEngine",
    name: "Communication Engine",
    category: "workflow",
    icon: "📢",
    color: "#FF9500",
    description: "Communication plans, PR frameworks, messaging hierarchies, stakeholder communication, and announcement strategies.",
    capabilities: ["Communication plans", "PR frameworks", "Messaging hierarchies", "Stakeholder comms", "Announcement strategy"],
    status: "active",
    runCount: 0,
  },

  // ── Expansion Layer B3 — Data + Integration Engines ─────────────────────
  {
    id: "DataModelEngine",
    name: "Data Model Engine",
    category: "data",
    icon: "🗄️",
    color: "#30B0C7",
    description: "Data schema design, entity relationship modeling, database architecture, and data governance frameworks.",
    capabilities: ["Schema design", "ER modeling", "Database architecture", "Data governance", "Migration plans"],
    status: "active",
    runCount: 0,
  },
  {
    id: "LocalizationEngine",
    name: "Localization Engine",
    category: "integration",
    icon: "🌍",
    color: "#007AFF",
    description: "Localization strategy, i18n architecture, cultural adaptation frameworks, and multi-language rollout plans.",
    capabilities: ["Localization strategy", "i18n architecture", "Cultural adaptation", "Language rollouts", "Regional compliance"],
    status: "active",
    runCount: 0,
  },

  // ── Expansion Layer C1-C2 — New Meta-Agents ──────────────────────────────
  {
    id: "ARCHITECT",
    name: "ARCHITECT",
    category: "meta-agent",
    icon: "🏛️",
    color: "#5856D6",
    description: "System architecture meta-agent — designs complete technical blueprints, microservice maps, and scalable system structures.",
    capabilities: ["System blueprints", "Microservice design", "Scalability planning", "Technical architecture", "Infrastructure mapping"],
    status: "active",
    runCount: 0,
  },
  {
    id: "CURATOR",
    name: "CURATOR",
    category: "meta-agent",
    icon: "🎯",
    color: "#FF2D55",
    description: "Content curation meta-agent — filters, ranks, organizes, and packages knowledge for maximum clarity and impact.",
    capabilities: ["Content curation", "Quality filtering", "Knowledge organization", "Package assembly", "Signal ranking"],
    status: "active",
    runCount: 0,
  },
  {
    id: "MENTOR",
    name: "MENTOR",
    category: "meta-agent",
    icon: "📚",
    color: "#FF9500",
    description: "Coaching and mentorship meta-agent — skill development plans, growth frameworks, and personalized learning guidance.",
    capabilities: ["Skill development", "Growth frameworks", "Coaching plans", "Personalized guidance", "Performance mapping"],
    status: "active",
    runCount: 0,
  },
  {
    id: "CATALYST",
    name: "CATALYST",
    category: "meta-agent",
    icon: "⚡",
    color: "#34C759",
    description: "Momentum meta-agent — rapid prototyping, breakthrough acceleration, blockers removal, and execution velocity.",
    capabilities: ["Rapid prototyping", "Breakthrough acceleration", "Blocker removal", "Execution velocity", "Momentum building"],
    status: "active",
    runCount: 0,
  },
  // ── ImaginationLab Engines — 11 creative engines ─────────────────────
  {
    id: "StoryEngine",
    name: "Story Engine",
    category: "imagination",
    icon: "📖",
    color: "#8b5cf6",
    description: "Builds complete story structures — premise, three-act arc, story beats, and thematic core for any genre. Fictional content only.",
    series: "IMAG-Series",
    capabilities: ["Story structure", "Three-act arc", "Story beats", "Thematic mapping", "Narrative design"],
    status: "active",
    runCount: 0,
  },
  {
    id: "CharacterEngine",
    name: "Character Engine",
    category: "imagination",
    icon: "🧑‍🎨",
    color: "#ec4899",
    description: "Designs rich fictional characters with personality, backstory, motivation, arc, and voice. Fictional content only.",
    series: "IMAG-Series",
    capabilities: ["Character design", "Backstory creation", "Motivation mapping", "Character arc", "Dialogue voice"],
    status: "active",
    runCount: 0,
  },
  {
    id: "WorldbuildingEngine",
    name: "Worldbuilding Engine",
    category: "imagination",
    icon: "🌍",
    color: "#10b981",
    description: "Creates entire fictional worlds — geography, cultures, history, power systems, and story hooks. Fictional content only.",
    series: "IMAG-Series",
    capabilities: ["World design", "Culture creation", "History mapping", "Power systems", "Story hooks"],
    status: "active",
    runCount: 0,
  },
  {
    id: "CreatureEngine",
    name: "Creature Engine",
    category: "imagination",
    icon: "🐉",
    color: "#f59e0b",
    description: "Invents original fantasy and sci-fi creatures with biology, behavior, lore, and story role. Fictional content only.",
    series: "QUEST-Series",
    capabilities: ["Creature design", "Biology creation", "Behavioral patterns", "Creature lore", "Story integration"],
    status: "active",
    runCount: 0,
  },
  {
    id: "SuperpowerEngine",
    name: "Superpower Engine",
    category: "imagination",
    icon: "⚡",
    color: "#f97316",
    description: "Designs fictional superpowers with rules, limitations, tiers, origins, and dramatic story uses. Fictional content only.",
    series: "QUEST-Series",
    capabilities: ["Power design", "Rule systems", "Limitation mapping", "Power tiers", "Story applications"],
    status: "active",
    runCount: 0,
  },
  {
    id: "AdventureEngine",
    name: "Adventure Engine",
    category: "imagination",
    icon: "🗺️",
    color: "#06b6d4",
    description: "Creates complete adventure scenarios — journey maps, challenges, team roles, climax, and resolution. Fictional content only.",
    series: "QUEST-Series",
    capabilities: ["Adventure design", "Journey mapping", "Challenge creation", "Team archetypes", "Climax design"],
    status: "active",
    runCount: 0,
  },
  {
    id: "ComicPlotEngine",
    name: "Comic Plot Engine",
    category: "imagination",
    icon: "💥",
    color: "#d946ef",
    description: "Generates comic book plot arcs — issues, heroes, villains, visual set pieces, and cliffhangers. Fictional content only.",
    series: "QUEST-Series",
    capabilities: ["Comic plot arcs", "Issue breakdowns", "Visual set pieces", "Hero/villain design", "Cliffhanger creation"],
    status: "active",
    runCount: 0,
  },
  {
    id: "GameIdeaEngine",
    name: "Game Idea Engine",
    category: "imagination",
    icon: "🎮",
    color: "#3b82f6",
    description: "Invents original game concepts with core loop, unique mechanics, world, progression, and art direction. Fictional content only.",
    series: "FICTION-TECH-Series",
    capabilities: ["Game design", "Mechanic invention", "Progression design", "World design", "Art direction"],
    status: "active",
    runCount: 0,
  },
  {
    id: "FutureTechFictionEngine",
    name: "Future Tech Fiction Engine",
    category: "imagination",
    icon: "🚀",
    color: "#22d3ee",
    description: "Imagines fantastic fictional future technologies for stories — purely narrative, no real technical content. Fictional content only.",
    series: "FICTION-TECH-Series",
    capabilities: ["Fictional tech design", "Societal impact", "Story conflict creation", "Narrative science", "World integration"],
    status: "active",
    runCount: 0,
  },
  {
    id: "BlueprintFictionEngine",
    name: "Blueprint Fiction Engine",
    category: "imagination",
    icon: "📐",
    color: "#64748b",
    description: "Creates fictional artifacts, vehicles, structures, and story props with lore and story function. Fictional content only — no real engineering.",
    series: "FICTION-TECH-Series",
    capabilities: ["Artifact design", "Vehicle creation", "Structure design", "Lore building", "Story prop creation"],
    status: "active",
    runCount: 0,
  },
  {
    id: "QuestEngine",
    name: "Quest Engine",
    category: "imagination",
    icon: "⚔️",
    color: "#dc2626",
    description: "Designs complete quest lines — objectives, journey stages, NPCs, puzzles, choice points, and rewards. Fictional content only.",
    series: "IMAG-Series",
    capabilities: ["Quest design", "Objective mapping", "NPC creation", "Puzzle design", "Reward systems"],
    status: "active",
    runCount: 0,
  },
  {
    id: "DreamscapeEngine",
    name: "Dreamscape Engine",
    category: "imagination",
    icon: "🌅",
    color: "#a78bfa",
    description: "Generates moods, color palettes, atmospheric scenes, sensory textures, and emotional environments for fictional worlds. Purely imaginative content.",
    series: "DREAMSCAPE-Series",
    capabilities: ["Mood generation", "Color palette design", "Atmospheric scene writing", "Sensory texture mapping", "Emotional environment design"],
    status: "active",
    runCount: 0,
  },
  {
    id: "MagicSystemEngine",
    name: "Magic System Engine",
    category: "imagination",
    icon: "🪄",
    color: "#7c3aed",
    description: "Designs rules-based magic systems with sources, costs, hard limits, side effects, internal logic, and narrative consequences. Purely fictional content.",
    series: "ARCANE-Series",
    capabilities: ["Magic source design", "Cost & limit systems", "Side effect mapping", "Narrative consequence design", "Internal logic building"],
    status: "active",
    runCount: 0,
  },
  // ── LoreForge Engines ─────────────────────────────────────────────────
  {
    id: "MythologyEngine",
    name: "Mythology Engine",
    category: "imagination",
    icon: "⚡",
    color: "#d97706",
    description: "Creates gods, pantheons, creation myths, divine conflicts, and sacred narratives for fictional worlds.",
    series: "MYTHOS-Series",
    capabilities: ["Pantheon creation", "Creation myth design", "Divine conflict mapping", "Sacred narrative writing", "Myth cycle building"],
    status: "active",
    runCount: 0,
  },
  {
    id: "ProphecyEngine",
    name: "Prophecy Engine",
    category: "imagination",
    icon: "🔮",
    color: "#9333ea",
    description: "Writes fictional prophecies with layered meanings, fated events, oracle traditions, and narrative interpretation. Fictional content only.",
    series: "FACTION-Series",
    capabilities: ["Prophecy writing", "Oracle tradition design", "Fate layer mapping", "Interpretation design", "Narrative tension building"],
    status: "active",
    runCount: 0,
  },
  {
    id: "LegendEngine",
    name: "Legend Engine",
    category: "imagination",
    icon: "🏛️",
    color: "#be185d",
    description: "Builds legendary heroes, lost civilizations, and epic tales passed through generations in fictional worlds.",
    series: "LORE-Series",
    capabilities: ["Hero legend creation", "Lost civilization design", "Epic tale building", "Generational myth writing", "Legacy design"],
    status: "active",
    runCount: 0,
  },
  {
    id: "ReligionEngine",
    name: "Religion Engine",
    category: "imagination",
    icon: "🕊️",
    color: "#0f766e",
    description: "Designs fictional religions with rituals, holy texts, schisms, clergy hierarchies, and sacred spaces.",
    series: "MYTHOS-Series",
    capabilities: ["Religion design", "Ritual creation", "Holy text writing", "Clergy hierarchy mapping", "Sacred space design"],
    status: "active",
    runCount: 0,
  },
  {
    id: "AncientHistoryEngine",
    name: "Ancient History Engine",
    category: "imagination",
    icon: "📜",
    color: "#78350f",
    description: "Creates fictional ancient civilizations, historical eras, turning points, and forgotten empires. Purely fictional content.",
    series: "LORE-Series",
    capabilities: ["Civilization design", "Historical era creation", "Turning point mapping", "Empire history building", "Forgotten world design"],
    status: "active",
    runCount: 0,
  },
  {
    id: "FactionEngine",
    name: "Faction Engine",
    category: "imagination",
    icon: "⚖️",
    color: "#1d4ed8",
    description: "Creates organizations, guilds, secret societies, and political factions with hierarchies, agendas, symbols, and rivalries.",
    series: "FACTION-Series",
    capabilities: ["Faction design", "Hierarchy mapping", "Agenda creation", "Symbol & insignia design", "Rivalry system building"],
    status: "active",
    runCount: 0,
  },
  {
    id: "LanguageEngine",
    name: "Language Engine",
    category: "imagination",
    icon: "🗣️",
    color: "#16a34a",
    description: "Designs fictional language concepts — naming conventions, grammatical flavors, writing systems, and cultural speech patterns.",
    series: "LANGUAGE-Series",
    capabilities: ["Naming convention design", "Grammar flavor creation", "Writing system design", "Cultural speech patterns", "Linguistic worldbuilding"],
    status: "active",
    runCount: 0,
  },
  {
    id: "CurseEngine",
    name: "Curse Engine",
    category: "imagination",
    icon: "💀",
    color: "#4c1d95",
    description: "Designs fictional curses and hexes — their origins, conditions, effects, consequences, and possible undoings. Purely fictional content.",
    series: "CURSE-Series",
    capabilities: ["Curse design", "Origin story creation", "Condition mapping", "Effect design", "Undoing mechanic building"],
    status: "active",
    runCount: 0,
  },
  {
    id: "ProphetEngine",
    name: "Prophet Engine",
    category: "imagination",
    icon: "🌟",
    color: "#b45309",
    description: "Creates fictional prophets and seers — their origin, visions, manner of speech, and how the world responds to them.",
    series: "CURSE-Series",
    capabilities: ["Prophet character design", "Vision creation", "Speech pattern design", "World response mapping", "Prophecy delivery design"],
    status: "active",
    runCount: 0,
  },
  {
    id: "RelicEngine",
    name: "Relic Engine",
    category: "imagination",
    icon: "🏺",
    color: "#92400e",
    description: "Creates sacred and legendary artifacts — histories, powers, current locations, who seeks them, and their narrative weight.",
    series: "LORE-Series",
    capabilities: ["Relic design", "Artifact history writing", "Power system design", "Seeker mapping", "Narrative weight building"],
    status: "active",
    runCount: 0,
  },
  {
    id: "LoreKeeperEngine",
    name: "LoreKeeper Engine",
    category: "imagination",
    icon: "📚",
    color: "#1e40af",
    description: "Designs fictional scholars, historians, and institutions that preserve, study, or actively suppress knowledge.",
    series: "FACTION-Series",
    capabilities: ["Scholar design", "Institution creation", "Knowledge system mapping", "Suppression mechanic design", "Archive world building"],
    status: "active",
    runCount: 0,
  },
  {
    id: "CosmologyEngine",
    name: "Cosmology Engine",
    category: "imagination",
    icon: "🌌",
    color: "#0e7490",
    description: "Designs the structure of fictional universes — planes of existence, celestial mechanics, the afterlife, and mortal-cosmos relations.",
    series: "MYTHOS-Series",
    capabilities: ["Plane of existence design", "Celestial mechanic creation", "Afterlife system design", "Mortal-cosmos relation mapping", "Universe structure building"],
    status: "active",
    runCount: 0,
  },
  {
    id: "EraEngine",
    name: "Era Engine",
    category: "imagination",
    icon: "⏳",
    color: "#6b7280",
    description: "Designs complete historical eras for fictional worlds — name, aesthetic, defining technology, major events, turning point, and collapse.",
    series: "CURSE-Series",
    capabilities: ["Era design", "Aesthetic mapping", "Major event creation", "Turning point design", "Civilizational collapse building"],
    status: "active",
    runCount: 0,
  },
  // ── Opportunity Engine ────────────────────────────────────────────────
  {
    id: "OpportunityEngine",
    name: "Opportunity Engine",
    category: "intelligence",
    icon: "🎯",
    color: "#f59e0b",
    description: "Discovers, scores, and strategically maps opportunities — market gaps, partnerships, revenue streams, and expansion vectors.",
    series: "OPP-Series",
    capabilities: ["Opportunity discovery", "Opportunity scoring", "Market gap analysis", "Revenue modeling", "Strategic prioritization", "Expansion mapping"],
    status: "active",
    runCount: 0,
  },

  // ── Maximum-Capacity Engines (v3 Expansion) ─────────────────────────────────
  {
    id: "DeliverableEngine",
    name: "Deliverable Engine",
    category: "workflow",
    icon: "📦",
    color: "#6366f1",
    description: "Generates complete structured deliverable packages with Demo, Test, and Live tiers — marketing assets, App Store copy, onboarding flows, and production specs.",
    series: "Ξ-Series",
    capabilities: ["Demo package", "Test package", "Live package", "App Store copy", "Onboarding flows", "Marketing assets"],
    status: "active",
    runCount: 0,
  },
  {
    id: "AutomationEngine",
    name: "Automation Engine",
    category: "workflow",
    icon: "🤖",
    color: "#FF9500",
    description: "Designs and builds complete workflow automation systems with trigger maps, action sequences, error handling, and integration hooks for any business process.",
    capabilities: ["Trigger mapping", "Action sequences", "Error handling", "Integration hooks", "Monitoring specs", "Platform implementation guides"],
    status: "active",
    runCount: 0,
  },
  {
    id: "ProductionEngine",
    name: "Production Engine",
    category: "workflow",
    icon: "🚀",
    color: "#34C759",
    description: "Generates 50-point production-readiness checklists, deployment strategies, disaster recovery plans, SLOs, and complete runbooks for any software system.",
    series: "Π-Series",
    capabilities: ["Production checklists", "Deployment strategies", "Disaster recovery", "SLO design", "Monitoring stacks", "Runbooks"],
    status: "active",
    runCount: 0,
  },
  {
    id: "ComplianceAuditEngine",
    name: "Compliance Audit Engine",
    category: "intelligence",
    icon: "📋",
    color: "#FF2D55",
    description: "Performs deep compliance audits across HIPAA, GDPR, SOC2, CCPA, PCI-DSS, and ADA — producing gap reports, remediation roadmaps, and audit evidence checklists.",
    series: "Ν-Series",
    capabilities: ["HIPAA audit", "GDPR audit", "SOC2 audit", "Gap reports", "Remediation roadmaps", "Audit evidence checklists"],
    status: "active",
    runCount: 0,
  },
  {
    id: "SecurityEngine",
    name: "Security Engine",
    category: "intelligence",
    icon: "🔐",
    color: "#FF3B30",
    description: "Designs comprehensive security architectures using STRIDE threat modeling, OWASP Top 10 mitigations, authentication design, encryption specs, and penetration test checklists.",
    series: "Θ-Series",
    capabilities: ["STRIDE threat modeling", "OWASP Top 10", "Authentication design", "Encryption specs", "Pen test checklists", "Security monitoring"],
    status: "active",
    runCount: 0,
  },
  {
    id: "ScalingEngine",
    name: "Scaling Engine",
    category: "intelligence",
    icon: "📈",
    color: "#007AFF",
    description: "Designs scaling architectures from zero to millions of users — bottleneck analysis, database scaling, API scaling, auto-scaling rules, cost models, and load testing plans.",
    series: "Θ-Series",
    capabilities: ["Scaling tiers", "Bottleneck analysis", "Database scaling", "API scaling", "Cost modeling", "Load testing plans"],
    status: "active",
    runCount: 0,
  },
  {
    id: "MonetizationEngine",
    name: "Monetization Engine",
    category: "intelligence",
    icon: "💰",
    color: "#34C759",
    description: "Designs complete revenue architectures — pricing tiers, subscription logic, free trial flows, upsell triggers, 12-month revenue forecasts, and payment integration specs.",
    series: "Ρ-Series",
    capabilities: ["Revenue models", "Pricing tiers", "Free trial design", "Upsell logic", "Revenue forecasts", "Payment integration"],
    status: "active",
    runCount: 0,
  },
  {
    id: "LaunchEngine",
    name: "Launch Engine",
    category: "workflow",
    icon: "🎯",
    color: "#FF9500",
    description: "Builds complete go-to-market launch systems — positioning, 90-day timelines, press kits, email sequences, social strategy, influencer outreach, and day-1 playbooks.",
    series: "Η-Series",
    capabilities: ["Launch positioning", "Target personas", "90-day timeline", "Press kits", "Email sequences", "Day-1 playbooks"],
    status: "active",
    runCount: 0,
  },
  {
    id: "GrowthEngine",
    name: "Growth Engine",
    category: "intelligence",
    icon: "📊",
    color: "#30B0C7",
    description: "Designs data-driven growth systems covering acquisition channels, activation flows, retention loops, referral programs, growth experiments, and north star metrics.",
    series: "Γ-Series",
    capabilities: ["Acquisition channels", "Activation flows", "Retention loops", "Referral programs", "Growth experiments", "North star metrics"],
    status: "active",
    runCount: 0,
  },
  {
    id: "RetentionEngine",
    name: "Retention Engine",
    category: "intelligence",
    icon: "🔄",
    color: "#BF5AF2",
    description: "Designs complete user retention architectures — churn analysis, onboarding optimization, engagement loops, re-engagement sequences, loyalty programs, and save flows.",
    series: "Γ-Series",
    capabilities: ["Churn analysis", "Onboarding optimization", "Engagement loops", "Re-engagement sequences", "Loyalty programs", "Health scores"],
    status: "active",
    runCount: 0,
  },
  {
    id: "AnalyticsEngine",
    name: "Analytics Engine",
    category: "intelligence",
    icon: "📉",
    color: "#636366",
    description: "Designs complete analytics systems — measurement frameworks, event taxonomies, funnel designs, dashboard specs, A/B testing frameworks, and data governance.",
    series: "Ι-Series",
    capabilities: ["Measurement frameworks", "Event taxonomies", "Funnel design", "Dashboard specs", "A/B testing", "Data governance"],
    status: "active",
    runCount: 0,
  },
  {
    id: "APIDesignEngine",
    name: "API Design Engine",
    category: "integration",
    icon: "🔌",
    color: "#007AFF",
    description: "Designs production-grade REST APIs with endpoint catalogs, OpenAPI specs, error handling, rate limiting, pagination, and webhook specifications.",
    series: "Χ-Series",
    capabilities: ["Endpoint catalogs", "OpenAPI specs", "Error handling", "Rate limiting", "Pagination", "Webhook design"],
    status: "active",
    runCount: 0,
  },
  {
    id: "UIUXEngine",
    name: "UI/UX Engine",
    category: "creative",
    icon: "🎨",
    color: "#FF2D55",
    description: "Generates complete UI/UX design systems — design principles, component libraries, typography, color systems, spacing, key screen wireframes, and interaction design specs.",
    series: "Ζ-Series",
    capabilities: ["Design principles", "Component libraries", "Typography systems", "Color systems", "Screen wireframes", "Interaction design"],
    status: "active",
    runCount: 0,
  },
  {
    id: "AccessibilityEngine",
    name: "Accessibility Engine",
    category: "intelligence",
    icon: "♿",
    color: "#34C759",
    description: "Performs WCAG 2.2 AA accessibility audits — keyboard navigation maps, screen reader guides, color contrast reports, ADA compliance statements, and ARIA specifications.",
    series: "Μ-Series",
    capabilities: ["WCAG 2.2 AA audits", "Keyboard navigation", "Screen reader guides", "Contrast reports", "ARIA specs", "ADA statements"],
    status: "active",
    runCount: 0,
  },
  {
    id: "DevOpsEngine",
    name: "DevOps Engine",
    category: "workflow",
    icon: "⚙️",
    color: "#FF9500",
    description: "Designs complete CI/CD pipelines, infrastructure-as-code, container architecture, monitoring stacks, SLO frameworks, and incident response systems.",
    series: "Θ-Series",
    capabilities: ["CI/CD pipelines", "Infrastructure-as-code", "Container architecture", "Monitoring stacks", "SLO frameworks", "Incident response"],
    status: "active",
    runCount: 0,
  },
  {
    id: "MobileEngine",
    name: "Mobile Engine",
    category: "creative",
    icon: "📱",
    color: "#5856D6",
    description: "Generates complete mobile app specifications for iOS and Android — screen inventories, offline strategies, push notification plans, App Store readiness, and device testing matrices.",
    series: "Μ-Series",
    capabilities: ["App architecture", "Screen inventory", "Offline strategy", "Push notifications", "App Store readiness", "Device testing"],
    status: "active",
    runCount: 0,
  },
  {
    id: "PartnershipEngine",
    name: "Partnership Engine",
    category: "intelligence",
    icon: "🤝",
    color: "#f59e0b",
    description: "Designs strategic partnership programs — landscape mapping, Tier-1 targets, value propositions, outreach sequences, agreement frameworks, and health metrics.",
    series: "Ψ-Series",
    capabilities: ["Partnership landscape", "Tier-1 targets", "Value propositions", "Outreach sequences", "Agreement frameworks", "Health metrics"],
    status: "active",
    runCount: 0,
  },
  {
    id: "ContentStrategyEngine",
    name: "Content Strategy Engine",
    category: "creative",
    icon: "✍️",
    color: "#BF5AF2",
    description: "Builds complete content strategies — content missions, audience matrices, editorial calendars, SEO strategies, distribution playbooks, and production workflows.",
    series: "Τ-Series",
    capabilities: ["Content missions", "Audience matrices", "Editorial calendars", "SEO strategies", "Distribution playbooks", "Production workflows"],
    status: "active",
    runCount: 0,
  },
  {
    id: "SEOEngine",
    name: "SEO Engine",
    category: "intelligence",
    icon: "🔍",
    color: "#30B0C7",
    description: "Generates complete SEO strategies — 30-keyword research, content gap analysis, technical audits, on-page optimization formulas, link building plans, and SEO dashboards.",
    series: "Τ-Series",
    capabilities: ["Keyword research", "Content gap analysis", "Technical audits", "On-page optimization", "Link building", "SEO dashboards"],
    status: "active",
    runCount: 0,
  },
  {
    id: "PerformanceEngine",
    name: "Performance Engine",
    category: "intelligence",
    icon: "⚡",
    color: "#FF9500",
    description: "Analyzes and optimizes software performance — Core Web Vitals targets, bottleneck identification, frontend optimization, backend caching, DB indexing, and load testing plans.",
    series: "Π-Series",
    capabilities: ["Core Web Vitals", "Bottleneck identification", "Frontend optimization", "Backend caching", "DB optimization", "Load testing"],
    status: "active",
    runCount: 0,
  },
];

// ─── All Series Registry ──────────────────────────────────────────────────────

export const ALL_SERIES: SeriesDefinition[] = [
  {
    id: "omega",
    name: "Ω-Series",
    symbol: "Ω",
    icon: "♾️",
    color: "#6366f1",
    description: "Meta-Creation Engine — holds the logic for infinite expansion and self-improvement. The outer boundary of what the platform can build.",
    engines: ["InfiniteExpansionEngine", "BrainGen", "FORGE"],
    capabilities: ["Infinite expansion", "Self-improvement logic", "Meta-creation", "Boundary pushing", "Recursive innovation"],
  },
  {
    id: "phi",
    name: "Φ-Series",
    symbol: "Φ",
    icon: "🔄",
    color: "#FF9500",
    description: "Continuous Improvement Engine — observes patterns, suggests better flows, optimizes outputs over time.",
    engines: ["ProjectIntelligence", "ORACLE", "VECTOR"],
    capabilities: ["Pattern observation", "Flow optimization", "Output improvement", "Quality elevation", "Adaptive refinement"],
  },
  {
    id: "uq",
    name: "UQ-Series",
    symbol: "UQ",
    icon: "❓",
    color: "#007AFF",
    description: "Universal Question Engine — thinks ahead for the user, fills gaps, prepares flows and packets automatically.",
    engines: ["guideEngine", "ConversationEngine", "PULSE"],
    capabilities: ["Predictive questions", "Gap filling", "Auto-preparation", "Guided flows", "User-centered intelligence"],
  },
  {
    id: "ice",
    name: "ICE-Series",
    symbol: "ICE",
    icon: "🧊",
    color: "#30B0C7",
    description: "Intelligent Context Engine — deep contextual awareness that shapes every output based on industry, user, and intent.",
    engines: ["InteractionEngine", "IntegrationEngine", "NEXUS"],
    capabilities: ["Context awareness", "Intent routing", "Industry adaptation", "User modeling", "Output shaping"],
  },
  {
    id: "ael",
    name: "AEL-Series",
    symbol: "AEL",
    icon: "📈",
    color: "#34C759",
    description: "Adaptive Expansion Layer — the output of every engine feeds back into the system, expanding capabilities with each use.",
    engines: ["UniversalConnectionEngine", "InfiniteExpansionEngine", "VECTOR"],
    capabilities: ["Adaptive growth", "Capability expansion", "Feedback loops", "Knowledge accumulation", "Self-extending reach"],
  },
  {
    id: "ucpx",
    name: "UCP-X",
    symbol: "X",
    icon: "⚡",
    color: "#BF5AF2",
    description: "Universal Command Platform — the master orchestration layer. One entry, infinite output. Activates all other engines and agents.",
    engines: ["ORACLE", "FORGE", "NEXUS", "SENTINEL", "PULSE", "VECTOR"],
    capabilities: ["Master orchestration", "Single-entry activation", "Cross-engine coordination", "Platform superpowers", "Infinite output"],
  },
  {
    id: "gi",
    name: "GI-Series",
    symbol: "GI",
    icon: "🎯",
    color: "#FF2D55",
    description: "Guided Interaction Engine — explains systems simply, asks one question at a time, builds things for users on request.",
    engines: ["guideEngine", "ConversationEngine", "InviteGeneratorEngine"],
    capabilities: ["Guided explanations", "Progressive onboarding", "One-click building", "Adaptive pacing", "User empowerment"],
  },
  {
    id: "se",
    name: "SE-Series",
    symbol: "SE",
    icon: "🚀",
    color: "#FF9500",
    description: "Submit Engine — you click submit, the system does the work. Auto-flows, one-click execution, multi-step automation.",
    engines: ["UniversalWorkflowEngine", "ExportEngine", "TemplateLibrary"],
    capabilities: ["One-click execution", "Auto-flow", "Multi-step automation", "Smart submission", "Background processing"],
  },
  {
    id: "de",
    name: "DE-Series",
    symbol: "DE",
    icon: "📄",
    color: "#636366",
    description: "Document Engine — creates everything in one file for any need. Structured text, layouts, bundles.",
    engines: ["TemplateLibrary", "ExportEngine", "BackendBlueprintEngine"],
    capabilities: ["Everything-in-one-file", "Document generation", "Layout design", "Bundle creation", "Export paths"],
  },
  {
    id: "ab",
    name: "AB-Series",
    symbol: "AB",
    icon: "🏗️",
    color: "#f59e0b",
    description: "Auto-Builder Series — activates when a user creates a project or selects an industry. Generates dashboards, templates, and workflows automatically.",
    engines: ["BackendBlueprintEngine", "UniversalWorkflowEngine", "ProjectIntelligence"],
    capabilities: ["Auto-generation", "Dashboard creation", "Template building", "Workflow scaffolding", "UI blocks"],
  },

  // ── Expansion Layer D1 — New Series ──────────────────────────────────────
  {
    id: "alpha",
    name: "α-Series",
    symbol: "α",
    icon: "🔬",
    color: "#007AFF",
    description: "Foundational Intelligence Series — synthesizes deep research, market data, and critical analysis into the bedrock of any initiative.",
    engines: ["ResearchEngine", "MarketResearchEngine", "CritiqueEngine"],
    capabilities: ["Deep research synthesis", "Market intelligence", "Critical review", "Evidence-based strategy", "Foundational analysis"],
  },
  {
    id: "sigma",
    name: "Σ-Series",
    symbol: "Σ",
    icon: "🏛️",
    color: "#5856D6",
    description: "System Architecture Series — designs complete technical systems from high-level blueprints down to data schemas and infrastructure.",
    engines: ["ARCHITECT", "BackendBlueprintEngine", "DataModelEngine"],
    capabilities: ["System design", "Architecture blueprints", "Data modeling", "Infrastructure planning", "Technical excellence"],
  },
  {
    id: "kappa",
    name: "κ-Series",
    symbol: "κ",
    icon: "📚",
    color: "#FF9500",
    description: "Knowledge & Learning Series — builds complete educational experiences, mentorship frameworks, and competency development systems.",
    engines: ["MENTOR", "LearningEngine", "guideEngine"],
    capabilities: ["Learning path design", "Mentorship frameworks", "Curriculum development", "Skill mastery", "Knowledge transfer"],
  },
  {
    id: "lambda",
    name: "λ-Series",
    symbol: "λ",
    icon: "📢",
    color: "#FF2D55",
    description: "Communication Layer Series — aligns messaging, personas, and emotional engagement across every channel and audience.",
    engines: ["CommunicationEngine", "PersonaEngine", "PULSE"],
    capabilities: ["Unified messaging", "Persona alignment", "Emotional resonance", "Channel strategy", "Audience intelligence"],
  },
  {
    id: "delta",
    name: "Δ-Series",
    symbol: "Δ",
    icon: "🗄️",
    color: "#30B0C7",
    description: "Data Intelligence Series — transforms raw data structures, patterns, and insights into strategic decision architectures.",
    engines: ["DataModelEngine", "VECTOR", "MarketResearchEngine"],
    capabilities: ["Data architecture", "Pattern intelligence", "Market signals", "Decision frameworks", "Strategic data modeling"],
  },
  // ── ImaginationLab Series ─────────────────────────────────────────────
  {
    id: "imag",
    name: "IMAG-Series",
    symbol: "IM",
    icon: "✨",
    color: "#8b5cf6",
    description: "Narrative Trifecta — Story, Character, and World united into a single creative universe. Run all three in sequence to build a complete fictional world ready for any medium.",
    engines: ["StoryEngine", "CharacterEngine", "WorldbuildingEngine"],
    capabilities: ["Narrative design", "Character creation", "World building", "Story structure", "Creative universe building"],
  },
  {
    id: "quest",
    name: "QUEST-Series",
    symbol: "QS",
    icon: "⚔️",
    color: "#f59e0b",
    description: "Adventure Trifecta — Creature, Superpower, and Adventure layered to create rich, playable action-adventure scenarios for games, stories, and tabletop play.",
    engines: ["CreatureEngine", "SuperpowerEngine", "AdventureEngine"],
    capabilities: ["Creature design", "Superpower systems", "Adventure creation", "Action scenario building", "Tabletop design"],
  },
  {
    id: "fiction-tech",
    name: "FICTION-TECH-Series",
    symbol: "FT",
    icon: "🚀",
    color: "#22d3ee",
    description: "Technology Fiction Trifecta — Game, Future Tech, and Blueprint Fiction combined to build a richly detailed fictional sci-fi or speculative world.",
    engines: ["GameIdeaEngine", "FutureTechFictionEngine", "BlueprintFictionEngine"],
    capabilities: ["Game design", "Fictional technology", "Artifact creation", "Sci-fi worldbuilding", "Speculative fiction"],
  },
  {
    id: "dreamscape",
    name: "DREAMSCAPE-Series",
    symbol: "DS",
    icon: "🌅",
    color: "#a78bfa",
    description: "Atmosphere Trifecta — Dreamscape, World, and Character united into one immersive sensory universe. Mood, environment, and inhabitants in a single creative run.",
    engines: ["DreamscapeEngine", "WorldbuildingEngine", "CharacterEngine"],
    capabilities: ["Mood design", "Atmospheric worldbuilding", "Sensory environment creation", "Character immersion", "Emotional landscape design"],
  },
  {
    id: "arcane",
    name: "ARCANE-Series",
    symbol: "AR",
    icon: "🪄",
    color: "#7c3aed",
    description: "Magic Trifecta — Magic System, Character, and World combined into one complete arcane universe. Rules of magic, the people shaped by it, and the world it has formed.",
    engines: ["MagicSystemEngine", "CharacterEngine", "WorldbuildingEngine"],
    capabilities: ["Magic system design", "Arcane character creation", "Magic-shaped worldbuilding", "Rules & consequences", "Lore integration"],
  },
  // ── LoreForge Series ──────────────────────────────────────────────────
  {
    id: "mythos",
    name: "MYTHOS-Series",
    symbol: "MT",
    icon: "⚡",
    color: "#d97706",
    description: "Divine Trifecta — Mythology, Religion, and Cosmology combined into a complete sacred universe. Gods, faith, and the structure of all existence.",
    engines: ["MythologyEngine", "ReligionEngine", "CosmologyEngine"],
    capabilities: ["Pantheon design", "Religion creation", "Cosmological structure", "Sacred narrative building", "Divine world design"],
  },
  {
    id: "lore",
    name: "LORE-Series",
    symbol: "LR",
    icon: "📜",
    color: "#78350f",
    description: "History Trifecta — Ancient History, Legend, and Relic layered into a complete deep past. Lost civilizations, mythic heroes, and the objects they left behind.",
    engines: ["AncientHistoryEngine", "LegendEngine", "RelicEngine"],
    capabilities: ["Civilization design", "Legend creation", "Relic design", "Deep history building", "Lost world creation"],
  },
  {
    id: "faction",
    name: "FACTION-Series",
    symbol: "FC",
    icon: "⚖️",
    color: "#1d4ed8",
    description: "Power Trifecta — Faction, LoreKeeper, and Prophecy united into a web of power and knowledge. Who rules, who knows, and what was foretold.",
    engines: ["FactionEngine", "LoreKeeperEngine", "ProphecyEngine"],
    capabilities: ["Faction design", "Knowledge institution creation", "Prophecy writing", "Power web mapping", "Political lore building"],
  },
  {
    id: "curse",
    name: "CURSE-Series",
    symbol: "CS",
    icon: "💀",
    color: "#4c1d95",
    description: "Fate Trifecta — Curse, Prophet, and Era woven together. What was doomed, who saw it coming, and the age in which it all unraveled.",
    engines: ["CurseEngine", "ProphetEngine", "EraEngine"],
    capabilities: ["Curse design", "Prophet creation", "Era design", "Fate mechanics", "Doom narrative building"],
  },
  {
    id: "language",
    name: "LANGUAGE-Series",
    symbol: "LG",
    icon: "🗣️",
    color: "#16a34a",
    description: "Culture Trifecta — Language, Mythology, and Faction united into a complete cultural identity. How a people speak, what they believe, and who they follow.",
    engines: ["LanguageEngine", "MythologyEngine", "FactionEngine"],
    capabilities: ["Language design", "Myth creation", "Faction building", "Cultural identity design", "Civilizational voice creation"],
  },
  {
    id: "opportunity",
    name: "OPP-Series",
    symbol: "OPP",
    icon: "🎯",
    color: "#f59e0b",
    description: "Opportunity Intelligence Series — scans markets, validates ideas, and builds execution pathways for every discovered opportunity.",
    engines: ["OpportunityEngine", "MarketResearchEngine", "UniversalStrategyEngine"],
    capabilities: ["Opportunity discovery", "Market validation", "Revenue modeling", "Strategic prioritization", "Execution mapping"],
  },

  // ── Maximum-Capacity Series (v3 Expansion) ─────────────────────────────────
  {
    id: "gamma",
    name: "Γ-Series",
    symbol: "Γ",
    icon: "📈",
    color: "#34C759",
    description: "Growth Intelligence Series — combines Growth, Monetization, and Retention engines into a complete revenue and growth flywheel.",
    engines: ["GrowthEngine", "MonetizationEngine", "RetentionEngine"],
    capabilities: ["User acquisition", "Revenue architecture", "Churn reduction", "Growth experiments", "Retention loops", "Revenue forecasting"],
  },
  {
    id: "theta",
    name: "Θ-Series",
    symbol: "Θ",
    icon: "🔐",
    color: "#FF3B30",
    description: "Security & Infrastructure Series — runs Security, DevOps, and Scaling engines to produce a hardened, scalable, production-ready system architecture.",
    engines: ["SecurityEngine", "DevOpsEngine", "ScalingEngine"],
    capabilities: ["Threat modeling", "CI/CD pipelines", "Scaling architecture", "Security hardening", "SLO design", "Infrastructure-as-code"],
  },
  {
    id: "eta",
    name: "Η-Series",
    symbol: "Η",
    icon: "🚀",
    color: "#FF9500",
    description: "Product Launch Stack — runs Launch, Content Strategy, and Growth engines to produce a complete go-to-market and post-launch growth system.",
    engines: ["LaunchEngine", "ContentStrategyEngine", "GrowthEngine"],
    capabilities: ["Launch positioning", "Content strategy", "Growth systems", "Press kits", "Email sequences", "90-day plans"],
  },
  {
    id: "zeta",
    name: "Ζ-Series",
    symbol: "Ζ",
    icon: "🏗️",
    color: "#5856D6",
    description: "Full-Stack Build Series — runs UI/UX, Backend Blueprint, and DevOps engines to produce a complete technical product specification from design to deployment.",
    engines: ["UIUXEngine", "BackendBlueprintEngine", "DevOpsEngine"],
    capabilities: ["UI/UX design systems", "Backend architecture", "CI/CD pipelines", "Component specs", "API design", "Deployment strategy"],
  },
  {
    id: "iota",
    name: "Ι-Series",
    symbol: "Ι",
    icon: "🗄️",
    color: "#007AFF",
    description: "Analytics Intelligence Series — runs Analytics, VECTOR, and Data Model engines to build a complete measurement, pattern recognition, and data architecture system.",
    engines: ["AnalyticsEngine", "VECTOR", "DataModelEngine"],
    capabilities: ["Measurement frameworks", "Pattern recognition", "Data architecture", "Dashboard specs", "A/B testing", "Data governance"],
  },
  {
    id: "nu",
    name: "Ν-Series",
    symbol: "Ν",
    icon: "🛡️",
    color: "#FF2D55",
    description: "Compliance Fortress Series — runs Compliance Audit, Regulatory, and SENTINEL engines to produce a complete multi-framework compliance and risk system.",
    engines: ["ComplianceAuditEngine", "RegulatoryEngine", "SENTINEL"],
    capabilities: ["Multi-framework audits", "Gap reports", "Risk analysis", "Remediation roadmaps", "Audit evidence", "Compliance calendars"],
  },
  {
    id: "mu",
    name: "Μ-Series",
    symbol: "Μ",
    icon: "📱",
    color: "#BF5AF2",
    description: "Mobile-First Platform Series — runs Mobile, UI/UX, and Accessibility engines to produce a complete, accessible, App Store-ready mobile product specification.",
    engines: ["MobileEngine", "UIUXEngine", "AccessibilityEngine"],
    capabilities: ["App architecture", "Design systems", "WCAG compliance", "App Store readiness", "Offline strategy", "Push notifications"],
  },
  {
    id: "xi",
    name: "Ξ-Series",
    symbol: "Ξ",
    icon: "♾️",
    color: "#6366f1",
    description: "Maximum Capacity Build — the highest-order series. Runs Infinite Expansion, ORACLE, FORGE, NEXUS, and Deliverable engines at full capacity to produce the most complete output possible.",
    engines: ["InfiniteExpansionEngine", "ORACLE", "FORGE", "NEXUS", "DeliverableEngine"],
    capabilities: ["Infinite expansion", "Predictive intelligence", "Content packaging", "Cross-domain integration", "Full deliverable packages", "Maximum output"],
  },
  {
    id: "pi",
    name: "Π-Series",
    symbol: "Π",
    icon: "⚙️",
    color: "#34C759",
    description: "Production Readiness Series — runs Production, DevOps, and Performance engines to transform any system into a hardened, monitored, production-grade deployment.",
    engines: ["ProductionEngine", "DevOpsEngine", "PerformanceEngine"],
    capabilities: ["Production checklists", "CI/CD pipelines", "Performance optimization", "SLO frameworks", "Runbooks", "Load testing"],
  },
  {
    id: "rho",
    name: "Ρ-Series",
    symbol: "Ρ",
    icon: "💰",
    color: "#34C759",
    description: "Revenue Architecture Series — runs Monetization, Pricing, and Growth engines to design a complete end-to-end revenue system with forecasting and growth loops.",
    engines: ["MonetizationEngine", "PricingEngine", "GrowthEngine"],
    capabilities: ["Revenue models", "Pricing tiers", "Growth loops", "12-month forecasts", "Upsell logic", "Referral programs"],
  },
  {
    id: "tau",
    name: "Τ-Series",
    symbol: "Τ",
    icon: "✍️",
    color: "#BF5AF2",
    description: "Content Domination Series — runs Content Strategy, SEO, and BrainGen engines to build a complete content engine with editorial calendar, SEO strategy, and instant content generation.",
    engines: ["ContentStrategyEngine", "SEOEngine", "BrainGen"],
    capabilities: ["Editorial calendars", "SEO strategy", "Content generation", "Distribution playbooks", "Keyword research", "Content pillar design"],
  },
  {
    id: "upsilon",
    name: "Υ-Series",
    symbol: "Υ",
    icon: "🎨",
    color: "#FF2D55",
    description: "User Experience Stack — runs UI/UX, Accessibility, and PULSE engines to design a beautiful, emotionally engaging, fully accessible user experience.",
    engines: ["UIUXEngine", "AccessibilityEngine", "PULSE"],
    capabilities: ["Design systems", "WCAG compliance", "Emotional engagement", "Component specs", "Accessibility audits", "User experience optimization"],
  },
  {
    id: "psi",
    name: "Ψ-Series",
    symbol: "Ψ",
    icon: "🤝",
    color: "#f59e0b",
    description: "Partnership Intelligence Series — runs Partnership, Opportunity, and Strategy engines to identify, target, and close the highest-value strategic partnerships.",
    engines: ["PartnershipEngine", "OpportunityEngine", "UniversalStrategyEngine"],
    capabilities: ["Partnership landscape", "Opportunity scoring", "Strategic roadmaps", "Outreach sequences", "Value propositions", "Co-marketing plans"],
  },
  {
    id: "chi",
    name: "Χ-Series",
    symbol: "Χ",
    icon: "🔌",
    color: "#007AFF",
    description: "API Architecture Series — runs API Design, Integration, and Backend Blueprint engines to produce a complete, production-grade API and integration architecture.",
    engines: ["APIDesignEngine", "IntegrationEngine", "BackendBlueprintEngine"],
    capabilities: ["OpenAPI specs", "Integration architecture", "Backend blueprints", "Rate limiting", "Webhook design", "API versioning"],
  },
];

// ─── Engine Run ───────────────────────────────────────────────────────────────

export async function runEngine(opts: CapabilityRunOptions): Promise<void> {
  const { engineId, engineName, topic, context, mode, agentId, onChunk, onDone, onError } = opts;

  try {
    const resp = await fetch("/api/openai/engine-run", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engineId, engineName: engineName ?? engineId, topic, context, mode, agentId }),
    });

    if (!resp.ok || !resp.body) {
      onError?.(`Engine returned ${resp.status}`);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n");
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.content) onChunk(data.content);
          if (data.done) { onDone?.(); return; }
        } catch { /* skip malformed */ }
      }
    }
    onDone?.();
  } catch (err) {
    onError?.((err as Error).message);
  }
}

// ─── Meta-Agent Run ───────────────────────────────────────────────────────────

export async function runMetaAgent(opts: MetaAgentRunOptions): Promise<void> {
  const { agentId, task, context, domain, onChunk, onDone, onError } = opts;

  try {
    const resp = await fetch("/api/openai/meta-agent", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, task, context, domain }),
    });

    if (!resp.ok || !resp.body) {
      onError?.(`Agent returned ${resp.status}`);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n");
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.content) onChunk(data.content);
          if (data.done) { onDone?.(); return; }
        } catch { /* skip malformed */ }
      }
    }
    onDone?.();
  } catch (err) {
    onError?.((err as Error).message);
  }
}

// ─── Save Output to Documents ─────────────────────────────────────────────────

export async function saveEngineOutput(opts: {
  engineId: string;
  engineName: string;
  title: string;
  content: string;
  projectId?: string;
}): Promise<{ id: string } | null> {
  try {
    const resp = await fetch("/api/documents", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: opts.title,
        body: opts.content,
        docType: opts.engineId,
        tags: [opts.engineId, opts.engineName, "ai-generated"],
        projectId: opts.projectId ?? null,
        isPinned: false,
        isTemplate: false,
      }),
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

// ─── Platform Stats ───────────────────────────────────────────────────────────

export interface PlatformStats {
  projects: number;
  documents: number;
  people: number;
  notifications: number;
  engines: number;
  series: number;
  agents: number;
  totalRuns: number;
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const [projects, documents, people, notifications] = await Promise.allSettled([
    fetch("/api/projects", { credentials: "include" }).then(r => r.json()),
    fetch("/api/documents", { credentials: "include" }).then(r => r.json()),
    fetch("/api/people",    { credentials: "include" }).then(r => r.json()),
    fetch("/api/notifications", { credentials: "include" }).then(r => r.json()),
  ]);

  return {
    projects:      Array.isArray((projects as PromiseFulfilledResult<unknown>).value) ? ((projects as PromiseFulfilledResult<unknown[]>).value as unknown[]).length : 0,
    documents:     Array.isArray((documents as PromiseFulfilledResult<unknown>).value) ? ((documents as PromiseFulfilledResult<unknown[]>).value as unknown[]).length : 0,
    people:        Array.isArray((people as PromiseFulfilledResult<unknown>).value) ? ((people as PromiseFulfilledResult<unknown[]>).value as unknown[]).length : 0,
    notifications: Array.isArray((notifications as PromiseFulfilledResult<unknown>).value) ? ((notifications as PromiseFulfilledResult<unknown[]>).value as unknown[]).length : 0,
    engines:       ALL_ENGINES.length,
    series:        ALL_SERIES.length,
    agents:        ALL_ENGINES.filter(e => e.category === "meta-agent").length,
    totalRuns:     0,
  };
}

// ─── Engine by Category ───────────────────────────────────────────────────────

export function getEnginesByCategory(): Record<EngineCategory, EngineDefinition[]> {
  const result: Partial<Record<EngineCategory, EngineDefinition[]>> = {};
  for (const engine of ALL_ENGINES) {
    if (!result[engine.category]) result[engine.category] = [];
    result[engine.category]!.push(engine);
  }
  return result as Record<EngineCategory, EngineDefinition[]>;
}

export function getEngine(id: string): EngineDefinition | undefined {
  return ALL_ENGINES.find(e => e.id === id);
}

export function getSeries(id: string): SeriesDefinition | undefined {
  return ALL_SERIES.find(s => s.id === id);
}
