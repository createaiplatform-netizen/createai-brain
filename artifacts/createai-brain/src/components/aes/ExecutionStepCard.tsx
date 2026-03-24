import React, { useState } from "react";
import type { PlanStep, StepResult, StepSource } from "@/hooks/aes/useAutonomousExecution";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  card:    "rgba(255,255,255,0.04)",
  border:  "rgba(255,255,255,0.08)",
  borderA: "rgba(99,102,241,0.40)",
  text:    "#e2e8f0",
  sub:     "#94a3b8",
  dim:     "#64748b",
  indigo:  "#6366f1",
  green:   "#10b981",
  red:     "#ef4444",
  orange:  "#f59e0b",
  blue:    "#3b82f6",
  purple:  "#8b5cf6",
};

const SOURCE_META: Record<StepSource, { label: string; color: string; bg: string }> = {
  template:     { label: "Template",     color: T.blue,   bg: "rgba(59,130,246,0.12)"  },
  cache:        { label: "Cache",        color: T.purple, bg: "rgba(139,92,246,0.12)"  },
  deterministic:{ label: "Deterministic",color: T.green,  bg: "rgba(16,185,129,0.12)"  },
  ai:           { label: "AI",           color: T.orange, bg: "rgba(245,158,11,0.12)"  },
};

function capLabel(cap: string) {
  return cap.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function engineLabel(id: string) {
  return id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ── Status indicator ──────────────────────────────────────────────────────────

type StepStatus = "pending" | "running" | "success" | "failed";

function StatusDot({ status }: { status: StepStatus }) {
  const map: Record<StepStatus, string> = {
    pending: T.dim,
    running: T.indigo,
    success: T.green,
    failed:  T.red,
  };
  const color = map[status];
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: color, flexShrink: 0,
      boxShadow: status === "running" ? `0 0 6px ${color}` : undefined,
    }} />
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ExecutionStepCardProps {
  plan:    PlanStep;
  result?: StepResult;
  status:  StepStatus;
  index:   number;
  isLast:  boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExecutionStepCard({ plan, result, status, index, isLast }: ExecutionStepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const src = result ? SOURCE_META[result.source] : null;
  const isActive = status === "running";
  const isDone   = status === "success" || status === "failed";

  return (
    <div style={{ display: "flex", gap: 12, position: "relative" }}>
      {/* Connector line */}
      {!isLast && (
        <div style={{
          position: "absolute", left: 15, top: 32, bottom: -12,
          width: 2,
          background: isDone
            ? "rgba(99,102,241,0.25)"
            : "rgba(255,255,255,0.06)",
        }} />
      )}

      {/* Step number circle */}
      <div style={{
        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: isActive ? "#fff" : T.sub,
        background: isActive
          ? T.indigo
          : isDone
            ? (status === "success" ? "rgba(16,185,129,0.20)" : "rgba(239,68,68,0.20)")
            : "rgba(255,255,255,0.06)",
        border: `1.5px solid ${isActive ? T.indigo : isDone ? (status === "success" ? T.green : T.red) : "rgba(255,255,255,0.10)"}`,
        transition: "all 0.2s",
        zIndex: 1,
      }}>
        {isDone ? (status === "success" ? "\u2713" : "\u2717") : index + 1}
      </div>

      {/* Card */}
      <div style={{
        flex: 1, marginBottom: isLast ? 0 : 12,
        background: isActive ? "rgba(99,102,241,0.06)" : T.card,
        border: `1px solid ${isActive ? T.borderA : T.border}`,
        borderRadius: 10, padding: "10px 14px",
        transition: "border-color 0.2s, background 0.2s",
        cursor: isDone ? "pointer" : "default",
      }}
        onClick={() => isDone && setExpanded(e => !e)}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <StatusDot status={status} />
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text, flex: 1 }}>
            {plan.description}
          </span>
          {result && (
            <span style={{ fontSize: 10, color: T.dim }}>
              {result.durationMs}ms
            </span>
          )}
          {isDone && (
            <span style={{ fontSize: 10, color: T.dim }}>
              {expanded ? "\u25B4" : "\u25BE"}
            </span>
          )}
        </div>

        {/* Badges row */}
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
          {/* Capability */}
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", padding: "2px 7px", borderRadius: 4,
            background: "rgba(99,102,241,0.10)", color: T.indigo,
          }}>
            {capLabel(plan.capability)}
          </span>

          {/* Engine */}
          {result && (
            <span style={{
              fontSize: 9, padding: "2px 7px", borderRadius: 4,
              background: "rgba(255,255,255,0.06)", color: T.sub,
              fontWeight: 600, letterSpacing: "0.04em",
            }}>
              {"\u2699\uFE0F"} {engineLabel(result.engineUsed)}
            </span>
          )}

          {/* Source badge */}
          {src && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase", padding: "2px 7px", borderRadius: 4,
              background: src.bg, color: src.color,
            }}>
              {src.label}
            </span>
          )}

          {/* Fallback indicator */}
          {result?.fallbackUsed && (
            <span style={{
              fontSize: 9, padding: "2px 7px", borderRadius: 4,
              background: "rgba(245,158,11,0.10)", color: T.orange,
              fontWeight: 600,
            }}>
              \u21BA Fallback
            </span>
          )}

          {/* Parallel badge */}
          {plan.canParallel && (
            <span style={{
              fontSize: 9, padding: "2px 7px", borderRadius: 4,
              background: "rgba(255,255,255,0.04)", color: T.dim,
            }}>
              \u2261 Parallel
            </span>
          )}
        </div>

        {/* Expanded output */}
        {expanded && result?.output && (
          <div style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 7,
            background: "rgba(0,0,0,0.30)",
            border: "1px solid rgba(255,255,255,0.06)",
            fontSize: 12,
            color: T.sub,
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
            maxHeight: 300,
            overflowY: "auto",
          }}>
            {result.output}
          </div>
        )}
      </div>
    </div>
  );
}
