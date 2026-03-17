import React, { useState, useEffect } from "react";
import { useOS, AppId } from "./OSContext";
import { PlatformStore, RecentActivity, PlatformMode } from "@/engine/PlatformStore";
import { BrainstormChat } from "./BrainstormChat";
import { useAuth } from "@workspace/replit-auth-web";

const QUICK_ACTIONS = [
  { icon: "✨", label: "Create Anything", sub: "Docs, content & apps",   app: "creator"    as AppId, color: "#6366f1" },
  { icon: "💬", label: "AI Chat",         sub: "Talk to the Brain",      app: "chat"       as AppId, color: "#06b6d4" },
  { icon: "🧪", label: "Simulate",        sub: "Analyze & forecast",     app: "simulation" as AppId, color: "#a855f7" },
  { icon: "📣", label: "Marketing",       sub: "Campaigns & content",    app: "marketing"  as AppId, color: "#f472b6" },
];

const FALLBACK_RECENTS: RecentActivity[] = [
  { id: "f1", appId: "chat",       label: "AI Chat — Main Brain",            icon: "💬", at: new Date().toISOString() },
  { id: "f2", appId: "projects",   label: "Healthcare System – Legal Safe",  icon: "📁", at: new Date().toISOString() },
  { id: "f3", appId: "marketing",  label: "Brand Kit Draft",                 icon: "📣", at: new Date().toISOString() },
  { id: "f4", appId: "people",     label: "People — invites pending",        icon: "👥", at: new Date().toISOString() },
];

