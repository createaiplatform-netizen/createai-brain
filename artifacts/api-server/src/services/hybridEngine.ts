/**
 * hybridEngine.ts — Hybrid Multi-Rail Engine
 * Spec: HYBRID-MULTI-RAIL-ENGINE
 *
 * External + Internal unified system:
 *   - hybridCheckout → Stripe PaymentIntent when live; internal queue otherwise
 *   - hybridMessage  → Resend (email) / Twilio (SMS) when live; internal queue otherwise
 *   - startHybridEngine → 15s recovery loop that drains queues when providers come online
 *
 * Circuit Breaker: after 3 consecutive send failures on a provider, the rail is
 * marked "open" for 30 minutes — no retries during that window. The rail auto-resets
 * after the window expires. This prevents retry storms when credentials are invalid
 * or have domain restrictions (e.g. Resend test-mode sender restrictions).
 */

import { randomUUID }       from "crypto";
import { credentialStatus } from "../utils/notifications.js";
import { bridge }           from "../bridge/universalBridgeEngine.js";

// ─── Circuit Breaker ─────────────────────────────────────────────────────────

const CIRCUIT_FAILURE_THRESHOLD = 3;          // consecutive failures before open
const CIRCUIT_RESET_MS          = 30 * 60 * 1000; // 30 minutes before auto-reset

interface Circuit {
  failures:  number;
  openUntil: number;  // ms timestamp — 0 means closed
}

const circuits: Record<"email" | "sms", Circuit> = {
  email: { failures: 0, openUntil: 0 },
  sms:   { failures: 0, openUntil: 0 },
};

function isCircuitOpen(rail: "email" | "sms"): boolean {
  return Date.now() < circuits[rail].openUntil;
}

function recordSuccess(rail: "email" | "sms"): void {
  circuits[rail].failures  = 0;
  circuits[rail].openUntil = 0;
}

function recordFailure(rail: "email" | "sms"): void {
  circuits[rail].failures++;
  if (circuits[rail].failures >= CIRCUIT_FAILURE_THRESHOLD) {
    circuits[rail].openUntil = Date.now() + CIRCUIT_RESET_MS;
    console.warn(
      `[HybridEngine] ⚡ CIRCUIT OPEN — ${rail} rail tripped after ` +
      `${circuits[rail].failures} consecutive failures. ` +
      `Pausing retries for 30 min. Credentials need verification.`
    );
  }
}

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
  attempts: number;
}

interface SystemStats {
  revenue:        number;   // live-processed revenue (cents)
  queuedRevenue:  number;   // revenue captured but not yet processed
  messagesSent:   number;
  messagesQueued: number;
}

const MAX_QUEUE_MESSAGES = 50;  // cap — discard oldest when exceeded

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
    email:  creds.email.configured,   // was incorrectly `creds.email.ready` (undefined)
    sms:    creds.sms.configured,     // was incorrectly `creds.sms.ready` (undefined)
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
// Circuit breaker prevents retry storms on permanently-failing sends.

export interface HybridMessageResult {
  id:     string;
  status: "sent" | "queued" | "dropped";
  rail:   "email" | "sms" | "internal";
}

export async function hybridMessage(
  type:    "email" | "sms",
  to:      string,
  content: string,
  subject?: string,
): Promise<HybridMessageResult> {
  const id = randomUUID();

  // Check circuit breaker — skip bridge call entirely when rail is open
  if (isCircuitOpen(type)) {
    return { id, status: "queued", rail: "internal" };
  }

  // Route through Universal Bridge Engine → Email or SMS connector
  const bridgeType = type === "email" ? "EMAIL_SEND" : "SMS_SEND";
  const msgResp    = await bridge.route({
    type:    bridgeType,
    payload: { to, content, subject: subject ?? "CreateAI Brain Notification" },
    metadata: { source: "hybridEngine", ts: new Date().toISOString() },
  });

  if (msgResp.status === "SUCCESS") {
    recordSuccess(type);
    stats.messagesSent++;
    console.log(`[HybridEngine] ${type === "email" ? "📧" : "📱"} ${type} sent via bridge → ${to}`);
    return { id, status: "sent", rail: type };
  }

  // FAILURE or NOT_CONFIGURED — record towards circuit breaker
  if (msgResp.status === "FAILURE") {
    recordFailure(type);
  }

  // Queue internally — but cap to MAX_QUEUE_MESSAGES
  if (queues.messages.length >= MAX_QUEUE_MESSAGES) {
    // Drop oldest to make room (FIFO eviction)
    queues.messages.shift();
    stats.messagesQueued = Math.max(0, stats.messagesQueued - 1);
  }

  const reason = msgResp.status === "NOT_CONFIGURED"
    ? "connector not configured"
    : (msgResp.error ?? "failure");

  queues.messages.push({ id, type, to, content, queuedAt: new Date().toISOString(), attempts: 1 });
  stats.messagesQueued++;
  console.log(`[HybridEngine] 📬 ${type} queued for ${to} — ${reason}`);
  return { id, status: "queued", rail: "internal" };
}

