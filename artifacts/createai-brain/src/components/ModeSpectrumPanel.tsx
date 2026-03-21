/**
 * ModeSpectrumPanel.tsx — Platform Mode Spectrum
 *
 * Live-fetches all 25 platform modes from /api/modes.
 * Renders them grouped by layer with an animated active badge.
 * Apple/Linear aesthetic — light theme, indigo #6366f1 accent.
 * Fully self-contained — no external state dependencies.
 */

import React, { useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlatformMode {
  id:          string;
  tier:        number;
  name:        string;
  symbol:      string;
  layer:       string;
  description: string;
  active:      boolean;
  activatedAt: string;
}

interface ModeStats {
  total:          number;
  active:         number;
  byLayer:        Record<string, number>;
  highestTier:    string;
  spectrumStatus: string;
}

interface ModesResponse {
  ok:    boolean;
  modes: PlatformMode[];
  stats: ModeStats;
}

// ── Layer metadata ─────────────────────────────────────────────────────────────

const LAYER_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  BASE:          { label: "Base Layer",          color: "#6366f1", bg: "rgba(99,102,241,0.07)",  border: "rgba(99,102,241,0.18)" },
  PLATFORM:      { label: "Platform Layer",       color: "#0ea5e9", bg: "rgba(14,165,233,0.07)",  border: "rgba(14,165,233,0.18)" },
  TRANSCENDENT:  { label: "Transcendent Layer",   color: "#8b5cf6", bg: "rgba(139,92,246,0.07)",  border: "rgba(139,92,246,0.18)" },
  INFINITE:      { label: "Infinite Layer",       color: "#f59e0b", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.18)" },
  BEYOND:        { label: "Beyond Layer",         color: "#10b981", bg: "rgba(16,185,129,0.07)",  border: "rgba(16,185,129,0.18)" },
};

const LAYER_ORDER = ["BASE", "PLATFORM", "TRANSCENDENT", "INFINITE", "BEYOND"];

// ── Sub-components ────────────────────────────────────────────────────────────

function ModeBadge({ mode }: { mode: PlatformMode }) {
  const meta = LAYER_META[mode.layer] ?? LAYER_META["BASE"]!;

  return (
    <div
      title={mode.description}
      style={{
        display:       "flex",
        alignItems:    "flex-start",
        gap:           10,
        padding:       "10px 12px",
        borderRadius:  10,
        background:    meta.bg,
        border:        `1px solid ${meta.border}`,
        cursor:        "default",
        transition:    "box-shadow 0.15s ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 2px 12px ${meta.border}`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Symbol + Tier */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>{mode.symbol}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: meta.color, letterSpacing: "0.04em" }}>
          T{mode.tier}
        </span>
      </div>

      {/* Content */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
            {mode.name}
          </span>
          {mode.active && (
            <span style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           4,
              fontSize:      9,
              fontWeight:    700,
              letterSpacing: "0.06em",
              color:         "#10b981",
              background:    "rgba(16,185,129,0.10)",
              border:        "1px solid rgba(16,185,129,0.22)",
              borderRadius:  99,
              padding:       "1px 6px",
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "#10b981",
                animation: "modePulse 2s ease-in-out infinite",
              }} />
              ACTIVE
            </span>
          )}
        </div>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>
          {mode.description}
        </p>
      </div>
    </div>
  );
}

function LayerSection({ layer, modes }: { layer: string; modes: PlatformMode[] }) {
  const meta = LAYER_META[layer];
  if (!meta || modes.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Layer header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 1, background: meta.border }} />
        <span style={{
          fontSize:      10,
          fontWeight:    700,
          letterSpacing: "0.10em",
          color:         meta.color,
          textTransform: "uppercase",
          padding:       "2px 10px",
          background:    meta.bg,
          border:        `1px solid ${meta.border}`,
          borderRadius:  99,
        }}>
          {meta.label} · {modes.length} modes
        </span>
        <div style={{ flex: 1, height: 1, background: meta.border }} />
      </div>

      {/* Mode grid */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap:                 8,
      }}>
        {modes.map(mode => <ModeBadge key={mode.id} mode={mode} />)}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ModeSpectrumPanel() {
  const [data,    setData]    = useState<ModesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/modes")
      .then(r => r.json())
      .then((d: ModesResponse) => { setData(d); setError(""); })
      .catch(() => setError("Failed to load mode registry"))
      .finally(() => setLoading(false));
  }, []);

  const grouped = data
    ? LAYER_ORDER.reduce<Record<string, PlatformMode[]>>((acc, layer) => {
        acc[layer] = data.modes.filter(m => m.layer === layer);
        return acc;
      }, {})
    : {};

  return (
    <>
      {/* CSS for the pulse animation — injected once */}
      <style>{`
        @keyframes modePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>

      <div style={{
        background:   "#ffffff",
        border:       "1px solid rgba(0,0,0,0.07)",
        borderRadius: 16,
        boxShadow:    "0 1px 8px rgba(0,0,0,0.05)",
        overflow:     "hidden",
        marginTop:    24,
      }}>

        {/* ── Header ── */}
        <div style={{
          padding:        "18px 20px 14px",
          borderBottom:   "1px solid rgba(0,0,0,0.06)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          flexWrap:       "wrap",
          gap:            10,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>♾️</span>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
                Platform Mode Spectrum
              </h2>
              {data && (
                <span style={{
                  fontSize:      9,
                  fontWeight:    700,
                  letterSpacing: "0.08em",
                  color:         "#10b981",
                  background:    "rgba(16,185,129,0.10)",
                  border:        "1px solid rgba(16,185,129,0.22)",
                  borderRadius:  99,
                  padding:       "2px 8px",
                }}>
                  FULLY ACTIVE
                </span>
              )}
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>
              All {data?.stats.total ?? 25} modes active across 5 layers · Base Reality → ∞ Totality
            </p>
          </div>

          {/* Stats summary */}
          {data && (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {LAYER_ORDER.map(layer => {
                const meta = LAYER_META[layer]!;
                const count = data.stats.byLayer[layer] ?? 0;
                return (
                  <div key={layer} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: meta.color }}>{count}</div>
                    <div style={{ fontSize: 9, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {layer}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                  height: 56, borderRadius: 10,
                  background: "rgba(99,102,241,0.05)",
                  width: i % 2 === 0 ? "100%" : "80%",
                }} />
              ))}
            </div>
          )}

          {error && (
            <div style={{
              padding: "12px 16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              fontSize: 13,
              color: "#991b1b",
            }}>
              ⚠ {error}
            </div>
          )}

          {!loading && data && LAYER_ORDER.map(layer => (
            <LayerSection key={layer} layer={layer} modes={grouped[layer] ?? []} />
          ))}

          {/* Footer note */}
          {!loading && data && (
            <p style={{
              margin: "4px 0 0",
              fontSize: 11,
              color: "#94a3b8",
              textAlign: "center",
              letterSpacing: "0.02em",
            }}>
              Highest tier: <strong style={{ color: "#6366f1" }}>{data.stats.highestTier}</strong> · All modes unified under the Global Experience Engine
            </p>
          )}
        </div>
      </div>
    </>
  );
}
