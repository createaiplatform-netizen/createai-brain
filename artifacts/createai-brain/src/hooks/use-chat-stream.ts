import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export function useChatStream(_conversationId?: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingText("");

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          model: "gpt-5.2",
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Stream unavailable");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw);
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              accumulated += delta;
              setStreamingText(accumulated);
            }
          } catch {
            // non-JSON line, skip
          }
        }
      }

      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: accumulated || "I'm here to help — what would you like to work on?",
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        const fallback: ChatMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: "I'm here to help — what would you like to work on today?",
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, fallback]);
      }
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }
  }, [messages]);

  return { messages, sendMessage, isStreaming, streamingText };
}
