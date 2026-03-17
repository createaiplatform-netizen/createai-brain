import React, { useState, useRef, useEffect, useCallback } from "react";
import { ProjectGenerator, type GeneratedProject } from "./ProjectGenerator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMsg {
  id: number;
  role: "user" | "ai";
  text: string;
  createdAt: string;
}

interface CreatedProject {
  name: string;
  industry: string;
  icon: string;
}

// ─── Industry data (mirrors ProjectOSApp) ─────────────────────────────────────

const VALID_INDUSTRIES = [
  "Healthcare", "Construction", "Hunting", "Farming", "Education",
  "Logistics", "Legal", "Technology", "Nonprofit", "Retail", "General",
];

const INDUSTRY_SPECIFIC: Record<string, { name: string; icon: string }[]> = {
  Healthcare:   [{ name: "Regulations", icon: "⚖️" }, { name: "Patient Records", icon: "🏥" }, { name: "Compliance", icon: "✅" }],
  Construction: [{ name: "Plans & Blueprints", icon: "📐" }, { name: "Safety", icon: "🦺" }, { name: "Permits", icon: "📋" }, { name: "Equipment", icon: "🚧" }],
  Hunting:      [{ name: "Maps", icon: "🗺️" }, { name: "Gear Lists", icon: "🎒" }, { name: "Safety", icon: "🦺" }, { name: "Seasons & Regulations", icon: "📅" }],
  Farming:      [{ name: "Crop Plans", icon: "🌱" }, { name: "Equipment", icon: "🚜" }, { name: "Soil Data", icon: "🌍" }, { name: "Harvest Logs", icon: "📊" }],
  Education:    [{ name: "Curriculum", icon: "📚" }, { name: "Student Records", icon: "👤" }, { name: "Assessments", icon: "📝" }],
  Logistics:    [{ name: "Routes", icon: "🗺️" }, { name: "Fleet", icon: "🚛" }, { name: "Schedules", icon: "📅" }, { name: "Manifests", icon: "📋" }],
  Legal:        [{ name: "Cases", icon: "⚖️" }, { name: "Contracts", icon: "📄" }, { name: "Evidence", icon: "🔍" }],
  Technology:   [{ name: "Source Code", icon: "💻" }, { name: "APIs", icon: "🔌" }, { name: "Deployments", icon: "🚀" }],
  Nonprofit:    [{ name: "Donors", icon: "❤️" }, { name: "Grants", icon: "💰" }, { name: "Impact Reports", icon: "📊" }],
  Retail:       [{ name: "Inventory", icon: "📦" }, { name: "Suppliers", icon: "🤝" }, { name: "POS Data", icon: "🛒" }],
  General:      [{ name: "Notes", icon: "📝" }, { name: "Research", icon: "🔍" }],
};

const UNIVERSAL_FOLDERS = [
  { id: "apps", name: "Apps", icon: "🧩", universal: true, count: 0 },
  { id: "demo", name: "Demo Mode", icon: "🎭", universal: true, count: 0 },
  { id: "test", name: "Test Mode", icon: "🧪", universal: true, count: 0 },
  { id: "live", name: "Live Mode", icon: "🟢", universal: true, count: 0 },
  { id: "marketing", name: "Marketing Packet", icon: "📣", universal: true, count: 0 },
  { id: "company", name: "Company Materials", icon: "🏢", universal: true, count: 0 },
  { id: "screens", name: "Screens", icon: "🖥️", universal: true, count: 0 },
  { id: "files", name: "Files", icon: "📁", universal: true, count: 0 },
  { id: "data", name: "Data", icon: "🗄️", universal: true, count: 0 },
];

const INDUSTRY_ICONS: Record<string, string> = {
  Healthcare: "🏥", Construction: "🏗️", Hunting: "🦌", Farming: "🌾",
  Education: "📚", Logistics: "🚛", Legal: "⚖️", Technology: "💻",
  Nonprofit: "❤️", Retail: "🛒", General: "📁",
};

const INDUSTRY_COLORS: Record<string, string> = {
  Healthcare: "#10b981", Construction: "#f97316", Hunting: "#78716c",
  Farming: "#84cc16", Education: "#6366f1", Logistics: "#0ea5e9",
  Legal: "#8b5cf6", Technology: "#06b6d4", Nonprofit: "#ec4899",
  Retail: "#f59e0b", General: "#94a3b8",
};

// ─── Quick-start chips ────────────────────────────────────────────────────────

const CHIPS = [
  { label: "🏗️ Construction app",    text: "I want to build a construction project management app with blueprints, safety logs, equipment tracking, and permit management." },
  { label: "🏥 Healthcare system",   text: "Create a healthcare patient management system with appointments, medical records, compliance tracking, and staff scheduling." },
  { label: "🦌 Hunting platform",    text: "Build me a hunting trip planning app with maps, gear lists, safety checklists, season calendars, and regulation tracking." },
  { label: "🛒 Retail solution",     text: "I need a retail management platform with inventory tracking, supplier management, point-of-sale data, and reporting." },
  { label: "💡 Brainstorm ideas",    text: "Help me brainstorm a new business idea I can start this year. What are some high-potential, low-cost opportunities right now?" },
  { label: "📱 Plan a mobile app",   text: "I want to build a mobile app for a small business. What should I focus on, and what features are most important?" },
];

