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

interface StoryResult {
  title: string;
  opening: string;
  middle: string;
  ending: string;
  moral: string;
}

interface ArtResult {
  title: string;
  style: string;
  colors: string[];
  description: string;
  howTo: string;
}

interface MemoryResult {
  headline: string;
  body: string;
  closing: string;
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

// ─── localStorage helpers ────────────────────────────────────────────────────

function loadLS<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; }
}
function saveLS(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /**/ }
}

// ─── API helpers ─────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");
function apiFetch(path: string, opts?: RequestInit) {
  return fetch(`${BASE_URL}${path}`, { credentials: "include", ...opts });
}

async function callGenerate(prompt: string): Promise<string> {
  const res = await apiFetch("/api/brainstorm/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Family Universe Gen" }),
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
  } catch { return fallback; }
}

// ─── Default profiles ────────────────────────────────────────────────────────

const DEFAULT_PROFILES: Profile[] = [
  { id: "default-mom",  name: "Mom",          bio: "Family organizer, heart of the home 💛",        avatar: "", instagram: "", tiktok: "", youtube: "", snapchat: "" },
  { id: "default-dad",  name: "Dad",          bio: "Problem solver, adventure planner 🏕️",          avatar: "", instagram: "", tiktok: "", youtube: "", snapchat: "" },
  { id: "default-sara", name: "Sara",         bio: "Creator, founder, and brain behind this hub ✨", avatar: "", instagram: "", tiktok: "", youtube: "", snapchat: "" },
  { id: "default-kids", name: "Kids",         bio: "The next generation of creators 🚀",            avatar: "", instagram: "", tiktok: "", youtube: "", snapchat: "" },
  { id: "default-aunt", name: "Aunt / Uncle", bio: "Family support crew, always there ❤️",          avatar: "", instagram: "", tiktok: "", youtube: "", snapchat: "" },
];

// ─── Member colour themes ────────────────────────────────────────────────────

const MEMBER_COLORS: string[] = [
  "#fb7185", "#f59e0b", "#a78bfa", "#34d399", "#38bdf8",
  "#f472b6", "#fb923c", "#4ade80", "#60a5fa", "#c084fc",
];

function memberColor(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

// ─── Warm shared UI primitives ───────────────────────────────────────────────

const WARM_BG     = "#fffbf5";
const WARM_PRIMARY = "#f59e0b";
const WARM_TEXT   = "#1c1412";
const WARM_MUTED  = "#78716c";
const WARM_BORDER = "rgba(245,158,11,0.18)";

function WarmCard({ children, className = "", style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div className={className}
      style={{ background: "#fff", borderRadius: 20, padding: 20,
        boxShadow: "0 2px 16px rgba(245,158,11,0.09), 0 1px 3px rgba(0,0,0,0.04)",
        border: `1px solid ${WARM_BORDER}`, ...style }}>
      {children}
    </div>
  );
}

function WarmBtn({ children, onClick, disabled, variant = "primary", color, small, className = "" }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: "primary" | "soft" | "ghost"; color?: string; small?: boolean; className?: string;
}) {
  const c = color ?? WARM_PRIMARY;
  const base = small ? "px-3 py-1.5 text-[12px]" : "px-5 py-2.5 text-[13px]";
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: c, color: "#fff", boxShadow: `0 4px 14px ${c}44` },
    soft:    { background: c + "1a", color: c, border: `1.5px solid ${c}33` },
    ghost:   { background: "transparent", color: WARM_MUTED },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`rounded-2xl font-semibold transition-all ${base} ${className}`}
      style={{ ...styles[variant], opacity: disabled ? 0.5 : 1, fontFamily: "'Inter',sans-serif" }}>
      {children}
    </button>
  );
}

function WarmInput({ label, value, onChange, placeholder, type = "text" }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-[11px] font-semibold uppercase tracking-wide" style={{ color: WARM_MUTED }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-2xl px-4 py-3 text-[13px] outline-none transition-all"
        style={{ border: `1.5px solid rgba(245,158,11,0.2)`, background: "#fffdf9", color: WARM_TEXT, fontFamily: "'Inter',sans-serif" }}
        onFocus={e => (e.currentTarget.style.border = `1.5px solid ${WARM_PRIMARY}`)}
        onBlur={e  => (e.currentTarget.style.border = `1.5px solid rgba(245,158,11,0.2)`)} />
    </div>
  );
}

function WarmTextarea({ label, value, onChange, placeholder, rows = 3 }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-[11px] font-semibold uppercase tracking-wide" style={{ color: WARM_MUTED }}>{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full rounded-2xl px-4 py-3 text-[13px] outline-none resize-none transition-all"
        style={{ border: `1.5px solid rgba(245,158,11,0.2)`, background: "#fffdf9", color: WARM_TEXT, fontFamily: "'Inter',sans-serif" }}
        onFocus={e => (e.currentTarget.style.border = `1.5px solid ${WARM_PRIMARY}`)}
        onBlur={e  => (e.currentTarget.style.border = `1.5px solid rgba(245,158,11,0.2)`)} />
    </div>
  );
}

function WarmSpinner() {
  return <span className="inline-block w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />;
}

// ─── Welcome Screen ──────────────────────────────────────────────────────────

function WelcomeScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(145deg, #fde68a 0%, #fca5a5 40%, #c4b5fd 80%, #86efac 100%)", fontFamily: "'Inter',sans-serif" }}>

      {/* Soft blobs */}
      <div className="absolute top-[-80px] left-[-80px] w-64 h-64 rounded-full opacity-25 blur-3xl"
        style={{ background: "#fbbf24" }} />
      <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 rounded-full opacity-20 blur-3xl"
        style={{ background: "#a78bfa" }} />

      <div className="relative z-10 flex flex-col items-center gap-8 px-8 text-center max-w-sm">

        {/* Emblem */}
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl"
          style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 12px 48px rgba(0,0,0,0.12)" }}>
          🌟
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-[30px] font-black leading-tight" style={{ color: "#1c1412", letterSpacing: "-0.5px" }}>
            Welcome to Our<br />Family Universe
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: "#44403c" }}>
            A place to create, share,<br />and grow together.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          {[
            { icon: "💛", text: "We care for others" },
            { icon: "🤝", text: "We help each other" },
            { icon: "🎨", text: "We love to create" },
            { icon: "🌱", text: "We grow together" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 rounded-2xl px-3 py-2.5"
              style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(8px)" }}>
              <span className="text-lg flex-shrink-0">{icon}</span>
              <span className="text-[11px] font-semibold" style={{ color: "#44403c" }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Enter button */}
        <button onClick={onEnter}
          className="w-full py-4 rounded-2xl font-bold text-[16px] text-white transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #f59e0b 0%, #fb7185 100%)", boxShadow: "0 8px 32px rgba(245,158,11,0.45)" }}>
          Enter Our Universe ✨
        </button>

        <p className="text-[11px]" style={{ color: "rgba(68,64,60,0.55)" }}>
          Private · Family only · Always safe
        </p>
      </div>
    </div>
  );
}

