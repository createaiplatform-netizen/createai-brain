import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG     = "#f8fafc";
const CARD   = "#ffffff";
const BORDER = "rgba(0,0,0,0.07)";
const ACCENT = "#6366f1";
const GREEN  = "#10b981";
const ORANGE = "#f59e0b";
const RED    = "#ef4444";
const TEXT   = "#0f172a";
const DIM    = "#64748b";
const PURPLE = "#8b5cf6";
const TEAL   = "#06b6d4";

// ─── Types ────────────────────────────────────────────────────────────────────
type EvolutionStatus = "EVOLVING" | "STALLED" | "REGRESSING";
type ActionClass = "SAFE_AUTO" | "REQUIRES_APPROVAL";

interface NextMove {
  rank: number; title: string; description: string;
  impactScore: number; easeScore: number; revenueScore: number;
  intelligenceScore: number; totalScore: number;
  action: string; estimatedTime: string; category: string; readyNow: boolean;
}
interface Limit {
  id: string; type: string; component: string; description: string;
  severity: "critical" | "high" | "medium" | "low"; blocksThat: string[];
}
interface LimitBreaker {
  limitId: string; component: string; action: string;
  steps: string[]; estimatedImpact: string; unlocks: string[];
}
interface ExpansionProposal {
  id: string; type: string; title: string; description: string;
  currentGap: string; implementation: string; dependsOn: string[]; readyNow: boolean;
}
interface ModuleStatus { name: string; type: string; reason: string; }
interface SelfAwarenessReport {
  scannedAt: string; totalRoutes: number; realCount: number; simulatedCount: number;
  realModules: ModuleStatus[]; simulatedModules: ModuleStatus[];
  dbTableCount: number; memoryUsageMB: number; uptimeHours: number;
}
interface ClassifiedAction {
  id: string; title: string; description: string;
  class: ActionClass; reason: string; category: string;
}
interface ExecutionRecord {
  actionId: string; title: string; class: ActionClass;
  executedAt: string; success: boolean; outcome: string;
  impactScore: number; durationMs: number; category: string;
}
interface PerformanceTrend {
  cycleNumber: number; evolutionStatus: EvolutionStatus;
  actionsExecuted: number; realImpactScore: number;
  detectedLimits: number; expansionIdeas: number;
  evolutionRate: number; stalledCount: number;
}
interface ConversionPlan {
  simulatedComponent: string; gap: string;
  conversionSteps: string[]; priority: "immediate" | "high" | "medium"; blockedBy: string;
}
interface ExpansionGuarantee {
  newImprovementIdea: string; systemOptimisation: string; expansionOpportunity: string;
}
interface FailsafeState {
  stallCount: number; escalated: boolean; criticalAlert: boolean;
  alertMessage: string; restorationSteps: string[];
}
interface CycleSummary {
  realIntegrations: number; detectedLimits: number; proposedBreakers: number;
  expansionIdeas: number; topScore: number; systemIntelligence: number;
  actionsExecuted: number; systemStatus: EvolutionStatus;
  evolutionRate: number; realImpactScore: number;
}
interface EvolutionCycle {
  cycleId: string; cycleNumber: number;
  startedAt: string; completedAt: string; durationMs: number;
  systemStatus: EvolutionStatus; evolutionRate: number; realImpactScore: number;
  activityEnforced: boolean; criticalFailure: boolean; criticalReason: string;
  classifiedActions: ClassifiedAction[];
  executedActions: ExecutionRecord[];
  performanceTrend: PerformanceTrend[];
  expansionGuarantee: ExpansionGuarantee;
  conversionPlans: ConversionPlan[];
  failsafe: FailsafeState;
  awareness: SelfAwarenessReport;
  limits: Limit[];
  breakers: LimitBreaker[];
  expansions: ExpansionProposal[];
  nextMoves: NextMove[];
  summary: CycleSummary;
}

// ─── API helpers ─────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const api  = (path: string) => `${BASE}/api/above-transcend${path}`;

