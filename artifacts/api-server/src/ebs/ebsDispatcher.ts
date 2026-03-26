/**
 * ebs/ebsDispatcher.ts
 * ────────────────────────────────────────────────────────────────────────────
 * EBS Total Broadcast Dispatcher
 * Architect-only: fires SMS + HTML Email to the Sovereign Family List.
 *
 * SMS   → Twilio      (TWILIO_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE_NUMBER)
 * Email → Nodemailer  (Resend SMTP port 465 SSL — RESEND_API_KEY)
 *
 * broadcastEBS(message, subject) — both channels execute simultaneously.
 */

import twilio from "twilio";
import nodemailer from "nodemailer";

// ── Recipients ────────────────────────────────────────────────────────────────
const SMS_RECIPIENT = "+17157910292"; // Sara Stadler — Lakeside Trinity

const EMAIL_RECIPIENTS = ["admin@LakesideTrinity.com"]; // The 17-of-17 Root

// ── Result Types ──────────────────────────────────────────────────────────────
export interface BroadcastResult {
  sms:   { status: string; recipients: number; errors: string[] };
  email: { status: string; recipients: number; errors: string[] };
  firedAt: string;
}

// ── Main Dispatcher ───────────────────────────────────────────────────────────
export async function broadcastEBS(
  message: string,
  subject: string,
): Promise<BroadcastResult> {
  const result: BroadcastResult = {
    sms:   { status: "skipped", recipients: 0, errors: [] },
    email: { status: "skipped", recipients: 0, errors: [] },
    firedAt: new Date().toISOString(),
  };

  // ── SMS via Twilio ──────────────────────────────────────────────────────────
  const twilioSid   = process.env["TWILIO_SID"];
  const twilioToken = process.env["TWILIO_AUTH_TOKEN"];
  const twilioFrom  = process.env["TWILIO_PHONE_NUMBER"];

  if (twilioSid && twilioToken && twilioFrom) {
    const client = twilio(twilioSid, twilioToken);
    try {
      await client.messages.create({
        body: message,
        from: twilioFrom,
        to:   SMS_RECIPIENT,
      });
      result.sms.recipients++;
      result.sms.status = "sent";
    } catch (err: any) {
      result.sms.errors.push(`${SMS_RECIPIENT}: ${err?.message ?? String(err)}`);
      result.sms.status = "failed";
    }
  } else {
    result.sms.status = "skipped: TWILIO_PHONE_NUMBER not configured";
    console.warn("[EBS:Dispatcher] SMS skipped — set TWILIO_PHONE_NUMBER secret to enable");
  }

  // ── Email via Nodemailer + Resend SMTP (port 465 SSL) ──────────────────────
  const resendKey = process.env["RESEND_API_KEY"];
  if (resendKey) {
    const transporter = nodemailer.createTransport({
      host:   "smtp.resend.com",
      port:   465,
      secure: true,
      auth: { user: "resend", pass: resendKey },
    });

    for (const to of EMAIL_RECIPIENTS) {
      try {
        await transporter.sendMail({
          from:    "EBS <onboarding@resend.dev>",
          replyTo: "admin@LakesideTrinity.com",
          to,
          subject,
          html: `<div style="background:#000;color:#d4af37;padding:40px;font-family:serif;">
  <h1 style="border-bottom:1px solid #d4af37;padding-bottom:14px;margin-bottom:24px;">197.0 Hz | SOVEREIGN_DECREE</h1>
  <p style="font-size:1rem;line-height:1.75;color:#f5e8b0;margin-bottom:32px;">${message}</p>
  <a href="https://createai.digital/nexus"
     style="display:inline-block;background:#d4af37;color:#000;padding:15px 30px;text-decoration:none;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;border-radius:4px;">
    ENTER THE NEXUS
  </a>
  <p style="margin-top:40px;font-size:0.6rem;color:rgba(212,175,55,0.4);letter-spacing:0.18em;text-transform:uppercase;">
    &#9670; Sovereign Seal Active &bull; ALPHA-17 &bull; 17 Frequency Active &#9670;
  </p>
</div>`,
        });
        result.email.recipients++;
      } catch (err: any) {
        result.email.errors.push(`${to}: ${err?.message ?? String(err)}`);
      }
    }
    result.email.status = result.email.recipients > 0 ? "sent" : "failed";
  } else {
    result.email.status = "skipped: RESEND_API_KEY not configured";
    console.warn("[EBS:Dispatcher] Email skipped — RESEND_API_KEY not configured");
  }

  console.log("[EBS:Dispatcher] Broadcast complete:", JSON.stringify(result, null, 2));
  return result;
}
