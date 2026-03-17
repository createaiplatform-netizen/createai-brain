import React, { useState, useRef } from "react";

type Engine = "ResearchEngine" | "MarketResearchEngine" | "CritiqueEngine";

interface Result {
  id: string;
  engine: Engine;
  topic: string;
  output: string;
  ts: number;
}

const ENGINE_META: Record<Engine, { label: string; icon: string; color: string; hint: string }> = {
  ResearchEngine:       { label: "Research Engine",       icon: "🔬", color: "#007AFF", hint: "Deep academic & industry research, literature reviews, synthesis, citations" },
  MarketResearchEngine: { label: "Market Research Engine",icon: "📊", color: "#5856D6", hint: "TAM/SAM analysis, competitor mapping, pricing benchmarks, buyer trends" },
  CritiqueEngine:       { label: "Critique Engine",       icon: "🎯", color: "#FF3B30", hint: "Red-team analysis, assumption challenges, structural critique, blind-spot detection" },
};

export function ResearchHubApp() {
  const [engine, setEngine]   = useState<Engine>("ResearchEngine");
  const [topic, setTopic]     = useState("");
  const [loading, setLoading] = useState(false);
  const [stream, setStream]   = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [view, setView]       = useState<"run" | "history">("run");
  const abortRef              = useRef<AbortController | null>(null);

  async function run() {
    if (!topic.trim() || loading) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setStream("");

    try {
      const res = await fetch("/api/openai/engine-run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engineId: engine, prompt: topic }),
        signal: ctrl.signal,
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let full     = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value);
        full += chunk;
        setStream(s => s + chunk);
      }
      const newResult: Result = { id: crypto.randomUUID(), engine, topic, output: full, ts: Date.now() };
      setResults(r => [newResult, ...r]);
      await fetch("/api/documents", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `[${ENGINE_META[engine].label}] ${topic}`, content: full, type: "research" }),
      });
    } catch (e: any) {
      if (e.name !== "AbortError") setStream("Error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const meta = ENGINE_META[engine];

  return (
    <div className="flex flex-col h-full" style={{ background: "hsl(220,20%,97%)" }}>
      <div className="px-4 pt-5 pb-4 flex-shrink-0" style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "rgba(0,122,255,0.10)" }}>🔬</div>
          <div>
            <h2 className="font-bold text-[17px]" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Research Hub</h2>
            <p className="text-[12px]" style={{ color: "#94a3b8" }}>Research · Market Analysis · Critical Review</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(["run", "history"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
              style={view === v
                ? { background: "#007AFF", color: "white" }
                : { background: "rgba(0,0,0,0.05)", color: "#64748b" }}
            >
              {v === "run" ? "Run Engine" : `History (${results.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {view === "run" ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ENGINE_META) as Engine[]).map(e => {
                const m = ENGINE_META[e];
                const active = engine === e;
                return (
                  <button
                    key={e}
                    onClick={() => setEngine(e)}
                    className="p-3 rounded-2xl text-left transition-all border"
                    style={active
                      ? { background: m.color, color: "white", borderColor: m.color }
                      : { background: "white", color: "#374151", borderColor: "rgba(0,0,0,0.08)" }}
                  >
                    <div className="text-lg mb-1">{m.icon}</div>
                    <div className="text-[11px] font-bold leading-tight">{m.label}</div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-2xl text-[12px]" style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}30` }}>
              {meta.icon} <strong>{meta.label}:</strong> {meta.hint}
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <label className="text-[11px] font-semibold uppercase tracking-wide mb-2 block" style={{ color: "#94a3b8" }}>Research Topic</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder={`What should ${meta.label} analyze?`}
                className="w-full resize-none text-[14px] outline-none"
                style={{ color: "#0f172a", minHeight: 80, background: "transparent" }}
              />
            </div>

            <button
              onClick={run}
              disabled={loading || !topic.trim()}
              className="w-full py-3 rounded-2xl font-bold text-[14px] text-white transition-all"
              style={{ background: loading ? "#c7d2fe" : meta.color, opacity: !topic.trim() ? 0.5 : 1 }}
            >
              {loading ? "Analyzing…" : `Run ${meta.label}`}
            </button>

            {(loading || stream) && (
              <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: meta.color }} />
                  <span className="text-[11px] font-semibold" style={{ color: meta.color }}>
                    {loading ? "Streaming output…" : "Complete — saved to Documents"}
                  </span>
                </div>
                <pre className="text-[13px] leading-relaxed whitespace-pre-wrap font-sans" style={{ color: "#1e293b" }}>{stream}</pre>
              </div>
            )}
          </>
        ) : (
          <>
            {results.length === 0 ? (
              <div className="text-center py-16" style={{ color: "#94a3b8" }}>
                <div className="text-4xl mb-3">🔬</div>
                <p className="text-[14px]">No research sessions yet</p>
                <p className="text-[12px]">Run an engine to see results here</p>
              </div>
            ) : results.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full mr-2" style={{ background: `${ENGINE_META[r.engine].color}15`, color: ENGINE_META[r.engine].color }}>
                      {ENGINE_META[r.engine].icon} {ENGINE_META[r.engine].label}
                    </span>
                    <p className="font-semibold text-[14px] mt-1.5" style={{ color: "#0f172a" }}>{r.topic}</p>
                  </div>
                  <span className="text-[10px] flex-shrink-0" style={{ color: "#94a3b8" }}>{new Date(r.ts).toLocaleDateString()}</span>
                </div>
                <p className="text-[12px] line-clamp-3" style={{ color: "#64748b" }}>{r.output.slice(0, 300)}…</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
