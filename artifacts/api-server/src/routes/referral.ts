/**
 * routes/referral.ts — Viral Referral Loop System
 *
 * GET  /api/referral/my-link   — get (or create) caller's referral code + stats
 * POST /api/referral/click/:code — record a referral link click (public, no auth)
 * POST /api/referral/convert   — record a conversion (called on signup)
 * GET  /api/referral/stats     — admin: all referral stats
 * GET  /api/referral/leaderboard — top referrers (public — builds social proof)
 */

import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { referrals, referralConversions } from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { createHash } from "crypto";

const router = Router();

function getPublicBaseUrl(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN ?? "localhost:8080";
  return domain.includes("localhost") ? `http://${domain}` : `https://${domain}`;
}

function generateCode(userId: string): string {
  return createHash("sha256")
    .update(`ref-${userId}-createai-v1`)
    .digest("base64url")
    .slice(0, 10)
    .toUpperCase();
}

function getReferralUrl(code: string): string {
  const base = getPublicBaseUrl();
  return `${base}/join/${code}`;
}

// ─── GET /api/referral/my-link ─────────────────────────────────────────────

router.get("/my-link", async (req: Request, res: Response) => {
  const userId = (req as unknown as { user?: { id: string } }).user?.id;
  if (!userId) { res.status(401).json({ ok: false, error: "Unauthenticated" }); return; }

  const code = generateCode(userId);

  let [row] = await db.select().from(referrals).where(eq(referrals.referralCode, code));

  if (!row) {
    [row] = await db.insert(referrals).values({
      referralCode: code,
      referrerId: userId,
    }).onConflictDoNothing().returning();

    if (!row) {
      [row] = await db.select().from(referrals).where(eq(referrals.referralCode, code));
    }
  }

  const conversions = await db
    .select()
    .from(referralConversions)
    .where(eq(referralConversions.referralCode, code))
    .orderBy(desc(referralConversions.convertedAt))
    .limit(20);

  const url = getReferralUrl(code);

  res.json({
    ok: true,
    code,
    url,
    clickCount:   row?.clickCount ?? 0,
    convertCount: row?.convertCount ?? 0,
    conversions:  conversions.map(c => ({ convertedAt: c.convertedAt.toISOString() })),
    shareMessages: {
      twitter:  `I've been using CreateAI Brain — it replaced my entire software stack with one AI OS. Try it: ${url}`,
      linkedin: `My team just switched to CreateAI Brain for HealthOS, LegalPM, and StaffingOS. 122 AI apps in one platform. Here's our link: ${url}`,
      direct:   `Try CreateAI Brain free: ${url}`,
    },
  });
});

// ─── POST /api/referral/click/:code ────────────────────────────────────────
// Public — no auth required. Called when someone visits /join/:code

router.post("/click/:code", async (req: Request, res: Response) => {
  const code = String(req.params["code"] ?? "").toUpperCase().slice(0, 20);
  if (!code) { res.status(400).json({ ok: false, error: "No code" }); return; }

  try {
    await db.update(referrals)
      .set({ clickCount: sql`${referrals.clickCount} + 1` })
      .where(eq(referrals.referralCode, code));
  } catch { /* ok — ignore if code not found */ }

  res.json({ ok: true });
});

// ─── POST /api/referral/convert ────────────────────────────────────────────
// Called after a referred user completes signup

router.post("/convert", async (req: Request, res: Response) => {
  const { code, referredUserId } = req.body as { code?: string; referredUserId?: string };
  if (!code || !referredUserId) { res.status(400).json({ ok: false, error: "code and referredUserId required" }); return; }

  const upperCode = String(code).toUpperCase().slice(0, 20);
  const [row] = await db.select().from(referrals).where(eq(referrals.referralCode, upperCode));
  if (!row) { res.json({ ok: false, error: "Referral code not found" }); return; }

  const existing = await db.select().from(referralConversions)
    .where(eq(referralConversions.referredUserId, referredUserId));
  if (existing.length > 0) { res.json({ ok: true, alreadyConverted: true }); return; }

  await db.insert(referralConversions).values({
    referralCode: upperCode,
    referrerId: row.referrerId,
    referredUserId,
  });

  await db.update(referrals)
    .set({ convertCount: sql`${referrals.convertCount} + 1` })
    .where(eq(referrals.referralCode, upperCode));

  res.json({ ok: true, referrerId: row.referrerId, alreadyConverted: false });
});

// ─── GET /api/referral/leaderboard ────────────────────────────────────────

router.get("/leaderboard", async (_req: Request, res: Response) => {
  const top = await db
    .select({ referrerId: referrals.referrerId, convertCount: referrals.convertCount, clickCount: referrals.clickCount })
    .from(referrals)
    .orderBy(desc(referrals.convertCount))
    .limit(10);

  res.json({
    ok: true,
    leaderboard: top.map((r, i) => ({
      rank: i + 1,
      convertCount: r.convertCount,
      clickCount: r.clickCount,
      displayName: `User ${r.referrerId.slice(-4)}`,
    })),
  });
});

// ─── GET /api/referral/stats ──────────────────────────────────────────────

router.get("/stats", async (_req: Request, res: Response) => {
  const [totals] = await db.select({
    totalReferrers: sql<number>`count(distinct ${referrals.referrerId})::int`,
    totalClicks:    sql<number>`sum(${referrals.clickCount})::int`,
    totalConverts:  sql<number>`sum(${referrals.convertCount})::int`,
  }).from(referrals);

  res.json({ ok: true, ...totals });
});

// ─── GET /api/referral/info/:code ─────────────────────────────────────────
// Public — fetch referrer info for the join page

router.get("/info/:code", async (req: Request, res: Response) => {
  const code = String(req.params["code"] ?? "").toUpperCase().slice(0, 20);
  const [row] = await db.select().from(referrals).where(eq(referrals.referralCode, code));

  if (!row) {
    res.json({ ok: false, valid: false });
    return;
  }

  res.json({
    ok: true,
    valid: true,
    code,
    convertCount: row.convertCount,
  });
});

export default router;
