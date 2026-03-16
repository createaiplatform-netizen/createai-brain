// ─── Universal Content Generators ───────────────────────────────────────────
// Every function always returns real, populated data — never empty arrays.
// Adapts to any industry/role/department combination.

import { getIndustryConfig, type IndustryId, type PlatformFilters } from "./universeConfig";

export interface Tile {
  id: string;
  title: string;
  icon: string;
  status: "active" | "pending" | "review" | "blocked";
  count: number;
  avgTime: string;
  priority: "high" | "medium" | "low";
  department: string;
  aiScore: number;
  tags: string[];
}

export interface Metric {
  id: string;
  label: string;
  value: string;
  numericValue: number;
  unit: string;
  trend: "up" | "down" | "flat";
  trendPct: number;
  status: "good" | "warning" | "critical";
  benchmark: string;
}

export interface Entity {
  id: string;
  name: string;
  role: string;
  status: "active" | "pending" | "review" | "urgent" | "closed";
  priority: "high" | "medium" | "low";
  assignedTo: string;
  lastUpdate: string;
  tags: string[];
  progress: number;
}

export interface WorkflowStage {
  name: string;
  owner: string;
  avgDuration: string;
  document: string;
  risk: "low" | "medium" | "high";
  aiOpportunity: number;
  notes: string;
}

export interface DrillContent {
  workflowName: string;
  description: string;
  totalDuration: string;
  stages: WorkflowStage[];
  documents: string[];
  roles: string[];
  metrics: Metric[];
  relatedWorkflows: string[];
}

export interface ScenarioConfig {
  type: string;
  volumeLevel: number;
  riskLevel: number;
  staffingShortage: number;
  timeframeDays: number;
}

export interface SimulationImpact {
  label: string;
  before: string;
  after: string;
  severity: "critical" | "high" | "medium" | "low";
  delta: number;
}

export interface SimulationResult {
  scenarioName: string;
  summary: string;
  overallRisk: "critical" | "high" | "medium" | "low";
  metrics: Metric[];
  impacts: SimulationImpact[];
  departmentEffects: { department: string; impact: string; severity: string }[];
  timeline: { day: number; event: string; type: "warning" | "critical" | "info" | "recovery" }[];
  recommendations: string[];
}

// ─── Name pools for realistic entity generation ─────────────────────────────
const FIRST_NAMES = [
  "Maria","James","Aisha","David","Sofia","Marcus","Priya","Thomas",
  "Elena","Jordan","Yuki","Carlos","Fatima","Michael","Amara","Daniel",
  "Isabella","Kevin","Nadia","Robert","Lena","Andre","Hannah","Victor",
];
const LAST_NAMES = [
  "Reyes","Williams","Johnson","Chen","Okafor","Martinez","Patel","Kim",
  "Fischer","Osei","Tanaka","Garcia","Mensah","Thompson","Volkov","Singh",
  "Anderson","Nakamura","Santos","O'Brien","Lindqvist","Adeyemi","Kowalski","Ferreira",
];

function randomName(seed: number): string {
  return `${FIRST_NAMES[seed % FIRST_NAMES.length]} ${LAST_NAMES[(seed * 7) % LAST_NAMES.length]}`;
}

const TILE_ICONS = ["⚡","📋","🔄","✅","⚠️","📊","🔍","📝","🚀","🔒","💡","🛡️","📦","🎯","⚙️","📞"];
const STATUS_OPTIONS: Tile["status"][] = ["active","pending","review","blocked"];
const PRIORITY_OPTIONS: Tile["priority"][] = ["high","medium","medium","low"];

function deterministicIndex(str: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) & 0xffff;
  return Math.abs(hash) % mod;
}

