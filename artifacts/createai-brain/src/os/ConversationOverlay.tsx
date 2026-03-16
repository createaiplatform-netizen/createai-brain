// ═══════════════════════════════════════════════════════════════════════════
// CONVERSATION OVERLAY v3 — Premium dark-glass AI Brain panel
// Real streaming AI via /api/openai/chat · OutputFormatter rendering
// Draggable · Context-aware · Fully dark-theme · Zero external dependencies
// Safety: never medical/mental-health advice — warm redirect only
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useChatStream, ChatMessage } from "@/hooks/use-chat-stream";
import { useOS } from "./OSContext";
import { OutputFormatter } from "@/components/OutputFormatter";

// ─── Quick-action chips ────────────────────────────────────────────────────
const QUICK_CHIPS = [
  { label: "✨ Create a plan",      text: "Create a detailed roadmap for building a SaaS business from scratch" },
  { label: "🧠 Brainstorm",         text: "Brainstorm 8 creative ideas I haven't thought of yet for my platform" },
  { label: "🧪 Simulate",           text: "Run a business scenario simulation for a healthcare startup" },
  { label: "📣 Ad Packet",          text: "Generate a complete advertising packet for my platform" },
  { label: "📊 Gap Analysis",       text: "Analyze gaps in a typical software product launch plan" },
  { label: "💰 Revenue Ideas",      text: "What are 10 high-ceiling revenue streams for this platform?" },
  { label: "⚡ Optimize",           text: "How can this platform maximize efficiency and minimize friction for users?" },
  { label: "🌐 Next Steps",         text: "What are the smartest next steps to scale this platform to 1 million users?" },
];

// ─── Context labels by app ─────────────────────────────────────────────────
const APP_CONTEXT: Record<string, { label: string; icon: string }> = {
  chat:         { label: "AI Chat",     icon: "💬" },
  projects:     { label: "Projects",    icon: "📁" },
  tools:        { label: "Tools",       icon: "🛠️" },
  creator:      { label: "Creator",     icon: "✨" },
  people:       { label: "People",      icon: "👥" },
  documents:    { label: "Documents",   icon: "📄" },
  marketing:    { label: "Marketing",   icon: "📣" },
  admin:        { label: "Admin",       icon: "⚙️" },
  family:       { label: "Family",      icon: "🏡" },
  integration:  { label: "Integration", icon: "🔌" },
  monetization: { label: "Monetize",   icon: "💰" },
  simulation:   { label: "Simulate",   icon: "🧪" },
  universal:    { label: "Universal",  icon: "🌐" },
};

// ─── Draggable hook ────────────────────────────────────────────────────────
function useDraggable(initialPos: () => { x: number; y: number }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const offset   = useRef({ x: 0, y: 0 });
  const elRef    = useRef<HTMLElement | null>(null);

  useEffect(() => { setPos(initialPos()); }, []);

  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragging.current) return;
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
      const w  = elRef.current?.offsetWidth  ?? 0;
      const h  = elRef.current?.offsetHeight ?? 0;
      setPos({
        x: Math.min(Math.max(0, cx - offset.current.x), window.innerWidth  - w),
        y: Math.min(Math.max(0, cy - offset.current.y), window.innerHeight - h),
      });
    }
    function onUp() { dragging.current = false; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove",  onMove, { passive: true });
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchend",  onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove",  onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchend",  onUp);
    };
  }, []);

  function startDrag(e: React.MouseEvent | React.TouchEvent, el: HTMLElement | null) {
    elRef.current = el;
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    const rect = el?.getBoundingClientRect();
    offset.current = { x: cx - (rect?.left ?? 0), y: cy - (rect?.top ?? 0) };
    dragging.current = true;
  }

  return { pos, startDrag };
}

// ─── Typing dots indicator ─────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm w-fit"
      style={{ background: "rgba(14,18,42,0.90)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "0ms" }} />
      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "150ms" }} />
      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "300ms" }} />
    </div>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────
