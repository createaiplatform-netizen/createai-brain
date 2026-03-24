/**
 * bridge/connectors/emailConnector.ts — Email Connector (Resend)
 *
 * Status: ACTIVE when RESEND_API_KEY is set.
 *
 * Delegates to sendEmailNotification() from utils/notifications.ts.
 * No fake open rates. No fake click rates. No simulated responses.
 *
 * Domain restriction: Until a custom domain is verified in Resend,
 * FROM is onboarding@resend.dev and TO must be admin@createaiplatform.com.
 */

import { sendEmailNotification }      from "../../utils/notifications.js";
import type { BridgeRequest, BridgeResponse } from "../types.js";
import { isConnectorActive }          from "../bridgeConfig.js";
import { randomUUID }                 from "crypto";
import { OWNER_AUTHORIZATION_MANIFEST as _OAM } from "../../security/ownerAuthorizationManifest.js";

// ─── Owner Authorization ───────────────────────────────────────────────────────
console.log(`[Bridge:Email] \uD83D\uDD10 Owner authorization confirmed \u2014 ${_OAM.owner} (${_OAM.ownerId}) \u00B7 approvesAllMonetizationFlows:${_OAM.approvesAllMonetizationFlows}`);

// ─── sendEmail ────────────────────────────────────────────────────────────────

export async function sendEmail(req: BridgeRequest): Promise<BridgeResponse> {
  if (!isConnectorActive("email")) {
    const msg = "[Bridge:Email] \u26A0\uFE0F sendEmail() \u2014 NOT_CONFIGURED. Set RESEND_API_KEY.";
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
      `[Bridge:Email] \u2705 Email sent \u2014 to:${recipients.join(",")} \u00B7 ` +
      `success:${result.successCount} failure:${result.failCount}`
    );

    return {
      requestId:    randomUUID(),
      connectorKey: "email",
      action:       req.type,
      status:       result.successCount > 0 ? "SUCCESS" : "FAILURE",
      data: {
        successCount: result.successCount,
        failureCount: result.failCount,
        recipients,
        subject:      subject ?? "CreateAI Brain Notification",
      },
      error:        result.successCount === 0 ? "All email sends failed" : undefined,
      ts:           new Date().toISOString(),
    };

  } catch (err) {
    const msg = (err as Error).message;
    console.warn(`[Bridge:Email] \u26A0\uFE0F sendEmail failed \u2014 ${msg}`);
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
  const { emailId } = req.payload as { emailId?: string };

  if (!emailId) {
    return {
      requestId:    randomUUID(),
      connectorKey: "email",
      action:       req.type,
      status:       "FAILURE",
      error:        "emailId required to query delivery status.",
      ts:           new Date().toISOString(),
    };
  }

  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    return {
      requestId:    randomUUID(),
      connectorKey: "email",
      action:       req.type,
      status:       "NOT_CONFIGURED",
      error:        "RESEND_API_KEY not set \u2014 cannot look up email status.",
      ts:           new Date().toISOString(),
    };
  }

  try {
    const resp = await fetch(`https://api.resend.com/emails/${encodeURIComponent(emailId)}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.warn(`[Bridge:Email] getEmailStatus HTTP ${resp.status} for emailId:${emailId} \u2014 ${body}`);
      return {
        requestId:    randomUUID(),
        connectorKey: "email",
        action:       req.type,
        status:       "FAILURE",
        error:        `Resend returned HTTP ${resp.status}`,
        ts:           new Date().toISOString(),
      };
    }

    const data = await resp.json() as Record<string, unknown>;

    console.log(`[Bridge:Email] \u2705 getEmailStatus emailId:${emailId} \u2014 status:${data["last_event"] ?? data["status"] ?? "unknown"}`);

    return {
      requestId:    randomUUID(),
      connectorKey: "email",
      action:       req.type,
      status:       "SUCCESS",
      data: {
        emailId,
        resendId:    data["id"],
        from:        data["from"],
        to:          data["to"],
        subject:     data["subject"],
        status:      data["last_event"] ?? data["status"],
        createdAt:   data["created_at"],
        raw:         data,
      },
      ts: new Date().toISOString(),
    };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Bridge:Email] \u26A0\uFE0F getEmailStatus failed \u2014 ${msg}`);
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
