/**
 * routes/eventsStream.ts — Server-Sent Events Real-Time Platform Feed
 * ─────────────────────────────────────────────────────────────────────
 * Provides a real-time event stream (SSE) for the CreateAI Brain platform.
 * No WebSocket required — uses native browser EventSource API.
 *
 * Routes:
 *   GET /api/events/stream           SSE stream (all events)
 *   GET /api/events/stream?topics[]= SSE stream (filtered by topic)
 *   POST /api/events/emit            Emit a platform event (auth required)
 *   GET  /api/events/recent          Last 50 events from buffer
 *   GET  /api/events/status          Connection stats
 */

import { Router, type Request, type Response } from "express";
import { requireAuth }                          from "../middlewares/requireAuth.js";

const router = Router();

// ─── In-memory event ring buffer (last 500 events) ───────────────────────────
const BUFFER_SIZE = 500;
const HEARTBEAT_MS = 25_000;

type PlatformEvent = {
  id:        string;
  topic:     string;
  event:     string;
  data:      Record<string, unknown>;
  timestamp: string;
};

const eventBuffer: PlatformEvent[] = [];
let   eventCounter = 0;

function generateEventId(): string {
  return `evt_${Date.now()}_${++eventCounter}`;
}

function pushEvent(topic: string, event: string, data: Record<string, unknown>): PlatformEvent {
  const e: PlatformEvent = {
    id:        generateEventId(),
    topic,
    event,
    data,
    timestamp: new Date().toISOString(),
  };
  eventBuffer.push(e);
  if (eventBuffer.length > BUFFER_SIZE) eventBuffer.shift();
  broadcastEvent(e);
  return e;
}

// ─── Active SSE connections ───────────────────────────────────────────────────
type Subscriber = {
  id:     string;
  res:    Response;
  topics: string[];
  connectedAt: string;
};

const subscribers = new Map<string, Subscriber>();

function broadcastEvent(e: PlatformEvent): void {
  const payload = `id: ${e.id}\nevent: ${e.event}\ndata: ${JSON.stringify(e)}\n\n`;
  for (const [, sub] of subscribers) {
    if (sub.topics.length === 0 || sub.topics.includes(e.topic)) {
      try { sub.res.write(payload); } catch { /* client disconnected */ }
    }
  }
}

// ─── Heartbeat (keeps connections alive through proxies) ─────────────────────
setInterval(() => {
  pushEvent("system", "heartbeat", { subscribers: subscribers.size, bufferSize: eventBuffer.length });
}, HEARTBEAT_MS);

// ─── Seed some startup events ─────────────────────────────────────────────────
setTimeout(() => {
  pushEvent("system", "platform_ready", { version: "3.0", engines: 365, timestamp: new Date().toISOString() });
}, 2000);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/events/stream — SSE endpoint
// ─────────────────────────────────────────────────────────────────────────────
router.get("/stream", (req: Request, res: Response) => {
  const rawTopics = req.query["topics"];
  const topics: string[] = Array.isArray(rawTopics)
    ? (rawTopics as string[])
    : typeof rawTopics === "string" && rawTopics
    ? rawTopics.split(",").map(t => t.trim()).filter(Boolean)
    : [];

  const subId = `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // SSE headers
  res.setHeader("Content-Type",                "text/event-stream");
  res.setHeader("Cache-Control",               "no-cache, no-transform");
  res.setHeader("Connection",                  "keep-alive");
  res.setHeader("X-Accel-Buffering",           "no");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  // Send last-event-id catchup (replay up to 20 recent events)
  const lastId = req.headers["last-event-id"];
  if (lastId) {
    const idx = eventBuffer.findIndex(e => e.id === lastId);
    if (idx !== -1) {
      const replay = eventBuffer.slice(idx + 1);
      for (const e of replay) {
        if (topics.length === 0 || topics.includes(e.topic)) {
          res.write(`id: ${e.id}\nevent: ${e.event}\ndata: ${JSON.stringify(e)}\n\n`);
        }
      }
    }
  }

  // Register subscriber
  const sub: Subscriber = { id: subId, res, topics, connectedAt: new Date().toISOString() };
  subscribers.set(subId, sub);

  // Send connection confirmation
  res.write(`id: ${generateEventId()}\nevent: connected\ndata: ${JSON.stringify({
    subscriberId: subId, topics, bufferSize: eventBuffer.length,
    timestamp: new Date().toISOString(),
  })}\n\n`);

  pushEvent("system", "subscriber_joined", { subscriberId: subId, topics, total: subscribers.size });

  // Cleanup on disconnect
  req.on("close", () => {
    subscribers.delete(subId);
    pushEvent("system", "subscriber_left", { subscriberId: subId, total: subscribers.size });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/events/emit — emit a platform event
// ─────────────────────────────────────────────────────────────────────────────
router.post("/emit", requireAuth, (req: Request, res: Response) => {
  const { topic, event, data } = req.body as {
    topic?: string; event?: string; data?: Record<string, unknown>;
  };

  if (!topic || !event) {
    res.status(400).json({ error: "topic and event are required" }); return;
  }

  const VALID_TOPICS = [
    "system", "platform", "user", "ai", "automation", "finance",
    "healthcare", "legal", "staffing", "marketplace", "analytics",
  ];

  if (!VALID_TOPICS.includes(topic)) {
    res.status(400).json({ error: `Invalid topic. Valid: ${VALID_TOPICS.join(", ")}` }); return;
  }

  const e = pushEvent(topic, event, data ?? {});
  res.json({ ok: true, event: e, delivered: subscribers.size });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/events/recent — last N events from buffer
// ─────────────────────────────────────────────────────────────────────────────
router.get("/recent", (req: Request, res: Response) => {
  const limit  = Math.min(Number(req.query["limit"] ?? 50), 200);
  const topic  = String(req.query["topic"] ?? "");
  const events = topic
    ? eventBuffer.filter(e => e.topic === topic).slice(-limit)
    : eventBuffer.slice(-limit);

  res.json({
    ok: true,
    count: events.length,
    bufferSize: eventBuffer.length,
    events: events.slice().reverse(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/events/status
// ─────────────────────────────────────────────────────────────────────────────
router.get("/status", (_req: Request, res: Response) => {
  const subs = Array.from(subscribers.values()).map(s => ({
    id: s.id, topics: s.topics, connectedAt: s.connectedAt,
  }));

  res.json({
    ok: true,
    engine: "Server-Sent Events Layer v1",
    activeSubscribers: subscribers.size,
    bufferSize: eventBuffer.length,
    bufferCapacity: BUFFER_SIZE,
    heartbeatIntervalMs: HEARTBEAT_MS,
    subscribers: subs,
  });
});

// Export the pushEvent function so other routes can emit events
export { pushEvent };
export default router;
