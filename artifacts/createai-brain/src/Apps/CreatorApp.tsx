import React, { useState, useRef, useEffect } from "react";
import { SaveToProjectModal } from "@/components/SaveToProjectModal";
import { streamEngine } from "@/controller";
import {
  CreationStore, Creation, CreationType, parseSections, buildPrompt,
  classifyIntent, IntentResult, PATTERN_LIBRARY,
} from "@/standalone/creation/CreationStore";

// ─── Open standalone helper ───────────────────────────────────────────────────
function openCreation(id: string) {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  window.open(`${base}/standalone/creation/${id}`, "_blank", "noopener");
}

// ─── Type display meta ────────────────────────────────────────────────────────
const TYPE_META: Record<CreationType, { icon: string; color: string; label: string }> = {
  movie:     { icon: "🎬", color: "#FF2D55", label: "Film Production"    },
  comic:     { icon: "📖", color: "#FF9500", label: "Comic Universe"     },
  software:  { icon: "💻", color: "#007AFF", label: "Software / SaaS"   },
  document:  { icon: "📄", color: "#34C759", label: "Document Suite"     },
  marketing: { icon: "📣", color: "#FF9500", label: "Marketing System"   },
  game:      { icon: "🎮", color: "#5856D6", label: "Game Production"    },
  community: { icon: "🌐", color: "#30B0C7", label: "Community Platform" },
  custom:    { icon: "✨", color: "#BF5AF2", label: "Custom Creation"    },
};

// ─── Quick Start Chips ────────────────────────────────────────────────────────
const QUICK_STARTS = [
  { label: "🏥 Healthcare SaaS",    prompt: "A full healthcare scheduling SaaS platform with patient management, appointments, billing, and AI assistant for home health agencies" },
  { label: "🎬 Sci-Fi Film",        prompt: "An animated sci-fi film about the last human crew aboard a derelict space station who discovers the AI running it has become sentient" },
  { label: "📚 eLearning Platform", prompt: "A full LMS platform for professional certifications with courses, assessments, progress tracking, and an AI tutor" },
  { label: "🎮 RPG Game",           prompt: "A fantasy RPG game where a disgraced knight must reclaim a stolen kingdom using strategy, alliances, and magic abilities" },
  { label: "💰 Fintech CRM",        prompt: "A CRM and deal management SaaS for wealth advisors with client portfolios, pipeline tracking, compliance tools, and AI insights" },
  { label: "📖 Superhero Comic",    prompt: "A superhero comic where a teenage hacker accidentally uploads her consciousness into a city's power grid and must fight a corrupt megacorporation" },
  { label: "📣 Launch Funnel",      prompt: "A complete marketing funnel system for a SaaS product launch including landing page, email sequence, ads, and social content" },
  { label: "🌐 Creator Community",  prompt: "An online community platform for indie game developers with discussion forums, showcase galleries, collaboration tools, and a mentorship program" },
  { label: "⚙️ Operations Engine",  prompt: "A field service operations platform with job scheduling, technician dispatch, real-time tracking, work orders, and customer portal" },
  { label: "✨ Describe Anything",  prompt: "" },
];

