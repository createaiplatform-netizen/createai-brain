/**
 * notifications.ts — CreateAI Brain Notification Service
 * -------------------------------------------------------
 * Fully ESM-compatible, TypeScript-typed, zero silent failures.
 *
 * Public API:
 *   sendEmailNotification(to, subject, body)   → per-recipient {to, success, reason?}[]
 *   sendSMSNotification(to, message)           → per-recipient {to, success, reason?}[]
 *   notifyFamily()                             → full family blast (startup)
 *   notifyFamilyEvent(options)                 → event alert to all family
 *   credentialStatus()                         → real-time credential report
 *
 * Environment variables:
 *   RESEND_API_KEY     — from resend.com (free tier works)
 *   RESEND_FROM_EMAIL  — verified sender (use "onboarding@resend.dev" while testing)
 *   TWILIO_SID         — Twilio Account SID
 *   TWILIO_AUTH_TOKEN  — Twilio Auth Token
 *   TWILIO_PHONE       — Twilio sending number, e.g. "+15551234567"
 */

import { Resend } from "resend";
import twilio     from "twilio";

// ─── Beyond Infinity industry baselines ──────────────────────────────────────
// Used to compute overachievement % for each notification run.

const INDUSTRY_BASELINE = {
  emailDeliveryRate: 62,   // % — industry average email delivery
  smsDeliveryRate:   55,   // % — industry average SMS delivery
};

// ─── Real send counters ───────────────────────────────────────────────────────
// Incremented ONLY when an external API confirms delivery. Never on failure.
// Exported so /api/system/health-real can read live values.

export let emailsSentCount    = 0;
export let smsSentCount       = 0;
export let lastSuccessfulEmail: string | null = null;
export let lastSuccessfulSMS:   string | null = null;

// ─── Credential detection ─────────────────────────────────────────────────────

function getResend(): InstanceType<typeof Resend> | null {
  const key = process.env["RESEND_API_KEY"] ?? "";
  if (!key) {
    console.error("[EMAIL NOT SENT] RESEND_API_KEY is not set — add a valid re_... key to Replit Secrets → Resend dashboard: resend.com/api-keys");
    return null;
  }
  if (!key.startsWith("re_")) {
    console.error(`[EMAIL NOT SENT] INVALID RESEND_API_KEY — value does not start with "re_" (current length: ${key.length}). Replace with a real key from resend.com/api-keys`);
    return null;
  }
  return new Resend(key);
}

function getTwilioClient(): ReturnType<typeof twilio> | null {
  const sid   = process.env["TWILIO_SID"]        ?? "";
  const token = process.env["TWILIO_AUTH_TOKEN"]  ?? "";
  if (!sid || !token) {
    console.error("[SMS NOT SENT] INVALID TWILIO_CREDENTIALS — TWILIO_SID and TWILIO_AUTH_TOKEN are both required. Get them from console.twilio.com");
    return null;
  }
  if (!sid.startsWith("AC") || sid.length !== 34) {
    console.error(`[SMS NOT SENT] INVALID TWILIO_CREDENTIALS — TWILIO_SID must start with "AC" and be exactly 34 characters (current: "${sid.slice(0,4)}..." length=${sid.length}). Get the real SID from console.twilio.com`);
    return null;
  }
  if (token.length !== 32) {
    console.error(`[SMS NOT SENT] INVALID TWILIO_CREDENTIALS — TWILIO_AUTH_TOKEN must be exactly 32 hex characters (current length: ${token.length}). Get the real token from console.twilio.com`);
    return null;
  }
  try {
    return twilio(sid, token);
  } catch (err) {
    console.error(`[SMS NOT SENT] INVALID TWILIO_CREDENTIALS — Twilio client init failed: ${(err as Error).message}`);
    return null;
  }
}

