/**
 * projectCreationOrchestrator.ts
 *
 * Automatically generates full projects using existing engines whenever a user
 * describes an idea, goal, business, workflow, world, or domain.
 *
 * Detection order:
 *   1. Vertical engine (healthcare, construction, energy, etc.)
 *   2. World-building engines (cosmology, civilization, lore, etc.)
 *   3. Intelligence engines (brain, oracle, insight, aiStrategy, imagination)
 *   4. Universe OS layers (identity, relationships, activation, meaning)
 *   5. AI generation of structured project object
 *   6. Scoring engine snapshot
 */

import { openai }          from "@workspace/integrations-openai-ai-server";
import { getPlatformScores } from "../platform/platform_score.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrchestratorWorkflow {
  id:          string;
  name:        string;
  trigger:     string;
  steps:       string[];
  engine:      string;
  priority:    "high" | "medium" | "low";
}

export interface OrchestratorDataModel {
  name:        string;
  description: string;
  fields:      Array<{ name: string; type: string; required: boolean; description: string }>;
  relations:   string[];
}

export interface OrchestratorUniverseLayer {
  layer:      string;
  role:       string;
  binding:    string;
  activated:  boolean;
}

export interface OrchestratorEngineEntry {
  id:          string;
  label:       string;
  type:        string;
  status:      "active" | "standby" | "recommended";
  domain:      string;
  source:      "vertical" | "world" | "intelligence" | "universe";
}

export interface OrchestrationResult {
  id:                    string;
  description:           string;
  projectName:           string;
  domain:                string;
  detectedVertical:      string | null;
  detectedVerticalLabel: string | null;
  detectedWorldEngines:  string[];
  intelligenceEngines:   string[];
  workflows:             OrchestratorWorkflow[];
  dataModels:            OrchestratorDataModel[];
  universeLayers:        OrchestratorUniverseLayer[];
  activationChain:       string[];
  recommendedNextSteps:  string[];
  engineRegistryEntries: OrchestratorEngineEntry[];
  scoringSnapshot:       ReturnType<typeof getPlatformScores>;
  generatedAt:           string;
  status:                "complete" | "partial" | "error";
  error?:                string;
}

// ─── Vertical Engine Registry ─────────────────────────────────────────────────

interface VerticalDef {
  id:      string;
  label:   string;
  domain:  string;
  route:   string;
  keywords: RegExp;
}