// ─── Tab types ───────────────────────────────────────────────────────────────

type Tab = "home" | "create" | "gallery" | "family" | "rewards";

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "home",    icon: "🏡", label: "Home"    },
  { id: "create",  icon: "✨", label: "Create"  },
  { id: "gallery", icon: "🖼️", label: "Gallery" },
  { id: "family",  icon: "💛", label: "Family"  },
  { id: "rewards", icon: "🌟", label: "Rewards" },
];

// ─── Home Tab ─────────────────────────────────────────────────────────────────

function HomeTab({ profiles, creations, messages, onTabSwitch }:
  { profiles: Profile[]; creations: Creation[]; messages: ChatMessage[]; onTabSwitch: (t: Tab) => void }) {

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">

      {/* Hero collage header */}
      <div className="rounded-3xl overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #fde68a 0%, #fca5a5 60%, #c4b5fd 100%)", minHeight: 160 }}>

        {/* Family photo grid */}
        <div className="absolute inset-0 grid grid-cols-4 gap-1 p-2 opacity-50">
          {profiles.slice(0, 4).map((p, i) => (
            <div key={p.id} className="rounded-2xl overflow-hidden"
              style={{ background: memberColor(i) + "44" }}>
              {p.avatar
                ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl"
                    style={{ color: memberColor(i) }}>
                    {p.name.charAt(0)}
                  </div>}
            </div>
          ))}
        </div>

        {/* Overlay text */}
        <div className="relative z-10 px-6 py-8 flex flex-col gap-1">
          <p className="text-[13px] font-semibold" style={{ color: "rgba(28,20,18,0.65)" }}>{greeting} 💛</p>
          <h2 className="text-[22px] font-black" style={{ color: "#1c1412", letterSpacing: "-0.3px" }}>
            Our Family Universe
          </h2>
          <p className="text-[13px]" style={{ color: "rgba(28,20,18,0.60)" }}>
            {profiles.length} family member{profiles.length !== 1 ? "s" : ""} · {creations.length} creation{creations.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Quick create shortcuts */}
      <div>
        <p className="text-[12px] font-bold uppercase tracking-widest mb-3" style={{ color: WARM_MUTED }}>Make something today</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "📖", label: "Story Maker",    color: "#fb7185", tab: "create" as Tab },
            { icon: "🎨", label: "Art Studio",     color: "#f59e0b", tab: "create" as Tab },
            { icon: "🎬", label: "Video Moments",  color: "#a78bfa", tab: "create" as Tab },
          ].map(({ icon, label, color }) => (
            <button key={label} onClick={() => onTabSwitch("create")}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all active:scale-95"
              style={{ background: color + "15", border: `1.5px solid ${color}25` }}>
              <span className="text-2xl">{icon}</span>
              <span className="text-[11px] font-semibold text-center" style={{ color: color }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent creations feed */}
      {creations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold uppercase tracking-widest" style={{ color: WARM_MUTED }}>Recent creations</p>
            <button onClick={() => onTabSwitch("gallery")}
              className="text-[12px] font-semibold" style={{ color: WARM_PRIMARY }}>See all →</button>
          </div>
          <div className="space-y-2.5">
            {creations.slice(0, 3).map(c => (
              <WarmCard key={c.id} style={{ padding: "14px 16px" }}>
                <div className="flex items-center gap-3">
                  {c.image
                    ? <img src={c.image} alt={c.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: "#fef3c7" }}>
                        {c.type === "story" ? "📖" : c.type === "art" ? "🎨" : c.type === "video" ? "🎬" : "✨"}
                      </div>}
                  <div className="min-w-0">
                    <p className="font-bold text-[13px] truncate" style={{ color: WARM_TEXT }}>{c.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: WARM_MUTED }}>by {c.creator || "Family"} · {c.date}</p>
                  </div>
                </div>
              </WarmCard>
            ))}
          </div>
        </div>
      )}

      {/* Recent family chat */}
      {messages.length > 0 && (
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest mb-3" style={{ color: WARM_MUTED }}>Family chat</p>
          <WarmCard>
            {messages.slice(-2).map(m => (
              <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"} mb-2`}>
                <div className="max-w-[80%] px-3 py-2 rounded-2xl text-[12px]"
                  style={m.role === "user"
                    ? { background: WARM_PRIMARY, color: "#fff" }
                    : { background: "#fef3c7", color: WARM_TEXT }}>
                  {m.text.slice(0, 80)}{m.text.length > 80 ? "…" : ""}
                </div>
              </div>
            ))}
          </WarmCard>
        </div>
      )}

      {/* Empty state */}
      {creations.length === 0 && messages.length === 0 && (
        <WarmCard style={{ textAlign: "center", padding: 32 }}>
          <div className="text-4xl mb-3">🌱</div>
          <p className="font-bold text-[15px]" style={{ color: WARM_TEXT }}>Your universe is ready!</p>
          <p className="text-[13px] mt-1 mb-4" style={{ color: WARM_MUTED }}>Start by creating something or adding a memory.</p>
          <WarmBtn onClick={() => onTabSwitch("create")}>✨ Create Something</WarmBtn>
        </WarmCard>
      )}
    </div>
  );
}

// ─── Creation Tool: Story Maker ──────────────────────────────────────────────

function StoryMakerTool({ onSave }: { onSave: (title: string, desc: string) => void }) {
  const [prompt, setPrompt]   = useState("");
  const [result, setResult]   = useState<StoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true); setError("");
    try {
      const raw = await callGenerate(
        `You are a warm, family-friendly storyteller. Create a heartwarming family story based on: "${prompt}". Respond with JSON only: {"title":"...","opening":"...","middle":"...","ending":"...","moral":"..."}`
      );
      const parsed = parseJSON<StoryResult>(raw, { title: "Our Story", opening: raw.slice(0, 120), middle: "", ending: "", moral: "" });
      setResult(parsed);
    } catch { setError("Let's try that again — something went wrong."); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <WarmTextarea label="What is your story about?" value={prompt} onChange={setPrompt}
        placeholder="e.g. A magical adventure our family took together, a story about kindness and friendship…" rows={3} />
      <WarmBtn onClick={handleGenerate} disabled={!prompt.trim() || loading} className="flex items-center gap-2">
        {loading && <WarmSpinner />}📖 Write My Story
      </WarmBtn>
      {error && <p className="text-[13px]" style={{ color: "#ef4444" }}>{error}</p>}
      {result && (
        <WarmCard style={{ background: "#fffbf0", borderColor: "rgba(245,158,11,0.25)" }}>
          <p className="font-black text-[17px] mb-4" style={{ color: WARM_TEXT }}>{result.title}</p>
          {[
            { label: "Beginning", text: result.opening },
            { label: "Middle",    text: result.middle },
            { label: "Ending",    text: result.ending },
          ].filter(s => s.text).map(s => (
            <div key={s.label} className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: WARM_PRIMARY }}>{s.label}</p>
              <p className="text-[13px] leading-relaxed" style={{ color: WARM_TEXT }}>{s.text}</p>
            </div>
          ))}
          {result.moral && (
            <div className="rounded-2xl p-3 mt-2" style={{ background: "#fef3c7" }}>
              <p className="text-[12px] font-semibold" style={{ color: "#92400e" }}>💛 {result.moral}</p>
            </div>
          )}
          <div className="mt-4">
            <WarmBtn onClick={() => onSave(result.title, result.opening)} small color="#34d399">💾 Save to Gallery</WarmBtn>
          </div>
        </WarmCard>
      )}
    </div>
  );
}

