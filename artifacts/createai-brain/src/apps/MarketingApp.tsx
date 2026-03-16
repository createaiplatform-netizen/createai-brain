import React, { useState, useRef } from "react";
import { useOS } from "@/os/OSContext";

const ASSETS = [
  { type: "Website Copy",    icon: "🌐", color: "#007AFF", desc: "Hero, features, about, CTA sections" },
  { type: "Pitch Deck",      icon: "📊", color: "#5856D6", desc: "Slide-by-slide investor-ready outline" },
  { type: "Social Posts",    icon: "📱", color: "#FF2D55", desc: "LinkedIn, Instagram, X, Facebook" },
  { type: "Brand Kit",       icon: "🎨", color: "#FF9500", desc: "Voice, tone, taglines, and core values" },
  { type: "Email Sequence",  icon: "📧", color: "#30B0C7", desc: "Outreach, follow-up, re-engage series" },
  { type: "Brochure",        icon: "📋", color: "#34C759", desc: "One-pager or multi-section print-ready" },
];

export function MarketingApp() {
  const { preferences } = useOS();
  const [active, setActive] = useState<string | null>(null);
  const [brief, setBrief] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const reset = () => { setActive(null); setBrief(""); setStreamText(""); setDone(false); };

  const generate = async () => {
    const asset = ASSETS.find(a => a.type === active);
    if (!asset || !brief.trim()) return;
    setStreaming(true); setStreamText(""); setDone(false);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/openai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: asset.type,
          description: `Create a complete, professional ${asset.type} for the following:\n\n${brief}\n\nMake it detailed, compelling, and well-structured. Use clear sections with headers. Include specific copy, not just placeholders. Label all outputs as mock/simulated for demonstration.`,
          tone: preferences.tone ?? "Professional",
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error("Generation failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (!data || data === "[DONE]") continue;
          try { const p = JSON.parse(data); if (p.content) { acc += p.content; setStreamText(acc); } } catch {}
        }
      }
      setDone(true);
    } catch (err: any) {
      if (err.name !== "AbortError") setStreamText("[Generation error — please try again.]");
    } finally { setStreaming(false); abortRef.current = null; }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(streamText).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  if (active) {
    const asset = ASSETS.find(a => a.type === active)!;
    return (
      <div className="p-6 space-y-5">
        <button onClick={reset} className="text-primary text-sm font-medium">‹ Marketing</button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: asset.color + "22" }}>{asset.icon}</div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{asset.type}</h2>
            <p className="text-[11px] text-muted-foreground">{asset.desc}</p>
          </div>
        </div>

        {!streamText && !streaming && (
          <div className="space-y-4">
            <textarea value={brief} onChange={e => setBrief(e.target.value)}
              placeholder={`Describe your product, audience, tone, and goals for the ${asset.type}…`}
              className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              rows={4} />
            <button onClick={generate} disabled={!brief.trim()}
              className="w-full text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
              style={{ backgroundColor: asset.color }}>
              Generate {asset.type}
            </button>
          </div>
        )}

        {(streaming || streamText) && (
          <div className="space-y-3">
            {streaming && (
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: asset.color }} />
                Generating your {asset.type}…
              </div>
            )}
            <div className="bg-muted/30 border border-border/50 rounded-xl p-4 max-h-96 overflow-y-auto">
              <pre className="text-[12px] text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                {streamText}
                {streaming && <span className="inline-block w-1.5 h-4 bg-primary/70 animate-pulse ml-0.5 align-middle" />}
              </pre>
            </div>
            {done && (
              <div className="flex gap-2">
                <button onClick={copyOutput}
                  className={`flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all ${copied ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
                  {copied ? "✓ Copied!" : "📋 Copy"}
                </button>
                <button onClick={() => { setStreamText(""); setDone(false); setBrief(""); }}
                  className="flex-1 bg-muted text-muted-foreground text-sm font-semibold py-2.5 rounded-xl hover:bg-muted/80 transition-colors">
                  ↺ New Brief
                </button>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground text-center">All content is mock/simulated · Not professional marketing advice</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Marketing Studio</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">Select an asset type, describe your brief, and the engine generates fully structured content instantly.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ASSETS.map(a => (
          <button key={a.type} onClick={() => { setActive(a.type); setStreamText(""); setDone(false); }}
            className="flex flex-col items-start gap-2 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: a.color + "22" }}>{a.icon}</div>
            <p className="font-semibold text-[13px] text-foreground">{a.type}</p>
            <p className="text-[11px] text-muted-foreground">{a.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
