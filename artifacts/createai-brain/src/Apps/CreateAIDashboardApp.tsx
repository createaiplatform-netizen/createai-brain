import React, { useEffect, useMemo, useState } from "react";
import { InfiniteBrainLiveBanner } from "@/components/InfiniteBrainLiveBanner";
import {
  useSystemStats,
  type ExpansionEntry,
  type MetaPrediction,
  type KnowledgeSource,
  type OptimizationEntry,
  type MissionPhase,
} from "@/hooks/useSystemStats";
import {
  SectionHeader, Card, CardHeader, CardContent,
  Table, TableHead, TableRow, TableCell,
  PieChart, BarChart, AuditLog, SimulationInput,
  MetricCard, StatusPill, ProgressBar,
} from "@/components/StyledComponents";

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  accent:  "#6366f1",
  ok:      "#22c55e",
  warn:    "#f59e0b",
  danger:  "#ef4444",
  blue:    "#3b82f6",
  text1:   "#0f172a",
  text2:   "#475569",
  text3:   "#94a3b8",
  border:  "rgba(15,23,42,0.07)",
  font:    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLevel(s: string): "OK" | "Warn" | "Blocked" {
  if (s === "OK" || s === "Live") return "OK";
  if (s === "Warn" || s === "Degraded") return "Warn";
  return "Blocked";
}

function pillVariant(ok: boolean): "ok" | "danger" {
  return ok ? "ok" : "danger";
}

// ─── Component ────────────────────────────────────────────────────────────────

