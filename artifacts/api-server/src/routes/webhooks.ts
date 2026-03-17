/**
 * webhooks.ts — Webhook Subscription Management API
 *
 * Endpoints:
 *   GET    /webhooks            — list all subscriptions
 *   POST   /webhooks            — create a subscription
 *   GET    /webhooks/:id        — get single subscription
 *   PATCH  /webhooks/:id        — update subscription (url, status, etc.)
 *   DELETE /webhooks/:id        — delete subscription
 *   POST   /webhooks/:id/test   — send a test ping to the subscription
 */

import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, webhookSubscriptions, insertWebhookSubscriptionSchema } from "@workspace/db";
import { logAudit } from "../services/audit";
import { encrypt } from "../services/encryption";

const router = Router();

// List all subscriptions for the tenant
router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.tenantId, "default"))
      .orderBy(desc(webhookSubscriptions.createdAt));

    // Mask secrets in the response
    const safe = rows.map(r => ({ ...r, secret: r.secret ? "••••••••" : null }));
    res.json({ webhooks: safe, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch webhooks" });
  }
});

// Create a new subscription
router.post("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const body = insertWebhookSubscriptionSchema.parse(req.body);

    // Encrypt the secret before storing
    const encryptedSecret = body.secret ? encrypt(body.secret) : null;

    const [created] = await db
      .insert(webhookSubscriptions)
      .values({ ...body, secret: encryptedSecret, tenantId: "default" })
      .returning();

    await logAudit(db as any, req, {
      action: "webhook.created",
      resource: `webhook:${created.id}`,
      resourceType: "webhook",
      metadata: { label: created.label, eventType: created.eventType },
    });

    res.status(201).json({ ...created, secret: body.secret ? "••••••••" : null });
  } catch (err: any) {
    if (err?.name === "ZodError") { res.status(400).json({ error: "Validation failed", details: err.issues }); return; }
    console.error("[webhooks] POST /:", err);
    res.status(500).json({ error: "Failed to create webhook" });
  }
});

// Get single subscription
router.get("/:id", async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(webhookSubscriptions)
      .where(and(eq(webhookSubscriptions.id, parseInt(req.params.id as string)), eq(webhookSubscriptions.tenantId, "default")))
      .limit(1);

    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...row, secret: row.secret ? "••••••••" : null });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch webhook" });
  }
});

// Update subscription
router.patch("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const { label, targetUrl, eventType, status, headers } = req.body as Record<string, string>;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (label)     updates.label     = label;
    if (targetUrl) updates.targetUrl = targetUrl;
    if (eventType) updates.eventType = eventType;
    if (status)    updates.status    = status;
    if (headers)   updates.headers   = headers;

    const [updated] = await db
      .update(webhookSubscriptions)
      .set(updates)
      .where(eq(webhookSubscriptions.id, parseInt(req.params.id as string)))
      .returning();

    res.json({ ...updated, secret: updated.secret ? "••••••••" : null });
  } catch (err) {
    res.status(500).json({ error: "Failed to update webhook" });
  }
});

// Delete subscription
router.delete("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    await db.delete(webhookSubscriptions).where(eq(webhookSubscriptions.id, parseInt(req.params.id as string)));
    await logAudit(db as any, req, { action: "webhook.deleted", resource: `webhook:${req.params.id}`, resourceType: "webhook" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete webhook" });
  }
});

// Send a test ping
router.post("/:id/test", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const [sub] = await db.select().from(webhookSubscriptions).where(eq(webhookSubscriptions.id, parseInt(req.params.id as string))).limit(1);
    if (!sub) { res.status(404).json({ error: "Not found" }); return; }

    const testPayload = { event: "test.ping", timestamp: new Date().toISOString(), data: { message: "Test ping from CreateAI Brain", webhookId: sub.id } };
    const response = await fetch(sub.targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Webhook-Event": "test.ping" },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(5000),
    });

    res.json({ ok: response.ok, status: response.status, sentAt: testPayload.timestamp });
  } catch (err: any) {
    res.json({ ok: false, error: err.message });
  }
});

export default router;
