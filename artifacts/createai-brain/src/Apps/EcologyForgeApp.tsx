import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ECOLOGY_ENGINES, ECOLOGY_SERIES,
  type EcologyEngineDefinition, type EcologySeriesDefinition,
} from "@/engine/EcologyEngine";
import { streamEngine, useSeriesRun } from "@/controller";

interface SavedSession { id: number; engineId: string; engineName: string; topic: string; output: string; title: string | null; isStarred: boolean; createdAt: string; }
type View = "grid" | "run" | "series" | "sessions" | "viewer";
function fmt(ts: string) { return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

function EngineCard({ engine, onSelect }: { engine: EcologyEngineDefinition; onSelect: () => void }) {
  return (
    <button onClick={onSelect} style={{ background: `linear-gradient(135deg,${engine.color}18,${engine.color}08)`, border: `1.5px solid ${engine.color}40`, borderRadius: 16, padding: "18px 16px", cursor: "pointer", textAlign: "left", transition: "all 0.18s", display: "flex", flexDirection: "column", gap: 8 }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.borderColor = engine.color + "90"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.borderColor = engine.color + "40"; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>{engine.icon}</span>
        <div><div style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9" }}>{engine.name}</div><div style={{ fontSize: 11, color: engine.color, fontWeight: 600 }}>{engine.tagline}</div></div>
      </div>
      <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{engine.description}</p>
      {engine.series && <span style={{ fontSize: 10, fontWeight: 700, color: engine.color, background: engine.color + "20", borderRadius: 6, padding: "2px 8px", alignSelf: "flex-start" }}>{engine.series.toUpperCase()}-SERIES</span>}
    </button>
  );
}

function RunPanel({ engine, onBack }: { engine: EcologyEngineDefinition; onBack: () => void }) {
  const [topic, setTopic] = useState(""); const [output, setOutput] = useState(""); const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false); const [saved, setSaved] = useState(false); const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const run = useCallback(async () => {
    if (!topic.trim() || running) return;
    setOutput(""); setRunning(true); setDone(false); setSaved(false); setError(null);
    await streamEngine({ engineId: engine.id, topic: topic.trim(),
      onChunk: chunk => { setOutput(prev => prev + chunk); if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight; },
      onDone: () => { setRunning(false); setDone(true); }, onError: err => { setError(err); setRunning(false); } });
  }, [topic, running, engine]);
  const save = useCallback(async () => {
    if (!output || saved) return;
    try { await fetch("/api/ecologyforge", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ engineId: engine.id, engineName: engine.name, topic: topic.trim(), output }) }); setSaved(true); } catch { /* silent */ }
  }, [output, saved, engine, topic]);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>←</button>
        <span style={{ fontSize: 22 }}>{engine.icon}</span>
        <div><div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>{engine.name}</div><div style={{ fontSize: 11, color: engine.color }}>{engine.tagline}</div></div>
      </div>
      <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>{engine.example}</div>
      <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder={engine.placeholder} rows={3} onKeyDown={e => e.key === "Enter" && e.metaKey && run()}
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", resize: "none" }} />
      <button onClick={run} disabled={running || !topic.trim()} style={{ background: running ? "rgba(21,128,61,0.3)" : engine.color, border: "none", borderRadius: 10, padding: "11px 20px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: running ? "not-allowed" : "pointer", opacity: !topic.trim() && !running ? 0.5 : 1 }}>
        {running ? `⟳ Running ${engine.name}…` : `${engine.icon} Run ${engine.name}`}
      </button>
      {error && <div style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.25)", borderRadius: 8, padding: "10px 14px", color: "#ff6b6b", fontSize: 13 }}>⚠️ {error}</div>}
      {output && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: done ? "#34C759" : "#94a3b8" }}>{running ? "⟳ GENERATING…" : done ? "✅ COMPLETE" : "OUTPUT"}</span>
            {done && !saved && <button onClick={save} style={{ background: engine.color + "22", border: `1px solid ${engine.color}44`, borderRadius: 8, padding: "5px 12px", color: engine.color, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>💾 Save</button>}
            {saved && <span style={{ fontSize: 11, color: "#34C759", fontWeight: 700 }}>✓ Saved</span>}
          </div>
          <div ref={outputRef} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 16px", overflowY: "auto", fontFamily: "inherit", fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{output}</div>
        </div>
      )}
    </div>
  );
}

