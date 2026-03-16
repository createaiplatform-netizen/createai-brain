import React, { useState, useRef, useEffect } from "react";
import { CreationStore, Creation, CreationType, parseSections, buildPrompt } from "@/standalone/creation/CreationStore";

// ─── Quick Generator Types (existing) ────────────────────────────────────────
const QUICK_TYPES = [
  { id: "Document",        icon: "📄", color: "#007AFF", desc: "Reports, summaries, proposals" },
  { id: "Template",        icon: "🗂️", color: "#5856D6", desc: "Reusable frameworks" },
  { id: "Workflow",        icon: "🔄", color: "#34C759", desc: "Step-by-step process maps" },
  { id: "Policy",          icon: "📜", color: "#FF9500", desc: "Structural policy docs" },
  { id: "Checklist",       icon: "✅", color: "#34C759", desc: "Task verification checklists" },
  { id: "Training Module", icon: "🎓", color: "#30B0C7", desc: "Learning content" },
  { id: "Custom",          icon: "✨", color: "#FF2D55", desc: "Describe anything freely" },
];

// ─── Build Engine Creation Types ──────────────────────────────────────────────
const BUILD_TYPES: { id: CreationType; icon: string; color: string; label: string; desc: string; genres: string[]; styles: string[] }[] = [
  {
    id: "movie", icon: "🎬", color: "#FF2D55", label: "Movie / Film",
    desc: "Animated, cartoon, live-action — full treatment, scenes, script, characters, trailer",
    genres: ["Action", "Drama", "Comedy", "Sci-Fi", "Horror", "Romance", "Thriller", "Fantasy", "Documentary", "Animation"],
    styles: ["Animated / Cartoon", "Live Action", "Comic Style", "Cinematic Realism", "Noir", "Anime", "Mockumentary"],
  },
  {
    id: "comic", icon: "📖", color: "#FF9500", label: "Comic / Graphic Novel",
    desc: "Full panel breakdowns, characters, dialogue, art direction, cover copy",
    genres: ["Superhero", "Fantasy", "Sci-Fi", "Horror", "Slice of Life", "Action", "Mystery", "Romance"],
    styles: ["Western Comics", "Manga", "Indie", "Noir", "Colorful Pop Art", "Gritty Realistic", "Minimalist"],
  },
  {
    id: "software", icon: "💻", color: "#007AFF", label: "Software Product",
    desc: "Full product spec, dashboard, features, workflows, documentation, marketing",
    genres: ["SaaS", "Mobile App", "Enterprise Platform", "Marketplace", "AI Tool", "Healthcare Tech", "Fintech", "EdTech"],
    styles: ["Modern SaaS", "Enterprise", "Consumer", "B2B", "Mobile-First", "AI-Powered", "No-Code"],
  },
  {
    id: "document", icon: "📄", color: "#34C759", label: "Document / Report",
    desc: "Full multi-section document with executive summary, analysis, recommendations, appendices",
    genres: ["Business Report", "Research Paper", "Policy Brief", "Proposal", "White Paper", "Case Study", "Strategic Plan"],
    styles: ["Executive", "Academic", "Plain Language", "Technical", "Consultancy", "Government"],
  },
  {
    id: "marketing", icon: "📣", color: "#FF9500", label: "Marketing System",
    desc: "Landing page, funnel stages, email sequence, ad copy, content calendar",
    genres: ["SaaS Product", "E-Commerce", "Healthcare", "Education", "Finance", "Lifestyle", "B2B Service"],
    styles: ["Conversion-Focused", "Brand-Story", "Educational", "Direct Response", "Premium", "Community-Driven"],
  },
  {
    id: "custom", icon: "✨", color: "#BF5AF2", label: "Custom Creation",
    desc: "Any creation type — game concept, music album, architecture brief, recipe book, anything",
    genres: ["Entertainment", "Technology", "Education", "Health", "Art", "Business", "Science", "Custom"],
    styles: ["Creative", "Structured", "Narrative", "Technical", "Visual", "Mixed"],
  },
];

const TONES = ["Professional", "Creative", "Plain Language", "Executive Brief", "Educational", "Cinematic", "Empowering"];

