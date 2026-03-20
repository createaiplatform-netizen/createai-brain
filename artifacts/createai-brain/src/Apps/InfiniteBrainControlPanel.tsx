import React, { useEffect, useState, useCallback } from "react";
import {
  SectionHeader, Card, CardHeader, CardContent,
  Table, TableHead, TableRow, TableCell,
  BarChart, PieChart, AuditLog,
} from "@/components/StyledComponents";
import {
  fetchSystemStats, triggerWorkflow, notifyFamily, runSimulation,
  type SystemStats, type SimulationResult,
} from "@/services/systemServices";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Btn({
  onClick, disabled, children, color = "#6366f1",
}: { onClick: () => void; disabled?: boolean; children: React.ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 18px", borderRadius: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "#e5e7eb" : color, color: disabled ? "#9ca3af" : "#fff",
        fontWeight: 600, fontSize: 13, marginRight: 10,
      }}
    >
      {children}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InfiniteBrainControlPanel() {
  const [stats, setStats]             = useState<SystemStats | null>(null);
  const [logs, setLogs]               = useState<{ message: string; level: "OK" | "Warn" | "Blocked" }[]>([]);
  const [simResult, setSimResult]     = useState<SimulationResult | null>(null);
  const [simScale, setSimScale]       = useState(1);
  const [loading, setLoading]         = useState(true);
  const [actionBusy, setActionBusy]   = useState(false);

  const addLog = useCallback((message: string, level: "OK" | "Warn" | "Blocked" = "OK") => {
    setLogs(prev => [{ message: `${new Date().toLocaleTimeString()} — ${message}`, level }, ...prev].slice(0, 50));
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await fetchSystemStats();
      setStats(data);
      if (data.auditLog?.length) setLogs(data.auditLog.slice(0, 10));
    } catch {
      addLog("Failed to fetch system stats", "Warn");
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    load();
    const interval = setInterval(load, 5_000);
    return () => clearInterval(interval);
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
      const result = await notifyFamily({
        subject: "Brain Control Panel Activated",
        message: "Hello! Sara's CreateAI Brain Control Panel is live and active. All systems are running at 100% coverage.",
      });
      addLog(result.sent ? "Family notified successfully via email" : "Notification queued (credentials pending)");
    } catch {
      addLog("Failed to send family notification", "Warn");
    } finally {
      setActionBusy(false);
    }
  };

  const handleSimulation = async () => {
    try {
      const result = await runSimulation(simScale);
      setSimResult(result);
      addLog(`Simulation run at ${simScale}x scale — $${result.projectedSavingsM}M projected savings`);
    } catch {
      addLog("Simulation failed", "Warn");
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "SF Pro, Helvetica, sans-serif", background: "#f5f5f7", minHeight: "100%", overflowY: "auto" }}>

      <SectionHeader title="Infinite Brain Control Panel" />
      <p style={{ fontSize: 13, color: "#888", marginTop: -8, marginBottom: 20 }}>
        Real-time monitoring · enforcement · notifications · meta-learning · simulation
      </p>

      {/* System Stats */}
      <Card>
        <CardHeader title="System Stats & Health" />
        <CardContent>
          {loading
            ? <p style={{ color: "#888", fontSize: 13 }}>Loading…</p>
            : stats && (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <tbody>
                  <TableRow><TableCell>CPU Optimization</TableCell><TableCell>{stats.cpu}%</TableCell></TableRow>
                  <TableRow><TableCell>Memory Optimization</TableCell><TableCell>{stats.memory}%</TableCell></TableRow>
                  <TableRow><TableCell>Max Concurrent Users</TableCell><TableCell>{stats.maxUsers.toLocaleString()}</TableCell></TableRow>
                  <TableRow><TableCell>Active Endpoints</TableCell><TableCell>{stats.activeWorkflows}</TableCell></TableRow>
                  <TableRow><TableCell>System Coverage</TableCell><TableCell>{stats.coverage}</TableCell></TableRow>
                  <TableRow>
                    <TableCell>Overall Health</TableCell>
                    <TableCell style={{ color: stats.overall ? "#34c759" : "#ff3b30", fontWeight: 700 }}>
                      {stats.overall ? "✓ All Systems Go" : "⚠ Issues Detected"}
                    </TableCell>
                  </TableRow>
                </tbody>
              </Table>
            )
          }
        </CardContent>
      </Card>

      {/* Launch & Notify */}
      <Card>
        <CardHeader title="Launch & Notifications" />
        <CardContent>
          <Btn onClick={handleLaunchAll} disabled={actionBusy} color="#6366f1">
            Launch All Workflows (100% Mode)
          </Btn>
          <Btn onClick={handleNotifyFamily} disabled={actionBusy} color="#34c759">
            Notify Family
          </Btn>
          <p style={{ fontSize: 11, color: "#888", marginTop: 10 }}>
            Notifications require RESEND_API_KEY secret to be set.
          </p>
        </CardContent>
      </Card>

      {/* Meta-Learning & Simulation */}
      <Card>
        <CardHeader title="Meta-Learning & Infinite Expansion Simulation" />
        <CardContent>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Scale Factor:</label>
            <select
              value={simScale}
              onChange={e => setSimScale(Number(e.target.value))}
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
            >
              {[1, 2, 5, 10, 20, 50, 100].map(n => (
                <option key={n} value={n}>{n}x</option>
              ))}
            </select>
            <Btn onClick={handleSimulation} color="#0a84ff">Run Simulation</Btn>
          </div>

          {simResult && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Output</TableCell>
                  <TableCell>Projected Value</TableCell>
                </TableRow>
              </TableHead>
              <tbody>
                <TableRow><TableCell>Scale Factor</TableCell><TableCell>{simResult.scaleFactor}x</TableCell></TableRow>
                <TableRow><TableCell>Projected Annual Savings</TableCell><TableCell style={{ fontWeight: 700, color: "#34c759" }}>${simResult.projectedSavingsM}M</TableCell></TableRow>
                <TableRow><TableCell>Expanded Industries</TableCell><TableCell>{simResult.expansionIndustries}</TableCell></TableRow>
                <TableRow><TableCell>New Workflows</TableCell><TableCell>{simResult.newWorkflows.toLocaleString()}</TableCell></TableRow>
                <TableRow><TableCell>Coverage Retained</TableCell><TableCell>{simResult.coverageRetained}</TableCell></TableRow>
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Compute & Environmental */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <CardHeader title="Compute Savings ($M)" />
          <CardContent>
            {stats && <BarChart data={stats.computeSavings} xKey="name" yKey="value" height={180} colorScheme={["#6366f1"]} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Environmental Impact" />
          <CardContent>
            {stats && <PieChart data={stats.environmentalImpact} valueKey="value" labelKey="name" colors={["#34c759", "#0a84ff", "#ffcc00"]} height={180} />}
          </CardContent>
        </Card>
      </div>

      {/* Audit Log */}
      <Card>
        <CardHeader title="Real-Time Audit Log" />
        <CardContent>
          <AuditLog logs={logs} maxEntries={20} />
        </CardContent>
      </Card>

    </div>
  );
}
