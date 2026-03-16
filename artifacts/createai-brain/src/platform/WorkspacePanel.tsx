import React, { useState, useMemo } from "react";
import { generateTiles, generateMetrics, generateDrillContent, generateEntities, generateSimulationResult } from "@/engine/generators";
import type { Tile, ScenarioConfig } from "@/engine/generators";
import type { PlatformFilters, PlatformMode } from "@/engine/universeConfig";
import { TilesGrid } from "./components/TilesGrid";
import { DetailPanel } from "./components/DetailPanel";
import { MetricsStrip } from "./components/MetricsStrip";
import { ScenarioBuilder } from "./components/ScenarioBuilder";
import { SimulationResults } from "./components/SimulationResults";

type WorkspaceView = "workflows" | "metrics" | "entities";

interface WorkspacePanelProps {
  mode: PlatformMode;
  filters: PlatformFilters;
  onGuideCtxChange: (section: string, tileTitle?: string) => void;
}

const DEFAULT_SCENARIO: ScenarioConfig = {
  type: "",
  volumeLevel: 100,
  riskLevel: 30,
  staffingShortage: 10,
  timeframeDays: 14,
};

function ViewTab({ id, label, icon, active, onClick }: {
  id: string; label: string; icon: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
      style={{
        background: active ? "rgba(99,102,241,0.18)" : "transparent",
        border: `1px solid ${active ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.08)"}`,
        color: active ? "#a5b4fc" : "#64748b",
      }}
    >
      {icon} {label}
    </button>
  );
}