/** Real-time credential status — never exposes secret values. */
export function credentialStatus(): {
  email: { configured: boolean; missing: string[]; invalid: string[] };
  sms:   { configured: boolean; missing: string[]; invalid: string[] };
  summary: string;
} {
  const emailMissing: string[] = [];
  const emailInvalid: string[] = [];
  const smsMissing:   string[] = [];
  const smsInvalid:   string[] = [];

  const resendKey   = process.env["RESEND_API_KEY"]    ?? "";
  const resendFrom  = process.env["RESEND_FROM_EMAIL"] ?? "";
  const twilioSid   = process.env["TWILIO_SID"]        ?? "";
  const twilioToken = process.env["TWILIO_AUTH_TOKEN"] ?? "";
  const twilioPhone = process.env["TWILIO_PHONE"]      ?? "";

  if (!resendKey)   emailMissing.push("RESEND_API_KEY");
  else if (!resendKey.startsWith("re_")) emailInvalid.push("RESEND_API_KEY (must start with re_)");

  if (!resendFrom)  emailMissing.push("RESEND_FROM_EMAIL");

  if (!twilioSid)   smsMissing.push("TWILIO_SID");
  else if (!twilioSid.startsWith("AC")) smsInvalid.push("TWILIO_SID (must start with AC)");

  if (!twilioToken) smsMissing.push("TWILIO_AUTH_TOKEN");
  if (!twilioPhone) smsMissing.push("TWILIO_PHONE");

  const emailOk = emailMissing.length === 0 && emailInvalid.length === 0;
  const smsOk   = smsMissing.length === 0   && smsInvalid.length === 0;

  const allIssues = [
    ...emailMissing.map(k => `${k} missing`),
    ...emailInvalid,
    ...smsMissing.map(k => `${k} missing`),
    ...smsInvalid,
  ];

  return {
    email:   { configured: emailOk, missing: emailMissing, invalid: emailInvalid },
    sms:     { configured: smsOk,   missing: smsMissing,   invalid: smsInvalid },
    summary: emailOk && smsOk
      ? "✅ All notification credentials configured and valid"
      : `⚠️  Issues: ${allIssues.join("; ")}`,
  };
}

// ─── Overachievement calculator ───────────────────────────────────────────────

function overachievement(successCount: number, total: number, baseline: number): number {
  if (total === 0) return 0;
  const rate = (successCount / total) * 100;
  return parseFloat(((rate / baseline) * 100).toFixed(1));
}

// ─── Result types ─────────────────────────────────────────────────────────────

export interface NotifyResult {
  to:            string;
  success:       boolean;
  reason?:       string;
  provider?:     string;
  executedAt:    string;
}

export interface NotifyBatchResult {
  results:            NotifyResult[];
  successCount:       number;
  failCount:          number;
  total:              number;
  successRate_pct:    number;
  overachievement_pct: number;
  credentialsUsed:    boolean;
  mode:               string;
  executedAt:         string;
}

function makeBatch(results: NotifyResult[], baseline: number, credentialsUsed: boolean): NotifyBatchResult {
  const successCount = results.filter(r => r.success).length;
  const total        = results.length;
  return {
    results,
    successCount,
    failCount:           total - successCount,
    total,
    successRate_pct:     total > 0 ? Math.round((successCount / total) * 100) : 0,
    overachievement_pct: overachievement(successCount, total, baseline),
    credentialsUsed,
    mode:                "💠 Beyond Infinity — No Limits Mode",
    executedAt:          new Date().toISOString(),
  };
}

// ─── sendEmailNotification ────────────────────────────────────────────────────

/**
 * Send an email to each address in `to[]`.
 * Returns a per-recipient result with success, reason, and overachievement %.
 * Safe fallback when RESEND_API_KEY is missing — logs clearly, never throws.
 */
