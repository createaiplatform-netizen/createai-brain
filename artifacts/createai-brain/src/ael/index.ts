/**
 * ael/index.ts — Automatic Expansion Layer (AEL) barrel export
 *
 * Import from "@/ael" to access everything in one line:
 *
 *   import { apiFetch, apiPost, streamSSE } from "@/ael";
 *   import { relativeTime, fmtDate, fmtEnum }  from "@/ael";
 *   import { ACCENT, SHADOW, RADIUS_CARD }      from "@/ael";
 *   import { useAsyncData, useCancellable }     from "@/ael";
 *   import { SectionCard, EmptyState, StatBadge } from "@/ael";
 *   import { withErrorBoundary, ErrorBadge }    from "@/ael";
 *
 * Or import directly from sub-modules for tree-shaking granularity:
 *   import { apiFetch } from "@/ael/fetch";
 *   import { ACCENT }   from "@/ael/tokens";
 */

export * from "./fetch";
export * from "./time";
export * from "./tokens";
export * from "./hooks";
export * from "./layout";
export * from "./error";
