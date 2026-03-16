import React, { useState } from "react";
import type { SimulationResult, SimulationImpact } from "@/engine/generators";

interface SimulationResultsProps {
  result: SimulationResult;
}

type ResultTab = "impacts" | "metrics" | "departments" | "timeline" | "recommendations";

const RISK_BADGE = {
  critical: { bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.40)",  text: "#fca5a5", label: "🔴 CRITICAL" },
  high:     { bg: "rgba(234,179,8,0.12)",   border: "rgba(234,179,8,0.35)",  text: "#fde047", label: "🟠 HIGH" },
  medium:   { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.30)", text: "#a5b4fc", label: "🟡 MEDIUM" },
  low:      { bg: "rgba(34,197,94,0.10)",   border: "rgba(34,197,94,0.28)",  text: "#86efac", label: "🟢 LOW" },
};

const SEV_COLORS: Record<SimulationImpact["severity"], string> = {
  critical: "#ef4444",
  high:     "#f59e0b",
  medium:   "#6366f1",
  low:      "#22c55e",
};

export function SimulationResults({ result }: SimulationResultsProps) {
  const [tab, setTab] = useState<ResultTab>("impacts");

  const rb = RISK_BADGE[result.overallRisk];

  const tabs: { id: ResultTab; label: string; icon: string }[] = [
    { id: "impacts",         label: "Impacts",        icon: "⚡" },
    { id: "metrics",         label: "Metrics",        icon: "📊" },
    { id: "departments",     label: "Departments",    icon: "🏢" },
    { id: "timeline",        label: "Timeline",       icon: "📅" },
    { id: "recommendations", label: "Actions",        icon: "✅" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Summary banner */}
      <div
        className="mx-4 mt-4 rounded-2xl p-4 flex-shrink-0"
        style={{ background: rb.bg, border: `1px solid ${rb.border}` }}
      >
        <div className="flex items-start gap-3">
          <div>
            <div className="text-[11px] font-bold mb-1" style={{ color: rb.text }}>{rb.label} RISK SCENARIO</div>
            <div className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.70)" }}>
              {result.summary}
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 px-4 pt-3 pb-0 flex-shrink-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap"
            style={{
              background: tab === t.id ? "rgba(168,85,247,0.18)" : "transparent",
              border: `1px solid ${tab === t.id ? "rgba(168,85,247,0.38)" : "rgba(255,255,255,0.08)"}`,
              color: tab === t.id ? "#d8b4fe" : "#64748b",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">

        {/* Impacts */}
        {tab === "impacts" && (
          <div className="space-y-2">
            {result.impacts.map((impact, i) => (
              <div
                key={i}
                className="rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${SEV_COLORS[impact.severity]}33` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: SEV_COLORS[impact.severity], boxShadow: `0 0 6px ${SEV_COLORS[impact.severity]}` }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-white">{impact.label}</span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                        style={{ background: `${SEV_COLORS[impact.severity]}22`, color: SEV_COLORS[impact.severity], border: `1px solid ${SEV_COLORS[impact.severity]}44` }}
                      >
                        {impact.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px]" style={{ color: "#86efac" }}>Before: {impact.before}</span>
                      <span className="text-[11px]" style={{ color: "rgba(148,163,184,0.5)" }}>→</span>
                      <span className="text-[11px]" style={{ color: "#fca5a5" }}>After: {impact.after}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Metrics */}
        {tab === "metrics" && (
          <div className="grid grid-cols-2 gap-2">
            {result.metrics.map((metric, i) => {
              const sc = metric.status === "good" ? "#22c55e" : metric.status === "warning" ? "#f59e0b" : "#ef4444";
              return (
                <div
                  key={i}
                  className="rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${sc}22` }}
                >
                  <div className="text-[10px] mb-1.5 leading-tight" style={{ color: "rgba(148,163,184,0.55)" }}>{metric.label}</div>
                  <div className="text-[16px] font-bold" style={{ color: sc }}>{metric.value}</div>
                  <div className="text-[9px] mt-1" style={{ color: "rgba(148,163,184,0.4)" }}>{metric.benchmark}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Departments */}
        {tab === "departments" && (
          <div className="space-y-2">
            {result.departmentEffects.map((dept, i) => {
              const sevColor = dept.severity === "Critical" ? "#ef4444" : dept.severity === "High" ? "#f59e0b" : "#6366f1";
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${sevColor}22` }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${sevColor}18` }}>
                    🏢
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-white">{dept.department}</span>
                      <span className="text-[9px] font-bold" style={{ color: sevColor }}>{dept.severity}</span>
                    </div>
                    <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "rgba(148,163,184,0.60)" }}>{dept.impact}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Timeline */}
        {tab === "timeline" && (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ background: "rgba(255,255,255,0.07)" }} />
            <div className="space-y-3">
              {result.timeline.map((event, i) => {
                const typeColor = { warning: "#f59e0b", critical: "#ef4444", info: "#6366f1", recovery: "#22c55e" }[event.type];
                return (
                  <div key={i} className="flex gap-4 items-start pl-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10"
                      style={{ background: `${typeColor}22`, border: `2px solid ${typeColor}`, boxShadow: `0 0 8px ${typeColor}44` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: typeColor }} />
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="text-[10px] font-bold mb-0.5" style={{ color: typeColor }}>Day {event.day}</div>
                      <p className="text-[11px] leading-relaxed" style={{ color: "rgba(148,163,184,0.70)" }}>{event.event}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {tab === "recommendations" && (
          <div className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-0.5"
                  style={{ background: "rgba(34,197,94,0.20)", color: "#86efac" }}
                >
                  {i + 1}
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{rec}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