// ─── API helpers ──────────────────────────────────────────────────────────────

async function createBrainstormSession(title: string): Promise<number | null> {
  try {
    const res = await fetch("/api/brainstorm/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { session: { id: number } };
    return data.session.id;
  } catch { return null; }
}

interface StreamCallbacks {
  onChunk: (t: string) => void;
  onProjectCreated?: (p: { id: string; name: string; industry: string; icon: string; color: string }) => void;
}

async function streamBrainstorm(
  sessionId: number,
  message: string,
  history: { role: string; content: string }[],
  { onChunk, onProjectCreated }: StreamCallbacks,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch(`/api/brainstorm/sessions/${sessionId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
    signal,
  });
  if (!res.ok || !res.body) return;
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let acc = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += dec.decode(value, { stream: true });
    const parts = acc.split("\n\n");
    acc = parts.pop() ?? "";
    for (const part of parts) {
      if (!part.startsWith("data: ")) continue;
      const raw = part.slice(6).trim();
      if (raw === "[DONE]") return;
      try {
        const p = JSON.parse(raw) as { content?: string; projectCreated?: { id: string; name: string; industry: string; icon: string; color: string } };
        if (p.projectCreated && onProjectCreated) onProjectCreated(p.projectCreated);
        else if (p.content) onChunk(p.content);
      } catch {}
    }
  }
}

// ─── Bubble component ─────────────────────────────────────────────────────────

function Bubble({ msg, streaming }: { msg: ChatMsg; streaming: boolean }) {
  const isUser = msg.role === "user";
  const isEmpty = !msg.text;

  return (
    <div className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"} items-end gap-2`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mb-0.5"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 2px 6px rgba(99,102,241,0.25)" }}>
          🧠
        </div>
      )}
      <div className={`max-w-[80%] px-4 py-3 text-[13px] leading-relaxed ${isUser ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"}`}
        style={isUser
          ? { background: "#6366f1", color: "#fff", boxShadow: "0 2px 10px rgba(99,102,241,0.25)" }
          : { background: "#fff", color: "#0f172a", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }
        }
      >
        {isEmpty && streaming ? (
          <div className="flex gap-1.5 py-1">
            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "300ms" }} />
          </div>
        ) : (
          <span className="whitespace-pre-wrap">
            {msg.text}
            {!isUser && streaming && msg.text && (
              <span className="inline-block w-0.5 h-3.5 rounded-sm animate-pulse align-middle ml-0.5"
                style={{ background: "#6366f1", opacity: 0.7 }} />
            )}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface BrainstormChatProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToProjects?: () => void;
}

