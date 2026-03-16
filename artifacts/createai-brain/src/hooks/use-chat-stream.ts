import { useState, useCallback } from "react";

export function useChatStream() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Default mode is LIVE
  let mode: "live" | "demo" = "live";

  // Allow Marketing to switch to demo mode
  function setDemoMode() {
    mode = "demo";
  }

  function setLiveMode() {
    mode = "live";
  }

  const sendMessage = useCallback(
    async (userMessage: string) => {
      setIsLoading(true);

      const newMessages = [
        ...messages,
        { role: "user", content: userMessage },
      ];
      setMessages(newMessages);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          mode: mode, // ← THIS IS WHERE MODE IS SENT
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);

      setIsLoading(false);
    },
    [messages]
  );

  return {
    messages,
    isLoading,
    sendMessage,
    setDemoMode,
    setLiveMode,
  };
}