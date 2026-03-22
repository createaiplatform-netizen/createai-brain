/**
 * routes/universalSearch.ts — Universal Cross-Domain Full-Text Search
 * ─────────────────────────────────────────────────────────────────────
 * GET /api/search?q=&domains[]=&limit=&offset=
 *   → Searches across ALL platform domains simultaneously:
 *     projects, documents, people, leads, healthcare, legal, staffing,
 *     opportunities, conversations, activity_log
 *
 * Uses PostgreSQL ts_vector full-text search with ranked results.
 * Groups results by domain. Returns unified scored result list.
 */

import { Router, type Request, type Response } from "express";
import { sql }                                  from "@workspace/db";

const router = Router();

type DomainResult = {
  domain:    string;
  id:        string | number;
  title:     string;
  excerpt:   string;
  score:     number;
  url:       string;
  createdAt: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/search — universal full-text search across all domains
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  const q       = String(req.query["q"] ?? "").trim();
  const rawDoms = req.query["domains"];
  const limit   = Math.min(Number(req.query["limit"]  ?? 50), 200);
  const offset  = Math.max(Number(req.query["offset"] ?? 0),  0);

  if (!q || q.length < 2) {
    res.status(400).json({ error: "Query must be at least 2 characters", code: "QUERY_TOO_SHORT" });
    return;
  }

  const allDomains = [
    "projects", "documents", "people", "leads", "opportunities",
    "healthcare", "legal", "staffing", "conversations", "activity",
  ];

  const requestedDomains: string[] = Array.isArray(rawDoms)
    ? (rawDoms as string[]).filter(d => allDomains.includes(d))
    : typeof rawDoms === "string" && rawDoms
    ? [rawDoms].filter(d => allDomains.includes(d))
    : allDomains;

  const tsQuery    = q.split(/\s+/).filter(Boolean).map(w => `${w}:*`).join(" & ");
  const results:  DomainResult[] = [];

  // ── Projects ──
  if (requestedDomains.includes("projects")) {
    try {
      const rows = await sql`
        SELECT id::text, name AS title,
               COALESCE(LEFT(description, 150), '') AS excerpt,
               created_at,
               ts_rank(
                 to_tsvector('english', COALESCE(name,'') || ' ' || COALESCE(description,'')),
                 to_tsquery('english', ${tsQuery})
               ) AS score
        FROM projects
        WHERE to_tsvector('english', COALESCE(name,'') || ' ' || COALESCE(description,''))
              @@ to_tsquery('english', ${tsQuery})
        ORDER BY score DESC LIMIT ${limit}
      `;
      for (const r of rows) {
        results.push({ domain: "projects", id: r.id, title: r.title, excerpt: r.excerpt,
                       score: parseFloat(r.score) || 0, url: `/projects/${r.id}`, createdAt: r.created_at });
      }
    } catch { /* table may not have data */ }
  }

  // ── Documents ──
  if (requestedDomains.includes("documents")) {
    try {
      const rows = await sql`
        SELECT id::text, title,
               COALESCE(LEFT(content, 150), '') AS excerpt,
               created_at,
               ts_rank(
                 to_tsvector('english', COALESCE(title,'') || ' ' || COALESCE(content,'')),
                 to_tsquery('english', ${tsQuery})
               ) AS score
        FROM documents
        WHERE to_tsvector('english', COALESCE(title,'') || ' ' || COALESCE(content,''))
              @@ to_tsquery('english', ${tsQuery})
        ORDER BY score DESC LIMIT ${limit}
      `;
      for (const r of rows) {
        results.push({ domain: "documents", id: r.id, title: r.title, excerpt: r.excerpt,
                       score: parseFloat(r.score) || 0, url: `/documents/${r.id}`, createdAt: r.created_at });
      }
    } catch { /* skip */ }
  }

  // ── People / CRM ──
  if (requestedDomains.includes("people")) {
    try {
      const rows = await sql`
        SELECT id::text,
               COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') AS title,
               COALESCE(LEFT(notes, 150), COALESCE(company,''), '') AS excerpt,
               created_at,
               ts_rank(
                 to_tsvector('english',
                   COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') || ' ' ||
                   COALESCE(email,'') || ' ' || COALESCE(company,'')),
                 to_tsquery('english', ${tsQuery})
               ) AS score
        FROM people
        WHERE to_tsvector('english',
                COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') || ' ' ||
                COALESCE(email,'') || ' ' || COALESCE(company,''))
              @@ to_tsquery('english', ${tsQuery})
        ORDER BY score DESC LIMIT ${limit}
      `;
      for (const r of rows) {
        results.push({ domain: "people", id: r.id, title: r.title.trim(), excerpt: r.excerpt,
                       score: parseFloat(r.score) || 0, url: `/crm/${r.id}`, createdAt: r.created_at });
      }
    } catch { /* skip */ }
  }

  // ── Leads ──
  if (requestedDomains.includes("leads")) {
    try {
      const rows = await sql`
        SELECT id::text,
               COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') AS title,
               COALESCE(LEFT(notes, 150), COALESCE(company,''), '') AS excerpt,
               created_at,
               ts_rank(
                 to_tsvector('english',
                   COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') || ' ' ||
                   COALESCE(email,'') || ' ' || COALESCE(company,'')),
                 to_tsquery('english', ${tsQuery})
               ) AS score
        FROM leads
        WHERE to_tsvector('english',
                COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') || ' ' ||
                COALESCE(email,'') || ' ' || COALESCE(company,''))
              @@ to_tsquery('english', ${tsQuery})
        ORDER BY score DESC LIMIT ${limit}
      `;
      for (const r of rows) {
        results.push({ domain: "leads", id: r.id, title: r.title.trim(), excerpt: r.excerpt,
                       score: parseFloat(r.score) || 0, url: `/leads/${r.id}`, createdAt: r.created_at });
      }
    } catch { /* skip */ }
  }

  // ── Opportunities ──
  if (requestedDomains.includes("opportunities")) {
    try {
      const rows = await sql`
        SELECT id::text, title,
               COALESCE(LEFT(description, 150), '') AS excerpt,
               created_at,
               ts_rank(
                 to_tsvector('english', COALESCE(title,'') || ' ' || COALESCE(description,'')),
                 to_tsquery('english', ${tsQuery})
               ) AS score
        FROM opportunities
        WHERE to_tsvector('english', COALESCE(title,'') || ' ' || COALESCE(description,''))
              @@ to_tsquery('english', ${tsQuery})
        ORDER BY score DESC LIMIT ${limit}
      `;
      for (const r of rows) {
        results.push({ domain: "opportunities", id: r.id, title: r.title, excerpt: r.excerpt,
                       score: parseFloat(r.score) || 0, url: `/opportunities/${r.id}`, createdAt: r.created_at });
      }
    } catch { /* skip */ }
  }

  // ── Healthcare ──
  if (requestedDomains.includes("healthcare")) {
    try {
      const rows = await sql`
        SELECT id::text,
               COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') AS title,
               COALESCE(LEFT(notes, 150), COALESCE(diagnosis,''), '') AS excerpt,
               created_at,
               ts_rank(
                 to_tsvector('english',
                   COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') || ' ' ||
                   COALESCE(diagnosis,'') || ' ' || COALESCE(notes,'')),
                 to_tsquery('english', ${tsQuery})
               ) AS score
        FROM patients
        WHERE to_tsvector('english',
                COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') || ' ' ||
                COALESCE(diagnosis,'') || ' ' || COALESCE(notes,''))
              @@ to_tsquery('english', ${tsQuery})
        ORDER BY score DESC LIMIT ${limit}
      `;
      for (const r of rows) {
        results.push({ domain: "healthcare", id: r.id, title: r.title.trim(), excerpt: r.excerpt,
                       score: parseFloat(r.score) || 0, url: `/healthcare/patients/${r.id}`, createdAt: r.created_at });
      }
    } catch { /* skip */ }
  }

  // ── Legal ──
  if (requestedDomains.includes("legal")) {
    try {
      const rows = await sql`
        SELECT id::text,
               COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') AS title,
               COALESCE(LEFT(notes, 150), COALESCE(case_type,''), '') AS excerpt,
               created_at,
               ts_rank(
                 to_tsvector('english',
                   COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') || ' ' ||
                   COALESCE(case_type,'') || ' ' || COALESCE(notes,'')),
                 to_tsquery('english', ${tsQuery})
               ) AS score
        FROM legal_clients
        WHERE to_tsvector('english',
                COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') || ' ' ||
                COALESCE(case_type,'') || ' ' || COALESCE(notes,''))
              @@ to_tsquery('english', ${tsQuery})
        ORDER BY score DESC LIMIT ${limit}
      `;
      for (const r of rows) {
        results.push({ domain: "legal", id: r.id, title: r.title.trim(), excerpt: r.excerpt,
                       score: parseFloat(r.score) || 0, url: `/legal/clients/${r.id}`, createdAt: r.created_at });
      }
    } catch { /* skip */ }
  }

  // ── Staffing ──
  if (requestedDomains.includes("staffing")) {
    try {
      const rows = await sql`
        SELECT id::text,
               COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') AS title,
               COALESCE(LEFT(notes, 150), COALESCE(skills,''), '') AS excerpt,
               created_at,
               ts_rank(
                 to_tsvector('english',
                   COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') || ' ' ||
                   COALESCE(skills,'') || ' ' || COALESCE(notes,'')),
                 to_tsquery('english', ${tsQuery})
               ) AS score
        FROM candidates
        WHERE to_tsvector('english',
                COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') || ' ' ||
                COALESCE(skills,'') || ' ' || COALESCE(notes,''))
              @@ to_tsquery('english', ${tsQuery})
        ORDER BY score DESC LIMIT ${limit}
      `;
      for (const r of rows) {
        results.push({ domain: "staffing", id: r.id, title: r.title.trim(), excerpt: r.excerpt,
                       score: parseFloat(r.score) || 0, url: `/staffing/candidates/${r.id}`, createdAt: r.created_at });
      }
    } catch { /* skip */ }
  }

  // ── Activity Log ──
  if (requestedDomains.includes("activity")) {
    try {
      const rows = await sql`
        SELECT id::text,
               action AS title,
               COALESCE(LEFT(details::text, 150), '') AS excerpt,
               created_at,
               ts_rank(
                 to_tsvector('english', COALESCE(action,'') || ' ' || COALESCE(details::text,'')),
                 to_tsquery('english', ${tsQuery})
               ) AS score
        FROM activity_log
        WHERE to_tsvector('english', COALESCE(action,'') || ' ' || COALESCE(details::text,''))
              @@ to_tsquery('english', ${tsQuery})
        ORDER BY score DESC LIMIT ${limit}
      `;
      for (const r of rows) {
        results.push({ domain: "activity", id: r.id, title: r.title, excerpt: r.excerpt,
                       score: parseFloat(r.score) || 0, url: `/activity/${r.id}`, createdAt: r.created_at });
      }
    } catch { /* skip */ }
  }

  // ── Sort all results by score ──
  results.sort((a, b) => b.score - a.score);

  const paginated = results.slice(offset, offset + limit);

  // ── Group by domain ──
  const byDomain: Record<string, DomainResult[]> = {};
  for (const r of paginated) {
    byDomain[r.domain] = byDomain[r.domain] ?? [];
    byDomain[r.domain]!.push(r);
  }

  res.json({
    ok:      true,
    query:   q,
    total:   results.length,
    offset,
    limit,
    domains: requestedDomains,
    results: paginated,
    byDomain,
    timing:  Date.now(),
  });
});

// ── GET /api/search/suggest — lightweight autocomplete ──
router.get("/suggest", async (req: Request, res: Response) => {
  const q = String(req.query["q"] ?? "").trim();
  if (!q || q.length < 2) { res.json({ ok: true, suggestions: [] }); return; }

  const suggestions: { label: string; domain: string; url: string }[] = [];

  try {
    const projects = await sql`
      SELECT name AS label, 'projects' AS domain, '/projects/' || id::text AS url
      FROM projects WHERE name ILIKE ${"%" + q + "%"} LIMIT 5
    `;
    for (const r of projects) suggestions.push(r as { label: string; domain: string; url: string });
  } catch { /* skip */ }

  try {
    const people = await sql`
      SELECT COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') AS label,
             'people' AS domain, '/crm/' || id::text AS url
      FROM people
      WHERE COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') ILIKE ${"%" + q + "%"}
      LIMIT 5
    `;
    for (const r of people) suggestions.push(r as { label: string; domain: string; url: string });
  } catch { /* skip */ }

  res.json({ ok: true, query: q, suggestions: suggestions.slice(0, 10) });
});

export default router;
