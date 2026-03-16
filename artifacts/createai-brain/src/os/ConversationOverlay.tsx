// ═══════════════════════════════════════════════════════════════════════════
// CONVERSATION OVERLAY — persistent floating chat panel on every screen
// Supports click, type, and speak (Web Speech API).
// All responses INTERNAL ONLY — mock, demo, non-operational.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useConversation } from "./ConversationContext";
import { useInteraction } from "./InteractionContext";
import {
  MOCK_ROLES, MOCK_AGENCIES, MOCK_STATES, MOCK_VENDORS,
  MOCK_PROGRAMS, MOCK_DEPARTMENTS, InteractionEngine,
} from "@/engine/InteractionEngine";

// ─── Quick-action chips shown as suggestions ──────────────────────────────
const QUICK_CHIPS = [
  { label: "Create a plan",       text: "Create a roadmap for launching a healthcare app" },
  { label: "Brainstorm ideas",    text: "Brainstorm 6 ideas for an AI onboarding workflow" },
  { label: "Generate content",    text: "Write a character description for a sci-fi hero" },
  { label: "Send Invites",        text: "Send invites to my team" },
  { label: "Walk Through",        text: "Walk me through the submission flow" },
  { label: "Test Me",             text: "Test me on workflows" },
  { label: "Help",                text: "help" },
  { label: "My Status",           text: "What's my current status?" },
  { label: "Switch: Admin",       text: "Switch to System Admin" },
  { label: "Switch: Texas",       text: "Set state to Texas" },
  { label: "Go to Dashboard",     text: "Go to Dashboard" },
  { label: "Explain Platform",    text: "What is this platform?" },
];

