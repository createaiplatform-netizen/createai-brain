// ═══════════════════════════════════════════════════════════════════════════
// MODULE SHELL — Drop-in host for every app in CreateAI Brain.
//
// Before: showed a static description card and redirected users to BrainHub.
// Now:    runs the full WorkflowRunner pipeline so every app is immediately
//         functional — input → AI stream → review → save to vault.
//
// Props:
//   icon        — emoji icon
//   label       — app display name (also used to auto-resolve the engine)
//   color       — accent color CSS string
//   description — short description shown below the label in the header
//   engineId    — optional: override the auto-resolved engine
//   systemHint  — optional: extra context injected before user topic
// ═══════════════════════════════════════════════════════════════════════════

import React                         from "react";
import { useOS }                     from "@/os/OSContext";
import { WorkflowRunner }            from "@/workflows/WorkflowRunner";
import { resolveEngineId }           from "@/workflows/output_flow";
import { getExamples }               from "@/workflows/start_search";
import type { WorkflowConfig }       from "@/workflows/WorkflowEngine";

interface Props {
  icon:        string;
  label:       string;
  color:       string;
  description: string;
  engineId?:   string;
  systemHint?: string;
}

export function ModuleShell({ icon, label, color, description, engineId, systemHint }: Props) {
  const { openApp } = useOS();

  const resolvedEngineId = engineId ?? resolveEngineId(label);

  const config: WorkflowConfig = {
    engineId:    resolvedEngineId,
    engineLabel: label,
    color,
    icon,
    placeholder: `Describe what you want ${label} to generate…`,
    examples:    getExamples(label),
    systemHint,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: "hsl(220,20%,97%)" }}>

      {/* App header */}
      <div className="h-14 flex items-center px-4 gap-3 flex-shrink-0"
        style={{
          background:   "#fff",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          boxShadow:    "0 1px 3px rgba(0,0,0,0.04)",
        }}>
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: color + "18" }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-[15px] truncate" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
            {label}
          </h1>
          <p className="text-[10px] truncate mt-px" style={{ color: "#94a3b8" }}>{description}</p>
        </div>
        <button
          onClick={() => openApp("brainhub")}
          title="Open Brain Hub for advanced engine controls"
          className="text-[12px] font-semibold px-3 py-1.5 rounded-full flex-shrink-0 transition-all"
          style={{ background: "#6366f1", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.28)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#4f46e5")}
          onMouseLeave={e => (e.currentTarget.style.background = "#6366f1")}
        >
          🧠 Hub
        </button>
      </div>

      {/* Workflow pipeline */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <WorkflowRunner config={config} />
      </div>

    </div>
  );
}
