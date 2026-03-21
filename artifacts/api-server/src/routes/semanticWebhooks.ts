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

const router = Router();

const STORE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : "http://localhost:8080";

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
    // ── Signature verification (enable in production) ──────────────────────
    // const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
    // if (webhookSecret) {
    //   const sig = req.headers["stripe-signature"] as string;
    //   stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    // }

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

    // Only process checkout completion events
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

    // ── Capture customer ───────────────────────────────────────────────────
    const customerId = crypto.randomUUID();
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
      channel: session.metadata?.["channel"] || "stripe-checkout",
      deliveryEmailSent: false,
      purchasedAt: new Date().toISOString(),
    });

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
