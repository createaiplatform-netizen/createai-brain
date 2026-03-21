/**
 * bridge/connectors/emailConnector.ts — Email Connector (Resend)
 *
 * Status: ACTIVE when RESEND_API_KEY is set.
 *
 * Delegates to sendEmailNotification() from utils/notifications.ts.
 * No fake open rates. No fake click rates. No simulated responses.
 *
 * Domain restriction: Until a custom domain is verified in Resend,
 * FROM is onboarding@resend.dev and TO must be sivh@mail.com.
 */

import { sendEmailNotification }      from "../../utils/notifications.js";
import type { BridgeRequest, BridgeResponse } from "../types.js";
import { isConnectorActive }          from "../bridgeConfig.js";
import { randomUUID }                 from "crypto";
import { OWNER_AUTHORIZATION_MANIFEST as _OAM } from "../../security/ownerAuthorizationManifest.js";

// ─── Owner Authorization ───────────────────────────────────────────────────────
console.log(`[Bridge:Email] 🔐 Owner authorization confirmed — ${_OAM.owner} (${_OAM.ownerId}) · approvesAllMonetizationFlows:${_OAM.approvesAllMonetizationFlows}`);

// ─── sendEmail ────────────────────────────────────────────────────────────────

export async function sendEmail(req: BridgeRequest): Promise<BridgeResponse> {
  if (!isConnectorActive("email")) {
    const msg = "[Bridge:Email] ⚠️ sendEmail() — NOT_CONFIGURED. Set RESEND_API_KEY.";
    console.log(msg);
    return {
      requestId:    randomUUID(),
      connectorKey: "email",
      action:       req.type,
      status:       "NOT_CONFIGURED",
      error:        "Email connector not configured. Set RESEND_API_KEY.",
      ts:           new Date().toISOString(),
    };
  }

  const { to, subject, content } = req.payload as {
    to:      string | string[];
    subject?: string;
    content: string;
  };

  const recipients = Array.isArray(to) ? to : [to];

  try {
    const result = await sendEmailNotification(
      recipients,
      subject ?? "CreateAI Brain Notification",
      content,
    );

    console.log(
      `[Bridge:Email] ✅ Email sent — to:${recipients.join(",")} · ` +
      `success:${result.successCount} failure:${result.failureCount}`
    );

    return {
      requestId:    randomUUID(),
      connectorKey: "email",
      action:       req.type,
      status:       result.successCount > 0 ? "SUCCESS" : "FAILURE",
      data: {
        successCount: result.successCount,
        failureCount: result.failureCount,
        recipients,
        subject:      subject ?? "CreateAI Brain Notification",
      },
      error:        result.successCount === 0 ? "All email sends failed" : undefined,
      ts:           new Date().toISOString(),
    };

  } catch (err) {
    const msg = (err as Error).message;
    console.warn(`[Bridge:Email] ⚠️ sendEmail failed — ${msg}`);
    return {
      requestId:    randomUUID(),
      connectorKey: "email",
      action:       req.type,
      status:       "FAILURE",
      error:        msg,
      ts:           new Date().toISOString(),
    };
  }
}

// ─── getEmailStatus ───────────────────────────────────────────────────────────

export async function getEmailStatus(req: BridgeRequest): Promise<BridgeResponse> {
  // Resend provides a GET /emails/{id} endpoint for status lookup.
  // Requires tracking the email ID returned from the send call.
  const { emailId } = req.payload as { emailId?: string };

  if (!emailId) {
    return {
      requestId:    randomUUID(),
      connectorKey: "email",
      action:       req.type,
      status:       "NOT_CONFIGURED",
      error:        "emailId required to query delivery status.",
      ts:           new Date().toISOString(),
    };
  }

  // TODO: implement Resend email status lookup
  // const response = await fetch(`https://api.resend.com/emails/${emailId}`, {
  //   headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }
  // });
  return {
    requestId:    randomUUID(),
    connectorKey: "email",
    action:       req.type,
    status:       "NOT_CONFIGURED",
    error:        "getEmailStatus not yet implemented — email ID tracking required.",
    ts:           new Date().toISOString(),
  };
}
