import React, { useState, useRef } from "react";
import { streamEngine } from "@/controller";

type Operation = "schema" | "model" | "query" | "vector";

interface DataOutput {
  id: string;
  op: Operation;
  subject: string;
  output: string;
  ts: number;
}

const OP_META: Record<Operation, { label: string; icon: string; color: string; engine: string; hint: string }> = {
  schema: { label: "Schema Design",    icon: "🗂️", color: "#30B0C7", engine: "DataModelEngine", hint: "Full database schema with tables, columns, indexes, and constraints" },
  model:  { label: "Data Modelling",   icon: "🗄️", color: "#007AFF", engine: "DataModelEngine", hint: "Entity-relationship modelling, normalization, and data flow design" },
  query:  { label: "Query Strategy",   icon: "🔍", color: "#5856D6", engine: "DataModelEngine", hint: "Optimized query patterns, indexing strategy, and performance architecture" },
  vector: { label: "VECTOR Analysis",  icon: "📐", color: "#FF3B30", engine: "VECTOR",           hint: "Multi-dimensional pattern intelligence, vector analytics, and correlation maps" },
};

export function DataStudioApp() {
  const [op, setOp]           = useState<Operation>("schema");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [stream, setStream]   = useState("");
  const [outputs, setOutputs] = useState<DataOutput[]>([]);
  const [view, setView]       = useState<"studio" | "history">("studio");
  const abortRef              = useRef<AbortController | null>(null);

  async function run() {
    if (!subject.trim() || loading) return;
    setLoading(true);
    setStream("");
    const meta = OP_META[op];
    try {
      await streamEngine({
        engineId: meta.engine,
        topic: `[${meta.label}] ${subject}`,
        onChunk: (chunk) => setStream(s => s + chunk),
        onDone: async (full) => {
          setOutputs(o => [{ id: crypto.randomUUID(), op, subject, output: full, ts: Date.now() }, ...o]);
          await fetch("/api/documents", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `[${meta.label}] ${subject}`, content: full, type: "data-model" }),
          });
        },
        onError: (err) => setStream(`Error — ${err}`),
      });
    } finally {
      setLoading(false);
    }
  }

  const meta = OP_META[op];

  return (
    <div className="flex flex-col h-full" style={{ background: "hsl(220,20%,97%)" }}>
      <div className="px-4 pt-5 pb-4 flex-shrink-0" style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "rgba(48,176,199,0.10)" }}>🗄️</div>
          <div>
            <h2 className="font-bold text-[17px]" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Data Studio</h2>
            <p className="text-[12px]" style={{ color: "#94a3b8" }}>Schema · Modelling · Queries · VECTOR Intelligence</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(["studio", "history"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
              style={view === v
                ? { background: "#30B0C7", color: "white" }
                : { background: "rgba(0,0,0,0.05)", color: "#64748b" }}
            >
              {v === "studio" ? "Studio" : `History (${outputs.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {view === "studio" ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(OP_META) as Operation[]).map(o => {
                const m      = OP_META[o];
                const active = op === o;
                return (
                  <button
                    key={o}
                    onClick={() => setOp(o)}
                    className="p-3 rounded-2xl text-left transition-all border"
                    style={active
                      ? { background: m.color, color: "white", borderColor: m.color }
                      : { background: "white", color: "#374151", borderColor: "rgba(0,0,0,0.08)" }}
                  >
                    <div className="text-lg mb-1">{m.icon}</div>
                    <div className="text-[12px] font-bold">{m.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-70 leading-tight">{m.hint.slice(0, 52)}…</div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-2xl text-[12px]" style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}30` }}>
              {meta.icon} <strong>{meta.label}:</strong> {meta.hint}
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <label className="text-[11px] font-semibold uppercase tracking-wide mb-2 block" style={{ color: "#94a3b8" }}>System / Domain</label>
              <textarea
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={`Describe the system or data problem for ${meta.label}…`}
                className="w-full resize-none text-[14px] outline-none"
                style={{ color: "#0f172a", minHeight: 80, background: "transparent" }}
              />
            </div>

            <button
              onClick={run}
              disabled={loading || !subject.trim()}
              className="w-full py-3 rounded-2xl font-bold text-[14px] text-white transition-all"
              style={{ background: loading ? "#cffafe" : meta.color, opacity: !subject.trim() ? 0.5 : 1 }}
            >
              {loading ? "Modelling…" : `Run ${meta.label}`}
            </button>

            {(loading || stream) && (
              <div className="bg-white rounded-2xl p-4 font-mono" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: meta.color }} />
                  <span className="text-[11px] font-semibold font-sans" style={{ color: meta.color }}>
                    {loading ? "Generating model…" : "Complete — saved to Documents"}
                  </span>
                </div>
                <pre className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: "#1e293b" }}>{stream}</pre>
              </div>
            )}
          </>
        ) : (
          outputs.length === 0 ? (
            <div className="text-center py-16" style={{ color: "#94a3b8" }}>
              <div className="text-4xl mb-3">🗄️</div>
              <p className="text-[14px]">No data models yet</p>
              <p className="text-[12px]">Design your first schema or model</p>
            </div>
          ) : outputs.map(o => (
            <div key={o.id} className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full mr-2" style={{ background: `${OP_META[o.op].color}15`, color: OP_META[o.op].color }}>
                    {OP_META[o.op].icon} {OP_META[o.op].label}
                  </span>
                  <p className="font-semibold text-[14px] mt-1.5" style={{ color: "#0f172a" }}>{o.subject}</p>
                </div>
                <span className="text-[10px] flex-shrink-0" style={{ color: "#94a3b8" }}>{new Date(o.ts).toLocaleDateString()}</span>
              </div>
              <pre className="text-[11px] leading-relaxed line-clamp-4 font-mono whitespace-pre-wrap" style={{ color: "#64748b" }}>{o.output.slice(0, 320)}…</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
