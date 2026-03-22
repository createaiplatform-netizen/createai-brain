/**
 * PlatformEvolutionTrackerApp — Platform evolution timeline and capability tracking
 *
 * Visualizes the CreateAI Brain's capability evolution over time:
 * - Evolution timeline (milestones recorded by platform-dna)
 * - Capability genome heatmap (all 17 dimensions)
 * - Domain growth velocity from temporal engine
 * - Heartbeat recording with live score update
 *
 * Routes used:
 *   GET  /api/platform-dna/genome     Full capability genome + milestones
 *   GET  /api/platform-dna/evolution  Evolution timeline
 *   GET  /api/platform-dna/gaps       Capability gaps
 *   GET  /api/temporal/velocity       Domain growth velocity
 *   POST /api/platform-dna/pulse      Record capability heartbeat
 */
import React, { useCallback, useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Milestone {
  id: number;
  event_type: string;
  dimension: string | null;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface Dimension {
  dimension: string;
  label: string;
  score: number;
  capabilities: string[];
  gaps: string[];
}

interface VelocityEntry {
  metric: string;
  label: string;
  count: number;
  trend: string;
}

interface Gap {
  dimension: string;
  label: string;
  gap: number;
  priority: string;
}

interface GenomeData {
  ok: boolean;
  dimensions: Dimension[];
  milestones: Milestone[];
  lastPulse: string | null;
  totalCapabilities: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ago(iso: string | null) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function scoreColor(score: number) {
  if (score >= 90) return "#22c55e";
  if (score >= 75) return "#f59e0b";
  if (score >= 50) return "#f97316";
  return "#ef4444";
}

function scoreBg(score: number) {
  if (score >= 90) return "#052e16";
  if (score >= 75) return "#1c1917";
  if (score >= 50) return "#1c0f0a";
  return "#2d1515";
}

function scoreBorder(score: number) {
  if (score >= 90) return "#166534";
  if (score >= 75) return "#78350f";
  if (score >= 50) return "#7c2d12";
  return "#7f1d1d";
}

const MILESTONE_ICONS: Record<string, string> = {
  capability_added:   "✨",
  score_improved:     "📈",
  gap_resolved:       "✅",
  heartbeat:          "💗",
  system_upgraded:    "⚡",
  integration_added:  "🔗",
  api_route_added:    "🛣️",
  app_launched:       "🚀",
};

// ── Component ─────────────────────────────────────────────────────────────────
export function PlatformEvolutionTrackerApp() {
  const [genome, setGenome]       = useState<GenomeData | null>(null);
  const [velocity, setVelocity]   = useState<VelocityEntry[]>([]);
  const [gaps, setGaps]           = useState<Gap[]>([]);
  const [loading, setLoading]     = useState(true);
  const [pulsing, setPulsing]     = useState(false);
  const [notify, setNotify]       = useState("");
  const [tab, setTab]             = useState<"timeline" | "genome" | "velocity" | "gaps">("timeline");

  const toast = (msg: string) => {
    setNotify(msg);
    setTimeout(() => setNotify(""), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [genomeRes, velRes, gapRes] = await Promise.all([
      fetch("/api/platform-dna/genome", { credentials: "include" })
        .then(r => r.json()).catch(() => null),
      fetch("/api/temporal/velocity",   { credentials: "include" })
        .then(r => r.json()).catch(() => ({ velocities: [] })),
      fetch("/api/platform-dna/gaps",   { credentials: "include" })
        .then(r => r.json()).catch(() => ({ gaps: [] })),
    ]);
    setGenome(genomeRes as GenomeData ?? null);
    setVelocity((velRes as { velocities: VelocityEntry[] }).velocities ?? []);
    setGaps((gapRes as { gaps: Gap[] }).gaps ?? []);
    setLoading(false);
  }, []);

  const recordPulse = async () => {
    setPulsing(true);
    toast("Recording capability heartbeat…");
    const r = await fetch("/api/platform-dna/pulse", {
      method: "POST", credentials: "include",
    });
    const d = await r.json() as { ok: boolean; pulse?: { score: number; tier: string } };
    if (d.ok && d.pulse) {
      toast(`Heartbeat recorded — Score: ${d.pulse.score} (${d.pulse.tier})`);
      void load();
    } else {
      toast("Heartbeat requires auth");
    }
    setPulsing(false);
  };

  useEffect(() => { void load(); }, [load]);

  const dimensions    = genome?.dimensions   ?? [];
  const milestones    = genome?.milestones   ?? [];
  const lastPulse     = genome?.lastPulse    ?? null;
  const totalCaps     = genome?.totalCapabilities ?? 0;

  const TAB_LABELS = [
    { key: "timeline",  label: "⏳ Timeline" },
    { key: "genome",    label: "🧬 Genome" },
    { key: "velocity",  label: "📈 Velocity" },
    { key: "gaps",      label: "🎯 Gaps" },
  ] as const;

  return (
    <div style={{
      minHeight: "100%", background: "#020617", color: "#f1f5f9",
      fontFamily: "Inter, sans-serif", padding: "28px 32px",
    }}>
      <a href="#main-content" style={{
        position: "absolute", left: "-9999px",
        background: "#6366f1", color: "#fff", padding: "4px 8px",
        zIndex: 9999, borderRadius: 4,
      }}>Skip to main content</a>

      {notify && (
        <div aria-live="polite" role="status" style={{
          position: "fixed", top: 20, right: 24, background: "#1e1b4b",
          border: "1px solid #6366f1", color: "#c7d2fe",
          padding: "10px 18px", borderRadius: 10, zIndex: 9999, fontSize: 13,
        }}>{notify}</div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#e2e8f0" }}>
            🚀 Platform Evolution Tracker
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
            Capability genome, evolution timeline, and growth intelligence
          </p>
        </div>
        <button
          onClick={recordPulse}
          disabled={pulsing}
          aria-label="Record a platform capability heartbeat"
          style={{
            background: pulsing ? "#1e293b" : "#6366f1",
            color: "#fff", border: "none", borderRadius: 8,
            padding: "9px 18px", fontSize: 13, fontWeight: 600,
            cursor: pulsing ? "not-allowed" : "pointer", opacity: pulsing ? 0.6 : 1,
          }}
        >
          {pulsing ? "Recording…" : "💗 Record Heartbeat"}
        </button>
      </div>

      {/* Stats strip */}
      {genome && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24,
        }}>
          {[
            { label: "Platform Score",    value: genome.ok ? String((genome as any).overallScore ?? "—") : "—", color: "#6366f1" },
            { label: "Capabilities",      value: String(totalCaps),                          color: "#22c55e" },
            { label: "Dimensions",        value: String(dimensions.length),                  color: "#f59e0b" },
            { label: "Last Heartbeat",    value: ago(lastPulse),                             color: "#a78bfa" },
          ].map(s => (
            <div key={s.label} style={{
              background: "#0f172a", borderRadius: 10,
              border: "1px solid #1e293b", padding: "14px 18px",
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div role="tablist" aria-label="Evolution tracker sections" style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {TAB_LABELS.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: tab === t.key ? "#6366f1" : "#0f172a",
              color:  tab === t.key ? "#fff" : "#64748b",
              border: `1px solid ${tab === t.key ? "#6366f1" : "#1e293b"}`,
              borderRadius: 7, padding: "7px 16px", fontSize: 12, fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >{t.label}</button>
        ))}
      </div>

      <main id="main-content">

        {/* ── TIMELINE tab ─────────────────────────────────────────────────── */}
        {tab === "timeline" && (
          <section aria-label="Evolution timeline">
            {loading ? (
              <div style={{ color: "#475569", fontSize: 14 }}>Loading timeline…</div>
            ) : milestones.length === 0 ? (
              <div style={{
                background: "#0f172a", borderRadius: 10, border: "1px dashed #1e293b",
                padding: "32px 24px", textAlign: "center", color: "#475569", fontSize: 14,
              }}>
                No evolution milestones yet. Click <strong style={{ color: "#6366f1" }}>Record Heartbeat</strong> to log your first platform snapshot.
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                {/* Vertical line */}
                <div style={{
                  position: "absolute", left: 20, top: 0, bottom: 0,
                  width: 2, background: "#1e293b", zIndex: 0,
                }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {milestones.map((m, i) => (
                    <div key={m.id} style={{
                      display: "flex", alignItems: "flex-start", gap: 16,
                      position: "relative", paddingBottom: i < milestones.length - 1 ? 20 : 0,
                    }}>
                      {/* Dot */}
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: "#0f172a", border: "2px solid #6366f1",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, flexShrink: 0, zIndex: 1,
                      }}>
                        {MILESTONE_ICONS[m.event_type] ?? "📌"}
                      </div>
                      {/* Content */}
                      <div style={{
                        flex: 1, background: "#0f172a", borderRadius: 10,
                        border: "1px solid #1e293b", padding: "12px 16px", marginTop: 4,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: "#6366f1",
                              textTransform: "uppercase", letterSpacing: 0.8,
                            }}>{m.event_type.replace(/_/g, " ")}</span>
                            {m.dimension && (
                              <span style={{
                                marginLeft: 8, fontSize: 10, color: "#64748b",
                                background: "#1e293b", padding: "1px 6px", borderRadius: 3,
                              }}>{m.dimension}</span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: "#475569" }}>{ago(m.created_at)}</span>
                        </div>
                        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>
                          {m.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── GENOME tab ───────────────────────────────────────────────────── */}
        {tab === "genome" && (
          <section aria-label="Platform capability genome">
            {loading ? (
              <div style={{ color: "#475569", fontSize: 14 }}>Loading genome…</div>
            ) : dimensions.length === 0 ? (
              <div style={{ color: "#475569", fontSize: 14 }}>No dimensions found.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {dimensions.map(dim => (
                  <div key={dim.dimension} style={{
                    background: scoreBg(dim.score), borderRadius: 10,
                    border: `1px solid ${scoreBorder(dim.score)}`, padding: "14px 18px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{dim.label}</div>
                      <div style={{
                        fontSize: 18, fontWeight: 800, color: scoreColor(dim.score),
                        minWidth: 48, textAlign: "right",
                      }}>{dim.score}</div>
                    </div>
                    {/* Score bar */}
                    <div style={{ background: "#0f172a", borderRadius: 4, height: 6, overflow: "hidden", marginBottom: 10 }}>
                      <div style={{
                        width: `${dim.score}%`, height: "100%",
                        background: scoreColor(dim.score),
                        transition: "width 0.6s ease",
                      }} />
                    </div>
                    {/* Capabilities */}
                    {(dim.capabilities ?? []).length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {dim.capabilities.map(cap => (
                          <span key={cap} style={{
                            fontSize: 10, color: "#94a3b8",
                            background: "#0f172a", border: "1px solid #1e293b",
                            borderRadius: 4, padding: "2px 8px",
                          }}>{cap}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── VELOCITY tab ─────────────────────────────────────────────────── */}
        {tab === "velocity" && (
          <section aria-label="Domain growth velocity">
            {loading ? (
              <div style={{ color: "#475569", fontSize: 14 }}>Loading velocity…</div>
            ) : velocity.length === 0 ? (
              <div style={{ color: "#475569", fontSize: 14 }}>No velocity data yet — data builds as platform activity grows.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {velocity.map(v => (
                  <div key={v.metric} style={{
                    background: "#0f172a", borderRadius: 10,
                    border: "1px solid #1e293b", padding: "14px 20px",
                    display: "flex", alignItems: "center", gap: 16,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{v.label}</div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{v.metric}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontSize: 22, fontWeight: 800,
                        color: Number(v.count) > 0 ? "#6366f1" : "#334155",
                      }}>{v.count > 0 ? v.count : "—"}</div>
                      <div style={{ fontSize: 10, color: "#475569" }}>last 30d</div>
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: v.trend === "up" ? "#22c55e" : v.trend === "down" ? "#ef4444" : "#64748b",
                    }}>
                      {v.trend === "up" ? "↑" : v.trend === "down" ? "↓" : "→"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── GAPS tab ─────────────────────────────────────────────────────── */}
        {tab === "gaps" && (
          <section aria-label="Capability gaps analysis">
            {loading ? (
              <div style={{ color: "#475569", fontSize: 14 }}>Loading gaps…</div>
            ) : gaps.length === 0 ? (
              <div style={{
                background: "#052e16", borderRadius: 10, border: "1px solid #166534",
                padding: "24px", textAlign: "center", color: "#86efac", fontSize: 14,
              }}>
                🎉 No critical capability gaps detected — all dimensions are performing above threshold.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#64748b" }}>
                  {gaps.length} capability gap{gaps.length !== 1 ? "s" : ""} identified. Focus on high-priority items first.
                </p>
                {gaps.map(g => (
                  <div key={g.dimension} style={{
                    background: g.priority === "critical" ? "#2d1515"
                              : g.priority === "high"     ? "#1c0f0a" : "#0f172a",
                    borderRadius: 10,
                    border: `1px solid ${g.priority === "critical" ? "#7f1d1d" : g.priority === "high" ? "#7c2d12" : "#1e293b"}`,
                    padding: "14px 20px",
                    display: "flex", alignItems: "center", gap: 16,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{g.label}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                          background: g.priority === "critical" ? "#7f1d1d"
                                    : g.priority === "high"     ? "#7c2d12" : "#1e293b",
                          color: g.priority === "critical" ? "#fca5a5"
                               : g.priority === "high"     ? "#fdba74" : "#94a3b8",
                          textTransform: "uppercase", letterSpacing: 0.5,
                        }}>{g.priority}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        Current gap: {g.gap} points from target
                      </div>
                    </div>
                    <div style={{
                      fontSize: 22, fontWeight: 800,
                      color: g.priority === "critical" ? "#ef4444"
                           : g.priority === "high"     ? "#f97316" : "#f59e0b",
                    }}>−{g.gap}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </main>
    </div>
  );
}

export default PlatformEvolutionTrackerApp;
