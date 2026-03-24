import React, { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowItem {
  id:       string;
  name:     string;
  trigger:  string;
  steps:    string[];
  engine:   string;
  priority: "high" | "medium" | "low";
}

interface DataModelField {
  name:        string;
  type:        string;
  required:    boolean;
  description: string;
}

interface DataModelItem {
  name:        string;
  description: string;
  fields:      DataModelField[];
  relations:   string[];
}

interface UniverseLayerItem {
  layer:     string;
  role:      string;
  binding:   string;
  activated: boolean;
}

interface EngineEntry {
  id:     string;
  label:  string;
  type:   string;
  status: string;
  domain: string;
  source: "vertical" | "world" | "intelligence" | "universe";
}

interface ScoreSnapshot {
  readiness:    number;
  completeness: number;
  stability:    number;
  integration:  number;
  performance:  number;
  security:     number;
  scalability:  number;
}

interface GeneratedProject {
  id:                    string;
  description:           string;
  projectName:           string;
  domain:                string;
  detectedVertical:      string | null;
  detectedVerticalLabel: string | null;
  detectedWorldEngines:  string[];
  intelligenceEngines:   string[];
  workflows:             WorkflowItem[];
  dataModels:            DataModelItem[];
  universeLayers:        UniverseLayerItem[];
  activationChain:       string[];
  recommendedNextSteps:  string[];
  engineRegistryEntries: EngineEntry[];
  scoringSnapshot:       ScoreSnapshot;
  generatedAt:           string;
  status:                "complete" | "partial" | "error";
  error?:                string;
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const SAGE      = "#7a9068";
const SAGE_BG   = "rgba(122,144,104,0.08)";
const SAGE_BD   = "rgba(122,144,104,0.18)";
const TEAL      = "#0d9488";
const TEAL_BG   = "rgba(13,148,136,0.08)";
const TEAL_BD   = "rgba(13,148,136,0.18)";
const PURPLE    = "#7c3aed";
const PURPLE_BG = "rgba(124,58,237,0.08)";
const GOLD      = "#b45309";
const GOLD_BG   = "rgba(180,83,9,0.08)";
const SLATE     = "#64748b";
const BORDER    = "rgba(0,0,0,0.08)";
const BG        = "#f8f9fa";
const CARD_BG   = "#ffffff";
const TEXT      = "#0f172a";
const TEXT_DIM  = "#64748b";

// ─── Priority badge ───────────────────────────────────────────────────────────

const PRIO_COLORS: Record<string, { bg: string; color: string }> = {
  high:   { bg: "rgba(239,68,68,0.09)",   color: "#b91c1c" },
  medium: { bg: "rgba(245,158,11,0.09)",  color: "#92400e" },
  low:    { bg: "rgba(100,116,139,0.09)", color: "#475569" },
};

function PriorityBadge({ p }: { p: string }) {
  const c = PRIO_COLORS[p] ?? PRIO_COLORS["low"];
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", padding: "2px 7px", borderRadius: 5,
      background: c.bg, color: c.color,
    }}>{p}</span>
  );
}

// ─── Source chip ──────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
  vertical:     { bg: TEAL_BG,   color: TEAL   },
  world:        { bg: PURPLE_BG, color: PURPLE  },
  intelligence: { bg: SAGE_BG,   color: SAGE    },
  universe:     { bg: GOLD_BG,   color: GOLD    },
};

function SourceChip({ s }: { s: string }) {
  const c = SOURCE_COLORS[s] ?? { bg: "rgba(0,0,0,0.05)", color: SLATE };
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", padding: "2px 7px", borderRadius: 5,
      background: c.bg, color: c.color, flexShrink: 0,
    }}>{s}</span>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, count, accent = SAGE }: { title: string; count?: number; accent?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase", color: accent }}>{title}</h3>
      {count !== undefined && (
        <span style={{ fontSize: 10, fontWeight: 700, color: accent,
          background: `${accent}18`, borderRadius: 10, padding: "1px 7px" }}>{count}</span>
      )}
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ children, accent, style }: { children: React.ReactNode; accent?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: CARD_BG,
      border: `1px solid ${accent ? `${accent}28` : BORDER}`,
      borderRadius: 12, padding: "18px 20px",
      ...style,
    }}>{children}</div>
  );
}

// ─── Activation chain display ─────────────────────────────────────────────────

