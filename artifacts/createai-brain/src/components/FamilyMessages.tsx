// ─── Family Messages ──────────────────────────────────────────────────────────
// Private, family-only messaging. Kids can only message within approved family spaces.
// Notifications are kind and non-alarming. No external messaging.

import { useState, useEffect, useRef } from "react";

const SAGE = "#7a9068";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.14)";

interface Conversation {
  id: string;
  name: string | null;
  type: string;
  participant_ids: string[];
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  sender_name: string | null;
  sender_emoji: string | null;
  created_at: string;
}

function fmtTime(d: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - dt.getTime()) / 86400000);
  if (diffDays === 0) return dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function FamilyMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  async function loadConversations() {
    setLoading(true);
    try {
      const [convRes, userRes] = await Promise.all([
        fetch("/api/family-messages/conversations", { credentials: "include" }),
        fetch("/api/auth/user", { credentials: "include" }),
      ]);
      if (convRes.ok) {
        const d = (await convRes.json()) as { conversations: Conversation[] };
        setConversations(d.conversations);
      }
      if (userRes.ok) {
        const u = (await userRes.json()) as { id: string };
        setCurrentUserId(u.id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(convoId: string) {
    const res = await fetch(`/api/family-messages/${convoId}/messages?limit=40`, { credentials: "include" });
    if (res.ok) {
      const d = (await res.json()) as { messages: Message[] };
      setMessages(d.messages);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }

  useEffect(() => { void loadConversations(); }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeConvo || !newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/family-messages/${activeConvo.id}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        setNewMessage("");
        await loadMessages(activeConvo.id);
        await loadConversations();
      }
    } finally {
      setSending(false);
    }
  }

  function handleSelectConvo(convo: Conversation) {
    setActiveConvo(convo);
    setMessages([]);
    void loadMessages(convo.id);
  }

  function getConvoName(convo: Conversation) {
    return convo.name ?? (convo.type === "direct" ? "Conversation" : "Family group");
  }

  // ── Two-panel layout ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-[500px] rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
      {/* Conversation list */}
      <div className="w-36 flex-shrink-0 flex flex-col" style={{ background: "white", borderRight: `1px solid ${BORDER}` }}>
        <div className="p-3 border-b" style={{ borderColor: BORDER }}>
          <p className="text-[12px] font-bold" style={{ color: TEXT }}>Messages</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="p-3 text-[11px]" style={{ color: MUTED }}>Loading…</p>
          )}
          {!loading && conversations.length === 0 && (
            <div className="p-3 text-center">
              <p className="text-[11px]" style={{ color: MUTED }}>No conversations yet</p>
              <p className="text-[10px] mt-1" style={{ color: MUTED }}>Messages with family members will appear here</p>
            </div>
          )}
          {conversations.map(c => (
            <button
              key={c.id}
              onClick={() => handleSelectConvo(c)}
              className="w-full text-left p-2.5 flex flex-col gap-0.5 transition-all"
              style={{
                background: activeConvo?.id === c.id ? `${SAGE}12` : "transparent",
                borderLeft: activeConvo?.id === c.id ? `3px solid ${SAGE}` : "3px solid transparent",
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[12px] font-semibold truncate" style={{ color: TEXT }}>
                  {getConvoName(c)}
                </span>
                {c.unread_count > 0 && (
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                    style={{ background: SAGE }}>
                    {c.unread_count}
                  </span>
                )}
              </div>
              {c.last_message && (
                <p className="text-[10px] truncate" style={{ color: MUTED }}>{c.last_message}</p>
              )}
              {c.last_message_at && (
                <p className="text-[10px]" style={{ color: MUTED }}>{fmtTime(c.last_message_at)}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 flex flex-col" style={{ background: CREAM }}>
        {!activeConvo ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl mb-2">💌</div>
              <p className="text-[13px] font-semibold" style={{ color: TEXT }}>Family messages</p>
              <p className="text-[11px] mt-1" style={{ color: MUTED }}>Select a conversation to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="p-3 border-b" style={{ background: "white", borderColor: BORDER }}>
              <p className="text-[13px] font-bold" style={{ color: TEXT }}>{getConvoName(activeConvo)}</p>
              <p className="text-[10px]" style={{ color: MUTED }}>Family only · private</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {messages.map(m => {
                const isMe = m.sender_id === currentUserId;
                return (
                  <div key={m.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                        style={{ background: `${SAGE}18` }}>
                        {m.sender_emoji ?? "🌱"}
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5" style={{ maxWidth: "70%", alignItems: isMe ? "flex-end" : "flex-start" }}>
                      {!isMe && m.sender_name && (
                        <span className="text-[10px] font-semibold px-1" style={{ color: MUTED }}>{m.sender_name}</span>
                      )}
                      <div
                        className="px-3 py-2 rounded-2xl text-[13px] leading-relaxed"
                        style={{
                          background: isMe ? SAGE : "white",
                          color: isMe ? "white" : TEXT,
                          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        }}
                      >
                        {m.content}
                      </div>
                      <span className="text-[10px] px-1" style={{ color: MUTED }}>{fmtTime(m.created_at)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSend} className="p-3 flex gap-2" style={{ borderTop: `1px solid ${BORDER}`, background: "white" }}>
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Message your family…"
                className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                style={{ background: CREAM, border: `1.5px solid ${BORDER}`, color: TEXT }}
                maxLength={2000}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-4 py-2 rounded-xl font-bold text-[13px] text-white disabled:opacity-50"
                style={{ background: SAGE }}
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
