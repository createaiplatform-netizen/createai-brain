/**
 * subscriptions.ts — User subscription & revenue share management
 *
 *   GET  /subscriptions/me           — user: get own subscription
 *   GET  /subscriptions              — admin: list all (with user info)
 *   PUT  /subscriptions/:userId      — admin: update tier / platform cut
 *   POST /subscriptions/:userId/tokens — admin: adjust token balance
 */

import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db, userSubscriptions, usersTable } from "@workspace/db";
import { logAudit } from "../services/audit";
import type { Request, Response } from "express";

const router = Router();

function requireAdmin(req: Request, res: Response, next: () => void) {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const role = (req.user as { role?: string }).role ?? "";
  if (!["founder", "admin"].includes(role)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  next();
}

// ─── GET /subscriptions/me ──────────────────────────────────────────────────
router.get("/me", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id ?? "";
  try {
    const [sub] = await db.select().from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    if (!sub) {
      res.json({ subscription: { tier: "free", tokenBalance: 0, monthlyLimit: 50, platformCutPct: 25 } });
      return;
    }
    res.json({ subscription: sub });
  } catch (err) {
    console.error("[subscriptions] GET /me:", err);
    res.status(500).json({ error: "Failed to get subscription" });
  }
});

// ─── GET /subscriptions (admin) ─────────────────────────────────────────────
router.get("/", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const subs = await db
      .select({
        id:             userSubscriptions.id,
        userId:         userSubscriptions.userId,
        tier:           userSubscriptions.tier,
        tokenBalance:   userSubscriptions.tokenBalance,
        monthlyLimit:   userSubscriptions.monthlyLimit,
        platformCutPct: userSubscriptions.platformCutPct,
        overriddenBy:   userSubscriptions.overriddenBy,
        overriddenAt:   userSubscriptions.overriddenAt,
        notes:          userSubscriptions.notes,
        isActive:       userSubscriptions.isActive,
        createdAt:      userSubscriptions.createdAt,
        updatedAt:      userSubscriptions.updatedAt,
        email:          usersTable.email,
        firstName:      usersTable.firstName,
        lastName:       usersTable.lastName,
      })
      .from(userSubscriptions)
      .leftJoin(usersTable, eq(userSubscriptions.userId, usersTable.id))
      .orderBy(desc(userSubscriptions.createdAt));

    res.json({ subscriptions: subs });
  } catch (err) {
    console.error("[subscriptions] GET /:", err);
    res.status(500).json({ error: "Failed to list subscriptions" });
  }
});

// ─── PUT /subscriptions/:userId (admin) ─────────────────────────────────────
router.put("/:userId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const { tier, tokenBalance, monthlyLimit, platformCutPct, notes, isActive } = req.body as {
      tier?: string; tokenBalance?: number; monthlyLimit?: number;
      platformCutPct?: number; notes?: string; isActive?: boolean;
    };

    const [existing] = await db.select().from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (tier           !== undefined) updates.tier           = tier;
    if (tokenBalance   !== undefined) updates.tokenBalance   = tokenBalance;
    if (monthlyLimit   !== undefined) updates.monthlyLimit   = monthlyLimit;
    if (notes          !== undefined) updates.notes          = notes;
    if (isActive       !== undefined) updates.isActive       = isActive;
    if (platformCutPct !== undefined) {
      updates.platformCutPct = platformCutPct;
      updates.overriddenBy   = req.user?.id ?? null;
      updates.overriddenAt   = new Date();
    }

    if (!existing) {
      const [sub] = await db.insert(userSubscriptions).values({
        userId,
        tier:           tier           ?? "free",
        tokenBalance:   tokenBalance   ?? 0,
        monthlyLimit:   monthlyLimit   ?? 50,
        platformCutPct: platformCutPct ?? 25,
        notes:          notes          ?? null,
        overriddenBy:   platformCutPct !== undefined ? (req.user?.id ?? null) : null,
        overriddenAt:   platformCutPct !== undefined ? new Date() : null,
        isActive:       isActive       ?? true,
      }).returning();

      await logAudit(db, req, {
        action: "subscription.created",
        resource: `sub:${sub.id}`,
        resourceType: "subscription",
        metadata: { targetUser: userId, tier, platformCutPct },
      });
      res.status(201).json({ subscription: sub });
      return;
    }

    await db.update(userSubscriptions).set(updates)
      .where(eq(userSubscriptions.userId, userId));

    const [updated] = await db.select().from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    await logAudit(db, req, {
      action: "subscription.updated",
      resource: `sub:${updated.id}`,
      resourceType: "subscription",
      metadata: { targetUser: userId, changes: updates },
    });
    res.json({ subscription: updated });
  } catch (err) {
    console.error("[subscriptions] PUT /:userId:", err);
    res.status(500).json({ error: "Failed to update subscription" });
  }
});

// ─── POST /subscriptions/:userId/tokens (admin) ─────────────────────────────
router.post("/:userId/tokens", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const { delta } = req.body as { delta?: number };

    if (delta === undefined || isNaN(Number(delta))) {
      res.status(400).json({ error: "delta (number) required" }); return;
    }

    const [existing] = await db.select().from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));
    if (!existing) { res.status(404).json({ error: "Subscription not found" }); return; }

    const newBalance = Math.max(0, existing.tokenBalance + Number(delta));
    await db.update(userSubscriptions)
      .set({ tokenBalance: newBalance, updatedAt: new Date() })
      .where(eq(userSubscriptions.userId, userId));

    await logAudit(db, req, {
      action: "subscription.tokens_adjusted",
      resource: `sub:${existing.id}`,
      resourceType: "subscription",
      metadata: { targetUser: userId, delta, newBalance },
    });

    res.json({ tokenBalance: newBalance });
  } catch (err) {
    console.error("[subscriptions] POST /:userId/tokens:", err);
    res.status(500).json({ error: "Failed to adjust tokens" });
  }
});

export default router;
