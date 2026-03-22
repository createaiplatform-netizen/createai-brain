// ─── Welcome Engine ───────────────────────────────────────────────────────────
// Fires automatically on first login for every user.
// Routes all outbound through the Universal Outbound Engine.
//
// Rules:
//   • Only fires ONCE per user (idempotent — tracked in platform_welcome_log)
//   • Never sends external SMS or iMessage — platform channels only
//   • Each role gets a tailored message (admin, family_adult, family_child, customer, default)
//   • Fires asynchronously — never blocks auth redirect
//   • Fails silently with a log entry — never crashes the auth flow

import { getSql } from "../lib/db";
import { outboundEngine } from "./outboundEngine";
import { brandHtmlWrapper } from "./marketingKit";

// ─── Role-keyed templates ─────────────────────────────────────────────────────

type WelcomeRole = "admin" | "founder" | "family_adult" | "family_child" | "customer" | "default";

interface WelcomeTemplate {
  emailSubject: string;
  emailHtml:    string;
  inAppMessage: string;
}

const SAGE = "#7a9068";
const TEXT = "#1a1916";

function getTemplate(role: string, firstName?: string | null): WelcomeTemplate {
  const name    = firstName?.trim() || "there";
  const appRole = (
    role === "founder"      ? "founder"      :
    role === "admin"        ? "admin"        :
    role === "family_child" ? "family_child" :
    role === "family_adult" ? "family_adult" :
    role === "customer"     ? "customer"     : "default"
  ) as WelcomeRole;

  const bodyHtml = (heading: string, paragraphs: string[]): string =>
    brandHtmlWrapper(`
      <p style="font-size:22px;font-weight:900;margin:0 0 12px;color:${TEXT};">${heading}</p>
      ${paragraphs.map(p => `<p style="margin:0 0 10px;color:#4b4742;">${p}</p>`).join("")}
    `, { preheader: heading });

  const TEMPLATES: Record<WelcomeRole, WelcomeTemplate> = {
    founder: {
      emailSubject: "Admin access granted — CreateAI Brain",
      emailHtml: bodyHtml("Welcome back, Founder.", [
        "Your admin controls, tools, audit logs, and full platform access are active.",
        "Everything is ready. Log in with your trusted device to begin.",
      ]),
      inAppMessage: "Admin access granted.\nYour tools, logs, and controls are active and waiting for you.",
    },
    admin: {
      emailSubject: "Admin access granted — CreateAI Brain",
      emailHtml: bodyHtml("Welcome, Admin.", [
        "Your admin controls, tools, audit logs, and full platform access are active.",
        "Log in with your trusted device to begin.",
      ]),
      inAppMessage: "Admin access granted.\nYour tools, logs, and controls are active and waiting for you.",
    },
    family_adult: {
      emailSubject: "Welcome to Our Family Universe",
      emailHtml: bodyHtml(`Welcome to Our Family Universe, ${name}.`, [
        "Your account is ready. Your universe is now live.",
        "This space is warm, safe, private, and built for our family.",
        "Your identity, routines, messages, and tools are waiting for you.",
        "Log in with your trusted device to begin.",
      ]),
      inAppMessage: `Welcome to your Family Universe, ${name}.\nThis is your safe space for routines, creations, messages, and family life.\nEverything here is private, warm, and built just for us.`,
    },
    family_child: {
      emailSubject: "Your space is ready! 🌟",
      emailHtml: bodyHtml(`Hi ${name}! Your space is ready.`, [
        "Welcome! This is your space to create, explore, and check in.",
        "Everything here is safe, simple, and made just for you.",
        "Ask a parent to help you log in for the first time.",
      ]),
      inAppMessage: `Welcome! This is your space to create, explore, and check in.\nEverything here is safe, simple, and made just for you. 🌱`,
    },
    customer: {
      emailSubject: "Welcome to your Customer Dashboard",
      emailHtml: bodyHtml(`Welcome, ${name}.`, [
        "Your Customer Dashboard is ready.",
        "Your bills, account summary, and tools are all set up and waiting for you.",
        "Log in with your trusted device to get started.",
      ]),
      inAppMessage: "Welcome to your Customer Dashboard.\nYour bills, summaries, and account tools are ready.",
    },
    default: {
      emailSubject: "Welcome to CreateAI Brain",
      emailHtml: bodyHtml(`Welcome, ${name}.`, [
        "Your account is ready.",
        "Your universe is live. Log in with your trusted device to begin.",
      ]),
      inAppMessage: "Welcome to CreateAI Brain.\nYour account is ready and your space is waiting for you.",
    },
  };

  return TEMPLATES[appRole];
}

// ─── Core function ─────────────────────────────────────────────────────────────

interface WelcomeUser {
  id:         string;
  email?:     string | null;
  firstName?: string | null;
}

/**
 * Fire-and-forget welcome on first login.
 * Call this AFTER upsertUser() in the auth callback — never await it.
 * Routes all outbound through outboundEngine (logged in platform_outbound_log).
 */
export async function sendWelcomeIfFirstLogin(user: WelcomeUser): Promise<void> {
  const { id, email, firstName } = user;

  try {
    const sql = getSql();

    // Idempotency check — bail if welcome already sent
    const [existing] = await sql`SELECT id FROM platform_welcome_log WHERE user_id = ${id}`;
    if (existing) return;

    // Look up role from DB — welcome is role-sensitive
    const [userRow] = await sql`SELECT role FROM users WHERE id = ${id}`;
    const role = (userRow?.role as string | null) ?? "user";

    // Mark as in-progress immediately to prevent race conditions
    await sql`
      INSERT INTO platform_welcome_log (user_id, role_at_time, email_sent, message_sent)
      VALUES (${id}, ${role}, FALSE, FALSE)
      ON CONFLICT (user_id) DO NOTHING
    `;

    const tmpl = getTemplate(role, firstName);
    let emailSent   = false;
    let messageSent = false;

    // ── Channel 1: Platform email via outboundEngine ──────────────────────────
    if (email?.includes("@")) {
      const result = await outboundEngine.send({
        type:     "welcome",
        channel:  "email",
        to:       email,
        userId:   id,
        role,
        universe: role.startsWith("family") || role === "customer" ? role : "admin",
        subject:  tmpl.emailSubject,
        body:     tmpl.emailHtml,
        metadata: { firstName, triggeredBy: "first_login" },
      });
      emailSent = result.success;
    }

    // ── Channel 2: In-app message via outboundEngine ──────────────────────────
    const inAppResult = await outboundEngine.send({
      type:     "welcome",
      channel:  "in-app",
      to:       id,
      userId:   id,
      role,
      universe: role.startsWith("family") ? "family" : role === "customer" ? "customer" : "admin",
      subject:  `Welcome to CreateAI Brain`,
      body:     tmpl.inAppMessage,
      metadata: { firstName, triggeredBy: "first_login" },
    });
    messageSent = inAppResult.success;

    // ── Update log with actual results ────────────────────────────────────────
    await sql`
      UPDATE platform_welcome_log
      SET email_sent = ${emailSent}, message_sent = ${messageSent}
      WHERE user_id = ${id}
    `;

    console.log(`[Welcome] ✅ First login complete — user:${id} role:${role} email:${emailSent} message:${messageSent}`);
  } catch (err) {
    console.error(`[Welcome] Failed for user ${id}:`, (err as Error).message);
  }
}
