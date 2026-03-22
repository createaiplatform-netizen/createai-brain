/**
 * observability.ts — Real-time Error Observability Dashboard
 *
 * GET  /api/system/errors              — JSON list of recent captured errors
 * POST /api/system/errors              — ingest an error event (internal use)
 * DELETE /api/system/errors            — clear error log (owner only)
 * GET  /api/system/errors/dashboard    — HTML live error dashboard
 * GET  /api/system/metrics             — process metrics (memory, uptime, event loop)
 */

import { Router, type Request, type Response } from "express";

const router = Router();

// ─── In-Memory Error Ring Buffer ──────────────────────────────────────────────

interface ErrorEvent {
  id:         string;
  ts:         string;          // ISO timestamp
  severity:   "low" | "medium" | "high" | "critical";
  message:    string;
  stack?:     string;
  route?:     string;
  method?:    string;
  statusCode?: number;
  userId?:    string;
  meta?:      Record<string, unknown>;
}

const MAX_EVENTS = 200;
const errorRing: ErrorEvent[] = [];
let errorIdSeq = 0;

export function captureError(
  message: string,
  opts: Partial<Omit<ErrorEvent, "id" | "ts" | "message">> = {},
): ErrorEvent {
  const event: ErrorEvent = {
    id:         String(++errorIdSeq),
    ts:         new Date().toISOString(),
    severity:   opts.severity ?? "medium",
    message,
    stack:      opts.stack,
    route:      opts.route,
    method:     opts.method,
    statusCode: opts.statusCode,
    userId:     opts.userId,
    meta:       opts.meta,
  };
  errorRing.push(event);
  if (errorRing.length > MAX_EVENTS) errorRing.shift();
  return event;
}

// ─── Express Error Middleware (attach to app) ─────────────────────────────────

export function observabilityErrorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: (err: unknown) => void,
): void {
  captureError(err.message, {
    severity:   "high",
    stack:      err.stack,
    route:      req.path,
    method:     req.method,
    statusCode: 500,
  });
  next(err);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/", (_req: Request, res: Response) => {
  const bySeverity = {
    critical: errorRing.filter(e => e.severity === "critical").length,
    high:     errorRing.filter(e => e.severity === "high").length,
    medium:   errorRing.filter(e => e.severity === "medium").length,
    low:      errorRing.filter(e => e.severity === "low").length,
  };
  res.json({
    ok:         true,
    total:      errorRing.length,
    bySeverity,
    events:     [...errorRing].reverse().slice(0, 50),
  });
});

router.post("/", (req: Request, res: Response) => {
  const { message, severity, route, stack, meta } = req.body as Partial<ErrorEvent>;
  if (!message) { res.status(400).json({ ok: false, error: "message required" }); return; }
  const event = captureError(String(message), { severity: severity ?? "medium", route, stack, meta });
  res.json({ ok: true, event });
});

router.delete("/", (_req: Request, res: Response) => {
  errorRing.length = 0;
  errorIdSeq = 0;
  res.json({ ok: true, message: "Error log cleared." });
});

router.get("/metrics", (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  res.json({
    ok:         true,
    uptime:     Math.floor(process.uptime()),
    memory: {
      rss:          mem.rss,
      heapUsed:     mem.heapUsed,
      heapTotal:    mem.heapTotal,
      external:     mem.external,
    },
    platform:   process.platform,
    nodeVersion: process.version,
    pid:         process.pid,
    env:         process.env["NODE_ENV"] ?? "development",
  });
});

// ─── HTML Dashboard ───────────────────────────────────────────────────────────

