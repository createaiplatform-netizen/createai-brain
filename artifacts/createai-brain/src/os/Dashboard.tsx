import React, { useState, useEffect, useRef } from "react";
import { useOS, AppId } from "./OSContext";
import { PlatformStore, RecentActivity, PlatformMode } from "@/engine/PlatformStore";

const QUICK_ACTIONS = [
  { icon: "✨", label: "Create Anything", sub: "Docs, content, apps",   app: "creator"    as AppId, color: "#6366f1" },
  { icon: "💬", label: "Open Chat",       sub: "Talk to the Brain",     app: "chat"       as AppId, color: "#22d3ee" },
  { icon: "📁", label: "New Project",     sub: "Start a system",        app: "projects"   as AppId, color: "#34d399" },
  { icon: "📣", label: "Marketing",       sub: "Campaigns & content",   app: "marketing"  as AppId, color: "#f472b6" },
];

const FALLBACK_RECENTS: RecentActivity[] = [
  { id: "f1", appId: "chat",       label: "AI Chat — Main Brain",             icon: "💬", at: new Date().toISOString() },
  { id: "f2", appId: "projects",   label: "Healthcare System – Legal Safe",   icon: "📁", at: new Date().toISOString() },
  { id: "f3", appId: "marketing",  label: "Brand Kit Draft",                  icon: "📣", at: new Date().toISOString() },
  { id: "f4", appId: "people",     label: "People — invites pending",         icon: "👥", at: new Date().toISOString() },
];

const MODE_CFG: Record<PlatformMode, { label: string; color: string; dot: string; desc: string; bg: string; border: string }> = {
  DEMO: { label: "Demo Mode",  color: "text-orange-400", dot: "bg-orange-400", desc: "Safe simulation — nothing is real",     bg: "bg-orange-500/10", border: "border-orange-500/20" },
  TEST: { label: "Test Mode",  color: "text-primary",    dot: "bg-primary",    desc: "Testing active — no live actions",      bg: "bg-primary/10",    border: "border-primary/20" },
  LIVE: { label: "Live Mode",  color: "text-green-400",  dot: "bg-green-400",  desc: "All engines live and active",           bg: "bg-green-500/10",  border: "border-green-500/20" },
};

