import React, { useState, useEffect, useRef } from "react";
import { Send, ChevronDown, Sparkles, Zap, Plus } from "lucide-react";
import { useChatStream } from "@/hooks/use-chat-stream";
import { ChatBubble } from "@/components/chat-bubble";
import { TypingIndicator } from "@/components/typing-indicator";
import { SaveToProjectModal } from "@/components/SaveToProjectModal";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useOS } from "@/os/OSContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Built-in workspaces (always present) ──────────────────────────────────
const BUILT_IN_WORKSPACES = [
  {
    id: "main-brain",
    name: "Main Brain",
    emoji: "🧠",
    description: "Universal creative intelligence. Build anything, plan anything, invent anything — all domains, zero limits.",
    isBuiltIn: true,
  },
  {
    id: "grants-explorer",
    name: "Grants & Funding Explorer",
    emoji: "💰",
    description: "Explore grant ideas, funding concepts, narratives, and strategies.",
    isBuiltIn: true,
  },
  {
    id: "business-ops",
    name: "Business & Operations Builder",
    emoji: "🏗️",
    description: "Structure your operations, teams, workflows, and systems.",
    isBuiltIn: true,
  },
  {
    id: "marketing-studio",
    name: "Marketing & Storytelling Studio",
    emoji: "🎯",
    description: "Craft brand narratives, campaigns, messaging frameworks, and content.",
    isBuiltIn: true,
  },
  {
    id: "legal-contracts",
    name: "Legal & Contracts Studio",
    emoji: "⚖️",
    description: "Draft agreements, policies, terms, and compliance frameworks. Conceptual only — always verify with a licensed attorney.",
    isBuiltIn: true,
  },
  {
    id: "creative-lab",
    name: "Creative Writing Lab",
    emoji: "✍️",
    description: "Write stories, scripts, pitches, bios, speeches, and creative copy.",
    isBuiltIn: true,
  },
];

const BUILT_IN_SUGGESTIONS: Record<string, string[]> = {
  "main-brain": [
    "Build a complete SaaS product plan from scratch",
    "Invent a new business model for the creator economy",
    "Design a 90-day launch strategy for a new platform",
    "Create a full org structure for a remote-first startup",
  ],
  "grants-explorer": [
    "Find grant ideas for a community health nonprofit",
    "Draft a federal funding narrative for workforce development",
    "Map out a multi-grant strategy for a startup",
  ],
  "business-ops": [
    "Design the complete operations structure for my company",
    "Map out a customer onboarding workflow end to end",
    "Create an employee handbook outline",
  ],
  "marketing-studio": [
    "Build a 30-day social media content calendar",
    "Write a complete brand kit for my business",
    "Create a 5-email launch campaign from scratch",
  ],
  "legal-contracts": [
    "Draft a freelance contractor agreement template",
    "Create a Privacy Policy for a SaaS platform",
    "Write a standard Terms of Service document",
    "Generate an NDA for a new partnership",
  ],
  "creative-lab": [
    "Write a cinematic short story about a future AI city",
    "Draft a motivational keynote speech for a founder event",
    "Create a compelling founder bio for my website",
    "Write a film pitch for a docu-series concept I have",
  ],
};

const DEFAULT_SUGGESTIONS = [
  "What can you help me build today?",
  "Create a complete business plan for my idea",
  "Design a product launch strategy",
  "Write a professional proposal document",
];

interface Workspace {
  id: string;
  name: string;
  emoji: string;
  description: string;
  isBuiltIn?: boolean;
  isProject?: boolean;
}

