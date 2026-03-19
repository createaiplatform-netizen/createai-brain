/**
 * SMART-on-FHIR Sandbox Integration
 *
 * Uses the public SMART Health IT Sandbox at https://launch.smarthealthit.org
 * This is a 100% legal, standards-based OAuth 2.0 / SMART-on-FHIR flow.
 * ALL DATA IS TEST DATA ONLY — no real PHI, no real credentials.
 *
 * Architecture:
 *   This integration is designed as a stepping stone toward Epic/MyChart.
 *   When official App Orchard credentials are obtained, only the base URLs
 *   and SMART_FHIR_CLIENT_ID need to change. The OAuth flow, token exchange,
 *   and FHIR queries are identical to production Epic SMART-on-FHIR.
 *
 * Environment variables (all default to the public sandbox):
 *   SMART_FHIR_AUTH_URL      — Authorization endpoint
 *   SMART_FHIR_TOKEN_URL     — Token exchange endpoint
 *   SMART_FHIR_FHIR_BASE_URL — FHIR R4 base URL
 *   SMART_FHIR_CLIENT_ID     — Public client ID (any string for this sandbox)
 */

import { Router, type Request, type Response } from "express";
import crypto from "crypto";

const router = Router();

// ── Config (public SMART Health IT sandbox — no registration required) ─────────

const SMART_FHIR_AUTH_URL =
  process.env.SMART_FHIR_AUTH_URL ??
  "https://launch.smarthealthit.org/v/r4/auth/authorize";

const SMART_FHIR_TOKEN_URL =
  process.env.SMART_FHIR_TOKEN_URL ??
  "https://launch.smarthealthit.org/v/r4/auth/token";

const SMART_FHIR_FHIR_BASE_URL =
  process.env.SMART_FHIR_FHIR_BASE_URL ??
  "https://launch.smarthealthit.org/v/r4/fhir";

// NOTE: The SMART Health IT sandbox accepts any client_id for public demo use.
// Replace with your registered App Orchard client_id for Epic/MyChart production use.
const SMART_FHIR_CLIENT_ID =
  process.env.SMART_FHIR_CLIENT_ID ?? "createai-platform-sandbox";

// ── In-memory token store (session-scoped; cleared on server restart) ──────────
// In production: replace with an encrypted session store or a secrets vault.
// Tokens are NEVER logged.

interface TokenEntry {
  accessToken: string;
  patientId?: string;
  expiresAt: number;
  connectedAt: string;
}

const tokenStore = new Map<string, TokenEntry>();

// Purge expired entries every 5 minutes (TTL = token's own expires_in)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of tokenStore.entries()) {
    if (entry.expiresAt < now) tokenStore.delete(key);
  }
}, 5 * 60 * 1000);

// ── GET /auth-url ──────────────────────────────────────────────────────────────
// Returns the SMART authorization URL the frontend should redirect the browser to.
//
// Query params:
//   redirect_uri — the frontend page the sandbox should redirect back to

router.get("/auth-url", (req: Request, res: Response) => {
  const redirectUri = req.query.redirect_uri as string;
  if (!redirectUri) {
    res.status(400).json({ error: "redirect_uri query param is required" });
    return;
  }

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    response_type: "code",
    client_id:     SMART_FHIR_CLIENT_ID,
    // Scopes: read-only patient data + identity — same scopes used in Epic SMART
    scope:         "openid profile patient/*.read",
    redirect_uri:  redirectUri,
    state,
    // aud = the FHIR base URL; required by the SMART spec
    aud:           SMART_FHIR_FHIR_BASE_URL,
  });

  res.json({
    url:     `${SMART_FHIR_AUTH_URL}?${params.toString()}`,
    state,
    sandbox: "SMART Health IT public sandbox — test data only, no real PHI",
  });
});

// ── GET /callback ──────────────────────────────────────────────────────────────
// Called by the frontend callback page after the sandbox redirects back with a code.
// Exchanges the authorization code for an access token and stores it in memory.
//
// Query params:
//   code         — authorization code from the SMART sandbox
//   state        — state UUID from the auth-url step (used as the connection key)
//   redirect_uri — must EXACTLY match what was sent in the auth-url step

