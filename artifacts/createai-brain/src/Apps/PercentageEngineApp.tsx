import React, { useEffect, useState, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Feature { name: string; deployed: boolean; note?: string }
interface Subsystem {
  id: string; name: string; icon: string; weight: number;
  score: number; deployedCount: number; totalFeatures: number;
  overSpecBonus: number; features: Feature[];
}
interface IndustryItem { name: string; deployed: boolean; score: number }
interface BlockerItem { item: string; status: string; impact: string }
interface EngineData {
  unified: { score: number; label: string; ceiling: string; interpretation: string };
  subsystems: Subsystem[];
  industryBreakdown: IndustryItem[];
  financialCapacity: {
    note: string;
    priceTiers: { name: string; price: number; description: string }[];
    capacityPerDay: { label: string; minPerTransaction: number; maxPerTransaction: number; totalIfAllTiers: number };
    capacityPerMonth: { label: string; min: number; max: number; totalIfAllTiers: number };
    blockers: BlockerItem[];
    unlockPotential: string;
  };
  meta: {
    totalSubsystems: number; totalFeatures: number; deployedFeatures: number;
    overSpecSystems: number; highestSubsystem: Subsystem; lowestSubsystem: Subsystem;
    engineVersion: string;
  };
  generatedAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 200) return "#a855f7";
  if (score >= 150) return "#6366f1";
  if (score >= 100) return "#10b981";
  if (score >= 75)  return "#f59e0b";
  return "#ef4444";
}

function scoreGradient(score: number): string {
  if (score >= 200) return "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)";
  if (score >= 150) return "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)";
  if (score >= 100) return "linear-gradient(135deg, #059669 0%, #10b981 100%)";
  if (score >= 75)  return "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)";
  return "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)";
}

