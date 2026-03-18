// ─── LocalSyncIndicator ────────────────────────────────────────────────────────
//
// A calm, unobtrusive status pill that shows whether the local backend is
// reachable and when data was last synced. Lives at the bottom of the Sidebar.
//
// States:
//   checking  → faint pulse animation
//   online     → green dot · "Local · Synced"
//   offline    → amber dot · "Local · Cached"  (cached data still works)

import React, { useState } from "react";
import { useLocalBackendStatus } from "@/hooks/useLocalData";

interface Props {
  collapsed: boolean;
  onClick?: () => void;
}

function timeAgo(ts: number | null): string {
  if (!ts) return "never";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5)   return "just now";
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function LocalSyncIndicator({ collapsed, onClick }: Props) {
  const { online, checking, counts, syncStatus } = useLocalBackendStatus(30_000);
  const [showDetail, setShowDetail] = useState(false);

  const dotColor   = checking ? "#94a3b8" : online ? "#34C759" : "#f59e0b";
  const labelColor = checking ? "#64748b" : online ? "#34C759" : "#f59e0b";
  const bgColor    = checking
    ? "rgba(148,163,184,0.06)"
    : online
    ? "rgba(52,199,89,0.08)"
    : "rgba(245,158,11,0.08)";

  const label = checking ? "Checking…" : online ? "Local · Synced" : "Local · Cached";

  const totalRecords = counts
    ? Object.values(counts).reduce((a, b) => a + b, 0)
    : null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => { setShowDetail(d => !d); onClick?.(); }}
        className="w-full flex items-center gap-2 h-8 rounded-xl px-2 transition-all duration-200"
        style={{ background: bgColor, border: "none", cursor: "pointer" }}
        title={collapsed ? label : undefined}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
      >
        {/* Status dot */}
        <span className="relative flex-shrink-0 flex items-center justify-center w-5">
          <span
            style={{
              width: 7, height: 7, borderRadius: "50%", background: dotColor,
              display: "block", flexShrink: 0,
              boxShadow: online && !checking ? `0 0 5px ${dotColor}88` : "none",
              animation: checking ? "localPulse 1.4s ease-in-out infinite" : "none",
            }}
          />
        </span>

        {!collapsed && (
          <>
            <span
              className="text-[10px] font-semibold flex-1 text-left truncate"
              style={{ color: labelColor, letterSpacing: "-0.01em" }}
            >
              {label}
            </span>
            {totalRecords !== null && totalRecords > 0 && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: labelColor,
                background: bgColor, borderRadius: 4, padding: "1px 5px", flexShrink: 0,
              }}>
                {totalRecords}
              </span>
            )}
          </>
        )}
      </button>

      {/* Detail popover */}
      {showDetail && !collapsed && (
        <div
          style={{
            position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0,
            background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: "12px 14px", zIndex: 999,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
            🗄 Local Storage
          </div>

          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, display: "block", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: labelColor }}>
              {checking ? "Checking connection…" : online ? "Backend online" : "Running from cache"}
            </span>
          </div>

          {/* Last sync */}
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>
            Last sync: {timeAgo(syncStatus.lastSyncAt)}
          </div>

          {/* Record counts */}
          {counts && (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {Object.entries(counts).map(([key, count]) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "capitalize" }}>{key}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: count > 0 ? "#6366f1" : "#4f5a6e" }}>{count}</span>
                </div>
              ))}
            </div>
          )}

          {!online && (
            <div style={{
              marginTop: 8, fontSize: 10, color: "#f59e0b", lineHeight: 1.5,
              background: "rgba(245,158,11,0.08)", borderRadius: 6, padding: "5px 7px",
            }}>
              Start: <code style={{ fontSize: 9, color: "#fbbf24" }}>node backend/server.js</code>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes localPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