function ActivationChain({ chain }: { chain: string[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0, marginTop: 4 }}>
      {chain.map((step, i) => {
        const short = step.replace(/Engine|Layer|forge|Manifest/gi, "").replace(/([A-Z])/g, " $1").trim();
        return (
          <React.Fragment key={step}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              minWidth: 72,
            }}>
              <div style={{
                width: 9, height: 9, borderRadius: "50%",
                background: i < 3 ? TEAL : i < 6 ? SAGE : SLATE,
                boxShadow: i < 3 ? `0 0 5px ${TEAL}50` : "none",
              }} />
              <span style={{
                fontSize: 8, color: TEXT_DIM, fontWeight: 600,
                letterSpacing: "0.03em", textAlign: "center",
                maxWidth: 68, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{short}</span>
            </div>
            {i < chain.length - 1 && (
              <div style={{ width: 14, height: 1, background: BORDER, flexShrink: 0, marginBottom: 12 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AutoProjectPage() {
  const [description, setDescription] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [project,     setProject]     = useState<GeneratedProject | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [expandedWf,  setExpandedWf]  = useState<string | null>(null);
  const [expandedDm,  setExpandedDm]  = useState<string | null>(null);

  async function handleGenerate() {
    if (!description.trim() || loading) return;
    setLoading(true);
    setError(null);
    setProject(null);
    try {
      const res = await fetch("/api/projects/auto-create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ description: description.trim() }),
      });
      const data = await res.json() as { ok?: boolean; project?: GeneratedProject; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setProject(data.project ?? null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT,
      fontFamily: "-apple-system, BlinkMacSystemFont, \u2018Segoe UI\u2019, system-ui, sans-serif",
      padding: "0 0 64px" }}>

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 20px" }}>

        {/* ── Header ── */}
        <div style={{ padding: "32px 0 24px", borderBottom: `1px solid ${BORDER}`, marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: SAGE_BG,
              border: `1px solid ${SAGE_BD}`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 18, flexShrink: 0,
            }}>&#9728;</div>
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>
                Auto Project Generator
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: TEXT_DIM, lineHeight: 1.5 }}>
                Describe any idea, goal, business, or domain. The orchestrator detects the correct engines,
                assigns universe layers, and returns a complete project structure.
              </p>
            </div>
          </div>
        </div>

        {/* ── Input ── */}
        <div style={{ marginBottom: 28 }}>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
            placeholder="Describe your project\u2026 e.g. \u201CA patient intake and scheduling system for a multi-location dental clinic\u201D or \u201CA fantasy world with ancient civilizations and a constructed language\u201D"
            rows={4}
            style={{
              width: "100%", boxSizing: "border-box",
              border: `1.5px solid ${BORDER}`, borderRadius: 12,
              padding: "14px 16px", fontSize: 14, lineHeight: 1.6,
              fontFamily: "inherit", color: TEXT, background: CARD_BG,
              resize: "vertical", outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = SAGE; }}
            onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = BORDER; }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
            <span style={{ fontSize: 11, color: TEXT_DIM }}>
              {description.length > 0 ? `${description.length} chars` : "Cmd/Ctrl + Enter to generate"}
            </span>
            <button
              onClick={handleGenerate}
              disabled={loading || !description.trim()}
              style={{
                padding: "10px 22px", borderRadius: 9, border: "none",
                background: loading || !description.trim()
                  ? "rgba(0,0,0,0.08)" : `linear-gradient(135deg, ${SAGE}, #5d7a52)`,
                color: loading || !description.trim() ? TEXT_DIM : "#fff",
                fontSize: 13, fontWeight: 700, cursor: loading || !description.trim() ? "default" : "pointer",
                transition: "all 0.15s",
              }}
            >
              {loading ? "Generating\u2026" : "Generate Project"}
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 10, marginBottom: 24,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)",
            fontSize: 13, color: "#b91c1c",
          }}>
            {error}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[80, 200, 160, 140].map((h, i) => (
              <div key={i} style={{
                height: h, borderRadius: 12,
                background: "linear-gradient(90deg, rgba(122,144,104,0.05) 0%, rgba(122,144,104,0.12) 50%, rgba(122,144,104,0.05) 100%)",
                backgroundSize: "200% 100%",
                animation: "cai-shimmer 1.8s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }} />
            ))}
            <style>{`@keyframes cai-shimmer{0%,100%{opacity:.55}50%{opacity:1}}`}</style>
          </div>
        )}

        {/* ── Generated Project ── */}
        {project && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ── Project identity banner ── */}
            <Card accent={TEAL}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase",
                      color: project.status === "complete" ? TEAL : GOLD,
                      background: project.status === "complete" ? TEAL_BG : GOLD_BG,
                      border: `1px solid ${project.status === "complete" ? TEAL_BD : "transparent"}`,
                      padding: "2px 8px", borderRadius: 5,
                    }}>{project.status}</span>
                    {project.detectedVerticalLabel && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: TEAL, background: TEAL_BG, padding: "2px 8px", borderRadius: 5, letterSpacing: "0.06em" }}>
                        {project.detectedVerticalLabel}
                      </span>
                    )}
                    {project.detectedWorldEngines.map(we => (
                      <span key={we} style={{ fontSize: 9, fontWeight: 700, color: PURPLE, background: PURPLE_BG, padding: "2px 8px", borderRadius: 5, letterSpacing: "0.06em" }}>
                        {we}
                      </span>
                    ))}
                  </div>
                  <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>
                    {project.projectName}
                  </h2>
                  <p style={{ margin: "0 0 2px", fontSize: 12, color: TEXT_DIM }}>{project.domain}</p>
                  <p style={{ margin: 0, fontSize: 11, color: TEXT_DIM }}>
                    ID: <code style={{ fontSize: 10, fontFamily: "monospace" }}>{project.id}</code>
                    &nbsp;&middot;&nbsp;Generated {new Date(project.generatedAt).toLocaleString()}
                  </p>
                </div>

                {/* Scoring snapshot */}
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
                  background: SAGE_BG, borderRadius: 10, padding: "12px 14px",
                  border: `1px solid ${SAGE_BD}`,
                }}>
                  {(["readiness","completeness","stability","integration","performance","security","scalability"] as const).map(k => (
                    project.scoringSnapshot[k] !== undefined && (
                      <div key={k} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: SAGE }}>{project.scoringSnapshot[k]}</div>
                        <div style={{ fontSize: 8, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.slice(0,5)}</div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {project.status === "partial" && project.error && (
                <p style={{ margin: "12px 0 0", fontSize: 11, color: GOLD, background: GOLD_BG, padding: "6px 10px", borderRadius: 7 }}>
                  AI generation partial \u2014 fallback structure used. Details: {project.error}
                </p>
              )}
            </Card>

            {/* ── Two-column layout ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* ── Workflows ── */}
              <Card accent={TEAL} style={{ gridColumn: "1 / -1" }}>
                <SectionHeader title="Workflows" count={project.workflows.length} accent={TEAL} />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {project.workflows.map(wf => {
                    const open = expandedWf === wf.id;
                    return (
                      <div key={wf.id} style={{
                        border: `1px solid ${open ? TEAL_BD : BORDER}`,
                        borderRadius: 10, overflow: "hidden",
                        transition: "border-color 0.15s",
                      }}>
                        <button
                          onClick={() => setExpandedWf(open ? null : wf.id)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center",
                            gap: 10, padding: "12px 14px",
                            background: open ? TEAL_BG : "transparent",
                            border: "none", cursor: "pointer", textAlign: "left",
                            transition: "background 0.12s",
                          }}
                        >
                          <span style={{ fontSize: 11, color: TEXT_DIM, flexShrink: 0 }}>{open ? "\u25bc" : "\u25b6"}</span>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: TEXT }}>{wf.name}</span>
                          <PriorityBadge p={wf.priority} />
                          <span style={{ fontSize: 10, color: TEXT_DIM, background: "rgba(0,0,0,0.05)", padding: "2px 8px", borderRadius: 5 }}>
                            {wf.engine}
                          </span>
                        </button>
                        {open && (
                          <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${BORDER}` }}>
                            <p style={{ margin: "10px 0 8px", fontSize: 11, color: TEXT_DIM }}>
                              <strong>Trigger:</strong> {wf.trigger}
                            </p>
                            <ol style={{ margin: 0, paddingLeft: 18 }}>
                              {wf.steps.map((step, i) => (
                                <li key={i} style={{ fontSize: 12, color: TEXT, lineHeight: 1.6, marginBottom: 3 }}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* ── Data Models ── */}
              <Card accent={PURPLE}>
                <SectionHeader title="Data Models" count={project.dataModels.length} accent={PURPLE} />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {project.dataModels.map(dm => {
                    const open = expandedDm === dm.name;
                    return (
                      <div key={dm.name} style={{
                        border: `1px solid ${open ? "rgba(124,58,237,0.22)" : BORDER}`,
                        borderRadius: 10, overflow: "hidden",
                      }}>
                        <button
                          onClick={() => setExpandedDm(open ? null : dm.name)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center",
                            gap: 10, padding: "11px 14px",
                            background: open ? PURPLE_BG : "transparent",
                            border: "none", cursor: "pointer", textAlign: "left",
                          }}
                        >
                          <span style={{ fontSize: 11, color: TEXT_DIM, flexShrink: 0 }}>{open ? "\u25bc" : "\u25b6"}</span>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: TEXT }}>{dm.name}</span>
                          <span style={{ fontSize: 10, color: TEXT_DIM }}>{dm.fields.length} fields</span>
                        </button>
                        {open && (
                          <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${BORDER}` }}>
                            <p style={{ margin: "10px 0 8px", fontSize: 12, color: TEXT_DIM }}>{dm.description}</p>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                              <thead>
                                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                                  {["field", "type", "req", "description"].map(h => (
                                    <th key={h} style={{ textAlign: "left", padding: "4px 6px", fontSize: 9,
                                      fontWeight: 700, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {dm.fields.map((f, i) => (
                                  <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                                    <td style={{ padding: "5px 6px", fontWeight: 600, color: TEXT }}>{f.name}</td>
                                    <td style={{ padding: "5px 6px", color: PURPLE, fontFamily: "monospace", fontSize: 10 }}>{f.type}</td>
                                    <td style={{ padding: "5px 6px", color: f.required ? TEAL : TEXT_DIM }}>
                                      {f.required ? "yes" : "no"}
                                    </td>
                                    <td style={{ padding: "5px 6px", color: TEXT_DIM }}>{f.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {dm.relations.length > 0 && (
                              <p style={{ margin: "8px 0 0", fontSize: 11, color: TEXT_DIM }}>
                                Relations: {dm.relations.join(", ")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* ── Universe Layers ── */}
              <Card accent={SAGE}>
                <SectionHeader title="Universe Layers" count={project.universeLayers.length} accent={SAGE} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {project.universeLayers.map(l => (
                    <div key={l.layer} style={{
                      display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px",
                      borderRadius: 8, background: l.activated ? SAGE_BG : "rgba(0,0,0,0.02)",
                      border: `1px solid ${l.activated ? SAGE_BD : BORDER}`,
                    }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: "50%", flexShrink: 0, marginTop: 4,
                        background: l.activated ? SAGE : SLATE,
                        boxShadow: l.activated ? `0 0 4px ${SAGE}60` : "none",
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>
                            {l.layer.replace(/Layer|Engine/g, "").replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <span style={{ fontSize: 9, color: TEXT_DIM, background: "rgba(0,0,0,0.05)",
                            padding: "1px 6px", borderRadius: 4 }}>{l.binding}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 10.5, color: TEXT_DIM, lineHeight: 1.4 }}>{l.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

            </div>

            {/* ── Activation Chain ── */}
            <Card accent={TEAL}>
              <SectionHeader title="Activation Chain" count={project.activationChain.length} accent={TEAL} />
              <div style={{
                overflowX: "auto", padding: "8px 0",
                scrollbarWidth: "none",
              }}>
                <ActivationChain chain={project.activationChain} />
              </div>
            </Card>

            {/* ── Engine Registry + Next Steps ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              <Card accent={GOLD}>
                <SectionHeader title="Engine Registry" count={project.engineRegistryEntries.length} accent={GOLD} />
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {project.engineRegistryEntries.map(e => (
                    <div key={e.id} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                      borderRadius: 7, background: "rgba(0,0,0,0.02)", border: `1px solid ${BORDER}`,
                    }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                        background: e.status === "active" ? TEAL : SLATE,
                      }} />
                      <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: TEXT }}>{e.label}</span>
                      <SourceChip s={e.source} />
                    </div>
                  ))}
                </div>
              </Card>

              <Card accent={SAGE}>
                <SectionHeader title="Recommended Next Steps" count={project.recommendedNextSteps.length} accent={SAGE} />
                <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                  {project.recommendedNextSteps.map((step, i) => (
                    <li key={i} style={{ fontSize: 12.5, color: TEXT, lineHeight: 1.55 }}>
                      {step}
                    </li>
                  ))}
                </ol>
              </Card>

            </div>

            {/* ── Intelligence engines ── */}
            <Card>
              <SectionHeader title="Intelligence Engines Active" count={project.intelligenceEngines.length} accent={SAGE} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {project.intelligenceEngines.map(e => (
                  <span key={e} style={{
                    fontSize: 11, fontWeight: 600, padding: "5px 12px",
                    borderRadius: 8, background: SAGE_BG, color: SAGE,
                    border: `1px solid ${SAGE_BD}`,
                  }}>{e}</span>
                ))}
              </div>
            </Card>

            {/* ── Generate another ── */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => { setProject(null); setDescription(""); setError(null); }}
                style={{
                  padding: "10px 24px", borderRadius: 9,
                  border: `1px solid ${SAGE_BD}`, background: SAGE_BG,
                  color: SAGE, fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                Generate another project
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