// ─── Tile generator ─────────────────────────────────────────────────────────
export function generateTiles(filters: PlatformFilters, mode: string): Tile[] {
  const config = getIndustryConfig(filters.industry);
  const workflows = config.workflowTypes;

  return workflows.map((workflow, i) => {
    const seed = deterministicIndex(workflow + filters.industry, 1000);
    const baseCount = 12 + (seed % 88);
    const modeMultiplier = mode === "simulation" ? 1.4 : mode === "test" ? 1.1 : 1.0;
    const count = Math.round(baseCount * modeMultiplier);

    return {
      id: `tile-${i}`,
      title: workflow,
      icon: TILE_ICONS[i % TILE_ICONS.length],
      status: STATUS_OPTIONS[i % STATUS_OPTIONS.length],
      count,
      avgTime: generateAvgTime(workflow, seed),
      priority: PRIORITY_OPTIONS[i % PRIORITY_OPTIONS.length],
      department: config.departments[i % config.departments.length],
      aiScore: 60 + (seed % 38),
      tags: [config.departments[i % config.departments.length], mode === "simulation" ? "🔴 Stressed" : "● Active"],
    };
  });
}

function generateAvgTime(workflow: string, seed: number): string {
  const minutes = [15, 30, 45, 60, 90, 120, 240, 480, 1440];
  const mins = minutes[seed % minutes.length];
  if (mins < 60) return `${mins} min`;
  if (mins < 1440) return `${mins / 60}h`;
  return "1 day";
}

// ─── Metric generator ───────────────────────────────────────────────────────
export function generateMetrics(filters: PlatformFilters, mode: string, scenario?: ScenarioConfig): Metric[] {
  const config = getIndustryConfig(filters.industry);
  const stressMultiplier = scenario ? 1 + (scenario.riskLevel - 50) / 100 : 1;
  const volumeMult = scenario ? scenario.volumeLevel / 50 : 1;
  const staffMult = scenario ? 1 - scenario.staffingShortage / 200 : 1;

  return config.kpiLabels.map((label, i) => {
    const seed = deterministicIndex(label + filters.industry, 1000);
    const isRate = label.includes("Rate") || label.includes("%") || label.includes("Score") || label.includes("Ratio");
    const isTime = label.includes("hrs") || label.includes("days") || label.includes("min") || label.includes("Time");
    const isCount = label.includes("Volume") || label.includes("Count") || label.includes("Active") || label.includes("Open") || label.includes("Reports");

    let numericValue: number;
    let unit: string;
    let goodIsHigh: boolean;

    if (isRate) {
      numericValue = 72 + (seed % 26);
      unit = "%";
      goodIsHigh = !label.toLowerCase().includes("denial") && !label.toLowerCase().includes("error") && !label.toLowerCase().includes("incident") && !label.toLowerCase().includes("defect") && !label.toLowerCase().includes("shrink") && !label.toLowerCase().includes("churn") && !label.toLowerCase().includes("return");
    } else if (isTime) {
      numericValue = 2 + (seed % 22);
      unit = label.includes("hrs") || label.includes("Time") ? "hrs" : "days";
      goodIsHigh = false;
    } else if (isCount) {
      numericValue = Math.round((80 + (seed % 420)) * volumeMult);
      unit = "";
      goodIsHigh = true;
    } else {
      numericValue = 60 + (seed % 38);
      unit = "";
      goodIsHigh = true;
    }

    if (scenario) {
      if (isCount) numericValue = Math.round(numericValue * volumeMult);
      if (isTime) numericValue = Math.round(numericValue * stressMultiplier / staffMult);
      if (isRate && goodIsHigh) numericValue = Math.max(20, numericValue - scenario.riskLevel * 0.3);
    }

    const trendSeed = (seed * 3) % 10;
    const trend: Metric["trend"] = trendSeed < 4 ? "up" : trendSeed < 7 ? "flat" : "down";
    const trendPct = 1 + (seed % 14);

    const status: Metric["status"] = goodIsHigh
      ? (numericValue > 80 ? "good" : numericValue > 60 ? "warning" : "critical")
      : (numericValue < 4 ? "good" : numericValue < 10 ? "warning" : "critical");

    if (scenario && scenario.riskLevel > 70 && i < 4) {
      // force some critical metrics in high-risk simulation
    }

    return {
      id: `metric-${i}`,
      label,
      value: unit === "%" ? `${numericValue.toFixed(1)}%` : unit === "hrs" ? `${numericValue.toFixed(1)} hrs` : unit === "days" ? `${numericValue.toFixed(1)} days` : numericValue.toLocaleString(),
      numericValue,
      unit,
      trend,
      trendPct,
      status: scenario && scenario.riskLevel > 75 && i % 3 === 0 ? "critical" : status,
      benchmark: isRate ? `Industry avg: ${(numericValue * 0.92).toFixed(1)}%` : isTime ? `Target: ${(numericValue * 0.80).toFixed(1)} ${unit}` : `Target: ${Math.round(numericValue * 1.1).toLocaleString()}`,
    };
  });
}

