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

// ─── Types ────────────────────────────────────────────────────────────────

export type IntentType =
  | "switch-role" | "switch-agency" | "switch-state" | "switch-vendor"
  | "switch-department" | "switch-user-type" | "switch-demo-status"
  | "navigate" | "open-packet" | "walk-through" | "simulate"
  | "show-form" | "show-data" | "test-me" | "status-check"
  | "explain" | "help" | "test-answer" | "next-step" | "back-step"
  | "reset" | "unknown";

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
    intent: "navigate",
    patterns: [
      /\b(go to|open|show|take me to|navigate to|load|display|view)\b.*(home|dashboard|roles?|agencies|states?|vendors?|programs?|packets?|submissions?|settings?|talk|conversation|universal|hub)\b/i,
      /\b(home|dashboard|roles?|agencies|states?|vendors?|programs?|packets?|submissions?|settings?)\s*(screen|page|view|tab|section)\b/i,
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
  }
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
  "navigate": (_, label) => label ? [
    `Navigating to the ${label} screen now.`,
    `Opening ${label}. You can also tap it in the sidebar anytime.`,
  ] : [
    "Where would you like to go? Available screens: Home, Dashboard, Roles, Agencies, States, Vendors, Programs, Packets, Submissions, Settings.",
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
  "help": () => [
    `Here's what you can say or type:\n\n🔀 SWITCH: "Switch to Care Coordinator" / "Change agency to SAMHSA" / "Set state to Texas" / "Use Nexus Health"\n\n🗺️ NAVIGATE: "Go to Dashboard" / "Open Packets" / "Show me Submissions"\n\n🚶 WALK-THROUGH: "Walk me through the submission flow" / "Explain the steps for enrollment"\n\n🎭 SIMULATE: "Pretend a user submitted a packet" / "What happens if the status is rejected?"\n\n📋 SHOW: "Show me what the form looks like" / "What roles are available?"\n\n🧪 TEST: "Test me on workflows" / "Quiz me on agencies"\n\n📊 STATUS: "What's my current role?" / "Where am I?"\n\nAll interactions are internal, mock, demo-only.`,
  ],
  "unknown": () => [
    "I'm not sure what you're asking — try 'help' to see all supported commands. You can switch roles, navigate screens, run walk-throughs, simulate scenarios, show data, or take a quiz.",
    "Hmm, I didn't catch that. Try phrases like 'Switch to Provider,' 'Go to Dashboard,' 'Walk me through the submission flow,' or 'Test me on agencies.'",
    "I didn't understand that request. Type 'help' for a full list of supported actions — all internal, mock, demo-only.",
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
      const templates = RESPONSES[detected.intent]?.(detected.entity, detected.entityLabel) ?? RESPONSES["unknown"](null, null);
      responseText = this.pick(templates);
      if (detected.stateUpdate) {
        const key = Object.keys(detected.stateUpdate)[0];
        const val = Object.values(detected.stateUpdate)[0];
        stateChange = `${key}: ${val}`;
      }
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
