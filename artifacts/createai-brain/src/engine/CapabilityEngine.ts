// ═══════════════════════════════════════════════════════════════════════════
// CAPABILITY ENGINE — Central Orchestrator for CreateAI Brain
// Registers 39 engines (29 regular + 10 meta-agents) and 15 series.
// Connects to real AI API for generation.
// Auto-saves outputs to /api/documents.
// ═══════════════════════════════════════════════════════════════════════════

export type EngineCategory =
  | "universal" | "meta-agent" | "intelligence" | "creative" | "workflow"
  | "integration" | "data" | "platform" | "series" | "imagination"
  | "security" | "finance" | "healthcare" | "education" | "operations"
  | "sustainability" | "hr" | "legal" | "product" | "research";

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
  capabilities?: string[];
  estimatedMinutes?: number;
  status?: string;
}

export interface CapabilityRunOptions {
  engineId: string;
  engineName?: string;
  topic: string;
  context?: string;
  mode?: string;
  agentId?: string;
  signal?: AbortSignal;
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
  {
    id: "LeadCycleEngine",
    name: "Lead Cycle Engine",
    category: "intelligence",
    icon: "🔄",
    color: "#6366f1",
    description: "Automatic 5-stage lead generation pipeline — signal analysis, lead identification, opportunity creation, outreach drafting, and proposal generation.",
    capabilities: ["Signal analysis", "Lead qualification", "Fit scoring", "Outreach generation", "Proposal drafting", "Opportunity creation"],
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


  // ── Security Suite ─────────────────────────────────────────────────────────
  { id:"ZeroTrustEngine", name:"Zero Trust Engine", category:"security", icon:"🔐", color:"#EF4444", description:"Designs complete zero-trust architectures — network segmentation, identity-first access, and maturity models.", capabilities:["Zero-trust architecture","Micro-segmentation","Identity-first access","Maturity models"], status:"active", runCount:0 },
  { id:"ThreatModelEngine", name:"Threat Model Engine", category:"security", icon:"⚠️", color:"#DC2626", description:"STRIDE threat modeling, attack surface mapping, and risk prioritization.", capabilities:["STRIDE analysis","Attack surface mapping","Risk prioritization","Threat scenarios"], status:"active", runCount:0 },
  { id:"SOCEngine", name:"SOC Ops Engine", category:"security", icon:"🛡️", color:"#B91C1C", description:"Security operations center playbooks — alert triage, incident tracking, analyst workflows.", capabilities:["Alert triage","Incident tracking","SOC playbooks","Analyst workflows"], status:"active", runCount:0 },
  { id:"PenTestEngine", name:"Pen Test Engine", category:"security", icon:"🕵️", color:"#991B1B", description:"Penetration testing plans — scope definition, methodology, and remediation tracking.", capabilities:["Scope definition","Test methodology","CVE correlation","Remediation tracking"], status:"active", runCount:0 },
  { id:"IncidentResponseEngine", name:"Incident Response Engine", category:"security", icon:"🚨", color:"#C2410C", description:"Incident response playbooks, escalation trees, and post-mortem templates.", capabilities:["IR playbooks","Escalation trees","Post-mortems","Tabletop exercises"], status:"active", runCount:0 },
  { id:"IAMEngine", name:"IAM Design Engine", category:"security", icon:"🔑", color:"#9A3412", description:"Identity and access management — RBAC, ABAC, OAuth flows, and SSO architecture.", capabilities:["RBAC design","OAuth flows","SSO architecture","Least privilege"], status:"active", runCount:0 },
  { id:"EncryptionEngine", name:"Encryption Strategy Engine", category:"security", icon:"🔒", color:"#92400E", description:"Encryption strategy — at-rest, in-transit, key management, and HSM design.", capabilities:["At-rest encryption","In-transit TLS","Key management","HSM design"], status:"active", runCount:0 },
  { id:"VulnerabilityEngine", name:"Vulnerability Management Engine", category:"security", icon:"🦠", color:"#78350F", description:"Vulnerability programs — CVE triage, patch cadence, CVSS scoring, and risk acceptance.", capabilities:["CVE triage","CVSS scoring","Patch cadence","Risk acceptance"], status:"active", runCount:0 },
  { id:"SecurityAuditEngine", name:"Security Audit Engine", category:"security", icon:"📋", color:"#EF4444", description:"Full security audit frameworks — NIST, ISO 27001, CIS Controls, and gap analysis.", capabilities:["NIST mapping","ISO 27001","CIS Controls","Gap analysis"], status:"active", runCount:0 },
  { id:"CloudSecEngine", name:"Cloud Security Engine", category:"security", icon:"☁️", color:"#DC2626", description:"Cloud security architecture — AWS/Azure/GCP guardrails, posture management, shared responsibility.", capabilities:["Cloud guardrails","Posture management","CSPM design","Shared responsibility"], status:"active", runCount:0 },
  { id:"NetworkSecEngine", name:"Network Security Engine", category:"security", icon:"🌐", color:"#B91C1C", description:"Network security design — firewall rules, IDS/IPS, segmentation, and DMZ architecture.", capabilities:["Firewall rules","IDS/IPS design","Segmentation","DMZ architecture"], status:"active", runCount:0 },
  { id:"AppSecEngine", name:"Application Security Engine", category:"security", icon:"💻", color:"#991B1B", description:"Application security — OWASP Top 10, secure code review, SAST/DAST integration.", capabilities:["OWASP Top 10","SAST/DAST","Secure code review","Dependency scanning"], status:"active", runCount:0 },
  { id:"EndpointSecEngine", name:"Endpoint Security Engine", category:"security", icon:"📱", color:"#C2410C", description:"Endpoint protection — EDR, MDM, device posture, and zero-trust endpoint.", capabilities:["EDR design","MDM policy","Device posture","Endpoint hardening"], status:"active", runCount:0 },
  { id:"PrivacyDesignEngine", name:"Privacy by Design Engine", category:"security", icon:"🔏", color:"#9A3412", description:"Privacy-by-design — data minimization, consent flows, PIA templates, GDPR/CCPA.", capabilities:["PIA templates","Consent flows","Data minimization","GDPR mapping"], status:"active", runCount:0 },
  { id:"RedTeamEngine", name:"Red Team Engine", category:"security", icon:"🎯", color:"#92400E", description:"Red team simulation planning — adversary emulation, kill chain mapping, purple team.", capabilities:["Adversary emulation","Kill chain mapping","Purple team","MITRE ATT&CK"], status:"active", runCount:0 },
  { id:"SecureSDLCEngine", name:"Secure SDLC Engine", category:"security", icon:"⚙️", color:"#78350F", description:"Security in the dev lifecycle — threat modeling gates, dependency scanning, security champions.", capabilities:["Security gates","Champion programs","Dev training","Pipeline scanning"], status:"active", runCount:0 },
  { id:"CyberResilienceEngine", name:"Cyber Resilience Engine", category:"security", icon:"💪", color:"#EF4444", description:"Cyber resilience — BCP for cyber events, RTO objectives, and tabletop drills.", capabilities:["Cyber BCP","RTO/RPO design","Crisis comms","Resilience scoring"], status:"active", runCount:0 },
  { id:"SecurityPostureEngine", name:"Security Posture Engine", category:"security", icon:"📊", color:"#DC2626", description:"Security posture assessment — scoring models, board reporting, and continuous monitoring.", capabilities:["Posture scoring","Board reporting","Continuous monitoring","Benchmark analysis"], status:"active", runCount:0 },
  // ── Finance Suite ──────────────────────────────────────────────────────────
  { id:"FinancialModelEngine", name:"Financial Model Engine", category:"finance", icon:"📈", color:"#16A34A", description:"DCF models, 3-statement financials, scenario analysis, and sensitivity tables.", capabilities:["DCF modeling","3-statement model","Scenario analysis","Sensitivity tables"], status:"active", runCount:0 },
  { id:"RevenueRecEngine", name:"Revenue Recognition Engine", category:"finance", icon:"💰", color:"#15803D", description:"ASC 606/IFRS 15 revenue recognition — contract analysis and recognition schedules.", capabilities:["ASC 606 analysis","IFRS 15","Performance obligations","Recognition schedules"], status:"active", runCount:0 },
  { id:"CashFlowEngine", name:"Cash Flow Engine", category:"finance", icon:"💵", color:"#166534", description:"13-week and annual cash flow models, burn rate, runway, and liquidity management.", capabilities:["13-week model","Burn rate","Runway analysis","Liquidity forecasting"], status:"active", runCount:0 },
  { id:"InvestmentThesisEngine", name:"Investment Thesis Engine", category:"finance", icon:"📉", color:"#14532D", description:"Investment thesis — TAM analysis, competitive moats, return modeling.", capabilities:["TAM/SAM/SOM","Moat analysis","Return modeling","Exit scenarios"], status:"active", runCount:0 },
  { id:"FundraisingEngine", name:"Fundraising Engine", category:"finance", icon:"🚀", color:"#16A34A", description:"Fundraising strategy — round sizing, investor targeting, data room, and pitch narrative.", capabilities:["Round sizing","Investor targeting","Data room","Pitch narrative"], status:"active", runCount:0 },
  { id:"TaxStrategyEngine", name:"Tax Strategy Engine", category:"finance", icon:"🧾", color:"#15803D", description:"Tax optimization — entity structure, R&D credits, deferred tax, and international tax.", capabilities:["Entity structuring","R&D credits","Transfer pricing","Tax optimization"], status:"active", runCount:0 },
  { id:"EquityStructureEngine", name:"Equity Structure Engine", category:"finance", icon:"📋", color:"#166534", description:"Cap table management, option pool modeling, dilution analysis, and equity comp.", capabilities:["Cap table design","Option modeling","Dilution analysis","ESOP design"], status:"active", runCount:0 },
  { id:"UnitEconomicsEngine", name:"Unit Economics Engine", category:"finance", icon:"⚖️", color:"#14532D", description:"LTV/CAC analysis, payback period modeling, cohort analysis, and contribution margins.", capabilities:["LTV/CAC ratio","Payback periods","Cohort analysis","Contribution margins"], status:"active", runCount:0 },
  { id:"MAEngine", name:"M&A Analysis Engine", category:"finance", icon:"🤝", color:"#16A34A", description:"M&A analysis — synergy modeling, integration planning, and purchase price allocation.", capabilities:["Synergy modeling","PPA analysis","Integration planning","Accretion/dilution"], status:"active", runCount:0 },
  { id:"BudgetingEngine", name:"Budgeting Engine", category:"finance", icon:"💼", color:"#15803D", description:"Annual budget planning — department budgets, variance analysis, and rolling forecasts.", capabilities:["Department budgets","Variance analysis","Rolling forecasts","Budget governance"], status:"active", runCount:0 },
  { id:"IPOReadinessEngine", name:"IPO Readiness Engine", category:"finance", icon:"🏦", color:"#166534", description:"IPO readiness — Reg S-K compliance, roadshow prep, lock-up structures.", capabilities:["SEC compliance","Roadshow prep","Lock-up structures","Underwriter selection"], status:"active", runCount:0 },
  { id:"GrantWritingEngine", name:"Grant Writing Engine", category:"finance", icon:"📝", color:"#14532D", description:"Grant proposal writing — needs statements, budget narratives, and evaluation frameworks.", capabilities:["Needs statements","Budget narratives","Evaluation frameworks","Compliance checklists"], status:"active", runCount:0 },
  { id:"CryptoFinanceEngine", name:"Crypto Finance Engine", category:"finance", icon:"₿", color:"#16A34A", description:"Token economic design — supply schedules, incentive mechanisms, and governance models.", capabilities:["Tokenomics design","Vesting curves","Governance models","Treasury design"], status:"active", runCount:0 },
  { id:"DebtStructureEngine", name:"Debt Structure Engine", category:"finance", icon:"🏛️", color:"#15803D", description:"Debt facility design — term sheets, covenant modeling, and amortization schedules.", capabilities:["Term sheet design","Covenant modeling","Amortization","Lender negotiations"], status:"active", runCount:0 },
  { id:"FPAEngine", name:"FP&A Engine", category:"finance", icon:"📊", color:"#166534", description:"Financial planning & analysis — KPI dashboards, variance reports, and board packages.", capabilities:["KPI dashboards","Variance reports","Board packages","Rolling forecasts"], status:"active", runCount:0 },
  { id:"TreasuryEngine", name:"Treasury Management Engine", category:"finance", icon:"💎", color:"#14532D", description:"Treasury management — cash pooling, FX hedging, liquidity forecasting.", capabilities:["Cash pooling","FX hedging","Liquidity forecasting","Banking relationships"], status:"active", runCount:0 },
  { id:"InsuranceStrategyEngine", name:"Insurance Strategy Engine", category:"finance", icon:"🛡️", color:"#16A34A", description:"Insurance architecture — coverage analysis, claims management, and captive programs.", capabilities:["Coverage analysis","Claims management","Captive programs","Broker RFPs"], status:"active", runCount:0 },
  // ── Healthcare Suite ───────────────────────────────────────────────────────
  { id:"EHRIntegrationEngine", name:"EHR Integration Engine", category:"healthcare", icon:"🏥", color:"#0EA5E9", description:"EHR/EMR integration — HL7, FHIR, and workflow bridging for clinical systems.", capabilities:["HL7 design","FHIR R4","Workflow bridging","Clinical integration"], status:"active", runCount:0 },
  { id:"ClinicalWorkflowEngine", name:"Clinical Workflow Engine", category:"healthcare", icon:"👨‍⚕️", color:"#0284C7", description:"Clinical workflow mapping — patient intake, care pathways, handoff protocols.", capabilities:["Patient intake","Care pathways","Handoff protocols","Discharge flows"], status:"active", runCount:0 },
  { id:"PatientEngagementEngine", name:"Patient Engagement Engine", category:"healthcare", icon:"❤️", color:"#0369A1", description:"Patient engagement — portal design, reminders, health literacy tools.", capabilities:["Portal design","Appointment reminders","Health literacy","Satisfaction loops"], status:"active", runCount:0 },
  { id:"HealthcareComplianceEngine", name:"Healthcare Compliance Engine", category:"healthcare", icon:"⚖️", color:"#075985", description:"HIPAA, HITECH, CMS compliance frameworks and gap analysis.", capabilities:["HIPAA compliance","HITECH","CMS rules","Gap analysis"], status:"active", runCount:0 },
  { id:"TelehealthEngine", name:"Telehealth Engine", category:"healthcare", icon:"📱", color:"#0C4A6E", description:"Telehealth platform design — video infrastructure, state licensing, reimbursement.", capabilities:["Video infrastructure","State licensing","Reimbursement coding","Patient consent"], status:"active", runCount:0 },
  { id:"ClinicalTrialEngine", name:"Clinical Trial Engine", category:"healthcare", icon:"🔬", color:"#0EA5E9", description:"Clinical trial protocol — IRB submissions, site management, data collection.", capabilities:["IRB submissions","Protocol design","Site management","FDA submissions"], status:"active", runCount:0 },
  { id:"MedicalCodingEngine", name:"Medical Coding Engine", category:"healthcare", icon:"🗂️", color:"#0284C7", description:"ICD-10, CPT, HCPCS mapping — coding audits, denial management.", capabilities:["ICD-10 mapping","CPT coding","Denial management","Coder productivity"], status:"active", runCount:0 },
  { id:"PopulationHealthEngine", name:"Population Health Engine", category:"healthcare", icon:"🌍", color:"#0369A1", description:"Population health — outcomes dashboards, readmission prediction, clinical KPIs.", capabilities:["Outcomes dashboards","Risk stratification","Readmission prediction","Clinical KPIs"], status:"active", runCount:0 },
  { id:"CareCoordinationEngine", name:"Care Coordination Engine", category:"healthcare", icon:"🔗", color:"#075985", description:"Care coordination — transitions of care, case management, care team communication.", capabilities:["Transition planning","Case management","Care team comms","Care gap alerts"], status:"active", runCount:0 },
  { id:"FHIREngine", name:"FHIR Architecture Engine", category:"healthcare", icon:"🔌", color:"#0C4A6E", description:"HL7 FHIR API design — resource modeling, SMART on FHIR, interoperability.", capabilities:["FHIR R4 resources","SMART on FHIR","API design","Interoperability"], status:"active", runCount:0 },
  { id:"ClinicalDecisionEngine", name:"Clinical Decision Engine", category:"healthcare", icon:"🩺", color:"#0EA5E9", description:"Clinical decision support — alerting logic, order sets, protocol engines.", capabilities:["Alert logic","Order sets","Protocol engines","CDS Hooks"], status:"active", runCount:0 },
  { id:"HealthDataEngine", name:"Health Data Governance Engine", category:"healthcare", icon:"🗄️", color:"#0284C7", description:"Health data governance — de-identification, data sharing agreements, consent.", capabilities:["De-identification","Data sharing","Consent management","PHI governance"], status:"active", runCount:0 },
  { id:"MedicalDeviceEngine", name:"Medical Device Engine", category:"healthcare", icon:"⚕️", color:"#0369A1", description:"Medical device compliance — 510(k) pathway, FDA QSR, UDI design.", capabilities:["510(k) pathway","FDA QSR","UDI design","Post-market surveillance"], status:"active", runCount:0 },
  { id:"MentalHealthEngine", name:"Mental Health Platform Engine", category:"healthcare", icon:"🧠", color:"#075985", description:"Mental health platform — assessment tools, care pathways, crisis protocols.", capabilities:["Assessment tools","Care pathways","Crisis protocols","Payer contracting"], status:"active", runCount:0 },
  { id:"HealthAnalyticsEngine", name:"Health Analytics Engine", category:"healthcare", icon:"📊", color:"#0C4A6E", description:"Healthcare analytics — data warehouse, BI dashboards, predictive models.", capabilities:["Data warehouse","BI dashboards","Predictive models","Quality metrics"], status:"active", runCount:0 },
  { id:"HealthBillingEngine", name:"Health Billing Engine", category:"healthcare", icon:"💳", color:"#0EA5E9", description:"Revenue cycle management — claim submission, ERA/EOB processing, denial workflows.", capabilities:["Claim submission","ERA/EOB","Denial management","RCM optimization"], status:"active", runCount:0 },
  { id:"HomeHealthEngine", name:"Home Health Engine", category:"healthcare", icon:"🏠", color:"#0284C7", description:"Home health agency systems — scheduling, EVV compliance, HHA management.", capabilities:["EVV compliance","Scheduling","HHA management","Billing workflows"], status:"active", runCount:0 },
  // ── Education Suite ────────────────────────────────────────────────────────
  { id:"CurriculumDesignEngine", name:"Curriculum Design Engine", category:"education", icon:"📚", color:"#7C3AED", description:"Curriculum framework design — learning objectives, scope & sequence, standards alignment.", capabilities:["Learning objectives","Scope & sequence","Standards alignment","Pacing guides"], status:"active", runCount:0 },
  { id:"LearningPathEngine", name:"Learning Path Engine", category:"education", icon:"🗺️", color:"#6D28D9", description:"Personalized learning path design — competency mapping, prerequisite trees, mastery.", capabilities:["Competency mapping","Prerequisite trees","Mastery-based","Personalization"], status:"active", runCount:0 },
  { id:"AssessmentDesignEngine", name:"Assessment Design Engine", category:"education", icon:"📝", color:"#5B21B6", description:"Assessment design — formative tools, rubric generators, and adaptive question banks.", capabilities:["Rubric design","Question banks","Adaptive testing","Formative assessment"], status:"active", runCount:0 },
  { id:"LMSArchEngine", name:"LMS Architecture Engine", category:"education", icon:"🖥️", color:"#4C1D95", description:"LMS architecture — course structures, enrollment workflows, SCORM/xAPI.", capabilities:["LMS architecture","SCORM design","xAPI tracking","Enrollment flows"], status:"active", runCount:0 },
  { id:"InstructionalEngine", name:"Instructional Design Engine", category:"education", icon:"🎨", color:"#7C3AED", description:"Instructional design — ADDIE, SAM, backward design, and Bloom's taxonomy.", capabilities:["ADDIE framework","SAM model","Backward design","Bloom's taxonomy"], status:"active", runCount:0 },
  { id:"MicrolearningEngine", name:"Microlearning Engine", category:"education", icon:"⚡", color:"#6D28D9", description:"Micro-learning module design — 5-minute lessons, spaced repetition, mobile-first.", capabilities:["5-min modules","Spaced repetition","Mobile-first","Retention design"], status:"active", runCount:0 },
  { id:"GameBasedLearningEngine", name:"Game-Based Learning Engine", category:"education", icon:"🎮", color:"#5B21B6", description:"Game-based learning design — mechanics, rewards, narrative, and outcomes mapping.", capabilities:["Game mechanics","Reward systems","Narrative integration","Outcomes mapping"], status:"active", runCount:0 },
  { id:"AdaptiveLearningEngine", name:"Adaptive Learning Engine", category:"education", icon:"🤖", color:"#4C1D95", description:"Adaptive learning AI — knowledge gap analysis, personalized routing, mastery prediction.", capabilities:["Knowledge gap AI","Content routing","Mastery prediction","Personalization"], status:"active", runCount:0 },
  { id:"EdTechStackEngine", name:"EdTech Stack Engine", category:"education", icon:"🔌", color:"#7C3AED", description:"Education technology stack — tool selection, integration maps, data privacy compliance.", capabilities:["Tool selection","Integration mapping","Data privacy","FERPA compliance"], status:"active", runCount:0 },
  { id:"CredentialDesignEngine", name:"Credential Design Engine", category:"education", icon:"🏅", color:"#6D28D9", description:"Digital credentials and badges — Open Badges, micro-credentials, verifiable achievement.", capabilities:["Open Badges","Micro-credentials","Verifiable certs","Blockchain creds"], status:"active", runCount:0 },
  { id:"VirtualClassroomEngine", name:"Virtual Classroom Engine", category:"education", icon:"📡", color:"#5B21B6", description:"Virtual classroom systems — breakout rooms, participation tools, hybrid design.", capabilities:["Breakout rooms","Participation tools","Hybrid classroom","Async video"], status:"active", runCount:0 },
  { id:"K12StrategyEngine", name:"K-12 Strategy Engine", category:"education", icon:"🏫", color:"#4C1D95", description:"K-12 platform strategy — district rollout, equity analysis, state reporting.", capabilities:["District rollout","Equity analysis","State reporting","Compliance mapping"], status:"active", runCount:0 },
  { id:"HigherEduEngine", name:"Higher Education Engine", category:"education", icon:"🎓", color:"#7C3AED", description:"Higher education systems — enrollment management, retention programs, advising.", capabilities:["Enrollment management","Retention programs","Advising systems","Accreditation"], status:"active", runCount:0 },
  { id:"TeacherToolsEngine", name:"Teacher Tools Engine", category:"education", icon:"👩‍🏫", color:"#6D28D9", description:"Teacher productivity tools — lesson plan generators, grading assistants, class management.", capabilities:["Lesson generators","Grading assistants","Class management","Parent communication"], status:"active", runCount:0 },
  { id:"StudentEngagementEngine", name:"Student Engagement Engine", category:"education", icon:"🎓", color:"#5B21B6", description:"Student engagement — gamification, progress tracking, peer collaboration.", capabilities:["Gamification","Progress tracking","Peer collaboration","Engagement analytics"], status:"active", runCount:0 },
  { id:"EduAnalyticsEngine", name:"Education Analytics Engine", category:"education", icon:"📊", color:"#4C1D95", description:"School analytics — attendance, outcomes, equity dashboards, early warning.", capabilities:["Attendance analytics","Equity dashboards","Early warning","Outcome tracking"], status:"active", runCount:0 },
  { id:"EduAccessEngine", name:"Education Accessibility Engine", category:"education", icon:"♿", color:"#7C3AED", description:"WCAG 2.2 for education — screen reader compliance, captioning, and UDL.", capabilities:["WCAG 2.2","Screen reader","Captioning","UDL design"], status:"active", runCount:0 },
  // ── Operations Suite ───────────────────────────────────────────────────────
  { id:"SupplyChainEngine", name:"Supply Chain Engine", category:"operations", icon:"🔗", color:"#F59E0B", description:"Supply chain design — sourcing strategy, tier mapping, disruption modeling.", capabilities:["Sourcing strategy","Tier mapping","Disruption modeling","Inventory buffers"], status:"active", runCount:0 },
  { id:"InventoryEngine", name:"Inventory Management Engine", category:"operations", icon:"📦", color:"#D97706", description:"Inventory systems — reorder points, ABC analysis, cycle counting, warehouse design.", capabilities:["Reorder points","ABC analysis","Cycle counting","Warehouse design"], status:"active", runCount:0 },
  { id:"QualityMgmtEngine", name:"Quality Management Engine", category:"operations", icon:"✅", color:"#B45309", description:"QMS frameworks — ISO 9001, CAPA systems, nonconformance, supplier quality.", capabilities:["ISO 9001","CAPA systems","Nonconformance","Supplier quality"], status:"active", runCount:0 },
  { id:"ProcessMiningEngine", name:"Process Mining Engine", category:"operations", icon:"⛏️", color:"#92400E", description:"Process mining — bottleneck ID, cycle time, and process variant mapping.", capabilities:["Bottleneck ID","Cycle time","Process variants","Automation opportunities"], status:"active", runCount:0 },
  { id:"LogisticsEngine", name:"Logistics Engine", category:"operations", icon:"🚛", color:"#78350F", description:"Logistics network design — lane optimization, carrier selection, TMS integration.", capabilities:["Lane optimization","Carrier selection","TMS integration","Freight audit"], status:"active", runCount:0 },
  { id:"ProcurementEngine", name:"Procurement Engine", category:"operations", icon:"🛒", color:"#F59E0B", description:"Procurement strategy — category management, RFP templates, supplier scorecards.", capabilities:["Category management","RFP templates","Supplier scorecards","Contract lifecycle"], status:"active", runCount:0 },
  { id:"VendorMgmtEngine", name:"Vendor Management Engine", category:"operations", icon:"🤝", color:"#D97706", description:"Vendor management — onboarding, performance reviews, risk assessments, exit plans.", capabilities:["Vendor onboarding","Performance reviews","Risk assessment","Exit planning"], status:"active", runCount:0 },
  { id:"LeanSixSigmaEngine", name:"Lean Six Sigma Engine", category:"operations", icon:"📐", color:"#B45309", description:"Lean/Six Sigma — value stream mapping, DMAIC projects, waste elimination.", capabilities:["Value stream mapping","DMAIC","Waste elimination","5S programs"], status:"active", runCount:0 },
  { id:"ChangeManagementEngine", name:"Change Management Engine", category:"operations", icon:"🔄", color:"#92400E", description:"Organizational change — ADKAR frameworks, stakeholder maps, adoption metrics.", capabilities:["ADKAR framework","Stakeholder maps","Resistance plans","Adoption metrics"], status:"active", runCount:0 },
  { id:"BCPEngine", name:"Business Continuity Engine", category:"operations", icon:"🆘", color:"#78350F", description:"BCP — BIA, RTO/RPO design, crisis communication, tabletop exercises.", capabilities:["BIA analysis","RTO/RPO design","Crisis comms","Tabletop exercises"], status:"active", runCount:0 },
  { id:"KPIFrameworkEngine", name:"KPI Framework Engine", category:"operations", icon:"🎯", color:"#F59E0B", description:"KPI framework — balanced scorecard, north star metric, cascading goals.", capabilities:["Balanced scorecard","North star","Cascading goals","Reporting cadence"], status:"active", runCount:0 },
  { id:"WorkflowAutoEngine", name:"Workflow Automation Engine", category:"operations", icon:"🤖", color:"#D97706", description:"RPA and workflow automation — bot design, orchestration, exception handling.", capabilities:["Bot design","Process orchestration","Exception handling","ROI modeling"], status:"active", runCount:0 },
  { id:"CapacityPlanEngine", name:"Capacity Planning Engine", category:"operations", icon:"📈", color:"#B45309", description:"Capacity planning — demand forecasting, resource modeling, bottleneck prediction.", capabilities:["Demand forecasting","Resource modeling","Scenario planning","Bottleneck prediction"], status:"active", runCount:0 },
  { id:"OKREngine", name:"OKR Framework Engine", category:"operations", icon:"🏆", color:"#92400E", description:"OKR design — goal hierarchies, check-in cadences, progress scoring, team alignment.", capabilities:["Goal hierarchies","Check-in cadences","Progress scoring","Cross-team alignment"], status:"active", runCount:0 },
  { id:"FieldOpsEngine", name:"Field Operations Engine", category:"operations", icon:"📍", color:"#78350F", description:"Field service management — routing, dispatch, SLA tracking, and mobile apps.", capabilities:["Route optimization","Technician dispatch","SLA tracking","Mobile field apps"], status:"active", runCount:0 },
  { id:"FacilitiesEngine", name:"Facilities Management Engine", category:"operations", icon:"🏢", color:"#F59E0B", description:"Facilities — preventive maintenance, space planning, energy monitoring, CMMS.", capabilities:["Preventive maintenance","Space planning","Energy monitoring","CMMS design"], status:"active", runCount:0 },
  { id:"OpExEngine", name:"Operational Excellence Engine", category:"operations", icon:"⚡", color:"#D97706", description:"OpEx programs — COPQ tracking, improvement portfolio, Kaizen management.", capabilities:["COPQ tracking","Improvement portfolio","Kaizen events","OpEx metrics"], status:"active", runCount:0 },
  // ── Sustainability Suite ───────────────────────────────────────────────────
  { id:"ESGFrameworkEngine", name:"ESG Framework Engine", category:"sustainability", icon:"🌿", color:"#10B981", description:"ESG reporting frameworks — GRI, SASB, TCFD, and integrated annual reports.", capabilities:["GRI reporting","SASB standards","TCFD framework","Annual reports"], status:"active", runCount:0 },
  { id:"CarbonFootprintEngine", name:"Carbon Footprint Engine", category:"sustainability", icon:"🌍", color:"#059669", description:"Carbon tracking — Scope 1/2/3 measurement, reduction targets, offset strategy.", capabilities:["Scope 1/2/3","Carbon targets","Offset strategy","Emissions inventory"], status:"active", runCount:0 },
  { id:"NetZeroEngine", name:"Net Zero Strategy Engine", category:"sustainability", icon:"♻️", color:"#047857", description:"Net-zero strategy — decarbonization pathways, technology roadmaps, SBTi.", capabilities:["Decarbonization pathways","SBTi targets","Net-zero roadmap","Abatement curves"], status:"active", runCount:0 },
  { id:"CircularEconomyEngine", name:"Circular Economy Engine", category:"sustainability", icon:"🔁", color:"#065F46", description:"Circular economy — product life extension, take-back programs, material flow analysis.", capabilities:["Life extension","Take-back programs","Material flows","Circular design"], status:"active", runCount:0 },
  { id:"RenewableEnergyEngine", name:"Renewable Energy Engine", category:"sustainability", icon:"☀️", color:"#10B981", description:"Renewable energy planning — solar/wind feasibility, PPA structures, energy transition.", capabilities:["Solar feasibility","Wind assessment","PPA structures","Energy transition"], status:"active", runCount:0 },
  { id:"SustainableSupplyEngine", name:"Sustainable Supply Chain Engine", category:"sustainability", icon:"🌱", color:"#059669", description:"Sustainable supply chain — supplier ESG scoring, deforestation monitoring, ethical sourcing.", capabilities:["Supplier ESG","Deforestation monitoring","Ethical sourcing","Supply risk"], status:"active", runCount:0 },
  { id:"WaterMgmtEngine", name:"Water Management Engine", category:"sustainability", icon:"💧", color:"#047857", description:"Water stewardship — usage benchmarking, reduction programs, watershed risk.", capabilities:["Usage benchmarking","Reduction programs","Watershed risk","Water KPIs"], status:"active", runCount:0 },
  { id:"BiodiversityEngine", name:"Biodiversity Engine", category:"sustainability", icon:"🦋", color:"#065F46", description:"Biodiversity impact — ecosystem mapping, nature-positive strategies, TNFD.", capabilities:["Ecosystem mapping","Nature-positive","TNFD alignment","Biodiversity KPIs"], status:"active", runCount:0 },
  { id:"SocialImpactEngine", name:"Social Impact Engine", category:"sustainability", icon:"❤️", color:"#10B981", description:"Social impact measurement — theory of change, impact KPIs, stakeholder mapping.", capabilities:["Theory of change","Impact KPIs","Stakeholder mapping","Impact reporting"], status:"active", runCount:0 },
  { id:"GreenFinanceEngine", name:"Green Finance Engine", category:"sustainability", icon:"💚", color:"#059669", description:"Green bonds, sustainability-linked loans, ESG investing, and green taxonomy.", capabilities:["Green bonds","SLL design","ESG investing","Green taxonomy"], status:"active", runCount:0 },
  { id:"LCAEngine", name:"Life Cycle Assessment Engine", category:"sustainability", icon:"🔬", color:"#047857", description:"LCA frameworks — cradle-to-gate, cradle-to-grave, and hotspot identification.", capabilities:["LCA methodology","Hotspot ID","Impact categories","LCA benchmarking"], status:"active", runCount:0 },
  { id:"ClimateRiskEngine", name:"Climate Risk Engine", category:"sustainability", icon:"⛈️", color:"#065F46", description:"Climate risk modeling — physical risk, transition risk, TCFD scenario analysis.", capabilities:["Physical risk","Transition risk","TCFD scenarios","Stranded assets"], status:"active", runCount:0 },
  { id:"ESGReportingEngine", name:"ESG Reporting Engine", category:"sustainability", icon:"📄", color:"#10B981", description:"Sustainability report design — materiality assessment, stakeholder engagement, disclosure.", capabilities:["Materiality assessment","Stakeholder engagement","Disclosure strategy","Integrated reporting"], status:"active", runCount:0 },
  { id:"SDGEngine", name:"SDG Alignment Engine", category:"sustainability", icon:"🌐", color:"#059669", description:"UN SDG alignment — goal mapping, indicator selection, impact quantification.", capabilities:["SDG mapping","Indicator selection","Impact quantification","Progress reporting"], status:"active", runCount:0 },
  { id:"EnvComplianceEngine", name:"Environmental Compliance Engine", category:"sustainability", icon:"⚖️", color:"#047857", description:"Environmental management — ISO 14001, compliance calendar, permit tracking.", capabilities:["ISO 14001","Compliance calendar","Permit tracking","Audit management"], status:"active", runCount:0 },
  { id:"GreenBuildingEngine", name:"Green Building Engine", category:"sustainability", icon:"🏗️", color:"#065F46", description:"LEED and green building — energy modeling, materials selection, certification.", capabilities:["LEED certification","Energy modeling","Materials selection","Green standards"], status:"active", runCount:0 },
  // ── HR Tech Suite ──────────────────────────────────────────────────────────
  { id:"TalentAcqEngine", name:"Talent Acquisition Engine", category:"hr", icon:"👥", color:"#8B5CF6", description:"TA strategy — sourcing channels, ATS workflows, hiring manager training.", capabilities:["Sourcing strategy","ATS workflows","Hiring training","Offer management"], status:"active", runCount:0 },
  { id:"EmployeeExpEngine", name:"Employee Experience Engine", category:"hr", icon:"💼", color:"#7C3AED", description:"Employee experience — moments that matter, feedback loops, EX measurement.", capabilities:["Moments that matter","Feedback loops","EX measurement","Journey mapping"], status:"active", runCount:0 },
  { id:"PerfMgmtEngine", name:"Performance Management Engine", category:"hr", icon:"📈", color:"#6D28D9", description:"Performance systems — goal setting, mid-year reviews, calibration, PIPs.", capabilities:["Goal setting","Review cycles","Calibration","PIP workflows"], status:"active", runCount:0 },
  { id:"LDStrategyEngine", name:"L&D Strategy Engine", category:"hr", icon:"📚", color:"#5B21B6", description:"Learning & development strategy — needs analysis, program design, ROI.", capabilities:["Needs analysis","Program design","Budget modeling","ROI measurement"], status:"active", runCount:0 },
  { id:"CompBenchEngine", name:"Comp Benchmarking Engine", category:"hr", icon:"💰", color:"#4C1D95", description:"Compensation benchmarking — market pricing, band design, pay equity.", capabilities:["Market pricing","Band design","Pay equity","Pay transparency"], status:"active", runCount:0 },
  { id:"WorkforcePlanEngine", name:"Workforce Planning Engine", category:"hr", icon:"🗓️", color:"#8B5CF6", description:"Workforce planning — headcount forecasting, skills gap, succession mapping.", capabilities:["Headcount forecasting","Skills gap analysis","Succession mapping","Scenario modeling"], status:"active", runCount:0 },
  { id:"DEIEngine", name:"DEI Strategy Engine", category:"hr", icon:"🌈", color:"#7C3AED", description:"DEI programs — representation goals, bias audits, pay equity, inclusive hiring.", capabilities:["Representation goals","Bias audits","Pay equity","Inclusive hiring"], status:"active", runCount:0 },
  { id:"PeopleAnalyticsEngine", name:"People Analytics Engine", category:"hr", icon:"📊", color:"#6D28D9", description:"People analytics — turnover prediction, engagement correlation, productivity dashboards.", capabilities:["Turnover prediction","Engagement correlation","HR KPIs","People dashboards"], status:"active", runCount:0 },
  { id:"SuccessionPlanEngine", name:"Succession Planning Engine", category:"hr", icon:"🎖️", color:"#5B21B6", description:"Succession planning — 9-box assessments, talent pools, critical role gaps.", capabilities:["9-box assessment","Talent pools","Critical roles","Gap analysis"], status:"active", runCount:0 },
  { id:"OrgDesignEngine", name:"Org Design Engine", category:"hr", icon:"🏛️", color:"#4C1D95", description:"Org design — spans and layers, team topology, and transition planning.", capabilities:["Spans and layers","Team topology","Reporting structure","Transition planning"], status:"active", runCount:0 },
  { id:"EmployerBrandEngine", name:"Employer Brand Engine", category:"hr", icon:"⭐", color:"#8B5CF6", description:"Employer branding — EVP design, Glassdoor strategy, career site optimization.", capabilities:["EVP design","Glassdoor strategy","Career site","Talent attraction"], status:"active", runCount:0 },
  { id:"HRCompEngine", name:"HR Compliance Engine", category:"hr", icon:"⚖️", color:"#7C3AED", description:"HR legal compliance — FLSA, FMLA, EEO, ADA, and state employment law.", capabilities:["FLSA compliance","FMLA","EEO/ADA","State employment law"], status:"active", runCount:0 },
  { id:"OnboardingEngine", name:"Onboarding Engine", category:"hr", icon:"🎉", color:"#6D28D9", description:"Onboarding systems — 30/60/90 plans, buddy programs, new hire success metrics.", capabilities:["30/60/90 plans","Buddy programs","Compliance training","New hire metrics"], status:"active", runCount:0 },
  { id:"RemoteWorkEngine", name:"Remote Work Engine", category:"hr", icon:"🌐", color:"#5B21B6", description:"Remote work frameworks — async norms, virtual onboarding, digital culture.", capabilities:["Async norms","Virtual onboarding","Digital culture","Productivity tools"], status:"active", runCount:0 },
  { id:"WellnessEngine", name:"Employee Wellness Engine", category:"hr", icon:"🏃", color:"#4C1D95", description:"Employee wellness programs — physical, mental, financial wellness design.", capabilities:["Physical wellness","Mental health","Financial wellness","Vendor selection"], status:"active", runCount:0 },
  { id:"HRISDesignEngine", name:"HRIS Design Engine", category:"hr", icon:"🔧", color:"#8B5CF6", description:"HRIS architecture — system selection, data model, integration mapping, go-live.", capabilities:["System selection","Data modeling","Integration mapping","Go-live planning"], status:"active", runCount:0 },
  { id:"TalentPipeEngine", name:"Talent Pipeline Engine", category:"hr", icon:"🔮", color:"#7C3AED", description:"Talent pipeline — university partnerships, apprenticeships, internal mobility.", capabilities:["University partnerships","Apprenticeships","Internal mobility","Pipeline metrics"], status:"active", runCount:0 },
  // ── Legal AI Suite ─────────────────────────────────────────────────────────
  { id:"ContractIntelEngine", name:"Contract Intelligence Engine", category:"legal", icon:"📄", color:"#06B6D4", description:"AI contract drafting — MSAs, NDAs, SOWs, employment agreements.", capabilities:["MSA drafting","NDA generation","SOW templates","Employment agreements"], status:"active", runCount:0 },
  { id:"LegalResearchEngine", name:"Legal Research Engine", category:"legal", icon:"⚖️", color:"#0891B2", description:"Legal research — case law summarization, regulatory analysis, legal memos.", capabilities:["Case law summaries","Regulatory analysis","Legal memos","Citation checking"], status:"active", runCount:0 },
  { id:"CompMappingEngine", name:"Compliance Mapping Engine", category:"legal", icon:"🗺️", color:"#0E7490", description:"Regulatory mapping — multi-jurisdiction compliance matrices and gap analysis.", capabilities:["Multi-jurisdiction","Compliance matrices","Gap analysis","Remediation roadmaps"], status:"active", runCount:0 },
  { id:"IPPortfolioEngine", name:"IP Portfolio Engine", category:"legal", icon:"💡", color:"#155E75", description:"IP portfolio strategy — patent mapping, trade secrets, and IP licensing.", capabilities:["Patent mapping","Trade secrets","IP licensing","Portfolio analysis"], status:"active", runCount:0 },
  { id:"LegalRiskEngine", name:"Legal Risk Engine", category:"legal", icon:"🚦", color:"#06B6D4", description:"Legal risk assessment — contract risk scoring, exposure quantification.", capabilities:["Risk scoring","Exposure quantification","Mitigation strategies","Risk matrices"], status:"active", runCount:0 },
  { id:"CorpGovernEngine", name:"Corporate Governance Engine", category:"legal", icon:"🎯", color:"#0891B2", description:"Corporate governance — board design, committee charters, director independence.", capabilities:["Board design","Committee charters","Director independence","ESG governance"], status:"active", runCount:0 },
  { id:"PrivacyLawEngine", name:"Privacy Law Engine", category:"legal", icon:"🔏", color:"#0E7490", description:"Privacy law compliance — GDPR, CCPA, PIPEDA gap analysis, and DPIAs.", capabilities:["GDPR compliance","CCPA analysis","DPIA templates","Privacy program"], status:"active", runCount:0 },
  { id:"LaborLawEngine", name:"Labor Law Engine", category:"legal", icon:"👷", color:"#155E75", description:"Labor and employment law — handbook design, classification audits.", capabilities:["Handbook design","Classification audits","Employment law","HR policy"], status:"active", runCount:0 },
  { id:"TradeCompEngine", name:"Trade Compliance Engine", category:"legal", icon:"🌐", color:"#06B6D4", description:"Import/export compliance — ITAR, EAR, sanctions screening, customs docs.", capabilities:["ITAR compliance","EAR licensing","Sanctions screening","Customs docs"], status:"active", runCount:0 },
  { id:"DueDiligenceEngine", name:"Due Diligence Engine", category:"legal", icon:"🔍", color:"#0891B2", description:"M&A due diligence — legal checklist, data room organization, risk summaries.", capabilities:["Legal checklist","Data room design","Risk summaries","Diligence reports"], status:"active", runCount:0 },
  { id:"LegalOpsEngine", name:"Legal Operations Engine", category:"legal", icon:"📊", color:"#0E7490", description:"Legal ops — outside counsel spend, matter KPIs, contract cycle time.", capabilities:["Spend analytics","Matter management","Contract lifecycle","Legal KPIs"], status:"active", runCount:0 },
  { id:"LitigationStratEngine", name:"Litigation Strategy Engine", category:"legal", icon:"🏛️", color:"#155E75", description:"Litigation strategy — case theory, discovery planning, settlement modeling.", capabilities:["Case theory","Discovery planning","Settlement modeling","Timeline design"], status:"active", runCount:0 },
  { id:"RegSubEngine", name:"Regulatory Submission Engine", category:"legal", icon:"📤", color:"#06B6D4", description:"Regulatory filing — submission calendars, docket tracking, comment drafting.", capabilities:["Submission calendars","Docket tracking","Comment drafting","Filing management"], status:"active", runCount:0 },
  { id:"ADRStratEngine", name:"ADR Strategy Engine", category:"legal", icon:"🤝", color:"#0891B2", description:"Alternative dispute resolution — mediation playbooks, arbitration clauses.", capabilities:["Mediation playbooks","Arbitration clauses","Settlement negotiation","ADR design"], status:"active", runCount:0 },
  // ── Product Design Suite ───────────────────────────────────────────────────
  { id:"ProductDiscoveryEngine", name:"Product Discovery Engine", category:"product", icon:"🔭", color:"#F97316", description:"Product discovery — problem space exploration, opportunity mapping, outcome definition.", capabilities:["Problem space","Opportunity mapping","Outcome definition","Discovery rituals"], status:"active", runCount:0 },
  { id:"UserResearchEngine", name:"User Research Engine", category:"product", icon:"🧪", color:"#EA580C", description:"User research — interview guides, usability scripts, survey design, synthesis.", capabilities:["Interview guides","Usability scripts","Survey design","Research synthesis"], status:"active", runCount:0 },
  { id:"JTBDEngine", name:"JTBD Analysis Engine", category:"product", icon:"🎯", color:"#C2410C", description:"Jobs-to-be-done — job mapping, forces of progress, outcome-driven roadmaps.", capabilities:["Job mapping","Forces of progress","Outcome-driven","JTBD interviews"], status:"active", runCount:0 },
  { id:"ProductRoadmapEngine", name:"Product Roadmap Engine", category:"product", icon:"🗺️", color:"#9A3412", description:"Product roadmap design — now/next/later, initiative sizing, stakeholder comms.", capabilities:["Roadmap frameworks","Initiative sizing","Stakeholder comms","Theme design"], status:"active", runCount:0 },
  { id:"FeaturePrioritEngine", name:"Feature Prioritization Engine", category:"product", icon:"⚖️", color:"#7C2D12", description:"Feature prioritization — RICE, ICE, Kano, and weighted scoring models.", capabilities:["RICE scoring","ICE model","Kano analysis","Weighted scoring"], status:"active", runCount:0 },
  { id:"UserStoryEngine", name:"User Story Engine", category:"product", icon:"📖", color:"#F97316", description:"User story mapping — journey decomposition, release slicing, backlog organization.", capabilities:["Story mapping","Journey decomp","Release slicing","Backlog design"], status:"active", runCount:0 },
  { id:"DesignSprintEngine", name:"Design Sprint Engine", category:"product", icon:"⚡", color:"#EA580C", description:"Design sprint facilitation — HMW exercises, storyboarding, prototype testing.", capabilities:["Sprint planning","HMW exercises","Storyboarding","Prototype testing"], status:"active", runCount:0 },
  { id:"ProductMetricsEngine", name:"Product Metrics Engine", category:"product", icon:"📊", color:"#C2410C", description:"Product metrics — North Star framework, instrumentation, experimentation.", capabilities:["North Star","Instrumentation","A/B experimentation","Metric trees"], status:"active", runCount:0 },
  { id:"UsabilityTestEngine", name:"Usability Testing Engine", category:"product", icon:"👁️", color:"#9A3412", description:"Usability testing — test scripts, session facilitation, findings reporting.", capabilities:["Test scripts","Session facilitation","Findings reports","Usability metrics"], status:"active", runCount:0 },
  { id:"CompProdEngine", name:"Competitive Product Engine", category:"product", icon:"🏆", color:"#7C2D12", description:"Competitive product analysis — feature comparison, positioning maps, differentiation.", capabilities:["Feature comparison","Positioning maps","Differentiation","Win/loss analysis"], status:"active", runCount:0 },
  { id:"ProdLaunchEngine", name:"Product Launch Engine", category:"product", icon:"🚀", color:"#F97316", description:"Product launch — GTM coordination, launch criteria, day-1 monitoring.", capabilities:["GTM coordination","Launch criteria","Day-1 monitoring","Success metrics"], status:"active", runCount:0 },
  { id:"DesignSysEngine", name:"Design System Engine", category:"product", icon:"🎨", color:"#EA580C", description:"Design system architecture — token systems, component libraries, documentation.", capabilities:["Token systems","Component libraries","Documentation sites","Adoption programs"], status:"active", runCount:0 },
  { id:"FeedbackLoopEngine", name:"Feedback Loop Engine", category:"product", icon:"💬", color:"#C2410C", description:"Product feedback loops — in-app surveys, NPS programs, insight routing.", capabilities:["In-app surveys","NPS programs","Review management","Insight routing"], status:"active", runCount:0 },
  { id:"PrototypingEngine", name:"Prototyping Engine", category:"product", icon:"🖋️", color:"#9A3412", description:"Rapid prototyping — fidelity selection, tool recommendations, testing frameworks.", capabilities:["Fidelity selection","Tool recommendations","Prototype testing","Iteration design"], status:"active", runCount:0 },
  // ── Research Lab Suite ─────────────────────────────────────────────────────
  { id:"PrimaryResearchEngine", name:"Primary Research Engine", category:"research", icon:"🔬", color:"#64748B", description:"Primary research design — study design, participant recruitment, data collection.", capabilities:["Study design","Participant recruitment","Instruments","Protocols"], status:"active", runCount:0 },
  { id:"MarketSurveyEngine", name:"Market Survey Engine", category:"research", icon:"📊", color:"#475569", description:"Market survey design — questionnaire architecture, sampling methodology.", capabilities:["Questionnaire design","Sampling methods","Statistical significance","Survey analysis"], status:"active", runCount:0 },
  { id:"CIAnalysisEngine", name:"Competitive Intelligence Engine", category:"research", icon:"🔍", color:"#334155", description:"Competitive intelligence — source identification, analysis templates, signal monitoring.", capabilities:["Source identification","CI templates","Signal monitoring","CI reports"], status:"active", runCount:0 },
  { id:"InsightSynthEngine", name:"Insight Synthesis Engine", category:"research", icon:"💡", color:"#1E293B", description:"Research synthesis — affinity mapping, theme extraction, opportunity identification.", capabilities:["Affinity mapping","Theme extraction","Opportunity ID","Synthesis reports"], status:"active", runCount:0 },
  { id:"ExperimentDesignEngine", name:"Experiment Design Engine", category:"research", icon:"🧪", color:"#64748B", description:"Experiment design — A/B test architecture, statistical power, result interpretation.", capabilities:["A/B test design","Statistical power","Holdout groups","Result interpretation"], status:"active", runCount:0 },
  { id:"HypothesisEngine", name:"Hypothesis Generation Engine", category:"research", icon:"💭", color:"#475569", description:"Hypothesis generation — assumption mapping, testability scoring, experiment queue.", capabilities:["Assumption mapping","Testability scoring","Experiment queue","Hypothesis testing"], status:"active", runCount:0 },
  { id:"StatisticalEngine", name:"Statistical Analysis Engine", category:"research", icon:"📈", color:"#334155", description:"Statistical analysis — regression models, significance testing, confidence intervals.", capabilities:["Regression models","Significance testing","Confidence intervals","Data stories"], status:"active", runCount:0 },
  { id:"TrendsAnalysisEngine", name:"Trends Analysis Engine", category:"research", icon:"📡", color:"#1E293B", description:"Trend monitoring — horizon scanning, weak signal detection, foresight reports.", capabilities:["Horizon scanning","Weak signals","Trend classification","Foresight reports"], status:"active", runCount:0 },
  { id:"EthnographicEngine", name:"Ethnographic Research Engine", category:"research", icon:"👁️", color:"#64748B", description:"Ethnographic research — participant observation, field notes, cultural probes.", capabilities:["Participant observation","Field notes","Cultural probes","Artifact analysis"], status:"active", runCount:0 },
  { id:"KnowledgeMgmtEngine", name:"Knowledge Management Engine", category:"research", icon:"📚", color:"#475569", description:"Knowledge management — taxonomy design, tagging, search architecture, governance.", capabilities:["Taxonomy design","Tagging systems","Search architecture","Content governance"], status:"active", runCount:0 },
  { id:"ForesightEngine", name:"Strategic Foresight Engine", category:"research", icon:"🔮", color:"#334155", description:"Strategic foresight — scenario planning, futures modeling, and horizon scanning.", capabilities:["Scenario planning","Futures modeling","Horizon scanning","Wild cards"], status:"active", runCount:0 },
  { id:"ResearchMethodEngine", name:"Research Methodology Engine", category:"research", icon:"📐", color:"#1E293B", description:"Research methodology — qualitative, quantitative, mixed-methods, action research.", capabilities:["Qualitative design","Quantitative methods","Mixed methods","Action research"], status:"active", runCount:0 },

  // ── Universal Self-Completion Suite ──────────────────────────────────────────
  { id:"UniversalCompletionEngine", name:"Universal Self-Completion Engine", category:"platform", icon:"Σ", color:"#4f46e5", description:"Takes any project, idea, or instruction and automatically detects every missing piece — engines, rules, logic, workflows, data structures, connections — then generates them all. If it doesn't exist, it creates it. If it's unclear, it resolves it. The system always has everything it needs.", capabilities:["Intention resolution","Gap detection","Auto-generation","Full architecture","Zero undefined states","Self-completing logic"], status:"active", runCount:0 },
  { id:"IntentionResolverEngine", name:"Intention Resolver Engine", category:"platform", icon:"🎯", color:"#6366f1", description:"Resolves any ambiguous, incomplete, or vague project description into a precise, fully-specified intent statement. Infers purpose, scope, audience, constraints, and success criteria automatically.", capabilities:["Intent inference","Scope resolution","Audience detection","Constraint mapping","Success criteria","Ambiguity elimination"], status:"active", runCount:0 },
  { id:"GapDetectorEngine", name:"Gap Detector Engine", category:"platform", icon:"🔎", color:"#7c3aed", description:"Scans any project description, architecture, or idea for missing pieces. Identifies absent engines, undefined rules, incomplete workflows, missing connections, and undefined states — then generates a prioritized completion list.", capabilities:["Missing engine detection","Rule gap analysis","Workflow hole finder","Connection audit","Undefined state detection","Completion roadmap"], status:"active", runCount:0 },
  { id:"ArchitectureGeneratorEngine", name:"Architecture Generator Engine", category:"platform", icon:"🏗️", color:"#4338ca", description:"Generates the complete technical and functional architecture for any project. Produces component diagrams, module structure, layer design, API contracts, routing, and data flow — all from a single idea.", capabilities:["Component architecture","Module structure","Layer design","API contracts","Routing design","Data flow mapping"], status:"active", runCount:0 },
  { id:"RuleCompilerEngine", name:"Rule Compiler Engine", category:"platform", icon:"📋", color:"#3730a3", description:"Compiles all rules required for any system to function: business rules, validation rules, access rules, computation rules, transformation rules, and error-handling rules. Every rule is defined, named, and connected.", capabilities:["Business rule generation","Validation rules","Access control rules","Computation logic","Transformation rules","Error rules"], status:"active", runCount:0 },
  { id:"WorkflowSynthesisEngine", name:"Workflow Synthesis Engine", category:"platform", icon:"🔄", color:"#4f46e5", description:"Synthesizes complete end-to-end workflows for any process, feature, or system. Every step is defined, every branch is handled, every error path is resolved, and every completion condition is specified.", capabilities:["End-to-end workflows","Step decomposition","Branch handling","Error paths","Completion conditions","Trigger mapping"], status:"active", runCount:0 },
  { id:"DataSchemaEngine", name:"Data Schema Engine", category:"platform", icon:"🗂️", color:"#5b21b6", description:"Designs the complete data architecture for any project — entities, relationships, field definitions, validation constraints, indexes, and migration strategies. Zero undefined fields.", capabilities:["Entity modeling","Relationship mapping","Field definitions","Validation constraints","Index strategy","Migration planning"], status:"active", runCount:0 },
  { id:"ConnectionMapperEngine", name:"Connection Mapper Engine", category:"platform", icon:"🔗", color:"#6d28d9", description:"Maps every connection in a system — service-to-service, component-to-component, data-to-logic, trigger-to-handler, and user-to-interface. Detects broken links and generates missing bridges.", capabilities:["Service mapping","Component links","Data-logic bridges","Trigger-handler wiring","Broken link detection","Integration specs"], status:"active", runCount:0 },
  { id:"CompletionValidatorEngine", name:"Completion Validator Engine", category:"platform", icon:"✅", color:"#059669", description:"Validates that any system, project, or architecture is 100% complete. Scores completeness across 12 dimensions, identifies the last remaining gaps, and produces a signed-off completion certificate.", capabilities:["12-dimension scoring","Final gap list","Completeness certificate","Dependency validation","Coverage report","Zero-gap verification"], status:"active", runCount:0 },

// ─── All Series Registry ──────────────────────────────────────────────────────

];
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