function fmtDollars(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function GaugeBar({ score, color }: { score: number; color: string }) {
  const pct = Math.min(score, 300); // cap visual at 300% for layout
  const barW = Math.min((pct / 300) * 100, 100);
  return (
    <div style={{ width: "100%", height: 6, background: "rgba(99,102,241,0.10)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{
        width: barW + "%", height: "100%",
        background: color,
        borderRadius: 99,
        transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

function SubsystemCard({ sub }: { sub: Subsystem }) {
  const [expanded, setExpanded] = useState(false);
  const color = scoreColor(sub.score);
  const isOver = sub.score > 100;
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      border: `1.5px solid ${isOver ? "rgba(99,102,241,0.20)" : "rgba(226,232,240,1)"}`,
      padding: "14px 16px",
      transition: "box-shadow 0.15s",
    }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}
        onClick={() => setExpanded(e => !e)}
      >
        <span style={{ fontSize: 20 }}>{sub.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", letterSpacing: "-0.01em" }}>
              {sub.name}
            </span>
            <span style={{
              fontWeight: 800, fontSize: 15, color,
              letterSpacing: "-0.03em", whiteSpace: "nowrap",
            }}>
              {sub.score}%
              {isOver && <span style={{ fontSize: 10, marginLeft: 4, background: color, color: "#fff", borderRadius: 99, padding: "1px 6px", fontWeight: 700 }}>OVER SPEC</span>}
            </span>
          </div>
          <div style={{ marginTop: 6 }}>
            <GaugeBar score={sub.score} color={color} />
          </div>
          <div style={{ marginTop: 5, display: "flex", gap: 10, fontSize: 11, color: "#94a3b8" }}>
            <span>{sub.deployedCount}/{sub.features.length} features</span>
            {sub.overSpecBonus > 0 && <span>+{sub.overSpecBonus}% expansion bonus</span>}
            <span style={{ marginLeft: "auto" }}>weight {sub.weight}%</span>
          </div>
        </div>
        <span style={{ color: "#94a3b8", fontSize: 12, flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, borderTop: "1px solid rgba(226,232,240,1)", paddingTop: 12 }}>
          {sub.features.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, marginTop: 1, flexShrink: 0 }}>{f.deployed ? "✅" : "⬜"}</span>
              <span style={{ fontSize: 12, color: f.deployed ? "#1e293b" : "#94a3b8", flex: 1 }}>
                {f.name}
                {f.note && <span style={{ color: "#6366f1", marginLeft: 4, fontSize: 11 }}>({f.note})</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function PercentageEngineApp() {
  const [data, setData]     = useState<EngineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [tab, setTab]       = useState<"overview" | "subsystems" | "industries" | "financial">("overview");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/system/percentages");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  // ── Loading ──
  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
      <p style={{ fontSize: 14 }}>Scanning platform capability…</p>
    </div>
  );

  if (error || !data) return (
    <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <p style={{ fontSize: 14 }}>{error ?? "No data"}</p>
      <button
        onClick={load}
        style={{ marginTop: 12, padding: "8px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
      >
        Retry
      </button>
    </div>
  );

  const { unified, subsystems, industryBreakdown, financialCapacity, meta } = data;
  const topColor = scoreColor(unified.score);
  const topGrad  = scoreGradient(unified.score);

  const TABS = [
    { id: "overview",    label: "Overview" },
    { id: "subsystems",  label: "Subsystems" },
    { id: "industries",  label: "Industries" },
    { id: "financial",   label: "Financial Capacity" },
  ] as const;

  return (
    <div style={{ minHeight: "100%", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Hero Banner ── */}
      <div style={{ background: topGrad, padding: "36px 24px 30px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: -40, right: -40, width: 200, height: 200,
          background: "rgba(255,255,255,0.07)", borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -20, width: 160, height: 160,
          background: "rgba(255,255,255,0.05)", borderRadius: "50%",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 24 }}>📊</span>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Percentage Engine
            </span>
          </div>

          {/* Unified score — the big number */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{
              fontSize: 72, fontWeight: 900, color: "#fff",
              letterSpacing: "-0.05em", lineHeight: 1,
            }}>
              {unified.score}
            </span>
            <span style={{ fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.03em" }}>%</span>
          </div>

          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{
              background: "rgba(255,255,255,0.20)",
              color: "#fff", fontSize: 13, fontWeight: 700,
              padding: "3px 12px", borderRadius: 99,
            }}>
              {unified.label}
            </span>
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
              {unified.interpretation}
            </span>
          </div>

          {/* Quick stats row */}
          <div style={{ marginTop: 20, display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "Subsystems", value: meta.totalSubsystems },
              { label: "Features Deployed", value: `${meta.deployedFeatures}/${meta.totalFeatures}` },
              { label: "Over-Spec Systems", value: meta.overSpecSystems },
              { label: "Ceiling", value: "∞ Unlimited" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 14px", minWidth: 90 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Nav ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid rgba(226,232,240,1)", display: "flex", overflowX: "auto" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "12px 20px",
              border: "none",
              borderBottom: tab === t.id ? `2.5px solid ${topColor}` : "2.5px solid transparent",
              background: "transparent",
              color: tab === t.id ? topColor : "#64748b",
              fontWeight: tab === t.id ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", padding: "0 16px", fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
          {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : ""}
          <button
            onClick={() => { setLoading(true); load(); }}
            style={{ marginLeft: 8, background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "20px 16px 40px", maxWidth: 860, margin: "0 auto" }}>

        {/* ─── OVERVIEW ─── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Top / Bottom performer */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Highest Subsystem", sub: meta.highestSubsystem, emoji: "🏆" },
                { label: "Needs Attention",   sub: meta.lowestSubsystem,  emoji: "🎯" },
              ].map(({ label, sub, emoji }) => (
                <div key={label} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(226,232,240,1)", padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{emoji} {label}</div>
                  <div style={{ fontSize: 22, marginBottom: 2 }}>{sub.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{sub.name}</div>
                  <div style={{ fontWeight: 800, fontSize: 24, color: scoreColor(sub.score), letterSpacing: "-0.03em" }}>{sub.score}%</div>
                </div>
              ))}
            </div>

            {/* All subsystems mini-gauges */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(226,232,240,1)", padding: "18px 16px" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 14px", letterSpacing: "-0.01em" }}>All Subsystems at a Glance</h3>
              {subsystems.map(sub => (
                <div key={sub.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#334155" }}>{sub.icon} {sub.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(sub.score) }}>{sub.score}%</span>
                  </div>
                  <GaugeBar score={sub.score} color={scoreColor(sub.score)} />
                </div>
              ))}
            </div>

            {/* Engine info */}
            <div style={{ background: "rgba(99,102,241,0.04)", borderRadius: 14, border: "1.5px solid rgba(99,102,241,0.12)", padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, marginBottom: 4 }}>📡 Engine Metadata</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {[
                  ["Version",        meta.engineVersion],
                  ["Ceiling",        "Unlimited"],
                  ["Refresh",        "Every 30 seconds"],
                  ["Data Source",    "Live platform introspection"],
                  ["Last Computed",  new Date(data.generatedAt).toLocaleTimeString()],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "rgba(99,102,241,0.08)", borderRadius: 8, padding: "5px 10px", fontSize: 12 }}>
                    <span style={{ color: "#94a3b8" }}>{k}: </span>
                    <span style={{ color: "#4f46e5", fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── SUBSYSTEMS ─── */}
        {tab === "subsystems" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 4px" }}>
              Click any subsystem to expand its feature checklist. Scores above 100% indicate the platform exceeds its original specification for that area.
            </p>
            {subsystems.map(sub => <SubsystemCard key={sub.id} sub={sub} />)}
          </div>
        )}

        {/* ─── INDUSTRIES ─── */}
        {tab === "industries" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(226,232,240,1)", padding: "14px 16px", marginBottom: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Industry Capability</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                {industryBreakdown.filter(i => i.deployed).length} of {industryBreakdown.length} industries deployed ·&nbsp;
                <span style={{ fontWeight: 700, color: scoreColor(400) }}>400% over original 3-industry spec</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {industryBreakdown.map((ind, i) => (
                <div key={i} style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: `1.5px solid ${ind.deployed ? "rgba(99,102,241,0.18)" : "rgba(226,232,240,1)"}`,
                  padding: "12px 14px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{ind.deployed ? "✅" : "⬜"}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: ind.deployed ? "#0f172a" : "#94a3b8", lineHeight: 1.3 }}>{ind.name}</div>
                      <div style={{ fontSize: 11, color: ind.deployed ? "#10b981" : "#94a3b8", fontWeight: 600, marginTop: 2 }}>
                        {ind.deployed ? "100% deployed" : "Not deployed"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── FINANCIAL CAPACITY ─── */}
        {tab === "financial" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Disclaimer banner */}
            <div style={{ background: "rgba(245,158,11,0.08)", border: "1.5px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, color: "#92400e", fontWeight: 600, marginBottom: 4 }}>⚠️ Capacity Model — Not Revenue</div>
              <div style={{ fontSize: 12, color: "#78350f", lineHeight: 1.5 }}>{financialCapacity.note}</div>
            </div>

            {/* Price tiers */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(226,232,240,1)", padding: "18px 16px" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Pricing Architecture</h3>
              {financialCapacity.priceTiers.map(t => (
                <div key={t.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(226,232,240,0.7)" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{t.description}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#6366f1" }}>{fmtDollars(t.price)}</div>
                </div>
              ))}
            </div>

            {/* Capacity ceiling */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { title: "Daily Capacity Ceiling", data: financialCapacity.capacityPerDay },
                { title: "Monthly Capacity Ceiling", data: financialCapacity.capacityPerMonth },
              ].map(({ title, data: d }) => (
                <div key={title} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(226,232,240,1)", padding: "16px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>{title}</div>
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Min (1 customer)</div>
                    <div style={{ fontWeight: 800, fontSize: 22, color: "#10b981", letterSpacing: "-0.03em" }}>{fmtDollars("minPerTransaction" in d ? d.minPerTransaction : d.min)}</div>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Max (1 customer)</div>
                    <div style={{ fontWeight: 800, fontSize: 22, color: "#6366f1", letterSpacing: "-0.03em" }}>{fmtDollars("maxPerTransaction" in d ? d.maxPerTransaction : d.max)}</div>
                  </div>
                  <div style={{ borderTop: "1px solid rgba(226,232,240,0.7)", paddingTop: 6, marginTop: 4 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>All 4 tiers combined</div>
                    <div style={{ fontWeight: 800, fontSize: 20, color: "#a855f7", letterSpacing: "-0.03em" }}>{fmtDollars(d.totalIfAllTiers)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Blockers */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(226,232,240,1)", padding: "18px 16px" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>🔓 Revenue Blockers</h3>
              {financialCapacity.blockers.map((b, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < financialCapacity.blockers.length - 1 ? "1px solid rgba(226,232,240,0.7)" : "none" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{b.item}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{b.impact}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {b.status}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(99,102,241,0.06)", borderRadius: 10, fontSize: 12, color: "#4f46e5", fontWeight: 600 }}>
                💡 {financialCapacity.unlockPotential}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
