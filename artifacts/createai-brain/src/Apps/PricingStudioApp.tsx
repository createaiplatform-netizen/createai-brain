import React, { useState, useRef } from "react";
import { streamEngine } from "@/controller";

type PricingMode = "strategy" | "tiers" | "packaging" | "feedback";

interface PricingOutput {
  id: string;
  mode: PricingMode;
  product: string;
  output: string;
  ts: number;
}

const MODE_META: Record<PricingMode, { label: string; icon: string; color: string; engine: string; hint: string }> = {
  strategy:  { label: "Pricing Strategy",   icon: "💡", color: "#FFD60A", engine: "PricingEngine",   hint: "Value-based vs cost-plus vs competitive analysis, recommended model and rationale" },
  tiers:     { label: "Tier Architecture",   icon: "🏗️", color: "#FF9500", engine: "PricingEngine",   hint: "Free/starter/pro/enterprise tier design with feature gating and upgrade triggers" },
  packaging: { label: "Package Design",      icon: "📦", color: "#34C759", engine: "PricingEngine",   hint: "Bundle strategy, add-ons, usage-based pricing, and packaging logic" },
  feedback:  { label: "Feedback Framework",  icon: "📋", color: "#007AFF", engine: "FeedbackEngine",  hint: "Pricing feedback loops, survey design, churn signals, and willingness-to-pay analysis" },
};

export function PricingStudioApp() {
  const [mode, setMode]       = useState<PricingMode>("strategy");
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [stream, setStream]   = useState("");
  const [outputs, setOutputs] = useState<PricingOutput[]>([]);
  const [view, setView]       = useState<"studio" | "models">("studio");
  const abortRef              = useRef<AbortController | null>(null);

  async function run() {
    if (!product.trim() || loading) return;
    setLoading(true);
    setStream("");
    const meta = MODE_META[mode];
    try {
      await streamEngine({
        engineId: meta.engine,
        topic: `[${meta.label}] ${product}`,
        onChunk: (chunk) => setStream(s => s + chunk),
        onDone: async (full) => {
          setOutputs(o => [{ id: crypto.randomUUID(), mode, product, output: full, ts: Date.now() }, ...o]);
          await fetch("/api/documents", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `[${meta.label}] ${product}`, content: full, type: "pricing" }),
          });
        },
        onError: (err) => setStream(`Error — ${err}`),
      });
    } finally {
      setLoading(false);
    }
  }

  const meta = MODE_META[mode];

  return (
    <div className="flex flex-col h-full" style={{ background: "hsl(220,20%,97%)" }}>
      <div className="px-4 pt-5 pb-4 flex-shrink-0" style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "rgba(255,214,10,0.15)" }}>💰</div>
          <div>
            <h2 className="font-bold text-[17px]" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Pricing Studio</h2>
            <p className="text-[12px]" style={{ color: "#94a3b8" }}>Strategy · Tiers · Packaging · Feedback</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(["studio", "models"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
              style={view === v
                ? { background: "#FF9500", color: "white" }
                : { background: "rgba(0,0,0,0.05)", color: "#64748b" }}
            >
              {v === "studio" ? "Studio" : `Models (${outputs.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {view === "studio" ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(MODE_META) as PricingMode[]).map(m => {
                const mm     = MODE_META[m];
                const active = mode === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className="p-3 rounded-2xl text-left transition-all border"
                    style={active
                      ? { background: mm.color, color: mm.color === "#FFD60A" ? "#1a1a00" : "white", borderColor: mm.color }
                      : { background: "white", color: "#374151", borderColor: "rgba(0,0,0,0.08)" }}
                  >
                    <div className="text-lg mb-1">{mm.icon}</div>
                    <div className="text-[12px] font-bold">{mm.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-70 leading-tight">{mm.hint.slice(0, 52)}…</div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-2xl text-[12px]" style={{ background: "rgba(255,149,0,0.08)", color: "#b45309", border: "1px solid rgba(255,149,0,0.25)" }}>
              {meta.icon} <strong>{meta.label}:</strong> {meta.hint}
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <label className="text-[11px] font-semibold uppercase tracking-wide mb-2 block" style={{ color: "#94a3b8" }}>Product / Service</label>
              <textarea
                value={product}
                onChange={e => setProduct(e.target.value)}
                placeholder={`Describe your product or service for ${meta.label}…`}
                className="w-full resize-none text-[14px] outline-none"
                style={{ color: "#0f172a", minHeight: 80, background: "transparent" }}
              />
            </div>

            <button
              onClick={run}
              disabled={loading || !product.trim()}
              className="w-full py-3 rounded-2xl font-bold text-[14px] transition-all"
              style={{
                background: loading ? "#fef3c7" : meta.color,
                color: meta.color === "#FFD60A" ? "#1a1a00" : "white",
                opacity: !product.trim() ? 0.5 : 1,
              }}
            >
              {loading ? "Building…" : `Build ${meta.label}`}
            </button>

            {(loading || stream) && (
              <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FF9500" }} />
                  <span className="text-[11px] font-semibold" style={{ color: "#FF9500" }}>
                    {loading ? `${meta.icon} Generating pricing model…` : "Complete — saved to Documents"}
                  </span>
                </div>
                <pre className="text-[13px] leading-relaxed whitespace-pre-wrap font-sans" style={{ color: "#1e293b" }}>{stream}</pre>
              </div>
            )}
          </>
        ) : (
          outputs.length === 0 ? (
            <div className="text-center py-16" style={{ color: "#94a3b8" }}>
              <div className="text-4xl mb-3">💰</div>
              <p className="text-[14px]">No pricing models built yet</p>
              <p className="text-[12px]">Design your first pricing strategy</p>
            </div>
          ) : outputs.map(o => (
            <div key={o.id} className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full mr-2" style={{ background: "rgba(255,149,0,0.12)", color: "#b45309" }}>
                    {MODE_META[o.mode].icon} {MODE_META[o.mode].label}
                  </span>
                  <p className="font-semibold text-[14px] mt-1.5" style={{ color: "#0f172a" }}>{o.product}</p>
                </div>
                <span className="text-[10px] flex-shrink-0" style={{ color: "#94a3b8" }}>{new Date(o.ts).toLocaleDateString()}</span>
              </div>
              <p className="text-[12px] line-clamp-3" style={{ color: "#64748b" }}>{o.output.slice(0, 280)}…</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
