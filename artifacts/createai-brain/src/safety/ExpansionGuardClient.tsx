// ═══════════════════════════════════════════════════════════════════════════
// EXPANSION GUARD CLIENT — Read-only UI for the ExpansionGuard safety layer.
//
// Displays the live execution trace, current call depth, and token estimates.
// ZERO enforcement logic — purely observational. Subscribes to guard events
// and renders state as it changes in real time.
//
// Usage:
//   import { ExpansionGuardClient } from "@/safety/ExpansionGuardClient";
//   <ExpansionGuardClient maxVisible={8} />
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { expansionGuard, type TraceEntry } from "@/core/ExpansionGuard";

// ─── Status badge colours ─────────────────────────────────────────────────────

const STATUS_STYLE: Record<TraceEntry["status"], { bg: string; text: string; label: string }> = {
  running: { bg: "#eff6ff", text: "#2563eb", label: "RUNNING"  },
  done:    { bg: "#f0fdf4", text: "#15803d", label: "DONE"     },
  blocked: { bg: "#fef2f2", text: "#dc2626", label: "BLOCKED"  },
};

// ─── Depth gauge bar ──────────────────────────────────────────────────────────

function DepthGauge({ depth, max = 4 }: { depth: number; max?: number }) {
  const pct   = Math.min(1, depth / max) * 100;
  const color = depth >= max ? "#dc2626" : depth >= max * 0.75 ? "#d97706" : "#6366f1";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#e2e8f0", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.3s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 28, textAlign: "right" }}>
        {depth}/{max}
      </span>
    </div>
  );
}

// ─── Trace row ────────────────────────────────────────────────────────────────

function TraceRow({ entry }: { entry: TraceEntry }) {
  const s   = STATUS_STYLE[entry.status];
  const ago = Math.floor((Date.now() - entry.startedAt) / 1000);
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px",
      borderBottom: "1px solid #f1f5f9", fontSize: 12,
    }}>
      <span style={{
        flexShrink: 0, padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700,
        background: s.bg, color: s.text, letterSpacing: "0.04em",
      }}>
        {s.label}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.engineId}
        </div>
        {entry.blockReason && (
          <div style={{ fontSize: 10, color: "#dc2626", marginTop: 2, wordBreak: "break-word" }}>
            {entry.blockReason}
          </div>
        )}
        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
          depth {entry.depth} · ~{entry.tokenEst.toLocaleString()} tokens · {ago}s ago
        </div>
      </div>
      <div style={{ flexShrink: 0, fontSize: 10, color: "#cbd5e1", fontFamily: "monospace" }}>
        {entry.executionId.slice(0, 8)}
      </div>
    </div>
  );
}

// ─── ExpansionGuardClient ─────────────────────────────────────────────────────

export interface ExpansionGuardClientProps {
  maxVisible?: number;  // max trace rows to show (default 8)
}

export function ExpansionGuardClient({ maxVisible = 8 }: ExpansionGuardClientProps) {
  const [trace, setTrace] = useState<TraceEntry[]>(() => expansionGuard.getTrace());
  const [depth, setDepth] = useState(() => expansionGuard.getDepth());

  useEffect(() => {
    const unsub = expansionGuard.subscribe((next) => {
      setTrace(next);
      setDepth(expansionGuard.getDepth());
    });
    return unsub;
  }, []);

  const visible   = trace.slice(0, maxVisible);
  const running   = trace.filter(e => e.status === "running").length;
  const blocked   = trace.filter(e => e.status === "blocked").length;
  const done      = trace.filter(e => e.status === "done").length;
  const hasEvents = trace.length > 0;

  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
      fontFamily: "system-ui, sans-serif", overflow: "hidden", minWidth: 280,
    }}>

      {/* Header */}
      <div style={{
        padding: "10px 14px", borderBottom: "1px solid #f1f5f9",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#f8fafc",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: running > 0 ? "#22c55e" : "#cbd5e1",
            boxShadow: running > 0 ? "0 0 0 3px #bbf7d0" : "none",
          }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", letterSpacing: "0.02em" }}>
            EXPANSION GUARD
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {running > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 6px", borderRadius: 4 }}>
              {running} RUNNING
            </span>
          )}
          {blocked > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", background: "#fef2f2", padding: "2px 6px", borderRadius: 4 }}>
              {blocked} BLOCKED
            </span>
          )}
        </div>
      </div>

      {/* Depth gauge */}
      <div style={{ padding: "8px 14px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Call Depth
        </div>
        <DepthGauge depth={depth} max={4} />
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        borderBottom: hasEvents ? "1px solid #f1f5f9" : "none",
      }}>
        {[
          { label: "Running", val: running, color: "#2563eb" },
          { label: "Done",    val: done,    color: "#15803d" },
          { label: "Blocked", val: blocked, color: "#dc2626" },
        ].map(s => (
          <div key={s.label} style={{ padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Trace list */}
      {hasEvents ? (
        <div>
          {visible.map(entry => <TraceRow key={entry.executionId} entry={entry} />)}
          {trace.length > maxVisible && (
            <div style={{ padding: "6px 14px", fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
              +{trace.length - maxVisible} older entries
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: "20px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🛡️</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>No executions yet</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
            Guard is active — engine calls will appear here
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpansionGuardClient;
