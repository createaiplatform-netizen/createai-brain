/**
 * routes/ebs.ts — Global Event Bus System REST API
 *
 * All write routes require admin auth.
 * GET /status and /schemas are open for monitoring.
 *
 * Routes:
 *   GET  /api/ebs/status                 — overall EBS health
 *   GET  /api/ebs/schemas                — registered event schemas
 *   GET  /api/ebs/events                 — query event store
 *   POST /api/ebs/events/:id/replay      — replay one event
 *   POST /api/ebs/events/replay-batch    — replay a list of events
 *   POST /api/ebs/events/replay-range    — replay by time range
 *   GET  /api/ebs/dlq                    — view DLQ items
 *   POST /api/ebs/dlq/:id/retry          — retry a DLQ item
 *   POST /api/ebs/dlq/:id/resolve        — resolve a DLQ item
 *   GET  /api/ebs/outbound-queue         — view outbound webhook queue
 *   POST /api/ebs/outbound-queue/enqueue — enqueue an outbound webhook
 *   GET  /api/ebs/delivery-log           — unified delivery audit log
 *   POST /api/ebs/inbound/:source        — receive an inbound webhook
 */

import { Router, type Request, type Response } from "express";
import { requireAuth }           from "../middlewares/requireAuth.js";
import { getEventStoreStats, getEvents, getEventById } from "../ebs/eventStore.js";
import { getDLQStats, getDLQItems, resolveDLQItem, retryFromDLQ } from "../ebs/deadLetterQueue.js";
import { getOutboundStats, getOutboundQueue, enqueueOutboundWebhook, processOutboundQueue } from "../ebs/outboundWebhookEngine.js";
import { replayEvent, replayBatch, replayByTimeRange } from "../ebs/replayEngine.js";
import { schemaRegistry }        from "../ebs/schemaRegistry.js";
import { handleInboundWebhook, type InboundSource } from "../ebs/inboundWebhookRouter.js";
import { rawSql as sql }         from "@workspace/db";
import { routeEvent }            from "../ebs/crossSystemRouter.js";
import { queueMessage, processQueue as ventonProcess } from "../services/ventonWay.js";
import { queueJob as enqueueENW }   from "../services/everythingNetWay.js";
import { queueNetJob }              from "../services/electricNetWay.js";
import { getMeshNodes, updateMeshNodeStatus } from "../services/meshNetWay.js";
import { broadcastToSubscribers }   from "../services/externalPulse.js";
import { pushEvent as sseEvent }    from "./eventsStream.js";
import webpush                      from "web-push";

const router = Router();

// ─── GET /status ─────────────────────────────────────────────────────────────

