import React, { useState, useRef, useCallback, useEffect } from "react";
import { MAGICSYSTEM_ENGINES, MAGICSYSTEM_SERIES, runMagicSystemEngine, type MagicSystemEngineDefinition, type MagicSystemSeriesDefinition } from "@/engine/MagicSystemEngine";

interface SavedSession { id: number; engineId: string; engineName: string; topic: string; output: string; title: string | null; isStarred: boolean; createdAt: string; }
type View = "grid" | "run" | "series" | "sessions" | "viewer";
const ACCENT = "#7c3aed"; const ICON = "✨"; const LABEL = "MagicSystemStudio"; const API = "/api/magicsystem";
function fmt(ts: string) { return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

function EngineCard({ e, onSelect }: { e: MagicSystemEngineDefinition; onSelect: () => void }) {
  return (
    <button onClick={onSelect} style={{ background: `linear-gradient(135deg,${e.color}18,${e.color}08)`, border: `1.5px solid ${e.color}40`, borderRadius: 16, padding: "18px 16px", cursor: "pointer", textAlign: "left", transition: "all 0.18s", display: "flex", flexDirection: "column", gap: 8 }}
      onMouseEnter={el => { (el.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (el.currentTarget as HTMLButtonElement).style.borderColor = e.color + "90"; }}
      onMouseLeave={el => { (el.currentTarget as HTMLButtonElement).style.transform = ""; (el.currentTarget as HTMLButtonElement).style.borderColor = e.color + "40"; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>{e.icon}</span>
        <div><div style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9" }}>{e.name}</div><div style={{ fontSize: 11, color: e.color, fontWeight: 600 }}>{e.tagline}</div></div>
      </div>
      <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{e.description}</p>
      {e.series && <span style={{ fontSize: 10, fontWeight: 700, color: e.color, background: e.color + "20", borderRadius: 6, padding: "2px 8px", alignSelf: "flex-start" }}>{e.series.toUpperCase()}-SERIES</span>}
    </button>
  );
}

function RunPanel({ engine, onBack }: { engine: MagicSystemEngineDefinition; onBack: () => void }) {
  const [topic, setTopic] = useState(""); const [output, setOutput] = useState(""); const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false); const [saved, setSaved] = useState(false); const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const run = useCallback(async () => {
    if (!topic.trim() || running) return;
    setOutput(""); setRunning(true); setDone(false); setSaved(false); setError(null);
    await runMagicSystemEngine({ engineId: engine.id, engineName: engine.name, topic: topic.trim(),
      onChunk: c => { setOutput(p => p + c); if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight; },
      onDone: () => { setRunning(false); setDone(true); }, onError: e => { setError(e); setRunning(false); } });
  }, [topic, running, engine]);
  const save = useCallback(async () => {
    if (!output || saved) return;
    try { await fetch(API, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ engineId: engine.id, engineName: engine.name, topic: topic.trim(), output }) }); setSaved(true); } catch { /* silent */ }
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
      <button onClick={run} disabled={running || !topic.trim()} style={{ background: running ? ACCENT + "50" : engine.color, border: "none", borderRadius: 10, padding: "11px 20px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: running ? "not-allowed" : "pointer" }}>
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
          <div ref={outputRef} style={{ flex: 1, overflowY: "auto", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{output}</div>
        </div>
      )}
    </div>
  );
}

function SeriesPanel({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>←</button>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>Series Runs</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MAGICSYSTEM_SERIES.map((s: MagicSystemSeriesDefinition) => (
          <button key={s.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 18px", textAlign: "left", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)"}
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
  useEffect(() => { fetch(API, { credentials: "include" }).then(r => r.ok ? r.json() : { sessions: [] }).then((d: { sessions?: SavedSession[] }) => setSessions(d.sessions ?? [])).catch(() => {}).finally(() => setLoading(false)); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>←</button>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>Saved Sessions ({sessions.length})</div>
      </div>
      {loading ? <div style={{ color: "#64748b", fontSize: 13 }}>Loading…</div>
        : sessions.length === 0 ? <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: 13 }}>No saved sessions yet.</div>
        : sessions.map(s => (
          <button key={s.id} onClick={() => onView(s)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", textAlign: "left", cursor: "pointer" }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#e2e8f0" }}>{s.title ?? s.topic.slice(0, 60)}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{s.engineName} · {fmt(s.createdAt)}</div>
          </button>
        ))}
    </div>
  );
}

export function MagicSystemStudioApp() {
  const [view, setView] = useState<View>("grid"); const [activeEngine, setActiveEngine] = useState<MagicSystemEngineDefinition | null>(null);
  const [viewingSession, setViewingSession] = useState<SavedSession | null>(null); const [search, setSearch] = useState("");
  const filtered = search.trim() ? MAGICSYSTEM_ENGINES.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase())) : MAGICSYSTEM_ENGINES;
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
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${ACCENT},#6366f1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{ICON}</div>
          <div><h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>{LABEL}</h2><p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Magic & Power System Design · {MAGICSYSTEM_ENGINES.length} engines · {MAGICSYSTEM_SERIES.length} series</p></div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(["grid","series","sessions"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? ACCENT + "33" : "transparent", border: view === v ? `1px solid ${ACCENT}66` : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "7px 14px", color: view === v ? ACCENT : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: view === v ? 700 : 400 }}>
              {v === "grid" ? "⚙️ Engines" : v === "series" ? "🧬 Series" : "📚 Sessions"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search engines…"
          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 14px", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", marginBottom: 16, boxSizing: "border-box" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
          {filtered.map(e => <EngineCard key={e.id} e={e} onSelect={() => { setActiveEngine(e); setView("run"); }} />)}
        </div>
      </div>
    </div>
  );
}
