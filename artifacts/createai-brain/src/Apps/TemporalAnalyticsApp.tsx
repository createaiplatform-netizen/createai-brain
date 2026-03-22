import React, { useState, useEffect } from "react";

type TimePoint = { ts: string; value: number };
type TrendResp = { ok: boolean; metric: string; days: number; total: number; avg: number; max: number; min: number; weekOverWeekChangePct: number | null; series: TimePoint[] };
type VelocityResp = { ok: boolean; velocities: Array<{ metric: string; label: string; totalLast30d: number; dailyRate: number; direction: string }> };
type AnomalyResp = { ok: boolean; anomalies: Array<{ metric: string; ts: string; value: number; zscore: number }> };

const METRICS = [
  { value: "platform_activity",    label: "Platform Activity" },
  { value: "leads_created",        label: "Leads Created" },
  { value: "projects_created",     label: "Projects Created" },
  { value: "opportunities_created", label: "Opportunities" },
  { value: "patients_added",       label: "Patients Added" },
  { value: "legal_clients_added",  label: "Legal Clients" },
  { value: "candidates_added",     label: "Candidates" },
  { value: "automation_executions", label: "Automation Runs" },
  { value: "traction_events",      label: "Traction Events" },
];

const PERIODS = [7, 14, 30, 60, 90, 180];

const DIR_COLOR: Record<string, string> = { accelerating: "#22c55e", decelerating: "#ef4444", stable: "#94a3b8" };
const DIR_ICON:  Record<string, string> = { accelerating: "↑", decelerating: "↓", stable: "→" };

