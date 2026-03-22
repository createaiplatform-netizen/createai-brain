/**
 * routes/intelligenceOracle.ts — Cross-Domain Intelligence Oracle
 * ───────────────────────────────────────────────────────────────
 * GPT-4o powered cross-domain intelligence for CreateAI Brain.
 * The Oracle synthesises insights from ALL platform domains simultaneously —
 * healthcare, legal, staffing, finance, projects, leads, opportunities —
 * and answers natural language questions about the business as a whole.
 *
 * Routes:
 *   POST /api/oracle/query         Natural language cross-domain query
 *   GET  /api/oracle/report        Scheduled full intelligence report
 *   GET  /api/oracle/snapshots     List past intelligence snapshots
 *   GET  /api/oracle/snapshots/:id Single snapshot
 *   GET  /api/oracle/status        Oracle engine status
 *   GET  /api/oracle/dashboard     HTML dashboard
 */

import { Router, type Request, type Response } from "express";
import { sql }                                  from "@workspace/db";
import { openai }                               from "@workspace/integrations-openai-ai-server";

const router = Router();

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS oracle_snapshots (
      id            SERIAL PRIMARY KEY,
      query         TEXT,
      report_type   TEXT NOT NULL DEFAULT 'custom',
      model         TEXT NOT NULL DEFAULT 'gpt-4o',
      context_hash  TEXT,
      insight       TEXT NOT NULL,
      domains_used  TEXT[] NOT NULL DEFAULT '{}',
      token_usage   JSONB NOT NULL DEFAULT '{}',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_oracle_snapshots_created ON oracle_snapshots(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_oracle_snapshots_type    ON oracle_snapshots(report_type)`;
}

ensureTables().catch(() => {});

// ─── Gather platform-wide context ────────────────────────────────────────────
async function gatherContext(): Promise<{ summary: string; raw: Record<string, unknown> }> {
  const raw: Record<string, unknown> = {};

  // Projects
  try {
    const [ps] = await sql`SELECT COUNT(*) AS n, COUNT(*) FILTER (WHERE status='active') AS active FROM projects`;
    raw["projects"] = ps;
  } catch { raw["projects"] = { n: 0, active: 0 }; }

  // Leads
  try {
    const [ls] = await sql`SELECT COUNT(*) AS n, COUNT(*) FILTER (WHERE status='new') AS new FROM leads`;
    raw["leads"] = ls;
  } catch { raw["leads"] = { n: 0, new: 0 }; }

  // Opportunities
  try {
    const [ops] = await sql`
      SELECT COUNT(*) AS n,
             SUM(value) AS pipeline_value,
             COUNT(*) FILTER (WHERE stage='closed_won') AS won
      FROM opportunities
    `;
    raw["opportunities"] = ops;
  } catch { raw["opportunities"] = { n: 0, pipeline_value: 0, won: 0 }; }

  // Healthcare
  try {
    const [hs] = await sql`SELECT COUNT(*) AS patients FROM patients`;
    const [apt] = await sql`SELECT COUNT(*) AS upcoming FROM appointments WHERE date > NOW()`;
    raw["healthcare"] = { ...hs, ...apt };
  } catch { raw["healthcare"] = { patients: 0, upcoming: 0 }; }

  // Legal
  try {
    const [lc] = await sql`SELECT COUNT(*) AS clients FROM legal_clients`;
    const [lm] = await sql`SELECT COUNT(*) AS open_matters FROM legal_matters WHERE status='open'`;
    raw["legal"] = { ...lc, ...lm };
  } catch { raw["legal"] = { clients: 0, open_matters: 0 }; }

  // Staffing
  try {
    const [sc] = await sql`SELECT COUNT(*) AS candidates FROM candidates`;
    const [sp] = await sql`SELECT COUNT(*) AS placements FROM placements WHERE end_date > NOW()`;
    raw["staffing"] = { ...sc, ...sp };
  } catch { raw["staffing"] = { candidates: 0, placements: 0 }; }

  // Finance
  try {
    const [fi] = await sql`
      SELECT COUNT(*) AS transactions,
             SUM(CASE WHEN type='credit' THEN amount ELSE 0 END) AS total_revenue,
             SUM(CASE WHEN type='debit'  THEN amount ELSE 0 END) AS total_expenses
      FROM transaction_ledger WHERE created_at > NOW() - INTERVAL '30 days'
    `;
    raw["finance"] = fi;
  } catch { raw["finance"] = { transactions: 0, total_revenue: null, total_expenses: null }; }

  // People
  try {
    const [pe] = await sql`SELECT COUNT(*) AS contacts FROM people`;
    raw["people"] = pe;
  } catch { raw["people"] = { contacts: 0 }; }

  // Automation
  try {
    const [au] = await sql`SELECT COUNT(*) FILTER (WHERE enabled) AS active_rules FROM automation_rules`;
    raw["automation"] = au;
  } catch { raw["automation"] = { active_rules: 0 }; }

  const summary = `
Platform Intelligence Snapshot — ${new Date().toISOString()}
Projects: ${JSON.stringify(raw["projects"])}
Leads: ${JSON.stringify(raw["leads"])}
Opportunities: ${JSON.stringify(raw["opportunities"])}
Healthcare: ${JSON.stringify(raw["healthcare"])}
Legal: ${JSON.stringify(raw["legal"])}
Staffing: ${JSON.stringify(raw["staffing"])}
Finance (30d): ${JSON.stringify(raw["finance"])}
People/CRM: ${JSON.stringify(raw["people"])}
Automation: ${JSON.stringify(raw["automation"])}
`.trim();

  return { summary, raw };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/oracle/query — natural language cross-domain query
// ─────────────────────────────────────────────────────────────────────────────
router.post("/query", async (req: Request, res: Response) => {
  const { query, includeRawContext } = req.body as {
    query?: string; includeRawContext?: boolean;
  };

  if (!query || query.trim().length < 5) {
    res.status(400).json({ error: "query must be at least 5 characters" }); return;
  }

  const ctx = await gatherContext();
  const domainsUsed = Object.keys(ctx.raw);

  const systemPrompt = `You are the CreateAI Brain Intelligence Oracle — the cross-domain intelligence engine for a full AI OS platform built for Sara Stadler (Lakeside Trinity LLC).

You have access to live data from ALL platform domains simultaneously. Your job is to analyse this data holistically and answer questions with cross-domain insights that no single-domain system could provide.

PLATFORM DATA (live snapshot):
${ctx.summary}

GUIDELINES:
- Answer in clear, actionable terms. Be specific about numbers and trends.
- Identify cross-domain patterns (e.g., how legal caseload affects staffing; how leads connect to revenue).
- Flag opportunities or risks that only appear when looking across domains.
- Never fabricate data. If data is 0 or null, state that clearly.
- Provide prioritised recommendations with clear rationale.
- Keep response structured and scannable (use headers if helpful).`;

  let insight = "";
  let tokenUsage: Record<string, number> = {};

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: query },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    insight     = completion.choices[0]?.message.content ?? "";
    tokenUsage  = {
      prompt_tokens:     completion.usage?.prompt_tokens     ?? 0,
      completion_tokens: completion.usage?.completion_tokens ?? 0,
      total_tokens:      completion.usage?.total_tokens      ?? 0,
    };
  } catch (e) {
    res.status(502).json({ error: "AI service unavailable", detail: String(e) }); return;
  }

  // Persist snapshot
  const [snap] = await sql`
    INSERT INTO oracle_snapshots (query, report_type, insight, domains_used, token_usage)
    VALUES (${query}, 'custom', ${insight}, ${domainsUsed}, ${JSON.stringify(tokenUsage)}::jsonb)
    RETURNING id, created_at
  `.catch(() => [{ id: null, created_at: null }]);

  res.json({
    ok: true,
    query,
    insight,
    snapshotId:  (snap as { id: number | null }).id,
    domainsUsed,
    tokenUsage,
    timestamp:   new Date().toISOString(),
    ...(includeRawContext ? { context: ctx.raw } : {}),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/oracle/report — full intelligence synthesis
// ─────────────────────────────────────────────────────────────────────────────
router.get("/report", async (_req: Request, res: Response) => {
  const ctx = await gatherContext();

  const systemPrompt = `You are the CreateAI Brain Intelligence Oracle. Generate a comprehensive cross-domain intelligence report.`;
  const userPrompt   = `Generate a complete intelligence report covering:
1. EXECUTIVE SUMMARY — overall platform health in 3 bullet points
2. DOMAIN STATUS — health of each domain (projects, leads, opportunities, healthcare, legal, staffing, finance)
3. CROSS-DOMAIN PATTERNS — insights that span multiple domains
4. OPPORTUNITIES — top 3 revenue or growth opportunities identified from the data
5. RISKS — top 3 risks or bottlenecks
6. RECOMMENDED ACTIONS — 5 specific, actionable next steps

Platform data:
${ctx.summary}`;

  let insight = "";
  let tokenUsage: Record<string, number> = {};

  try {
    const completion = await openai.chat.completions.create({
      model:       "gpt-4o",
      messages:    [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      max_tokens:  3000,
      temperature: 0.2,
    });
    insight    = completion.choices[0]?.message.content ?? "";
    tokenUsage = {
      prompt_tokens:     completion.usage?.prompt_tokens     ?? 0,
      completion_tokens: completion.usage?.completion_tokens ?? 0,
      total_tokens:      completion.usage?.total_tokens      ?? 0,
    };
  } catch (e) {
    res.status(502).json({ error: "AI service unavailable", detail: String(e) }); return;
  }

  const [snap] = await sql`
    INSERT INTO oracle_snapshots (query, report_type, insight, domains_used, token_usage)
    VALUES (NULL, 'full_report', ${insight}, ${Object.keys(ctx.raw)}, ${JSON.stringify(tokenUsage)}::jsonb)
    RETURNING id, created_at
  `.catch(() => [{ id: null, created_at: null }]);

  res.json({
    ok: true,
    reportType:  "full_report",
    insight,
    snapshotId:  (snap as { id: number | null }).id,
    domainsUsed: Object.keys(ctx.raw),
    context:     ctx.raw,
    tokenUsage,
    timestamp:   new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/oracle/snapshots — list past insights
// ─────────────────────────────────────────────────────────────────────────────
router.get("/snapshots", async (req: Request, res: Response) => {
  const limit  = Math.min(Number(req.query["limit"] ?? 20), 100);
  const offset = Math.max(Number(req.query["offset"] ?? 0), 0);

  const snaps = await sql`
    SELECT id, query, report_type, domains_used, token_usage, created_at,
           LEFT(insight, 300) AS excerpt
    FROM oracle_snapshots ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
  `.catch(() => []);

  res.json({ ok: true, snapshots: snaps, limit, offset });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/oracle/snapshots/:id — single snapshot
// ─────────────────────────────────────────────────────────────────────────────
router.get("/snapshots/:id", async (req: Request, res: Response) => {
  const id = Number(String(req.params["id"]));
  const [snap] = await sql`SELECT * FROM oracle_snapshots WHERE id = ${id}`.catch(() => []);
  if (!snap) { res.status(404).json({ error: "Snapshot not found" }); return; }
  res.json({ ok: true, snapshot: snap });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/oracle/status
// ─────────────────────────────────────────────────────────────────────────────
router.get("/status", async (_req: Request, res: Response) => {
  const [counts] = await sql`
    SELECT COUNT(*) AS total,
           COUNT(*) FILTER (WHERE report_type='full_report') AS reports,
           COUNT(*) FILTER (WHERE report_type='custom')      AS queries,
           MAX(created_at) AS last_query_at
    FROM oracle_snapshots
  `.catch(() => [{ total: 0, reports: 0, queries: 0, last_query_at: null }]);

  res.json({
    ok:      true,
    engine:  "Intelligence Oracle v1 (GPT-4o)",
    model:   "gpt-4o",
    domains: ["projects","leads","opportunities","healthcare","legal","staffing","finance","people","automation"],
    stats:   counts ?? {},
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/oracle/dashboard — HTML dashboard
// ─────────────────────────────────────────────────────────────────────────────
router.get("/dashboard", async (_req: Request, res: Response) => {
  const snaps = await sql`
    SELECT id, query, report_type, domains_used, created_at, LEFT(insight, 200) AS excerpt
    FROM oracle_snapshots ORDER BY created_at DESC LIMIT 5
  `.catch(() => []);

  const rows = (snaps as Array<{
    id: number; query: string | null; report_type: string;
    domains_used: string[]; created_at: string; excerpt: string;
  }>).map(s => `
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:1rem;margin-bottom:.75rem">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem">
        <span style="font-size:.75rem;color:#a5b4fc;font-weight:600">${s.report_type === "full_report" ? "📊 Full Report" : "💬 Query"} #${s.id}</span>
        <span style="font-size:.7rem;color:#64748b">${new Date(s.created_at).toLocaleString()}</span>
      </div>
      ${s.query ? `<p style="font-size:.8rem;color:#c7d2fe;margin-bottom:.5rem">"${s.query}"</p>` : ""}
      <p style="font-size:.8rem;color:#94a3b8">${s.excerpt}…</p>
      <div style="display:flex;gap:.25rem;margin-top:.5rem;flex-wrap:wrap">
        ${s.domains_used.map(d => `<span style="background:rgba(99,102,241,.2);color:#a5b4fc;padding:.1em .4em;border-radius:4px;font-size:.7rem">${d}</span>`).join("")}
      </div>
    </div>`).join("") || '<p style="color:#64748b;text-align:center;padding:2rem">No snapshots yet. POST /api/oracle/query to generate your first insight.</p>';

  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Intelligence Oracle — CreateAI Brain</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:#020617;color:#e2e8f0;min-height:100vh;padding:2rem}
h1{font-size:1.5rem;font-weight:700;color:#a5b4fc;margin-bottom:.5rem}
.sub{color:#64748b;font-size:.875rem;margin-bottom:2rem}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2rem}
.stat{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:1.5rem;text-align:center}
.stat-n{font-size:2rem;font-weight:800;color:#a5b4fc}
.stat-l{font-size:.75rem;color:#64748b;margin-top:.25rem}
.card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem}
h2{font-size:1rem;font-weight:600;color:#c7d2fe;margin-bottom:1rem}
code{background:rgba(99,102,241,.2);padding:.2em .5em;border-radius:4px;font-size:.8rem}
</style></head>
<body>
<a href="#main" style="position:absolute;left:-999px;top:0">Skip to main</a>
<h1>🔮 Intelligence Oracle</h1>
<p class="sub">GPT-4o cross-domain intelligence synthesis — sees all platform data at once</p>
<div class="grid">
  <div class="stat"><div class="stat-n">9</div><div class="stat-l">Domains Monitored</div></div>
  <div class="stat"><div class="stat-n">${snaps.length}</div><div class="stat-l">Intelligence Snapshots</div></div>
</div>
<div class="card" id="main">
  <h2>Recent Intelligence Snapshots</h2>
  ${rows}
</div>
<div class="card">
  <h2>API Endpoints</h2>
  <p style="font-size:.8rem;color:#94a3b8;line-height:1.8">
    <code>POST /api/oracle/query</code> — ask any cross-domain question<br>
    <code>GET  /api/oracle/report</code> — generate full intelligence report<br>
    <code>GET  /api/oracle/snapshots</code> — list past insights<br>
    <code>GET  /api/oracle/status</code> — engine status
  </p>
</div>
<div aria-live="polite"></div>
</body></html>`);
});

export default router;
