/**
 * lib/db.ts — PostgreSQL client + schema bootstrap
 * -------------------------------------------------
 * Uses the `postgres` npm package (lightweight, no native deps).
 * Tables are created idempotently on first connection.
 * All semantic customer / subscription / event data persists here.
 */

import postgres from "postgres";

let _sql: ReturnType<typeof postgres> | null = null;

export function getSql(): ReturnType<typeof postgres> {
  if (!_sql) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL environment variable is not set");
    // Replit's internal PostgreSQL runs on the same network — no TLS needed.
    // Strip sslmode from the URL so the driver doesn't try to negotiate TLS.
    const cleanUrl = url.replace(/[?&]sslmode=[^&]*/g, "").replace(/[?&]ssl=[^&]*/g, "");
    _sql = postgres(cleanUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: false,
    });
  }
  return _sql;
}

// ── Schema bootstrap ─────────────────────────────────────────────────────────
// Called once at startup. All tables use IF NOT EXISTS — safe to re-run.

export async function bootstrapSchema(): Promise<void> {
  const sql = getSql();
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS platform_customers (
        id                    TEXT PRIMARY KEY,
        email                 TEXT NOT NULL,
        name                  TEXT NOT NULL DEFAULT '',
        stripe_session_id     TEXT NOT NULL UNIQUE,
        stripe_payment_intent TEXT NOT NULL DEFAULT '',
        stripe_customer_id    TEXT NOT NULL DEFAULT '',
        product_id            TEXT NOT NULL DEFAULT '',
        product_title         TEXT NOT NULL DEFAULT '',
        product_format        TEXT NOT NULL DEFAULT '',
        price_cents           INTEGER NOT NULL DEFAULT 0,
        currency              TEXT NOT NULL DEFAULT 'usd',
        channel               TEXT NOT NULL DEFAULT 'store',
        is_subscription       BOOLEAN NOT NULL DEFAULT FALSE,
        subscription_tier     TEXT,
        delivery_email_sent   BOOLEAN NOT NULL DEFAULT FALSE,
        delivery_sent_at      TIMESTAMPTZ,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_subscriptions (
        id                 TEXT PRIMARY KEY,
        customer_id        TEXT NOT NULL,
        email              TEXT NOT NULL,
        name               TEXT NOT NULL DEFAULT '',
        tier               TEXT NOT NULL,
        stripe_sub_id      TEXT NOT NULL UNIQUE,
        stripe_price_id    TEXT NOT NULL,
        status             TEXT NOT NULL DEFAULT 'active',
        current_period_end TIMESTAMPTZ,
        cancel_at_period   BOOLEAN NOT NULL DEFAULT FALSE,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_webhook_events (
        id            TEXT PRIMARY KEY,
        stripe_event  TEXT NOT NULL UNIQUE,
        event_type    TEXT NOT NULL,
        payload       JSONB NOT NULL DEFAULT '{}',
        processed     BOOLEAN NOT NULL DEFAULT FALSE,
        processed_at  TIMESTAMPTZ,
        error         TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_email_jobs (
        id             TEXT PRIMARY KEY,
        type           TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_name  TEXT NOT NULL DEFAULT '',
        product_id     TEXT NOT NULL DEFAULT '',
        product_title  TEXT NOT NULL DEFAULT '',
        product_format TEXT NOT NULL DEFAULT '',
        store_url      TEXT NOT NULL DEFAULT '',
        scheduled_at   TIMESTAMPTZ NOT NULL,
        sent_at        TIMESTAMPTZ,
        status         TEXT NOT NULL DEFAULT 'pending',
        error          TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_stripe_prices (
        id          TEXT PRIMARY KEY,
        tier        TEXT NOT NULL UNIQUE,
        price_id    TEXT NOT NULL,
        product_id  TEXT NOT NULL,
        amount      INTEGER NOT NULL,
        currency    TEXT NOT NULL DEFAULT 'usd',
        interval    TEXT NOT NULL DEFAULT 'month',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    console.log("[DB] Schema bootstrap complete");
  } catch (err) {
    console.error("[DB] Schema bootstrap failed:", err instanceof Error ? err.message : String(err));
  }
}

// ── Customer operations ───────────────────────────────────────────────────────

export interface DBCustomer {
  id: string;
  email: string;
  name: string;
  stripeSessionId: string;
  stripePaymentIntent: string;
  stripeCustomerId: string;
  productId: string;
  productTitle: string;
  productFormat: string;
  priceCents: number;
  currency: string;
  channel: string;
  isSubscription: boolean;
  subscriptionTier?: string;
  deliveryEmailSent: boolean;
  deliverySentAt?: string;
  createdAt: string;
}

export async function insertCustomer(c: DBCustomer): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO platform_customers
      (id, email, name, stripe_session_id, stripe_payment_intent, stripe_customer_id,
       product_id, product_title, product_format, price_cents, currency, channel,
       is_subscription, subscription_tier, delivery_email_sent, created_at)
    VALUES
      (${c.id}, ${c.email}, ${c.name}, ${c.stripeSessionId}, ${c.stripePaymentIntent},
       ${c.stripeCustomerId}, ${c.productId}, ${c.productTitle}, ${c.productFormat},
       ${c.priceCents}, ${c.currency}, ${c.channel}, ${c.isSubscription},
       ${c.subscriptionTier ?? null}, ${c.deliveryEmailSent}, NOW())
    ON CONFLICT (stripe_session_id) DO NOTHING
  `;
}

export async function getCustomers(): Promise<DBCustomer[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM platform_customers ORDER BY created_at DESC LIMIT 500
  `;
  return rows.map(mapCustomer);
}

export async function getCustomerStats() {
  const sql = getSql();
  const [stats] = await sql`
    SELECT
      COUNT(*)::int                                    AS total_customers,
      COUNT(DISTINCT email)::int                        AS unique_emails,
      COALESCE(SUM(price_cents)::int, 0)               AS total_revenue,
      COALESCE(AVG(price_cents)::int, 0)               AS avg_order
    FROM platform_customers
  `;
  const topProducts = await sql`
    SELECT product_id, product_title, COUNT(*)::int AS cnt
    FROM platform_customers
    GROUP BY product_id, product_title
    ORDER BY cnt DESC LIMIT 5
  `;
  const topFormats = await sql`
    SELECT product_format, COUNT(*)::int AS cnt
    FROM platform_customers
    GROUP BY product_format
    ORDER BY cnt DESC LIMIT 5
  `;
  return {
    totalCustomers:   stats?.["total_customers"]  ?? 0,
    uniqueEmails:     stats?.["unique_emails"]     ?? 0,
    totalRevenueCents: stats?.["total_revenue"]   ?? 0,
    averageOrderCents: stats?.["avg_order"]        ?? 0,
    topProducts:      topProducts.map(r => ({ productId: String(r["product_id"]), productTitle: String(r["product_title"]), count: Number(r["cnt"]) })),
    topFormats:       topFormats.map(r => ({ format: String(r["product_format"]), count: Number(r["cnt"]) })),
  };
}

function mapCustomer(r: Record<string, unknown>): DBCustomer {
  return {
    id:                 String(r["id"] ?? ""),
    email:              String(r["email"] ?? ""),
    name:               String(r["name"] ?? ""),
    stripeSessionId:    String(r["stripe_session_id"] ?? ""),
    stripePaymentIntent: String(r["stripe_payment_intent"] ?? ""),
    stripeCustomerId:   String(r["stripe_customer_id"] ?? ""),
    productId:          String(r["product_id"] ?? ""),
    productTitle:       String(r["product_title"] ?? ""),
    productFormat:      String(r["product_format"] ?? ""),
    priceCents:         Number(r["price_cents"] ?? 0),
    currency:           String(r["currency"] ?? "usd"),
    channel:            String(r["channel"] ?? ""),
    isSubscription:     Boolean(r["is_subscription"]),
    subscriptionTier:   r["subscription_tier"] ? String(r["subscription_tier"]) : undefined,
    deliveryEmailSent:  Boolean(r["delivery_email_sent"]),
    deliverySentAt:     r["delivery_sent_at"] ? String(r["delivery_sent_at"]) : undefined,
    createdAt:          String(r["created_at"] ?? ""),
  };
}

// ── Webhook event deduplication ───────────────────────────────────────────────

export async function markWebhookProcessed(eventId: string, eventType: string, payload: unknown): Promise<boolean> {
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO platform_webhook_events (id, stripe_event, event_type, payload, processed, processed_at)
    VALUES (${eventId}, ${eventId}, ${eventType}, ${JSON.stringify(payload)}, TRUE, NOW())
    ON CONFLICT (stripe_event) DO NOTHING
    RETURNING id
  `;
  return !!row;
}

// ── Stripe price registry ─────────────────────────────────────────────────────

export async function saveStripePrice(tier: string, priceId: string, productId: string, amount: number): Promise<void> {
  const sql = getSql();
  const id = "sp_" + tier + "_" + Date.now();
  await sql`
    INSERT INTO platform_stripe_prices (id, tier, price_id, product_id, amount)
    VALUES (${id}, ${tier}, ${priceId}, ${productId}, ${amount})
    ON CONFLICT (tier) DO UPDATE SET price_id = EXCLUDED.price_id, product_id = EXCLUDED.product_id
  `;
}

export async function getStripePrices(): Promise<Record<string, { priceId: string; productId: string; amount: number }>> {
  const sql = getSql();
  const rows = await sql`SELECT tier, price_id, product_id, amount FROM platform_stripe_prices`;
  const result: Record<string, { priceId: string; productId: string; amount: number }> = {};
  for (const r of rows) {
    result[String(r["tier"])] = {
      priceId:   String(r["price_id"]),
      productId: String(r["product_id"]),
      amount:    Number(r["amount"]),
    };
  }
  return result;
}

export async function markDeliveryEmailSent(sessionId: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE platform_customers SET delivery_email_sent = TRUE, delivery_sent_at = NOW()
    WHERE stripe_session_id = ${sessionId}
  `;
}

export async function findCustomersByEmail(email: string): Promise<DBCustomer[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM platform_customers
    WHERE LOWER(email) = LOWER(${email})
    ORDER BY created_at DESC
  `;
  return rows.map(mapCustomer);
}

export async function getRecentCustomers(limit = 20): Promise<DBCustomer[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM platform_customers ORDER BY created_at DESC LIMIT ${limit}
  `;
  return rows.map(mapCustomer);
}

export async function getRevenueTimeline(): Promise<Array<{ date: string; revenue: number; orders: number }>> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      DATE(created_at)::text   AS date,
      SUM(price_cents)::int    AS revenue,
      COUNT(*)::int            AS orders
    FROM platform_customers
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `;
  return rows.map(r => ({
    date:    String(r["date"] ?? ""),
    revenue: Number(r["revenue"] ?? 0),
    orders:  Number(r["orders"] ?? 0),
  }));
}

export async function getRecentWebhookEvents(limit = 10): Promise<Array<{ id: string; eventType: string; processedAt: string | null; createdAt: string }>> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, event_type, processed_at, created_at
    FROM platform_webhook_events
    ORDER BY created_at DESC LIMIT ${limit}
  `;
  return rows.map(r => ({
    id:          String(r["id"] ?? ""),
    eventType:   String(r["event_type"] ?? ""),
    processedAt: r["processed_at"] ? String(r["processed_at"]) : null,
    createdAt:   String(r["created_at"] ?? ""),
  }));
}