// ─── Creation Tool: Art Studio ───────────────────────────────────────────────

function ArtStudioTool({ onSave }: { onSave: (title: string, desc: string) => void }) {
  const [prompt, setPrompt]   = useState("");
  const [result, setResult]   = useState<ArtResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true); setError("");
    try {
      const raw = await callGenerate(
        `You are a warm, encouraging art teacher for families. Create an art idea based on: "${prompt}". Respond with JSON only: {"title":"...","style":"...","colors":["...","...","..."],"description":"...","howTo":"step by step instructions for a family art project"}`
      );
      const parsed = parseJSON<ArtResult>(raw, { title: "Family Art", style: "Mixed media", colors: ["Warm tones"], description: raw.slice(0, 150), howTo: "" });
      setResult(parsed);
    } catch { setError("Let's try that again — something went wrong."); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <WarmTextarea label="What would you like to create?" value={prompt} onChange={setPrompt}
        placeholder="e.g. A painting of our home, a family portrait using watercolors, a collage of our favorite memories…" rows={3} />
      <WarmBtn onClick={handleGenerate} disabled={!prompt.trim() || loading} color="#f59e0b" className="flex items-center gap-2">
        {loading && <WarmSpinner />}🎨 Create Art Idea
      </WarmBtn>
      {error && <p className="text-[13px]" style={{ color: "#ef4444" }}>{error}</p>}
      {result && (
        <WarmCard style={{ background: "#fffbf0" }}>
          <p className="font-black text-[17px] mb-1" style={{ color: WARM_TEXT }}>{result.title}</p>
          <p className="text-[12px] mb-3" style={{ color: WARM_MUTED }}>{result.style}</p>
          {result.colors.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {result.colors.map(c => (
                <span key={c} className="px-3 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: "#fef3c7", color: "#92400e" }}>{c}</span>
              ))}
            </div>
          )}
          <p className="text-[13px] leading-relaxed mb-3" style={{ color: WARM_TEXT }}>{result.description}</p>
          {result.howTo && (
            <div className="rounded-2xl p-3" style={{ background: "#f0fdf4" }}>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: "#16a34a" }}>How to make it</p>
              <p className="text-[12px] leading-relaxed" style={{ color: "#14532d" }}>{result.howTo}</p>
            </div>
          )}
          <div className="mt-4">
            <WarmBtn onClick={() => onSave(result.title, result.description)} small color="#34d399">💾 Save to Gallery</WarmBtn>
          </div>
        </WarmCard>
      )}
    </div>
  );
}

// ─── Creation Tool: Video Moments ────────────────────────────────────────────

function VideoMomentsTool({ onSave }: { onSave: (title: string, desc: string) => void }) {
  const [prompt, setPrompt]   = useState("");
  const [result, setResult]   = useState<VideoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true); setError("");
    try {
      const raw = await callGenerate(
        `You are a warm family video producer. Create a heartfelt family video idea based on: "${prompt}". Respond with JSON only: {"title":"...","hook":"a warm opening line","description":"...","duration":"..."}`
      );
      const parsed = parseJSON<VideoResult>(raw, { title: "Our Moment", hook: "", description: raw.slice(0, 150), duration: "" });
      setResult(parsed);
    } catch { setError("Let's try that again — something went wrong."); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <WarmTextarea label="Describe the video you want to make" value={prompt} onChange={setPrompt}
        placeholder="e.g. A video about our family vacation, a birthday tribute for Mom, a memory of the kids growing up…" rows={3} />
      <WarmBtn onClick={handleGenerate} disabled={!prompt.trim() || loading} color="#a78bfa" className="flex items-center gap-2">
        {loading && <WarmSpinner />}🎬 Create Video Idea
      </WarmBtn>
      {error && <p className="text-[13px]" style={{ color: "#ef4444" }}>{error}</p>}
      {result && (
        <WarmCard style={{ background: "#faf5ff" }}>
          <div className="rounded-2xl mb-3 flex items-center justify-center text-4xl"
            style={{ background: "linear-gradient(135deg, #a78bfa22, #c084fc22)", height: 80 }}>🎬</div>
          <p className="font-black text-[17px] mb-1" style={{ color: WARM_TEXT }}>{result.title}</p>
          {result.hook && <p className="text-[13px] italic mb-3" style={{ color: "#7c3aed" }}>"{result.hook}"</p>}
          <p className="text-[13px] leading-relaxed mb-2" style={{ color: WARM_TEXT }}>{result.description}</p>
          {result.duration && <p className="text-[12px]" style={{ color: WARM_MUTED }}>⏱ {result.duration}</p>}
          <div className="mt-4">
            <WarmBtn onClick={() => onSave(result.title, result.description)} small color="#34d399">💾 Save to Gallery</WarmBtn>
          </div>
        </WarmCard>
      )}
    </div>
  );
}

// ─── Creation Tool: Memory Cards ─────────────────────────────────────────────

function MemoryCardsTool({ onSave }: { onSave: (title: string, desc: string) => void }) {
  const [prompt, setPrompt]   = useState("");
  const [result, setResult]   = useState<MemoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true); setError("");
    try {
      const raw = await callGenerate(
        `You are a warm, heartfelt card writer for families. Create a memory card or message based on: "${prompt}". Respond with JSON only: {"headline":"...","body":"a warm, heartfelt 2-3 sentence message","closing":"..."}`
      );
      const parsed = parseJSON<MemoryResult>(raw, { headline: "A Cherished Memory", body: raw.slice(0, 200), closing: "With love 💛" });
      setResult(parsed);
    } catch { setError("Let's try that again — something went wrong."); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <WarmTextarea label="What memory or message do you want to capture?" value={prompt} onChange={setPrompt}
        placeholder="e.g. A birthday message for Grandma, the day we moved into our new home, our first camping trip together…" rows={3} />
      <WarmBtn onClick={handleGenerate} disabled={!prompt.trim() || loading} color="#fb7185" className="flex items-center gap-2">
        {loading && <WarmSpinner />}💌 Create Memory Card
      </WarmBtn>
      {error && <p className="text-[13px]" style={{ color: "#ef4444" }}>{error}</p>}
      {result && (
        <WarmCard style={{ background: "linear-gradient(135deg, #fff1f2, #fffbf5)", borderColor: "rgba(251,113,133,0.25)" }}>
          <div className="text-center mb-4">
            <span className="text-4xl">💌</span>
          </div>
          <p className="font-black text-[18px] text-center mb-3" style={{ color: WARM_TEXT }}>{result.headline}</p>
          <p className="text-[14px] leading-relaxed text-center" style={{ color: "#44403c" }}>{result.body}</p>
          {result.closing && (
            <p className="text-[13px] italic text-center mt-3" style={{ color: "#fb7185" }}>{result.closing}</p>
          )}
          <div className="mt-4 flex justify-center">
            <WarmBtn onClick={() => onSave(result.headline, result.body)} small color="#34d399">💾 Save to Gallery</WarmBtn>
          </div>
        </WarmCard>
      )}
    </div>
  );
}

