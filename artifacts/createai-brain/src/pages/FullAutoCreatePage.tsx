// ═══════════════════════════════════════════════════════════════════════════
// FullAutoCreatePage.tsx
// Hybrid-mode full system generator.
// Describe anything → platform assembles a complete system.
// Confirmation dialog → confirmation → execute → tabbed result view.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

// ── Types ────────────────────────────────────────────────────────────────────

interface FAWorkflow {
  name:    string;
  steps:   string[];
  engines: string[];
}
interface FAEntity {
  name:           string;
  description:    string;
  relatedTables?: string[];
}
interface FAUniverse {
  identities:      string[];
  layers:          string[];
  relationships:   string[];
  activationChain: string[];
  meaningThreads:  string[];
  narrativeHooks:  string[];
}
interface FARecommendations {
  nextSteps:     string[];
  focusArea?:    string;
  rationale?:    string;
  risks:         string[];
  opportunities: string[];
}
interface FAWorldBuilding {
  elements:    string[];
  timelines?:  string[];
  locations?:  string[];
  characters?: string[];
}
interface FAScoring {
  readiness: number; completeness: number; stability: number;
  integration: number; performance: number; security: number; scalability: number;
}
interface FullAutoProject {
  id:              string;
  title:           string;
  domain:          string[];
  description:     string;
  enginesUsed:     string[];
  universe:        FAUniverse;
  workflows:       FAWorkflow[];
  dataModel:       { entities: FAEntity[] };
  recommendations: FARecommendations;
  scoringSnapshot: FAScoring;
  worldBuilding?:  FAWorldBuilding;
  sandbox:         boolean;
  createdAt:       string;
}

// ── Modifier controls ─────────────────────────────────────────────────────────

