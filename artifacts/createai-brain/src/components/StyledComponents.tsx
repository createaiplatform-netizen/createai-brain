import React, { useState } from "react";
import {
  PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  TooltipProps,
} from "recharts";

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  bg:        "#f8fafc",
  surface:   "#ffffff",
  border:    "rgba(15,23,42,0.07)",
  shadow:    "0 1px 3px rgba(15,23,42,0.06), 0 4px 20px rgba(15,23,42,0.04)",
  shadowHov: "0 4px 12px rgba(15,23,42,0.10), 0 12px 32px rgba(15,23,42,0.07)",
  accent:    "#6366f1",
  accentBg:  "rgba(99,102,241,0.07)",
  text1:     "#0f172a",
  text2:     "#475569",
  text3:     "#94a3b8",
  ok:        "#22c55e",
  okBg:      "rgba(34,197,94,0.10)",
  warn:      "#f59e0b",
  warnBg:    "rgba(245,158,11,0.10)",
  danger:    "#ef4444",
  dangerBg:  "rgba(239,68,68,0.10)",
  blue:      "#3b82f6",
  blueBg:    "rgba(59,130,246,0.10)",
  radius:    12,
  font:      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif',
  mono:      '"SF Mono", "Fira Code", "Cascadia Code", Menlo, monospace',
};

// ─── SectionHeader ────────────────────────────────────────────────────────────

export const SectionHeader = ({ title }: { title: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 36, marginBottom: 14 }}>
    <div style={{ width: 3, height: 20, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
    <h2 style={{
      margin: 0, fontSize: 17, fontWeight: 650, color: T.text1,
      fontFamily: T.font, letterSpacing: "-0.2px",
    }}>
      {title}
    </h2>
  </div>
);

// ─── Card ─────────────────────────────────────────────────────────────────────

export const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: T.surface, borderRadius: T.radius,
    border: `1px solid ${T.border}`, boxShadow: T.shadow,
    marginBottom: 16, overflow: "hidden", transition: "box-shadow 0.2s ease",
    ...style,
  }}>
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div style={{
    padding: "16px 20px 0", fontFamily: T.font,
  }}>
    <div style={{ fontSize: 14, fontWeight: 650, color: T.text1, letterSpacing: "-0.1px" }}>{title}</div>
    {subtitle && <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>{subtitle}</div>}
  </div>
);

export const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: "14px 20px 20px", fontFamily: T.font, fontSize: 13, color: T.text2 }}>
    {children}
  </div>
);

// ─── StatusPill ───────────────────────────────────────────────────────────────

export const StatusPill = ({
  label, variant = "ok",
}: { label: string; variant?: "ok" | "warn" | "danger" | "blue" | "neutral" }) => {
  const styles: Record<string, { color: string; bg: string; border: string }> = {
    ok:      { color: T.ok,     bg: T.okBg,     border: "rgba(34,197,94,0.25)" },
    warn:    { color: T.warn,   bg: T.warnBg,   border: "rgba(245,158,11,0.25)" },
    danger:  { color: T.danger, bg: T.dangerBg, border: "rgba(239,68,68,0.25)" },
    blue:    { color: T.blue,   bg: T.blueBg,   border: "rgba(59,130,246,0.25)" },
    neutral: { color: T.text2,  bg: "#f1f5f9",  border: T.border },
  };
  const s = styles[variant] ?? styles.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      letterSpacing: "0.2px", color: s.color, background: s.bg,
      border: `1px solid ${s.border}`, fontFamily: T.font,
    }}>
      {label}
    </span>
  );
};

// ─── Table ────────────────────────────────────────────────────────────────────

export const Table = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: "100%", overflowX: "auto", borderRadius: T.radius, border: `1px solid ${T.border}`, boxShadow: T.shadow, marginBottom: 16 }}>
    <table style={{ width: "100%", borderCollapse: "collapse", background: T.surface }}>{children}</table>
  </div>
);

