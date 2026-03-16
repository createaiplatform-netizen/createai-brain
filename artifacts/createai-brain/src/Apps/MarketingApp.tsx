import { useChatStream } from "@/hooks/use-chat-stream";

export function MarketingApp() {
  const {
    messages,
    isLoading,
    sendMessage,
    setDemoMode,
    setLiveMode,
  } = useChatStream();

  // Automatically switch Marketing to DEMO mode
  setDemoMode();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Marketing</h1>

      <div className="mb-4">
        <button
          onClick={() => setDemoMode()}
          className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
        >
          Demo Mode
        </button>

        <button
          onClick={() => setLiveMode()}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Live Mode
        </button>
      </div>

      <div className="border p-4 rounded mb-4 h-64 overflow-auto bg-white">
        {messages.map((m, i) => (
          <div key={i} className="mb-2">
            <strong>{m.role === "user" ? "You:" : "AI:"}</strong> {m.content}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = (e.target as any).elements.message.value;
          sendMessage(input);
          (e.target as any).reset();
        }}
      >
        <input
          name="message"
          className="border p-2 rounded w-3/4 mr-2"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}