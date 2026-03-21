/**
 * healthMonitorEngine.ts — Automated Internal Health Monitor
 *
 * Runs every 60 seconds. Polls all internal API endpoints.
 * Stores results in-memory. Exposes status via /api/health-monitor/status.
 *
 * This replaces the "Manual only" state of the Stability Layer automated
 * health checks subsystem. All checks are internal — no external dependencies.
 */

export interface HealthCheckResult {
  endpoint:    string;
  status:      "up" | "degraded" | "down";
  latencyMs:   number;
  statusCode:  number | null;
  checkedAt:   string;
  note?:       string;
}

export interface HealthMonitorState {
  running:       boolean;
  cycleCount:    number;
  lastCycleAt:   string;
  totalChecks:   number;
  passedChecks:  number;
  failedChecks:  number;
  uptime:        number;          // percentage of up checks
  endpoints:     HealthCheckResult[];
}

const ENDPOINTS_TO_MONITOR = [
  { path: "/healthz",                            label: "API Health" },
  { path: "/api/system/health",                  label: "System Health" },
  { path: "/api/system/percentages/score",       label: "Capability Score" },
  { path: "/api/platform-identity",             label: "Platform Identity" },
  { path: "/.well-known/platform-id.json",       label: "Well-Known Identity" },
  { path: "/api/real-market/stats",             label: "Real Market Engine" },
  { path: "/api/wealth/snapshot",               label: "Wealth Engine" },
  { path: "/api/enforcer/stats",                label: "Enforcer" },
  { path: "/api/ads/status",                    label: "Ads Hub" },
  { path: "/api/traction/snapshot",             label: "Traction Engine" },
  { path: "/api/analytics/overview",            label: "Analytics" },
  { path: "/api/leads/stats",                   label: "Lead Capture" },
  { path: "/api/referral/stats",                label: "Referral Loop" },
  { path: "/api/self-host/status",             label: "Self-Host Engine" },
  { path: "/api/platform/report",              label: "Platform Report" },
  { path: "/api/platform-card/meta",           label: "Handle Protocol" },
  { path: "/api/health-monitor/status",        label: "Health Monitor (self)" },
];

const state: HealthMonitorState = {
  running:      false,
  cycleCount:   0,
  lastCycleAt:  "",
  totalChecks:  0,
  passedChecks: 0,
  failedChecks: 0,
  uptime:       100,
  endpoints:    [],
};

const _startedAt = Date.now();

async function checkEndpoint(endpoint: { path: string; label: string }): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(`http://localhost:8080${endpoint.path}`, {
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    const status = res.ok ? "up" : "degraded";
    return {
      endpoint:   endpoint.label,
      status,
      latencyMs,
      statusCode: res.status,
      checkedAt:  new Date().toISOString(),
    };
  } catch {
    const latencyMs = Date.now() - start;
    return {
      endpoint:   endpoint.label,
      status:     "down",
      latencyMs,
      statusCode: null,
      checkedAt:  new Date().toISOString(),
      note:       "No response within 5s",
    };
  }
}

async function runCycle(): Promise<void> {
  state.cycleCount++;
  state.lastCycleAt = new Date().toISOString();

  const SKIP_SELF = state.cycleCount === 1;
  const toCheck = SKIP_SELF
    ? ENDPOINTS_TO_MONITOR.filter(e => e.label !== "Health Monitor (self)")
    : ENDPOINTS_TO_MONITOR;

  const results = await Promise.all(toCheck.map(checkEndpoint));

  state.endpoints = results;
  state.totalChecks  += results.length;
  state.passedChecks += results.filter(r => r.status === "up").length;
  state.failedChecks += results.filter(r => r.status !== "up").length;
  state.uptime = state.totalChecks > 0
    ? Math.round((state.passedChecks / state.totalChecks) * 100)
    : 100;

  const down = results.filter(r => r.status !== "up");
  if (down.length > 0) {
    console.warn(`[HealthMonitor] ⚠️ Cycle #${state.cycleCount} — ${down.length} degraded endpoints: ${down.map(d => d.endpoint).join(", ")}`);
  } else {
    console.log(`[HealthMonitor] ✅ Cycle #${state.cycleCount} — all ${results.length} endpoints up`);
  }
}

export function getHealthMonitorState(): HealthMonitorState & { uptimeSec: number } {
  return { ...state, uptimeSec: Math.floor((Date.now() - _startedAt) / 1000) };
}

export function startHealthMonitor(): void {
  if (state.running) return;
  state.running = true;

  setTimeout(() => {
    runCycle().catch(err => console.error("[HealthMonitor] Cycle error:", err));
    setInterval(() => {
      runCycle().catch(err => console.error("[HealthMonitor] Cycle error:", err));
    }, 60_000);
  }, 3_000);

  console.log("[HealthMonitor] 🟢 Automated health monitoring started — 16 endpoints, 60s interval");
}
