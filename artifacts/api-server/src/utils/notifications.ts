/**
 * Family Notification Service — CreateAI Brain
 *
 * Sends a secure Brain-access link to every authorized family member
 * via email (Resend) and SMS (Twilio) on startup.
 *
 * Required environment secrets:
 *   RESEND_API_KEY     — from resend.com (free tier works)
 *   RESEND_FROM_EMAIL  — verified sender, e.g. "sara@yourdomain.com"
 *                        (use "onboarding@resend.dev" while testing)
 *   TWILIO_SID         — Account SID from twilio.com console
 *   TWILIO_AUTH_TOKEN  — Auth Token from twilio.com console
 *   TWILIO_PHONE       — Twilio sending number, e.g. "+15551234567"
 *
 * Optional:
 *   BRAIN_NOTIFY_ON_START — set to "true" to fire on every server start
 *   BRAIN_PUBLIC_URL      — override the Brain URL in links
 */

import { Resend } from "resend";
import twilio from "twilio";

// ─── Client init (lazy — only instantiate if keys are present) ───────────────

function getResend(): InstanceType<typeof Resend> | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

function getTwilio(): ReturnType<typeof twilio> | null {
  const sid   = process.env.TWILIO_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  return sid && token ? twilio(sid, token) : null;
}

// ─── Brain URL ────────────────────────────────────────────────────────────────

function getBrainUrl(): string {
  if (process.env.BRAIN_PUBLIC_URL) return process.env.BRAIN_PUBLIC_URL;
  const domain = process.env.REPLIT_DEV_DOMAIN;
  if (domain) return `https://${domain}/createai-brain`;
  return "https://createai-brain.replit.app/createai-brain";
}

// ─── Secure link generation ───────────────────────────────────────────────────

function generateSecureLink(email: string): string {
  const payload = Buffer.from(`${email.toLowerCase()}:${Date.now()}`).toString("base64url");
  return `${getBrainUrl()}/signin?token=${payload}`;
}

// ─── Authorized family list ───────────────────────────────────────────────────
// email-only members have phone: null (no SMS sent, email only)

const FAMILY_LIST: { name: string; email: string; phone: string | null }[] = [
  // Sara — primary account holder
  { name: "Sara",     email: "SIVH@mail.com",                    phone: null },

  // Dennis Stadler — husband
  { name: "Dennis",   email: "StadlerDennis@yahoo.com",           phone: "+17157914957" },

  // Nathan Richard Stadler — oldest son
  { name: "Nathan",   email: "Stadlernathan5499@gmail.com",        phone: "+17157914114" },

  // Nolan Ryan Stadler — son
  { name: "Nolan",    email: "Stadlernolan29@icloud.com",          phone: null },

  // Carolina (Calixto) Stadler — daughter-in-law
  { name: "Carolina", email: "caro.ixto5499@gmail.com",            phone: "+17157914050" },

  // Nakyllah Raine Stadler — daughter
  { name: "Nakyllah", email: "NakyllahStadler0@gmail.com",         phone: "+17157918085" },

  // Jenny — sister
  { name: "Jenny",    email: "Jeepgirl20@yahoo.com",               phone: "+17157914222" },

  // Shawn Miller ("Deuce") — brother-in-law
  { name: "Shawn",    email: "Shawnjennymiller@gmail.com",         phone: "+16514250505" },

  // Shelly Phelps — cousin & best friend
  { name: "Shelly",   email: "miphelps1121@gmail.com",             phone: "+17154165002" },

  // Terri Rossow — mom
  { name: "Terri",    email: "richandterri5861@gmail.com",          phone: "+17157910555" },
];

// ─── Single-member notification ───────────────────────────────────────────────

