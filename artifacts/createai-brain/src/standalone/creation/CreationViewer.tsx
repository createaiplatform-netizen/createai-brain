import React, { useState, useRef, useEffect } from "react";
import { Creation, CreationType } from "./CreationStore";
import { StandaloneLayout, StandaloneMode } from "../StandaloneLayout";

// ─── Type meta ────────────────────────────────────────────────────────────────
const TYPE_META: Record<CreationType, { icon: string; color: string; label: string; accentBg: string }> = {
  movie:     { icon: "🎬", color: "#FF2D55", label: "Film Production",     accentBg: "from-red-900/20 to-black" },
  comic:     { icon: "📖", color: "#FF9500", label: "Comic Universe",      accentBg: "from-orange-900/20 to-black" },
  software:  { icon: "💻", color: "#007AFF", label: "Software Product",    accentBg: "from-blue-900/20 to-black" },
  document:  { icon: "📄", color: "#34C759", label: "Document Suite",      accentBg: "from-green-900/20 to-black" },
  marketing: { icon: "📣", color: "#FF9500", label: "Marketing System",    accentBg: "from-orange-900/20 to-black" },
  custom:    { icon: "✨", color: "#BF5AF2", label: "Custom Creation",     accentBg: "from-purple-900/20 to-black" },
};

// ─── Nav definitions per type ─────────────────────────────────────────────────
function buildNavItems(type: CreationType) {
  const base = [
    { id: "overview",   label: "Overview",    icon: "🏠" },
    { id: "content",    label: "Content",     icon: "📋" },
    { id: "marketing",  label: "Marketing",   icon: "📣" },
    { id: "ai",         label: "AI Studio",   icon: "🤖" },
    { id: "downloads",  label: "Downloads",   icon: "⬇️" },
  ];
  if (type === "movie")     return [{ id: "overview", label: "Film Info", icon: "🎬" }, { id: "scenes", label: "Scenes", icon: "🎭" }, { id: "characters", label: "Characters", icon: "🎭" }, { id: "script", label: "Script", icon: "📜" }, { id: "marketing", label: "Marketing", icon: "📣" }, { id: "ai", label: "AI Studio", icon: "🤖" }, { id: "downloads", label: "Downloads", icon: "⬇️" }];
  if (type === "comic")     return [{ id: "overview", label: "Issue Info", icon: "📖" }, { id: "panels", label: "Panels", icon: "🎨" }, { id: "characters", label: "Characters", icon: "🦸" }, { id: "story", label: "Full Story", icon: "📜" }, { id: "marketing", label: "Marketing", icon: "📣" }, { id: "ai", label: "AI Studio", icon: "🤖" }, { id: "downloads", label: "Downloads", icon: "⬇️" }];
  if (type === "software")  return [{ id: "overview", label: "Dashboard", icon: "📊" }, { id: "features", label: "Features", icon: "⚡" }, { id: "workflows", label: "Workflows", icon: "🔄" }, { id: "docs", label: "Docs", icon: "📖" }, { id: "marketing", label: "Marketing", icon: "📣" }, { id: "ai", label: "AI Studio", icon: "🤖" }, { id: "downloads", label: "Downloads", icon: "⬇️" }];
  if (type === "document")  return [{ id: "overview", label: "Summary", icon: "📋" }, { id: "document", label: "Full Document", icon: "📄" }, { id: "toc", label: "Table of Contents", icon: "🗂️" }, { id: "ai", label: "AI Studio", icon: "🤖" }, { id: "downloads", label: "Downloads", icon: "⬇️" }];
  if (type === "marketing") return [{ id: "overview", label: "Brand", icon: "🎯" }, { id: "landing", label: "Landing Page", icon: "🖼️" }, { id: "funnel", label: "Funnel", icon: "⬇️" }, { id: "emails", label: "Emails", icon: "✉️" }, { id: "ads", label: "Ads", icon: "📢" }, { id: "ai", label: "AI Studio", icon: "🤖" }, { id: "downloads", label: "Downloads", icon: "⬇️" }];
  return base;
}

// ─── Section Finder ───────────────────────────────────────────────────────────
function findSection(creation: Creation, keywords: string[]): string {
  for (const kw of keywords) {
    const sec = creation.sections.find(s => s.title.toLowerCase().includes(kw.toLowerCase()));
    if (sec) return sec.content;
  }
  return "";
}

