/**
 * nexus/resolver.ts — Unified 5-Format Resolver
 * ────────────────────────────────────────────────
 * Single resolver that handles all five address formats in one pass.
 * Role-aware from the first instruction. History-boosted when context
 * carries recent visit data.
 *
 * Formats:
 *   @signal   — matches on space.signal (exact first, then prefix)
 *   ~code     — matches on space.code (exact)
 *   #concept  — matches on space.concepts + space.tags
 *   ?query    — weighted natural-language match across all fields
 *   verb      — matches on space.verbs (bare word, no prefix)
 *
 * Confidence bands:
 *   90-100  certain    navigate immediately, no prompt
 *   70-89   high       navigate, show flash of matched label
 *   50-69   good       show match + related alternatives
 *   30-49   partial    show suggestions
 *   <30     miss       show all accessible spaces
 *
 * History boost: spaces visited in the last session get +12 if score > 40
 */

import { type Space, type SpaceLevel, canAccess } from "./spaces.js";

export type InputFormat =
  | "@signal"
  | "~code"
  | "#concept"
  | "?query"
  | "verb";

export interface ResolveMatch {
  space:      Space;
  score:      number;      // 0-100
  format:     InputFormat;
  matchedOn:  string;      // field or text that triggered the match
  band:       "certain" | "high" | "good" | "partial" | "miss";
  historyBoosted: boolean;
}

export interface ResolveResult {
  query:      string;
  format:     InputFormat;
  level:      SpaceLevel;
  matches:    ResolveMatch[];  // sorted by score desc, max 6
  top:        ResolveMatch | null;
  resolved:   boolean;         // true if top.score >= 30
}

// ─────────────────────────────────────────────────────────────────────────────
// Format detection
// ─────────────────────────────────────────────────────────────────────────────

export function detectFormat(raw: string): { format: InputFormat; term: string } {
  const q = raw.trim();
  if (q.startsWith("@")) return { format: "@signal",  term: q.slice(1).toLowerCase() };
  if (q.startsWith("~")) return { format: "~code",    term: q.toUpperCase() };
  if (q.startsWith("#")) return { format: "#concept", term: q.slice(1).toLowerCase() };
  if (q.startsWith("?")) return { format: "?query",   term: q.slice(1).trim().toLowerCase() };
  return                         { format: "verb",     term: q.toLowerCase() };
}

// ─────────────────────────────────────────────────────────────────────────────
// Confidence band helper
// ─────────────────────────────────────────────────────────────────────────────

function band(score: number): ResolveMatch["band"] {
  if (score >= 90) return "certain";
  if (score >= 70) return "high";
  if (score >= 50) return "good";
  if (score >= 30) return "partial";
  return "miss";
}

// ─────────────────────────────────────────────────────────────────────────────
// Scorer helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Word-overlap score between two token arrays — simple Jaccard-style */
function wordOverlap(queryWords: string[], candidates: string[]): number {
  let hits = 0;
  for (const qw of queryWords) {
    for (const c of candidates) {
      if (c === qw)            { hits += 2; break; }
      if (c.startsWith(qw) || qw.startsWith(c)) { hits += 1; break; }
    }
  }
  return Math.min(100, (hits / Math.max(queryWords.length, 1)) * 60);
}

/** String partial match: exact=100, prefix=80, contains=60, none=0 */
function strMatch(term: string, candidate: string): number {
  const t = term.toLowerCase();
  const c = candidate.toLowerCase();
  if (t === c)            return 100;
  if (c.startsWith(t))    return 80;
  if (t.startsWith(c))    return 75;
  if (c.includes(t))      return 55;
  if (t.includes(c) && c.length > 2) return 45;
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core resolver
// ─────────────────────────────────────────────────────────────────────────────

export function resolve(
  raw:        string,
  spaces:     Space[],
  level:      SpaceLevel,
  history:    string[] = []   // recently visited space IDs (most recent first)
): ResolveResult {
  const { format, term } = detectFormat(raw);
  const accessible = spaces.filter(s => canAccess(s, level));

  const scored: ResolveMatch[] = [];

  for (const space of accessible) {
    let score      = 0;
    let matchedOn  = "";

    // ── @signal ──────────────────────────────────────────────────────────
    if (format === "@signal") {
      const sig = space.signal.slice(1); // strip @
      const s   = strMatch(term, sig);
      if (s > 0) { score = s; matchedOn = `@${sig}`; }
      // Also check sub-spaces
      if (space.subspaces && score < 100) {
        for (const sub of space.subspaces) {
          const subSig = sub.signal.replace("@", "").split("/").pop() ?? "";
          const ss2 = strMatch(term, subSig);
          if (ss2 > score) { score = ss2 * 0.9; matchedOn = sub.signal; } // slight penalty for sub
        }
      }
    }

    // ── ~code ────────────────────────────────────────────────────────────
    else if (format === "~code") {
      if (space.code === `~${term.slice(1)}` || space.code === term) {
        score = 100; matchedOn = space.code;
      }
    }

    // ── #concept ─────────────────────────────────────────────────────────
    else if (format === "#concept") {
      let best = 0;
      for (const c of [...space.concepts, ...space.tags]) {
        const s = strMatch(term, c);
        if (s > best) { best = s; matchedOn = `#${c}`; }
      }
      score = best;
    }

    // ── ?query (natural language) ─────────────────────────────────────────
    else if (format === "?query") {
      const words = term.split(/\s+/).filter(w => w.length > 1);
      const verbScore    = wordOverlap(words, space.verbs)    * 1.0;
      const conceptScore = wordOverlap(words, space.concepts) * 0.9;
      const tagScore     = wordOverlap(words, space.tags)     * 0.7;
      const descScore    = wordOverlap(words, space.description.toLowerCase().split(/\s+/)) * 0.5;
      score = Math.min(100, verbScore + conceptScore + tagScore + descScore);
      if (score > 0) matchedOn = "?query";
    }

    // ── verb (bare word — merged SSAP + CORE intent vocabulary) ──────────
    else {
      // Primary: exact verb match
      let best = 0;
      const words = term.split(/[\s,/+]+/).filter(Boolean);
      for (const w of words) {
        for (const v of space.verbs) {
          const s = strMatch(w, v);
          if (s > best) { best = s; matchedOn = v; }
        }
        // Secondary: concept match (slightly penalized)
        for (const c of space.concepts) {
          const s = strMatch(w, c) * 0.8;
          if (s > best) { best = s; matchedOn = c; }
        }
        // Signal name match (for bare "vault", "store" etc)
        const sigName = space.signal.slice(1);
        const s = strMatch(w, sigName) * 0.9;
        if (s > best) { best = s; matchedOn = space.signal; }
      }
      score = best;
    }

    if (score < 1) continue;

    // ── History boost ─────────────────────────────────────────────────────
    let historyBoosted = false;
    if (score >= 40 && history.includes(space.id)) {
      const recency = history.length - history.indexOf(space.id);
      score = Math.min(100, score + 6 + recency);   // +6 to +14 depending on recency
      historyBoosted = true;
    }

    scored.push({
      space,
      score:    Math.round(score),
      format,
      matchedOn,
      band:     band(score),
      historyBoosted,
    });
  }

  // Sort descending, cap at 6
  scored.sort((a, b) => b.score - a.score);
  const matches = scored.slice(0, 6);
  const top     = matches[0] ?? null;

  return {
    query:    raw,
    format,
    level,
    matches,
    top,
    resolved: (top?.score ?? 0) >= 30,
  };
}
