/**
 * routes/leads.ts — Internal Lead Capture System
 *
 * Replaces Mailchimp / ConvertKit / ActiveCampaign entirely.
 * All leads stored in your own PostgreSQL database.
 *
 * POST /api/leads/capture — public, submit email from SEO landing page
 * GET  /api/leads/export  — admin: download CSV of all leads
 * GET  /api/leads/stats   — admin: lead counts by industry/source
 */

import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { leads } from "@workspace/db/schema";
import { eq, desc, sql, gte } from "drizzle-orm";
import { createHash } from "crypto";

const router = Router();

function hashIp(ip: string): string {
  return createHash("sha256").update(`lead-ip-${ip}`).digest("hex").slice(0, 16);
}

// ─── POST /api/leads/capture ──────────────────────────────────────────────────
// Public — no auth required

router.post("/capture", async (req: Request, res: Response) => {
  const { email, name, industry, utmSource, utmMedium, utmCampaign, refCode } =
    req.body as {
      email?: string; name?: string; industry?: string;
      utmSource?: string; utmMedium?: string; utmCampaign?: string; refCode?: string;
    };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ ok: false, error: "Valid email required" });
    return;
  }

  const ip = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "unknown");
  const ipHash = hashIp(ip);

  try {
    await db.insert(leads).values({
      email:       email.toLowerCase().trim(),
      name:        name?.trim() ?? null,
      industry:    industry ?? null,
      utmSource:   utmSource ?? null,
      utmMedium:   utmMedium ?? null,
      utmCampaign: utmCampaign ?? null,
      refCode:     refCode ?? null,
      ipHash,
      status:      "new",
    });
    console.log(`[Leads] Captured: ${email} | industry: ${industry ?? "unknown"} | source: ${utmSource ?? "direct"}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      res.json({ ok: true, message: "Already subscribed" });
      return;
    }
    console.error("[Leads] Capture error:", msg);
  }

  res.json({ ok: true, message: "You're on the list!" });
});

// ─── GET /api/leads/stats ─────────────────────────────────────────────────────

router.get("/stats", async (_req: Request, res: Response) => {
  const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(leads);

  const byIndustry = await db
    .select({ industry: leads.industry, count: sql<number>`count(*)::int` })
    .from(leads)
    .groupBy(leads.industry)
    .orderBy(desc(sql<number>`count(*)`));

  const bySource = await db
    .select({ source: leads.utmSource, count: sql<number>`count(*)::int` })
    .from(leads)
    .groupBy(leads.utmSource)
    .orderBy(desc(sql<number>`count(*)`));

  const last24h = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .where(gte(leads.createdAt, new Date(Date.now() - 86_400_000)));

  const last7d = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .where(gte(leads.createdAt, new Date(Date.now() - 7 * 86_400_000)));

  res.json({
    ok: true,
    total: total?.count ?? 0,
    last24h: last24h[0]?.count ?? 0,
    last7d: last7d[0]?.count ?? 0,
    byIndustry: byIndustry.filter(r => r.industry),
    bySource: bySource.filter(r => r.source),
  });
});

// ─── GET /api/leads/export ────────────────────────────────────────────────────

router.get("/export", async (_req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(leads)
    .orderBy(desc(leads.createdAt))
    .limit(10000);

  const csv = [
    "id,email,name,industry,utm_source,utm_medium,utm_campaign,ref_code,status,created_at",
    ...rows.map(r =>
      [r.id, `"${r.email}"`, `"${r.name ?? ""}"`, r.industry ?? "", r.utmSource ?? "",
       r.utmMedium ?? "", r.utmCampaign ?? "", r.refCode ?? "", r.status,
       r.createdAt.toISOString()].join(",")
    ),
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="createai-leads-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

// ─── GET /api/leads/recent ────────────────────────────────────────────────────

router.get("/recent", async (_req: Request, res: Response) => {
  const rows = await db
    .select({ industry: leads.industry, createdAt: leads.createdAt })
    .from(leads)
    .orderBy(desc(leads.createdAt))
    .limit(20);

  res.json({ ok: true, leads: rows });
});

export default router;
