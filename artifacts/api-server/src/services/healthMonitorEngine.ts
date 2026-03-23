/**
 * healthMonitorEngine.ts — Automated Internal Health Monitor
 *
 * Polls all internal API endpoints via localhost. No external URLs.
 * Retry: up to 3 attempts with exponential backoff per endpoint per cycle.
 * Cold-start: first cycle delayed 15s; marks "degraded" only after 2 consecutive failures.
 */

export interface HealthCheckResult {
  endpoint:   string;
  status:     "up" | "degraded" | "down";
  latencyMs:  number;
  statusCode: number | null;
  checkedAt:  string;
  note?:      string;
}

export interface HealthMonitorState {
  running:      boolean;
  cycleCount:   number;
  lastCycleAt:  string;
  totalChecks:  number;
  passedChecks: number;
  failedChecks: number;
  uptime:       number;
  endpoints:    HealthCheckResult[];
}

const ENDPOINTS_TO_MONITOR = [
  { path: "/healthz",                          label: "API Health" },
  { path: "/api/system/health",                label: "System Health" },
  { path: "/api/system/percentages/score",     label: "Capability Score" },
  { path: "/api/platform-identity",            label: "Platform Identity" },
  { path: "/.well-known/platform-id.json",     label: "Well-Known Identity" },
  { path: "/api/real-market/stats",            label: "Real Market Engine" },
  { path: "/api/wealth/snapshot",              label: "Wealth Engine" },
  { path: "/api/enforcer/stats",               label: "Enforcer" },
  { path: "/api/ads/status",                   label: "Ads Hub" },
  { path: "/api/traction/snapshot",            label: "Traction Engine" },
  { path: "/api/analytics/overview",           label: "Analytics" },
  { path: "/api/leads/stats",                  label: "Lead Capture" },
  { path: "/api/referral/stats",               label: "Referral Loop" },
  { path: "/api/self-host/status",             label: "Self-Host Engine" },
  { path: "/api/platform/report",              label: "Platform Report" },
  { path: "/api/platform-card/meta",           label: "Handle Protocol" },
  { path: "/api/health-monitor/status",        label: "Health Monitor (self)" },
];

// Track consecutive failures per endpoint to avoid false positives from transient blips
const consecutiveFailures: Map<string, number> = new Map();

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

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkEndpointWithRetry(
  endpoint: { path: string; label: string },
  maxAttempts = 3,
): Promise<HealthCheckResult> {
  const baseUrl = `http://localhost:${process.env.PORT ?? 8080}`;
  let lastError: string = "Unknown error";
  let lastStatus: number | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}${endpoint.path}`, {
        signal: AbortSignal.timeout(5000),
      });
      const latencyMs = Date.now() - start;

      if (res.ok) {
        consecutiveFailures.set(endpoint.label, 0);
        return {
          endpoint:   endpoint.label,
          status:     "up",
          latencyMs,
          statusCode: res.status,
          checkedAt:  new Date().toISOString(),
        };
      }

      lastStatus = res.status;
      lastError  = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    if (attempt < maxAttempts) {
      await sleep(300 * Math.pow(2, attempt - 1));
    }
  }

  // Only mark degraded/down after 2+ consecutive failures (tolerates transient blips)
  const failures = (consecutiveFailures.get(endpoint.label) ?? 0) + 1;
  consecutiveFailures.set(endpoint.label, failures);

  const status: "degraded" | "down" = failures >= 2 ? "down" : "degraded";

  return {
    endpoint:   endpoint.label,
    status,
    latencyMs:  0,
    statusCode: lastStatus,
    checkedAt:  new Date().toISOString(),
    note:       `${lastError} (${failures} consecutive failure${failures !== 1 ? "s" : ""})`,
  };
}

async function runCycle(): Promise<void> {
  state.cycleCount++;
  state.lastCycleAt = new Date().toISOString();

  const SKIP_SELF = state.cycleCount === 1;
  const toCheck = SKIP_SELF
    ? ENDPOINTS_TO_MONITOR.filter(e => e.label !== "Health Monitor (self)")
    : ENDPOINTS_TO_MONITOR;

  const results = await Promise.all(toCheck.map(e => checkEndpointWithRetry(e)));

  state.endpoints    = results;
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

  // Delay first cycle 15s to allow all routes to finish mounting after cold start
  setTimeout(() => {
    runCycle().catch(err => console.error("[HealthMonitor] Cycle error:", err));
    setInterval(() => {
      runCycle().catch(err => console.error("[HealthMonitor] Cycle error:", err));
    }, 60_000);
  }, 15_000);

  console.log("[HealthMonitor] 🟢 Automated health monitoring started — 17 endpoints, 60s interval (first check in 15s)");
}
