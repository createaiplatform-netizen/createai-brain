import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  snapchat: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  ts: string;
}

interface VideoResult {
  title: string;
  description: string;
  hook: string;
  duration: string;
}

interface GameResult {
  title: string;
  description: string;
  characters: string[];
  rules: string[];
  world: string;
}

interface AppResult {
  name: string;
  screens: string[];
  features: string[];
  flow: string;
}

interface Creation {
  id: string;
  title: string;
  type: "video" | "game" | "app" | "story" | "art" | "idea" | "other";
  creator: string;
  description: string;
  image: string;
  date: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "earning" | "reward" | "goal" | "expense";
}

// ─── Local storage helpers ───────────────────────────────────────────────────

function loadLS<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; }
}
function saveLS(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

// ─── Shared UI helpers ───────────────────────────────────────────────────────

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

function apiFetch(path: string, opts?: RequestInit) {
  return fetch(`${BASE_URL}${path}`, { credentials: "include", ...opts });
}

function Section({ id, icon, title, children }: { id: string; icon: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "rgba(99,102,241,0.12)" }}>{icon}</div>
        <h2 className="text-[18px] font-bold" style={{ color: "#0f172a" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border p-5 ${className}`}
      style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, disabled, variant = "primary", className = "" }:
  { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: "primary" | "outline" | "ghost"; className?: string }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "#6366f1", color: "#fff" },
    outline: { background: "#fff", color: "#6366f1", border: "1.5px solid #6366f1" },
    ghost:   { background: "transparent", color: "#64748b" },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${className}`}
      style={{ ...styles[variant], opacity: disabled ? 0.55 : 1 }}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }:
  { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border text-[13px] px-3 py-2.5 outline-none transition-all focus:ring-2 focus:ring-indigo-300/50"
        style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#0f172a", background: "#fafafa" }} />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }:
  { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full rounded-xl border text-[13px] px-3 py-2.5 outline-none resize-none transition-all focus:ring-2 focus:ring-indigo-300/50"
        style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#0f172a", background: "#fafafa" }} />
    </div>
  );
}

function Spinner() {
  return <span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />;
}

// ─── Section 1: Family Profiles ──────────────────────────────────────────────

const SOCIAL_ICONS: Record<string, string> = {
  instagram: "📸", tiktok: "🎵", youtube: "▶️", snapchat: "👻",
};

const DEFAULT_PROFILES: Profile[] = [
  { id: "default-mom",   name: "Mom",         bio: "Family organizer, heart of the home 💛",        avatar: "", instagram: "", tiktok: "", youtube: "", snapchat: "" },
  { id: "default-dad",   name: "Dad",         bio: "Problem solver, adventure planner 🏕️",          avatar: "", instagram: "", tiktok: "", youtube: "", snapchat: "" },
  { id: "default-sara",  name: "Sara",        bio: "Creator, founder, and brain behind this hub ✨", avatar: "", instagram: "", tiktok: "", youtube: "", snapchat: "" },
  { id: "default-kids",  name: "Kids",        bio: "The next generation of creators 🚀",            avatar: "", instagram: "", tiktok: "", youtube: "", snapchat: "" },
  { id: "default-aunt",  name: "Aunt / Uncle",bio: "Family support crew, always there ❤️",          avatar: "", instagram: "", tiktok: "", youtube: "", snapchat: "" },
];

function ProfilesSection() {
  const [profiles, setProfiles]       = useState<Profile[]>(() => {
    const saved = loadLS<Profile[] | null>("fh_profiles", null);
    return (saved && saved.length > 0) ? saved : DEFAULT_PROFILES;
  });
  const [showForm, setShowForm]       = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [form, setForm]               = useState({ name: "", bio: "", avatar: "", instagram: "", tiktok: "", youtube: "", snapchat: "" });
  const avatarRef                     = useRef<HTMLInputElement>(null);

  useEffect(() => saveLS("fh_profiles", profiles), [profiles]);

  function openAdd() { setForm({ name: "", bio: "", avatar: "", instagram: "", tiktok: "", youtube: "", snapchat: "" }); setEditId(null); setShowForm(true); }
  function openEdit(p: Profile) { setForm({ name: p.name, bio: p.bio, avatar: p.avatar, instagram: p.instagram, tiktok: p.tiktok, youtube: p.youtube, snapchat: p.snapchat }); setEditId(p.id); setShowForm(true); }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, avatar: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editId) {
      setProfiles(ps => ps.map(p => p.id === editId ? { ...p, ...form } : p));
    } else {
      setProfiles(ps => [...ps, { id: Date.now().toString(), ...form }]);
    }
    setShowForm(false);
  }

  function handleDelete(id: string) { setProfiles(ps => ps.filter(p => p.id !== id)); }

  return (
    <Section id="profiles" icon="👨‍👩‍👧‍👦" title="Family Profiles">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {profiles.map(p => (
          <Card key={p.id}>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#6366f1,#a5b4fc)" }}>
                {p.avatar
                  ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  : <span className="text-3xl text-white">{p.name.charAt(0).toUpperCase()}</span>}
              </div>
              <div>
                <p className="font-bold text-[15px]" style={{ color: "#0f172a" }}>{p.name}</p>
                {p.bio && <p className="text-[12px] mt-0.5" style={{ color: "#64748b" }}>{p.bio}</p>}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {(["instagram", "tiktok", "youtube", "snapchat"] as const).map(s =>
                  p[s] ? (
                    <a key={s} href={p[s]} target="_blank" rel="noopener noreferrer"
                      title={s} className="text-xl hover:scale-110 transition-transform">{SOCIAL_ICONS[s]}</a>
                  ) : null
                )}
              </div>
              <div className="flex gap-2">
                <Btn variant="outline" onClick={() => openEdit(p)}>Edit</Btn>
                <Btn variant="ghost" onClick={() => handleDelete(p.id)}>Remove</Btn>
              </div>
            </div>
          </Card>
        ))}

        {/* Add profile button */}
        <button onClick={openAdd}
          className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 p-8 transition-all"
          style={{ borderColor: "rgba(99,102,241,0.25)", color: "#6366f1" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "#6366f1")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)")}>
          <span className="text-3xl">+</span>
          <span className="text-[13px] font-semibold">Add Profile</span>
        </button>
      </div>

      {showForm && (
        <Card className="mt-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-[15px]" style={{ color: "#0f172a" }}>{editId ? "Edit Profile" : "Add Profile"}</p>
            <button onClick={() => setShowForm(false)} className="text-[18px]" style={{ color: "#94a3b8" }}>×</button>
          </div>

          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer"
              style={{ background: "linear-gradient(135deg,#6366f1,#a5b4fc)" }}
              onClick={() => avatarRef.current?.click()}>
              {form.avatar
                ? <img src={form.avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl text-white">{form.name.charAt(0).toUpperCase() || "?"}</span>}
            </div>
            <div>
              <Btn variant="outline" onClick={() => avatarRef.current?.click()}>Upload Avatar</Btn>
              <p className="text-[10px] mt-1" style={{ color: "#94a3b8" }}>Click the circle or this button</p>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          <Input label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Full name" />
          <Textarea label="Short Bio" value={form.bio} onChange={v => setForm(f => ({ ...f, bio: v }))} placeholder="A short bio..." rows={2} />

          <div className="grid grid-cols-2 gap-3">
            {(["instagram", "tiktok", "youtube", "snapchat"] as const).map(s => (
              <Input key={s} label={`${SOCIAL_ICONS[s]} ${s.charAt(0).toUpperCase() + s.slice(1)}`}
                value={form[s]} onChange={v => setForm(f => ({ ...f, [s]: v }))} placeholder={`https://...`} />
            ))}
          </div>

          <div className="flex gap-2">
            <Btn onClick={handleSave} disabled={!form.name.trim()}>{editId ? "Save Changes" : "Add Profile"}</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
          </div>
        </Card>
      )}
    </Section>
  );
}

// ─── Section 2: AI Chat ──────────────────────────────────────────────────────

function AIChatSection() {
  const [messages, setMessages]   = useState<ChatMessage[]>(() => loadLS("fh_chat", []));
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => loadLS("fh_chat_session", null));
  const bottomRef                 = useRef<HTMLDivElement>(null);

  useEffect(() => saveLS("fh_chat", messages), [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const res = await apiFetch("/api/brainstorm/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Family Hub Chat" }),
    });
    if (!res.ok) throw new Error("session");
    const data = await res.json() as { id?: string; session?: { id: string } };
    const id = data.id ?? data.session?.id ?? "";
    setSessionId(id);
    saveLS("fh_chat_session", id);
    return id;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", text, ts: new Date().toLocaleTimeString() };
    setMessages(m => [...m, userMsg]);
    setLoading(true);
    try {
      const sid = await ensureSession();
      const res = await apiFetch(`/api/brainstorm/sessions/${sid}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json() as { reply?: string; response?: string; message?: string; content?: string };
      const reply = data.reply ?? data.response ?? data.message ?? data.content ?? "I'm here for you!";
      setMessages(m => [...m, { id: (Date.now() + 1).toString(), role: "ai", text: reply, ts: new Date().toLocaleTimeString() }]);
    } catch {
      setMessages(m => [...m, { id: (Date.now() + 1).toString(), role: "ai", text: "I'm having trouble connecting right now. Try again in a moment!", ts: new Date().toLocaleTimeString() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section id="chat" icon="💬" title="Family AI Chat">
      <Card className="flex flex-col" style={{ minHeight: 360 }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4" style={{ minHeight: 240, maxHeight: 360 }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-10" style={{ color: "#94a3b8" }}>
              <span className="text-4xl">🧠</span>
              <p className="text-[13px]">Start a conversation with the Family AI</p>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "ai" && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(99,102,241,0.12)" }}>🧠</div>
              )}
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${m.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`}
                style={m.role === "user"
                  ? { background: "#6366f1", color: "#fff" }
                  : { background: "#f1f5f9", color: "#0f172a" }}>
                {m.text}
                <div className={`text-[10px] mt-1 ${m.role === "user" ? "text-indigo-200 text-right" : ""}`}
                  style={m.role === "ai" ? { color: "#94a3b8" } : {}}>{m.ts}</div>
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(99,102,241,0.15)" }}>👤</div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                style={{ background: "rgba(99,102,241,0.12)" }}>🧠</div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2"
                style={{ background: "#f1f5f9" }}>
                <Spinner /><span className="text-[12px]" style={{ color: "#64748b" }}>Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask anything…"
            disabled={loading}
            className="flex-1 rounded-xl border text-[13px] px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-300/50"
            style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#0f172a", background: "#fafafa" }} />
          <Btn onClick={handleSend} disabled={!input.trim() || loading}>Send</Btn>
        </div>
      </Card>
    </Section>
  );
}