export const TableHead = ({ children }: { children: React.ReactNode }) => (
  <thead style={{ background: "#f8fafc", borderBottom: `1px solid ${T.border}` }}>{children}</thead>
);

export const TableRow = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
  const [hov, setHov] = useState(false);
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderBottom: `1px solid ${T.border}`,
        background: hov ? "#f8fafc" : "transparent",
        cursor: onClick ? "pointer" : "default",
        transition: "background 0.15s ease",
      }}
    >
      {children}
    </tr>
  );
};

export const TableCell = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <td style={{
    padding: "11px 16px", fontSize: 13, color: T.text1,
    fontFamily: T.font, verticalAlign: "middle", ...style,
  }}>
    {children}
  </td>
);

// ─── MetricCard — for KPI grids ──────────────────────────────────────────────

export const MetricCard = ({
  label, value, sub, accent = false,
}: { label: string; value: string | number; sub?: string; accent?: boolean }) => (
  <div style={{
    background: accent ? T.accent : T.surface,
    border: `1px solid ${accent ? "transparent" : T.border}`,
    boxShadow: T.shadow, borderRadius: T.radius,
    padding: "18px 20px", display: "flex", flexDirection: "column", gap: 4,
  }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: accent ? "rgba(255,255,255,0.7)" : T.text3, letterSpacing: "0.5px", textTransform: "uppercase", fontFamily: T.font }}>
      {label}
    </div>
    <div style={{ fontSize: 26, fontWeight: 780, color: accent ? "#fff" : T.text1, fontFamily: T.font, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: 12, color: accent ? "rgba(255,255,255,0.6)" : T.text3, fontFamily: T.font }}>{sub}</div>}
  </div>
);

// ─── ProgressBar ─────────────────────────────────────────────────────────────

export const ProgressBar = ({
  label, value, max = 100, color,
}: { label: string; value: number; max?: number; color?: string }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const c = color ?? (pct >= 99 ? T.ok : pct >= 90 ? T.accent : pct >= 75 ? T.warn : T.danger);
  return (
    <div style={{ marginBottom: 12, fontFamily: T.font }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 780, color: c }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: c,
          borderRadius: 99, transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }} />
      </div>
    </div>
  );
};

// ─── Charts ───────────────────────────────────────────────────────────────────

