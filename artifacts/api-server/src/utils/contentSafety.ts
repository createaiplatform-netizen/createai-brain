/**
 * utils/contentSafety.ts
 * ──────────────────────
 * Shared light content-safety screen used across platform surfaces:
 * family messages, habit names, outbound sends, and any user-supplied text.
 *
 * Not a comprehensive content-moderation service — just a fast, synchronous
 * first-line check that blocks clearly harmful or abusive text before it
 * reaches storage or transmission. Extend BLOCKED_TERMS as the platform grows.
 *
 * TODO: Replace with a proper moderation API (e.g. OpenAI Moderation) for
 *       production-grade coverage.
 */

const BLOCKED_TERMS: string[] = [
  "fuck", "shit", "asshole", "bitch", "bastard", "cunt", "dick", "piss", "prick",
  "nigger", "faggot", "retard",
  "kill yourself", "go die", "i will hurt", "i will kill", "bomb threat", "terror",
];

export interface SafetyResult {
  safe: boolean;
  reason?: string;
}

/**
 * Returns { safe: true } if the text passes all checks.
 * Returns { safe: false, reason: string } if any blocked term is found.
 *
 * Case-insensitive. Checks whole lowercased string, not word boundaries —
 * intentionally conservative.
 */
export function contentSafetyCheck(text: string): SafetyResult {
  const lower = text.toLowerCase();
  for (const term of BLOCKED_TERMS) {
    if (lower.includes(term)) {
      return { safe: false, reason: "Content contains a restricted term." };
    }
  }
  return { safe: true };
}
