/**
 * runGlobalPulse.ts — GlobalPulse Execution Module
 *
 * Orchestrates a full platform-wide alert run:
 *   1. Fetch all nodes from /api/system/nodes
 *   2. Trigger alerts for every node in parallel
 *   3. Run tasks A–J in parallel, each with up to MAX_RETRIES attempts
 *   4. Build a full report and persist it to /api/system/global-alert-log
 *
 * Usage:
 *   BASE_URL=http://localhost:8080 npx tsx src/runGlobalPulse.ts
 *
 * The server must be running and the PULSE_API_KEY env var must match
 * a founder-role session cookie, or this must be invoked server-side
 * where authentication is bypassed via internal loopback.
 */

const MAX_RETRIES = 3;
const BASE_URL    = process.env["BASE_URL"] ?? "http://localhost:8080";
const COOKIE      = process.env["PULSE_COOKIE"] ?? "";

const HEADERS = {
  "Content-Type": "application/json",
  ...(COOKIE ? { Cookie: COOKIE } : {}),
};

interface NodeEntry {
  id:     string;
  name:   string;
  type:   string;
  status: string;
}

interface AlertPayload {
  title:    string;
  message:  string;
  priority: string;
  actions:  string[];
}

interface AlertResult {
  nodeId:         string;
  ok:             boolean;
  devicesReached: number;
  devicesTotal:   number;
  durationMs:     number;
  error?:         string;
}

interface TaskOutcome {
  task:    string;
  success: boolean;
  result?: unknown;
  error?:  string;
}

// ─── Step 1: Fetch all nodes ──────────────────────────────────────────────────

async function fetchNodes(): Promise<NodeEntry[]> {
  const res = await fetch(`${BASE_URL}/api/system/nodes`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Failed to fetch nodes: ${res.status}`);
  const data = await res.json() as { nodes: NodeEntry[] };
  return data.nodes ?? [];
}

// ─── Step 2: Send alert to a node ────────────────────────────────────────────

async function sendAlertToNode(node: NodeEntry, alertPayload: AlertPayload): Promise<AlertResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/system/alert-test`, {
      method:  "POST",
      headers: HEADERS,
      body:    JSON.stringify({ testNode: node.id, production: true, payload: alertPayload }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as AlertResult;
    return { ...data, nodeId: node.id, ok: true, durationMs: Date.now() - start };
  } catch (err) {
    return { nodeId: node.id, ok: false, devicesReached: 0, devicesTotal: 0, durationMs: Date.now() - start, error: (err as Error).message };
  }
}

// ─── Step 3: Run a task with retry ───────────────────────────────────────────

async function runTaskWithRetry(task: { id: number; name: string }): Promise<TaskOutcome> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api/task/${task.id}`, {
        method:  "POST",
        headers: HEADERS,
        body:    JSON.stringify({ platformWide: true }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { task: task.name, success: true, result: data };
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        return { task: task.name, success: false, error: (err as Error).message };
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return { task: task.name, success: false, error: "Max retries exceeded" };
}

// ─── Step 4: Execute GlobalPulse ─────────────────────────────────────────────

export async function runGlobalPulse(): Promise<void> {
  console.log("[GlobalPulse] Starting platform-wide alert orchestration…");

  const alertPayload: AlertPayload = {
    title:    "Global Alert",
    message:  "This is a platform-wide alert.",
    priority: "high",
    actions:  ["open_app", "view_dashboard"],
  };

  // Fetch nodes
  const nodes = await fetchNodes();
  console.log(`[GlobalPulse] ${nodes.length} node(s) found — triggering alerts in parallel…`);

  // Trigger alerts for all nodes in parallel
  const alertResults = await Promise.all(nodes.map(n => sendAlertToNode(n, alertPayload)));
  const alertOk      = alertResults.filter(r => r.ok).length;
  console.log(`[GlobalPulse] Alerts complete — ${alertOk}/${nodes.length} nodes reached`);

  // Run tasks A–J in parallel, each with MAX_RETRIES
  const tasks = Array.from({ length: 10 }, (_, i) => ({
    id:   i + 1,
    name: `Task ${String.fromCharCode(65 + i)}`,
  }));
  console.log("[GlobalPulse] Running 10 platform tasks with retry…");
  const taskResults = await Promise.all(tasks.map(runTaskWithRetry));
  const taskOk      = taskResults.filter(r => r.success).length;
  console.log(`[GlobalPulse] Tasks complete — ${taskOk}/10 succeeded`);

  // Build full report
  const report = {
    timestamp:    new Date().toISOString(),
    nodesTested:  nodes.length,
    alertResults,
    taskResults,
  };

  console.log("\n[GlobalPulse] Full report:\n" + JSON.stringify(report, null, 2));

  // Persist report
  const logRes = await fetch(`${BASE_URL}/api/system/global-alert-log`, {
    method:  "POST",
    headers: HEADERS,
    body:    JSON.stringify(report),
  });
  if (logRes.ok) {
    const saved = await logRes.json() as { id: number; successRate: string };
    console.log(`[GlobalPulse] ✅ Report persisted — id:${saved.id} · successRate:${saved.successRate}`);
  } else {
    console.warn("[GlobalPulse] ⚠️  Report persist failed:", logRes.status);
  }
}

// ─── Run when executed directly ───────────────────────────────────────────────

runGlobalPulse().catch(err => {
  console.error("[GlobalPulse] Fatal error:", (err as Error).message);
  process.exit(1);
});
