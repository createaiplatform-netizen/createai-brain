import React from "react";
import { getIndustryConfig } from "@/engine/universeConfig";
import type { ScenarioConfig } from "@/engine/generators";
import type { PlatformFilters } from "@/engine/universeConfig";

interface ScenarioBuilderProps {
  filters: PlatformFilters;
  scenario: ScenarioConfig;
  onChange: (s: ScenarioConfig) => void;
  onRun: () => void;
  running: boolean;
}

function Slider({
  label, value, min, max, step, unit, color, onChange, description,
}: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; color: string; onChange: (v: number) => void; description: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-white">{label}</span>
        <span className="text-[12px] font-bold" style={{ color }}>
          {value}{unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all"
          style={{ width: `${((value - min) / (max - min)) * 100}%`, background: color }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 1 }}
        />
      </div>
      <p className="text-[10px]" style={{ color: "rgba(148,163,184,0.45)" }}>{description}</p>
    </div>
  );
}

export function ScenarioBuilder({ filters, scenario, onChange, onRun, running }: ScenarioBuilderProps) {
  const config = getIndustryConfig(filters.industry);

  const riskColor = scenario.riskLevel > 70 ? "#ef4444" : scenario.riskLevel > 45 ? "#f59e0b" : "#22c55e";
  const overallStress = Math.round((scenario.volumeLevel + scenario.riskLevel + scenario.staffingShortage) / 3);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(148,163,184,0.4)" }}>
          Scenario Configuration
        </div>
        <div className="text-[13px] font-bold text-white">{config.label} Simulation</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Scenario type */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(148,163,184,0.5)" }}>
            Scenario Type
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {config.scenarioTypes.map(type => (
              <button
                key={type}
                onClick={() => onChange({ ...scenario, type })}
                className="px-3 py-2 rounded-xl text-[11px] font-medium text-left transition-all"
                style={{
                  background: scenario.type === type ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${scenario.type === type ? "rgba(168,85,247,0.38)" : "rgba(255,255,255,0.08)"}`,
                  color: scenario.type === type ? "#d8b4fe" : "#64748b",
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <Slider
            label="Volume Level"
            value={scenario.volumeLevel}
            min={10} max={200} step={5}
            unit="%" color="#06b6d4"
            onChange={v => onChange({ ...scenario, volumeLevel: v })}
            description="Operational volume vs. normal baseline (100% = normal, 150% = 50% above normal)"
          />
          <Slider
            label="Risk Level"
            value={scenario.riskLevel}
            min={0} max={100} step={5}
            unit="%" color={riskColor}
            onChange={v => onChange({ ...scenario, riskLevel: v })}
            description="Compliance, quality, and error risk — higher values stress QA and audit systems"
          />
          <Slider
            label="Staffing Shortage"
            value={scenario.staffingShortage}
            min={0} max={80} step={5}
            unit="%" color="#f59e0b"
            onChange={v => onChange({ ...scenario, staffingShortage: v })}
            description="Percentage of staff unavailable — drives processing delays and workload distribution"
          />
          <Slider
            label="Timeframe"
            value={scenario.timeframeDays}
            min={1} max={90} step={1}
            unit=" days" color="#8b5cf6"
            onChange={v => onChange({ ...scenario, timeframeDays: v })}
            description="Scenario duration in days — affects cascade depth and recovery estimates"
          />
        </div>

        {/* Stress preview */}
        <div
          className="rounded-xl p-3"
          style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.20)" }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(216,180,254,0.6)" }}>
            Estimated Overall Stress
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, overallStress)}%`,
                  background: overallStress > 70 ? "#ef4444" : overallStress > 45 ? "#f59e0b" : "#22c55e",
                }}
              />
            </div>
            <span className="text-[14px] font-bold" style={{
              color: overallStress > 70 ? "#fca5a5" : overallStress > 45 ? "#fde047" : "#86efac",
            }}>
              {overallStress > 70 ? "CRITICAL" : overallStress > 45 ? "HIGH" : overallStress > 25 ? "MEDIUM" : "LOW"}
            </span>
          </div>
        </div>
      </div>

      {/* Run button */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0">
        <button
          onClick={onRun}
          disabled={!scenario.type || running}
          className="w-full py-3 rounded-xl text-white font-bold text-[13px] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: running ? "rgba(168,85,247,0.4)" : "linear-gradient(135deg,#7c3aed,#a855f7)" }}
        >
          {running ? (
            <>
              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "white", borderTopColor: "transparent" }} />
              Running Simulation…
            </>
          ) : (
            "⚡ Run Simulation →"
          )}
        </button>
      </div>
    </div>
  );
}