// ─── Recovery ─────────────────────────────────────────────────────────────────
// Drains internal queues when providers come back online.

let _lastStatusKey = "";  // used to suppress duplicate status log lines

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

  // Release queued messages — only if circuit is closed
  if ((providers.email || providers.sms) && queues.messages.length > 0) {
    const toSend = queues.messages.filter(e =>
      (e.type === "email" && providers.email && !isCircuitOpen("email")) ||
      (e.type === "sms"   && providers.sms   && !isCircuitOpen("sms"))
    );

    if (toSend.length > 0) {
      console.log(`[HybridEngine] 📤 Attempting ${toSend.length} queued message(s)…`);
      queues.messages = queues.messages.filter(e => !toSend.includes(e));

      for (const entry of toSend) {
        const result = await hybridMessage(entry.type, entry.to, entry.content);
        if (result.status !== "sent") {
          if (queues.messages.length < MAX_QUEUE_MESSAGES) {
            queues.messages.push({ ...entry, attempts: (entry.attempts ?? 0) + 1 });
          }
          // If circuit opened during this drain, stop sending
          if (isCircuitOpen(entry.type)) break;
        } else {
          stats.messagesQueued = Math.max(0, stats.messagesQueued - 1);
        }
      }
    }
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function getHybridStats(): Record<string, string | number> {
  const providers = detectProviders();
  const emailStatus = isCircuitOpen("email") ? "⚡ Circuit Open" : (providers.email ? "✅ Live" : "⏸ Offline");
  const smsStatus   = isCircuitOpen("sms")   ? "⚡ Circuit Open" : (providers.sms   ? "✅ Live" : "⏸ Offline");
  return {
    "Rail: Stripe":         providers.stripe ? "✅ Live" : "⏸ Offline",
    "Rail: Email":          emailStatus,
    "Rail: SMS":            smsStatus,
    "Revenue (live)":       `$${(stats.revenue / 100).toFixed(2)}`,
    "Revenue (queued)":     `$${(stats.queuedRevenue / 100).toFixed(2)}`,
    "Messages Sent":        stats.messagesSent,
    "Messages Queued":      stats.messagesQueued,
    "Payments Queued":      queues.payments.length,
  };
}

// ─── clearMessageQueue ────────────────────────────────────────────────────────
// Allows the owner or admin to flush the stuck message queue via API.

export function clearMessageQueue(): { cleared: number } {
  const cleared = queues.messages.length;
  queues.messages = [];
  stats.messagesQueued = 0;
  circuits.email.failures  = 0;
  circuits.email.openUntil = 0;
  circuits.sms.failures    = 0;
  circuits.sms.openUntil   = 0;
  console.log(`[HybridEngine] 🧹 Message queue cleared — ${cleared} entries removed · circuits reset`);
  return { cleared };
}

// ─── startHybridEngine ────────────────────────────────────────────────────────
// Starts the 15-second recovery + status loop.

let _engineStarted = false;

export function startHybridEngine(): void {
  if (_engineStarted) return;
  _engineStarted = true;

  console.log("[HybridEngine] 🧠 HYBRID ENGINE RUNNING — Stripe · Resend · Twilio · internal queue · circuit breaker ON");

  setInterval(async () => {
    try {
      await recover();
    } catch (err) {
      console.error("[HybridEngine] Recovery error:", (err as Error).message);
    }

    // Only log STATUS when something is queued AND the state has changed
    if (queues.payments.length > 0 || queues.messages.length > 0) {
      const s = getHybridStats();
      const key = JSON.stringify(s);
      if (key !== _lastStatusKey) {
        console.log("[HybridEngine] 📊 STATUS:", s);
        _lastStatusKey = key;
      }
    }
  }, 15_000);
}
