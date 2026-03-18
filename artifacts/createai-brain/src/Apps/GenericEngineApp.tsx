// ═══════════════════════════════════════════════════════════════════════════
// GENERIC ENGINE APP — Reusable factory for all expanded apps.
// Every engine run goes through the unified PlatformController.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback, useEffect } from "react";
import { DocumentRenderer } from "@/engines/document";
import { useEngineRun, useDocumentOutput } from "@/controller";

// ── Types ────────────────────────────────────────────────────────────────────
export interface GenericEngineDefinition {
  id:          string;
  name:        string;
  icon:        string;
  tagline:     string;
  description: string;
  placeholder: string;
  example:     string;
  color:       string;
  series?:     string;
}

export interface GenericSeriesDefinition {
  id:          string;
  name:        string;
  icon:        string;
  description: string;
  engines:     string[];
}

export interface GenericEngineAppConfig {
  appId:        string;
  title:        string;
  icon:         string;
  color:        string;
  description:  string;
  engines:      GenericEngineDefinition[];
  series?:      GenericSeriesDefinition[];
}

interface SavedSession {
  id:          number;
  engineId:    string;
  engineName:  string;
  topic:       string;
  output:      string;
  createdAt:   string;
}

type View = "grid" | "run" | "sessions" | "viewer";

// ── Engine Card ──────────────────────────────────────────────────────────────
function EngineCard({ engine, onSelect }: { engine: GenericEngineDefinition; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: `linear-gradient(135deg,${engine.color}18,${engine.color}08)`,
        border: `1.5px solid ${hovered ? engine.color + "90" : engine.color + "40"}`,
        borderRadius: 16, padding: "18px 16px", cursor: "pointer", textAlign: "left",
        transition: "all 0.18s", display: "flex", flexDirection: "column", gap: 8,
        transform: hovered ? "translateY(-2px)" : "none",
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
        <span style={{ fontSize: 10, fontWeight: 700, color: engine.color, background: engine.color + "20", borderRadius: 6, padding: "2px 8px", alignSelf: "flex-start" }}>
          {engine.series.toUpperCase()}-SERIES
        </span>
      )}
    </button>
  );
}

