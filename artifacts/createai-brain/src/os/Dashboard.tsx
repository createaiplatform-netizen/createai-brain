import React, { useState, useEffect, useCallback } from "react";
import { useOS, AppId, ALL_APPS } from "./OSContext";
import { PlatformStore, PlatformMode } from "@/engine/PlatformStore";
import { BrainstormChat } from "./BrainstormChat";
import { AppBrowserModal } from "./AppBrowserModal";
import { useAuth } from "@workspace/replit-auth-web";

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: "✨", label: "Create",    sub: "Docs & content",     app: "creator"    as AppId, color: "#6366f1" },
  { icon: "💬", label: "AI Chat",   sub: "Talk to the Brain",  app: "chat"       as AppId, color: "#06b6d4" },
  { icon: "📣", label: "Marketing", sub: "Campaigns & copy",   app: "marketing"  as AppId, color: "#f472b6" },
  { icon: "⚡", label: "Brain Hub", sub: "Engines & series",   app: "brainhub"   as AppId, color: "#f59e0b" },
];

const MODE_CFG: Record<PlatformMode, { label: string; dot: string; bg: string; border: string; text: string }> = {
  DEMO: { label: "Demo", dot: "#f97316", bg: "#fff7ed", border: "#fed7aa", text: "#c2410c" },
  TEST: { label: "Test", dot: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", text: "#4338ca" },
  LIVE: { label: "Live", dot: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
};

const INTENT_SUGGESTIONS = [
  "Simulate a business model",
  "Write a pitch deck",
  "Generate a marketing brochure",
  "Build a content calendar",
  "Create an email sequence",
  "Run a gap analysis",
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityItem { id: number; label: string; icon: string; appId: string; createdAt: string; }
interface ProjectItem  { id: string; name: string; icon: string; industry: string; }

// ─── Featured Apps strip ───────────────────────────────────────────────────────

const FEATURED: Array<{ id: AppId; icon: string; label: string; color: string }> = [
  { id: "projos"      as AppId, icon: "🗂️",  label: "Projects",   color: "#6366f1" },
  { id: "brainhub"   as AppId, icon: "⚡",  label: "Brain Hub",  color: "#f59e0b" },
  { id: "brainGen"   as AppId, icon: "🧠",  label: "BrainGen",   color: "#8b5cf6" },
  { id: "documents"  as AppId, icon: "📄",  label: "Documents",  color: "#0891b2" },
  { id: "simulation" as AppId, icon: "🧪",  label: "Simulate",   color: "#a855f7" },
  { id: "people"     as AppId, icon: "👥",  label: "People",     color: "#10b981" },
  { id: "admin"      as AppId, icon: "⚙️",  label: "Admin",      color: "#6b7280" },
  { id: "family"     as AppId, icon: "🏡",  label: "Family",     color: "#f472b6" },
];

// ─── Dashboard ────────────────────────────────────────────────────────────────

interface DashboardProps {
  onHamburger?: () => void;
  isNarrow?: boolean;
  onShowTour?: () => void;
}

export function Dashboard({ onHamburger, onShowTour }: DashboardProps) {
  const { openApp, routeIntent, platformMode, setPlatformMode, activeApp } = useOS();
  const { user } = useAuth();
  const displayName = user?.firstName || user?.email?.split("@")[0] || "";

  const [intentInput, setIntentInput]         = useState("");
  const [intentResult, setIntentResult]       = useState<{ app: AppId; label: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showModeMenu, setShowModeMenu]       = useState(false);
  const [showBrainstorm, setShowBrainstorm]   = useState(false);
  const [showAppBrowser, setShowAppBrowser]   = useState(false);
  const [mounted, setMounted]                 = useState(false);
  const [activity, setActivity]               = useState<ActivityItem[]>([]);
  const [recentProjects, setRecentProjects]   = useState<ProjectItem[]>([]);
  const [loadingRecents, setLoadingRecents]   = useState(true);

  const cfg = MODE_CFG[platformMode];

  useEffect(() => { setMounted(true); }, []);

  const loadRecents = useCallback(() => {
    Promise.all([
      fetch("/api/activity?limit=5", { credentials: "include" })
        .then(r => r.ok ? r.json() : { activity: [] })
        .then(d => setActivity(d.activity ?? [])),
      fetch("/api/projects", { credentials: "include" })
        .then(r => r.ok ? r.json() : { projects: [] })
        .then(d => setRecentProjects((d.projects ?? []).slice(0, 4))),
    ]).finally(() => setLoadingRecents(false));
  }, []);

  useEffect(() => { loadRecents(); }, [loadRecents]);
  useEffect(() => {
    const stored = PlatformStore.getRecent();
    if (stored.length > 0) loadRecents();
  }, [activeApp, loadRecents]);

  const handleIntentSearch = (query: string) => {
    if (!query.trim()) { setIntentResult(null); return; }
    const targetId = routeIntent(query);
    const all = ALL_APPS;
    if (targetId) {
      const appDef = all.find(a => a.id === targetId);
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
            className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-xl transition-all flex-shrink-0"
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <span className="w-4 h-[1.5px] rounded-full block" style={{ background: "#6b7280" }} />
            <span className="w-4 h-[1.5px] rounded-full block" style={{ background: "#6b7280" }} />
            <span className="w-4 h-[1.5px] rounded-full block" style={{ background: "#6b7280" }} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-[15px]" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>CreateAI Brain</h1>
        </div>

        {/* Mode badge */}
        <div className="relative">
          <button onClick={() => setShowModeMenu(m => !m)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.dot }} />
            {cfg.label}
          </button>

          {showModeMenu && (
            <div className="absolute top-full right-0 mt-2 z-50 rounded-2xl p-2 shadow-xl min-w-[160px]"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
              {(["DEMO", "TEST", "LIVE"] as PlatformMode[]).map(m => (
                <button key={m} onClick={() => { setPlatformMode(m); setShowModeMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[12px] font-semibold transition-all"
                  style={platformMode === m
                    ? { background: MODE_CFG[m].bg, color: MODE_CFG[m].text }
                    : { color: "#374151" }}
                  onMouseEnter={e => { if (platformMode !== m) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={e => { if (platformMode !== m) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: MODE_CFG[m].dot }} />
                  {MODE_CFG[m].label} Mode
                  {platformMode === m && <span className="ml-auto">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {onShowTour && (
          <button onClick={onShowTour}
            className="hidden sm:flex flex-shrink-0 text-[11px] font-semibold px-3 py-2 rounded-full items-center gap-1.5 transition-all"
            style={{ background: "#eef2ff", color: "#6366f1", border: "1px solid #c7d2fe" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#e0e7ff")}
            onMouseLeave={e => (e.currentTarget.style.background = "#eef2ff")}
          >✦ Tour</button>
        )}

        <button onClick={() => openApp("chat")}
          className="flex-shrink-0 text-[12px] font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all"
          style={{ background: "#6366f1", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.30)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#4f46e5")}
          onMouseLeave={e => (e.currentTarget.style.background = "#6366f1")}
        >🧠 Ask</button>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-xl mx-auto px-4 py-7 space-y-8">

          {/* ── Greeting ── */}
          <div className={`transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <p className="text-[13px] font-medium" style={{ color: "#6b7280" }}>
              {getGreeting()}{displayName ? `, ${displayName}` : ""} 👋
            </p>
            <h2 className="text-[22px] font-bold mt-1" style={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
              What would you like to build today?
            </h2>
          </div>

          {/* ── Brainstorm Banner ── */}
          <div className={`transition-opacity duration-500 delay-75 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <button onClick={() => setShowBrainstorm(true)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all group"
              style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)", boxShadow: "0 4px 20px rgba(99,102,241,0.22)" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 28px rgba(99,102,241,0.36)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.22)")}
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.18)" }}>🧠</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[15px] text-white" style={{ letterSpacing: "-0.01em" }}>Brainstorm with AI</p>
                <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.70)" }}>
                  Describe any idea — the Brain organizes and builds it
                </p>
              </div>
              <div className="flex-shrink-0 text-white/50 text-[22px] group-hover:translate-x-0.5 transition-transform">›</div>
            </button>
          </div>

          {/* ── Search ── */}
          <div className={`relative transition-opacity duration-500 delay-75 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <form onSubmit={handleIntentSubmit}>
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
                style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.09)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <span className="text-[17px] flex-shrink-0">🔍</span>
                <input
                  type="text"
                  value={intentInput}
                  onChange={e => { setIntentInput(e.target.value); handleIntentSearch(e.target.value); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
                  placeholder="Search apps, or describe what you want to build…"
                  className="flex-1 bg-transparent outline-none text-[14px] min-w-0"
                  style={{ color: "#0f172a" }}
                />
                {intentInput && (
                  <button type="submit"
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all flex-shrink-0"
                    style={{ background: "#6366f1", color: "#fff" }}>Go →</button>
                )}
              </div>

              {intentResult && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl px-4 py-2.5 text-[13px] font-medium flex items-center justify-between z-10"
                  style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
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
                        className="text-[11px] px-2.5 py-1.5 rounded-full transition-all"
                        style={{ background: "#f3f4f6", color: "#374151", border: "1px solid rgba(0,0,0,0.06)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#eef2ff"; (e.currentTarget as HTMLElement).style.color = "#6366f1"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f3f4f6"; (e.currentTarget as HTMLElement).style.color = "#374151"; }}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* ── Quick Start ── */}
          <section className={`transition-opacity duration-500 delay-100 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#c4c9d4" }}>Quick Start</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {QUICK_ACTIONS.map(a => (
                <button key={a.label} onClick={() => openApp(a.app)}
                  className="flex flex-col items-center gap-2.5 p-5 rounded-2xl text-center transition-all duration-200"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${a.color}22`; (e.currentTarget as HTMLElement).style.borderColor = `${a.color}38`; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
                >
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: `${a.color}14` }}>{a.icon}</div>
                  <div>
                    <p className="font-semibold text-[12px] leading-tight" style={{ color: "#0f172a" }}>{a.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#9ca3af" }}>{a.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── Featured Apps ── */}
          <section className={`transition-opacity duration-500 delay-125 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#c4c9d4" }}>Apps</p>
              <button
                onClick={() => setShowAppBrowser(true)}
                className="text-[11px] font-semibold flex items-center gap-1 transition-all"
                style={{ color: "#6366f1" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >Browse all {ALL_APPS.length} →</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {FEATURED.map(a => (
                <button key={a.id} onClick={() => openApp(a.id)}
                  className="flex flex-col items-center gap-2 p-3.5 rounded-2xl text-center transition-all"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = a.color + "38"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: a.color + "18" }}>{a.icon}</div>
                  <p className="text-[10px] font-semibold leading-tight" style={{ color: "#374151" }}>{a.label}</p>
                </button>
              ))}
            </div>
          </section>

          {/* ── Your Projects ── */}
          <section className={`transition-opacity duration-500 delay-150 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#c4c9d4" }}>Your Projects</p>
              <button onClick={() => openApp("projos" as AppId)}
                className="text-[11px] font-semibold transition-all" style={{ color: "#6366f1" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >View all →</button>
            </div>
            {loadingRecents ? (
              <div className="flex items-center gap-2 text-[12px] py-2" style={{ color: "#9ca3af" }}>
                <span className="inline-block w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Loading…
              </div>
            ) : recentProjects.length === 0 ? (
              <button onClick={() => openApp("projos" as AppId)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
                style={{ background: "#f8fafc", border: "2px dashed rgba(99,102,241,0.22)" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.42)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.22)")}
              >
                <span className="text-2xl">📁</span>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "#374151" }}>No projects yet</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#9ca3af" }}>Tap to create your first project</p>
                </div>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {recentProjects.map(p => (
                  <button key={p.id} onClick={() => openApp("projos" as AppId)}
                    className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all"
                    style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.28)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
                  >
                    <span className="text-xl flex-shrink-0">{p.icon || "📁"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold truncate" style={{ color: "#0f172a" }}>{p.name}</p>
                      <p className="text-[10px]" style={{ color: "#9ca3af" }}>{p.industry}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ── Recent Activity ── */}
          {activity.length > 0 && (
            <section className={`transition-opacity duration-500 delay-200 ${mounted ? "opacity-100" : "opacity-0"}`}>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#c4c9d4" }}>Recent</p>
              <div className="space-y-1.5">
                {activity.slice(0, 4).map(r => (
                  <button key={r.id} onClick={() => openApp((r.appId || "creator") as AppId)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
                    style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.22)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)"; }}
                  >
                    <span className="text-xl flex-shrink-0">{r.icon}</span>
                    <span className="flex-1 text-[13px] font-medium truncate" style={{ color: "#0f172a" }}>{r.label}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ color: "#6366f1", background: "#eef2ff" }}>Open</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="h-6" />
        </div>
      </div>

      {showModeMenu && <div className="fixed inset-0 z-40" onClick={() => setShowModeMenu(false)} />}

      {/* ── App Browser ── */}
      {showAppBrowser && (
        <AppBrowserModal onClose={() => setShowAppBrowser(false)} />
      )}

      {/* ── Brainstorm Chat ── */}
      <BrainstormChat
        isOpen={showBrainstorm}
        onClose={() => setShowBrainstorm(false)}
        onGoToProjects={() => { openApp("projos" as AppId); setShowBrainstorm(false); }}
      />
    </div>
  );
}