export function WorkspacePanel({ mode, filters, onGuideCtxChange }: WorkspacePanelProps) {
  const [view, setView] = useState<WorkspaceView>("workflows");
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [scenario, setScenario] = useState<ScenarioConfig>(DEFAULT_SCENARIO);
  const [simResult, setSimResult] = useState<ReturnType<typeof generateSimulationResult> | null>(null);
  const [simRunning, setSimRunning] = useState(false);

  const tiles = useMemo(() => generateTiles(filters, mode), [filters, mode]);
  const metrics = useMemo(() => generateMetrics(filters, mode), [filters, mode]);
  const entities = useMemo(() => generateEntities(filters, 14), [filters]);
  const drillContent = useMemo(
    () => selectedTile ? generateDrillContent(selectedTile, filters) : null,
    [selectedTile, filters],
  );

  const handleTileSelect = (tile: Tile) => {
    setSelectedTile(tile);
    onGuideCtxChange("detail", tile.title);
  };

  const handleRunSimulation = () => {
    if (!scenario.type) return;
    setSimRunning(true);
    setTimeout(() => {
      const result = generateSimulationResult(scenario, filters);
      setSimResult(result);
      setSimRunning(false);
      onGuideCtxChange("simulation");
    }, 1200);
  };

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    active:  { bg: "rgba(34,197,94,0.12)",   text: "#86efac" },
    pending: { bg: "rgba(234,179,8,0.12)",   text: "#fde047" },
    review:  { bg: "rgba(99,102,241,0.12)",  text: "#a5b4fc" },
    urgent:  { bg: "rgba(239,68,68,0.12)",   text: "#fca5a5" },
    closed:  { bg: "rgba(100,116,139,0.12)", text: "#94a3b8" },
  };

  // ── SIMULATION MODE ────────────────────────────────────────────────────────
  if (mode === "simulation") {
    return (
      <div className="flex h-full">
        {/* Left: scenario builder (280px) */}
        <div
          className="flex-shrink-0 h-full overflow-hidden"
          style={{ width: 260, borderRight: "1px solid rgba(255,255,255,0.07)" }}
        >
          <ScenarioBuilder
            filters={filters}
            scenario={scenario}
            onChange={setScenario}
            onRun={handleRunSimulation}
            running={simRunning}
          />
        </div>

        {/* Center: results */}
        <div className="flex-1 overflow-hidden">
          {simResult ? (
            <SimulationResults result={simResult} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
              {simRunning ? (
                <>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.30)" }}
                  >
                    <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "#a855f7", borderTopColor: "transparent" }} />
                  </div>
                  <p className="text-[13px]" style={{ color: "rgba(148,163,184,0.60)" }}>Running simulation…</p>
                  <p className="text-[11px]" style={{ color: "rgba(148,163,184,0.35)" }}>Calculating impacts, cascades, and recommendations</p>
                </>
              ) : (
                <>
                  <div className="text-5xl opacity-20">⚡</div>
                  <div className="space-y-2">
                    <div className="text-[15px] font-bold text-white">Simulation Engine Ready</div>
                    <p className="text-[12px]" style={{ color: "rgba(148,163,184,0.55)" }}>
                      Select a scenario type, configure the sliders,<br />and click Run Simulation to begin.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2 w-full max-w-sm">
                    {["High Volume", "Staff Shortage", "Compliance Audit", "System Outage"].map(s => (
                      <button
                        key={s}
                        onClick={() => setScenario(prev => ({ ...prev, type: s }))}
                        className="px-3 py-2 rounded-xl text-[11px] font-medium transition-all"
                        style={{ background: "rgba(168,85,247,0.10)", border: "1px solid rgba(168,85,247,0.22)", color: "#d8b4fe" }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── DEMO & TEST MODE ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* View switcher */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <ViewTab id="workflows" label="Workflows" icon="⚙️" active={view === "workflows"} onClick={() => { setView("workflows"); onGuideCtxChange("tiles"); }} />
        <ViewTab id="metrics" label="Metrics" icon="📊" active={view === "metrics"} onClick={() => { setView("metrics"); onGuideCtxChange("metrics"); }} />
        <ViewTab id="entities" label="Entities" icon="👥" active={view === "entities"} onClick={() => { setView("entities"); onGuideCtxChange("tiles"); }} />
        <div className="flex-1" />
        <span className="text-[10px] px-2" style={{ color: "rgba(148,163,184,0.35)" }}>
          {tiles.length} workflows · {metrics.length} KPIs · {entities.length} entities
        </span>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden flex">

        {/* Main content */}
        <div className={`overflow-y-auto ${selectedTile && view === "workflows" ? "w-1/2" : "w-full"} transition-all`}>
          {view === "workflows" && (
            <TilesGrid tiles={tiles} onSelect={handleTileSelect} selectedId={selectedTile?.id} />
          )}
          {view === "metrics" && (
            <MetricsStrip metrics={metrics} />
          )}
          {view === "entities" && (
            <div className="p-4 space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(148,163,184,0.40)" }}>
                Active Entities · Illustrative demo data
              </div>
              {entities.map(entity => {
                const sc = STATUS_COLORS[entity.status] || STATUS_COLORS.active;
                return (
                  <div
                    key={entity.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                      style={{ background: sc.bg }}
                    >
                      {entity.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-white truncate">{entity.name}</span>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 uppercase"
                          style={{ background: sc.bg, color: sc.text }}
                        >
                          {entity.status}
                        </span>
                      </div>
                      <div className="text-[10px] mt-0.5 flex gap-3" style={{ color: "rgba(148,163,184,0.50)" }}>
                        <span>{entity.role}</span>
                        <span>→ {entity.assignedTo}</span>
                        <span>{entity.lastUpdate}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div
                        className="text-[10px] font-bold"
                        style={{ color: entity.priority === "high" ? "#ef4444" : entity.priority === "medium" ? "#f59e0b" : "#22c55e" }}
                      >
                        {entity.priority.toUpperCase()}
                      </div>
                      <div className="w-16 h-1.5 rounded-full mt-1" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${entity.progress}%`, background: "#6366f1" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedTile && drillContent && view === "workflows" && (
          <div className="w-1/2 border-l h-full overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <DetailPanel content={drillContent} onClose={() => { setSelectedTile(null); onGuideCtxChange("tiles"); }} />
          </div>
        )}
      </div>
    </div>
  );
}
