/**
 * bridge/connectors/smsConnector.ts — SMS Connector (Twilio)
 *
 * Status: ACTIVE when TWILIO_AUTH_TOKEN + TWILIO_SID are set.
 *
 * Delegates to sendSMSNotification() from utils/notifications.ts.
 * No fake delivery statuses. No simulated responses.
 */

import { sendSMSNotification }        from "../../utils/notifications.js";
import type { BridgeRequest, BridgeResponse } from "../types.js";
import { isConnectorActive }          from "../bridgeConfig.js";
import { randomUUID }                 from "crypto";
import { OWNER_AUTHORIZATION_MANIFEST as _OAM } from "../../security/ownerAuthorizationManifest.js";

// ─── Owner Authorization ───────────────────────────────────────────────────────
console.log(`[Bridge:SMS] \uD83D\uDD10 Owner authorization confirmed \u2014 ${_OAM.owner} (${_OAM.ownerId}) \u00B7 approvesAllAutomationFlows:${_OAM.approvesAllAutomationFlows}`);

// ─── sendSMS ─────────────────────────────────────────────────────────────────

export async function sendSMS(req: BridgeRequest): Promise<BridgeResponse> {
  if (!isConnectorActive("sms")) {
    const msg = "[Bridge:SMS] \u26A0\uFE0F sendSMS() \u2014 NOT_CONFIGURED. Set TWILIO_AUTH_TOKEN + TWILIO_SID.";
    console.log(msg);
    return {
      requestId:    randomUUID(),
      connectorKey: "sms",
      action:       req.type,
      status:       "NOT_CONFIGURED",
      error:        "SMS connector not configured. Set TWILIO_AUTH_TOKEN + TWILIO_SID.",
      ts:           new Date().toISOString(),
    };
  }

  const { to, content } = req.payload as { to: string | string[]; content: string };
  const recipients = Array.isArray(to) ? to : [to];

  try {
    const result = await sendSMSNotification(recipients, content);

    console.log(
      `[Bridge:SMS] \u2705 SMS sent \u2014 to:${recipients.join(",")} \u00B7 ` +
      `success:${result.successCount} failure:${result.failCount}`
    );

    return {
      requestId:    randomUUID(),
      connectorKey: "sms",
      action:       req.type,
      status:       result.successCount > 0 ? "SUCCESS" : "FAILURE",
      data: {
        successCount: result.successCount,
        failureCount: result.failCount,
        recipients,
      },
      error:        result.successCount === 0 ? "All SMS sends failed" : undefined,
      ts:           new Date().toISOString(),
    };

  } catch (err) {
    const msg = (err as Error).message;
    console.warn(`[Bridge:SMS] \u26A0\uFE0F sendSMS failed \u2014 ${msg}`);
    return {
      requestId:    randomUUID(),
      connectorKey: "sms",
      action:       req.type,
      status:       "FAILURE",
      error:        msg,
      ts:           new Date().toISOString(),
    };
  }
}

// ─── getDeliveryStatus ────────────────────────────────────────────────────────

export async function getDeliveryStatus(req: BridgeRequest): Promise<BridgeResponse> {
  const { messageSid } = req.payload as { messageSid?: string };

  if (!messageSid) {
    return {
      requestId:    randomUUID(),
      connectorKey: "sms",
      action:       req.type,
      status:       "FAILURE",
      error:        "messageSid required to query delivery status.",
      ts:           new Date().toISOString(),
    };
  }

  const twilioSid   = process.env["TWILIO_SID"];
  const twilioToken = process.env["TWILIO_AUTH_TOKEN"];

  if (!twilioSid || !twilioToken) {
    return {
      requestId:    randomUUID(),
      connectorKey: "sms",
      action:       req.type,
      status:       "NOT_CONFIGURED",
      error:        "TWILIO_SID and TWILIO_AUTH_TOKEN are required to look up message status.",
      ts:           new Date().toISOString(),
    };
  }

  try {
    // Twilio REST API — GET /2010-04-01/Accounts/{AccountSid}/Messages/{Sid}.json
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages/${encodeURIComponent(messageSid)}.json`;
    const credentials = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");

    const resp = await fetch(url, {
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Accept":        "application/json",
      },
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.warn(`[Bridge:SMS] getDeliveryStatus HTTP ${resp.status} for SID:${messageSid} \u2014 ${body}`);
      return {
        requestId:    randomUUID(),
        connectorKey: "sms",
        action:       req.type,
        status:       "FAILURE",
        error:        `Twilio returned HTTP ${resp.status}`,
        ts:           new Date().toISOString(),
      };
    }

    const data = await resp.json() as Record<string, unknown>;

    console.log(`[Bridge:SMS] \u2705 getDeliveryStatus SID:${messageSid} \u2014 status:${data["status"] ?? "unknown"}`);

    return {
      requestId:    randomUUID(),
      connectorKey: "sms",
      action:       req.type,
      status:       "SUCCESS",
      data: {
        messageSid,
        twilioStatus:  data["status"],
        to:            data["to"],
        from:          data["from"],
        body:          data["body"],
        errorCode:     data["error_code"],
        errorMessage:  data["error_message"],
        dateSent:      data["date_sent"],
        dateUpdated:   data["date_updated"],
        numSegments:   data["num_segments"],
        price:         data["price"],
        priceUnit:     data["price_unit"],
      },
      ts: new Date().toISOString(),
    };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Bridge:SMS] \u26A0\uFE0F getDeliveryStatus failed \u2014 ${msg}`);
    return {
      requestId:    randomUUID(),
      connectorKey: "sms",
      action:       req.type,
      status:       "FAILURE",
      error:        msg,
      ts:           new Date().toISOString(),
    };
  }
}
