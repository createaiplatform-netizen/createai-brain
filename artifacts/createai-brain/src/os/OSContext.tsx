import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { PlatformStore, PlatformMode } from "@/engine/PlatformStore";

// ─── App Registry ──────────────────────────────────────────────────────────
export type AppId =
  | "chat" | "projects" | "tools" | "creator" | "people"
  | "documents" | "marketing" | "admin" | "family"
  | "integration" | "monetization" | "universal" | "simulation"
  | "business" | "entity" | "bizcreator" | "bizdev" | "projbuilder" | "projos"
  | "notifications" | "brainhub"
  | "researchhub" | "learningcenter" | "personastudio" | "datastudio" | "pricingstudio"
  | "traction" | "opportunity" | "imaginationlab" | "loreforge"
  | "narratoros" | "civilizationforge" | "ecologyforge"
  | "soundscape" | "timelineforge" | "mythweave"
  | "languageforge" | "magicsystem" | "urbanworld" | "warlore"
  | "characterforge" | "techforge" | "visualworld"
  | "religionforge" | "cosmologyforge" | "gameworld";

export interface AppDef {
  id: AppId;
  label: string;
  icon: string;
  color: string;
  description: string;
  category?: "core" | "tools" | "business" | "system";
  enabled?: boolean;
}

