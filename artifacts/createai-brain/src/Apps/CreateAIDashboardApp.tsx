import React, { useEffect, useMemo, useState } from "react";
import { useSystemStats, type ExpansionEntry, type MetaPrediction, type KnowledgeSource, type OptimizationEntry, type MissionPhase } from "@/hooks/useSystemStats";
import {
  SectionHeader, Card, CardHeader, CardContent,
  Table, TableHead, TableRow, TableCell,
  PieChart, BarChart, AuditLog, SimulationInput,
} from "@/components/StyledComponents";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLevel(s: string): "OK" | "Warn" | "Blocked" {
  if (s === "OK" || s === "Live") return "OK";
  if (s === "Warn" || s === "Degraded") return "Warn";
  return "Blocked";
}

// ─── Component ───────────────────────────────────────────────────────────────

const CreateAIDashboardApp = () => {
  const stats = useSystemStats();

  const [activeIndustry, setActiveIndustry] = useState(stats.industries[0] ?? null);
  const [simResult, setSimResult] = useState<string | null>(null);

  useEffect(() => {
    if (!activeIndustry && stats.industries.length) {
      setActiveIndustry(stats.industries[0]);
    }
  }, [stats.industries, activeIndustry]);

  // Auto-refresh every 30 s (hook already handles it; this keeps UI-level state fresh)
  useEffect(() => {
    const interval = setInterval(() => stats.refresh(), 30_000);
    return () => clearInterval(interval);
  }, [stats]);

  // ── Derived data for charts ───────────────────────────────────────────────

  // Endpoint health → numeric status for BarChart
  const endpointChartData = useMemo(() =>
    stats.endpoints.map(ep => ({
      name: ep.route.replace(/^(GET|POST)\s+/, "").replace("/api/generate", ""),
      status: ep.status === "Live" ? 2 : ep.status === "Degraded" ? 1 : 0,
    })), [stats.endpoints]);

  // Compute savings → flat array from savings.data
  const computeSavingsData = useMemo(() =>
    stats.savings.data.map(d => ({
      sector: d.category,
      value: d.storage + d.compute + d.bandwidth,
    })), [stats.savings.data]);

  // Env data renamed for PieChart
  const envData = useMemo(() =>
    stats.environmental.data.map(d => ({ type: d.metric, value: d.value })),
    [stats.environmental.data]);

  // Audit logs mapped to AuditLog component format
  const auditLogEntries = useMemo(() =>
    stats.auditLogs.map(l => ({
      message: `${l.timestamp}  ${l.action}`,
      level: statusLevel(l.status),
    })), [stats.auditLogs]);

  // What-If simulation handler
  const handleSimulate = (scale: number) => {
    if (!activeIndustry) return;
    const projected = (activeIndustry.savings * scale).toFixed(1);
    setSimResult(`${activeIndustry.name} at ${scale}x scale → $${projected}M/yr projected savings`);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "20px", fontFamily: "SF Pro, Helvetica, sans-serif", backgroundColor: "#f5f5f7", color: "#111", minHeight: "100%", overflowY: "auto" }}>
      <h1 style={{ marginBottom: "20px" }}>CreateAI Brain — Coverage Dashboard</h1>

      {stats.loading && <p style={{ color: "#888", fontSize: 13 }}>Loading live data…</p>}
      {stats.error  && <p style={{ color: "#ff3b30", fontSize: 13 }}>⚠ {stats.error}</p>}

      {/* 1. Industry Coverage & AI Personas */}
      <SectionHeader title="Industry Coverage & AI Personas" />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Industry</TableCell>
            <TableCell>AI Persona</TableCell>
            <TableCell>Render Mode</TableCell>
            <TableCell>Endpoints</TableCell>
            <TableCell>Workflows</TableCell>
            <TableCell>Annual Savings</TableCell>
          </TableRow>
        </TableHead>
        <tbody>
          {stats.industries.map(ind => (
            <TableRow key={ind.name} onClick={() => setActiveIndustry(ind)}>
              <TableCell style={{ fontWeight: activeIndustry?.name === ind.name ? 600 : undefined }}>{ind.name}</TableCell>
              <TableCell>{ind.aiPersona}</TableCell>
              <TableCell>{ind.renderMode}</TableCell>
              <TableCell>{ind.endpointCount}</TableCell>
              <TableCell>{ind.workflowCount}</TableCell>
              <TableCell>${ind.savings}M</TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {/* 2. Endpoints & Workflow Health */}
      <SectionHeader title="Endpoints & Workflow Health" />
      <BarChart
        data={endpointChartData}
        xKey="name"
        yKey="status"
        height={200}
        colorScheme={["#0a84ff"]}
      />

      {/* 3. Compute & Infrastructure Savings */}
      <SectionHeader title="Compute & Infrastructure Savings" />
      <BarChart
        data={computeSavingsData}
        xKey="sector"
        yKey="value"
        height={200}
        colorScheme={["#5ac8fa"]}
      />

      {/* 4. Compliance & Risk */}
      <SectionHeader title="Compliance & Risk" />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Standard</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Detail</TableCell>
          </TableRow>
        </TableHead>
        <tbody>
          {stats.compliance.map(c => (
            <TableRow key={c.name}>
              <TableCell>{c.name}</TableCell>
              <TableCell style={{ color: c.status ? "#34c759" : "#ff3b30" }}>
                {c.status ? "Certified" : "Non-compliant"}
              </TableCell>
              <TableCell>{c.detail}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {/* 5. System Capacity & Scalability */}
      <SectionHeader title="System Capacity & Scalability" />
      <Card>
        <CardHeader title="Max Users / SSE Streams" />
        <CardContent>
          Users: {stats.capacity.maxUsers.toLocaleString()} &nbsp;|&nbsp;
          SSE Streams: {stats.capacity.sseStreams.toLocaleString()} &nbsp;|&nbsp;
          CPU: {stats.capacity.cpu}% &nbsp;|&nbsp;
          Memory: {stats.capacity.memory}% &nbsp;|&nbsp;
          Uptime: {stats.capacity.uptime}
        </CardContent>
      </Card>

      {/* 6. Environmental Impact */}
      <SectionHeader title="Environmental Impact" />
      <PieChart
        data={envData}
        valueKey="value"
        labelKey="type"
        colors={["#0a84ff", "#ffcc00", "#34c759", "#ff375f"]}
        height={250}
      />

      {/* 7. Audit & Enforcement Logs */}
      <SectionHeader title="Audit & Enforcement Logs" />
      <AuditLog logs={auditLogEntries} maxEntries={10} />

      {/* 8. What-If ROI Simulation */}
      <SectionHeader title="What-If ROI Simulation" />
      {activeIndustry && (
        <Card>
          <CardHeader title={`Simulating: ${activeIndustry.name}`} />
          <CardContent>
            Base savings: ${activeIndustry.savings}M/yr · Select a scale multiplier and hit Simulate.
            <SimulationInput industries={stats.industries} onSimulate={handleSimulate} />
            {simResult && (
              <p style={{ marginTop: 10, fontWeight: 600, color: "#0a84ff" }}>{simResult}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Brain Enforcement Engine (live from /api/brain/status) ─────────── */}

      {stats.brainLoading && !stats.brainStatus && (
        <p style={{ marginTop: 20, color: "#888", fontSize: 13 }}>Connecting to enforcement engine…</p>
      )}

      {stats.brainStatus && (() => {
        const bs = stats.brainStatus!;
        return (<>

          {/* 9. Enforcement Loop */}
          <SectionHeader title="Enforcement Loop — ULTIMATE_BRAIN_PROMPT Active" />
          <Card>
            <CardHeader title={`Tick #${bs.loopTick} · Coverage ${bs.coverage}% · Auto-resolve: ${bs.config.autoResolveGaps ? "ON" : "OFF"}`} />
            <CardContent>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 12 }}>
                {Object.entries(bs.auditSummary).map(([key, val]) => (
                  <div key={key}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.4px" }}>{key}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#34c759" }}>{val.covered}/{val.total}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{val.gaps === 0 ? "No gaps" : `${val.gaps} resolved`}</div>
                  </div>
                ))}
              </div>
              {Object.entries(bs.coverageBreakdown).map(([area, pct]) => (
                <div key={area} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#555", width: 100, flexShrink: 0, textTransform: "capitalize" }}>{area}</span>
                  <div style={{ flex: 1, height: 6, background: "#e5e5ea", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "#34c759" : "#0a84ff", borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? "#34c759" : "#ff9500", width: 38, textAlign: "right" }}>{pct}%</span>
                </div>
              ))}
              <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
                Last audit: {new Date(bs.lastAuditAt).toLocaleTimeString()} &nbsp;·&nbsp;
                Next: {new Date(bs.nextAuditAt).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>

          {/* 10. Self-Expansion Log */}
          <SectionHeader title="Self-Expansion Log" />
          <AuditLog
            logs={bs.expansionLog.slice(-20).reverse().map((e: ExpansionEntry) => ({
              message: `[Tick #${e.tick}] [${e.category}] ${e.action}`,
              level: e.status === "applied" ? "OK" : e.status === "verified" ? "OK" : "Warn",
            }))}
            maxEntries={20}
          />

          {/* 11. Meta-Learning Predictions */}
          <SectionHeader title="Meta-Learning Predictions" />
          {bs.metaPredictions.map((p: MetaPrediction) => (
            <Card key={p.id}>
              <CardHeader title={`[${p.category}] ${p.confidence}% confidence · ${p.status}`} />
              <CardContent>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.prediction}</div>
                <div style={{ fontSize: 12, color: "#888", fontStyle: "italic" }}>Basis: {p.basis}</div>
              </CardContent>
            </Card>
          ))}

          {/* 12 + 13. Knowledge Sources & Optimization */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <SectionHeader title="Knowledge Ingestion" />
              {bs.knowledgeSources.map((ks: KnowledgeSource) => (
                <Card key={ks.name}>
                  <CardContent>
                    <span style={{ fontSize: 12, fontWeight: 700, marginRight: 6 }}>
                      {ks.status === "active" ? "🟢" : ks.status === "degraded" ? "🟡" : "🔴"}
                    </span>
                    <strong>{ks.name}</strong>
                    <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>
                      [{ks.type}] · {ks.nodes.toLocaleString()} nodes · {new Date(ks.lastSynced).toLocaleTimeString()}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div>
              <SectionHeader title="Optimization Index" />
              <Card>
                <CardContent>
                  {bs.optimization.map((o: OptimizationEntry) => (
                    <div key={o.area} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{o.area}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: o.score >= 99 ? "#34c759" : o.score >= 95 ? "#0a84ff" : "#ff9500" }}>{o.score}%</span>
                      </div>
                      <div style={{ height: 5, background: "#e5e5ea", borderRadius: 4, overflow: "hidden", marginBottom: 2 }}>
                        <div style={{ width: `${o.score}%`, height: "100%", background: o.score >= 99 ? "#34c759" : "#0a84ff", borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 11, color: "#888" }}>{o.note}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

        </>);
      })()}

      {/* ── Mission Config ────────────────────────────────────────────────── */}
      {stats.missionConfig && (() => {
        const mc = stats.missionConfig!;
        const statusColor = (s: MissionPhase["status"]) =>
          s === "enforced" ? "#34c759" : s === "active" ? "#0a84ff" : "#ffcc00";
        const statusLabel = (s: MissionPhase["status"]) =>
          s === "enforced" ? "ENFORCED" : s === "active" ? "ACTIVE" : "STANDBY";

        return (<>
          <SectionHeader title="Universe-Scale Deployment Mission" />
          <Card>
            <CardHeader title={`v${mc.version} · Deployed for ${mc.deployedFor} · Enforced by ${mc.enforcedBy} · Tick #${mc.loopTick}`} />
            <CardContent>
              <p style={{ fontStyle: "italic", color: "#555", marginBottom: 16 }}>{mc.goal}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {mc.phases.map((phase: MissionPhase) => (
                  <div key={phase.id} style={{
                    border: `1.5px solid ${statusColor(phase.status)}40`,
                    borderRadius: 10, padding: "12px 14px",
                    background: `${statusColor(phase.status)}08`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{phase.label}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 800, letterSpacing: "0.5px",
                        color: statusColor(phase.status),
                        background: `${statusColor(phase.status)}18`,
                        borderRadius: 5, padding: "2px 7px",
                      }}>{statusLabel(phase.status)}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#666", margin: "0 0 8px", lineHeight: 1.4 }}>{phase.description}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {Object.entries(phase.settings).map(([key, val]) => (
                        <span key={key} style={{
                          fontSize: 10, padding: "2px 7px", borderRadius: 4,
                          background: val === true ? "#f0fdf4" : val === false ? "#fff1f2" : "#f0f4ff",
                          color:       val === true ? "#166534" : val === false ? "#991b1b" : "#3730a3",
                          border:      `1px solid ${val === true ? "#bbf7d0" : val === false ? "#fecaca" : "#c7d2fe"}`,
                          fontWeight: 600,
                        }}>
                          {key}: {Array.isArray(val) ? val.join(", ") : String(val)}
                        </span>
                      ))}
                    </div>
                    <p style={{ fontSize: 10, color: "#999", margin: "8px 0 0" }}>
                      {phase.enabledSettingCount}/{phase.activeSettingCount} settings active
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>);
      })()}

      <div style={{ marginTop: "30px", textAlign: "right", fontSize: "12px", color: "#888" }}>
        CreateAI Brain v100 — {stats.industries.length} industries · {stats.coverage} coverage
        {stats.brainStatus && ` · Loop tick #${stats.brainStatus.loopTick} · Auto-enforce: ON`}
        {stats.missionConfig && ` · Mission v${stats.missionConfig.version} active`}
      </div>
    </div>
  );
};

export default CreateAIDashboardApp;
