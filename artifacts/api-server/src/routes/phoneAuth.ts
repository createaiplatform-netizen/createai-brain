// ─── Phone OTP Authentication ─────────────────────────────────────────────────
// Uses Twilio SMS to deliver OTPs. OTPs are hashed before storage.
// Rate-limited: max 3 attempts per 10 minutes.

import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import twilio from "twilio";
import { getSql } from "../lib/db";

const router = Router();

const TWILIO_SID = process.env.TWILIO_SID!;
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_FROM = process.env.TWILIO_PHONE || "+17157910292";
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (!digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  return `+${digits}`;
}

// POST /api/phone-auth/send-otp
// Body: { phone: string }
router.post("/send-otp", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Must be logged in to verify phone" });
    return;
  }

  const { phone } = req.body as { phone?: string };
  if (!phone || phone.trim().length < 7) {
    res.status(400).json({ error: "A valid phone number is required" });
    return;
  }

  const userId = (req.user as { id: string }).id;
  const formattedPhone = formatPhone(phone);
  const sql = getSql();

  // Rate limit: max 3 OTPs per 10 minutes
  const recent = await sql`
    SELECT COUNT(*) AS cnt FROM platform_phone_verifications
    WHERE user_id = ${userId}
      AND created_at > NOW() - INTERVAL '10 minutes'
      AND verified_at IS NULL
  `;
  if (Number(recent[0].cnt) >= MAX_ATTEMPTS) {
    res.status(429).json({ error: "Too many attempts. Please wait a few minutes and try again." });
    return;
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await sql`
    INSERT INTO platform_phone_verifications (user_id, phone, otp_hash, expires_at)
    VALUES (${userId}, ${formattedPhone}, ${hashOtp(otp)}, ${expiresAt})
  `;

  try {
    const client = twilio(TWILIO_SID, TWILIO_AUTH);
    await client.messages.create({
      body: `Your CreateAI verification code is: ${otp}. It expires in 10 minutes. Do not share this code.`,
      from: TWILIO_FROM,
      to: formattedPhone,
    });
    res.json({ success: true, phone: formattedPhone.replace(/\d(?=\d{4})/g, "•") });
  } catch (err) {
    console.error("[phoneAuth] Twilio send failed:", err);
    // For development: log OTP if Twilio fails
    console.log(`[phoneAuth] DEV OTP for ${formattedPhone}: ${otp}`);
    res.json({ success: true, phone: formattedPhone.replace(/\d(?=\d{4})/g, "•"), _dev: true });
  }
});

// POST /api/phone-auth/verify-otp
// Body: { phone: string, otp: string, deviceName?: string }
router.post("/verify-otp", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { phone, otp, deviceName } = req.body as {
    phone?: string;
    otp?: string;
    deviceName?: string;
  };

  if (!phone || !otp) {
    res.status(400).json({ error: "Phone and OTP are required" });
    return;
  }

  const userId = (req.user as { id: string }).id;
  const formattedPhone = formatPhone(phone);
  const sql = getSql();

  const [verification] = await sql`
    SELECT * FROM platform_phone_verifications
    WHERE user_id = ${userId}
      AND phone = ${formattedPhone}
      AND verified_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (!verification) {
    res.status(400).json({ error: "OTP expired or not found. Please request a new code." });
    return;
  }

  // Update attempt count
  await sql`
    UPDATE platform_phone_verifications
    SET attempt_count = attempt_count + 1
    WHERE id = ${verification.id}
  `;

  if (verification.attempt_count + 1 > MAX_ATTEMPTS) {
    res.status(400).json({ error: "Too many incorrect attempts. Please request a new code." });
    return;
  }

  if (verification.otp_hash !== hashOtp(otp.trim())) {
    res.status(400).json({ error: "Incorrect code. Please try again." });
    return;
  }

  // Mark verified
  await sql`
    UPDATE platform_phone_verifications
    SET verified_at = NOW()
    WHERE id = ${verification.id}
  `;

  // Generate a device token for this browser session
  const deviceToken = crypto.randomBytes(48).toString("hex");
  const name = deviceName || `Device verified ${new Date().toLocaleDateString()}`;

  await sql`
    INSERT INTO platform_trusted_devices
      (user_id, device_name, device_token, phone_verified, last_used_at)
    VALUES
      (${userId}, ${name}, ${deviceToken}, TRUE, NOW())
    ON CONFLICT (device_token) DO NOTHING
  `;

  res.json({ success: true, deviceToken, phone: formattedPhone.replace(/\d(?=\d{4})/g, "•") });
});

// GET /api/phone-auth/status
// Returns whether the current user has a verified phone
router.get("/status", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.json({ hasVerifiedPhone: false });
    return;
  }

  const userId = (req.user as { id: string }).id;
  const sql = getSql();

  const [row] = await sql`
    SELECT COUNT(*) AS cnt FROM platform_trusted_devices
    WHERE user_id = ${userId} AND phone_verified = TRUE
  `;

  res.json({ hasVerifiedPhone: Number(row?.cnt ?? 0) > 0 });
});

export default router;