const MODIFIERS = [
  { label: "Make it bigger",      modifier: "expand scope",                       icon: "⬆", color: "#6366f1" },
  { label: "Make it simpler",     modifier: "simplify",                           icon: "✂", color: "#64748b" },
  { label: "Add world-building",  modifier: "add world-building",                 icon: "🌍", color: "#7c3aed" },
  { label: "Add analytics",       modifier: "add analytics integration",          icon: "📊", color: "#0284c7" },
  { label: "Add family layer",    modifier: "add family system hooks",            icon: "👨‍👩‍👧", color: "#059669" },
  { label: "Add narrative",       modifier: "add narrative and meaning layers",   icon: "📖", color: "#d97706" },
];

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.round((value / 200) * 100));
  const col  = value >= 150 ? "#22c55e" : value >= 120 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
        <span>{label}</span><span style={{ fontWeight: 700, color: col }}>{value}</span>
      </div>
      <div style={{ height: 5, background: "rgba(0,0,0,0.07)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────────────

function Chip({ label, color = "#6366f1" }: { label: string; color?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600,
      background: `${color}15`, color, border: `1px solid ${color}28`,
      letterSpacing: "0.01em",
    }}>{label}</span>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

const TABS = ["Workflows", "Universe", "Data Model", "Recommendations", "World", "Scores"] as const;
type Tab = typeof TABS[number];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FullAutoCreatePage() {
  const [prompt,      setPrompt]      = useState("");
  const [sandbox,     setSandbox]     = useState(false);
  const [confirming,  setConfirming]  = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [project,     setProject]     = useState<FullAutoProject | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [activeTab,   setActiveTab]   = useState<Tab>("Workflows");
  const [lastModifier, setLastModifier] = useState<string | undefined>();

  // Step 1 — show confirmation dialog
  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setConfirming(true);
    setError(null);
  };

  // Step 2 — confirmed: call API
  const handleConfirm = useCallback(async (modifier?: string) => {
    setConfirming(false);
    setLoading(true);
    setError(null);
    setLastModifier(modifier);
    try {
      const res = await apiRequest("POST", "/api/system/full-auto-create", {
        prompt: prompt.trim(), sandbox, modifier,
      });
      const data = await res.json() as { ok: boolean; project: FullAutoProject; error?: string };
      if (!data.ok || !data.project) throw new Error(data.error ?? "Generation failed");
      setProject(data.project);
      setActiveTab("Workflows");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [prompt, sandbox]);

  // Re-generate with modifier
  const handleModifier = (modifier: string) => {
    handleConfirm(modifier);
  };

  return (
    <div style={{
      minHeight: "100%", background: "#050A18", color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "28px 24px 60px",
    }}>
      {/* Header */}
      <div style={{ maxWidth: 820, margin: "0 auto 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", margin: 0, letterSpacing: "-0.03em" }}>
            Full Auto Create
          </h1>
          <span style={{
            fontSize: 10, fontWeight: 700, background: "rgba(99,102,241,0.15)",
            color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: 6, padding: "2px 8px", letterSpacing: "0.04em",
          }}>POWERED BY ALL ENGINES + UNIVERSE OS</span>
        </div>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
          Describe anything. The platform assembles a complete system.
        </p>
      </div>

      {/* Input panel */}
      <div style={{ maxWidth: 820, margin: "0 auto 24px" }}>
        {sandbox && (
          <div style={{
            background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.3)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            fontSize: 12, color: "#fbbf24", display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>🧪</span>
            <span>Sandbox Mode — nothing here affects real systems.</span>
          </div>
        )}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 14, overflow: "hidden",
        }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe a system, business, universe, or product — be specific or be broad..."
            rows={5}
            style={{
              width: "100%", background: "transparent", border: "none", outline: "none",
              color: "#e2e8f0", fontSize: 14, padding: "18px 20px",
              resize: "none", lineHeight: 1.6, boxSizing: "border-box",
            }}
          />
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: "#94a3b8" }}>
              <input
                type="checkbox"
                checked={sandbox}
                onChange={e => setSandbox(e.target.checked)}
                style={{ accentColor: "#f59e0b" }}
              />
              Sandbox Mode
            </label>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || loading}
              style={{
                background: prompt.trim() && !loading ? "#6366f1" : "rgba(99,102,241,0.3)",
                color: "#fff", border: "none", borderRadius: 9, padding: "9px 22px",
                fontSize: 13, fontWeight: 700, cursor: prompt.trim() && !loading ? "pointer" : "not-allowed",
                transition: "background 0.15s",
              }}
            >
              {loading ? "Generating\u2026" : "Generate System"}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      {confirming && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#0F172A", border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: 18, padding: "36px 40px", maxWidth: 540, width: "90%",
            boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 16, textAlign: "center" }}>⚡</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0", margin: "0 0 12px", textAlign: "center" }}>
              Ready to generate?
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 20px", textAlign: "center", lineHeight: 1.6 }}>
              I can assemble and activate a complete system for this. Do you want me to generate it now?
            </p>
            <div style={{
              background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 10, padding: "12px 14px", marginBottom: 24,
              fontSize: 12, color: "#a5b4fc", lineHeight: 1.5,
            }}>
              &ldquo;{prompt.slice(0, 180)}{prompt.length > 180 ? "\u2026" : ""}&rdquo;
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirming(false)}
                style={{
                  flex: 1, background: "rgba(255,255,255,0.06)", color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.10)", borderRadius: 9,
                  padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >Cancel</button>
              <button
                onClick={() => handleConfirm()}
                style={{
                  flex: 2, background: "#6366f1", color: "#fff",
                  border: "none", borderRadius: 9,
                  padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >Yes, generate it now</button>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          maxWidth: 820, margin: "0 auto 20px",
          background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#fca5a5",
        }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center", padding: "60px 0" }}>
          <div style={{
            width: 48, height: 48, border: "3px solid rgba(99,102,241,0.2)",
            borderTop: "3px solid #6366f1", borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 0.9s linear infinite",
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>Assembling your complete system across all engines\u2026</p>
        </div>
      )}

      {/* Result */}
      {project && !loading && (
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {/* Project header */}
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 14, padding: "20px 22px", marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 800, color: "#e2e8f0", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
                  {project.title}
                </h2>
                <p style={{ fontSize: 12.5, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                  {project.description}
                </p>
              </div>
              {project.sandbox && (
                <span style={{
                  fontSize: 10, fontWeight: 700, background: "rgba(234,179,8,0.15)",
                  color: "#fbbf24", border: "1px solid rgba(234,179,8,0.3)",
                  borderRadius: 6, padding: "3px 8px", flexShrink: 0,
                }}>SANDBOX</span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
              {project.domain.map(d => <Chip key={d} label={d} color="#7c3aed" />)}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {project.enginesUsed.slice(0, 10).map(e => <Chip key={e} label={e} color="#0284c7" />)}
              {project.enginesUsed.length > 10 && (
                <Chip label={`+${project.enginesUsed.length - 10} more`} color="#64748b" />
              )}
            </div>
          </div>

          {/* Re-generate controls */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20,
          }}>
            {MODIFIERS.map(m => (
              <button
                key={m.modifier}
                onClick={() => handleModifier(m.modifier)}
                disabled={loading}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: `${m.color}12`, border: `1px solid ${m.color}28`,
                  color: m.color, borderRadius: 8, padding: "6px 12px",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <span>{m.icon}</span> {m.label}
                {lastModifier === m.modifier && (
                  <span style={{ fontSize: 9, background: m.color, color: "#fff", borderRadius: 4, padding: "1px 5px" }}>active</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab bar */}
          <div style={{
            display: "flex", gap: 2, borderBottom: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 20, overflowX: "auto",
          }}>
            {TABS.filter(t => t !== "World" || !!project.worldBuilding).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 16px", fontSize: 12, fontWeight: activeTab === tab ? 700 : 400,
                  color: activeTab === tab ? "#a5b4fc" : "#64748b",
                  borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent",
                  background: "transparent", border: "none", cursor: "pointer",
                  whiteSpace: "nowrap", transition: "color 0.12s",
                }}
              >{tab}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "20px 22px",
          }}>
            {/* Workflows */}
            {activeTab === "Workflows" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {project.workflows.map((wf, i) => (
                  <div key={i} style={{
                    background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)",
                    borderRadius: 10, padding: "14px 16px",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc", marginBottom: 10 }}>
                      {i + 1}. {wf.name}
                    </div>
                    <ol style={{ margin: "0 0 10px 18px", padding: 0, fontSize: 12.5, color: "#cbd5e1", lineHeight: 1.7 }}>
                      {wf.steps.map((s, j) => <li key={j}>{s}</li>)}
                    </ol>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {wf.engines.map(e => <Chip key={e} label={e} color="#6366f1" />)}
                    </div>
                  </div>
                ))}
                {project.workflows.length === 0 && (
                  <p style={{ color: "#64748b", fontSize: 13 }}>No workflows generated.</p>
                )}
              </div>
            )}

            {/* Universe */}
            {activeTab === "Universe" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  ["Identities",       project.universe.identities],
                  ["Layers",           project.universe.layers],
                  ["Relationships",    project.universe.relationships],
                  ["Activation Chain", project.universe.activationChain],
                  ["Meaning Threads",  project.universe.meaningThreads],
                  ["Narrative Hooks",  project.universe.narrativeHooks],
                ].map(([label, items]) => (
                  <div key={label as string}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>
                      {label as string}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {(items as string[]).map((it, i) => (
                        <Chip key={i} label={it} color="#7c3aed" />
                      ))}
                      {(items as string[]).length === 0 && (
                        <span style={{ fontSize: 12, color: "#475569" }}>None</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Data Model */}
            {activeTab === "Data Model" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {project.dataModel.entities.map((ent, i) => (
                  <div key={i} style={{
                    background: "rgba(5,150,105,0.07)", border: "1px solid rgba(5,150,105,0.2)",
                    borderRadius: 10, padding: "14px 16px",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#34d399", marginBottom: 5 }}>{ent.name}</div>
                    <div style={{ fontSize: 12.5, color: "#94a3b8", marginBottom: 8, lineHeight: 1.5 }}>{ent.description}</div>
                    {ent.relatedTables && ent.relatedTables.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {ent.relatedTables.map(t => <Chip key={t} label={t} color="#059669" />)}
                      </div>
                    )}
                  </div>
                ))}
                {project.dataModel.entities.length === 0 && (
                  <p style={{ color: "#64748b", fontSize: 13 }}>No entities generated.</p>
                )}
              </div>
            )}

            {/* Recommendations */}
            {activeTab === "Recommendations" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {project.recommendations.focusArea && (
                  <div style={{
                    background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)",
                    borderRadius: 10, padding: "14px 16px",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                      Focus Area
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fcd34d", marginBottom: 6 }}>
                      {project.recommendations.focusArea}
                    </div>
                    {project.recommendations.rationale && (
                      <div style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.6 }}>
                        {project.recommendations.rationale}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#a5b4fc", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                    Next Steps
                  </div>
                  <ol style={{ margin: "0 0 0 18px", padding: 0, fontSize: 12.5, color: "#cbd5e1", lineHeight: 1.8 }}>
                    {project.recommendations.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f87171", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Risks</div>
                    <ul style={{ margin: "0 0 0 14px", padding: 0, fontSize: 12.5, color: "#fca5a5", lineHeight: 1.7 }}>
                      {project.recommendations.risks.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#34d399", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Opportunities</div>
                    <ul style={{ margin: "0 0 0 14px", padding: 0, fontSize: 12.5, color: "#6ee7b7", lineHeight: 1.7 }}>
                      {project.recommendations.opportunities.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* World */}
            {activeTab === "World" && project.worldBuilding && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  ["Elements",   project.worldBuilding.elements],
                  ["Timelines",  project.worldBuilding.timelines ?? []],
                  ["Locations",  project.worldBuilding.locations ?? []],
                  ["Characters", project.worldBuilding.characters ?? []],
                ].map(([label, items]) => (
                  <div key={label as string}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>
                      {label as string}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {(items as string[]).map((it, i) => <Chip key={i} label={it} color="#d97706" />)}
                      {(items as string[]).length === 0 && (
                        <span style={{ fontSize: 12, color: "#475569" }}>None</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Scores */}
            {activeTab === "Scores" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                  Live platform scores at time of generation:
                </div>
                {Object.entries(project.scoringSnapshot).map(([key, val]) => (
                  <ScoreBar key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={val as number} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
