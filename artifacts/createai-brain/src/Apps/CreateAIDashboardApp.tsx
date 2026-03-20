import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useSystemStats, type Industry, type MetaPrediction, type ExpansionEntry, type KnowledgeSource, type OptimizationEntry } from "@/hooks/useSystemStats";

// ─── Design tokens ────────────────────────────────────────────────────────────

const INDIGO   = "#6366f1";
const PURPLE   = "#8b5cf6";
const GREEN    = "#10b981";
const AMBER    = "#f59e0b";
const RED      = "#ef4444";
const SLATE50  = "#f8fafc";
const SLATE100 = "#f1f5f9";
const SLATE200 = "#e2e8f0";
const SLATE500 = "#64748b";
const SLATE700 = "#334155";
const SLATE900 = "#0f172a";

const PIE_COLORS = [INDIGO, GREEN, AMBER];

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: `1px solid ${SLATE200}`,
      padding: "24px 28px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)",
    }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: SLATE900, margin: 0, lineHeight: 1.3 }}>{title}</h2>
        {sub && <p style={{ fontSize: 12, color: SLATE500, margin: "4px 0 0", lineHeight: 1.5 }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ label, value, color = INDIGO }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 2,
      background: SLATE50, borderRadius: 10, padding: "12px 16px",
      border: `1px solid ${SLATE200}`, flex: "1 1 160px", minWidth: 140,
    }}>
      <span style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: "-0.5px", lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, color: SLATE500, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 600,
      color: ok ? GREEN : RED,
      background: ok ? "#f0fdf4" : "#fef2f2",
      border: `1px solid ${ok ? "#bbf7d0" : "#fecaca"}`,
      borderRadius: 6, padding: "2px 8px",
    }}>
      {ok ? "✓" : "✗"} {label ?? (ok ? "Live" : "Down")}
    </span>
  );
}

// ─── Render mode chip ─────────────────────────────────────────────────────────

const MODE_COLOR: Record<string, string> = {
  cinematic: "#7c3aed", game: "#0891b2", music: "#db2777",
  podcast: "#ea580c",   book: "#65a30d", showcase: "#0284c7",
  app: "#6366f1",       pitch: "#d97706", document: "#475569",
  training: "#059669",  course: "#7c3aed",
};
function ModeChip({ mode }: { mode: string }) {
  const c = MODE_COLOR[mode] ?? SLATE500;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, letterSpacing: "0.3px",
      color: c, background: `${c}15`,
      borderRadius: 5, padding: "2px 7px",
      textTransform: "uppercase",
    }}>{mode}</span>
  );
}

// ─── Table styles ─────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  textAlign: "left", fontSize: 11, fontWeight: 600,
  color: SLATE500, padding: "8px 12px",
  borderBottom: `1px solid ${SLATE200}`,
  letterSpacing: "0.3px", textTransform: "uppercase",
  whiteSpace: "nowrap",
};
const TD: React.CSSProperties = {
  padding: "9px 12px", fontSize: 13, color: SLATE700,
  borderBottom: `1px solid ${SLATE100}`, verticalAlign: "middle",
};

