import React from "react";
import type { Metric } from "@/engine/generators";

interface MetricsStripProps {
  metrics: Metric[];
}

const STATUS_COLORS = {
  good:     { bg: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.25)",  text: "#86efac", glow: "rgba(34,197,94,0.18)" },
  warning:  { bg: "rgba(234,179,8,0.10)",  border: "rgba(234,179,8,0.25)",  text: "#fde047", glow: "rgba(234,179,8,0.15)" },
  critical: { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.28)",  text: "#fca5a5", glow: "rgba(239,68,68,0.20)" },
};

const TREND_ICONS = { up: "↑", down: "↓", flat: "→" };
const TREND_COLORS = { up: "#86efac", down: "#fca5a5", flat: "#94a3b8" };

export function MetricsStrip({ metrics }: MetricsStripProps) {
  return (
    <div className="px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(148,163,184,0.4)" }}>
        Key Performance Indicators · All values illustrative
      </div>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map(metric => {
          const sc = STATUS_COLORS[metric.status];
          const trendColor = TREND_COLORS[metric.trend];
          return (
            <div
              key={metric.id}
              className="rounded-xl p-3 transition-all"
              style={{
                background: sc.bg,
                border: `1px solid ${sc.border}`,
                boxShadow: `inset 0 0 12px ${sc.glow}`,
              }}
            >
              <div className="text-[10px] font-medium mb-1.5 leading-tight" style={{ color: "rgba(148,163,184,0.65)" }}>
                {metric.label}
              </div>
              <div className="flex items-end gap-2">
                <span className="text-[18px] font-bold leading-none" style={{ color: sc.text }}>
                  {metric.value}
                </span>
                <span className="text-[11px] font-bold mb-0.5" style={{ color: trendColor }}>
                  {TREND_ICONS[metric.trend]}{metric.trendPct}%
                </span>
              </div>
              <div className="text-[9px] mt-1.5 leading-tight" style={{ color: "rgba(148,163,184,0.40)" }}>
                {metric.benchmark}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