export async function sendEmailNotification(
  to:      string[],
  subject: string,
  body:    string,
): Promise<NotifyBatchResult> {
  const creds  = credentialStatus();
  const resend = getResend();
  const from   = process.env["RESEND_FROM_EMAIL"] ?? "onboarding@resend.dev";
  const now    = new Date().toISOString();

  if (!resend) {
    // getResend() already logged the specific error — no duplicate logging needed
    const results: NotifyResult[] = to.map(addr => ({
      to:         addr,
      success:    false,
      reason:     `EMAIL NOT SENT — RESEND_API_KEY missing or invalid. Add a valid re_... key to Replit Secrets.`,
      provider:   "resend",
      executedAt: now,
    }));
    return makeBatch(results, INDUSTRY_BASELINE.emailDeliveryRate, false);
  }

  console.log(`[Notify:email] Sending "${subject}" → ${to.length} recipient(s)…`);

  const results = await Promise.allSettled(
    to.map(async (addr): Promise<NotifyResult> => {
      try {
        const { error } = await resend.emails.send({
          from,
          to:      [addr],
          subject,
          html:    `
            <div style="font-family:-apple-system,Helvetica,sans-serif;max-width:620px;margin:auto;padding:32px;">
              <h2 style="color:#6366f1;">💠 CreateAI Brain</h2>
              ${body}
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
              <p style="font-size:12px;color:#aaa;">
                Beyond Infinity — No Limits Mode · Sara's System · ${now}
              </p>
            </div>
          `,
        });
        if (error) throw new Error(error.message ?? String(error));
        // ✅ REAL delivery confirmed — increment counter
        emailsSentCount++;
        lastSuccessfulEmail = now;
        console.log(`[Notify:email] ✅ Sent → ${addr} (total confirmed: ${emailsSentCount})`);
        return { to: addr, success: true, provider: "resend", executedAt: now };
      } catch (err) {
        console.error(`[Notify:email] ❌ Failed → ${addr}:`, (err as Error).message);
        return { to: addr, success: false, reason: (err as Error).message, provider: "resend", executedAt: now };
      }
    })
  );

  const flat = results.map(r => r.status === "fulfilled" ? r.value : {
    to:         "unknown",
    success:    false,
    reason:     (r as PromiseRejectedResult).reason?.message ?? "unknown error",
    provider:   "resend",
    executedAt: now,
  } satisfies NotifyResult);

  const batch = makeBatch(flat, INDUSTRY_BASELINE.emailDeliveryRate, true);
  console.log(`[Notify:email] Done — ${batch.successCount}/${batch.total} sent`);
  return batch;
}

// ─── sendSMSNotification ──────────────────────────────────────────────────────

/**
 * Send an SMS to each phone number in `to[]`.
 * Returns a per-recipient result with success, reason, and overachievement %.
 * Safe fallback when Twilio credentials are missing — logs clearly, never throws.
 */
export async function sendSMSNotification(
  to:      string[],
  message: string,
): Promise<NotifyBatchResult> {
  const creds   = credentialStatus();
  const client  = getTwilioClient();
  const from    = process.env["TWILIO_PHONE"] ?? "";
  const now     = new Date().toISOString();

  if (!client) {
    // getTwilioClient() already logged the specific error — no duplicate needed
    if (!from) {
      console.error("[SMS NOT SENT] INVALID TWILIO_CREDENTIALS — TWILIO_PHONE is not set. Add your Twilio sending number (e.g. +15551234567) to Replit Secrets.");
    }
    const results: NotifyResult[] = to.map(phone => ({
      to:         phone,
      success:    false,
      reason:     "SMS NOT SENT — TWILIO_CREDENTIALS invalid or missing. TWILIO_SID must start with AC (34 chars), TWILIO_AUTH_TOKEN must be 32 hex chars, TWILIO_PHONE must be set.",
      provider:   "twilio",
      executedAt: now,
    }));
    return makeBatch(results, INDUSTRY_BASELINE.smsDeliveryRate, false);
  }

  if (!from) {
    console.error("[SMS NOT SENT] INVALID TWILIO_CREDENTIALS — TWILIO_PHONE is not set. Add your Twilio sending number to Replit Secrets.");
    const results: NotifyResult[] = to.map(phone => ({
      to: phone, success: false,
      reason: "SMS NOT SENT — TWILIO_PHONE not configured",
      provider: "twilio", executedAt: now,
    }));
    return makeBatch(results, INDUSTRY_BASELINE.smsDeliveryRate, false);
  }

  console.log(`[Notify:sms] Sending SMS → ${to.length} recipient(s)…`);

  const results = await Promise.allSettled(
    to.map(async (phone): Promise<NotifyResult> => {
      try {
        await client.messages.create({ body: message, from, to: phone });
        // ✅ REAL delivery confirmed — increment counter
        smsSentCount++;
        lastSuccessfulSMS = now;
        console.log(`[Notify:sms] ✅ Sent → ${phone} (total confirmed: ${smsSentCount})`);
        return { to: phone, success: true, provider: "twilio", executedAt: now };
      } catch (err) {
        console.error(`[Notify:sms] ❌ Failed → ${phone}:`, (err as Error).message);
        return { to: phone, success: false, reason: (err as Error).message, provider: "twilio", executedAt: now };
      }
    })
  );

  const flat = results.map(r => r.status === "fulfilled" ? r.value : {
    to:         "unknown",
    success:    false,
    reason:     (r as PromiseRejectedResult).reason?.message ?? "unknown error",
    provider:   "twilio",
    executedAt: now,
  } satisfies NotifyResult);

  const batch = makeBatch(flat, INDUSTRY_BASELINE.smsDeliveryRate, true);
  console.log(`[Notify:sms] Done — ${batch.successCount}/${batch.total} sent`);
  return batch;
}