router.get("/callback", async (req: Request, res: Response) => {
  const { code, state, redirect_uri } = req.query as Record<string, string>;

  if (!code || !state || !redirect_uri) {
    res.status(400).json({ error: "code, state, and redirect_uri are required" });
    return;
  }

  try {
    // Exchange authorization code for access token at the SMART token endpoint
    const tokenRes = await fetch(SMART_FHIR_TOKEN_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    new URLSearchParams({
        grant_type:   "authorization_code",
        code,
        redirect_uri,
        client_id:    SMART_FHIR_CLIENT_ID,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      // Log only the status + sanitized error, never the token
      console.error(`[smart-fhir] Token exchange failed: ${tokenRes.status}`, errText.slice(0, 200));
      res.status(502).json({ error: "Token exchange failed with the SMART sandbox" });
      return;
    }

    const tokenData = await tokenRes.json() as {
      access_token: string;
      expires_in?:  number;
      patient?:     string;
    };

    // Store token keyed by the state UUID — never expose the raw token to the browser
    const expiresIn = tokenData.expires_in ?? 3600;
    tokenStore.set(state, {
      accessToken: tokenData.access_token,
      patientId:   tokenData.patient,
      expiresAt:   Date.now() + expiresIn * 1000,
      connectedAt: new Date().toISOString(),
    });

    res.json({
      ok:            true,
      connectionKey: state,
      patientId:     tokenData.patient ?? null,
      connectedAt:   new Date().toISOString(),
      sandbox:       "SMART Health IT public sandbox — test data only, no real PHI",
    });
  } catch (err) {
    console.error("[smart-fhir] Callback error:", err);
    res.status(500).json({ error: "OAuth callback processing failed" });
  }
});

// ── GET /test-patient ──────────────────────────────────────────────────────────
// Uses the stored access token to fetch a FHIR Patient resource from the sandbox.
// Returns raw FHIR R4 JSON — test data only.
//
// Query params:
//   key — the connectionKey returned by /callback

router.get("/test-patient", async (req: Request, res: Response) => {
  const key = req.query.key as string;
  if (!key) {
    res.status(400).json({ error: "key query param is required" });
    return;
  }

  const entry = tokenStore.get(key);

  if (!entry) {
    res.status(401).json({ error: "No active connection found. Please reconnect.", reconnect: true });
    return;
  }

  if (entry.expiresAt < Date.now()) {
    tokenStore.delete(key);
    res.status(401).json({ error: "Token has expired. Please reconnect.", reconnect: true });
    return;
  }

  try {
    // Fetch the specific authorized test patient, or a list if no patientId
    const patientUrl = entry.patientId
      ? `${SMART_FHIR_FHIR_BASE_URL}/Patient/${entry.patientId}`
      : `${SMART_FHIR_FHIR_BASE_URL}/Patient?_count=5`;

    const fhirRes = await fetch(patientUrl, {
      headers: {
        // The Bearer token is sent only server-to-server; never exposed to the browser
        Authorization: `Bearer ${entry.accessToken}`,
        Accept:        "application/fhir+json",
      },
    });

    if (!fhirRes.ok) {
      const errText = await fhirRes.text();
      res.status(fhirRes.status).json({
        error:   "FHIR server returned an error",
        details: errText.slice(0, 500),
      });
      return;
    }

    const fhirData = await fhirRes.json();

    res.json({
      ok:       true,
      sandbox:  "SMART Health IT public sandbox — test data only, no real PHI",
      endpoint: patientUrl,
      data:     fhirData,
    });
  } catch (err) {
    console.error("[smart-fhir] Test patient fetch error:", err);
    res.status(500).json({ error: "FHIR data fetch failed" });
  }
});

// ── GET /status ────────────────────────────────────────────────────────────────
// Returns the connection status for a given connection key.

router.get("/status", (req: Request, res: Response) => {
  const key = req.query.key as string;
  if (!key) {
    res.json({ status: "disconnected" });
    return;
  }

  const entry = tokenStore.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    if (entry) tokenStore.delete(key);
    res.json({ status: "disconnected" });
    return;
  }

  res.json({
    status:      "active",
    connectedAt: entry.connectedAt,
    patientId:   entry.patientId ?? null,
    sandbox:     "SMART Health IT public sandbox — test data only, no real PHI",
  });
});

export default router;
