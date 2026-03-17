/**
 * ael/error.tsx — Error boundary helpers
 *
 * Two exports:
 *
 *  1. `withErrorBoundary(Component, options?)` — HOC that wraps any
 *     component in the existing ErrorBoundary class so it can recover
 *     from render-time crashes without bringing down the whole app.
 *
 *  2. `ErrorBadge` — a small inline error display for async errors
 *     (fetch failures, validation errors) that don't warrant a full
 *     boundary reset. Uses `role="alert"` so screen readers announce it.
 *
 * Usage:
 *   import { withErrorBoundary, ErrorBadge } from "@/ael/error";
 *
 *   // Wrap a whole app panel:
 *   export default withErrorBoundary(MyPanel, { appName: "My Panel" });
 *
 *   // Inline fetch error:
 *   {error && <ErrorBadge message={error} onRetry={reload} />}
 */

import React, { memo } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ERROR_BG, ERROR_BORDER, ERROR_TEXT, RADIUS_BADGE, GAP_CARD, GAP_ROW, FONT_BODY } from "./tokens";

// ─── withErrorBoundary ───────────────────────────────────────────────────────

interface BoundaryOptions {
  /** Label shown in the error fallback UI and console log. */
  appName?: string;
}

/**
 * Higher-order component — wraps `WrappedComponent` in the platform's
 * ErrorBoundary. The resulting component has the same props as the original.
 *
 * @example
 *   const SafeProjectPanel = withErrorBoundary(ProjectPanel, { appName: "Project Panel" });
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: BoundaryOptions = {},
): React.FC<P> {
  const displayName =
    options.appName ??
    WrappedComponent.displayName ??
    WrappedComponent.name ??
    "Component";

  function WithBoundary(props: P) {
    return (
      <ErrorBoundary appName={displayName}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  }

  WithBoundary.displayName = `withErrorBoundary(${displayName})`;
  return WithBoundary;
}

// ─── ErrorBadge ──────────────────────────────────────────────────────────────

/**
 * Inline error display for async / fetch errors.
 *
 * - `role="alert"` causes screen readers to announce the message immediately.
 * - Optional `onRetry` callback renders a small "Retry" button.
 *
 * @example
 *   {error && <ErrorBadge message={`Failed to load: ${error}`} onRetry={reload} />}
 */
export const ErrorBadge = memo(function ErrorBadge({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      style={{
        background: ERROR_BG,
        border: `1px solid ${ERROR_BORDER}`,
        borderRadius: RADIUS_BADGE,
        padding: `${GAP_CARD}px 20px`,
        color: ERROR_TEXT,
        fontSize: FONT_BODY,
        display: "flex",
        alignItems: "center",
        gap: GAP_ROW,
      }}
    >
      <span aria-hidden="true">⚠️</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            fontSize: FONT_BODY - 1,
            fontWeight: 600,
            padding: "4px 12px",
            borderRadius: 8,
            border: `1px solid ${ERROR_BORDER}`,
            background: "transparent",
            color: ERROR_TEXT,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
});
