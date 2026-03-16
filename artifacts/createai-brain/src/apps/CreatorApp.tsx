import React, { useState, useRef } from "react";

const CREATION_TYPES = [
  { id: "Document",          icon: "📄", color: "#007AFF", desc: "Reports, summaries, proposals, SOPs" },
  { id: "Template",          icon: "🗂️", color: "#5856D6", desc: "Reusable frameworks for any use case" },
  { id: "Workflow",          icon: "🔄", color: "#34C759", desc: "Step-by-step process maps" },
  { id: "Policy",            icon: "📜", color: "#FF9500", desc: "Structural policy documents" },
  { id: "Procedure",         icon: "📋", color: "#FF6B6B", desc: "Operational step-by-step guides" },
  { id: "Form",              icon: "📝", color: "#BF5AF2", desc: "Input forms and data collection" },
  { id: "Packet",            icon: "📦", color: "#FF2D55", desc: "Bundled multi-document sets" },
  { id: "Training Module",   icon: "🎓", color: "#30B0C7", desc: "Learning content and curricula" },
  { id: "Checklist",         icon: "✅", color: "#34C759", desc: "Task and verification checklists" },
  { id: "Content Block",     icon: "🧱", color: "#FF9500", desc: "Reusable paragraphs, sections, copy" },
  { id: "Page",              icon: "🖼️", color: "#007AFF", desc: "Landing pages, about pages, feature pages" },
  { id: "UI Component",      icon: "📱", color: "#5856D6", desc: "Buttons, cards, modals, nav bars" },
  { id: "Project Structure", icon: "🏗️", color: "#636366", desc: "Folder trees, file maps, scaffolds" },
  { id: "Module",            icon: "🧩", color: "#BF5AF2", desc: "Standalone feature or sub-system" },
  { id: "Tool",              icon: "🛠️", color: "#FF6B6B", desc: "Utility, calculator, generator logic" },
  { id: "Asset",             icon: "🎨", color: "#FFD60A", desc: "Brand, visual, media descriptions" },
  { id: "Mock Data",         icon: "🗃️", color: "#30B0C7", desc: "Sample datasets and placeholder records" },
  { id: "Custom",            icon: "✨", color: "#FF2D55", desc: "Anything else — describe it freely" },
];

const TONES = [
  "Professional",
  "Plain Language",
  "Executive Brief",
  "Educational",
  "Empowering",
  "Clinical Structural",
];

interface GeneratedItem {
  id: string;
  type: string;
  description: string;
  content: string;
  createdAt: Date;
}

