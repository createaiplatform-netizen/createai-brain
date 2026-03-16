import React, { useState, useRef } from "react";
import { useOS } from "@/os/OSContext";

const TOOLS = [
  { name: "Brochure Builder",       icon: "📋", color: "#007AFF", desc: "Professional brochures for any service or product", type: "Document" },
  { name: "Document Creator",       icon: "📄", color: "#34C759", desc: "Proposals, reports, summaries, SOPs", type: "Document" },
  { name: "Page Generator",         icon: "🖼️", color: "#FF9500", desc: "Landing pages, about pages, feature pages", type: "Page" },
  { name: "App Layout Generator",   icon: "📱", color: "#BF5AF2", desc: "App screens, navigation flows, UI labels", type: "UI Component" },
  { name: "Email Sequence Builder", icon: "📧", color: "#FF2D55", desc: "Outreach, follow-up, re-engage sequences", type: "Template" },
  { name: "FAQ Generator",          icon: "❓", color: "#30B0C7", desc: "Full FAQ section for any topic or product", type: "Content Block" },
  { name: "SOP Builder",            icon: "📑", color: "#5856D6", desc: "Standard operating procedures for any process", type: "Procedure" },
  { name: "Pricing Page Builder",   icon: "💲", color: "#FF9500", desc: "Plans, tiers, value props, and CTAs", type: "Page" },
  { name: "Training Module Creator",icon: "🎓", color: "#34C759", desc: "Structured learning content and curricula", type: "Training Module" },
  { name: "Checklist Generator",    icon: "✅", color: "#007AFF", desc: "Task, safety, onboarding, and verification checklists", type: "Checklist" },
  { name: "Mock Data Generator",    icon: "🗃️", color: "#636366", desc: "Sample datasets, placeholder records, demo tables", type: "Mock Data" },
  { name: "Custom Tool",            icon: "✨", color: "#FF2D55", desc: "Describe any tool — the Brain builds it", type: "Custom" },
];

interface ToolOutput { id: string; toolName: string; prompt: string; content: string; at: Date; }

