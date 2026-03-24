import React, { useState, useId } from "react";

const SAGE = "#7a9068";
const SAGE_BG = "rgba(122,144,104,0.09)";
const SAGE_BORDER = "rgba(122,144,104,0.18)";

// ─── AppShell ─────────────────────────────────────────────────────────────────
// Universal inner app template.
// Provides consistent, breathable, mobile-first layout for any app.
//
// Usage:
//   <AppShell>
//     <AppShell.Section title="Overview">…</AppShell.Section>
//     <AppShell.Empty icon="📄" title="No documents yet" />
//     <AppShell.Stat icon="📊" label="Total runs" value="1,284" />
//   </AppShell>

interface RootProps { children: React.ReactNode; style?: React.CSSProperties; wide?: boolean; }

function AppShellRoot({ children, style, wide }: RootProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", minHeight: "100%",
      padding: "20px 16px 40px",
      gap: 20,
      maxWidth: wide ? 1100 : 900,
      margin: "0 auto", width: "100%",
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
  badge?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
  style?: React.CSSProperties;
}

function Section({ title, subtitle, badge, action, children, style }: SectionProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, ...style }}>
      {(title || subtitle || action || badge) && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {title && (
                <h2 style={{
                  fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0,
                  letterSpacing: "-0.02em", lineHeight: 1.25,
                }}>{title}</h2>
              )}
              {badge && (
                <span style={{
                  display: "inline-flex", alignItems: "center", padding: "2px 8px",
                  borderRadius: 6, fontSize: 10, fontWeight: 700,
                  background: SAGE_BG, color: SAGE, border: `1px solid ${SAGE_BORDER}`,
                  letterSpacing: "0.03em",
                }}>{badge}</span>
              )}
            </div>
            {subtitle && (
              <p style={{ fontSize: 12.5, color: "#94a3b8", margin: 0, lineHeight: 1.45 }}>{subtitle}</p>
            )}
          </div>
          {action && <div style={{ flexShrink: 0, marginTop: 2 }}>{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

// ─── Loading ─────────────────────────────────────────────────────────────────

function Loading({ rows = 3, message }: { rows?: number; message?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" }}>
      {message && (
        <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 0 4px" }}>{message}</p>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height: i === 0 ? 64 : 48,
          borderRadius: 12,
          background: "linear-gradient(90deg, rgba(122,144,104,0.04) 0%, rgba(122,144,104,0.09) 50%, rgba(122,144,104,0.04) 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmerSlide 1.8s ease-in-out infinite",
          animationDelay: `${i * 0.1}s`,
        }} />
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
      padding: "56px 24px", textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: 18,
        background: SAGE_BG,
        border: `1px solid ${SAGE_BORDER}`,
        boxShadow: "0 1px 8px rgba(122,144,104,0.09)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
      }}>{icon}</div>
      <div>
        <div style={{
          fontSize: 15, fontWeight: 700, color: "#0f172a",
          letterSpacing: "-0.015em", lineHeight: 1.3,
        }}>{title}</div>
        {description && (
          <p style={{ fontSize: 13, color: "#94a3b8", maxWidth: 300, lineHeight: 1.55, margin: "6px auto 0" }}>
            {description}
          </p>
        )}
      </div>
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
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
  trend?: "up" | "down" | "neutral";
}

function Stat({ icon, label, value, color = SAGE, sub, trend }: StatProps) {
  const trendColor = trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#94a3b8";
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "";
  return (
    <div style={{
      background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14,
      padding: "18px 18px 16px",
      display: "flex", flexDirection: "column", gap: 4,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
      transition: "all 0.18s ease",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, marginBottom: 6,
        background: `${color}12`,
        border: `1px solid ${color}20`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
      }}>{icon}</div>
      <div style={{
        fontSize: 27, fontWeight: 800, color, lineHeight: 1,
        letterSpacing: "-0.035em",
      }}>
        {value}
        {trend && trendIcon && (
          <span style={{ fontSize: 14, fontWeight: 700, color: trendColor, marginLeft: 4 }}>{trendIcon}</span>
        )}
      </div>
      <div style={{
        fontSize: 11, color: "#94a3b8", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2,
      }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#b5c9ac", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  accent?: boolean;
  padding?: string | number;
}

function Card({ children, onClick, style, accent, padding = 18 }: CardProps) {
  const [hov, setHov] = useState(false);
  const base: React.CSSProperties = {
    background: "#fff",
    border: `1px solid ${hov && onClick ? "rgba(122,144,104,0.28)" : accent ? "rgba(122,144,104,0.20)" : "rgba(0,0,0,0.07)"}`,
    borderRadius: 14,
    padding,
    cursor: onClick ? "pointer" : undefined,
    transition: "all 0.17s ease",
    boxShadow: hov && onClick
      ? "0 4px 20px rgba(122,144,104,0.12), 0 1px 4px rgba(0,0,0,0.04)"
      : "0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03)",
    transform: hov && onClick ? "translateY(-1px)" : "translateY(0)",
    ...style,
  };
  return (
    <div
      style={base}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onFocus={() => setHov(true)}
      onBlur={() => setHov(false)}
    >
      {children}
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider({ label }: { label?: string }) {
  if (!label) return (
    <div style={{ height: 1, background: "rgba(0,0,0,0.055)", margin: "4px 0" }} />
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.055)" }} />
      <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.055)" }} />
    </div>
  );
}

// ─── Primary button ───────────────────────────────────────────────────────────

interface BtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
}

function Btn({ children, onClick, disabled, loading, size = "md", variant = "primary", icon, type = "button", fullWidth }: BtnProps) {
  const [hov, setHov] = useState(false);
  const [pressed, setPressed] = useState(false);

  const pad = size === "xs" ? "5px 10px" : size === "sm" ? "7px 14px" : size === "lg" ? "13px 24px" : "10px 18px";
  const fs  = size === "xs" ? 11 : size === "sm" ? 12 : size === "lg" ? 15 : 13;
  const br  = size === "xs" ? 7 : size === "sm" ? 8 : size === "lg" ? 12 : 10;

  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: hov ? "#5d7a52" : SAGE,
      color: "#fff", border: "none",
      boxShadow: hov && !disabled ? "0 4px 14px rgba(122,144,104,0.38)" : "0 1px 4px rgba(122,144,104,0.20)",
    },
    secondary: {
      background: hov ? "rgba(122,144,104,0.14)" : SAGE_BG,
      color: SAGE,
      border: `1px solid ${SAGE_BORDER}`,
    },
    ghost: {
      background: hov ? "rgba(0,0,0,0.045)" : "transparent",
      color: "#6b7280",
      border: "1px solid rgba(0,0,0,0.09)",
    },
    danger: {
      background: hov ? "#dc2626" : "#ef4444",
      color: "#fff", border: "none",
      boxShadow: hov && !disabled ? "0 4px 14px rgba(239,68,68,0.35)" : "none",
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        ...styles[variant],
        padding: pad, borderRadius: br,
        fontSize: fs, fontWeight: 600, cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.55 : 1,
        transition: "all 0.16s ease",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        letterSpacing: "-0.01em", fontFamily: "inherit",
        transform: pressed && !disabled ? "scale(0.97)" : "scale(1)",
        width: fullWidth ? "100%" : undefined,
        flexShrink: 0,
      }}
    >
      {icon && <span style={{ display: "flex", alignItems: "center", fontSize: "1.1em" }}>{icon}</span>}
      {loading ? (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 12, height: 12, border: "2px solid currentColor",
            borderTopColor: "transparent", borderRadius: "50%",
            animation: "spin 0.7s linear infinite", display: "inline-block",
          }} />
          Loading…
        </span>
      ) : children}
    </button>
  );
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