function MsgBubble({ msg, isStreaming, streamText }: {
  msg: ChatMessage;
  isStreaming?: boolean;
  streamText?: string;
}) {
  const isUser = msg.role === "user";
  const content = isStreaming && streamText ? streamText : msg.content;

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div
          className="max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-[12px] leading-relaxed text-white"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #5457d8 100%)", boxShadow: "0 2px 12px rgba(99,102,241,0.35)" }}
        >
          {msg.content}
          <div className="text-[9px] mt-1 text-white/50 text-right">
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    );
  }

  const hasStructure = /^#{1,3}\s/.test(content) || content.includes("\n-") || content.includes("\n•");

  return (
    <div className="flex items-start gap-2 mb-3">
      {/* Brain avatar */}
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5 font-bold"
        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 0 0 1px rgba(99,102,241,0.30)" }}>
        🧠
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[12px] leading-relaxed"
          style={{ background: "rgba(14,18,42,0.90)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.88)" }}
        >
          {hasStructure
            ? <OutputFormatter content={content} compact />
            : <span className="whitespace-pre-wrap leading-relaxed">{content}</span>
          }
          {isStreaming && (
            <span className="inline-block w-1.5 h-3.5 rounded-sm animate-pulse align-middle ml-0.5"
              style={{ background: "#6366f1", opacity: 0.7 }} />
          )}
          <div className="text-[9px] mt-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ onChip }: { onChip: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-4 text-center">
      {/* Animated brain orb */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{
            background: "linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.20))",
            border: "1px solid rgba(99,102,241,0.30)",
            boxShadow: "0 0 32px rgba(99,102,241,0.25)",
            animation: "floatUp 3s ease-in-out infinite",
          }}>
          🧠
        </div>
        <div className="absolute inset-0 rounded-full"
          style={{ animation: "pulseRing 2.2s ease infinite", boxShadow: "0 0 0 0 rgba(99,102,241,0.4)" }} />
      </div>
      <div>
        <p className="font-bold text-[14px]" style={{ color: "rgba(255,255,255,0.90)", letterSpacing: "-0.01em" }}>
          CreateAI Brain
        </p>
        <p className="text-[11px] mt-1 max-w-[230px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
          Your universal creation intelligence. Ask anything, build anything, simulate anything — safely.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {QUICK_CHIPS.slice(0, 4).map(chip => (
          <button key={chip.label} onClick={() => onChip(chip.text)}
            className="text-[10px] font-medium px-2.5 py-1 rounded-full transition-all"
            style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.22)" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.22)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.12)")}>
            {chip.label}
          </button>
        ))}
      </div>
      <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.20)" }}>
        Demo mode · All outputs are conceptual · Never medical advice
      </p>
    </div>
  );
}

