import React from "react";
import type { Tile } from "@/engine/generators";

interface TilesGridProps {
  tiles: Tile[];
  onSelect: (tile: Tile) => void;
  selectedId?: string;
}

const STATUS_CONFIG = {
  active:  { label: "Active",   bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.35)",  text: "#86efac", dot: "#22c55e" },
  pending: { label: "Pending",  bg: "rgba(234,179,8,0.15)",  border: "rgba(234,179,8,0.30)",  text: "#fde047", dot: "#eab308" },
  review:  { label: "Review",   bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.30)", text: "#a5b4fc", dot: "#6366f1" },
  blocked: { label: "Blocked",  bg: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.30)",  text: "#fca5a5", dot: "#ef4444" },
};

const PRIORITY_CONFIG = {
  high:   { label: "HIGH",   color: "#ef4444" },
  medium: { label: "MED",    color: "#f59e0b" },
  low:    { label: "LOW",    color: "#22c55e" },
};

function AiScoreRing({ score }: { score: number }) {
  const color = score > 80 ? "#22c55e" : score > 60 ? "#f59e0b" : "#6366f1";
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold"
        style={{
          background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
          boxShadow: `0 0 8px ${color}44`,
        }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ background: "rgba(14,18,42,0.90)", color }}
        >
          {score}
        </div>
      </div>
      <span className="text-[9px] mt-0.5" style={{ color: "rgba(148,163,184,0.5)" }}>AI</span>
    </div>
  );
}

export function TilesGrid({ tiles, onSelect, selectedId }: TilesGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 p-4">
      {tiles.map(tile => {
        const sc = STATUS_CONFIG[tile.status];
        const pc = PRIORITY_CONFIG[tile.priority];
        const isSelected = selectedId === tile.id;

        return (
          <button
            key={tile.id}
            onClick={() => onSelect(tile)}
            className="w-full text-left rounded-2xl p-4 transition-all group"
            style={{
              background: isSelected ? "rgba(99,102,241,0.14)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isSelected ? "rgba(99,102,241,0.45)" : "rgba(255,255,255,0.08)"}`,
              boxShadow: isSelected ? "0 0 20px rgba(99,102,241,0.15)" : "none",
            }}
            onMouseEnter={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.28)";
                (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.06)";
              }
            }}
            onMouseLeave={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
              }
            }}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: sc.bg, border: `1px solid ${sc.border}` }}
              >
                {tile.icon}
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold text-white truncate">{tile.title}</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ background: sc.dot }} />
                    {sc.label}
                  </span>
                  <span className="text-[9px] font-bold flex-shrink-0" style={{ color: pc.color }}>
                    {pc.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-[11px]" style={{ color: "rgba(148,163,184,0.55)" }}>
                    📦 {tile.count} active
                  </span>
                  <span className="text-[11px]" style={{ color: "rgba(148,163,184,0.55)" }}>
                    ⏱ avg {tile.avgTime}
                  </span>
                  <span className="text-[11px]" style={{ color: "rgba(148,163,184,0.55)" }}>
                    🏷 {tile.department}
                  </span>
                </div>
              </div>

              {/* AI Score */}
              <AiScoreRing score={tile.aiScore} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