const VERTICALS: VerticalDef[] = [
  {
    id: "healthcare", label: "Healthcare", domain: "Health & Medicine", route: "/api/healthcare",
    keywords: /\b(health(care)?|medical|patient|clinic|hospital|doctor|nurse|ehr|fhir|therapy|diagnos|pharma|drug|prescription|wellness|mental health|telehealth|surgery)\b/i,
  },
  {
    id: "construction", label: "Construction", domain: "Construction & Real Estate", route: "/api/construction",
    keywords: /\b(construct|build(ing)?|contractor|site|blueprint|permit|zoning|architect|real estate|property|renovation|remodelel?|foundation|structural|civil engineering)\b/i,
  },
  {
    id: "energy", label: "Energy", domain: "Energy & Utilities", route: "/api/energy",
    keywords: /\b(energy|solar|wind|grid|power|electric(ity)?|renewable|utility|meter|emission|carbon|fossil|fuel|natural gas|battery|storage|kwh|mwh)\b/i,
  },
  {
    id: "education", label: "Education", domain: "Education & Learning", route: "/api/education-engine",
    keywords: /\b(educat|learn(ing)?|school|course|curriculum|student|teacher|classroom|tutoring|lms|e-learning|training|certification|academic|university|college|stem)\b/i,
  },
  {
    id: "agriculture", label: "Agriculture", domain: "Agriculture & Food", route: "/api/agriculture",
    keywords: /\b(farm(ing)?|agriculture|crop|harvest|livestock|irrigation|soil|fertilizer|organic|greenhouse|horticulture|aquaculture|food production|agritech)\b/i,
  },
  {
    id: "transportation", label: "Transportation", domain: "Transportation & Logistics", route: "/api/transportation",
    keywords: /\b(transport(ation)?|logistics|fleet|shipping|delivery|route|warehouse|supply chain|freight|last.?mile|trucking|dispatch|vehicle|cargo|gps tracking)\b/i,
  },
  {
    id: "manufacturing", label: "Manufacturing", domain: "Manufacturing & Production", route: "/api/manufacturing",
    keywords: /\b(manufactur|factory|production|assembly|quality control|lean|iso|inventory|supply chain|machining|fabrication|industrial|plant|equipment)\b/i,
  },
  {
    id: "hospitality", label: "Hospitality", domain: "Hospitality & Tourism", route: "/api/hospitality",
    keywords: /\b(hotel|hospitality|restaurant|resort|tourism|booking|reservation|guest|check.?in|room|amenity|concierge|event(s)?|catering|venue|airbnb)\b/i,
  },
  {
    id: "insurance", label: "Insurance", domain: "Insurance & Risk", route: "/api/insurance",
    keywords: /\b(insuran(ce)?|premium|claim|policy|underwriting|actuarial|risk assessment|deductible|coverage|broker|reinsurance|life insurance|auto insurance|home insurance)\b/i,
  },
  {
    id: "government", label: "Government", domain: "Government & Civic", route: "/api/government",
    keywords: /\b(government|civic|municipal|public sector|regulation|compliance|permit|tax|budget|city|county|federal|state agency|department|policy|civil service)\b/i,
  },
  {
    id: "nonprofitEngine", label: "Nonprofit", domain: "Nonprofit & Social Impact", route: "/api/nonprofit",
    keywords: /\b(nonprofit|ngo|charity|donation|grant|volunteer|community|social impact|501c3|fundrais|philanthropy|advocacy|humanitarian|mission-driven)\b/i,
  },
  {
    id: "homeServicesEngine", label: "Home Services", domain: "Home Services", route: "/api/home-services",
    keywords: /\b(home service|plumb(er|ing)|electric(ian)?|hvac|landscap|cleaning|pest control|handyman|roofing|pool|appliance repair|lawn care|window|carpet)\b/i,
  },
];

// ─── World-Building Engine Registry ──────────────────────────────────────────

interface WorldEngineDef {
  id:      string;
  label:   string;
  keywords: RegExp;
}

const WORLD_ENGINES: WorldEngineDef[] = [
  { id: "cosmologyforge",    label: "CosmologyForge",    keywords: /\b(cosmolog|universe|galaxy|cosmos|celestial|space|planet|star system|dimension|multiverse)\b/i },
  { id: "civilizationforge", label: "CivilizationForge", keywords: /\b(civiliz|society|culture|empire|nation|government|political system|economy|social structure)\b/i },
  { id: "loreforge",         label: "LoreForge",         keywords: /\b(lore|history|legend|myth|chronicle|ancient|epic|tradition|heritage|story world)\b/i },
  { id: "characterforge",    label: "CharacterForge",    keywords: /\b(character|persona|hero|villain|archetype|protagonist|npc|role|identity|avatar)\b/i },
  { id: "techforge",         label: "TechForge",         keywords: /\b(technology|invention|sci-fi|speculative|futurist|innovation|machine|artificial|cyberpunk|steampunk|biotech)\b/i },
  { id: "timelineforge",     label: "TimelineForge",     keywords: /\b(timeline|history|era|epoch|period|century|future|past|alternate history|chronology|event sequence)\b/i },
  { id: "ecologyforge",      label: "EcologyForge",      keywords: /\b(ecology|ecosystem|biome|species|flora|fauna|environment|nature|climate|habitat|biodiversity)\b/i },
  { id: "mythweave",         label: "MythWeave",         keywords: /\b(myth|legend|folklore|deity|god|goddess|pantheon|ritual|sacred|divine|supernatural|spirit)\b/i },
  { id: "urbanworld",        label: "UrbanWorld",        keywords: /\b(city|urban|metropolis|district|neighborhood|architecture|infrastructure|street|skyline|quarter)\b/i },
  { id: "gameworld",         label: "GameWorld",         keywords: /\b(game|rpg|quest|dungeon|level|map|player|campaign|encounter|rule system|world building|sandbox)\b/i },
  { id: "languageforge",     label: "LanguageForge",     keywords: /\b(language|linguistics|dialect|conlang|grammar|vocabulary|script|writing system|phonology|tongue)\b/i },
  { id: "warlore",           label: "WarLore",           keywords: /\b(war|battle|military|conflict|army|strategy|tactics|siege|campaign|faction|alliance|weapon|fortress)\b/i },
];

