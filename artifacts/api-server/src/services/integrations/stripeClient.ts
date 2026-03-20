/**
 * stripeClient.ts — Replit Stripe Connector
 * -------------------------------------------
 * Fetches live Stripe credentials from Replit's connector service.
 * Keys are NEVER hardcoded or stored manually — Replit manages them.
 *
 * WARNING: Never cache the returned client. Call getUncachableStripeClient()
 * fresh on every request so credential rotation is always respected.
 *
 * Integration: Stripe connector (ccfg_stripe_01K611P4YQR0SZM11XFRQJC44Y)
 */

import Stripe from "stripe";

let connectionSettings: Record<string, unknown> | null = null;

async function getCredentials(): Promise<{ publishableKey: string; secretKey: string }> {
  const hostname     = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const replIdentity = process.env.REPL_IDENTITY;
  const deplRenewal  = process.env.WEB_REPL_RENEWAL;

  const xReplitToken = replIdentity
    ? `repl ${replIdentity}`
    : deplRenewal
      ? `depl ${deplRenewal}`
      : null;

  if (!hostname)     throw new Error("REPLIT_CONNECTORS_HOSTNAME not set");
  if (!xReplitToken) throw new Error("X-Replit-Token not available (REPL_IDENTITY / WEB_REPL_RENEWAL missing)");

  const isProduction    = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnv       = isProduction ? "production" : "development";
  const connectorName   = "stripe";

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets",  "true");
  url.searchParams.set("connector_names",  connectorName);
  url.searchParams.set("environment",      targetEnv);

  const response = await fetch(url.toString(), {
    headers: {
      Accept:          "application/json",
      "X-Replit-Token": xReplitToken,
    },
  });

  if (!response.ok) {
    throw new Error(`Connector service returned HTTP ${response.status}`);
  }

  const data = await response.json() as { items?: Array<{ settings: { publishable?: string; secret?: string } }> };
  connectionSettings = (data.items?.[0] as Record<string, unknown>) ?? null;

  const settings = (connectionSettings as { settings?: { publishable?: string; secret?: string } } | null)?.settings;
  if (!settings?.publishable || !settings?.secret) {
    throw new Error(`Stripe ${targetEnv} credentials not found in connector response`);
  }

  return {
    publishableKey: settings.publishable,
    secretKey:      settings.secret,
  };
}

/**
 * Returns a fresh Stripe server client using the secret key.
 * WARNING: Do NOT cache this. Call fresh per-request.
 */
export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, {
    apiVersion: "2025-01-27.acacia",
    typescript: true,
  });
}

/** Returns the publishable key for client-side use. */
export async function getStripePublishableKey(): Promise<string> {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

/** Returns the secret key for operations that need it directly. */
export async function getStripeSecretKey(): Promise<string> {
  const { secretKey } = await getCredentials();
  return secretKey;
}

/**
 * Quick connectivity probe — returns true only if Replit connector responds
 * with valid Stripe credentials AND Stripe's API accepts them.
 */
export async function probeStripeConnection(): Promise<{
  ok:    boolean;
  mode?: "live" | "test";
  error?: string;
}> {
  try {
    const stripe    = await getUncachableStripeClient();
    await stripe.balance.retrieve();
    const secretKey = await getStripeSecretKey();
    const mode      = secretKey.startsWith("sk_live_") ? "live" : "test";
    return { ok: true, mode };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message };
  }
}