  // ── Security Series ─────────────────────────────────────────────────────────
  { id:"SecureArchSeries", name:"Secure Architecture Series", symbol:"Sec-α", icon:"🔐", color:"#EF4444", description:"Zero trust, IAM, cloud security, and posture management.", engines:["ZeroTrustEngine","IAMEngine","CloudSecEngine","SecurityPostureEngine"], estimatedMinutes:30, status:"active" as const },
  { id:"ThreatOpsSeries", name:"Threat Operations Series", symbol:"Sec-β", icon:"🛡️", color:"#DC2626", description:"Threat modeling, red team, incident response, and SOC design.", engines:["ThreatModelEngine","RedTeamEngine","IncidentResponseEngine","SOCEngine"], estimatedMinutes:35, status:"active" as const },
  { id:"AppSecSeries", name:"Application Security Series", symbol:"Sec-γ", icon:"💻", color:"#B91C1C", description:"OWASP, secure SDLC, dependency management, and pen testing.", engines:["AppSecEngine","SecureSDLCEngine","VulnerabilityEngine","PenTestEngine"], estimatedMinutes:28, status:"active" as const },
  { id:"PrivacyCompSeries", name:"Privacy Compliance Series", symbol:"Sec-δ", icon:"🔏", color:"#991B1B", description:"Privacy-by-design — GDPR, CCPA, PIA, and data encryption.", engines:["PrivacyDesignEngine","EncryptionEngine","SecurityAuditEngine","NetworkSecEngine"], estimatedMinutes:32, status:"active" as const },
  // ── Finance Series ─────────────────────────────────────────────────────────
  { id:"FinFoundationSeries", name:"Financial Foundation Series", symbol:"Fin-α", icon:"📈", color:"#16A34A", description:"Financial modeling, unit economics, budgeting, and FP&A.", engines:["FinancialModelEngine","UnitEconomicsEngine","BudgetingEngine","FPAEngine"], estimatedMinutes:40, status:"active" as const },
  { id:"FundraisingOSSeries", name:"Fundraising OS Series", symbol:"Fin-β", icon:"🚀", color:"#15803D", description:"Investment thesis, fundraising strategy, cap table, and equity.", engines:["InvestmentThesisEngine","FundraisingEngine","EquityStructureEngine","CashFlowEngine"], estimatedMinutes:45, status:"active" as const },
  { id:"TaxFinSeries", name:"Tax & Finance Optimization", symbol:"Fin-γ", icon:"🧾", color:"#166534", description:"Tax strategy, treasury, revenue recognition, and debt structure.", engines:["TaxStrategyEngine","TreasuryEngine","RevenueRecEngine","DebtStructureEngine"], estimatedMinutes:35, status:"active" as const },
  { id:"MADealSeries", name:"M&A Deal Series", symbol:"Fin-δ", icon:"🤝", color:"#14532D", description:"Deal analysis, IPO readiness, grants, and crypto finance.", engines:["MAEngine","IPOReadinessEngine","GrantWritingEngine","InsuranceStrategyEngine"], estimatedMinutes:50, status:"active" as const },
  // ── Healthcare Series ──────────────────────────────────────────────────────
  { id:"ClinicalPlatSeries", name:"Clinical Platform Series", symbol:"Hlt-α", icon:"🏥", color:"#0EA5E9", description:"EHR integration, FHIR APIs, clinical workflows, and decision support.", engines:["EHRIntegrationEngine","FHIREngine","ClinicalWorkflowEngine","ClinicalDecisionEngine"], estimatedMinutes:45, status:"active" as const },
  { id:"HealthCompSeries", name:"Healthcare Compliance Series", symbol:"Hlt-β", icon:"⚖️", color:"#0284C7", description:"HIPAA, medical coding, billing, and clinical trial design.", engines:["HealthcareComplianceEngine","MedicalCodingEngine","HealthBillingEngine","ClinicalTrialEngine"], estimatedMinutes:40, status:"active" as const },
  { id:"PatientCareSeries", name:"Patient Care Series", symbol:"Hlt-γ", icon:"❤️", color:"#0369A1", description:"Patient engagement, population health, care coordination, telehealth.", engines:["PatientEngagementEngine","PopulationHealthEngine","CareCoordinationEngine","TelehealthEngine"], estimatedMinutes:35, status:"active" as const },
  { id:"HealthTechSeries", name:"Health Tech Platform Series", symbol:"Hlt-δ", icon:"🔬", color:"#075985", description:"Analytics, data governance, medical devices, and mental health.", engines:["HealthAnalyticsEngine","HealthDataEngine","MedicalDeviceEngine","MentalHealthEngine"], estimatedMinutes:40, status:"active" as const },
  // ── Education Series ───────────────────────────────────────────────────────
  { id:"LearningDesignSeries", name:"Learning Design Series", symbol:"Edu-α", icon:"📚", color:"#7C3AED", description:"Curriculum, instructional design, microlearning, and adaptive AI.", engines:["CurriculumDesignEngine","InstructionalEngine","MicrolearningEngine","AdaptiveLearningEngine"], estimatedMinutes:35, status:"active" as const },
  { id:"EdTechPlatSeries", name:"EdTech Platform Series", symbol:"Edu-β", icon:"🖥️", color:"#6D28D9", description:"LMS architecture, ed tech stack, assessment design, and analytics.", engines:["LMSArchEngine","EdTechStackEngine","AssessmentDesignEngine","EduAnalyticsEngine"], estimatedMinutes:40, status:"active" as const },
  { id:"StudentSuccessSeries", name:"Student Success Series", symbol:"Edu-γ", icon:"🎓", color:"#5B21B6", description:"Student engagement, game-based learning, virtual classrooms, credentials.", engines:["StudentEngagementEngine","GameBasedLearningEngine","VirtualClassroomEngine","CredentialDesignEngine"], estimatedMinutes:30, status:"active" as const },
  { id:"InstitutionOSSeries", name:"Institution OS Series", symbol:"Edu-δ", icon:"🏫", color:"#4C1D95", description:"K-12 strategy, higher education, teacher tools, and accessibility.", engines:["K12StrategyEngine","HigherEduEngine","TeacherToolsEngine","EduAccessEngine"], estimatedMinutes:35, status:"active" as const },
  // ── Operations Series ──────────────────────────────────────────────────────
  { id:"SupplyOpsSeries", name:"Supply & Ops Series", symbol:"Ops-α", icon:"🔗", color:"#F59E0B", description:"Supply chain, inventory, logistics, and procurement.", engines:["SupplyChainEngine","InventoryEngine","LogisticsEngine","ProcurementEngine"], estimatedMinutes:40, status:"active" as const },
  { id:"QualityExcSeries", name:"Quality Excellence Series", symbol:"Ops-β", icon:"✅", color:"#D97706", description:"QMS, Lean Six Sigma, OpEx, and process mining.", engines:["QualityMgmtEngine","LeanSixSigmaEngine","OpExEngine","ProcessMiningEngine"], estimatedMinutes:35, status:"active" as const },
  { id:"OrgResilienceSeries", name:"Org Resilience Series", symbol:"Ops-γ", icon:"🆘", color:"#B45309", description:"BCP, change management, KPIs, and vendor management.", engines:["BCPEngine","ChangeManagementEngine","KPIFrameworkEngine","VendorMgmtEngine"], estimatedMinutes:35, status:"active" as const },
  { id:"DigitalOpsSeries", name:"Digital Operations Series", symbol:"Ops-δ", icon:"🤖", color:"#92400E", description:"RPA, OKRs, capacity planning, field ops, and facilities.", engines:["WorkflowAutoEngine","OKREngine","CapacityPlanEngine","FieldOpsEngine"], estimatedMinutes:30, status:"active" as const },
  // ── Sustainability Series ──────────────────────────────────────────────────
  { id:"ESGReportSeries", name:"ESG Reporting Series", symbol:"Sus-α", icon:"🌿", color:"#10B981", description:"ESG framework, TCFD climate risk, SDG alignment, and reporting.", engines:["ESGFrameworkEngine","ClimateRiskEngine","SDGEngine","ESGReportingEngine"], estimatedMinutes:40, status:"active" as const },
  { id:"NetZeroSeries", name:"Net Zero Journey Series", symbol:"Sus-β", icon:"♻️", color:"#059669", description:"Carbon footprint, net zero strategy, renewable energy, and LCA.", engines:["CarbonFootprintEngine","NetZeroEngine","RenewableEnergyEngine","LCAEngine"], estimatedMinutes:45, status:"active" as const },
  { id:"CircularImpactSeries", name:"Circular Impact Series", symbol:"Sus-γ", icon:"🔁", color:"#047857", description:"Circular economy, social impact, biodiversity, and water.", engines:["CircularEconomyEngine","SocialImpactEngine","BiodiversityEngine","WaterMgmtEngine"], estimatedMinutes:35, status:"active" as const },
  { id:"SustFinSeries", name:"Sustainable Finance Series", symbol:"Sus-δ", icon:"💚", color:"#065F46", description:"Green finance, sustainable supply, env compliance, green building.", engines:["GreenFinanceEngine","SustainableSupplyEngine","EnvComplianceEngine","GreenBuildingEngine"], estimatedMinutes:35, status:"active" as const },
  // ── HR Tech Series ─────────────────────────────────────────────────────────
  { id:"TalentLifecycleSeries", name:"Talent Lifecycle Series", symbol:"HR-α", icon:"👥", color:"#8B5CF6", description:"TA, onboarding, performance management, and succession.", engines:["TalentAcqEngine","OnboardingEngine","PerfMgmtEngine","SuccessionPlanEngine"], estimatedMinutes:40, status:"active" as const },
  { id:"PeopleStrategySeries", name:"People Strategy Series", symbol:"HR-β", icon:"💼", color:"#7C3AED", description:"Workforce planning, L&D, DEI, and employee experience.", engines:["WorkforcePlanEngine","LDStrategyEngine","DEIEngine","EmployeeExpEngine"], estimatedMinutes:40, status:"active" as const },
  { id:"CompTechHRSeries", name:"Comp & HR Tech Series", symbol:"HR-γ", icon:"💰", color:"#6D28D9", description:"Comp benchmarking, HRIS design, people analytics, org design.", engines:["CompBenchEngine","HRISDesignEngine","PeopleAnalyticsEngine","OrgDesignEngine"], estimatedMinutes:35, status:"active" as const },
  { id:"HRCultureSeries", name:"HR Culture & Compliance Series", symbol:"HR-δ", icon:"🌈", color:"#5B21B6", description:"Employer branding, HR compliance, wellness, remote work.", engines:["EmployerBrandEngine","HRCompEngine","WellnessEngine","RemoteWorkEngine"], estimatedMinutes:30, status:"active" as const },
  // ── Legal Series ───────────────────────────────────────────────────────────
  { id:"ContractLegalSeries", name:"Contract & Legal Series", symbol:"Leg-α", icon:"📄", color:"#06B6D4", description:"Contract intelligence, legal research, due diligence, legal ops.", engines:["ContractIntelEngine","LegalResearchEngine","DueDiligenceEngine","LegalOpsEngine"], estimatedMinutes:35, status:"active" as const },
  { id:"RegCompSeries", name:"Regulatory Compliance Series", symbol:"Leg-β", icon:"⚖️", color:"#0891B2", description:"Compliance mapping, privacy law, trade compliance, regulatory submissions.", engines:["CompMappingEngine","PrivacyLawEngine","TradeCompEngine","RegSubEngine"], estimatedMinutes:40, status:"active" as const },
  { id:"CorporateLegalSeries", name:"Corporate Legal Series", symbol:"Leg-γ", icon:"🏛️", color:"#0E7490", description:"Corporate governance, IP portfolio, litigation strategy, ADR.", engines:["CorpGovernEngine","IPPortfolioEngine","LitigationStratEngine","ADRStratEngine"], estimatedMinutes:35, status:"active" as const },
  { id:"LegalRiskSeries", name:"Legal Risk Series", symbol:"Leg-δ", icon:"🚦", color:"#155E75", description:"Legal risk, labor law, legal research, compliance mapping.", engines:["LegalRiskEngine","LaborLawEngine","LegalResearchEngine","CompMappingEngine"], estimatedMinutes:30, status:"active" as const },
  // ── Product Design Series ──────────────────────────────────────────────────
  { id:"ProdFoundationSeries", name:"Product Foundation Series", symbol:"Prd-α", icon:"🔭", color:"#F97316", description:"Discovery, user research, JTBD analysis, and roadmap design.", engines:["ProductDiscoveryEngine","UserResearchEngine","JTBDEngine","ProductRoadmapEngine"], estimatedMinutes:40, status:"active" as const },
  { id:"ProdBuildSeries", name:"Product Build Series", symbol:"Prd-β", icon:"⚡", color:"#EA580C", description:"Feature prioritization, user stories, design sprints, prototyping.", engines:["FeaturePrioritEngine","UserStoryEngine","DesignSprintEngine","PrototypingEngine"], estimatedMinutes:35, status:"active" as const },
  { id:"ProdGrowthSeries", name:"Product Growth Series", symbol:"Prd-γ", icon:"📈", color:"#C2410C", description:"Metrics, usability testing, competitive analysis, product launch.", engines:["ProductMetricsEngine","UsabilityTestEngine","CompProdEngine","ProdLaunchEngine"], estimatedMinutes:35, status:"active" as const },
  { id:"DesignSysSeries", name:"Design System Series", symbol:"Prd-δ", icon:"🎨", color:"#9A3412", description:"Design system architecture, feedback loops, product culture.", engines:["DesignSysEngine","FeedbackLoopEngine","UserResearchEngine","ProductDiscoveryEngine"], estimatedMinutes:30, status:"active" as const },
  // ── Research Series ────────────────────────────────────────────────────────
  { id:"ResFoundationSeries", name:"Research Foundation Series", symbol:"Res-α", icon:"🔬", color:"#64748B", description:"Primary research, market surveys, hypothesis generation, methodology.", engines:["PrimaryResearchEngine","MarketSurveyEngine","HypothesisEngine","ResearchMethodEngine"], estimatedMinutes:35, status:"active" as const },
  { id:"InsightDeliverySeries", name:"Insight Delivery Series", symbol:"Res-β", icon:"💡", color:"#475569", description:"Synthesis, experiment design, CI analysis, statistical analysis.", engines:["InsightSynthEngine","ExperimentDesignEngine","CIAnalysisEngine","StatisticalEngine"], estimatedMinutes:35, status:"active" as const },
  { id:"TrendsForesightSeries", name:"Trends & Foresight Series", symbol:"Res-γ", icon:"📡", color:"#334155", description:"Trend analysis, strategic foresight, ethnographic research, knowledge mgmt.", engines:["TrendsAnalysisEngine","ForesightEngine","EthnographicEngine","KnowledgeMgmtEngine"], estimatedMinutes:30, status:"active" as const },

  // ── Σ-Series — Universal Self-Completion ────────────────────────────────────
  { id:"sigma-completion", name:"Σ-Series — Universal Completion", symbol:"Σ", icon:"Σ", color:"#4f46e5", description:"The complete self-completion pipeline. Takes any idea through all 9 stages: intention resolution, gap detection, architecture generation, rule compilation, workflow synthesis, data modeling, connection mapping, validation, and final sign-off.", engines:["IntentionResolverEngine","GapDetectorEngine","ArchitectureGeneratorEngine","RuleCompilerEngine","WorkflowSynthesisEngine","DataSchemaEngine","ConnectionMapperEngine","CompletionValidatorEngine"], capabilities:["Full project completion","Zero undefined states","End-to-end architecture","All rules compiled","All workflows synthesized","Completeness certificate"], estimatedMinutes:45, status:"active" as const },

];

// ─── Engine Run ───────────────────────────────────────────────────────────────

export async function runEngine(opts: CapabilityRunOptions): Promise<void> {
  const { engineId, engineName, topic, context, mode, agentId, signal, onChunk, onDone, onError } = opts;

  try {
    const resp = await fetch("/api/openai/engine-run", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engineId, engineName: engineName ?? engineId, topic, context, mode, agentId }),
      signal,
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
