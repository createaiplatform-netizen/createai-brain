import React, { useState, useRef, useEffect } from "react";
import { getGuideResponse, type GuideContext } from "@/engine/guideEngine";

interface GuidePanelProps {
  ctx: GuideContext;
}

async function streamGuide(
  prompt: string,
  systemCtx: string,
  onChunk: (t: string) => void,
  signal: AbortSignal,
) {
  const res = await fetch("/api/openai/universal-demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      domain: systemCtx,
      mode: "demo",
      layer: "surface",
      action: "drill",
      target: prompt,
    }),
    signal,
  });
  if (!res.ok || !res.body) return;
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let acc = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value, { stream: true }).split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6);
      if (!raw || raw === "[DONE]") continue;
      try {
        const d = JSON.parse(raw);
        if (d.content) { acc += d.content; onChunk(acc); }
      } catch { /* skip */ }
    }
  }
}

export function GuidePanel({ ctx }: GuidePanelProps) {
  const guide = getGuideResponse(ctx);
  const [aiText, setAiText] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);
  const [question, setQuestion] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setAiText("");
  }, [ctx.mode, ctx.section, ctx.filters.industry]);

  const askAI = async (q: string) => {
    if (!q.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setAiStreaming(true);
    setAiText("");
    const systemCtx = `${ctx.filters.industry} platform guide — mode: ${ctx.mode} — section: ${ctx.section}`;
    try {
      await streamGuide(q, systemCtx, t => setAiText(t), controller.signal);
    } catch (e: any) {
      if (e.name !== "AbortError") setAiText("[Could not reach AI guide — please try again]");
    } finally {
      setAiStreaming(false);
    }
  };

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    askAI(question);
    setQuestion("");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.30)" }}
          >
            🧠
          </div>
          <div>
            <div className="text-[12px] font-bold text-white">AI Guide</div>
            <div className="text-[9px]" style={{ color: "rgba(148,163,184,0.45)" }}>Context-aware · Always helpful</div>
          </div>
        </div>
      </div>

      {/* Static guide content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" style={{ scrollbarWidth: "none" }}>
        <div>
          <div className="text-[13px] font-bold text-white mb-1">{guide.title}</div>
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(148,163,184,0.65)" }}>
            {guide.intro}
          </p>
        </div>

        {guide.paragraphs.map((para, i) => (
          <div key={i} className="space-y-1">
            <div className="text-[11px] font-semibold" style={{ color: "#a5b4fc" }}>{para.heading}</div>
            <p className="text-[11px] leading-relaxed" style={{ color: "rgba(148,163,184,0.60)" }}>
              {para.body}
            </p>
          </div>
        ))}

        {/* Next steps */}
        <div
          className="rounded-xl p-3 space-y-1.5"
          style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(165,180,252,0.60)" }}>
            Suggested next steps
          </div>
          {guide.nextSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[10px] font-bold mt-0.5" style={{ color: "#6366f1" }}>→</span>
              <span className="text-[11px] leading-snug" style={{ color: "rgba(148,163,184,0.65)" }}>{step}</span>
            </div>
          ))}
        </div>

        {/* Tip */}
        <div
          className="rounded-xl p-3"
          style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)" }}
        >
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(134,239,172,0.75)" }}>
            💡 {guide.tip}
          </p>
        </div>

        {/* AI streamed answer */}
        {(aiText || aiStreaming) && (
          <div
            className="rounded-xl p-3"
            style={{ background: "rgba(14,18,42,0.80)", border: "1px solid rgba(99,102,241,0.22)" }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(165,180,252,0.55)" }}>
              AI Response
            </div>
            <div className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.75)" }}>
              {aiText}
              {aiStreaming && (
                <span className="inline-block w-1.5 h-3 rounded-sm animate-pulse align-middle ml-0.5" style={{ background: "#a5b4fc" }} />
              )}
            </div>
          </div>
        )}

        {/* Quick questions */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(148,163,184,0.35)" }}>
            Ask me anything
          </div>
          {[
            `How does this platform help ${ctx.filters.industry} teams?`,
            `What's the biggest AI opportunity in ${ctx.mode} mode?`,
            `What should I demo to a new client?`,
          ].map(q => (
            <button
              key={q}
              onClick={() => askAI(q)}
              disabled={aiStreaming}
              className="w-full text-left px-3 py-2 rounded-lg text-[11px] transition-all"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#64748b" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.25)";
                (e.currentTarget as HTMLElement).style.color = "#94a3b8";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLElement).style.color = "#64748b";
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Ask input */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask the AI Guide…"
            disabled={aiStreaming}
            className="flex-1 bg-transparent text-white text-[12px] px-3 py-2 rounded-xl outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.22)" }}
          />
          <button
            type="submit"
            disabled={aiStreaming || !question.trim()}
            className="px-3 py-2 rounded-xl text-[11px] font-bold text-white transition-all disabled:opacity-40"
            style={{ background: "rgba(99,102,241,0.70)" }}
          >
            →
          </button>
        </form>
      </div>
    </div>
  );
}
