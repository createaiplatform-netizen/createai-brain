import React, { useEffect, useState, useCallback } from "react";
import {
  SectionHeader, Card, CardHeader, CardContent,
  Table, TableHead, TableRow, TableCell,
  BarChart, PieChart, AuditLog, MetricCard, StatusPill,
} from "@/components/StyledComponents";
import {
  fetchSystemStats, triggerWorkflow, notifyFamily, runSimulation,
  type SystemStats, type SimulationResult,
} from "@/services/systemServices";

// ─── Design tokens (mirrored from StyledComponents) ──────────────────────────

const T = {
  accent:  "#6366f1",
  ok:      "#22c55e",
  warn:    "#f59e0b",
  blue:    "#3b82f6",
  text2:   "#475569",
  text3:   "#94a3b8",
  border:  "rgba(15,23,42,0.07)",
  surface: "#ffffff",
  shadow:  "0 1px 3px rgba(15,23,42,0.06), 0 4px 20px rgba(15,23,42,0.04)",
  font:    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif',
  radius:  12,
};

// ─── Button ──────────────────────────────────────────────────────────────────

type BtnVariant = "primary" | "success" | "blue" | "ghost";

function Btn({
  onClick, disabled, children, variant = "primary", fullWidth = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: BtnVariant;
  fullWidth?: boolean;
}) {
  const [hov, setHov] = useState(false);

  const gradients: Record<BtnVariant, [string, string]> = {
    primary: ["#6366f1", "#4f46e5"],
    success: ["#22c55e", "#16a34a"],
    blue:    ["#3b82f6", "#2563eb"],
    ghost:   ["transparent", "transparent"],
  };
  const [c1, c2] = gradients[variant];
  const isGhost = variant === "ghost";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "9px 20px", borderRadius: 9,
        border: isGhost ? `1px solid ${T.border}` : "none",
        background: disabled
          ? "#f1f5f9"
          : hov
            ? `linear-gradient(135deg, ${c1}dd, ${c2})`
            : `linear-gradient(135deg, ${c1}, ${c2})`,
        color: disabled ? T.text3 : isGhost ? T.text2 : "#fff",
        fontWeight: 650, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.18s ease", fontFamily: T.font, letterSpacing: "-0.1px",
        boxShadow: disabled || isGhost ? "none"
          : hov ? `0 4px 16px ${c1}55` : `0 2px 8px ${c1}33`,
        transform: hov && !disabled ? "translateY(-1px)" : "translateY(0)",
        width: fullWidth ? "100%" : undefined,
      }}
    >
      {children}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InfiniteBrainControlPanel() {
  const [stats, setStats]           = useState<SystemStats | null>(null);
  const [logs, setLogs]             = useState<{ message: string; level: "OK" | "Warn" | "Blocked" }[]>([]);
  const [simResult, setSimResult]   = useState<SimulationResult | null>(null);
  const [simScale, setSimScale]     = useState(1);
  const [loading, setLoading]       = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const addLog = useCallback((message: string, level: "OK" | "Warn" | "Blocked" = "OK") => {
    setLogs(prev => [
      { message: `${new Date().toLocaleTimeString()} — ${message}`, level },
      ...prev,
    ].slice(0, 50));
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await fetchSystemStats();
      setStats(data);
      setLastUpdated(new Date().toLocaleTimeString());
      if (data.auditLog?.length) {
        setLogs(prev => {
          const fresh = data.auditLog.slice(0, 5);
          const merged = [...fresh, ...prev].slice(0, 50);
          return merged;
        });
      }
    } catch {
      addLog("Failed to fetch system stats", "Warn");
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5_000);
    return () => clearInterval(id);
  }, [load]);

  const handleLaunchAll = async () => {
    setActionBusy(true);
    try {
      await triggerWorkflow({ enforce100PercentMode: true });
      addLog("All workflows triggered — 100% enforcement mode active");
    } catch {
      addLog("Failed to trigger workflows", "Warn");
    } finally {
      setActionBusy(false);
    }
  };

  const handleNotifyFamily = async () => {
    setActionBusy(true);
    try {
      const r = await notifyFamily({
        subject: "Infinite Brain Live",
        message: "All workflows and dashboard are now upgraded to world-class and fully live.",
      });
      addLog(r.sent
        ? "Family notified via email + SMS"
        : "Notification queued (set RESEND_API_KEY to activate)");
    } catch {
      addLog("Failed to send family notification", "Warn");
    } finally {
      setActionBusy(false);
    }
  };

  const handleSimulation = async () => {
    try {
      const r = await runSimulation(simScale);
      setSimResult(r);
      addLog(`Simulation at ${simScale}x → $${r.projectedSavingsM}M projected savings`);
    } catch {
      addLog("Simulation failed", "Warn");
    }
  };

  return (
    <div style={{
      padding: "24px 24px 40px",
      fontFamily: T.font,
      background: "#f8fafc",
      minHeight: "100%",
      overflowY: "auto",
    }}>

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        borderRadius: 16, padding: "24px 28px", marginBottom: 24,
        boxShadow: "0 8px 32px rgba(99,102,241,0.30)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 780, color: "#fff", letterSpacing: "-0.4px" }}>
              Infinite Brain Control Panel
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
              Real-time monitoring · enforcement · family notifications · infinite expansion
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#4ade80", display: "inline-block",
              boxShadow: "0 0 8px rgba(74,222,128,0.8)",
            }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
              {loading ? "Connecting…" : `Live · ${lastUpdated}`}
            </span>
          </div>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────────────── */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
          <MetricCard label="Coverage" value={stats.coverage} sub="All industries active" accent />
          <MetricCard label="CPU Opt." value={`${stats.cpu}%`} sub="Infrastructure" />
          <MetricCard label="Memory Opt." value={`${stats.memory}%`} sub="API layer" />
          <MetricCard label="Max Users" value={stats.maxUsers.toLocaleString()} sub="Concurrent capacity" />
          <MetricCard label="Endpoints" value={stats.activeWorkflows} sub="Active workflows" />
        </div>
      )}

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader title="Command Center" subtitle="Trigger workflows and notify all family members" />
        <CardContent>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <Btn onClick={handleLaunchAll} disabled={actionBusy} variant="primary">
              🚀 Launch All Workflows (100% Mode)
            </Btn>
            <Btn onClick={handleNotifyFamily} disabled={actionBusy} variant="success">
              🔔 Notify Family Now
            </Btn>
          </div>
          <p style={{ fontSize: 12, color: T.text3, margin: 0 }}>
            Family notifications require <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>RESEND_API_KEY</code> to be set in environment secrets.
          </p>
        </CardContent>
      </Card>

      {/* ── System Health ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader title="System Health" subtitle="Live metrics — refreshes every 5 seconds" />
        <CardContent>
          {loading
            ? <p style={{ color: T.text3, fontSize: 13 }}>Loading…</p>
            : stats && (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <tbody>
                  {[
                    { label: "CPU Optimization",    val: `${stats.cpu}%`,                    ok: stats.cpu > 60 },
                    { label: "Memory Optimization", val: `${stats.memory}%`,                  ok: stats.memory > 60 },
                    { label: "Max Concurrent Users",val: stats.maxUsers.toLocaleString(),     ok: true },
                    { label: "Active Endpoints",    val: String(stats.activeWorkflows),        ok: stats.activeWorkflows > 0 },
                    { label: "Coverage",            val: stats.coverage,                       ok: stats.coverage === "100%" },
                    { label: "Overall Health",      val: stats.overall ? "All Systems Go" : "Issues Detected", ok: stats.overall },
                  ].map(r => (
                    <TableRow key={r.label}>
                      <TableCell>{r.label}</TableCell>
                      <TableCell style={{ fontWeight: 650, color: "#0f172a" }}>{r.val}</TableCell>
                      <TableCell>
                        <StatusPill label={r.ok ? "OK" : "Warn"} variant={r.ok ? "ok" : "warn"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            )
          }
        </CardContent>
      </Card>

      {/* ── Simulation ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader title="Infinite Expansion Simulation" subtitle="Project savings and industry growth at any scale factor" />
        <CardContent>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <label style={{ fontSize: 13, fontWeight: 650, color: T.text2 }}>Scale Factor</label>
            <select
              value={simScale}
              onChange={e => setSimScale(Number(e.target.value))}
              style={{
                padding: "8px 12px", borderRadius: 8,
                border: `1px solid ${T.border}`, background: T.surface,
                fontSize: 13, color: "#0f172a", fontFamily: T.font, outline: "none",
              }}
            >
              {[1, 2, 5, 10, 20, 50, 100].map(n => (
                <option key={n} value={n}>{n}x</option>
              ))}
            </select>
            <Btn onClick={handleSimulation} variant="blue">Run Simulation</Btn>
          </div>

          {simResult && (
            <div style={{
              background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 10, padding: "16px 20px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 12 }}>
                Simulation Result — {simResult.scaleFactor}x Scale
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
                {[
                  { label: "Annual Savings",  val: `$${simResult.projectedSavingsM}M`, hi: true },
                  { label: "Industries",      val: simResult.expansionIndustries },
                  { label: "New Workflows",   val: simResult.newWorkflows.toLocaleString() },
                  { label: "Coverage",        val: simResult.coverageRetained },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, letterSpacing: "0.3px", textTransform: "uppercase" }}>{m.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 780, color: "#15803d", letterSpacing: "-0.3px" }}>{m.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card style={{ marginBottom: 0 }}>
          <CardHeader title="Compute Savings" subtitle="$M / category" />
          <CardContent>
            {stats
              ? <BarChart data={stats.computeSavings} xKey="name" yKey="value" height={200} colorScheme={[T.accent]} />
              : <p style={{ color: T.text3, fontSize: 13 }}>Loading…</p>
            }
          </CardContent>
        </Card>
        <Card style={{ marginBottom: 0 }}>
          <CardHeader title="Environmental Impact" subtitle="Energy distribution %" />
          <CardContent>
            {stats
              ? <PieChart data={stats.environmentalImpact} valueKey="value" labelKey="name" colors={[T.ok, T.blue, T.warn]} height={200} />
              : <p style={{ color: T.text3, fontSize: 13 }}>Loading…</p>
            }
          </CardContent>
        </Card>
      </div>
      <div style={{ marginBottom: 16 }} />

      {/* ── Audit Log ──────────────────────────────────────────────────────── */}
      <SectionHeader title="Real-Time Audit Log" />
      <AuditLog logs={logs} maxEntries={20} />

    </div>
  );
}
