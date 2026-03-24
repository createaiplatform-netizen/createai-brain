/**
 * utils/contentSafety.ts
 * ──────────────────────
 * Shared light content-safety screen used across platform surfaces:
 * family messages, habit names, outbound sends, and any user-supplied text.
 *
 * Provides fast, synchronous first-line detection across four harm categories:
 *   1. Profanity / explicit language
 *   2. Violence threats and dangerous content
 *   3. Self-harm and crisis language
 *   4. Hate speech and slurs
 *
 * Returns { safe: true } when text passes all checks.
 * Returns { safe: false, reason, category } when a blocked term is found.
 *
 * Case-insensitive. Whole-string match (not word-boundary) — intentionally
 * conservative so variants like "k!ll" are caught by the threat list.
 *
 * Scale path: Replace or augment with OpenAI Moderation API
 * (POST https://api.openai.com/v1/moderations) for production-grade coverage
 * across additional categories (sexual content, graphic violence, etc.).
 */

interface TermEntry {
  term: string;
  category: string;
}

const BLOCKED_ENTRIES: TermEntry[] = [
  // ── Profanity / explicit language ─────────────────────────────────────────
  { term: "fuck",          category: "profanity" },
  { term: "shit",          category: "profanity" },
  { term: "asshole",       category: "profanity" },
  { term: "bitch",         category: "profanity" },
  { term: "bastard",       category: "profanity" },
  { term: "cunt",          category: "profanity" },
  { term: "dick",          category: "profanity" },
  { term: "piss",          category: "profanity" },
  { term: "prick",         category: "profanity" },
  { term: "cock",          category: "profanity" },
  { term: "pussy",         category: "profanity" },
  { term: "motherfucker",  category: "profanity" },
  { term: "bullshit",      category: "profanity" },
  { term: "jackass",       category: "profanity" },
  { term: "dumbass",       category: "profanity" },
  { term: "whore",         category: "profanity" },
  { term: "slut",          category: "profanity" },

  // ── Violence threats and dangerous content ─────────────────────────────────
  { term: "kill yourself",      category: "violence_threat" },
  { term: "go die",             category: "violence_threat" },
  { term: "i will hurt",        category: "violence_threat" },
  { term: "i will kill",        category: "violence_threat" },
  { term: "i'm going to kill",  category: "violence_threat" },
  { term: "im going to kill",   category: "violence_threat" },
  { term: "bomb threat",        category: "violence_threat" },
  { term: "terror",             category: "violence_threat" },
  { term: "shoot you",          category: "violence_threat" },
  { term: "stab you",           category: "violence_threat" },
  { term: "beat you up",        category: "violence_threat" },
  { term: "i will find you",    category: "violence_threat" },
  { term: "you will pay",       category: "violence_threat" },
  { term: "destroy you",        category: "violence_threat" },
  { term: "make you suffer",    category: "violence_threat" },
  { term: "end your life",      category: "violence_threat" },
  { term: "school shooting",    category: "violence_threat" },
  { term: "mass shooting",      category: "violence_threat" },
  { term: "pipe bomb",          category: "violence_threat" },
  { term: "make a bomb",        category: "violence_threat" },

  // ── Self-harm and crisis language ─────────────────────────────────────────
  { term: "want to kill myself",      category: "self_harm" },
  { term: "want to die",              category: "self_harm" },
  { term: "going to kill myself",     category: "self_harm" },
  { term: "gonna kill myself",        category: "self_harm" },
  { term: "thinking about suicide",   category: "self_harm" },
  { term: "planning to suicide",      category: "self_harm" },
  { term: "end my life",              category: "self_harm" },
  { term: "ending my life",           category: "self_harm" },
  { term: "cutting myself",           category: "self_harm" },
  { term: "hurt myself",              category: "self_harm" },
  { term: "no reason to live",        category: "self_harm" },
  { term: "can't go on",              category: "self_harm" },
  { term: "cant go on",               category: "self_harm" },
  { term: "overdose on",              category: "self_harm" },
  { term: "slit my wrist",            category: "self_harm" },

  // ── Hate speech and slurs ─────────────────────────────────────────────────
  { term: "nigger",       category: "hate_speech" },
  { term: "nigga",        category: "hate_speech" },
  { term: "faggot",       category: "hate_speech" },
  { term: "retard",       category: "hate_speech" },
  { term: "spic",         category: "hate_speech" },
  { term: "chink",        category: "hate_speech" },
  { term: "kike",         category: "hate_speech" },
  { term: "wetback",      category: "hate_speech" },
  { term: "tranny",       category: "hate_speech" },
  { term: "dyke",         category: "hate_speech" },
  { term: "cracker",      category: "hate_speech" },
  { term: "sandnigger",   category: "hate_speech" },
  { term: "towelhead",    category: "hate_speech" },
  { term: "gook",         category: "hate_speech" },
  { term: "coon",         category: "hate_speech" },
  { term: "spook",        category: "hate_speech" },
  { term: "white trash",  category: "hate_speech" },
  { term: "go back to your country", category: "hate_speech" },
];

export interface SafetyResult {
  safe: boolean;
  reason?: string;
  category?: string;
}

/**
 * Returns { safe: true } if the text passes all checks.
 * Returns { safe: false, reason, category } if any blocked term is found.
 *
 * Case-insensitive. Checks whole lowercased string (not word boundaries) —
 * intentionally conservative so partial matches are also caught.
 */
export function contentSafetyCheck(text: string): SafetyResult {
  const lower = text.toLowerCase();
  for (const entry of BLOCKED_ENTRIES) {
    if (lower.includes(entry.term)) {
      return {
        safe:     false,
        reason:   "Content contains a restricted term.",
        category: entry.category,
      };
    }
  }
  return { safe: true };
}

/** Returns the count of blocked entries per category for audit/monitoring. */
export function contentSafetyCoverage(): Record<string, number> {
  return BLOCKED_ENTRIES.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1;
    return acc;
  }, {});
}