// ─── Open standalone helper ───────────────────────────────────────────────────
function openCreation(id: string) {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  window.open(`${base}/standalone/creation/${id}`, "_blank", "noopener");
}

// ─── Build Engine ─────────────────────────────────────────────────────────────
function BuildEngine() {
  const [step, setStep] = useState<"type" | "config" | "building" | "done">("type");
  const [selectedType, setSelectedType] = useState<typeof BUILD_TYPES[0] | null>(null);
  const [name, setName]         = useState("");
  const [description, setDesc]  = useState("");
  const [genre, setGenre]       = useState("");
  const [style, setStyle]       = useState("");
  const [tone, setTone]         = useState("Professional");
  const [buildLog, setBuildLog] = useState<string[]>([]);
  const [streamPct, setStreamPct] = useState(0);
  const [builtId, setBuiltId]   = useState<string | null>(null);
  const [gallery, setGallery]   = useState<Creation[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setGallery(CreationStore.getAll());
  }, [step]);

  const reset = () => {
    setStep("type"); setSelectedType(null);
    setName(""); setDesc(""); setGenre(""); setStyle(""); setTone("Professional");
    setBuildLog([]); setStreamPct(0); setBuiltId(null);
  };

  const handleBuild = async () => {
    if (!selectedType || !name.trim() || !description.trim()) return;
    setStep("building");
    setBuildLog(["🚀 Initializing Creation Engine…", `📐 Building: ${selectedType.label} — "${name}"`, "🤖 Generating content with AI…"]);
    setStreamPct(5);

    const id = `${selectedType.id}-${Date.now()}`;
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const prompt = buildPrompt(selectedType.id, name, description, genre || selectedType.genres[0], style || selectedType.styles[0], tone);

      const res = await fetch("/api/openai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "Document", description: prompt, tone }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error("Generation failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let charCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (!data || data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulated += parsed.content;
              charCount += parsed.content.length;
              // Update log and progress
              const pct = Math.min(95, 5 + Math.floor(charCount / 80));
              setStreamPct(pct);
              if (pct % 15 === 0) {
                const logs: Record<number, string> = {
                  20: "📝 Writing core content…",
                  35: "🎨 Adding creative details…",
                  50: "🔧 Building structure…",
                  65: "✍️ Generating supporting sections…",
                  80: "📣 Creating marketing content…",
                };
                if (logs[pct]) setBuildLog(prev => [...prev, logs[pct]]);
              }
            }
          } catch {}
        }
      }

      setBuildLog(prev => [...prev, "🗂️ Parsing sections…", "💾 Saving to Creation Store…"]);
      setStreamPct(98);

      const sections = parseSections(accumulated);
      const creation: Creation = {
        id,
        type: selectedType.id,
        name,
        description,
        genre: genre || selectedType.genres[0],
        style: style || selectedType.styles[0],
        tone,
        createdAt: new Date().toISOString(),
        rawContent: accumulated,
        sections,
      };
      CreationStore.save(creation);
      setBuiltId(id);
      setBuildLog(prev => [...prev, `✅ "${name}" built successfully — ${sections.length} sections generated!`]);
      setStreamPct(100);
      setTimeout(() => setStep("done"), 600);

    } catch (err: any) {
      if (err.name !== "AbortError") {
        setBuildLog(prev => [...prev, "❌ Error during generation. Please try again."]);
      }
    } finally {
      abortRef.current = null;
    }
  };

  // ── Gallery view ──
  if (showGallery) {
    return (
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowGallery(false)} className="text-primary text-sm font-medium">‹ Build</button>
          <h2 className="text-xl font-bold text-foreground flex-1">My Creations</h2>
          <span className="text-[12px] text-muted-foreground">{gallery.length} creations</span>
        </div>
        {gallery.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✨</p>
            <p className="text-muted-foreground text-sm">No creations yet. Build your first one!</p>
            <button onClick={() => setShowGallery(false)} className="mt-4 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90">Build Now →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {gallery.map(c => {
              const bt = BUILD_TYPES.find(t => t.id === c.type);
              return (
                <div key={c.id} className="flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: (bt?.color ?? "#007AFF") + "22" }}>{bt?.icon ?? "✨"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] text-foreground truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{bt?.label} · {new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => openCreation(c.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-white px-3 py-1.5 rounded-lg hover:opacity-90 flex-shrink-0"
                    style={{ backgroundColor: bt?.color ?? "#007AFF" }}>↗ Open</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Step: Type selection ──
  if (step === "type") {
    return (
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">🚀 Creation Engine</h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">Build any creation as a full standalone product with its own URL.</p>
          </div>
          {gallery.length > 0 && (
            <button onClick={() => { setGallery(CreationStore.getAll()); setShowGallery(true); }}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground border border-border/50 rounded-xl px-3 py-2 hover:bg-muted flex-shrink-0">
              📁 {gallery.length}
            </button>
          )}
        </div>

        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">What are you building?</p>
        <div className="space-y-2">
          {BUILD_TYPES.map(type => (
            <button key={type.id} onClick={() => { setSelectedType(type); setGenre(type.genres[0]); setStyle(type.styles[0]); setStep("config"); }}
              className="w-full flex items-center gap-4 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left group">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: type.color + "22" }}>
                {type.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[14px] text-foreground">{type.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{type.desc}</p>
              </div>
              <span className="text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step: Config ──
  if (step === "config" && selectedType) {
    const canBuild = name.trim() && description.trim();
    return (
      <div className="p-5 space-y-5">
        <button onClick={() => setStep("type")} className="text-primary text-sm font-medium">‹ Type</button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: selectedType.color + "22" }}>
            {selectedType.icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{selectedType.label}</h2>
            <p className="text-[12px] text-muted-foreground">Configure your standalone product</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-1.5">Title / Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={`e.g. "${selectedType.id === "movie" ? "The Last Signal" : selectedType.id === "comic" ? "Iron Dawn #1" : selectedType.id === "software" ? "FlowTrack Pro" : selectedType.id === "document" ? "Q4 Strategy Report" : selectedType.id === "marketing" ? "LaunchKit Pro" : "My Custom Creation"}"`}
              className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-1.5">Description *</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} rows={4}
              placeholder={`Describe your ${selectedType.label.toLowerCase()} in detail. The more specific you are, the richer the output. What is it about? Who is it for? What's the tone, theme, or goal?`}
              className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all" />
          </div>

          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-1.5">Genre / Category</label>
            <div className="flex flex-wrap gap-1.5">
              {selectedType.genres.map(g => (
                <button key={g} onClick={() => setGenre(g)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${genre === g ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-1.5">Style</label>
            <div className="flex flex-wrap gap-1.5">
              {selectedType.styles.map(s => (
                <button key={s} onClick={() => setStyle(s)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${style === s ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-1.5">Tone</label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map(t => (
                <button key={t} onClick={() => setTone(t)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${tone === t ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleBuild} disabled={!canBuild}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            style={{ backgroundColor: selectedType.color }}>
            <span>🚀</span>
            <span>Build {selectedType.label} — Open as Standalone Product</span>
          </button>
          <p className="text-[10px] text-muted-foreground text-center">All creations are mock/simulated. Generated content opens in a new tab with full navigation, AI assistant, and downloads.</p>
        </div>
      </div>
    );
  }

  // ── Step: Building ──
  if (step === "building") {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Building your {selectedType?.label}…</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">"{name}"</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-bold text-primary">{streamPct}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${streamPct}%`, backgroundColor: selectedType?.color ?? "#007AFF" }} />
          </div>
        </div>

        <div className="bg-muted/40 border border-border/40 rounded-2xl p-4 space-y-2 max-h-48 overflow-y-auto">
          {buildLog.map((log, i) => (
            <p key={i} className="text-[12px] text-foreground font-mono flex items-center gap-2 animate-in fade-in duration-300">
              {log}
            </p>
          ))}
          {streamPct < 100 && (
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span>Generating…</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground text-center">The Creation Engine is generating your complete standalone product. This may take 30–60 seconds for large creations.</p>
      </div>
    );
  }

  // ── Step: Done ──
  if (step === "done" && builtId && selectedType) {
    return (
      <div className="p-6 space-y-5 text-center">
        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl" style={{ backgroundColor: selectedType.color + "22" }}>
          {selectedType.icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">"{name}"</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Your {selectedType.label} is ready — {CreationStore.get(builtId)?.sections.length ?? 0} sections generated</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-[13px] text-green-700 font-semibold">✅ Standalone product built successfully</p>
          <p className="text-[11px] text-green-600 mt-1">Opens in a new tab with full navigation, AI Studio, downloads, and marketing pages.</p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => openCreation(builtId)}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            style={{ backgroundColor: selectedType.color }}>
            <span>↗</span><span>Open "{name}" — Standalone Product</span>
          </button>
          <button onClick={reset}
            className="w-full py-2.5 rounded-2xl border border-border/50 text-muted-foreground text-sm font-medium hover:bg-muted transition-colors">
            Build Another Creation
          </button>
          <button onClick={() => { setGallery(CreationStore.getAll()); setShowGallery(true); }}
            className="w-full py-2.5 rounded-2xl border border-border/50 text-muted-foreground text-sm font-medium hover:bg-muted transition-colors">
            📁 View All Creations ({CreationStore.getAll().length})
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Quick Generator (existing) ───────────────────────────────────────────────
interface GeneratedItem { id: string; type: string; description: string; content: string; createdAt: Date; }

function QuickGenerator() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription]   = useState("");
  const [tone, setTone]                 = useState("Professional");
  const [streaming, setStreaming]       = useState(false);
  const [streamText, setStreamText]     = useState("");
  const [history, setHistory]           = useState<GeneratedItem[]>([]);
  const [view, setView]                 = useState<"grid"|"form"|"output"|"history">("grid");
  const [viewingItem, setViewingItem]   = useState<GeneratedItem | null>(null);
  const [copied, setCopied]             = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    if (!selectedType || !description.trim()) return;
    setStreaming(true); setStreamText(""); setView("output");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/openai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedType, description, tone }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error("Failed");
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let acc = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const d = line.slice(6); if (!d || d === "[DONE]") continue;
          try {
            const p = JSON.parse(d);
            if (p.content) { acc += p.content; setStreamText(acc); }
            if (p.done) setHistory(prev => [{ id: Date.now().toString(), type: selectedType, description, content: acc, createdAt: new Date() }, ...prev]);
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") setStreamText("[Generation error — please try again.]");
    } finally { setStreaming(false); abortRef.current = null; }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(viewingItem ? viewingItem.content : streamText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (view === "history" && viewingItem) {
    const td = QUICK_TYPES.find(t => t.id === viewingItem.type);
    return (
      <div className="p-5 space-y-4">
        <button onClick={() => { setViewingItem(null); }} className="text-primary text-sm font-medium">‹ History</button>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{td?.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground">{viewingItem.type}</p>
            <p className="text-[11px] text-muted-foreground truncate">{viewingItem.description}</p>
          </div>
          <button onClick={handleCopy} className="text-[11px] bg-muted px-3 py-1.5 rounded-lg">{copied ? "✓ Copied!" : "Copy"}</button>
        </div>
        <div className="bg-muted/40 border border-border/40 rounded-2xl p-4 max-h-[55vh] overflow-y-auto">
          <pre className="text-[12px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">{viewingItem.content}</pre>
        </div>
      </div>
    );
  }

  if (view === "history") {
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("grid")} className="text-primary text-sm font-medium">‹ Generate</button>
          <h2 className="text-xl font-bold text-foreground flex-1">Generated Items</h2>
          <span className="text-[12px] text-muted-foreground">{history.length}</span>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-3xl mb-3">📭</p><p className="text-sm">Nothing generated yet.</p>
            <button onClick={() => setView("grid")} className="mt-4 text-primary text-sm font-medium">Start →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(item => {
              const td = QUICK_TYPES.find(t => t.id === item.type);
              return (
                <button key={item.id} onClick={() => setViewingItem(item)}
                  className="w-full flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 text-left transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: (td?.color ?? "#007AFF") + "22" }}>{td?.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] text-foreground">{item.type}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>
                  </div>
                  <span className="text-muted-foreground">→</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (view === "output") {
    const td = QUICK_TYPES.find(t => t.id === selectedType);
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => { setView("grid"); setSelectedType(null); setStreamText(""); }} className="text-primary text-sm font-medium">‹ Generate</button>
          <span className="text-xl">{td?.icon}</span>
          <p className="font-bold text-foreground flex-1">{selectedType}</p>
          <div className="flex gap-1.5">
            {streaming && <button onClick={() => abortRef.current?.abort()} className="text-[11px] bg-red-50 text-red-500 border border-red-200 rounded-lg px-2.5 py-1.5">Stop</button>}
            {!streaming && streamText && <><button onClick={handleCopy} className="text-[11px] bg-muted rounded-lg px-2.5 py-1.5">{copied ? "✓" : "Copy"}</button><button onClick={() => { setView("grid"); setSelectedType(null); setStreamText(""); }} className="text-[11px] bg-primary text-white rounded-lg px-2.5 py-1.5">+ New</button></>}
          </div>
        </div>
        {!streamText && streaming && (
          <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground text-sm">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Generating {selectedType}…</span>
          </div>
        )}
        {streamText && (
          <div className="bg-muted/40 border border-border/40 rounded-2xl p-4 max-h-[60vh] overflow-y-auto">
            <pre className="text-[12px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">{streamText}{streaming && <span className="inline-block w-2 h-3 bg-primary/60 animate-pulse ml-0.5 align-middle" />}</pre>
          </div>
        )}
      </div>
    );
  }

  if (view === "form" && selectedType) {
    const td = QUICK_TYPES.find(t => t.id === selectedType)!;
    return (
      <div className="p-5 space-y-4">
        <button onClick={() => setView("grid")} className="text-primary text-sm font-medium">‹ Types</button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: td.color + "22" }}>{td.icon}</div>
          <div><h2 className="text-xl font-bold text-foreground">{td.id}</h2><p className="text-[12px] text-muted-foreground">{td.desc}</p></div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-1.5">Describe what you want</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder={`Describe your ${td.id.toLowerCase()} in detail…`}
              className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-foreground block mb-1.5">Tone</label>
            <div className="flex flex-wrap gap-1.5">
              {["Professional", "Plain Language", "Executive Brief", "Educational", "Empowering", "Clinical Structural"].map(t => (
                <button key={t} onClick={() => setTone(t)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${tone === t ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleGenerate} disabled={!description.trim()}
            className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
            <span>✨</span><span>Generate {td.id}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Quick Generate</h2>
          <p className="text-[13px] text-muted-foreground">Instant document and content generation.</p>
        </div>
        {history.length > 0 && (
          <button onClick={() => setView("history")}
            className="text-[11px] text-muted-foreground border border-border/50 rounded-xl px-3 py-2 hover:bg-muted">
            📂 {history.length}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_TYPES.map(type => (
          <button key={type.id} onClick={() => { setSelectedType(type.id); setView("form"); }}
            className="flex items-start gap-2.5 p-3 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: type.color + "22" }}>{type.icon}</div>
            <div><p className="font-semibold text-[12px] text-foreground">{type.id}</p><p className="text-[9px] text-muted-foreground">{type.desc}</p></div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main CreatorApp ──────────────────────────────────────────────────────────
export function CreatorApp() {
  const [activeTab, setActiveTab] = useState<"build" | "generate">("build");

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex gap-1 p-3 border-b border-border/50 bg-background flex-shrink-0">
        <button onClick={() => setActiveTab("build")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-bold transition-colors ${activeTab === "build" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>
          <span>🚀</span><span>Creation Engine</span>
        </button>
        <button onClick={() => setActiveTab("generate")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-bold transition-colors ${activeTab === "generate" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>
          <span>✨</span><span>Quick Generate</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "build"    && <BuildEngine />}
        {activeTab === "generate" && <QuickGenerator />}
      </div>
    </div>
  );
}