// ─── Architecture Preview Card ────────────────────────────────────────────────
function ArchitectureCard({ intent, onConfirm, onBack }: { intent: IntentResult; onConfirm: () => void; onBack: () => void }) {
  const meta = TYPE_META[intent.type];
  return (
    <div className="p-5 space-y-5">
      <button onClick={onBack} className="text-primary text-sm font-medium">‹ Describe</button>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-[11px] font-bold text-green-600 uppercase tracking-wider">Everything Engine — Analysis Complete</p>
        </div>
        <div className="bg-gradient-to-br border rounded-2xl p-5 space-y-4" style={{ borderColor: meta.color + "40", background: meta.color + "08" }}>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ backgroundColor: meta.color + "22" }}>{meta.icon}</div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{intent.label}</h2>
              <p className="text-[12px] text-muted-foreground">{intent.domain !== "General" ? `${intent.domain} · ` : ""}{meta.label} · {intent.genre} style</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: intent.confidence === "high" ? "#34C759" : "#FF9500" }} />
                <span className="text-[10px] text-muted-foreground capitalize">{intent.confidence} confidence detection</span>
              </div>
            </div>
          </div>

          {intent.modules.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Modules Detected</p>
              <div className="flex flex-wrap gap-1.5">
                {intent.modules.map(m => (
                  <span key={m} className="text-[11px] px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: meta.color }}>{m}</span>
                ))}
              </div>
            </div>
          )}

          {intent.patterns.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Patterns Selected</p>
              <div className="flex flex-wrap gap-1.5">
                {intent.patterns.map(p => (
                  <span key={p} className="text-[11px] px-2 py-0.5 rounded-full font-medium border" style={{ borderColor: meta.color + "60", color: meta.color }}>{p}</span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-background/60 rounded-xl p-3 border" style={{ borderColor: meta.color + "30" }}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">What's Being Built</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                "Full UI + Navigation",
                "Interactive Workflows",
                "AI Studio (live chat)",
                "Marketing Pages",
                intent.modules.length > 0 ? `${intent.modules.length} Modules` : "Custom Sections",
                "Downloadable Docs",
              ].map(f => (
                <div key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button onClick={onConfirm}
        className="w-full py-4 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        style={{ backgroundColor: meta.color }}>
        <span>⚡</span><span>Build This — Open as Standalone Product</span>
      </button>
      <p className="text-[10px] text-muted-foreground text-center">Everything Engine will generate the full product in ~30-60 seconds. Opens in a new tab with its own URL.</p>
    </div>
  );
}

// ─── Build Progress ───────────────────────────────────────────────────────────
function BuildProgress({ name, icon, color, pct, log }: { name: string; icon: string; color: string; pct: number; log: string[] }) {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl" style={{ backgroundColor: color + "22" }}>{icon}</div>
        <h2 className="text-xl font-bold text-foreground">Building…</h2>
        <p className="text-[13px] text-muted-foreground">"{name}"</p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">Everything Engine</span>
          <span className="font-bold text-primary">{pct}%</span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
      <div className="bg-muted/40 border border-border/40 rounded-2xl p-4 space-y-1.5 max-h-52 overflow-y-auto">
        {log.map((l, i) => (
          <p key={i} className="text-[12px] text-foreground font-mono">{l}</p>
        ))}
        {pct < 100 && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span>Generating…</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  "draft":       { label: "Draft",       className: "bg-muted text-muted-foreground" },
  "in-progress": { label: "In Progress", className: "bg-primary/15 text-primary" },
  "complete":    { label: "Complete",    className: "bg-green-500/15 text-green-400" },
  "archived":    { label: "Archived",    className: "bg-orange-500/15 text-orange-400" },
};

// ─── Gallery ──────────────────────────────────────────────────────────────────
function Gallery({ onClose }: { onClose: () => void }) {
  const [items, setItems]           = useState<Creation[]>([]);
  const [filter, setFilter]         = useState<string>("all");
  const [copied, setCopied]         = useState<string | null>(null);

  const refresh = () => setItems(CreationStore.getAll());
  useEffect(() => { refresh(); }, []);

  const allTags = [...new Set(items.flatMap(c => c.tags ?? []))];
  const filtered = filter === "all" ? items : filter.startsWith("tag:") ? items.filter(c => (c.tags ?? []).includes(filter.slice(4))) : items.filter(c => (c.status ?? "draft") === filter);

  const cycleStatus = (c: Creation) => {
    const cycle: string[] = ["draft", "in-progress", "complete", "archived"];
    const next = cycle[(cycle.indexOf(c.status ?? "draft") + 1) % cycle.length] as any;
    CreationStore.updateStatus(c.id, next);
    refresh();
  };

  const handleCopy = async (c: Creation) => {
    const summary = `${c.name}\nType: ${c.type} | ${c.domain}\nSections: ${c.sections.length}\nCreated: ${new Date(c.createdAt).toLocaleDateString()}\n\nMock content — CreateAI Brain`;
    try { await navigator.clipboard.writeText(summary); } catch {}
    setCopied(c.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="text-primary text-sm font-medium">‹ Build</button>
        <h2 className="text-xl font-bold text-foreground flex-1">My Creations</h2>
        <span className="text-[12px] text-muted-foreground">{items.length}</span>
      </div>

      {/* Filter pills */}
      {items.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {["all", "draft", "in-progress", "complete", "archived"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[10px] px-2 py-1 rounded-full border transition-all font-medium ${filter === f ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}>
              {f === "all" ? "All" : STATUS_STYLES[f]?.label ?? f}
            </button>
          ))}
          {allTags.slice(0, 4).map(tag => (
            <button key={tag} onClick={() => setFilter(filter === `tag:${tag}` ? "all" : `tag:${tag}`)}
              className={`text-[10px] px-2 py-1 rounded-full border transition-all font-medium ${filter === `tag:${tag}` ? "bg-purple-600 text-white border-purple-600" : "border-border/50 text-muted-foreground hover:border-purple-300"}`}>
              #{tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-14">
          <p className="text-4xl mb-3">⚡</p>
          <p className="text-muted-foreground text-sm">{items.length === 0 ? "No creations yet." : "No creations match this filter."}</p>
          {items.length === 0 && <button onClick={onClose} className="mt-4 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90">Build Your First →</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const meta   = TYPE_META[c.type];
            const status = STATUS_STYLES[c.status ?? "draft"];
            return (
              <div key={c.id} className="bg-background rounded-2xl border border-border/50 hover:border-primary/20 transition-colors overflow-hidden">
                <div className="flex items-center gap-3 p-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: meta.color + "22" }}>{meta.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[13px] text-foreground truncate">{c.name}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${status.className}`}>{status.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{meta.label} · {new Date(c.createdAt).toLocaleDateString()} · {c.sections.length} sections</p>
                    {(c.tags ?? []).length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-0.5">
                        {(c.tags ?? []).slice(0, 3).map(tag => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => openCreation(c.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-white px-3 py-1.5 rounded-lg hover:opacity-90 flex-shrink-0"
                    style={{ backgroundColor: meta.color }}>↗ Open</button>
                </div>
                {/* Quick actions row */}
                <div className="flex border-t border-border/30">
                  <button onClick={() => cycleStatus(c)}
                    className="flex-1 py-1.5 text-[10px] text-muted-foreground hover:bg-muted/40 transition-colors text-center font-medium">
                    ⊙ {STATUS_STYLES[c.status ?? "draft"]?.label}
                  </button>
                  <div className="w-px bg-border/30" />
                  <button onClick={() => handleCopy(c)}
                    className="flex-1 py-1.5 text-[10px] text-muted-foreground hover:bg-muted/40 transition-colors text-center font-medium">
                    {copied === c.id ? "✓ Copied" : "📋 Copy"}
                  </button>
                  <div className="w-px bg-border/30" />
                  <button onClick={() => { CreationStore.delete(c.id); refresh(); }}
                    className="flex-1 py-1.5 text-[10px] text-red-400 hover:bg-red-50 transition-colors text-center font-medium">
                    🗑 Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Everything Engine ────────────────────────────────────────────────────────
function EverythingEngine() {
  const [phase, setPhase] = useState<"describe"|"architecture"|"building"|"done">("describe");
  const [input, setInput]           = useState("");
  const [name, setName]             = useState("");
  const [intent, setIntent]         = useState<IntentResult | null>(null);
  const [pct, setPct]               = useState(0);
  const [log, setLog]               = useState<string[]>([]);
  const [builtId, setBuiltId]       = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryCount, setGalleryCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setGalleryCount(CreationStore.getAll().length); }, [phase]);

  const handleDescribe = () => {
    if (!input.trim()) return;
    const detected = classifyIntent(input);
    // Auto-extract a name from the first sentence or description
    const words = input.split(/[.!?,\n]/, 1)[0].trim();
    const autoName = words.length > 60 ? words.slice(0, 55).trim() + "…" : words;
    setName(autoName);
    setIntent(detected);
    setPhase("architecture");
  };

  const handleBuild = async () => {
    if (!intent) return;
    setPhase("building");
    const id = `${intent.type}-${Date.now()}`;
    const meta = TYPE_META[intent.type];
    setLog([
      `⚡ Everything Engine — Omega Build`,
      `📐 Type: ${meta.label}${intent.domain !== "General" ? ` — ${intent.domain}` : ""}`,
      intent.modules.length > 0 ? `🧩 Modules: ${intent.modules.join(", ")}` : "",
      intent.patterns.length > 0 ? `🔧 Patterns: ${intent.patterns.join(", ")}` : "",
      "🤖 Generating content with AI…",
    ].filter(Boolean));
    setPct(5);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const prompt = buildPrompt(
        intent.type, name, input,
        intent.genre, intent.style, intent.tone,
        intent.domain, intent.modules, intent.patterns,
      );

      const buildMessages: Record<number, string> = {
        20: "📝 Writing core content…",
        35: "🎨 Adding rich detail…",
        50: "🔧 Building modules & sections…",
        65: "✍️ Generating supporting content…",
        80: "📣 Creating marketing materials…",
        90: "📖 Building documentation…",
      };

      let acc = ""; let chars = 0;
      await streamEngine({
        engineId: "BrainGen",
        topic: prompt,
        signal: controller.signal,
        onChunk: chunk => {
          acc += chunk; chars += chunk.length;
          const newPct = Math.min(95, 5 + Math.floor(chars / 75));
          setPct(newPct);
          if (buildMessages[newPct]) setLog(prev => [...prev, buildMessages[newPct]]);
        },
      });

      setLog(prev => [...prev, "🗂️ Parsing sections…", "💾 Saving to Engine Store…"]);
      setPct(98);
      const sections = parseSections(acc);
      const creation: Creation = {
        id, type: intent.type, name, description: input,
        genre: intent.genre, style: intent.style, tone: intent.tone,
        domain: intent.domain, modules: intent.modules, patterns: intent.patterns,
        createdAt: new Date().toISOString(),
        rawContent: acc, sections,
      };
      CreationStore.save(creation);
      setBuiltId(id);
      setLog(prev => [...prev, `✅ "${name}" built — ${sections.length} sections generated!`]);
      setPct(100);
      setTimeout(() => setPhase("done"), 500);
    } catch (err: any) {
      if (err.name !== "AbortError") setLog(prev => [...prev, "❌ Error. Please try again."]);
    } finally { abortRef.current = null; }
  };

  const reset = () => {
    setPhase("describe"); setInput(""); setName(""); setIntent(null);
    setPct(0); setLog([]); setBuiltId(null);
  };

  if (showGallery) return <Gallery onClose={() => { setGalleryCount(CreationStore.getAll().length); setShowGallery(false); }} />;

  if (phase === "architecture" && intent) return <ArchitectureCard intent={intent} onConfirm={handleBuild} onBack={() => setPhase("describe")} />;

  if (phase === "building") {
    const meta = TYPE_META[intent?.type ?? "custom"];
    return <BuildProgress name={name} icon={meta.icon} color={meta.color} pct={pct} log={log} />;
  }

  if (phase === "done" && builtId && intent) {
    const meta = TYPE_META[intent.type];
    const creation = CreationStore.get(builtId);
    return (
      <div className="p-6 space-y-5 text-center">
        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl" style={{ backgroundColor: meta.color + "22" }}>{meta.icon}</div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ready!</h2>
          <p className="text-[14px] text-muted-foreground mt-1">"{name}"</p>
          <p className="text-[12px] text-muted-foreground">{meta.label} · {creation?.sections.length ?? 0} sections · {intent.modules.length} modules</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
          <p className="text-[13px] text-green-400 font-semibold">⚡ Standalone product built successfully</p>
          <p className="text-[11px] text-green-400/70 mt-1">Full UI, AI Studio, workflows, marketing, and downloads — all in its own tab.</p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => openCreation(builtId)}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: meta.color }}>
            <span>↗</span><span>Open "{name}"</span>
          </button>
          <button onClick={reset} className="w-full py-2.5 rounded-2xl border border-border/50 text-muted-foreground text-sm font-medium hover:bg-muted">
            Build Another
          </button>
          <button onClick={() => { setGalleryCount(CreationStore.getAll().length); setShowGallery(true); }}
            className="w-full py-2.5 rounded-2xl border border-border/50 text-muted-foreground text-sm font-medium hover:bg-muted">
            📁 View All ({CreationStore.getAll().length})
          </button>
        </div>
      </div>
    );
  }

  // ─── Describe Phase ───────────────────────────────────────────────────────
  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">⚡ Everything Engine</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">Describe anything. Build it instantly as a standalone product.</p>
        </div>
        {galleryCount > 0 && (
          <button onClick={() => setShowGallery(true)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground border border-border/50 rounded-xl px-2.5 py-2 hover:bg-muted flex-shrink-0">
            📁 {galleryCount}
          </button>
        )}
      </div>

      {/* Main textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && input.trim()) handleDescribe(); }}
          placeholder={"Describe what you want to create…\n\nExamples:\n• A healthcare scheduling SaaS with AI assistant, billing, and patient management\n• A sci-fi animated film about a robot uprising on Mars\n• A superhero comic where a teenage hacker fights a megacorporation\n• A complete marketing funnel for a SaaS product launch\n• An RPG game where a disgraced knight reclaims a stolen kingdom\n\nBe as specific or as vague as you like — the Engine figures out the rest."}
          rows={8}
          className="w-full bg-background border border-border/50 rounded-2xl p-4 text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none transition-all leading-relaxed"
        />
        {input.trim() && (
          <p className="absolute bottom-3 right-3 text-[9px] text-muted-foreground/50">⌘↵ to build</p>
        )}
      </div>

      {/* Build button */}
      <button onClick={handleDescribe} disabled={!input.trim()}
        className="w-full py-4 rounded-2xl text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-purple-600">
        <span>⚡</span><span>Analyze & Build</span>
      </button>

      {/* Quick Starts */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quick Start Templates</p>
        <div className="space-y-1.5">
          {QUICK_STARTS.map(qs => (
            <button key={qs.label}
              onClick={() => {
                if (qs.prompt) { setInput(qs.prompt); textareaRef.current?.focus(); }
                else textareaRef.current?.focus();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl border border-border/50 text-[12px] text-muted-foreground hover:border-primary/20 hover:text-foreground hover:bg-muted/20 transition-all font-medium">
              {qs.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pattern chips */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SaaS Patterns Available</p>
        <div className="flex flex-wrap gap-1.5">
          {PATTERN_LIBRARY.saasPatterns.slice(0, 12).map(p => (
            <button key={p} onClick={() => setInput(prev => prev ? prev + ` with ${p.toLowerCase()} features` : `A ${p.toLowerCase()} platform`)}
              className="text-[10px] px-2 py-1 rounded-full border border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors">
              {p}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        All creations are mock/simulated. The Engine builds fully interactive standalone products with AI, workflows, and downloadable docs. No real external actions without your approval.
      </p>
    </div>
  );
}

// ─── Quick Generator (existing) ───────────────────────────────────────────────
const QUICK_TYPES = [
  { id: "Document",        icon: "📄", color: "#007AFF", desc: "Reports, summaries, proposals" },
  { id: "Template",        icon: "🗂️", color: "#5856D6", desc: "Reusable frameworks" },
  { id: "Workflow",        icon: "🔄", color: "#34C759", desc: "Step-by-step process maps" },
  { id: "Policy",          icon: "📜", color: "#FF9500", desc: "Structural policy docs" },
  { id: "Checklist",       icon: "✅", color: "#34C759", desc: "Task verification checklists" },
  { id: "Training Module", icon: "🎓", color: "#30B0C7", desc: "Learning content" },
  { id: "Custom",          icon: "✨", color: "#FF2D55", desc: "Describe anything freely" },
];
const TONES_Q = ["Professional","Plain Language","Executive Brief","Educational","Empowering","Clinical Structural"];
interface GenItem { id: string; type: string; description: string; content: string; createdAt: Date; }

function QuickGenerator() {
  const [selectedType, setST] = useState<string | null>(null);
  const [description, setDesc] = useState("");
  const [tone, setTone]       = useState("Professional");
  const [streaming, setStr]   = useState(false);
  const [streamText, setTxt]  = useState("");
  const [history, setHist]    = useState<GenItem[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [view, setView]       = useState<"grid"|"form"|"output"|"history">("grid");
  const [viewing, setViewing] = useState<GenItem | null>(null);
  const [copied, setCopied]   = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = async () => {
    if (!selectedType || !description.trim()) return;
    setStr(true); setTxt(""); setView("output");
    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      let acc = "";
      await streamEngine({
        engineId: "BrainGen",
        topic: `${selectedType}: ${description}\nTone: ${tone}`,
        signal: ctrl.signal,
        onChunk: chunk => { acc += chunk; setTxt(acc); },
        onDone: () => setHist(prev => [{ id: Date.now().toString(), type: selectedType!, description, content: acc, createdAt: new Date() }, ...prev]),
      });
    } catch (err: any) {
      if (err.name !== "AbortError") setTxt("[Error — please retry.]");
    } finally { setStr(false); abortRef.current = null; }
  };

  const copy = () => { navigator.clipboard.writeText(viewing ? viewing.content : streamText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

  if (view === "history" && viewing) {
    const td = QUICK_TYPES.find(t => t.id === viewing.type);
    return (
      <div className="p-5 space-y-4">
        <button onClick={() => setViewing(null)} className="text-primary text-sm font-medium">‹ History</button>
        <div className="flex items-center gap-3"><span className="text-2xl">{td?.icon}</span><div className="flex-1"><p className="font-bold text-foreground">{viewing.type}</p><p className="text-[11px] text-muted-foreground truncate">{viewing.description}</p></div><button onClick={copy} className="text-[11px] bg-muted px-3 py-1.5 rounded-lg">{copied ? "✓" : "Copy"}</button></div>
        <div className="bg-muted/40 border border-border/40 rounded-2xl p-4 max-h-[55vh] overflow-y-auto"><pre className="text-[12px] whitespace-pre-wrap font-mono leading-relaxed">{viewing.content}</pre></div>
      </div>
    );
  }
  if (view === "history") {
    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2"><button onClick={() => setView("grid")} className="text-primary text-sm font-medium">‹ Generate</button><h2 className="text-xl font-bold flex-1">History</h2><span className="text-[12px] text-muted-foreground">{history.length}</span></div>
        {history.length === 0 ? <div className="text-center py-12"><p className="text-3xl mb-2">📭</p><button onClick={() => setView("grid")} className="text-primary text-sm">Start →</button></div>
        : <div className="space-y-2">{history.map(item => { const td = QUICK_TYPES.find(t => t.id === item.type); return <button key={item.id} onClick={() => setViewing(item)} className="w-full flex items-center gap-3 p-3.5 bg-background rounded-2xl border border-border/50 hover:border-primary/20 text-left"><div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ backgroundColor: (td?.color ?? "#007AFF") + "22" }}>{td?.icon}</div><div className="flex-1 min-w-0"><p className="font-semibold text-[13px]">{item.type}</p><p className="text-[11px] text-muted-foreground truncate">{item.description}</p></div><span className="text-muted-foreground">→</span></button>; })}</div>}
      </div>
    );
  }
  if (view === "output") {
    const td = QUICK_TYPES.find(t => t.id === selectedType);
    return (
      <>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => { setView("grid"); setST(null); setTxt(""); }} className="text-primary text-sm font-medium">‹</button>
            <span className="text-xl">{td?.icon}</span><p className="font-bold flex-1 text-[14px]">{selectedType}</p>
            <div className="flex gap-1.5">{streaming && <button onClick={() => abortRef.current?.abort()} className="text-[11px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-2.5 py-1">Stop</button>}{!streaming && streamText && <><button onClick={copy} className="text-[11px] bg-muted rounded-lg px-2.5 py-1">{copied ? "✓" : "Copy"}</button><button onClick={() => setShowSaveModal(true)} className="text-[11px] rounded-lg px-2.5 py-1 border" style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", borderColor: "rgba(99,102,241,0.30)" }}>💾 Save</button><button onClick={() => { setView("grid"); setST(null); setTxt(""); }} className="text-[11px] bg-primary text-white rounded-lg px-2.5 py-1">+ New</button></>}</div>
          </div>
          {!streamText && streaming && <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground text-sm"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span>Generating…</span></div>}
          {streamText && <div className="bg-muted/40 border border-border/40 rounded-2xl p-4 max-h-[60vh] overflow-y-auto"><pre className="text-[12px] whitespace-pre-wrap font-mono leading-relaxed">{streamText}{streaming && <span className="inline-block w-2 h-3 bg-primary/60 animate-pulse ml-0.5 align-middle" />}</pre></div>}
        </div>
        {showSaveModal && (
          <SaveToProjectModal
            content={streamText}
            label={`${selectedType ?? "Generated Content"}`}
            defaultFileType="Document"
            onClose={() => setShowSaveModal(false)}
          />
        )}
      </>
    );
  }
  if (view === "form" && selectedType) {
    const td = QUICK_TYPES.find(t => t.id === selectedType)!;
    return (
      <div className="p-5 space-y-4">
        <button onClick={() => setView("grid")} className="text-primary text-sm font-medium">‹ Types</button>
        <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: td.color + "22" }}>{td.icon}</div><div><h2 className="text-xl font-bold">{td.id}</h2><p className="text-[12px] text-muted-foreground">{td.desc}</p></div></div>
        <div className="space-y-4">
          <div><label className="text-[13px] font-semibold block mb-1.5">Describe what you want</label><textarea value={description} onChange={e => setDesc(e.target.value)} rows={5} placeholder={`Describe your ${td.id.toLowerCase()}…`} className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none" /></div>
          <div><label className="text-[13px] font-semibold block mb-1.5">Tone</label><div className="flex flex-wrap gap-1.5">{TONES_Q.map(t => <button key={t} onClick={() => setTone(t)} className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${tone === t ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}>{t}</button>)}</div></div>
          <button onClick={generate} disabled={!description.trim()} className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-40">✨ Generate {td.id}</button>
        </div>
      </div>
    );
  }
  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold">Quick Generate</h2><p className="text-[13px] text-muted-foreground">Instant document generation.</p></div>
        {history.length > 0 && <button onClick={() => setView("history")} className="text-[11px] border border-border/50 rounded-xl px-3 py-2 hover:bg-muted text-muted-foreground">📂 {history.length}</button>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_TYPES.map(t => <button key={t.id} onClick={() => { setST(t.id); setView("form"); }} className="flex items-start gap-2.5 p-3 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left group"><div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: t.color + "22" }}>{t.icon}</div><div><p className="font-semibold text-[12px]">{t.id}</p><p className="text-[9px] text-muted-foreground">{t.desc}</p></div></button>)}
      </div>
    </div>
  );
}

// ─── Main CreatorApp ──────────────────────────────────────────────────────────
export function CreatorApp() {
  const [tab, setTab] = useState<"engine"|"generate">("engine");
  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 p-3 border-b border-border/50 bg-background flex-shrink-0">
        <button onClick={() => setTab("engine")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-bold transition-colors ${tab === "engine" ? "bg-gradient-to-r from-primary to-purple-600 text-white" : "text-muted-foreground hover:bg-muted"}`}>
          <span>⚡</span><span>Everything Engine</span>
        </button>
        <button onClick={() => setTab("generate")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-bold transition-colors ${tab === "generate" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>
          <span>✨</span><span>Quick Generate</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === "engine"   && <EverythingEngine />}
        {tab === "generate" && <QuickGenerator />}
      </div>
    </div>
  );
}
