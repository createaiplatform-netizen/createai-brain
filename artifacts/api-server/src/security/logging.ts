/**
 * Security event logger — writes structured audit entries to stdout.
 * All access granted/denied events are recorded here.
 */

type SecurityEvent =
  | "ACCESS_GRANTED"
  | "ACCESS_DENIED"
  | "CLONE_ATTEMPT_BLOCKED"
  | "UNAUTHORIZED_ENDPOINT";

export function logEvent(event: SecurityEvent, detail: string): void {
  const entry = {
    ts:    new Date().toISOString(),
    event,
    detail,
  };
  console.log(`[SECURITY] ${JSON.stringify(entry)}`);
}
