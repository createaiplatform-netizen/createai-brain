// ─── Welcome Engine ───────────────────────────────────────────────────────────
// Fires automatically on first login for every user.
// Sends a warm, role-appropriate welcome via:
//   1. Platform email (Resend) — if user has an email address
//   2. Platform in-app message — delivered to their universe inbox
//
// Rules:
//   • Only fires ONCE per user (idempotent — tracked in platform_welcome_log)
//   • Never sends external SMS or iMessage — platform channels only
//   • Each role gets a tailored message (admin, family_adult, family_child, customer, default)
//   • Fires asynchronously — never blocks auth redirect
//   • Fails silently with a log entry — never crashes the auth flow

import { Resend } from "resend";
import { getSql } from "../lib/db";

// ─── Role-keyed templates ─────────────────────────────────────────────────────

type WelcomeRole =
  | "admin"
  | "founder"
  | "family_adult"
  | "family_child"
  | "customer"
  | "default";

interface WelcomeTemplate {
  emailSubject: string;
  emailHtml:    string;
  inAppMessage: string;
}

function getTemplate(role: string, firstName?: string | null): WelcomeTemplate {
  const name    = firstName?.trim() || "there";
  const appRole = (
    role === "admin" || role === "founder"
      ? "admin"
      : role === "family_child"
      ? "family_child"
      : role === "customer"
      ? "customer"
      : role === "family_adult"
      ? "family_adult"
      : "default"
  ) as WelcomeRole;

  const SAGE    = "#7a9068";
  const CREAM   = "#faf9f6";
  const TEXT    = "#1a1916";

  const baseHtml = (heading: string, body: string) => `
    <div style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:580px;margin:auto;
                background:${CREAM};border-radius:20px;padding:40px 36px;">
      <div style="display:inline-block;background:${SAGE}18;border-radius:14px;
                  padding:10px 16px;margin-bottom:24px;">
        <span style="color:${SAGE};font-size:13px;font-weight:700;letter-spacing:0.5px;">CreateAI Brain</span>
      </div>
      <h1 style="color:${TEXT};font-size:24px;font-weight:900;margin:0 0 12px;">${heading}</h1>
      <div style="color:#4b4742;font-size:15px;line-height:1.7;">${body}</div>
      <hr style="border:none;border-top:1px solid ${SAGE}20;margin:28px 0;" />
      <p style="font-size:12px;color:#9b9690;margin:0;">
        This message was sent by CreateAI Brain · Your private platform ·
        No reply needed · Manage your account at your universe
      </p>
    </div>
  `;

  const TEMPLATES: Record<WelcomeRole, WelcomeTemplate> = {
    founder: {
      emailSubject: "Admin access granted — CreateAI Brain",
      emailHtml: baseHtml(
        "Welcome back, Founder.",
        `<p>Your admin controls, tools, audit logs, and full platform access are active.</p>
         <p>Everything is ready. Log in with your trusted device to begin.</p>`,
      ),
      inAppMessage:
        "Admin access granted.\nYour tools, logs, and controls are active and waiting for you.",
    },
    admin: {
      emailSubject: "Admin access granted — CreateAI Brain",
      emailHtml: baseHtml(
        "Welcome, Admin.",
        `<p>Your admin controls, tools, audit logs, and full platform access are active.</p>
         <p>Log in with your trusted device to begin.</p>`,
      ),
      inAppMessage:
        "Admin access granted.\nYour tools, logs, and controls are active and waiting for you.",
    },
    family_adult: {
      emailSubject: "Welcome to Our Family Universe",
      emailHtml: baseHtml(
        `Welcome to Our Family Universe, ${name}.`,
        `<p>Your account is ready. Your universe is now live.</p>
         <p>This space is warm, safe, private, and built for our family.</p>
         <p>Your identity, routines, messages, and tools are waiting for you.</p>
         <p>Log in with your trusted device to begin.</p>`,
      ),
      inAppMessage:
        `Welcome to your Family Universe, ${name}.\nThis is your safe space for routines, creations, messages, and family life.\nEverything here is private, warm, and built just for us.`,
    },
    family_child: {
      emailSubject: "Your space is ready! 🌟",
      emailHtml: baseHtml(
        `Hi ${name}! Your space is ready.`,
        `<p>Welcome! This is your space to create, explore, and check in.</p>
         <p>Everything here is safe, simple, and made just for you.</p>
         <p>Ask a parent to help you log in for the first time.</p>`,
      ),
      inAppMessage:
        `Welcome! This is your space to create, explore, and check in.\nEverything here is safe, simple, and made just for you. 🌱`,
    },
    customer: {
      emailSubject: "Welcome to your Customer Dashboard",
      emailHtml: baseHtml(
        `Welcome, ${name}.`,
        `<p>Your Customer Dashboard is ready.</p>
         <p>Your bills, account summary, and tools are all set up and waiting for you.</p>
         <p>Log in with your trusted device to get started.</p>`,
      ),
      inAppMessage:
        "Welcome to your Customer Dashboard.\nYour bills, summaries, and account tools are ready.",
    },
    default: {
      emailSubject: "Welcome to CreateAI Brain",
      emailHtml: baseHtml(
        `Welcome, ${name}.`,
        `<p>Your account is ready.</p>
         <p>Your universe is live. Log in with your trusted device to begin.</p>`,
      ),
      inAppMessage:
        "Welcome to CreateAI Brain.\nYour account is ready and your space is waiting for you.",
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
 * The engine looks up the user's role internally.
 */
export async function sendWelcomeIfFirstLogin(user: WelcomeUser): Promise<void> {
  const { id, email, firstName } = user;

  try {
    const sql = getSql();

    // Idempotency check — bail if welcome already sent
    const [existing] = await sql`
      SELECT id FROM platform_welcome_log WHERE user_id = ${id}
    `;
    if (existing) return;

    // Look up role from DB — welcome is role-sensitive
    const [userRow] = await sql`SELECT role FROM users WHERE id = ${id}`;
    const role = (userRow?.role as string | null) ?? "user";

    // Mark welcome as in-progress immediately to prevent race conditions
    await sql`
      INSERT INTO platform_welcome_log (user_id, role_at_time, email_sent, message_sent)
      VALUES (${id}, ${role}, FALSE, FALSE)
      ON CONFLICT (user_id) DO NOTHING
    `;

    const tmpl = getTemplate(role, firstName);
    let emailSent   = false;
    let messageSent = false;

    // ── Channel 1: Platform email via Resend — sage-branded, no purple ───────
    if (email?.includes("@")) {
      try {
        const resendKey = process.env["RESEND_API_KEY"] ?? "";
        if (resendKey.startsWith("re_")) {
          const resend = new Resend(resendKey);
          const from   = process.env["RESEND_FROM_EMAIL"] ?? "onboarding@resend.dev";
          const { error } = await resend.emails.send({
            from,
            to:      [email],
            subject: tmpl.emailSubject,
            html:    tmpl.emailHtml,
          });
          emailSent = !error;
          if (error) {
            console.warn(`[Welcome] Resend error → ${email}:`, error.message);
          } else {
            console.log(`[Welcome] Email → ${email} (${role}) — ✅ sent`);
          }
        } else {
          console.warn("[Welcome] RESEND_API_KEY not configured — email skipped");
        }
      } catch (err) {
        console.warn(`[Welcome] Email to ${email} failed:`, (err as Error).message);
      }
    }

    // ── Channel 2: In-app platform message ───────────────────────────────────
    // Creates a private "Welcome" conversation with a system message.
    // The user will see this in their messages/inbox tab.
    try {
      const systemSenderId = "system";
      const convoName      = "Welcome";

      // Find or create the system welcome conversation for this user
      const [existingConvo] = await sql`
        SELECT id FROM platform_family_conversations
        WHERE created_by = ${systemSenderId}
          AND name = ${convoName}
          AND ${id} = ANY(participant_ids)
        LIMIT 1
      `;

      let convoId: string;
      if (existingConvo) {
        convoId = existingConvo.id as string;
      } else {
        const [newConvo] = await sql`
          INSERT INTO platform_family_conversations
            (name, type, participant_ids, created_by)
          VALUES
            (${convoName}, 'system', ${[id]}, ${systemSenderId})
          RETURNING id
        `;
        convoId = (newConvo as { id: string }).id;
      }

      // Insert welcome message (read_by empty — user hasn't read it yet)
      await sql`
        INSERT INTO platform_family_messages
          (conversation_id, sender_id, content, read_by)
        VALUES
          (${convoId}, ${systemSenderId}, ${tmpl.inAppMessage}, ${[]})
      `;

      // Bump conversation updated_at
      await sql`
        UPDATE platform_family_conversations
        SET updated_at = NOW()
        WHERE id = ${convoId}
      `;

      messageSent = true;
      console.log(`[Welcome] In-app message → user ${id} (${role}) — ✅ delivered`);
    } catch (err) {
      console.warn(`[Welcome] In-app message for user ${id} failed:`, (err as Error).message);
    }

    // ── Update log with actual send results ──────────────────────────────────
    await sql`
      UPDATE platform_welcome_log
      SET email_sent = ${emailSent}, message_sent = ${messageSent}
      WHERE user_id = ${id}
    `;

    console.log(`[Welcome] ✅ First login welcome complete — user:${id} role:${role} email:${emailSent} message:${messageSent}`);
  } catch (err) {
    // Never crash the auth flow — welcome is always best-effort
    console.error(`[Welcome] Failed for user ${id}:`, (err as Error).message);
  }
}
