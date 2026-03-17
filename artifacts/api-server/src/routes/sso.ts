/**
 * sso.ts — SSO / OAuth2 / OpenID Connect Scaffold
 *
 * This is a clean scaffold ready to plug in real SSO providers.
 * openid-client is already installed in this project.
 *
 * To activate a provider (e.g. Google):
 *   1. Create an OAuth app in Google Cloud Console
 *   2. POST /api/auth/sso/providers with { id: "google", clientId, clientSecret, ... }
 *   3. Set redirect URI to: https://yourdomain/api/auth/sso/google/callback
 *   4. Uncomment the discovery URL and implement the callback to issue a session
 *
 * Endpoints:
 *   GET  /auth/sso/providers           — list configured providers
 *   POST /auth/sso/providers           — add/update a provider
 *   GET  /auth/sso/:providerId/authorize — redirect to provider login
 *   GET  /auth/sso/:providerId/callback  — handle OAuth callback (scaffold)
 */

import { Router } from "express";
import { db, ssoProviders } from "@workspace/db";
import { eq } from "drizzle-orm";
import { encrypt } from "../services/encryption";

const router = Router();

const KNOWN_DISCOVERY_URLS: Record<string, string> = {
  google:    "https://accounts.google.com/.well-known/openid-configuration",
  microsoft: "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
  github:    "https://token.actions.githubusercontent.com/.well-known/openid-configuration",
  okta:      "https://<your-okta-domain>/.well-known/openid-configuration",
};

// List all configured providers (never expose secrets)
router.get("/providers", async (_req, res) => {
  try {
    const rows = await db.select({
      id: ssoProviders.id,
      providerName: ssoProviders.providerName,
      status: ssoProviders.status,
      scopes: ssoProviders.scopes,
      discoveryUrl: ssoProviders.discoveryUrl,
      tenantId: ssoProviders.tenantId,
      createdAt: ssoProviders.createdAt,
    }).from(ssoProviders);

    // Also include available-but-unconfigured providers as scaffolds
    const configured = new Set(rows.map(r => r.id));
    const scaffolds = Object.entries(KNOWN_DISCOVERY_URLS)
      .filter(([id]) => !configured.has(id))
      .map(([id, url]) => ({
        id,
        providerName: id.charAt(0).toUpperCase() + id.slice(1),
        status: "scaffold" as const,
        scopes: "openid email profile",
        discoveryUrl: url,
        tenantId: "default",
        createdAt: null,
      }));

    res.json({ providers: [...rows, ...scaffolds] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch SSO providers" });
  }
});

// Add or update a provider
router.post("/providers", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const { id, providerName, clientId, clientSecret, discoveryUrl, scopes } = req.body as {
      id: string; providerName: string; clientId: string;
      clientSecret?: string; discoveryUrl?: string; scopes?: string;
    };

    if (!id || !providerName || !clientId) {
      res.status(400).json({ error: "id, providerName, and clientId are required" }); return;
    }

    const encSecret = clientSecret ? encrypt(clientSecret) : null;
    const autoUrl = discoveryUrl ?? KNOWN_DISCOVERY_URLS[id] ?? null;

    await db.insert(ssoProviders).values({
      id, providerName, clientId,
      clientSecretEncrypted: encSecret,
      discoveryUrl: autoUrl,
      scopes: scopes ?? "openid email profile",
      status: "configured",
      tenantId: "default",
    }).onConflictDoUpdate({
      target: ssoProviders.id,
      set: { providerName, clientId, clientSecretEncrypted: encSecret, discoveryUrl: autoUrl, updatedAt: new Date(), status: "configured" },
    });

    res.json({ ok: true, id, status: "configured", note: "Provider configured. Implement /authorize and /callback routes to complete the flow." });
  } catch (err) {
    console.error("[sso] POST /providers:", err);
    res.status(500).json({ error: "Failed to save provider" });
  }
});

/**
 * GET /auth/sso/:providerId/authorize
 * Scaffold: in production, build a real authorization URL using openid-client
 * and redirect the user to the provider.
 */
router.get("/:providerId/authorize", async (req, res) => {
  const { providerId } = req.params as { providerId: string };
  const [provider] = await db.select().from(ssoProviders).where(eq(ssoProviders.id, providerId)).limit(1);

  if (!provider || !provider.clientId) {
    res.status(400).json({
      error: "Provider not configured",
      hint: `POST /api/auth/sso/providers to configure ${providerId} first`,
    });
    return;
  }

  // Scaffold — replace with real openid-client authorization URL
  // Example with openid-client:
  //   const config = await discovery(new URL(provider.discoveryUrl), provider.clientId, decryptedSecret);
  //   const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/sso/${providerId}/callback`;
  //   const url = buildAuthorizationUrl(config, { redirect_uri: redirectUri, scope: provider.scopes });
  //   res.redirect(url.href);

  res.json({
    scaffold: true,
    message: `${provider.providerName} SSO is configured but authorize flow is not yet implemented.`,
    nextStep: "Implement redirect to provider using openid-client buildAuthorizationUrl()",
    discoveryUrl: provider.discoveryUrl,
  });
});

/**
 * GET /auth/sso/:providerId/callback
 * Scaffold: in production, exchange the code for tokens, upsert the user,
 * create a session, and redirect to the app.
 */
router.get("/:providerId/callback", async (req, res) => {
  const { providerId } = req.params as { providerId: string };
  res.json({
    scaffold: true,
    message: `${providerId} callback received. Implement token exchange + session creation here.`,
    code: req.query.code ? "received" : "missing",
    nextStep: [
      "1. Exchange code for tokens using openid-client tokenEndpointGrantRequest()",
      "2. Verify ID token with validateAuthResponse()",
      "3. Upsert user in usersTable with SSO profile data",
      "4. Create session via updateSession()",
      "5. Redirect to app",
    ],
  });
});

export default router;
