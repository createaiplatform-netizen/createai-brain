// ─── Universal Outbound Engine ────────────────────────────────────────────────
// Central dispatcher for all platform-generated outbound communications.
// Every email, in-app message, and notification sent by the platform flows
// through here — never directly through Resend/messaging/notifications calls.
//
// Channels (implemented):
//   • email       — Resend transactional email using platform identity
//   • in-app      — platform_family_messages / platform_notifications
//   • notification — platform_notifications table
//   • export      — stub; future PDF/file attachment delivery
//
// Expansion rules:
//   • Add a new channel by adding a case to dispatchChannel() below
//   • Add a new type by adding a value to OutboundType — no other change needed
//   • All sends are logged to platform_outbound_log (idempotency optional)
//
// Rules:
//   • NEVER throws to the caller — all errors are caught and logged
//   • All sends are fire-and-return-status (no awaiting external confirmations)
//   • Uses platformIdentity for sender address — never a personal identity

import crypto from "crypto";
import { Resend } from "resend";
import { getSql } from "../lib/db";
import { getSenderAddress, PLATFORM, SYSTEM_SENDER_ID, SYSTEM_DISPLAY_NAME } from "./platformIdentity";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OutboundChannel = "email" | "in-app" | "notification" | "export";

export type OutboundType =
  | "welcome"
  | "receipt"
  | "bill_reminder"
  | "invoice"
  | "announcement"
  | "product_update"
  | "support_confirmation"
  | "safety_alert"
  | "admin_action"
  | "export_ready"
  | "test"
  | string; // extensible — new types work without schema change

export interface OutboundPayload {
  /** Semantic message type (for logging + filtering). */
  type:      OutboundType;
  /** Delivery channel. */
  channel:   OutboundChannel;
  /** Recipient — email address for email channel, userId for in-app/notification. */
  to:        string;
  /** Platform user ID of the recipient (nullable for anonymous/external sends). */
  userId?:   string;
  /** Role of the recipient — used for universe-appropriate messaging. */
  role?:     string;
  /** Universe the message originates from. */
  universe?: string;
  /** Email subject line (required for email channel). */
  subject?:  string;
  /** Message body — HTML for email, plain text for in-app/notification. */
  body:      string;
  /** Optional key-value metadata stored in the log (e.g., billId, amount). */
  metadata?: Record<string, unknown>;
  /** Attachment stubs — future PDF/file delivery. */
  attachments?: { filename: string; url: string }[];
}

export interface OutboundResult {
  success:   boolean;
  channel:   OutboundChannel;
  type:      OutboundType;
  logId:     string;
  error?:    string;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

class OutboundEngine {

