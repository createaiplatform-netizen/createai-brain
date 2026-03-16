import React, { useState } from "react";
import type { DrillContent, WorkflowStage } from "@/engine/generators";

interface DetailPanelProps {
  content: DrillContent;
  onClose: () => void;
}

const RISK_CONFIG = {
  low:    { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.28)",  text: "#86efac", label: "Low Risk" },
  medium: { bg: "rgba(234,179,8,0.12)",   border: "rgba(234,179,8,0.28)",  text: "#fde047", label: "Med Risk" },
  high:   { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.28)",  text: "#fca5a5", label: "High Risk" },
};

function StageCard({ stage, index }: { stage: WorkflowStage; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const rc = RISK_CONFIG[stage.risk];

  return (
    <div
      className="rounded-xl overflow-hidden transition-all cursor-pointer"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.08)` }}
      onClick={() => setExpanded(v => !v)}
    >
      <div className="flex items-center gap-3 p-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold flex-shrink-0"
          style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-white">{stage.name}</span>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}
            >
              {rc.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px]" style={{ color: "rgba(148,163,184,0.5)" }}>⏱ {stage.avgDuration}</span>
            <span className="text-[10px]" style={{ color: "rgba(148,163,184,0.5)" }}>👤 {stage.owner}</span>
          </div>
        </div>
        <div className="flex flex-col items-center flex-shrink-0">
          <span className="text-[10px] font-bold" style={{ color: stage.aiOpportunity > 75 ? "#22c55e" : "#f59e0b" }}>
            AI {stage.aiOpportunity}
          </span>
          <span className="text-[9px]" style={{ color: "rgba(148,163,184,0.4)" }}>score</span>
        </div>
        <span className="text-[11px] ml-1" style={{ color: "rgba(148,163,184,0.4)" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && (
        <div
          className="px-4 pb-3 pt-1 space-y-2 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(148,163,184,0.70)" }}>
            {stage.notes}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]" style={{ color: "rgba(148,163,184,0.5)" }}>📄 Document:</span>
              <span className="text-[10px] font-medium text-white">{stage.document}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type DetailTab = "stages" | "documents" | "roles" | "metrics";

export function DetailPanel({ content, onClose }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("stages");

  const tabs: { id: DetailTab; label: string; icon: string }[] = [
    { id: "stages",    label: "Stages",    icon: "⚙️" },
    { id: "documents", label: "Documents", icon: "📄" },
    { id: "roles",     label: "Roles",     icon: "👥" },
    { id: "metrics",   label: "Metrics",   icon: "📊" },
  ];

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{ background: "rgba(14,18,42,0.85)", border: "1px solid rgba(99,102,241,0.25)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.30)" }}
        >
          ⚙️
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-white truncate">{content.workflowName}</div>
          <div className="text-[10px]" style={{ color: "rgba(148,163,184,0.5)" }}>
            {content.stages.length} stages · {content.totalDuration} total
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)")}
        >
          ✕
        </button>
      </div>

      {/* Description */}
      <div className="px-4 py-3 flex-shrink-0">
        <p className="text-[12px] leading-relaxed" style={{ color: "rgba(148,163,184,0.65)" }}>
          {content.description}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pb-2 flex-shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: activeTab === t.id ? "rgba(99,102,241,0.18)" : "transparent",
              border: `1px solid ${activeTab === t.id ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.07)"}`,
              color: activeTab === t.id ? "#a5b4fc" : "#64748b",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === "stages" && (
          <div className="space-y-2">
            {content.stages.map((stage, i) => (
              <StageCard key={i} stage={stage} index={i} />
            ))}
            {content.relatedWorkflows.length > 0 && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(148,163,184,0.4)" }}>
                  Related Workflows
                </div>
                <div className="flex flex-wrap gap-2">
                  {content.relatedWorkflows.map(w => (
                    <span
                      key={w}
                      className="text-[11px] px-2.5 py-1 rounded-lg"
                      style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.18)", color: "#a5b4fc" }}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-2">
            {content.documents.map((doc, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span className="text-lg">📄</span>
                <div>
                  <div className="text-[12px] font-semibold text-white">{doc}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(148,163,184,0.5)" }}>
                    Auto-generated · Version controlled · Audit-ready
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "roles" && (
          <div className="space-y-2">
            {content.roles.map((role, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}
                >
                  👤
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-white">{role}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(148,163,184,0.5)" }}>
                    Stage owner · Approval authority · Escalation path
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "metrics" && (
          <div className="space-y-2">
            {content.metrics.map((metric, i) => {
              const statusColor = metric.status === "good" ? "#22c55e" : metric.status === "warning" ? "#f59e0b" : "#ef4444";
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div>
                    <div className="text-[12px] font-semibold text-white">{metric.label}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "rgba(148,163,184,0.5)" }}>{metric.benchmark}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-bold" style={{ color: statusColor }}>{metric.value}</div>
                    <div className="text-[10px]" style={{ color: metric.trend === "up" ? "#86efac" : metric.trend === "down" ? "#fca5a5" : "#94a3b8" }}>
                      {metric.trend === "up" ? "↑" : metric.trend === "down" ? "↓" : "→"} {metric.trendPct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
