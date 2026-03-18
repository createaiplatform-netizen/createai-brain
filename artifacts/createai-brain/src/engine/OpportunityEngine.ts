import { streamEngine } from "@/controller";
// ═══════════════════════════════════════════════════════════════════════════
// OPPORTUNITY ENGINE — Frontend Intelligence Layer
// Powers the OpportunityApp with scoring, classification, and AI integration.
// All scoring is conceptual and for ideation — requires human validation.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Types ────────────────────────────────────────────────────────────────────

export type OpportunityType =
  | "Market" | "Partnership" | "Revenue" | "Expansion" | "Product" | "Technology" | "Operational";

export type OpportunityStatus =
  | "New" | "Researching" | "Validated" | "In Progress" | "Won" | "Lost" | "Archived";

export type OpportunityPriority = "Low" | "Medium" | "High" | "Critical";
export type OpportunityConfidence = "Low" | "Medium" | "High";

export interface OpportunityScore {
  total: number;
  market: number;
  timing: number;
  feasibility: number;
  impact: number;
  label: "Low" | "Medium" | "High" | "Exceptional";
}

export interface OpportunityScanResult {
  id: string;
  title: string;
  type: OpportunityType;
  score: number;
  rationale: string;
  nextAction: string;
  marketSize: string;
  risk: "Low" | "Medium" | "High";
  timeToValue: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const OPPORTUNITY_TYPES: OpportunityType[] = [
  "Market", "Partnership", "Revenue", "Expansion", "Product", "Technology", "Operational",
];

export const OPPORTUNITY_STATUSES: OpportunityStatus[] = [
  "New", "Researching", "Validated", "In Progress", "Won", "Lost", "Archived",
];

export const OPPORTUNITY_PRIORITIES: OpportunityPriority[] = [
  "Low", "Medium", "High", "Critical",
];

export const OPPORTUNITY_CONFIDENCE: OpportunityConfidence[] = [
  "Low", "Medium", "High",
];

// ─── Color Helpers ────────────────────────────────────────────────────────────

export function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    Market:      "#6366f1",
    Partnership: "#8b5cf6",
    Revenue:     "#10b981",
    Expansion:   "#f59e0b",
    Product:     "#3b82f6",
    Technology:  "#06b6d4",
    Operational: "#64748b",
  };
  return map[type] ?? "#6366f1";
}

export function getTypeIcon(type: string): string {
  const map: Record<string, string> = {
    Market:      "🌍",
    Partnership: "🤝",
    Revenue:     "💰",
    Expansion:   "🚀",
    Product:     "📦",
    Technology:  "⚙️",
    Operational: "🔄",
  };
  return map[type] ?? "💡";
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    New:         "#6366f1",
    Researching: "#f59e0b",
    Validated:   "#3b82f6",
    "In Progress": "#8b5cf6",
    Won:         "#10b981",
    Lost:        "#ef4444",
    Archived:    "#9ca3af",
  };
  return map[status] ?? "#9ca3af";
}

export function getStatusBg(status: string): string {
  const map: Record<string, string> = {
    New:           "#6366f108",
    Researching:   "#f59e0b0d",
    Validated:     "#3b82f60d",
    "In Progress": "#8b5cf60d",
    Won:           "#10b9810d",
    Lost:          "#ef44440d",
    Archived:      "#9ca3af0d",
  };
  return map[status] ?? "#9ca3af0d";
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    Low:      "#9ca3af",
    Medium:   "#f59e0b",
    High:     "#f97316",
    Critical: "#ef4444",
  };
  return map[priority] ?? "#9ca3af";
}

export function getConfidenceColor(confidence: string): string {
  const map: Record<string, string> = {
    Low:    "#ef4444",
    Medium: "#f59e0b",
    High:   "#10b981",
  };
  return map[confidence] ?? "#9ca3af";
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#6366f1";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Exceptional";
  if (score >= 60) return "Strong";
  if (score >= 40) return "Moderate";
  return "Early Stage";
}

// ─── Scoring Engine ───────────────────────────────────────────────────────────