function findSections(creation: Creation, keywords: string[]): { title: string; content: string }[] {
  return creation.sections.filter(s =>
    keywords.some(kw => s.title.toLowerCase().includes(kw.toLowerCase()))
  );
}

// ─── Content Block ────────────────────────────────────────────────────────────
function ContentBlock({ title, content, accent }: { title: string; content: string; accent?: string }) {
  if (!content) return null;
  return (
    <div className="bg-background rounded-2xl border border-border/50 p-5 space-y-2 shadow-sm">
      {title && <h3 className="font-bold text-[14px] text-foreground">{title}</h3>}
      <pre className="text-[13px] text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">{content}</pre>
    </div>
  );
}

// ─── Download Helper ──────────────────────────────────────────────────────────
function downloadCreation(creation: Creation, section?: string) {
  const content = section
    ? (creation.sections.find(s => s.title === section)?.content ?? creation.rawContent)
    : creation.rawContent;

  const header = `${creation.name.toUpperCase()}\n${"=".repeat(Math.min(creation.name.length, 60))}\nType: ${creation.type} | Genre: ${creation.genre} | Style: ${creation.style}\nCreated: ${new Date(creation.createdAt).toLocaleString()}\n\nDISCLAIMER: All content is mock/simulated. Generated by CreateAI Brain for demonstration only.\n\n${"─".repeat(60)}\n\n`;
  const blob = new Blob([header + content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${creation.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${section ? section.replace(/[^a-z0-9]/gi, "_").toLowerCase() + "_" : ""}MOCK.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── AI Studio ───────────────────────────────────────────────────────────────
interface Msg { role: "user" | "assistant" | "system"; content: string; }

function AIStudio({ creation }: { creation: Creation }) {
  const meta = TYPE_META[creation.type];
  const [messages, setMessages] = useState<Msg[]>([{
    role: "system",
    content: `🤖 AI Studio — ${creation.name}\n\nI'm your AI collaborator for this ${meta.label} creation.\n\nI can help you:\n• Expand scenes, panels, or sections\n• Develop characters further\n• Generate additional content variations\n• Brainstorm marketing angles\n• Answer questions about the creation\n\nAll outputs are mock/simulated content. Not for real production use.\n\nWhat would you like to explore?`,
  }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [buf, setBuf] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, buf]);

  const quick = {
    movie:     ["Expand Scene 3", "Develop the protagonist more", "Write another scene", "Create a sequel pitch"],
    comic:     ["Write panel 9", "Expand the villain backstory", "Create a new issue summary", "Add a plot twist"],
    software:  ["Add a new feature", "Write onboarding copy", "Describe the mobile app", "Suggest integrations"],
    document:  ["Expand Section 2", "Add a case study", "Write a conclusion", "Add more recommendations"],
    marketing: ["Write a new email", "Create an ad variant", "Add a pricing tier", "Write a blog post"],
    custom:    ["Expand the concept", "Add more details", "Create a variation", "Build on this idea"],
  }[creation.type] ?? ["Tell me more", "Add another section", "Expand this idea", "Create a variation"];

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || streaming) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setStreaming(true); setBuf("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const context = creation.sections.slice(0, 3).map(s => `${s.title}: ${s.content.slice(0, 200)}`).join("\n");
      const res = await fetch("/api/openai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Document",
          description: `[AI Studio — ${creation.name} — ${meta.label}]\n\nContext:\n${context}\n\nUser request: "${q}"\n\nProvide a rich, detailed, creative response. Stay true to the ${creation.type} format and the established style/tone (${creation.style}, ${creation.tone}). Generate new content that expands the creation. Label all outputs as mock/simulated.`,
          tone: creation.tone || "Creative",
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error("Failed");
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let acc = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6); if (!data || data === "[DONE]") continue;
          try { const p = JSON.parse(data); if (p.content) { acc += p.content; setBuf(acc); } } catch {}
        }
      }
      setMessages(prev => [...prev, { role: "assistant", content: acc }]);
    } catch (err: any) {
      if (err.name !== "AbortError") setMessages(prev => [...prev, { role: "assistant", content: "[Error — please retry.]" }]);
    } finally { setStreaming(false); setBuf(""); abortRef.current = null; }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none px-5 py-3 border-b border-border/30">
        <p className="text-[13px] font-semibold text-foreground">AI Studio <span className="text-[10px] text-muted-foreground font-normal ml-1">· All outputs are mock</span></p>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {quick.map(q => (
            <button key={q} onClick={() => send(q)} disabled={streaming}
              className="text-[10px] px-2.5 py-1 rounded-full border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40">
              {q}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role !== "user" && <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold flex-shrink-0 mr-2 mt-0.5">🤖</div>}
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-primary text-white rounded-br-sm" : msg.role === "system" ? "bg-muted/50 border border-border/40" : "bg-background border border-border/50"}`}>
              <pre className="text-[12px] whitespace-pre-wrap leading-relaxed font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}
        {streaming && buf && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold flex-shrink-0 mr-2">🤖</div>
            <div className="max-w-[82%] bg-background border border-border/50 rounded-2xl px-4 py-3">
              <pre className="text-[12px] text-foreground whitespace-pre-wrap font-sans leading-relaxed">{buf}<span className="inline-block w-2 h-3 bg-primary/60 animate-pulse ml-0.5 align-middle" /></pre>
            </div>
          </div>
        )}
        {streaming && !buf && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs flex-shrink-0 mr-2">🤖</div>
            <div className="bg-background border border-border/50 rounded-2xl px-4 py-3 flex gap-1">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex-none p-3 border-t border-border/50 bg-background/80">
        <form onSubmit={e => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-full pl-4 pr-1.5 py-1.5">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask the AI to expand, remix, or create more…"
            className="flex-1 bg-transparent border-none outline-none text-[13px] placeholder:text-muted-foreground" disabled={streaming} />
          <button type="submit" disabled={!input.trim() || streaming}
            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Downloads Section ────────────────────────────────────────────────────────
function DownloadsSection({ creation }: { creation: Creation }) {
  const [downloaded, setDownloaded] = useState<string[]>([]);
  const dl = (id: string, section?: string) => {
    downloadCreation(creation, section);
    setDownloaded(prev => [...prev, id]);
    setTimeout(() => setDownloaded(prev => prev.filter(d => d !== id)), 2000);
  };

  const items = [
    { id: "full",    label: "Full Package",    desc: "Everything generated — all sections combined",    icon: "📦", ext: ".txt" },
    ...creation.sections.slice(0, 6).map(s => ({
      id: s.title, label: s.title, desc: s.content.slice(0, 80) + "…", icon: "📄", ext: ".txt"
    })),
  ];

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-foreground">Downloads</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">All files are mock plain-text exports. Full PDF/Word export available in Live mode.</p>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-4 p-4 bg-background rounded-2xl border border-border/50">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">{item.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] text-foreground truncate">{item.label}</p>
              <p className="text-[11px] text-muted-foreground truncate">{item.desc}</p>
            </div>
            <button onClick={() => dl(item.id, item.id === "full" ? undefined : item.label)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex-shrink-0 ${downloaded.includes(item.id) ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
              {downloaded.includes(item.id) ? "✓ Done" : `⬇ ${item.ext}`}
            </button>
          </div>
        ))}
      </div>
      <div className="bg-muted/40 rounded-2xl p-4 border border-border/30">
        <p className="text-[11px] text-muted-foreground">All downloads are plain text mock files for demonstration. Real PDF/Word export, print layout, and production-ready formats require Live mode configuration.</p>
      </div>
    </div>
  );
}

// ─── Movie-specific sections ──────────────────────────────────────────────────
function MovieOverview({ creation }: { creation: Creation }) {
  const synopsis = findSection(creation, ["synopsis", "overview", "summary"]);
  const vision   = findSection(creation, ["director", "vision", "visual"]);
  return (
    <div className="p-5 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-100 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-3xl flex-shrink-0">🎬</div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{creation.name}</h1>
            <p className="text-[13px] text-muted-foreground">{creation.genre} · {creation.style} · Demo Mode</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[creation.genre, creation.style, creation.tone, "Mock Production"].map(t => (
            <span key={t} className="text-[11px] bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">{t}</span>
          ))}
        </div>
      </div>
      <ContentBlock title="Synopsis" content={synopsis} />
      <ContentBlock title="Director's Vision" content={vision} />
      <div className="grid grid-cols-3 gap-3">
        {[["Genre", creation.genre], ["Style", creation.style], ["Status", "Demo Production"]].map(([k, v]) => (
          <div key={k} className="bg-background rounded-2xl border border-border/50 p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{k}</p>
            <p className="font-bold text-[13px] text-foreground mt-1">{v}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">All content is mock and non-operational. Generated by CreateAI Brain for demonstration only.</p>
    </div>
  );
}

function ScenesSection({ creation }: { creation: Creation }) {
  const scenes = findSections(creation, ["scene", "act", "opening", "climax", "resolution", "inciting", "rising", "midpoint"]);
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Scenes</h2>
      <div className="space-y-2">
        {scenes.map((scene, i) => (
          <div key={i} className="bg-background rounded-2xl border border-border/50 overflow-hidden">
            <button onClick={() => setActive(active === i ? null : i)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center font-bold text-red-700 text-sm flex-shrink-0">S{i+1}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] text-foreground">{scene.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{scene.content.slice(0, 100)}</p>
              </div>
              <span className="text-muted-foreground text-sm">{active === i ? "▲" : "▼"}</span>
            </button>
            {active === i && (
              <div className="border-t border-border/30 p-4 bg-muted/10">
                <pre className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed font-sans">{scene.content}</pre>
              </div>
            )}
          </div>
        ))}
        {scenes.length === 0 && <p className="text-muted-foreground text-center py-8">No scenes found. The AI is still generating content.</p>}
      </div>
    </div>
  );
}

// ─── Comic-specific sections ──────────────────────────────────────────────────
function PanelsSection({ creation }: { creation: Creation }) {
  const panels = findSections(creation, ["panel"]);
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Panels</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {panels.map((panel, i) => (
          <div key={i} className="bg-background rounded-2xl border border-border/50 overflow-hidden cursor-pointer hover:border-orange-200 transition-colors"
            onClick={() => setActive(active === i ? null : i)}>
            <div className="aspect-[3/2] bg-gradient-to-br from-orange-50 to-yellow-50 flex flex-col items-center justify-center p-4 relative">
              <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">{i+1}</div>
              <div className="text-center space-y-1.5">
                {(() => {
                  const lines = panel.content.split("\n").filter(l => l.trim());
                  const visual = lines.find(l => /visual|panel description/i.test(l))?.replace(/visual[—:-]*/i, "").trim();
                  const dialogue = lines.find(l => /dialogue/i.test(l))?.replace(/dialogue[—:-]*/i, "").trim();
                  const caption = lines.find(l => /caption/i.test(l))?.replace(/caption[—:-]*/i, "").trim();
                  return (
                    <>
                      {visual && <p className="text-[11px] text-orange-700 font-semibold italic">{visual.slice(0, 80)}</p>}
                      {caption && <p className="text-[10px] text-muted-foreground">📣 {caption.slice(0, 60)}</p>}
                      {dialogue && <div className="bg-white rounded-xl px-2 py-1 border border-orange-200 text-[10px] text-foreground">💬 {dialogue.slice(0, 60)}</div>}
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="p-3 border-t border-border/30">
              <p className="font-semibold text-[12px] text-foreground">{panel.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{panel.content.slice(0, 60)}</p>
            </div>
            {active === i && (
              <div className="border-t border-border/30 p-4 bg-orange-50/50">
                <pre className="text-[12px] text-foreground whitespace-pre-wrap leading-relaxed font-sans">{panel.content}</pre>
              </div>
            )}
          </div>
        ))}
        {panels.length === 0 && <p className="text-muted-foreground text-center py-8 col-span-2">No panels found.</p>}
      </div>
    </div>
  );
}

// ─── Characters Section (shared movie + comic) ────────────────────────────────
function CharactersSection({ creation }: { creation: Creation }) {
  const chars = findSections(creation, ["character", "hero", "protagonist", "antagonist", "villain", "supporting", "ally"]);
  const [active, setActive] = useState<number | null>(0);

  const iconForChar = (title: string) => {
    if (/protagonist|hero|main/i.test(title)) return "🦸";
    if (/antagonist|villain/i.test(title)) return "🦹";
    return "🎭";
  };

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Characters</h2>
      <div className="flex gap-2 flex-wrap">
        {chars.map((c, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-semibold transition-all ${active === i ? "bg-primary text-white border-primary" : "bg-background border-border/50 text-muted-foreground hover:border-primary/30"}`}>
            <span>{iconForChar(c.title)}</span>
            <span>{c.title.replace(/character[:\s]*/i, "").trim()}</span>
          </button>
        ))}
      </div>
      {active !== null && chars[active] && (
        <div className="bg-background rounded-2xl border border-border/50 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-3xl">{iconForChar(chars[active].title)}</div>
            <h3 className="font-bold text-[18px] text-foreground">{chars[active].title.replace(/character[:\s]*/i, "").trim()}</h3>
          </div>
          <pre className="text-[13px] text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">{chars[active].content}</pre>
        </div>
      )}
      {chars.length === 0 && <p className="text-muted-foreground text-center py-8">No character data found.</p>}
    </div>
  );
}

// ─── Software sections ────────────────────────────────────────────────────────
function SoftwareDashboard({ creation }: { creation: Creation }) {
  const overview = findSection(creation, ["product overview", "overview", "summary"]);
  const kpis = findSection(creation, ["kpi", "dashboard kpi", "metrics"]);
  return (
    <div className="p-5 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl">💻</div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{creation.name}</h1>
            <p className="text-[13px] text-muted-foreground">{creation.genre} Software · {creation.style} · Demo Mode</p>
          </div>
        </div>
      </div>
      <ContentBlock title="Product Overview" content={overview} />
      {kpis && (
        <div className="bg-background rounded-2xl border border-border/50 p-5 space-y-3">
          <h3 className="font-bold text-[14px] text-foreground">Dashboard KPIs (Mock)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {kpis.split("\n").filter(l => l.trim() && !l.startsWith("#")).slice(0, 6).map((line, i) => {
              const [label, ...rest] = line.replace(/^[•\-*]\s*/, "").split(":");
              return (
                <div key={i} className="bg-muted/30 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">{label?.trim()}</p>
                  <p className="font-bold text-[16px] text-primary">{rest.join(":").trim() || "—"}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FeaturesSection({ creation }: { creation: Creation }) {
  const features = findSections(creation, ["feature"]);
  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Features</h2>
      <div className="grid md:grid-cols-2 gap-3">
        {features.map((f, i) => (
          <div key={i} className="bg-background rounded-2xl border border-border/50 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{i+1}</div>
              <h3 className="font-bold text-[14px] text-foreground">{f.title.replace(/feature\s*\d*[:\s—-]*/i, "").trim()}</h3>
            </div>
            <pre className="text-[12px] text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">{f.content}</pre>
          </div>
        ))}
        {features.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-8">No feature data found.</p>}
      </div>
    </div>
  );
}

function WorkflowsSection({ creation }: { creation: Creation }) {
  const workflows = findSections(creation, ["workflow", "primary workflow", "secondary workflow"]);
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);

  const wf = workflows[active];
  if (!wf) return <div className="p-6 text-center text-muted-foreground">No workflow data found.</div>;

  const steps = wf.content.split("\n")
    .filter(l => /^\d+\.|step/i.test(l.trim()))
    .map(l => l.replace(/^\d+\.\s*|^step\s*\d+[:\s]*/i, "").trim())
    .filter(Boolean);

  const allSteps = steps.length > 0 ? steps : wf.content.split("\n").filter(l => l.trim()).slice(0, 8);

  return (
    <div className="p-5 md:p-6 space-y-5 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Workflows</h2>
      {workflows.length > 1 && (
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {workflows.map((w, i) => (
            <button key={i} onClick={() => { setActive(i); setStep(0); setDone([]); }}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${active === i ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {w.title.replace(/workflow\s*/i, "").trim() || `Flow ${i+1}`}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-1">
        {allSteps.map((_, i) => <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step || done.includes(i) ? "bg-primary" : "bg-muted"}`} />)}
      </div>
      {step < allSteps.length ? (
        <div className="bg-background rounded-2xl border border-border/50 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">{step+1}</div>
            <h3 className="font-bold text-[15px] text-foreground">{allSteps[step]}</h3>
          </div>
          <p className="text-[13px] text-muted-foreground">Complete this step in the workflow. All actions are simulated — no real changes made.</p>
          <div className="flex gap-2">
            <button onClick={() => { setDone(p => [...p, step]); setStep(s => s+1); }}
              className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90">Complete Step →</button>
            {step > 0 && <button onClick={() => setStep(s => s-1)} className="px-4 border border-border/50 rounded-xl text-muted-foreground hover:bg-muted text-sm">← Back</button>}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
          <p className="text-3xl">✅</p>
          <h3 className="font-bold text-foreground">Workflow Complete</h3>
          <button onClick={() => { setStep(0); setDone([]); }} className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-semibold hover:opacity-90">Run Again</button>
        </div>
      )}
      <div className="space-y-1.5">
        {allSteps.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl border ${i === step && step < allSteps.length ? "bg-primary/5 border-primary/20" : done.includes(i) ? "bg-green-50 border-green-200" : "bg-muted/20 border-transparent"}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${done.includes(i) ? "bg-green-500 text-white" : i === step ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
              {done.includes(i) ? "✓" : i+1}
            </div>
            <p className={`text-[12px] ${i === step ? "text-foreground font-semibold" : done.includes(i) ? "text-green-700" : "text-muted-foreground"}`}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Document sections ────────────────────────────────────────────────────────
function FullDocumentSection({ creation }: { creation: Creation }) {
  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Full Document</h2>
        <button onClick={() => downloadCreation(creation)}
          className="text-[11px] bg-primary/10 text-primary font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/20">
          ⬇ Download
        </button>
      </div>
      <div className="bg-white border border-border/50 rounded-2xl shadow-sm divide-y divide-border/30">
        {creation.sections.map((s, i) => (
          <div key={i} className="p-5 space-y-2">
            <h3 className="font-bold text-[15px] text-foreground">{s.title}</h3>
            <pre className="text-[13px] text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">{s.content}</pre>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">Mock document — structural/simulated content only. Not for real use without expert review.</p>
    </div>
  );
}

function TOCSection({ creation }: { creation: Creation }) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  return (
    <div className="p-5 md:p-6 space-y-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Table of Contents</h2>
      <div className="space-y-2">
        {creation.sections.map((s, i) => (
          <div key={i}>
            <button onClick={() => setActiveSection(activeSection === s.title ? null : s.title)}
              className="w-full flex items-center gap-3 p-3.5 bg-background rounded-xl border border-border/50 hover:border-primary/20 text-left transition-all">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold flex-shrink-0">{i+1}</div>
              <p className="font-semibold text-[13px] text-foreground flex-1">{s.title}</p>
              <span className="text-muted-foreground text-sm">{activeSection === s.title ? "▲" : "▼"}</span>
            </button>
            {activeSection === s.title && (
              <div className="mt-1 p-4 bg-muted/30 rounded-xl border border-border/30">
                <pre className="text-[12px] text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">{s.content}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Marketing sections (for all types) ──────────────────────────────────────
function MarketingSection({ creation }: { creation: Creation }) {
  const mktgSections = findSections(creation, ["marketing", "tagline", "trailer", "social", "solicitation", "brand", "landing", "funnel", "email", "ad", "pricing"]);
  const [tab, setTab] = useState(0);

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Marketing</h2>
      {mktgSections.length > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {mktgSections.map((s, i) => (
            <button key={i} onClick={() => setTab(i)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${tab === i ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {s.title.replace(/marketing[—\s-]*/i, "").trim() || `Section ${i+1}`}
            </button>
          ))}
        </div>
      )}
      {mktgSections.length > 0 ? (
        <ContentBlock title={mktgSections[tab]?.title ?? ""} content={mktgSections[tab]?.content ?? ""} />
      ) : (
        <div className="space-y-3">
          {creation.sections.slice(-3).map((s, i) => (
            <ContentBlock key={i} title={s.title} content={s.content} />
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button className="bg-muted text-muted-foreground text-sm py-2.5 rounded-xl cursor-default">Share (Demo Mode)</button>
        <button onClick={() => downloadCreation(creation, mktgSections[tab]?.title)}
          className="bg-primary/10 text-primary text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/20">
          ⬇ Export
        </button>
      </div>
    </div>
  );
}

// ─── Marketing System — specialized sections ──────────────────────────────────
function LandingSection({ creation }: { creation: Creation }) {
  const hero = findSection(creation, ["hero", "landing page — hero", "landing"]);
  const features = findSection(creation, ["features page", "feature grid"]);
  const social = findSection(creation, ["social proof", "testimonial"]);
  const cta = findSection(creation, ["cta", "call to action"]);
  return (
    <div className="p-5 md:p-6 space-y-5 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Landing Page</h2>
      {hero && (
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100 rounded-2xl p-6">
          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-2">Hero Section</p>
          <pre className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed font-sans">{hero}</pre>
        </div>
      )}
      {features && <ContentBlock title="Features Section" content={features} />}
      {social && <ContentBlock title="Social Proof" content={social} />}
      {cta && <ContentBlock title="CTA Section" content={cta} />}
    </div>
  );
}

function FunnelSection({ creation }: { creation: Creation }) {
  const stages = findSections(creation, ["funnel stage", "awareness", "interest", "decision", "action"]);
  return (
    <div className="p-5 md:p-6 space-y-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Funnel</h2>
      <div className="space-y-3">
        {stages.map((s, i) => (
          <div key={i} className="relative">
            {i < stages.length - 1 && <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-border/50" />}
            <div className="bg-background rounded-2xl border border-border/50 p-4 pl-14 relative">
              <div className="absolute left-4 top-4 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-bold">{i+1}</div>
              <p className="font-bold text-[14px] text-foreground">{s.title.replace(/funnel stage \d+[—\s-]*/i, "").trim()}</p>
              <pre className="text-[12px] text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans mt-1">{s.content}</pre>
            </div>
          </div>
        ))}
        {stages.length === 0 && <p className="text-muted-foreground text-center py-8">No funnel stages found.</p>}
      </div>
    </div>
  );
}

function EmailsSection({ creation }: { creation: Creation }) {
  const emails = findSections(creation, ["email"]);
  const [active, setActive] = useState(0);
  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Email Sequence</h2>
      {emails.length > 0 ? (
        <>
          <div className="flex gap-1">
            {emails.map((e, i) => (
              <button key={i} onClick={() => setActive(i)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${active === i ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                {e.title.replace(/email\s*\d*[—\s-]*/i, "").trim() || `Email ${i+1}`}
              </button>
            ))}
          </div>
          <div className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="border-b border-border/30 pb-3">
              <p className="text-[11px] text-muted-foreground font-mono">From: {creation.name} Team</p>
              <p className="text-[11px] text-muted-foreground font-mono">To: subscriber@example.com</p>
            </div>
            <pre className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed font-sans">{emails[active]?.content}</pre>
          </div>
        </>
      ) : <p className="text-muted-foreground text-center py-8">No email content found.</p>}
    </div>
  );
}

function AdsSection({ creation }: { creation: Creation }) {
  const ads = findSections(creation, ["ad copy", "ad", "social ad", "search ad"]);
  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Ad Copy</h2>
      <div className="space-y-3">
        {ads.map((ad, i) => (
          <div key={i} className="bg-background rounded-2xl border border-border/50 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 text-sm">📢</div>
              <p className="font-bold text-[13px] text-foreground">{ad.title.replace(/ad copy[—\s-]*/i, "").trim()}</p>
            </div>
            <pre className="text-[12px] text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">{ad.content}</pre>
          </div>
        ))}
        {ads.length === 0 && <p className="text-muted-foreground text-center py-8">No ad copy found.</p>}
      </div>
    </div>
  );
}

// ─── Generic content section ──────────────────────────────────────────────────
function GenericContent({ creation }: { creation: Creation }) {
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Content</h2>
      <div className="space-y-2">
        {creation.sections.map((s, i) => (
          <div key={i} className="bg-background rounded-2xl border border-border/50 overflow-hidden">
            <button onClick={() => setActive(active === i ? null : i)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/20 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">{i+1}</div>
              <p className="font-semibold text-[13px] text-foreground flex-1">{s.title}</p>
              <span className="text-muted-foreground">{active === i ? "▲" : "▼"}</span>
            </button>
            {active === i && (
              <div className="border-t border-border/30 p-4 bg-muted/10">
                <pre className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed font-sans">{s.content}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Viewer ──────────────────────────────────────────────────────────────
export function CreationViewer({ creation }: { creation: Creation }) {
  const [section, setSection] = useState("overview");
  const [mode, setMode] = useState<StandaloneMode>("Demo");
  const meta = TYPE_META[creation.type];
  const navItems = buildNavItems(creation.type);

  const renderSection = () => {
    if (section === "ai")        return <AIStudio creation={creation} />;
    if (section === "downloads") return <DownloadsSection creation={creation} />;
    if (section === "marketing") return <MarketingSection creation={creation} />;

    // Movie
    if (creation.type === "movie") {
      if (section === "overview")    return <MovieOverview creation={creation} />;
      if (section === "scenes")      return <ScenesSection creation={creation} />;
      if (section === "characters")  return <CharactersSection creation={creation} />;
      if (section === "script") {
        const script = findSection(creation, ["script", "screenplay", "full script"]);
        return <div className="p-5 md:p-6 max-w-3xl mx-auto space-y-4"><h2 className="text-xl font-bold">Script</h2><ContentBlock title="" content={script || "No script content found."} /></div>;
      }
    }

    // Comic
    if (creation.type === "comic") {
      if (section === "overview") {
        const overview = findSection(creation, ["story overview", "overview", "summary"]);
        const artDir   = findSection(creation, ["art direction"]);
        return <div className="p-5 md:p-6 space-y-5 max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100 rounded-2xl p-6"><div className="flex items-center gap-3 mb-3"><div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-3xl">📖</div><div><h1 className="text-2xl font-bold">{creation.name}</h1><p className="text-[13px] text-muted-foreground">{creation.genre} · {creation.style}</p></div></div></div>
          <ContentBlock title="Story Overview" content={overview} />
          <ContentBlock title="Art Direction" content={artDir} />
        </div>;
      }
      if (section === "panels")      return <PanelsSection creation={creation} />;
      if (section === "characters")  return <CharactersSection creation={creation} />;
      if (section === "story") {
        const full = findSection(creation, ["full issue", "script", "full story"]);
        return <div className="p-5 md:p-6 max-w-3xl mx-auto space-y-4"><h2 className="text-xl font-bold">Full Story</h2><ContentBlock title="" content={full || creation.rawContent.slice(0, 3000)} /></div>;
      }
    }

    // Software
    if (creation.type === "software") {
      if (section === "overview")   return <SoftwareDashboard creation={creation} />;
      if (section === "features")   return <FeaturesSection creation={creation} />;
      if (section === "workflows")  return <WorkflowsSection creation={creation} />;
      if (section === "docs") {
        const docs = findSections(creation, ["documentation", "getting started", "key concepts"]);
        return <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto"><h2 className="text-xl font-bold">Documentation</h2>{docs.map((d, i) => <ContentBlock key={i} title={d.title.replace(/documentation[—\s-]*/i, "").trim()} content={d.content} />)}</div>;
      }
    }

    // Document
    if (creation.type === "document") {
      if (section === "overview") {
        const exec = findSection(creation, ["executive summary", "summary", "overview"]);
        return <div className="p-5 md:p-6 space-y-5 max-w-3xl mx-auto"><h2 className="text-xl font-bold">Executive Summary</h2><ContentBlock title="" content={exec} /></div>;
      }
      if (section === "document") return <FullDocumentSection creation={creation} />;
      if (section === "toc")      return <TOCSection creation={creation} />;
    }

    // Marketing system
    if (creation.type === "marketing") {
      if (section === "overview") {
        const brand = findSection(creation, ["brand positioning", "brand", "overview"]);
        return <div className="p-5 md:p-6 space-y-5 max-w-3xl mx-auto"><div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100 rounded-2xl p-6"><div className="flex items-center gap-3"><div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-3xl">📣</div><div><h1 className="text-2xl font-bold">{creation.name}</h1><p className="text-[13px] text-muted-foreground">Marketing System · {creation.genre}</p></div></div></div><ContentBlock title="Brand Positioning" content={brand} /></div>;
      }
      if (section === "landing") return <LandingSection creation={creation} />;
      if (section === "funnel")  return <FunnelSection creation={creation} />;
      if (section === "emails")  return <EmailsSection creation={creation} />;
      if (section === "ads")     return <AdsSection creation={creation} />;
    }

    // Custom + fallback
    if (section === "overview") {
      const overview = findSection(creation, ["overview", "summary", "introduction"]);
      return (
        <div className="p-5 md:p-6 space-y-5 max-w-3xl mx-auto">
          <div className="rounded-2xl p-6 space-y-2 border" style={{ background: `linear-gradient(135deg, ${meta.color}15, transparent)`, borderColor: `${meta.color}30` }}>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: `${meta.color}20` }}>{meta.icon}</div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{creation.name}</h1>
                <p className="text-[13px] text-muted-foreground">{meta.label} · {creation.genre} · {creation.style}</p>
              </div>
            </div>
          </div>
          <ContentBlock title="Overview" content={overview || creation.description} />
        </div>
      );
    }
    if (section === "content") return <GenericContent creation={creation} />;

    return <GenericContent creation={creation} />;
  };

  return (
    <StandaloneLayout
      productName={creation.name}
      productIcon={meta.icon}
      productColor={meta.color}
      navItems={navItems}
      activeSection={section}
      onSectionChange={setSection}
      mode={mode}
      onModeChange={setMode}
      disclaimer={`${creation.name} · ${meta.label} · All content is mock/simulated · Powered by CreateAI Brain`}
    >
      <div className={section === "ai" ? "h-full flex flex-col" : ""}>
        {renderSection()}
      </div>
    </StandaloneLayout>
  );
}