const S: Record<string, React.CSSProperties> = {
  root:   { background: "#020617", minHeight: "100%", color: "#e2e8f0", fontFamily: "'Inter',system-ui,sans-serif", padding: "1.5rem", overflowY: "auto" as const },
  h1:     { fontSize: "1.25rem", fontWeight: 700, color: "#a5b4fc" },
  sub:    { fontSize: ".8rem", color: "#64748b", marginTop: ".2rem", marginBottom: "1.25rem" },
  card:   { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" },
  h2:     { fontSize: ".875rem", fontWeight: 600, color: "#c7d2fe", marginBottom: "1rem" },
  row:    { display: "flex", gap: ".75rem", alignItems: "center", padding: ".5rem 0", borderBottom: "1px solid rgba(255,255,255,.05)" },
  sel:    { background: "rgba(15,23,42,1)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "8px", color: "#e2e8f0", padding: ".45rem .75rem", fontSize: ".8rem" },
  btn:    { background: "#6366f1", color: "#fff", border: "none", borderRadius: "8px", padding: ".45rem .9rem", fontSize: ".8rem", cursor: "pointer", fontWeight: 600 },
  stat:   { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "10px", padding: "1rem", textAlign: "center" as const },
  sn:     { fontSize: "1.4rem", fontWeight: 800, color: "#a5b4fc" },
  sl:     { fontSize: ".7rem", color: "#64748b", marginTop: ".2rem" },
  empty:  { textAlign: "center" as const, color: "#64748b", padding: "2rem", fontStyle: "italic", fontSize: ".8rem" },
  chart:  { width: "100%", height: 120, position: "relative" as const, marginTop: ".75rem" },
};

// Simple sparkline using SVG
function Sparkline({ data, color = "#6366f1" }: { data: number[]; color?: string }) {
  if (data.length < 2) return <div style={{ color: "#64748b", fontSize: ".75rem" }}>Not enough data</div>;
  const max   = Math.max(...data, 1);
  const w     = 600;
  const h     = 100;
  const pts   = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  const area  = `M0,${h} L${pts.split(" ").map((p, i) => i === 0 ? `0,${p.split(",")[1]}` : p).join(" L")} L${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "100px" }} aria-label="Trend sparkline">
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function TemporalAnalyticsApp() {
  const [metric,    setMetric]    = useState("platform_activity");
  const [days,      setDays]      = useState(30);
  const [trend,     setTrend]     = useState<TrendResp | null>(null);
  const [velocity,  setVelocity]  = useState<VelocityResp | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyResp | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [tab,       setTab]       = useState<"trend"|"velocity"|"anomalies">("velocity");

  useEffect(() => {
    fetch("/api/temporal/velocity", { credentials: "include" }).then(r => r.json()).then((d: VelocityResp) => setVelocity(d)).catch(() => {});
    fetch("/api/temporal/anomalies", { credentials: "include" }).then(r => r.json()).then((d: AnomalyResp) => setAnomalies(d)).catch(() => {});
  }, []);

  const loadTrend = async () => {
    setLoading(true);
    const r = await fetch(`/api/temporal/trends?metric=${metric}&days=${days}`, { credentials: "include" })
      .then(x => x.json()).catch(() => null) as TrendResp | null;
    setTrend(r);
    setLoading(false);
    setTab("trend");
  };

  const wow = trend?.weekOverWeekChangePct;

  return (
    <div style={S.root} role="main">
      <a href="#content" style={{ position: "absolute", left: -999, top: 0 }}>Skip to main</a>
      <div style={S.h1}>⏱ Temporal Intelligence</div>
      <div style={S.sub}>Time-series analytics, trend detection, anomaly monitoring, and growth velocity</div>

      {/* Controls */}
      <div style={{ display: "flex", gap: ".75rem", marginBottom: "1.25rem", flexWrap: "wrap" as const, alignItems: "center" }}>
        <select style={S.sel} value={metric} onChange={e => setMetric(e.target.value)} aria-label="Metric">
          {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select style={S.sel} value={days} onChange={e => setDays(Number(e.target.value))} aria-label="Period">
          {PERIODS.map(p => <option key={p} value={p}>Last {p} days</option>)}
        </select>
        <button style={S.btn} onClick={loadTrend} disabled={loading}>{loading ? "Loading…" : "Analyse Trend"}</button>
        <div style={{ display: "flex", gap: ".4rem" }}>
          {(["velocity","anomalies","trend"] as const).map(t => (
            <button key={t} style={{ ...S.btn, background: tab === t ? "#6366f1" : "rgba(99,102,241,.2)", color: tab === t ? "#fff" : "#a5b4fc", fontWeight: 500 }}
              onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </div>

      <div id="content">
        {/* Trend View */}
        {tab === "trend" && trend && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
              <div style={S.stat}><div style={S.sn}>{trend.total}</div><div style={S.sl}>Total</div></div>
              <div style={S.stat}><div style={S.sn}>{trend.avg}</div><div style={S.sl}>Daily Avg</div></div>
              <div style={S.stat}><div style={S.sn}>{trend.max}</div><div style={S.sl}>Peak Day</div></div>
              <div style={S.stat}><div style={S.sn}>{trend.min}</div><div style={S.sl}>Lowest Day</div></div>
              <div style={S.stat}>
                <div style={{ ...S.sn, color: wow != null ? (wow >= 0 ? "#22c55e" : "#ef4444") : "#64748b" }}>
                  {wow != null ? (wow >= 0 ? "+" : "") + wow + "%" : "—"}
                </div>
                <div style={S.sl}>WoW Change</div>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.h2}>{METRICS.find(m => m.value === metric)?.label ?? metric} — Last {days} days</div>
              <Sparkline data={trend.series.map(p => Number(p.value))} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: ".5rem", fontSize: ".7rem", color: "#64748b" }}>
                <span>{trend.series[0] ? new Date(trend.series[0].ts).toLocaleDateString() : ""}</span>
                <span>{trend.series[trend.series.length - 1] ? new Date(trend.series[trend.series.length - 1]!.ts).toLocaleDateString() : ""}</span>
              </div>
            </div>
          </>
        )}
        {tab === "trend" && !trend && (
          <div style={S.empty}>Select a metric and click "Analyse Trend" to see the time-series chart.</div>
        )}

        {/* Velocity View */}
        {tab === "velocity" && (
          <div style={S.card}>
            <div style={S.h2}>Domain Growth Velocity — Last 30 Days</div>
            {!velocity ? <div style={S.empty}>Loading…</div> : (velocity.velocities ?? []).length === 0 ? (
              <div style={S.empty}>No activity data to show velocity.</div>
            ) : (velocity.velocities ?? []).map(v => (
              <div key={v.metric} style={S.row}>
                <div style={{ flex: "0 0 140px", fontSize: ".8rem", color: "#c7d2fe" }}>{v.label}</div>
                <div style={{ flex: 1, background: "rgba(255,255,255,.04)", borderRadius: "6px", height: "8px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, v.totalLast30d)}%`, background: DIR_COLOR[v.direction] ?? "#6366f1", borderRadius: "6px", minWidth: "2px" }} />
                </div>
                <div style={{ flex: "0 0 60px", textAlign: "right" as const, fontSize: ".85rem", fontWeight: 700, color: "#a5b4fc" }}>{v.totalLast30d}</div>
                <div style={{ flex: "0 0 80px", fontSize: ".75rem", color: DIR_COLOR[v.direction] ?? "#94a3b8" }}>
                  {DIR_ICON[v.direction] ?? ""} {v.direction}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Anomalies View */}
        {tab === "anomalies" && (
          <div style={S.card}>
            <div style={S.h2}>Detected Anomalies (3σ Z-score)</div>
            {!anomalies ? <div style={S.empty}>Loading…</div> : (anomalies.anomalies ?? []).length === 0 ? (
              <div style={{ textAlign: "center" as const, color: "#22c55e", padding: "2rem", fontSize: ".875rem" }}>✓ No anomalies detected in last 60 days</div>
            ) : (anomalies.anomalies ?? []).map((a, i) => (
              <div key={i} style={S.row}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".8rem", fontWeight: 600 }}>{a.metric}</div>
                  <div style={{ fontSize: ".73rem", color: "#64748b" }}>{new Date(a.ts).toLocaleDateString()} · value: <strong style={{ color: "#e2e8f0" }}>{a.value}</strong></div>
                </div>
                <div style={{ fontSize: ".8rem", fontWeight: 700, color: a.zscore > 3 ? "#ef4444" : "#f59e0b" }}>
                  z={a.zscore.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