export function CreatorApp() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("Professional");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [history, setHistory] = useState<GeneratedItem[]>([]);
  const [view, setView] = useState<"grid" | "form" | "output" | "history">("grid");
  const [viewingItem, setViewingItem] = useState<GeneratedItem | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    if (!selectedType || !description.trim()) return;

    setStreaming(true);
    setStreamText("");
    setView("output");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/openai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedType, description, tone }),
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
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (!dataStr || dataStr === "[DONE]") continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                accumulated += data.content;
                setStreamText(accumulated);
              }
              if (data.done) {
                const item: GeneratedItem = {
                  id: Date.now().toString(),
                  type: selectedType,
                  description,
                  content: accumulated,
                  createdAt: new Date(),
                };
                setHistory(prev => [item, ...prev]);
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setStreamText("[Generation error — please try again.]");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleCopy = () => {
    const text = viewingItem ? viewingItem.content : streamText;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleNew = () => {
    setSelectedType(null);
    setDescription("");
    setStreamText("");
    setViewingItem(null);
    setView("grid");
  };

  // --- VIEW: history item detail ---
  if (view === "history" && viewingItem) {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => { setViewingItem(null); setView("history"); }} className="text-primary text-sm font-medium">‹ History</button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-3xl">{CREATION_TYPES.find(t => t.id === viewingItem.type)?.icon ?? "✨"}</span>
          <div>
            <h2 className="text-lg font-bold text-foreground">{viewingItem.type}</h2>
            <p className="text-[12px] text-muted-foreground">{viewingItem.description.slice(0, 60)}{viewingItem.description.length > 60 ? "…" : ""}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={handleCopy} className="text-[12px] bg-muted border border-border/50 rounded-lg px-3 py-1.5 text-foreground hover:bg-muted/80 transition-colors">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <div className="bg-muted/40 border border-border/40 rounded-2xl p-5 max-h-[60vh] overflow-y-auto">
          <pre className="text-[12px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">{viewingItem.content}</pre>
        </div>
      </div>
    );
  }

  // --- VIEW: history list ---
  if (view === "history") {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("grid")} className="text-primary text-sm font-medium">‹ Creator</button>
          <h2 className="text-xl font-bold text-foreground flex-1">Generated Items</h2>
          <span className="text-[12px] text-muted-foreground">{history.length} items</span>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <p className="text-3xl mb-3">📭</p>
            <p>Nothing generated yet.</p>
            <button onClick={() => setView("grid")} className="mt-4 text-primary text-sm font-medium">Start Creating →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(item => {
              const typeDef = CREATION_TYPES.find(t => t.id === item.type);
              return (
                <button
                  key={item.id}
                  onClick={() => { setViewingItem(item); }}
                  className="w-full flex items-start gap-4 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: (typeDef?.color ?? "#007AFF") + "22" }}>
                    {typeDef?.icon ?? "✨"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] text-foreground">{item.type}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{item.createdAt.toLocaleTimeString()}</p>
                  </div>
                  <span className="text-muted-foreground text-xs mt-1">→</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // --- VIEW: streaming output ---
  if (view === "output") {
    const typeDef = CREATION_TYPES.find(t => t.id === selectedType);
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={handleNew} className="text-primary text-sm font-medium">‹ Creator</button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-3xl">{typeDef?.icon ?? "✨"}</span>
          <div>
            <h2 className="text-lg font-bold text-foreground">{selectedType}</h2>
            <p className="text-[12px] text-muted-foreground">{description.slice(0, 60)}{description.length > 60 ? "…" : ""}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {streaming && (
              <button onClick={handleStop} className="text-[12px] bg-red-50 text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-100 transition-colors">
                Stop
              </button>
            )}
            {!streaming && streamText && (
              <>
                <button onClick={handleCopy} className="text-[12px] bg-muted border border-border/50 rounded-lg px-3 py-1.5 text-foreground hover:bg-muted/80 transition-colors">
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
                <button onClick={() => setView("form")} className="text-[12px] bg-muted border border-border/50 rounded-lg px-3 py-1.5 text-foreground hover:bg-muted/80 transition-colors">
                  Edit & Retry
                </button>
                <button onClick={handleNew} className="text-[12px] bg-primary text-white rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity">
                  + New
                </button>
              </>
            )}
          </div>
        </div>

        {streaming && !streamText && (
          <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground text-sm">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Universal Creation Engine is building your {selectedType}…</span>
          </div>
        )}

        {streamText && (
          <div className="bg-muted/40 border border-border/40 rounded-2xl p-5 max-h-[60vh] overflow-y-auto">
            <pre className="text-[12px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">{streamText}{streaming && <span className="inline-block w-2 h-3 bg-primary/60 animate-pulse ml-0.5 align-middle" />}</pre>
          </div>
        )}

        {!streaming && streamText && (
          <p className="text-[11px] text-muted-foreground text-center">All content is mock and structural only. Not for real-world use. Human expertise always required.</p>
        )}
      </div>
    );
  }

  // --- VIEW: form ---
  if (view === "form" && selectedType) {
    const typeDef = CREATION_TYPES.find(t => t.id === selectedType)!;
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("grid")} className="text-primary text-sm font-medium">‹ Types</button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: typeDef.color + "22" }}>
            {typeDef.icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{typeDef.id}</h2>
            <p className="text-[12px] text-muted-foreground">{typeDef.desc}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-2">
              Describe what you want to create
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={`e.g. A ${typeDef.id.toLowerCase()} for a horse boarding facility in rural Minnesota, covering seasonal care, feeding schedules, and client intake…`}
              className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              rows={5}
              autoFocus
            />
          </div>

          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-2">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`text-[12px] px-3 py-1.5 rounded-full border transition-all ${
                    tone === t
                      ? "bg-primary text-white border-primary"
                      : "bg-background text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!description.trim()}
            className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <span>✨</span>
            <span>Generate {typeDef.id}</span>
          </button>

          <p className="text-[11px] text-muted-foreground text-center">
            All outputs are mock and structural only. Human expertise always required for real decisions.
          </p>
        </div>
      </div>
    );
  }

  // --- VIEW: type grid (default) ---
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span>✨</span> Create Anything
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Choose a type, describe what you need, and the Brain builds it for you — instantly.
          </p>
        </div>
        <button
          onClick={() => setView("history")}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground border border-border/50 rounded-xl px-3 py-2 hover:bg-muted transition-colors flex-shrink-0"
        >
          <span>📂</span>
          <span>History {history.length > 0 ? `(${history.length})` : ""}</span>
        </button>
      </div>

      {/* Creation type grid */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">What do you want to create?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {CREATION_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedType(type.id);
                setView("form");
              }}
              className="flex items-start gap-3 p-3 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left group"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: type.color + "22" }}
              >
                {type.icon}
              </div>
              <div>
                <p className="font-semibold text-[12px] text-foreground leading-tight">{type.id}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{type.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick create CTA */}
      <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/10 rounded-2xl p-4">
        <p className="text-[13px] font-semibold text-foreground mb-1">Not sure where to start?</p>
        <p className="text-[12px] text-muted-foreground mb-3">
          Use Custom to describe anything in plain language — the Brain figures out the structure.
        </p>
        <button
          onClick={() => { setSelectedType("Custom"); setView("form"); }}
          className="text-[12px] bg-primary text-white rounded-xl px-4 py-2 hover:opacity-90 transition-opacity"
        >
          ✨ Create anything custom
        </button>
      </div>
    </div>
  );
}
