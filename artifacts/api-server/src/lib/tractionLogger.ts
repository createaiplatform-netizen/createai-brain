import { pool } from "@workspace/db";

export interface TractionEventPayload {
  eventType:   string;
  category?:   string;
  subCategory?: string;
  userId?:     string | null;
  metadata?:   Record<string, unknown>;
}

/**
 * Fire-and-forget traction event logger.
 * Never awaited — never blocks any HTTP response.
 * Silently swallows errors so failures never surface to users.
 */
export function logTractionEvent(event: TractionEventPayload): void {
  const {
    eventType,
    category    = "traction",
    subCategory = null,
    userId      = null,
    metadata    = {},
  } = event;

  pool.query(
    `INSERT INTO traction_events (event_type, category, sub_category, user_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [eventType, category, subCategory, userId, JSON.stringify(metadata)]
  ).catch(err => {
    console.error("[traction] Failed to log event:", err);
  });
}

/**
 * Log a registry snapshot — called on startup to record current state.
 */
export function logRegistrySnapshot(snapshot: Record<string, unknown>): void {
  logTractionEvent({
    eventType:   "registry_snapshot",
    category:    "growth",
    subCategory: "expansion",
    metadata:    snapshot,
  });
}