// ─── Main Overlay ──────────────────────────────────────────────────────────
export function ConversationOverlay() {
  const { activeApp } = useOS();
  const { messages, sendMessage, isStreaming, streamingText } = useChatStream();
  const [input,     setInput]     = useState("");
  const [isOpen,    setIsOpen]    = useState(false);
  const [expanded,  setExpanded]  = useState(false);
  const [listening, setListening] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const recognRef  = useRef<any>(null);
  const pillRef    = useRef<HTMLButtonElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  const { pos, startDrag } = useDraggable(() => ({
    x: Math.max(0, window.innerWidth - 380),
    y: 16,
  }));

  const unread = 0;
  const appCtx = activeApp ? APP_CONTEXT[activeApp] : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    setShowChips(false);
    sendMessage(text, activeApp ? APP_CONTEXT[activeApp]?.label : "Main Brain");
  }, [input, isStreaming, sendMessage, activeApp]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleChip = useCallback((text: string) => {
    setShowChips(false);
    sendMessage(text, "Main Brain");
  }, [sendMessage]);

  const toggleListen = useCallback(() => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (listening) { recognRef.current?.stop(); setListening(false); return; }
    const recog: any = new SR();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setListening(false);
      sendMessage(t, "Main Brain");
    };
    recog.onerror = () => setListening(false);
    recog.onend   = () => setListening(false);
    recognRef.current = recog;
    recog.start();
    setListening(true);
  }, [listening, sendMessage]);

  const panelH = expanded ? "h-[80vh] max-h-[720px]" : "h-[460px]";

  if (!pos) return null;

  // ── Collapsed pill ──
  if (!isOpen) {
    return (
      <button
        ref={pillRef}
        onMouseDown={e => startDrag(e, pillRef.current)}
        onTouchStart={e => startDrag(e, pillRef.current)}
        onClick={() => setIsOpen(true)}
        className="fixed z-50 flex items-center gap-2 text-white px-4 py-2.5 rounded-full text-[13px] font-semibold cursor-grab active:cursor-grabbing select-none transition-all"
        style={{
          left: pos.x, top: pos.y,
          background: "linear-gradient(135deg, #6366f1 0%, #5457d8 100%)",
          boxShadow: "0 4px 20px rgba(99,102,241,0.50), 0 1px 0 rgba(255,255,255,0.12) inset",
        }}
        title="Drag to move · Click to open Brain"
      >
        <span className="text-base" style={{ animation: "floatUp 3s ease-in-out infinite" }}>🧠</span>
        <span>Ask the Brain</span>
        {unread > 0 && (
          <span className="rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold"
            style={{ background: "#ef4444" }}>{unread}</span>
        )}
      </button>
    );
  }

  // ── Expanded dark-glass panel ──
  return (
    <div
      ref={panelRef}
      className={`fixed z-50 flex flex-col rounded-2xl overflow-hidden transition-[height] w-[340px] sm:w-[380px] ${panelH}`}
      style={{
        left: pos.x, top: pos.y,
        background: "rgba(7,9,20,0.97)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.70), 0 0 0 1px rgba(99,102,241,0.15)",
        backdropFilter: "blur(40px) saturate(180%)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
        onMouseDown={e => startDrag(e, panelRef.current)}
        onTouchStart={e => startDrag(e, panelRef.current)}
      >
        {/* Brain avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-base font-bold"
            style={{
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              boxShadow: isStreaming
                ? "0 0 0 0 rgba(99,102,241,0.4), 0 0 16px rgba(99,102,241,0.50)"
                : "0 0 8px rgba(99,102,241,0.35)",
              animation: isStreaming ? "avatarGlow 1.5s ease-in-out infinite" : undefined,
            }}>
            🧠
          </div>
          {isStreaming && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center"
              style={{ background: "#22c55e", border: "2px solid rgba(7,9,20,0.97)" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-[13px] leading-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
            CreateAI Brain
          </p>
          <p className="text-[9px] leading-tight" style={{ color: "rgba(255,255,255,0.40)" }}>
            {isStreaming ? "Thinking…" : appCtx ? `Context: ${appCtx.icon} ${appCtx.label}` : "Universal Intelligence Engine"}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setShowChips(s => !s)}
            title="Quick actions"
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] transition-all"
            style={{ color: showChips ? "#a5b4fc" : "rgba(255,255,255,0.40)", background: showChips ? "rgba(99,102,241,0.15)" : "transparent" }}>
            ⚡
          </button>
          <button onClick={() => setExpanded(e => !e)}
            title={expanded ? "Collapse" : "Expand"}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] transition-all hover:opacity-70"
            style={{ color: "rgba(255,255,255,0.40)" }}>
            {expanded ? "⬇" : "⬆"}
          </button>
          <button onClick={() => setIsOpen(false)}
            title="Close"
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[13px] transition-all"
            style={{ color: "rgba(255,255,255,0.40)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.40)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            ×
          </button>
        </div>
      </div>

      {/* ── Quick chips panel ── */}
      {showChips && (
        <div className="px-3 py-2.5 flex-shrink-0 animate-scale-in"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(14,18,42,0.80)" }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>
            Quick prompts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_CHIPS.map(chip => (
              <button key={chip.label} onClick={() => handleChip(chip.text)}
                className="text-[10px] font-medium px-2 py-1 rounded-full transition-all"
                style={{ background: "rgba(99,102,241,0.10)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.18)" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.20)")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.10)")}>
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 && !isStreaming
          ? <EmptyState onChip={handleChip} />
          : (
            <>
              {messages.map((msg, i) => {
                const isLastAssistant = msg.role === "assistant" && i === messages.length - 1 && isStreaming;
                return (
                  <MsgBubble
                    key={msg.id}
                    msg={msg}
                    isStreaming={isLastAssistant}
                    streamText={isLastAssistant ? streamingText : undefined}
                  />
                );
              })}
              {isStreaming && messages[messages.length - 1]?.role === "user" && (
                <div className="ml-8 mb-3">
                  <TypingDots />
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )
        }
      </div>

      {/* ── Safety notice ── */}
      <div className="px-3 py-1.5 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(7,9,20,0.60)" }}>
        <p className="text-[9px] text-center" style={{ color: "rgba(255,255,255,0.18)" }}>
          Demo · Conceptual only · No medical, legal, or financial advice · All outputs for review
        </p>
      </div>

      {/* ── Input bar ── */}
      <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(7,9,20,0.95)" }}>
        <button onClick={toggleListen}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm transition-all"
          style={{
            background: listening ? "rgba(239,68,68,0.20)" : "rgba(255,255,255,0.06)",
            color: listening ? "#f87171" : "rgba(255,255,255,0.45)",
            border: `1px solid ${listening ? "rgba(239,68,68,0.30)" : "rgba(255,255,255,0.08)"}`,
            animation: listening ? "pulseRing 1.5s ease infinite" : undefined,
          }}
          title={listening ? "Stop listening" : "Speak"}>
          🎤
        </button>

        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything — build, create, simulate, plan…"
          disabled={isStreaming}
          className="flex-1 rounded-xl px-3 py-2 text-[12px] outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "rgba(255,255,255,0.88)",
          }}
          onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.45)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 1px rgba(99,102,241,0.20)"; }}
          onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background: input.trim() && !isStreaming
              ? "linear-gradient(135deg,#6366f1,#5457d8)"
              : "rgba(255,255,255,0.07)",
            color: input.trim() && !isStreaming ? "#fff" : "rgba(255,255,255,0.25)",
            boxShadow: input.trim() && !isStreaming ? "0 2px 12px rgba(99,102,241,0.40)" : "none",
          }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
