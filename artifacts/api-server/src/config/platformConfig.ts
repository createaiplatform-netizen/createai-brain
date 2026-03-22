/**
 * config/platformConfig.ts — Platform Safety & Scalability Configuration
 * ────────────────────────────────────────────────────────────────────────
 * WHAT: Single source of truth for all rate limit windows, payload size
 *       limits, and validation thresholds across the entire API server.
 *
 * WHY SAFE: All limits are conservative. Raising or lowering them requires
 *           one change here — not hunting across 50 route files. No
 *           existing behavior changes; only enforcement is added.
 *
 * SCALE PATH:
 *   - Today:   constants read at startup, enforced in-process.
 *   - Phase 2: swap constants for environment variables (no code change to
 *              routes — only this file).
 *   - Phase 3: swap for a remote config service (LaunchDarkly, AWS SSM, etc.)
 *              with hot-reload, still without touching route files.
 *
 * FAMILY SAFETY NOTE: No family-facing rate limits are placed here yet.
 *   Family Universe routes are behind authMiddleware and are not public-
 *   facing endpoints. If public family routes are added in future, add
 *   FAMILY_* constants here and mark them clearly.
 */

// ── Rate Limit Windows & Maximums ────────────────────────────────────────────
export const RATE_LIMITS = {
  // Global 300 req/min per IP is set in app.ts — not duplicated here.

  // Public POST endpoints (form submissions): tight limit to prevent spam.
  // 10 submissions/min per IP is generous for legitimate use but blocks bots.
  PUBLIC_POST_MAX:       10,
  PUBLIC_POST_WINDOW_MS: 60_000,

  // Public lookup endpoints (email-gated DB reads): slightly looser —
  // a user retrying after a typo should not be immediately blocked.
  PUBLIC_LOOKUP_MAX:       20,
  PUBLIC_LOOKUP_WINDOW_MS: 60_000,

  // Health consultation: triggers an expensive OpenAI call. Keep very tight.
  CONSULT_MAX:       5,
  CONSULT_WINDOW_MS: 60_000,

  // Admin login: brute force protection. 5 attempts per 15 minutes per IP.
  ADMIN_LOGIN_MAX:       5,
  ADMIN_LOGIN_WINDOW_MS: 15 * 60_000,
} as const;

// ── Payload Field Length Limits ───────────────────────────────────────────────
// All lengths are in characters. These are enforced server-side regardless
// of any client-side validation.
export const PAYLOAD_LIMITS = {
  NAME_MAX:          100,
  EMAIL_MAX:         254,   // RFC 5321 maximum email address length
  PHONE_MAX:          30,
  NOTES_MAX:        2_000,
  REVIEW_TEXT_MAX:  2_000,
  COMPLAINT_MAX:    3_000,
  SYMPTOMS_MAX:     3_000,
  HISTORY_MAX:      2_000,
  PRODUCT_ID_MAX:     100,
  PRODUCT_TITLE_MAX:  200,
  QUERY_PARAM_MAX:    200,
} as const;

// ── Validation Rules ──────────────────────────────────────────────────────────
export const VALIDATION = {
  // Simple email regex — RFC-aligned, intentionally not overly strict.
  // Detailed validation (MX record checks) is deferred to Resend at send-time.
  EMAIL_RE: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Review star rating valid range.
  RATING_MIN: 1,
  RATING_MAX:  5,

  // Appointment types accepted at /portal/book.
  // Adding a new type only requires adding it to this array.
  APPOINTMENT_TYPES: [
    "consultation",
    "follow-up",
    "intake",
    "review",
    "general",
  ],
} as const;

// ── Structured Rejection Logger ───────────────────────────────────────────────
// Writes structured JSON to stdout so any log aggregator (Datadog, Logtail,
// CloudWatch) can parse it without changes to the logging call sites.
// Sensitive fields (email body content, passwords, full payloads) are NEVER
// logged here — only route path, reason, and a safe IP-derived identifier.
//
// SCALE PATH: Replace console.warn with an SDK call to your log aggregator.
//             The call sites in route files do not need to change.
export function logRejection(
  route:    string,
  reason:   "rate_limited" | "validation_failed" | "payload_too_large",
  details:  string,
  ipHash:   string,
): void {
  console.warn(JSON.stringify({
    level:    "WARN",
    event:    "public_request_rejected",
    route,
    reason,
    details,
    ipHash,
    ts:       new Date().toISOString(),
  }));
}

// ── Safe IP Hash ─────────────────────────────────────────────────────────────
// Returns a short non-reversible hash of the IP for logging — never the raw IP.
// This preserves the ability to correlate abuse patterns without storing PII.
import crypto from "crypto";
export function safeIpHash(ip: string | undefined): string {
  if (!ip) return "unknown";
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 12);
}
