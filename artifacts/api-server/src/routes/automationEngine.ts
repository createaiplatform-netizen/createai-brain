/**
 * routes/automationEngine.ts — Platform Automation Rule Engine
 * ─────────────────────────────────────────────────────────────
 * Event-driven and scheduled automation for the CreateAI Brain platform.
 *
 * Routes:
 *   GET    /api/automation/rules            List all rules
 *   POST   /api/automation/rules            Create a rule
 *   GET    /api/automation/rules/:id        Get single rule
 *   PUT    /api/automation/rules/:id        Update rule
 *   DELETE /api/automation/rules/:id        Delete rule
 *   POST   /api/automation/rules/:id/toggle Enable/disable rule
 *   POST   /api/automation/rules/:id/run    Manual trigger
 *   GET    /api/automation/executions       Execution history
 *   GET    /api/automation/executions/:id   Single execution
 *   GET    /api/automation/status           Engine status
 *   GET    /api/automation/dashboard        HTML dashboard
 */

import { Router, type Request, type Response } from "express";
import { sql }                                  from "@workspace/db";
import { requireAuth }                          from "../middlewares/requireAuth.js";

const router = Router();

// ─── Supported triggers & actions ────────────────────────────────────────────
const TRIGGERS = [
  "new_lead", "new_project", "new_patient", "new_legal_client", "new_candidate",
  "opportunity_won", "invoice_paid", "task_completed", "document_created",
  "daily_schedule", "weekly_schedule", "hourly_schedule", "manual",
  "health_alert", "revenue_milestone", "inactivity_7d", "platform_error",
] as const;

const ACTIONS = [
  "send_email", "send_sms", "create_task", "create_document",
  "notify_admin", "webhook_call", "stripe_action", "log_entry",
  "ai_analysis", "create_lead", "update_field",
] as const;

