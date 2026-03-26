/**
 * ebs/ebsDispatcher.ts
 * ────────────────────────────────────────────────────────────────────────────
 * EBS Total Broadcast Dispatcher
 * Architect-only: fires SMS + HTML Email to the Family Frequency List.
 *
 * SMS  → Twilio       (TWILIO_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE_NUMBER)
 * Email → Nodemailer  (Resend SMTP — RESEND_API_KEY)
 */

import twilio from "twilio";
import nodemailer from "nodemailer";

// ── Recipients ───────────────────────────────────────────────────────────────
const SMS_RECIPIENTS: string[] = [
  process.env["SARA_PHONE"] ?? "+17157910292", // Sara Stadler — Lakeside Trinity
];

const EMAIL_RECIPIENTS: string[] = [
  "admin@LakesideTrinity.com",
];

// ── Message Content ──────────────────────────────────────────────────────────
const SMS_BODY =
  "EBS ALERT: The 17-Frequency is Active. Check your Nexus Elite Hub at createai.digital.";

const EMAIL_SUBJECT = "EBS ALERT: 17-Frequency Active | Sovereign Seal — Lakeside Trinity";

const EMAIL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>EBS ALERT — Sovereign Seal</title>
  <style>
    body{margin:0;padding:0;background:#060a06;font-family:'Segoe UI',Arial,sans-serif;color:#ddd8c4}
    .wrap{max-width:600px;margin:0 auto;background:#060a06;border:1px solid rgba(201,168,76,.3);border-radius:16px;overflow:hidden}
    .header{background:linear-gradient(135deg,#0a1008,#111c0c);padding:44px 40px 36px;text-align:center;border-bottom:1px solid rgba(201,168,76,.2)}
    .orb{width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 35% 32%,#f5e17a,#c9a84c 55%,#7a5318);margin:0 auto 22px;box-shadow:0 0 24px rgba(201,168,76,.8),0 0 48px rgba(201,168,76,.35)}
    .brand{font-size:.58rem;letter-spacing:.28em;color:rgba(201,168,76,.55);text-transform:uppercase;margin-bottom:10px;font-weight:700}
    h1{font-size:1.7rem;font-weight:900;color:#f0eade;margin:0 0 8px;line-height:1.2}
    h1 span{color:#c9a84c}
    .sub{font-size:.78rem;color:rgba(221,216,196,.5);letter-spacing:.06em}
    .body{padding:36px 40px}
    .alert-badge{display:inline-block;background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.35);border-radius:30px;padding:7px 20px;font-size:.62rem;font-weight:700;letter-spacing:.22em;color:rgba(201,168,76,.8);text-transform:uppercase;margin-bottom:28px}
    .message{font-size:1rem;color:#ddd8c4;line-height:1.75;margin-bottom:28px}
    .freq-row{display:flex;gap:18px;margin-bottom:32px}
    .freq-block{flex:1;background:rgba(14,20,10,.9);border:1px solid rgba(201,168,76,.2);border-radius:12px;padding:18px;text-align:center}
    .freq-label{font-size:.5rem;font-weight:700;letter-spacing:.22em;color:rgba(201,168,76,.45);text-transform:uppercase;margin-bottom:6px}
    .freq-value{font-size:1.2rem;font-weight:900;color:#c9a84c;font-family:monospace}
    .cta-btn{display:block;width:100%;padding:18px;background:linear-gradient(135deg,#c9a84c,#e8c96a 60%,#c9a84c);color:#1a1000;border-radius:50px;font-weight:800;font-size:.88rem;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;text-align:center;margin-bottom:24px;box-shadow:0 6px 28px rgba(201,168,76,.4)}
    .footer{padding:24px 40px;border-top:1px solid rgba(201,168,76,.12);text-align:center;background:rgba(4,7,3,.5)}
    .footer-text{font-size:.64rem;color:rgba(221,216,196,.3);letter-spacing:.08em;line-height:1.8}
    .footer-gold{color:rgba(201,168,76,.5)}
    .seal{font-size:.54rem;font-weight:700;letter-spacing:.24em;color:rgba(201,168,76,.38);text-transform:uppercase;margin-top:12px}
  </style>
</head>
<body>
<div style="padding:20px;background:#040704">
<div class="wrap">
  <div class="header">
    <div class="orb"></div>
    <div class="brand">Lakeside Trinity LLC &bull; EBS Broadcast</div>
    <h1>17-Frequency <span>Active</span></h1>
    <p class="sub">Event-Based System Alert &bull; Sovereign Seal Confirmed</p>
  </div>
  <div class="body">
    <div class="alert-badge">&#9888; EBS Alert — 17 Nodes Active</div>
    <p class="message">
      The Sovereign Frequency has been activated across all 17 nodes. Your Nexus Elite Hub is live and awaiting your command. Access your Sovereign Command Center, Frequency Vault, and all restoration channels now.
    </p>
    <div class="freq-row">
      <div class="freq-block">
        <div class="freq-label">Frequency</div>
        <div class="freq-value">197.0 Hz</div>
      </div>
      <div class="freq-block">
        <div class="freq-label">Phase</div>
        <div class="freq-value">ALPHA-17</div>
      </div>
      <div class="freq-block">
        <div class="freq-label">Status</div>
        <div class="freq-value" style="color:#4caf7a;font-size:.9rem">LIVE</div>
      </div>
    </div>
    <a href="https://createai.digital/nexus" class="cta-btn">Enter Nexus Elite Hub &rarr;</a>
  </div>
  <div class="footer">
    <p class="footer-text">
      Lakeside Trinity LLC &bull; NPI 1346233350 &bull; Webster, WI 54893<br/>
      <span class="footer-gold">admin@LakesideTrinity.com</span> &bull; CashApp: $LakesideTrinity
    </p>
    <p class="seal">&#9670; Sovereign Seal Active &bull; ALPHA-17 &bull; 17 Frequency Active &#9670;</p>
  </div>
</div>
</div>
</body>
</html>`;

// ── Result Types ─────────────────────────────────────────────────────────────
export interface BroadcastResult {
  sms:   { status: string; recipients: number; errors: string[] };
  email: { status: string; recipients: number; errors: string[] };
  firedAt: string;
}

// ── Main Dispatcher ──────────────────────────────────────────────────────────
export async function broadcastEBS(): Promise<BroadcastResult> {
  const result: BroadcastResult = {
    sms:   { status: "skipped", recipients: 0, errors: [] },
    email: { status: "skipped", recipients: 0, errors: [] },
    firedAt: new Date().toISOString(),
  };

  // ── SMS via Twilio ────────────────────────────────────────────────────────
  const twilioSid   = process.env["TWILIO_SID"];
  const twilioToken = process.env["TWILIO_AUTH_TOKEN"];
  const twilioFrom  = process.env["TWILIO_PHONE_NUMBER"];

  if (twilioSid && twilioToken && twilioFrom) {
    const client = twilio(twilioSid, twilioToken);
    for (const to of SMS_RECIPIENTS) {
      try {
        await client.messages.create({ body: SMS_BODY, from: twilioFrom, to });
        result.sms.recipients++;
      } catch (err: any) {
        result.sms.errors.push(`${to}: ${err?.message ?? String(err)}`);
      }
    }
    result.sms.status = result.sms.recipients > 0 ? "sent" : "failed";
  } else {
    result.sms.status = "skipped: TWILIO_PHONE_NUMBER not configured";
    console.warn("[EBS:Dispatcher] SMS skipped — set TWILIO_PHONE_NUMBER to enable");
  }

  // ── Email via Nodemailer + Resend SMTP ────────────────────────────────────
  const resendKey = process.env["RESEND_API_KEY"];
  if (resendKey) {
    const transporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 587,
      secure: false,
      auth: { user: "resend", pass: resendKey },
    });
    for (const to of EMAIL_RECIPIENTS) {
      try {
        await transporter.sendMail({
          from:    '"Lakeside Trinity — The Architect" <onboarding@resend.dev>',
          replyTo: "admin@LakesideTrinity.com",
          to,
          subject: EMAIL_SUBJECT,
          html:    EMAIL_HTML,
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