// ─── Creation Tool: Family Challenges ────────────────────────────────────────

function FamilyChallengesToolComp({ onSave }: { onSave: (title: string, desc: string) => void }) {
  const [prompt, setPrompt]   = useState("");
  const [result, setResult]   = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true); setError("");
    try {
      const raw = await callGenerate(
        `You are a fun family activity planner. Create a warm, fun family challenge based on: "${prompt}". Respond with JSON only: {"title":"...","description":"...","characters":["family roles like Captain, Navigator, Artist, etc."],"rules":["simple fun rules"],"world":"what makes this special for families"}`
      );
      const parsed = parseJSON<GameResult>(raw, { title: "Family Challenge", description: raw, characters: [], rules: [], world: "" });
      setResult(parsed);
    } catch { setError("Let's try that again — something went wrong."); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <WarmTextarea label="Describe a challenge or activity for your family" value={prompt} onChange={setPrompt}
        placeholder="e.g. A weekend kindness challenge, a family cooking contest, a creative building challenge with everyday items…" rows={3} />
      <WarmBtn onClick={handleGenerate} disabled={!prompt.trim() || loading} color="#34d399" className="flex items-center gap-2">
        {loading && <WarmSpinner />}🌟 Create Challenge
      </WarmBtn>
      {error && <p className="text-[13px]" style={{ color: "#ef4444" }}>{error}</p>}
      {result && (
        <WarmCard style={{ background: "#f0fdf4" }}>
          <p className="font-black text-[17px] mb-2" style={{ color: WARM_TEXT }}>{result.title}</p>
          <p className="text-[13px] leading-relaxed mb-3" style={{ color: WARM_TEXT }}>{result.description}</p>
          {result.characters.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#16a34a" }}>Roles</p>
              <div className="flex flex-wrap gap-1.5">
                {result.characters.map((c, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{ background: "#dcfce7", color: "#15803d" }}>✦ {c}</span>
                ))}
              </div>
            </div>
          )}
          {result.rules.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#16a34a" }}>How to play</p>
              <ol className="space-y-1">
                {result.rules.map((r, i) => (
                  <li key={i} className="flex gap-2 text-[12px]" style={{ color: WARM_TEXT }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: "#86efac", color: "#14532d" }}>{i + 1}</span>
                    {r}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {result.world && (
            <div className="rounded-2xl p-3" style={{ background: "#dcfce7" }}>
              <p className="text-[12px]" style={{ color: "#14532d" }}>💚 {result.world}</p>
            </div>
          )}
          <div className="mt-4">
            <WarmBtn onClick={() => onSave(result.title, result.description)} small color="#34d399">💾 Save to Gallery</WarmBtn>
          </div>
        </WarmCard>
      )}
    </div>
  );
}

// ─── Creation Tool: Invention Ideas ──────────────────────────────────────────

function InventionIdeasTool({ onSave }: { onSave: (title: string, desc: string) => void }) {
  const [prompt, setPrompt]   = useState("");
  const [result, setResult]   = useState<AppResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true); setError("");
    try {
      const raw = await callGenerate(
        `You are a warm, encouraging inventor's guide for families. Create a fun invention idea based on: "${prompt}". Respond with JSON only: {"name":"...","screens":["what this invention does in simple steps"],"features":["fun features anyone can appreciate"],"flow":"how the family could build or enjoy this together"}`
      );
      const parsed = parseJSON<AppResult>(raw, { name: "Family Invention", screens: [], features: [], flow: raw });
      setResult(parsed);
    } catch { setError("Let's try that again — something went wrong."); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <WarmTextarea label="What do you want to invent or create?" value={prompt} onChange={setPrompt}
        placeholder="e.g. A robot that helps with chores, a machine that turns vegetables into candy, an app that reminds us to be kind…" rows={3} />
      <WarmBtn onClick={handleGenerate} disabled={!prompt.trim() || loading} color="#38bdf8" className="flex items-center gap-2">
        {loading && <WarmSpinner />}💡 Build My Idea
      </WarmBtn>
      {error && <p className="text-[13px]" style={{ color: "#ef4444" }}>{error}</p>}
      {result && (
        <WarmCard style={{ background: "#f0f9ff" }}>
          <p className="font-black text-[17px] mb-3" style={{ color: WARM_TEXT }}>{result.name}</p>
          {result.screens.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#0284c7" }}>How it works</p>
              <div className="space-y-1.5">
                {result.screens.map((s, i) => (
                  <div key={i} className="flex gap-2 text-[12px]" style={{ color: WARM_TEXT }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: "#bae6fd", color: "#0c4a6e" }}>{i + 1}</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.features.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#0284c7" }}>Special features</p>
              <div className="flex flex-wrap gap-1.5">
                {result.features.map((f, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{ background: "#e0f2fe", color: "#075985" }}>⚡ {f}</span>
                ))}
              </div>
            </div>
          )}
          {result.flow && (
            <div className="rounded-2xl p-3" style={{ background: "#bae6fd44" }}>
              <p className="text-[12px] leading-relaxed" style={{ color: "#0c4a6e" }}>🤝 {result.flow}</p>
            </div>
          )}
          <div className="mt-4">
            <WarmBtn onClick={() => onSave(result.name, result.features.join(", "))} small color="#34d399">💾 Save to Gallery</WarmBtn>
          </div>
        </WarmCard>
      )}
    </div>
  );
}

// ─── Create Tab ───────────────────────────────────────────────────────────────

type Tool = "story" | "art" | "video" | "memory" | "challenge" | "invention" | null;

const TOOLS: { id: Tool & string; icon: string; label: string; subtitle: string; color: string }[] = [
  { id: "story",     icon: "📖", label: "Story Maker",      subtitle: "Write a family story",         color: "#fb7185" },
  { id: "art",       icon: "🎨", label: "Art Studio",       subtitle: "Create an art idea",            color: "#f59e0b" },
  { id: "video",     icon: "🎬", label: "Video Moments",    subtitle: "Plan a family video",           color: "#a78bfa" },
  { id: "memory",    icon: "💌", label: "Memory Cards",     subtitle: "Capture a special moment",      color: "#fb7185" },
  { id: "challenge", icon: "🌟", label: "Family Challenges",subtitle: "Create a family activity",      color: "#34d399" },
  { id: "invention", icon: "💡", label: "Invention Ideas",  subtitle: "Dream up something new",        color: "#38bdf8" },
];

