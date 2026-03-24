// ═══════════════════════════════════════════════════════════════════════════
// strategyPlanner.ts
// Input: outcome goal + context.
// Output: ordered execution steps, each with a required Capability.
// NOTE: Never references engine IDs directly. Capabilities only.
// ═══════════════════════════════════════════════════════════════════════════

import { type Capability, detectCapabilityFromGoal } from "./capabilityRegistry";
import { gatedAICall } from "./aiGatekeeper";

export interface PlanStep {
  stepIndex:    number;
  description:  string;
  capability:   Capability;
  canParallel:  boolean;   // true if this step can run in parallel with adjacent steps
  required:     boolean;   // false = optional enrichment step
  context:      Record<string, unknown>;
}

export interface ExecutionPlan {
  planId:      string;
  goal:        string;
  totalSteps:  number;
  steps:       PlanStep[];
  estimatedMs: number;
  source:      "deterministic" | "ai-assisted";
}

// ── Deterministic pattern library ─────────────────────────────────────────

interface GoalPattern {
  keywords:  string[];
  steps:     Array<{ description: string; capability: Capability; canParallel: boolean; required: boolean }>;
}

const GOAL_PATTERNS: GoalPattern[] = [
  {
    keywords: ["launch", "product", "new product", "go to market", "gtm"],
    steps: [
      { description: "Analyze target market and competitive landscape",    capability: "MARKET_ANALYSIS",     canParallel: false, required: true  },
      { description: "Define go-to-market strategy",                        capability: "STRATEGY_GENERATION", canParallel: false, required: true  },
      { description: "Create launch content and messaging",                 capability: "CONTENT_CREATION",    canParallel: true,  required: true  },
      { description: "Set up ad campaign for awareness",                    capability: "AD_CAMPAIGN",         canParallel: true,  required: true  },
      { description: "Configure email launch sequence",                     capability: "EMAIL_MARKETING",     canParallel: true,  required: true  },
      { description: "Create social media content plan",                    capability: "SOCIAL_MEDIA",        canParallel: true,  required: false },
      { description: "Set up lead tracking and analytics",                  capability: "ANALYTICS_REPORTING", canParallel: false, required: true  },
    ],
  },
  {
    keywords: ["business plan", "write a plan", "create a business plan", "startup plan"],
    steps: [
      { description: "Research market opportunity and competitive landscape", capability: "MARKET_ANALYSIS",     canParallel: false, required: true  },
      { description: "Draft comprehensive business plan",                     capability: "BUSINESS_PLANNING",   canParallel: false, required: true  },
      { description: "Develop financial projections",                         capability: "FINANCIAL_PLANNING",  canParallel: true,  required: true  },
      { description: "Define go-to-market strategy section",                  capability: "STRATEGY_GENERATION", canParallel: true,  required: true  },
      { description: "Create supporting documents and pitch materials",       capability: "DOCUMENT_CREATION",   canParallel: false, required: false },
    ],
  },
  {
    keywords: ["hire", "recruit", "find talent", "staffing", "onboard employee"],
    steps: [
      { description: "Create job description and requirements",     capability: "DOCUMENT_CREATION", canParallel: false, required: true  },
      { description: "Set up HR workflow and approval process",     capability: "HR_MANAGEMENT",     canParallel: false, required: true  },
      { description: "Design recruitment campaign",                 capability: "AD_CAMPAIGN",       canParallel: true,  required: false },
      { description: "Schedule interviews and coordinate calendar", capability: "SCHEDULING",        canParallel: true,  required: true  },
      { description: "Prepare compliance documentation",            capability: "COMPLIANCE_CHECK",  canParallel: true,  required: true  },
      { description: "Create onboarding training content",         capability: "TRAINING_CONTENT",  canParallel: false, required: false },
    ],
  },
  {
    keywords: ["marketing campaign", "grow revenue", "get customers", "generate leads", "increase sales"],
    steps: [
      { description: "Define target audience and segment",         capability: "MARKET_ANALYSIS",     canParallel: false, required: true  },
      { description: "Generate leads from target market",          capability: "LEAD_GENERATION",     canParallel: false, required: true  },
      { description: "Create campaign content and assets",         capability: "CONTENT_CREATION",    canParallel: true,  required: true  },
      { description: "Launch email nurture sequence",              capability: "EMAIL_MARKETING",     canParallel: true,  required: true  },
      { description: "Deploy paid ad campaigns",                   capability: "AD_CAMPAIGN",         canParallel: true,  required: false },
      { description: "Set up social media distribution",          capability: "SOCIAL_MEDIA",        canParallel: true,  required: false },
      { description: "Configure lead scoring and CRM workflow",   capability: "WORKFLOW_AUTOMATION", canParallel: false, required: true  },
      { description: "Track and report campaign performance",      capability: "ANALYTICS_REPORTING", canParallel: false, required: true  },
    ],
  },
  {
    keywords: ["automate", "automation", "workflow", "process", "streamline operations"],
    steps: [
      { description: "Map current process and identify automation opportunities", capability: "DATA_PROCESSING",     canParallel: false, required: true  },
      { description: "Design automated workflow",                                  capability: "WORKFLOW_AUTOMATION", canParallel: false, required: true  },
      { description: "Configure triggers and conditions",                          capability: "WORKFLOW_AUTOMATION", canParallel: false, required: true  },
      { description: "Set up reporting and monitoring",                            capability: "ANALYTICS_REPORTING", canParallel: true,  required: true  },
      { description: "Document the automated process",                             capability: "DOCUMENT_CREATION",   canParallel: true,  required: false },
    ],
  },
  {
    keywords: ["invoice", "billing", "bill client", "payment", "collect payment"],
    steps: [
      { description: "Generate invoice for client",         capability: "BILLING_INVOICING",   canParallel: false, required: true  },
      { description: "Set up automated payment workflow",  capability: "WORKFLOW_AUTOMATION", canParallel: false, required: true  },
      { description: "Configure payment tracking",         capability: "ANALYTICS_REPORTING", canParallel: true,  required: true  },
      { description: "Send payment confirmation email",    capability: "EMAIL_MARKETING",     canParallel: true,  required: false },
    ],
  },
  {
    keywords: ["compliance", "audit", "legal", "regulation", "policy"],
    steps: [
      { description: "Run compliance assessment",                capability: "COMPLIANCE_CHECK", canParallel: false, required: true  },
      { description: "Generate required legal documents",        capability: "LEGAL_DOCUMENT",   canParallel: true,  required: true  },
      { description: "Document compliance procedures",           capability: "DOCUMENT_CREATION", canParallel: true,  required: true  },
      { description: "Set up ongoing compliance monitoring",     capability: "WORKFLOW_AUTOMATION", canParallel: false, required: false },
    ],
  },
  {
    keywords: ["report", "analytics", "dashboard", "data analysis", "insights"],
    steps: [
      { description: "Collect and process data",         capability: "DATA_PROCESSING",     canParallel: false, required: true  },
      { description: "Generate analytics report",        capability: "ANALYTICS_REPORTING", canParallel: false, required: true  },
      { description: "Build strategy recommendations",   capability: "STRATEGY_GENERATION", canParallel: false, required: false },
      { description: "Create executive summary document", capability: "DOCUMENT_CREATION",  canParallel: true,  required: false },
    ],
  },
];

