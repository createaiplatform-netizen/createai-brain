import React, { useState, useEffect, useRef } from "react";
import { Send, ChevronDown, Sparkles, Zap } from "lucide-react";
import { useChatStream } from "@/hooks/use-chat-stream";
import { ChatBubble } from "@/components/chat-bubble";
import { TypingIndicator } from "@/components/typing-indicator";
import { SaveToProjectModal } from "@/components/SaveToProjectModal";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PROJECTS = [
  {
    name: "Main Brain",
    emoji: "🧠",
    description: "Universal creative intelligence. Build anything, plan anything, invent anything — all domains, zero limits.",
  },
  {
    name: "Healthcare Demo",
    emoji: "🏥",
    description: "ApexCare Nexus — simulation only, non-clinical demo mode. Explore how a future healthcare platform could work.",
  },
  {
    name: "Grants & Funding Explorer",
    emoji: "💰",
    description: "Explore grant ideas, funding concepts, narratives, and strategies. Simulation only.",
  },
  {
    name: "Business & Operations Builder",
    emoji: "🏗️",
    description: "Structure your operations, teams, workflows, and systems. Conceptual mode — bring any idea.",
  },
  {
    name: "Marketing & Storytelling Studio",
    emoji: "🎯",
    description: "Craft brand narratives, campaigns, messaging frameworks, and content. Ideation mode.",
  },
  {
    name: "CreateAI Messaging Hub",
    emoji: "✉️",
    description: "Generate professional emails and texts. Easy Mode: sent via your own device.",
  },
  {
    name: "Product & Launch Pad",
    emoji: "🚀",
    description: "Design products, plan launches, build roadmaps, and structure go-to-market strategies. Concept mode.",
  },
  {
    name: "Legal & Contracts Studio",
    emoji: "⚖️",
    description: "Draft agreements, policies, terms, and compliance frameworks. Conceptual only — always verify with a licensed attorney.",
  },
  {
    name: "Creative Writing Lab",
    emoji: "✍️",
    description: "Write stories, scripts, pitches, bios, speeches, and creative copy. Full creative freedom with zero limits.",
  },
];

const PROJECT_SUGGESTIONS: Record<number, string[]> = {
  0: [
    "Build a complete SaaS product plan from scratch",
    "Invent a new business model for the creator economy",
    "Design a 90-day launch strategy for a new platform",
    "Create a full org structure for a remote-first startup",
  ],
  1: [
    "Walk me through the demo patient intake flow",
    "Design a mock care coordination dashboard",
    "What does a future care planning system look like?",
  ],
  2: [
    "Find grant ideas for a community health nonprofit",
    "Draft a federal funding narrative for workforce development",
    "Map out a multi-grant strategy for a startup",
  ],
  3: [
    "Design the complete operations structure for my company",
    "Map out a customer onboarding workflow end to end",
    "Create an employee handbook outline",
  ],
  4: [
    "Build a 30-day social media content calendar",
    "Write a complete brand kit for my business",
    "Create a 5-email launch campaign from scratch",
  ],
  5: [
    "Draft a professional re-engagement email sequence",
    "Write a cold outreach sequence for enterprise sales",
    "Generate an automated nurture flow — 7 messages",
  ],
  6: [
    "Design a complete product roadmap for my SaaS startup",
    "Build a full go-to-market strategy with phases and KPIs",
    "Create a product requirements document from scratch",
    "Map out a pre-launch checklist for a digital product",
  ],
  7: [
    "Draft a freelance contractor agreement template",
    "Create a Privacy Policy for a SaaS platform",
    "Write a standard Terms of Service document",
    "Generate an NDA for a new partnership",
  ],
  8: [
    "Write a cinematic short story about a future AI city",
    "Draft a motivational keynote speech for a founder event",
    "Create a compelling founder bio for my website",
    "Write a film pitch for a docu-series concept I have",
  ],
};

function ChatEmptyState({
  project,
  projectIndex,
  onSuggest,
}: {
  project: typeof PROJECTS[0];
  projectIndex: number;
  onSuggest: (text: string) => void;
}) {
  const suggestions = PROJECT_SUGGESTIONS[projectIndex] ?? PROJECT_SUGGESTIONS[0];

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 py-12 text-center animate-fade-up px-4">
      <div className="relative">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl animate-float"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.18) 100%)",
            border: "1px solid rgba(99,102,241,0.28)",
            boxShadow: "0 0 40px rgba(99,102,241,0.12)",
          }}
        >
          {project.emoji}
        </div>
        <div
          className="absolute inset-0 rounded-3xl animate-pulse-ring pointer-events-none"
          style={{ borderRadius: "1.5rem" }}
        />
      </div>

      <div className="space-y-2 max-w-sm">
        <p className="font-bold text-[18px] text-foreground gradient-text" style={{ letterSpacing: "-0.02em" }}>
          {project.name}
        </p>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          {project.description}
        </p>
      </div>

      <div className="w-full max-w-md space-y-2.5">
        <p className="section-label text-center mb-3">Start with a prompt</p>
        {suggestions.map((s, i) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className={cn(
              "w-full text-left px-4 py-3 rounded-2xl text-[13px] font-medium transition-all duration-200 card-interactive animate-fade-up",
              `delay-${(i + 1) * 100}`
            )}
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

      <div
        className="mt-2 px-4 py-2.5 rounded-xl text-[11px] text-muted-foreground flex items-center gap-2 animate-fade-up delay-500"
        style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}
      >
        <Zap className="w-3 h-3 text-primary flex-shrink-0" />
        All responses are structured with headings, sections, and smart next steps
      </div>
    </div>
  );
}

