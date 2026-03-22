// ─── Trusted Devices + WebAuthn ──────────────────────────────────────────────
// Manages device registration, WebAuthn passkey challenges, and device removal.

import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { getSql } from "../lib/db";

const router = Router();

const RP_NAME = "CreateAI Brain";
// RP_ID must match the domain. Use env var for production (createai.digital).
const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";
const ORIGIN = process.env.WEBAUTHN_ORIGIN || `https://${RP_ID}`;

// In-memory challenge store (per session; cleared after use)
const pendingChallenges = new Map<string, string>();

// ── Validate device token ────────────────────────────────────────────────────

// POST /api/trusted-devices/validate
// Body: { deviceToken: string }
router.post("/validate", async (req: Request, res: Response) => {
  const { deviceToken } = req.body as { deviceToken?: string };
  if (!deviceToken) {
    res.json({ valid: false });
    return;
  }

  const sql = getSql();
  const [device] = await sql`
    SELECT id, user_id, device_name, webauthn_credential_id
    FROM platform_trusted_devices
    WHERE device_token = ${deviceToken}
    LIMIT 1
  `;

  if (!device) {
    res.json({ valid: false });
    return;
  }

  await sql`
    UPDATE platform_trusted_devices SET last_used_at = NOW() WHERE id = ${device.id}
  `;

  res.json({
    valid: true,
    userId: device.user_id,
    deviceName: device.device_name,
    hasBiometric: !!device.webauthn_credential_id,
  });
});

// ── List trusted devices ─────────────────────────────────────────────────────

// GET /api/trusted-devices
router.get("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const userId = (req.user as { id: string }).id;
  const sql = getSql();

  const devices = await sql`
    SELECT id, device_name, webauthn_credential_id IS NOT NULL AS has_biometric,
           phone_verified, last_used_at, created_at
    FROM platform_trusted_devices
    WHERE user_id = ${userId}
    ORDER BY last_used_at DESC NULLS LAST
  `;

  res.json({ devices });
});

// ── Remove a trusted device ──────────────────────────────────────────────────

// DELETE /api/trusted-devices/:id
router.delete("/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const sql = getSql();

  await sql`
    DELETE FROM platform_trusted_devices
    WHERE id = ${id} AND user_id = ${userId}
  `;

  res.json({ success: true });
});

// ── WebAuthn Registration (add biometric to a trusted device) ────────────────

// GET /api/trusted-devices/webauthn/registration-options
router.get("/webauthn/registration-options", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = req.user as { id: string; email?: string; firstName?: string };
  const sql = getSql();

  // Existing credentials for this user
  const existing = await sql`
    SELECT webauthn_credential_id FROM platform_trusted_devices
    WHERE user_id = ${user.id} AND webauthn_credential_id IS NOT NULL
  `;

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: Buffer.from(user.id),
    userName: user.email ?? user.id,
    userDisplayName: user.firstName ?? user.email ?? user.id,
    attestationType: "none",
    excludeCredentials: existing.map(e => ({
      id: e.webauthn_credential_id as string,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  pendingChallenges.set(user.id, options.challenge);
  res.json(options);
});

// POST /api/trusted-devices/webauthn/register
// Body: { deviceToken, response: RegistrationResponseJSON }
router.post("/webauthn/register", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = req.user as { id: string };
  const { deviceToken, response } = req.body as {
    deviceToken?: string;
    response?: RegistrationResponseJSON;
  };

  if (!deviceToken || !response) {
    res.status(400).json({ error: "deviceToken and response required" });
    return;
  }

  const challenge = pendingChallenges.get(user.id);
  if (!challenge) {
    res.status(400).json({ error: "No pending challenge. Start registration first." });
    return;
  }

  pendingChallenges.delete(user.id);

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      res.status(400).json({ error: "Biometric registration failed" });
      return;
    }

    const { credential } = verification.registrationInfo;
    const sql = getSql();

    await sql`
      UPDATE platform_trusted_devices
      SET
        webauthn_credential_id = ${credential.id},
        webauthn_public_key    = ${Buffer.from(credential.publicKey).toString("base64")},
        webauthn_counter       = ${credential.counter}
      WHERE device_token = ${deviceToken} AND user_id = ${user.id}
    `;

    res.json({ success: true });
  } catch (err) {
    console.error("[trustedDevices] WebAuthn registration error:", err);
    res.status(400).json({ error: "Biometric setup failed. Please try again." });
  }
});

