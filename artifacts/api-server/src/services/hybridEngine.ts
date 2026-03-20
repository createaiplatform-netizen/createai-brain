/**
 * hybridEngine.ts — Hybrid Multi-Rail Engine
 * Spec: HYBRID-MULTI-RAIL-ENGINE (Pasted--HYBRID-MULTI-RAIL...)
 *
 * External + Internal unified system:
 *   - hybridCheckout → Stripe PaymentIntent when live; internal queue otherwise
 *   - hybridMessage  → Resend (email) / Twilio (SMS) when live; internal queue otherwise
 *   - startHybridEngine → 15s recovery loop that drains queues when providers come online
 *
 * Provider detection uses the existing credential helpers from notifications.ts
 * so this file stays in sync with the rest of the notification layer automatically.
 */

import { randomUUID }           from "crypto";
import { getUncachableStripeClient, probeStripeConnection } from "./integrations/stripeClient.js";
import { sendEmailNotification, sendSMSNotification, credentialStatus } from "../utils/notifications.js";

// ─── Internal State ──────────────────────────────────────────────────────────

interface PaymentEntry {
  id:        string;
  productId: string;
  name:      string;
  amount:    number;   // in CENTS
  currency:  string;
  user:      string;
  queuedAt:  string;
}

interface MessageEntry {
  id:       string;
  type:     "email" | "sms";
  to:       string;
  content:  string;
  queuedAt: string;
}

interface SystemStats {
  revenue:       number;   // live-processed revenue (cents)
  queuedRevenue: number;   // revenue captured but not yet processed
  messagesSent:  number;
  messagesQueued: number;
}

const queues: { payments: PaymentEntry[]; messages: MessageEntry[] } = {
  payments: [],
  messages: [],
};

const stats: SystemStats = {
  revenue:        0,
  queuedRevenue:  0,
  messagesSent:   0,
  messagesQueued: 0,
};

// ─── Provider Detection ───────────────────────────────────────────────────────

interface Providers {
  stripe: boolean;
  email:  boolean;
  sms:    boolean;
}

function detectProviders(): Providers {
  const creds = credentialStatus();
  return {
    stripe: !!(process.env["STRIPE_SECRET_KEY"] || process.env["REPLIT_CONNECTORS_HOSTNAME"]),
    email:  creds.email.ready,
    sms:    creds.sms.ready,
  };
}

// ─── hybridCheckout ───────────────────────────────────────────────────────────
// Routes to Stripe PaymentIntent when available; captures in internal queue otherwise.
// product.price must be in CENTS.

export interface HybridCheckoutResult {
  id:            string;
  status:        "live" | "captured";
  rail:          "stripe" | "internal";
  paymentIntent?: string;   // Stripe PaymentIntent ID when rail=stripe
  clientSecret?:  string;   // for client-side confirmation when rail=stripe
}

export async function hybridCheckout(
  product: { id?: string; name: string; price: number; currency?: string },
  user: string,
): Promise<HybridCheckoutResult> {
  const id       = randomUUID();
  const amount   = Math.round(product.price);     // already in cents
  const currency = product.currency ?? "usd";

  const providers = detectProviders();

  // 🟢 Primary: Stripe PaymentIntent
  if (providers.stripe) {
    try {
      const stripe = await getUncachableStripeClient();
      const intent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata: {
          productId:   product.id ?? "",
          productName: product.name,
          user,
          source:      "hybridEngine",
        },
        automatic_payment_methods: { enabled: true },
      });

      stats.revenue += amount;

      console.log(
        `[HybridEngine] 💳 Stripe PaymentIntent created — ${intent.id} · ${(amount / 100).toFixed(2)} ${currency.toUpperCase()} · user:${user}`
      );

      return {
        id,
        status:       "live",
        rail:         "stripe",
        paymentIntent: intent.id,
        clientSecret:  intent.client_secret ?? undefined,
      };
    } catch (err) {
      // Stripe call failed — fall through to internal queue
      console.warn(
        `[HybridEngine] ⚠️ Stripe unavailable (${(err as Error).message}) — capturing internally`
      );
    }
  } else {
    console.log("[HybridEngine] ⚠️ No Stripe rail — capturing internally");
  }

  // 🟡 Secondary: internal queue
  queues.payments.push({
    id,
    productId: product.id ?? "",
    name:      product.name,
    amount,
    currency,
    user,
    queuedAt:  new Date().toISOString(),
  });
  stats.queuedRevenue += amount;

  return { id, status: "captured", rail: "internal" };
}

// ─── hybridMessage ────────────────────────────────────────────────────────────
// Routes to Resend (email) or Twilio (SMS) when live; internal queue otherwise.