function Tag({ label, color = SAGE }: { label: string; color?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 6,
      fontSize: 10.5, fontWeight: 600,
      background: `${color}12`, color, border: `1px solid ${color}25`,
      letterSpacing: "0.025em",
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

// ─── Alert ───────────────────────────────────────────────────────────────────

interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  icon?: string;
}

const ALERT_CONFIGS = {
  info:    { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", icon: "ℹ️" },
  success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", icon: "✅" },
  warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: "⚠️" },
  error:   { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: "❌" },
};

function Alert({ type = "info", title, children, icon }: AlertProps) {
  const cfg = ALERT_CONFIGS[type];
  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 12, padding: "14px 16px",
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon ?? cfg.icon}</span>
      <div>
        {title && (
          <div style={{ fontSize: 13.5, fontWeight: 700, color: cfg.text, marginBottom: 3 }}>{title}</div>
        )}
        <div style={{ fontSize: 13, color: cfg.text, lineHeight: 1.55, opacity: 0.85 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "success" | "warning" | "error" | "neutral";

const BADGE_CFG: Record<BadgeVariant, { bg: string; border: string; text: string; dot: string }> = {
  default: { bg: SAGE_BG, border: SAGE_BORDER, text: SAGE, dot: SAGE },
  success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", dot: "#22c55e" },
  warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", dot: "#f59e0b" },
  error:   { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", dot: "#ef4444" },
  neutral: { bg: "#f1f5f9", border: "#e2e8f0", text: "#64748b", dot: "#94a3b8" },
};

function Badge({ label, variant = "default", dot = false }: { label: string; variant?: BadgeVariant; dot?: boolean }) {
  const cfg = BADGE_CFG[variant];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 100,
      fontSize: 10.5, fontWeight: 700,
      background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
      letterSpacing: "0.025em",
    }}>
      {dot && <span style={{ width: 5.5, height: 5.5, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />}
      {label}
    </span>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────

interface InputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  type?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  icon?: React.ReactNode;
}

function Input({ value, onChange, placeholder, label, type = "text", disabled, multiline, rows = 4, icon }: InputProps) {
  const [focused, setFocused] = useState(false);
  const inputId = useId();
  const border = focused ? `1.5px solid ${SAGE}` : "1.5px solid rgba(0,0,0,0.11)";
  const shadow = focused ? "0 0 0 3px rgba(122,144,104,0.12)" : "none";
  const common: React.CSSProperties = {
    width: "100%", fontSize: 13.5, fontFamily: "inherit", outline: "none",
    color: "#0f172a", background: disabled ? "#f8fafc" : "#fff",
    border, borderRadius: 10, transition: "all 0.18s ease",
    boxShadow: shadow, opacity: disabled ? 0.6 : 1,
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", letterSpacing: "-0.01em" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{
            position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
            color: "#94a3b8", display: "flex", pointerEvents: "none", fontSize: 15,
          }} aria-hidden="true">{icon}</span>
        )}
        {multiline ? (
          <textarea
            id={inputId}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ ...common, padding: "10px 12px", resize: "vertical", lineHeight: 1.5, display: "block" }}
          />
        ) : (
          <input
            id={inputId}
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ ...common, padding: icon ? "10px 12px 10px 34px" : "10px 12px", height: 40, display: "block" }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Row item ────────────────────────────────────────────────────────────────

interface RowProps {
  icon?: string;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onClick?: () => void;
}

function Row({ icon, label, sub, right, onClick }: RowProps) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onFocus={() => setHov(true)}
      onBlur={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "11px 14px", borderRadius: 10,
        background: hov && onClick ? "rgba(122,144,104,0.06)" : "transparent",
        cursor: onClick ? "pointer" : "default",
        transition: "background 0.15s ease",
      }}
    >
      {icon && (
        <span style={{ fontSize: 18, flexShrink: 0, width: 28, textAlign: "center" }}>{icon}</span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </div>
        {sub && <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
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
  Alert,
  Badge,
  Input,
  Row,
});
