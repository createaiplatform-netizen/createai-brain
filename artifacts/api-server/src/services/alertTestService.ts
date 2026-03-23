/**
 * alertTestService — Node-level alert delivery for GlobalPulse.
 * Sends an alert payload to all push-subscribed devices for a given node
 * and returns per-device latency results.
 */

import { rawSql }      from "@workspace/db";
import { queueJob }    from "./everythingNetWay.js";
import webpush         from "web-push";

export interface AlertPayload {
  title?:    string;
  message?:  string;
  priority?: string;
  actions?:  string[];
}

export interface DeviceResult {
  id:        string;
  userId:    string;
  received:  boolean;
  latencyMs: number | null;
  error?:    string;
}

function initVapid(): boolean {
  const pub  = process.env["VAPID_PUBLIC_KEY"];
  const priv = process.env["VAPID_PRIVATE_KEY"];
  const subj = process.env["VAPID_SUBJECT"] ?? "mailto:admin@createai.digital";
  if (!pub || !priv) return false;
  try { webpush.setVapidDetails(subj, pub, priv); return true; }
  catch { return false; }
}

/**
 * Sends an alert to all push-subscribed devices for the given node.
 * The `production` flag is recorded but does not change delivery behaviour —
 * all deliveries target real registered subscriptions.
 */
export async function runAlertTestForNode(
  nodeId:     string,
  payload:    AlertPayload,
  production: boolean,
): Promise<DeviceResult[]> {
  const timestamp = new Date().toISOString();
  const title     = payload.title   ?? "CreateAI Brain — Platform Alert";
  const body      = payload.message ?? "Platform-wide alert from GlobalPulse.";
  const priority  = payload.priority ?? "high";
  const actions   = payload.actions  ?? [];

  // Persist alert job in EverythingNetWay
  await queueJob({
    type:    "GLOBAL_PULSE_ALERT",
    layer:   "messaging",
    payload: { nodeId, title, body, priority, actions, production, timestamp },
  }).catch(() => { /* non-fatal */ });

  // Deliver via Web Push
  const vapidReady = initVapid();
  if (!vapidReady) return [];

  const subs = (await rawSql`
    SELECT id, endpoint, p256dh, auth_key, user_id
    FROM platform_push_subscriptions
  `) as Array<Record<string, string>>;

  const results: DeviceResult[] = [];

  for (const sub of subs) {
    const devStart = Date.now();
    try {
      await webpush.sendNotification(
        {
          endpoint: sub["endpoint"],
          keys: { p256dh: sub["p256dh"], auth: sub["auth_key"] },
        },
        JSON.stringify({ title: `🔔 ${title}`, body, tag: `cai-pulse-${nodeId}`, priority, timestamp, actions }),
      );
      results.push({
        id:        String(sub["id"]),
        userId:    String(sub["user_id"]),
        received:  true,
        latencyMs: Date.now() - devStart,
      });
    } catch (err) {
      results.push({
        id:        String(sub["id"]),
        userId:    String(sub["user_id"]),
        received:  false,
        latencyMs: null,
        error:     (err as Error).message,
      });
    }
  }

  return results;
}