export interface HybridMessageResult {
  id:     string;
  status: "sent" | "queued";
  rail:   "email" | "sms" | "internal";
}

export async function hybridMessage(
  type:    "email" | "sms",
  to:      string,
  content: string,
  subject?: string,
): Promise<HybridMessageResult> {
  const id        = randomUUID();
  const providers = detectProviders();

  if (type === "email" && providers.email) {
    const batch = await sendEmailNotification(
      [to],
      subject ?? "CreateAI Brain Notification",
      content,
    );
    if (batch.successCount > 0) {
      stats.messagesSent++;
      console.log(`[HybridEngine] 📧 Email sent → ${to}`);
      return { id, status: "sent", rail: "email" };
    }
  }

  if (type === "sms" && providers.sms) {
    const batch = await sendSMSNotification([to], content);
    if (batch.successCount > 0) {
      stats.messagesSent++;
      console.log(`[HybridEngine] 📱 SMS sent → ${to}`);
      return { id, status: "sent", rail: "sms" };
    }
  }

  // Queue internally
  queues.messages.push({ id, type, to, content, queuedAt: new Date().toISOString() });
  stats.messagesQueued++;
  console.log(`[HybridEngine] 📬 ${type} queued for ${to} — provider not available`);
  return { id, status: "queued", rail: "internal" };
}

// ─── Recovery ─────────────────────────────────────────────────────────────────
// Drains internal queues when providers become available.

async function recover(): Promise<void> {
  const providers = detectProviders();

  // Release queued payments via Stripe
  if (providers.stripe && queues.payments.length > 0) {
    console.log(`[HybridEngine] 🚀 Processing ${queues.payments.length} queued payment(s) via Stripe…`);
    const toProcess = [...queues.payments];
    queues.payments = [];

    for (const entry of toProcess) {
      try {
        const stripe = await getUncachableStripeClient();
        const intent = await stripe.paymentIntents.create({
          amount:   entry.amount,
          currency: entry.currency,
          metadata: { productId: entry.productId, productName: entry.name, user: entry.user, source: "hybridEngine:recovery" },
          automatic_payment_methods: { enabled: true },
        });
        stats.revenue       += entry.amount;
        stats.queuedRevenue -= entry.amount;
        console.log(`[HybridEngine] ✅ Recovered payment — ${intent.id} · ${entry.name}`);
      } catch (err) {
        // Re-queue on failure
        queues.payments.push(entry);
        stats.queuedRevenue += entry.amount; // re-add since we subtracted above
        console.warn(`[HybridEngine] ⚠️ Recovery failed for ${entry.id} — ${(err as Error).message}`);
        break; // don't hammer a broken connection
      }
    }
  }

  // Release queued messages
  if ((providers.email || providers.sms) && queues.messages.length > 0) {
    console.log(`[HybridEngine] 📤 Sending ${queues.messages.length} queued message(s)…`);
    const toSend = [...queues.messages];
    queues.messages = [];

    for (const entry of toSend) {
      const result = await hybridMessage(entry.type, entry.to, entry.content);
      if (result.status !== "sent") {
        queues.messages.push(entry); // re-queue
      } else {
        stats.messagesQueued = Math.max(0, stats.messagesQueued - 1);
      }
    }
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function getHybridStats(): Record<string, string | number> {
  const providers = detectProviders();
  return {
    "Rail: Stripe":         providers.stripe ? "✅ Live" : "⏸ Offline",
    "Rail: Email":          providers.email  ? "✅ Live" : "⏸ Offline",
    "Rail: SMS":            providers.sms    ? "✅ Live" : "⏸ Offline",
    "Revenue (live)":       `$${(stats.revenue / 100).toFixed(2)}`,
    "Revenue (queued)":     `$${(stats.queuedRevenue / 100).toFixed(2)}`,
    "Messages Sent":        stats.messagesSent,
    "Messages Queued":      stats.messagesQueued,
    "Payments Queued":      queues.payments.length,
  };
}

// ─── startHybridEngine ────────────────────────────────────────────────────────
// Starts the 15-second recovery + status loop.

let _engineStarted = false;

export function startHybridEngine(): void {
  if (_engineStarted) return;
  _engineStarted = true;

  console.log("[HybridEngine] 🧠 HYBRID ENGINE RUNNING — Stripe · Resend · Twilio · internal queue");

  setInterval(async () => {
    try {
      await recover();
    } catch (err) {
      console.error("[HybridEngine] Recovery error:", (err as Error).message);
    }

    const s = getHybridStats();
    if (queues.payments.length > 0 || queues.messages.length > 0) {
      // Only log table when there's something worth watching
      console.log("[HybridEngine] 📊 STATUS:", s);
    }
  }, 15_000);
}