  /** Send a platform message through the specified channel. Always resolves. */
  async send(payload: OutboundPayload): Promise<OutboundResult> {
    const logId = "out_" + crypto.randomUUID().replace(/-/g, "").slice(0, 20);
    let success = false;
    let errorMsg: string | undefined;

    try {
      // 1. Dispatch to channel
      const channelResult = await this.dispatchChannel(payload);
      success  = channelResult.success;
      errorMsg = channelResult.error;
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[OutboundEngine] Unhandled error — type:${payload.type} channel:${payload.channel}`, errorMsg);
    }

    // 2. Log the attempt (non-blocking, non-throwing)
    void this.writeLog({
      logId,
      payload,
      success,
      errorMsg,
    });

    const result: OutboundResult = {
      success,
      channel:  payload.channel,
      type:     payload.type,
      logId,
      error:    errorMsg,
    };

    if (!success) {
      console.warn(`[OutboundEngine] ⚠ send failed — type:${payload.type} channel:${payload.channel} to:${payload.to} — ${errorMsg}`);
    } else {
      console.log(`[OutboundEngine] ✅ sent — type:${payload.type} channel:${payload.channel} to:${payload.to}`);
    }

    return result;
  }

  // ── Channel dispatcher ──────────────────────────────────────────────────────

  private async dispatchChannel(
    payload: OutboundPayload,
  ): Promise<{ success: boolean; error?: string }> {
    switch (payload.channel) {
      case "email":        return this.sendEmail(payload);
      case "in-app":       return this.sendInApp(payload);
      case "notification": return this.sendNotification(payload);
      case "export":       return this.sendExport(payload);
      default:
        return { success: false, error: `Unknown channel: ${payload.channel as string}` };
    }
  }

  // ── Email (Resend) ──────────────────────────────────────────────────────────

  private async sendEmail(
    payload: OutboundPayload,
  ): Promise<{ success: boolean; error?: string }> {
    const key = process.env["RESEND_API_KEY"] ?? "";
    if (!key.startsWith("re_")) {
      return { success: false, error: "RESEND_API_KEY not configured" };
    }
    if (!payload.to.includes("@")) {
      return { success: false, error: "Email channel requires a valid email address in 'to'" };
    }

    const resend = new Resend(key);
    const from   = getSenderAddress();

    const { error } = await resend.emails.send({
      from:    `${PLATFORM.senderName} <${from}>`,
      to:      [payload.to],
      subject: payload.subject ?? `Message from ${PLATFORM.displayName}`,
      html:    payload.body,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // ── In-app (family_messages / notifications) ────────────────────────────────

  private async sendInApp(
    payload: OutboundPayload,
  ): Promise<{ success: boolean; error?: string }> {
    const targetUserId = payload.userId ?? payload.to;
    if (!targetUserId) {
      return { success: false, error: "In-app channel requires userId or to=userId" };
    }

    const sql = getSql();

    // Determine which in-app surface to use based on role/universe
    const familyRoles = ["family_adult", "family_child"];
    const useMessaging = familyRoles.includes(payload.role ?? "");

    if (useMessaging) {
      // Create a conversation with SYSTEM sender and write the message
      const convId = "conv_" + crypto.randomUUID().replace(/-/g, "").slice(0, 20);
      const msgId  = "msg_"  + crypto.randomUUID().replace(/-/g, "").slice(0, 20);

      await sql`
        INSERT INTO platform_family_conversations
          (id, name, type, participant_ids, created_by)
        VALUES
          (${convId}, ${SYSTEM_DISPLAY_NAME}, ${"direct"},
           ${[targetUserId, SYSTEM_SENDER_ID]}, ${SYSTEM_SENDER_ID})
        ON CONFLICT DO NOTHING
      `;
      await sql`
        INSERT INTO platform_family_messages
          (id, conversation_id, sender_id, content, read_by)
        VALUES
          (${msgId}, ${convId}, ${SYSTEM_SENDER_ID}, ${payload.body}, ${[SYSTEM_SENDER_ID]})
        ON CONFLICT DO NOTHING
      `;
    } else {
      // General notification
      await sql`
        INSERT INTO platform_notifications
          (user_id, type, title, message, metadata)
        VALUES
          (${targetUserId}, ${payload.type}, ${payload.subject ?? PLATFORM.displayName},
           ${payload.body}, ${JSON.stringify(payload.metadata ?? {})})
      `;
    }

    return { success: true };
  }

  // ── Platform notification ───────────────────────────────────────────────────

  private async sendNotification(
    payload: OutboundPayload,
  ): Promise<{ success: boolean; error?: string }> {
    const targetUserId = payload.userId ?? payload.to;
    if (!targetUserId) {
      return { success: false, error: "Notification channel requires userId or to=userId" };
    }

    const sql = getSql();
    await sql`
      INSERT INTO platform_notifications
        (user_id, type, title, message, metadata)
      VALUES
        (${targetUserId}, ${payload.type}, ${payload.subject ?? PLATFORM.displayName},
         ${payload.body}, ${JSON.stringify(payload.metadata ?? {})})
    `;

    return { success: true };
  }

  // ── Export / file delivery (stub) ───────────────────────────────────────────

  private async sendExport(
    payload: OutboundPayload,
  ): Promise<{ success: boolean; error?: string }> {
    // Stub: log the intent; implement PDF attachment delivery here when ready
    console.log(`[OutboundEngine] Export channel stub — type:${payload.type} to:${payload.to}`);
    return { success: true, error: "Export channel not yet implemented — logged only" };
  }

  // ── Audit log write ─────────────────────────────────────────────────────────

  private async writeLog(params: {
    logId:    string;
    payload:  OutboundPayload;
    success:  boolean;
    errorMsg: string | undefined;
  }): Promise<void> {
    const { logId, payload, success, errorMsg } = params;
    try {
      const sql = getSql();
      await sql`
        INSERT INTO platform_outbound_log
          (id, user_id, role, universe, type, channel, status,
           subject, recipient, metadata, error_message)
        VALUES
          (${logId},
           ${payload.userId ?? null},
           ${payload.role   ?? null},
           ${payload.universe ?? null},
           ${payload.type},
           ${payload.channel},
           ${success ? "sent" : "failed"},
           ${payload.subject ?? null},
           ${payload.to},
           ${JSON.stringify(payload.metadata ?? {})},
           ${errorMsg ?? null})
      `;
    } catch (err) {
      console.warn("[OutboundEngine] Log write failed:", err instanceof Error ? err.message : String(err));
    }
  }
}

// Singleton export
export const outboundEngine = new OutboundEngine();
