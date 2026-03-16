import React, { useState, useEffect, useRef } from "react";
import { Send, ChevronDown, Sparkles } from "lucide-react";
import { useChatStream } from "@/hooks/use-chat-stream";
import { ChatBubble } from "@/components/chat-bubble";
import { TypingIndicator } from "@/components/typing-indicator";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PROJECTS = [
  { name: "Main Brain", description: "Your core CreateAI Brain is active. All engines and 30 series loaded." },
  { name: "Healthcare Demo", description: "ApexCare Nexus — simulation only, non-clinical demo mode loaded." },
  { name: "Grants & Funding Explorer", description: "Explore grant ideas, funding concepts, and narratives. Simulation only." },
  { name: "Business & Operations Builder", description: "Structure your operations, roles, and workflows. Conceptual mode." },
  { name: "Marketing & Storytelling Studio", description: "Craft your brand narratives, campaigns, and messaging. Ideation mode." },
  { name: "CreateAI Messaging Hub", description: "Generate professional emails and texts. Easy Mode: sent via your own device." },
];

const PROJECT_SUGGESTIONS: Record<number, string[]> = {
  0: ["What can you help me create today?", "Give me a 7-day content plan", "Write an email sequence for my audience"],
  1: ["Walk me through the demo patient flow", "What safety disclaimers apply here?", "Summarize the mock appointments"],
  2: ["Find grant ideas for a healthcare nonprofit", "What federal funding applies to home care?", "Draft a grant narrative outline"],
  3: ["Map out my team roles and responsibilities", "Create an onboarding checklist", "Draft a weekly standup template"],
  4: ["Write a brand story for my business", "Create 5 subject lines for an email campaign", "Build a 30-day social content calendar"],
  5: ["Draft a professional follow-up email", "Write a friendly re-engagement text", "Generate an outreach sequence — 3 emails"],
};

function ChatEmptyState({
  project,
  onSuggest,
}: {
  project: { name: string; description: string };
  onSuggest: (text: string) => void;
}) {
  const idx = PROJECTS.findIndex(p => p.name === project.name);
  const suggestions = PROJECT_SUGGESTIONS[idx] ?? PROJECT_SUGGESTIONS[0];

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-5 py-14 text-center animate-fade-up px-4">
      <div className="relative">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl animate-float"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.20) 0%, rgba(139,92,246,0.20) 100%)",
            border: "1px solid rgba(99,102,241,0.25)",
            boxShadow: "0 0 0 0 rgba(99,102,241,0.4)",
          }}
        >
          🧠
        </div>
        <div
          className="absolute inset-0 rounded-2xl animate-pulse-ring pointer-events-none"
          style={{ borderRadius: "1rem" }}
        />
      </div>

      <div className="space-y-1.5 max-w-xs">
        <p className="font-bold text-[16px] text-foreground" style={{ letterSpacing: "-0.02em" }}>
          {project.name}
        </p>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          {project.description}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-2">
        <p className="section-label text-center mb-2.5">Try asking</p>
        {suggestions.map((s, i) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className={`w-full text-left px-4 py-3 rounded-2xl text-[13px] font-medium transition-all duration-200 animate-fade-up delay-${(i + 1) * 100} card-interactive`}
            style={{
              background: "rgba(14,18,42,0.70)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.80)",
            }}
          >
            <span className="text-primary mr-2">↗</span>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatApp() {
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [inputMessage, setInputMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentProject = PROJECTS[currentProjectIndex];

  const { messages, sendMessage, isStreaming, streamingText } = useChatStream();

  const selectProject = (index: number) => {
    setCurrentProjectIndex(index);
    setShowPicker(false);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;
    sendMessage(inputMessage.trim());
    setInputMessage("");
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  return (
    <div className="flex flex-col h-full">
      {/* Project switcher bar */}
      <div className="flex-none relative flex items-center justify-center py-2 border-b border-border/30 bg-background/50">
        <button
          onClick={() => setShowPicker(p => !p)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:bg-muted active:bg-muted/80 transition-colors group"
        >
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="font-semibold text-[14px] tracking-tight text-foreground">{currentProject.name}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-all ${showPicker ? "rotate-180 text-primary" : "group-hover:text-foreground"}`} />
        </button>

        {showPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-20 w-72 bg-background border border-border/50 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-border/30">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Choose Your Workspace</p>
              </div>
              {PROJECTS.map((proj, i) => (
                <button key={proj.name} onClick={() => selectProject(i)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors ${i === currentProjectIndex ? "bg-primary/5" : ""}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === currentProjectIndex ? "bg-primary" : "bg-muted-foreground/30"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold leading-tight ${i === currentProjectIndex ? "text-primary" : "text-foreground"}`}>{proj.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{proj.description}</p>
                  </div>
                  {i === currentProjectIndex && <span className="text-primary text-xs font-bold flex-shrink-0 mt-0.5">✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 pb-2 scroll-smooth">
        <div className="flex flex-col justify-end min-h-full">
          {messages.length === 0 && (
            <ChatEmptyState
              project={currentProject}
              onSuggest={text => { sendMessage(text); }}
            />
          )}
          {messages.map(msg => (
            <ChatBubble key={msg.id} role={msg.role as any} content={msg.content} />
          ))}
          {isStreaming && streamingText && <ChatBubble role="assistant" content={streamingText} isStreaming />}
          {isStreaming && !streamingText && <TypingIndicator />}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </main>

      {/* Input */}
      <footer className="flex-none p-3 border-t" style={{ background: "rgba(8,10,22,0.88)", borderColor: "rgba(255,255,255,0.07)", backdropFilter: "blur(32px)" }}>
        <form onSubmit={handleSend} className="relative flex items-center w-full rounded-full pl-4 pr-1.5 py-1.5 input-premium transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            placeholder="Message CreateAI Brain..."
            className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-muted-foreground py-1.5"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isStreaming}
            className={cn(
              "ml-2 w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0",
              inputMessage.trim() && !isStreaming
                ? "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
                : "text-muted-foreground cursor-not-allowed"
            )}
            style={inputMessage.trim() && !isStreaming ? { boxShadow: "0 2px 10px rgba(99,102,241,0.40)" } : { background: "rgba(255,255,255,0.06)" }}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