export function ToolsApp() {
  const { preferences } = useOS();
  const [active, setActive] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [history, setHistory] = useState<ToolOutput[]>([]);
  const [view, setView] = useState<"grid" | "output" | "history" | "historyDetail">("grid");
  const [viewingItem, setViewingItem] = useState<ToolOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const tool = active ? TOOLS.find(t => t.name === active) : null;

  const handleGenerate = async () => {
    if (!active || !input.trim() || !tool) return;
    setStreaming(true);
    setStreamText("");
    setView("output");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/openai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: tool.type,
          description: `Using the ${tool.name}: ${input}`,
          tone: preferences.tone,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error("Generation failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6);
          if (!dataStr || dataStr === "[DONE]") continue;
          try {
            const data = JSON.parse(dataStr);
            if (data.content) { accumulated += data.content; setStreamText(accumulated); }
            if (data.done) {
              setHistory(prev => [{ id: Date.now().toString(), toolName: active, prompt: input, content: accumulated, at: new Date() }, ...prev]);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") setStreamText("[Generation error — please try again.]");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => abortRef.current?.abort();
  const handleCopy = () => {
    const text = viewingItem ? viewingItem.content : streamText;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  const handleNew = () => { setActive(null); setInput(""); setStreamText(""); setViewingItem(null); setView("grid"); };

  // ── History detail ──
  if (view === "historyDetail" && viewingItem) {
    const t = TOOLS.find(t => t.name === viewingItem.toolName);
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => { setViewingItem(null); setView("history"); }} className="text-primary text-sm font-medium">‹ History</button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{t?.icon ?? "🛠️"}</span>
          <div>
            <h2 className="text-lg font-bold text-foreground">{viewingItem.toolName}</h2>
            <p className="text-[12px] text-muted-foreground truncate">{viewingItem.prompt.slice(0, 60)}{viewingItem.prompt.length > 60 ? "…" : ""}</p>
          </div>
          <button onClick={handleCopy} className="ml-auto text-[12px] bg-muted border border-border/50 rounded-lg px-3 py-1.5 text-foreground hover:bg-muted/80 transition-colors">
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
        <div className="bg-muted/40 border border-border/40 rounded-2xl p-5 max-h-[60vh] overflow-y-auto">
          <pre className="text-[12px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">{viewingItem.content}</pre>
        </div>
      </div>
    );
  }

  // ── History list ──
  if (view === "history") {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("grid")} className="text-primary text-sm font-medium">‹ Tools</button>
          <h2 className="text-xl font-bold text-foreground flex-1">Tool History</h2>
          <span className="text-[12px] text-muted-foreground">{history.length} items</span>
        </div>
        {history.length === 0
          ? <div className="text-center py-16 text-muted-foreground text-sm">
              <p className="text-3xl mb-3">📭</p>
              <p>Nothing generated yet.</p>
              <button onClick={() => setView("grid")} className="mt-4 text-primary text-sm font-medium">Open a Tool →</button>
            </div>
          : <div className="space-y-2">
              {history.map(item => {
                const t = TOOLS.find(t => t.name === item.toolName);
                return (
                  <button key={item.id} onClick={() => { setViewingItem(item); setView("historyDetail"); }}
                    className="w-full flex items-start gap-4 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: (t?.color ?? "#007AFF") + "22" }}>
                      {t?.icon ?? "🛠️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] text-foreground">{item.toolName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.prompt}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{item.at.toLocaleTimeString()}</p>
                    </div>
                    <span className="text-muted-foreground text-xs mt-1">→</span>
                  </button>
                );
              })}
            </div>
        }
      </div>
    );
  }

  // ── Output ──
  if (view === "output") {
    return (
      <div className="p-6 space-y-5">
        <button onClick={handleNew} className="text-primary text-sm font-medium">‹ Tools</button>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-3xl">{tool?.icon ?? "🛠️"}</span>
          <div>
            <h2 className="text-lg font-bold text-foreground">{active}</h2>
            <p className="text-[12px] text-muted-foreground">{input.slice(0, 60)}{input.length > 60 ? "…" : ""}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {streaming && (
              <button onClick={handleStop} className="text-[12px] bg-red-50 text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-100 transition-colors">Stop</button>
            )}
            {!streaming && streamText && (
              <>
                <button onClick={handleCopy} className="text-[12px] bg-muted border border-border/50 rounded-lg px-3 py-1.5 text-foreground hover:bg-muted/80 transition-colors">
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
                <button onClick={() => setView("grid")} className="text-[12px] bg-muted border border-border/50 rounded-lg px-3 py-1.5 text-foreground hover:bg-muted/80 transition-colors">Edit</button>
                <button onClick={handleNew} className="text-[12px] bg-primary text-white rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity">+ New</button>
              </>
            )}
          </div>
        </div>
        {streaming && !streamText && (
          <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground text-sm">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>{active} is running…</span>
          </div>
        )}
        {streamText && (
          <div className="bg-muted/40 border border-border/40 rounded-2xl p-5 max-h-[60vh] overflow-y-auto">
            <pre className="text-[12px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {streamText}
              {streaming && <span className="inline-block w-2 h-3 bg-primary/60 animate-pulse ml-0.5 align-middle" />}
            </pre>
          </div>
        )}
        {!streaming && streamText && (
          <p className="text-[11px] text-muted-foreground text-center">All content is mock and structural only. Not for real-world use.</p>
        )}
      </div>
    );
  }

  // ── Tool form ──
  if (active && tool) {
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => { setActive(null); setInput(""); setView("grid"); }} className="text-primary text-sm font-medium">‹ Tools</button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: tool.color + "22" }}>
            {tool.icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{tool.name}</h2>
            <p className="text-[12px] text-muted-foreground">{tool.desc}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-2">Describe what you want to create</label>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              placeholder={`e.g. A ${tool.name.toLowerCase()} for a horse boarding facility in rural Minnesota…`}
              className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              rows={4} autoFocus />
          </div>
          <p className="text-[11px] text-muted-foreground">Tone: <strong>{preferences.tone}</strong> · Language: <strong>{preferences.language}</strong></p>
          <button onClick={handleGenerate} disabled={!input.trim()}
            className="bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40">
            Generate with {tool.name}
          </button>
        </div>
      </div>
    );
  }

  // ── Tool grid ──
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Tools</h2>
          <p className="text-[12px] text-muted-foreground">Pick a tool, describe your need, get it built instantly.</p>
        </div>
        <button onClick={() => setView("history")}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground border border-border/50 rounded-xl px-3 py-2 hover:bg-muted transition-colors flex-shrink-0">
          <span>📂</span>
          <span>History{history.length > 0 ? ` (${history.length})` : ""}</span>
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {TOOLS.map(t => (
          <button key={t.name} onClick={() => { setActive(t.name); setInput(""); setView("grid"); /* show form */ }}
            className="flex items-center gap-4 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left group">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: t.color + "22" }}>
              {t.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14px] text-foreground">{t.name}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{t.desc}</p>
            </div>
            <span className="text-muted-foreground text-xs flex-shrink-0">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
