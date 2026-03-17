/**
 * ael/time.ts — Date / string formatting utilities
 *
 * All functions are pure (no side effects, no imports).
 * Consolidated from duplicated helpers across DocumentsApp, NotificationsApp,
 * MetricsPage, and TractionDashboardApp.
 *
 * Usage:
 *   import { relativeTime, fmtDate, fmtEnum } from "@/ael/time";
 */

// ─── Relative time ───────────────────────────────────────────────────────────

/**
 * Converts an ISO timestamp to a human-readable relative string.
 *
 * Examples: "just now", "4m ago", "3h ago", "2d ago", "Mar 4, 2025"
 *
 * Falls back to `toLocaleDateString()` for dates older than 30 days so the
 * result remains meaningful without being vague.
 */
export function relativeTime(isoStr: string): string {
  const d    = new Date(isoStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ─── Formatted date ──────────────────────────────────────────────────────────

/**
 * Formats an ISO date string as "Mar 4, 2025".
 * Used in table cells and data labels throughout the platform.
 */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ─── Enum / snake-case label ─────────────────────────────────────────────────

/**
 * Converts a snake_case or kebab-case identifier into Title Case.
 *
 * Examples:
 *   "engine_run"  → "Engine Run"
 *   "biz-dev"     → "Biz Dev"
 *   "series_run"  → "Series Run"
 */
export function fmtEnum(s: string): string {
  return s
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
