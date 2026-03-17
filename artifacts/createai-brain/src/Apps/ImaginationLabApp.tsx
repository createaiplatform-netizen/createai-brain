// ═══════════════════════════════════════════════════════════════════════════
// IMAGINATION LAB — Creative Engine Hub
// 11 fiction, story, and world-building engines. All content is fictional,
// safe, family-friendly, and purely imaginative.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  IMAGINATION_ENGINES, IMAGINATION_SERIES,
  type ImaginationEngineDefinition, type ImaginationSeriesDefinition,
  runImaginationEngine, runImaginationSeries,
} from "@/engine/ImaginationEngine";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ImaginationSession {
  id: number;
  userId: string;
  engineId: string;
  engineName: string;
  topic: string;
  output: string;
  title: string | null;
  tags: string | null;
  isStarred: boolean;
  createdAt: string;
}

type Tab = "engines" | "sessions" | "series";

// ─── Design Tokens ─────────────────────────────────────────────────────────

const INDIGO    = "#6366f1";
const VIOLET    = "#8b5cf6";
const SURFACE   = "rgba(255,255,255,0.90)";
const BORDER    = "rgba(0,0,0,0.07)";

// ─── Safety Notice ──────────────────────────────────────────────────────────

function SafetyBadge() {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: "#f0fdf4", border: "1px solid #bbf7d0",
      borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#15803d", fontWeight: 600,
    }}>
      🛡️ Safe · Family-friendly · Fictional content only
    </div>
  );
}

// ─── Engine Card ────────────────────────────────────────────────────────────