export const DEFAULT_APPS: AppDef[] = [
  { id: "chat",         label: "AI Chat",     icon: "💬", color: "#007AFF", description: "Talk to the CreateAI Brain",                  category: "core" },
  { id: "projects",     label: "Projects",    icon: "📁", color: "#5856D6", description: "All your projects & workspaces",               category: "core" },
  { id: "tools",        label: "Tools",       icon: "🛠️", color: "#FF9500", description: "Brochures, docs, pages & more",               category: "tools" },
  { id: "creator",      label: "Create",      icon: "✨", color: "#FF2D55", description: "Generate anything — docs, workflows, modules", category: "tools" },
  { id: "people",       label: "People",      icon: "👥", color: "#34C759", description: "Contacts, profiles & invites",                 category: "business" },
  { id: "documents",    label: "Documents",   icon: "📄", color: "#FF6B6B", description: "Files, forms & structured docs",              category: "business" },
  { id: "marketing",    label: "Marketing",   icon: "📣", color: "#FF2D55", description: "Brand, campaigns & content",                  category: "business" },
  { id: "admin",        label: "Admin",       icon: "⚙️", color: "#636366", description: "Platform control & settings",                 category: "system" },
  { id: "family",       label: "Family",      icon: "🏡", color: "#30B0C7", description: "Family-friendly simplified view",             category: "system" },
  { id: "integration",  label: "Integration", icon: "🔌", color: "#BF5AF2", description: "Connect & map existing tools",                category: "system" },
  { id: "monetization", label: "Monetize",    icon: "💰", color: "#FFD60A", description: "Storefront, plans & earnings",                category: "business" },
  { id: "simulation",   label: "Simulate",    icon: "🧪", color: "#a855f7", description: "Simulations, gap analysis & ad packets",              category: "tools"     },
  { id: "universal",    label: "Universal",   icon: "🌐", color: "#007AFF", description: "Universal interaction hub — all flows wired",         category: "system"    },
  { id: "business",     label: "BizEngine",   icon: "🏗️", color: "#f59e0b", description: "6-layer business design: model, ops, monetization",   category: "business"  },
  { id: "entity",       label: "EntityGen",   icon: "🧬", color: "#10b981", description: "7-layer entity engine: brand, model, ops, ecosystem, growth, compliance, expansion", category: "business" },
  { id: "bizcreator",   label: "BizUniverse", icon: "🌌", color: "#8b5cf6", description: "8-layer universe engine: knowledge, blueprint, monetization, ecosystem, visualization, expansion", category: "business" },
  { id: "bizdev",       label: "BizPlanner",  icon: "⚡", color: "#f97316", description: "9-section real-world business planner: grounded, executable, no filler", category: "business" },
  { id: "projbuilder",  label: "ProjBuilder", icon: "📋", color: "#06b6d4", description: "7-section project file builder: overview, modules, ops, documents, tools, pricing, launch", category: "business" },
  { id: "projos",       label: "ProjectOS",   icon: "📂", color: "#6366f1", description: "Universal project platform: dashboard, folder view, sub-apps, AI helper, modes, search, delete", category: "system" },
  { id: "notifications", label: "Notifications", icon: "🔔", color: "#6366f1", description: "System notifications, alerts, and activity updates", category: "system" },
  { id: "brainhub",      label: "Brain Hub",     icon: "⚡", color: "#6366f1", description: "All engines, meta-agents, and series — real AI capability center", category: "core" },
  { id: "researchhub",    label: "Research Hub",    icon: "🔬", color: "#007AFF", description: "Deep research, market analysis, and critical review — powered by Research, Market, and Critique engines", category: "tools" },
  { id: "learningcenter", label: "Learning Center", icon: "🎓", color: "#5856D6", description: "Learning paths, curricula, and mentorship — powered by Learning Engine and MENTOR meta-agent", category: "tools" },
  { id: "personastudio",  label: "Persona Studio",  icon: "👤", color: "#BF5AF2", description: "ICP creation, user personas, and communication strategy — powered by Persona and Communication engines", category: "business" },
  { id: "datastudio",     label: "Data Studio",     icon: "🗄️", color: "#30B0C7", description: "Data modeling, schema design, and pattern intelligence — powered by DataModel Engine and VECTOR", category: "tools" },
  { id: "pricingstudio",  label: "Pricing Studio",  icon: "💰", color: "#FFD60A", description: "Pricing strategy, packaging, and feedback frameworks — powered by Pricing and Feedback engines", category: "business" },
  { id: "traction",       label: "Traction",        icon: "📈", color: "#10b981", description: "Real traction signals, retention curves, growth analytics, and expansion velocity — all based on actual system activity", category: "system" },
  { id: "opportunity",    label: "Opportunities",    icon: "🎯", color: "#f59e0b", description: "Discover, score, and pursue high-value opportunities with AI intelligence, pipeline management, and strategic scanning", category: "business" },
  { id: "imaginationlab", label: "ImaginationLab",   icon: "✨", color: "#8b5cf6", description: "13 creative engines for story, character, world-building, creatures, superpowers, quests, dreamscapes, and magic systems — safe and fictional", category: "tools" },
  { id: "loreforge",          label: "LoreForge",            icon: "📜", color: "#d97706", description: "Deep lore creation studio — mythology, religion, ancient history, prophecies, factions, languages, curses, relics, and cosmology for fictional worlds", category: "tools" },
  { id: "narratoros",         label: "NarratorOS",           icon: "🎬", color: "#e11d48", description: "Cinematic narrative studio — scene design, dialogue, plot twists, act structure, conflict, theme, arc, monologue, and ensemble dynamics for fiction", category: "tools" },
  { id: "civilizationforge",  label: "CivilizationForge",    icon: "🏛️", color: "#d97706", description: "Society and culture builder — economy, political systems, social strata, architecture, law, trade routes, war doctrine, food culture, and institutions", category: "tools" },
  { id: "ecologyforge",       label: "EcologyForge",         icon: "🌿", color: "#15803d", description: "World ecology builder — biomes, ecosystems, apex creatures, extinction events, evolution, flora, fauna, climate, geology, and symbiosis for fictional worlds", category: "tools" },
  { id: "soundscape",         label: "SoundscapeStudio",     icon: "🎵", color: "#7c3aed", description: "Fictional sound and music designer — music theory, instruments, acoustic environments, ceremonial music, war music, lullabies, epic ballads, and sonic systems", category: "tools" },
  { id: "timelineforge",      label: "TimelineForge",        icon: "⏰", color: "#6366f1", description: "Temporal history studio — timelines, alternate history, parallel timelines, temporal paradoxes, historical divergences, dynasties, and civilizational collapse", category: "tools" },
  { id: "mythweave",          label: "MythweaveStudio",      icon: "🕸️", color: "#7c3aed", description: "Myth, archetype, and symbol designer — archetypes, symbol systems, motifs, folklore, rituals, tricksters, hero journeys, shadow narratives, and destiny systems", category: "tools" },
  { id: "languageforge",   label: "LanguageForge",      icon: "🔤", color: "#6366f1", description: "Constructed language studio — phonology, grammar, vocabulary, dialects, scripts, naming systems, sacred languages, and linguistic evolution for fictional worlds", category: "tools" },
  { id: "magicsystem",     label: "MagicSystemStudio",  icon: "✨", color: "#7c3aed", description: "Magic & power system design — rules, costs, spells, schools, corruption, artifacts, practitioners, forbidden magic, and sentient magic for fictional worlds", category: "tools" },
  { id: "urbanworld",      label: "UrbanWorldEngine",   icon: "🏙️", color: "#6366f1", description: "City & urban world design — layout, districts, underground, criminal networks, architecture, street culture, markets, and political geography", category: "tools" },
  { id: "warlore",         label: "WarloreStudio",      icon: "⚔️", color: "#dc2626", description: "Military & warfare design — armies, tactics, siege, naval warfare, spy networks, weapons, propaganda, peace treaties, mercenaries, and aftermath", category: "tools" },
  { id: "characterforge",  label: "CharacterForge",     icon: "🧠", color: "#be185d", description: "Deep character psychology — backstory, core wound, want vs need, moral code, voice, flaw, secrets, relationships, change arc, mask, obsession, and death", category: "tools" },
  { id: "techforge",       label: "TechForge",          icon: "🛸", color: "#0891b2", description: "Fictional technology design — tech levels, energy systems, transportation, weapons tech, medical tech, communication, surveillance, and tech revolutions", category: "tools" },
  { id: "visualworld",     label: "VisualWorldStudio",  icon: "🎨", color: "#be185d", description: "Visual design language — color palettes, fashion, heraldry, flags, motifs, art movements, propaganda art, funerary art, body marking, masks, and costumes", category: "tools" },
  { id: "religionforge",   label: "ReligionForge",      icon: "🙏", color: "#4f46e5", description: "Belief system & theology design — theology, deities, sacred texts, clergy, rituals, schisms, heresies, saints, afterlife, prayer, miracles, and holy wars", category: "tools" },
  { id: "cosmologyforge",  label: "CosmologyForge",     icon: "🌌", color: "#6366f1", description: "Universe physics & metaphysics — cosmology, planes of existence, creation myths, deity hierarchies, death mechanics, souls, cosmic conflict, void, and ascension", category: "tools" },
  { id: "gameworld",       label: "GameWorldStudio",    icon: "🎲", color: "#d97706", description: "Games & play culture design — board games, sports, gambling, children's games, deadly games, gladiators, championships, stadium culture, and wager culture", category: "tools" },
];

