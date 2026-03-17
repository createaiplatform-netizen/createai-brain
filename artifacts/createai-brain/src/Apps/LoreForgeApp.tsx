// ═══════════════════════════════════════════════════════════════════════════
// LOREFORGE APP — Deep Lore Creation Studio
// 13 engines: Mythology, Prophecy, Legend, Religion, AncientHistory, Faction,
// Language, Curse, Prophet, Relic, LoreKeeper, Cosmology, Era
// 5 series: MYTHOS, LORE, FACTION, CURSE, LANGUAGE
// All content is fictional, safe, and family-friendly.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback } from "react";
import {
  LORE_ENGINES, LORE_SERIES,
  getLoreEngineById, getLoreEngineColor, getLoreEngineIcon,
  runLoreEngine, runLoreSeries,
  type LoreEngineDefinition, type LoreSeriesDefinition,
} from "@/engine/LoreEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedSession {
  id: number;
  engineId: string;
  engineName: string;
  topic: string;
  output: string;
  title: string | null;
  tags: string | null;
  isStarred: boolean;
  createdAt: string;
}

type View = "grid" | "run" | "series" | "sessions" | "viewer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Engine Card ─────────────────────────────────────────────────────────────

function EngineCard({ engine, onSelect }: { engine: LoreEngineDefinition; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      style={{
        background: `linear-gradient(135deg, ${engine.color}18, ${engine.color}08)`,
        border: `1.5px solid ${engine.color}40`,
        borderRadius: 16, padding: "20px 18px", cursor: "pointer", textAlign: "left",
        transition: "all 0.18s", display: "flex", flexDirection: "column", gap: 8,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = engine.color + "90";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = "";
        (e.currentTarget as HTMLButtonElement).style.borderColor = engine.color + "40";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>{engine.icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9" }}>{engine.name}</div>
          <div style={{ fontSize: 11, color: engine.color, fontWeight: 600 }}>{engine.tagline}</div>
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{engine.description}</p>
      {engine.series && (
        <span style={{
          fontSize: 10, fontWeight: 700, color: engine.color,
          background: engine.color + "20", borderRadius: 6, padding: "2px 8px", alignSelf: "flex-start",
        }}>
          {engine.series.toUpperCase()}-SERIES
        </span>
      )}
    </button>
  );
}

// ─── Run Panel ────────────────────────────────────────────────────────────────

function RunPanel({ engine, onBack }: { engine: LoreEngineDefinition; onBack: () => void }) {
  const [topic, setTopic]     = useState("");
  const [output, setOutput]   = useState("");
  const [running, setRunning] = useState(false);
  const [done, setDone]       = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const outputRef             = useRef<HTMLDivElement>(null);

  const run = useCallback(async () => {
    if (!topic.trim() || running) return;
    setOutput(""); setRunning(true); setDone(false); setSaved(false); setError(null);
    await runLoreEngine({
      engineId: engine.id, engineName: engine.name, topic: topic.trim(),
      onChunk: chunk => {
        setOutput(prev => prev + chunk);
        if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
      },
      onDone: () => { setRunning(false); setDone(true); },
      onError: err => { setError(err); setRunning(false); },
    });
  }, [topic, running, engine]);

  const save = useCallback(async () => {
    if (!output || saved) return;
    try {
      await fetch("/api/loreforge", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engineId: engine.id, engineName: engine.name, topic: topic.trim(), output }),
      });
      setSaved(true);
    } catch { /* silent */ }
  }, [output, saved, engine, topic]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>←</button>
        <span style={{ fontSize: 22 }}>{engine.icon}</span>
        <div>
          <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 16 }}>{engine.name}</div>
          <div style={{ fontSize: 11, color: engine.color }}>{engine.tagline}</div>
        </div>
      </div>

      <textarea
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder={engine.placeholder}
        disabled={running}
        rows={3}
        style={{
          background: "#1e293b", border: "1.5px solid #334155", borderRadius: 10,
          color: "#f1f5f9", padding: "12px 14px", fontSize: 13, resize: "vertical",
          outline: "none", fontFamily: "inherit",
        }}
      />
      <div style={{ fontSize: 11, color: "#64748b", marginTop: -8 }}>
        {engine.example}
      </div>

      <button
        onClick={run}
        disabled={!topic.trim() || running}
        style={{
          background: running ? "#334155" : `linear-gradient(135deg, ${engine.color}, ${engine.color}cc)`,
          border: "none", borderRadius: 10, color: "#fff", padding: "12px 24px",
          fontWeight: 700, fontSize: 13, cursor: running ? "not-allowed" : "pointer",
          transition: "all 0.18s",
        }}
      >
        {running ? "✦ Generating..." : `✦ Run ${engine.name}`}
      </button>

      {error && (
        <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: 12, color: "#fca5a5", fontSize: 12 }}>
          {error}
        </div>
      )}

      {output && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
          <div
            ref={outputRef}
            style={{
              flex: 1, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10,
              padding: 16, overflowY: "auto", color: "#e2e8f0", fontSize: 13, lineHeight: 1.75,
              whiteSpace: "pre-wrap", minHeight: 200,
            }}
          >
            {output}
            {running && <span style={{ opacity: 0.5 }}>▌</span>}
          </div>
          {done && !saved && (
            <button
              onClick={save}
              style={{
                background: "#1e293b", border: "1px solid #334155", borderRadius: 8,
                color: "#a78bfa", padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              📚 Save to LoreForge Library
            </button>
          )}
          {saved && (
            <div style={{ color: "#4ade80", fontSize: 12, textAlign: "center" }}>✓ Saved to your library</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Series Panel ─────────────────────────────────────────────────────────────

function SeriesPanel({ series, onBack }: { series: LoreSeriesDefinition; onBack: () => void }) {
  const [topic, setTopic]           = useState("");
  const [output, setOutput]         = useState("");
  const [currentEngine, setCurrent] = useState<string | null>(null);
  const [running, setRunning]       = useState(false);
  const [done, setDone]             = useState(false);
  const [saved, setSaved]           = useState(false);
  const outputRef                   = useRef<HTMLDivElement>(null);

  const run = useCallback(async () => {
    if (!topic.trim() || running) return;
    setOutput(""); setRunning(true); setDone(false); setSaved(false); setCurrent(null);
    await runLoreSeries({
      seriesId: series.id, topic: topic.trim(),
      onSectionStart: (engineId) => {
        const eng = getLoreEngineById(engineId);
        setCurrent(engineId);
        setOutput(prev => prev + `\n\n${"═".repeat(50)}\n${eng?.icon ?? "📜"} ${eng?.name ?? engineId}\n${"═".repeat(50)}\n\n`);
      },
      onChunk: chunk => {
        setOutput(prev => prev + chunk);
        if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
      },
      onSectionEnd: () => setCurrent(null),
      onDone: () => { setRunning(false); setDone(true); },
      onError: () => setRunning(false),
    });
  }, [topic, running, series]);

  const save = useCallback(async () => {
    if (!output || saved) return;
    try {
      await fetch("/api/loreforge", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engineId: series.id, engineName: series.name,
          topic: topic.trim(), output,
        }),
      });
      setSaved(true);
    } catch { /* silent */ }
  }, [output, saved, series, topic]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>←</button>
        <span style={{ fontSize: 22 }}>{series.icon}</span>
        <div>
          <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 16 }}>{series.name}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{series.engines.map(id => getLoreEngineById(id)?.name ?? id).join(" → ")}</div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{series.description}</p>

      <div style={{ display: "flex", gap: 8 }}>
        {series.engines.map(id => {
          const eng = getLoreEngineById(id);
          return (
            <div key={id} style={{
              flex: 1, background: currentEngine === id ? getLoreEngineColor(id) + "30" : "#1e293b",
              border: `1px solid ${getLoreEngineColor(id)}40`, borderRadius: 8,
              padding: "8px 10px", textAlign: "center",
              transition: "all 0.3s",
            }}>
              <div style={{ fontSize: 16 }}>{getLoreEngineIcon(id)}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{eng?.name ?? id}</div>
            </div>
          );
        })}
      </div>

      <textarea
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder={`What should the ${series.name} explore?`}
        disabled={running}
        rows={3}
        style={{
          background: "#1e293b", border: "1.5px solid #334155", borderRadius: 10,
          color: "#f1f5f9", padding: "12px 14px", fontSize: 13, resize: "vertical",
          outline: "none", fontFamily: "inherit",
        }}
      />

      <button
        onClick={run}
        disabled={!topic.trim() || running}
        style={{
          background: running ? "#334155" : "linear-gradient(135deg, #d97706, #b45309)",
          border: "none", borderRadius: 10, color: "#fff", padding: "12px 24px",
          fontWeight: 700, fontSize: 13, cursor: running ? "not-allowed" : "pointer",
        }}
      >
        {running ? `✦ Running ${series.symbol}-Series...` : `✦ Run ${series.name}`}
      </button>

      {output && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
          <div
            ref={outputRef}
            style={{
              flex: 1, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10,
              padding: 16, overflowY: "auto", color: "#e2e8f0", fontSize: 13, lineHeight: 1.75,
              whiteSpace: "pre-wrap", minHeight: 200,
            }}
          >
            {output}
            {running && <span style={{ opacity: 0.5 }}>▌</span>}
          </div>
          {done && !saved && (
            <button
              onClick={save}
              style={{
                background: "#1e293b", border: "1px solid #334155", borderRadius: 8,
                color: "#a78bfa", padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              📚 Save to LoreForge Library
            </button>
          )}
          {saved && <div style={{ color: "#4ade80", fontSize: 12, textAlign: "center" }}>✓ Saved</div>}
        </div>
      )}
    </div>
  );
}

// ─── Sessions View ────────────────────────────────────────────────────────────

function SessionsView({ onView }: { onView: (s: SavedSession) => void }) {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading]   = useState(true);

  React.useEffect(() => {
    fetch("/api/loreforge", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setSessions(d.sessions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const star = async (s: SavedSession) => {
    await fetch(`/api/loreforge/${s.id}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isStarred: !s.isStarred }),
    });
    setSessions(prev => prev.map(x => x.id === s.id ? { ...x, isStarred: !x.isStarred } : x));
  };

  const del = async (id: number) => {
    await fetch(`/api/loreforge/${id}`, { method: "DELETE", credentials: "include" });
    setSessions(prev => prev.filter(x => x.id !== id));
  };

  if (loading) return <div style={{ color: "#64748b", padding: 24, textAlign: "center" }}>Loading lore library...</div>;

  if (!sessions.length) return (
    <div style={{ textAlign: "center", padding: 48, color: "#64748b" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📜</div>
      <div style={{ fontWeight: 600 }}>Your lore library is empty</div>
      <div style={{ fontSize: 12, marginTop: 6 }}>Run an engine and save the output to build your library</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sessions.map(s => {
        const color = getLoreEngineColor(s.engineId);
        return (
          <div key={s.id} style={{
            background: "#1e293b", border: `1px solid ${color}30`, borderRadius: 12,
            padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 20, marginTop: 2 }}>{getLoreEngineIcon(s.engineId)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 13, marginBottom: 2 }}>
                {s.title ?? s.topic}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{s.engineName} · {fmt(s.createdAt)}</div>
              <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 6, lineHeight: 1.5,
                overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {s.output}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => star(s)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>
                {s.isStarred ? "★" : "☆"}
              </button>
              <button onClick={() => onView(s)} style={{
                background: "#334155", border: "none", borderRadius: 6, color: "#f1f5f9",
                padding: "4px 10px", fontSize: 11, cursor: "pointer",
              }}>View</button>
              <button onClick={() => del(s.id)} style={{
                background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 12,
              }}>✕</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Session Viewer ───────────────────────────────────────────────────────────

function SessionViewer({ session, onBack }: { session: SavedSession; onBack: () => void }) {
  const color = getLoreEngineColor(session.engineId);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>←</button>
        <span style={{ fontSize: 22 }}>{getLoreEngineIcon(session.engineId)}</span>
        <div>
          <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 15 }}>{session.title ?? session.topic}</div>
          <div style={{ fontSize: 11, color }}>
            {session.engineName} · {fmt(session.createdAt)}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>Topic: {session.topic}</div>
      <div style={{
        flex: 1, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10,
        padding: 16, overflowY: "auto", color: "#e2e8f0", fontSize: 13, lineHeight: 1.75,
        whiteSpace: "pre-wrap",
      }}>
        {session.output}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export function LoreForgeApp() {
  const [view, setView]                   = useState<View>("grid");
  const [activeEngine, setActiveEngine]   = useState<LoreEngineDefinition | null>(null);
  const [activeSeries, setActiveSeries]   = useState<LoreSeriesDefinition | null>(null);
  const [viewSession, setViewSession]     = useState<SavedSession | null>(null);
  const [tab, setTab]                     = useState<"engines" | "series" | "sessions">("engines");

  const openEngine = (eng: LoreEngineDefinition) => { setActiveEngine(eng); setView("run"); };
  const openSeries = (ser: LoreSeriesDefinition) => { setActiveSeries(ser); setView("series"); };
  const openViewer = (s: SavedSession)           => { setViewSession(s); setView("viewer"); };

  const goBack = () => {
    setView("grid"); setActiveEngine(null); setActiveSeries(null); setViewSession(null);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "#0f172a", color: "#f1f5f9", padding: "20px 20px 16px",
      overflowY: "auto", gap: 0,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 28 }}>📜</span>
          <div>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: "#f1f5f9" }}>LoreForge</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Deep Lore Creation Studio · 13 engines · 5 series</p>
          </div>
        </div>
      </div>

      {/* Routed views */}
      {view === "run"     && activeEngine && <RunPanel engine={activeEngine} onBack={goBack} />}
      {view === "series"  && activeSeries && <SeriesPanel series={activeSeries} onBack={goBack} />}
      {view === "viewer"  && viewSession  && <SessionViewer session={viewSession} onBack={goBack} />}

      {view === "grid" && (
        <>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#1e293b", borderRadius: 10, padding: 4 }}>
            {(["engines", "series", "sessions"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, background: tab === t ? "#334155" : "none",
                  border: "none", borderRadius: 7, color: tab === t ? "#f1f5f9" : "#64748b",
                  padding: "8px 4px", fontWeight: tab === t ? 700 : 500, fontSize: 12,
                  cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize",
                }}
              >
                {t === "engines" ? `⚡ Engines (${LORE_ENGINES.length})` :
                 t === "series"  ? `✦ Series (${LORE_SERIES.length})` : "📚 Library"}
              </button>
            ))}
          </div>

          {/* Engine Grid */}
          {tab === "engines" && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}>
              {LORE_ENGINES.map(eng => (
                <EngineCard key={eng.id} engine={eng} onSelect={() => openEngine(eng)} />
              ))}
            </div>
          )}

          {/* Series Grid */}
          {tab === "series" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {LORE_SERIES.map(ser => (
                <button
                  key={ser.id}
                  onClick={() => openSeries(ser)}
                  style={{
                    background: "linear-gradient(135deg, #1e293b, #0f172a)",
                    border: "1.5px solid #334155", borderRadius: 14,
                    padding: "18px 20px", cursor: "pointer", textAlign: "left",
                    display: "flex", gap: 14, alignItems: "flex-start",
                    transition: "all 0.18s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#475569")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#334155")}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: ser.gradient, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 20, flexShrink: 0,
                  }}>
                    {ser.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 14, marginBottom: 4 }}>{ser.name}</div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8", lineHeight: 1.5, marginBottom: 8 }}>{ser.description}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {ser.engines.map(id => {
                        const eng = getLoreEngineById(id);
                        return (
                          <span key={id} style={{
                            fontSize: 10, background: "#334155", borderRadius: 6,
                            padding: "2px 8px", color: "#94a3b8",
                          }}>
                            {eng?.icon} {eng?.name ?? id}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{
                    marginLeft: "auto", background: "linear-gradient(135deg, #d97706, #b45309)",
                    borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700,
                    color: "#fff", flexShrink: 0, alignSelf: "center",
                  }}>
                    Run →
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Sessions */}
          {tab === "sessions" && <SessionsView onView={openViewer} />}
        </>
      )}
    </div>
  );
}