router.get("/dashboard", (_req: Request, res: Response) => {
  const now = new Date().toISOString();
  const bySeverity = {
    critical: errorRing.filter(e => e.severity === "critical").length,
    high:     errorRing.filter(e => e.severity === "high").length,
    medium:   errorRing.filter(e => e.severity === "medium").length,
    low:      errorRing.filter(e => e.severity === "low").length,
  };
  const recentErrors = [...errorRing].reverse().slice(0, 100);

  const severityColor = (s: string) => {
    if (s === "critical") return "#dc2626";
    if (s === "high")     return "#f97316";
    if (s === "medium")   return "#eab308";
    return "#22c55e";
  };

  const errorRows = recentErrors.length === 0
    ? `<tr><td colspan="6" style="text-align:center;color:#64748b;padding:24px">No errors captured yet — system healthy</td></tr>`
    : recentErrors.map(e => `
      <tr>
        <td style="color:#94a3b8;font-size:.72rem">${e.ts.replace("T", " ").replace("Z", "")}</td>
        <td><span style="background:${severityColor(e.severity)}22;color:${severityColor(e.severity)};padding:2px 8px;border-radius:99px;font-size:.62rem;font-weight:800;text-transform:uppercase">${e.severity}</span></td>
        <td style="color:#e2e8f0;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${e.message.replace(/"/g, "&quot;")}">${e.message}</td>
        <td style="color:#64748b;font-size:.72rem">${e.method ?? "—"} ${e.route ?? "—"}</td>
        <td style="color:#64748b;font-size:.72rem">${e.statusCode ?? "—"}</td>
        <td style="color:#475569;font-size:.65rem;max-width:120px;overflow:hidden;text-overflow:ellipsis">#${e.id}</td>
      </tr>
    `).join("");

  const mem = process.memoryUsage();
  const heapMB = Math.round(mem.heapUsed / 1024 / 1024);
  const rssMB  = Math.round(mem.rss / 1024 / 1024);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="refresh" content="20">
  <title>Error Observability — CreateAI Brain</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',system-ui,sans-serif;background:#020617;color:#e2e8f0;-webkit-font-smoothing:antialiased;min-height:100vh}
    a.skip{position:absolute;top:-40px;left:0;background:#6366f1;color:#fff;padding:8px 16px;text-decoration:none;font-size:.8rem;border-radius:0 0 8px 0;transition:top .15s}
    a.skip:focus{top:0}
    header{border-bottom:1px solid rgba(255,255,255,.08);padding:0 24px;height:52px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;background:rgba(2,6,23,.97);backdrop-filter:blur(12px)}
    .logo{font-size:1rem;font-weight:900;letter-spacing:-.03em;color:#e2e8f0;text-decoration:none}
    .logo span{color:#818cf8}
    .badge{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8}
    .wrap{max-width:1100px;margin:0 auto;padding:32px 24px}
    h1{font-size:1.4rem;font-weight:900;letter-spacing:-.04em;margin-bottom:4px}
    .sub{font-size:.8rem;color:#64748b;margin-bottom:28px}
    .stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-bottom:28px}
    .stat-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:16px 20px}
    .stat-label{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#64748b;margin-bottom:6px}
    .stat-val{font-size:1.6rem;font-weight:900;letter-spacing:-.04em}
    table{width:100%;border-collapse:collapse;font-size:.78rem}
    th{text-align:left;font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#64748b;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.07)}
    td{padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.04);vertical-align:middle}
    tr:hover td{background:rgba(255,255,255,.02)}
    .section{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;overflow:hidden;margin-bottom:24px}
    .section-hd{padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.06);font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8}
    .sys-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}
    .sys-item{padding:12px 20px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;justify-content:space-between;align-items:center}
    .sys-label{font-size:.72rem;color:#64748b}
    .sys-val{font-size:.8rem;font-weight:700;color:#e2e8f0}
    .refresh-note{font-size:.65rem;color:#334155;text-align:right;margin-bottom:16px}
  </style>
</head>
<body>
<a href="#main" class="skip">Skip to main content</a>
<header>
  <a href="/nexus" class="logo">CreateAI <span>Brain</span></a>
  <span class="badge">Error Observability · Live</span>
</header>
<main id="main" class="wrap" aria-live="polite">
  <h1>Error Observability</h1>
  <p class="sub">Auto-refreshes every 20 seconds. Showing last ${MAX_EVENTS} captured events. Generated ${now}</p>
  <p class="refresh-note">Page auto-refreshes every 20 s</p>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-label">Total Events</div>
      <div class="stat-val" style="color:#e2e8f0">${errorRing.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Critical</div>
      <div class="stat-val" style="color:#dc2626">${bySeverity.critical}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">High</div>
      <div class="stat-val" style="color:#f97316">${bySeverity.high}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Medium</div>
      <div class="stat-val" style="color:#eab308">${bySeverity.medium}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Low</div>
      <div class="stat-val" style="color:#22c55e">${bySeverity.low}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Heap Used</div>
      <div class="stat-val" style="color:#818cf8">${heapMB} MB</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">RSS Memory</div>
      <div class="stat-val" style="color:#94a3b8">${rssMB} MB</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Uptime</div>
      <div class="stat-val" style="color:#22c55e">${Math.floor(process.uptime() / 60)} min</div>
    </div>
  </div>

  <div class="section">
    <div class="section-hd">System Health</div>
    <div class="sys-grid">
      <div class="sys-item"><span class="sys-label">Node Version</span><span class="sys-val">${process.version}</span></div>
      <div class="sys-item"><span class="sys-label">Platform</span><span class="sys-val">${process.platform}</span></div>
      <div class="sys-item"><span class="sys-label">PID</span><span class="sys-val">${process.pid}</span></div>
      <div class="sys-item"><span class="sys-label">Environment</span><span class="sys-val">${process.env["NODE_ENV"] ?? "development"}</span></div>
      <div class="sys-item"><span class="sys-label">Heap Total</span><span class="sys-val">${Math.round(mem.heapTotal / 1024 / 1024)} MB</span></div>
      <div class="sys-item"><span class="sys-label">External</span><span class="sys-val">${Math.round(mem.external / 1024 / 1024)} MB</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-hd">Recent Error Events (${recentErrors.length})</div>
    <div style="overflow-x:auto">
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Severity</th>
            <th>Message</th>
            <th>Route</th>
            <th>Status</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody aria-label="Error event log">
          ${errorRows}
        </tbody>
      </table>
    </div>
  </div>
</main>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

export default router;