// ── Run Panel — wired through PlatformController ──────────────────────────────
function RunPanel({ engine, appId, onBack }: { engine: GenericEngineDefinition; appId: string; onBack: () => void }) {
  const { run: runCtrl, output, document: doc, status, error, isRunning, isDone } = useEngineRun(engine.id);
  const { saveDocument } = useDocumentOutput();
  const [topic,  setTopic]  = useState("");
  const [saved,  setSaved]  = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const run = useCallback(() => {
    if (!topic.trim() || isRunning) return;
    setSaved(false);
    runCtrl(topic.trim());
  }, [topic, isRunning, runCtrl]);

  const save = useCallback(async () => {
    if (!output || saved) return;
    await saveDocument({
      engineId:   engine.id,
      engineName: engine.name,
      title:      `${engine.name}: ${topic.trim().slice(0, 60)}`,
      content:    output,
    });
    setSaved(true);
  }, [output, saved, engine, topic, saveDocument]);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>←</button>
        <span style={{ fontSize: 22 }}>{engine.icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>{engine.name}</div>
          <div style={{ fontSize: 11, color: engine.color }}>{engine.tagline}</div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>{engine.example}</div>

      <textarea
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder={engine.placeholder}
        rows={3}
        onKeyDown={e => e.key === "Enter" && e.metaKey && run()}
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", resize: "none" }}
      />

      <button
        onClick={run}
        disabled={isRunning || !topic.trim()}
        style={{ background: isRunning ? "rgba(227,74,37,0.3)" : engine.color, border: "none", borderRadius: 10, padding: "11px 20px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: isRunning ? "not-allowed" : "pointer", opacity: !topic.trim() && !isRunning ? 0.5 : 1 }}
      >
        {isRunning ? `⟳ Running ${engine.name}…` : `${engine.icon} Run ${engine.name}`}
      </button>

      {error && (
        <div style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.25)", borderRadius: 8, padding: "10px 14px", color: "#ff6b6b", fontSize: 13 }}>⚠️ {error}</div>
      )}

      {output && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: isDone ? "#34C759" : "#94a3b8" }}>
              {isRunning ? "⟳ GENERATING…" : isDone ? "✅ COMPLETE" : "OUTPUT"}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {isDone && !saved && (
                <button onClick={save} style={{ background: engine.color + "22", border: `1px solid ${engine.color}44`, borderRadius: 8, padding: "5px 12px", color: engine.color, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  💾 Save
                </button>
              )}
              {saved && <span style={{ fontSize: 11, color: "#34C759", fontWeight: 700 }}>✓ Saved</span>}
            </div>
          </div>
          <div ref={outputRef} style={{ flex: 1, overflowY: "auto" }}>
            {isDone && doc ? (
              <DocumentRenderer schema={doc} compact toolbar />
            ) : (
              <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px", fontSize: 13, color: "#e2e8f0", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "inherit", minHeight: 120 }}>
                {output}
                {isRunning && <span style={{ display: "inline-block", width: 8, height: 14, background: engine.color, borderRadius: 2, marginLeft: 2, animation: "blink 1s infinite" }} />}
                {!isRunning && !output && <span style={{ color: "#4f5a6e" }}>Output will appear here…</span>}
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}

// ── Sessions Panel ───────────────────────────────────────────────────────────
function SessionsPanel({ appId, color, onBack }: { appId: string; color: string; onBack: () => void }) {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<SavedSession | null>(null);
  const { processText } = useDocumentOutput();

  useEffect(() => {
    fetch(`/api/documents?type=engine-session-${appId}`, { credentials: "include" })
      .then(r => r.json())
      .then((d: { documents?: SavedSession[] }) => { setSessions(d.documents ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [appId]);

  if (selected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>←</button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>{selected.engineName}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{selected.topic}</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <DocumentRenderer schema={processText(selected.output ?? "", { title: selected.topic, docType: selected.engineName })} compact toolbar />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>Saved Sessions</span>
      </div>
      {loading && <div style={{ color: "#64748b", fontSize: 13 }}>Loading sessions…</div>}
      {!loading && sessions.length === 0 && (
        <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", marginTop: 40 }}>No saved sessions yet. Run an engine and click Save.</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
        {sessions.map(s => (
          <button key={s.id} onClick={() => setSelected(s)}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 16px", cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#f1f5f9", marginBottom: 4 }}>{s.engineName}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{s.topic}</div>
            <div style={{ fontSize: 10, color }}>
              {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main GenericEngineApp ────────────────────────────────────────────────────
export function GenericEngineApp({ config }: { config: GenericEngineAppConfig }) {
  const [view,         setView]         = useState<View>("grid");
  const [activeEngine, setActiveEngine] = useState<GenericEngineDefinition | null>(null);
  const [search,       setSearch]       = useState("");

  const filtered = config.engines.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase())
  );

  const selectEngine = (engine: GenericEngineDefinition) => { setActiveEngine(engine); setView("run"); };

  if (view === "run" && activeEngine) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px", overflow: "hidden" }}>
        <RunPanel engine={activeEngine} appId={config.appId} onBack={() => setView("grid")} />
      </div>
    );
  }

  if (view === "sessions") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px", overflow: "hidden" }}>
        <SessionsPanel appId={config.appId} color={config.color} onBack={() => setView("grid")} />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${config.color}, ${config.color}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              {config.icon}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#f1f5f9" }}>{config.title}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{config.engines.length} AI engines</div>
            </div>
          </div>
          <button onClick={() => setView("sessions")}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "7px 14px", color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            📂 Sessions
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px" }}>{config.description}</p>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search engines…"
          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 14px", color: "#e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
      </div>

      {/* Engine grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
        {config.series && config.series.length > 0 && !search && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", marginBottom: 10 }}>SERIES RUNS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {config.series.map(s => (
                <div key={s.id} style={{ background: `linear-gradient(135deg,${config.color}18,${config.color}08)`, border: `1.5px solid ${config.color}40`, borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#f1f5f9", marginBottom: 4 }}>{s.icon} {s.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{s.description}</div>
                  <div style={{ fontSize: 10, color: config.color, marginTop: 6 }}>{s.engines.length} engines</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", marginBottom: 10 }}>
          ALL ENGINES {search && `(${filtered.length} results)`}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {filtered.map(engine => (
            <EngineCard key={engine.id} engine={engine} onSelect={() => selectEngine(engine)} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#64748b", marginTop: 40, fontSize: 13 }}>No engines match "{search}"</div>
        )}
      </div>
    </div>
  );
}