const INTENT_SUGGESTIONS = [
  "Generate a marketing brochure",
  "Open the Healthcare project",
  "Create a landing page funnel",
  "Chat with the Brain",
  "Show me revenue stats",
  "Build a content calendar",
  "Write a pitch deck",
  "Create an email sequence",
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface DashboardProps {
  onHamburger?: () => void;
  isNarrow?: boolean;
}

export function Dashboard({ onHamburger, isNarrow }: DashboardProps) {
  const { openApp, appRegistry, routeIntent, platformMode, setPlatformMode, activeApp } = useOS();
  const [intentInput, setIntentInput]       = useState("");
  const [intentResult, setIntentResult]     = useState<{ app: AppId; label: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recents, setRecents]               = useState<RecentActivity[]>([]);
  const [showModeMenu, setShowModeMenu]     = useState(false);
  const [mounted, setMounted]               = useState(false);

  const cfg = MODE_CFG[platformMode];

  useEffect(() => {
    setMounted(true);
  }, []);

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
      setIntentResult({ app: "chat", label: "AI Chat (ask the Brain)" });
    }
  };

  const handleIntentSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (intentResult) {
      openApp(intentResult.app);
      setIntentInput("");
      setIntentResult(null);
    } else {
      openApp("chat");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: "rgba(7,9,20,0.60)" }}>

      {/* ── Top bar ── */}
      <header className="h-14 glass-topbar flex items-center px-4 gap-3 sticky top-0 z-10 flex-shrink-0">
        {onHamburger && (
          <button onClick={onHamburger} aria-label="Open navigation"
            className="w-8 h-8 flex flex-col items-center justify-center gap-[5px] rounded-xl transition-all duration-150 flex-shrink-0"
            style={{ color: "rgba(255,255,255,0.55)" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <span className="w-4.5 h-[1.5px] rounded-full block" style={{ background: "rgba(255,255,255,0.55)" }} />
            <span className="w-4.5 h-[1.5px] rounded-full block" style={{ background: "rgba(255,255,255,0.55)" }} />
            <span className="w-4.5 h-[1.5px] rounded-full block" style={{ background: "rgba(255,255,255,0.55)" }} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-[15px] truncate" style={{ color: "rgba(255,255,255,0.90)", letterSpacing: "-0.02em" }}>
            CreateAI OS
          </h1>
          <button
            onClick={() => setShowModeMenu(m => !m)}
            className={`text-[11px] font-medium flex items-center gap-1.5 hover:opacity-75 transition-opacity ${cfg.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${cfg.dot}`} />
            {cfg.label} · {cfg.desc}
          </button>
        </div>

        {showModeMenu && (
          <div className="absolute top-14 left-4 z-50 glass-card shadow-2xl p-2 space-y-1 min-w-[190px] animate-scale-in">
            {(["DEMO", "TEST", "LIVE"] as PlatformMode[]).map(m => (
              <button key={m} onClick={() => { setPlatformMode(m); setShowModeMenu(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-all duration-150
                  ${platformMode === m ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/60"}`}>
                <span className={`w-2 h-2 rounded-full ${MODE_CFG[m].dot}`} />
                {MODE_CFG[m].label}
                {platformMode === m && <span className="ml-auto text-primary text-[10px]">✓</span>}
              </button>
            ))}
            <p className="text-[9px] text-muted-foreground px-3 pt-1 pb-0.5 leading-relaxed">
              Mode changes persist across sessions
            </p>
          </div>
        )}

        <button
          onClick={() => openApp("chat")}
          className="flex-shrink-0 text-white text-[12px] font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 btn-primary"
        >
          🧠 Ask the Brain
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-7">

          {/* ── Greeting ── */}
          <div className={`animate-fade-up ${mounted ? "" : "opacity-0"}`}>
            <p className="text-[13px] text-muted-foreground font-medium">{getGreeting()}, Sara</p>
            <h2 className="text-[22px] font-bold text-foreground mt-0.5" style={{ letterSpacing: "-0.03em" }}>
              What would you like to <span className="gradient-text">create</span> today?
            </h2>
          </div>

          {/* ── Intent search bar ── */}
          <div className={`relative animate-fade-up delay-50 ${mounted ? "" : "opacity-0"}`}>
            <form onSubmit={handleIntentSubmit}>
              <div
                className="flex items-center gap-3 rounded-2xl px-4 py-3 input-premium transition-all"
                style={{
                  background: "rgba(14,18,42,0.85)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.04) inset",
                }}
              >
                <span className="text-[18px] flex-shrink-0 animate-float">🧠</span>
                <input
                  type="text"
                  value={intentInput}
                  onChange={e => { setIntentInput(e.target.value); handleIntentSearch(e.target.value); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
                  placeholder="Build anything... or ask the Brain"
                  className="flex-1 bg-transparent outline-none text-[14px] text-foreground placeholder:text-muted-foreground min-w-0"
                />
                <button type="submit"
                  className="text-[12px] font-semibold text-primary flex-shrink-0 px-3 py-1.5 rounded-xl transition-all duration-150"
                  style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.18)" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.22)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.12)")}
                >
                  Ask
                </button>
              </div>

              {intentResult && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 rounded-2xl px-4 py-2.5 text-[13px] font-medium flex items-center justify-between z-10 animate-scale-in"
                  style={{
                    background: "linear-gradient(135deg, #6366f1 0%, #5457d8 100%)",
                    boxShadow: "0 4px 20px rgba(99,102,241,0.40)",
                  }}
                >
                  <span className="text-white">→ Open {intentResult.label}</span>
                  <span className="text-white/60 text-[11px]">Press Enter</span>
                </div>
              )}

              {showSuggestions && !intentInput && !intentResult && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 rounded-2xl p-3 shadow-2xl z-10 animate-scale-in"
                  style={{
                    background: "rgba(10,13,30,0.98)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    backdropFilter: "blur(24px)",
                  }}
                >
                  <p className="section-label mb-2 px-1">Suggestions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {INTENT_SUGGESTIONS.map((s, i) => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={() => { setIntentInput(s); handleIntentSearch(s); }}
                        className={`text-[11px] text-muted-foreground px-2.5 py-1 rounded-full transition-all duration-150 animate-fade-in delay-${Math.min(i * 50, 300)}`}
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.15)";
                          (e.currentTarget as HTMLElement).style.color = "#a5b4fc";
                          (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.25)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                          (e.currentTarget as HTMLElement).style.color = "";
                          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* ── Quick Actions ── */}
          <section className={`animate-fade-up delay-100 ${mounted ? "" : "opacity-0"}`}>
            <p className="section-label mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map((a, i) => (
                <button
                  key={a.label}
                  onClick={() => openApp(a.app)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-center transition-all duration-200 group glass-card card-interactive animate-fade-up delay-${100 + i * 50}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-transform duration-200 group-hover:scale-110"
                    style={{ background: `${a.color}18`, border: `1px solid ${a.color}28` }}
                  >
                    {a.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-[12px] text-foreground leading-tight">{a.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── All Apps ── */}
          <section className={`animate-fade-up delay-200 ${mounted ? "" : "opacity-0"}`}>
            <p className="section-label mb-3">All Apps</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {appRegistry.map((app, i) => (
                <button
                  key={app.id}
                  onClick={() => openApp(app.id as AppId)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border text-left group card-interactive animate-fade-up delay-${Math.min(200 + i * 40, 500)}`}
                  style={{
                    background: "rgba(14,18,42,0.70)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                    style={{ backgroundColor: (app.color ?? "#6366f1") + "22" }}
                  >
                    {app.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] text-foreground leading-tight">{app.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{app.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── Recent Activity ── */}
          {recents.length > 0 && (
            <section className={`animate-fade-up delay-300 ${mounted ? "" : "opacity-0"}`}>
              <p className="section-label mb-3">Continue where you left off</p>
              <div className="space-y-1.5">
                {recents.slice(0, 5).map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => openApp(r.appId as AppId)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left group transition-all duration-200 card-interactive animate-fade-up delay-${300 + i * 50}`}
                    style={{
                      background: "rgba(14,18,42,0.70)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">{r.icon}</span>
                    <span className="flex-1 text-[13px] font-medium text-foreground truncate">{r.label}</span>
                    <span
                      className="text-[10px] font-semibold flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 px-2 py-0.5 rounded-full"
                      style={{ color: "#818cf8", background: "rgba(99,102,241,0.12)" }}
                    >
                      Open →
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Platform status strip ── */}
          <div
            className={`rounded-2xl p-4 border flex items-start gap-3 animate-fade-up delay-400 ${mounted ? "" : "opacity-0"} ${cfg.bg} ${cfg.border}`}
          >
            <span className="text-[20px] flex-shrink-0 mt-0.5">
              {platformMode === "LIVE" ? "🟢" : platformMode === "TEST" ? "🔵" : "🟠"}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-[13px] ${cfg.color}`}>{cfg.label} — {cfg.desc}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {platformMode === "DEMO"
                  ? "Safe to explore everything — nothing is sent, nothing can break."
                  : platformMode === "TEST"
                  ? "All actions are logged but no real transactions or messages occur."
                  : "All engines are live. Actions, messages, and content generation are fully operational."}
              </p>
            </div>
            <button
              onClick={() => openApp("admin")}
              className="text-[11px] font-semibold text-primary rounded-lg px-3 py-1.5 flex-shrink-0 transition-all duration-150"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.12)")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)")}
            >
              Manage
            </button>
          </div>

        </div>
      </div>

      {showModeMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowModeMenu(false)} />
      )}
    </div>
  );
}
