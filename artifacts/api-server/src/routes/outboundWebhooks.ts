/**
 * routes/outboundWebhooks.ts — Outbound Webhook Delivery Engine
 * ──────────────────────────────────────────────────────────────
 * Delivers signed platform events to external endpoints.
 * HMAC-SHA256 signed, with delivery logging and event filtering.
 *
 * Routes:
 *   GET    /api/webhooks/endpoints           List registered endpoints
 *   POST   /api/webhooks/endpoints           Register new endpoint
 *   GET    /api/webhooks/endpoints/:id       Get endpoint
 *   PUT    /api/webhooks/endpoints/:id       Update endpoint
 *   DELETE /api/webhooks/endpoints/:id       Delete endpoint
 *   POST   /api/webhooks/endpoints/:id/test  Send test delivery
 *   GET    /api/webhooks/deliveries          Delivery log
 *   GET    /api/webhooks/deliveries/:id      Single delivery
 *   POST   /api/webhooks/deliver             Internal: deliver event to all matching endpoints
 *   GET    /api/webhooks/status              Engine status
 *   GET    /api/webhooks/dashboard           HTML dashboard
 */

import { Router, type Request, type Response } from "express";
import { createHmac }                           from "crypto";
import { sql }                                  from "@workspace/db";
import { requireAuth }                          from "../middlewares/requireAuth.js";

const router = Router();