const MODE_CFG: Record<PlatformMode, { label: string; color: string; dot: string; bg: string; border: string; text: string }> = {
  DEMO: { label: "Demo",  color: "#f97316", dot: "#f97316", bg: "#fff7ed", border: "#fed7aa", text: "#c2410c" },
  TEST: { label: "Test",  color: "#6366f1", dot: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", text: "#4338ca" },
  LIVE: { label: "Live",  color: "#16a34a", dot: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
};

const INTENT_SUGGESTIONS = [
  "Simulate a business model",
  "Generate a marketing brochure",
  "Create a landing page funnel",
  "Build a content calendar",
  "Chat with the Brain",
  "Write a pitch deck",
  "Create an email sequence",
  "Run a gap analysis",
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

interface DashboardProps {
  onHamburger?: () => void;
  isNarrow?: boolean;
  onShowTour?: () => void;
}

export function Dashboard({ onHamburger, onShowTour }: DashboardProps) {
  const { openApp, appRegistry, routeIntent, platformMode, setPlatformMode, activeApp } = useOS();
  const { user } = useAuth();
  const displayName = user?.firstName || user?.email?.split("@")[0] || "";
  const [intentInput, setIntentInput]         = useState("");
  const [intentResult, setIntentResult]       = useState<{ app: AppId; label: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recents, setRecents]                 = useState<RecentActivity[]>([]);
  const [showModeMenu, setShowModeMenu]       = useState(false);
  const [showBrainstorm, setShowBrainstorm]   = useState(false);
  const [mounted, setMounted]                 = useState(false);

  const cfg = MODE_CFG[platformMode];

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const load = () => {
      const stored = PlatformStore.getRecent();
      setRecents(stored.length > 0 ? stored : FALLBACK_RECENTS);
    };
    load();
    window.addEventListener("cai:mode-change", load);
    return () => window.removeEventListener("cai:mode-change", load);
  }, []);

  useEffect(() => {
    const stored = PlatformStore.getRecent();
    setRecents(stored.length > 0 ? stored : FALLBACK_RECENTS);
  }, [activeApp]);

  const handleIntentSearch = (query: string) => {
    if (!query.trim()) { setIntentResult(null); return; }
    const targetId = routeIntent(query);
    if (targetId) {
      const appDef = appRegistry.find(a => a.id === targetId);
      setIntentResult({ app: targetId, label: appDef?.label ?? targetId });
    } else {
      setIntentResult({ app: "chat", label: "AI Chat" });
    }
  };

  const handleIntentSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (intentResult) { openApp(intentResult.app); setIntentInput(""); setIntentResult(null); }
    else openApp("chat");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: "hsl(220,20%,97%)" }}>

      {/* ── Top bar ── */}
      <header className="h-14 flex items-center px-4 gap-3 flex-shrink-0 z-10"
        style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>

        {onHamburger && (
          <button onClick={onHamburger} aria-label="Open navigation"
            className="w-8 h-8 flex flex-col items-center justify-center gap-[5px] rounded-xl transition-all duration-150 flex-shrink-0"
            style={{ color: "#6b7280" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <span className="w-4 h-[1.5px] rounded-full block" style={{ background: "#6b7280" }} />
            <span className="w-4 h-[1.5px] rounded-full block" style={{ background: "#6b7280" }} />
            <span className="w-4 h-[1.5px] rounded-full block" style={{ background: "#6b7280" }} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-[15px]" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
            CreateAI Brain
          </h1>
        </div>

        {/* Mode badge */}
        <div className="relative">
          <button
            onClick={() => setShowModeMenu(m => !m)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.dot }} />
            {cfg.label}
          </button>

          {showModeMenu && (
            <div className="absolute top-full right-0 mt-2 z-50 rounded-2xl p-2 shadow-xl min-w-[160px]"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
              {(["DEMO", "TEST", "LIVE"] as PlatformMode[]).map(m => (
                <button key={m} onClick={() => { setPlatformMode(m); setShowModeMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-all"
                  style={platformMode === m
                    ? { background: MODE_CFG[m].bg, color: MODE_CFG[m].text }
                    : { color: "#374151" }}
                  onMouseEnter={e => { if (platformMode !== m) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={e => { if (platformMode !== m) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: MODE_CFG[m].dot }} />
                  {MODE_CFG[m].label} Mode
                  {platformMode === m && <span className="ml-auto text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {onShowTour && (
          <button onClick={onShowTour}
            className="hidden sm:flex flex-shrink-0 text-[11px] font-semibold px-3 py-2 rounded-full items-center gap-1.5 transition-all"
            style={{ background: "#eef2ff", color: "#6366f1", border: "1px solid #c7d2fe" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#e0e7ff")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#eef2ff")}
          >
            ✦ Tour
          </button>
        )}

        <button onClick={() => openApp("chat")}
          className="flex-shrink-0 text-[12px] font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all"
          style={{ background: "#6366f1", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.30)" }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#4f46e5")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#6366f1")}
        >
          🧠 Ask the Brain
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-7">

          {/* ── Greeting ── */}
          <div className={`transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <p className="text-[13px] font-medium" style={{ color: "#6b7280" }}>{getGreeting()}{displayName ? `, ${displayName}` : ""} 👋</p>
            <h2 className="text-[24px] font-bold mt-0.5" style={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
              What would you like to create today?
            </h2>
          </div>

          {/* ── Brainstorm Banner ── */}
          <div className={`transition-opacity duration-500 delay-75 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <button
              onClick={() => setShowBrainstorm(true)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all group"
              style={{
                background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)",
                boxShadow: "0 4px 20px rgba(99,102,241,0.25)",
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = "0 6px 28px rgba(99,102,241,0.38)")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(99,102,241,0.25)")}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.18)" }}>
                🧠
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[15px] text-white" style={{ letterSpacing: "-0.01em" }}>
                  Brainstorm with AI
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.72)" }}>
                  Describe any idea — projects are built and organized automatically
                </p>
              </div>
              <div className="flex-shrink-0 text-white/60 text-[20px] group-hover:translate-x-1 transition-transform">›</div>
            </button>
          </div>

          {/* ── Search bar ── */}
          <div className={`relative transition-opacity duration-500 delay-75 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <form onSubmit={handleIntentSubmit}>
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
                style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.09)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
                onFocus={() => {}}
              >
                <span className="text-[18px] flex-shrink-0">🔍</span>
                <input
                  type="text"
                  value={intentInput}
                  onChange={e => { setIntentInput(e.target.value); handleIntentSearch(e.target.value); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
                  placeholder="Search apps, or tell the Brain what to build…"
                  className="flex-1 bg-transparent outline-none text-[14px] min-w-0"
                  style={{ color: "#0f172a" }}
                />
                {intentInput && (
                  <button type="submit"
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
                    style={{ background: "#6366f1", color: "#fff" }}
                  >
                    Go →
                  </button>
                )}
              </div>

              {intentResult && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl px-4 py-2.5 text-[13px] font-medium flex items-center justify-between z-10"
                  style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}
                >
                  <span className="text-white">→ Open {intentResult.label}</span>
                  <span className="text-white/60 text-[11px]">Press Enter</span>
                </div>
              )}

              {showSuggestions && !intentInput && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl p-3 shadow-xl z-10"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: "#9ca3af" }}>Try asking</p>
                  <div className="flex flex-wrap gap-1.5">
                    {INTENT_SUGGESTIONS.map(s => (
                      <button key={s} type="button"
                        onMouseDown={() => { setIntentInput(s); handleIntentSearch(s); }}
                        className="text-[11px] px-2.5 py-1 rounded-full transition-all"
                        style={{ background: "#f3f4f6", color: "#374151", border: "1px solid rgba(0,0,0,0.06)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#eef2ff"; (e.currentTarget as HTMLElement).style.color = "#6366f1"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f3f4f6"; (e.currentTarget as HTMLElement).style.color = "#374151"; }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* ── Quick Start ── */}
          <section className={`transition-opacity duration-500 delay-100 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>Quick Start</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map(a => (
                <button key={a.label} onClick={() => openApp(a.app)}
                  className="flex flex-col items-center gap-2.5 p-5 rounded-2xl text-center transition-all duration-200 group"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${a.color}25`; (e.currentTarget as HTMLElement).style.borderColor = `${a.color}40`; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: `${a.color}15` }}>
                    {a.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-[12px] leading-tight" style={{ color: "#0f172a" }}>{a.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#6b7280" }}>{a.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── All Apps ── */}
          <section className={`transition-opacity duration-500 delay-150 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>All Apps</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {appRegistry.map(app => (
                <button key={app.id} onClick={() => openApp(app.id as AppId)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all duration-150"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; (e.currentTarget as HTMLElement).style.borderColor = (app.color ?? "#6366f1") + "40"; (e.currentTarget as HTMLElement).style.transform = "translateX(2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: (app.color ?? "#6366f1") + "18" }}>
                    {app.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] leading-tight" style={{ color: "#0f172a" }}>{app.label}</p>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: "#6b7280" }}>{app.description}</p>
                  </div>
                  <span className="text-[16px] flex-shrink-0" style={{ color: "#d1d5db" }}>›</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Recent ── */}
          {recents.length > 0 && (
            <section className={`transition-opacity duration-500 delay-200 ${mounted ? "opacity-100" : "opacity-0"}`}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>Continue Where You Left Off</p>
              <div className="space-y-1.5">
                {recents.slice(0, 5).map(r => (
                  <button key={r.id} onClick={() => openApp(r.appId as AppId)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.25)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)"; }}
                  >
                    <span className="text-xl flex-shrink-0">{r.icon}</span>
                    <span className="flex-1 text-[13px] font-medium truncate" style={{ color: "#0f172a" }}>{r.label}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ color: "#6366f1", background: "#eef2ff" }}>Open →</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="h-4" />
        </div>
      </div>

      {showModeMenu && <div className="fixed inset-0 z-40" onClick={() => setShowModeMenu(false)} />}

      {/* ── Brainstorm Chat Panel ── */}
      <BrainstormChat
        isOpen={showBrainstorm}
        onClose={() => setShowBrainstorm(false)}
        onGoToProjects={() => { openApp("projos" as AppId); setShowBrainstorm(false); }}
      />
    </div>
  );
}
