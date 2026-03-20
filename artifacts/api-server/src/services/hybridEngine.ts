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

import { randomUUID }  from "crypto";
import { credentialStatus } from "../utils/notifications.js";
import { bridge }           from "../bridge/universalBridgeEngine.js";

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

  // 🟢 Primary: Route through Universal Bridge Engine → Stripe connector
  const bridgeResp = await bridge.route({
    type:    "PAYMENT_CREATE_CHECKOUT",
    payload: {
      amount,
      currency,
      productName: product.name,
      productId:   product.id ?? "",
      userId:      user,
    },
    metadata: { source: "hybridEngine", ts: new Date().toISOString() },
  });

  if (bridgeResp.status === "SUCCESS" && bridgeResp.data) {
    stats.revenue += amount;
    console.log(
      `[HybridEngine] 💳 Stripe PaymentIntent via bridge — ` +
      `${String(bridgeResp.data["intentId"])} · $${(amount / 100).toFixed(2)} ${currency.toUpperCase()} · user:${user}`
    );
    return {
      id,
      status:        "live",
      rail:          "stripe",
      paymentIntent: String(bridgeResp.data["intentId"] ?? ""),
      clientSecret:  String(bridgeResp.data["clientSecret"] ?? ""),
    };
  }

  if (bridgeResp.status === "FAILURE") {
    console.warn(`[HybridEngine] ⚠️ Bridge payment failed (${bridgeResp.error ?? ""}) — capturing internally`);
  } else {
    console.log("[HybridEngine] ⚠️ No Stripe rail via bridge — capturing internally");
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
  const id = randomUUID();

  // Route through Universal Bridge Engine → Email or SMS connector
  const bridgeType = type === "email" ? "EMAIL_SEND" : "SMS_SEND";
  const msgResp    = await bridge.route({
    type:    bridgeType,
    payload: { to, content, subject: subject ?? "CreateAI Brain Notification" },
    metadata: { source: "hybridEngine", ts: new Date().toISOString() },
  });

  if (msgResp.status === "SUCCESS") {
    stats.messagesSent++;
    console.log(`[HybridEngine] ${type === "email" ? "📧" : "📱"} ${type} sent via bridge → ${to}`);
    return { id, status: "sent", rail: type };
  }

  // Queue internally (NOT_CONFIGURED or FAILURE)
  queues.messages.push({ id, type, to, content, queuedAt: new Date().toISOString() });
  stats.messagesQueued++;
  const reason = msgResp.status === "NOT_CONFIGURED" ? "connector not configured" : (msgResp.error ?? "failure");
  console.log(`[HybridEngine] 📬 ${type} queued for ${to} — bridge:${reason}`);
  return { id, status: "queued", rail: "internal" };
}

// ─── Recovery ─────────────────────────────────────────────────────────────────
// Drains internal queues when providers become available.

async function recover(): Promise<void> {
  const providers = detectProviders();

  // Release queued payments via bridge → Stripe connector
  if (providers.stripe && queues.payments.length > 0) {
    console.log(`[HybridEngine] 🚀 Processing ${queues.payments.length} queued payment(s) via bridge…`);
    const toProcess = [...queues.payments];
    queues.payments = [];

    for (const entry of toProcess) {
      const resp = await bridge.route({
        type:    "PAYMENT_CREATE_CHECKOUT",
        payload: {
          amount:      entry.amount,
          currency:    entry.currency,
          productName: entry.name,
          productId:   entry.productId,
          userId:      entry.user,
        },
        metadata: { source: "hybridEngine:recovery", ts: new Date().toISOString() },
      });
      if (resp.status === "SUCCESS") {
        stats.revenue       += entry.amount;
        stats.queuedRevenue -= entry.amount;
        console.log(`[HybridEngine] ✅ Recovered payment via bridge — ${String(resp.data?.["intentId"] ?? "")} · ${entry.name}`);
      } else {
        queues.payments.push(entry);
        stats.queuedRevenue += entry.amount;
        console.warn(`[HybridEngine] ⚠️ Recovery bridge failure for ${entry.id} — ${resp.error ?? ""}`);
        break;
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