function ChatEmptyState({
  workspace,
  onSuggest,
}: {
  workspace: Workspace;
  onSuggest: (text: string) => void;
}) {
  const suggestions = BUILT_IN_SUGGESTIONS[workspace.id] ?? DEFAULT_SUGGESTIONS;

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
          {workspace.emoji}
        </div>
        <div className="absolute inset-0 rounded-3xl animate-pulse-ring pointer-events-none" style={{ borderRadius: "1.5rem" }} />
      </div>

      <div className="space-y-2 max-w-sm">
        <p className="font-bold text-[18px] text-foreground gradient-text" style={{ letterSpacing: "-0.02em" }}>
          {workspace.name}
        </p>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          {workspace.description}
        </p>
        {workspace.isProject && (
          <p className="text-[11px] px-3 py-1 rounded-full inline-block" style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>
            Your Project
          </p>
        )}
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
  const { openApp } = useOS();
  const [workspaces, setWorkspaces] = useState<Workspace[]>(BUILT_IN_WORKSPACES);
  const [selectedId, setSelectedId] = useState<string>(BUILT_IN_WORKSPACES[0].id);
  const [showPicker, setShowPicker] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [saveModal, setSaveModal] = useState<{ content: string; label: string } | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentWorkspace = workspaces.find(w => w.id === selectedId) ?? workspaces[0];

  const { messages, sendMessage, isStreaming, streamingText } = useChatStream();

  useEffect(() => {
    fetch("/api/projects", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.projects?.length) {
          const projectWorkspaces: Workspace[] = d.projects.map((p: { id: string; name: string; icon: string; description?: string; industry?: string }) => ({
            id: `project-${p.id}`,
            name: p.name,
            emoji: p.icon ?? "📁",
            description: p.description || `Your ${p.industry || "General"} project workspace`,
            isProject: true,
          }));
          setWorkspaces([...BUILT_IN_WORKSPACES, ...projectWorkspaces]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProjects(false));
  }, []);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;
    sendMessage(inputMessage.trim(), currentWorkspace.name);
    setInputMessage("");
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleSuggest = (text: string) => {
    sendMessage(text, currentWorkspace.name);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  return (
    <div className="flex flex-col h-full">
      {/* Workspace switcher bar */}
      <div
        className="flex-none relative flex items-center justify-center py-2 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(8,10,22,0.60)", backdropFilter: "blur(20px)" }}
      >
        <button
          onClick={() => setShowPicker(p => !p)}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-white/5 active:bg-white/8 transition-colors group"
        >
          <span className="text-base">{currentWorkspace.emoji}</span>
          <span className="font-semibold text-[14px] tracking-tight text-foreground">{currentWorkspace.name}</span>
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
                maxHeight: "min(540px, 75vh)",
              }}
            >
              <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <p className="section-label">Choose Workspace</p>
              </div>

              <div className="overflow-y-auto flex-1 overscroll-contain" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(99,102,241,0.3) transparent" }}>
                {/* Built-in workspaces */}
                <div className="px-3 pt-2 pb-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest px-1 mb-1" style={{ color: "#64748b" }}>Built-in Workspaces</p>
                </div>
                {workspaces.filter(w => w.isBuiltIn).map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => { setSelectedId(ws.id); setShowPicker(false); }}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                      selectedId === ws.id ? "bg-primary/8" : "hover:bg-white/4"
                    )}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{ws.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-[13px] font-semibold leading-tight", selectedId === ws.id ? "text-primary" : "text-foreground")}>
                        {ws.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{ws.description}</p>
                    </div>
                    {selectedId === ws.id && <span className="text-primary text-xs font-bold flex-shrink-0 mt-0.5">✓</span>}
                  </button>
                ))}

                {/* User's real projects */}
                {workspaces.filter(w => w.isProject).length > 0 && (
                  <>
                    <div className="px-3 pt-3 pb-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <p className="text-[9px] font-bold uppercase tracking-widest px-1 mb-1" style={{ color: "#64748b" }}>Your Projects</p>
                    </div>
                    {workspaces.filter(w => w.isProject).map(ws => (
                      <button
                        key={ws.id}
                        onClick={() => { setSelectedId(ws.id); setShowPicker(false); }}
                        className={cn(
                          "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                          selectedId === ws.id ? "bg-primary/8" : "hover:bg-white/4"
                        )}
                      >
                        <span className="text-xl flex-shrink-0 mt-0.5">{ws.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-[13px] font-semibold leading-tight", selectedId === ws.id ? "text-primary" : "text-foreground")}>
                            {ws.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{ws.description}</p>
                        </div>
                        {selectedId === ws.id && <span className="text-primary text-xs font-bold flex-shrink-0 mt-0.5">✓</span>}
                      </button>
                    ))}
                  </>
                )}

                {/* Create new project link */}
                <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <button
                    onClick={() => { setShowPicker(false); openApp("projos"); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create a new project
                  </button>
                </div>
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
              workspace={currentWorkspace}
              onSuggest={handleSuggest}
            />
          )}
          {messages.map(msg => (
            <div key={msg.id}>
              <ChatBubble role={msg.role as "user" | "assistant" | "system"} content={msg.content} />
              {msg.role === "assistant" && msg.content && (
                <div className="flex justify-start ml-10 -mt-1 mb-2">
                  <button
                    onClick={() => setSaveModal({ content: msg.content, label: `${currentWorkspace.name} — AI Response` })}
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
            <span className="text-base mr-2 flex-shrink-0">{currentWorkspace.emoji}</span>
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder={`Message ${currentWorkspace.name}...`}
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
            All responses are structured with sections &amp; smart next steps
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
