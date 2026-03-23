/**
 * ebs/replayEngine.ts — Event replay engine
 *
 * Re-emits stored events through the crossSystemRouter.
 * Use for: recovering from processing failures, backfilling
 * new consumers, and debugging event flows.
 *
 * replayEvent()       — replay one event by event_id
 * replayBatch()       — replay a list of event_ids
 * replayByTimeRange() — replay all events in a window
 */

import { getEventById, getEvents, type StoredEvent } from "./eventStore.js";
import { routeEvent }                                from "./crossSystemRouter.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReplayResult {
  event_id:   string;
  ok:         boolean;
  sse:        boolean;
  stored:     boolean;
  error?:     string;
  warnings:   string[];
}

export interface BatchReplayResult {
  total:     number;
  succeeded: number;
  failed:    number;
  results:   ReplayResult[];
}

// ─── Single replay ────────────────────────────────────────────────────────────

export async function replayEvent(eventId: string): Promise<ReplayResult> {
  const event = await getEventById(eventId);

  if (!event) {
    return { event_id: eventId, ok: false, sse: false, stored: false, error: "Event not found", warnings: [] };
  }

  return _dispatchReplay(event);
}

// ─── Batch replay ─────────────────────────────────────────────────────────────

export async function replayBatch(eventIds: string[]): Promise<BatchReplayResult> {
  const results: ReplayResult[] = [];

  for (const id of eventIds) {
    const r = await replayEvent(id);
    results.push(r);
  }

  return {
    total:     results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed:    results.filter((r) => !r.ok).length,
    results,
  };
}

// ─── Time-range replay ────────────────────────────────────────────────────────

export async function replayByTimeRange(opts: {
  topic?:      string;
  event_type?: string;
  from:        Date;
  to:          Date;
  limit?:      number;
}): Promise<BatchReplayResult> {
  const events = await getEvents({
    topic:      opts.topic,
    event_type: opts.event_type,
    from:       opts.from,
    to:         opts.to,
    limit:      opts.limit ?? 200,
  });

  const results: ReplayResult[] = [];

  for (const event of events) {
    const r = await _dispatchReplay(event);
    results.push(r);
  }

  console.log(
    `[EBS:ReplayEngine] Batch replay — topic:${opts.topic ?? "*"}` +
    ` type:${opts.event_type ?? "*"} window:${opts.from.toISOString()}→${opts.to.toISOString()}` +
    ` total:${results.length} ok:${results.filter(r => r.ok).length}`
  );

  return {
    total:     results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed:    results.filter((r) => !r.ok).length,
    results,
  };
}

// ─── Internal dispatch ────────────────────────────────────────────────────────

async function _dispatchReplay(event: StoredEvent): Promise<ReplayResult> {
  try {
    const result = await routeEvent({
      topic:          event.topic,
      event_type:     event.event_type,
      source:         `replay:${event.source}`,
      payload:        { ...event.payload, _replayed: true, _original_event_id: event.event_id },
      correlation_id: event.correlation_id ?? undefined,
    });

    console.log(
      `[EBS:ReplayEngine] ✅ replayed — event_id:${event.event_id}` +
      ` topic:${event.topic}::${event.event_type}`
    );

    return {
      event_id: event.event_id,
      ok:       true,
      sse:      result.sse,
      stored:   result.stored,
      warnings: result.warnings,
    };
  } catch (err) {
    const msg = (err as Error).message;
    console.warn(`[EBS:ReplayEngine] ⚠️ replay failed — event_id:${event.event_id} err:${msg}`);
    return {
      event_id: event.event_id,
      ok:       false,
      sse:      false,
      stored:   false,
      error:    msg,
      warnings: [],
    };
  }
}
