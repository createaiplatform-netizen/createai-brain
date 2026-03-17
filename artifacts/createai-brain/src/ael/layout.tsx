/**
 * ael/layout.tsx — Generic layout primitives
 *
 * These components appear in near-identical form across MetricsPage,
 * several Apps, and the OS shell. Centralising them here means any visual
 * tweak (e.g. a border-radius change) propagates everywhere automatically.
 *
 * All components are memoised — their output is stable as long as props
 * don't change, so they slot cleanly into performance-sensitive trees.
 *
 * Usage:
 *   import { SectionCard, EmptyState, StatBadge } from "@/ael/layout";
 */

import React, { memo } from "react";
import {
  ACCENT, ACCENT_BG, ACCENT_BORDER_CLR,
  CARD_BG, BORDER, SHADOW,
  TEXT_MAIN, TEXT_SUB, TEXT_DIM,
  RADIUS_CARD, RADIUS_BADGE,
  PAD_CARD, GAP_SECTION, GAP_CARD,
  FONT_XS, FONT_SM, FONT_LABEL, FONT_STAT,
} from "./tokens";

// ─── SectionCard ─────────────────────────────────────────────────────────────

/**
 * A titled card section, rendered as `<section>` with `aria-labelledby`.
 * The heading id is derived from the title so screen readers announce the
 * section correctly when focus enters.
 */
export const SectionCard = memo(function SectionCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = "ael-section-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return (
    <section
      aria-labelledby={id}
      className={className}
      style={{
        background: CARD_BG, border: BORDER, borderRadius: RADIUS_CARD,
        boxShadow: SHADOW, padding: PAD_CARD, marginBottom: GAP_SECTION,
      }}
    >
      <h2
        id={id}
        style={{
          margin: `0 0 ${GAP_CARD}px 0`,
          fontSize: FONT_LABEL, fontWeight: 600,
          color: TEXT_MAIN, letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
});

// ─── EmptyState ───────────────────────────────────────────────────────────────

/**
 * Advisory placeholder shown when a list or table has no rows.
 * `role="note"` signals advisory content — not an error, not interactive.
 */
export const EmptyState = memo(function EmptyState({
  message,
  icon = "📭",
}: {
  message: string;
  icon?: string;
}) {
  return (
    <div
      role="note"
      aria-label={message}
      style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 8, padding: "24px 0",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: FONT_STAT, opacity: 0.3 }}>{icon}</span>
      <p style={{ margin: 0, fontSize: FONT_SM + 1, color: TEXT_DIM, textAlign: "center" }}>
        {message}
      </p>
    </div>
  );
});

// ─── StatBadge ───────────────────────────────────────────────────────────────

/**
 * A compact stat tile showing a large numeric value and a period / label.
 *
 * Exposes `tabIndex={0}` and hover/focus styles so it participates in
 * keyboard navigation without any extra wiring from the parent.
 *
 * `role="figure"` + `aria-label` bundles value + label into one
 * announcement, e.g. "312 — Today", instead of two separate strings.
 */
export const StatBadge = memo(function StatBadge({
  label,
  value,
  accent = ACCENT,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div
      tabIndex={0}
      role="figure"
      aria-label={`${value} — ${label}`}
      style={{
        background: ACCENT_BG,
        border: `1px solid ${ACCENT_BORDER_CLR}`,
        borderRadius: RADIUS_BADGE,
        padding: `${GAP_CARD}px 20px`,
        textAlign: "center",
        flex: 1, minWidth: 100,
        transition: "background-color 0.15s ease, border-color 0.15s ease",
        cursor: "default",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          fontSize: FONT_STAT, fontWeight: 700,
          color: accent, letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      <div aria-hidden="true" style={{ fontSize: FONT_XS + 1, color: TEXT_SUB, marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
});

// ─── LoadingDots ──────────────────────────────────────────────────────────────

/**
 * Minimal inline loading indicator — three animated dots.
 * Wraps in `role="status"` + `aria-label` so screen readers announce it.
 */
export const LoadingDots = memo(function LoadingDots({ label = "Loading…" }: { label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      style={{ fontSize: FONT_LABEL, color: TEXT_DIM, letterSpacing: 2 }}
    >
      &bull;&bull;&bull;
    </span>
  );
});

// ─── Divider ─────────────────────────────────────────────────────────────────

/**
 * A thin horizontal rule using the OS divider colour.
 * Accepts an optional `spacing` (top+bottom margin, default 12px).
 */
export const Divider = memo(function Divider({ spacing = 12 }: { spacing?: number }) {
  return (
    <hr
      aria-hidden="true"
      style={{
        border: "none",
        borderTop: `1px solid rgba(0,0,0,0.07)`,
        margin: `${spacing}px 0`,
      }}
    />
  );
});