export function ChatApp() {
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [saveModal, setSaveModal] = useState<{ content: string; label: string } | null>(null);

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
    sendMessage(inputMessage.trim(), currentProject.name);
    setInputMessage("");
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleSuggest = (text: string) => {
    sendMessage(text, currentProject.name);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  return (
    <div className="flex flex-col h-full">
      {/* Project switcher bar */}
      <div
        className="flex-none relative flex items-center justify-center py-2 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(8,10,22,0.60)", backdropFilter: "blur(20px)" }}
      >
        <button
          onClick={() => setShowPicker(p => !p)}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-white/5 active:bg-white/8 transition-colors group"
        >
          <span className="text-base">{currentProject.emoji}</span>
          <span className="font-semibold text-[14px] tracking-tight text-foreground">{currentProject.name}</span>
          <ChevronDown className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-all duration-200",
            showPicker ? "rotate-180 text-primary" : "group-hover:text-foreground"
          )} />
        </button>

        {showPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-20 w-80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              style={{
                background: "rgba(10,12,30,0.96)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(40px)",
                maxHeight: "min(520px, 70vh)",
              }}
            >
              <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <p className="section-label">Choose Workspace</p>
              </div>
              <div className="overflow-y-auto flex-1 overscroll-contain" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(99,102,241,0.3) transparent" }}>
              {PROJECTS.map((proj, i) => (
                <button
                  key={proj.name}
                  onClick={() => selectProject(i)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                    i === currentProjectIndex ? "bg-primary/8" : "hover:bg-white/4"
                  )}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{proj.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[13px] font-semibold leading-tight",
                      i === currentProjectIndex ? "text-primary" : "text-foreground"
                    )}>
                      {proj.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{proj.description}</p>
                  </div>
                  {i === currentProjectIndex && (
                    <span className="text-primary text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                  )}
                </button>
              ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 pb-2 scroll-smooth">
        <div className="flex flex-col justify-end min-h-full max-w-3xl mx-auto">
          {messages.length === 0 && (
            <ChatEmptyState
              project={currentProject}
              projectIndex={currentProjectIndex}
              onSuggest={handleSuggest}
            />
          )}
          {messages.map(msg => (
            <div key={msg.id}>
              <ChatBubble role={msg.role as "user" | "assistant" | "system"} content={msg.content} />
              {msg.role === "assistant" && msg.content && (
                <div className="flex justify-start ml-10 -mt-1 mb-2">
                  <button
                    onClick={() => setSaveModal({ content: msg.content, label: `${currentProject.name} — AI Response` })}
                    className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-colors"
                    style={{ background: "rgba(99,102,241,0.10)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.18)" }}
                  >
                    💾 Save to Project
                  </button>
                </div>
              )}
            </div>
          ))}
          {isStreaming && streamingText && (
            <ChatBubble role="assistant" content={streamingText} isStreaming />
          )}
          {isStreaming && !streamingText && <TypingIndicator />}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </main>

      {/* Input */}
      <footer
        className="flex-none p-3 border-t"
        style={{ background: "rgba(8,10,22,0.92)", borderColor: "rgba(255,255,255,0.07)", backdropFilter: "blur(32px)" }}
      >
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSend}
            className="relative flex items-center w-full rounded-2xl pl-4 pr-1.5 py-1.5 input-premium transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <span className="text-base mr-2 flex-shrink-0">{currentProject.emoji}</span>
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder={`Message ${currentProject.name}...`}
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
              style={
                inputMessage.trim() && !isStreaming
                  ? { boxShadow: "0 2px 10px rgba(99,102,241,0.40)" }
                  : { background: "rgba(255,255,255,0.06)" }
              }
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
          <p className="text-center text-[10px] text-muted-foreground/60 mt-1.5">
            Responses are structured with sections &amp; smart next steps · Demo mode
          </p>
        </div>
      </footer>

      {saveModal && (
        <SaveToProjectModal
          content={saveModal.content}
          label={saveModal.label}
          defaultFileType="Document"
          onClose={() => setSaveModal(null)}
        />
      )}
    </div>
  );
}