export function BrainstormChat({ isOpen, onClose, onGoToProjects }: BrainstormChatProps) {
  const [messages, setMessages]               = useState<ChatMsg[]>([]);
  const [input, setInput]                     = useState("");
  const [isStreaming, setIsStreaming]          = useState(false);
  const [createdProjects, setCreatedProjects]  = useState<CreatedProject[]>([]);
  const [sessionId, setSessionId]             = useState<number | null>(null);
  const [showGenerator, setShowGenerator]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const abortRef  = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: ChatMsg = { id: Date.now(), role: "user", text: text.trim(), createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    let sid = sessionId;
    if (!sid) {
      const title = text.trim().slice(0, 60) || "New Brainstorm";
      sid = await createBrainstormSession(title);
      if (sid) setSessionId(sid);
    }

    const historyForApi = messages.map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));

    const aiId = Date.now() + 1;
    setMessages(prev => [...prev, { id: aiId, role: "ai", text: "", createdAt: new Date().toISOString() }]);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      if (sid) {
        await streamBrainstorm(
          sid,
          text.trim(),
          historyForApi,
          {
            onChunk: (chunk) => {
              setMessages(prev => prev.map(m =>
                m.id === aiId ? { ...m, text: m.text + chunk } : m
              ));
            },
            onProjectCreated: (proj) => {
              setCreatedProjects(prev => [...prev, {
                name: proj.name,
                industry: proj.industry,
                icon: proj.icon,
              }]);
            },
          },
          ctrl.signal,
        );
      }
    } catch {}

    setIsStreaming(false);
  }, [messages, isStreaming, sessionId]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40"
        style={{ background: "rgba(15,23,42,0.20)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[420px] flex flex-col"
        style={{ background: "#fff", borderLeft: "1px solid rgba(0,0,0,0.08)", boxShadow: "-8px 0 40px rgba(0,0,0,0.10)" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 3px 10px rgba(99,102,241,0.30)" }}>
            🧠
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px]" style={{ color: "#0f172a", letterSpacing: "-0.01em" }}>
              Brainstorm with AI
            </p>
            <p className="text-[11px]" style={{ color: "#6b7280" }}>
              Describe any idea — projects are created automatically
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            style={{ color: "#9ca3af", background: "rgba(0,0,0,0.05)" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#374151")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#9ca3af")}
          >✕</button>
        </div>

        {/* Created projects banner */}
        {createdProjects.length > 0 && (
          <div className="flex-shrink-0 px-4 py-2.5"
            style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0" }}>
            {createdProjects.map((p, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-lg">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold truncate" style={{ color: "#15803d" }}>
                    ✅ "{p.name}" project created
                  </p>
                  <p className="text-[10px]" style={{ color: "#16a34a" }}>{p.industry} · All folders ready</p>
                </div>
                {onGoToProjects && (
                  <button onClick={onGoToProjects}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 transition-all"
                    style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#bbf7d0")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#dcfce7")}
                  >
                    Open in ProjectOS →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5"
          style={{ background: "#f8fafc" }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
              <div className="w-18 h-18 w-[72px] h-[72px] rounded-3xl flex items-center justify-center text-3xl"
                style={{
                  background: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))",
                  border: "1px solid rgba(99,102,241,0.15)",
                  boxShadow: "0 4px 20px rgba(99,102,241,0.10)",
                }}>
                🧠
              </div>
              <div>
                <p className="font-bold text-[16px]" style={{ color: "#0f172a", letterSpacing: "-0.01em" }}>
                  Start Brainstorming
                </p>
                <p className="text-[13px] mt-1 leading-relaxed max-w-[300px]" style={{ color: "#6b7280" }}>
                  Describe any idea. The AI will help you develop it and automatically create a structured project in your ProjectOS.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-[340px]">
                {CHIPS.map(chip => (
                  <button key={chip.label} onClick={() => send(chip.text)}
                    className="text-[12px] font-medium px-4 py-2.5 rounded-xl text-left transition-all"
                    style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "#374151", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.30)";
                      (e.currentTarget as HTMLElement).style.background = "#faf5ff";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
                      (e.currentTarget as HTMLElement).style.background = "#fff";
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isLast = i === messages.length - 1;
                const showStreaming = isLast && isStreaming && msg.role === "ai";
                return <Bubble key={msg.id} msg={msg} streaming={showStreaming} />;
              })}

              {/* Generate Project button — appears after 2+ messages */}
              {messages.length >= 2 && !isStreaming && sessionId && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="flex items-center gap-2 w-full max-w-[300px]">
                    <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.07)" }} />
                    <span className="text-[10px] font-medium" style={{ color: "#9ca3af" }}>Ready to build?</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.07)" }} />
                  </div>
                  <button
                    onClick={() => setShowGenerator(true)}
                    className="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-semibold text-[13px] transition-all group"
                    style={{
                      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      color: "#fff",
                      boxShadow: "0 4px 16px rgba(99,102,241,0.30)",
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = "0 6px 22px rgba(99,102,241,0.42)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(99,102,241,0.30)")}
                  >
                    <span className="text-base">🚀</span>
                    Generate Full Project
                    <span className="text-white/70 group-hover:translate-x-0.5 transition-transform">›</span>
                  </button>
                  <p className="text-[10px]" style={{ color: "#9ca3af" }}>
                    Creates folders, files &amp; content from your idea
                  </p>
                </div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3.5 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Describe your idea or project…"
            disabled={isStreaming}
            className="flex-1 text-[13px] px-3.5 py-2.5 rounded-xl outline-none transition-all"
            style={{
              background: "#f1f5f9",
              border: "1.5px solid transparent",
              color: "#0f172a",
            }}
            onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.40)")}
            onBlur={e => ((e.currentTarget as HTMLElement).style.borderColor = "transparent")}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isStreaming}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: input.trim() && !isStreaming ? "#6366f1" : "#e5e7eb",
              color: input.trim() && !isStreaming ? "#fff" : "#9ca3af",
              boxShadow: input.trim() && !isStreaming ? "0 2px 8px rgba(99,102,241,0.30)" : "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>

        {/* Footer hint */}
        <div className="px-4 pb-3 flex-shrink-0 text-center">
          <p className="text-[10px]" style={{ color: "#d1d5db" }}>
            Demo · Outputs are conceptual · Projects & chats saved to database
          </p>
        </div>
      </div>

      {/* Project Generator overlay */}
      {sessionId && (
        <ProjectGenerator
          isOpen={showGenerator}
          sessionId={sessionId}
          onClose={() => setShowGenerator(false)}
          onProjectReady={(proj: GeneratedProject) => {
            setCreatedProjects(prev => [...prev, {
              name: proj.name,
              industry: proj.industry,
              icon: proj.icon,
            }]);
            setShowGenerator(false);
            if (onGoToProjects) onGoToProjects();
          }}
        />
      )}
    </>
  );
}