async function notifyMember(member: typeof FAMILY_LIST[number]): Promise<void> {
  const link      = generateSecureLink(member.email);
  const resend    = getResend();
  const twilioClient = getTwilio();
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const fromPhone = process.env.TWILIO_PHONE      ?? "";

  // ── Email ──────────────────────────────────────────────────────────────────
  if (resend) {
    await resend.emails.send({
      from:    `Sara's Brain <${fromEmail}>`,
      to:      [member.email],
      subject: "Your CreateAI Brain access is live ✨",
      html: `
        <div style="font-family: -apple-system, Helvetica, sans-serif; max-width: 600px; margin: auto; padding: 32px;">
          <h2 style="color: #6366f1;">CreateAI Brain</h2>
          <p>Hi <strong>${member.name}</strong>,</p>
          <p>Sara's CreateAI Brain is live and your personalized access is ready.</p>
          <p style="margin: 24px 0;">
            <a href="${link}"
               style="background: #6366f1; color: #fff; padding: 12px 24px;
                      border-radius: 8px; text-decoration: none; font-weight: 600;">
              Open My Brain Dashboard →
            </a>
          </p>
          <p style="font-size: 13px; color: #888;">
            This link is unique to you and expires in 24 hours.<br>
            ${link}
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #aaa;">
            CreateAI Brain — Universe-Scale AI Platform · Family Access
          </p>
        </div>
      `,
    });
    console.log(`[Brain:notify] Email sent → ${member.name} <${member.email}>`);
  } else {
    console.warn(`[Brain:notify] RESEND_API_KEY not set — skipped email to ${member.name}`);
  }

  // ── SMS ────────────────────────────────────────────────────────────────────
  if (twilioClient && member.phone && fromPhone) {
    await twilioClient.messages.create({
      body: `Hi ${member.name}! Sara's Brain is live. Open your dashboard: ${link}`,
      from: fromPhone,
      to:   member.phone,
    });
    console.log(`[Brain:notify] SMS sent → ${member.name} (${member.phone})`);
  } else if (member.phone && !twilioClient) {
    console.warn(`[Brain:notify] Twilio not configured — skipped SMS to ${member.name}`);
  }
}

// ─── Full family blast ────────────────────────────────────────────────────────

export async function notifyFamily(): Promise<void> {
  console.log(`[Brain:notify] Sending access notifications to ${FAMILY_LIST.length} family members…`);

  const results = await Promise.allSettled(
    FAMILY_LIST.map(m => notifyMember(m))
  );

  const succeeded = results.filter(r => r.status === "fulfilled").length;
  const failed    = results.filter(r => r.status === "rejected");

  failed.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[Brain:notify] Failed for member ${i}:`, r.reason);
    }
  });

  console.log(`[Brain:notify] Done — ${succeeded}/${FAMILY_LIST.length} notifications sent.`);
}

// ─── Event notification (task completion, alerts, etc.) ───────────────────────

export interface FamilyEventOptions {
  subject: string;
  message: string;
}

/**
 * Send a plain-text event notification (no secure link) to all family members.
 * Used by InfinityExecutor for task-completion alerts and by other Brain modules
 * that need to surface a specific event to the family.
 */
export async function notifyFamilyEvent(options: FamilyEventOptions): Promise<void> {
  const resend    = getResend();
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  if (!resend) {
    console.warn(`[Brain:event] RESEND_API_KEY not set — cannot send event notification: "${options.subject}"`);
    return;
  }

  const toAddresses = FAMILY_LIST.map(m => m.email);

  try {
    await resend.emails.send({
      from:    `Sara's Brain <${fromEmail}>`,
      to:      toAddresses,
      subject: options.subject,
      html: `
        <div style="font-family: -apple-system, Helvetica, sans-serif; max-width: 600px; margin: auto; padding: 32px;">
          <h2 style="color: #6366f1;">CreateAI Brain</h2>
          <p>${options.message}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #aaa;">
            CreateAI Brain — Universe-Scale AI Platform · Family Access
          </p>
        </div>
      `,
    });
    console.log(`[Brain:event] Notification sent — "${options.subject}" → ${toAddresses.length} recipients`);
  } catch (err) {
    console.error(`[Brain:event] Failed to send event notification:`, err);
  }
}