// ─── Message bubble ───────────────────────────────────────────────────────
function MsgBubble({ role, text, time }: { role: "user" | "system"; text: string; time: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold mr-1.5 mt-0.5 flex-shrink-0">AI</div>
      )}
      <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap shadow-sm
        ${isUser ? "bg-blue-500 text-white rounded-br-sm" : "bg-white border border-border text-foreground rounded-bl-sm"}`}>
        {text}
        <div className={`text-[9px] mt-0.5 ${isUser ? "text-blue-200" : "text-muted-foreground"}`}>
          {new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

// ─── Status bar at top of chat ────────────────────────────────────────────
function SessionBar() {
  const { state } = useInteraction();
  const role   = MOCK_ROLES.find(r => r.id === state.currentRole);
  const agency = MOCK_AGENCIES.find(a => a.id === state.currentAgency);
  return (
    <div className="bg-blue-50 border-b border-blue-100 px-3 py-1.5 flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-semibold text-blue-700">{role?.icon} {role?.label ?? state.currentRole}</span>
      <span className="text-[9px] text-blue-400">·</span>
      <span className="text-[10px] text-blue-600">{agency?.abbrev ?? state.currentAgency}</span>
      <span className="text-[9px] text-blue-400">·</span>
      <span className="text-[10px] text-blue-600">🗺️ {state.currentState}</span>
      <span className="ml-auto text-[9px] text-blue-400 italic">demo-only</span>
    </div>
  );
}

// ─── Drag hook ────────────────────────────────────────────────────────────
function useDraggable(initialPos: () => { x: number; y: number }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const offset   = useRef({ x: 0, y: 0 });
  const elRef    = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setPos(initialPos());
  }, []);

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

// ─── Main Overlay ─────────────────────────────────────────────────────────
export function ConversationOverlay() {
  const { history, testSession, isOpen, isExpanded, unread, setOpen, setExpanded, send, clear } = useConversation();
  const [input,     setInput]     = useState("");
  const [listening, setListening] = useState(false);
  const [typing,    setTyping]    = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const recognRef   = useRef<any>(null);
  const pillRef     = useRef<HTMLButtonElement>(null);
  const panelRef    = useRef<HTMLDivElement>(null);

  const { pos, startDrag } = useDraggable(() => ({
    x: Math.max(0, window.innerWidth - 400),
    y: 16,
  }));

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setTyping(true);
    send(text);
    setTimeout(() => setTyping(false), 600);
  }, [input, send]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleChip = useCallback((text: string) => {
    send(text);
  }, [send]);

  // Speech recognition
  const toggleListen = useCallback(() => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported in this browser."); return; }

    if (listening) {
      recognRef.current?.stop();
      setListening(false);
      return;
    }

    const recog: any = new SR();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      setTimeout(() => { send(transcript); setInput(""); }, 300);
    };
    recog.onerror = () => setListening(false);
    recog.onend   = () => setListening(false);
    recognRef.current = recog;
    recog.start();
    setListening(true);
  }, [listening, send]);

  const panelH = isExpanded ? "h-[80vh] max-h-[700px]" : "h-[420px]";

  if (!pos) return null;

  // ── Collapsed state: floating draggable pill button ──
  if (!isOpen) {
    return (
      <button
        ref={pillRef}
        onMouseDown={e => startDrag(e, pillRef.current)}
        onTouchStart={e => startDrag(e, pillRef.current)}
        onClick={() => setOpen(true)}
        className="fixed z-50 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-full shadow-lg text-[13px] font-semibold cursor-grab active:cursor-grabbing select-none"
        style={{ left: pos.x, top: pos.y }}
        title="Drag to move · Click to open Brain"
      >
        <span className="text-base">🧠</span>
        <span>Ask the Brain</span>
        {unread > 0 && (
          <span className="bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{unread}</span>
        )}
      </button>
    );
  }

  // ── Expanded chat panel ──
  return (
    <div
      ref={panelRef}
      className={`fixed z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-border overflow-hidden transition-[height] w-[340px] sm:w-[380px] ${panelH}`}
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Header — drag handle */}
      <div
        className="bg-blue-500 px-3 py-2.5 flex items-center gap-2 flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={e => startDrag(e, panelRef.current)}
        onTouchStart={e => startDrag(e, panelRef.current)}
        title="Drag to move"
      >
        <span className="text-base">🧠</span>
        <div className="flex-1">
          <p className="text-[13px] font-bold text-white leading-tight">CreateAI Brain</p>
          <p className="text-[9px] text-blue-200">Universal Interaction Engine · Demo Only</p>
        </div>
        {testSession.isActive && (
          <div className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Quiz {testSession.currentIndex + 1}/{testSession.questions.length} · {testSession.score}pts
          </div>
        )}
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(!isExpanded)} className="text-white/70 hover:text-white text-[14px] px-1" title={isExpanded ? "Collapse" : "Expand"}>
            {isExpanded ? "⬇" : "⬆"}
          </button>
          <button onClick={clear} className="text-white/70 hover:text-white text-[12px] px-1" title="Clear history">🗑</button>
          <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-[16px] px-1" title="Close">×</button>
        </div>
      </div>

      {/* Session context bar */}
      <SessionBar />

      {/* Quick-action chips (shown only when history is empty or short) */}
      {history.length < 4 && (
        <div className="px-2 pt-2 flex flex-wrap gap-1.5 flex-shrink-0">
          {QUICK_CHIPS.slice(0, 6).map(chip => (
            <button key={chip.label} onClick={() => handleChip(chip.text)}
              className="text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-2 py-1 rounded-full transition-all">
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <span className="text-4xl">🧠</span>
            <p className="text-[13px] font-semibold text-foreground">CreateAI Brain — UCP-X v2</p>
            <p className="text-[11px] text-muted-foreground max-w-[240px]">
              Type <em>anything</em> — I respond instantly. Create plans, generate content, switch roles, navigate screens, run walk-throughs, or ask any question.
            </p>
            <p className="text-[10px] text-blue-500 font-medium mt-0.5">I never ignore a message.</p>
            <p className="text-[9px] text-muted-foreground italic">All internal · fictional · demo-only</p>
          </div>
        ) : (
          <>
            {history.map(msg => (
              <MsgBubble key={msg.id} role={msg.role} text={msg.text} time={msg.timestamp} />
            ))}
            {typing && (
              <div className="flex justify-start mb-2">
                <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-3 py-2 text-[12px] text-muted-foreground">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Quick chips row 2 (always visible) */}
      <div className="px-2 pb-1 flex flex-wrap gap-1 flex-shrink-0">
        {QUICK_CHIPS.slice(6).map(chip => (
          <button key={chip.label} onClick={() => handleChip(chip.text)}
            className="text-[9px] font-medium bg-muted text-muted-foreground hover:bg-blue-50 hover:text-blue-600 px-1.5 py-0.5 rounded-full transition-all">
            {chip.label}
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="px-3 py-1 flex-shrink-0">
        <p className="text-[8px] text-muted-foreground text-center">
          DEMO ONLY · No clinical/legal/financial guidance · All responses fictional & non-operational
        </p>
      </div>

      {/* Input bar */}
      <div className="border-t border-border px-2 py-2 flex items-center gap-1.5 flex-shrink-0 bg-white">
        <button
          onClick={toggleListen}
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all text-sm
            ${listening ? "bg-red-500 text-white animate-pulse" : "bg-muted text-muted-foreground hover:bg-blue-50 hover:text-blue-500"}`}
          title={listening ? "Stop listening" : "Speak"}
        >
          🎤
        </button>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={testSession.isActive && testSession.awaitingAnswer ? "Type A, B, C, D or your answer…" : "Type or speak anything…"}
          className="flex-1 bg-muted rounded-xl px-3 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center text-white flex-shrink-0 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