// ─── Entity generator ────────────────────────────────────────────────────────
export function generateEntities(filters: PlatformFilters, count = 12): Entity[] {
  const config = getIndustryConfig(filters.industry);
  const statusPool: Entity["status"][] = ["active","pending","review","urgent","closed"];
  const priorityPool: Entity["priority"][] = ["high","medium","medium","low","medium"];

  return Array.from({ length: count }, (_, i) => {
    const seed = deterministicIndex(`${filters.industry}-entity-${i}`, 10000);
    const assignedSeed = deterministicIndex(`${filters.industry}-assign-${i}`, 10000);

    return {
      id: `entity-${i}`,
      name: randomName(seed),
      role: config.roles[i % config.roles.length],
      status: statusPool[i % statusPool.length],
      priority: priorityPool[i % priorityPool.length],
      assignedTo: randomName(assignedSeed + 100),
      lastUpdate: generateRelativeTime(seed),
      tags: [config.departments[i % config.departments.length], config.workflowTypes[i % config.workflowTypes.length]],
      progress: 10 + (seed % 88),
    };
  });
}

function generateRelativeTime(seed: number): string {
  const options = ["2 min ago","8 min ago","17 min ago","34 min ago","1h ago","2h ago","4h ago","Yesterday","2 days ago","3 days ago"];
  return options[seed % options.length];
}

// ─── Drill content generator ─────────────────────────────────────────────────
export function generateDrillContent(tile: Tile, filters: PlatformFilters): DrillContent {
  const config = getIndustryConfig(filters.industry);
  const seed = deterministicIndex(tile.title + filters.industry, 1000);

  const stageNames = [
    "Intake & Verification", "Initial Assessment", "Assignment & Routing",
    "Active Processing", "Quality Review", "Approval Gate",
    "Output / Delivery", "Documentation & Close",
  ];

  const riskLevels: WorkflowStage["risk"][] = ["low","medium","high","medium","low","medium","high","low"];

  const stages: WorkflowStage[] = stageNames.slice(0, 5 + (seed % 3)).map((name, i) => ({
    name,
    owner: config.roles[(seed + i) % config.roles.length],
    avgDuration: generateAvgTime(name, seed + i),
    document: config.documentTypes[(seed + i) % config.documentTypes.length],
    risk: riskLevels[i],
    aiOpportunity: 50 + ((seed + i * 11) % 48),
    notes: generateStageNote(name, config.id),
  }));

  const relatedWorkflows = config.workflowTypes
    .filter(w => w !== tile.title)
    .slice(0, 3);

  return {
    workflowName: tile.title,
    description: `The ${tile.title} workflow manages the end-to-end process for ${config.entityPluralLabel.toLowerCase()} within the ${config.departments[seed % config.departments.length]} department. It ensures compliance, quality, and efficient delivery across all stages.`,
    totalDuration: generateTotalDuration(seed),
    stages,
    documents: config.documentTypes.slice(0, 4),
    roles: config.roles.slice(0, 4),
    metrics: generateMetrics(filters, "demo").slice(0, 4),
    relatedWorkflows,
  };
}

function generateStageNote(stage: string, industry: string): string {
  const notes: Record<string, string> = {
    "Intake & Verification": "All incoming records are verified for completeness. Missing fields trigger automated alerts to the submitting party within 2 hours.",
    "Initial Assessment": "A qualified reviewer evaluates the record against current standards. Flags are applied for priority routing or escalation.",
    "Assignment & Routing": "AI-assisted routing assigns the record to the most appropriate team member based on capacity, expertise, and urgency.",
    "Active Processing": "The primary work is performed. Time tracking is automatic. Updates are logged in real time.",
    "Quality Review": "A secondary reviewer checks output quality against defined standards. Errors return to Active Processing with annotated feedback.",
    "Approval Gate": "A designated authority approves or rejects. Rejection triggers a rework cycle with a 24-hour SLA.",
    "Output / Delivery": "Finalized output is delivered to the recipient via the configured channel (portal, email, system integration).",
    "Documentation & Close": "All records are archived, tagged, and indexed. Compliance logs are finalized and retention periods applied.",
  };
  return notes[stage] || `This stage handles ${stage.toLowerCase()} activities and ensures handoff quality before the next stage.`;
}

