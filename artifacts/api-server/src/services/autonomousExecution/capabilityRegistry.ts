// ═══════════════════════════════════════════════════════════════════════════
// capabilityRegistry.ts
// Maps all engines → their declared capabilities, domains, inputs, outputs.
// Single source of truth for what each engine can do.
// ═══════════════════════════════════════════════════════════════════════════

export type Capability =
  | "CONTENT_CREATION"
  | "EMAIL_MARKETING"
  | "SOCIAL_MEDIA"
  | "FINANCIAL_PLANNING"
  | "LEAD_GENERATION"
  | "MARKET_ANALYSIS"
  | "LEGAL_DOCUMENT"
  | "HR_MANAGEMENT"
  | "HEALTH_MONITORING"
  | "CUSTOMER_SUPPORT"
  | "PROJECT_MANAGEMENT"
  | "ANALYTICS_REPORTING"
  | "BUSINESS_PLANNING"
  | "AD_CAMPAIGN"
  | "WORKFLOW_AUTOMATION"
  | "COMPLIANCE_CHECK"
  | "BILLING_INVOICING"
  | "SCHEDULING"
  | "DATA_PROCESSING"
  | "STRATEGY_GENERATION"
  | "DOCUMENT_CREATION"
  | "COMMUNICATION"
  | "REVENUE_OPTIMIZATION"
  | "BRAND_BUILDING"
  | "TRAINING_CONTENT";

export interface EngineCapabilityProfile {
  engineId:     string;
  label:        string;
  domain:       string;
  capabilities: Capability[];
  inputs:       string[];
  outputs:      string[];
  requiresAI:   boolean;
  priority:     number; // 1 = highest preferred
}