const ChartTooltipStyle: React.CSSProperties = {
  background: T.surface, border: `1px solid ${T.border}`,
  borderRadius: 8, boxShadow: T.shadow, padding: "8px 12px",
  fontSize: 12, fontFamily: T.font, color: T.text1,
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={ChartTooltipStyle}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: T.text2 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color ?? T.accent }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export const PieChart = ({
  data, valueKey, labelKey, colors, height,
}: { data: Record<string, unknown>[]; valueKey: string; labelKey: string; colors: string[]; height: number }) => (
  <ResponsiveContainer width="100%" height={height}>
    <RePieChart>
      <Pie
        data={data} dataKey={valueKey} nameKey={labelKey}
        innerRadius={height / 2 - 40} outerRadius={height / 2 - 14}
        paddingAngle={3} animationBegin={0} animationDuration={700}
      >
        {data.map((_e, idx) => (
          <Cell key={idx} fill={colors[idx % colors.length]} strokeWidth={0} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
      <Legend
        iconType="circle" iconSize={8}
        formatter={(value: string) => (
          <span style={{ fontSize: 12, color: T.text2, fontFamily: T.font }}>{value}</span>
        )}
      />
    </RePieChart>
  </ResponsiveContainer>
);

export const BarChart = ({
  data, xKey, yKey, height, colorScheme,
}: { data: Record<string, unknown>[]; xKey: string; yKey: string; height: number; colorScheme: string[] }) => (
  <ResponsiveContainer width="100%" height={height}>
    <ReBarChart data={data} barSize={24} style={{ fontFamily: T.font }}>
      <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
      <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: T.text3 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11, fill: T.text3 }} axisLine={false} tickLine={false} width={32} />
      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
      <Bar
        dataKey={yKey} fill={colorScheme[0]} radius={[4, 4, 0, 0]}
        animationDuration={700} animationEasing="ease-out"
      />
    </ReBarChart>
  </ResponsiveContainer>
);

// ─── AuditLog ─────────────────────────────────────────────────────────────────

const LOG_STYLES: Record<"OK" | "Warn" | "Blocked", { dot: string; text: string; bg: string }> = {
  OK:      { dot: T.ok,     text: "#166534", bg: "rgba(34,197,94,0.06)" },
  Warn:    { dot: T.warn,   text: "#92400e", bg: "rgba(245,158,11,0.06)" },
  Blocked: { dot: T.danger, text: "#991b1b", bg: "rgba(239,68,68,0.06)" },
};

export const AuditLog = ({
  logs, maxEntries,
}: { logs: { message: string; level: "OK" | "Warn" | "Blocked" }[]; maxEntries: number }) => (
  <div style={{
    background: "#0f172a", borderRadius: T.radius,
    border: `1px solid rgba(255,255,255,0.06)`,
    padding: "14px 16px", maxHeight: 320, overflowY: "auto",
    fontFamily: T.mono, fontSize: 12, lineHeight: 1.6,
  }}>
    {logs.length === 0 && (
      <span style={{ color: "#475569" }}>No log entries yet…</span>
    )}
    {logs.slice(0, maxEntries).map((log, idx) => {
      const s = LOG_STYLES[log.level] ?? LOG_STYLES.OK;
      return (
        <div key={idx} style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          marginBottom: 6, padding: "4px 8px", borderRadius: 6,
          background: idx === 0 ? "rgba(99,102,241,0.08)" : "transparent",
          transition: "background 0.2s",
        }}>
          <span style={{ color: s.dot, flexShrink: 0, marginTop: 1, fontSize: 10 }}>●</span>
          <span style={{ color: log.level === "OK" ? "#86efac" : log.level === "Warn" ? "#fcd34d" : "#fca5a5" }}>
            [{log.level}]
          </span>
          <span style={{ color: "#cbd5e1", flex: 1 }}>{log.message}</span>
        </div>
      );
    })}
  </div>
);

// ─── SimulationInput ──────────────────────────────────────────────────────────

export const SimulationInput = ({
  industries, onSimulate,
}: { industries: { name: string }[]; onSimulate: (scale: number) => void }) => {
  const [scale, setScale] = React.useState(1);
  const [hov, setHov] = React.useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
      <select
        value={scale}
        onChange={e => setScale(Number(e.target.value))}
        style={{
          padding: "8px 12px", borderRadius: 8,
          border: `1px solid ${T.border}`, background: T.surface,
          fontSize: 13, color: T.text1, fontFamily: T.font,
          outline: "none", cursor: "pointer",
        }}
      >
        {[1, 2, 5, 10, 20, 50].map(n => <option key={n} value={n}>{n}x scale</option>)}
      </select>
      <button
        onClick={() => onSimulate(scale)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          padding: "8px 18px", borderRadius: 8, border: "none",
          background: hov
            ? "linear-gradient(135deg, #818cf8, #6366f1)"
            : "linear-gradient(135deg, #6366f1, #4f46e5)",
          color: "#fff", fontWeight: 700, fontSize: 13,
          cursor: "pointer", transition: "all 0.2s ease",
          boxShadow: hov ? "0 4px 14px rgba(99,102,241,0.45)" : "0 2px 8px rgba(99,102,241,0.25)",
          fontFamily: T.font, letterSpacing: "-0.1px",
          transform: hov ? "translateY(-1px)" : "translateY(0)",
        }}
      >
        Run Simulation
      </button>
    </div>
  );
};
