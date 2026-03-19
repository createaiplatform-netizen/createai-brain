/**
 * invites.ts — Real invite management system
 *
 * Admin-only (create / list / revoke). Any authenticated user can redeem.
 *
 *   POST   /invites          — create invite code (admin+)
 *   GET    /invites          — list all invites   (admin+)
 *   DELETE /invites/:id      — revoke invite      (admin+)
 *   POST   /invites/redeem   — redeem code        (any auth)
 */

import crypto from "crypto";
import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db, invites, userSubscriptions } from "@workspace/db";
import { logAudit } from "../services/audit";
import type { Request, Response } from "express";

const router = Router();

function requireAdmin(req: Request, res: Response, next: () => void) {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const role = (req.user as { role?: string }).role ?? "";
  if (!["founder", "admin"].includes(role)) {
    res.status(403).json({ error: "Forbidden: admin or founder role required" }); return;
  }
  next();
}

function tierLimit(tier: string): number {
  const map: Record<string, number> = {
    free: 50, starter: 200, pro: 1000, enterprise: 9999, custom: 9999,
  };
  return map[tier] ?? 100;
}

// ─── POST /invites ──────────────────────────────────────────────────────────
router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { email, tier, platformCutPct, maxUses, notes, expiresAt } = req.body as {
      email?: string; tier?: string; platformCutPct?: number;
      maxUses?: number; notes?: string; expiresAt?: string;
    };

    const code = crypto.randomBytes(12).toString("hex");

    const [invite] = await db.insert(invites).values({
      code,
      email:          email?.toLowerCase().trim() ?? null,
      tier:           tier ?? "starter",
      platformCutPct: platformCutPct ?? 25,
      maxUses:        maxUses ?? 1,
      notes:          notes ?? null,
      createdBy:      req.user?.id ?? null,
      expiresAt:      expiresAt ? new Date(expiresAt) : null,
      isRevoked:      false,
      usedBy:         null,
    }).returning();

    await logAudit(db, req, {
      action: "invite.created",
      resource: `invite:${invite.id}`,
      resourceType: "invite",
      metadata: { code, tier: invite.tier, email: invite.email, maxUses: invite.maxUses },
    });

    res.status(201).json({ invite });
  } catch (err) {
    console.error("[invites] POST /:", err);
    res.status(500).json({ error: "Failed to create invite" });
  }
});

// ─── GET /invites ───────────────────────────────────────────────────────────
router.get("/", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const all = await db.select().from(invites).orderBy(desc(invites.createdAt));
    res.json({ invites: all });
  } catch (err) {
    console.error("[invites] GET /:", err);
    res.status(500).json({ error: "Failed to list invites" });
  }
});

// ─── DELETE /invites/:id ────────────────────────────────────────────────────
router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    await db.update(invites).set({ isRevoked: true }).where(eq(invites.id, id));

    await logAudit(db, req, {
      action: "invite.revoked",
      resource: `invite:${id}`,
      resourceType: "invite",
    });

    res.json({ success: true });
  } catch (err) {
    console.error("[invites] DELETE /:id:", err);
    res.status(500).json({ error: "Failed to revoke invite" });
  }
});

// ─── POST /invites/redeem ───────────────────────────────────────────────────
router.post("/redeem", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id ?? "";

  try {
    const { code } = req.body as { code?: string };
    if (!code?.trim()) { res.status(400).json({ error: "code required" }); return; }

    const [invite] = await db.select().from(invites).where(eq(invites.code, code.trim()));
    if (!invite)          { res.status(404).json({ error: "Invalid invite code" }); return; }
    if (invite.isRevoked) { res.status(410).json({ error: "Invite has been revoked" }); return; }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      res.status(410).json({ error: "Invite has expired" }); return;
    }
    if (invite.usesCount >= invite.maxUses) {
      res.status(410).json({ error: "Invite has reached its use limit" }); return;
    }

    const [existing] = await db.select().from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    if (!existing) {
      await db.insert(userSubscriptions).values({
        userId,
        tier:           invite.tier,
        platformCutPct: invite.platformCutPct,
        tokenBalance:   0,
        monthlyLimit:   tierLimit(invite.tier),
        isActive:       true,
      });
    } else {
      await db.update(userSubscriptions).set({
        tier:           invite.tier,
        platformCutPct: invite.platformCutPct,
        updatedAt:      new Date(),
      }).where(eq(userSubscriptions.userId, userId));
    }

    await db.update(invites).set({
      usesCount: invite.usesCount + 1,
      usedBy:    userId,
      usedAt:    new Date(),
    }).where(eq(invites.id, invite.id));

    await logAudit(db, req, {
      action: "invite.redeemed",
      resource: `invite:${invite.id}`,
      resourceType: "invite",
      metadata: { code, tier: invite.tier },
    });

    res.json({ success: true, tier: invite.tier, message: `Upgraded to ${invite.tier}` });
  } catch (err) {
    console.error("[invites] POST /redeem:", err);
    res.status(500).json({ error: "Failed to redeem invite" });
  }
});

export default router;