const SUPPORTED_EVENTS = [
  "lead.created", "lead.updated", "project.created", "project.updated",
  "patient.created", "legal_client.created", "candidate.created",
  "opportunity.won", "opportunity.lost",
  "invoice.paid", "subscription.created", "subscription.cancelled",
  "automation.fired", "ai.completed", "platform.alert",
  "user.registered", "user.login",
  "*",
] as const;

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS platform_webhook_endpoints (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      url         TEXT NOT NULL,
      secret      TEXT NOT NULL,
      events      TEXT[] NOT NULL DEFAULT '{*}',
      enabled     BOOLEAN NOT NULL DEFAULT true,
      description TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS platform_webhook_deliveries (
      id            SERIAL PRIMARY KEY,
      endpoint_id   INTEGER REFERENCES platform_webhook_endpoints(id) ON DELETE CASCADE,
      event_type    TEXT NOT NULL,
      payload       JSONB NOT NULL DEFAULT '{}',
      http_status   INTEGER,
      response_body TEXT,
      duration_ms   INTEGER,
      success       BOOLEAN NOT NULL DEFAULT false,
      error         TEXT,
      delivered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_wh_del_endpoint ON platform_webhook_deliveries(endpoint_id, delivered_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_wh_del_event    ON platform_webhook_deliveries(event_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_wh_ep_enabled   ON platform_webhook_endpoints(enabled)`;
}

ensureTables().catch(() => {});

// ─── Sign payload with HMAC-SHA256 ───────────────────────────────────────────
function signPayload(secret: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

// ─── Deliver to a single endpoint ────────────────────────────────────────────
async function deliverToEndpoint(
  endpoint: { id: number; url: string; secret: string },
  eventType: string,
  payload: Record<string, unknown>
): Promise<{ success: boolean; status: number; duration: number }> {
  const body     = JSON.stringify({ event: eventType, timestamp: new Date().toISOString(), data: payload });
  const sig      = signPayload(endpoint.secret, body);
  const started  = Date.now();

  let httpStatus = 0;
  let responseBody = "";
  let success    = false;
  let error: string | null = null;

  try {
    const resp = await fetch(endpoint.url, {
      method:  "POST",
      headers: {
        "Content-Type":        "application/json",
        "X-CreateAI-Event":    eventType,
        "X-CreateAI-Signature": sig,
        "X-CreateAI-Timestamp": String(Date.now()),
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });

    httpStatus   = resp.status;
    responseBody = await resp.text().catch(() => "");
    success      = resp.ok;
  } catch (e) {
    error = String(e);
  }

  const duration = Date.now() - started;

  await sql`
    INSERT INTO platform_webhook_deliveries
      (endpoint_id, event_type, payload, http_status, response_body, duration_ms, success, error)
    VALUES (
      ${endpoint.id}, ${eventType}, ${body}::jsonb,
      ${httpStatus || null}, ${responseBody || null}, ${duration}, ${success}, ${error}
    )
  `.catch(() => {});

  return { success, status: httpStatus, duration };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/deliver — internal event delivery to all matching endpoints
// ─────────────────────────────────────────────────────────────────────────────
router.post("/deliver", async (req: Request, res: Response) => {
  const { eventType, payload } = req.body as {
    eventType?: string; payload?: Record<string, unknown>;
  };

  if (!eventType || !payload) {
    res.status(400).json({ error: "eventType and payload are required" }); return;
  }

  const endpoints = await sql`
    SELECT * FROM platform_webhook_endpoints
    WHERE enabled = true
    AND (${eventType} = ANY(events) OR '*' = ANY(events))
  `.catch(() => []);

  const results: Array<{ endpointId: number; success: boolean; status: number; duration: number }> = [];

  for (const ep of endpoints as Array<{ id: number; url: string; secret: string }>) {
    const r = await deliverToEndpoint(ep, eventType, payload);
    results.push({ endpointId: ep.id, ...r });
  }

  res.json({ ok: true, delivered: results.length, results });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/webhooks/endpoints
// ─────────────────────────────────────────────────────────────────────────────
router.get("/endpoints", requireAuth, async (_req: Request, res: Response) => {
  const eps = await sql`
    SELECT id, name, url, events, enabled, description, created_at,
           LEFT(secret, 8) || '****' AS secret_preview
    FROM platform_webhook_endpoints ORDER BY created_at DESC
  `.catch(() => []);
  res.json({ ok: true, endpoints: eps, count: eps.length });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/endpoints
// ─────────────────────────────────────────────────────────────────────────────
router.post("/endpoints", requireAuth, async (req: Request, res: Response) => {
  const { name, url, secret, events, description, enabled } = req.body as {
    name?: string; url?: string; secret?: string;
    events?: string[]; description?: string; enabled?: boolean;
  };

  if (!name || !url) {
    res.status(400).json({ error: "name and url are required" }); return;
  }

  try { new URL(url); } catch {
    res.status(400).json({ error: "Invalid URL format" }); return;
  }

  const resolvedSecret = secret ?? createHmac("sha256", String(Math.random())).update(url).digest("hex");
  const resolvedEvents = events?.length ? events : ["*"];

  const [ep] = await sql`
    INSERT INTO platform_webhook_endpoints (name, url, secret, events, description, enabled)
    VALUES (${name}, ${url}, ${resolvedSecret}, ${resolvedEvents}, ${description ?? null}, ${enabled !== false})
    RETURNING id, name, url, events, enabled, created_at
  `;

  res.status(201).json({ ok: true, endpoint: ep, secret: resolvedSecret });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/webhooks/endpoints/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get("/endpoints/:id", requireAuth, async (req: Request, res: Response) => {
  const id = Number(String(req.params["id"]));
  const [ep] = await sql`
    SELECT id, name, url, events, enabled, description, created_at,
           LEFT(secret, 8) || '****' AS secret_preview
    FROM platform_webhook_endpoints WHERE id = ${id}
  `.catch(() => []);
  if (!ep) { res.status(404).json({ error: "Endpoint not found" }); return; }

  const deliveries = await sql`
    SELECT id, event_type, http_status, success, duration_ms, delivered_at
    FROM platform_webhook_deliveries WHERE endpoint_id = ${id}
    ORDER BY delivered_at DESC LIMIT 20
  `.catch(() => []);

  res.json({ ok: true, endpoint: ep, deliveries });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/webhooks/endpoints/:id
// ─────────────────────────────────────────────────────────────────────────────
router.put("/endpoints/:id", requireAuth, async (req: Request, res: Response) => {
  const id = Number(String(req.params["id"]));
  const { name, url, events, description, enabled } = req.body as {
    name?: string; url?: string; events?: string[]; description?: string; enabled?: boolean;
  };

  const [ep] = await sql`
    UPDATE platform_webhook_endpoints SET
      name        = COALESCE(${name ?? null}, name),
      url         = COALESCE(${url ?? null}, url),
      events      = COALESCE(${events ?? null}, events),
      description = COALESCE(${description ?? null}, description),
      enabled     = COALESCE(${enabled ?? null}, enabled),
      updated_at  = NOW()
    WHERE id = ${id} RETURNING id, name, url, events, enabled
  `.catch(() => []);

  if (!ep) { res.status(404).json({ error: "Endpoint not found" }); return; }
  res.json({ ok: true, endpoint: ep });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/webhooks/endpoints/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/endpoints/:id", requireAuth, async (req: Request, res: Response) => {
  const id = Number(String(req.params["id"]));
  await sql`DELETE FROM platform_webhook_endpoints WHERE id = ${id}`.catch(() => {});
  res.json({ ok: true, deleted: id });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/endpoints/:id/test — send a test delivery
// ─────────────────────────────────────────────────────────────────────────────
router.post("/endpoints/:id/test", requireAuth, async (req: Request, res: Response) => {
  const id = Number(String(req.params["id"]));
  const [ep] = await sql`SELECT * FROM platform_webhook_endpoints WHERE id = ${id}`.catch(() => []);
  if (!ep) { res.status(404).json({ error: "Endpoint not found" }); return; }

  const endpoint = ep as { id: number; url: string; secret: string };
  const result   = await deliverToEndpoint(endpoint, "platform.test", {
    message: "This is a test delivery from CreateAI Brain Webhook Engine",
    endpointId: id,
    timestamp:  new Date().toISOString(),
  });

  res.json({ ok: true, test: result });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/webhooks/deliveries
// ─────────────────────────────────────────────────────────────────────────────
router.get("/deliveries", requireAuth, async (req: Request, res: Response) => {
  const limit  = Math.min(Number(req.query["limit"] ?? 50), 200);
  const offset = Math.max(Number(req.query["offset"] ?? 0), 0);

  const deliveries = await sql`
    SELECT d.*, e.name AS endpoint_name, e.url AS endpoint_url
    FROM platform_webhook_deliveries d
    LEFT JOIN platform_webhook_endpoints e ON e.id = d.endpoint_id
    ORDER BY d.delivered_at DESC LIMIT ${limit} OFFSET ${offset}
  `.catch(() => []);

  res.json({ ok: true, deliveries, limit, offset });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/webhooks/status
// ─────────────────────────────────────────────────────────────────────────────
router.get("/status", async (_req: Request, res: Response) => {
  const [eps] = await sql`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE enabled) AS active FROM platform_webhook_endpoints`.catch(() => [{ total: 0, active: 0 }]);
  const [del] = await sql`
    SELECT COUNT(*) AS total,
           COUNT(*) FILTER (WHERE success)     AS success,
           COUNT(*) FILTER (WHERE NOT success) AS failed,
           AVG(duration_ms) AS avg_ms
    FROM platform_webhook_deliveries WHERE delivered_at > NOW() - INTERVAL '7 days'
  `.catch(() => [{ total: 0, success: 0, failed: 0, avg_ms: null }]);

  res.json({
    ok: true,
    engine: "Outbound Webhook Delivery Engine v1",
    algorithm: "HMAC-SHA256",
    supportedEvents: SUPPORTED_EVENTS,
    endpoints: eps,
    deliveries7d: del,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/webhooks/deliveries/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get("/deliveries/:id", requireAuth, async (req: Request, res: Response) => {
  const id = Number(String(req.params["id"]));
  const [d] = await sql`SELECT * FROM platform_webhook_deliveries WHERE id = ${id}`.catch(() => []);
  if (!d) { res.status(404).json({ error: "Delivery not found" }); return; }
  res.json({ ok: true, delivery: d });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/webhooks/dashboard — HTML
// ─────────────────────────────────────────────────────────────────────────────
router.get("/dashboard", async (_req: Request, res: Response) => {
  const endpoints  = await sql`SELECT id, name, url, events, enabled, created_at FROM platform_webhook_endpoints ORDER BY created_at DESC`.catch(() => []);
  const recent     = await sql`
    SELECT d.id, d.event_type, d.http_status, d.success, d.duration_ms, d.delivered_at, e.name AS endpoint_name
    FROM platform_webhook_deliveries d LEFT JOIN platform_webhook_endpoints e ON e.id = d.endpoint_id
    ORDER BY d.delivered_at DESC LIMIT 10
  `.catch(() => []);

  const epRows = (endpoints as Array<{ id: number; name: string; url: string; events: string[]; enabled: boolean; created_at: string }>)
    .map(e => `<tr><td>${e.id}</td><td><strong>${e.name}</strong></td><td style="font-size:.75rem;color:#94a3b8">${e.url.slice(0,40)}…</td><td>${e.events.join(", ")}</td><td style="color:${e.enabled ? "#22c55e" : "#ef4444"}">${e.enabled ? "● Active" : "○ Off"}</td></tr>`).join("");

  const delRows = (recent as Array<{ id: number; event_type: string; http_status: number | null; success: boolean; duration_ms: number | null; delivered_at: string; endpoint_name: string | null }>)
    .map(d => `<tr><td>${d.id}</td><td>${d.endpoint_name ?? "—"}</td><td><code>${d.event_type}</code></td><td style="color:${d.success ? "#22c55e" : "#ef4444"}">${d.http_status ?? "—"}</td><td>${d.duration_ms != null ? d.duration_ms + "ms" : "—"}</td><td style="font-size:.75rem;color:#64748b">${new Date(d.delivered_at).toLocaleString()}</td></tr>`).join("");

  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Webhook Engine — CreateAI Brain</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:#020617;color:#e2e8f0;min-height:100vh;padding:2rem}
h1{font-size:1.5rem;font-weight:700;color:#a5b4fc;margin-bottom:.5rem}
.sub{color:#64748b;font-size:.875rem;margin-bottom:2rem}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-bottom:2rem}
.card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:1.5rem}
h2{font-size:1rem;font-weight:600;color:#c7d2fe;margin-bottom:1rem}
table{width:100%;border-collapse:collapse;font-size:.8rem}
th{text-align:left;padding:.5rem;border-bottom:1px solid rgba(255,255,255,.1);color:#94a3b8}
td{padding:.5rem;border-bottom:1px solid rgba(255,255,255,.05)}
code{background:rgba(99,102,241,.2);padding:.1em .4em;border-radius:4px;font-size:.75em}
</style></head>
<body>
<a href="#main" style="position:absolute;left:-999px;top:0">Skip to main</a>
<h1>🔗 Webhook Delivery Engine</h1>
<p class="sub">HMAC-SHA256 signed outbound event delivery to external endpoints</p>
<div class="grid">
  <div class="card" id="main">
    <h2>Endpoints (${endpoints.length})</h2>
    ${endpoints.length > 0 ? `<table><thead><tr><th>#</th><th>Name</th><th>URL</th><th>Events</th><th>Status</th></tr></thead><tbody>${epRows}</tbody></table>` : '<p style="color:#64748b;text-align:center;padding:2rem;font-style:italic">No endpoints. POST /api/webhooks/endpoints to register one.</p>'}
  </div>
  <div class="card">
    <h2>Recent Deliveries</h2>
    ${recent.length > 0 ? `<table><thead><tr><th>#</th><th>Endpoint</th><th>Event</th><th>Status</th><th>Duration</th><th>Time</th></tr></thead><tbody>${delRows}</tbody></table>` : '<p style="color:#64748b;text-align:center;padding:2rem;font-style:italic">No deliveries yet.</p>'}
  </div>
</div>
<div aria-live="polite"></div>
</body></html>`);
});

export default router;