// ─── AI generation helper ────────────────────────────────────────────────────

async function callGenerate(prompt: string): Promise<string> {
  const res = await apiFetch("/api/brainstorm/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Family Hub Gen" }),
  });
  if (!res.ok) throw new Error("session");
  const sess = await res.json() as { id?: string; session?: { id: string } };
  const sid = sess.id ?? sess.session?.id ?? "";
  const r2 = await apiFetch(`/api/brainstorm/sessions/${sid}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!r2.ok) throw new Error("generate");
  const data = await r2.json() as { content?: string; result?: string; text?: string };
  return data.content ?? data.result ?? data.text ?? "";
}

function parseJSON<T>(text: string, fallback: T): T {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = match ? match[1] : text;
    return JSON.parse(raw.trim()) as T;
  } catch {
    return fallback;
  }
}

// ─── Section 3: Video Creator ────────────────────────────────────────────────

function VideoCreatorSection() {
  const [prompt, setPrompt]   = useState("");
  const [result, setResult]   = useState<VideoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const raw = await callGenerate(
        `You are a creative video ideation assistant. Generate a short-form video idea based on this description: "${prompt}". Respond with JSON only in this format: {"title":"...","description":"...","hook":"...","duration":"..."}`
      );
      const parsed = parseJSON<VideoResult>(raw, { title: "Video Idea", description: raw, hook: "", duration: "60s" });
      setResult(parsed);
    } catch {
      setError("Could not generate video idea. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section id="video" icon="🎬" title="Video Creator">
      <Card className="space-y-4">
        <Textarea label="Describe the video you want" value={prompt} onChange={setPrompt}
          placeholder="e.g. A funny day in our life, a cooking tutorial, a family travel vlog…" rows={3} />
        <Btn onClick={handleGenerate} disabled={!prompt.trim() || loading} className="flex items-center gap-2">
          {loading && <Spinner />}Generate Video Idea
        </Btn>
        {error && <p className="text-[12px]" style={{ color: "#ef4444" }}>{error}</p>}
        {result && (
          <div className="rounded-2xl p-4 space-y-3" style={{ background: "#f8fafc", border: "1px solid rgba(99,102,241,0.15)" }}>
            {/* Thumbnail placeholder */}
            <div className="w-full rounded-xl flex items-center justify-center text-4xl"
              style={{ height: 120, background: "linear-gradient(135deg,#6366f1 0%,#a5b4fc 100%)" }}>🎬</div>
            <div>
              <p className="font-bold text-[15px]" style={{ color: "#0f172a" }}>{result.title}</p>
              {result.duration && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#eef2ff", color: "#6366f1" }}>{result.duration}</span>}
            </div>
            {result.hook && (
              <div className="rounded-xl p-3" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: "#6366f1" }}>Opening Hook</p>
                <p className="text-[13px]" style={{ color: "#334155" }}>{result.hook}</p>
              </div>
            )}
            <p className="text-[13px]" style={{ color: "#334155" }}>{result.description}</p>
          </div>
        )}
      </Card>
    </Section>
  );
}

// ─── Section 4: Game Builder ─────────────────────────────────────────────────

function GameBuilderSection() {
  const [prompt, setPrompt]   = useState("");
  const [result, setResult]   = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const raw = await callGenerate(
        `You are a creative game designer for families. Create a game concept based on: "${prompt}". Respond with JSON only: {"title":"...","description":"...","characters":["..."],"rules":["..."],"world":"..."}`
      );
      const parsed = parseJSON<GameResult>(raw, { title: "Game Concept", description: raw, characters: [], rules: [], world: "" });
      setResult(parsed);
    } catch {
      setError("Could not generate game concept. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section id="game" icon="🎮" title="Game Builder">
      <Card className="space-y-4">
        <Textarea label="Describe your game" value={prompt} onChange={setPrompt}
          placeholder="e.g. A board game about our family's adventures, a card game for ages 7+…" rows={3} />
        <Btn onClick={handleGenerate} disabled={!prompt.trim() || loading} className="flex items-center gap-2">
          {loading && <Spinner />}Generate Game Concept
        </Btn>
        {error && <p className="text-[12px]" style={{ color: "#ef4444" }}>{error}</p>}
        {result && (
          <div className="rounded-2xl p-4 space-y-3" style={{ background: "#f8fafc", border: "1px solid rgba(99,102,241,0.15)" }}>
            <p className="font-bold text-[16px]" style={{ color: "#0f172a" }}>{result.title}</p>
            <p className="text-[13px]" style={{ color: "#334155" }}>{result.description}</p>
            {result.world && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: "#6366f1" }}>World</p>
                <p className="text-[13px]" style={{ color: "#334155" }}>{result.world}</p>
              </div>
            )}
            {result.characters.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#6366f1" }}>Characters</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.characters.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-[12px]" style={{ background: "#eef2ff", color: "#4338ca" }}>{c}</span>
                  ))}
                </div>
              </div>
            )}
            {result.rules.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#6366f1" }}>Rules</p>
                <ol className="space-y-1">
                  {result.rules.map((r, i) => (
                    <li key={i} className="flex gap-2 text-[13px]" style={{ color: "#334155" }}>
                      <span className="font-bold flex-shrink-0" style={{ color: "#6366f1" }}>{i + 1}.</span>{r}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </Card>
    </Section>
  );
}

// ─── Section 5: App Builder ──────────────────────────────────────────────────

function AppBuilderSection() {
  const [prompt, setPrompt]   = useState("");
  const [result, setResult]   = useState<AppResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const raw = await callGenerate(
        `You are an app blueprint generator for creative families. Generate an app blueprint based on: "${prompt}". Respond with JSON only: {"name":"...","screens":["..."],"features":["..."],"flow":"..."}`
      );
      const parsed = parseJSON<AppResult>(raw, { name: "App Blueprint", screens: [], features: [], flow: raw });
      setResult(parsed);
    } catch {
      setError("Could not generate app blueprint. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section id="appbuilder" icon="📱" title="App Builder">
      <Card className="space-y-4">
        <Textarea label="Describe your app" value={prompt} onChange={setPrompt}
          placeholder="e.g. A family chore tracker app, a bedtime stories app for kids…" rows={3} />
        <Btn onClick={handleGenerate} disabled={!prompt.trim() || loading} className="flex items-center gap-2">
          {loading && <Spinner />}Generate App Blueprint
        </Btn>
        {error && <p className="text-[12px]" style={{ color: "#ef4444" }}>{error}</p>}
        {result && (
          <div className="rounded-2xl p-4 space-y-3" style={{ background: "#f8fafc", border: "1px solid rgba(99,102,241,0.15)" }}>
            <p className="font-bold text-[16px]" style={{ color: "#0f172a" }}>{result.name}</p>
            {result.screens.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#6366f1" }}>Main Screens</p>
                <div className="grid grid-cols-2 gap-2">
                  {result.screens.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px]"
                      style={{ background: "#eef2ff", color: "#4338ca" }}>
                      <span>📱</span>{s}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.features.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#6366f1" }}>Core Features</p>
                <ul className="space-y-1">
                  {result.features.map((f, i) => (
                    <li key={i} className="flex gap-2 text-[13px]" style={{ color: "#334155" }}>
                      <span style={{ color: "#6366f1" }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.flow && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#6366f1" }}>Simple Flow</p>
                <div className="rounded-xl p-3 font-mono text-[12px] whitespace-pre-wrap"
                  style={{ background: "#1e293b", color: "#a5b4fc" }}>{result.flow}</div>
              </div>
            )}
          </div>
        )}
      </Card>
    </Section>
  );
}

// ─── Section 6: Shared Family Gallery ───────────────────────────────────────

const CREATION_TYPES = ["video", "game", "app", "story", "art", "idea", "other"] as const;
const TYPE_ICONS: Record<string, string> = {
  video: "🎬", game: "🎮", app: "📱", story: "📖", art: "🎨", idea: "💡", other: "⭐",
};

function GallerySection() {
  const [creations, setCreations]   = useState<Creation[]>(() => loadLS("fh_gallery", []));
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState({ title: "", type: "idea" as Creation["type"], creator: "", description: "", image: "" });
  const imgRef                      = useRef<HTMLInputElement>(null);

  useEffect(() => saveLS("fh_gallery", creations), [creations]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, image: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }

  function handleAdd() {
    if (!form.title.trim()) return;
    setCreations(c => [{ id: Date.now().toString(), ...form, date: new Date().toLocaleDateString() }, ...c]);
    setForm({ title: "", type: "idea", creator: "", description: "", image: "" });
    setShowForm(false);
  }

  function handleDelete(id: string) { setCreations(c => c.filter(x => x.id !== id)); }

  return (
    <Section id="gallery" icon="🖼️" title="Shared Family Gallery">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px]" style={{ color: "#64748b" }}>{creations.length} creation{creations.length !== 1 ? "s" : ""}</p>
        <Btn onClick={() => setShowForm(v => !v)} variant="outline">+ Add Creation</Btn>
      </div>

      {showForm && (
        <Card className="mb-4 space-y-3">
          <p className="font-bold text-[14px]" style={{ color: "#0f172a" }}>Add a Creation</p>
          <Input label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Creation title" />
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Creation["type"] }))}
              className="w-full rounded-xl border text-[13px] px-3 py-2.5 outline-none"
              style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#0f172a", background: "#fafafa" }}>
              {CREATION_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <Input label="Creator Name" value={form.creator} onChange={v => setForm(f => ({ ...f, creator: v }))} placeholder="Who made this?" />
          <Textarea label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Describe this creation…" rows={2} />

          {/* Image upload */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1" style={{ color: "#64748b" }}>Image (optional)</label>
            <div className="flex items-center gap-3">
              {form.image
                ? <img src={form.image} alt="" className="w-16 h-16 rounded-xl object-cover" />
                : <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: "#f1f5f9" }}>{TYPE_ICONS[form.type]}</div>}
              <Btn variant="outline" onClick={() => imgRef.current?.click()}>Upload Image</Btn>
            </div>
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          <div className="flex gap-2">
            <Btn onClick={handleAdd} disabled={!form.title.trim()}>Add to Gallery</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {creations.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ border: "2px dashed rgba(99,102,241,0.2)" }}>
          <p className="text-3xl mb-2">🌟</p>
          <p className="text-[14px] font-semibold" style={{ color: "#334155" }}>Your family gallery is empty</p>
          <p className="text-[12px] mt-1" style={{ color: "#94a3b8" }}>Add videos, games, apps, stories, art and ideas you've created together</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {creations.map(c => (
            <Card key={c.id} className="space-y-3">
              <div className="w-full rounded-xl overflow-hidden flex items-center justify-center text-4xl"
                style={{ height: 100, background: c.image ? "transparent" : "linear-gradient(135deg,#f1f5f9,#e2e8f0)" }}>
                {c.image ? <img src={c.image} alt={c.title} className="w-full h-full object-cover" /> : TYPE_ICONS[c.type]}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#eef2ff", color: "#6366f1" }}>
                    {TYPE_ICONS[c.type]} {c.type}
                  </span>
                </div>
                <p className="font-bold text-[14px]" style={{ color: "#0f172a" }}>{c.title}</p>
                {c.description && <p className="text-[12px] mt-0.5" style={{ color: "#64748b" }}>{c.description}</p>}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px]" style={{ color: "#94a3b8" }}>by {c.creator || "Family"} · {c.date}</p>
                  <button onClick={() => handleDelete(c.id)} className="text-[11px] font-medium"
                    style={{ color: "#ef4444" }}>Remove</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Section 7: Family Bank ──────────────────────────────────────────────────

const TX_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  earning: { bg: "#f0fdf4", text: "#16a34a" },
  reward:  { bg: "#eef2ff", text: "#6366f1" },
  goal:    { bg: "#fff7ed", text: "#f59e0b" },
  expense: { bg: "#fef2f2", text: "#ef4444" },
};

function FamilyBankSection() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadLS("fh_bank", []));
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState({ amount: "", description: "", type: "earning" as Transaction["type"] });

  useEffect(() => saveLS("fh_bank", transactions), [transactions]);

  const balance = transactions.reduce((sum, t) => {
    return t.type === "expense" ? sum - Math.abs(t.amount) : sum + Math.abs(t.amount);
  }, 0);

  function handleAdd() {
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || !form.description.trim()) return;
    setTransactions(ts => [{
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      description: form.description,
      amount: Math.abs(amt),
      type: form.type,
    }, ...ts]);
    setForm({ amount: "", description: "", type: "earning" });
    setShowForm(false);
  }

  const isPositive = (t: Transaction) => t.type !== "expense";

  return (
    <Section id="bank" icon="🏦" title="Family Bank (Creative Economy)">
      {/* Balance */}
      <Card className="text-center mb-4">
        <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Family Balance</p>
        <p className="text-[42px] font-bold leading-tight" style={{ color: balance >= 0 ? "#16a34a" : "#ef4444" }}>
          {balance < 0 ? "-" : ""}${Math.abs(balance).toFixed(2)}
        </p>
        <p className="text-[12px] mt-1" style={{ color: "#94a3b8" }}>{transactions.length} transaction{transactions.length !== 1 ? "s" : ""}</p>
      </Card>

      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-[14px]" style={{ color: "#0f172a" }}>Transactions</p>
        <Btn onClick={() => setShowForm(v => !v)} variant="outline">+ Add Transaction</Btn>
      </div>

      {showForm && (
        <Card className="mb-4 space-y-3">
          <p className="font-bold text-[14px]" style={{ color: "#0f172a" }}>Add Transaction</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount ($)" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} placeholder="0.00" type="number" />
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Transaction["type"] }))}
                className="w-full rounded-xl border text-[13px] px-3 py-2.5 outline-none"
                style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#0f172a", background: "#fafafa" }}>
                {(["earning", "reward", "goal", "expense"] as const).map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <Input label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="What is this for?" />
          <div className="flex gap-2">
            <Btn onClick={handleAdd} disabled={!form.amount || !form.description.trim()}>Add Transaction</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {transactions.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: "2px dashed rgba(99,102,241,0.2)" }}>
          <p className="text-3xl mb-2">💰</p>
          <p className="text-[14px] font-semibold" style={{ color: "#334155" }}>No transactions yet</p>
          <p className="text-[12px] mt-1" style={{ color: "#94a3b8" }}>Track earnings, rewards, goals, and expenses for your family's creative economy</p>
        </div>
      ) : (
        <Card className="divide-y" style={{ padding: 0, overflow: "hidden" }}>
          {transactions.map(t => {
            const pos = isPositive(t);
            const colors = TX_TYPE_COLORS[t.type];
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: colors.bg, color: colors.text }}>
                  {t.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: "#0f172a" }}>{t.description}</p>
                  <p className="text-[11px]" style={{ color: "#94a3b8" }}>{t.date}</p>
                </div>
                <span className="font-bold text-[15px] flex-shrink-0"
                  style={{ color: pos ? "#16a34a" : "#ef4444" }}>
                  {pos ? "+" : "-"}${t.amount.toFixed(2)}
                </span>
                <button onClick={() => setTransactions(ts => ts.filter(x => x.id !== t.id))}
                  className="text-[11px] flex-shrink-0" style={{ color: "#cbd5e1" }}
                  title="Remove">×</button>
              </div>
            );
          })}
        </Card>
      )}
    </Section>
  );
}

// ─── Section 8: Invite Family Members ───────────────────────────────────────

function InviteSection() {
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied]         = useState(false);

  function generateToken(): string {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  function handleGenerate() {
    const base = window.location.origin + (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
    const token = generateToken();
    setInviteLink(`${base}/family-hub?invite=${token}`);
    setCopied(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement("textarea");
      el.value = inviteLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <Section id="invite" icon="🔗" title="Invite Family Members">
      <Card className="space-y-4">
        <p className="text-[13px]" style={{ color: "#64748b" }}>
          Generate a private invite link to share with family — your sister, her children, or anyone you choose.
          Anyone with the link can land directly on the Family Hub and start creating their profile.
        </p>

        {/* Who can you invite */}
        <div className="rounded-xl p-4 space-y-2" style={{ background: "#f8fafc", border: "1px solid rgba(99,102,241,0.12)" }}>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#6366f1" }}>Share this link with</p>
          <div className="grid grid-cols-2 gap-2">
            {["Your sister", "Her child", "Her child's kids", "Any family member you choose"].map(who => (
              <div key={who} className="flex items-center gap-2 text-[12px]" style={{ color: "#334155" }}>
                <span style={{ color: "#6366f1" }}>✓</span>{who}
              </div>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <Btn onClick={handleGenerate} className="flex items-center gap-2">
          🔗 Generate Invite Link
        </Btn>

        {/* Generated link */}
        {inviteLink && (
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>Your Invite Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                onClick={e => (e.target as HTMLInputElement).select()}
                className="flex-1 rounded-xl border text-[12px] px-3 py-2.5 outline-none font-mono cursor-text"
                style={{ border: "1px solid rgba(99,102,241,0.25)", background: "#f8fafc", color: "#4338ca" }} />
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all flex-shrink-0"
                style={copied
                  ? { background: "#f0fdf4", color: "#16a34a", border: "1.5px solid #bbf7d0" }
                  : { background: "#6366f1", color: "#fff" }}>
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>
            <p className="text-[11px]" style={{ color: "#94a3b8" }}>
              Share this link via text, email, or any messaging app. Anyone who opens it will land on the Family Hub.
            </p>
          </div>
        )}

        {/* How it works */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.1)" }}>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#6366f1" }}>How it works</p>
          <ol className="space-y-2">
            {[
              "You click Generate Invite Link above",
              "Copy and send the link via text, email, iMessage, etc.",
              "Family member opens the link and lands on this hub",
              "They create or edit their profile and start using all the tools",
            ].map((step, i) => (
              <li key={i} className="flex gap-2.5 text-[12px]" style={{ color: "#475569" }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                  style={{ background: "#eef2ff", color: "#6366f1" }}>{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </Card>
    </Section>
  );
}

// ─── Nav bar ─────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: "#profiles", label: "Profiles" },
  { href: "#chat",     label: "AI Chat" },
  { href: "#video",    label: "Video" },
  { href: "#game",     label: "Game" },
  { href: "#appbuilder", label: "App" },
  { href: "#gallery",  label: "Gallery" },
  { href: "#bank",     label: "Bank" },
  { href: "#invite",   label: "Invite" },
];

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function FamilyHubPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center gap-4 px-5 py-3 overflow-x-auto"
        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <button onClick={() => navigate("/")}
          className="flex items-center gap-2 font-bold text-[14px] flex-shrink-0 mr-2"
          style={{ color: "#6366f1" }}>
          ← Back
        </button>
        <div className="flex items-center gap-1 flex-shrink-0 mr-2">
          <span className="text-lg">🏡</span>
          <span className="font-bold text-[14px]" style={{ color: "#0f172a" }}>Family Hub</span>
        </div>
        <div className="flex gap-1">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href}
              className="px-2.5 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all"
              style={{ color: "#64748b" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#eef2ff"; (e.currentTarget as HTMLElement).style.color = "#6366f1"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}>
              {l.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── Header ── */}
      <header className="px-5 pt-8 pb-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#6366f1 0%,#a5b4fc 100%)" }}>🏡</div>
          <div>
            <h1 className="text-[26px] font-bold" style={{ color: "#0f172a" }}>Family Creation Hub</h1>
            <p className="text-[14px] mt-0.5" style={{ color: "#64748b" }}>Private · Family-only · Everything in one place</p>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-4xl mx-auto px-5 pb-16 space-y-10">
        <ProfilesSection />
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />
        <AIChatSection />
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />
        <VideoCreatorSection />
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />
        <GameBuilderSection />
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />
        <AppBuilderSection />
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />
        <GallerySection />
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />
        <FamilyBankSection />
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />
        <InviteSection />
      </main>
    </div>
  );
}