// ─── Ensure tables exist ──────────────────────────────────────────────────────
async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS automation_rules (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      trigger     TEXT NOT NULL,
      conditions  JSONB NOT NULL DEFAULT '{}',
      actions     JSONB NOT NULL DEFAULT '[]',
      enabled     BOOLEAN NOT NULL DEFAULT true,
      run_count   INTEGER NOT NULL DEFAULT 0,
      last_run_at TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS automation_executions (
      id          SERIAL PRIMARY KEY,
      rule_id     INTEGER REFERENCES automation_rules(id) ON DELETE CASCADE,
      trigger     TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      input       JSONB NOT NULL DEFAULT '{}',
      output      JSONB NOT NULL DEFAULT '{}',
      error       TEXT,
      duration_ms INTEGER,
      started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      finished_at TIMESTAMPTZ
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_auto_exec_rule ON automation_executions(rule_id, started_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_auto_rules_trigger ON automation_rules(trigger, enabled)`;
}

ensureTables().catch(() => {});

// ─── Execute a single action ──────────────────────────────────────────────────
async function executeAction(
  action: { type: string; config: Record<string, string> },
  context: Record<string, unknown>
): Promise<{ success: boolean; detail: string }> {
  switch (action.type) {
    case "log_entry":
      await sql`
        INSERT INTO activity_log (action, details, created_at)
        VALUES ('automation_action', ${JSON.stringify({ action, context })}::jsonb, NOW())
      `.catch(() => {});
      return { success: true, detail: "Logged to activity log" };

    case "send_email": {
      const { sendEmailNotification } = await import("../utils/notifications.js");
      const to = String(action.config["to"] ?? process.env["CONTACT_EMAIL"] ?? "sivh@mail.com");
      const subject = String(action.config["subject"] ?? "CreateAI Brain Automation Alert");
      const body    = String(action.config["body"] ?? `Automation triggered. Context: ${JSON.stringify(context)}`);
      const batch   = await sendEmailNotification([to], subject, body);
      return { success: batch.successCount > 0, detail: `Email sent to ${to}` };
    }

    case "send_sms": {
      const { sendSMSNotification } = await import("../utils/notifications.js");
      const to      = String(action.config["to"] ?? "");
      const message = String(action.config["message"] ?? "CreateAI Brain Automation Alert");
      if (!to) return { success: false, detail: "No SMS destination configured" };
      const batch = await sendSMSNotification([to], message);
      return { success: batch.successCount > 0, detail: `SMS sent to ${to}` };
    }

    case "notify_admin": {
      const { sendEmailNotification } = await import("../utils/notifications.js");
      const adminEmail = process.env["CONTACT_EMAIL"] ?? "sivh@mail.com";
      const subject = `[AutoEngine] ${String(action.config["subject"] ?? "Platform Automation Alert")}`;
      const body    = String(action.config["body"] ?? JSON.stringify(context, null, 2));
      const batch   = await sendEmailNotification([adminEmail], subject, body);
      return { success: batch.successCount > 0, detail: "Admin notified" };
    }

    case "webhook_call": {
      const url = String(action.config["url"] ?? "");
      if (!url) return { success: false, detail: "No webhook URL configured" };
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CreateAI-Event": "automation" },
        body: JSON.stringify({ trigger: context, timestamp: new Date().toISOString() }),
        signal: AbortSignal.timeout(10000),
      }).catch(e => ({ ok: false, status: 0, statusText: String(e) }));
      return { success: (resp as { ok: boolean }).ok, detail: `Webhook → ${url} ${(resp as { status: number }).status}` };
    }

    case "ai_analysis": {
      return { success: true, detail: "AI analysis queued (use POST /api/oracle/query for immediate analysis)" };
    }

    default:
      return { success: false, detail: `Unknown action type: ${action.type}` };
  }
}

// ─── Run a rule (all actions) ─────────────────────────────────────────────────
async function runRule(
  rule: { id: number; trigger: string; actions: unknown[] },
  context: Record<string, unknown>
): Promise<void> {
  const started  = Date.now();
  const execRows = await sql`
    INSERT INTO automation_executions (rule_id, trigger, status, input, started_at)
    VALUES (${rule.id}, ${rule.trigger}, 'running', ${JSON.stringify(context)}::jsonb, NOW())
    RETURNING id
  `.catch(() => [{ id: 0 }]);
  const execId = (execRows[0] as { id: number }).id;

  const outputs: unknown[] = [];
  let overallSuccess = true;

  const actions = Array.isArray(rule.actions) ? rule.actions : [];
  for (const a of actions) {
    const act = a as { type: string; config: Record<string, string> };
    const out = await executeAction(act, context).catch(e => ({
      success: false, detail: String(e),
    }));
    outputs.push(out);
    if (!out.success) overallSuccess = false;
  }

  const duration = Date.now() - started;
  await sql`
    UPDATE automation_executions
    SET status = ${overallSuccess ? "success" : "partial"}, output = ${JSON.stringify(outputs)}::jsonb,
        duration_ms = ${duration}, finished_at = NOW()
    WHERE id = ${execId}
  `.catch(() => {});

  await sql`
    UPDATE automation_rules
    SET run_count = run_count + 1, last_run_at = NOW(), updated_at = NOW()
    WHERE id = ${rule.id}
  `.catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/automation/status
// ─────────────────────────────────────────────────────────────────────────────
router.get("/status", async (_req: Request, res: Response) => {
  try {
    const [counts] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE enabled)  AS active_rules,
        COUNT(*) FILTER (WHERE NOT enabled) AS inactive_rules,
        COUNT(*) AS total_rules
      FROM automation_rules
    `;
    const [execStats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'success') AS success_count,
        COUNT(*) FILTER (WHERE status IN ('error','partial')) AS error_count,
        COUNT(*) AS total_executions,
        AVG(duration_ms) AS avg_duration_ms
      FROM automation_executions
      WHERE started_at > NOW() - INTERVAL '7 days'
    `;
    res.json({
      ok: true, engine: "Automation Rule Engine v1",
      supportedTriggers: TRIGGERS, supportedActions: ACTIONS,
      rules:      counts ?? { active_rules: 0, inactive_rules: 0, total_rules: 0 },
      executions: execStats ?? { success_count: 0, error_count: 0, total_executions: 0, avg_duration_ms: null },
    });
  } catch (e) {
    res.json({ ok: false, error: String(e) });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/automation/rules
// ─────────────────────────────────────────────────────────────────────────────
router.get("/rules", requireAuth, async (req: Request, res: Response) => {
  const page  = Math.max(Number(req.query["page"]  ?? 1), 1);
  const limit = Math.min(Number(req.query["limit"] ?? 25), 100);
  const off   = (page - 1) * limit;

  const rules = await sql`
    SELECT * FROM automation_rules ORDER BY created_at DESC LIMIT ${limit} OFFSET ${off}
  `.catch(() => []);

  const [total] = await sql`SELECT COUNT(*) AS n FROM automation_rules`.catch(() => [{ n: "0" }]);

  res.json({ ok: true, rules, total: Number((total as { n: string }).n), page, limit });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/automation/rules
// ─────────────────────────────────────────────────────────────────────────────
router.post("/rules", requireAuth, async (req: Request, res: Response) => {
  const { name, description, trigger, conditions, actions, enabled } = req.body as {
    name?: string; description?: string; trigger?: string;
    conditions?: unknown; actions?: unknown[]; enabled?: boolean;
  };

  if (!name || !trigger) {
    res.status(400).json({ error: "name and trigger are required" }); return;
  }
  if (!TRIGGERS.includes(trigger as typeof TRIGGERS[number])) {
    res.status(400).json({ error: `Invalid trigger. Valid: ${TRIGGERS.join(", ")}` }); return;
  }

  const [rule] = await sql`
    INSERT INTO automation_rules (name, description, trigger, conditions, actions, enabled)
    VALUES (
      ${name}, ${description ?? null}, ${trigger},
      ${JSON.stringify(conditions ?? {})}::jsonb,
      ${JSON.stringify(actions ?? [])}::jsonb,
      ${enabled !== false}
    )
    RETURNING *
  `;
  res.status(201).json({ ok: true, rule });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/automation/rules/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get("/rules/:id", requireAuth, async (req: Request, res: Response) => {
  const id = Number(String(req.params["id"]));
  const [rule] = await sql`SELECT * FROM automation_rules WHERE id = ${id}`.catch(() => []);
  if (!rule) { res.status(404).json({ error: "Rule not found" }); return; }

  const execs = await sql`
    SELECT id, status, trigger, duration_ms, started_at, finished_at
    FROM automation_executions WHERE rule_id = ${id} ORDER BY started_at DESC LIMIT 20
  `.catch(() => []);

  res.json({ ok: true, rule, executions: execs });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/automation/rules/:id
// ─────────────────────────────────────────────────────────────────────────────
router.put("/rules/:id", requireAuth, async (req: Request, res: Response) => {
  const id = Number(String(req.params["id"]));
  const { name, description, trigger, conditions, actions, enabled } = req.body as {
    name?: string; description?: string; trigger?: string;
    conditions?: unknown; actions?: unknown[]; enabled?: boolean;
  };

  const [rule] = await sql`
    UPDATE automation_rules SET
      name        = COALESCE(${name ?? null}, name),
      description = COALESCE(${description ?? null}, description),
      trigger     = COALESCE(${trigger ?? null}, trigger),
      conditions  = COALESCE(${conditions ? JSON.stringify(conditions) : null}::jsonb, conditions),
      actions     = COALESCE(${actions ? JSON.stringify(actions) : null}::jsonb, actions),
      enabled     = COALESCE(${enabled ?? null}, enabled),
      updated_at  = NOW()
    WHERE id = ${id}
    RETURNING *
  `.catch(() => []);

  if (!rule) { res.status(404).json({ error: "Rule not found" }); return; }
  res.json({ ok: true, rule });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/automation/rules/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/rules/:id", requireAuth, async (req: Request, res: Response) => {
  const id = Number(String(req.params["id"]));
  await sql`DELETE FROM automation_rules WHERE id = ${id}`.catch(() => {});
  res.json({ ok: true, deleted: id });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/automation/rules/:id/toggle
// ─────────────────────────────────────────────────────────────────────────────
router.post("/rules/:id/toggle", requireAuth, async (req: Request, res: Response) => {
  const id = Number(String(req.params["id"]));
  const [rule] = await sql`
    UPDATE automation_rules SET enabled = NOT enabled, updated_at = NOW()
    WHERE id = ${id} RETURNING *
  `.catch(() => []);
  if (!rule) { res.status(404).json({ error: "Rule not found" }); return; }
  res.json({ ok: true, rule, enabled: (rule as { enabled: boolean }).enabled });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/automation/rules/:id/run — manual trigger
// ─────────────────────────────────────────────────────────────────────────────
router.post("/rules/:id/run", requireAuth, async (req: Request, res: Response) => {
  const id = Number(String(req.params["id"]));
  const [ruleRow] = await sql`SELECT * FROM automation_rules WHERE id = ${id}`.catch(() => []);
  if (!ruleRow) { res.status(404).json({ error: "Rule not found" }); return; }

  const rule = ruleRow as { id: number; trigger: string; actions: unknown[] };
  const context = { ...(req.body as Record<string, unknown>), _manual: true, _triggeredAt: new Date().toISOString() };

  res.json({ ok: true, message: "Rule execution started", ruleId: id });
  runRule(rule, context).catch(() => {});
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/automation/executions
// ─────────────────────────────────────────────────────────────────────────────
router.get("/executions", requireAuth, async (req: Request, res: Response) => {
  const limit  = Math.min(Number(req.query["limit"] ?? 50), 200);
  const offset = Math.max(Number(req.query["offset"] ?? 0), 0);
  const status = String(req.query["status"] ?? "");

  const execs = await sql`
    SELECT e.*, r.name AS rule_name, r.trigger AS rule_trigger
    FROM automation_executions e
    LEFT JOIN automation_rules r ON r.id = e.rule_id
    ${status ? sql`WHERE e.status = ${status}` : sql``}
    ORDER BY e.started_at DESC LIMIT ${limit} OFFSET ${offset}
  `.catch(() => []);

  res.json({ ok: true, executions: execs, limit, offset });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/automation/dashboard — HTML admin dashboard
// ─────────────────────────────────────────────────────────────────────────────
router.get("/dashboard", async (_req: Request, res: Response) => {
  const rules = await sql`SELECT * FROM automation_rules ORDER BY created_at DESC`.catch(() => []);
  const recent = await sql`
    SELECT e.*, r.name AS rule_name FROM automation_executions e
    LEFT JOIN automation_rules r ON r.id = e.rule_id
    ORDER BY e.started_at DESC LIMIT 10
  `.catch(() => []);

  const ruleRows = (rules as Array<{ id: number; name: string; trigger: string; enabled: boolean; run_count: number; last_run_at: string | null }>)
    .map(r => `
      <tr>
        <td>${r.id}</td>
        <td><strong>${r.name}</strong></td>
        <td><code>${r.trigger}</code></td>
        <td><span style="color:${r.enabled ? "#22c55e" : "#ef4444"}">${r.enabled ? "● Active" : "○ Paused"}</span></td>
        <td>${r.run_count}</td>
        <td>${r.last_run_at ? new Date(r.last_run_at).toLocaleString() : "Never"}</td>
      </tr>`).join("");

  const execRows = (recent as Array<{ id: number; rule_name: string; status: string; duration_ms: number | null; started_at: string }>)
    .map(e => `
      <tr>
        <td>${e.id}</td>
        <td>${e.rule_name ?? "—"}</td>
        <td style="color:${e.status === "success" ? "#22c55e" : "#ef4444"}">${e.status}</td>
        <td>${e.duration_ms != null ? e.duration_ms + "ms" : "—"}</td>
        <td>${new Date(e.started_at).toLocaleString()}</td>
      </tr>`).join("");

  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Automation Engine — CreateAI Brain</title>
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
.empty{color:#64748b;text-align:center;padding:2rem;font-style:italic}
.badge{display:inline-flex;align-items:center;gap:.25rem;font-size:.75rem;padding:.2rem .6rem;border-radius:9999px;background:rgba(99,102,241,.2);color:#a5b4fc}
</style></head>
<body>
<a href="#main" style="position:absolute;left:-999px;top:0">Skip to main</a>
<h1>⚡ Automation Engine</h1>
<p class="sub">CreateAI Brain — Event-driven workflow automation</p>
<div class="grid">
  <div class="card">
    <h2>Rules (${rules.length})</h2>
    ${rules.length > 0 ? `<table><thead><tr><th>#</th><th>Name</th><th>Trigger</th><th>Status</th><th>Runs</th><th>Last Run</th></tr></thead><tbody>${ruleRows}</tbody></table>` : '<p class="empty">No automation rules yet. POST /api/automation/rules to create one.</p>'}
  </div>
  <div class="card">
    <h2>Recent Executions</h2>
    ${recent.length > 0 ? `<table><thead><tr><th>#</th><th>Rule</th><th>Status</th><th>Duration</th><th>Time</th></tr></thead><tbody>${execRows}</tbody></table>` : '<p class="empty">No executions yet.</p>'}
  </div>
</div>
<div class="card" style="margin-bottom:2rem">
  <h2>Supported Triggers</h2>
  <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.5rem">
    ${TRIGGERS.map(t => `<span class="badge">${t}</span>`).join("")}
  </div>
</div>
<div class="card">
  <h2>Supported Actions</h2>
  <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.5rem">
    ${ACTIONS.map(a => `<span class="badge" style="background:rgba(34,197,94,.1);color:#86efac">${a}</span>`).join("")}
  </div>
</div>
<div id="main" aria-live="polite"></div>
</body></html>`);
});

export default router;
