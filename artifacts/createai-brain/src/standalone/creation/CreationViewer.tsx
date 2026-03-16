import React, { useState, useRef, useEffect } from "react";
import { Creation, CreationType } from "./CreationStore";
import { StandaloneLayout, StandaloneMode } from "../StandaloneLayout";

// ─── Type meta ────────────────────────────────────────────────────────────────
const TYPE_META: Record<CreationType, { icon: string; color: string; label: string; accentBg: string }> = {
  movie:     { icon: "🎬", color: "#FF2D55", label: "Film Production",     accentBg: "from-red-900/20 to-black" },
  comic:     { icon: "📖", color: "#FF9500", label: "Comic Universe",      accentBg: "from-orange-900/20 to-black" },
  software:  { icon: "💻", color: "#007AFF", label: "Software / SaaS",    accentBg: "from-blue-900/20 to-black" },
  document:  { icon: "📄", color: "#34C759", label: "Document Suite",      accentBg: "from-green-900/20 to-black" },
  marketing: { icon: "📣", color: "#FF9500", label: "Marketing System",    accentBg: "from-orange-900/20 to-black" },
  game:      { icon: "🎮", color: "#5856D6", label: "Game Production",     accentBg: "from-purple-900/20 to-black" },
  community: { icon: "🌐", color: "#30B0C7", label: "Community Platform",  accentBg: "from-cyan-900/20 to-black" },
  custom:    { icon: "✨", color: "#BF5AF2", label: "Custom Creation",     accentBg: "from-purple-900/20 to-black" },
};

// ─── Nav definitions per type ─────────────────────────────────────────────────
const OMEGA_NAV = [
  { id: "packetai",  label: "Packet AI",  icon: "⚡" },
  { id: "tools",     label: "Tools",      icon: "🔧" },
  { id: "design",    label: "Design",     icon: "🎨" },
  { id: "ai",        label: "AI Chat",    icon: "🤖" },
  { id: "downloads", label: "Downloads",  icon: "⬇️" },
];