const CreateAIDashboardApp = () => {
  const stats = useSystemStats();

  const [activeIndustry, setActiveIndustry] = useState(stats.industries[0] ?? null);
  const [simResult, setSimResult] = useState<string | null>(null);

  useEffect(() => {
    if (!activeIndustry && stats.industries.length) {
      setActiveIndustry(stats.industries[0]);
    }
  }, [stats.industries, activeIndustry]);

  useEffect(() => {
    const interval = setInterval(() => stats.refresh(), 30_000);
    return () => clearInterval(interval);
  }, [stats]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const endpointChartData = useMemo(() =>
    stats.endpoints.map(ep => ({
      name: ep.route.replace(/^(GET|POST)\s+/, "").replace("/api/generate", ""),
      status: ep.status === "Live" ? 2 : ep.status === "Degraded" ? 1 : 0,
    })), [stats.endpoints]);

  const computeSavingsData = useMemo(() =>
    stats.savings.data.map(d => ({
      sector: d.category,
      value: d.storage + d.compute + d.bandwidth,
    })), [stats.savings.data]);

  const envData = useMemo(() =>
    stats.environmental.data.map(d => ({ type: d.metric, value: d.value })),
    [stats.environmental.data]);

  const auditLogEntries = useMemo(() =>
    stats.auditLogs.map(l => ({
      message: `${l.timestamp}  ${l.action}`,
      level: statusLevel(l.status),
    })), [stats.auditLogs]);

  const handleSimulate = (scale: number) => {
    if (!activeIndustry) return;
    const projected = (activeIndustry.savings * scale).toFixed(1);
    setSimResult(`${activeIndustry.name} at ${scale}x scale → $${projected}M/yr projected savings`);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      padding: "24px 24px 48px",
      fontFamily: T.font,
      background: "#f8fafc",
      color: T.text1,
      minHeight: "100%",
      overflowY: "auto",
    }}>

      {/* ── Live Banner ──────────────────────────────────────────────────── */}
      <InfiniteBrainLiveBanner />

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        borderRadius: 16, padding: "22px 28px", marginBottom: 28,
        boxShadow: "0 8px 32px rgba(99,102,241,0.30)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 780, color: "#fff", letterSpacing: "-0.4px" }}>
            CreateAI Brain — Coverage Dashboard
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
            {stats.industries.length} industries · {stats.coverage} coverage
            {stats.brainStatus && ` · Loop tick #${stats.brainStatus.loopTick}`}
            {stats.missionConfig && ` · Mission v${stats.missionConfig.version} active`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {stats.loading && (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>Refreshing…</span>
          )}
          {stats.error && (
            <span style={{ fontSize: 12, color: "#fca5a5", fontWeight: 600 }}>⚠ {stats.error}</span>
          )}
        </div>
      </div>

      {/* ── 1. Industry Coverage & AI Personas ───────────────────────────── */}
      <SectionHeader title="Industry Coverage & AI Personas" />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell style={{ fontWeight: 700, fontSize: 12, color: T.text3, letterSpacing: "0.4px", textTransform: "uppercase" }}>Industry</TableCell>
            <TableCell style={{ fontWeight: 700, fontSize: 12, color: T.text3, letterSpacing: "0.4px", textTransform: "uppercase" }}>AI Persona</TableCell>
            <TableCell style={{ fontWeight: 700, fontSize: 12, color: T.text3, letterSpacing: "0.4px", textTransform: "uppercase" }}>Render Mode</TableCell>
            <TableCell style={{ fontWeight: 700, fontSize: 12, color: T.text3, letterSpacing: "0.4px", textTransform: "uppercase" }}>Endpoints</TableCell>
            <TableCell style={{ fontWeight: 700, fontSize: 12, color: T.text3, letterSpacing: "0.4px", textTransform: "uppercase" }}>Workflows</TableCell>
            <TableCell style={{ fontWeight: 700, fontSize: 12, color: T.text3, letterSpacing: "0.4px", textTransform: "uppercase" }}>Savings / yr</TableCell>
          </TableRow>
        </TableHead>
        <tbody>
          {stats.industries.map(ind => (
            <TableRow key={ind.name} onClick={() => setActiveIndustry(ind)}>
              <TableCell style={{
                fontWeight: activeIndustry?.name === ind.name ? 700 : 500,
                color: activeIndustry?.name === ind.name ? T.accent : T.text1,
              }}>
                {ind.name}
              </TableCell>
              <TableCell style={{ color: T.text2 }}>{ind.aiPersona}</TableCell>
              <TableCell>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                  background: "rgba(99,102,241,0.08)", color: T.accent,
                }}>
                  {ind.renderMode}
                </span>
              </TableCell>
              <TableCell style={{ fontWeight: 600 }}>{ind.endpointCount}</TableCell>
              <TableCell style={{ fontWeight: 600 }}>{ind.workflowCount}</TableCell>
              <TableCell style={{ fontWeight: 700, color: "#16a34a" }}>${ind.savings}M</TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {/* ── 2. Endpoints & Workflow Health ───────────────────────────────── */}
      <SectionHeader title="Endpoints & Workflow Health" />
      <Card>
        <CardContent>
          <BarChart data={endpointChartData} xKey="name" yKey="status" height={220} colorScheme={[T.blue]} />
        </CardContent>
      </Card>

      {/* ── 3. Compute & Infrastructure Savings ──────────────────────────── */}
      <SectionHeader title="Compute & Infrastructure Savings" />
      <Card>
        <CardContent>
          <BarChart data={computeSavingsData} xKey="sector" yKey="value" height={220} colorScheme={[T.accent]} />
        </CardContent>
      </Card>

      {/* ── 4. Compliance & Risk ─────────────────────────────────────────── */}
      <SectionHeader title="Compliance & Risk" />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell style={{ fontWeight: 700, fontSize: 12, color: T.text3, textTransform: "uppercase", letterSpacing: "0.4px" }}>Standard</TableCell>
            <TableCell style={{ fontWeight: 700, fontSize: 12, color: T.text3, textTransform: "uppercase", letterSpacing: "0.4px" }}>Status</TableCell>
            <TableCell style={{ fontWeight: 700, fontSize: 12, color: T.text3, textTransform: "uppercase", letterSpacing: "0.4px" }}>Detail</TableCell>
          </TableRow>
        </TableHead>
        <tbody>
          {stats.compliance.map(c => (
            <TableRow key={c.name}>
              <TableCell style={{ fontWeight: 600 }}>{c.name}</TableCell>
              <TableCell>
                <StatusPill
                  label={c.status ? "Certified" : "Non-compliant"}
                  variant={pillVariant(c.status)}
                />
              </TableCell>
              <TableCell style={{ color: T.text2 }}>{c.detail}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {/* ── 5. System Capacity & Scalability ─────────────────────────────── */}
      <SectionHeader title="System Capacity & Scalability" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 16 }}>
        <MetricCard label="Max Users"   value={stats.capacity.maxUsers.toLocaleString()} sub="Concurrent" />
        <MetricCard label="SSE Streams" value={stats.capacity.sseStreams.toLocaleString()} sub="Live streams" />
        <MetricCard label="CPU"         value={`${stats.capacity.cpu}%`} sub="Utilization" accent />
        <MetricCard label="Memory"      value={`${stats.capacity.memory}%`} sub="Utilization" />
        <MetricCard label="Uptime"      value={stats.capacity.uptime} sub="Current session" />
      </div>

      {/* ── 6. Environmental Impact ───────────────────────────────────────── */}
      <SectionHeader title="Environmental Impact" />
      <Card>
        <CardContent>
          <PieChart
            data={envData}
            valueKey="value"
            labelKey="type"
            colors={[T.blue, "#f59e0b", T.ok, T.danger]}
            height={260}
          />
        </CardContent>
      </Card>

      {/* ── 7. Audit & Enforcement Logs ──────────────────────────────────── */}
      <SectionHeader title="Audit & Enforcement Logs" />
      <AuditLog logs={auditLogEntries} maxEntries={10} />

      {/* ── 8. What-If ROI Simulation ─────────────────────────────────────── */}
      <SectionHeader title="What-If ROI Simulation" />
      {activeIndustry && (
        <Card>
          <CardHeader title={`Simulating: ${activeIndustry.name}`} subtitle={`Base: $${activeIndustry.savings}M/yr — click a row above to switch industry`} />
          <CardContent>
            <SimulationInput industries={stats.industries} onSimulate={handleSimulate} />
            {simResult && (
              <div style={{
                marginTop: 16, padding: "12px 16px", borderRadius: 10,
                background: "linear-gradient(135deg, rgba(99,102,241,0.07), rgba(79,70,229,0.04))",
                border: `1px solid rgba(99,102,241,0.18)`,
              }}>
                <span style={{ fontWeight: 700, color: T.accent, fontSize: 14 }}>{simResult}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Brain Enforcement Engine ──────────────────────────────────────── */}

      {stats.brainLoading && !stats.brainStatus && (
        <p style={{ marginTop: 24, color: T.text3, fontSize: 13 }}>Connecting to enforcement engine…</p>
      )}

      {stats.brainStatus && (() => {
        const bs = stats.brainStatus!;
        return (<>

          {/* 9. Enforcement Loop */}
          <SectionHeader title="Enforcement Loop — ULTIMATE_BRAIN_PROMPT Active" />
          <Card>
            <CardHeader
              title={`Tick #${bs.loopTick} · Coverage ${bs.coverage}%`}
              subtitle={`Auto-resolve: ${bs.config.autoResolveGaps ? "ON" : "OFF"} · Next audit: ${new Date(bs.nextAuditAt).toLocaleTimeString()}`}
            />
            <CardContent>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14, marginBottom: 20 }}>
                {Object.entries(bs.auditSummary).map(([key, val]) => (
                  <div key={key} style={{
                    background: "#f8fafc", border: `1px solid ${T.border}`,
                    borderRadius: 10, padding: "12px 14px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{key}</div>
                    <div style={{ fontSize: 22, fontWeight: 780, color: T.ok }}>{val.covered}<span style={{ fontSize: 14, color: T.text3 }}>/{val.total}</span></div>
                    <div style={{ fontSize: 11, color: val.gaps === 0 ? T.ok : T.warn, marginTop: 2 }}>
                      {val.gaps === 0 ? "No gaps" : `${val.gaps} resolved`}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {Object.entries(bs.coverageBreakdown).map(([area, pct]) => (
                  <ProgressBar
                    key={area}
                    label={area.charAt(0).toUpperCase() + area.slice(1)}
                    value={pct as number}
                  />
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: T.text3 }}>
                Last audit: {new Date(bs.lastAuditAt).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>

          {/* 10. Self-Expansion Log */}
          <SectionHeader title="Self-Expansion Log" />
          <AuditLog
            logs={bs.expansionLog.slice(-20).reverse().map((e: ExpansionEntry) => ({
              message: `[Tick #${e.tick}] [${e.category}] ${e.action}`,
              level: (e.status === "applied" || e.status === "verified") ? "OK" : "Warn",
            }))}
            maxEntries={20}
          />

          {/* 11. Meta-Learning Predictions */}
          <SectionHeader title="Meta-Learning Predictions" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {bs.metaPredictions.map((p: MetaPrediction) => (
              <Card key={p.id} style={{ marginBottom: 0 }}>
                <CardContent>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <StatusPill
                      label={`${p.confidence}%`}
                      variant={p.confidence >= 90 ? "ok" : p.confidence >= 75 ? "blue" : "warn"}
                    />
                    <StatusPill
                      label={p.status}
                      variant={p.status === "validated" ? "ok" : p.status === "integrated" ? "blue" : "neutral"}
                    />
                    <span style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>{p.category}</span>
                  </div>
                  <div style={{ fontWeight: 650, color: T.text1, fontSize: 13, marginBottom: 4 }}>{p.prediction}</div>
                  <div style={{ fontSize: 12, color: T.text3, fontStyle: "italic" }}>Basis: {p.basis}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 12 + 13. Knowledge Sources & Optimization */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 8 }}>
            <div>
              <SectionHeader title="Knowledge Ingestion" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {bs.knowledgeSources.map((ks: KnowledgeSource) => (
                  <Card key={ks.name} style={{ marginBottom: 0 }}>
                    <CardContent>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <StatusPill
                          label={ks.status}
                          variant={ks.status === "active" ? "ok" : ks.status === "degraded" ? "warn" : "danger"}
                        />
                        <span style={{ fontSize: 13, fontWeight: 650, color: T.text1 }}>{ks.name}</span>
                      </div>
                      <div style={{ fontSize: 12, color: T.text3, marginTop: 6 }}>
                        [{ks.type}] · {ks.nodes.toLocaleString()} nodes · synced {new Date(ks.lastSynced).toLocaleTimeString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <SectionHeader title="Optimization Index" />
              <Card>
                <CardContent>
                  {bs.optimization.map((o: OptimizationEntry) => (
                    <ProgressBar key={o.area} label={o.area} value={o.score} />
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
          s === "enforced" ? T.ok : s === "active" ? T.blue : T.warn;
        const statusLabel = (s: MissionPhase["status"]) =>
          s === "enforced" ? "ENFORCED" : s === "active" ? "ACTIVE" : "STANDBY";
        const statusVariant = (s: MissionPhase["status"]): "ok" | "blue" | "warn" =>
          s === "enforced" ? "ok" : s === "active" ? "blue" : "warn";

        return (<>
          <SectionHeader title="Universe-Scale Deployment Mission" />
          <Card>
            <CardHeader
              title={`v${mc.version} · Deployed for ${mc.deployedFor}`}
              subtitle={`Enforced by ${mc.enforcedBy} · Tick #${mc.loopTick}`}
            />
            <CardContent>
              <p style={{ fontStyle: "italic", color: T.text2, marginBottom: 20, fontSize: 13 }}>{mc.goal}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {mc.phases.map((phase: MissionPhase) => (
                  <div key={phase.id} style={{
                    border: `1.5px solid ${statusColor(phase.status)}30`,
                    borderRadius: 12, padding: "14px 16px",
                    background: `${statusColor(phase.status)}06`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{phase.label}</span>
                      <StatusPill label={statusLabel(phase.status)} variant={statusVariant(phase.status)} />
                    </div>
                    <p style={{ fontSize: 12, color: T.text2, margin: "0 0 10px", lineHeight: 1.5 }}>{phase.description}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {Object.entries(phase.settings).map(([key, val]) => (
                        <span key={key} style={{
                          fontSize: 10, padding: "2px 7px", borderRadius: 5, fontWeight: 600,
                          background: val === true ? "#f0fdf4" : val === false ? "#fff1f2" : "#f0f4ff",
                          color:       val === true ? "#166534" : val === false ? "#991b1b" : "#3730a3",
                          border:      `1px solid ${val === true ? "#bbf7d0" : val === false ? "#fecaca" : "#c7d2fe"}`,
                        }}>
                          {key}: {Array.isArray(val) ? val.join(", ") : String(val)}
                        </span>
                      ))}
                    </div>
                    <p style={{ fontSize: 10, color: T.text3, margin: "8px 0 0" }}>
                      {phase.enabledSettingCount}/{phase.activeSettingCount} settings active
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>);
      })()}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{
        marginTop: 36, paddingTop: 16,
        borderTop: `1px solid ${T.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 12, color: T.text3, fontFamily: T.font, flexWrap: "wrap", gap: 8,
      }}>
        <span>CreateAI Brain v100 · {stats.industries.length} industries · {stats.coverage} coverage</span>
        {stats.brainStatus && (
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.ok, display: "inline-block" }} />
            Loop tick #{stats.brainStatus.loopTick} · Auto-enforce: ON
          </span>
        )}
      </div>

    </div>
  );
};

export default CreateAIDashboardApp;
