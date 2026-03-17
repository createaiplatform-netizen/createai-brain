/**
 * ael/tokens.ts — Canonical design tokens for CreateAI Brain
 *
 * Every value here mirrors the OS shell (osLayout.tsx, AppWindow.tsx,
 * Sidebar.tsx). This is the single source of truth — change a value
 * once to propagate it across every consumer.
 *
 * Usage:
 *   import { ACCENT, CARD_BG, SHADOW, RADIUS_CARD } from "@/ael/tokens";
 */

// ─── Base palette ────────────────────────────────────────────────────────────

export const ACCENT    = "#6366f1";   // indigo — primary accent (OS shell brand colour)
export const CARD_BG   = "#ffffff";   // card surface (matches OS sidebar bg)
export const TEXT_MAIN = "#0f172a";   // slate-900 — primary text
export const TEXT_SUB  = "#64748b";   // slate-500 — secondary / supporting text
export const TEXT_DIM  = "#94a3b8";   // slate-400 — tertiary / placeholder text

// ─── Border & divider ────────────────────────────────────────────────────────

/** Raw rgba used for card/sidebar borders. Use BORDER for the full CSS string. */
export const BORDER_COLOR = "rgba(0,0,0,0.08)";  // OS sidebar border-right
export const DIVIDER_TH   = "rgba(0,0,0,0.07)";  // <th> bottom border / sidebar section sep.
export const DIVIDER_ROW  = "rgba(0,0,0,0.05)";  // <tr> bottom border — subtler than header

/** Full border shorthand — use directly in `border:` style props. */
export const BORDER = `1px solid ${BORDER_COLOR}`;

// ─── Shadow scale ────────────────────────────────────────────────────────────

/**
 * Two-layer card shadow that matches the OS shell's depth level.
 * Sidebar uses a single layer (2px 0 8px rgba(0,0,0,0.04));
 * cards use this two-layer variant for a slightly elevated feel.
 */
export const SHADOW = "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)";

// ─── Accent tints ────────────────────────────────────────────────────────────
// All derived from ACCENT via hex alpha suffix — no separate rgba() needed.

export const ACCENT_BG        = `${ACCENT}0d`;  //  ~5 % — badge resting background
export const ACCENT_BORDER_CLR = `${ACCENT}22`; // ~13 % — badge resting border
export const ACCENT_TRACK     = `${ACCENT}1a`;  // ~10 % — bar / progress track
export const ACCENT_FOCUS_BG  = `${ACCENT}0a`;  //  ~4 % — row hover / focus fill
export const ACCENT_HOVER_BG  = `${ACCENT}1a`;  // ~10 % — badge hover background
export const ACCENT_HOVER_BD  = `${ACCENT}4d`;  // ~30 % — badge hover border

// ─── Error state ─────────────────────────────────────────────────────────────

export const ERROR_BG     = "#fef2f2";  // red-50
export const ERROR_BORDER = "#fecaca";  // red-200
export const ERROR_TEXT   = "#dc2626";  // red-600

// ─── Border radii ────────────────────────────────────────────────────────────

export const RADIUS_CARD  = 14;   // outer cards — standard OS card
export const RADIUS_BADGE = 12;   // stat badges, error box, modal corners
export const RADIUS_SKEL  = 6;    // skeleton placeholder rects
export const RADIUS_BAR   = 4;    // bar track + fill, small inner elements

// ─── Spacing — strict 4 / 8 px grid ─────────────────────────────────────────

export const PAD_PAGE  = "24px 24px 64px";  // page wrapper (24 = 3×8, 64 = 8×8)
export const PAD_CARD  = "20px 24px";        // card inner   (20 = 5×4, 24 = 3×8)
export const PAD_TD    = "8px 8px 8px 0";    // body cell    (8 = 1×8)
export const PAD_TH    = "6px 8px 6px 0";    // header cell  (6 = 3×2, 8 = 1×8)

export const GAP_SECTION = 20;  // section marginBottom (5×4)
export const GAP_CARD    = 16;  // gap inside card      (2×8)
export const GAP_ROW     = 12;  // flex-row item gap    (3×4)
export const GAP_INNER   = 8;   // sub-element gap      (1×8)

// ─── Font scale ──────────────────────────────────────────────────────────────

export const FONT_XS    = 11;   // uppercase labels, badge sub-text
export const FONT_SM    = 12;   // secondary text, numeric values
export const FONT_BODY  = 13;   // cell content, section body
export const FONT_LABEL = 14;   // section headings
export const FONT_STAT  = 28;   // prominent stat numbers in badges
