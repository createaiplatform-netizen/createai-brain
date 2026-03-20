import React, { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG      = "#f8fafc";
const CARD    = "#ffffff";
const BORDER  = "rgba(0,0,0,0.07)";
const ACCENT  = "#6366f1";
const GREEN   = "#10b981";
const ORANGE  = "#f59e0b";
const RED     = "#ef4444";
const TEXT    = "#0f172a";
const DIM     = "#64748b";
const PURPLE  = "#8b5cf6";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NextMove {
  rank: number; title: string; description: string;
  impactScore: number; easeScore: number; revenueScore: number; intelligenceScore: number;
  totalScore: number; action: string; estimatedTime: string; category: string; readyNow: boolean;
}
interface Limit {
  id: string; type: string; component: string; description: string;
  severity: "critical" | "high" | "medium" | "low"; blocksThat: string[];
}
interface LimitBreaker {
  limitId: string; component: string; action: string; steps: string[];
  estimatedImpact: string; unlocks: string[];
}
interface ExpansionProposal {
  id: string; type: string; title: string; description: string;
  currentGap: string; implementation: string; dependsOn: string[]; readyNow: boolean;
}
interface ModuleStatus { name: string; type: string; reason: string; }
interface SelfAwarenessReport {
  scannedAt: string; totalRoutes: number; realCount: number; simulatedCount: number;
  realModules: ModuleStatus[]; simulatedModules: ModuleStatus[];
  dbTableCount: number;
}
interface CycleSummary {
  realIntegrations: number; detectedLimits: number; proposedBreakers: number;
  expansionIdeas: number; topScore: number; systemIntelligence: number;
}
interface EvolutionCycle {
  cycleId: string; cycleNumber: number; startedAt: string;
  completedAt: string; durationMs: number; summary: CycleSummary;
  phase1: SelfAwarenessReport; phase2: Limit[]; phase3: LimitBreaker[];
  phase4: ExpansionProposal[]; phase5: NextMove[];
}

// ─── API helpers ─────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const api  = (path: string) => `${BASE}/api/above-transcend${path}`;

async function fetchLatest(): Promise<{ ok: boolean; ready: boolean; cycle?: EvolutionCycle }> {
  const r = await fetch(api("/latest"), { credentials: "include" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function triggerRun(): Promise<{ ok: boolean; cycleNumber: number; summary: CycleSummary }> {
  const r = await fetch(api("/run"), { method: "POST", credentials: "include" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ─── Small reusable components ───────────────────────────────────────────────

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
      textTransform: "uppercase", borderRadius: 5,
      padding: "2px 7px", background: color + "18", color,
    }}>{label}</span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const c = severity === "critical" ? RED : severity === "high" ? ORANGE : severity === "medium" ? ACCENT : DIM;
  return <Badge label={severity} color={c} />;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 14, padding: "20px 22px",
      ...style,
    }}>{children}</div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 11, fontWeight: 700, color: DIM, letterSpacing: "0.08em",
      textTransform: "uppercase", margin: "0 0 14px" }}>
      {children}
    </h3>
  );
}

