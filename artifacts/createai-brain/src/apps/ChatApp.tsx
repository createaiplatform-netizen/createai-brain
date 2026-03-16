import React, { useState, useEffect, useRef, useMemo } from "react";
import { Send, ChevronDown, Sparkles } from "lucide-react";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useGetOpenaiConversation,
} from "@workspace/api-client-react";
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

export function ChatApp() {
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [localSystemMessages, setLocalSystemMessages] = useState<Record<number, { id: number; content: string }[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentProject = PROJECTS[currentProjectIndex];

  const { data: conversations, refetch: refetchConversations } = useListOpenaiConversations();
  const createConvMutation = useCreateOpenaiConversation();
  const { data: activeConversation, isLoading: isLoadingMessages } = useGetOpenaiConversation(
    activeConversationId as number,
    { query: { enabled: !!activeConversationId } }
  );
  const { sendMessage, isStreaming, streamingText } = useChatStream(activeConversationId);

  useEffect(() => {
    if (!conversations) return;
    const existingConv = conversations.find(c => c.title === currentProject.name);
    if (existingConv) {
      setActiveConversationId(existingConv.id);
      addLocalSystemMessage(existingConv.id, `Switched to: ${currentProject.name} — ${currentProject.description}`);
    } else {
      createConvMutation.mutate(
        { data: { title: currentProject.name } },
        {
          onSuccess: (newConv) => {
            setActiveConversationId(newConv.id);
            refetchConversations();
            addLocalSystemMessage(newConv.id, `Switched to: ${currentProject.name} — ${currentProject.description}`);
          },
        }
      );
    }
  }, [currentProject.name, conversations?.length]);

  const addLocalSystemMessage = (convId: number, content: string) => {
    setLocalSystemMessages(prev => {
      const existing = prev[convId] || [];
      if (existing.length > 0 && existing[existing.length - 1].content === content) return prev;
      return { ...prev, [convId]: [...existing, { id: Date.now(), content }] };
    });
  };

  const selectProject = (index: number) => {
    setCurrentProjectIndex(index);
    setShowPicker(false);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isStreaming || !activeConversationId) return;
    sendMessage(inputMessage.trim());
    setInputMessage("");
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, streamingText, localSystemMessages, activeConversationId]);

  const renderMessages = useMemo(() => {
    if (!activeConversation) return [];
    const dbMessages = activeConversation.messages.map(m => ({ ...m, type: "db" }));
    const sysMessages = (localSystemMessages[activeConversationId as number] || []).map(m => ({
      id: m.id, role: "system" as const, content: m.content,
      createdAt: new Date(m.id).toISOString(), type: "system",
    }));
    return [...dbMessages, ...sysMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [activeConversation, localSystemMessages, activeConversationId]);

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
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Switch Brain Context</p>
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
        {isLoadingMessages && !activeConversation ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full" />
              <div className="w-24 h-3 bg-muted rounded-full" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-end min-h-full">
            {renderMessages.map(msg => (
              <ChatBubble key={`${msg.type}-${msg.id}`} role={msg.role as any} content={msg.content} />
            ))}
            {isStreaming && streamingText && <ChatBubble role="assistant" content={streamingText} isStreaming />}
            {isStreaming && !streamingText && <TypingIndicator />}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        )}
      </main>

      {/* Input */}
      <footer className="flex-none p-3 bg-background/80 backdrop-blur-xl border-t border-border/50">
        <form
          onSubmit={handleSend}
          className="relative flex items-center w-full bg-muted/50 border border-border/50 rounded-full pl-4 pr-1.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            placeholder="Message CreateAI Brain..."
            className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-muted-foreground py-1.5"
            disabled={isStreaming || !activeConversationId}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isStreaming || !activeConversationId}
            className={cn(
              "ml-2 w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0",
              inputMessage.trim() && !isStreaming
                ? "bg-primary text-primary-foreground shadow-sm hover:scale-105 active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
