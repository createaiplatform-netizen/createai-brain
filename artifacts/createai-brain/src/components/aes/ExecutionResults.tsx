import React from "react";
import type { OutcomeResponse, StepSource } from "@/hooks/aes/useAutonomousExecution";

const T = {
  text:   "#e2e8f0",
  sub:    "#94a3b8",
  dim:    "#64748b",
  green:  "#10b981",
  red:    "#ef4444",
  orange: "#f59e0b",
  indigo: "#6366f1",
  blue:   "#3b82f6",
  purple: "#8b5cf6",
  card:   "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
};

const SOURCE_COLORS: Record<StepSource, string> = {
  template:      T.blue,
  cache:         T.purple,
  deterministic: T.green,
  ai:            T.orange,
};

function StatChip({
  label, value, color,
}: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "10px 18px", borderRadius: 10,
      background: T.card, border: `1px solid ${T.border}`,
      minWidth: 80,
    }}>
      <span style={{
        fontSize: 20, fontWeight: 800,
        color: color ?? T.text, lineHeight: 1,
      }}>
        {value}
      </span>
      <span style={{ fontSize: 10, color: T.dim, marginTop: 4, textAlign: "center" }}>
        {label}
      </span>
    </div>
  );
}

function SourceBar({ results }: { results: OutcomeResponse["results"] }) {
  const counts: Record<StepSource, number> = {
    template: 0, cache: 0, deterministic: 0, ai: 0,
  };
  results.forEach(r => { counts[r.source] = (counts[r.source] ?? 0) + 1; });
  const total = results.length || 1;

  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ fontSize: 10, color: T.dim, fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase", margin: "0 0 8px" }}>
        Resolution Sources
      </p>
      {/* Bar */}
      <div style={{
        height: 8, borderRadius: 4, overflow: "hidden",
        display: "flex", background: "rgba(255,255,255,0.06)",
      }}>
        {(Object.entries(counts) as [StepSource, number][])
          .filter(([, c]) => c > 0)
          .map(([src, count]) => (
            <div key={src} style={{
              width: `${(count / total) * 100}%`,
              background: SOURCE_COLORS[src],
              transition: "width 0.4s",
            }} />
          ))}
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
        {(Object.entries(counts) as [StepSource, number][])
          .filter(([, c]) => c > 0)
          .map(([src, count]) => (
            <div key={src} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                background: SOURCE_COLORS[src],
                display: "inline-block",
              }} />
              <span style={{ fontSize: 10, color: T.sub }}>
                {src.charAt(0).toUpperCase() + src.slice(1)} ({count})
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

interface ExecutionResultsProps {
  result: OutcomeResponse;
}

export function ExecutionResults({ result }: ExecutionResultsProps) {
  const successCount = result.results.filter(r => r.success).length;
  const pct = result.results.length
    ? Math.round((successCount / result.results.length) * 100)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Success banner */}
      <div style={{
        padding: "12px 16px", borderRadius: 10,
        background: result.success
          ? "rgba(16,185,129,0.10)"
          : "rgba(239,68,68,0.08)",
        border: `1px solid ${result.success
          ? "rgba(16,185,129,0.25)"
          : "rgba(239,68,68,0.22)"}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>
          {result.success ? "\u2705" : "\u26A0\uFE0F"}
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700,
            color: result.success ? T.green : T.red }}>
            {result.success ? "Execution Succeeded" : "Execution Partially Completed"}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: T.sub }}>
            {result.summary}
          </p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 800,
          color: result.success ? T.green : T.orange,
          padding: "3px 8px", borderRadius: 6,
          background: result.success
            ? "rgba(16,185,129,0.10)"
            : "rgba(245,158,11,0.10)",
        }}>
          {pct}%
        </span>
      </div>

      {/* Stat chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <StatChip label="Steps" value={result.results.length} />
        <StatChip label="Succeeded"  value={successCount}        color={T.green}  />
        <StatChip label="AI Calls"   value={result.aiCallCount}  color={result.aiCallCount === 0 ? T.green : T.orange} />
        <StatChip label="Saved"      value={result.tokensSaved}  color={T.blue}   />
        <StatChip label="Total Time" value={`${result.totalMs}ms`} />
      </div>

      {/* Source breakdown */}
      <SourceBar results={result.results} />

      {/* Engines used */}
      <div>
        <p style={{ fontSize: 10, color: T.dim, fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", margin: "0 0 6px" }}>
          Engines Used
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {result.enginesUsed.map(e => (
            <span key={e} style={{
              fontSize: 11, padding: "3px 9px", borderRadius: 6,
              background: "rgba(99,102,241,0.10)",
              border: "1px solid rgba(99,102,241,0.20)",
              color: T.indigo, fontWeight: 600,
            }}>
              {e.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      </div>

      {/* Plan source */}
      <div style={{
        padding: "8px 12px", borderRadius: 7,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 11, color: T.dim }}>Plan generated via:</span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", padding: "2px 7px", borderRadius: 4,
          background: result.plan.source === "deterministic"
            ? "rgba(16,185,129,0.12)"
            : "rgba(245,158,11,0.12)",
          color: result.plan.source === "deterministic" ? T.green : T.orange,
        }}>
          {result.plan.source}
        </span>
        <span style={{ fontSize: 11, color: T.dim, marginLeft: "auto" }}>
          Plan ID: <code style={{ fontSize: 10, color: T.dim }}>{result.plan.planId}</code>
        </span>
      </div>

    </div>
  );
}