async function fetchLatest(): Promise<{ ok: boolean; ready: boolean; cycle?: EvolutionCycle }> {
  const r = await fetch(api("/latest"), { credentials: "include" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function triggerRun(): Promise<{ ok: boolean; cycleNumber: number; systemStatus: EvolutionStatus }> {
  const r = await fetch(api("/run"), { method: "POST", credentials: "include" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ─── Shared primitives ────────────────────────────────────────────────────────
function ScoreBar({ value, color = ACCENT }: { value: number; color?: string }) {
  return (
    <div style={{ height: 4, borderRadius: 9, background: "rgba(0,0,0,0.06)", overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 9, transition: "width 0.6s ease" }} />
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 700, letterSpacing: "0.04em",
      textTransform: "uppercase" as const, borderRadius: 5,
      padding: "2px 7px", background: color + "18", color,
    }}>{label}</span>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 22px", ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <h3 style={{ fontSize: 11, fontWeight: 700, color: DIM, letterSpacing: "0.08em",
        textTransform: "uppercase" as const, margin: 0 }}>
        {children}
      </h3>
    </div>
  );
}

function StatTile({ label, value, color = ACCENT, sub }: { label: string; value: React.ReactNode; color?: string; sub?: string }) {
  return (
    <div style={{ background: color + "0d", border: `1px solid ${color}25`, borderRadius: 12, padding: "14px 18px" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: TEXT, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Evolution status badge ───────────────────────────────────────────────────
function EvolutionBadge({ status }: { status: EvolutionStatus }) {
  const map: Record<EvolutionStatus, { color: string; icon: string }> = {
    EVOLVING:   { color: GREEN,  icon: "🟢" },
    STALLED:    { color: ORANGE, icon: "🟡" },
    REGRESSING: { color: RED,    icon: "🔴" },
  };
  const { color, icon } = map[status];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: color + "12", border: `1px solid ${color}30`,
      borderRadius: 20, padding: "4px 12px",
    }}>
      <span style={{ fontSize: 11 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color, letterSpacing: "0.05em" }}>{status}</span>
    </div>
  );
}

// ─── Phase 1 — Activity Enforcement ─────────────────────────────────────────
function Phase1Panel({ enforced, criticalFailure, criticalReason, actions }: {
  enforced: boolean; criticalFailure: boolean; criticalReason: string;
  actions: ExecutionRecord[];
}) {
  const successCount = actions.filter(a => a.success).length;
  return (
    <Card style={criticalFailure ? { borderColor: RED + "40", background: RED + "03" } : {}}>
      <SectionTitle icon="⚡">Phase 1 — Activity Enforcement</SectionTitle>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          fontSize: 12, fontWeight: 700,
          color: criticalFailure ? RED : GREEN,
          background: (criticalFailure ? RED : GREEN) + "10",
          border: `1px solid ${(criticalFailure ? RED : GREEN)}25`,
          borderRadius: 8, padding: "5px 12px",
        }}>
          {criticalFailure ? "⚠️ BELOW 100% EVOLUTION" : "✅ 100% EVOLUTION MET"}
        </div>
        <span style={{ fontSize: 12, color: DIM }}>
          {successCount}/{actions.length} actions succeeded this cycle
        </span>
      </div>
      {criticalFailure && (
        <div style={{ fontSize: 12, color: RED, background: RED + "08",
          borderRadius: 8, padding: "10px 14px", marginBottom: 12, lineHeight: 1.6 }}>
          {criticalReason}
        </div>
      )}
      <div style={{ fontSize: 11, color: DIM, lineHeight: 1.7 }}>
        <strong style={{ color: TEXT }}>Rule:</strong> Every cycle must produce ≥1 of:
        system improvement · new capability · real-world action · measurable optimisation.
        If none occur → CRITICAL FAILURE.
      </div>
    </Card>
  );
}

// ─── Phase 2 — Execution Layer ────────────────────────────────────────────────
function Phase2Panel({ classified, executed }: {
  classified: ClassifiedAction[]; executed: ExecutionRecord[];
}) {
  const [tab, setTab] = useState<"classified" | "executed">("executed");

  return (
    <Card>
      <SectionTitle icon="🚀">Phase 2 — Execution Layer</SectionTitle>

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["executed", "classified"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 8, border: "none",
            cursor: "pointer", letterSpacing: "0.04em", textTransform: "uppercase" as const,
            background: tab === t ? ACCENT : "rgba(0,0,0,0.05)",
            color: tab === t ? "#fff" : DIM,
            transition: "all 0.15s",
          }}>
            {t === "executed" ? `Executed (${executed.length})` : `Classified (${classified.length})`}
          </button>
        ))}
      </div>

      {tab === "executed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {executed.map(a => (
            <div key={a.actionId} style={{
              border: `1px solid ${a.success ? GREEN : RED}30`,
              borderRadius: 10, padding: "12px 14px",
              background: (a.success ? GREEN : RED) + "04",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}>{a.success ? "✅" : "❌"}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, flex: 1 }}>{a.title}</span>
                <Badge label={a.class} color={a.class === "SAFE_AUTO" ? GREEN : ORANGE} />
                <Badge label={a.category} color={ACCENT} />
                <span style={{ fontSize: 10.5, color: DIM }}>{a.durationMs}ms</span>
              </div>
              <div style={{ fontSize: 11.5, color: DIM, lineHeight: 1.5, marginBottom: 8 }}>{a.outcome}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10.5, color: DIM }}>Impact score</span>
                <ScoreBar value={a.impactScore} color={a.success ? GREEN : RED} />
                <span style={{ fontSize: 11, fontWeight: 700, color: a.success ? GREEN : RED, width: 26, textAlign: "right" as const }}>
                  {a.impactScore}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "classified" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {classified.map(a => (
            <div key={a.id} style={{
              border: `1px solid ${a.class === "SAFE_AUTO" ? GREEN : ORANGE}30`,
              borderRadius: 10, padding: "12px 14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Badge label={a.class} color={a.class === "SAFE_AUTO" ? GREEN : ORANGE} />
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, flex: 1 }}>{a.title}</span>
                <Badge label={a.category} color={ACCENT} />
              </div>
              <div style={{ fontSize: 11.5, color: DIM, lineHeight: 1.5 }}>{a.reason}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Phase 3 — Feedback Loop ─────────────────────────────────────────────────
function Phase3Panel({ trends }: { trends: PerformanceTrend[] }) {
  if (trends.length === 0) {
    return (
      <Card>
        <SectionTitle icon="🔄">Phase 3 — Feedback Loop</SectionTitle>
        <div style={{ textAlign: "center" as const, padding: "20px 0", color: DIM, fontSize: 12 }}>
          Performance trends accumulate after the second cycle
        </div>
      </Card>
    );
  }

  const statusColor = (s: EvolutionStatus) =>
    s === "EVOLVING" ? GREEN : s === "STALLED" ? ORANGE : RED;

  return (
    <Card>
      <SectionTitle icon="🔄">Phase 3 — Feedback Loop ({trends.length} cycles tracked)</SectionTitle>
      <div style={{ overflowX: "auto" as const }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 11.5 }}>
          <thead>
            <tr>
              {["Cycle", "Status", "Actions", "Impact", "Rate", "Stalls", "Limits"].map(h => (
                <th key={h} style={{ textAlign: "left" as const, padding: "6px 10px",
                  color: DIM, fontWeight: 700, fontSize: 10, letterSpacing: "0.06em",
                  textTransform: "uppercase" as const, borderBottom: `1px solid ${BORDER}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trends.map(t => (
              <tr key={t.cycleNumber} style={{ borderBottom: `1px solid ${BORDER}` }}>
                <td style={{ padding: "8px 10px", fontWeight: 700, color: TEXT }}>#{t.cycleNumber}</td>
                <td style={{ padding: "8px 10px" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: statusColor(t.evolutionStatus),
                    background: statusColor(t.evolutionStatus) + "12", borderRadius: 5, padding: "2px 6px" }}>
                    {t.evolutionStatus}
                  </span>
                </td>
                <td style={{ padding: "8px 10px", color: TEXT }}>{t.actionsExecuted}</td>
                <td style={{ padding: "8px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <ScoreBar value={t.realImpactScore} color={GREEN} />
                    <span style={{ color: GREEN, fontWeight: 700, width: 26 }}>{t.realImpactScore}</span>
                  </div>
                </td>
                <td style={{ padding: "8px 10px", color: ACCENT, fontWeight: 600 }}>{t.evolutionRate}</td>
                <td style={{ padding: "8px 10px", color: t.stalledCount > 0 ? RED : DIM }}>{t.stalledCount}</td>
                <td style={{ padding: "8px 10px", color: DIM }}>{t.detectedLimits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Phase 4 — Expansion Guarantee ───────────────────────────────────────────
function Phase4Panel({ guarantee, proposals }: { guarantee: ExpansionGuarantee; proposals: ExpansionProposal[] }) {
  const TYPE_COLORS: Record<string, string> = {
    new_module: ACCENT, new_integration: PURPLE, new_workflow: GREEN,
    revenue_opportunity: ORANGE, automation_loop: TEAL,
  };

  return (
    <Card>
      <SectionTitle icon="🌱">Phase 4 — Expansion Guarantee</SectionTitle>

      {/* This cycle's 3 guaranteed outputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "New Improvement Idea",    value: guarantee.newImprovementIdea,   color: ACCENT,  icon: "💡" },
          { label: "System Optimisation",     value: guarantee.systemOptimisation,    color: GREEN,   icon: "⚙️" },
          { label: "Expansion Opportunity",   value: guarantee.expansionOpportunity,  color: PURPLE,  icon: "🚀" },
        ].map(item => (
          <div key={item.label} style={{
            background: item.color + "08", border: `1px solid ${item.color}25`,
            borderRadius: 10, padding: "12px 14px",
          }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: item.color, letterSpacing: "0.06em",
              textTransform: "uppercase" as const, marginBottom: 6 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 11.5, color: TEXT, lineHeight: 1.5 }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Full proposals grid */}
      <div style={{ fontSize: 10, fontWeight: 700, color: DIM, letterSpacing: "0.06em",
        textTransform: "uppercase" as const, marginBottom: 10 }}>
        All {proposals.length} Proposals
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {proposals.map(p => {
          const color = TYPE_COLORS[p.type] ?? ACCENT;
          return (
            <div key={p.id} style={{
              border: `1px solid ${color}30`, borderRadius: 10,
              padding: "14px 16px", background: color + "05",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                <Badge label={p.type.replace(/_/g, " ")} color={color} />
                {p.readyNow && <Badge label="Ready now" color={GREEN} />}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 5 }}>{p.title}</div>
              <div style={{ fontSize: 11.5, color: DIM, lineHeight: 1.5, marginBottom: 8 }}>{p.description}</div>
              <div style={{ fontSize: 10.5, color: TEXT, background: "rgba(0,0,0,0.03)",
                borderRadius: 7, padding: "6px 10px", lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600 }}>Gap: </span>{p.currentGap}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Phase 5 — Reality Priority ──────────────────────────────────────────────
function Phase5Panel({ awareness, plans }: {
  awareness: SelfAwarenessReport; plans: ConversionPlan[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const priorityColor = (p: string) => p === "immediate" ? RED : p === "high" ? ORANGE : ACCENT;

  return (
    <Card>
      <SectionTitle icon="🎯">Phase 5 — Reality Priority</SectionTitle>

      {/* Real vs simulated summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        <StatTile label="Real Modules"      value={awareness.realCount}      color={GREEN}  />
        <StatTile label="Simulated/Partial" value={awareness.simulatedCount} color={ORANGE} />
        <StatTile label="Memory Usage"      value={`${awareness.memoryUsageMB}MB`} color={PURPLE} />
        <StatTile label="Uptime"            value={`${awareness.uptimeHours}h`} color={TEAL} />
      </div>

      {/* Real/simulated lists */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, marginBottom: 8 }}>✅ Real & Live</div>
          {awareness.realModules.map(m => (
            <div key={m.name} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7 }}>
              <span style={{ flexShrink: 0, width: 7, height: 7, borderRadius: "50%",
                background: GREEN, marginTop: 5, display: "block" }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{m.name}</div>
                <div style={{ fontSize: 10.5, color: DIM, lineHeight: 1.4 }}>{m.reason}</div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: ORANGE, marginBottom: 8 }}>⚠️ Simulated / Partial</div>
          {awareness.simulatedModules.map(m => (
            <div key={m.name} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7 }}>
              <span style={{ flexShrink: 0, width: 7, height: 7, borderRadius: "50%",
                background: m.type === "partial" ? ORANGE : RED, marginTop: 5, display: "block" }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{m.name}</div>
                <div style={{ fontSize: 10.5, color: DIM, lineHeight: 1.4 }}>{m.reason}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion plans */}
      <div style={{ fontSize: 10, fontWeight: 700, color: DIM, letterSpacing: "0.06em",
        textTransform: "uppercase" as const, marginBottom: 10 }}>
        Conversion Plans — Make Simulated Real
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {plans.map(p => (
          <div key={p.simulatedComponent}
            onClick={() => setExpanded(expanded === p.simulatedComponent ? null : p.simulatedComponent)}
            style={{
              border: `1px solid ${expanded === p.simulatedComponent ? priorityColor(p.priority) + "50" : BORDER}`,
              borderRadius: 10, padding: "12px 14px", cursor: "pointer",
              background: expanded === p.simulatedComponent ? priorityColor(p.priority) + "04" : "transparent",
              transition: "all 0.15s",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Badge label={p.priority} color={priorityColor(p.priority)} />
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, flex: 1 }}>{p.simulatedComponent}</span>
              <span style={{ fontSize: 11, color: DIM }}>{expanded === p.simulatedComponent ? "▲" : "▼"}</span>
            </div>
            {expanded === p.simulatedComponent && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11.5, color: DIM, lineHeight: 1.5, marginBottom: 10 }}>{p.gap}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: DIM, marginBottom: 8,
                  textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Conversion Steps</div>
                {p.conversionSteps.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span style={{ flexShrink: 0, fontSize: 11, color: ACCENT, fontWeight: 700, minWidth: 16 }}>{i + 1}.</span>
                    <span style={{ fontSize: 11.5, color: TEXT, lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
                <div style={{ marginTop: 10, fontSize: 11, color: ORANGE, background: ORANGE + "0d",
                  borderRadius: 7, padding: "6px 10px" }}>
                  <span style={{ fontWeight: 600 }}>Blocked by: </span>{p.blockedBy}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Phase 6 — Self-Scoring ───────────────────────────────────────────────────
function Phase6Panel({ status, evolutionRate, realImpactScore }: {
  status: EvolutionStatus; evolutionRate: number; realImpactScore: number;
}) {
  const descriptions: Record<EvolutionStatus, string> = {
    EVOLVING:   "Active improvement detected — ≥3 actions executed, ≥2 succeeded this cycle. System is at or above 100% evolution.",
    STALLED:    "No real progress this cycle — action count or success rate below threshold. System is below 100% evolution.",
    REGRESSING: "Impact score dropped >10 points from previous cycle AND <2 successes. Evolution moving backwards.",
  };
  const statusColor = status === "EVOLVING" ? GREEN : status === "STALLED" ? ORANGE : RED;

  return (
    <Card>
      <SectionTitle icon="📊">Phase 6 — Self-Scoring Model</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 14, alignItems: "start" }}>
        <div style={{
          background: statusColor + "0d", border: `1px solid ${statusColor}30`,
          borderRadius: 12, padding: "16px 22px", textAlign: "center" as const,
        }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: statusColor, lineHeight: 1 }}>{status}</div>
          <div style={{ fontSize: 10, color: DIM, marginTop: 4, fontWeight: 600 }}>Evolution Status</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: GREEN + "08", border: `1px solid ${GREEN}25`,
            borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: GREEN }}>{evolutionRate}</div>
            <div style={{ fontSize: 10.5, color: DIM, fontWeight: 600, marginTop: 3 }}>Evolution Rate (actions/cycle)</div>
          </div>
          <div style={{ background: ACCENT + "08", border: `1px solid ${ACCENT}25`,
            borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: ACCENT }}>{realImpactScore}</div>
            <div style={{ fontSize: 10.5, color: DIM, fontWeight: 600, marginTop: 3 }}>Real Impact Score (0–100)</div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: DIM, lineHeight: 1.7, background: statusColor + "06",
          borderRadius: 10, padding: "14px 16px", border: `1px solid ${statusColor}20` }}>
          <strong style={{ color: statusColor }}>Status definition:</strong><br />
          {descriptions[status]}
        </div>
      </div>

      {/* Scoring thresholds reference */}
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        {[
          { label: "EVOLVING ≥100%",  desc: "≥3 actions, ≥2 success",    color: GREEN  },
          { label: "STALLED <100%",   desc: "below action/success threshold", color: ORANGE },
          { label: "REGRESSING",      desc: "impact drops >10 + <2 success", color: RED    },
        ].map(item => (
          <div key={item.label} style={{ background: item.color + "08",
            border: `1px solid ${item.color}20`, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.label}</div>
            <div style={{ fontSize: 10.5, color: DIM, marginTop: 3 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Phase 7 — Failsafe ────────────────────────────────────────────────────────
function Phase7Panel({ failsafe, limits }: { failsafe: FailsafeState; limits: Limit[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const color = failsafe.criticalAlert ? RED : failsafe.escalated ? ORANGE : GREEN;

  return (
    <Card style={failsafe.criticalAlert ? { borderColor: RED + "40", background: RED + "03" } : {}}>
      <SectionTitle icon="🛡️">Phase 7 — Failsafe Enforcement</SectionTitle>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color,
          background: color + "10", border: `1px solid ${color}25`,
          borderRadius: 8, padding: "6px 12px",
        }}>
          {failsafe.criticalAlert ? "⚠️ CRITICAL ALERT" : failsafe.escalated ? "⬆️ ESCALATED" : "✅ NOMINAL"}
        </div>
        <span style={{ fontSize: 12, color: DIM }}>
          Stall streak: <strong style={{ color: failsafe.stallCount > 0 ? RED : GREEN }}>{failsafe.stallCount}</strong> consecutive cycles
        </span>
      </div>

      {failsafe.alertMessage && (
        <div style={{ fontSize: 12, color, background: color + "08",
          borderRadius: 8, padding: "10px 14px", marginBottom: 14, lineHeight: 1.6,
          border: `1px solid ${color}20` }}>
          {failsafe.alertMessage}
        </div>
      )}

      {failsafe.restorationSteps.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: DIM, letterSpacing: "0.06em",
            textTransform: "uppercase" as const, marginBottom: 8 }}>
            Restoration Steps
          </div>
          {failsafe.restorationSteps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <span style={{ flexShrink: 0, fontSize: 11, color: RED, fontWeight: 700, minWidth: 16 }}>{i + 1}.</span>
              <span style={{ fontSize: 11.5, color: TEXT, lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* Limit details */}
      <div style={{ fontSize: 10, fontWeight: 700, color: DIM, letterSpacing: "0.06em",
        textTransform: "uppercase" as const, marginBottom: 8 }}>
        Active Limits ({limits.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {limits.map(l => {
          const lc = l.severity === "critical" ? RED : l.severity === "high" ? ORANGE : l.severity === "medium" ? ACCENT : DIM;
          return (
            <div key={l.id}
              onClick={() => setOpen(open === l.id ? null : l.id)}
              style={{
                border: `1px solid ${open === l.id ? lc + "50" : BORDER}`,
                borderRadius: 9, padding: "10px 12px", cursor: "pointer",
                background: open === l.id ? lc + "04" : "transparent", transition: "all 0.15s",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: lc,
                  background: lc + "15", borderRadius: 5, padding: "2px 6px",
                  textTransform: "uppercase" as const }}>
                  {l.severity}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT, flex: 1 }}>{l.component}</span>
                <span style={{ fontSize: 10, color: DIM }}>{open === l.id ? "▲" : "▼"}</span>
              </div>
              {open === l.id && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 11.5, color: TEXT, lineHeight: 1.6, margin: "0 0 6px" }}>{l.description}</p>
                  <div style={{ fontSize: 11, color: DIM }}>
                    <span style={{ fontWeight: 600 }}>Blocks: </span>{l.blocksThat.join(" · ")}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Phase 8 — Structured Output (Next Moves) ────────────────────────────────
const RANK_COLORS = ["#f59e0b", "#94a3b8", "#cd7f32", ACCENT, DIM];

function Phase8Panel({ moves, breakers }: { moves: NextMove[]; breakers: LimitBreaker[] }) {
  const [breakerOpen, setBreakerOpen] = useState<string | null>(null);

  return (
    <>
      <Card>
        <SectionTitle icon="▲">Phase 8 — Top 5 Next Moves</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {moves.map((m, i) => (
            <div key={m.rank} style={{
              border: `1px solid ${i === 0 ? ACCENT + "40" : BORDER}`,
              borderRadius: 12, padding: "16px 18px",
              background: i === 0 ? ACCENT + "04" : "transparent",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: 10,
                  background: RANK_COLORS[i] + "20", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, color: RANK_COLORS[i],
                }}>#{m.rank}</div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{m.title}</span>
                    {m.readyNow && <Badge label="Ready now" color={GREEN} />}
                    <Badge label={m.category.replace(/_/g, " ")} color={ACCENT} />
                  </div>
                  <p style={{ fontSize: 12, color: DIM, margin: "0 0 10px", lineHeight: 1.5 }}>{m.description}</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
                    {[
                      { label: "Impact",       value: m.impactScore,       color: GREEN  },
                      { label: "Ease",         value: m.easeScore,         color: ACCENT },
                      { label: "Revenue",      value: m.revenueScore,      color: ORANGE },
                      { label: "Intelligence", value: m.intelligenceScore, color: PURPLE },
                    ].map(row => (
                      <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: DIM, width: 76, flexShrink: 0 }}>{row.label}</span>
                        <ScoreBar value={row.value} color={row.color} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: row.color, width: 30,
                          textAlign: "right" as const, flexShrink: 0 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 11.5, color: TEXT, background: "rgba(0,0,0,0.03)",
                      borderRadius: 7, padding: "6px 10px", flex: 1, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600 }}>Action: </span>{m.action}
                    </div>
                    <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: ACCENT,
                      background: ACCENT + "10", borderRadius: 7, padding: "6px 10px" }}>
                      ⏱ {m.estimatedTime}
                    </div>
                  </div>
                </div>

                <div style={{ flexShrink: 0, textAlign: "right" as const }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: ACCENT }}>{m.totalScore}</div>
                  <div style={{ fontSize: 9.5, color: DIM, fontWeight: 600 }}>TOTAL SCORE</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle icon="🔓">Limit Breakers ({breakers.length})</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {breakers.map(b => (
            <div key={b.limitId}
              onClick={() => setBreakerOpen(breakerOpen === b.limitId ? null : b.limitId)}
              style={{
                border: `1px solid ${breakerOpen === b.limitId ? GREEN + "50" : BORDER}`,
                borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                background: breakerOpen === b.limitId ? GREEN + "04" : "transparent",
                transition: "all 0.15s",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }}>🔓</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, flex: 1 }}>{b.component}</span>
                <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>{b.action.slice(0, 38)}…</span>
                <span style={{ fontSize: 11, color: DIM }}>{breakerOpen === b.limitId ? "▲" : "▼"}</span>
              </div>
              {breakerOpen === b.limitId && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: DIM, marginBottom: 8,
                    textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Steps</div>
                  {b.steps.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                      <span style={{ flexShrink: 0, fontSize: 11, color: ACCENT, fontWeight: 700, minWidth: 16 }}>{i + 1}.</span>
                      <span style={{ fontSize: 11.5, color: TEXT, lineHeight: 1.5 }}>{s}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, padding: "8px 12px",
                    background: GREEN + "0d", borderRadius: 8, border: `1px solid ${GREEN}22` }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: GREEN }}>Impact: </span>
                    <span style={{ fontSize: 11, color: TEXT }}>{b.estimatedImpact}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: DIM }}>
                    <span style={{ fontWeight: 600 }}>Unlocks: </span>{b.unlocks.join(" · ")}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AboveTranscendPage() {
  const qc = useQueryClient();

  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["above-transcend"],
    queryFn:  fetchLatest,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const runMutation = useMutation({
    mutationFn: triggerRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["above-transcend"] }),
  });

  const cycle  = data?.cycle;
  const ready  = data?.ready ?? false;
  const lastMs = dataUpdatedAt ? Math.round((Date.now() - dataUpdatedAt) / 1000) : null;

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "28px 24px 60px" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: `0 4px 14px ${ACCENT}40`,
          }}>▲</div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: 0 }}>
                Above-Transcend Engine
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 5,
                background: GREEN + "12", border: `1px solid ${GREEN}30`,
                borderRadius: 20, padding: "3px 10px" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN,
                  display: "inline-block", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>RUNNING</span>
              </div>
              {cycle && <EvolutionBadge status={cycle.systemStatus} />}
              {cycle && (
                <span style={{ fontSize: 11, color: DIM }}>
                  Cycle #{cycle.cycleNumber} · {cycle.durationMs}ms
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: DIM, margin: "5px 0 0", lineHeight: 1.6 }}>
              MINIMUM 100% SELF-EVOLUTION enforced. Every cycle must produce at least one
              real-world action, system improvement, new capability, or measurable optimisation.
              <strong style={{ color: TEXT }}> There is no completion state. Only continuous evolution.</strong>
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {lastMs !== null && (
              <span style={{ fontSize: 11, color: DIM }}>Updated {lastMs}s ago</span>
            )}
            <button
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              style={{
                height: 36, borderRadius: 9, padding: "0 16px", border: "none",
                background: runMutation.isPending ? DIM : ACCENT,
                color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: runMutation.isPending ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}>
              {runMutation.isPending ? "Running…" : "▶ Run Now"}
            </button>
          </div>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <Card style={{ textAlign: "center" as const, padding: 48 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>First cycle executing…</div>
            <div style={{ fontSize: 12, color: DIM, marginTop: 6 }}>
              Running 5 SAFE_AUTO actions · scanning all modules · enforcing 8 phases
            </div>
          </Card>
        )}

        {/* ── Error ── */}
        {error && (
          <Card style={{ borderColor: RED + "40", background: RED + "05" }}>
            <div style={{ fontSize: 13, color: RED }}>Engine error: {(error as Error).message}</div>
          </Card>
        )}

        {/* ── Not ready ── */}
        {!isLoading && ready === false && !error && (
          <Card style={{ textAlign: "center" as const, padding: 48 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>Cycle in progress…</div>
            <div style={{ fontSize: 12, color: DIM, marginTop: 6 }}>Auto-refreshes in 10 seconds</div>
          </Card>
        )}

        {/* ── Main cycle data ── */}
        {ready && cycle && (
          <>
            {/* Critical failure banner */}
            {cycle.criticalFailure && (
              <div style={{ marginBottom: 20, padding: "14px 20px",
                background: RED + "08", border: `1px solid ${RED}30`,
                borderRadius: 12, display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>🚨</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: RED, marginBottom: 4 }}>
                    CRITICAL FAILURE — System below 100% evolution
                  </div>
                  <div style={{ fontSize: 12, color: RED + "cc" }}>{cycle.criticalReason}</div>
                </div>
              </div>
            )}

            {/* Summary tiles — 8 metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 8 }}>
              <StatTile label="Evolution Status"  value={cycle.systemStatus}                                   color={cycle.systemStatus === "EVOLVING" ? GREEN : cycle.systemStatus === "STALLED" ? ORANGE : RED} />
              <StatTile label="Actions Executed"  value={cycle.executedActions.length}                        color={GREEN}  sub="this cycle" />
              <StatTile label="Real Impact Score" value={cycle.realImpactScore}                               color={ACCENT} sub="/100" />
              <StatTile label="Evolution Rate"    value={cycle.evolutionRate}                                 color={PURPLE} sub="actions/cycle" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
              <StatTile label="Real Integrations" value={cycle.summary.realIntegrations}                      color={GREEN}  />
              <StatTile label="Limits Detected"   value={cycle.summary.detectedLimits}                       color={RED}    />
              <StatTile label="Top Move Score"    value={cycle.summary.topScore}                              color={ACCENT} sub="/100" />
              <StatTile label="Real vs Simulated" value={`${cycle.summary.systemIntelligence}%`}             color={GREEN}  sub="real ratio" />
            </div>

            {/* 8 phase panels */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Phase1Panel
                enforced={cycle.activityEnforced}
                criticalFailure={cycle.criticalFailure}
                criticalReason={cycle.criticalReason}
                actions={cycle.executedActions}
              />
              <Phase2Panel classified={cycle.classifiedActions} executed={cycle.executedActions} />
              <Phase3Panel trends={cycle.performanceTrend} />
              <Phase4Panel guarantee={cycle.expansionGuarantee} proposals={cycle.expansions} />
              <Phase5Panel awareness={cycle.awareness} plans={cycle.conversionPlans} />
              <Phase6Panel
                status={cycle.systemStatus}
                evolutionRate={cycle.evolutionRate}
                realImpactScore={cycle.realImpactScore}
              />
              <Phase7Panel failsafe={cycle.failsafe} limits={cycle.limits} />
              <Phase8Panel moves={cycle.nextMoves} breakers={cycle.breakers} />
            </div>

            {/* Footer */}
            <div style={{ marginTop: 24, padding: "14px 20px",
              background: ACCENT + "08", border: `1px solid ${ACCENT}20`,
              borderRadius: 12, display: "flex", alignItems: "center",
              justifyContent: "space-between" as const }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>
                  ▲ Above-Transcend Engine v2 — MINIMUM 100% SELF-EVOLUTION
                </div>
                <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>
                  {cycle.cycleNumber} total cycle{cycle.cycleNumber === 1 ? "" : "s"} · last: {new Date(cycle.completedAt).toLocaleTimeString()} · {cycle.durationMs}ms
                </div>
              </div>
              <div style={{ fontSize: 11, color: DIM, textAlign: "right" as const }}>
                <div>Next auto-cycle in ~10 min</div>
                <div style={{ marginTop: 2 }}>Stall streak: <strong style={{ color: cycle.failsafe.stallCount > 0 ? RED : GREEN }}>{cycle.failsafe.stallCount}</strong></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