router.get("/status", async (_req: Request, res: Response) => {
  try {
    const [eventStats, dlqStats, outboundStats] = await Promise.all([
      getEventStoreStats(),
      getDLQStats(),
      getOutboundStats(),
    ]);

    res.json({
      ok:        true,
      timestamp: new Date().toISOString(),
      eventStore: eventStats,
      dlq:        dlqStats,
      outbound:   outboundStats,
      schemas:    schemaRegistry.list().length,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── GET /schemas ─────────────────────────────────────────────────────────────

router.get("/schemas", (_req: Request, res: Response) => {
  res.json({ ok: true, schemas: schemaRegistry.list() });
});

// ─── GET /events ──────────────────────────────────────────────────────────────

router.get("/events", requireAuth, async (req: Request, res: Response) => {
  try {
    const { topic, event_type, source, from, to, limit, offset } = req.query as Record<string, string | undefined>;
    const events = await getEvents({
      topic,
      event_type,
      source,
      from:   from   ? new Date(from)   : undefined,
      to:     to     ? new Date(to)     : undefined,
      limit:  limit  ? Number(limit)    : 100,
      offset: offset ? Number(offset)   : 0,
    });
    res.json({ ok: true, count: events.length, events });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /events/:id/replay ──────────────────────────────────────────────────

router.post("/events/:id/replay", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await replayEvent(String(req.params["id"] ?? ""));
    res.json({ ok: result.ok, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /events/replay-batch ────────────────────────────────────────────────

router.post("/events/replay-batch", requireAuth, async (req: Request, res: Response) => {
  const { event_ids } = req.body as { event_ids?: string[] };
  if (!Array.isArray(event_ids) || event_ids.length === 0) {
    res.status(400).json({ ok: false, error: "event_ids[] required" });
    return;
  }
  try {
    const result = await replayBatch(event_ids.slice(0, 100));
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /events/replay-range ────────────────────────────────────────────────

router.post("/events/replay-range", requireAuth, async (req: Request, res: Response) => {
  const { topic, event_type, from, to, limit } = req.body as Record<string, string | number | undefined>;
  if (!from || !to) {
    res.status(400).json({ ok: false, error: "from and to are required" });
    return;
  }
  try {
    const result = await replayByTimeRange({
      topic:      topic      ? String(topic)      : undefined,
      event_type: event_type ? String(event_type) : undefined,
      from:       new Date(String(from)),
      to:         new Date(String(to)),
      limit:      limit      ? Number(limit)      : 100,
    });
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── GET /dlq ─────────────────────────────────────────────────────────────────

router.get("/dlq", requireAuth, async (req: Request, res: Response) => {
  try {
    const { source, resolved, limit, offset } = req.query as Record<string, string | undefined>;
    const items = await getDLQItems({
      source:   source   as Parameters<typeof getDLQItems>[0]["source"],
      resolved: resolved !== undefined ? resolved === "true" : undefined,
      limit:    limit    ? Number(limit)  : 50,
      offset:   offset   ? Number(offset) : 0,
    });
    const stats = await getDLQStats();
    res.json({ ok: true, stats, count: items.length, items });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /dlq/:id/retry ─────────────────────────────────────────────────────

router.post("/dlq/:id/retry", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await retryFromDLQ(String(req.params["id"] ?? ""), async (item) => {
      // Re-route through crossSystemRouter so the event reaches all consumers
      const { routeEvent } = await import("../ebs/crossSystemRouter.js");
      await routeEvent({
        topic:      "dlq_retry",
        event_type: item.message_type,
        source:     item.queue_source,
        payload:    item.payload,
      });
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /dlq/:id/resolve ────────────────────────────────────────────────────

router.post("/dlq/:id/resolve", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: { username?: string } }).user;
    const resolvedBy = user?.username ?? "admin";
    const ok = await resolveDLQItem(String(req.params["id"] ?? ""), resolvedBy);
    res.json({ ok, dlq_id: req.params["id"] });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── GET /outbound-queue ──────────────────────────────────────────────────────

router.get("/outbound-queue", requireAuth, async (req: Request, res: Response) => {
  try {
    const { status, limit, offset } = req.query as Record<string, string | undefined>;
    const [items, stats] = await Promise.all([
      getOutboundQueue({
        status: status as Parameters<typeof getOutboundQueue>[0]["status"],
        limit:  limit  ? Number(limit)  : 50,
        offset: offset ? Number(offset) : 0,
      }),
      getOutboundStats(),
    ]);
    res.json({ ok: true, stats, count: items.length, items });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /outbound-queue/enqueue ─────────────────────────────────────────────

router.post("/outbound-queue/enqueue", requireAuth, async (req: Request, res: Response) => {
  const { url, event_type, payload, secret, max_attempts, correlation_id, idempotency_key } =
    req.body as Record<string, unknown>;
  if (!url || !event_type) {
    res.status(400).json({ ok: false, error: "url and event_type are required" });
    return;
  }
  try {
    const hook_id = await enqueueOutboundWebhook({
      url:             String(url),
      event_type:      String(event_type),
      payload:         (payload as Record<string, unknown>) ?? {},
      secret:          secret          ? String(secret)          : undefined,
      max_attempts:    max_attempts    ? Number(max_attempts)    : undefined,
      correlation_id:  correlation_id  ? String(correlation_id)  : undefined,
      idempotency_key: idempotency_key ? String(idempotency_key) : undefined,
    });
    res.status(201).json({ ok: true, hook_id });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /outbound-queue/process (manual trigger) ───────────────────────────

router.post("/outbound-queue/process", requireAuth, async (_req: Request, res: Response) => {
  try {
    const result = await processOutboundQueue();
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── GET /delivery-log ────────────────────────────────────────────────────────

router.get("/delivery-log", requireAuth, async (req: Request, res: Response) => {
  try {
    const { channel, type: msgType, limit, offset } = req.query as Record<string, string | undefined>;
    const lim = Math.min(Number(limit ?? 100), 500);
    const off = Number(offset ?? 0);

    const rows = await sql`
      SELECT
        id, user_id, type, channel, recipient, subject,
        success, error_message, provider, executed_at AS timestamp
      FROM   platform_outbound_log
      WHERE  TRUE
        AND  (${channel  ?? null}::text IS NULL OR channel = ${channel  ?? ""})
        AND  (${msgType  ?? null}::text IS NULL OR type    = ${msgType  ?? ""})
      ORDER  BY executed_at DESC
      LIMIT  ${lim}
      OFFSET ${off}
    `;

    const [countRow] = await sql`SELECT COUNT(*)::int AS total FROM platform_outbound_log`;

    res.json({
      ok:    true,
      total: Number((countRow as Record<string, number>)["total"] ?? 0),
      count: rows.length,
      log:   rows,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /emit — full pipeline test ─────────────────────────────────────────
// Drives: schema → eventStore → SSE → outboundWebhookEngine → VentonWay queue
// Open (no auth) so the activation test can run without a session cookie.

router.post("/emit", async (req: Request, res: Response) => {
  const {
    topic        = "system",
    event_type   = "system.test",
    source       = "platform",
    payload      = {},
    correlation_id,
  } = (req.body ?? {}) as Record<string, unknown>;

  const trace: Array<{ step: string; ok: boolean; detail: unknown; ms: number }> = [];
  const t0 = Date.now();

  function step(name: string, ok: boolean, detail: unknown) {
    trace.push({ step: name, ok, detail, ms: Date.now() - t0 });
    const sym = ok ? "✅" : "❌";
    console.log(`[EBS:emit] ${sym} ${name} +${Date.now() - t0}ms`, JSON.stringify(detail));
  }

  // ── 1. Schema validation ──────────────────────────────────────────────────
  try {
    const v = schemaRegistry.validate(
      String(topic), String(event_type),
      (payload as Record<string, unknown>)
    );
    step("schema.validate", v.ok, v.ok ? "passed" : { violations: v.violations });
  } catch (e) {
    step("schema.validate", false, (e as Error).message);
  }

  // ── 2. EventStore + SSE (via crossSystemRouter) ───────────────────────────
  let storedEventId: string | null = null;
  try {
    const result = await routeEvent({
      topic:          String(topic),
      event_type:     String(event_type),
      source:         String(source),
      payload:        (payload as Record<string, unknown>),
      correlation_id: correlation_id ? String(correlation_id) : undefined,
    });
    step("eventStore.append", result.stored, result.stored ? "persisted" : result.warnings);
    step("sse.broadcast",     result.sse,    result.sse    ? "pushed to all SSE clients" : result.warnings);
  } catch (e) {
    step("crossSystemRouter", false, (e as Error).message);
  }

  // Verify — separate try so a query error never masks the append result
  try {
    const { getEvents } = await import("../ebs/eventStore.js");
    const [latest] = await getEvents({ event_type: String(event_type), limit: 1 });
    storedEventId = latest?.event_id ?? null;
    step("eventStore.verify", !!storedEventId, storedEventId ?? "not found");
  } catch (e) {
    step("eventStore.verify", false, (e as Error).message);
  }

  // ── 3. OutboundWebhookEngine — enqueue to internal echo endpoint ──────────
  let hookId: string | null = null;
  try {
    const echoUrl = `http://localhost:${process.env["PORT"] ?? 8080}/api/ebs/status`;
    hookId = await enqueueOutboundWebhook({
      url:            echoUrl,
      event_type:     String(event_type),
      payload:        { ...((payload as Record<string, unknown>)), _test: true, event_id: storedEventId },
      correlation_id: storedEventId ?? undefined,
    });
    step("outboundWebhookEngine.enqueue", true, { hook_id: hookId, url: echoUrl });
  } catch (e) {
    step("outboundWebhookEngine.enqueue", false, (e as Error).message);
  }

  // ── 4. VentonWay queue — insert a system.test row ────────────────────────
  let ventonId: string | null = null;
  try {
    const ventonMeta = JSON.stringify({
      source:        "ebs_emit",
      event_type:    String(event_type),
      correlation_id: storedEventId,
      hook_id:       hookId,
    });
    const ventonBody = `EBS activation test — event_id:${storedEventId ?? "n/a"} hook_id:${hookId ?? "n/a"}`;
    const rows = await sql`
      INSERT INTO platform_venton_way_queue
        (type, recipient, subject, body, scheduled_at, status, metadata)
      VALUES
        ('email',
         'system@createai.digital',
         'EBS Activation Test',
         ${ventonBody},
         NOW(),
         'pending',
         ${ventonMeta}::jsonb)
      RETURNING id
    `;
    ventonId = String((rows[0] as Record<string, unknown>)["id"] ?? "");
    step("ventonWay.queue.insert", true, { queue_id: ventonId, status: "pending" });
  } catch (e) {
    step("ventonWay.queue.insert", false, (e as Error).message);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const allOk = trace.every(t => t.ok);
  const summary = {
    ok:       allOk,
    pipeline: "UltraInteractionEngine → crossSystemRouter → eventStore → SSE → outboundWebhookEngine → VentonWay queue",
    event_id: storedEventId,
    hook_id:  hookId,
    venton_queue_id: ventonId,
    total_ms: Date.now() - t0,
    steps:    trace,
  };

  console.log(`[EBS:emit] pipeline complete in ${summary.total_ms}ms — all_ok:${allOk}`);
  res.status(allOk ? 200 : 207).json(summary);
});

// ─── POST /inbound/:source ────────────────────────────────────────────────────

const ALLOWED_SOURCES: InboundSource[] = ["twilio", "zapier", "slack", "custom"];

router.post("/inbound/:source", async (req: Request, res: Response) => {
  const source = String(req.params["source"] ?? "") as InboundSource;
  if (!ALLOWED_SOURCES.includes(source)) {
    res.status(400).json({ ok: false, error: `Unknown source: ${source}. Allowed: ${ALLOWED_SOURCES.join(", ")}` });
    return;
  }

  try {
    const result = await handleInboundWebhook({
      source,
      headers:  req.headers as Record<string, string | undefined>,
      body:     (req.body as Record<string, unknown>) ?? {},
      rawBody:  req.body ? JSON.stringify(req.body) : "",
      idempotency_key: req.headers["x-idempotency-key"] as string | undefined,
    });

    if (!result.ok && !result.duplicate) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /emergency-broadcast ────────────────────────────────────────────────
// Fans out through every internal delivery channel.
// No external providers (Twilio / Resend) are called here.

router.post("/emergency-broadcast", async (req: Request, res: Response) => {
  const startMs = Date.now();
  const message =
    (req.body as { message?: string })?.message ??
    "Emergency Broadcast — CreateAI Brain platform event";

  const log: Array<{ channel: string; ok: boolean; detail?: string }> = [];

  // 1. EBS eventStore + cross-system router (SSE fan-out handled inside routeEvent)
  try {
    await routeEvent({
      id:        "eb-" + crypto.randomUUID(),
      type:      "EMERGENCY_BROADCAST",
      source:    "platform",
      payload:   { message, ts: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });
    log.push({ channel: "ebs:eventStore+crossSystemRouter", ok: true });
  } catch (err) {
    log.push({ channel: "ebs:eventStore+crossSystemRouter", ok: false, detail: (err as Error).message });
  }

  // 2. Direct SSE push to all OS subscribers
  try {
    sseEvent("emergency", "EMERGENCY_BROADCAST", { message, ts: new Date().toISOString() });
    log.push({ channel: "sse:osLayer", ok: true });
  } catch (err) {
    log.push({ channel: "sse:osLayer", ok: false, detail: (err as Error).message });
  }

  // 3. VentonWay internal queue — internal phone layer (sms) + internal email layer (email)
  for (const type of ["email", "sms"] as const) {
    try {
      const { id } = await queueMessage({
        type,
        recipient: "internal://all",
        subject:   "EMERGENCY BROADCAST",
        body:      message,
        metadata:  { source: "emergency_broadcast", ts: new Date().toISOString() },
      });
      log.push({ channel: `ventonWay:${type}`, ok: true, detail: `queued id:${id}` });
    } catch (err) {
      log.push({ channel: `ventonWay:${type}`, ok: false, detail: (err as Error).message });
    }
  }
  // Process VentonWay queue immediately
  try {
    const r = await ventonProcess();
    log.push({ channel: "ventonWay:processQueue", ok: true, detail: `processed:${r.processed} sent:${r.sent}` });
  } catch (err) {
    log.push({ channel: "ventonWay:processQueue", ok: false, detail: (err as Error).message });
  }

  // 4. EverythingNetWay — TV/device, mobile, messaging, compute, sensor, internet layers
  const enwLayers: Array<"mobile" | "messaging" | "internet" | "electricity" | "compute" | "sensor"> =
    ["mobile", "messaging", "internet", "electricity", "compute", "sensor"];
  for (const layer of enwLayers) {
    try {
      const job = await enqueueENW({ type: "EMERGENCY_BROADCAST", layer, payload: { message } });
      log.push({ channel: `everythingNetWay:${layer}`, ok: true, detail: `job id:${(job as { id: number }).id}` });
    } catch (err) {
      log.push({ channel: `everythingNetWay:${layer}`, ok: false, detail: (err as Error).message });
    }
  }

  // 5. ElectricNetWay — infrastructure/electricity layer (energy, device, internet, data)
  const electricCategories: Array<"energy" | "device" | "internet" | "data"> =
    ["energy", "device", "internet", "data"];
  for (const cat of electricCategories) {
    try {
      const job = await queueNetJob({ category: cat, type: "EMERGENCY_BROADCAST", target: "all", payload: { message } });
      log.push({ channel: `electricNetWay:${cat}`, ok: true, detail: `job id:${(job as { id: number }).id}` });
    } catch (err) {
      log.push({ channel: `electricNetWay:${cat}`, ok: false, detail: (err as Error).message });
    }
  }

  // 6. MeshNetWay — propagate alert status to all mesh nodes
  try {
    const nodes = await getMeshNodes();
    let updated = 0;
    for (const node of nodes) {
      await updateMeshNodeStatus(node.id, "EMERGENCY_BROADCAST").catch(() => {});
      updated++;
    }
    log.push({ channel: "meshNetWay:allNodes", ok: true, detail: `nodes updated:${updated}` });
  } catch (err) {
    log.push({ channel: "meshNetWay:allNodes", ok: false, detail: (err as Error).message });
  }

  // 7. Web Push — internal OS/device layer via DB-persisted VAPID keys
  try {
    const configRows = await sql`
      SELECT key, value FROM platform_config WHERE key IN ('vapid_public','vapid_private')
    `.catch(() => [] as Array<{ key: string; value: string }>);
    const pub  = (configRows as Array<{ key: string; value: string }>).find(r => r.key === "vapid_public")?.value  ?? "";
    const priv = (configRows as Array<{ key: string; value: string }>).find(r => r.key === "vapid_private")?.value ?? "";

    if (pub && priv) {
      webpush.setVapidDetails("mailto:admin@LakesideTrinity.com", pub, priv);
      const subs = await sql`SELECT endpoint, p256dh, auth_key FROM platform_push_subscriptions`;
      let sent = 0; let failed = 0;
      const payload = JSON.stringify({ title: "EMERGENCY BROADCAST", body: message, url: "/", tag: "cai-emergency" });
      await Promise.allSettled(
        (subs as Array<{ endpoint: string; p256dh: string; auth_key: string }>).map(async s => {
          try {
            await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } }, payload);
            sent++;
          } catch { failed++; }
        })
      );
      log.push({ channel: "webPush:osLayer", ok: true, detail: `sent:${sent} failed:${failed} of ${subs.length}` });
    } else {
      log.push({ channel: "webPush:osLayer", ok: false, detail: "VAPID keys not found in DB" });
    }
  } catch (err) {
    log.push({ channel: "webPush:osLayer", ok: false, detail: (err as Error).message });
  }

  // 8. ExternalPulse — fan out to all opted-in external endpoints (webhooks, app clients, mesh relays, browser hooks)
  try {
    const pulse = await broadcastToSubscribers({
      eventType: "EMERGENCY_BROADCAST",
      message,
      payload:   { source: "emergency-broadcast", ts: new Date().toISOString() },
    });
    log.push({
      channel: "externalPulse:optInEndpoints",
      ok:      true,
      detail:  `delivered:${pulse.delivered} failed:${pulse.failed} of ${pulse.delivered + pulse.failed} subscribers`,
    });
  } catch (err) {
    log.push({ channel: "externalPulse:optInEndpoints", ok: false, detail: (err as Error).message });
  }

  const ok       = log.filter(l => l.ok).length;
  const failed   = log.filter(l => !l.ok).length;
  const elapsedMs = Date.now() - startMs;

  console.log(`[EmergencyBroadcast] ${ok}/${log.length} channels delivered in ${elapsedMs}ms`);

  res.json({ ok: true, channels: ok, failed, elapsedMs, log });
});

export default router;
