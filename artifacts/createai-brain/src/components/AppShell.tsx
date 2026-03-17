import React from "react";

// ─── AppShell ─────────────────────────────────────────────────────────────────
// Universal inner app template.
// Provides consistent, breathable, mobile-first layout for any app.
// Usage:
//   <AppShell>
//     <AppShell.Section title="Overview">…</AppShell.Section>
//     <AppShell.Empty icon="📄" title="No documents yet" />
//   </AppShell>

interface RootProps { children: React.ReactNode; style?: React.CSSProperties; }

function AppShellRoot({ children, style }: RootProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", minHeight: "100%",
      padding: "20px 16px 32px", gap: 20, maxWidth: 900, margin: "0 auto", width: "100%",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

interface SectionProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
  style?: React.CSSProperties;
}

function Section({ title, subtitle, action, children, noPadding, style }: SectionProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, ...style }}>
      {(title || subtitle || action) && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && (
              <h2 style={{
                fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0,
                letterSpacing: "-0.02em", lineHeight: 1.2,
              }}>{title}</h2>
            )}
            {subtitle && (
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "3px 0 0", lineHeight: 1.4 }}>{subtitle}</p>
            )}
          </div>
          {action && <div style={{ flexShrink: 0, marginTop: 2 }}>{action}</div>}
        </div>
      )}
      <div style={noPadding ? undefined : undefined}>{children}</div>
    </div>
  );
}

// ─── Loading ─────────────────────────────────────────────────────────────────

function Loading({ rows = 3, message }: { rows?: number; message?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
      {message && (
        <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 4px" }}>{message}</p>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: i === 0 ? 60 : 48,
            borderRadius: 12,
            background: "rgba(99,102,241,0.05)",
            animation: "pulse 1.6s ease-in-out infinite",
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Empty ───────────────────────────────────────────────────────────────────

interface EmptyProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function Empty({ icon = "✦", title, description, action }: EmptyProps) {
  return (
    <div style={{
      padding: "48px 24px", textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
      }}>{icon}</div>
      <div style={{
        fontSize: 15, fontWeight: 700, color: "#0f172a",
        letterSpacing: "-0.01em", marginTop: 4,
      }}>{title}</div>
      {description && (
        <p style={{ fontSize: 13, color: "#94a3b8", maxWidth: 300, lineHeight: 1.5, margin: 0 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

// ─── Grid ────────────────────────────────────────────────────────────────────

interface GridProps {
  children: React.ReactNode;
  cols?: string;
  gap?: number;
}

function Grid({ children, cols = "repeat(auto-fill, minmax(150px, 1fr))", gap = 10 }: GridProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap }}>
      {children}
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

interface StatProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
  sub?: string;
}

function Stat({ icon, label, value, color = "#6366f1", sub }: StatProps) {
  return (
    <div style={{
      background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14,
      padding: "16px 18px", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{
        fontSize: 26, fontWeight: 700, color, lineHeight: 1,
        letterSpacing: "-0.03em", margin: "4px 0 2px",
      }}>{value}</div>
      <div style={{
        fontSize: 11, color: "#94a3b8", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.05em",
      }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "#c7d2fe" }}>{sub}</div>}
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  accent?: boolean;
}

function Card({ children, onClick, style, accent }: CardProps) {
  const base: React.CSSProperties = {
    background: "#fff",
    border: accent ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(0,0,0,0.07)",
    borderRadius: 14, padding: "16px",
    cursor: onClick ? "pointer" : undefined,
    transition: "all 0.15s",
    ...style,
  };
  return (
    <div
      style={base}
      onClick={onClick}
      onMouseEnter={onClick ? (e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "rgba(99,102,241,0.35)";
        el.style.boxShadow = "0 2px 16px rgba(99,102,241,0.10)";
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = accent ? "rgba(99,102,241,0.25)" : "rgba(0,0,0,0.07)";
        el.style.boxShadow = "none";
      } : undefined}
    >
      {children}
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider({ label }: { label?: string }) {
  if (!label) return (
    <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "4px 0" }} />
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
      <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
    </div>
  );
}

// ─── Primary button ───────────────────────────────────────────────────────────

interface BtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md";
  variant?: "primary" | "secondary" | "ghost";
  icon?: string;
}

function Btn({ children, onClick, disabled, loading, size = "md", variant = "primary", icon }: BtnProps) {
  const pad = size === "sm" ? "7px 14px" : "10px 18px";
  const fs  = size === "sm" ? 12 : 13;
  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: "#6366f1", color: "#fff", border: "none" },
    secondary: { background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)" },
    ghost:     { background: "transparent", color: "#6b7280", border: "1px solid rgba(0,0,0,0.09)" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...styles[variant],
        padding: pad, borderRadius: 10,
        fontSize: fs, fontWeight: 600, cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.55 : 1, transition: "all 0.15s",
        display: "inline-flex", alignItems: "center", gap: 6, letterSpacing: "-0.01em",
        fontFamily: "inherit",
      }}
    >
      {icon && <span>{icon}</span>}
      {loading ? "Loading…" : children}
    </button>
  );
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

function Tag({ label, color = "#6366f1" }: { label: string; color?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 6,
      fontSize: 10, fontWeight: 600,
      background: `${color}15`, color, border: `1px solid ${color}30`,
      letterSpacing: "0.02em",
    }}>{label}</span>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const AppShell = Object.assign(AppShellRoot, {
  Section,
  Loading,
  Empty,
  Grid,
  Stat,
  Card,
  Divider,
  Btn,
  Tag,
});