// ─── Intelligence Engine Registry ─────────────────────────────────────────────

const INTELLIGENCE_ENGINES = [
  { id: "brain",          label: "Brain",              role: "coordination" },
  { id: "oracle",         label: "Intelligence Oracle", role: "synthesis" },
  { id: "insightEngine",  label: "Insight Engine",     role: "pattern detection" },
  { id: "aiStrategy",     label: "AI Strategy",        role: "strategic planning" },
  { id: "imagination",    label: "Imagination",        role: "creative ideation" },
];

// ─── Universe Layer Assignments ────────────────────────────────────────────────

const UNIVERSE_LAYER_POOL = [
  { layer: "identityLayer",      role: "Establishes the project\u2019s unique identity and authoring context",        binding: "primary" },
  { layer: "meaningLayer",       role: "Anchors the project\u2019s purpose and intended impact",                       binding: "primary" },
  { layer: "activationLayer",    role: "Defines conditions under which project capabilities become active",            binding: "primary" },
  { layer: "relationshipLayer",  role: "Maps relationships between entities, users, and external systems",             binding: "secondary" },
  { layer: "narrativeLayer",     role: "Frames the project\u2019s story arc and communication flow",                   binding: "secondary" },
  { layer: "integrationLoop",    role: "Connects the project to external services and platform integrations",          binding: "secondary" },
  { layer: "ecosystemLayer",     role: "Positions the project within its broader market or domain ecosystem",          binding: "tertiary" },
  { layer: "expansionLayer",     role: "Tracks growth vectors and capability expansion over time",                     binding: "tertiary" },
  { layer: "experienceLayer",    role: "Defines the user\u2019s journey and interaction surface",                      binding: "tertiary" },
  { layer: "continuityLayer",    role: "Ensures state, data, and context persist across sessions",                     binding: "support" },
  { layer: "presenceLayer",      role: "Manages the project\u2019s visible surface and discovery footprint",           binding: "support" },
  { layer: "securityLayer",      role: "Applies access control, data protection, and compliance rules",                binding: "support" },
];

// ─── Detection Helpers ────────────────────────────────────────────────────────

function detectVertical(input: string): VerticalDef | null {
  for (const v of VERTICALS) {
    if (v.keywords.test(input)) return v;
  }
  return null;
}

function detectWorldEngines(input: string): WorldEngineDef[] {
  return WORLD_ENGINES.filter(e => e.keywords.test(input));
}

function assignUniverseLayers(
  worldEngines: WorldEngineDef[],
  vertical: VerticalDef | null,
): OrchestratorUniverseLayer[] {
  const count = worldEngines.length > 0 ? 9 : 6;
  return UNIVERSE_LAYER_POOL.slice(0, count).map(l => ({
    layer:     l.layer,
    role:      l.role,
    binding:   l.binding,
    activated: l.binding === "primary" || l.binding === "secondary",
  }));
}

function buildActivationChain(
  vertical: VerticalDef | null,
  worldEngines: WorldEngineDef[],
  universeLayers: OrchestratorUniverseLayer[],
): string[] {
  const chain: string[] = [];
  chain.push("identityLayer");
  chain.push("meaningLayer");
  if (vertical) chain.push(vertical.id);
  for (const we of worldEngines.slice(0, 3)) chain.push(we.id);
  chain.push(...universeLayers.filter(l => l.activated && !chain.includes(l.layer)).map(l => l.layer));
  chain.push("activationLayer");
  chain.push("integrationLoop");
  chain.push("expansionLayer");
  return chain;
}

