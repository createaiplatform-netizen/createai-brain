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

// ─── sendSMS ─────────────────────────────────────────────────────────────────

export async function sendSMS(req: BridgeRequest): Promise<BridgeResponse> {
  if (!isConnectorActive("sms")) {
    const msg = "[Bridge:SMS] ⚠️ sendSMS() — NOT_CONFIGURED. Set TWILIO_AUTH_TOKEN + TWILIO_SID.";
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
      `[Bridge:SMS] ✅ SMS sent — to:${recipients.join(",")} · ` +
      `success:${result.successCount} failure:${result.failureCount}`
    );

    return {
      requestId:    randomUUID(),
      connectorKey: "sms",
      action:       req.type,
      status:       result.successCount > 0 ? "SUCCESS" : "FAILURE",
      data: {
        successCount: result.successCount,
        failureCount: result.failureCount,
        recipients,
      },
      error:        result.successCount === 0 ? "All SMS sends failed" : undefined,
      ts:           new Date().toISOString(),
    };

  } catch (err) {
    const msg = (err as Error).message;
    console.warn(`[Bridge:SMS] ⚠️ sendSMS failed — ${msg}`);
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
  // Requires a Twilio Message SID to look up delivery status.
  // If not tracked at send time, this cannot be answered without a SID.
  const { messageSid } = req.payload as { messageSid?: string };

  if (!messageSid) {
    return {
      requestId:    randomUUID(),
      connectorKey: "sms",
      action:       req.type,
      status:       "NOT_CONFIGURED",
      error:        "messageSid required to query delivery status.",
      ts:           new Date().toISOString(),
    };
  }

  // TODO: implement Twilio message lookup via twilio SDK
  // const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
  // const msg = await client.messages(messageSid).fetch();
  return {
    requestId:    randomUUID(),
    connectorKey: "sms",
    action:       req.type,
    status:       "NOT_CONFIGURED",
    error:        "getDeliveryStatus not yet implemented — messageSid tracking required.",
    ts:           new Date().toISOString(),
  };
}