function buildNavItems(type: CreationType) {
  const mkt = { id: "marketing", label: "Marketing", icon: "📣" };
  if (type === "movie")     return [{ id: "overview", label: "Film Info", icon: "🎬" }, { id: "scenes", label: "Scenes", icon: "🎭" }, { id: "characters", label: "Characters", icon: "🎭" }, { id: "script", label: "Script", icon: "📜" }, mkt, ...OMEGA_NAV];
  if (type === "comic")     return [{ id: "overview", label: "Issue Info", icon: "📖" }, { id: "panels", label: "Panels", icon: "🎨" }, { id: "characters", label: "Characters", icon: "🦸" }, { id: "story", label: "Full Story", icon: "📜" }, mkt, ...OMEGA_NAV];
  if (type === "software")  return [{ id: "overview", label: "Dashboard", icon: "📊" }, { id: "features", label: "Features", icon: "⚡" }, { id: "modules", label: "Modules", icon: "🧩" }, { id: "workflows", label: "Workflows", icon: "🔄" }, { id: "data", label: "Data Model", icon: "🗃️" }, { id: "docs", label: "Docs", icon: "📖" }, mkt, ...OMEGA_NAV];
  if (type === "document")  return [{ id: "overview", label: "Summary", icon: "📋" }, { id: "document", label: "Full Document", icon: "📄" }, { id: "toc", label: "Table of Contents", icon: "🗂️" }, ...OMEGA_NAV];
  if (type === "marketing") return [{ id: "overview", label: "Brand", icon: "🎯" }, { id: "landing", label: "Landing Page", icon: "🖼️" }, { id: "funnel", label: "Funnel", icon: "⬇️" }, { id: "emails", label: "Emails", icon: "✉️" }, { id: "ads", label: "Ads", icon: "📢" }, ...OMEGA_NAV];
  if (type === "game")      return [{ id: "overview", label: "Game Info", icon: "🎮" }, { id: "gameplay", label: "Gameplay", icon: "🕹️" }, { id: "story", label: "Story & World", icon: "📖" }, { id: "levels", label: "Levels", icon: "🗺️" }, { id: "characters", label: "Characters", icon: "🧙" }, { id: "economy", label: "Economy", icon: "💎" }, mkt, ...OMEGA_NAV];
  if (type === "community") return [{ id: "overview", label: "Platform", icon: "🌐" }, { id: "features", label: "Features", icon: "⚡" }, { id: "members", label: "Members", icon: "👥" }, { id: "content", label: "Content", icon: "📝" }, { id: "events", label: "Events", icon: "📅" }, mkt, ...OMEGA_NAV];
  return [{ id: "overview", label: "Overview", icon: "🏠" }, { id: "content", label: "Content", icon: "📋" }, mkt, ...OMEGA_NAV];
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

// ─── Packet AI Editor ─────────────────────────────────────────────────────────
const PACKET_QUICK_ACTIONS: Record<string, string[]> = {
  movie:     ["Rewrite the opening scene", "Make the protagonist more compelling", "Add a dramatic twist", "Expand the villain's arc", "Write a sequel hook"],
  comic:     ["Add a cliffhanger ending", "Expand the fight sequence", "Deepen the hero's motivation", "Write a new panel description", "Add a plot twist"],
  software:  ["Expand the feature list", "Rewrite the onboarding flow", "Add a new module section", "Improve the dashboard metrics", "Describe the mobile experience"],
  document:  ["Strengthen the executive summary", "Add supporting data points", "Write a stronger conclusion", "Expand the recommendations", "Add a case study"],
  marketing: ["Rewrite the hero headline", "Add a new pricing tier", "Make the CTA more urgent", "Improve the email subject lines", "Add a testimonial section"],
  game:      ["Design a new level", "Expand the character backstory", "Add a boss encounter", "Describe the game economy better", "Write a new quest line"],
  community: ["Improve the onboarding flow", "Add member engagement mechanics", "Describe moderation tools", "Expand the events calendar", "Add a reputation system"],
  custom:    ["Expand this concept further", "Add more structure", "Make it more detailed", "Add a new section", "Refine the core idea"],
};

interface PacketEditorProps {
  creation: Creation;
  onSectionUpdate: (title: string, newContent: string) => void;
}

function PacketEditor({ creation, onSectionUpdate }: PacketEditorProps) {
  const meta = TYPE_META[creation.type];
  const [selectedSection, setSelectedSection] = useState(creation.sections[0]?.title ?? "");
  const [instruction, setInstruction] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [buf, setBuf] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "chat">("edit");
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, buf]);

  const quickActions = PACKET_QUICK_ACTIONS[creation.type] ?? PACKET_QUICK_ACTIONS.custom;
  const currentSection = creation.sections.find(s => s.title === selectedSection);

  const runEdit = async (instr?: string) => {
    const q = (instr ?? instruction).trim();
    if (!q || streaming) return;
    setInstruction("");
    setStreaming(true); setBuf("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const secContent = currentSection?.content?.slice(0, 600) ?? "";
      const prompt = `You are an AI editor for a ${meta.label} called "${creation.name}".

CURRENT SECTION: "${selectedSection}"
CURRENT CONTENT (excerpt): ${secContent}

EDIT INSTRUCTION: ${q}

TASK: Rewrite or expand this section based on the instruction. Keep the same format and style as the original. Make it rich, detailed, and compelling. Output ONLY the improved section content — no headings, no preamble, no labels.`;
      const res = await fetch("/api/openai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "Document", description: prompt, tone: creation.tone || "Creative" }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error("Failed");
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let acc = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const d = line.slice(6); if (!d || d === "[DONE]") continue;
          try { const p = JSON.parse(d); if (p.content) { acc += p.content; setBuf(acc); } } catch {}
        }
      }
      if (acc) { onSectionUpdate(selectedSection, acc); setLastUpdated(selectedSection); }
    } catch (err: any) {
      if (err.name !== "AbortError") setBuf("[Error — please retry]");
    } finally { setStreaming(false); setBuf(""); abortRef.current = null; }
  };

  const runChat = async (text?: string) => {
    const q = (text ?? chatInput).trim();
    if (!q || streaming) return;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: q }]);
    setStreaming(true); setBuf("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const context = creation.sections.slice(0, 3).map(s => `${s.title}: ${s.content.slice(0, 150)}`).join("\n");
      const res = await fetch("/api/openai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Document",
          description: `[Packet AI — ${creation.name} — ${meta.label}]\n\nContext:\n${context}\n\nUser: "${q}"\n\nRespond helpfully about this ${creation.type} creation. Be creative and detailed.`,
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
          const d = line.slice(6); if (!d || d === "[DONE]") continue;
          try { const p = JSON.parse(d); if (p.content) { acc += p.content; setBuf(acc); } } catch {}
        }
      }
      setChatMessages(prev => [...prev, { role: "assistant", content: acc }]);
    } catch (err: any) {
      if (err.name !== "AbortError") setChatMessages(prev => [...prev, { role: "assistant", content: "[Error — retry]" }]);
    } finally { setStreaming(false); setBuf(""); abortRef.current = null; }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none px-5 py-3 border-b border-border/30 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
              <span style={{ color: meta.color }}>⚡</span> Packet AI
              <span className="text-[10px] text-muted-foreground font-normal ml-1">· Edits only this packet</span>
            </p>
          </div>
          <div className="flex gap-1 bg-muted/40 rounded-full p-0.5">
            {(["edit", "chat"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${activeTab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>
                {t === "edit" ? "✏️ Edit Sections" : "💬 Chat"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === "edit" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-muted/30 rounded-2xl p-4 border border-border/30 space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Quick Actions</p>
            <div className="flex flex-wrap gap-1.5">
              {quickActions.map(q => (
                <button key={q} onClick={() => { setInstruction(q); }}
                  disabled={streaming}
                  className="text-[11px] px-2.5 py-1.5 rounded-full border border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-40">
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Section to Edit</label>
              <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
                className="w-full text-[13px] px-3 py-2 rounded-xl border border-border/50 bg-background text-foreground outline-none focus:border-primary/50">
                {creation.sections.map(s => <option key={s.title} value={s.title}>{s.title}</option>)}
              </select>
            </div>
            {currentSection && (
              <div className="bg-muted/20 rounded-xl p-3 border border-border/30">
                <p className="text-[10px] text-muted-foreground font-semibold mb-1">CURRENT CONTENT PREVIEW</p>
                <p className="text-[12px] text-foreground line-clamp-3 leading-relaxed">{currentSection.content.slice(0, 200)}…</p>
              </div>
            )}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Edit Instruction</label>
              <textarea
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                placeholder='e.g. "Make this more dramatic and add specific details…"'
                rows={3}
                className="w-full text-[13px] px-3 py-2 rounded-xl border border-border/50 bg-background text-foreground resize-none outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
              />
            </div>
            <button onClick={() => runEdit()} disabled={!instruction.trim() || streaming}
              className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white transition-all disabled:opacity-40"
              style={{ background: streaming ? "#8E8E93" : `linear-gradient(135deg, ${meta.color}, ${meta.color}CC)` }}>
              {streaming ? "⚡ Updating section…" : "⚡ Update This Section"}
            </button>
            {lastUpdated && !streaming && (
              <p className="text-[11px] text-green-600 font-semibold text-center">✓ "{lastUpdated}" updated successfully</p>
            )}
          </div>

          {streaming && buf && (
            <div className="bg-background border border-border/50 rounded-2xl p-4">
              <p className="text-[10px] text-muted-foreground font-semibold mb-2">GENERATING UPDATE…</p>
              <pre className="text-[12px] text-foreground whitespace-pre-wrap leading-relaxed font-sans line-clamp-6">{buf}<span className="inline-block w-2 h-3 bg-primary/60 animate-pulse ml-0.5 align-middle" /></pre>
            </div>
          )}

          <div className="bg-muted/20 rounded-2xl p-4 border border-border/30">
            <p className="text-[11px] text-muted-foreground">Packet AI edits only this packet. Changes update the live view immediately. All content is mock/simulated.</p>
          </div>
        </div>
      )}

      {activeTab === "chat" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <div className="text-4xl">⚡</div>
                <p className="text-[13px] font-semibold text-foreground">Packet AI is ready</p>
                <p className="text-[12px] text-muted-foreground">Ask anything about this {meta.label.toLowerCase()}, request ideas, or get feedback.</p>
                <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                  {["What could be improved?", "Suggest three variations", "What's missing?", "How would you market this?"].map(q => (
                    <button key={q} onClick={() => runChat(q)} disabled={streaming}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role !== "user" && <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2" style={{ background: `${meta.color}20` }}>⚡</div>}
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-primary text-white rounded-br-sm" : "bg-background border border-border/50"}`}>
                  <pre className="text-[12px] whitespace-pre-wrap leading-relaxed font-sans">{msg.content}</pre>
                </div>
              </div>
            ))}
            {streaming && buf && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2" style={{ background: `${meta.color}20` }}>⚡</div>
                <div className="max-w-[82%] bg-background border border-border/50 rounded-2xl px-4 py-3">
                  <pre className="text-[12px] whitespace-pre-wrap font-sans leading-relaxed">{buf}<span className="inline-block w-2 h-3 bg-primary/60 animate-pulse ml-0.5 align-middle" /></pre>
                </div>
              </div>
            )}
            {streaming && !buf && (
              <div className="flex gap-1 pl-2">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="flex-none p-3 border-t border-border/50 bg-background/80">
            <form onSubmit={e => { e.preventDefault(); runChat(); }}
              className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-full pl-4 pr-1.5 py-1.5">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask Packet AI anything…"
                className="flex-1 bg-transparent border-none outline-none text-[13px] placeholder:text-muted-foreground" disabled={streaming} />
              <button type="submit" disabled={!chatInput.trim() || streaming}
                className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tools Section ────────────────────────────────────────────────────────────
interface ToolDef { id: string; icon: string; name: string; desc: string; }

const TOOLS_BY_TYPE: Record<string, ToolDef[]> = {
  software:  [
    { id: "form",      icon: "📝", name: "Form Builder",         desc: "Design input forms, fields, and validation flows" },
    { id: "workflow",  icon: "🔄", name: "Workflow Designer",     desc: "Map out step-by-step process flows and automations" },
    { id: "dashboard", icon: "📊", name: "Dashboard Configurator",desc: "Configure KPI cards, charts, and metric layouts" },
    { id: "api",       icon: "🔌", name: "API Explorer",          desc: "Browse and test simulated API endpoints" },
    { id: "pricing",   icon: "💰", name: "Pricing Configurator",  desc: "Design subscription tiers, features, and trial options" },
  ],
  movie: [
    { id: "scene",     icon: "🎬", name: "Scene Builder",         desc: "Construct scenes with location, action, and dialogue" },
    { id: "character", icon: "🧑", name: "Character Sheet",        desc: "Build detailed character profiles and arcs" },
    { id: "timeline",  icon: "📅", name: "Story Timeline",         desc: "Map your narrative beats across the three-act structure" },
    { id: "budget",    icon: "💸", name: "Budget Estimator",       desc: "Rough production cost breakdown by department" },
  ],
  comic: [
    { id: "panel",     icon: "🖼️", name: "Panel Scripter",        desc: "Write panel-by-panel visual descriptions and dialogue" },
    { id: "character", icon: "🦸", name: "Character Profile",      desc: "Design hero/villain origin, powers, and appearance" },
    { id: "issue",     icon: "📖", name: "Issue Planner",          desc: "Plan your story arc across multiple issues" },
  ],
  game: [
    { id: "level",     icon: "🗺️", name: "Level Designer",        desc: "Lay out level structure, zones, and encounters" },
    { id: "character", icon: "🧙", name: "Character Creator",      desc: "Build player character stats, abilities, and traits" },
    { id: "quest",     icon: "⚔️", name: "Quest Planner",          desc: "Design quest objectives, rewards, and NPC interactions" },
    { id: "economy",   icon: "💎", name: "Item Forge",             desc: "Create weapons, items, and economy balance" },
  ],
  community: [
    { id: "onboard",   icon: "🚀", name: "Onboarding Builder",     desc: "Design the new member welcome and setup flow" },
    { id: "calendar",  icon: "📅", name: "Content Calendar",       desc: "Plan weekly posts, topics, and engagement cadence" },
    { id: "event",     icon: "🎉", name: "Event Planner",          desc: "Structure virtual and in-person community events" },
    { id: "rules",     icon: "📜", name: "Community Rules Editor", desc: "Draft community guidelines and moderation policies" },
  ],
  document: [
    { id: "outline",   icon: "📋", name: "Section Outliner",       desc: "Build and reorganize the document structure" },
    { id: "summary",   icon: "✍️",  name: "Executive Summary Tool", desc: "Craft a concise, compelling exec summary" },
    { id: "data",      icon: "📊", name: "Data Table Builder",      desc: "Create comparison tables and supporting data structures" },
  ],
  marketing: [
    { id: "headline",  icon: "✏️",  name: "Headline Generator",    desc: "Generate A/B variants for hero headlines and CTAs" },
    { id: "persona",   icon: "👤", name: "Persona Builder",         desc: "Define your target audience personas in detail" },
    { id: "campaign",  icon: "📣", name: "Campaign Planner",        desc: "Map out multi-channel campaign structure and timing" },
    { id: "email",     icon: "✉️",  name: "Email Sequence Builder", desc: "Design welcome, nurture, and conversion email flows" },
  ],
  custom: [
    { id: "concept",   icon: "💡", name: "Concept Builder",        desc: "Flesh out the core concept, vision, and goals" },
    { id: "structure", icon: "🏗️", name: "Structure Planner",      desc: "Define key sections, components, and organization" },
    { id: "style",     icon: "🎨", name: "Style Guide",            desc: "Choose colors, typography, and visual direction" },
  ],
};

function ToolCard({ tool, creation }: { tool: ToolDef; creation: Creation }) {
  const [open, setOpen] = useState(false);
  const meta = TYPE_META[creation.type];

  const renderToolUI = () => {
    if (tool.id === "form") {
      return <FormBuilderUI color={meta.color} />;
    }
    if (tool.id === "workflow" || tool.id === "timeline") {
      return <WorkflowUI creation={creation} color={meta.color} />;
    }
    if (tool.id === "dashboard") {
      return <DashboardConfigUI color={meta.color} />;
    }
    if (tool.id === "pricing") {
      return <PricingConfigUI color={meta.color} />;
    }
    if (tool.id === "scene" || tool.id === "panel") {
      return <SceneBuilderUI creation={creation} color={meta.color} />;
    }
    if (tool.id === "character") {
      return <CharacterSheetUI creation={creation} color={meta.color} />;
    }
    if (tool.id === "level") {
      return <LevelDesignerUI color={meta.color} />;
    }
    if (tool.id === "quest") {
      return <QuestPlannerUI color={meta.color} />;
    }
    if (tool.id === "economy" || tool.id === "budget") {
      return <EconomyUI color={meta.color} />;
    }
    if (tool.id === "onboard") {
      return <OnboardingUI color={meta.color} />;
    }
    if (tool.id === "calendar") {
      return <ContentCalendarUI color={meta.color} />;
    }
    if (tool.id === "headline") {
      return <HeadlineGeneratorUI color={meta.color} />;
    }
    if (tool.id === "persona") {
      return <PersonaBuilderUI color={meta.color} />;
    }
    if (tool.id === "outline" || tool.id === "structure") {
      return <OutlinerUI creation={creation} color={meta.color} />;
    }
    if (tool.id === "api") {
      return <ApiExplorerUI creation={creation} color={meta.color} />;
    }
    return (
      <div className="p-4 text-center text-muted-foreground text-[13px]">
        <div className="text-3xl mb-2">{tool.icon}</div>
        <p className="font-semibold">{tool.name}</p>
        <p className="text-[11px] mt-1">This tool is ready. Describe what you want to build using Packet AI.</p>
      </div>
    );
  };

  return (
    <div className="bg-background rounded-2xl border border-border/50 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/20 transition-colors">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${meta.color}15` }}>{tool.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[13px] text-foreground">{tool.name}</p>
          <p className="text-[11px] text-muted-foreground">{tool.desc}</p>
        </div>
        <span className="text-muted-foreground text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-border/30 bg-muted/10">
          {renderToolUI()}
        </div>
      )}
    </div>
  );
}

function FormBuilderUI({ color }: { color: string }) {
  const fieldTypes = ["Text", "Email", "Phone", "Select", "Textarea", "Date", "File", "Checkbox"];
  const [fields, setFields] = useState([
    { type: "Text", label: "Full Name", required: true },
    { type: "Email", label: "Email Address", required: true },
    { type: "Phone", label: "Phone Number", required: false },
  ]);
  const [next, setNext] = useState("Select");
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Form Fields</p>
      <div className="space-y-1.5">
        {fields.map((f, i) => (
          <div key={i} className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border border-border/40">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}20`, color }}>
              {f.type}
            </span>
            <span className="flex-1 text-[12px] text-foreground">{f.label}</span>
            {f.required && <span className="text-[10px] text-red-500">*</span>}
            <button onClick={() => setFields(fs => fs.filter((_, j) => j !== i))}
              className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors">✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <select value={next} onChange={e => setNext(e.target.value)}
          className="flex-1 text-[12px] px-2 py-1.5 rounded-lg border border-border/50 bg-background outline-none">
          {fieldTypes.map(t => <option key={t}>{t}</option>)}
        </select>
        <button onClick={() => setFields(fs => [...fs, { type: next, label: `${next} Field`, required: false }])}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
          style={{ background: color }}>+ Add</button>
      </div>
      <p className="text-[10px] text-muted-foreground">Simulated form builder · {fields.length} fields · Not connected to real database</p>
    </div>
  );
}

function WorkflowUI({ creation, color }: { creation: Creation; color: string }) {
  const defaultSteps = ["User submits request", "System validates input", "AI processes data", "Results returned", "User receives output"];
  const [steps, setSteps] = useState(defaultSteps);
  const [newStep, setNewStep] = useState("");
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Workflow Steps</p>
      <div className="space-y-1.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 bg-background rounded-lg px-3 py-2.5 border border-border/40">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ background: `${color}20`, color }}>{i + 1}</span>
            <span className="flex-1 text-[12px] text-foreground">{s}</span>
            <button onClick={() => setSteps(ss => ss.filter((_, j) => j !== i))}
              className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors">✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newStep} onChange={e => setNewStep(e.target.value)} placeholder="Add a step…"
          className="flex-1 text-[12px] px-3 py-1.5 rounded-lg border border-border/50 bg-background outline-none placeholder:text-muted-foreground/50" />
        <button onClick={() => { if (newStep.trim()) { setSteps(ss => [...ss, newStep.trim()]); setNewStep(""); } }}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
          style={{ background: color }}>+ Add</button>
      </div>
    </div>
  );
}

function DashboardConfigUI({ color }: { color: string }) {
  const kpis = [
    { label: "Total Users", value: "12,847", trend: "+12%", on: true },
    { label: "Monthly Revenue", value: "$48,320", trend: "+8%", on: true },
    { label: "Active Sessions", value: "3,291", trend: "+5%", on: true },
    { label: "Churn Rate", value: "2.1%", trend: "-0.3%", on: false },
    { label: "NPS Score", value: "72", trend: "+4", on: false },
    { label: "Support Tickets", value: "94", trend: "-12%", on: false },
  ];
  const [enabled, setEnabled] = useState<boolean[]>(kpis.map(k => k.on));
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Dashboard KPIs · Toggle to show/hide</p>
      <div className="grid grid-cols-2 gap-2">
        {kpis.map((k, i) => (
          <button key={i} onClick={() => setEnabled(e => e.map((v, j) => j === i ? !v : v))}
            className={`p-3 rounded-xl border text-left transition-all ${enabled[i] ? "border-2 bg-background" : "border-border/30 bg-muted/20 opacity-50"}`}
            style={{ borderColor: enabled[i] ? color : undefined }}>
            <p className="text-[11px] font-semibold text-foreground">{k.label}</p>
            <p className="text-[15px] font-bold mt-0.5" style={{ color: enabled[i] ? color : undefined }}>{k.value}</p>
            <p className="text-[10px] text-muted-foreground">{k.trend}</p>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">All values are simulated · {enabled.filter(Boolean).length} of {kpis.length} KPIs enabled</p>
    </div>
  );
}

function PricingConfigUI({ color }: { color: string }) {
  const [tiers, setTiers] = useState([
    { name: "Starter", price: "0", features: "5 users, 1GB storage, Basic AI" },
    { name: "Pro", price: "49", features: "25 users, 20GB storage, Full AI, Priority support" },
    { name: "Enterprise", price: "299", features: "Unlimited users, Custom storage, Dedicated AI, SLA" },
  ]);
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Pricing Tiers (Simulated)</p>
      {tiers.map((t, i) => (
        <div key={i} className="bg-background rounded-xl border border-border/40 p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[13px] text-foreground">{t.name}</span>
            <span className="text-[12px]" style={{ color }}>${t.price}/mo</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{t.features}</p>
        </div>
      ))}
      <button onClick={() => setTiers(ts => [...ts, { name: "Custom Tier", price: "99", features: "Custom features" }])}
        className="w-full py-2 rounded-xl text-[12px] font-semibold border border-dashed border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
        + Add Tier
      </button>
    </div>
  );
}

function SceneBuilderUI({ creation, color }: { creation: Creation; color: string }) {
  const [location, setLocation] = useState("INT. OFFICE — DAY");
  const [action, setAction] = useState("The protagonist enters a dimly lit room.");
  const [dialogue, setDialogue] = useState("ALEX\n(urgently)\nWe don't have much time.");
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Scene Builder</p>
      {[
        { label: "Slug Line", value: location, set: setLocation },
        { label: "Action", value: action, set: setAction },
        { label: "Dialogue", value: dialogue, set: setDialogue },
      ].map(f => (
        <div key={f.label}>
          <label className="text-[10px] font-bold text-muted-foreground block mb-1">{f.label.toUpperCase()}</label>
          <textarea value={f.value} onChange={e => f.set(e.target.value)} rows={f.label === "Dialogue" ? 3 : 2}
            className="w-full text-[12px] px-3 py-2 rounded-lg border border-border/50 bg-background font-mono resize-none outline-none" />
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground">Simulated scene template · No export without Packet AI</p>
    </div>
  );
}

function CharacterSheetUI({ creation, color }: { creation: Creation; color: string }) {
  const [name, setName] = useState("Alex Morgan");
  const [role, setRole] = useState("Protagonist");
  const [traits, setTraits] = useState("Determined, analytical, secretly afraid of failure");
  const [arc, setArc] = useState("Learns to trust others and accept vulnerability");
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Character Sheet</p>
      {[
        { label: "Name", value: name, set: setName, rows: 1 },
        { label: "Role", value: role, set: setRole, rows: 1 },
        { label: "Traits", value: traits, set: setTraits, rows: 2 },
        { label: "Character Arc", value: arc, set: setArc, rows: 2 },
      ].map(f => (
        <div key={f.label}>
          <label className="text-[10px] font-bold text-muted-foreground block mb-1">{f.label.toUpperCase()}</label>
          <textarea value={f.value} onChange={e => f.set(e.target.value)} rows={f.rows}
            className="w-full text-[12px] px-3 py-2 rounded-lg border border-border/50 bg-background resize-none outline-none" />
        </div>
      ))}
    </div>
  );
}

function LevelDesignerUI({ color }: { color: string }) {
  const tiles = ["🌿", "🏔️", "🌊", "🔥", "🏰", "🌀", "💎", "⚔️", "⬛"];
  const [selected, setSelected] = useState("🌿");
  const [grid, setGrid] = useState<string[][]>(
    Array.from({ length: 5 }, (_, r) => Array.from({ length: 8 }, (_, c) => c === 0 || c === 7 ? "🏰" : r === 2 ? "🌊" : "🌿"))
  );
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Level Map Editor</p>
      <div className="flex gap-1.5 flex-wrap">
        {tiles.map(t => (
          <button key={t} onClick={() => setSelected(t)}
            className={`w-8 h-8 rounded-lg text-lg transition-all ${selected === t ? "ring-2 bg-muted" : "hover:bg-muted/50"}`}
            style={{ ringColor: color }}>{t}</button>
        ))}
      </div>
      <div className="space-y-0.5">
        {grid.map((row, r) => (
          <div key={r} className="flex gap-0.5">
            {row.map((cell, c) => (
              <button key={c} onClick={() => setGrid(g => g.map((row2, r2) => r2 === r ? row2.map((cell2, c2) => c2 === c ? selected : cell2) : row2))}
                className="w-8 h-8 rounded text-base hover:ring-1 transition-all" style={{ ringColor: color }}>{cell}</button>
            ))}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">Click a tile type, then click the grid to paint · Simulated</p>
    </div>
  );
}

function QuestPlannerUI({ color }: { color: string }) {
  const [quests, setQuests] = useState([
    { name: "The Lost Artifact", type: "Main", reward: "300 XP + Epic Sword", done: false },
    { name: "Village Defense", type: "Side", reward: "150 XP + Gold", done: false },
    { name: "The Merchant's Request", type: "Fetch", reward: "50 XP + Potion", done: true },
  ]);
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Quest Planner</p>
      <div className="space-y-2">
        {quests.map((q, i) => (
          <div key={i} className="flex items-start gap-2 p-3 bg-background rounded-xl border border-border/40">
            <button onClick={() => setQuests(qs => qs.map((qq, j) => j === i ? { ...qq, done: !qq.done } : qq))}
              className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
              style={{ borderColor: color, background: q.done ? color : "transparent" }}>
              {q.done && <svg viewBox="0 0 12 12" className="w-3 h-3 text-white"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} fill="none"/></svg>}
            </button>
            <div className="flex-1">
              <p className={`text-[12px] font-semibold ${q.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{q.name}</p>
              <p className="text-[10px] text-muted-foreground">{q.type} · {q.reward}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EconomyUI({ color }: { color: string }) {
  const items = [
    { name: "Health Potion", type: "Consumable", cost: "50g", rarity: "Common" },
    { name: "Shadow Blade", type: "Weapon", cost: "1,200g", rarity: "Rare" },
    { name: "Dragon Scale Armor", type: "Armor", cost: "4,500g", rarity: "Epic" },
    { name: "Void Crystal", type: "Material", cost: "800g", rarity: "Rare" },
  ];
  const rarityColors: Record<string, string> = { Common: "#8E8E93", Uncommon: "#30D158", Rare: "#007AFF", Epic: "#BF5AF2", Legendary: "#FFD60A" };
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Item Economy</p>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 p-2.5 bg-background rounded-lg border border-border/40">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: rarityColors[item.rarity] ?? color }} />
            <span className="flex-1 text-[12px] text-foreground font-semibold">{item.name}</span>
            <span className="text-[10px] text-muted-foreground">{item.type}</span>
            <span className="text-[11px] font-bold" style={{ color }}>{item.cost}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">Simulated item economy · Values are placeholder</p>
    </div>
  );
}

function OnboardingUI({ color }: { color: string }) {
  const [steps, setSteps] = useState([
    { label: "Welcome & value proposition screen", done: true },
    { label: "Create profile (name, avatar, interests)", done: true },
    { label: "Choose community areas to follow", done: false },
    { label: "Invite friends or skip", done: false },
    { label: "Complete first post or action", done: false },
  ]);
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Onboarding Flow · {steps.filter(s => s.done).length}/{steps.length} steps configured</p>
      <div className="space-y-1.5">
        {steps.map((s, i) => (
          <button key={i} onClick={() => setSteps(ss => ss.map((x, j) => j === i ? { ...x, done: !x.done } : x))}
            className="w-full flex items-center gap-2 p-2.5 bg-background rounded-lg border border-border/40 text-left hover:bg-muted/20 transition-colors">
            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: color, background: s.done ? color : "transparent" }}>
              {s.done && <span className="text-white text-[9px]">✓</span>}
            </div>
            <span className={`text-[12px] ${s.done ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ContentCalendarUI({ color }: { color: string }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const types = ["📝 Post", "🎥 Video", "🗳️ Poll", "📣 Announce", "❓ Q&A", "⬜ Rest"];
  const [calendar, setCalendar] = useState(["📝 Post", "🎥 Video", "❓ Q&A", "📣 Announce", "📝 Post", "⬜ Rest", "⬜ Rest"]);
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Weekly Content Calendar</p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => (
          <div key={i} className="space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground text-center">{d}</p>
            <select value={calendar[i]} onChange={e => setCalendar(c => c.map((v, j) => j === i ? e.target.value : v))}
              className="w-full text-[9px] p-1 rounded border border-border/40 bg-background outline-none">
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeadlineGeneratorUI({ color }: { color: string }) {
  const variants = [
    "The All-in-One Platform That Finally Gets You",
    "Stop Juggling Tools. Start Shipping Faster.",
    "Built for Teams Who Can't Afford to Slow Down",
    "Everything You Need. Nothing You Don't.",
  ];
  const [selected, setSelected] = useState(0);
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Headline Variants · Click to select</p>
      <div className="space-y-2">
        {variants.map((v, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`w-full p-3 rounded-xl border text-left transition-all ${selected === i ? "border-2" : "border-border/40 hover:bg-muted/20"}`}
            style={{ borderColor: selected === i ? color : undefined, background: selected === i ? `${color}08` : undefined }}>
            <p className="text-[13px] font-semibold text-foreground">{v}</p>
            {selected === i && <p className="text-[10px] mt-1" style={{ color }}>✓ Selected</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

function PersonaBuilderUI({ color }: { color: string }) {
  const [name, setName] = useState("The Busy Founder");
  const [age, setAge] = useState("32–45");
  const [pain, setPain] = useState("Too many tools, not enough time");
  const [goal, setGoal] = useState("Ship faster with a smaller team");
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Customer Persona</p>
      {[
        { label: "Persona Name", value: name, set: setName },
        { label: "Age Range", value: age, set: setAge },
        { label: "Pain Point", value: pain, set: setPain },
        { label: "Core Goal", value: goal, set: setGoal },
      ].map(f => (
        <div key={f.label}>
          <label className="text-[10px] font-bold text-muted-foreground block mb-1">{f.label.toUpperCase()}</label>
          <input value={f.value} onChange={e => f.set(e.target.value)}
            className="w-full text-[12px] px-3 py-2 rounded-lg border border-border/50 bg-background outline-none" />
        </div>
      ))}
    </div>
  );
}

function OutlinerUI({ creation, color }: { creation: Creation; color: string }) {
  const [sections, setSections] = useState(creation.sections.slice(0, 6).map(s => s.title));
  const [newSec, setNewSec] = useState("");
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Section Outline · {sections.length} sections</p>
      <div className="space-y-1.5">
        {sections.map((s, i) => (
          <div key={i} className="flex items-center gap-2 p-2.5 bg-background rounded-lg border border-border/40">
            <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ background: `${color}20`, color }}>{i + 1}</span>
            <span className="flex-1 text-[12px] text-foreground">{s}</span>
            <button onClick={() => setSections(ss => ss.filter((_, j) => j !== i))}
              className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors">✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newSec} onChange={e => setNewSec(e.target.value)} placeholder="Add section…"
          className="flex-1 text-[12px] px-3 py-1.5 rounded-lg border border-border/50 bg-background outline-none placeholder:text-muted-foreground/50" />
        <button onClick={() => { if (newSec.trim()) { setSections(ss => [...ss, newSec.trim()]); setNewSec(""); } }}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
          style={{ background: color }}>+ Add</button>
      </div>
    </div>
  );
}

function ApiExplorerUI({ creation, color }: { creation: Creation; color: string }) {
  const endpoints = [
    { method: "GET",    path: "/api/v1/users",        status: "200" },
    { method: "POST",   path: "/api/v1/users",        status: "201" },
    { method: "GET",    path: "/api/v1/analytics",    status: "200" },
    { method: "PUT",    path: "/api/v1/settings",     status: "200" },
    { method: "DELETE", path: "/api/v1/users/:id",    status: "204" },
  ];
  const methodColors: Record<string, string> = { GET: "#34C759", POST: "#007AFF", PUT: "#FF9500", DELETE: "#FF3B30", PATCH: "#BF5AF2" };
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Simulated API Endpoints</p>
      <div className="space-y-1.5">
        {endpoints.map((ep, i) => (
          <button key={i} onClick={() => setActive(active === i ? null : i)}
            className="w-full flex items-center gap-2 p-2.5 bg-background rounded-lg border border-border/40 text-left hover:bg-muted/10 transition-colors">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
              style={{ background: `${methodColors[ep.method]}20`, color: methodColors[ep.method] }}>{ep.method}</span>
            <span className="flex-1 text-[11px] text-foreground font-mono">{ep.path}</span>
            <span className="text-[10px] text-green-600 font-bold">{ep.status}</span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">Simulated REST API · No real connections</p>
    </div>
  );
}

function ToolsSection({ creation }: { creation: Creation }) {
  const tools = TOOLS_BY_TYPE[creation.type] ?? TOOLS_BY_TYPE.custom;
  const meta = TYPE_META[creation.type];
  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-foreground">Simulated Tools</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {tools.length} context-aware tools for this {meta.label.toLowerCase()}. Generated on demand. All simulated.
        </p>
      </div>
      <div className="space-y-2">
        {tools.map(tool => <ToolCard key={tool.id} tool={tool} creation={creation} />)}
      </div>
      <div className="bg-muted/30 rounded-2xl p-4 border border-border/30 text-center">
        <p className="text-[12px] font-semibold text-foreground">Need a different tool?</p>
        <p className="text-[11px] text-muted-foreground mt-1">Describe it in Packet AI and it will generate a custom tool for this packet instantly.</p>
      </div>
    </div>
  );
}

// ─── Design Section ───────────────────────────────────────────────────────────
interface Theme { name: string; color: string; bg: string; desc: string; }

const DESIGN_THEMES: Record<string, Theme[]> = {
  software:  [
    { name: "Ocean Blue",    color: "#007AFF", bg: "#E8F0FE", desc: "Professional, trustworthy, tech-forward" },
    { name: "Emerald",       color: "#34C759", bg: "#E8F8EE", desc: "Growth, innovation, sustainability" },
    { name: "Deep Violet",   color: "#5856D6", bg: "#EDECFA", desc: "AI-native, futuristic, premium" },
    { name: "Slate Pro",     color: "#636366", bg: "#F2F2F7", desc: "Minimal, focused, enterprise-grade" },
  ],
  movie: [
    { name: "Cinematic Red",  color: "#FF2D55", bg: "#FEE8EC", desc: "Dramatic, high-stakes, theatrical" },
    { name: "Epic Gold",      color: "#FFD60A", bg: "#FFFBE8", desc: "Blockbuster, prestige, Oscar bait" },
    { name: "Noir Shadow",    color: "#3A3A3C", bg: "#F2F2F7", desc: "Dark, mysterious, classic noir" },
    { name: "Sci-Fi Blue",    color: "#0A84FF", bg: "#E5F3FF", desc: "Future-set, technological, cosmic" },
  ],
  comic: [
    { name: "Classic Orange", color: "#FF9500", bg: "#FFF3E0", desc: "Bold, fun, timeless comics feel" },
    { name: "Vivid Red",      color: "#FF3B30", bg: "#FDECEA", desc: "Action-packed, superhero energy" },
    { name: "Deep Blue",      color: "#0A84FF", bg: "#E5F3FF", desc: "Noir detective, cinematic drama" },
    { name: "Comics Gold",    color: "#FFD60A", bg: "#FFFBE8", desc: "Golden age, retro, collector's" },
  ],
  game: [
    { name: "Purple Realm",   color: "#5856D6", bg: "#EDECFA", desc: "Fantasy, mystical, RPG classic" },
    { name: "Forest Green",   color: "#30D158", bg: "#E8FAF0", desc: "Open world, exploration, nature" },
    { name: "Lava Orange",    color: "#FF6B00", bg: "#FFF0E5", desc: "Action, combat, intense energy" },
    { name: "Ice Blue",       color: "#40C8E0", bg: "#E5F9FC", desc: "Sci-fi, space, cyberpunk" },
  ],
  community: [
    { name: "Cyan Connect",   color: "#30B0C7", bg: "#E5F6F9", desc: "Open, welcoming, collaborative" },
    { name: "Purple Hub",     color: "#BF5AF2", bg: "#F5EAFE", desc: "Creative, expressive, vibrant" },
    { name: "Green Grove",    color: "#30D158", bg: "#E8FAF0", desc: "Growth, wellness, sustainable" },
    { name: "Warm Gold",      color: "#FFD60A", bg: "#FFFBE8", desc: "Premium, aspirational, exclusive" },
  ],
  document: [
    { name: "Scholar Green",  color: "#34C759", bg: "#E8F8EE", desc: "Academic, professional, clean" },
    { name: "Ink Blue",       color: "#007AFF", bg: "#E8F0FE", desc: "Corporate, authoritative, clear" },
    { name: "Warm Sepia",     color: "#A8763E", bg: "#F5ECD9", desc: "Classic, editorial, refined" },
    { name: "Midnight",       color: "#3A3A3C", bg: "#F2F2F7", desc: "Minimal, focused, distraction-free" },
  ],
  marketing: [
    { name: "Bold Orange",    color: "#FF9500", bg: "#FFF3E0", desc: "Energetic, conversion-driven, warm" },
    { name: "Power Red",      color: "#FF2D55", bg: "#FEE8EC", desc: "Urgent, bold, high-conversion" },
    { name: "Growth Green",   color: "#30D158", bg: "#E8FAF0", desc: "Trust-building, results-focused" },
    { name: "Brand Blue",     color: "#007AFF", bg: "#E8F0FE", desc: "Professional, dependable, clear" },
  ],
  custom: [
    { name: "Cosmic Purple",  color: "#BF5AF2", bg: "#F5EAFE", desc: "Creative, unique, futuristic" },
    { name: "Electric Blue",  color: "#007AFF", bg: "#E8F0FE", desc: "Modern, versatile, clean" },
    { name: "Solar Gold",     color: "#FFD60A", bg: "#FFFBE8", desc: "Premium, optimistic, warm" },
    { name: "Aurora Green",   color: "#30D158", bg: "#E8FAF0", desc: "Fresh, innovative, natural" },
  ],
};

const FONT_PAIRS = [
  { name: "Modern Sans",      heading: "Inter / SF Pro",      body: "Inter / System UI",    desc: "Clean, versatile, universal" },
  { name: "Editorial Serif",  heading: "Playfair Display",    body: "Georgia / Lora",       desc: "Premium, editorial, trust" },
  { name: "Tech Mono",        heading: "JetBrains Mono",      body: "Inter / Roboto",       desc: "Developer-native, precise" },
];

const LAYOUT_OPTIONS = [
  { id: "minimal",  name: "Minimal",  icon: "◻️", desc: "Generous whitespace, focused, distraction-free" },
  { id: "rich",     name: "Rich",     icon: "▦",  desc: "Card-based grid, data-dense, feature-rich" },
  { id: "focused",  name: "Focused",  icon: "▬",  desc: "Single column, deep reading, narrative" },
];

interface DesignSectionProps {
  creation: Creation;
  selectedTheme: string;
  onThemeChange: (themeName: string, color: string) => void;
}

function DesignSection({ creation, selectedTheme, onThemeChange }: DesignSectionProps) {
  const meta = TYPE_META[creation.type];
  const themes = DESIGN_THEMES[creation.type] ?? DESIGN_THEMES.custom;
  const [selectedFont, setSelectedFont] = useState(0);
  const [selectedLayout, setSelectedLayout] = useState("minimal");
  const [applied, setApplied] = useState(false);

  const applyTheme = (theme: Theme) => {
    onThemeChange(theme.name, theme.color);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div className="p-5 md:p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-foreground">Packet Design</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">Customize the visual style of this packet. Changes apply to this packet only.</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-foreground">Color Theme</h3>
          {applied && <span className="text-[11px] text-green-600 font-semibold">✓ Applied</span>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {themes.map(theme => (
            <button key={theme.name} onClick={() => applyTheme(theme)}
              className={`p-4 rounded-2xl border-2 text-left transition-all space-y-2 ${selectedTheme === theme.name ? "shadow-md" : "border-border/40 hover:border-border"}`}
              style={{ borderColor: selectedTheme === theme.name ? theme.color : undefined, background: selectedTheme === theme.name ? theme.bg : undefined }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full" style={{ background: theme.color }} />
                <span className="font-bold text-[13px] text-foreground">{theme.name}</span>
                {selectedTheme === theme.name && <span className="ml-auto text-[10px] font-bold" style={{ color: theme.color }}>Active</span>}
              </div>
              <div className="flex gap-1">
                {[theme.color, theme.bg, "#F2F2F7", "#1C1C1E"].map((c, i) => (
                  <div key={i} className="flex-1 h-4 rounded" style={{ background: c }} />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">{theme.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[14px] font-bold text-foreground">Font Pairing</h3>
        <div className="space-y-2">
          {FONT_PAIRS.map((pair, i) => (
            <button key={i} onClick={() => setSelectedFont(i)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${selectedFont === i ? "border-primary/60 bg-primary/5" : "border-border/40 hover:border-border"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[13px] text-foreground">{pair.name}</p>
                  <p className="text-[10px] text-muted-foreground">{pair.heading} · {pair.body}</p>
                </div>
                {selectedFont === i && <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center"><svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} fill="none"/></svg></div>}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{pair.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[14px] font-bold text-foreground">Layout Style</h3>
        <div className="grid grid-cols-3 gap-2">
          {LAYOUT_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => setSelectedLayout(opt.id)}
              className={`p-3 rounded-2xl border-2 text-center transition-all space-y-1 ${selectedLayout === opt.id ? "border-primary/60 bg-primary/5" : "border-border/40 hover:border-border"}`}>
              <p className="text-2xl">{opt.icon}</p>
              <p className="font-bold text-[12px] text-foreground">{opt.name}</p>
              <p className="text-[9px] text-muted-foreground">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-muted/30 rounded-2xl p-4 border border-border/30">
        <p className="text-[12px] font-semibold text-foreground mb-1">Apply via Packet AI</p>
        <p className="text-[11px] text-muted-foreground">For deeper visual changes — fonts, spacing, component styles — open Packet AI and describe the change. It updates only this packet.</p>
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

// ─── Software: Modules & Data ─────────────────────────────────────────────────
function ModulesSection({ creation }: { creation: Creation }) {
  const modules = findSections(creation, ["module", "module:"]);
  const [active, setActive] = useState<number | null>(0);

  if (modules.length === 0) {
    // Fall back to features
    return <FeaturesSection creation={creation} />;
  }

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-foreground">Modules</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">Auto-detected modules built into this product</p>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {modules.map((m, i) => (
          <button key={i} onClick={() => setActive(active === i ? null : i)}
            className={`text-[11px] px-3 py-1.5 rounded-full border font-semibold transition-all ${active === i ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}>
            🧩 {m.title.replace(/module[:\s]*/i, "").trim()}
          </button>
        ))}
      </div>
      {active !== null && modules[active] && (
        <div className="bg-background rounded-2xl border border-border/50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">🧩</div>
            <h3 className="font-bold text-[16px] text-foreground">{modules[active].title.replace(/module[:\s]*/i, "").trim()} Module</h3>
          </div>
          <pre className="text-[13px] text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">{modules[active].content}</pre>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {modules.filter((_, i) => i !== active).slice(0, 6).map((m, i) => (
          <button key={i} onClick={() => setActive(modules.indexOf(m))}
            className="p-3 bg-muted/30 rounded-xl border border-border/30 text-left hover:border-primary/20 transition-colors">
            <p className="text-[11px] font-semibold text-foreground">{m.title.replace(/module[:\s]*/i, "").trim()}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{m.content.slice(0, 60)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function DataModelSection({ creation }: { creation: Creation }) {
  const dataModel = findSection(creation, ["data model", "database", "entities", "schema"]);
  const api = findSection(creation, ["api overview", "api endpoints", "rest api"]);

  const entities = dataModel ? dataModel.split(/\n(?=[A-Z])/).filter(b => b.trim()) : [];
  const endpoints = api ? api.split(/\n(?=(?:GET|POST|PUT|DELETE|PATCH|\d+\.))/i).filter(b => b.trim()) : [];

  return (
    <div className="p-5 md:p-6 space-y-5 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Data Model & API</h2>

      {dataModel && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Core Entities (Mock Schema)</p>
          {entities.length > 1 ? (
            <div className="grid md:grid-cols-2 gap-2">
              {entities.slice(0, 8).map((e, i) => (
                <div key={i} className="bg-background border border-border/50 rounded-xl p-3.5">
                  <pre className="text-[11px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">{e.trim()}</pre>
                </div>
              ))}
            </div>
          ) : (
            <ContentBlock title="" content={dataModel} />
          )}
        </div>
      )}

      {api && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">API Endpoints (Conceptual)</p>
          <div className="space-y-1.5">
            {endpoints.length > 1 ? (
              endpoints.slice(0, 8).map((ep, i) => {
                const method = ep.match(/^(GET|POST|PUT|DELETE|PATCH)/i)?.[1]?.toUpperCase();
                const colors: Record<string, string> = { GET: "#34C759", POST: "#007AFF", PUT: "#FF9500", DELETE: "#FF3B30", PATCH: "#FF9500" };
                return (
                  <div key={i} className="flex items-start gap-2 bg-background border border-border/50 rounded-xl p-3">
                    {method && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white flex-shrink-0 mt-0.5" style={{ backgroundColor: colors[method] ?? "#636366" }}>{method}</span>}
                    <pre className="text-[11px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">{ep.replace(/^(GET|POST|PUT|DELETE|PATCH)\s*/i, "").trim()}</pre>
                  </div>
                );
              })
            ) : (
              <ContentBlock title="" content={api} />
            )}
          </div>
        </div>
      )}

      {!dataModel && !api && (
        <p className="text-muted-foreground text-center py-8">No data model content found.</p>
      )}
      <p className="text-[10px] text-muted-foreground">Mock schema — conceptual only. No real database or API is configured.</p>
    </div>
  );
}

// ─── Game sections ────────────────────────────────────────────────────────────
function GameOverview({ creation }: { creation: Creation }) {
  const overview = findSection(creation, ["game overview", "overview", "summary"]);
  const artDir = findSection(creation, ["art direction", "visual style"]);
  const techOverview = findSection(creation, ["technical overview", "technical"]);
  return (
    <div className="p-5 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-3xl flex-shrink-0">🎮</div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{creation.name}</h1>
            <p className="text-[13px] text-muted-foreground">{creation.genre} · {creation.style} · Demo Build</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[creation.genre, creation.style, creation.tone, "Indie Demo"].map(t => (
            <span key={t} className="text-[11px] bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">{t}</span>
          ))}
        </div>
      </div>
      <ContentBlock title="Game Overview" content={overview} />
      <div className="grid md:grid-cols-2 gap-3">
        {artDir && <ContentBlock title="Art Direction" content={artDir} />}
        {techOverview && <ContentBlock title="Technical Overview" content={techOverview} />}
      </div>
    </div>
  );
}

function GameplaySection({ creation }: { creation: Creation }) {
  const mechanics = findSection(creation, ["core gameplay", "gameplay mechanic", "mechanics"]);
  const ai = findSection(creation, ["ai & npc", "npc behavior", "ai behavior", "ai"]);
  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Gameplay</h2>
      <ContentBlock title="Core Mechanics" content={mechanics || "No gameplay data found."} />
      {ai && <ContentBlock title="AI & NPC Behavior" content={ai} />}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
        <p className="text-[12px] font-semibold text-purple-700">🎮 Demo Mode — Simulation Only</p>
        <p className="text-[11px] text-purple-600 mt-1">All gameplay is conceptual/mock. No real game engine is active. This is a design document viewer.</p>
      </div>
    </div>
  );
}

function GameStorySection({ creation }: { creation: Creation }) {
  const story = findSection(creation, ["story & setting", "story", "setting", "world building", "narrative"]);
  const world = findSection(creation, ["world building", "lore", "geography"]);
  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Story & World</h2>
      <ContentBlock title="Story & Setting" content={story || "No story content found."} />
      {world && world !== story && <ContentBlock title="World Building" content={world} />}
    </div>
  );
}

function LevelsSection({ creation }: { creation: Creation }) {
  const levels = findSections(creation, ["level", "tutorial", "boss", "challenge", "chapter", "area"]);
  const [active, setActive] = useState<number | null>(0);
  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Levels & Areas</h2>
      <div className="space-y-2">
        {levels.map((lvl, i) => (
          <div key={i} className="bg-background rounded-2xl border border-border/50 overflow-hidden">
            <button onClick={() => setActive(active === i ? null : i)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-sm flex-shrink-0">L{i+1}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] text-foreground">{lvl.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{lvl.content.slice(0, 80)}</p>
              </div>
              <span className="text-muted-foreground text-sm">{active === i ? "▲" : "▼"}</span>
            </button>
            {active === i && (
              <div className="border-t border-border/30 p-4 bg-muted/10">
                <pre className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed font-sans">{lvl.content}</pre>
              </div>
            )}
          </div>
        ))}
        {levels.length === 0 && <p className="text-muted-foreground text-center py-8">No level data found.</p>}
      </div>
    </div>
  );
}

function GameEconomySection({ creation }: { creation: Creation }) {
  const economy = findSection(creation, ["game economy", "economy", "currency", "progression", "rewards"]);
  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Game Economy</h2>
      <ContentBlock title="" content={economy || "No economy data found."} />
    </div>
  );
}

// ─── Community sections ───────────────────────────────────────────────────────
function CommunityOverview({ creation }: { creation: Creation }) {
  const overview = findSection(creation, ["platform overview", "overview", "mission"]);
  const gamification = findSection(creation, ["gamification", "reputation", "badges"]);
  const monetization = findSection(creation, ["monetization", "revenue", "pricing"]);
  return (
    <div className="p-5 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-cyan-100 flex items-center justify-center text-3xl flex-shrink-0">🌐</div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{creation.name}</h1>
            <p className="text-[13px] text-muted-foreground">{creation.genre} · Community Platform · Demo Mode</p>
          </div>
        </div>
      </div>
      <ContentBlock title="Platform Overview" content={overview} />
      <div className="grid md:grid-cols-2 gap-3">
        {gamification && <ContentBlock title="Gamification" content={gamification} />}
        {monetization && <ContentBlock title="Monetization" content={monetization} />}
      </div>
    </div>
  );
}

function CommunityFeaturesSection({ creation }: { creation: Creation }) {
  const features = findSection(creation, ["core features", "features", "member experience"]);
  const moderation = findSection(creation, ["moderation", "safety", "community guidelines"]);
  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Platform Features</h2>
      <ContentBlock title="Core Features" content={features || "No feature data found."} />
      {moderation && <ContentBlock title="Moderation & Safety" content={moderation} />}
    </div>
  );
}

function MembersSection({ creation }: { creation: Creation }) {
  const members = findSection(creation, ["member experience", "profile", "onboarding", "discovery"]);
  const groups = findSection(creation, ["groups", "channels", "clubs"]);

  const mockMembers = [
    { name: "Alex Rivera", role: "Member", joined: "Jan 2026", posts: "42", badge: "🥇" },
    { name: "Sam Chen", role: "Moderator", joined: "Mar 2025", posts: "128", badge: "🛡️" },
    { name: "Jordan Kim", role: "Member", joined: "Feb 2026", posts: "17", badge: "🌱" },
    { name: "Casey Morgan", role: "Contributor", joined: "Dec 2025", posts: "89", badge: "⭐" },
    { name: "Riley Park", role: "Member", joined: "Mar 2026", posts: "5", badge: "🌱" },
  ];

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Members</h2>
      <div className="space-y-1.5">
        {mockMembers.map((m, i) => (
          <div key={i} className="flex items-center gap-3 p-3.5 bg-background rounded-xl border border-border/50">
            <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center text-lg flex-shrink-0">{m.badge}</div>
            <div className="flex-1">
              <p className="font-semibold text-[13px] text-foreground">{m.name}</p>
              <p className="text-[10px] text-muted-foreground">{m.role} · Joined {m.joined} · {m.posts} posts</p>
            </div>
          </div>
        ))}
      </div>
      {members && <ContentBlock title="Member Experience Design" content={members} />}
      {groups && <ContentBlock title="Groups & Channels" content={groups} />}
    </div>
  );
}

function CommunityContentSection({ creation }: { creation: Creation }) {
  const content = findSection(creation, ["content & posts", "content", "posts"]);
  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Content & Posts</h2>
      <ContentBlock title="" content={content || "No content data found."} />
    </div>
  );
}

function EventsSection({ creation }: { creation: Creation }) {
  const events = findSection(creation, ["events", "gatherings", "meetups"]);
  const mockEvents = [
    { name: "Weekly Community Call", date: "Every Thursday", type: "Virtual", attendees: "~45" },
    { name: "Monthly Showcase", date: "Last Friday of Month", type: "Hybrid", attendees: "~120" },
    { name: "Annual Summit", date: "Q3 2026 (Mock)", type: "In-Person", attendees: "~500" },
  ];
  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Events</h2>
      <div className="space-y-2">
        {mockEvents.map((e, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-xl flex-shrink-0">📅</div>
            <div className="flex-1">
              <p className="font-semibold text-[13px] text-foreground">{e.name}</p>
              <p className="text-[11px] text-muted-foreground">{e.date} · {e.type} · {e.attendees} attendees</p>
            </div>
            <span className="text-[10px] text-cyan-600 font-semibold border border-cyan-200 px-2 py-0.5 rounded-full">Mock</span>
          </div>
        ))}
      </div>
      {events && <ContentBlock title="Events Platform Design" content={events} />}
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
  const [editedSections, setEditedSections] = useState(creation.sections);
  const [selectedTheme, setSelectedTheme] = useState("");
  const [themeColor, setThemeColor] = useState("");

  const baseMeta = TYPE_META[creation.type];
  const meta = { ...baseMeta, color: themeColor || baseMeta.color };
  const navItems = buildNavItems(creation.type);

  const editedCreation = { ...creation, sections: editedSections };

  const handleSectionUpdate = (title: string, newContent: string) => {
    setEditedSections(prev =>
      prev.map(s => s.title === title ? { ...s, content: newContent } : s)
    );
  };

  const handleThemeChange = (themeName: string, color: string) => {
    setSelectedTheme(themeName);
    setThemeColor(color);
  };

  const renderSection = () => {
    if (section === "packetai") return <PacketEditor creation={editedCreation} onSectionUpdate={handleSectionUpdate} />;
    if (section === "tools")    return <ToolsSection creation={editedCreation} />;
    if (section === "design")   return <DesignSection creation={editedCreation} selectedTheme={selectedTheme} onThemeChange={handleThemeChange} />;
    if (section === "ai")        return <AIStudio creation={editedCreation} />;
    if (section === "downloads") return <DownloadsSection creation={editedCreation} />;
    if (section === "marketing") return <MarketingSection creation={editedCreation} />;

    // Movie
    if (creation.type === "movie") {
      if (section === "overview")    return <MovieOverview creation={editedCreation} />;
      if (section === "scenes")      return <ScenesSection creation={editedCreation} />;
      if (section === "characters")  return <CharactersSection creation={editedCreation} />;
      if (section === "script") {
        const script = findSection(editedCreation, ["script", "screenplay", "full script"]);
        return <div className="p-5 md:p-6 max-w-3xl mx-auto space-y-4"><h2 className="text-xl font-bold">Script</h2><ContentBlock title="" content={script || "No script content found."} /></div>;
      }
    }

    // Comic
    if (creation.type === "comic") {
      if (section === "overview") {
        const overview = findSection(editedCreation, ["story overview", "overview", "summary"]);
        const artDir   = findSection(editedCreation, ["art direction"]);
        return <div className="p-5 md:p-6 space-y-5 max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100 rounded-2xl p-6"><div className="flex items-center gap-3 mb-3"><div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-3xl">📖</div><div><h1 className="text-2xl font-bold">{creation.name}</h1><p className="text-[13px] text-muted-foreground">{creation.genre} · {creation.style}</p></div></div></div>
          <ContentBlock title="Story Overview" content={overview} />
          <ContentBlock title="Art Direction" content={artDir} />
        </div>;
      }
      if (section === "panels")      return <PanelsSection creation={editedCreation} />;
      if (section === "characters")  return <CharactersSection creation={editedCreation} />;
      if (section === "story") {
        const full = findSection(editedCreation, ["full issue", "script", "full story"]);
        return <div className="p-5 md:p-6 max-w-3xl mx-auto space-y-4"><h2 className="text-xl font-bold">Full Story</h2><ContentBlock title="" content={full || creation.rawContent.slice(0, 3000)} /></div>;
      }
    }

    // Software / SaaS
    if (creation.type === "software") {
      if (section === "overview")   return <SoftwareDashboard creation={editedCreation} />;
      if (section === "features")   return <FeaturesSection creation={editedCreation} />;
      if (section === "modules")    return <ModulesSection creation={editedCreation} />;
      if (section === "workflows")  return <WorkflowsSection creation={editedCreation} />;
      if (section === "data")       return <DataModelSection creation={editedCreation} />;
      if (section === "docs") {
        const docs = findSections(editedCreation, ["documentation", "getting started", "key concepts", "user guide"]);
        return <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto"><h2 className="text-xl font-bold">Documentation</h2>{docs.length > 0 ? docs.map((d, i) => <ContentBlock key={i} title={d.title.replace(/documentation[—\s-]*/i, "").trim()} content={d.content} />) : <p className="text-muted-foreground text-center py-8">No documentation found.</p>}</div>;
      }
    }

    // Game
    if (creation.type === "game") {
      if (section === "overview")    return <GameOverview creation={editedCreation} />;
      if (section === "gameplay")    return <GameplaySection creation={editedCreation} />;
      if (section === "story")       return <GameStorySection creation={editedCreation} />;
      if (section === "levels")      return <LevelsSection creation={editedCreation} />;
      if (section === "characters")  return <CharactersSection creation={editedCreation} />;
      if (section === "economy")     return <GameEconomySection creation={editedCreation} />;
    }

    // Community
    if (creation.type === "community") {
      if (section === "overview")  return <CommunityOverview creation={editedCreation} />;
      if (section === "features")  return <CommunityFeaturesSection creation={editedCreation} />;
      if (section === "members")   return <MembersSection creation={editedCreation} />;
      if (section === "content")   return <CommunityContentSection creation={editedCreation} />;
      if (section === "events")    return <EventsSection creation={editedCreation} />;
    }

    // Document
    if (creation.type === "document") {
      if (section === "overview") {
        const exec = findSection(editedCreation, ["executive summary", "summary", "overview"]);
        return <div className="p-5 md:p-6 space-y-5 max-w-3xl mx-auto"><h2 className="text-xl font-bold">Executive Summary</h2><ContentBlock title="" content={exec} /></div>;
      }
      if (section === "document") return <FullDocumentSection creation={editedCreation} />;
      if (section === "toc")      return <TOCSection creation={editedCreation} />;
    }

    // Marketing system
    if (creation.type === "marketing") {
      if (section === "overview") {
        const brand = findSection(editedCreation, ["brand positioning", "brand", "overview"]);
        return <div className="p-5 md:p-6 space-y-5 max-w-3xl mx-auto"><div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100 rounded-2xl p-6"><div className="flex items-center gap-3"><div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-3xl">📣</div><div><h1 className="text-2xl font-bold">{creation.name}</h1><p className="text-[13px] text-muted-foreground">Marketing System · {creation.genre}</p></div></div></div><ContentBlock title="Brand Positioning" content={brand} /></div>;
      }
      if (section === "landing") return <LandingSection creation={editedCreation} />;
      if (section === "funnel")  return <FunnelSection creation={editedCreation} />;
      if (section === "emails")  return <EmailsSection creation={editedCreation} />;
      if (section === "ads")     return <AdsSection creation={editedCreation} />;
    }

    // Custom + fallback
    if (section === "overview") {
      const overview = findSection(editedCreation, ["overview", "summary", "introduction"]);
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
    if (section === "content") return <GenericContent creation={editedCreation} />;

    return <GenericContent creation={editedCreation} />;
  };

  const fullHeight = section === "ai" || section === "packetai";

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
      disclaimer={`${creation.name} · ${meta.label} · Omega Packet · All content mock/simulated · CreateAI Brain`}
    >
      <div className={fullHeight ? "h-full flex flex-col" : ""}>
        {renderSection()}
      </div>
    </StandaloneLayout>
  );
}