function buildEngineRegistryEntries(
  vertical: VerticalDef | null,
  worldEngines: WorldEngineDef[],
): OrchestratorEngineEntry[] {
  const entries: OrchestratorEngineEntry[] = [];
  if (vertical) {
    entries.push({
      id: vertical.id, label: vertical.label, type: "vertical",
      status: "active", domain: vertical.domain, source: "vertical",
    });
  }
  for (const we of worldEngines) {
    entries.push({
      id: we.id, label: we.label, type: "world",
      status: "active", domain: "World Building", source: "world",
    });
  }
  for (const ie of INTELLIGENCE_ENGINES) {
    entries.push({
      id: ie.id, label: ie.label, type: "intelligence",
      status: "active", domain: "Intelligence", source: "intelligence",
    });
  }
  entries.push(
    { id: "meaningLayer",      label: "Meaning Layer",      type: "universe", status: "active",   domain: "Universe OS", source: "universe" },
    { id: "identityLayer",     label: "Identity Layer",     type: "universe", status: "active",   domain: "Universe OS", source: "universe" },
    { id: "activationLayer",   label: "Activation Layer",   type: "universe", status: "active",   domain: "Universe OS", source: "universe" },
    { id: "integrationLoop",   label: "Integration Loop",   type: "universe", status: "standby",  domain: "Universe OS", source: "universe" },
    { id: "expansionLayer",    label: "Expansion Layer",    type: "universe", status: "standby",  domain: "Universe OS", source: "universe" },
  );
  return entries;
}

// ─── AI Generation System Prompt ─────────────────────────────────────────────

function buildSystemPrompt(
  vertical: VerticalDef | null,
  worldEngines: WorldEngineDef[],
): string {
  const vLabel = vertical ? vertical.label : "General";
  const wLabels = worldEngines.map(w => w.label).join(", ") || "none";
  return `You are a project creation AI for the CreateAI Brain OS platform.
Your role: generate a complete, structured, production-ready project definition from a user description.
Detected vertical: ${vLabel}.
Detected world-building engines: ${wLabels}.

Return ONLY valid JSON — no markdown, no code fences, no commentary.
The JSON must match this exact structure:
{
  "projectName": "string — specific, clear project name",
  "domain": "string — primary domain",
  "workflows": [
    {
      "id": "string",
      "name": "string",
      "trigger": "string — what starts this workflow",
      "steps": ["step 1", "step 2", "step 3", "step 4"],
      "engine": "string — which engine powers it",
      "priority": "high|medium|low"
    }
  ],
  "dataModels": [
    {
      "name": "string",
      "description": "string",
      "fields": [
        { "name": "string", "type": "string", "required": true, "description": "string" }
      ],
      "relations": ["string"]
    }
  ],
  "recommendedNextSteps": ["step 1", "step 2", "step 3", "step 4", "step 5"]
}
Rules:
- workflows: minimum 3, maximum 6. Each has 4-6 steps. Steps are specific, actionable, real.
- dataModels: minimum 2, maximum 5. Fields are specific to the domain.
- recommendedNextSteps: exactly 5. Specific, ordered, immediately actionable.
- No placeholders, no generic content. All content specific to the described project and detected domain.
- projectName: no more than 6 words, specific to the described project.`;
}

// ─── Main Orchestrator Function ───────────────────────────────────────────────

