/**
 * webhooks.ts — Webhook Dispatcher Service
 *
 * When a platform event fires, call dispatchWebhook(db, eventType, payload).
 * The dispatcher looks up all active subscriptions matching the event type,
 * then sends a POST to each target URL with the payload + HMAC signature.
 *
 * HMAC signature: X-Signature: sha256=<hex>
 * Consumers verify by computing HMAC-SHA256(secret, JSON.stringify(body)).
 *
 * Usage:
 *   await dispatchWebhook(db, "project.created", { projectId: 42, name: "My Project" });
 */

import { createHmac } from "crypto";
import { eq, or, and } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { webhookSubscriptions } from "@workspace/db";

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * signPayload — compute HMAC-SHA256 signature for webhook verification.
 */
function signPayload(secret: string, body: string): string {
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * dispatchWebhook — find active subscriptions and POST the event to each.
 * Runs async in the background — does not block the API response.
 */
export async function dispatchWebhook(
  db: NodePgDatabase<Record<string, unknown>>,
  eventType: string,
  data: Record<string, unknown>,
  tenantId = "default",
): Promise<void> {
  try {
    const subscriptions = await db
      .select()
      .from(webhookSubscriptions)
      .where(
        and(
          eq(webhookSubscriptions.status, "active"),
          eq(webhookSubscriptions.tenantId, tenantId),
          or(
            eq(webhookSubscriptions.eventType, eventType),
            eq(webhookSubscriptions.eventType, "*"),
          ),
        ),
      );

    if (subscriptions.length === 0) return;

    const payload: WebhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };
    const body = JSON.stringify(payload);

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-Webhook-Event": eventType,
            "X-Webhook-Timestamp": payload.timestamp,
            ...(typeof sub.headers === "object" && sub.headers !== null
              ? (sub.headers as Record<string, string>)
              : {}),
          };

          if (sub.secret) {
            headers["X-Signature"] = signPayload(sub.secret, body);
          }

          const res = await fetch(sub.targetUrl, {
            method: "POST",
            headers,
            body,
            signal: AbortSignal.timeout(5000),
          });

          // Update lastTriggeredAt
          await db
            .update(webhookSubscriptions)
            .set({ lastTriggeredAt: new Date(), updatedAt: new Date() })
            .where(eq(webhookSubscriptions.id, sub.id));

          if (!res.ok) {
            console.warn(`[webhooks] Delivery to ${sub.targetUrl} returned ${res.status}`);
          }
        } catch (err) {
          console.error(`[webhooks] Failed to deliver to ${sub.targetUrl}:`, err);
        }
      }),
    );
  } catch (err) {
    console.error("[webhooks] dispatchWebhook error:", err);
  }
}
