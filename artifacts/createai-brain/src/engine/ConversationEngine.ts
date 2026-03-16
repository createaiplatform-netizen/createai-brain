// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL INTERACTION + CONVERSATION + TEST MODE ENGINE
// All responses are INTERNAL, MOCK, DEMO-ONLY, FICTIONAL, NON-OPERATIONAL.
// No clinical, legal, or financial guidance is provided.
// ═══════════════════════════════════════════════════════════════════════════

import {
  MOCK_ROLES, MOCK_DEPARTMENTS, MOCK_AGENCIES, MOCK_STATES,
  MOCK_VENDORS, MOCK_PROGRAMS, MOCK_SERVICES, MOCK_HEALTHCARE_CATEGORIES,
  MOCK_PAYER_TYPES, MOCK_FACILITIES, UniversalView, DemoStatus,
} from "./InteractionEngine";

export const CONVO_STORAGE_KEY = "createai_conversation_v1";

// ─── Brain Persona ────────────────────────────────────────────────────────
// These are the core behavioral rules that govern every response the Brain gives.
// The Brain responds instantly, clearly, and helpfully to every message.
// It never ignores a message, never runs silently, and never refuses to engage.
// All behavior is fictional, internal, and text-only.
// If the user asks for something to be created → generate it immediately in structured text.
// If the user asks for a plan → provide a structured plan.
// If the user asks for creative content → generate it.
// If the user asks a question → answer it.
// Safety Core: never provide real clinical, legal, or financial advice.
export const BRAIN_PERSONA = {
  name:        "CreateAI Brain",
  version:     "UCP-X v2",
  tagline:     "Universal Creative Intelligence — respond instantly, generate everything, ignore nothing.",
  rules: [
    "Respond instantly and clearly to every message.",
    "Follow the user's instructions as long as they are safe.",
    "Keep answers structured, helpful, and easy to understand.",
    "All behavior is fictional, internal, and text-only.",
    "If asked to create something → generate it immediately in structured text.",
    "If asked for a plan → provide a structured numbered plan.",
    "If asked for creative content → generate it fully.",
    "Never ignore a message. Never stop responding.",
    "Never provide real clinical, legal, or financial advice.",
    "Always label generated content as fictional/demo where relevant.",
  ],
  safetyNote:  "DEMO ONLY — All outputs are fictional, non-operational, and internal only.",
};

// ─── Types ────────────────────────────────────────────────────────────────

export type IntentType =
  | "switch-role" | "switch-agency" | "switch-state" | "switch-vendor"
  | "switch-department" | "switch-user-type" | "switch-demo-status"
  | "switch-industry" | "switch-country" | "switch-domain" | "switch-mode"
  | "start-workflow" | "generate-creative"
  | "generate-game" | "generate-story" | "generate-character" | "generate-world"
  | "create-project" | "generate-strategy" | "generate-invite"
  | "navigate" | "open-packet" | "walk-through" | "simulate"
  | "show-form" | "show-data" | "test-me" | "status-check"
  | "explain" | "help" | "test-answer" | "next-step" | "back-step"
  | "reset" | "generate-content" | "unknown";

export interface DetectedIntent {
  intent:       IntentType;
  entity:       string | null;
  entityLabel:  string | null;
  screen:       UniversalView | null;
  stateUpdate:  Partial<Record<string, string>> | null;
  confidence:   "high" | "medium" | "low";
  rawInput:     string;
}

export interface ConversationMessage {
  id:          string;
  role:        "user" | "system";
  text:        string;
  timestamp:   string;
  intent?:     IntentType;
  stateChange?: string;
}

export interface TestQuestion {
  id:       string;
  topic:    string;
  question: string;
  options:  string[];
  answer:   string;
  explanation: string;
}

export interface TestSession {
  isActive:        boolean;
  topic:           string;
  questions:       TestQuestion[];
  currentIndex:    number;
  score:           number;
  totalAnswered:   number;
  lastFeedback:    string | null;
  awaitingAnswer:  boolean;
}

export interface ConversationState {
  history:     ConversationMessage[];
  testSession: TestSession;
  lastIntent:  IntentType | null;
  stepContext: { workflow: string; step: number; steps: string[] } | null;
}

// ─── Pattern Matching ─────────────────────────────────────────────────────