export async function orchestrateProjectCreation(input: {
  description: string;
  userId:      string;
  role?:       string;
}): Promise<OrchestrationResult> {
  const id          = crypto.randomUUID();
  const generatedAt = new Date().toISOString();
  const desc        = input.description.trim();

  // 1. Detection
  const vertical       = detectVertical(desc);
  const worldEngines   = detectWorldEngines(desc);
  const intelligenceEngines = INTELLIGENCE_ENGINES.map(e => e.id);

  // 2. Universe layers + activation chain
  const universeLayers = assignUniverseLayers(worldEngines, vertical);
  const activationChain = buildActivationChain(vertical, worldEngines, universeLayers);

  // 3. Engine registry
  const engineRegistryEntries = buildEngineRegistryEntries(vertical, worldEngines);

  // 4. Scoring snapshot
  const scoringSnapshot = getPlatformScores();

  // 5. AI generation
  let projectName          = desc.slice(0, 40);
  let domain               = vertical?.domain ?? (worldEngines[0] ? "World Building" : "General");
  let workflows:            OrchestratorWorkflow[]    = [];
  let dataModels:           OrchestratorDataModel[]   = [];
  let recommendedNextSteps: string[] = [];
  let status: OrchestrationResult["status"] = "complete";
  let error: string | undefined;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 3000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(vertical, worldEngines) },
        { role: "user",   content: `Project description: ${desc}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      projectName?: string;
      domain?: string;
      workflows?: unknown[];
      dataModels?: unknown[];
      recommendedNextSteps?: unknown[];
    };

    if (parsed.projectName) projectName = parsed.projectName;
    if (parsed.domain)      domain      = parsed.domain;

    if (Array.isArray(parsed.workflows)) {
      workflows = (parsed.workflows as OrchestratorWorkflow[]).map((w, i) => ({
        id:       w.id ?? `wf-${i + 1}`,
        name:     w.name ?? `Workflow ${i + 1}`,
        trigger:  w.trigger ?? "manual",
        steps:    Array.isArray(w.steps) ? w.steps : [],
        engine:   w.engine ?? (vertical?.id ?? "brain"),
        priority: (["high","medium","low"].includes(w.priority ?? "") ? w.priority : "medium") as OrchestratorWorkflow["priority"],
      }));
    }

    if (Array.isArray(parsed.dataModels)) {
      dataModels = (parsed.dataModels as OrchestratorDataModel[]).map(m => ({
        name:        m.name ?? "Model",
        description: m.description ?? "",
        fields:      Array.isArray(m.fields) ? m.fields : [],
        relations:   Array.isArray(m.relations) ? m.relations : [],
      }));
    }

    if (Array.isArray(parsed.recommendedNextSteps)) {
      recommendedNextSteps = (parsed.recommendedNextSteps as string[]).slice(0, 5);
    }

  } catch (err) {
    status = "partial";
    error  = String(err);
    // Provide minimal fallback structure so UI never receives empty arrays
    workflows = [
      {
        id: "wf-1", name: "Core Workflow", trigger: "User initiates project",
        steps: ["Define scope", "Configure engines", "Set up data models", "Activate universe layers", "Deploy"],
        engine: vertical?.id ?? "brain", priority: "high",
      },
    ];
    dataModels = [
      {
        name: "Project", description: "Core project data model",
        fields: [
          { name: "id", type: "uuid", required: true, description: "Unique identifier" },
          { name: "name", type: "string", required: true, description: "Project name" },
          { name: "status", type: "enum", required: true, description: "Current status" },
          { name: "created_at", type: "timestamp", required: true, description: "Creation timestamp" },
        ],
        relations: [],
      },
    ];
    recommendedNextSteps = [
      "Review the detected vertical engine and adjust if needed",
      "Activate all recommended universe layers",
      "Configure the first workflow trigger",
      "Define custom data model fields for your domain",
      "Connect to external integrations via the Integration Loop",
    ];
  }

  return {
    id,
    description:           desc,
    projectName,
    domain,
    detectedVertical:      vertical?.id ?? null,
    detectedVerticalLabel: vertical?.label ?? null,
    detectedWorldEngines:  worldEngines.map(e => e.id),
    intelligenceEngines,
    workflows,
    dataModels,
    universeLayers,
    activationChain,
    recommendedNextSteps,
    engineRegistryEntries,
    scoringSnapshot,
    generatedAt,
    status,
    error,
  };
}