export function calculateOpportunityScore(opts: {
  priority: string;
  confidence: string;
  status: string;
  hasAiInsight: boolean;
  hasEstimatedValue: boolean;
  hasMarket: boolean;
}): number {
  let score = 0;

  // Priority contribution (0-30)
  const priorityMap: Record<string, number> = { Low: 5, Medium: 15, High: 25, Critical: 30 };
  score += priorityMap[opts.priority] ?? 0;

  // Confidence contribution (0-25)
  const confMap: Record<string, number> = { Low: 5, Medium: 15, High: 25 };
  score += confMap[opts.confidence] ?? 0;

  // Status contribution (0-20)
  const statusMap: Record<string, number> = {
    New: 5, Researching: 10, Validated: 15, "In Progress": 18, Won: 20, Lost: 0, Archived: 0,
  };
  score += statusMap[opts.status] ?? 0;

  // Completeness bonus (0-25)
  if (opts.hasAiInsight)      score += 10;
  if (opts.hasEstimatedValue) score += 8;
  if (opts.hasMarket)         score += 7;

  return Math.min(100, Math.max(0, score));
}

// ─── Filter & Sort Helpers ────────────────────────────────────────────────────

export interface OpportunityFilters {
  search: string;
  type: string;
  status: string;
  priority: string;
  confidence: string;
  starred: boolean | null;
  sortBy: "score" | "updatedAt" | "title" | "priority";
  sortDir: "asc" | "desc";
}

export const DEFAULT_FILTERS: OpportunityFilters = {
  search:     "",
  type:       "",
  status:     "",
  priority:   "",
  confidence: "",
  starred:    null,
  sortBy:     "updatedAt",
  sortDir:    "desc",
};

export function filterOpportunities<T extends {
  title: string; description?: string | null; type: string; status: string;
  priority: string; confidence?: string | null; isStarred: boolean;
  score?: number | null; updatedAt: string | Date;
}>(opportunities: T[], filters: OpportunityFilters): T[] {
  let result = [...opportunities];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(o =>
      o.title.toLowerCase().includes(q) ||
      (o.description ?? "").toLowerCase().includes(q)
    );
  }
  if (filters.type)       result = result.filter(o => o.type === filters.type);
  if (filters.status)     result = result.filter(o => o.status === filters.status);
  if (filters.priority)   result = result.filter(o => o.priority === filters.priority);
  if (filters.confidence) result = result.filter(o => o.confidence === filters.confidence);
  if (filters.starred === true)  result = result.filter(o => o.isStarred);
  if (filters.starred === false) result = result.filter(o => !o.isStarred);

  result.sort((a, b) => {
    let diff = 0;
    if (filters.sortBy === "score")     diff = (b.score ?? 0) - (a.score ?? 0);
    if (filters.sortBy === "title")     diff = a.title.localeCompare(b.title);
    if (filters.sortBy === "priority") {
      const p: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      diff = (p[b.priority] ?? 0) - (p[a.priority] ?? 0);
    }
    if (filters.sortBy === "updatedAt") {
      diff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return filters.sortDir === "asc" ? -diff : diff;
  });

  return result;
}

// ─── Pipeline Columns ─────────────────────────────────────────────────────────

export const PIPELINE_COLUMNS: { status: OpportunityStatus; label: string; icon: string }[] = [
  { status: "New",         label: "New",         icon: "🆕" },
  { status: "Researching", label: "Researching",  icon: "🔍" },
  { status: "Validated",   label: "Validated",    icon: "✅" },
  { status: "In Progress", label: "In Progress",  icon: "⚡" },
  { status: "Won",         label: "Won",          icon: "🏆" },
];

// ─── AI Scan Stream ───────────────────────────────────────────────────────────

export async function runOpportunityScan(opts: {
  topic: string;
  context?: string;
  onChunk: (text: string) => void;
  onDone?: () => void;
  onError?: (err: string) => void;
}): Promise<void> {
  const { topic, context, onChunk, onDone, onError } = opts;
  try {
    await streamEngine({ engineId: "OpportunityEngine", topic, context, onChunk, onDone: onDone ? () => onDone() : undefined, onError });
  } catch (err) {
    onError?.(String(err));
  }
}