// ─── Custom tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: `1px solid ${SLATE200}`, borderRadius: 10,
      padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12,
    }}>
      <p style={{ fontWeight: 600, color: SLATE900, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill, margin: "2px 0" }}>
          {p.name}: <strong>{p.value}%</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CreateAIDashboardApp() {
  const {
    industries, endpoints, savings, compliance, capacity,
    environmental, auditLogs, liveChecks, overall, coverage,
    loading, error, refresh,
    brainStatus, brainLoading,
  } = useSystemStats();

  const [simulation, setSimulation] = useState({ industry: "", scale: 1 });
  const [industrySearch, setIndustrySearch] = useState("");
  const [modeFilter, setModeFilter]         = useState("all");

  // ── derived ──────────────────────────────────────────────────────────────
  const totalSavings = useMemo(() => industries.reduce((s, i) => s + i.savings, 0), [industries]);

  const filteredIndustries = useMemo(() => {
    return industries.filter(i => {
      const matchSearch = i.name.toLowerCase().includes(industrySearch.toLowerCase()) ||
                          i.aiPersona.toLowerCase().includes(industrySearch.toLowerCase());
      const matchMode   = modeFilter === "all" || i.renderMode === modeFilter;
      return matchSearch && matchMode;
    });
  }, [industries, industrySearch, modeFilter]);

  const uniqueModes = useMemo(() => [...new Set(industries.map(i => i.renderMode))].sort(), [industries]);

  const roiEstimate = useMemo(() => {
    const sel = industries.find(i => i.name === simulation.industry);
    return sel ? sel.savings * simulation.scale : 0;
  }, [industries, simulation]);

  // ── summary stats ────────────────────────────────────────────────────────
  const summaryStats = [
    { label: "Industries Covered",  value: `${industries.length}/53`,   color: INDIGO  },
    { label: "AI Personas",          value: industries.length,            color: PURPLE  },
    { label: "Total Annual Savings", value: `$${totalSavings.toFixed(0)}M`, color: GREEN },
    { label: "System Coverage",      value: coverage,                    color: overall ? GREEN : RED },
    { label: "Active Endpoints",     value: endpoints.length,            color: INDIGO  },
    { label: "Uptime",               value: capacity.uptime,             color: GREEN   },
  ];

  return (
    <div style={{ padding: "24px 28px", minHeight: "100%", background: SLATE50, overflowY: "auto" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 18,
              background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})`,
            }}>🧠</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: SLATE900, margin: 0 }}>
              CreateAI Brain — Global Coverage Dashboard
            </h1>
          </div>
          <p style={{ fontSize: 13, color: SLATE500, margin: 0 }}>
            100% industry coverage · {industries.length} AI personas · Live enforcement · Real-time metrics
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {loading
            ? <span style={{ fontSize: 12, color: SLATE500 }}>Refreshing…</span>
            : error
              ? <span style={{ fontSize: 12, color: RED }}>API error: {error}</span>
              : <Badge ok={overall} label={overall ? "All systems operational" : "Degraded"} />
          }
          <button
            onClick={refresh}
            style={{
              fontSize: 12, fontWeight: 600, color: INDIGO,
              background: `${INDIGO}12`, border: `1px solid ${INDIGO}30`,
              borderRadius: 8, padding: "6px 14px", cursor: "pointer",
            }}
          >↻ Refresh</button>
        </div>
      </div>

      {/* ── Summary stats row ────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        {summaryStats.map(s => (
          <StatPill key={s.label} label={s.label} value={s.value} color={s.color} />
        ))}
      </div>

      {/* ── Live enforcement checks ──────────────────────────────────────── */}
      {liveChecks.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            background: "#fff", borderRadius: 16, border: `1px solid ${SLATE200}`,
            padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: SLATE700, margin: "0 0 12px" }}>
              Live Enforcement — {liveChecks.filter(c => c.pass).length}/{liveChecks.length} checks passing
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {liveChecks.map(c => (
                <div key={c.name} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: c.pass ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${c.pass ? "#bbf7d0" : "#fecaca"}`,
                  borderRadius: 8, padding: "6px 12px",
                }}>
                  <span style={{ fontSize: 12 }}>{c.pass ? "✓" : "✗"}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.pass ? "#166534" : RED }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: SLATE500 }}>{c.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Grid layout ──────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr" }}>

        {/* 1. Industry Coverage Table */}
        <Section
          title="Industry Coverage & AI Personas"
          sub={`${filteredIndustries.length} of ${industries.length} industries shown`}
        >
          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <input
              placeholder="Search by industry or persona…"
              value={industrySearch}
              onChange={e => setIndustrySearch(e.target.value)}
              style={{
                flex: "1 1 200px", fontSize: 13, padding: "7px 12px",
                border: `1px solid ${SLATE200}`, borderRadius: 8, outline: "none",
                color: SLATE700,
              }}
            />
            <select
              value={modeFilter}
              onChange={e => setModeFilter(e.target.value)}
              style={{
                fontSize: 12, padding: "7px 12px",
                border: `1px solid ${SLATE200}`, borderRadius: 8, outline: "none",
                color: SLATE700, background: "#fff",
              }}
            >
              <option value="all">All render modes</option>
              {uniqueModes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: SLATE50 }}>
                  <th style={TH}>Industry</th>
                  <th style={TH}>Render Mode</th>
                  <th style={TH}>AI Persona</th>
                  <th style={{ ...TH, textAlign: "right" }}>Endpoints</th>
                  <th style={{ ...TH, textAlign: "right" }}>Workflows</th>
                  <th style={{ ...TH, textAlign: "right" }}>Annual Savings ($M)</th>
                </tr>
              </thead>
              <tbody>
                {filteredIndustries.map((i, idx) => (
                  <tr
                    key={i.name}
                    style={{ background: idx % 2 === 0 ? "#fff" : SLATE50 }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${INDIGO}06`)}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : SLATE50)}
                  >
                    <td style={{ ...TD, fontWeight: 500, color: SLATE900 }}>{i.name}</td>
                    <td style={TD}><ModeChip mode={i.renderMode} /></td>
                    <td style={{ ...TD, color: SLATE500 }}>{i.aiPersona}</td>
                    <td style={{ ...TD, textAlign: "right", fontWeight: 600, color: INDIGO }}>{i.endpointCount}</td>
                    <td style={{ ...TD, textAlign: "right", fontWeight: 600, color: PURPLE }}>{i.workflowCount}</td>
                    <td style={{ ...TD, textAlign: "right", fontWeight: 700, color: GREEN }}>{i.savings.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 2. Endpoints & Workflow Health */}
        <Section title="Endpoints & Workflow Health" sub="All endpoints authenticated · rate-limited · status-monitored">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: SLATE50 }}>
                  <th style={TH}>Endpoint</th>
                  <th style={{ ...TH, textAlign: "center" }}>Auth</th>
                  <th style={TH}>Rate Limit</th>
                  <th style={{ ...TH, textAlign: "center" }}>SSE Guard</th>
                  <th style={{ ...TH, textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((e, idx) => (
                  <tr key={e.route} style={{ background: idx % 2 === 0 ? "#fff" : SLATE50 }}>
                    <td style={{ ...TD, fontFamily: "monospace", fontSize: 12, color: SLATE700 }}>{e.route}</td>
                    <td style={{ ...TD, textAlign: "center" }}><Badge ok={e.auth} label={e.auth ? "401 enforced" : "Open"} /></td>
                    <td style={{ ...TD, fontSize: 12 }}>
                      <span style={{
                        color: SLATE700, background: SLATE100, borderRadius: 5,
                        padding: "2px 8px", fontSize: 11, fontWeight: 600,
                      }}>{e.rateLimit}</span>
                    </td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      {e.sse
                        ? <Badge ok={true} label="1 per user" />
                        : <span style={{ color: SLATE500, fontSize: 11 }}>—</span>
                      }
                    </td>
                    <td style={{ ...TD, textAlign: "center" }}><Badge ok={e.status === "Live"} label={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Row: Charts side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* 3. Savings Chart */}
          <Section title="Compute & Infrastructure Savings" sub="Storage · Compute · Bandwidth savings by sector">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={savings.data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={SLATE200} />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: SLATE500 }} />
                <YAxis tick={{ fontSize: 10, fill: SLATE500 }} unit="%" domain={[40, 90]} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="storage"   fill={INDIGO} name="Storage (%)"   radius={[3, 3, 0, 0]} />
                <Bar dataKey="compute"   fill={GREEN}  name="Compute (%)"   radius={[3, 3, 0, 0]} />
                <Bar dataKey="bandwidth" fill={AMBER}  name="Bandwidth (%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {/* 6. Environmental Impact */}
          <Section title="Environmental Impact" sub="Platform sustainability metrics">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={environmental.data}
                  dataKey="value"
                  nameKey="metric"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  label={({ metric, value }) => `${metric}: ${value}%`}
                  labelLine={false}
                >
                  {environmental.data.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* Row: Compliance + Capacity side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* 4. Compliance */}
          <Section title="Compliance & Risk" sub="Active certifications and regulatory status">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {compliance.map(c => (
                <div key={c.name} style={{
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                  padding: "10px 14px",
                  background: c.status ? "#f0fdf4" : "#fef2f2",
                  borderRadius: 10,
                  border: `1px solid ${c.status ? "#bbf7d0" : "#fecaca"}`,
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: c.status ? "#166534" : RED, margin: 0 }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: SLATE500, margin: "2px 0 0" }}>{c.detail}</p>
                  </div>
                  <span style={{ fontSize: 16, marginLeft: 12 }}>{c.status ? "✅" : "❌"}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* 5. Capacity */}
          <Section title="System Capacity & Scalability" sub="Real-time platform performance indicators">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Concurrent SSE Streams",   value: `${capacity.sseStreams} per user (enforced)`, icon: "⚡" },
                { label: "Max Concurrent Users",      value: capacity.maxUsers.toLocaleString(),           icon: "👥" },
                { label: "Platform Uptime",           value: capacity.uptime,                              icon: "🟢" },
                { label: "CPU Utilization",           value: `${capacity.cpu}%`,                          icon: "🖥️" },
                { label: "Memory Usage",              value: `${capacity.memory} GB`,                     icon: "💾" },
              ].map(item => (
                <div key={item.label} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "11px 14px", background: SLATE50, borderRadius: 10,
                  border: `1px solid ${SLATE200}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, color: SLATE700 }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: SLATE900 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* 7. Audit Logs */}
        <Section title="Audit & Enforcement Logs" sub="Live activity tail — refreshes every 30 seconds">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: SLATE50 }}>
                  <th style={{ ...TH, width: 90 }}>Time</th>
                  <th style={TH}>Action</th>
                  <th style={{ ...TH, width: 80, textAlign: "center" }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : SLATE50 }}>
                    <td style={{ ...TD, fontFamily: "monospace", fontSize: 11, color: SLATE500, whiteSpace: "nowrap" }}>
                      {log.timestamp}
                    </td>
                    <td style={{ ...TD, fontSize: 12 }}>{log.action}</td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.4px",
                        color: log.status === "OK" ? GREEN : log.status === "Blocked" ? RED : AMBER,
                        background: log.status === "OK" ? "#f0fdf4" : log.status === "Blocked" ? "#fef2f2" : "#fffbeb",
                        border: `1px solid ${log.status === "OK" ? "#bbf7d0" : log.status === "Blocked" ? "#fecaca" : "#fde68a"}`,
                        borderRadius: 5, padding: "2px 8px", textTransform: "uppercase",
                      }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 8. What-If Simulation */}
        <Section title="What-If ROI Simulation" sub="Estimate annual savings by industry and deployment scale">
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 220px" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: SLATE500, display: "block", marginBottom: 6 }}>
                Select Industry
              </label>
              <select
                value={simulation.industry}
                onChange={e => setSimulation(prev => ({ ...prev, industry: e.target.value }))}
                style={{
                  width: "100%", fontSize: 13, padding: "9px 12px",
                  border: `1px solid ${SLATE200}`, borderRadius: 10, outline: "none",
                  color: SLATE700, background: "#fff",
                }}
              >
                <option value="">— Choose an industry —</option>
                {industries.map(i => (
                  <option key={i.name} value={i.name}>{i.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: "0 1 180px" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: SLATE500, display: "block", marginBottom: 6 }}>
                Scale Factor (deployments)
              </label>
              <input
                type="number" min={1} max={500}
                value={simulation.scale}
                onChange={e => setSimulation(prev => ({ ...prev, scale: Math.max(1, parseInt(e.target.value) || 1) }))}
                style={{
                  width: "100%", fontSize: 13, padding: "9px 12px",
                  border: `1px solid ${SLATE200}`, borderRadius: 10, outline: "none",
                  color: SLATE700, boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{
              flex: "1 1 200px",
              background: simulation.industry ? `linear-gradient(135deg, ${INDIGO}12, ${PURPLE}10)` : SLATE100,
              border: `1px solid ${simulation.industry ? `${INDIGO}30` : SLATE200}`,
              borderRadius: 14, padding: "16px 20px",
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: SLATE500, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Estimated Annual Savings
              </p>
              <p style={{ fontSize: 28, fontWeight: 800, color: simulation.industry ? INDIGO : SLATE500, margin: 0, letterSpacing: "-1px" }}>
                {simulation.industry ? `$${roiEstimate.toFixed(1)}M` : "—"}
              </p>
              {simulation.industry && simulation.scale > 1 && (
                <p style={{ fontSize: 11, color: SLATE500, margin: "4px 0 0" }}>
                  {simulation.scale}× scale factor applied
                </p>
              )}
            </div>
          </div>

          {/* Industry breakdown when selected */}
          {simulation.industry && (() => {
            const ind = industries.find(i => i.name === simulation.industry)!;
            return (
              <div style={{
                marginTop: 16, padding: "14px 18px",
                background: SLATE50, borderRadius: 12, border: `1px solid ${SLATE200}`,
                display: "flex", gap: 24, flexWrap: "wrap",
              }}>
                {[
                  { label: "Render Mode",   value: ind.renderMode },
                  { label: "AI Persona",    value: ind.aiPersona  },
                  { label: "Endpoints",     value: `${ind.endpointCount} active` },
                  { label: "Workflows",     value: `${ind.workflowCount} flows`  },
                  { label: "Base Savings",  value: `$${ind.savings}M/yr`        },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: SLATE500, margin: 0, textTransform: "uppercase", letterSpacing: "0.4px" }}>{item.label}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: SLATE700, margin: "2px 0 0" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </Section>

      </div>

        {/* ── Brain Enforcement Engine panels (live from /api/brain/status) ── */}
        {brainLoading && !brainStatus && (
          <div style={{ textAlign: "center", padding: "20px", color: SLATE500, fontSize: 13 }}>
            Connecting to enforcement engine…
          </div>
        )}

        {brainStatus && (<>

          {/* 9. Enforcement Loop Status */}
          <Section
            title="Enforcement Loop — ULTIMATE_BRAIN_PROMPT Active"
            sub={`Continuous self-audit · auto-resolve gaps · tick #${brainStatus.loopTick}`}
          >
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
              {[
                { label: "Loop Tick",          value: `#${brainStatus.loopTick}`,       color: INDIGO  },
                { label: "Coverage",           value: `${brainStatus.coverage}%`,        color: GREEN   },
                { label: "Auto-Resolve Gaps",  value: brainStatus.config.autoResolveGaps ? "Active" : "Off", color: GREEN },
                { label: "Audit Interval",     value: `${brainStatus.config.auditIntervalSeconds}s`, color: PURPLE },
                { label: "Min Coverage Floor", value: `${brainStatus.config.minCoveragePercent}%`,   color: AMBER  },
              ].map(s => <StatPill key={s.label} label={s.label} value={s.value} color={s.color} />)}
            </div>

            {/* Audit summary per category */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {Object.entries(brainStatus.auditSummary).map(([key, val]) => (
                <div key={key} style={{
                  flex: "1 1 160px", background: GREEN + "08",
                  border: `1px solid ${GREEN}30`, borderRadius: 10, padding: "10px 14px",
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: SLATE500, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>{key}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: GREEN, margin: "3px 0 0", letterSpacing: "-0.5px" }}>
                    {val.covered}/{val.total}
                  </p>
                  <p style={{ fontSize: 10, color: SLATE500, margin: "1px 0 0" }}>
                    {val.gaps === 0 ? "No gaps" : `${val.gaps} gap(s) resolved`}
                  </p>
                </div>
              ))}
            </div>

            {/* Coverage breakdown bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(brainStatus.coverageBreakdown).map(([area, pct]) => (
                <div key={area} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: SLATE500, width: 100, flexShrink: 0, textTransform: "capitalize" }}>{area}</span>
                  <div style={{ flex: 1, height: 6, background: SLATE100, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${INDIGO}, ${GREEN})`, borderRadius: 4, transition: "width 0.8s ease" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? GREEN : AMBER, width: 38, textAlign: "right" }}>{pct}%</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 16, fontSize: 12, color: SLATE500 }}>
              <span>Last audit: <strong style={{ color: SLATE700 }}>{new Date(brainStatus.lastAuditAt).toLocaleTimeString()}</strong></span>
              <span>Next audit: <strong style={{ color: INDIGO }}>{new Date(brainStatus.nextAuditAt).toLocaleTimeString()}</strong></span>
            </div>
          </Section>

          {/* 10. Self-Expansion Log */}
          <Section
            title="Self-Expansion Log"
            sub={`${brainStatus.expansionLog.length} automated actions · gaps auto-resolved · last 50 shown`}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: SLATE50 }}>
                    <th style={{ ...TH, width: 50 }}>Tick</th>
                    <th style={TH}>Category</th>
                    <th style={TH}>Action</th>
                    <th style={{ ...TH, width: 80, textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {brainStatus.expansionLog.slice(-20).reverse().map((entry: ExpansionEntry, idx: number) => (
                    <tr key={entry.id} style={{ background: idx % 2 === 0 ? "#fff" : SLATE50 }}>
                      <td style={{ ...TD, fontWeight: 700, color: INDIGO, textAlign: "center" }}>#{entry.tick}</td>
                      <td style={{ ...TD }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, color: PURPLE,
                          background: `${PURPLE}12`, borderRadius: 5, padding: "2px 7px",
                        }}>{entry.category}</span>
                      </td>
                      <td style={{ ...TD, fontSize: 12 }}>{entry.action}</td>
                      <td style={{ ...TD, textAlign: "center" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: entry.status === "applied" ? GREEN : entry.status === "verified" ? INDIGO : AMBER,
                          background: entry.status === "applied" ? "#f0fdf4" : entry.status === "verified" ? `${INDIGO}10` : "#fffbeb",
                          border: `1px solid ${entry.status === "applied" ? "#bbf7d0" : entry.status === "verified" ? `${INDIGO}30` : "#fde68a"}`,
                          borderRadius: 5, padding: "2px 8px", textTransform: "uppercase",
                        }}>{entry.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* 11. Meta-Learning Predictions */}
          <Section
            title="Meta-Learning Predictions"
            sub="AI-derived emergent industry, persona, and render mode predictions"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {brainStatus.metaPredictions.map((p: MetaPrediction) => (
                <div key={p.id} style={{
                  padding: "14px 18px", background: "#fff",
                  border: `1px solid ${SLATE200}`, borderRadius: 12,
                  display: "flex", gap: 16, alignItems: "flex-start",
                }}>
                  {/* Confidence ring */}
                  <div style={{ flexShrink: 0, textAlign: "center" }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: "50%",
                      background: `conic-gradient(${p.confidence >= 85 ? GREEN : p.confidence >= 75 ? AMBER : SLATE500} ${p.confidence * 3.6}deg, ${SLATE200} 0deg)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      position: "relative",
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%", background: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 800,
                        color: p.confidence >= 85 ? GREEN : p.confidence >= 75 ? AMBER : SLATE500,
                      }}>{p.confidence}%</div>
                    </div>
                    <p style={{ fontSize: 9, color: SLATE500, margin: "4px 0 0", fontWeight: 600, textTransform: "uppercase" }}>confidence</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: INDIGO,
                        background: `${INDIGO}12`, borderRadius: 5, padding: "2px 7px",
                        textTransform: "uppercase",
                      }}>{p.category}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: p.status === "integrated" ? GREEN : p.status === "validated" ? INDIGO : AMBER,
                        background: p.status === "integrated" ? "#f0fdf4" : p.status === "validated" ? `${INDIGO}10` : "#fffbeb",
                        borderRadius: 5, padding: "2px 7px",
                      }}>{p.status}</span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: SLATE900, margin: "0 0 4px" }}>{p.prediction}</p>
                    <p style={{ fontSize: 11, color: SLATE500, margin: 0, fontStyle: "italic" }}>Basis: {p.basis}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Row: Knowledge Sources + Optimization */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* 12. Knowledge Sources */}
            <Section title="Knowledge Ingestion" sub="Active knowledge sources and sync status">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {brainStatus.knowledgeSources.map((ks: KnowledgeSource) => (
                  <div key={ks.name} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 12px", background: SLATE50, borderRadius: 10,
                    border: `1px solid ${ks.status === "active" ? SLATE200 : ks.status === "degraded" ? "#fde68a" : "#fecaca"}`,
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          color: ks.type === "internal" ? INDIGO : ks.type === "api" ? GREEN : ks.type === "dataset" ? PURPLE : AMBER,
                          background: ks.type === "internal" ? `${INDIGO}12` : ks.type === "api" ? `${GREEN}12` : ks.type === "dataset" ? `${PURPLE}12` : `${AMBER}12`,
                          borderRadius: 4, padding: "1px 6px", textTransform: "uppercase",
                        }}>{ks.type}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: SLATE700 }}>{ks.name}</span>
                      </div>
                      <p style={{ fontSize: 10, color: SLATE500, margin: "2px 0 0" }}>
                        {ks.nodes.toLocaleString()} nodes · synced {new Date(ks.lastSynced).toLocaleTimeString()}
                      </p>
                    </div>
                    <span style={{ fontSize: 14 }}>
                      {ks.status === "active" ? "🟢" : ks.status === "degraded" ? "🟡" : "🔴"}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            {/* 13. Optimization Scores */}
            <Section title="Optimization Index" sub="Per-area performance and compliance scores">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {brainStatus.optimization.map((o: OptimizationEntry) => (
                  <div key={o.area}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: SLATE700 }}>{o.area}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: o.score >= 99 ? GREEN : o.score >= 95 ? INDIGO : AMBER }}>
                        {o.score}%
                      </span>
                    </div>
                    <div style={{ height: 5, background: SLATE100, borderRadius: 4, overflow: "hidden", marginBottom: 3 }}>
                      <div style={{
                        width: `${o.score}%`, height: "100%", borderRadius: 4,
                        background: o.score >= 99 ? `linear-gradient(90deg, ${GREEN}, #34d399)` :
                                    o.score >= 95 ? `linear-gradient(90deg, ${INDIGO}, ${PURPLE})` :
                                    `linear-gradient(90deg, ${AMBER}, #fbbf24)`,
                        transition: "width 1s ease",
                      }} />
                    </div>
                    <p style={{ fontSize: 10, color: SLATE500, margin: 0 }}>{o.note}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>

        </>)}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${SLATE200}`, textAlign: "center" }}>
        <p style={{ fontSize: 11, color: SLATE500, margin: 0 }}>
          CreateAI Brain · {industries.length} industries · {industries.length} AI personas · 11 render modes · Coverage: {coverage}
          {brainStatus && <> · Loop tick #{brainStatus.loopTick} · Auto-enforce: ON</>}
        </p>
      </div>

    </div>
  );
}