function generateTotalDuration(seed: number): string {
  const options = ["2-4 hours", "4-8 hours", "1-2 days", "2-3 days", "3-5 days", "1-2 weeks"];
  return options[seed % options.length];
}

// ─── Simulation result generator ─────────────────────────────────────────────
export function generateSimulationResult(
  scenario: ScenarioConfig,
  filters: PlatformFilters,
): SimulationResult {
  const config = getIndustryConfig(filters.industry);
  const isHighRisk = scenario.riskLevel > 70;
  const isHighVolume = scenario.volumeLevel > 70;
  const isStaffShort = scenario.staffingShortage > 40;

  const overallRisk: SimulationResult["overallRisk"] =
    (isHighRisk && isHighVolume && isStaffShort) ? "critical" :
    (isHighRisk || (isHighVolume && isStaffShort)) ? "high" :
    (isHighVolume || isStaffShort) ? "medium" : "low";

  const scenarioName = scenario.type || "Custom Scenario";

  const summary = generateScenarioSummary(scenario, config.label, overallRisk);

  const impacts: SimulationImpact[] = [
    {
      label: "Processing Throughput",
      before: `${config.kpiLabels[0]}: 100%`,
      after: `${config.kpiLabels[0]}: ${Math.max(30, 100 - scenario.staffingShortage - scenario.riskLevel * 0.3).toFixed(0)}%`,
      severity: isStaffShort ? "critical" : "high",
      delta: -(scenario.staffingShortage + scenario.riskLevel * 0.3),
    },
    {
      label: "Average Processing Time",
      before: "Baseline",
      after: `+${Math.round(scenario.volumeLevel * 0.8 / staffingFactor(scenario))}% longer`,
      severity: isHighVolume ? "high" : "medium",
      delta: scenario.volumeLevel * 0.8,
    },
    {
      label: "Error / Defect Rate",
      before: "Baseline",
      after: `+${Math.round(scenario.riskLevel * 0.5)}% increase`,
      severity: isHighRisk ? "critical" : "medium",
      delta: scenario.riskLevel * 0.5,
    },
    {
      label: "Staff Workload Index",
      before: "100% capacity",
      after: `${Math.round(100 * (1 + scenario.volumeLevel / 100) / Math.max(0.5, 1 - scenario.staffingShortage / 100)).toFixed(0)}% of capacity`,
      severity: isStaffShort && isHighVolume ? "critical" : isStaffShort ? "high" : "medium",
      delta: scenario.volumeLevel + scenario.staffingShortage,
    },
    {
      label: "Compliance Exposure",
      before: "Low risk",
      after: isHighRisk ? "High risk — audit trigger likely" : "Moderate — monitor closely",
      severity: isHighRisk ? "critical" : "medium",
      delta: scenario.riskLevel,
    },
    {
      label: "Client / Customer Satisfaction",
      before: "Baseline",
      after: `Projected -${Math.round(scenario.riskLevel * 0.3 + scenario.volumeLevel * 0.1)} point drop`,
      severity: "high",
      delta: -(scenario.riskLevel * 0.3 + scenario.volumeLevel * 0.1),
    },
  ];

  const departmentEffects = config.departments.slice(0, 5).map((dept, i) => ({
    department: dept,
    impact: generateDeptImpact(dept, scenario, i),
    severity: i === 0 || i === 1 ? (isHighRisk ? "Critical" : "High") : "Medium",
  }));

  const timeline = generateTimeline(scenario, config.label);

  const recommendations = generateRecommendations(scenario, config.label, overallRisk);

  return {
    scenarioName,
    summary,
    overallRisk,
    metrics: generateMetrics(filters, "simulation", scenario),
    impacts,
    departmentEffects,
    timeline,
    recommendations,
  };
}