export const ENGINE_REGISTRY: EngineCapabilityProfile[] = [
  // ── Content & Creative ───────────────────────────────────────────────────
  {
    engineId: "content-generator",
    label: "Content Generator",
    domain: "marketing",
    capabilities: ["CONTENT_CREATION", "BRAND_BUILDING", "SOCIAL_MEDIA"],
    inputs: ["topic", "tone", "audience"],
    outputs: ["article", "post", "copy"],
    requiresAI: true,
    priority: 1,
  },
  {
    engineId: "email-campaign-engine",
    label: "Email Campaign Engine",
    domain: "marketing",
    capabilities: ["EMAIL_MARKETING", "COMMUNICATION", "LEAD_GENERATION"],
    inputs: ["audience", "goal", "offer"],
    outputs: ["email_sequence", "subject_lines", "cta"],
    requiresAI: false,
    priority: 1,
  },
  {
    engineId: "social-media-planner",
    label: "Social Media Planner",
    domain: "marketing",
    capabilities: ["SOCIAL_MEDIA", "CONTENT_CREATION", "BRAND_BUILDING"],
    inputs: ["brand", "platform", "frequency"],
    outputs: ["post_calendar", "captions", "hashtags"],
    requiresAI: false,
    priority: 2,
  },
  {
    engineId: "ad-creative-engine",
    label: "Ad Creative Engine",
    domain: "advertising",
    capabilities: ["AD_CAMPAIGN", "CONTENT_CREATION", "LEAD_GENERATION"],
    inputs: ["product", "audience", "budget"],
    outputs: ["ad_copy", "headlines", "targeting_params"],
    requiresAI: false,
    priority: 1,
  },
  // ── Finance & Revenue ────────────────────────────────────────────────────
  {
    engineId: "financial-planner",
    label: "Financial Planner",
    domain: "finance",
    capabilities: ["FINANCIAL_PLANNING", "REVENUE_OPTIMIZATION", "ANALYTICS_REPORTING"],
    inputs: ["revenue", "expenses", "goals"],
    outputs: ["budget_plan", "projections", "recommendations"],
    requiresAI: false,
    priority: 1,
  },
  {
    engineId: "billing-invoicing-engine",
    label: "Billing & Invoicing Engine",
    domain: "finance",
    capabilities: ["BILLING_INVOICING", "WORKFLOW_AUTOMATION", "DATA_PROCESSING"],
    inputs: ["client_id", "services", "amounts"],
    outputs: ["invoice", "payment_link", "receipt"],
    requiresAI: false,
    priority: 1,
  },
  {
    engineId: "revenue-optimizer",
    label: "Revenue Optimizer",
    domain: "finance",
    capabilities: ["REVENUE_OPTIMIZATION", "STRATEGY_GENERATION", "ANALYTICS_REPORTING"],
    inputs: ["revenue_data", "products", "pricing"],
    outputs: ["pricing_strategy", "upsell_plan", "growth_levers"],
    requiresAI: false,
    priority: 2,
  },
  // ── Sales & Leads ────────────────────────────────────────────────────────
  {
    engineId: "lead-generator",
    label: "Lead Generator",
    domain: "sales",
    capabilities: ["LEAD_GENERATION", "MARKET_ANALYSIS", "COMMUNICATION"],
    inputs: ["target_market", "product", "region"],
    outputs: ["lead_list", "outreach_templates", "scoring"],
    requiresAI: false,
    priority: 1,
  },
  {
    engineId: "market-analysis-engine",
    label: "Market Analysis Engine",
    domain: "strategy",
    capabilities: ["MARKET_ANALYSIS", "ANALYTICS_REPORTING", "STRATEGY_GENERATION"],
    inputs: ["industry", "competitors", "region"],
    outputs: ["market_report", "opportunities", "risks"],
    requiresAI: true,
    priority: 1,
  },
  // ── Legal ────────────────────────────────────────────────────────────────
  {
    engineId: "legal-document-engine",
    label: "Legal Document Engine",
    domain: "legal",
    capabilities: ["LEGAL_DOCUMENT", "COMPLIANCE_CHECK", "DOCUMENT_CREATION"],
    inputs: ["document_type", "parties", "terms"],
    outputs: ["contract", "agreement", "policy"],
    requiresAI: false,
    priority: 1,
  },
  {
    engineId: "compliance-engine",
    label: "Compliance Engine",
    domain: "legal",
    capabilities: ["COMPLIANCE_CHECK", "ANALYTICS_REPORTING", "DATA_PROCESSING"],
    inputs: ["industry", "jurisdiction", "scope"],
    outputs: ["compliance_report", "risk_flags", "recommendations"],
    requiresAI: false,
    priority: 1,
  },
  // ── HR & People ──────────────────────────────────────────────────────────
  {
    engineId: "hr-management-engine",
    label: "HR Management Engine",
    domain: "hr",
    capabilities: ["HR_MANAGEMENT", "SCHEDULING", "DOCUMENT_CREATION"],
    inputs: ["headcount", "roles", "policies"],
    outputs: ["org_chart", "job_descriptions", "onboarding_plan"],
    requiresAI: false,
    priority: 1,
  },
  {
    engineId: "scheduling-engine",
    label: "Scheduling Engine",
    domain: "operations",
    capabilities: ["SCHEDULING", "WORKFLOW_AUTOMATION", "COMMUNICATION"],
    inputs: ["participants", "availability", "duration"],
    outputs: ["schedule", "calendar_events", "reminders"],
    requiresAI: false,
    priority: 1,
  },
  // ── Health ───────────────────────────────────────────────────────────────
  {
    engineId: "health-monitor",
    label: "Health Monitor",
    domain: "health",
    capabilities: ["HEALTH_MONITORING", "ANALYTICS_REPORTING", "DATA_PROCESSING"],
    inputs: ["patient_data", "metrics", "thresholds"],
    outputs: ["health_report", "alerts", "trends"],
    requiresAI: false,
    priority: 1,
  },
  // ── Customer & Support ───────────────────────────────────────────────────
  {
    engineId: "customer-support-engine",
    label: "Customer Support Engine",
    domain: "support",
    capabilities: ["CUSTOMER_SUPPORT", "COMMUNICATION", "WORKFLOW_AUTOMATION"],
    inputs: ["query", "customer_id", "history"],
    outputs: ["response", "ticket", "escalation"],
    requiresAI: false,
    priority: 1,
  },
  // ── Project & Operations ─────────────────────────────────────────────────
  {
    engineId: "project-management-engine",
    label: "Project Management Engine",
    domain: "operations",
    capabilities: ["PROJECT_MANAGEMENT", "WORKFLOW_AUTOMATION", "SCHEDULING"],
    inputs: ["goal", "team", "deadline"],
    outputs: ["project_plan", "milestones", "task_list"],
    requiresAI: false,
    priority: 1,
  },
  {
    engineId: "workflow-automation-engine",
    label: "Workflow Automation Engine",
    domain: "operations",
    capabilities: ["WORKFLOW_AUTOMATION", "DATA_PROCESSING", "ANALYTICS_REPORTING"],
    inputs: ["trigger", "steps", "conditions"],
    outputs: ["workflow", "automations", "triggers"],
    requiresAI: false,
    priority: 1,
  },
  // ── Analytics & Strategy ─────────────────────────────────────────────────
  {
    engineId: "analytics-engine",
    label: "Analytics Engine",
    domain: "analytics",
    capabilities: ["ANALYTICS_REPORTING", "DATA_PROCESSING", "MARKET_ANALYSIS"],
    inputs: ["data_source", "metrics", "period"],
    outputs: ["dashboard", "report", "insights"],
    requiresAI: false,
    priority: 1,
  },
  {
    engineId: "strategy-engine",
    label: "Strategy Engine",
    domain: "strategy",
    capabilities: ["STRATEGY_GENERATION", "BUSINESS_PLANNING", "MARKET_ANALYSIS"],
    inputs: ["goal", "resources", "timeline"],
    outputs: ["strategy_doc", "action_plan", "kpis"],
    requiresAI: true,
    priority: 1,
  },
  {
    engineId: "business-plan-engine",
    label: "Business Plan Engine",
    domain: "strategy",
    capabilities: ["BUSINESS_PLANNING", "FINANCIAL_PLANNING", "STRATEGY_GENERATION"],
    inputs: ["industry", "target_market", "revenue_model"],
    outputs: ["business_plan", "pitch_deck_outline", "financial_model"],
    requiresAI: false,
    priority: 1,
  },
  // ── Communication & Documents ────────────────────────────────────────────
  {
    engineId: "document-creator",
    label: "Document Creator",
    domain: "productivity",
    capabilities: ["DOCUMENT_CREATION", "CONTENT_CREATION", "COMMUNICATION"],
    inputs: ["document_type", "content", "format"],
    outputs: ["document", "pdf", "template"],
    requiresAI: false,
    priority: 1,
  },
  {
    engineId: "training-content-engine",
    label: "Training Content Engine",
    domain: "hr",
    capabilities: ["TRAINING_CONTENT", "DOCUMENT_CREATION", "CONTENT_CREATION"],
    inputs: ["topic", "audience_level", "format"],
    outputs: ["course_outline", "slides", "quiz"],
    requiresAI: false,
    priority: 1,
  },
];