export const ALL_APPS = DEFAULT_APPS;

// ─── Preference Brain ──────────────────────────────────────────────────────
export type ToneOption = "Professional" | "Plain Language" | "Executive Brief" | "Educational" | "Empowering" | "Clinical Structural";
export type LanguageOption = "English" | "Tamil" | "Tamil–English" | "Spanish" | "French";
export type StyleOption = "Guided" | "Smart" | "Fast" | "Adaptive";

export interface PreferenceBrain {
  tone: ToneOption;
  language: LanguageOption;
  interactionStyle: StyleOption;
  interests: string[];
  groupMembers: string[];
  zeroOverwhelmMode: boolean;
  revenueShare: number;
}

const DEFAULT_PREFERENCES: PreferenceBrain = {
  tone: "Empowering",
  language: "English",
  interactionStyle: "Adaptive",
  interests: ["Healthcare", "Marketing", "Operations"],
  groupMembers: [],
  zeroOverwhelmMode: false,
  revenueShare: 25,
};

const PREFS_LS_KEY = "createai-brain-prefs-v1";

function loadPrefsFromLS(): PreferenceBrain {
  try {
    const raw = localStorage.getItem(PREFS_LS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function savePrefsToLS(prefs: PreferenceBrain) {
  try { localStorage.setItem(PREFS_LS_KEY, JSON.stringify(prefs)); } catch {}
}

// ─── Intent Routing ────────────────────────────────────────────────────────
const INTENT_MAP: { keywords: string[]; target: AppId }[] = [
  { keywords: ["chat", "talk", "ask", "message", "brain"],                target: "chat" },
  { keywords: ["create", "generate", "build", "make", "write"],           target: "creator" },
  { keywords: ["project", "workspace", "healthcare", "medical"],          target: "projects" },
  { keywords: ["tool", "brochure", "document", "page", "generator"],      target: "tools" },
  { keywords: ["simulate", "simulation", "analyze", "gap", "scenario", "stress", "ad packet", "advertising"], target: "simulation" },
  { keywords: ["marketing", "campaign", "brand", "social", "email"],      target: "marketing" },
  { keywords: ["people", "contact", "invite", "person"],                  target: "people" },
  { keywords: ["file", "doc", "document"],                                 target: "documents" },
  { keywords: ["notification", "alert", "inbox", "updates"],              target: "notifications" },
  { keywords: ["brain hub", "capability", "engines", "meta-agent", "oracle", "forge", "nexus", "sentinel", "pulse", "vector", "series", "omega", "phi"], target: "brainhub" },
  { keywords: ["opportunity", "opportunities", "opportunity engine", "opp", "pipeline", "discover opportunities", "scan opportunities", "opportunity score", "market opportunity", "revenue opportunity", "partnership opportunity"], target: "opportunity" },
  { keywords: ["imagination", "imaginationlab", "story", "character", "worldbuilding", "creature", "superpower", "adventure", "comic", "quest", "fiction", "game idea", "creative", "storytelling", "world builder", "imagine", "dreamscape", "magic system"], target: "imaginationlab" },
  { keywords: ["loreforge", "lore", "mythology", "prophecy", "legend", "religion", "ancient history", "faction", "language engine", "curse", "prophet", "relic", "lorekeeper", "cosmology", "era", "pantheon", "deep lore"], target: "loreforge" },
  { keywords: ["narratoros", "narrator", "scene", "dialogue", "plot twist", "act structure", "conflict engine", "monologue", "ensemble", "narrative voice", "subplot", "screenplay", "cinematic"], target: "narratoros" },
  { keywords: ["civilizationforge", "civilization", "society", "political system", "social strata", "architecture style", "law system", "trade route", "warfare", "food culture", "fashion era", "sports culture", "institution"], target: "civilizationforge" },
  { keywords: ["ecologyforge", "ecology", "biome", "ecosystem", "apex creature", "extinction", "evolution", "flora", "fauna", "climate system", "geology", "oceanic", "symbiosis", "disaster", "migration"], target: "ecologyforge" },
  { keywords: ["soundscape", "soundscapestudio", "fictional music", "instrument forge", "acoustic environment", "ceremonial music", "war music", "lullaby", "epic ballad", "silence engine", "nature sound", "crowd sound", "sonic weapon", "harmony system"], target: "soundscape" },
  { keywords: ["timelineforge", "timeline", "alternate history", "parallel timeline", "temporal paradox", "historical divergence", "ancestral line", "future history", "calendar system", "age transition", "generation cycle", "collapse timeline", "chronology"], target: "timelineforge" },
  { keywords: ["mythweave", "mythweavestudio", "archetype", "symbol system", "motif", "folklore", "ritual", "trickster", "hero journey", "shadow narrative", "transformation", "threshold", "mentor archetype", "oracle archetype", "destiny"], target: "mythweave" },
  { keywords: ["languageforge", "conlang", "constructed language", "phonology", "grammar", "vocabulary", "dialect", "slang", "script", "writing system", "naming system", "sacred language", "sign language", "proverb", "poetry form", "linguistic evolution"], target: "languageforge" },
  { keywords: ["magicsystem", "magic system", "magic rule", "spell", "magic cost", "school of magic", "magic corruption", "artifact", "practitioner", "forbidden magic", "magic ecology", "sentient magic", "magic politics", "magic evolution"], target: "magicsystem" },
  { keywords: ["urbanworld", "city design", "city layout", "district", "underground city", "criminal network", "architecture style", "street culture", "market economy", "slum", "elite quarter", "transportation", "city ghost", "boundary", "urban"], target: "urbanworld" },
  { keywords: ["warlore", "war lore", "army design", "tactics", "siege warfare", "naval warfare", "spy network", "weapon forge", "propaganda", "peace treaty", "mercenary", "war economy", "military tradition", "war crime", "aftermath", "warfare"], target: "warlore" },
  { keywords: ["characterforge", "character forge", "backstory", "core wound", "character flaw", "character voice", "secret", "relationship web", "change arc", "mask persona", "obsession", "character decision", "character death", "want vs need", "moral code"], target: "characterforge" },
  { keywords: ["techforge", "tech forge", "tech level", "energy system", "transportation tech", "weapon tech", "medical tech", "communication tech", "surveillance tech", "agricultural tech", "building tech", "ai equivalent", "tech failure", "tech taboo", "tech revolution"], target: "techforge" },
  { keywords: ["visualworld", "visual world", "color palette", "fashion cycle", "heraldry", "flag design", "visual motif", "art movement", "propaganda art", "funerary art", "body marking", "mask design", "costume", "street art", "forbidden image"], target: "visualworld" },
  { keywords: ["religionforge", "religion forge", "theology", "deity", "sacred text", "clergy", "ritual", "schism", "heresy", "saint", "afterlife", "prayer system", "miracle", "religious war", "atheism", "belief system", "faith"], target: "religionforge" },
  { keywords: ["cosmologyforge", "cosmology forge", "universe physics", "plane of existence", "creation myth", "deity hierarchy", "death mechanics", "soul system", "cosmic conflict", "void", "liminal plane", "ascension", "prophecy mechanics", "universe collapse", "multiverse"], target: "cosmologyforge" },
  { keywords: ["gameworld", "game world", "board game", "sport design", "gambling", "children game", "deadly game", "gladiator", "trading card", "game rules", "stadium culture", "championship", "fixing", "game ban", "wager culture", "play culture"], target: "gameworld" },
  { keywords: ["money", "monetize", "revenue", "earn", "funnel", "offer"],target: "monetization" },
  { keywords: ["admin", "settings", "control", "mode", "user"],           target: "admin" },
  { keywords: ["family", "home", "personal"],                              target: "family" },
  { keywords: ["integration", "connect", "api", "third-party"],           target: "integration" },
  { keywords: ["business", "bizengine", "biz engine", "business plan", "business model", "startup", "venture", "monetization model", "operations design", "expansion", "opportunity"],  target: "business" },
  { keywords: ["entity", "entitygen", "entity engine", "brand", "branding", "positioning", "product idea", "platform idea", "business entity", "build entity", "brand strategy", "ecosystem", "compliance", "growth strategy"], target: "entity" },
  { keywords: ["universe", "bizcreator", "biz universe", "concept", "concept expansion", "idea", "visualize", "visualization", "digital twin", "vr", "ar", "knowledge context", "business system", "expand idea", "expand concept", "multi-layer"], target: "bizcreator" },
  { keywords: ["bizdev", "bizplanner", "biz planner", "biz dev", "business plan", "execution plan", "real world plan", "executable", "business development", "go to market", "gtm", "acquisition strategy", "legal risk", "tools systems", "target customers"], target: "bizdev" },
  { keywords: ["projbuilder", "project builder", "project file", "project plan", "healthcare platform", "construction project", "logistics hub", "sop", "standard operating procedure", "intake form", "phone script", "training outline", "launch plan", "30 days"], target: "projbuilder" },
  { keywords: ["projos", "project os", "universal platform", "project dashboard", "folder view", "sub app", "project manager", "project management", "demo mode", "test mode", "live mode", "all projects", "organize projects", "hunting", "farming", "project folder"], target: "projos" },
];

function routeIntentFn(intent: string): AppId | null {
  const lower = intent.toLowerCase();
  for (const mapping of INTENT_MAP) {
    if (mapping.keywords.some(k => lower.includes(k))) return mapping.target;
  }
  return null;
}

// ─── App icon/label map for recent activity ────────────────────────────────
const APP_META: Record<AppId, { icon: string; label: string }> = {
  chat:         { icon: "💬", label: "AI Chat" },
  projects:     { icon: "📁", label: "Projects" },
  tools:        { icon: "🛠️", label: "Tools" },
  creator:      { icon: "✨", label: "Create" },
  people:       { icon: "👥", label: "People" },
  documents:    { icon: "📄", label: "Documents" },
  marketing:    { icon: "📣", label: "Marketing" },
  admin:        { icon: "⚙️", label: "Admin" },
  family:       { icon: "🏡", label: "Family" },
  integration:  { icon: "🔌", label: "Integration" },
  monetization: { icon: "💰", label: "Monetize" },
  simulation:   { icon: "🧪", label: "Simulate" },
  universal:    { icon: "🌐", label: "Universal" },
  business:     { icon: "🏗️", label: "BizEngine" },
  entity:       { icon: "🧬", label: "EntityGen" },
  bizcreator:   { icon: "🌌", label: "BizUniverse" },
  bizdev:       { icon: "⚡", label: "BizPlanner" },
  projbuilder:  { icon: "📋", label: "ProjBuilder" },
  projos:       { icon: "📂", label: "ProjectOS" },
  notifications:  { icon: "🔔", label: "Notifications" },
  brainhub:       { icon: "⚡", label: "Brain Hub" },
  researchhub:    { icon: "🔬", label: "Research Hub" },
  learningcenter: { icon: "🎓", label: "Learning Center" },
  personastudio:  { icon: "👤", label: "Persona Studio" },
  datastudio:     { icon: "🗄️", label: "Data Studio" },
  pricingstudio:  { icon: "💰", label: "Pricing Studio" },
  traction:       { icon: "📈", label: "Traction" },
  opportunity:    { icon: "🎯", label: "Opportunities" },
  imaginationlab:     { icon: "✨", label: "ImaginationLab" },
  loreforge:          { icon: "📜", label: "LoreForge" },
  narratoros:         { icon: "🎬", label: "NarratorOS" },
  civilizationforge:  { icon: "🏛️", label: "CivilizationForge" },
  ecologyforge:       { icon: "🌿", label: "EcologyForge" },
  soundscape:         { icon: "🎵", label: "SoundscapeStudio" },
  timelineforge:      { icon: "⏰", label: "TimelineForge" },
  mythweave:          { icon: "🕸️", label: "MythweaveStudio" },
  languageforge:   { icon: "🔤", label: "LanguageForge" },
  magicsystem:     { icon: "✨", label: "MagicSystemStudio" },
  urbanworld:      { icon: "🏙️", label: "UrbanWorldEngine" },
  warlore:         { icon: "⚔️", label: "WarloreStudio" },
  characterforge:  { icon: "🧠", label: "CharacterForge" },
  techforge:       { icon: "🛸", label: "TechForge" },
  visualworld:     { icon: "🎨", label: "VisualWorldStudio" },
  religionforge:   { icon: "🙏", label: "ReligionForge" },
  cosmologyforge:  { icon: "🌌", label: "CosmologyForge" },
  gameworld:       { icon: "🎲", label: "GameWorldStudio" },
};

// ─── OS Context value ───────────────────────────────────────────────────────
interface OSContextValue {
  activeApp: AppId | null;
  sidebarCollapsed: boolean;
  history: AppId[];
  appRegistry: AppDef[];
  preferences: PreferenceBrain;
  platformMode: PlatformMode;
  unreadCount: number;
  openApp: (id: AppId) => void;
  closeApp: () => void;
  goBack: () => void;
  toggleSidebar: () => void;
  routeIntent: (intent: string) => AppId | null;
  updatePreferences: (patch: Partial<PreferenceBrain>) => void;
  registerApp: (app: AppDef) => void;
  setPlatformMode: (mode: PlatformMode) => void;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const OSContext = createContext<OSContextValue | null>(null);

export function OSProvider({ children }: { children: React.ReactNode }) {
  const [activeApp, setActiveApp]         = useState<AppId | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [history, setHistory]             = useState<AppId[]>([]);
  const [appRegistry, setAppRegistry]     = useState<AppDef[]>(DEFAULT_APPS);
  const [preferences, setPreferences]     = useState<PreferenceBrain>(() => loadPrefsFromLS());
  const [platformMode, setPlatformModeState] = useState<PlatformMode>(() => PlatformStore.getMode());
  const [unreadCount, setUnreadCount]     = useState(0);
  // Prevent server save from re-triggering on server-hydration
  const serverHydrated = useRef(false);

  // ── Sync mode from custom events ──
  useEffect(() => {
    const handler = (e: Event) => {
      setPlatformModeState((e as CustomEvent<PlatformMode>).detail);
    };
    window.addEventListener("cai:mode-change", handler);
    return () => window.removeEventListener("cai:mode-change", handler);
  }, []);

  // ── On mount: hydrate preferences from server (server wins over localStorage) ──
  useEffect(() => {
    fetch("/api/user/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.preferences && typeof data.preferences === "object") {
          const merged: PreferenceBrain = { ...DEFAULT_PREFERENCES, ...data.preferences };
          setPreferences(merged);
          savePrefsToLS(merged);
        }
        // Load unread notification count
        return fetch("/api/notifications?limit=50", { credentials: "include" });
      })
      .then(r => r && r.ok ? r.json() : null)
      .then(data => {
        if (data?.notifications) {
          const unread = (data.notifications as Array<{ readAt: string | null }>)
            .filter(n => !n.readAt).length;
          setUnreadCount(unread);
        }
        serverHydrated.current = true;
      })
      .catch(() => { serverHydrated.current = true; });
  }, []);

  const openApp = useCallback((id: AppId) => {
    setHistory(prev => activeApp ? [...prev, activeApp] : prev);
    setActiveApp(id);
    const meta = APP_META[id];
    if (meta) PlatformStore.pushRecent({ appId: id, label: meta.label, icon: meta.icon });
    // Clear badge when notifications opens
    if (id === "notifications") {
      setUnreadCount(0);
      fetch("/api/notifications/read-all", { method: "PUT", credentials: "include" }).catch(() => {});
    }
  }, [activeApp]);

  const closeApp = useCallback(() => {
    setActiveApp(null);
    setHistory([]);
  }, []);

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setActiveApp(prev);
    } else {
      setActiveApp(null);
    }
  }, [history]);

  const toggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), []);

  const routeIntent = useCallback((intent: string): AppId | null => routeIntentFn(intent), []);

  const updatePreferences = useCallback((patch: Partial<PreferenceBrain>) => {
    setPreferences(prev => {
      const next = { ...prev, ...patch };
      // Persist to localStorage immediately
      savePrefsToLS(next);
      // Fire-and-forget to server (only after initial server hydration)
      if (serverHydrated.current) {
        fetch("/api/user/me", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: next }),
        }).catch(() => {});
      }
      return next;
    });
  }, []);

  const registerApp = useCallback((app: AppDef) => {
    setAppRegistry(prev => prev.find(a => a.id === app.id) ? prev : [...prev, app]);
  }, []);

  const setPlatformMode = useCallback((mode: PlatformMode) => {
    PlatformStore.setMode(mode);
    setPlatformModeState(mode);
  }, []);

  return (
    <OSContext.Provider value={{
      activeApp, sidebarCollapsed, history, appRegistry, preferences, platformMode,
      unreadCount, setUnreadCount,
      openApp, closeApp, goBack, toggleSidebar, routeIntent,
      updatePreferences, registerApp, setPlatformMode,
    }}>
      {children}
    </OSContext.Provider>
  );
}

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error("useOS must be used within OSProvider");
  return ctx;
}
