/**
 * routes/semanticWebhooks.ts
 * --------------------------
 * Stripe webhook handler for the Semantic Product Layer.
 *
 * POST /api/semantic/webhooks/checkout-complete
 *   Receives checkout.session.completed events from Stripe.
 *   Captures customer data and sends an immediate delivery email via Resend.
 *
 * Setup in Stripe Dashboard:
 *   Dashboard → Webhooks → Add endpoint → /api/semantic/webhooks/checkout-complete
 *   Events to send: checkout.session.completed
 *
 * Production hardening required:
 *   - Set STRIPE_WEBHOOK_SECRET in Replit Secrets
 *   - Enable signature verification (see comment below)
 */

import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { addCustomer } from "../semantic/customerStore.js";
import { getFromRegistry, getRegistry } from "../semantic/registry.js";
import { sendEmailNotification } from "../utils/notifications.js";
import { scheduleFollowups } from "../semantic/emailScheduler.js";
import { queueMessage } from "../services/ventonWay.js";
import { getPublicBaseUrl } from "../utils/publicUrl.js";
import { insertCustomer, markWebhookProcessed } from "../lib/db.js";

const router = Router();

const STORE_URL = getPublicBaseUrl();

// ── Delivery email HTML ───────────────────────────────────────────────────────
function buildDeliveryEmailHTML(opts: {
  customerName: string;
  productTitle: string;
  productFormat: string;
  priceCents: number;
  productPageUrl: string;
  productDescription: string;
}): string {
  const price = (opts.priceCents / 100).toFixed(2);
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">

      <div style="background:linear-gradient(135deg,#6366f1,#818cf8);padding:48px 40px;text-align:center;border-radius:16px 16px 0 0;">
        <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:999px;padding:6px 20px;font-size:12px;font-weight:700;color:white;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:20px;">
          ${opts.productFormat}
        </div>
        <h1 style="color:white;font-size:28px;font-weight:800;margin:0 0 12px;line-height:1.3;">
          Your purchase is confirmed
        </h1>
        <p style="color:rgba(255,255,255,0.85);font-size:16px;margin:0;">
          Thank you${opts.customerName ? ", " + opts.customerName : ""}. Your order is ready.
        </p>
      </div>

      <div style="padding:40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;">

        <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:32px;border:1px solid #f1f5f9;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Your Product</p>
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1e293b;">${opts.productTitle}</h2>
          <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.6;">${opts.productDescription}</p>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;color:#94a3b8;">Amount paid</span>
            <span style="font-size:20px;font-weight:800;color:#6366f1;">$${price}</span>
          </div>
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <a href="${opts.productPageUrl}"
             style="display:inline-block;background:#6366f1;color:white;text-decoration:none;border-radius:12px;padding:16px 40px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(99,102,241,0.3);">
            Access Your Product →
          </a>
        </div>

        <div style="border-top:1px solid #f1f5f9;padding-top:24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#1e293b;">What's included:</p>
          <ul style="margin:0;padding:0 0 0 20px;color:#64748b;font-size:13px;line-height:2;">
            <li>Instant access — available immediately</li>
            <li>Full commercial use rights</li>
            <li>Lifetime access — no expiration</li>
            <li>AI-generated, professionally structured content</li>
          </ul>
        </div>

        <div style="margin-top:24px;background:#ede9fe;border-radius:12px;padding:16px 20px;font-size:13px;color:#5b21b6;">
          <strong>Need help?</strong> Reply to this email and we'll take care of you.
        </div>
      </div>

      <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:24px;padding-bottom:32px;">
        CreateAI Brain · Powered by the Semantic Product Layer · ${new Date().toLocaleDateString()}
      </p>
    </div>
  `;
}

// ── POST /checkout-complete ───────────────────────────────────────────────────
// Stripe webhook: checkout.session.completed
router.post("/checkout-complete", async (req: Request, res: Response) => {
  try {
    // ── Signature verification — auto-enabled when STRIPE_WEBHOOK_SECRET is set ─
    const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
    if (webhookSecret) {
      const sig = req.headers["stripe-signature"] as string | undefined;
      if (!sig) {
        console.warn("[SemanticWebhook] Webhook signature missing — rejecting");
        res.status(400).json({ ok: false, error: "Missing stripe-signature header" });
        return;
      }
      try {
        const { getUncachableStripeClient } = await import("../services/integrations/stripeClient.js");
        const stripeClient = await getUncachableStripeClient();
        // Use rawBody (Buffer) if available; fall back to re-serialized JSON
        const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody
          ?? Buffer.from(JSON.stringify(req.body), "utf8");
        stripeClient.webhooks.constructEvent(
          rawBody,
          sig,
          webhookSecret
        );
        console.log("[SemanticWebhook] ✅ Webhook signature verified");
      } catch (sigErr: unknown) {
        const msg = sigErr instanceof Error ? sigErr.message : String(sigErr);
        console.error("[SemanticWebhook] ❌ Webhook signature verification failed:", msg);
        res.status(400).json({ ok: false, error: `Webhook signature invalid: ${msg}` });
        return;
      }
    }

    const body = req.body as {
      type?: string;
      data?: {
        object?: {
          id?: string;
          payment_intent?: string;
          customer_details?: { email?: string; name?: string };
          customer_email?: string;
          metadata?: Record<string, string>;
          amount_total?: number;
          currency?: string;
        };
      };
    };

    const eventType = body.type;

    // ── Idempotency check (runs for ALL event types) ────────────────────────
    const eventId = (req.body as { id?: string }).id ?? crypto.randomUUID();
    const isNew = await markWebhookProcessed(eventId, eventType ?? "unknown", body).catch(() => true);
    if (!isNew) {
      console.log("[SemanticWebhook] Duplicate event ignored:", eventId, eventType);
      res.json({ ok: true, duplicate: true });
      return;
    }

    // ── customer.created ────────────────────────────────────────────────────
    if (eventType === "customer.created") {
      const obj = body.data?.object as Record<string, unknown> | undefined;
      const custEmail = (obj?.["email"] as string | undefined) ?? "";
      const custName  = (obj?.["name"]  as string | undefined) ?? "";
      if (custEmail) {
        try {
          const { db, usersTable } = await import("@workspace/db");
          const { eq } = await import("drizzle-orm");
          const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, custEmail)).limit(1);
          if (existing.length === 0) {
            console.log(`[SemanticWebhook] customer.created — no platform account for ${custEmail}, skipping role update`);
          } else {
            console.log(`[SemanticWebhook] customer.created — platform account exists for ${custEmail}`);
          }
        } catch (e) { console.warn("[SemanticWebhook] customer.created DB check failed (non-fatal):", String(e)); }

        // ── Send welcome email ───────────────────────────────────────────
        try {
          const firstName = custName ? custName.split(" ")[0] : "there";
          const welcomeHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
            body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:0}
            .wrap{max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
            .header{background:linear-gradient(135deg,#7a9068 0%,#5a6d50 100%);padding:28px 32px}
            .header h1{color:#fff;font-size:20px;font-weight:800;margin:0;letter-spacing:-0.02em}
            .header p{color:rgba(255,255,255,0.80);font-size:13px;margin:6px 0 0}
            .body{padding:24px 32px}
            .body p{color:#374151;font-size:14px;line-height:1.7;margin:0 0 12px}
            .feature{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;padding:10px 12px;background:#f0f4ee;border-radius:10px}
            .feature-icon{font-size:18px;flex-shrink:0;margin-top:1px}
            .feature-text{font-size:12px;color:#374151;line-height:1.5}
            .feature-label{font-weight:700;color:#5a6d50;font-size:12px}
            .cta{display:block;background:linear-gradient(135deg,#7a9068 0%,#5a6d50 100%);color:#fff;text-align:center;padding:13px 24px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;margin:18px 0 0}
            .footer{padding:14px 32px;background:#f8fafc;font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #f1f5f9}
          </style></head><body>
            <div class="wrap">
              <div class="header">
                <h1>🧠 Welcome to CreateAI Brain</h1>
                <p>Your account is ready, ${firstName}</p>
              </div>
              <div class="body">
                <p>You've just been added to CreateAI Brain — the AI OS with 408 tools for business, creativity, health, research, and more.</p>
                <div class="feature"><div class="feature-icon">🚀</div><div class="feature-text"><div class="feature-label">408 AI Apps, Ready Now</div>Business strategy, content creation, legal drafting, health coaching, and more — all powered by real AI.</div></div>
                <div class="feature"><div class="feature-icon">⌘K</div><div class="feature-text"><div class="feature-label">Quick Launcher</div>Press Cmd+K (or Ctrl+K) anywhere on the platform to instantly find and open any app.</div></div>
                <div class="feature"><div class="feature-icon">📚</div><div class="feature-text"><div class="feature-label">Output Library</div>Every AI response you generate saves automatically — searchable and exportable any time.</div></div>
                <a href="https://createai.digital" class="cta">Open CreateAI Brain →</a>
              </div>
              <div class="footer">CreateAI Brain by Lakeside Trinity LLC · createai.digital</div>
            </div>
          </body></html>`;
          await sendEmailNotification(
            [custEmail],
            `Welcome to CreateAI Brain, ${firstName}! 🧠`,
            welcomeHtml,
          );
          console.log(`[SemanticWebhook] customer.created — welcome email sent → ${custEmail}`);

          // ── Email 2: Getting started — queued for 2 days later ──────────
          const day2 = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
          const email2Html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
            body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:0}
            .wrap{max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
            .header{background:linear-gradient(135deg,#7a9068 0%,#5a6d50 100%);padding:28px 32px}
            .header h1{color:#fff;font-size:20px;font-weight:800;margin:0;letter-spacing:-0.02em}
            .header p{color:rgba(255,255,255,0.80);font-size:13px;margin:6px 0 0}
            .body{padding:24px 32px}
            .body p{color:#374151;font-size:14px;line-height:1.7;margin:0 0 12px}
            .step{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;padding:12px 14px;background:#f0f4ee;border-radius:10px}
            .step-num{width:24px;height:24px;background:#7a9068;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0}
            .step-text{font-size:13px;color:#374151;line-height:1.5}
            .step-label{font-weight:700;color:#5a6d50;font-size:13px}
            .cta{display:block;background:linear-gradient(135deg,#7a9068 0%,#5a6d50 100%);color:#fff;text-align:center;padding:13px 24px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;margin:18px 0 0}
            .footer{padding:14px 32px;background:#f8fafc;font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #f1f5f9}
          </style></head><body>
            <div class="wrap">
              <div class="header">
                <h1>🚀 Your First Steps on CreateAI Brain</h1>
                <p>Getting the most out of 408 AI apps starts here</p>
              </div>
              <div class="body">
                <p>Hi ${firstName}, you have access to 408 AI-powered tools. Here's the fastest way to get results:</p>
                <div class="step"><div class="step-num">1</div><div class="step-text"><div class="step-label">Press Cmd+K (or Ctrl+K)</div>Open the quick launcher and search for any tool by name or what you want to do.</div></div>
                <div class="step"><div class="step-num">2</div><div class="step-text"><div class="step-label">Try the Output Library</div>Every AI response saves automatically. Go to /library to find, search, and export anything you've generated.</div></div>
                <div class="step"><div class="step-num">3</div><div class="step-text"><div class="step-label">Open the Brain Hub</div>Your central dashboard shows usage, recent outputs, and personalized recommendations.</div></div>
                <a href="https://createai.digital" class="cta">Open CreateAI Brain →</a>
              </div>
              <div class="footer">CreateAI Brain by Lakeside Trinity LLC · createai.digital</div>
            </div>
          </body></html>`;
          await queueMessage({
            type: "email",
            recipient: custEmail,
            subject: `Your first steps on CreateAI Brain, ${firstName}`,
            body: email2Html,
            scheduledAt: day2,
            metadata: { sequence: "welcome", step: 2, trigger: "customer.created" },
          });

          // ── Email 3: Tips & power moves — queued for 5 days later ───────
          const day5 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
          const email3Html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
            body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:0}
            .wrap{max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
            .header{background:linear-gradient(135deg,#7a9068 0%,#5a6d50 100%);padding:28px 32px}
            .header h1{color:#fff;font-size:20px;font-weight:800;margin:0;letter-spacing:-0.02em}
            .header p{color:rgba(255,255,255,0.80);font-size:13px;margin:6px 0 0}
            .body{padding:24px 32px}
            .body p{color:#374151;font-size:14px;line-height:1.7;margin:0 0 12px}
            .tip{margin-bottom:12px;padding:12px 14px;background:#f0f4ee;border-radius:10px;border-left:3px solid #7a9068}
            .tip-label{font-weight:700;color:#5a6d50;font-size:13px;margin-bottom:4px}
            .tip-text{font-size:12px;color:#374151;line-height:1.5;margin:0}
            .cta{display:block;background:linear-gradient(135deg,#7a9068 0%,#5a6d50 100%);color:#fff;text-align:center;padding:13px 24px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;margin:18px 0 0}
            .footer{padding:14px 32px;background:#f8fafc;font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #f1f5f9}
          </style></head><body>
            <div class="wrap">
              <div class="header">
                <h1>💡 Your Week-One Power Moves</h1>
                <p>Unlock the full potential of CreateAI Brain</p>
              </div>
              <div class="body">
                <p>Hi ${firstName}, you've had a full week to explore. Here are the most powerful workflows our members use daily:</p>
                <div class="tip"><div class="tip-label">⚡ Chain Tools Together</div><p class="tip-text">Run a market research tool, pipe the output into a pitch deck tool, then export as PDF — all in under 5 minutes.</p></div>
                <div class="tip"><div class="tip-label">📁 Build a Personal Output Library</div><p class="tip-text">Everything you generate is saved at /library. Pin your best outputs and export bundles as PDFs to share with clients.</p></div>
                <div class="tip"><div class="tip-label">🏥 Cross-Domain Intelligence</div><p class="tip-text">Legal tools feed into HR tools. Health insights connect to productivity apps. Your platform sees the whole picture — use it.</p></div>
                <div class="tip"><div class="tip-label">🤖 UCPXAgent Override Mode</div><p class="tip-text">Open the UCPXAgent panel and activate a meta-agent to analyze your entire workspace and recommend what to do next.</p></div>
                <a href="https://createai.digital" class="cta">Open CreateAI Brain →</a>
              </div>
              <div class="footer">CreateAI Brain by Lakeside Trinity LLC · createai.digital</div>
            </div>
          </body></html>`;
          await queueMessage({
            type: "email",
            recipient: custEmail,
            subject: `Your week-one power moves on CreateAI Brain 💡`,
            body: email3Html,
            scheduledAt: day5,
            metadata: { sequence: "welcome", step: 3, trigger: "customer.created" },
          });
          console.log(`[SemanticWebhook] customer.created — welcome sequence emails 2+3 queued via VentonWay → ${custEmail}`);
        } catch (welErr) {
          console.warn("[SemanticWebhook] customer.created welcome email failed (non-fatal):", String(welErr));
        }

        console.log(`[SemanticWebhook] customer.created processed — email:${custEmail} name:${custName}`);
      }
      res.json({ ok: true, event: "customer.created", email: custEmail });
      return;
    }

    // ── invoice.paid ────────────────────────────────────────────────────────
    if (eventType === "invoice.paid") {
      const obj = body.data?.object as Record<string, unknown> | undefined;
      const invEmail  = (obj?.["customer_email"] as string | undefined) ?? "";
      const invAmount = (obj?.["amount_paid"]    as number | undefined) ?? 0;
      const invSubId  = (obj?.["subscription"]   as string | undefined) ?? "";
      if (invEmail && invAmount > 0) {
        const points = Math.floor(invAmount / 100);
        try {
          const { awardLoyaltyPoints } = await import("../lib/db.js");
          await awardLoyaltyPoints(invEmail, points, "subscription_renewal", eventId, "Invoice paid: " + invSubId);
          console.log(`[SemanticWebhook] invoice.paid — ${points} loyalty points awarded to ${invEmail}`);
        } catch (e) { console.warn("[SemanticWebhook] invoice.paid loyalty award failed (non-fatal):", String(e)); }
      }
      console.log(`[SemanticWebhook] invoice.paid processed — email:${invEmail} amount:${invAmount} sub:${invSubId}`);
      res.json({ ok: true, event: "invoice.paid", email: invEmail, amountPaid: invAmount });
      return;
    }

    // ── Unrecognised event types ────────────────────────────────────────────
    if (eventType !== "checkout.session.completed") {
      res.json({ ok: true, ignored: true, type: eventType });
      return;
    }

    const session = body.data?.object;
    if (!session) { res.status(400).json({ ok: false, error: "No session data" }); return; }

    const email = session.customer_details?.email || session.customer_email || "";
    const name = session.customer_details?.name || "";
    const productId = session.metadata?.["semanticProductId"] || "";
    const sessionId = session.id || "";
    const paymentIntentId = String(session.payment_intent || "");
    const priceCents = session.amount_total || 0;
    const currency = session.currency || "usd";

    if (!email) {
      console.warn("[SemanticWebhook] checkout.session.completed with no email — skipping");
      res.json({ ok: true, skipped: "no_email" });
      return;
    }

    // Ensure registry is loaded for product metadata
    await getRegistry();
    const product = productId ? getFromRegistry(productId) : undefined;

    const productTitle = product?.title || session.metadata?.["productTitle"] || "Your CreateAI Brain Product";
    const productFormat = product?.format || session.metadata?.["format"] || "digital";
    const productDescription = product?.shortDescription || "AI-generated digital product.";
    const productPageUrl = productId
      ? `${STORE_URL}/api/semantic/store/${productId}?success=1`
      : `${STORE_URL}/api/semantic/store`;

    // ── Capture customer (in-memory + persistent DB) ───────────────────────
    const customerId = crypto.randomUUID();
    const channelVal = session.metadata?.["channel"] || "stripe-checkout";

    addCustomer({
      id: customerId,
      email,
      name,
      productId,
      productTitle,
      productFormat,
      priceCents,
      currency,
      stripeSessionId: sessionId,
      stripePaymentIntentId: paymentIntentId,
      channel: channelVal,
      deliveryEmailSent: false,
      purchasedAt: new Date().toISOString(),
    });

    // Persist to PostgreSQL (non-blocking — don't fail webhook on DB error)
    insertCustomer({
      id: customerId,
      email,
      name,
      stripeSessionId: sessionId,
      stripePaymentIntent: paymentIntentId,
      stripeCustomerId: String(session.metadata?.["customerId"] ?? ""),
      productId,
      productTitle,
      productFormat,
      priceCents,
      currency,
      channel: channelVal,
      isSubscription: session.metadata?.["type"] === "subscription",
      subscriptionTier: session.metadata?.["tier"],
      deliveryEmailSent: false,
      createdAt: new Date().toISOString(),
    }).catch(e => console.error("[SemanticWebhook] DB persist failed:", e instanceof Error ? e.message : String(e)));

    // ── Assign customer role to matching user account ─────────────────────
    // If the buyer already has a platform account (matched by email), promote
    // them to 'customer'. If they sign up later, auth.ts auto-promotes on login.
    if (email) {
      try {
        const { db, usersTable } = await import("@workspace/db");
        const { eq } = await import("drizzle-orm");
        const result = await db
          .update(usersTable)
          .set({ role: "customer" })
          .where(eq(usersTable.email, email))
          .returning({ id: usersTable.id });
        if (result.length > 0) {
          console.log(`[SemanticWebhook] Customer role assigned to existing account: ${email}`);
        } else {
          console.log(`[SemanticWebhook] No existing account for ${email} — role will be assigned on first login`);
        }
      } catch (roleErr) {
        console.warn("[SemanticWebhook] Customer role assignment skipped (non-fatal):", String(roleErr));
      }
    }

    // ── Auto-award loyalty points (1 point per $1 spent) ───────────────────
    if (priceCents > 0 && email) {
      const pointsToAward = Math.floor(priceCents / 100);
      try {
        const { awardLoyaltyPoints } = await import("../lib/db.js");
        await awardLoyaltyPoints(email, pointsToAward, "purchase", sessionId, "Auto-awarded: " + productTitle);
        console.log("[SemanticWebhook] Loyalty points awarded:", pointsToAward, "pts to", email);
      } catch (loyErr) {
        console.warn("[SemanticWebhook] Loyalty award failed (non-fatal):", String(loyErr));
      }
    }

    // ── Affiliate conversion attribution ───────────────────────────────────
    const refCode = session.metadata?.["refCode"];
    if (refCode) {
      try {
        const { recordAffiliateConversion } = await import("./semanticAffiliate.js");
        recordAffiliateConversion(refCode, priceCents);
        console.log(`[SemanticWebhook] Affiliate conversion recorded — code: ${refCode} · $${(priceCents/100).toFixed(2)}`);
      } catch (affErr) {
        console.warn(`[SemanticWebhook] Affiliate conversion record failed: ${String(affErr)}`);
      }
    }

    // ── Send immediate platform welcome email (separate from product delivery) ──
    if (email) {
      try {
        const welcomeHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
          body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:0}
          .wrap{max-width:540px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
          .header{background:linear-gradient(135deg,#7a9068 0%,#5a6d50 100%);padding:32px 36px}
          .header h1{color:#fff;font-size:22px;font-weight:800;margin:0;letter-spacing:-0.02em}
          .header p{color:rgba(255,255,255,0.80);font-size:14px;margin:8px 0 0}
          .body{padding:28px 36px}
          .body p{color:#374151;font-size:14px;line-height:1.7;margin:0 0 14px}
          .feature{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;padding:12px 14px;background:#f0f4ee;border-radius:10px}
          .feature-icon{font-size:20px;flex-shrink:0;margin-top:2px}
          .feature-text{font-size:13px;color:#374151;line-height:1.5}
          .feature-label{font-weight:700;color:#5a6d50;font-size:13px}
          .cta{display:block;background:linear-gradient(135deg,#7a9068 0%,#5a6d50 100%);color:#fff;text-align:center;padding:14px 24px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;margin:20px 0 0}
          .footer{padding:16px 36px;background:#f8fafc;font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #f1f5f9}
        </style></head><body>
          <div class="wrap">
            <div class="header">
              <h1>🧠 Welcome to CreateAI Brain</h1>
              <p>Your full platform access is ready, ${name || "there"}</p>
            </div>
            <div class="body">
              <p>Thanks for your purchase of <strong>${productTitle}</strong>. Your CreateAI Brain workspace is now active with everything you need to get started.</p>
              <div class="feature"><div class="feature-icon">🚀</div><div class="feature-text"><div class="feature-label">408 AI Tools Ready</div>Business, creative, health, research, and more — all powered by real AI.</div></div>
              <div class="feature"><div class="feature-icon">📚</div><div class="feature-text"><div class="feature-label">Output Library</div>Every response you generate saves automatically — searchable, exportable, always there.</div></div>
              <div class="feature"><div class="feature-icon">⌘K</div><div class="feature-text"><div class="feature-label">Quick Launcher</div>Press Cmd+K (or Ctrl+K) anywhere to instantly open any of the 408 apps.</div></div>
              <a href="https://createai.digital" class="cta">Open CreateAI Brain →</a>
            </div>
            <div class="footer">CreateAI Brain by Lakeside Trinity LLC · createai.digital<br/>You're receiving this because you purchased ${productTitle}.</div>
          </div>
        </body></html>`;
        await sendEmailNotification([email], "Your CreateAI Brain workspace is ready", welcomeHtml);
        console.log(`[SemanticWebhook] Platform welcome email sent → ${email}`);
      } catch (welErr) {
        console.warn("[SemanticWebhook] Platform welcome email failed (non-fatal):", String(welErr));
      }
    }

    // ── Schedule T+3 follow-up + T+7 upsell email sequence ────────────────
    scheduleFollowups({
      customerEmail:  email,
      customerName:   name,
      productId,
      productTitle,
      productFormat,
      storeUrl:       STORE_URL,
    });

    // ── Send delivery email ────────────────────────────────────────────────
    const emailSubject = `Your "${productTitle}" is ready — CreateAI Brain`;
    const emailBody = buildDeliveryEmailHTML({
      customerName: name,
      productTitle,
      productFormat,
      priceCents,
      productPageUrl,
      productDescription,
    });

    const emailResult = await sendEmailNotification([email], emailSubject, emailBody);
    const emailSent = emailResult.successCount > 0;

    if (emailSent) {
      console.log(`[SemanticWebhook] ✅ Delivery email sent → ${email} · "${productTitle}"`);
    } else {
      console.warn(`[SemanticWebhook] ⚠️  Delivery email failed → ${email} · ${JSON.stringify(emailResult.results[0])}`);
    }

    res.json({
      ok: true,
      event: "checkout.session.completed",
      customerCaptured: true,
      deliveryEmailSent: emailSent,
      email,
      productTitle,
      channel: "semantic-layer",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[SemanticWebhook] Error:", msg);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /customers ─────────────────────────────────────────────────────────────
// Import here to avoid circular deps — customer data exposed via semanticStore too
router.get("/customers", async (_req: Request, res: Response) => {
  const { getCustomers, getCustomerStats } = await import("../semantic/customerStore.js");
  const stats = getCustomerStats();
  res.json({ ok: true, stats, customers: getCustomers() });
});

export default router;