// ── Pattern matching ──────────────────────────────────────────────────────

function matchGoalPattern(goal: string): GoalPattern | null {
  const g = goal.toLowerCase();
  let bestMatch: { pattern: GoalPattern; matchCount: number } | null = null;

  for (const pattern of GOAL_PATTERNS) {
    const matchCount = pattern.keywords.filter(kw => g.includes(kw)).length;
    if (matchCount > 0 && (!bestMatch || matchCount > bestMatch.matchCount)) {
      bestMatch = { pattern, matchCount };
    }
  }

  return bestMatch?.pattern ?? null;
}

// ── Plan ID ───────────────────────────────────────────────────────────────

function generatePlanId(): string {
  return `plan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Main planner ──────────────────────────────────────────────────────────

export async function planOutcome(
  goal: string,
  context: Record<string, unknown>,
): Promise<ExecutionPlan> {
  const planId = generatePlanId();

  // 1. Try deterministic pattern matching first
  const pattern = matchGoalPattern(goal);
  if (pattern) {
    const steps: PlanStep[] = pattern.steps.map((s, i) => ({
      stepIndex:   i,
      description: s.description,
      capability:  s.capability,
      canParallel: s.canParallel,
      required:    s.required,
      context:     { ...context, goal },
    }));

    return {
      planId,
      goal,
      totalSteps:  steps.length,
      steps,
      estimatedMs: steps.length * 1200,
      source:      "deterministic",
    };
  }

  // 2. Detect capabilities from goal keywords
  const detected = detectCapabilityFromGoal(goal);
  if (detected.length > 0) {
    const steps: PlanStep[] = detected.map((cap, i) => ({
      stepIndex:   i,
      description: `Execute ${cap.replace(/_/g, " ").toLowerCase()} for: ${goal}`,
      capability:  cap,
      canParallel: i > 0,
      required:    true,
      context:     { ...context, goal },
    }));

    return {
      planId,
      goal,
      totalSteps:  steps.length,
      steps,
      estimatedMs: steps.length * 1500,
      source:      "deterministic",
    };
  }

  // 3. AI fallback for complex goals (via gatekeeper)
  const aiResult = await gatedAICall(
    "STRATEGY_GENERATION",
    { goal, ...context },
    goal,
  );

  const steps: PlanStep[] = [
    {
      stepIndex:   0,
      description: "Analyze and plan approach",
      capability:  "STRATEGY_GENERATION",
      canParallel: false,
      required:    true,
      context:     { ...context, goal, ai_plan: aiResult.output },
    },
    {
      stepIndex:   1,
      description: "Execute primary action",
      capability:  detected[0] ?? "CONTENT_CREATION",
      canParallel: false,
      required:    true,
      context:     { ...context, goal },
    },
  ];

  return {
    planId,
    goal,
    totalSteps:  steps.length,
    steps,
    estimatedMs: 3000,
    source:      "ai-assisted",
  };
}
