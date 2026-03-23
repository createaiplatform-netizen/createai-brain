/**
 * stripeClient.ts — Stripe credential resolver
 * -------------------------------------------
 * Priority 1: STRIPE_SECRET_KEY environment variable (production deployments).
 * Priority 2: Replit connector service (development / Replit-managed secrets).
 *
 * WARNING: Never cache the returned client. Call getUncachableStripeClient()
 * fresh on every request so credential rotation is always respected.
 */

import Stripe from "stripe";

async function getCredentialsFromConnector(): Promise<{ publishableKey: string; secretKey: string }> {
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

  const isProduction  = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnv     = isProduction ? "production" : "development";
  const connectorName = "stripe";

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets",  "true");
  url.searchParams.set("connector_names",  connectorName);
  url.searchParams.set("environment",      targetEnv);

  const response = await fetch(url.toString(), {
    headers: {
      Accept:           "application/json",
      "X-Replit-Token": xReplitToken,
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Connector service returned HTTP ${response.status}`);
  }

  const data = await response.json() as { items?: Array<{ settings: { publishable?: string; secret?: string } }> };
  const settings = data.items?.[0]?.settings;

  if (!settings?.publishable || !settings?.secret) {
    throw new Error("Stripe credentials not found in connector response");
  }

  return { publishableKey: settings.publishable, secretKey: settings.secret };
}

async function getCredentials(): Promise<{ publishableKey: string; secretKey: string }> {
  // Priority 1 — explicit env vars (production deployments without connector)
  const envSecret = process.env.STRIPE_SECRET_KEY;
  const envPublishable = process.env.STRIPE_PUBLISHABLE_KEY;

  if (envSecret) {
    return {
      secretKey:      envSecret,
      publishableKey: envPublishable ?? "",
    };
  }

  // Priority 2 — Replit connector service
  return getCredentialsFromConnector();
}

/**
 * Returns a fresh Stripe server client using the secret key.
 * WARNING: Do NOT cache this. Call fresh per-request.
 */
export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, {
    apiVersion: "2025-11-17.clover",
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
 * Quick connectivity probe — returns true only if credentials are valid
 * and Stripe's API accepts them.
 */
export async function probeStripeConnection(): Promise<{
  ok:     boolean;
  mode?:  "live" | "test";
  source?: "env" | "connector";
  error?: string;
}> {
  try {
    const envSecret = process.env.STRIPE_SECRET_KEY;
    const source: "env" | "connector" = envSecret ? "env" : "connector";
    const stripe    = await getUncachableStripeClient();
    await stripe.balance.retrieve();
    const secretKey = await getStripeSecretKey();
    const mode      = secretKey.startsWith("sk_live_") ? "live" : "test";
    return { ok: true, mode, source };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Returns true if Stripe credentials are available (does not call Stripe API).
 * Safe to call during startup to skip Stripe-dependent operations gracefully.
 */
export function isStripeConfigured(): boolean {
  if (process.env.STRIPE_SECRET_KEY) return true;
  if (process.env.REPLIT_CONNECTORS_HOSTNAME && (process.env.REPL_IDENTITY || process.env.WEB_REPL_RENEWAL)) return true;
  return false;
}
