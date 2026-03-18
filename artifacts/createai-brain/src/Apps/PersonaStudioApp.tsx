import React, { useState, useRef } from "react";
import { streamEngine } from "@/controller";

type Layer = "icp" | "persona" | "comms" | "positioning";

interface PersonaCard {
  id: string;
  layer: Layer;
  subject: string;
  output: string;
  ts: number;
}

const LAYER_META: Record<Layer, { label: string; icon: string; color: string; engine: string; placeholder: string }> = {
  icp:         { label: "ICP Builder",        icon: "🎯", color: "#BF5AF2", engine: "PersonaEngine",      placeholder: "Describe your ideal customer profile target (e.g. B2B SaaS for mid-market HR teams)" },
  persona:     { label: "User Persona",        icon: "👤", color: "#5856D6", engine: "PersonaEngine",      placeholder: "Describe the user to build a persona for (e.g. startup founder, age 30-45, scaling teams)" },
  comms:       { label: "Communication Plan",  icon: "📡", color: "#007AFF", engine: "CommunicationEngine", placeholder: "What product/service needs a communication strategy?" },
  positioning: { label: "Market Positioning",  icon: "📍", color: "#FF9500", engine: "PersonaEngine",      placeholder: "What are you positioning and against whom?" },
};

export function PersonaStudioApp() {
  const [layer, setLayer]     = useState<Layer>("icp");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [stream, setStream]   = useState("");
  const [cards, setCards]     = useState<PersonaCard[]>([]);
  const [view, setView]       = useState<"studio" | "library">("studio");
  const abortRef              = useRef<AbortController | null>(null);

  async function run() {
    if (!subject.trim() || loading) return;
    setLoading(true);
    setStream("");
    const meta = LAYER_META[layer];
    try {
      await streamEngine({
        engineId: meta.engine,
        topic: `[${meta.label}] ${subject}`,
        onChunk: (chunk) => setStream(s => s + chunk),
        onDone: async (full) => {
          setCards(c => [{ id: crypto.randomUUID(), layer, subject, output: full, ts: Date.now() }, ...c]);
          await fetch("/api/documents", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `[${meta.label}] ${subject}`, content: full, type: "persona" }),
          });
        },
        onError: (err) => setStream(`Error — ${err}`),
      });
    } finally {
      setLoading(false);
    }
  }

  const meta = LAYER_META[layer];

  return (
    <div className="flex flex-col h-full" style={{ background: "hsl(220,20%,97%)" }}>
      <div className="px-4 pt-5 pb-4 flex-shrink-0" style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "rgba(191,90,242,0.10)" }}>👤</div>
          <div>
            <h2 className="font-bold text-[17px]" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Persona Studio</h2>
            <p className="text-[12px]" style={{ color: "#94a3b8" }}>ICP · User Personas · Communication · Positioning</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(["studio", "library"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
              style={view === v
                ? { background: "#BF5AF2", color: "white" }
                : { background: "rgba(0,0,0,0.05)", color: "#64748b" }}
            >
              {v === "studio" ? "Studio" : `Library (${cards.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {view === "studio" ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(LAYER_META) as Layer[]).map(l => {
                const m      = LAYER_META[l];
                const active = layer === l;
                return (
                  <button
                    key={l}
                    onClick={() => setLayer(l)}
                    className="p-3 rounded-2xl text-left transition-all border"
                    style={active
                      ? { background: m.color, color: "white", borderColor: m.color }
                      : { background: "white", color: "#374151", borderColor: "rgba(0,0,0,0.08)" }}
                  >
                    <div className="text-lg mb-1">{m.icon}</div>
                    <div className="text-[12px] font-bold">{m.label}</div>
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <label className="text-[11px] font-semibold uppercase tracking-wide mb-2 block" style={{ color: "#94a3b8" }}>Subject</label>
              <textarea
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={meta.placeholder}
                className="w-full resize-none text-[14px] outline-none"
                style={{ color: "#0f172a", minHeight: 80, background: "transparent" }}
              />
            </div>

            <button
              onClick={run}
              disabled={loading || !subject.trim()}
              className="w-full py-3 rounded-2xl font-bold text-[14px] text-white transition-all"
              style={{ background: loading ? "#e9d5ff" : meta.color, opacity: !subject.trim() ? 0.5 : 1 }}
            >
              {loading ? "Building…" : `Build ${meta.label}`}
            </button>

            {(loading || stream) && (
              <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: meta.color }} />
                  <span className="text-[11px] font-semibold" style={{ color: meta.color }}>
                    {loading ? `${meta.icon} Building persona…` : "Complete — saved to Documents"}
                  </span>
                </div>
                <pre className="text-[13px] leading-relaxed whitespace-pre-wrap font-sans" style={{ color: "#1e293b" }}>{stream}</pre>
              </div>
            )}
          </>
        ) : (
          cards.length === 0 ? (
            <div className="text-center py-16" style={{ color: "#94a3b8" }}>
              <div className="text-4xl mb-3">👤</div>
              <p className="text-[14px]">No personas built yet</p>
              <p className="text-[12px]">Use the studio to create your first ICP or persona</p>
            </div>
          ) : cards.map(c => (
            <div key={c.id} className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full mr-2" style={{ background: `${LAYER_META[c.layer].color}15`, color: LAYER_META[c.layer].color }}>
                    {LAYER_META[c.layer].icon} {LAYER_META[c.layer].label}
                  </span>
                  <p className="font-semibold text-[14px] mt-1.5" style={{ color: "#0f172a" }}>{c.subject}</p>
                </div>
                <span className="text-[10px] flex-shrink-0" style={{ color: "#94a3b8" }}>{new Date(c.ts).toLocaleDateString()}</span>
              </div>
              <p className="text-[12px] line-clamp-3" style={{ color: "#64748b" }}>{c.output.slice(0, 280)}…</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
