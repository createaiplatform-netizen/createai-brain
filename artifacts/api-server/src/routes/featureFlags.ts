/**
 * routes/featureFlags.ts — Runtime Feature Flag System
 * ──────────────────────────────────────────────────────
 * A production-grade feature flag system for CreateAI Brain.
 * Flags can be evaluated by user ID, role, percentage rollout, or environment.
 *
 * Routes:
 *   GET    /api/flags               List all flags
 *   POST   /api/flags               Create a flag
 *   GET    /api/flags/:key          Get single flag
 *   PUT    /api/flags/:key          Update flag
 *   DELETE /api/flags/:key          Delete flag
 *   POST   /api/flags/:key/toggle   Toggle enabled state
 *   GET    /api/flags/evaluate      Evaluate flags for current user context
 *   GET    /api/flags/dashboard     HTML dashboard
 */

import { Router, type Request, type Response } from "express";
import { rawSql as sql } from "@workspace/db";
import { requireAuth }                          from "../middlewares/requireAuth.js";

const router = Router();

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS platform_feature_flags (
      id              SERIAL PRIMARY KEY,
      key             TEXT NOT NULL UNIQUE,
      name            TEXT NOT NULL,
      description     TEXT,
      enabled         BOOLEAN NOT NULL DEFAULT false,
      rollout_pct     SMALLINT NOT NULL DEFAULT 100 CHECK (rollout_pct BETWEEN 0 AND 100),
      allowed_roles   TEXT[] NOT NULL DEFAULT '{}',
      allowed_users   TEXT[] NOT NULL DEFAULT '{}',
      environment     TEXT NOT NULL DEFAULT 'all',
      payload         JSONB NOT NULL DEFAULT '{}',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_flags_key ON platform_feature_flags(key)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_flags_enabled ON platform_feature_flags(enabled)`;

  // Seed platform-default flags
  await sql`
    INSERT INTO platform_feature_flags (key, name, description, enabled, rollout_pct, environment)
    VALUES
      ('universal_search',     'Universal Search',          'Cross-domain full-text search bar',          true, 100, 'all'),
      ('automation_engine',    'Automation Engine',         'Event-driven automation rule builder',       true, 100, 'all'),
      ('intelligence_oracle',  'Intelligence Oracle',       'GPT-4o cross-domain intelligence queries',   true, 100, 'all'),
      ('temporal_analytics',   'Temporal Analytics',        'Time-series trend analysis dashboard',       true, 100, 'all'),
      ('platform_dna',         'Platform DNA',              'Platform capability genome tracker',         true, 100, 'all'),
      ('outbound_webhooks',    'Outbound Webhooks',         'Event delivery to external endpoints',       true, 100, 'all'),
      ('sse_events',           'Real-Time Events',          'Server-Sent Events live platform feed',      true, 100, 'all'),
      ('advanced_ai_engines',  'Advanced AI Engines',       'GPT-4o powered domain-specific engines',     true, 100, 'all'),
      ('marketplace_sync',     'Marketplace Sync',          'Live marketplace channel synchronisation',   false, 0, 'production'),
      ('beta_mobile_shell',    'Beta Mobile Shell',         'Mobile-optimised OS shell preview',          false, 10, 'development')
    ON CONFLICT (key) DO NOTHING
  `;
}

ensureTable().catch(() => {});

// ── Evaluate a flag for a given user context ──────────────────────────────────
function evaluateFlag(
  flag: {
    enabled: boolean; rollout_pct: number;
    allowed_roles: string[]; allowed_users: string[];
    environment: string; payload: Record<string, unknown>;
  },
  ctx: { userId?: string; role?: string; env?: string }
): { enabled: boolean; reason: string } {
  if (!flag.enabled) return { enabled: false, reason: "flag_disabled" };

  const env = ctx.env ?? process.env["NODE_ENV"] ?? "development";
  if (flag.environment !== "all" && flag.environment !== env)
    return { enabled: false, reason: `env_mismatch:${flag.environment}` };

  if (flag.allowed_users.length > 0 && ctx.userId && flag.allowed_users.includes(ctx.userId))
    return { enabled: true, reason: "user_allowlist" };

  if (flag.allowed_roles.length > 0 && ctx.role && flag.allowed_roles.includes(ctx.role))
    return { enabled: true, reason: "role_allowlist" };

  if (flag.allowed_users.length > 0 || flag.allowed_roles.length > 0)
    return { enabled: false, reason: "not_in_allowlist" };

  if (flag.rollout_pct < 100) {
    const seed = ctx.userId ? parseInt(ctx.userId, 36) % 100 : Math.random() * 100;
    if (seed >= flag.rollout_pct) return { enabled: false, reason: `rollout_${flag.rollout_pct}pct` };
  }

  return { enabled: true, reason: "default_enabled" };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/flags — list all
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", async (_req: Request, res: Response) => {
  const flags = await sql`SELECT * FROM platform_feature_flags ORDER BY key`.catch(() => []);
  res.json({ ok: true, count: flags.length, flags });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/flags — create
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const { key, name, description, enabled, rollout_pct, allowed_roles, allowed_users, environment, payload } =
    req.body as {
      key?: string; name?: string; description?: string; enabled?: boolean;
      rollout_pct?: number; allowed_roles?: string[]; allowed_users?: string[];
      environment?: string; payload?: Record<string, unknown>;
    };

  if (!key || !name) { res.status(400).json({ error: "key and name are required" }); return; }

  const [flag] = await sql`
    INSERT INTO platform_feature_flags
      (key, name, description, enabled, rollout_pct, allowed_roles, allowed_users, environment, payload)
    VALUES (
      ${key}, ${name}, ${description ?? null}, ${enabled ?? false},
      ${rollout_pct ?? 100}, ${allowed_roles ?? []}, ${allowed_users ?? []},
      ${environment ?? "all"}, ${JSON.stringify(payload ?? {})}::jsonb
    ) RETURNING *
  `.catch(e => { throw e; });

  res.status(201).json({ ok: true, flag });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/flags/evaluate — evaluate all flags for current user
// ─────────────────────────────────────────────────────────────────────────────
router.get("/evaluate", async (req: Request, res: Response) => {
  const userId = String(req.query["userId"] ?? (req.session as { userId?: string } | undefined)?.userId ?? "");
  const role   = String(req.query["role"]   ?? "visitor");
  const env    = String(req.query["env"]    ?? process.env["NODE_ENV"] ?? "development");

  const flags = await sql`SELECT * FROM platform_feature_flags ORDER BY key`.catch(() => []);

  const evaluated: Record<string, { enabled: boolean; reason: string; payload: unknown }> = {};
  for (const f of flags as Array<{
    key: string; enabled: boolean; rollout_pct: number;
    allowed_roles: string[]; allowed_users: string[];
    environment: string; payload: Record<string, unknown>;
  }>) {
    const result = evaluateFlag(f, { userId, role, env });
    evaluated[f.key] = { ...result, payload: result.enabled ? f.payload : {} };
  }

  res.json({ ok: true, userId, role, env, flags: evaluated });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/flags/:key
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:key", async (req: Request, res: Response) => {
  const key = String(req.params["key"]);
  const [flag] = await sql`SELECT * FROM platform_feature_flags WHERE key = ${key}`.catch(() => []);
  if (!flag) { res.status(404).json({ error: "Flag not found" }); return; }
  res.json({ ok: true, flag });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/flags/:key
// ─────────────────────────────────────────────────────────────────────────────
router.put("/:key", requireAuth, async (req: Request, res: Response) => {
  const key = String(req.params["key"]);
  const { name, description, enabled, rollout_pct, allowed_roles, allowed_users, environment, payload } =
    req.body as {
      name?: string; description?: string; enabled?: boolean; rollout_pct?: number;
      allowed_roles?: string[]; allowed_users?: string[]; environment?: string;
      payload?: Record<string, unknown>;
    };

  const [flag] = await sql`
    UPDATE platform_feature_flags SET
      name          = COALESCE(${name ?? null}, name),
      description   = COALESCE(${description ?? null}, description),
      enabled       = COALESCE(${enabled ?? null}, enabled),
      rollout_pct   = COALESCE(${rollout_pct ?? null}, rollout_pct),
      allowed_roles = COALESCE(${allowed_roles ?? null}, allowed_roles),
      allowed_users = COALESCE(${allowed_users ?? null}, allowed_users),
      environment   = COALESCE(${environment ?? null}, environment),
      payload       = COALESCE(${payload ? JSON.stringify(payload) : null}::jsonb, payload),
      updated_at    = NOW()
    WHERE key = ${key} RETURNING *
  `.catch(() => []);

  if (!flag) { res.status(404).json({ error: "Flag not found" }); return; }
  res.json({ ok: true, flag });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/flags/:key
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/:key", requireAuth, async (req: Request, res: Response) => {
  const key = String(req.params["key"]);
  await sql`DELETE FROM platform_feature_flags WHERE key = ${key}`.catch(() => {});
  res.json({ ok: true, deleted: key });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/flags/:key/toggle
// ─────────────────────────────────────────────────────────────────────────────
router.post("/:key/toggle", requireAuth, async (req: Request, res: Response) => {
  const key = String(req.params["key"]);
  const [flag] = await sql`
    UPDATE platform_feature_flags SET enabled = NOT enabled, updated_at = NOW()
    WHERE key = ${key} RETURNING *
  `.catch(() => []);
  if (!flag) { res.status(404).json({ error: "Flag not found" }); return; }
  res.json({ ok: true, flag, enabled: (flag as { enabled: boolean }).enabled });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/flags/dashboard — HTML admin dashboard
// ─────────────────────────────────────────────────────────────────────────────
router.get("/dashboard", async (_req: Request, res: Response) => {
  const flags = await sql`SELECT * FROM platform_feature_flags ORDER BY key`.catch(() => []);

  const rows = (flags as Array<{
    key: string; name: string; description: string | null;
    enabled: boolean; rollout_pct: number; environment: string; updated_at: string;
  }>).map(f => `
    <tr>
      <td><code>${f.key}</code></td>
      <td>${f.name}</td>
      <td>${f.description ?? "—"}</td>
      <td><span style="color:${f.enabled ? "#22c55e" : "#ef4444"};font-weight:600">${f.enabled ? "ON" : "OFF"}</span></td>
      <td>${f.rollout_pct}%</td>
      <td>${f.environment}</td>
      <td style="color:#64748b;font-size:.75rem">${new Date(f.updated_at).toLocaleString()}</td>
    </tr>`).join("");

  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Feature Flags — CreateAI Brain</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:#020617;color:#e2e8f0;min-height:100vh;padding:2rem}
h1{font-size:1.5rem;font-weight:700;color:#a5b4fc;margin-bottom:.5rem}
.sub{color:#64748b;font-size:.875rem;margin-bottom:2rem}
.card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:1.5rem;margin-bottom:2rem}
table{width:100%;border-collapse:collapse;font-size:.8rem}
th{text-align:left;padding:.5rem;border-bottom:1px solid rgba(255,255,255,.1);color:#94a3b8}
td{padding:.5rem;border-bottom:1px solid rgba(255,255,255,.05)}
code{background:rgba(99,102,241,.2);padding:.1em .4em;border-radius:4px;font-size:.75em}
</style></head>
<body>
<a href="#main" style="position:absolute;left:-999px;top:0">Skip to main</a>
<h1>🚩 Feature Flags</h1>
<p class="sub">Runtime feature toggles for CreateAI Brain — ${flags.length} flags registered</p>
<div class="card" id="main">
  <table>
    <thead><tr><th>Key</th><th>Name</th><th>Description</th><th>State</th><th>Rollout</th><th>Env</th><th>Updated</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:2rem">No flags yet</td></tr>'}</tbody>
  </table>
</div>
<p style="color:#64748b;font-size:.75rem">API: GET /api/flags/evaluate?userId=&role= • POST /api/flags/:key/toggle (auth required)</p>
<div aria-live="polite"></div>
</body></html>`);
});

export default router;