function ActiveSeriesRunPanel({ series, accentColor, onBack }: { series: EcologySeriesDefinition; accentColor: string; onBack: () => void }) {
  const [topic, setTopic] = useState("");
  const { run, abort, sections, isRunning, isDone } = useSeriesRun(series.id);
  const outputRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight; });
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>←</button>
        <span style={{ fontSize: 22 }}>{series.icon}</span>
        <div><div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>{series.name}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{series.engines.length} engines · ~{series.estimatedMinutes}min</div></div>
      </div>
      <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{series.description}</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{series.engines.map(e => <span key={e} style={{ fontSize: 10, background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "3px 8px", color: "#94a3b8" }}>{e}</span>)}</div>
      <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Enter your ecology topic for the full series run…" rows={3}
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", resize: "none" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => !isRunning && topic.trim() && run(topic.trim())} disabled={isRunning || !topic.trim()} style={{ flex: 1, background: isRunning ? `${accentColor}4d` : accentColor, border: "none", borderRadius: 10, padding: "11px 20px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: isRunning ? "not-allowed" : "pointer", opacity: !topic.trim() ? 0.5 : 1 }}>
          {isRunning ? "⟳ Running Series…" : `${series.icon} Run ${series.name}`}
        </button>
        {isRunning && <button onClick={abort} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "11px 16px", color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Stop</button>}
      </div>
      {sections.some(s => s.text || s.status === "running") && (
        <div ref={outputRef} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          {sections.map((s, i) => s.status !== "pending" && (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${s.status === "running" ? accentColor + "60" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: s.status === "done" ? "#34C759" : accentColor, background: s.status === "done" ? "rgba(52,199,89,0.12)" : `${accentColor}20`, borderRadius: 4, padding: "2px 8px" }}>{s.status === "done" ? "✓ Done" : "⟳ Running"}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>{s.engineName}</span>
              </div>
              <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{s.text}{s.status === "running" && <span>▋</span>}</div>
            </div>
          ))}
          {isDone && <div style={{ textAlign: "center", fontSize: 12, color: "#34C759", fontWeight: 700, padding: "8px 0" }}>✓ Series complete — {sections.length} engines</div>}
        </div>
      )}
    </div>
  );
}

function SeriesPanel({ onBack }: { onBack: () => void }) {
  const [activeSeries, setActiveSeries] = useState<EcologySeriesDefinition | null>(null);
  if (activeSeries) return <ActiveSeriesRunPanel series={activeSeries} accentColor="#15803d" onBack={() => setActiveSeries(null)} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>←</button>
        <div><div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>🌿 Ecology Series</div><div style={{ fontSize: 12, color: "#64748b" }}>Run multiple engines in sequence on one ecosystem</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
        {ECOLOGY_SERIES.map(s => (
          <button key={s.id} onClick={() => setActiveSeries(s)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "18px", textAlign: "left", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(21,128,61,0.4)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div><div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>{s.name}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{s.engines.length} engines · ~{s.estimatedMinutes}min</div></div>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{s.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function SessionsPanel({ onBack, onView }: { onBack: () => void; onView: (s: SavedSession) => void }) {
  const [sessions, setSessions] = useState<SavedSession[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/ecologyforge", { credentials: "include" }).then(r => r.ok ? r.json() : { sessions: [] }).then((d: { sessions?: SavedSession[] }) => setSessions(d.sessions ?? [])).catch(() => {}).finally(() => setLoading(false)); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>←</button>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>Saved Ecosystems ({sessions.length})</div>
      </div>
      {loading ? <div style={{ color: "#64748b", fontSize: 13 }}>Loading…</div>
        : sessions.length === 0 ? <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: 13 }}>No saved sessions yet. Run an engine and save your ecosystem!</div>
        : sessions.map(s => (
          <button key={s.id} onClick={() => onView(s)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", textAlign: "left", cursor: "pointer" }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#e2e8f0" }}>{s.title ?? s.topic.slice(0, 60)}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{s.engineName} · {fmt(s.createdAt)}</div>
          </button>
        ))}
    </div>
  );
}

export function EcologyForgeApp() {
  const [view, setView] = useState<View>("grid"); const [activeEngine, setActiveEngine] = useState<EcologyEngineDefinition | null>(null); const [viewingSession, setViewingSession] = useState<SavedSession | null>(null); const [search, setSearch] = useState("");
  const filtered = search.trim() ? ECOLOGY_ENGINES.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase())) : ECOLOGY_ENGINES;
  if (view === "run" && activeEngine) return <div style={{ padding: "20px 24px", height: "100%", overflowY: "auto" }}><RunPanel engine={activeEngine} onBack={() => { setView("grid"); setActiveEngine(null); }} /></div>;
  if (view === "series") return <div style={{ padding: "20px 24px", overflowY: "auto", height: "100%" }}><SeriesPanel onBack={() => setView("grid")} /></div>;
  if (view === "sessions") return <div style={{ padding: "20px 24px", overflowY: "auto", height: "100%" }}><SessionsPanel onBack={() => setView("grid")} onView={s => { setViewingSession(s); setView("viewer"); }} /></div>;
  if (view === "viewer" && viewingSession) return (
    <div style={{ padding: "20px 24px", overflowY: "auto", height: "100%" }}>
      <button onClick={() => { setView("sessions"); setViewingSession(null); }} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20, marginBottom: 16 }}>←</button>
      <div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9", marginBottom: 4 }}>{viewingSession.title ?? viewingSession.topic}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>{viewingSession.engineName} · {fmt(viewingSession.createdAt)}</div>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{viewingSession.output}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#15803d,#0f766e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🌿</div>
          <div><h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>EcologyForge</h2><p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>World Ecology Builder · {ECOLOGY_ENGINES.length} engines · {ECOLOGY_SERIES.length} series</p></div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(["grid","series","sessions"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? "rgba(21,128,61,0.2)" : "transparent", border: view === v ? "1px solid rgba(21,128,61,0.4)" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "7px 14px", color: view === v ? "#4ade80" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: view === v ? 700 : 400 }}>
              {v === "grid" ? "⚙️ Engines" : v === "series" ? "🧬 Series" : "📚 Sessions"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>
        {view === "grid" && (
          <>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search engines…"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 14px", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", marginBottom: 16, boxSizing: "border-box" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
              {filtered.map(e => <EngineCard key={e.id} engine={e} onSelect={() => { setActiveEngine(e); setView("run"); }} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
