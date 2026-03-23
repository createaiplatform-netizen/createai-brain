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
import { scheduleFollowups } from "../semantic/emailScheduler.js";
import { sendEmailNotification } from "../utils/notifications.js";
import { PLATFORM } from "../services/platformIdentity.js";
import { getPublicBaseUrl } from "../utils/publicUrl.js";

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

// ─── POST /subscriptions/platform-webhook ───────────────────────────────────
// Called when a user subscribes to a CreateAI Brain membership plan via Stripe.
// Sends a platform-specific welcome email and schedules T+3/T+7 follow-ups.
router.post("/platform-webhook", async (req: Request, res: Response) => {
  try {
    const {
      email,
      name = "",
      tier = "solo",
    } = req.body as { email?: string; name?: string; tier?: string };

    if (!email?.includes("@")) {
      res.status(400).json({ error: "Valid email required" });
      return;
    }

    const storeUrl    = getPublicBaseUrl();
    const firstName   = name.split(" ")[0] || "";
    const greeting    = firstName ? `, ${firstName}` : "";
    const tierDisplay = tier.charAt(0).toUpperCase() + tier.slice(1);
    const SAGE        = PLATFORM.brandColor;

    const welcomeHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:linear-gradient(135deg,${SAGE},#5d7a52);padding:48px 40px;border-radius:16px 16px 0 0;text-align:center;">
          <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:999px;padding:6px 20px;font-size:11px;font-weight:700;color:white;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:20px;">
            ${tierDisplay} Plan · Active
          </div>
          <h1 style="color:white;font-size:30px;font-weight:800;margin:0;line-height:1.3;">
            Welcome to CreateAI Brain${greeting} 🧠
          </h1>
        </div>
        <div style="padding:40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;">
          <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 24px;">
            Your <strong>${tierDisplay} plan</strong> is live. You now have full access to the AI OS — engines, tools, and automations built for the way you work.
          </p>
          <div style="background:#f0f4ee;border-left:4px solid ${SAGE};border-radius:0 12px 12px 0;padding:20px 24px;margin-bottom:28px;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Your first 3 moves</p>
            <ol style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.9;">
              <li>Open <strong>Brain Hub</strong> and run your first AI engine end-to-end</li>
              <li>Save the output to your <strong>Output Library</strong> (it auto-saves)</li>
              <li>Press <strong>⌘K</strong> to search all 400+ tools from anywhere</li>
            </ol>
          </div>
          <a href="${storeUrl}/platform"
             style="display:inline-block;background:${SAGE};color:white;text-decoration:none;border-radius:12px;padding:16px 32px;font-size:15px;font-weight:700;letter-spacing:-0.01em;">
            Open CreateAI Brain →
          </a>
          <p style="color:#94a3b8;font-size:13px;margin-top:24px;line-height:1.6;">
            Questions? Reply directly to this email. We read every one.
          </p>
        </div>
        <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:20px;padding-bottom:24px;">
          ${PLATFORM.displayName} by Lakeside Trinity LLC ·
          <a href="mailto:${PLATFORM.supportEmail}?subject=Unsubscribe" style="color:#94a3b8;text-decoration:none;">Unsubscribe</a>
        </p>
      </div>
    `;

    // Send immediate welcome email (fire-and-forget)
    void sendEmailNotification(
      [email],
      `Welcome to CreateAI Brain — Your ${tierDisplay} plan is active`,
      welcomeHtml,
    );

    // Schedule T+3 check-in + T+7 upsell drip
    scheduleFollowups({
      customerEmail: email,
      customerName:  name,
      productId:     `platform_${tier}`,
      productTitle:  `CreateAI Brain ${tierDisplay}`,
      productFormat: "platform",
      storeUrl,
    });

    console.log(`[PlatformWebhook] Welcome + drip scheduled for ${email} (${tier})`);
    res.json({ ok: true, message: "Welcome email sent and drip scheduled" });
  } catch (err) {
    console.error("[subscriptions] POST /platform-webhook:", err);
    res.status(500).json({ error: "Failed to process subscription webhook" });
  }
});

export default router;