const PATTERNS: { intent: IntentType; patterns: RegExp[] }[] = [
  {
    intent: "switch-role",
    patterns: [
      /\b(switch|change|set|use|act as|i am|i'm a?|be a?|become|login as|log in as)\b.*(role|as|to)\b/i,
      /\b(as a|like a)\b.*(admin|provider|coordinator|payer|vendor|analyst|officer|manager|lead|exec)/i,
      /\b(switch|change|set).*(role|user)/i,
      /\brole\b.*(change|switch|to|set)/i,
    ],
  },
  {
    intent: "switch-agency",
    patterns: [
      /\b(switch|change|set|show|use|open).*(agency|cms|hhs|fda|cdc|ahrq|va|samhsa|acl|nih|omh|onc|hrsa|ihs|chip|tricare)\b/i,
      /\b(agency|regulator|department of)\b.*(change|switch|to|for)/i,
    ],
  },
  {
    intent: "switch-state",
    patterns: [
      /\b(switch|change|set|show|use).*(state|in)\b/i,
      /\b(california|texas|florida|new york|ohio|georgia|michigan|illinois|pennsylvania|arizona|colorado|washington|oregon|virginia|minnesota|wisconsin|tennessee|north carolina|south carolina|nevada|utah|idaho|montana|wyoming|alaska|hawaii|vermont|maine|new hampshire|rhode island|connecticut|massachusetts|new jersey|delaware|maryland|kentucky|indiana|iowa|kansas|missouri|nebraska|south dakota|north dakota|oklahoma|arkansas|louisiana|mississippi|alabama|new mexico)\b/i,
      /\bstate of\b/i,
    ],
  },
  {
    intent: "switch-vendor",
    patterns: [
      /\b(switch|change|set|show|use|activate).*(vendor|partner|integration|platform|system)\b/i,
      /\bvendor\b.*(change|switch|to|for|set)/i,
    ],
  },
  {
    intent: "switch-department",
    patterns: [
      /\b(switch|change|set|show|use).*(department|dept|division|unit|team)\b/i,
      /\b(clinical|billing|compliance|operations|it|hr|finance|legal|marketing|pharmacy|research)\b.*(department|team|view)/i,
    ],
  },
  {
    intent: "switch-industry",
    patterns: [
      /\b(switch|change|set|show|use|explore).*(industry|sector|vertical|field)\b/i,
      /\b(healthcare|finance|education|technology|nonprofit|retail|manufacturing|logistics|hospitality|construction|energy|insurance|hr|marketing|legal|emergency|creative|research|government|human.?services)\b.*(industry|mode|sector|view|demo|switch|change)/i,
      /\b(industry|sector|vertical)\b.*(change|switch|to|set|for)/i,
      /\bswitch to\b.*(healthcare|finance|education|tech|nonprofit|retail|manufacturing|logistics|hospitality|construction|energy|insurance|hr|marketing|legal|emergency|creative|research|government)/i,
    ],
  },
  {
    intent: "switch-country",
    patterns: [
      /\b(switch|change|set|show|use).*(country|nation|region|jurisdiction|locale)\b/i,
      /\b(united states|canada|united kingdom|australia|germany|france|japan|india|brazil|mexico)\b.*(view|mode|switch|change|context|scenario)/i,
      /\bcountry\b.*(change|switch|to|set|for)/i,
    ],
  },
  {
    intent: "switch-domain",
    patterns: [
      /\b(switch|change|set|show|use).*(domain|area|focus|function|specialty)\b/i,
      /\b(operations|compliance|clinical|financial|technical|creative|research|policy|training|sales|marketing|hr|legal|quality|risk|data|product|engineering|community)\b.*(domain|view|mode|focus)/i,
    ],
  },
  {
    intent: "switch-mode",
    patterns: [
      /\b(switch|change|set|enter|go into|use|activate).*(mode|demo mode|training mode|simulation mode|blueprint mode|creative mode)\b/i,
      /\b(demo|training|simulation|blueprint|creative)\s+mode\b/i,
      /\bmode\b.*(change|switch|to|set|for)/i,
    ],
  },
  {
    intent: "start-workflow",
    patterns: [
      /\b(start|run|begin|launch|simulate|initiate|trigger).*(workflow|process|flow|procedure)\b/i,
      /\b(workflow|process)\b.*(start|run|begin|launch|simulate|show|view)/i,
      /\b(patient intake|grant application|incident response|loan origination|product launch|hiring|content production|emergency response)\b.*(workflow|process|start|run)/i,
    ],
  },
  {
    intent: "generate-creative",
    patterns: [
      /\b(generate|create|build|make|produce|write|draft).*(video|documentary|training|simulation|storyboard|script|explainer|podcast|course|presentation|webinar|commercial|creative|production)\b/i,
      /\b(video|documentary|training|script|storyboard|explainer|podcast|course|presentation|webinar|commercial)\b.*(generate|create|build|make|produce|write|for)\b/i,
      /\b(creative|production)\b.*(package|plan|outline|structure|generate|create)\b/i,
    ],
  },
  {
    intent: "generate-game",
    patterns: [
      /\b(generate|create|build|make|design|draft).*(game|gdd|game design|rpg|platformer|strategy game|puzzle game|simulation game|survival game|sandbox game|horror game|sports game|educational game|action game|adventure game)\b/i,
      /\b(game|gdd)\b.*(generate|create|build|design|make|outline|plan)\b/i,
      /\b(rpg|platformer|strategy|puzzle|survival|sandbox|horror|sports|educational|action|adventure)\b.*(game|design doc|gdd)\b/i,
      /\b(game mechanics|game loop|npc|skill tree|hud design|level design|boss fight)\b/i,
    ],
  },
  {
    intent: "generate-story",
    patterns: [
      /\b(generate|create|write|draft|outline|develop).*(story|narrative|screenplay|script|novel|comic|graphic novel|mini-series|tv series|audio drama|stage play|web series|film|movie)\b/i,
      /\b(story|narrative|screenplay|film|tv|comic|graphic novel)\b.*(generate|create|outline|develop|plan|structure)\b/i,
      /\b(three act|story arc|plot structure|act breakdown|story structure|narrative arc)\b/i,
      /\b(story engine|story generator|generate a story)\b/i,
    ],
  },
  {
    intent: "generate-character",
    patterns: [
      /\b(generate|create|build|make|design|invent).*(character|protagonist|antagonist|villain|hero|anti-hero|npc)\b/i,
      /\b(character profile|character arc|character sheet|character bio|character backstory)\b/i,
      /\b(character engine|create a character|design a character)\b/i,
      /\b(archetype|hero's journey|character motivation|character flaw|character relationship)\b/i,
    ],
  },
  {
    intent: "create-project",
    patterns: [
      /\b(create|build|link|connect|assemble|combine|unify).*(project|connected project|cross-media|universe project)\b/i,
      /\b(connection layer|completeness pass|link my|connect my|project builder)\b/i,
      /\b(link).*(story|character|world|mechanic|workflow)\b/i,
      /\b(assemble|combine|unify).*(element|asset|module|engine)\b/i,
    ],
  },
  {
    intent: "generate-invite",
    patterns: [
      /\b(create|generate|send|draft|write|make|compose|build).*(invite|invitation|invites|invitations)\b/i,
      /\b(invite|invitations?)\b.*(send|create|generate|draft|compose|write|make)\b/i,
      /\b(send.*to|notify|message).*(contacts?|team|recipients?|everyone|all)\b.*\b(invite|invitation|message)\b/i,
      /\b(instant invite|invite generator|bulk invite)\b/i,
    ],
  },
  {
    intent: "generate-strategy",
    patterns: [
      /\b(generate|create|build|make|plan|develop).*(strategy|roadmap|strategic plan|milestone|growth plan)\b/i,
      /\b(strategy|roadmap).*(growth|revenue|product|market|competitive|hiring|technology|partnership|creative ip|platform|expansion|turnaround)\b/i,
      /\b(growth|revenue|competitive|market|hiring|technology|turnaround).*(strategy|roadmap|plan|milestones)\b/i,
      /\b(how.*(grow|scale|revenue|compete|surpass|beat|expand|outcompete))\b/i,
      /\b(surpass|beat|outcompete|dominate|scale to).*(google|meta|apple|microsoft|netflix|disney|amazon|company)\b/i,
      /\b(90.day|30.day|6.month|1.year|3.year|5.year).*(plan|roadmap|strategy|horizon)\b/i,
      /\b(quick wins|long bets|north star|competitive position|moat|revenue model|milestones)\b/i,
    ],
  },
  {
    intent: "generate-world",
    patterns: [
      /\b(generate|create|build|design|world-build|construct).*(world|realm|universe|setting|lore|fictional world)\b/i,
      /\b(world building|world engine|world generator|create a world|design a world)\b/i,
      /\b(regions|factions|cultures|history|ecology|geography|magic system|technology level)\b.*(world|setting|realm|fictional)\b/i,
      /\b(fantasy world|sci-fi world|dystopia|utopia|post-apocalyptic world|alternate history world)\b/i,
    ],
  },
  {
    intent: "navigate",
    patterns: [
      /\b(go to|open|show|take me to|navigate to|load|display|view)\b.*(home|dashboard|roles?|agencies|states?|vendors?|programs?|packets?|submissions?|settings?|talk|conversation|universal|hub|industries|workflows?|creative|games?|story|world|character)\b/i,
      /\b(home|dashboard|roles?|agencies|states?|vendors?|programs?|packets?|submissions?|settings?|industries|workflows?|creative)\s*(screen|page|view|tab|section)\b/i,
    ],
  },
  {
    intent: "open-packet",
    patterns: [
      /\b(open|show|view|load|get|display).*(packet|integration packet)\b/i,
      /\bpacket\b.*(open|show|view|for|load)/i,
    ],
  },
  {
    intent: "walk-through",
    patterns: [
      /\b(walk|walk me through|guide|explain the steps|how do i|step by step|steps to|tutorial|how to)\b/i,
      /\b(show me how|teach me|explain|demonstrate)\b.*(work|process|flow|steps|submit|send|enroll)\b/i,
    ],
  },
  {
    intent: "simulate",
    patterns: [
      /\b(pretend|simulate|what happens|what if|imagine|suppose|let's say|demo|mock|act like)\b/i,
      /\b(as if|what would happen|what does it look like when)\b/i,
    ],
  },
  {
    intent: "show-form",
    patterns: [
      /\b(show|display|what does).*(form|screen|view|interface|ui|layout)\b.*(look|like|is|for)\b/i,
      /\b(form|screen|interface|layout)\b.*(show|display|open|view)\b/i,
      /\bwhat does the form look like\b/i,
    ],
  },
  {
    intent: "show-data",
    patterns: [
      /\b(show|display|list|give me|tell me).*(data|list|all|mock|reference|available|options)\b/i,
      /\bwhat.*(roles?|agencies?|states?|vendors?|programs?|packets?|categories|types)\b.*(are|available|exist)\b/i,
    ],
  },
  {
    intent: "test-me",
    patterns: [
      /\b(test|quiz|examine|ask me|check my knowledge|assess|practice|drill)\b/i,
      /\b(i want to be tested|test my|quiz on|practice on|quiz me)\b/i,
    ],
  },
  {
    intent: "status-check",
    patterns: [
      /\b(what.?s|what is|show|current|get|check).*(status|state|current|active|session|context|where)\b/i,
      /\b(where am i|where are we|current role|current state|my role|active role)\b/i,
    ],
  },
  {
    intent: "explain",
    patterns: [
      /\b(what is|what are|explain|describe|tell me about|define|how does|what does)\b/i,
    ],
  },
  {
    intent: "next-step",
    patterns: [
      /\b(next|continue|proceed|go ahead|what.?s next|move on|forward|step [0-9])\b/i,
    ],
  },
  {
    intent: "back-step",
    patterns: [
      /\b(back|previous|go back|undo|before|prior step)\b/i,
    ],
  },
  {
    intent: "reset",
    patterns: [
      /\b(reset|restart|clear|start over|start fresh|from the beginning|new session)\b/i,
    ],
  },
  {
    intent: "help",
    patterns: [
      /\b(help|what can you do|commands|options|what.?s available|capabilities|how do i use|what can i say)\b/i,
    ],
  },
];

// ─── Entity Extraction ────────────────────────────────────────────────────

function extractEntity(text: string, intent: IntentType): { entity: string | null; entityLabel: string | null; stateUpdate: Record<string, string> | null } {
  const lower = text.toLowerCase();

  if (intent === "switch-role") {
    for (const r of MOCK_ROLES) {
      if (lower.includes(r.label.toLowerCase()) || lower.includes(r.id.toLowerCase())) {
        return { entity: r.id, entityLabel: r.label, stateUpdate: { currentRole: r.id } };
      }
    }
    // Fuzzy
    const roleWords = ["admin", "provider", "coordinator", "payer", "vendor", "viewer", "family", "clinical", "compliance", "analyst", "billing", "exec"];
    for (const w of roleWords) {
      if (lower.includes(w)) {
        const match = MOCK_ROLES.find(r => r.id.includes(w) || r.label.toLowerCase().includes(w));
        if (match) return { entity: match.id, entityLabel: match.label, stateUpdate: { currentRole: match.id } };
      }
    }
  }

  if (intent === "switch-agency") {
    for (const a of MOCK_AGENCIES) {
      if (lower.includes(a.abbrev.toLowerCase()) || lower.includes(a.label.toLowerCase().split(" ")[0])) {
        return { entity: a.id, entityLabel: a.abbrev, stateUpdate: { currentAgency: a.id } };
      }
    }
  }

  if (intent === "switch-state") {
    for (const s of MOCK_STATES) {
      if (lower.includes(s.toLowerCase())) {
        return { entity: s, entityLabel: s, stateUpdate: { currentState: s } };
      }
    }
  }

  if (intent === "switch-vendor") {
    for (const v of MOCK_VENDORS) {
      if (lower.includes(v.label.toLowerCase().split(" ")[0]) || lower.includes(v.id)) {
        return { entity: v.id, entityLabel: v.label, stateUpdate: { currentVendor: v.id } };
      }
    }
  }

  if (intent === "switch-department") {
    for (const d of MOCK_DEPARTMENTS) {
      if (lower.includes(d.label.toLowerCase()) || lower.includes(d.id)) {
        return { entity: d.id, entityLabel: d.label, stateUpdate: { currentDepartment: d.id } };
      }
    }
  }

  // Universal Everything Engine entity extraction
  if (intent === "switch-industry") {
    const INDUSTRY_KEYWORDS: { keywords: string[]; id: string; label: string }[] = [
      { keywords: ["healthcare", "health care", "medical", "hospital", "clinical"], id: "healthcare", label: "Healthcare" },
      { keywords: ["finance", "banking", "financial", "bank"], id: "finance", label: "Finance & Banking" },
      { keywords: ["education", "school", "university", "academic", "learning"], id: "education", label: "Education" },
      { keywords: ["technology", "tech", "software", "saas", "it "], id: "technology", label: "Technology" },
      { keywords: ["nonprofit", "non-profit", "ngo", "charity"], id: "nonprofit", label: "Nonprofit & NGO" },
      { keywords: ["retail", "ecommerce", "e-commerce", "store", "shopping"], id: "retail", label: "Retail & E-Commerce" },
      { keywords: ["manufacturing", "factory", "production", "industrial"], id: "manufacturing", label: "Manufacturing" },
      { keywords: ["logistics", "supply chain", "shipping", "freight", "warehouse"], id: "logistics", label: "Logistics & Supply Chain" },
      { keywords: ["hospitality", "hotel", "restaurant", "tourism", "travel"], id: "hospitality", label: "Hospitality & Tourism" },
      { keywords: ["construction", "real estate", "building", "property", "architecture"], id: "construction", label: "Construction & Real Estate" },
      { keywords: ["energy", "utility", "utilities", "oil", "gas", "electric", "renewable"], id: "energy", label: "Energy & Utilities" },
      { keywords: ["insurance", "insurer", "actuarial", "underwriting"], id: "insurance", label: "Insurance" },
      { keywords: ["hr", "human resources", "workforce", "hiring", "talent"], id: "hr-workforce", label: "HR & Workforce" },
      { keywords: ["marketing", "advertising", "campaign", "brand"], id: "marketing", label: "Marketing & Advertising" },
      { keywords: ["legal", "law", "compliance", "regulatory"], id: "legal-compliance", label: "Legal & Compliance" },
      { keywords: ["emergency", "fire", "police", "ems", "dispatch", "public safety"], id: "emergency-services", label: "Emergency Services" },
      { keywords: ["creative", "media", "film", "tv", "music", "entertainment", "gaming"], id: "creative-media", label: "Creative & Media" },
      { keywords: ["research", "science", "laboratory", "clinical trial", "biotech"], id: "research-science", label: "Research & Science" },
      { keywords: ["government", "public sector", "federal", "state agency", "municipal"], id: "government", label: "Government / Public Sector" },
      { keywords: ["human services", "social services", "case management", "family services"], id: "human-services", label: "Human Services" },
    ];
    for (const ind of INDUSTRY_KEYWORDS) {
      if (ind.keywords.some(k => lower.includes(k))) {
        return { entity: ind.id, entityLabel: ind.label, stateUpdate: { currentIndustry: ind.id } };
      }
    }
  }

  if (intent === "switch-country") {
    const COUNTRIES = [
      "united states", "canada", "united kingdom", "australia", "germany", "france",
      "japan", "south korea", "india", "brazil", "mexico", "netherlands", "sweden",
      "singapore", "south africa", "nigeria", "new zealand", "switzerland",
    ];
    for (const c of COUNTRIES) {
      if (lower.includes(c)) {
        const label = c.replace(/\b\w/g, l => l.toUpperCase());
        return { entity: label, entityLabel: label, stateUpdate: { currentCountry: label } };
      }
    }
  }

  if (intent === "switch-domain") {
    const DOMAINS = [
      "operations", "compliance", "clinical", "financial", "technical", "creative",
      "research", "policy", "training", "sales", "marketing", "hr", "legal",
      "quality", "risk", "data", "product", "engineering", "community",
    ];
    for (const d of DOMAINS) {
      if (lower.includes(d)) {
        const label = d.charAt(0).toUpperCase() + d.slice(1);
        return { entity: d, entityLabel: label, stateUpdate: { currentDomain: label } };
      }
    }
  }

  if (intent === "switch-mode") {
    const MODES = [
      { key: "demo", label: "Demo Mode" },
      { key: "training", label: "Training Mode" },
      { key: "simulation", label: "Simulation Mode" },
      { key: "blueprint", label: "Blueprint Mode" },
      { key: "creative", label: "Creative Production" },
    ];
    for (const m of MODES) {
      if (lower.includes(m.key)) {
        return { entity: m.key, entityLabel: m.label, stateUpdate: { currentMode: m.key } };
      }
    }
  }

  if (intent === "start-workflow") {
    const WF_MAP: { keywords: string[]; id: string; label: string }[] = [
      { keywords: ["patient intake", "patient admission", "intake"], id: "wf-patient-intake", label: "Patient Intake" },
      { keywords: ["grant", "grant application"], id: "wf-grant-application", label: "Grant Application" },
      { keywords: ["incident response", "security incident", "breach"], id: "wf-incident-response", label: "IT Incident Response" },
      { keywords: ["loan", "loan origination", "lending"], id: "wf-loan-origination", label: "Loan Origination" },
      { keywords: ["product launch", "launch", "release"], id: "wf-product-launch", label: "Product Launch" },
      { keywords: ["hiring", "recruiting", "recruitment", "job req"], id: "wf-hiring", label: "Full-Cycle Recruiting" },
      { keywords: ["content production", "creative production", "video production"], id: "wf-content-production", label: "Content Production" },
      { keywords: ["emergency response", "emergency", "incident command"], id: "wf-emergency-response", label: "Emergency Response" },
    ];
    for (const wf of WF_MAP) {
      if (wf.keywords.some(k => lower.includes(k))) {
        return { entity: wf.id, entityLabel: wf.label, stateUpdate: { currentScenario: wf.id } };
      }
    }
    return { entity: "workflows", entityLabel: "Workflows", stateUpdate: null };
  }

  if (intent === "generate-creative") {
    const CREATIVE_TYPES: { keywords: string[]; type: string; label: string }[] = [
      { keywords: ["video", "marketing video"], type: "video", label: "Marketing Video" },
      { keywords: ["documentary"], type: "documentary", label: "Documentary" },
      { keywords: ["training", "training module", "training video"], type: "training", label: "Training Module" },
      { keywords: ["simulation", "interactive simulation"], type: "simulation", label: "Simulation" },
      { keywords: ["storyboard"], type: "storyboard", label: "Storyboard" },
      { keywords: ["script", "screenplay"], type: "script", label: "Script" },
      { keywords: ["explainer"], type: "explainer", label: "Explainer Video" },
      { keywords: ["podcast"], type: "podcast", label: "Podcast Episode" },
      { keywords: ["course", "online course", "elearning"], type: "course", label: "Online Course" },
      { keywords: ["presentation", "slide deck", "slides"], type: "presentation", label: "Presentation" },
      { keywords: ["webinar"], type: "webinar", label: "Webinar" },
      { keywords: ["commercial", "ad", "advertisement"], type: "commercial", label: "Commercial Spot" },
    ];
    for (const ct of CREATIVE_TYPES) {
      if (ct.keywords.some(k => lower.includes(k))) {
        return { entity: ct.type, entityLabel: ct.label, stateUpdate: { currentMode: "creative" } };
      }
    }
  }

  if (intent === "generate-game") {
    const GAME_TYPES: { keywords: string[]; type: string; label: string }[] = [
      { keywords: ["rpg", "role-playing", "role playing"], type: "rpg", label: "RPG" },
      { keywords: ["platformer", "platform game", "side-scroller"], type: "platformer", label: "Platformer" },
      { keywords: ["strategy", "rts", "turn-based strategy", "4x"], type: "strategy", label: "Strategy" },
      { keywords: ["puzzle", "logic puzzle", "match-3"], type: "puzzle", label: "Puzzle" },
      { keywords: ["simulation", "city builder", "life sim"], type: "simulation", label: "Simulation" },
      { keywords: ["adventure", "point and click", "narrative"], type: "adventure", label: "Adventure" },
      { keywords: ["action", "beat em up", "hack and slash", "brawler"], type: "action", label: "Action" },
      { keywords: ["horror", "survival horror", "psychological horror"], type: "horror", label: "Horror" },
      { keywords: ["sports", "football", "basketball", "racing"], type: "sports", label: "Sports" },
      { keywords: ["educational", "learning", "stem game"], type: "educational", label: "Educational" },
      { keywords: ["sandbox", "open world", "minecraft", "creative mode"], type: "sandbox", label: "Sandbox" },
      { keywords: ["survival", "survival crafting", "wilderness"], type: "survival", label: "Survival" },
    ];
    for (const gt of GAME_TYPES) {
      if (gt.keywords.some(k => lower.includes(k))) {
        return { entity: gt.type, entityLabel: gt.label, stateUpdate: null };
      }
    }
    return { entity: "rpg", entityLabel: "RPG (default)", stateUpdate: null };
  }

  if (intent === "generate-story") {
    const STORY_FORMATS: { keywords: string[]; type: string; label: string }[] = [
      { keywords: ["movie", "film", "feature film", "screenplay"], type: "movie", label: "Movie" },
      { keywords: ["tv series", "television", "season", "episode"], type: "tv-series", label: "TV Series" },
      { keywords: ["mini-series", "limited series"], type: "mini-series", label: "Mini-Series" },
      { keywords: ["documentary"], type: "documentary", label: "Documentary" },
      { keywords: ["comic", "comic book"], type: "comic", label: "Comic" },
      { keywords: ["graphic novel"], type: "graphic-novel", label: "Graphic Novel" },
      { keywords: ["novel", "book", "fiction book"], type: "novel", label: "Novel" },
      { keywords: ["short story"], type: "short-story", label: "Short Story" },
      { keywords: ["interactive", "interactive story", "visual novel"], type: "interactive", label: "Interactive Story" },
      { keywords: ["audio drama", "audio play", "radio play"], type: "audio-drama", label: "Audio Drama" },
      { keywords: ["stage play", "theatre", "theatrical"], type: "stage-play", label: "Stage Play" },
      { keywords: ["web series", "youtube series"], type: "web-series", label: "Web Series" },
    ];
    for (const sf of STORY_FORMATS) {
      if (sf.keywords.some(k => lower.includes(k))) {
        return { entity: sf.type, entityLabel: sf.label, stateUpdate: null };
      }
    }
    return { entity: "movie", entityLabel: "Movie (default)", stateUpdate: null };
  }

  if (intent === "generate-character") {
    const ARCHETYPES: { keywords: string[]; type: string; label: string }[] = [
      { keywords: ["hero", "protagonist", "main character"], type: "hero", label: "Hero" },
      { keywords: ["villain", "antagonist", "bad guy"], type: "villain", label: "Villain" },
      { keywords: ["anti-hero", "antihero", "morally grey"], type: "anti-hero", label: "Anti-Hero" },
      { keywords: ["mentor", "guide", "teacher"], type: "mentor", label: "Mentor" },
      { keywords: ["trickster", "trickster figure"], type: "trickster", label: "Trickster" },
      { keywords: ["shadow"], type: "shadow", label: "Shadow" },
      { keywords: ["guardian", "gatekeeper"], type: "guardian", label: "Guardian" },
      { keywords: ["ally", "sidekick", "companion"], type: "ally", label: "Ally" },
      { keywords: ["innocent", "naive character"], type: "innocent", label: "Innocent" },
      { keywords: ["everyman", "ordinary person"], type: "everyman", label: "Everyman" },
    ];
    for (const a of ARCHETYPES) {
      if (a.keywords.some(k => lower.includes(k))) {
        return { entity: a.type, entityLabel: a.label, stateUpdate: null };
      }
    }
    return { entity: "hero", entityLabel: "Hero (default)", stateUpdate: null };
  }

  if (intent === "create-project") {
    const FORMATS: { keywords: string[]; type: string; label: string }[] = [
      { keywords: ["movie", "film", "cinema", "feature"], type: "movie", label: "Movie" },
      { keywords: ["tv", "television", "series", "season", "episode"], type: "tv-series", label: "TV Series" },
      { keywords: ["game", "video game", "gaming"], type: "video-game", label: "Video Game" },
      { keywords: ["comic", "graphic novel"], type: "comic", label: "Comic" },
      { keywords: ["novel", "book", "prose"], type: "novel", label: "Novel" },
      { keywords: ["training", "course", "module"], type: "training-module", label: "Training Module" },
      { keywords: ["simulation", "sim"], type: "simulation", label: "Simulation" },
      { keywords: ["interactive story", "interactive fiction", "branching"], type: "interactive-story", label: "Interactive Story" },
      { keywords: ["documentary", "docu"], type: "documentary", label: "Documentary" },
      { keywords: ["world bible", "world-bible", "lore bible"], type: "world-bible", label: "World Bible" },
      { keywords: ["cross-media", "cross media", "multiverse", "universe"], type: "cross-media", label: "Cross-Media Universe" },
    ];
    for (const f of FORMATS) {
      if (f.keywords.some(k => lower.includes(k))) {
        return { entity: f.type, entityLabel: f.label, stateUpdate: null };
      }
    }
    return { entity: null, entityLabel: null, stateUpdate: null };
  }

  if (intent === "generate-strategy") {
    const FOCUS_TYPES: { keywords: string[]; type: string; label: string }[] = [
      { keywords: ["growth", "user growth", "acquire", "scale"], type: "growth", label: "User Growth" },
      { keywords: ["revenue", "monetize", "monetization", "pricing", "subscription"], type: "revenue", label: "Revenue Model" },
      { keywords: ["product", "roadmap", "features", "product strategy"], type: "product", label: "Product Strategy" },
      { keywords: ["market", "beachhead", "segment", "go-to-market", "gtm"], type: "market", label: "Market Strategy" },
      { keywords: ["competitive", "compete", "competition", "moat", "differentiate", "surpass", "beat", "outcompete"], type: "competitive", label: "Competitive Strategy" },
      { keywords: ["hiring", "team", "org", "culture", "people"], type: "hiring", label: "Team Building" },
      { keywords: ["technology", "tech stack", "architecture", "infrastructure"], type: "technology", label: "Technology Strategy" },
      { keywords: ["partner", "partnership", "alliance", "deal"], type: "partnerships", label: "Partnerships" },
      { keywords: ["creative ip", "ip strategy", "franchise", "intellectual property"], type: "creative-ip", label: "Creative IP" },
      { keywords: ["platform", "ecosystem", "marketplace", "network effect"], type: "platform", label: "Platform Strategy" },
      { keywords: ["expand", "expansion", "geographic", "global", "international"], type: "expansion", label: "Market Expansion" },
      { keywords: ["turnaround", "pivot", "restructure", "stabilize", "recovery"], type: "turnaround", label: "Turnaround" },
    ];
    for (const f of FOCUS_TYPES) {
      if (f.keywords.some(k => lower.includes(k))) {
        return { entity: f.type, entityLabel: f.label, stateUpdate: null };
      }
    }
    return { entity: "growth", entityLabel: "Growth Strategy", stateUpdate: null };
  }

  if (intent === "generate-world") {
    const WORLD_TYPES: { keywords: string[]; type: string; label: string }[] = [
      { keywords: ["fantasy", "magic", "elves", "dwarves", "wizard"], type: "fantasy", label: "Fantasy World" },
      { keywords: ["sci-fi", "science fiction", "space", "aliens", "futuristic"], type: "sci-fi", label: "Sci-Fi World" },
      { keywords: ["contemporary", "modern", "realistic", "present day"], type: "contemporary", label: "Contemporary World" },
      { keywords: ["historical", "medieval", "ancient", "past"], type: "historical", label: "Historical World" },
      { keywords: ["post-apocalyptic", "post apocalypse", "after the end"], type: "post-apocalyptic", label: "Post-Apocalyptic World" },
      { keywords: ["alternate history", "alternative history", "steampunk"], type: "alternate-history", label: "Alternate History World" },
      { keywords: ["mythological", "mythology", "gods", "pantheon"], type: "mythological", label: "Mythological World" },
      { keywords: ["horror", "dark", "eldritch", "cosmic horror"], type: "horror", label: "Horror World" },
      { keywords: ["utopia", "perfect society", "ideal world"], type: "utopia", label: "Utopia" },
      { keywords: ["dystopia", "dystopian", "oppressive", "surveillance state"], type: "dystopia", label: "Dystopia" },
    ];
    for (const wt of WORLD_TYPES) {
      if (wt.keywords.some(k => lower.includes(k))) {
        return { entity: wt.type, entityLabel: wt.label, stateUpdate: null };
      }
    }
    return { entity: "fantasy", entityLabel: "Fantasy (default)", stateUpdate: null };
  }

  return { entity: null, entityLabel: null, stateUpdate: null };
}

function extractScreen(text: string, intent: IntentType): UniversalView | null {
  const lower = text.toLowerCase();

  if (intent === "navigate" || intent === "show-form" || intent === "show-data") {
    if (lower.includes("dashboard")) return "dashboard";
    if (lower.includes("role")) return "roles";
    if (lower.includes("agenc")) return "agencies";
    if (lower.includes("state")) return "states";
    if (lower.includes("vendor")) return "vendors";
    if (lower.includes("program")) return "programs";
    if (lower.includes("packet")) return "packets";
    if (lower.includes("submiss") || lower.includes("submit")) return "submissions";
    if (lower.includes("setting")) return "settings";
    if (lower.includes("talk") || lower.includes("convers") || lower.includes("chat")) return "home";
    if (lower.includes("home")) return "home";
    if (lower.includes("industr") || lower.includes("sector")) return "industries";
    if (lower.includes("workflow") || lower.includes("process")) return "workflows";
    if (lower.includes("creative") || lower.includes("production") || lower.includes("media")) return "creative";
    if (lower.includes("game") || lower.includes("gdd")) return "games";
    if (lower.includes("story") || lower.includes("narrative") || lower.includes("character") || lower.includes("world build")) return "story";
    if (lower.includes("connect") || lower.includes("link project") || lower.includes("linked project") || lower.includes("completeness")) return "connection";
    if (lower.includes("strategy") || lower.includes("roadmap") || lower.includes("growth") || lower.includes("revenue model") || lower.includes("milestone")) return "strategy";
  }

  if (intent === "switch-industry") return "industries";
  if (intent === "switch-country" || intent === "switch-domain" || intent === "switch-mode") return "industries";
  if (intent === "start-workflow") return "workflows";
  if (intent === "generate-creative") return "creative";
  if (intent === "generate-game") return "games";
  if (intent === "generate-story" || intent === "generate-character" || intent === "generate-world") return "story";
  if (intent === "create-project") return "connection";
  if (intent === "generate-strategy") return "strategy";
  if (intent === "switch-role") return "roles";
  if (intent === "switch-agency") return "agencies";
  if (intent === "switch-state") return "states";
  if (intent === "switch-vendor") return "vendors";
  if (intent === "switch-department") return "settings";
  if (intent === "open-packet") return "packets";
  if (intent === "walk-through") return "submissions";
  if (intent === "simulate") return "submissions";
  if (intent === "test-me") return "dashboard";
  if (intent === "status-check") return "dashboard";
  return null;
}

// ─── Test Question Bank ───────────────────────────────────────────────────

const QUESTION_BANK: TestQuestion[] = [
  {
    id: "q1", topic: "roles",
    question: "Which role has the highest system-level access in this demo platform?",
    options: ["Care Coordinator", "System Admin", "Viewer", "Data Analyst"],
    answer: "System Admin",
    explanation: "In this mock platform, the System Admin role has the broadest access. In a real system, access would be governed by your organization's RBAC policy.",
  },
  {
    id: "q2", topic: "submission-flow",
    question: "What is the correct order of steps in the demo submission flow?",
    options: [
      "Submit → Review → Confirm",
      "Review context → Confirm packet → Submit",
      "Open packet → Change agency → Submit",
      "Select state → Select role → Send",
    ],
    answer: "Review context → Confirm packet → Submit",
    explanation: "The demo submission flow has 3 steps: (1) Review session context, (2) Confirm packet selection, (3) Submit. All mock — no real data is sent.",
  },
  {
    id: "q3", topic: "agencies",
    question: "Which mock agency oversees Medicare & Medicaid in this demo?",
    options: ["FDA", "CDC", "CMS", "NIH"],
    answer: "CMS",
    explanation: "In this fictional demo, CMS (Centers for Medicare & Medicaid Services) is the agency listed for Medicaid/Medicare oversight. This is modeled after the real CMS but is entirely demo-only.",
  },
  {
    id: "q4", topic: "demo-status",
    question: "After a demo submission is reviewed, what status might it move to?",
    options: ["not-started", "approved-demo", "expired", "in-progress"],
    answer: "approved-demo",
    explanation: "In this mock platform, the demo status lifecycle is: not-started → in-progress → submitted → under-review → approved-demo (or rejected/needs-revision).",
  },
  {
    id: "q5", topic: "programs",
    question: "Which program type focuses on coordinating care across providers for Medicare patients?",
    options: ["CHIP Program", "ACO", "CCBHC", "DSHP"],
    answer: "ACO",
    explanation: "In this mock data, Accountable Care Organizations (ACOs) focus on coordinating Medicare patient care across providers. This is based on real program structures but is demo-only here.",
  },
  {
    id: "q6", topic: "vendors",
    question: "In the vendor list, what does 'demo' status mean for a vendor?",
    options: [
      "The vendor is deactivated",
      "The vendor is only available in demo/test mode",
      "The vendor requires payment",
      "The vendor is from a different region",
    ],
    answer: "The vendor is only available in demo/test mode",
    explanation: "In this platform, vendors tagged 'demo' are fictional placeholders available only in the mock environment. 'Active' vendors are also mock but represent conceptually connected integrations.",
  },
  {
    id: "q7", topic: "packets",
    question: "What does an 'Open Packet' action do in this demo?",
    options: [
      "Sends data to an external API",
      "Opens a real integration connection",
      "Loads the mock packet detail view with fictional endpoint data",
      "Downloads a file from the server",
    ],
    answer: "Loads the mock packet detail view with fictional endpoint data",
    explanation: "Opening a packet in this demo loads its fictional detail screen, showing mock endpoints (*.example.com), version, and status. No real connections are made.",
  },
  {
    id: "q8", topic: "roles",
    question: "Which role would most likely handle prior authorization reviews in a real healthcare org?",
    options: ["Family Member", "Care Coordinator", "Data Analyst", "IT Lead"],
    answer: "Care Coordinator",
    explanation: "In this fictional demo, Care Coordinators are associated with clinical workflows including prior auth review. Real prior auth processes depend on org-specific policies.",
  },
  {
    id: "q9", topic: "regulatory",
    question: "Which regulatory framework in this platform covers patient data privacy?",
    options: ["SOC 2", "FINRA/SEC", "HIPAA", "ADA/WCAG"],
    answer: "HIPAA",
    explanation: "HIPAA is listed in the Regulatory Blueprints as the framework covering patient data privacy. The blueprint here is non-operational and non-legally-binding — demo only.",
  },
  {
    id: "q10", topic: "workflow",
    question: "What happens when you click 'Change Role' on the Home screen?",
    options: [
      "Creates a new user account",
      "Navigates to the Roles screen to pick a new role",
      "Logs you out",
      "Submits a role change request externally",
    ],
    answer: "Navigates to the Roles screen to pick a new role",
    explanation: "Clicking 'Change Role' navigates to the Roles screen where you select a role that updates the internal session state. All internal, mock, no external action.",
  },
  {
    id: "q11", topic: "states",
    question: "How many US states + territories are in the mock state selector?",
    options: ["48", "50", "51", "52"],
    answer: "51",
    explanation: "The mock list includes all 50 US states plus the District of Columbia — 51 total entries.",
  },
  {
    id: "q12", topic: "workflow",
    question: "What is the purpose of the Action Log in the Dashboard?",
    options: [
      "Sends audit data to a compliance server",
      "Records every internal state change and navigation for the demo session",
      "Logs real user credentials",
      "Counts API calls to external services",
    ],
    answer: "Records every internal state change and navigation for the demo session",
    explanation: "The Action Log records all internal interactions (role changes, navigations, submissions, etc.) as mock entries stored in localStorage. No external logging occurs.",
  },
];

// ─── Response Templates ───────────────────────────────────────────────────

const RESPONSES: Record<IntentType, (entity: string | null, entityLabel: string | null, extra?: string) => string[]> = {
  "switch-role": (_, label) => label ? [
    `Switching to ${label}. Your session context has been updated — all screens, workflows, and data will now reflect the ${label} perspective.`,
    `Done! You're now operating as ${label}. Navigate to any screen and the role context carries through.`,
    `Role updated to ${label}. This affects how mock workflows and permissions are displayed across the platform.`,
  ] : [
    "I can switch roles for you! Try saying 'Switch to Care Coordinator' or 'Act as Admin.' Available roles include Admin, Provider, Payer Representative, Compliance Officer, and more.",
    "Which role would you like? Options: System Admin, Care Coordinator, Provider, Payer Representative, State Agency Officer, Vendor Manager, Viewer, Family Member, Operations Manager, Clinical Lead, Compliance Officer, Data Analyst.",
  ],
  "switch-agency": (_, label) => label ? [
    `Agency updated to ${label}. All agency-contextual data and mock workflows now reflect this selection.`,
    `Switched to ${label}. Navigate to the Agencies screen to see the full agency profile.`,
  ] : [
    "I can switch the active agency. Try 'Switch to CMS' or 'Change agency to SAMHSA.' Available: CMS, HHS, FDA, CDC, AHRQ, VA, SAMHSA, ACL, NIH, and more.",
  ],
  "switch-state": (_, label) => label ? [
    `State set to ${label}. State context is now reflected across all mock workflows and submission flows.`,
    `Active state updated to ${label}. Some mock programs and payer types vary by state — all fictional here.`,
  ] : [
    "I can set any of the 51 states + DC. Try 'Switch to Texas' or 'Show me California workflows.' Go to the States screen to select visually.",
  ],
  "switch-vendor": (_, label) => label ? [
    `Active vendor updated to ${label}. Packet flows and integration views will reflect this vendor context.`,
    `Vendor switched to ${label}. Go to the Vendors screen to see the full profile and available mock actions.`,
  ] : [
    "Which vendor? Try 'Switch to Nexus Health' or 'Use ClaimStream.' You can also filter vendors by category on the Vendors screen.",
  ],
  "switch-department": (_, label) => label ? [
    `Department set to ${label}. Settings screen reflects this update.`,
  ] : [
    "Which department? Options include Clinical, Operations, Billing, Compliance, IT, HR, Finance, Legal, Marketing, Quality, Patient Services, Pharmacy, Research, Administration, Executive.",
  ],
  "switch-user-type": (_, label) => [`User type updated to ${label}.`],
  "switch-demo-status": (_, label) => [`Demo status set to ${label}.`],
  "switch-industry": (_, label) => label ? [
    `Industry switched to ${label}. The Industries screen will now show roles, departments, workflows, vendors, regulations, and scenarios specific to ${label}. All mock data — internal only.`,
    `Now exploring ${label}. Every screen adapts: roles, agencies, workflows, and regulations reflect this industry context. Navigate to the Industries screen to explore further.`,
    `${label} mode active. The Universal Everything Engine has loaded the full mock data set for this industry — roles, workflows, programs, vendors, and sample scenarios.`,
  ] : [
    "Which industry? Available: Healthcare, Finance, Education, Technology, Nonprofit, Retail, Manufacturing, Logistics, Hospitality, Construction, Energy, Insurance, HR, Marketing, Legal, Emergency Services, Creative Media, Research, Government, Human Services.",
    "Say 'switch to healthcare' or 'explore finance industry' to change the active industry context. The Industries screen shows all 20 available options.",
  ],
  "switch-country": (_, label) => label ? [
    `Country context set to ${label}. Jurisdictional variations (regulatory, language, compliance patterns) are now reflected in mock data. All fictional — non-operational.`,
    `${label} selected. The mock regulatory readiness blueprint and workflow patterns now reflect this jurisdiction. See the Industries screen for country context.`,
  ] : [
    "Which country? Available: United States, Canada, United Kingdom, Australia, Germany, France, Japan, India, Brazil, Mexico, and 35+ others. Try 'switch to Canada' or 'set country to Germany.'",
  ],
  "switch-domain": (_, label) => label ? [
    `Domain set to ${label}. This filters the view to focus on ${label}-specific workflows, roles, and data patterns.`,
    `${label} domain active. Navigate to the Industries screen to see domain-specific content.`,
  ] : [
    "Which domain? Options: Operations, Compliance, Clinical, Financial, Technical, Creative, Research, Policy, Training, Sales, Marketing, HR, Legal, Quality, Risk, Data, Product, Engineering, Community.",
  ],
  "switch-mode": (_, label) => label ? [
    `Mode switched to ${label}. The platform now operates in ${label}: all outputs, interactions, and engine behaviors reflect this mode. All fictional — internal only.`,
    `${label} activated. In this mode, the Universal Everything Engine adjusts how screens, workflows, and responses are generated.`,
  ] : [
    "Available modes: Demo Mode (safe mock interactions), Training Mode (guided learning with quiz), Simulation Mode (full workflow simulation), Blueprint Mode (API/data/regulatory design view), Creative Production (generate production packages). Say 'enter training mode' or 'switch to simulation mode.'",
  ],
  "start-workflow": (entity, label) => entity && entity !== "workflows" ? [
    `Starting the "${label}" workflow simulation. Navigate to the Workflows screen to step through each stage, trigger mock outcomes, and view the action log. All steps are fictional — no real processes are initiated.`,
    `"${label}" workflow loaded. Head to the Workflows screen to begin. You'll be able to advance each step, choose mock outcomes (success/failure/warning), and review the full simulation log.`,
  ] : [
    "Which workflow? Available templates: Patient Intake, Grant Application, IT Incident Response, Loan Origination, Product Launch, Full-Cycle Recruiting, Content Production, Emergency Response. Navigate to the Workflows screen to browse and start any workflow.",
    "Try 'start patient intake workflow' or 'run loan origination.' The Workflows screen shows all 8 templates across different industries — each with full step-by-step simulation.",
  ],
  "generate-creative": (entity, label) => entity ? [
    `Generating a "${label}" production package. Navigate to the Creative screen and select "${label}" to generate a full fictional package: title, purpose, chapters, style guide, emotional arc, mock actors, and disclaimer. All demo-only — non-operational.`,
    `"${label}" creative package ready to generate. Head to the Creative Production screen. You can customize: topic, audience, and tone. The engine produces a complete fictional outline — scripts, chapters, visuals, transitions — all internal, safe, non-factual.`,
  ] : [
    "What would you like to create? Options: Video, Documentary, Training Module, Simulation, Storyboard, Script, Explainer, Podcast, Online Course, Presentation, Webinar, Commercial. Navigate to the Creative screen and choose a type to generate a full fictional production package.",
    "Try 'generate a training video' or 'create a documentary script.' The Creative Production screen will generate a complete fictional package — chapters, narration, style guide, and mock cast.",
  ],
  "generate-game": (entity, label) => entity ? [
    `Generating a ${label ?? "game"} Game Design Document. Navigate to the Games screen and select your type to generate a full fictional GDD: overview, mechanics, levels, NPCs, HUD, game loop, skill tree, and progression system. All fictional — demo-only.`,
    `Heading to the Game Engine for a ${label ?? "game"} GDD. You can set the title, world name, and target audience. The engine produces a complete fictional design document including story arc, NPC profiles, and asset lists. Internal use only.`,
  ] : [
    "What type of game? Options: RPG, Platformer, Strategy, Puzzle, Simulation, Adventure, Action, Horror, Sports, Educational, Sandbox, Survival. Navigate to the Games screen to generate a full fictional Game Design Document.",
    "Try 'generate an RPG game' or 'create a survival game design document.' The Game Engine produces a complete fictional GDD including levels, NPCs, mechanics, and HUD spec.",
  ],
  "generate-story": (entity, label) => entity ? [
    `Generating a ${label ?? "story"} project. Navigate to the Story / World screen (Story tab) to create a full fictional narrative structure: logline, synopsis, three-act breakdown, themes, conflict, and resolution. All fictional — demo-only.`,
    `Opening Story Engine for a ${label ?? "movie"} project. Choose your genre and tone, then generate a complete fictional story with themes, story structure, narrative style, and POV. Internal — non-factual.`,
  ] : [
    "What format? Options: Movie, TV Series, Mini-Series, Documentary, Comic, Graphic Novel, Novel, Short Story, Interactive Story, Audio Drama, Stage Play, Web Series. Navigate to the Story / World screen and generate a full fictional narrative structure.",
    "Try 'write a sci-fi movie' or 'outline a fantasy TV series.' The Story Engine produces loglines, act breakdowns, themes, conflict, and resolution — all entirely fictional.",
  ],
  "generate-character": (entity, label) => entity ? [
    `Generating a ${label ?? "character"} profile. Navigate to the Story / World screen (Character tab) to create a full fictional character: personality, motivation, fear, secret, abilities, arc, relationships, appearance, and voice style. All fictional.`,
    `Creating a ${label ?? "hero"} character profile. Head to Story / World → Character tab. You can set a name and story context. The Character Engine produces a complete profile including arc stages and relationships. Demo-only.`,
  ] : [
    "What archetype? Options: Hero, Mentor, Villain, Anti-Hero, Trickster, Shadow, Guardian, Ally, Innocent, Everyman. Navigate to the Story / World screen, Character tab, to generate a full fictional character profile.",
    "Try 'create a villain character' or 'generate an anti-hero profile.' The Character Engine produces motivation, arc, abilities, relationships, and backstory — all entirely fictional.",
  ],
  "generate-world": (entity, label) => entity ? [
    `Generating a ${label ?? "world"}. Navigate to the Story / World screen (World tab) to create a full fictional world: regions, factions, history, culture, technology, ecology, and (if applicable) magic system. All fictional — demo-only.`,
    `World Engine activated for ${label ?? "a new world"}. Head to Story / World → World tab. Set a world name and generate regions, factions, history, economy, politics, and calendar. All fabricated for demo purposes.`,
  ] : [
    "What type of world? Options: Fantasy, Sci-Fi, Contemporary, Historical, Post-Apocalyptic, Alternate History, Mythological, Horror, Utopia, Dystopia. Navigate to the Story / World screen, World tab, to generate a complete fictional world.",
    "Try 'create a dystopian world' or 'build a fantasy realm.' The World Engine generates regions, factions, culture, technology, ecology, and history — all entirely fictional.",
  ],
  "generate-content": () => [
    "__SMART_GENERATE__",
  ],
  "generate-invite": () => [
    "Opening the Instant Invite Generator. Select your recipients, review or edit the auto-generated message, then click Send. All contacts are fictional — no real messages are delivered. Demo-only.",
    "Instant Invite Generator activated! Choose from pre-stored mock contacts, customize the invite message if needed, and hit Submit to simulate a send. Fully fictional — no real email, SMS, or notifications are triggered.",
  ],
  "create-project": (entity, label) => entity ? [
    `Creating a connected project for "${label ?? "your project"}". Navigate to the Connection Layer screen. Select a format (Movie, TV Series, Video Game, Comic, Novel, etc.), set a title and logline, then add elements — Story, Character, World, Mechanics, or Workflow. The Completeness Pass will auto-score the project and flag missing sections. All fictional, internal, demo-only.`,
    `Opening the Connection Layer for "${label ?? "a new project"}". The Connection Layer links all your generated elements — story, characters, world, and mechanics — into a unified project. Connection threads are auto-generated, and the Internal Completeness Pass scores 0–100 with auto-fixes. Non-operational — conceptual only.`,
  ] : [
    "The Connection Layer links your generated Story, Character, World, Game Mechanics, and Workflow elements into a unified fictional project. Navigate to Connection, create a project, choose a format (Movie / Game / Novel / World Bible / Cross-Media Universe, etc.), then add the elements you've generated. The Completeness Pass scores the project and flags critical, major, and minor gaps — auto-filling where possible.",
    "Try 'create a connected project for my game' or 'link my story and world into a cross-media project.' The Connection Layer assembles any combination of generated elements and runs an Internal Completeness Pass to score and fix the result. All fictional — demo-only.",
  ],
  "generate-strategy": (entity, label) => entity ? [
    `Generating a ${label ?? "growth strategy"} roadmap. Navigate to the Strategy screen. Choose your Focus (Growth, Revenue, Product, Market, Competitive, Creative IP, etc.), set a time horizon (30 days to 5 years), and generate a full conceptual roadmap with: North Star, milestones, key actions, success metrics, competitive position, revenue model, risks, quick wins, and long bets. Conceptual planning only — no outcomes guaranteed.`,
    `Opening Strategy & Roadmap Module for "${label ?? "your strategy"}". Choose a focus area and horizon, then generate a structured conceptual roadmap. Includes: competitive positioning, revenue model with prioritization, risk register with mitigations, and quick-win actions. Non-operational — not real business advice.`,
  ] : [
    "The Strategy & Roadmap Module generates conceptual planning frameworks: milestones, competitive position, revenue model, risks, quick wins, and long bets. Navigate to the Strategy screen, pick a focus area (Growth / Revenue / Product / Market / Creative IP / Turnaround, etc.), set a time horizon, and generate a full fictional roadmap. Conceptual only — no real advice, no guarantees.",
    "Try 'generate a 90-day growth strategy' or 'create a revenue model roadmap.' The Strategy module covers 12 focus types across 6 time horizons. Every output is conceptual planning assistance — not real business, financial, or legal advice. Navigate to the Strategy screen to begin.",
  ],
  "open-packet": (entity, label) => label ? [
    `Opening the ${label} packet. You'll see the mock endpoint, version, status, and available flow actions.`,
  ] : [
    "Which packet? Go to the Packets screen to see all available demo integration packets and open any one.",
  ],
  "walk-through": (_, label, topic) => [
    `Here's the step-by-step walk-through for ${topic ?? "the submission workflow"}:\n\n1. Review your session context (role, agency, state) on the Home screen.\n2. Navigate to Packets and open the relevant packet.\n3. Go to Submissions and use the 3-step Submit flow.\n4. Step 1: Review context. Step 2: Confirm packet. Step 3: Submit.\n5. Your demo status updates and the action log records the submission.\n\nAll steps are internal mock flows — no real data is submitted.`,
    `Walk-through for ${topic ?? "demo workflows"}:\n\nStart on Home → check your Role and Agency. Then go to Programs and select one to enroll. Then go to Submissions → run the 3-step flow → Submit. The Dashboard will show your updated action count.\n\nEverything is fictional and safe.`,
  ],
  "simulate": (_, __, scenario) => [
    `Simulating: "${scenario ?? "a user completing a submission"}".\n\nIn this mock scenario:\n• The user (Care Coordinator) selects the Medicaid Managed Care program.\n• They open the CMS integration packet.\n• They proceed through the 3-step submission flow.\n• Status changes to "submitted" then "under-review."\n• The action log captures every step.\n\nAll fictional. No real workflow was triggered.`,
    `Scenario simulated: "${scenario ?? "submission flow"}".\n\nMock result: The session state updates, the packet is flagged as submitted (demo), and the action log records the interaction. A real system would route this to actual processing — this demo does not.`,
  ],
  "show-form": (_, __, screen) => [
    `The ${screen ?? "current"} screen shows the active mock form/interface. Navigate there now to see all fields, selectors, and action buttons.\n\nAll forms in this platform are demo-only. No data is transmitted or stored beyond your local browser session.`,
  ],
  "show-data": (_, __, dataType) => [
    `Here's what's available in the mock dataset for ${dataType ?? "all categories"}:\n\n• 15 Roles (System Admin through Executive)\n• 18 Agencies (CMS, HHS, FDA, CDC, AHRQ, VA, SAMHSA, ACL, NIH, OMH, ONC, HRSA, IHS, BPHC, CHIP, ACA, Medicaid, TRICARE)\n• 51 States + DC\n• 20 Vendors (EHR, Analytics, Claims, Care Mgmt, etc.)\n• 16 Programs (Medicaid Managed Care, ACO, CCBHC, 1115 Waiver, etc.)\n• 22 Services (Primary care through palliative)\n• 15 Healthcare Categories\n• 12 Payer Types\n• 16 Facilities\n\nAll data is fictional. Navigate to the relevant screen to select and activate any item.`,
  ],
  "test-me": () => [
    "Starting a quiz! I'll ask you a series of questions about this platform's workflows, roles, and demo data. Answer in plain text — I'll grade each one.\n\nFirst question coming up…",
  ],
  "test-answer": (_, __, feedback) => [`${feedback ?? "Answer recorded."}`],
  "status-check": () => [],
  "explain": (_, __, topic) => [
    `Here's a mock explanation of "${topic ?? "this platform"}":\n\nThis is CreateAI Brain — a demo-only OS-style platform. It has 12 apps, 9 universal state fields, and a conversation layer that processes natural language to update screens and workflows.\n\nAll data is fictional. No real APIs, real submissions, or real clinical/financial/legal guidance exists here. This is a design and training prototype only.`,
  ],
  "next-step": () => [
    "Moving to the next step. If you're in a walk-through, say 'walk me through [topic]' to restart. If you're in a submission flow, go to Submissions and click Next.",
  ],
  "back-step": () => [
    "Going back. In the submission flow, click the Back button. On any screen, the mini-nav in Universal Hub lets you switch screens freely.",
  ],
  "reset": () => [
    "Session state has been reset to defaults. All selections (role, agency, state, vendor, packet) return to their default values. Action log cleared.",
  ],
  "navigate": (_, label) => label ? [
    `Navigating to the ${label} screen now.`,
    `Opening ${label}. You can also tap it in the sidebar anytime.`,
  ] : [
    "Where would you like to go? Available screens: Home, Dashboard, Roles, Agencies, States, Vendors, Programs, Packets, Submissions, Settings, Industries, Workflows, Creative.",
  ],
  "help": () => [
    `CreateAI Brain — UCP-X v2\n\nYou can type ANYTHING and the Brain responds instantly.\n\n✨ JUST TYPE IT:\n  • "Create a roadmap for a healthcare app"\n  • "Plan a game launch strategy"\n  • "List 6 ideas for onboarding workflows"\n  • "Write a character description for a sci-fi hero"\n  • "What is the Connection Layer?"\n  • "Brainstorm marketing ideas for a fintech app"\n\n🔀 SWITCH: "Switch to Care Coordinator" / "Change agency to SAMHSA" / "Set state to Texas"\n\n🏭 INDUSTRIES: "Explore healthcare" / "Switch to technology industry"\n\n⚙️ WORKFLOWS: "Start patient intake workflow" / "Run loan origination"\n\n🎬 CREATIVE: "Generate a training video" / "Create a documentary script"\n\n🗺️ NAVIGATE: "Go to Dashboard" / "Open Industries" / "Show me Workflows"\n\n🚶 WALK-THROUGH: "Walk me through the submission flow"\n\n🎭 SIMULATE: "Pretend a user submitted a packet"\n\n📧 INVITE: "Send invites" / "Open invite generator"\n\n🧪 TEST: "Test me on workflows" / "Quiz me on agencies"\n\n📊 STATUS: "What's my current role?" / "Where am I?"\n\nAll interactions are internal, fictional, demo-only. Safety Core always active.`,
  ],
  "unknown": () => [
    "__SMART_GENERATE__",
  ],
};

// ─── Conversation Engine Class ────────────────────────────────────────────

class ConversationEngineClass {
  private state: ConversationState;

  constructor() {
    this.state = this.load();
  }

  private load(): ConversationState {
    try {
      const raw = localStorage.getItem(CONVO_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {
      history: [],
      testSession: this.emptyTestSession(),
      lastIntent: null,
      stepContext: null,
    };
  }

  private save() {
    try {
      localStorage.setItem(CONVO_STORAGE_KEY, JSON.stringify(this.state));
    } catch { /* ignore */ }
  }

  private emptyTestSession(): TestSession {
    return {
      isActive: false, topic: "", questions: [], currentIndex: 0,
      score: 0, totalAnswered: 0, lastFeedback: null, awaitingAnswer: false,
    };
  }

  private msgId() {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  }

  private pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

  // ── Intent Detection ─────────────────────────────────────────────────
  detectIntent(input: string): DetectedIntent {
    const trimmed = input.trim();
    if (!trimmed) return this.makeIntent("unknown", null, null, null, null, "low", input);

    let bestIntent: IntentType = "unknown";
    let bestConfidence: "high" | "medium" | "low" = "low";

    for (const { intent, patterns } of PATTERNS) {
      for (const pattern of patterns) {
        if (pattern.test(trimmed)) {
          bestIntent = intent;
          bestConfidence = "high";
          break;
        }
      }
      if (bestConfidence === "high") break;
    }

    // If in test mode and awaiting answer, override
    if (this.state.testSession.isActive && this.state.testSession.awaitingAnswer) {
      bestIntent = "test-answer";
      bestConfidence = "high";
    }

    // Smart catch-all: any non-empty unrecognized input → generate content
    if (bestIntent === "unknown" && trimmed.length > 0) {
      bestIntent = "generate-content";
      bestConfidence = "medium";
    }

    const { entity, entityLabel, stateUpdate } = extractEntity(trimmed, bestIntent);
    const screen = extractScreen(trimmed, bestIntent);

    return this.makeIntent(bestIntent, entity, entityLabel, screen, stateUpdate, bestConfidence, trimmed);
  }

  private makeIntent(
    intent: IntentType, entity: string | null, entityLabel: string | null,
    screen: UniversalView | null, stateUpdate: Record<string, string> | null,
    confidence: "high" | "medium" | "low", rawInput: string,
  ): DetectedIntent {
    return { intent, entity, entityLabel, screen, stateUpdate, confidence, rawInput };
  }

  // ── Process Input ────────────────────────────────────────────────────
  process(input: string): {
    userMsg: ConversationMessage;
    systemMsg: ConversationMessage;
    intent: DetectedIntent;
    resetState?: boolean;
  } {
    const detected = this.detectIntent(input);

    const userMsg: ConversationMessage = {
      id: this.msgId(), role: "user", text: input,
      timestamp: new Date().toISOString(), intent: detected.intent,
    };
    this.state.history.push(userMsg);

    let responseText = "";
    let stateChange: string | undefined;
    let resetState = false;

    // Handle test-answer separately
    if (detected.intent === "test-answer" && this.state.testSession.isActive) {
      const { text, advance } = this.gradAnswer(input);
      responseText = text;
      if (advance) {
        const next = this.nextTestQuestion();
        if (next) responseText += `\n\n${next}`;
        else responseText += "\n\n🎉 Quiz complete! " + this.quizSummary();
      }
    } else if (detected.intent === "test-me") {
      this.startTest("general");
      const templates = RESPONSES["test-me"](null, null);
      responseText = this.pick(templates);
      const q = this.nextTestQuestion();
      if (q) responseText += `\n\n${q}`;
    } else if (detected.intent === "status-check") {
      responseText = this.buildStatusResponse();
    } else if (detected.intent === "reset") {
      resetState = true;
      responseText = this.pick(RESPONSES["reset"](null, null));
      this.state.testSession = this.emptyTestSession();
      this.state.stepContext = null;
    } else if (detected.intent === "walk-through") {
      const lower = input.toLowerCase();
      const topic = lower.includes("submiss") ? "submission workflow"
        : lower.includes("enroll") ? "program enrollment"
        : lower.includes("packet") ? "packet flow"
        : lower.includes("role") ? "role switching"
        : "the full demo flow";
      responseText = this.pick(RESPONSES["walk-through"](null, null, topic));
      this.state.stepContext = {
        workflow: topic,
        step: 0,
        steps: ["Review context", "Select entity", "Confirm", "Submit", "Check status"],
      };
    } else if (detected.intent === "simulate") {
      const scenario = input.replace(/pretend|simulate|what happens if|what if|imagine|suppose|let.?s say/gi, "").trim();
      responseText = this.pick(RESPONSES["simulate"](null, null, scenario));
    } else if (detected.intent === "explain") {
      const topic = input.replace(/what is|what are|explain|describe|tell me about|define|how does|what does/gi, "").trim();
      responseText = this.pick(RESPONSES["explain"](null, null, topic));
    } else if (detected.intent === "show-data") {
      const lower = input.toLowerCase();
      const dataType = lower.includes("role") ? "roles" : lower.includes("agenc") ? "agencies"
        : lower.includes("state") ? "states" : lower.includes("vendor") ? "vendors"
        : lower.includes("program") ? "programs" : "all categories";
      responseText = this.pick(RESPONSES["show-data"](null, null, dataType));
    } else {
      const templates = RESPONSES[detected.intent]?.(detected.entity, detected.entityLabel) ?? ["__SMART_GENERATE__"];
      responseText = this.pick(templates);
      if (detected.stateUpdate) {
        const key = Object.keys(detected.stateUpdate)[0];
        const val = Object.values(detected.stateUpdate)[0];
        stateChange = `${key}: ${val}`;
      }
    }

    // If the response is the smart generate token, produce structured content
    if (responseText === "__SMART_GENERATE__") {
      responseText = this.generateSmartContent(input);
    }

    this.state.lastIntent = detected.intent;

    const systemMsg: ConversationMessage = {
      id: this.msgId(), role: "system", text: responseText,
      timestamp: new Date().toISOString(), intent: detected.intent,
      stateChange,
    };
    this.state.history = [...this.state.history, systemMsg].slice(-200);
    this.save();

    return { userMsg, systemMsg, intent: detected, resetState };
  }

  // ── Smart Content Generator ───────────────────────────────────────────
  // Brain Persona rule: never ignore a message. Generate immediately.
  // Inspects the input and produces structured, helpful text output.
  generateSmartContent(input: string): string {
    const lower = input.toLowerCase().trim();
    const lines: string[] = [];

    const isQuestion  = /^(what|how|why|when|where|who|which|is |are |can |could |would |should |do |does |did )/i.test(lower);
    const isList      = /\b(list|show|give|what are|types of|examples of|options)\b/i.test(lower);
    const isPlan      = /\b(plan|roadmap|steps|strategy|approach|process|procedure|checklist|phase|phases)\b/i.test(lower);
    const isCreate    = /\b(create|build|make|generate|write|draft|design|produce|develop|compose)\b/i.test(lower);
    const isIdea      = /\b(idea|ideas|brainstorm|suggest|suggestions|options|alternatives|possibilities)\b/i.test(lower);
    const isExplain   = /\b(explain|describe|tell me about|what is|what are|define|break down|clarify)\b/i.test(lower);
    const isWorkflow  = /\b(workflow|process|flow|procedure|pipeline|step-by-step)\b/i.test(lower);
    const isStrategy  = /\b(strategy|marketing|launch|growth|go-to-market|brand|positioning)\b/i.test(lower);
    const isDoc       = /\b(document|report|proposal|template|spec|specification)\b/i.test(lower);

    const subject = input
      .replace(/^(create|build|make|generate|write|draft|design|plan|list|show|give me|tell me|explain|describe|what is|what are|how do|can you|could you|would you|please|help me|develop|produce|compose|brainstorm)/gi, "")
      .replace(/[?.!]/g, "")
      .trim() || "your project";

    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const S = cap(subject);

    if (isPlan || (isCreate && /\b(plan|strategy|roadmap|structure|framework|outline|checklist)\b/i.test(lower))) {
      lines.push(`# ${S} — Strategic Plan`);
      lines.push(``);
      lines.push(`## Summary`);
      lines.push(`This structured plan covers every phase needed to successfully execute ${S}. Each phase has clear objectives, actionable steps, and success metrics so you always know exactly where you stand and what to do next.`);
      lines.push(``);
      lines.push(`## Phase 1 — Foundation & Discovery`);
      lines.push(`- Define the core goal and what success looks like in concrete terms`);
      lines.push(`- Identify your primary audience, stakeholders, and decision-makers`);
      lines.push(`- Audit existing resources, constraints, and capabilities`);
      lines.push(`- Set your timeline, budget range (conceptual), and key milestones`);
      lines.push(`- Deliverable: a one-page brief that everyone agrees on`);
      lines.push(``);
      lines.push(`## Phase 2 — Design & Architecture`);
      lines.push(`- Map out the full structure: components, modules, and how they connect`);
      lines.push(`- Define roles, responsibilities, and ownership for each piece`);
      lines.push(`- Draft the core content, system, or offer in rough form`);
      lines.push(`- Identify dependencies and critical path items`);
      lines.push(`- Deliverable: a visual map or outline of the complete system`);
      lines.push(``);
      lines.push(`## Phase 3 — Build & Iterate`);
      lines.push(`- Execute the build in focused sprints (1–2 week cycles)`);
      lines.push(`- Test each component independently before integrating`);
      lines.push(`- Gather feedback early — internal stakeholders first, then real users`);
      lines.push(`- Iterate based on what's working; cut what isn't`);
      lines.push(`- Deliverable: a working prototype or first complete draft`);
      lines.push(``);
      lines.push(`## Phase 4 — Validate & Refine`);
      lines.push(`- Run a completeness check against the original goal`);
      lines.push(`- Stress-test edge cases: what breaks? what's missing?`);
      lines.push(`- Polish the user experience, clarity, and presentation`);
      lines.push(`- Confirm all safety, legal, and quality checkpoints are met`);
      lines.push(`- Deliverable: a version ready for a real audience`);
      lines.push(``);
      lines.push(`## Phase 5 — Launch & Scale`);
      lines.push(`- Announce with a clear story — who it's for, what problem it solves`);
      lines.push(`- Start with a focused audience before going broad`);
      lines.push(`- Measure results against your success metrics from Phase 1`);
      lines.push(`- Build the feedback loop that drives continuous improvement`);
      lines.push(`- Deliverable: live launch + initial traction data`);
      lines.push(``);
      lines.push(`## Smart Next Steps`);
      lines.push(`1. Finalize the goal statement from Phase 1 — write it in one sentence`);
      lines.push(`2. Identify the 3 people who need to be involved immediately`);
      lines.push(`3. Block time this week to complete Phase 1 deliverable`);
      lines.push(`4. Open the Documents app to create your project brief`);
      lines.push(`5. Return here and ask the Brain to expand any specific phase`);

    } else if (isStrategy || isWorkflow && isCreate) {
      lines.push(`# ${S} — Complete Strategy`);
      lines.push(``);
      lines.push(`## Summary`);
      lines.push(`A full strategy for ${S}, covering positioning, audience, channels, content, and execution. Use this as your master plan — built to be expanded in any direction.`);
      lines.push(``);
      lines.push(`## Core Objective`);
      lines.push(`- Primary goal: [define the single most important outcome]`);
      lines.push(`- Success metric: [the number or signal that means you've won]`);
      lines.push(`- Timeline: [realistic timeframe for the first meaningful result]`);
      lines.push(``);
      lines.push(`## Audience & Positioning`);
      lines.push(`- Primary audience: [describe them specifically — role, situation, pain]`);
      lines.push(`- Core pain: what they struggle with that ${S} solves`);
      lines.push(`- Unique angle: why your version of ${S} is different and better`);
      lines.push(`- Positioning statement: "For [audience] who [pain], ${S} is the [category] that [benefit] unlike [alternative]."`);
      lines.push(``);
      lines.push(`## Channels & Tactics`);
      lines.push(`- Primary channel: [where your audience actually spends time]`);
      lines.push(`- Content types: short-form video, email, thought leadership, community`);
      lines.push(`- Cadence: consistent beats over time outperform burst campaigns`);
      lines.push(`- Amplifiers: partnerships, referrals, PR, organic word-of-mouth`);
      lines.push(``);
      lines.push(`## Execution Timeline`);
      lines.push(`- Week 1–2: finalize messaging, create core assets`);
      lines.push(`- Week 3–4: soft launch to warm audience, gather real feedback`);
      lines.push(`- Month 2: iterate + expand based on what resonated`);
      lines.push(`- Month 3+: scale what's working, cut what isn't`);
      lines.push(``);
      lines.push(`## Risk & Mitigation`);
      lines.push(`- Risk 1: [most likely thing that could slow you down] → Mitigation: [how you prevent or respond]`);
      lines.push(`- Risk 2: audience mismatch → Mitigation: validate with 5 real conversations before building`);
      lines.push(`- Risk 3: over-engineering → Mitigation: ship something simple first, learn, then expand`);
      lines.push(``);
      lines.push(`## Smart Next Steps`);
      lines.push(`1. Write your positioning statement and test it on 3 people this week`);
      lines.push(`2. Pick one primary channel and commit to it for 30 days`);
      lines.push(`3. Create your first piece of core content this week`);
      lines.push(`4. Set a specific date for the soft launch`);
      lines.push(`5. Ask the Brain to generate a full content calendar for this strategy`);

    } else if (isWorkflow) {
      lines.push(`# ${S} — Workflow Map`);
      lines.push(``);
      lines.push(`## Summary`);
      lines.push(`An end-to-end workflow for ${S} with clear roles, steps, handoffs, and quality checkpoints. Every step is actionable and connects to the next.`);
      lines.push(``);
      lines.push(`## Workflow Steps`);
      lines.push(`1. **Trigger** — what event or action starts this workflow`);
      lines.push(`2. **Intake** — information or resources collected at the start`);
      lines.push(`3. **Validation** — check that inputs are complete and correct`);
      lines.push(`4. **Processing** — the core work happens here`);
      lines.push(`5. **Review** — quality check before moving forward`);
      lines.push(`6. **Approval** — who signs off and under what conditions`);
      lines.push(`7. **Output** — what gets produced or delivered`);
      lines.push(`8. **Distribution** — who receives the output and how`);
      lines.push(`9. **Follow-through** — what happens after delivery`);
      lines.push(`10. **Feedback loop** — how you improve the workflow over time`);
      lines.push(``);
      lines.push(`## Role Assignments`);
      lines.push(`- Owner: the person accountable for the entire workflow`);
      lines.push(`- Executor: performs steps 2–4`);
      lines.push(`- Reviewer: handles steps 5–6`);
      lines.push(`- Stakeholder: receives output in step 7–8`);
      lines.push(``);
      lines.push(`## Quality Checkpoints`);
      lines.push(`- After step 3: is the information complete and accurate?`);
      lines.push(`- After step 5: does the output meet the defined standard?`);
      lines.push(`- After step 8: did the recipient confirm receipt and satisfaction?`);
      lines.push(``);
      lines.push(`## Smart Next Steps`);
      lines.push(`1. Map each step to a specific person or role`);
      lines.push(`2. Define the trigger event precisely`);
      lines.push(`3. Set SLA time targets for each step`);
      lines.push(`4. Identify the most common point of failure and add a safeguard`);
      lines.push(`5. Test the workflow with one real scenario before rolling out broadly`);

    } else if (isList || isIdea) {
      lines.push(`# Ideas & Options: ${S}`);
      lines.push(``);
      lines.push(`## Summary`);
      lines.push(`An expanded set of options, directions, and possibilities for ${S}. These range from quick wins to bigger bets — pick the ones that match your current stage and goals.`);
      lines.push(``);
      lines.push(`## Immediate Options (Start This Week)`);
      lines.push(`- Create a one-page overview that defines ${S} clearly`);
      lines.push(`- Identify the 3 people who need to be involved first`);
      lines.push(`- Map the problem you're solving in one clear sentence`);
      lines.push(`- Research 3 examples of others who've tackled something similar`);
      lines.push(``);
      lines.push(`## Growth Options (Start This Month)`);
      lines.push(`- Build a simple version and show it to 5 potential users`);
      lines.push(`- Launch a beta or soft launch with a small invited group`);
      lines.push(`- Create a content or marketing plan around ${S}`);
      lines.push(`- Establish a feedback loop so you improve systematically`);
      lines.push(``);
      lines.push(`## Expansion Options (Longer Term)`);
      lines.push(`- Build partnerships that extend the reach of ${S}`);
      lines.push(`- Create a scalable system that runs with less of your time`);
      lines.push(`- Add monetization, community, or platform elements`);
      lines.push(`- Document the playbook so others can replicate or join`);
      lines.push(``);
      lines.push(`## Unexpected Angles Worth Exploring`);
      lines.push(`- What if ${S} served a completely different audience?`);
      lines.push(`- What if ${S} was delivered as a service instead of a product (or vice versa)?`);
      lines.push(`- What if the business model was community-first rather than revenue-first?`);
      lines.push(`- What dimension of ${S} has no one else focused on yet?`);
      lines.push(``);
      lines.push(`## Smart Next Steps`);
      lines.push(`1. Pick 1 idea from "Immediate" and take one action today`);
      lines.push(`2. Write a one-paragraph version of the best idea to test how it sounds`);
      lines.push(`3. Ask the Brain to generate a full plan for whichever option excites you most`);
      lines.push(`4. Share the concept with one person and note their reaction`);
      lines.push(`5. Come back tomorrow and pick the next level`);

    } else if (isDoc) {
      lines.push(`# ${S} — Document`);
      lines.push(``);
      lines.push(`## Purpose`);
      lines.push(`This document defines the structure, content, and intent for ${S}. Use it as a working draft — replace placeholder sections with your specific details.`);
      lines.push(``);
      lines.push(`## Overview`);
      lines.push(`[Write 2–3 sentences that describe what this document covers and who it's for.]`);
      lines.push(``);
      lines.push(`## Background & Context`);
      lines.push(`[Why does this document exist? What situation or need prompted it?]`);
      lines.push(``);
      lines.push(`## Core Content`);
      lines.push(`[This is where the main substance goes. Break it into logical sub-sections.]`);
      lines.push(``);
      lines.push(`### Section 1: [Name]`);
      lines.push(`[Content for this section]`);
      lines.push(``);
      lines.push(`### Section 2: [Name]`);
      lines.push(`[Content for this section]`);
      lines.push(``);
      lines.push(`### Section 3: [Name]`);
      lines.push(`[Content for this section]`);
      lines.push(``);
      lines.push(`## Key Decisions & Notes`);
      lines.push(`- [Important decision or assumption that shapes this document]`);
      lines.push(`- [Any dependencies or prerequisites]`);
      lines.push(`- [Who needs to review or approve this]`);
      lines.push(``);
      lines.push(`## Smart Next Steps`);
      lines.push(`1. Fill in the Overview section with your specific context`);
      lines.push(`2. Name and fill each sub-section with real content`);
      lines.push(`3. Share a draft with one key stakeholder for feedback`);
      lines.push(`4. Finalize and save to your Documents app`);
      lines.push(`5. Link this document to the relevant project`);

    } else if (isCreate || isExplain || isQuestion) {
      lines.push(`# ${S}`);
      lines.push(``);
      lines.push(`## Summary`);
      lines.push(`Here's a complete, structured response to your request about ${S}. This covers the core concept, key elements, how to approach it, and the most important next actions.`);
      lines.push(``);
      lines.push(`## What This Is`);
      lines.push(`${S} is [a platform / system / concept / approach] that [does what for whom]. At its core, it's about [the fundamental idea in plain language].`);
      lines.push(``);
      lines.push(`## Why It Matters`);
      lines.push(`- It solves [specific problem] that [audience] currently struggles with`);
      lines.push(`- It creates [specific opportunity or advantage]`);
      lines.push(`- The right approach here has a compounding effect — early decisions matter`);
      lines.push(``);
      lines.push(`## How to Approach It`);
      lines.push(`1. Start by defining [the most important clarifying question]`);
      lines.push(`2. Map out [the key components or stakeholders]`);
      lines.push(`3. Build or draft [the first concrete thing]`);
      lines.push(`4. Test with [the right audience or validation method]`);
      lines.push(`5. Iterate until [the success condition is met]`);
      lines.push(``);
      lines.push(`## Key Considerations`);
      lines.push(`- **Scope**: be specific about what's in and what's out — clarity prevents scope creep`);
      lines.push(`- **Resources**: what do you have, and what do you need to find or build?`);
      lines.push(`- **Timeline**: what can you realistically accomplish in 30, 60, and 90 days?`);
      lines.push(`- **Ownership**: who is responsible for driving this forward?`);
      lines.push(``);
      lines.push(`## Smart Next Steps`);
      lines.push(`1. Write a one-sentence definition of ${S} that you'd use to explain it to anyone`);
      lines.push(`2. Identify the single most important action to take in the next 48 hours`);
      lines.push(`3. Ask the Brain to generate a full plan, strategy, or document for any part of this`);
      lines.push(`4. Open a new Project to organize all outputs for ${S} in one place`);
      lines.push(`5. Return with a specific follow-up question to go deeper on any section`);

    } else {
      lines.push(`# ${S}`);
      lines.push(``);
      lines.push(`## Summary`);
      lines.push(`The Brain is ready to help you build, plan, create, or explore ${S}. Here's a structured starting point — ask for any section to be expanded into a full plan, strategy, document, or creative output.`);
      lines.push(``);
      lines.push(`## What the Brain Can Generate for This`);
      lines.push(`- **Full Plan** — phased, structured, with milestones and deliverables`);
      lines.push(`- **Strategy** — positioning, audience, channels, execution timeline`);
      lines.push(`- **Document** — structured template or draft for any document type`);
      lines.push(`- **Workflow** — step-by-step process with roles and handoffs`);
      lines.push(`- **Ideas** — expanded possibilities, angles, and unexpected directions`);
      lines.push(`- **Marketing** — social posts, email sequences, ad copy, campaign plans`);
      lines.push(`- **Creative** — stories, scripts, presentations, creative packages`);
      lines.push(``);
      lines.push(`## Quick Start Prompts`);
      lines.push(`- "Create a full plan for ${subject}"`);
      lines.push(`- "Write a strategy for ${subject}"`);
      lines.push(`- "List 10 ideas for ${subject}"`);
      lines.push(`- "Design a workflow for ${subject}"`);
      lines.push(`- "Draft a proposal for ${subject}"`);
      lines.push(``);
      lines.push(`## Smart Next Steps`);
      lines.push(`1. Tell the Brain more about what you're trying to build or achieve`);
      lines.push(`2. Ask for a specific output type (plan, strategy, workflow, document)`);
      lines.push(`3. Open a new Project to organize your work on ${S}`);
      lines.push(`4. Use the Tools app to generate a formatted document from this`);
    }

    lines.push(``);
    lines.push(`*[Structural output — CreateAI Brain · All content is conceptual and for planning only]*`);
    return lines.join("\n");
  }

  private buildStatusResponse(): string {
    return `This data comes from the universal state — here's your current session:\n\n[Check the Dashboard screen for live values]\n\nYou can also ask: "What's my role?" "What agency am I on?" "What state is active?" and the response updates accordingly.`;
  }

  // ── Test Mode ────────────────────────────────────────────────────────
  startTest(topic: string) {
    const pool = topic === "general"
      ? QUESTION_BANK
      : QUESTION_BANK.filter(q => q.topic === topic);
    const selected = [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
    this.state.testSession = {
      isActive: true, topic,
      questions: selected, currentIndex: -1,
      score: 0, totalAnswered: 0,
      lastFeedback: null, awaitingAnswer: false,
    };
    this.save();
  }

  nextTestQuestion(): string | null {
    const ts = this.state.testSession;
    ts.currentIndex += 1;
    if (ts.currentIndex >= ts.questions.length) {
      ts.isActive = false;
      this.save();
      return null;
    }
    const q = ts.questions[ts.currentIndex];
    ts.awaitingAnswer = true;
    this.save();
    return `❓ Question ${ts.currentIndex + 1} of ${ts.questions.length} [${q.topic}]\n\n${q.question}\n\n${q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("\n")}\n\nType A, B, C, or D — or type the full answer.`;
  }

  gradAnswer(input: string): { text: string; advance: boolean } {
    const ts = this.state.testSession;
    if (!ts.isActive || ts.currentIndex >= ts.questions.length) return { text: "No active quiz.", advance: false };

    const q = ts.questions[ts.currentIndex];
    const trimmed = input.trim().toUpperCase();
    const letterIndex = ["A", "B", "C", "D"].indexOf(trimmed);
    const actualAnswer = letterIndex >= 0 ? q.options[letterIndex] : input.trim();
    const isCorrect = actualAnswer.toLowerCase().includes(q.answer.toLowerCase()) || q.answer.toLowerCase().includes(actualAnswer.toLowerCase());

    ts.totalAnswered += 1;
    ts.awaitingAnswer = false;

    if (isCorrect) {
      ts.score += 1;
      ts.lastFeedback = `✅ Correct! ${q.explanation}`;
    } else {
      ts.lastFeedback = `❌ Not quite. The correct answer is "${q.answer}."\n\n${q.explanation}\n\n💡 Try again next time — this is a demo training environment.`;
    }
    this.save();
    return { text: ts.lastFeedback, advance: true };
  }

  quizSummary(): string {
    const ts = this.state.testSession;
    const pct = Math.round((ts.score / ts.totalAnswered) * 100);
    const grade = pct >= 80 ? "Excellent" : pct >= 60 ? "Good" : "Keep practicing";
    return `Score: ${ts.score}/${ts.totalAnswered} (${pct}%) — ${grade}!\n\nThis was a demo training quiz. No results are stored externally. Say "test me" to start another round.`;
  }

  // ── Getters ──────────────────────────────────────────────────────────
  getHistory(): ConversationMessage[] { return [...this.state.history]; }
  getTestSession(): TestSession { return { ...this.state.testSession }; }
  getLastIntent(): IntentType | null { return this.state.lastIntent; }

  clearHistory() {
    this.state.history = [];
    this.state.testSession = this.emptyTestSession();
    this.state.stepContext = null;
    this.save();
  }

  addSystemMessage(text: string) {
    const msg: ConversationMessage = {
      id: this.msgId(), role: "system", text,
      timestamp: new Date().toISOString(),
    };
    this.state.history.push(msg);
    this.state.history = this.state.history.slice(-200);
    this.save();
  }
}

export const ConversationEngine = new ConversationEngineClass();
