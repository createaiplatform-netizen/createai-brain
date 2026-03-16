import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetOpenaiConversationQueryKey, OpenaiMessage } from "@workspace/api-client-react";

export function useChatStream(conversationId: number | null) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const queryClient = useQueryClient();

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId) return;

    setIsStreaming(true);
    setStreamingText("");

    try {
      // Create a temporary user message for immediate UI update (Optimistic)
      const queryKey = getGetOpenaiConversationQueryKey(conversationId);
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          messages: [
            ...oldData.messages,
            { id: Date.now(), conversationId, role: "user", content, createdAt: new Date().toISOString() }
          ]
        };
      });

      const response = await fetch(`/api/openai/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (!dataStr || dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.done) {
                // Stream finished, invalidate to fetch the final persisted message
                queryClient.invalidateQueries({ queryKey });
              } else if (data.content) {
                accumulatedText += data.content;
                setStreamingText(accumulatedText);
              }
            } catch (e) {
              // Ignore parse errors on incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat stream error:", error);
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }
  }, [conversationId, queryClient]);

  return { sendMessage, isStreaming, streamingText };
}