// ── Lookup functions ──────────────────────────────────────────────────────────

export function getEngineProfile(engineId: string): EngineCapabilityProfile | undefined {
  return ENGINE_REGISTRY.find(e => e.engineId === engineId);
}

export function getEnginesByCapability(cap: Capability): EngineCapabilityProfile[] {
  return ENGINE_REGISTRY
    .filter(e => e.capabilities.includes(cap))
    .sort((a, b) => a.priority - b.priority);
}

export function getAllCapabilities(): Capability[] {
  const set = new Set<Capability>();
  ENGINE_REGISTRY.forEach(e => e.capabilities.forEach(c => set.add(c)));
  return Array.from(set).sort();
}

export function getEnginesByDomain(domain: string): EngineCapabilityProfile[] {
  return ENGINE_REGISTRY.filter(e => e.domain === domain);
}

export function detectCapabilityFromGoal(goal: string): Capability[] {
  const g = goal.toLowerCase();
  const matches: Capability[] = [];

  const keywordMap: Array<[string[], Capability]> = [
    [["email", "newsletter", "outreach"],            "EMAIL_MARKETING"],
    [["social", "post", "instagram", "facebook"],    "SOCIAL_MEDIA"],
    [["ad", "campaign", "advertis"],                 "AD_CAMPAIGN"],
    [["content", "blog", "article", "write"],        "CONTENT_CREATION"],
    [["lead", "prospect", "pipeline"],               "LEAD_GENERATION"],
    [["market", "competitor", "industry analysis"],  "MARKET_ANALYSIS"],
    [["financial", "budget", "cash flow", "finance"],"FINANCIAL_PLANNING"],
    [["invoice", "billing", "payment"],              "BILLING_INVOICING"],
    [["revenue", "sales growth", "monetize"],        "REVENUE_OPTIMIZATION"],
    [["legal", "contract", "agreement", "nda"],      "LEGAL_DOCUMENT"],
    [["comply", "compliance", "regulation"],         "COMPLIANCE_CHECK"],
    [["hire", "recruit", "hr ", "employee"],         "HR_MANAGEMENT"],
    [["health", "patient", "clinical", "medical"],   "HEALTH_MONITORING"],
    [["support", "ticket", "customer service"],      "CUSTOMER_SUPPORT"],
    [["project", "milestone", "sprint"],             "PROJECT_MANAGEMENT"],
    [["workflow", "automate", "automation"],         "WORKFLOW_AUTOMATION"],
    [["analytics", "report", "dashboard", "data"],   "ANALYTICS_REPORTING"],
    [["strateg", "plan", "roadmap"],                 "STRATEGY_GENERATION"],
    [["business plan", "startup", "model"],          "BUSINESS_PLANNING"],
    [["document", "proposal", "brief"],              "DOCUMENT_CREATION"],
    [["schedule", "calendar", "meeting"],            "SCHEDULING"],
    [["training", "course", "onboard"],              "TRAINING_CONTENT"],
    [["brand", "identity", "logo"],                  "BRAND_BUILDING"],
    [["communicate", "message", "announce"],         "COMMUNICATION"],
    [["process data", "transform", "etl"],           "DATA_PROCESSING"],
  ];

  for (const [keywords, cap] of keywordMap) {
    if (keywords.some(kw => g.includes(kw))) matches.push(cap);
  }

  if (matches.length === 0) matches.push("STRATEGY_GENERATION");
  return [...new Set(matches)];
}