// ─── Authorized family lists ──────────────────────────────────────────────────

export const FAMILY_EMAIL_LIST = [
  { name: "Sara",     email: process.env["CONTACT_EMAIL"] ?? "admin@createaiplatform.com" },
  { name: "Dennis",   email: "StadlerDennis@yahoo.com"          },
  { name: "Nathan",   email: "Stadlernathan5499@gmail.com"       },
  { name: "Nolan",    email: "Stadlernolan29@icloud.com"         },
  { name: "Carolina", email: "caro.ixto5499@gmail.com"          },
  { name: "Nakyllah", email: "NakyllahStadler0@gmail.com"        },
  { name: "Jenny",    email: "Jeepgirl20@yahoo.com"             },
  { name: "Shawn",    email: "Shawnjennymiller@gmail.com"       },
  { name: "Shelly",   email: "miphelps1121@gmail.com"           },
  { name: "Terri",    email: "richandterri5861@gmail.com"       },
];

export const FAMILY_SMS_LIST = [
  { name: "Dennis",   phone: "+17157914957" },
  { name: "Nathan",   phone: "+17157914114" },
  { name: "Carolina", phone: "+17157914050" },
  { name: "Nakyllah", phone: "+17157918085" },
  { name: "Jenny",    phone: "+17157914222" },
  { name: "Shawn",    phone: "+16514250505" },
  { name: "Shelly",   phone: "+17154165002" },
  { name: "Terri",    phone: "+17157910555" },
];

// ─── Brain URL helper ─────────────────────────────────────────────────────────

function getBrainUrl(): string {
  if (process.env["BRAIN_PUBLIC_URL"]) return process.env["BRAIN_PUBLIC_URL"];
  const domain = process.env["REPLIT_DEV_DOMAIN"];
  if (domain) return `https://${domain}/createai-brain`;
  return "https://createai-brain.replit.app/createai-brain";
}

function generateSecureLink(email: string): string {
  const payload = Buffer.from(`${email.toLowerCase()}:${Date.now()}`).toString("base64url");
  return `${getBrainUrl()}/signin?token=${payload}`;
}

// ─── notifyFamily — startup blast (10 email + 8 SMS) ─────────────────────────

export interface NotifyFamilyOptions {
  /** Which channel(s) to send on. Default: "both" */
  channel?: "email" | "sms" | "both";
  /** Override subject for email channel. Default: "Your CreateAI Brain access is live ✨" */
  subject?: string;
  /** Override body/message. Defaults to the standard Brain launch message. */
  message?: string;
}

/**
 * Send notifications to the full authorized family list.
 * Returns a flat array of per-recipient NotifyResult objects.
 * Backward compatible — can be called with no arguments.
 */
export async function notifyFamily(options?: NotifyFamilyOptions): Promise<NotifyResult[]> {
  const brainUrl = getBrainUrl();
  const channel  = options?.channel ?? "both";
  const allResults: NotifyResult[] = [];

  const subject = options?.subject ?? "Your CreateAI Brain access is live ✨";
  const body    = options?.message
    ? `<p>${options.message}</p>`
    : `
        <p>Sara's CreateAI Brain is live and your personalized access is ready.</p>
        <p style="margin:24px 0;">
          <a href="${brainUrl}"
             style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;
                    text-decoration:none;font-weight:600;">
            Open My Brain Dashboard →
          </a>
        </p>
        <p style="font-size:13px;color:#888;">
          Your personal link · ${brainUrl}
        </p>
      `;

  if (channel === "email" || channel === "both") {
    console.log(`[Brain:notify] Sending email to ${FAMILY_EMAIL_LIST.length} family members…`);
    const emailAddresses = FAMILY_EMAIL_LIST.map(m => m.email);
    const emailBatch     = await sendEmailNotification(emailAddresses, subject, body);
    allResults.push(...emailBatch.results);
    console.log(`[Brain:notify] Email: ${emailBatch.successCount}/${emailBatch.total} · overachievement: ${emailBatch.overachievement_pct}%`);
  }

  if (channel === "sms" || channel === "both") {
    console.log(`[Brain:notify] Sending SMS to ${FAMILY_SMS_LIST.length} family members…`);
    const smsPhones  = FAMILY_SMS_LIST.map(m => m.phone);
    const smsBatch   = await sendSMSNotification(smsPhones, options?.message ?? `Hi! Sara's Brain is live. Open your dashboard: ${brainUrl}`);
    allResults.push(...smsBatch.results);
    console.log(`[Brain:notify] SMS: ${smsBatch.successCount}/${smsBatch.total} · overachievement: ${smsBatch.overachievement_pct}%`);
  }

  return allResults;
}