// ── WebAuthn Authentication (verify biometric) ───────────────────────────────

// GET /api/trusted-devices/webauthn/auth-options
// Query: { deviceToken }
router.get("/webauthn/auth-options", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = req.user as { id: string };
  const { deviceToken } = req.query as { deviceToken?: string };
  const sql = getSql();

  const credentials = deviceToken
    ? await sql`
        SELECT webauthn_credential_id FROM platform_trusted_devices
        WHERE user_id = ${user.id} AND device_token = ${deviceToken}
          AND webauthn_credential_id IS NOT NULL
      `
    : await sql`
        SELECT webauthn_credential_id FROM platform_trusted_devices
        WHERE user_id = ${user.id} AND webauthn_credential_id IS NOT NULL
      `;

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "preferred",
    allowCredentials: credentials.map(c => ({
      id: c.webauthn_credential_id as string,
    })),
  });

  pendingChallenges.set(`auth_${user.id}`, options.challenge);
  res.json(options);
});

// POST /api/trusted-devices/webauthn/verify
// Body: { deviceToken, response: AuthenticationResponseJSON }
router.post("/webauthn/verify", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = req.user as { id: string };
  const { deviceToken, response } = req.body as {
    deviceToken?: string;
    response?: AuthenticationResponseJSON;
  };

  if (!response) {
    res.status(400).json({ error: "response required" });
    return;
  }

  const challenge = pendingChallenges.get(`auth_${user.id}`);
  if (!challenge) {
    res.status(400).json({ error: "No pending challenge" });
    return;
  }

  pendingChallenges.delete(`auth_${user.id}`);

  const sql = getSql();
  const credentialId = response.id;

  const [device] = await sql`
    SELECT * FROM platform_trusted_devices
    WHERE user_id = ${user.id} AND webauthn_credential_id = ${credentialId}
    LIMIT 1
  `;

  if (!device) {
    res.status(400).json({ error: "Unknown biometric credential" });
    return;
  }

  try {
    const publicKey = Buffer.from(device.webauthn_public_key as string, "base64");
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credentialId,
        publicKey,
        counter: Number(device.webauthn_counter ?? 0),
      },
    });

    if (!verification.verified) {
      res.status(401).json({ error: "Biometric verification failed" });
      return;
    }

    await sql`
      UPDATE platform_trusted_devices
      SET last_used_at = NOW(),
          webauthn_counter = ${verification.authenticationInfo.newCounter}
      WHERE id = ${device.id}
    `;

    res.json({ success: true, deviceToken: device.device_token });
  } catch (err) {
    console.error("[trustedDevices] WebAuthn auth error:", err);
    res.status(401).json({ error: "Biometric verification failed. Please try again." });
  }
});

// ── Admin: remove device for any user ───────────────────────────────────────

// DELETE /api/trusted-devices/admin/:userId/:deviceId
router.delete("/admin/:userId/:deviceId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const actor = req.user as { id: string };
  const sql = getSql();
  const [actorRow] = await sql`SELECT role FROM users WHERE id = ${actor.id}`;
  if (!actorRow || !["admin", "founder"].includes(actorRow.role as string)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const { userId, deviceId } = req.params;
  await sql`DELETE FROM platform_trusted_devices WHERE id = ${deviceId} AND user_id = ${userId}`;
  res.json({ success: true });
});

export default router;
