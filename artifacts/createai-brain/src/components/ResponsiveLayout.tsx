// ═══════════════════════════════════════════════════════════════════════════
// ResponsiveLayout — Content-area wrapper for apps and pages inside OSLayout.
//
// HOW TO USE:
//   Drop this inside any AppWindow content area or page component. It does NOT
//   wrap the OS shell (sidebar + nav are already handled by osLayout.tsx).
//
// Basic usage:
//   <ResponsiveLayout>
//     <ResponsiveLayout.Header title="My App" icon="📋" />
//     <ResponsiveLayout.Grid>
//       <MyCard />
//       <MyCard />
//     </ResponsiveLayout.Grid>
//   </ResponsiveLayout>
//
// Full usage with all slots:
//   <ResponsiveLayout maxWidth="xl">
//     <ResponsiveLayout.Header
//       title="Projects"
//       icon="📁"
//       action={<button>New</button>}
//     />
//     <ResponsiveLayout.Section>
//       <p>Introductory text or filters</p>
//     </ResponsiveLayout.Section>
//     <ResponsiveLayout.Grid cols={{ sm: 1, md: 2, lg: 3 }}>
//       {items.map(item => <ItemCard key={item.id} {...item} />)}
//     </ResponsiveLayout.Grid>
//   </ResponsiveLayout>
//
// All children are composable — mix Grid and Section freely.
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";

// ─── Max-width options ────────────────────────────────────────────────────────

const MAX_WIDTH_CLASSES = {
  sm:   "max-w-2xl",
  md:   "max-w-4xl",
  lg:   "max-w-6xl",
  xl:   "max-w-7xl",
  full: "max-w-full",
} as const;

type MaxWidth = keyof typeof MAX_WIDTH_CLASSES;

// ─── Root ─────────────────────────────────────────────────────────────────────

interface ResponsiveLayoutProps {
  children:    React.ReactNode;
  /** Constrain content width. Defaults to "xl". Pass "full" for edge-to-edge. */
  maxWidth?:   MaxWidth;
  className?:  string;
}

function ResponsiveLayoutRoot({
  children,
  maxWidth = "xl",
  className,
}: ResponsiveLayoutProps) {
  return (
    <div
      className={cn(
        // Full height of the content area, scroll inside
        "flex flex-col w-full min-h-full overflow-x-hidden",
        // Consistent padding: tight on mobile, generous on desktop
        "px-3 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5",
        className,
      )}
      style={{ background: "#f8fafc" }}
    >
      <div className={cn("w-full mx-auto", MAX_WIDTH_CLASSES[maxWidth])}>
        {children}
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  title:       string;
  icon?:       string;
  /** Optional content rendered on the right side (e.g. a button or badge) */
  action?:     React.ReactNode;
  /** Secondary text below the title */
  subtitle?:   string;
  className?:  string;
}

function Header({ title, icon, action, subtitle, className }: HeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 mb-4 sm:mb-5",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <span className="text-xl leading-none flex-shrink-0">{icon}</span>
        )}
        <div className="min-w-0">
          <h1
            className="font-semibold truncate"
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              color: "#0f172a",
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-xs mt-0.5 truncate"
              style={{ color: "#64748b" }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {action && (
        <div className="flex-shrink-0 flex items-center gap-2">{action}</div>
      )}
    </div>
  );
}

// ─── Section — freeform content block ─────────────────────────────────────────

interface SectionProps {
  children:   React.ReactNode;
  /** Optional label rendered above the content */
  label?:     string;
  className?: string;
}

function Section({ children, label, className }: SectionProps) {
  return (
    <div className={cn("mb-4 sm:mb-5", className)}>
      {label && (
        <p
          className="text-xs font-semibold uppercase tracking-wide mb-2"
          style={{ color: "#94a3b8" }}
        >
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

// ─── Grid — responsive card grid ──────────────────────────────────────────────

type ColCount = 1 | 2 | 3 | 4;

interface GridProps {
  children:   React.ReactNode;
  /**
   * Number of columns per breakpoint.
   * Defaults to { sm: 1, md: 2, lg: 3 }
   */
  cols?: {
    sm?: ColCount;
    md?: ColCount;
    lg?: ColCount;
  };
  /** Gap between items. Defaults to "md". */
  gap?:       "sm" | "md" | "lg";
  className?: string;
}

const COL_CLASSES: Record<ColCount, Record<"sm" | "md" | "lg", string>> = {
  1: { sm: "grid-cols-1",    md: "md:grid-cols-1",    lg: "lg:grid-cols-1" },
  2: { sm: "grid-cols-2",    md: "md:grid-cols-2",    lg: "lg:grid-cols-2" },
  3: { sm: "grid-cols-3",    md: "md:grid-cols-3",    lg: "lg:grid-cols-3" },
  4: { sm: "grid-cols-4",    md: "md:grid-cols-4",    lg: "lg:grid-cols-4" },
};

const GAP_CLASSES = {
  sm: "gap-2",
  md: "gap-3 sm:gap-4",
  lg: "gap-4 sm:gap-5 md:gap-6",
};

function Grid({
  children,
  cols = { sm: 1, md: 2, lg: 3 },
  gap = "md",
  className,
}: GridProps) {
  const smClass = COL_CLASSES[cols.sm ?? 1].sm;
  const mdClass = COL_CLASSES[cols.md ?? 2].md;
  const lgClass = COL_CLASSES[cols.lg ?? 3].lg;

  return (
    <div
      className={cn(
        "grid w-full",
        smClass,
        mdClass,
        lgClass,
        GAP_CLASSES[gap],
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── Card — standard card container for grid items ────────────────────────────

interface CardProps {
  children:    React.ReactNode;
  onClick?:    () => void;
  className?:  string;
  /** Highlight card with indigo accent border on hover */
  interactive?: boolean;
}

function Card({ children, onClick, className, interactive = !!onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl p-3 sm:p-4 flex flex-col gap-2 min-w-0 overflow-hidden",
        interactive && "cursor-pointer transition-all duration-150",
        className,
      )}
      style={{
        background:  "#ffffff",
        border:      "1px solid rgba(0,0,0,0.07)",
        boxShadow:   "0 1px 3px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={interactive ? (e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)";
        (e.currentTarget as HTMLElement).style.boxShadow  = "0 4px 12px rgba(99,102,241,0.10)";
      } : undefined}
      onMouseLeave={interactive ? (e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)";
        (e.currentTarget as HTMLElement).style.boxShadow  = "0 1px 3px rgba(0,0,0,0.05)";
      } : undefined}
    >
      {children}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyProps {
  icon?:       string;
  title:       string;
  description?: string;
  action?:     React.ReactNode;
}

function Empty({ icon = "📭", title, description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-3">
      <span className="text-3xl leading-none">{icon}</span>
      <div>
        <p className="font-semibold text-sm" style={{ color: "#374151" }}>{title}</p>
        {description && (
          <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

// ─── Compose ──────────────────────────────────────────────────────────────────

export const ResponsiveLayout = Object.assign(ResponsiveLayoutRoot, {
  Header,
  Section,
  Grid,
  Card,
  Empty,
});

export default ResponsiveLayout;
