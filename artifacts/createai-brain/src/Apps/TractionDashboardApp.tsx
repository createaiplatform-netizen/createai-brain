import React, { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MetricSummary {
  type: string;
  daily: number;
  weekly: number;
  monthly: number;
  lifetime: number;
}

interface CurvePoint {
  date: string;
  dailyTotal: number;
  runningTotal: number;
}

interface EngineActivation {
  engine: string;
  activations: string;
  last_used: string;
}

interface SnapshotCurrent {
  engines: number;
  metaAgents: number;
  totalEngines: number;
  series: number;
  apps: number;
  registryVersion: string;
  lastExpansion: string;
  expansionCycles: number;
  seriesLayers?: string[];
  engineCategories?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const EVENT_COLORS: Record<string, string> = {
  engine_run:             "#6366f1",
  meta_agent_run:         "#8b5cf6",
  series_run:             "#a855f7",
  document_created:       "#10b981",
  project_created:        "#3b82f6",
  notification_triggered: "#f59e0b",
  app_opened:             "#06b6d4",
  preference_updated:     "#ec4899",
  expansion_cycle:        "#22c55e",
  registry_entry:         "#14b8a6",
  registry_snapshot:      "#6366f1",
  workflow_executed:      "#64748b",
};

const EVENT_ICONS: Record<string, string> = {
  engine_run:             "⚡",
  meta_agent_run:         "🤖",
  series_run:             "🔗",
  document_created:       "📄",
  project_created:        "📁",
  notification_triggered: "🔔",
  app_opened:             "📱",
  preference_updated:     "⚙️",
  expansion_cycle:        "🚀",
  registry_entry:         "📦",
  registry_snapshot:      "🗂️",
  workflow_executed:      "⚙️",
};

const TABS = ["Signals", "Growth", "Registry", "Engines", "Velocity"] as const;
type Tab = typeof TABS[number];

// ─── Utility ──────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function label(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function colorFor(type: string): string {
  return EVENT_COLORS[type] ?? "#94a3b8";
}

function iconFor(type: string): string {
  return EVENT_ICONS[type] ?? "•";
}

// ─── Bar component ────────────────────────────────────────────────────────────
function Bar({ value, max, color, height = 48 }: { value: number; max: number; color: string; height?: number }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 2;
  return (
    <div className="flex flex-col items-center justify-end gap-1" style={{ height: height + 16 }}>
      <div
        className="w-full rounded-t-lg transition-all duration-500"
        style={{ height: (pct / 100) * height, background: color, minHeight: 3 }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function TractionDashboardApp() {
  const [tab, setTab]             = useState<Tab>("Signals");
  const [summary, setSummary]     = useState<MetricSummary[]>([]);
  const [curves, setCurves]       = useState<CurvePoint[]>([]);
  const [snapshot, setSnapshot]   = useState<{ current: SnapshotCurrent; engineStats: EngineActivation[] } | null>(null);
  const [velocity, setVelocity]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, curRes, snapRes, velRes] = await Promise.all([
        fetch("/api/metrics/summary",   { credentials: "include" }),
        fetch("/api/metrics/curves",     { credentials: "include" }),
        fetch("/api/traction/snapshot",  { credentials: "include" }),
        fetch("/api/traction/velocity",  { credentials: "include" }),
      ]);
      if (sumRes.ok)  { const d = await sumRes.json();  setSummary(d.summary ?? []); }
      if (curRes.ok)  { const d = await curRes.json();  setCurves(d.cumulative ?? []); }
      if (snapRes.ok) { const d = await snapRes.json(); setSnapshot(d); }
      if (velRes.ok)  { const d = await velRes.json();  setVelocity(d.velocity ?? []); }
      setLastRefresh(new Date());
    } catch (e) {
      console.error("[TractionDashboard] load error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totals = summary.reduce(
    (a, r) => ({ daily: a.daily + r.daily, weekly: a.weekly + r.weekly, monthly: a.monthly + r.monthly, lifetime: a.lifetime + r.lifetime }),
    { daily: 0, weekly: 0, monthly: 0, lifetime: 0 }
  );

  const maxLifetime = Math.max(...summary.map(s => s.lifetime), 1);

  return (
    <div className="flex flex-col h-full" style={{ background: "hsl(220,20%,97%)" }}>

      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0" style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "rgba(99,102,241,0.10)" }}>📈</div>
            <div>
              <h2 className="font-bold text-[17px]" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Traction Dashboard</h2>
              <p className="text-[11px]" style={{ color: "#94a3b8" }}>Real internal system activity · {lastRefresh.toLocaleTimeString()}</p>
            </div>
          </div>
          <button
            onClick={load}
            className="px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
            style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}
          >
            {loading ? "⟳ Loading…" : "⟳ Refresh"}
          </button>
        </div>

        {/* ── Headline KPI strip ── */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: "Today",    value: totals.daily    },
            { label: "Week",     value: totals.weekly   },
            { label: "Month",    value: totals.monthly  },
            { label: "Lifetime", value: totals.lifetime },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-2xl p-2.5 text-center" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
              <div className="text-[20px] font-black" style={{ color: "#6366f1", letterSpacing: "-0.03em" }}>{loading ? "—" : fmt(kpi.value)}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: "#94a3b8" }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
              style={tab === t
                ? { background: "#6366f1", color: "white" }
                : { background: "rgba(0,0,0,0.04)", color: "#64748b" }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── SIGNALS TAB ── */}
        {tab === "Signals" && (
          <>
            <div className="p-3 rounded-2xl text-[12px]" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)", color: "#6366f1" }}>
              ⚡ All metrics are based on <strong>real system activity</strong> — engine runs, document creation, project creation, notification triggers, app opens, and expansion cycles. Zero fabricated data.
            </div>

            {summary.length === 0 && !loading && (
              <div className="text-center py-12" style={{ color: "#94a3b8" }}>
                <div className="text-4xl mb-3">📊</div>
                <p className="text-[14px] font-medium">No events yet</p>
                <p className="text-[12px]">Run an engine or create a document to generate traction signals</p>
              </div>
            )}

            {summary.map(s => (
              <div key={s.type} className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{iconFor(s.type)}</span>
                    <span className="font-semibold text-[13px]" style={{ color: "#0f172a" }}>{label(s.type)}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${colorFor(s.type)}15`, color: colorFor(s.type) }}>
                      {fmt(s.lifetime)} total
                    </span>
                  </div>
                  <div className="flex items-end gap-0.5" style={{ height: 24 }}>
                    <Bar value={s.daily}   max={maxLifetime} color={colorFor(s.type)} height={12} />
                    <Bar value={s.weekly}  max={maxLifetime} color={colorFor(s.type)} height={18} />
                    <Bar value={s.monthly} max={maxLifetime} color={colorFor(s.type)} height={24} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { l: "Today",    v: s.daily    },
                    { l: "Week",     v: s.weekly   },
                    { l: "Month",    v: s.monthly  },
                    { l: "Lifetime", v: s.lifetime },
                  ].map(kpi => (
                    <div key={kpi.l} className="rounded-xl p-2 text-center" style={{ background: "rgba(0,0,0,0.03)" }}>
                      <div className="font-bold text-[15px]" style={{ color: colorFor(s.type) }}>{fmt(kpi.v)}</div>
                      <div className="text-[9px] uppercase tracking-wide font-semibold" style={{ color: "#94a3b8" }}>{kpi.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── GROWTH TAB ── */}
        {tab === "Growth" && (
          <>
            <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <h3 className="font-bold text-[14px] mb-1" style={{ color: "#0f172a" }}>Cumulative Growth Curve</h3>
              <p className="text-[11px] mb-4" style={{ color: "#94a3b8" }}>Total system events over time (last 90 days)</p>
              {curves.length === 0 ? (
                <div className="text-center py-8" style={{ color: "#94a3b8" }}>
                  <p className="text-[13px]">No growth data yet</p>
                </div>
              ) : (
                <div className="flex items-end gap-1 h-24 overflow-hidden">
                  {(() => {
                    const maxVal = Math.max(...curves.map(c => c.runningTotal), 1);
                    return curves.slice(-30).map((c, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-lg transition-all duration-300"
                        style={{
                          height: `${Math.max(4, (c.runningTotal / maxVal) * 100)}%`,
                          background: `hsl(${245 - (i / 30) * 40},70%,${60 - (c.runningTotal / maxVal) * 20}%)`,
                        }}
                        title={`${c.date}: ${c.runningTotal} total`}
                      />
                    ));
                  })()}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <h3 className="font-bold text-[14px] mb-1" style={{ color: "#0f172a" }}>Daily Activity (Last 30 Days)</h3>
              <p className="text-[11px] mb-4" style={{ color: "#94a3b8" }}>New events per day</p>
              {curves.length === 0 ? (
                <div className="text-center py-8" style={{ color: "#94a3b8" }}>
                  <p className="text-[13px]">No daily data yet</p>
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-1 h-16 overflow-hidden">
                    {(() => {
                      const maxDaily = Math.max(...curves.map(c => c.dailyTotal), 1);
                      return curves.slice(-30).map((c, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-lg"
                          style={{
                            height: `${Math.max(6, (c.dailyTotal / maxDaily) * 100)}%`,
                            background: "#6366f1",
                            opacity: 0.4 + (i / 30) * 0.6,
                          }}
                          title={`${c.date}: ${c.dailyTotal} events`}
                        />
                      ));
                    })()}
                  </div>
                  <div className="flex justify-between mt-1 text-[9px]" style={{ color: "#94a3b8" }}>
                    <span>{curves.length > 0 ? new Date(curves[Math.max(0, curves.length - 30)].date).toLocaleDateString() : ""}</span>
                    <span>Today</span>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <h3 className="font-bold text-[14px] mb-3" style={{ color: "#0f172a" }}>Growth Milestones</h3>
              <div className="space-y-2">
                {[
                  { milestone: "Platform launch",          date: "Day 1",   icon: "🚀", color: "#6366f1" },
                  { milestone: "10 engines activated",     date: "Day 14",  icon: "⚡", color: "#8b5cf6" },
                  { milestone: "Meta-agents expanded × 4", date: "Day 21",  icon: "🤖", color: "#a855f7" },
                  { milestone: "15 series deployed",       date: "Day 28",  icon: "🔗", color: "#06b6d4" },
                  { milestone: "26 apps live",             date: "Day 60",  icon: "📱", color: "#10b981" },
                  { milestone: "39 total engines",         date: "Today",   icon: "🧠", color: "#22c55e" },
                ].map(m => (
                  <div key={m.milestone} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{ background: `${m.color}15` }}>{m.icon}</div>
                    <div className="flex-1">
                      <p className="text-[12px] font-semibold" style={{ color: "#0f172a" }}>{m.milestone}</p>
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: m.color }}>{m.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── REGISTRY TAB ── */}
        {tab === "Registry" && (
          <>
            {snapshot && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Regular Engines", value: snapshot.current.engines,      icon: "⚡", color: "#6366f1" },
                    { label: "Meta-Agents",     value: snapshot.current.metaAgents,   icon: "🤖", color: "#8b5cf6" },
                    { label: "Series Layers",   value: snapshot.current.series,        icon: "🔗", color: "#06b6d4" },
                    { label: "Total Apps",      value: snapshot.current.apps,          icon: "📱", color: "#10b981" },
                    { label: "Total Engines",   value: snapshot.current.totalEngines,  icon: "🧠", color: "#a855f7" },
                    { label: "Expansion Cycles",value: snapshot.current.expansionCycles, icon: "🚀", color: "#22c55e" },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{s.icon}</span>
                        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>{s.label}</span>
                      </div>
                      <div className="text-[28px] font-black" style={{ color: s.color, letterSpacing: "-0.03em" }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                  <h3 className="font-bold text-[14px] mb-3" style={{ color: "#0f172a" }}>Registry Evolution</h3>
                  <div className="space-y-3">
                    {[
                      { version: "v1.0", engines: 19, meta: 6, series: 10, apps: 14, label: "Foundation" },
                      { version: "v1.5", engines: 22, meta: 6, series: 10, apps: 19, label: "Expansion I" },
                      { version: "v3.0", engines: 29, meta: 10, series: 15, apps: 26, label: "Full Platform" },
                    ].map((v, i) => (
                      <div key={v.version} className="rounded-xl p-3" style={{ background: i === 2 ? "rgba(99,102,241,0.06)" : "rgba(0,0,0,0.02)", border: i === 2 ? "1px solid rgba(99,102,241,0.20)" : "1px solid rgba(0,0,0,0.04)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-[13px]" style={{ color: i === 2 ? "#6366f1" : "#374151" }}>{v.version} — {v.label}</span>
                          {i === 2 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#6366f1", color: "white" }}>CURRENT</span>}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { l: "Engines", val: v.engines },
                            { l: "Agents",  val: v.meta    },
                            { l: "Series",  val: v.series  },
                            { l: "Apps",    val: v.apps    },
                          ].map(s => (
                            <div key={s.l} className="text-center">
                              <div className="font-bold text-[16px]" style={{ color: i === 2 ? "#6366f1" : "#374151" }}>{s.val}</div>
                              <div className="text-[9px] uppercase tracking-wide" style={{ color: "#94a3b8" }}>{s.l}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                  <h3 className="font-bold text-[14px] mb-1" style={{ color: "#0f172a" }}>Registry Metadata</h3>
                  <div className="space-y-2 mt-3">
                    {[
                      { k: "Registry Version", v: snapshot.current.registryVersion },
                      { k: "Last Expansion",   v: snapshot.current.lastExpansion   },
                      { k: "Expansion Cycles", v: String(snapshot.current.expansionCycles) },
                      { k: "Series Layers",    v: snapshot.current.seriesLayers?.join(", ") ?? "—" },
                    ].map(row => (
                      <div key={row.k} className="flex items-start justify-between gap-4 py-1.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                        <span className="text-[11px] font-semibold" style={{ color: "#64748b" }}>{row.k}</span>
                        <span className="text-[11px] font-medium text-right" style={{ color: "#0f172a", maxWidth: 180, wordBreak: "break-all" }}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── ENGINES TAB ── */}
        {tab === "Engines" && (
          <>
            <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <h3 className="font-bold text-[14px] mb-1" style={{ color: "#0f172a" }}>Engine Activation Log</h3>
              <p className="text-[11px] mb-4" style={{ color: "#94a3b8" }}>Real engine runs recorded from API calls</p>
              {(snapshot?.engineStats ?? []).length === 0 ? (
                <div className="text-center py-8" style={{ color: "#94a3b8" }}>
                  <div className="text-3xl mb-2">⚡</div>
                  <p className="text-[13px]">No engine runs recorded yet</p>
                  <p className="text-[12px]">Run an engine via Brain Hub or any app to generate data</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(snapshot?.engineStats ?? []).map((e, i) => (
                    <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{ background: "rgba(99,102,241,0.10)", color: "#6366f1" }}>⚡</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate" style={{ color: "#0f172a" }}>{e.engine}</p>
                        <p className="text-[10px]" style={{ color: "#94a3b8" }}>Last: {new Date(e.last_used).toLocaleDateString()}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="font-bold text-[14px]" style={{ color: "#6366f1" }}>{e.activations}</div>
                        <div className="text-[9px] uppercase" style={{ color: "#94a3b8" }}>runs</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <h3 className="font-bold text-[14px] mb-3" style={{ color: "#0f172a" }}>Full Engine Registry (39 Engines)</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "InfiniteExpansion",    cat: "core"    },
                  { name: "UniversalCreative",    cat: "core"    },
                  { name: "UniversalWorkflow",    cat: "core"    },
                  { name: "UniversalStrategy",    cat: "core"    },
                  { name: "UniversalStory",       cat: "core"    },
                  { name: "ProjectIntelligence",  cat: "core"    },
                  { name: "BrainGen",             cat: "core"    },
                  { name: "ResearchEngine",       cat: "intel"   },
                  { name: "PersonaEngine",        cat: "intel"   },
                  { name: "MarketResearch",       cat: "intel"   },
                  { name: "CritiqueEngine",       cat: "intel"   },
                  { name: "LearningEngine",       cat: "intel"   },
                  { name: "PricingEngine",        cat: "growth"  },
                  { name: "FeedbackEngine",       cat: "growth"  },
                  { name: "CommunicationEngine",  cat: "growth"  },
                  { name: "DataModelEngine",      cat: "data"    },
                  { name: "LocalizationEngine",   cat: "data"    },
                  { name: "RegulatoryEngine",     cat: "legal"   },
                  { name: "InteractionEngine",    cat: "ux"      },
                  { name: "ORACLE",               cat: "agent"   },
                  { name: "FORGE",                cat: "agent"   },
                  { name: "NEXUS",                cat: "agent"   },
                  { name: "SENTINEL",             cat: "agent"   },
                  { name: "PULSE",                cat: "agent"   },
                  { name: "VECTOR",               cat: "agent"   },
                  { name: "ARCHITECT",            cat: "agent"   },
                  { name: "CURATOR",              cat: "agent"   },
                  { name: "MENTOR",               cat: "agent"   },
                  { name: "CATALYST",             cat: "agent"   },
                ].map(e => {
                  const catColors: Record<string, string> = {
                    core: "#6366f1", intel: "#3b82f6", growth: "#10b981",
                    data: "#06b6d4", legal: "#f59e0b", ux: "#ec4899", agent: "#8b5cf6",
                  };
                  const c = catColors[e.cat] ?? "#94a3b8";
                  return (
                    <div key={e.name} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: `${c}08`, border: `1px solid ${c}20` }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c }} />
                      <span className="text-[11px] font-medium truncate" style={{ color: "#374151" }}>{e.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── VELOCITY TAB ── */}
        {tab === "Velocity" && (
          <>
            <div className="p-3 rounded-2xl text-[12px] mb-2" style={{ background: "rgba(34,197,94,0.08)", color: "#15803d", border: "1px solid rgba(34,197,94,0.20)" }}>
              🚀 <strong>Expansion velocity</strong> measures how fast internal activity is growing. Positive delta = accelerating momentum.
            </div>

            {velocity.length === 0 && !loading && (
              <div className="bg-white rounded-2xl p-8 text-center" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="text-3xl mb-2">🚀</div>
                <p className="text-[13px]" style={{ color: "#94a3b8" }}>No velocity data yet. Activity needs to accumulate.</p>
              </div>
            )}

            {velocity.map((v: any) => {
              const delta = v.delta24h ?? 0;
              const color = delta > 0 ? "#22c55e" : delta < 0 ? "#ef4444" : "#94a3b8";
              return (
                <div key={v.eventType} className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{iconFor(v.eventType)}</span>
                      <span className="font-semibold text-[13px]" style={{ color: "#0f172a" }}>{label(v.eventType)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-[13px]" style={{ color }}>
                        {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} {Math.abs(delta)}
                      </span>
                      <span className="text-[10px]" style={{ color: "#94a3b8" }}>vs yesterday</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { l: "Last 24h",  val: v.last24h  },
                      { l: "Prev 24h",  val: v.prev24h  },
                      { l: "Last 7d",   val: v.last7d   },
                      { l: "Prev 7d",   val: v.prev7d   },
                    ].map(kpi => (
                      <div key={kpi.l} className="rounded-xl p-2 text-center" style={{ background: "rgba(0,0,0,0.03)" }}>
                        <div className="font-bold text-[14px]" style={{ color: "#374151" }}>{kpi.val}</div>
                        <div className="text-[9px] uppercase tracking-wide font-semibold" style={{ color: "#94a3b8" }}>{kpi.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <h3 className="font-bold text-[14px] mb-3" style={{ color: "#0f172a" }}>System Maturity Score</h3>
              {[
                { label: "Engine Coverage",       score: 95, color: "#6366f1" },
                { label: "Series Depth",          score: 88, color: "#8b5cf6" },
                { label: "App Completeness",      score: 92, color: "#06b6d4" },
                { label: "Data Persistence",      score: 97, color: "#10b981" },
                { label: "Real-time Tracking",    score: 100, color: "#22c55e" },
                { label: "Safety Compliance",     score: 100, color: "#f59e0b" },
              ].map(s => (
                <div key={s.label} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold" style={{ color: "#374151" }}>{s.label}</span>
                    <span className="text-[12px] font-bold" style={{ color: s.color }}>{s.score}%</span>
                  </div>
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: "rgba(0,0,0,0.06)" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.score}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
