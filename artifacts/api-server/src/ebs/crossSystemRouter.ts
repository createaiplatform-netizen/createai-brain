/**
 * ebs/crossSystemRouter.ts — Cross-system event router
 *
 * The single integration hub that wires all event producers to all consumers:
 *
 * Producers → this router → Consumers
 *   UltraInteractionEngine  →  SSE (eventsStream)
 *   FamilyAgents            →  EventStore
 *   Platform events         →  OutboundEngine (in-app notifications)
 *   Any caller via          →  routeEvent()
 *
 * Call initCrossSystemRouter() once at startup.
 * Call routeEvent() anywhere in the codebase to fan out an event.
 */

import { appendEvent }          from "./eventStore.js";
import { schemaRegistry }       from "./schemaRegistry.js";
import { pushEvent }            from "../routes/eventsStream.js";
import { UltraInteractionEngine, type MicroRevenueEvent } from "../services/ultraInteractionEngine.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoutedEvent {
  topic:          string;
  event_type:     string;
  source:         string;
  payload:        Record<string, unknown>;
  correlation_id?: string;
}

export interface RouteResult {
  stored:   boolean;
  sse:      boolean;
  warnings: string[];
}

// ─── Route an event through all consumers ────────────────────────────────────

export async function routeEvent(event: RoutedEvent): Promise<RouteResult> {
  const warnings: string[] = [];
  let stored = false;
  let sse    = false;

  // 1. Schema validation (non-blocking — logs warning, never throws)
  const validation = schemaRegistry.validate(event.topic, event.event_type, event.payload);
  if (!validation.ok) {
    const msg = `[EBS:CrossRouter] Schema violation — ${event.topic}::${event.event_type}: ${validation.violations.join(", ")}`;
    console.warn(msg);
    warnings.push(...validation.violations);
  }

  // 2. Append to event store
  try {
    await appendEvent({
      topic:          event.topic,
      event_type:     event.event_type,
      source:         event.source,
      payload:        event.payload,
      correlation_id: event.correlation_id,
    });
    stored = true;
  } catch (err) {
    warnings.push(`EventStore write failed: ${(err as Error).message}`);
  }

  // 3. Broadcast via SSE to all connected frontend subscribers
  try {
    pushEvent(event.topic, event.event_type, {
      source:         event.source,
      correlation_id: event.correlation_id ?? null,
      ...event.payload,
    });
    sse = true;
  } catch (err) {
    warnings.push(`SSE broadcast failed: ${(err as Error).message}`);
  }

  return { stored, sse, warnings };
}

// ─── Init — subscribe to all producers ───────────────────────────────────────

let _initialized = false;

export function initCrossSystemRouter(): void {
  if (_initialized) return;
  _initialized = true;

  // ── UltraInteractionEngine → microRevenue events ─────────────────────────
  UltraInteractionEngine.on("microRevenue", (ev: MicroRevenueEvent) => {
    routeEvent({
      topic:      "engagement",
      event_type: "micro.revenue",
      source:     "ultraInteractionEngine",
      payload: {
        userId:   ev.userId,
        amount:   ev.amount,
        source:   ev.source ?? "unknown",
        currency: ev.currency ?? "USD",
      },
    }).catch((err) =>
      console.warn("[EBS:CrossRouter] microRevenue routing error:", (err as Error).message)
    );
  });

  // ── UltraInteractionEngine → activeUser events ────────────────────────────
  UltraInteractionEngine.on("activeUser", (ev: Record<string, unknown>) => {
    routeEvent({
      topic:      "engagement",
      event_type: "user.active",
      source:     "ultraInteractionEngine",
      payload:    ev,
    }).catch((err) =>
      console.warn("[EBS:CrossRouter] activeUser routing error:", (err as Error).message)
    );
  });

  console.log("[EBS:CrossRouter] ✅ initialized — subscribed to: UltraInteractionEngine");
}

// ─── Convenience helpers for common events ────────────────────────────────────

export function emitPaymentEvent(
  event_type: string,
  payload:    Record<string, unknown>,
  opts?:      { correlation_id?: string }
): Promise<RouteResult> {
  return routeEvent({ topic: "payments", event_type, source: "stripe", payload, ...opts });
}

export function emitUserEvent(
  event_type: string,
  payload:    Record<string, unknown>,
  opts?:      { correlation_id?: string }
): Promise<RouteResult> {
  return routeEvent({ topic: "user", event_type, source: "platform", payload, ...opts });
}

export function emitDeliveryEvent(
  event_type: string,
  payload:    Record<string, unknown>
): Promise<RouteResult> {
  return routeEvent({ topic: "delivery", event_type, source: "outboundEngine", payload });
}

export function emitSystemEvent(
  event_type: string,
  payload:    Record<string, unknown>
): Promise<RouteResult> {
  return routeEvent({ topic: "system", event_type, source: "platform", payload });
}
