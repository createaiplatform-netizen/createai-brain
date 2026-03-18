import { useState, useCallback, useRef } from "react";
import { streamChat } from "@/controller";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

interface UseChatStreamOptions {
  onUserMessage?: (content: string) => Promise<void>;
  onAssistantMessage?: (content: string) => Promise<void>;
}

export function useChatStream(opts?: UseChatStreamOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const loadMessages = useCallback((loaded: ChatMessage[]) => {
    setMessages(loaded);
  }, []);

  const sendMessage = useCallback(async (userMessage: string, workspace?: string) => {
    if (!userMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };

    if (opts?.onUserMessage) {
      await opts.onUserMessage(userMessage).catch(() => {});
    }

    setMessages(prev => {
      const next = [...prev, userMsg];
      startStream(next, workspace);
      return next;
    });
  }, [opts?.onUserMessage]);

  function startStream(allMessages: ChatMessage[], workspace?: string) {
    setIsStreaming(true);
    setStreamingText("");

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        await streamChat({
          messages:  allMessages.map(m => ({ role: m.role, content: m.content })),
          workspace: workspace ?? "Main Brain",
          signal:    controller.signal,
          onChunk:   (_delta, accumulated) => setStreamingText(accumulated),
          onDone:    (fullText) => {
            const finalContent = fullText || "I'm here — what would you like to create or explore?";
            const assistantMsg: ChatMessage = {
              id: Date.now() + 1,
              role: "assistant",
              content: finalContent,
              createdAt: new Date().toISOString(),
            };
            setMessages(prev => [...prev, assistantMsg]);
            if (opts?.onAssistantMessage) opts.onAssistantMessage(finalContent).catch(() => {});
          },
          onError:   () => {
            const fallback: ChatMessage = {
              id: Date.now() + 1,
              role: "assistant",
              content: "I'm here and ready — what would you like to build, explore, or create today?",
              createdAt: new Date().toISOString(),
            };
            setMessages(prev => [...prev, fallback]);
          },
        });
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          const fallback: ChatMessage = {
            id: Date.now() + 1,
            role: "assistant",
            content: "I'm here and ready — what would you like to build, explore, or create today?",
            createdAt: new Date().toISOString(),
          };
          setMessages(prev => [...prev, fallback]);
        }
      } finally {
        setIsStreaming(false);
        setStreamingText("");
      }
    })();
  }

  return { messages, sendMessage, isStreaming, streamingText, loadMessages };
}