// ─── Stat Tile ────────────────────────────────────────────────────────────────
function StatTile({ label, value, color = ACCENT, sub }: { label: string; value: React.ReactNode; color?: string; sub?: string }) {
  return (
    <div style={{ background: color + "0d", border: `1px solid ${color}25`, borderRadius: 12, padding: "14px 18px" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: TEXT, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Phase 1 — Self-Awareness ────────────────────────────────────────────────
function Phase1Panel({ data }: { data: SelfAwarenessReport }) {
  return (
    <Card>
      <SectionTitle>Phase 1 — Self-Awareness</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
        <StatTile label="Total Routes"      value={data.totalRoutes}      color={ACCENT}  />
        <StatTile label="Real Modules"      value={data.realCount}        color={GREEN}   />
        <StatTile label="Simulated/Partial" value={data.simulatedCount}   color={ORANGE}  />
        <StatTile label="DB Tables"         value={data.dbTableCount}     color={PURPLE}  />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, marginBottom: 8 }}>✅ Real & Live</div>
          {data.realModules.map(m => (
            <div key={m.name} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7 }}>
              <span style={{ flexShrink: 0, width: 7, height: 7, borderRadius: "50%", background: GREEN, marginTop: 5, display: "block" }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{m.name}</div>
                <div style={{ fontSize: 10.5, color: DIM, lineHeight: 1.4 }}>{m.reason}</div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: ORANGE, marginBottom: 8 }}>⚠️ Simulated / Partial</div>
          {data.simulatedModules.map(m => (
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
    </Card>
  );
}

// ─── Phase 2 — Limits ────────────────────────────────────────────────────────
function Phase2Panel({ limits }: { limits: Limit[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Card>
      <SectionTitle>Phase 2 — Limit Detection ({limits.length} found)</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {limits.map(l => (
          <div key={l.id}
            onClick={() => setOpen(open === l.id ? null : l.id)}
            style={{
              border: `1px solid ${open === l.id ? ACCENT + "50" : BORDER}`,
              borderRadius: 10, padding: "12px 14px", cursor: "pointer",
              background: open === l.id ? ACCENT + "04" : "transparent",
              transition: "all 0.15s",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SeverityBadge severity={l.severity} />
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, flex: 1 }}>{l.component}</span>
              <Badge label={l.type.replace(/_/g, " ")} color={DIM} />
              <span style={{ fontSize: 11, color: DIM }}>{open === l.id ? "▲" : "▼"}</span>
            </div>
            {open === l.id && (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontSize: 12, color: TEXT, lineHeight: 1.6, margin: "0 0 8px" }}>{l.description}</p>
                <div style={{ fontSize: 11, color: DIM }}>
                  <span style={{ fontWeight: 600 }}>Blocks: </span>
                  {l.blocksThat.join(" · ")}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Phase 3 — Limit Breakers ────────────────────────────────────────────────
function Phase3Panel({ breakers }: { breakers: LimitBreaker[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Card>
      <SectionTitle>Phase 3 — Limit Breaking ({breakers.length} breakers)</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {breakers.map(b => (
          <div key={b.limitId}
            onClick={() => setOpen(open === b.limitId ? null : b.limitId)}
            style={{
              border: `1px solid ${open === b.limitId ? GREEN + "50" : BORDER}`,
              borderRadius: 10, padding: "12px 14px", cursor: "pointer",
              background: open === b.limitId ? GREEN + "04" : "transparent",
              transition: "all 0.15s",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13 }}>🔓</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, flex: 1 }}>{b.component}</span>
              <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>{b.action.slice(0, 40)}…</span>
              <span style={{ fontSize: 11, color: DIM }}>{open === b.limitId ? "▲" : "▼"}</span>
            </div>
            {open === b.limitId && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: DIM, marginBottom: 8 }}>STEPS</div>
                {b.steps.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span style={{ flexShrink: 0, fontSize: 11, color: ACCENT, fontWeight: 700, minWidth: 16 }}>{i + 1}.</span>
                    <span style={{ fontSize: 11.5, color: TEXT, lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
                <div style={{ marginTop: 10, padding: "8px 12px", background: GREEN + "0d",
                  borderRadius: 8, border: `1px solid ${GREEN}22` }}>
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
  );
}

// ─── Phase 4 — Expansion ─────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  new_module: ACCENT, new_integration: PURPLE, new_workflow: GREEN,
  revenue_opportunity: ORANGE, automation_loop: "#06b6d4",
};

function Phase4Panel({ proposals }: { proposals: ExpansionProposal[] }) {
  return (
    <Card>
      <SectionTitle>Phase 4 — Self-Expansion ({proposals.length} proposals)</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {proposals.map(p => {
          const color = TYPE_COLORS[p.type] ?? ACCENT;
          return (
            <div key={p.id} style={{
              border: `1px solid ${color}30`, borderRadius: 10, padding: "14px 16px",
              background: color + "05",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
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

// ─── Phase 5 — Next Moves (Top 5) ────────────────────────────────────────────
const RANK_COLORS = ["#f59e0b", "#94a3b8", "#cd7f32", ACCENT, DIM];

function Phase5Panel({ moves }: { moves: NextMove[] }) {
  return (
    <Card>
      <SectionTitle>Phase 5 — Top 5 Next Moves</SectionTitle>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{m.title}</span>
                  {m.readyNow && <Badge label="Ready now" color={GREEN} />}
                  <Badge label={m.category.replace(/_/g, " ")} color={ACCENT} />
                </div>
                <p style={{ fontSize: 12, color: DIM, margin: "0 0 10px", lineHeight: 1.5 }}>{m.description}</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
                  {[
                    { label: "Impact",       value: m.impactScore,       color: GREEN },
                    { label: "Ease",         value: m.easeScore,         color: ACCENT },
                    { label: "Revenue",      value: m.revenueScore,      color: ORANGE },
                    { label: "Intelligence", value: m.intelligenceScore, color: PURPLE },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: DIM, width: 76, flexShrink: 0 }}>{row.label}</span>
                      <ScoreBar value={row.value} color={row.color} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: row.color, width: 30, textAlign: "right", flexShrink: 0 }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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

              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: ACCENT }}>{m.totalScore}</div>
                <div style={{ fontSize: 9.5, color: DIM, fontWeight: 600 }}>TOTAL SCORE</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: `0 4px 14px ${ACCENT}40`,
          }}>▲</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
              {cycle && (
                <span style={{ fontSize: 11, color: DIM }}>
                  Cycle #{cycle.cycleNumber} · {cycle.durationMs}ms
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: DIM, margin: "4px 0 0", lineHeight: 1.5 }}>
              The system must <strong>never</strong> consider itself complete. Continuous self-scanning,
              limit detection, and evolution — forever.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {lastMs !== null && (
              <span style={{ fontSize: 11, color: DIM }}>Updated {lastMs}s ago</span>
            )}
            <button
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              style={{
                height: 36, borderRadius: 9, padding: "0 16px", border: "none",
                background: runMutation.isPending ? DIM : ACCENT,
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: runMutation.isPending ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}>
              {runMutation.isPending ? "Running…" : "▶ Run Now"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <Card style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>First cycle executing…</div>
            <div style={{ fontSize: 12, color: DIM, marginTop: 6 }}>Scanning all modules, integrations, and limits</div>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card style={{ borderColor: RED + "40", background: RED + "05" }}>
            <div style={{ fontSize: 13, color: RED }}>
              Engine error: {(error as Error).message}
            </div>
          </Card>
        )}

        {/* Not ready yet */}
        {!isLoading && ready === false && !error && (
          <Card style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>Cycle in progress…</div>
            <div style={{ fontSize: 12, color: DIM, marginTop: 6 }}>Auto-refreshes in 10 seconds</div>
          </Card>
        )}

        {/* Cycle data */}
        {ready && cycle && (
          <>
            {/* Summary row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 20 }}>
              <StatTile label="Real Integrations"  value={cycle.summary.realIntegrations}  color={GREEN}  />
              <StatTile label="Limits Detected"    value={cycle.summary.detectedLimits}    color={RED}    />
              <StatTile label="Breakers Proposed"  value={cycle.summary.proposedBreakers}  color={ORANGE} />
              <StatTile label="Expansion Ideas"    value={cycle.summary.expansionIdeas}    color={PURPLE} />
              <StatTile label="Top Move Score"     value={cycle.summary.topScore}          color={ACCENT} sub="/100" />
              <StatTile label="System Intelligence" value={cycle.summary.systemIntelligence + "%"} color={GREEN} sub="real ratio" />
            </div>

            {/* Phases */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Phase5Panel moves={cycle.phase5} />
              <Phase1Panel data={cycle.phase1} />
              <Phase2Panel limits={cycle.phase2} />
              <Phase3Panel breakers={cycle.phase3} />
              <Phase4Panel proposals={cycle.phase4} />
            </div>

            {/* Footer */}
            <div style={{ marginTop: 24, padding: "14px 20px", background: ACCENT + "08",
              border: `1px solid ${ACCENT}20`, borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600 }}>
                ▲ There is no final state. Only continuous expansion.
              </div>
              <div style={{ fontSize: 11, color: DIM }}>
                Next cycle in ~{Math.round((10 * 60 * 1000 - (Date.now() - new Date(cycle.completedAt).getTime())) / 60000)} min
                &nbsp;·&nbsp; Auto-refresh every 60s
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