function staffingFactor(s: ScenarioConfig): number {
  return Math.max(0.3, 1 - s.staffingShortage / 100);
}

function generateScenarioSummary(scenario: ScenarioConfig, industry: string, risk: string): string {
  const riskLabel = { critical: "🔴 CRITICAL", high: "🟠 HIGH", medium: "🟡 MODERATE", low: "🟢 LOW" }[risk];
  return `${riskLabel} RISK — ${industry} simulation running "${scenario.type}" at ${scenario.volumeLevel}% volume with ${scenario.staffingShortage}% staffing shortage over ${scenario.timeframeDays} days. System is operating under ${risk} stress. Immediate action is ${risk === "critical" || risk === "high" ? "required" : "recommended"} in the highlighted departments.`;
}

function generateDeptImpact(dept: string, scenario: ScenarioConfig, index: number): string {
  const impacts = [
    `${Math.round(scenario.volumeLevel * 1.2)}% increase in workload — ${scenario.staffingShortage > 30 ? "understaffed" : "manageable"}`,
    `SLA breaches expected in ${Math.round(scenario.volumeLevel * 0.3)}% of cases`,
    `Normal operations — minimal impact from current scenario`,
    `Monitoring elevated — ${scenario.riskLevel > 60 ? "audit risk flagged" : "within tolerance"}`,
    `${scenario.staffingShortage > 40 ? "Critical: Reassign resources immediately" : "Minor disruption — monitor"}`,
  ];
  return impacts[index % impacts.length];
}

function generateTimeline(
  scenario: ScenarioConfig,
  industry: string,
): SimulationResult["timeline"] {
  const days = scenario.timeframeDays;
  const events: SimulationResult["timeline"] = [
    { day: 1, event: `${scenario.type} begins — ${industry} operations enter elevated state`, type: "warning" },
    { day: Math.round(days * 0.15), event: `Volume reaches ${scenario.volumeLevel}% of normal throughput capacity`, type: scenario.volumeLevel > 70 ? "critical" : "warning" },
    { day: Math.round(days * 0.25), event: `Processing backlogs begin forming in primary departments`, type: "warning" },
    { day: Math.round(days * 0.35), event: scenario.riskLevel > 60 ? "Compliance flags triggered — audit review initiated" : "Quality metrics remain within acceptable bounds", type: scenario.riskLevel > 60 ? "critical" : "info" },
    { day: Math.round(days * 0.5), event: `Midpoint assessment: ${scenario.staffingShortage > 40 ? "Staff shortage critical — emergency coverage needed" : "Operations adapting — temporary protocols effective"}`, type: scenario.staffingShortage > 40 ? "critical" : "info" },
    { day: Math.round(days * 0.65), event: "AI recommendations deployed — workflow routing optimized", type: "info" },
    { day: Math.round(days * 0.80), event: "Recovery protocols initiated — additional resources activated", type: "recovery" },
    { day: days, event: `Scenario ends — post-incident review scheduled. Estimated recovery time: ${Math.round(days * 0.3)} additional days`, type: "recovery" },
  ];
  return events;
}

function generateRecommendations(scenario: ScenarioConfig, industry: string, risk: string): string[] {
  const base = [
    `Activate contingency staffing plan immediately — target minimum ${Math.max(5, 100 - scenario.staffingShortage)}% capacity`,
    `Enable AI-assisted routing to prioritize high-priority ${industry} cases and reduce manual triage time`,
    `Set up real-time dashboard alerts for all metrics exceeding 15% deviation from baseline`,
    `Notify department heads and schedule daily stand-ups for the duration of the scenario`,
    `Document all process deviations for post-incident review and compliance reporting`,
  ];

  if (risk === "critical" || risk === "high") {
    base.unshift("IMMEDIATE: Escalate to executive leadership — activate crisis response protocol");
    base.push("Prepare regulatory notification if compliance thresholds are breached");
    base.push("Suspend non-critical workflows to free capacity for priority operations");
  }

  if (scenario.staffingShortage > 40) {
    base.push("Contact staffing agency for emergency placements — estimated need: 48-72 hours");
  }

  return base.slice(0, 6);
}
