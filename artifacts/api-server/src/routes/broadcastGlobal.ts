/**
 * routes/broadcastGlobal.ts — Global Broadcast Activation
 * ─────────────────────────────────────────────────────────
 * POST /api/broadcast/global
 *   Generates a signed 7-day onboarding link and QR code.
 *   Founder/admin only.
 *
 * Returns:
 *   { link, qr, expires, broadcast_id, regions }
 */

import { Router, type Request, type Response } from "express";
import crypto from "crypto";

const router = Router();

const REGIONS = ["NA", "SA", "EU", "AF", "AS", "OC", "EXT"] as const;

// ─── Signing ──────────────────────────────────────────────────────────────────

function getSigningSecret(): string {
  return (
    process.env["SESSION_SECRET"] ??
    process.env["CORE_SECRET"]    ??
    process.env["NEXUS_SECRET"]   ??
    "createai-broadcast-fallback-secret-2024"
  );
}

function base64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf) : buf;
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function createSignedGlobalInvite(
  role: string = "member",
  ttlSeconds: number = 7 * 24 * 60 * 60,
): { token: string; link: string; expires: number } {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;
  const jti = crypto.randomUUID();

  const payload = {
    type:   "global_broadcast",
    role,
    iat,
    exp,
    jti,
  };

  const payloadB64 = base64url(JSON.stringify(payload));
  const secret     = getSigningSecret();
  const sig        = crypto.createHmac("sha256", secret).update(payloadB64).digest();
  const sigB64     = base64url(sig);
  const token      = `${payloadB64}.${sigB64}`;

  const domain = process.env["REPLIT_DEV_DOMAIN"] ?? "localhost:8080";
  const proto  = domain.startsWith("localhost") ? "http" : "https";
  const link   = `${proto}://${domain}/onboard?token=${token}`;

  return { token, link, expires: exp };
}

export function verifyGlobalInvite(token: string): {
  valid: boolean;
  payload?: { type: string; role: string; iat: number; exp: number; jti: string };
  reason?: string;
} {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false, reason: "malformed" };
    const [payloadB64, sigB64] = parts;
    const secret   = getSigningSecret();
    const expected = base64url(
      crypto.createHmac("sha256", secret).update(payloadB64!).digest(),
    );
    if (sigB64 !== expected) return { valid: false, reason: "invalid_signature" };
    const payload = JSON.parse(Buffer.from(payloadB64!, "base64url").toString("utf8")) as {
      type: string; role: string; iat: number; exp: number; jti: string;
    };
    if (payload.exp < Math.floor(Date.now() / 1000)) return { valid: false, reason: "expired" };
    if (payload.type !== "global_broadcast")          return { valid: false, reason: "wrong_type" };
    return { valid: true, payload };
  } catch {
    return { valid: false, reason: "parse_error" };
  }
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

function isAdmin(req: Request): boolean {
  const role = (req.user as { role?: string } | undefined)?.role ?? "";
  return ["admin", "founder"].includes(role);
}

// ─── POST /api/broadcast/global ───────────────────────────────────────────────

router.post("/global", (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Founder/admin only" });
    return;
  }

  try {
    const role     = (req.body as { role?: string })?.role ?? "member";
    const ttl      = 7 * 24 * 60 * 60;
    const { token, link, expires } = createSignedGlobalInvite(role, ttl);

    const broadcast_id = `bcast_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;

    // QR: public API — no server-side package needed
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}&bgcolor=0d1117&color=9caf88&margin=12`;

    console.log(`[Broadcast] Global link generated — id:${broadcast_id} expires:${new Date(expires * 1000).toISOString()} token_prefix:${token.slice(0, 16)}…`);

    res.json({
      ok:           true,
      broadcast_id,
      link,
      qr,
      token,
      expires,
      expires_iso:  new Date(expires * 1000).toISOString(),
      regions:      [...REGIONS],
      role,
      ttl_days:     7,
    });
  } catch (err) {
    console.error("[Broadcast] global link error:", (err as Error).message);
    res.status(500).json({ error: "Failed to generate broadcast link" });
  }
});

// ─── GET /api/broadcast/verify?token=… — public token verification ────────────

router.get("/verify", (req: Request, res: Response) => {
  const token = (req.query.token ?? "") as string;
  if (!token) { res.status(400).json({ error: "token required" }); return; }
  const result = verifyGlobalInvite(token);
  res.json(result);
});

export default router;
