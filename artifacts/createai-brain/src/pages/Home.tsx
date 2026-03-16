import React, { useState, useEffect, useRef, useMemo } from "react";
import { Send, ChevronDown, Sparkles } from "lucide-react";
import { 
  useListOpenaiConversations, 
  useCreateOpenaiConversation, 
  useGetOpenaiConversation 
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
  { name: "Main Brain", description: "Your core CreateAI Brain is active." },
  { name: "Healthcare Demo", description: "ApexCare Nexus — demo mode loaded." },
  { name: "New Project", description: "This is a placeholder project you can rename later." }
];

export default function Home() {
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [inputMessage, setInputMessage] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [localSystemMessages, setLocalSystemMessages] = useState<Record<number, {id: number, content: string}[]>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentProject = PROJECTS[currentProjectIndex];

  // Queries & Mutations
  const { data: conversations, refetch: refetchConversations } = useListOpenaiConversations();
  const createConvMutation = useCreateOpenaiConversation();
  
  const { data: activeConversation, isLoading: isLoadingMessages } = useGetOpenaiConversation(
    activeConversationId as number,
    { query: { enabled: !!activeConversationId } }
  );

  const { sendMessage, isStreaming, streamingText } = useChatStream(activeConversationId);

  // Logic to handle project switching and conversation mapping
  useEffect(() => {
    if (!conversations) return;

    const existingConv = conversations.find(c => c.title === currentProject.name);
    
    if (existingConv) {
      setActiveConversationId(existingConv.id);
      addLocalSystemMessage(existingConv.id, `Switched to: ${currentProject.name} — ${currentProject.description}`);
    } else {
      // Create new conversation for this project
      createConvMutation.mutate(
        { data: { title: currentProject.name } },
        {
          onSuccess: (newConv) => {
            setActiveConversationId(newConv.id);
            refetchConversations();
            addLocalSystemMessage(newConv.id, `Switched to: ${currentProject.name} — ${currentProject.description}`);
          }
        }
      );
    }
  }, [currentProject.name, conversations?.length]); // Dep array intentionally loose to prevent infinite loops, mostly relying on name change

  const addLocalSystemMessage = (convId: number, content: string) => {
    setLocalSystemMessages(prev => {
      const existing = prev[convId] || [];
      // Prevent duplicate identical system messages back-to-back
      if (existing.length > 0 && existing[existing.length - 1].content === content) {
        return prev;
      }
      return {
        ...prev,
        [convId]: [...existing, { id: Date.now(), content }]
      };
    });
  };

  const cycleProject = () => {
    setCurrentProjectIndex((prev) => (prev + 1) % PROJECTS.length);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isStreaming || !activeConversationId) return;
    
    sendMessage(inputMessage.trim());
    setInputMessage("");
    // Keep focus after sending for rapid typing
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, streamingText, localSystemMessages, activeConversationId]);

  // Combine DB messages, streaming text, and local system messages into one timeline
  const renderMessages = useMemo(() => {
    if (!activeConversation) return [];
    
    const dbMessages = activeConversation.messages.map(m => ({ ...m, type: 'db' }));
    const sysMessages = (localSystemMessages[activeConversationId as number] || []).map(m => ({
      id: m.id,
      role: 'system' as const,
      content: m.content,
      createdAt: new Date(m.id).toISOString(),
      type: 'system'
    }));

    // Simple chron sort - in a real app might need more robust sorting if timestamps match
    const combined = [...dbMessages, ...sysMessages].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return combined;
  }, [activeConversation, localSystemMessages, activeConversationId]);

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-background md:bg-muted/30 items-center">
      {/* Mobile-like constraints for desktop to make it feel like an app */}
      <div className="flex flex-col w-full h-full max-w-3xl bg-background md:border-x md:shadow-2xl md:shadow-black/5 relative overflow-hidden">
        
        {/* TOP BAR - Glassmorphism Header */}
        <header className="flex-none h-16 w-full flex items-center justify-center relative z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <button 
            onClick={cycleProject}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-muted active:bg-muted/80 transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h1 className="font-semibold text-[17px] tracking-tight text-foreground">
              {currentProject.name}
            </h1>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </header>

        {/* CHAT AREA */}
        <main className="flex-1 overflow-y-auto w-full p-4 pb-6 scroll-smooth">
          {isLoadingMessages && !activeConversation ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="w-24 h-3 bg-muted rounded-full" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-end min-h-full">
              {renderMessages.map((msg) => (
                <ChatBubble 
                  key={`${msg.type}-${msg.id}`} 
                  role={msg.role as any} 
                  content={msg.content} 
                />
              ))}
              
              {/* Streaming actively */}
              {isStreaming && streamingText && (
                <ChatBubble role="assistant" content={streamingText} isStreaming />
              )}
              
              {/* AI is thinking but hasn't streamed text yet */}
              {isStreaming && !streamingText && (
                <TypingIndicator />
              )}
              
              <div ref={messagesEndRef} className="h-1" />
            </div>
          )}
        </main>

        {/* BOTTOM INPUT BAR */}
        <footer className="flex-none p-3 pb-safe bg-background/80 backdrop-blur-xl border-t border-border/50">
          <form 
            onSubmit={handleSend}
            className="relative flex items-center w-full bg-muted/50 border border-border/50 rounded-full pl-4 pr-1.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
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
          <div className="text-center mt-2 mb-1">
            <p className="text-[10px] text-muted-foreground/60 font-medium">
              CreateAI Brain Philosophy • Infinite Expansion
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}