function CreateTab({ onSaveToGallery }: { onSaveToGallery: (title: string, type: Creation["type"], desc: string) => void }) {
  const [activeTool, setActiveTool] = useState<Tool>(null);

  const toolTypeMap: Record<string, Creation["type"]> = {
    story: "story", art: "art", video: "video",
    memory: "idea", challenge: "game", invention: "app",
  };

  function saveHandler(title: string, desc: string) {
    const type = toolTypeMap[activeTool ?? ""] ?? "idea";
    onSaveToGallery(title, type, desc);
    setActiveTool(null);
  }

  if (activeTool) {
    const tool = TOOLS.find(t => t.id === activeTool)!;
    return (
      <div>
        <button onClick={() => setActiveTool(null)}
          className="flex items-center gap-2 mb-5 text-[13px] font-semibold" style={{ color: WARM_MUTED }}>
          ← Back to Create
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: tool.color + "20" }}>{tool.icon}</div>
          <div>
            <h2 className="font-black text-[18px]" style={{ color: WARM_TEXT }}>{tool.label}</h2>
            <p className="text-[12px]" style={{ color: WARM_MUTED }}>{tool.subtitle}</p>
          </div>
        </div>
        {activeTool === "story"     && <StoryMakerTool onSave={saveHandler} />}
        {activeTool === "art"       && <ArtStudioTool onSave={saveHandler} />}
        {activeTool === "video"     && <VideoMomentsTool onSave={saveHandler} />}
        {activeTool === "memory"    && <MemoryCardsTool onSave={saveHandler} />}
        {activeTool === "challenge" && <FamilyChallengesToolComp onSave={saveHandler} />}
        {activeTool === "invention" && <InventionIdeasTool onSave={saveHandler} />}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-black text-[22px] mb-1" style={{ color: WARM_TEXT }}>Create Something</h2>
        <p className="text-[13px]" style={{ color: WARM_MUTED }}>
          Pick a tool and let your imagination lead the way.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {TOOLS.map(tool => (
          <button key={tool.id} onClick={() => setActiveTool(tool.id as Tool)}
            className="flex flex-col items-start gap-2 p-4 rounded-2xl text-left transition-all active:scale-95"
            style={{ background: tool.color + "12", border: `1.5px solid ${tool.color}22` }}>
            <span className="text-3xl">{tool.icon}</span>
            <div>
              <p className="font-bold text-[13px]" style={{ color: WARM_TEXT }}>{tool.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: WARM_MUTED }}>{tool.subtitle}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Gentle helper hint */}
      <WarmCard style={{ background: "#fef9f0", borderColor: "rgba(245,158,11,0.2)", padding: "14px 16px" }}>
        <div className="flex gap-3 items-start">
          <span className="text-xl flex-shrink-0">🌸</span>
          <p className="text-[13px]" style={{ color: "#78716c" }}>
            Not sure where to start? Try the Story Maker — just describe any moment or idea and we'll turn it into something beautiful.
          </p>
        </div>
      </WarmCard>
    </div>
  );
}

// ─── Gallery Tab ──────────────────────────────────────────────────────────────

const CREATION_TYPES = ["video", "game", "app", "story", "art", "idea", "other"] as const;
const TYPE_ICONS: Record<string, string> = {
  video: "🎬", game: "🌟", app: "💡", story: "📖", art: "🎨", idea: "✨", other: "⭐",
};
const TYPE_LABELS: Record<string, string> = {
  video: "Video", game: "Challenge", app: "Invention", story: "Story", art: "Art", idea: "Idea", other: "Other",
};

