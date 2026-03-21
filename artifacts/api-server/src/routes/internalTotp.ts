/**
 * internalTotp.ts — TOTP / Authenticator App Routes
 *
 * POST /api/totp/enroll         — begin TOTP enrollment (returns QR URI)
 * POST /api/totp/verify         — confirm enrollment with first token
 * GET  /api/totp/status/:userId — check enrollment status
 * GET  /api/totp/stats          — platform-wide TOTP stats
 * POST /api/totp/check          — verify a TOTP token (for auth flows)
 */

import { Router, type Request, type Response } from "express";
import {
  enrollTotp,
  confirmTotpEnrollment,
  getTotpStatus,
  getTotpStats,
  verifyTotp,
  computeTotp,
  generateTotpSecret,
} from "../services/internalTotp.js";

const router = Router();

router.post("/enroll", (req: Request, res: Response) => {
  const { userId } = req.body as { userId?: string };
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }
  const result = enrollTotp(userId);
  res.json({ ok: true, secret: result.secret, otpauthUri: result.uri, instructions: "Scan the otpauthUri with Google Authenticator, Authy, or 1Password, then POST to /verify with the 6-digit code." });
});

router.post("/verify", (req: Request, res: Response) => {
  const { userId, token } = req.body as { userId?: string; token?: string };
  if (!userId || !token) { res.status(400).json({ error: "userId and token required" }); return; }
  const ok = confirmTotpEnrollment(userId, token);
  res.json({ ok, message: ok ? "TOTP enrollment confirmed. 2FA is now active." : "Invalid token. Try again within the 30-second window." });
});

router.post("/check", (req: Request, res: Response) => {
  const { secret, token } = req.body as { secret?: string; token?: string };
  if (!secret || !token) { res.status(400).json({ error: "secret and token required" }); return; }
  const ok = verifyTotp(secret, token);
  res.json({ ok, valid: ok });
});

router.get("/status/:userId", (req: Request, res: Response) => {
  const userId = String(req.params["userId"] ?? "");
  res.json({ ok: true, userId, ...getTotpStatus(userId) });
});

router.get("/stats", (_req: Request, res: Response) => {
  res.json({ ok: true, ...getTotpStats(), engine: "Internal RFC-6238 TOTP", algorithm: "HMAC-SHA1", period: 30, digits: 6 });
});

router.get("/demo", (_req: Request, res: Response) => {
  const secret = generateTotpSecret();
  const token = computeTotp(secret);
  res.json({ ok: true, demo: true, secret, currentToken: token, note: "Demo only — secret is generated fresh each request." });
});

export default router;