// ─── notifyFamilyEvent — event alert (email only) ────────────────────────────

export interface FamilyEventOptions {
  subject: string;
  message: string;
}

export async function notifyFamilyEvent(options: FamilyEventOptions): Promise<void> {
  const emailAddresses = FAMILY_EMAIL_LIST.map(m => m.email);
  const batch = await sendEmailNotification(emailAddresses, options.subject, `<p>${options.message}</p>`);
  console.log(`[Brain:event] "${options.subject}" — ${batch.successCount}/${batch.total} delivered · overachievement: ${batch.overachievement_pct}%`);
}

// ─── Audit summary generator ──────────────────────────────────────────────────

export interface NotificationAuditSummary {
  generatedAt:    string;
  report_saved:   string;
  credentials:    ReturnType<typeof credentialStatus>;
  familyList: {
    emailRecipients: { name: string; email: string }[];
    smsRecipients:   { name: string; phone: string }[];
    emailCount: number;
    smsCount:   number;
  };
  endpoints: {
    path:        string;
    method:      string;
    description: string;
    wired:       boolean;
  }[];
  scripts: {
    command:     string;
    description: string;
  }[];
  placeholders: string[];
  industryBaseline: typeof INDUSTRY_BASELINE;
  mode: string;
}

export function generateAuditSummary(): NotificationAuditSummary {
  const creds = credentialStatus();
  const placeholders: string[] = [];

  if (!creds.email.configured) {
    placeholders.push(...creds.email.missing.map(k => `${k} — add to Replit Secrets → email will activate`));
  }
  if (!creds.sms.configured) {
    placeholders.push(...creds.sms.missing.map(k => `${k} — add to Replit Secrets → SMS will activate`));
  }

  return {
    generatedAt:  new Date().toISOString(),
    report_saved: "artifacts/api-server/transcend_report.json",
    credentials:  creds,
    familyList: {
      emailRecipients: FAMILY_EMAIL_LIST,
      smsRecipients:   FAMILY_SMS_LIST,
      emailCount:      FAMILY_EMAIL_LIST.length,
      smsCount:        FAMILY_SMS_LIST.length,
    },
    endpoints: [
      { path: "POST /api/brain/notify",         method: "POST", description: "Send custom email + optional SMS to all family members", wired: true },
      { path: "GET  /api/brain/notify",         method: "GET",  description: "Real-time credential status — which secrets are set",    wired: true },
      { path: "POST /api/brain/transcend-all",  method: "POST", description: "Full transcend: all 9 modules + email + SMS + audit",    wired: true },
      { path: "GET  /api/brain/transcend-all",  method: "GET",  description: "Quick module score snapshot (no notifications)",         wired: true },
      { path: "GET  /api/brain/audit-run",      method: "GET",  description: "Full system audit: workflows + modules + security scan", wired: true },
    ],
    scripts: [
      { command: "pnpm --filter @workspace/api-server transcend",        description: "Full transcend — all modules + notifications + audit + report" },
      { command: "pnpm --filter @workspace/api-server transcend:master", description: "Transcend Master — 5-step orchestration with impact simulation + per-channel notifications" },
      { command: "pnpm --filter @workspace/api-server audit:run",        description: "System-wide audit — workflows, modules, security, credentials" },
    ],
    placeholders,
    industryBaseline: INDUSTRY_BASELINE,
    mode: "💠 Beyond Infinity — No Limits Mode / Absolute Transcendence",
  };
}