function GalleryTab({ creations, onAdd, onDelete }: {
  creations: Creation[];
  onAdd: (c: Omit<Creation, "id" | "date">) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: "", type: "idea" as Creation["type"], creator: "", description: "", image: "" });
  const imgRef                  = useRef<HTMLInputElement>(null);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, image: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }

  function handleAdd() {
    if (!form.title.trim()) return;
    onAdd(form);
    setForm({ title: "", type: "idea", creator: "", description: "", image: "" });
    setShowForm(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-[22px]" style={{ color: WARM_TEXT }}>Family Gallery</h2>
          <p className="text-[13px]" style={{ color: WARM_MUTED }}>
            {creations.length} creation{creations.length !== 1 ? "s" : ""} and counting
          </p>
        </div>
        <WarmBtn onClick={() => setShowForm(v => !v)} variant="soft" small>+ Add</WarmBtn>
      </div>

      {showForm && (
        <WarmCard>
          <p className="font-bold text-[15px] mb-4" style={{ color: WARM_TEXT }}>Add a Creation 🎉</p>
          <div className="space-y-3">
            <WarmInput label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="What did you create?" />
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wide" style={{ color: WARM_MUTED }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Creation["type"] }))}
                className="w-full rounded-2xl px-4 py-3 text-[13px] outline-none"
                style={{ border: `1.5px solid rgba(245,158,11,0.2)`, background: "#fffdf9", color: WARM_TEXT, fontFamily: "'Inter',sans-serif" }}>
                {CREATION_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <WarmInput label="Creator" value={form.creator} onChange={v => setForm(f => ({ ...f, creator: v }))} placeholder="Who made this?" />
            <WarmTextarea label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Tell us about it…" rows={2} />
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: WARM_MUTED }}>Photo (optional)</label>
              <div className="flex items-center gap-3">
                {form.image
                  ? <img src={form.image} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                  : <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ background: "#fef3c7" }}>{TYPE_ICONS[form.type]}</div>}
                <WarmBtn variant="soft" small onClick={() => imgRef.current?.click()}>Upload Photo</WarmBtn>
                <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <WarmBtn onClick={handleAdd} disabled={!form.title.trim()}>Add to Gallery</WarmBtn>
              <WarmBtn variant="ghost" onClick={() => setShowForm(false)}>Cancel</WarmBtn>
            </div>
          </div>
        </WarmCard>
      )}

      {creations.length === 0 ? (
        <WarmCard style={{ textAlign: "center", padding: 36 }}>
          <div className="text-4xl mb-3">🖼️</div>
          <p className="font-bold text-[15px]" style={{ color: WARM_TEXT }}>Your gallery is waiting</p>
          <p className="text-[13px] mt-1" style={{ color: WARM_MUTED }}>Create something and save it here, or add a memory directly.</p>
        </WarmCard>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {creations.map(c => (
            <WarmCard key={c.id} style={{ padding: 0, overflow: "hidden", position: "relative" }}>
              {c.image
                ? <img src={c.image} alt={c.title} className="w-full h-28 object-cover" />
                : <div className="w-full h-28 flex items-center justify-center text-4xl"
                    style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>
                    {TYPE_ICONS[c.type]}
                  </div>}
              <div className="p-3">
                <p className="font-bold text-[12px] truncate" style={{ color: WARM_TEXT }}>{c.title}</p>
                <p className="text-[10px] mt-0.5" style={{ color: WARM_MUTED }}>
                  {TYPE_LABELS[c.type]} · {c.creator || "Family"}
                </p>
              </div>
              <button onClick={() => onDelete(c.id)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-[11px]"
                style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }}>×</button>
            </WarmCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Family Tab — Profile list & member detail view ──────────────────────────

function MemberPage({ profile, index, onBack }: { profile: Profile; index: number; onBack: () => void }) {
  const color = memberColor(index);
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 mb-5 text-[13px] font-semibold" style={{ color: WARM_MUTED }}>
        ← Back to Family
      </button>

      {/* Header */}
      <div className="rounded-3xl p-6 mb-5 flex flex-col items-center text-center"
        style={{ background: `linear-gradient(135deg, ${color}22, ${color}10)`, border: `1.5px solid ${color}30` }}>
        <div className="w-20 h-20 rounded-full overflow-hidden mb-3 flex items-center justify-center text-4xl font-bold"
          style={{ background: color + "30", color }}>
          {profile.avatar
            ? <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            : profile.name.charAt(0)}
        </div>
        <h2 className="font-black text-[22px]" style={{ color: WARM_TEXT }}>{profile.name}</h2>
        <p className="text-[13px] mt-1 max-w-xs" style={{ color: WARM_MUTED }}>{profile.bio}</p>
      </div>

      {/* Description */}
      <WarmCard style={{ marginBottom: 16 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color }}>This is who I am</p>
        <p className="text-[13px] leading-relaxed" style={{ color: WARM_TEXT }}>
          This is {profile.name}'s page — a place to celebrate everything they bring to our family.
          Their creativity, their kindness, and their unique light.
        </p>
        <p className="text-[13px] leading-relaxed mt-2" style={{ color: WARM_TEXT }}>
          "This is who I am, and this is what I bring to our family."
        </p>
      </WarmCard>

      {/* Kindness highlights */}
      <WarmCard style={{ background: "#fffbf0", marginBottom: 16 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: WARM_PRIMARY }}>Kindness highlights 💛</p>
        <div className="space-y-2">
          {["Shows up for family", "Brings creativity and joy", "Cares deeply about others"].map(h => (
            <div key={h} className="flex items-center gap-2 text-[13px]" style={{ color: WARM_TEXT }}>
              <span style={{ color: WARM_PRIMARY }}>✦</span>{h}
            </div>
          ))}
        </div>
      </WarmCard>

      {/* Social links */}
      {(profile.instagram || profile.tiktok || profile.youtube || profile.snapchat) && (
        <WarmCard>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: WARM_MUTED }}>Find me here</p>
          <div className="flex flex-wrap gap-2">
            {profile.instagram && <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
              style={{ background: "#fce7f3", color: "#be185d" }}>📸 Instagram</a>}
            {profile.tiktok && <a href={`https://tiktok.com/@${profile.tiktok}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
              style={{ background: "#f3e8ff", color: "#7c3aed" }}>🎵 TikTok</a>}
            {profile.youtube && <a href={`https://youtube.com/@${profile.youtube}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
              style={{ background: "#fee2e2", color: "#dc2626" }}>▶️ YouTube</a>}
            {profile.snapchat && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
              style={{ background: "#fef9c3", color: "#a16207" }}>👻 {profile.snapchat}</span>}
          </div>
        </WarmCard>
      )}
    </div>
  );
}

function FamilyTab() {
  const [profiles, setProfiles]   = useState<Profile[]>(() => {
    const saved = loadLS<Profile[] | null>("fh_profiles", null);
    return (saved && saved.length > 0) ? saved : DEFAULT_PROFILES;
  });
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState({ name: "", bio: "", avatar: "", instagram: "", tiktok: "", youtube: "", snapchat: "" });
  const [showInvite, setShowInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied]         = useState(false);
  const avatarRef                   = useRef<HTMLInputElement>(null);

  useEffect(() => saveLS("fh_profiles", profiles), [profiles]);

  const viewingProfile = profiles.find(p => p.id === viewingId);
  const viewingIndex   = profiles.findIndex(p => p.id === viewingId);

  if (viewingProfile) {
    return <MemberPage profile={viewingProfile} index={viewingIndex} onBack={() => setViewingId(null)} />;
  }

  function openAdd() {
    setForm({ name: "", bio: "", avatar: "", instagram: "", tiktok: "", youtube: "", snapchat: "" });
    setEditId(null); setShowForm(true);
  }
  function openEdit(p: Profile) {
    setForm({ name: p.name, bio: p.bio, avatar: p.avatar, instagram: p.instagram, tiktok: p.tiktok, youtube: p.youtube, snapchat: p.snapchat });
    setEditId(p.id); setShowForm(true);
  }
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
    setShowForm(false); setEditId(null);
  }
  function handleDelete(id: string) { setProfiles(ps => ps.filter(p => p.id !== id)); }

  // Invite
  function generateToken() {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }
  function handleGenerate() {
    const base = window.location.origin + (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
    setInviteLink(`${base}/family-hub?invite=${generateToken()}`);
    setCopied(false);
  }
  async function handleCopy() {
    try { await navigator.clipboard.writeText(inviteLink); }
    catch {
      const el = document.createElement("textarea");
      el.value = inviteLink; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-[22px]" style={{ color: WARM_TEXT }}>Our Family</h2>
          <p className="text-[13px]" style={{ color: WARM_MUTED }}>{profiles.length} members</p>
        </div>
        <WarmBtn onClick={openAdd} variant="soft" small>+ Add Member</WarmBtn>
      </div>

      {/* Profile form */}
      {showForm && (
        <WarmCard>
          <p className="font-bold text-[15px] mb-4" style={{ color: WARM_TEXT }}>{editId ? "Edit Profile" : "Add a Family Member"} 💛</p>
          <div className="space-y-3">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              {form.avatar
                ? <img src={form.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
                : <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                    style={{ background: "#fef3c7", color: WARM_PRIMARY }}>
                    {form.name.charAt(0) || "?"}
                  </div>}
              <WarmBtn variant="soft" small onClick={() => avatarRef.current?.click()}>📷 Upload Photo</WarmBtn>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <WarmInput label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Family member's name" />
            <WarmTextarea label="A little about them" value={form.bio} onChange={v => setForm(f => ({ ...f, bio: v }))} placeholder="What makes them special?" rows={2} />
            <p className="text-[11px] font-bold uppercase tracking-widest pt-1" style={{ color: WARM_MUTED }}>Social media (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <WarmInput label="Instagram" value={form.instagram} onChange={v => setForm(f => ({ ...f, instagram: v }))} placeholder="@username" />
              <WarmInput label="TikTok"    value={form.tiktok}    onChange={v => setForm(f => ({ ...f, tiktok: v }))}    placeholder="@username" />
              <WarmInput label="YouTube"   value={form.youtube}   onChange={v => setForm(f => ({ ...f, youtube: v }))}   placeholder="@channel" />
              <WarmInput label="Snapchat"  value={form.snapchat}  onChange={v => setForm(f => ({ ...f, snapchat: v }))}  placeholder="@username" />
            </div>
            <div className="flex gap-2 pt-1">
              <WarmBtn onClick={handleSave} disabled={!form.name.trim()}>{editId ? "Save Changes" : "Add to Family"}</WarmBtn>
              <WarmBtn variant="ghost" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</WarmBtn>
            </div>
          </div>
        </WarmCard>
      )}

      {/* Profile grid */}
      <div className="grid grid-cols-2 gap-3">
        {profiles.map((p, i) => {
          const color = memberColor(i);
          return (
            <button key={p.id} onClick={() => setViewingId(p.id)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center transition-all active:scale-95"
              style={{ background: color + "12", border: `1.5px solid ${color}22` }}>
              <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold"
                style={{ background: color + "25", color }}>
                {p.avatar
                  ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  : p.name.charAt(0)}
              </div>
              <p className="font-bold text-[13px]" style={{ color: WARM_TEXT }}>{p.name}</p>
              <p className="text-[10px] leading-tight line-clamp-2" style={{ color: WARM_MUTED }}>{p.bio}</p>
              <div className="flex gap-1.5 mt-1">
                <button onClick={e => { e.stopPropagation(); openEdit(p); }}
                  className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                  style={{ background: "rgba(0,0,0,0.06)", color: WARM_MUTED }}>Edit</button>
                <button onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                  className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>Remove</button>
              </div>
            </button>
          );
        })}
      </div>

      {/* Invite section */}
      <WarmCard style={{ background: "#fffbf0" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-bold text-[14px]" style={{ color: WARM_TEXT }}>🔗 Invite Family Members</p>
            <p className="text-[12px] mt-0.5" style={{ color: WARM_MUTED }}>Share your universe privately</p>
          </div>
          <WarmBtn variant="soft" small onClick={() => setShowInvite(v => !v)}>
            {showInvite ? "Close" : "Get Link"}
          </WarmBtn>
        </div>

        {showInvite && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {["Your sister", "Her children", "Her grandchildren", "Any family member"].map(who => (
                <span key={who} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "#fef3c7", color: "#92400e" }}>
                  ✓ {who}
                </span>
              ))}
            </div>
            <WarmBtn onClick={handleGenerate} small>🔗 Generate Invite Link</WarmBtn>
            {inviteLink && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="text" readOnly value={inviteLink}
                    onClick={e => (e.target as HTMLInputElement).select()}
                    className="flex-1 rounded-2xl px-3 py-2.5 text-[11px] outline-none font-mono cursor-text"
                    style={{ border: `1.5px solid rgba(245,158,11,0.25)`, background: "#fffdf9", color: "#92400e" }} />
                  <WarmBtn onClick={handleCopy} small color={copied ? "#34d399" : WARM_PRIMARY}>
                    {copied ? "✓ Copied!" : "Copy"}
                  </WarmBtn>
                </div>
                <p className="text-[11px]" style={{ color: WARM_MUTED }}>Share via text, email, or iMessage. Anyone with the link lands right here.</p>
              </div>
            )}
          </div>
        )}
      </WarmCard>
    </div>
  );
}

// ─── Rewards Tab (Family Bank) ────────────────────────────────────────────────

const REWARD_TYPES: Transaction["type"][] = ["earning", "reward", "goal", "expense"];
const REWARD_ICONS: Record<string, string> = {
  earning: "💰", reward: "🌟", goal: "🎯", expense: "💸",
};
const REWARD_LABELS: Record<string, string> = {
  earning: "Earning", reward: "Kindness Reward", goal: "Goal Reached", expense: "Spent",
};

function RewardsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadLS("fh_bank", []));
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState({ amount: "", description: "", type: "reward" as Transaction["type"] });

  useEffect(() => saveLS("fh_bank", transactions), [transactions]);

  const balance = transactions.reduce((s, t) => t.type === "expense" ? s - t.amount : s + t.amount, 0);

  function handleAdd() {
    const amt = parseFloat(form.amount);
    if (!form.description.trim() || isNaN(amt) || amt <= 0) return;
    setTransactions(ts => [{ id: Date.now().toString(), date: new Date().toLocaleDateString(), description: form.description, amount: amt, type: form.type }, ...ts]);
    setForm({ amount: "", description: "", type: "reward" });
    setShowForm(false);
  }

  return (
    <div className="space-y-5">
      {/* Balance */}
      <div className="rounded-3xl p-6 text-center"
        style={{ background: "linear-gradient(135deg, #fde68a 0%, #fca5a5 100%)" }}>
        <p className="text-[13px] font-semibold mb-1" style={{ color: "rgba(28,20,18,0.65)" }}>Family Balance</p>
        <p className="font-black text-[44px] leading-none" style={{ color: WARM_TEXT, letterSpacing: "-1px" }}>
          ${balance.toFixed(2)}
        </p>
        <p className="text-[12px] mt-2" style={{ color: "rgba(28,20,18,0.55)" }}>
          {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="font-bold text-[15px]" style={{ color: WARM_TEXT }}>Rewards & Earnings 🌟</p>
        <WarmBtn onClick={() => setShowForm(v => !v)} variant="soft" small>+ Add</WarmBtn>
      </div>

      {showForm && (
        <WarmCard>
          <p className="font-bold text-[15px] mb-4" style={{ color: WARM_TEXT }}>Add a Transaction</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {REWARD_TYPES.map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className="flex items-center gap-2 p-3 rounded-2xl text-[12px] font-semibold transition-all"
                  style={form.type === t
                    ? { background: WARM_PRIMARY, color: "#fff" }
                    : { background: "#fef3c7", color: "#78716c" }}>
                  <span>{REWARD_ICONS[t]}</span>{REWARD_LABELS[t]}
                </button>
              ))}
            </div>
            <WarmInput label="Amount ($)" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} placeholder="0.00" type="number" />
            <WarmInput label="What was this for?" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="e.g. Helped with dinner, finished a book…" />
            <div className="flex gap-2">
              <WarmBtn onClick={handleAdd} disabled={!form.description.trim() || !form.amount}>Add Transaction</WarmBtn>
              <WarmBtn variant="ghost" onClick={() => setShowForm(false)}>Cancel</WarmBtn>
            </div>
          </div>
        </WarmCard>
      )}

      {transactions.length === 0 ? (
        <WarmCard style={{ textAlign: "center", padding: 36 }}>
          <div className="text-4xl mb-3">🌟</div>
          <p className="font-bold text-[15px]" style={{ color: WARM_TEXT }}>Start tracking family rewards</p>
          <p className="text-[13px] mt-1" style={{ color: WARM_MUTED }}>Celebrate earnings, kindness, and goals reached.</p>
        </WarmCard>
      ) : (
        <div className="space-y-2.5">
          {transactions.map(t => {
            const isExpense = t.type === "expense";
            return (
              <WarmCard key={t.id} style={{ padding: "14px 16px" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: isExpense ? "#fee2e2" : "#fef3c7" }}>
                      {REWARD_ICONS[t.type]}
                    </div>
                    <div>
                      <p className="font-semibold text-[13px]" style={{ color: WARM_TEXT }}>{t.description}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: WARM_MUTED }}>
                        {REWARD_LABELS[t.type]} · {t.date}
                      </p>
                    </div>
                  </div>
                  <p className="font-black text-[15px] flex-shrink-0"
                    style={{ color: isExpense ? "#ef4444" : "#16a34a" }}>
                    {isExpense ? "−" : "+"}${t.amount.toFixed(2)}
                  </p>
                </div>
              </WarmCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Family Chat (floating panel) ─────────────────────────────────────────────

function FamilyChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadLS("fh_chat", []));
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => saveLS("fh_chat", messages), [messages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", text: input.trim(), ts };
    setMessages(ms => [...ms, userMsg]);
    setInput(""); setLoading(true);
    try {
      const reply = await callGenerate(
        `You are a warm, gentle family helper. A family member says: "${input.trim()}". Respond warmly, briefly, and kindly — like a caring friend. No technical language. Keep it under 3 sentences.`
      );
      setMessages(ms => [...ms, { id: Date.now().toString() + "a", role: "ai", text: reply, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } catch {
      setMessages(ms => [...ms, { id: Date.now().toString() + "e", role: "ai", text: "I'm here with you! Something went quiet for a moment — try again?", ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rounded-t-3xl flex flex-col" style={{ background: "#fff", maxHeight: "75vh", boxShadow: "0 -8px 32px rgba(0,0,0,0.12)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${WARM_BORDER}` }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌸</span>
            <div>
              <p className="font-bold text-[14px]" style={{ color: WARM_TEXT }}>Family Helper</p>
              <p className="text-[11px]" style={{ color: WARM_MUTED }}>Always here for you</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
            style={{ background: "#f5f5f4", color: WARM_MUTED }}>×</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">🌸</div>
              <p className="text-[13px]" style={{ color: WARM_MUTED }}>Want to add a memory? Need help creating something? Just ask.</p>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "ai" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                  style={{ background: "#fef3c7" }}>🌸</div>
              )}
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${m.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`}
                style={m.role === "user"
                  ? { background: WARM_PRIMARY, color: "#fff" }
                  : { background: "#fef9f0", color: WARM_TEXT }}>
                {m.text}
                <div className="text-[10px] mt-1" style={{ color: m.role === "user" ? "rgba(255,255,255,0.65)" : WARM_MUTED }}>{m.ts}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: "#fef3c7" }}>🌸</div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2"
                style={{ background: "#fef9f0" }}>
                <WarmSpinner /><span className="text-[12px]" style={{ color: WARM_MUTED }}>Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-6 pt-3 flex gap-2" style={{ borderTop: `1px solid ${WARM_BORDER}` }}>
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask anything…" disabled={loading}
            className="flex-1 rounded-2xl px-4 py-3 text-[13px] outline-none"
            style={{ border: `1.5px solid rgba(245,158,11,0.2)`, background: "#fffdf9", color: WARM_TEXT, fontFamily: "'Inter',sans-serif" }} />
          <WarmBtn onClick={handleSend} disabled={!input.trim() || loading} small>Send</WarmBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Main Universe App ────────────────────────────────────────────────────────

function FamilyUniverseApp() {
  const [, navigate]            = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showChat, setShowChat]   = useState(false);

  // Shared state lifted for Home tab to read
  const [profiles]   = useState<Profile[]>(() => { const s = loadLS<Profile[] | null>("fh_profiles", null); return s && s.length > 0 ? s : DEFAULT_PROFILES; });
  const [creations, setCreations] = useState<Creation[]>(() => loadLS("fh_gallery", []));
  const [messages]   = useState<ChatMessage[]>(() => loadLS("fh_chat", []));

  useEffect(() => saveLS("fh_gallery", creations), [creations]);

  function addToGallery(title: string, type: Creation["type"], desc: string) {
    setCreations(c => [{ id: Date.now().toString(), title, type, creator: "Family", description: desc, image: "", date: new Date().toLocaleDateString() }, ...c]);
    setActiveTab("gallery");
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: WARM_BG, fontFamily: "'Inter',sans-serif" }}>

      {/* Top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-5 py-3"
        style={{ background: "rgba(255,251,245,0.95)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${WARM_BORDER}` }}>
        <button onClick={() => navigate("/")}
          className="text-[13px] font-semibold" style={{ color: WARM_MUTED }}>← Back</button>
        <div className="flex items-center gap-2">
          <span className="text-lg">🌟</span>
          <span className="font-black text-[15px]" style={{ color: WARM_TEXT }}>Family Universe</span>
        </div>
        <div className="w-12" />
      </div>

      {/* Page content */}
      <div className="max-w-lg mx-auto px-5 pt-6">
        {activeTab === "home"    && <HomeTab profiles={profiles} creations={creations} messages={messages} onTabSwitch={setActiveTab} />}
        {activeTab === "create"  && <CreateTab onSaveToGallery={addToGallery} />}
        {activeTab === "gallery" && <GalleryTab
          creations={creations}
          onAdd={c => setCreations(cs => [{ id: Date.now().toString(), ...c, date: new Date().toLocaleDateString() }, ...cs])}
          onDelete={id => setCreations(cs => cs.filter(x => x.id !== id))} />}
        {activeTab === "family"  && <FamilyTab />}
        {activeTab === "rewards" && <RewardsTab />}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40"
        style={{ background: "rgba(255,251,245,0.97)", backdropFilter: "blur(10px)", borderTop: `1px solid ${WARM_BORDER}` }}>
        <div className="max-w-lg mx-auto flex">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center gap-1 py-3 transition-all"
                style={{ color: active ? WARM_PRIMARY : WARM_MUTED }}>
                <span className="text-[20px]">{tab.icon}</span>
                <span className="text-[10px] font-semibold">{tab.label}</span>
                {active && <div className="w-1 h-1 rounded-full" style={{ background: WARM_PRIMARY }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating helper button */}
      <button onClick={() => setShowChat(true)}
        className="fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-2xl transition-all active:scale-95"
        style={{ background: "linear-gradient(135deg, #f59e0b, #fb7185)", boxShadow: "0 8px 28px rgba(245,158,11,0.45)" }}
        aria-label="Open family helper">
        🌸
      </button>

      {/* Chat panel */}
      {showChat && <FamilyChatPanel onClose={() => setShowChat(false)} />}
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export default function FamilyHubPage() {
  const [entered, setEntered] = useState(() => sessionStorage.getItem("fhu_v2_entered") === "1");

  if (!entered) {
    return (
      <WelcomeScreen onEnter={() => {
        sessionStorage.setItem("fhu_v2_entered", "1");
        setEntered(true);
      }} />
    );
  }

  return <FamilyUniverseApp />;
}