function EngineCard({
  engine, onClick,
}: {
  engine: ImaginationEngineDefinition;
  onClick: (e: ImaginationEngineDefinition) => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onClick(engine)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${engine.color}10` : SURFACE,
        border: `1.5px solid ${hov ? engine.color + "50" : BORDER}`,
        borderRadius: 16, padding: "18px 18px 16px",
        cursor: "pointer", transition: "all 0.18s",
        boxShadow: hov ? `0 6px 24px ${engine.color}20` : "0 2px 8px rgba(0,0,0,0.04)",
        display: "flex", flexDirection: "column", gap: 8,
        transform: hov ? "translateY(-2px)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0,
          background: engine.gradient, boxShadow: `0 4px 12px ${engine.color}40`,
        }}>
          {engine.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>
            {engine.name}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: engine.color, marginTop: 1 }}>
            {engine.tagline}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
        {engine.description}
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 5, marginTop: 2,
        fontSize: 11, fontWeight: 700, color: engine.color,
      }}>
        Run Engine <span style={{ fontSize: 14 }}>→</span>
      </div>
    </div>
  );
}

// ─── Run Panel ──────────────────────────────────────────────────────────────

function RunPanel({
  engine, onClose, onSave,
}: {
  engine: ImaginationEngineDefinition;
  onClose: () => void;
  onSave: (session: { engineId: string; engineName: string; topic: string; output: string }) => Promise<void>;
}) {
  const [topic, setTopic]   = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  async function run() {
    if (!topic.trim()) return;
    setOutput("");
    setSaved(false);
    setRunning(true);
    await runImaginationEngine({
      engineId:   engine.id,
      engineName: engine.name,
      topic,
      onChunk: text => setOutput(t => t + text),
      onDone:  () => setRunning(false),
      onError: () => setRunning(false),
    });
  }

  async function save() {
    if (!output.trim()) return;
    setSaving(true);
    await onSave({ engineId: engine.id, engineName: engine.name, topic, output });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "24px 16px", overflowY: "auto",
    }}>
      <div style={{
        width: "100%", maxWidth: 720, background: "white",
        borderRadius: 20, overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
      }}>
        {/* Header */}
        <div style={{
          background: engine.gradient, padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{engine.icon}</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
                {engine.name}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.80)", marginTop: 1 }}>
                {engine.tagline} · Fictional content only
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.20)", border: "none",
              cursor: "pointer", fontSize: 16, color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
              {engine.placeholder}
            </label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder={engine.example}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 12,
                border: `1.5px solid ${BORDER}`, background: "#f8fafc",
                fontSize: 13, color: "#0f172a", outline: "none",
                resize: "vertical", minHeight: 80, lineHeight: 1.6,
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            onClick={run}
            disabled={running || !topic.trim()}
            style={{
              padding: "12px 24px", borderRadius: 12, border: "none",
              background: running ? `${engine.color}40` : engine.gradient,
              color: running ? engine.color : "white",
              fontWeight: 800, fontSize: 13, cursor: running || !topic.trim() ? "not-allowed" : "pointer",
              alignSelf: "flex-start", boxShadow: running ? "none" : `0 4px 16px ${engine.color}40`,
              transition: "all 0.15s",
            }}
          >
            {running ? `⟳ ${engine.name} is creating…` : `✨ Run ${engine.name}`}
          </button>

          {output && (
            <div style={{ background: "#f8faff", border: `1px solid ${engine.color}25`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{
                padding: "10px 16px", background: `${engine.color}10`,
                borderBottom: `1px solid ${engine.color}20`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: engine.color }}>
                  {running ? `⟳ ${engine.name} creating…` : `✅ Complete`}
                </span>
                {!running && !saved && (
                  <button
                    onClick={save}
                    disabled={saving}
                    style={{
                      padding: "5px 14px", borderRadius: 8, border: "none",
                      background: "#10b981", color: "white", fontWeight: 700,
                      fontSize: 11, cursor: saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? "Saving…" : "💾 Save Session"}
                  </button>
                )}
                {saved && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>✅ Saved!</span>
                )}
              </div>
              <div
                ref={outputRef}
                style={{
                  padding: "16px 18px", fontSize: 13, color: "#0f172a",
                  lineHeight: 1.75, whiteSpace: "pre-wrap", maxHeight: 460, overflowY: "auto",
                }}
              >
                {output}
              </div>
            </div>
          )}

          {!output && !running && (
            <div style={{
              textAlign: "center", padding: "28px 20px",
              border: `2px dashed ${BORDER}`, borderRadius: 12,
              color: "#94a3b8", fontSize: 12,
            }}>
              Enter your creative brief above and run the engine to generate your fictional content.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Series Card ────────────────────────────────────────────────────────────

function SeriesCard({
  series, onRun,
}: {
  series: ImaginationSeriesDefinition;
  onRun: (s: ImaginationSeriesDefinition) => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: SURFACE, border: `1.5px solid ${hov ? "rgba(139,92,246,0.40)" : BORDER}`,
        borderRadius: 18, overflow: "hidden",
        boxShadow: hov ? "0 8px 32px rgba(139,92,246,0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
        transform: hov ? "translateY(-2px)" : "none",
        transition: "all 0.18s",
      }}
    >
      <div style={{
        background: series.gradient, padding: "20px 22px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontSize: 28 }}>{series.icon}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
            {series.name}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.80)", marginTop: 2 }}>
            {series.engines.length} engines · ~{series.estimatedMinutes} min
          </div>
        </div>
      </div>
      <div style={{ padding: "16px 22px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.65 }}>
          {series.description}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {series.engines.map(eid => {
            const eng = IMAGINATION_ENGINES.find(e => e.id === eid);
            return eng ? (
              <span key={eid} style={{
                fontSize: 10, fontWeight: 600,
                background: `${eng.color}12`, color: eng.color,
                borderRadius: 6, padding: "3px 8px",
                border: `1px solid ${eng.color}25`,
              }}>{eng.icon} {eng.name}</span>
            ) : null;
          })}
        </div>
        <button
          onClick={() => onRun(series)}
          style={{
            padding: "10px 18px", borderRadius: 12, border: "none",
            background: series.gradient, color: "white", fontWeight: 800,
            fontSize: 12, cursor: "pointer", alignSelf: "flex-start",
            boxShadow: "0 4px 12px rgba(139,92,246,0.30)", transition: "all 0.15s",
          }}
        >
          ✨ Run Series
        </button>
      </div>
    </div>
  );
}

// ─── Series Run Panel ────────────────────────────────────────────────────────

function SeriesRunPanel({
  series, onClose, onSave,
}: {
  series: ImaginationSeriesDefinition;
  onClose: () => void;
  onSave: (session: { engineId: string; engineName: string; topic: string; output: string }) => Promise<void>;
}) {
  const [topic, setTopic]           = useState("");
  const [output, setOutput]         = useState("");
  const [running, setRunning]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [activeEng, setActiveEng]   = useState<string>("");
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  async function run() {
    if (!topic.trim()) return;
    setOutput("");
    setSaved(false);
    setRunning(true);
    await runImaginationSeries({
      seriesId: series.id,
      topic,
      onSectionStart: (eid) => {
        setActiveEng(eid);
        const eng = IMAGINATION_ENGINES.find(e => e.id === eid);
        setOutput(t => t + `\n\n${"═".repeat(60)}\n${eng?.icon ?? "✨"} ${eng?.name ?? eid}\n${"═".repeat(60)}\n\n`);
      },
      onChunk:      text => setOutput(t => t + text),
      onSectionEnd: ()   => setActiveEng(""),
      onDone:       ()   => { setRunning(false); setActiveEng(""); },
      onError:      ()   => { setRunning(false); setActiveEng(""); },
    });
  }

  async function save() {
    if (!output.trim()) return;
    setSaving(true);
    await onSave({ engineId: series.id, engineName: series.name, topic, output });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "24px 16px", overflowY: "auto",
    }}>
      <div style={{ width: "100%", maxWidth: 780, background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>
        <div style={{ background: series.gradient, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 26 }}>{series.icon}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "white" }}>{series.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.80)" }}>Sequential creative series · {series.engines.length} engines</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.20)", border: "none", cursor: "pointer", fontSize: 16, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {series.engines.map((eid, i) => {
              const eng = IMAGINATION_ENGINES.find(e => e.id === eid);
              const isActive = activeEng === eid;
              return (
                <div key={eid} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                  background: isActive ? `${eng?.color}20` : "#f8fafc",
                  border: `1px solid ${isActive ? eng?.color + "40" : BORDER}`,
                  color: isActive ? eng?.color : "#94a3b8",
                  transition: "all 0.2s",
                }}>
                  {i + 1}. {eng?.icon} {eng?.name ?? eid}
                  {isActive && <span style={{ animation: "pulse 1s infinite" }}>⟳</span>}
                </div>
              );
            })}
          </div>

          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="What creative topic should this series explore? e.g. A steampunk world where dreams are a currency"
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 12,
              border: `1.5px solid ${BORDER}`, background: "#f8fafc",
              fontSize: 13, color: "#0f172a", outline: "none",
              resize: "vertical", minHeight: 80, lineHeight: 1.6, boxSizing: "border-box",
            }}
          />

          <button
            onClick={run}
            disabled={running || !topic.trim()}
            style={{
              padding: "12px 24px", borderRadius: 12, border: "none",
              background: running ? "rgba(139,92,246,0.15)" : series.gradient,
              color: running ? VIOLET : "white",
              fontWeight: 800, fontSize: 13, cursor: running || !topic.trim() ? "not-allowed" : "pointer",
              alignSelf: "flex-start", boxShadow: running ? "none" : "0 4px 16px rgba(139,92,246,0.35)",
            }}
          >
            {running ? `⟳ Running ${series.name}…` : `✨ Run ${series.name}`}
          </button>

          {output && (
            <div style={{ background: "#f8faff", border: "1px solid rgba(139,92,246,0.20)", borderRadius: 14, overflow: "hidden" }}>
              <div style={{
                padding: "10px 16px", background: "rgba(139,92,246,0.08)",
                borderBottom: "1px solid rgba(139,92,246,0.15)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: VIOLET }}>
                  {running ? "⟳ Series running…" : "✅ Series complete"}
                </span>
                {!running && !saved && (
                  <button onClick={save} disabled={saving}
                    style={{ padding: "5px 14px", borderRadius: 8, border: "none", background: "#10b981", color: "white", fontWeight: 700, fontSize: 11, cursor: saving ? "not-allowed" : "pointer" }}>
                    {saving ? "Saving…" : "💾 Save Session"}
                  </button>
                )}
                {saved && <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>✅ Saved!</span>}
              </div>
              <div ref={outputRef}
                style={{ padding: "16px 18px", fontSize: 13, color: "#0f172a", lineHeight: 1.75, whiteSpace: "pre-wrap", maxHeight: 500, overflowY: "auto" }}>
                {output}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sessions Tab ────────────────────────────────────────────────────────────

function SessionsTab({
  sessions, onToggleStar, onDelete, onView,
}: {
  sessions: ImaginationSession[];
  onToggleStar: (id: number, val: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onView: (session: ImaginationSession) => void;
}) {
  if (sessions.length === 0) {
    return (
      <div style={{
        textAlign: "center", padding: "52px 24px",
        border: `2px dashed ${BORDER}`, borderRadius: 16, color: "#94a3b8",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontSize: 44 }}>✨</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>No creative sessions yet</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Run an engine, then save your output to build your creative library</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sessions.map(s => {
        const eng = IMAGINATION_ENGINES.find(e => e.id === s.engineId);
        return (
          <div key={s.id} style={{
            background: SURFACE, border: `1px solid ${BORDER}`,
            borderRadius: 14, padding: "14px 18px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0, fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: eng ? eng.gradient : "linear-gradient(135deg, #8b5cf6, #6366f1)",
            }}>
              {eng?.icon ?? "✨"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    {s.title ?? s.topic.slice(0, 60) + (s.topic.length > 60 ? "…" : "")}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    {eng?.name ?? s.engineName} · {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => onToggleStar(s.id, !s.isStarred)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: 2 }}>
                    {s.isStarred ? "⭐" : "☆"}
                  </button>
                  <button onClick={() => onView(s)}
                    style={{
                      padding: "4px 10px", borderRadius: 7, border: `1px solid ${BORDER}`,
                      background: "white", cursor: "pointer", fontSize: 11, fontWeight: 600, color: INDIGO,
                    }}>
                    View
                  </button>
                  <button onClick={() => onDelete(s.id)}
                    style={{
                      padding: "4px 8px", borderRadius: 7, border: "1px solid #fecaca",
                      background: "#fff5f5", cursor: "pointer", fontSize: 11, color: "#ef4444",
                    }}>
                    ✕
                  </button>
                </div>
              </div>
              <div style={{
                marginTop: 6, fontSize: 11, color: "#94a3b8",
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                overflow: "hidden", lineHeight: 1.5,
              }}>
                {s.output.slice(0, 180)}…
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Session Viewer ──────────────────────────────────────────────────────────

function SessionViewer({
  session, onClose,
}: {
  session: ImaginationSession;
  onClose: () => void;
}) {
  const eng = IMAGINATION_ENGINES.find(e => e.id === session.engineId);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "24px 16px", overflowY: "auto",
    }}>
      <div style={{ width: "100%", maxWidth: 740, background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>
        <div style={{
          background: eng?.gradient ?? "linear-gradient(135deg, #8b5cf6, #6366f1)",
          padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 24 }}>{eng?.icon ?? "✨"}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>{eng?.name ?? session.engineName}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.80)", marginTop: 1 }}>
                {new Date(session.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.20)", border: "none", cursor: "pointer", fontSize: 16, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: "#64748b", padding: "10px 14px",
            background: "#f8fafc", borderRadius: 10, border: `1px solid ${BORDER}`,
          }}>
            📝 {session.topic}
          </div>
          <div style={{
            fontSize: 13, color: "#0f172a", lineHeight: 1.75, whiteSpace: "pre-wrap",
            maxHeight: 520, overflowY: "auto", padding: "4px 2px",
          }}>
            {session.output}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────

export function ImaginationLabApp() {
  const [tab, setTab]                     = useState<Tab>("engines");
  const [sessions, setSessions]           = useState<ImaginationSession[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeEngine, setActiveEngine]   = useState<ImaginationEngineDefinition | null>(null);
  const [activeSeries, setActiveSeries]   = useState<ImaginationSeriesDefinition | null>(null);
  const [viewSession, setViewSession]     = useState<ImaginationSession | null>(null);
  const [error, setError]                 = useState("");

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/imagination", { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { sessions: ImaginationSession[] };
        setSessions(data.sessions ?? []);
      }
    } catch { setError("Failed to load sessions"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadSessions(); }, [loadSessions]);

  async function saveSession(data: { engineId: string; engineName: string; topic: string; output: string }) {
    const res = await fetch("/api/imagination", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await loadSessions();
      setTab("sessions");
    }
  }

  async function toggleStar(id: number, val: boolean) {
    await fetch(`/api/imagination/${id}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isStarred: val }),
    });
    await loadSessions();
  }

  async function deleteSession(id: number) {
    if (!confirm("Delete this creative session?")) return;
    await fetch(`/api/imagination/${id}`, { method: "DELETE", credentials: "include" });
    await loadSessions();
  }

  const TABS: { id: Tab; label: string; icon: string; count?: number }[] = [
    { id: "engines",  label: "Engines",  icon: "✨", count: IMAGINATION_ENGINES.length },
    { id: "sessions", label: "Sessions", icon: "📚", count: sessions.length || undefined },
    { id: "series",   label: "Series",   icon: "🔗", count: IMAGINATION_SERIES.length },
  ];

  return (
    <div style={{ minHeight: "100%", background: "hsl(260,20%,97%)" }}>
      {/* Panels */}
      {activeEngine && (
        <RunPanel
          engine={activeEngine}
          onClose={() => setActiveEngine(null)}
          onSave={async data => { await saveSession(data); setActiveEngine(null); }}
        />
      )}
      {activeSeries && (
        <SeriesRunPanel
          series={activeSeries}
          onClose={() => setActiveSeries(null)}
          onSave={async data => { await saveSession(data); setActiveSeries(null); }}
        />
      )}
      {viewSession && (
        <SessionViewer session={viewSession} onClose={() => setViewSession(null)} />
      )}

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", margin: 0 }}>
              ✨ ImaginationLab
            </h1>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
              11 creative engines · 3 series · 100% fictional, safe &amp; family-friendly
            </p>
          </div>
          <SafetyBadge />
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fff5f5", border: "1px solid #fecaca", color: "#dc2626", fontSize: 12, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
            {error}
            <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}>✕</button>
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 22, background: "rgba(0,0,0,0.04)", borderRadius: 14, padding: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
                background: tab === t.id ? "white" : "transparent",
                color: tab === t.id ? VIOLET : "#64748b",
                boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6,
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  background: tab === t.id ? `${VIOLET}15` : "rgba(0,0,0,0.06)",
                  color: tab === t.id ? VIOLET : "#94a3b8",
                  borderRadius: 20, padding: "1px 6px",
                }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Engines Tab */}
        {tab === "engines" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.06), rgba(16,185,129,0.05))",
              border: "1px solid rgba(139,92,246,0.15)", borderRadius: 14, padding: "14px 18px",
              fontSize: 12, color: "#64748b", lineHeight: 1.6,
            }}>
              🎨 <strong style={{ color: "#8b5cf6" }}>11 Imagination Engines</strong> — each one specialises in a unique dimension of creative world-building. Click any engine to open its run panel and generate fictional content instantly.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 12 }}>
              {IMAGINATION_ENGINES.map(engine => (
                <EngineCard key={engine.id} engine={engine} onClick={setActiveEngine} />
              ))}
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {tab === "sessions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                Creative Library — {sessions.length} saved sessions
              </div>
              {sessions.filter(s => s.isStarred).length > 0 && (
                <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>
                  ⭐ {sessions.filter(s => s.isStarred).length} starred
                </span>
              )}
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>
                Loading sessions…
              </div>
            ) : (
              <SessionsTab
                sessions={sessions}
                onToggleStar={toggleStar}
                onDelete={deleteSession}
                onView={s => setViewSession(s)}
              />
            )}
          </div>
        )}

        {/* Series Tab */}
        {tab === "series" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.06))",
              border: "1px solid rgba(139,92,246,0.15)", borderRadius: 14, padding: "14px 18px",
              fontSize: 12, color: "#64748b", lineHeight: 1.6,
            }}>
              🔗 <strong style={{ color: "#8b5cf6" }}>Creative Series</strong> — run 3 engines back-to-back on the same topic to build a rich, multi-layered fictional universe in a single session.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {IMAGINATION_SERIES.map(series => (
                <SeriesCard key={series.id} series={series} onRun={setActiveSeries} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
