// ═══════════════════════════════════════════════════════════════════════════
// CAPABILITY ENGINE — Central Orchestrator for CreateAI Brain
// Registers all 25+ engines, 6 meta-agents, and all series.
// Connects to real AI API for generation.
// Auto-saves outputs to /api/documents.
// ═══════════════════════════════════════════════════════════════════════════

export type EngineCategory =
  | "universal" | "meta-agent" | "intelligence" | "creative" | "workflow"
  | "integration" | "data" | "platform" | "series";

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
