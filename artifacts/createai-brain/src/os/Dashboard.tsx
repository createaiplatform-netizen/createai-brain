import React, { useState, useEffect } from "react";
import { useOS, AppId } from "./OSContext";
import { PlatformStore, RecentActivity, PlatformMode } from "@/engine/PlatformStore";

const QUICK_ACTIONS = [
  { icon: "✨", label: "Create Anything", app: "creator"    as AppId },
  { icon: "💬", label: "Open Chat",       app: "chat"       as AppId },
  { icon: "📁", label: "New Project",     app: "projects"   as AppId },
  { icon: "📣", label: "Marketing",       app: "marketing"  as AppId },
];

const FALLBACK_RECENTS: RecentActivity[] = [
  { id: "f1", appId: "chat",       label: "AI Chat — Main Brain",             icon: "💬", at: new Date().toISOString() },
  { id: "f2", appId: "projects",   label: "Healthcare System – Legal Safe",   icon: "📁", at: new Date().toISOString() },
  { id: "f3", appId: "marketing",  label: "Brand Kit Draft",                  icon: "📣", at: new Date().toISOString() },
  { id: "f4", appId: "people",     label: "People — invites pending",         icon: "👥", at: new Date().toISOString() },
];

const MODE_CFG: Record<PlatformMode, { label: string; color: string; dot: string; desc: string }> = {
  DEMO: { label: "Demo Mode",  color: "text-orange-500", dot: "bg-orange-400", desc: "Safe simulation — nothing is real" },
  TEST: { label: "Test Mode",  color: "text-blue-500",   dot: "bg-blue-400",   desc: "Testing active — no live actions" },
  LIVE: { label: "Live Mode",  color: "text-green-600",  dot: "bg-green-500",  desc: "All engines live and active" },
};

const INTENT_SUGGESTIONS = [
  "Generate a marketing brochure",
  "Open the Healthcare project",
  "Create a funnel offer",
  "Chat with the Brain",
  "Show me revenue stats",
  "Build a checklist",
];

interface DashboardProps {
  onHamburger?: () => void;
  isNarrow?: boolean;
}

export function Dashboard({ onHamburger, isNarrow }: DashboardProps) {
  const { openApp, appRegistry, routeIntent, platformMode, setPlatformMode, activeApp } = useOS();
  const [intentInput, setIntentInput]     = useState("");
  const [intentResult, setIntentResult]   = useState<{ app: AppId; label: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recents, setRecents]             = useState<RecentActivity[]>([]);
  const [showModeMenu, setShowModeMenu]   = useState(false);

  const cfg = MODE_CFG[platformMode];

  // Load recents on mount + after app opens
  useEffect(() => {
    const load = () => {
      const stored = PlatformStore.getRecent();
      setRecents(stored.length > 0 ? stored : FALLBACK_RECENTS);
    };
    load();
    window.addEventListener("cai:mode-change", load);
    return () => window.removeEventListener("cai:mode-change", load);
  }, []);

  // Re-read recents whenever activeApp changes (happens via openApp in OSContext)
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
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/20 min-w-0">

      {/* ── Top bar ── */}
      <header className="h-14 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center px-4 gap-3 sticky top-0 z-10 flex-shrink-0">
        {onHamburger && (
          <button onClick={onHamburger} aria-label="Open navigation"
            className="w-8 h-8 flex flex-col items-center justify-center gap-[5px] rounded-lg hover:bg-muted transition-colors flex-shrink-0">
            <span className="w-5 h-0.5 bg-foreground/70 rounded-full" />
            <span className="w-5 h-0.5 bg-foreground/70 rounded-full" />
            <span className="w-5 h-0.5 bg-foreground/70 rounded-full" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-[15px] text-foreground truncate">CreateAI OS</h1>
          {/* Live mode indicator — clickable */}
          <button
            onClick={() => setShowModeMenu(m => !m)}
            className={`text-[11px] font-medium flex items-center gap-1.5 hover:opacity-70 transition-opacity ${cfg.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${cfg.dot}`} />
            {cfg.label} · {cfg.desc}
          </button>
        </div>

        {/* Mode quick-switch menu */}
        {showModeMenu && (
          <div className="absolute top-14 left-4 z-50 bg-background border border-border/50 rounded-2xl shadow-lg p-2 space-y-1 min-w-[180px]">
            {(["DEMO", "TEST", "LIVE"] as PlatformMode[]).map(m => (
              <button key={m} onClick={() => { setPlatformMode(m); setShowModeMenu(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12px] font-semibold transition-colors
                  ${platformMode === m ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"}`}>
                <span className={`w-2 h-2 rounded-full ${MODE_CFG[m].dot}`} />
                {MODE_CFG[m].label}
              </button>
            ))}
            <p className="text-[9px] text-muted-foreground px-3 pt-1 pb-0.5">Mode changes are persistent across sessions</p>
          </div>
        )}

        {/* Ask the Brain button */}
        <button
          onClick={() => openApp("chat")}
          className="flex-shrink-0 bg-primary text-white text-[12px] font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
        >
          🧠 Ask the Brain
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-5 space-y-8">

          {/* ── Intent search bar ── */}
          <form onSubmit={handleIntentSubmit} className="relative">
            <div className="flex items-center gap-3 bg-background border border-border/50 rounded-2xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
              <span className="text-[18px] flex-shrink-0">🧠</span>
              <input
                type="text"
                value={intentInput}
                onChange={e => { setIntentInput(e.target.value); handleIntentSearch(e.target.value); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Build anything... or ask the Brain"
                className="flex-1 bg-transparent outline-none text-[14px] text-foreground placeholder:text-muted-foreground min-w-0"
              />
              <button type="submit"
                className="text-[12px] font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-colors flex-shrink-0">
                Ask
              </button>
            </div>

            {/* Intent result pill */}
            {intentResult && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-primary text-white rounded-xl px-4 py-2 text-[12px] font-medium flex items-center justify-between z-10">
                <span>→ Open {intentResult.label}</span>
                <span className="opacity-70 text-[11px]">Press Enter</span>
              </div>
            )}

            {/* Suggestion chips */}
            {showSuggestions && !intentInput && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-background border border-border/50 rounded-2xl p-3 shadow-lg z-10">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Suggestions</p>
                <div className="flex flex-wrap gap-1.5">
                  {INTENT_SUGGESTIONS.map(s => (
                    <button key={s} type="button"
                      onMouseDown={() => { setIntentInput(s); handleIntentSearch(s); }}
                      className="text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* ── Quick Actions ── */}
          <section>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map(a => (
                <button key={a.label} onClick={() => openApp(a.app)}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all group">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{a.icon}</span>
                  <span className="text-[12px] font-semibold text-foreground">{a.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── All Apps ── */}
          <section>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">All Apps</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {appRegistry.map(app => (
                <button key={app.id} onClick={() => openApp(app.id as AppId)}
                  className="flex items-start gap-3 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: app.color + "22" }}>
                    {app.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] text-foreground">{app.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{app.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── Recent Activity ── */}
          {recents.length > 0 && (
            <section>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Recent</p>
              <div className="space-y-1.5">
                {recents.slice(0, 5).map(r => (
                  <button key={r.id} onClick={() => openApp(r.appId as AppId)}
                    className="w-full flex items-center gap-3 p-3.5 bg-background rounded-xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left group">
                    <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">{r.icon}</span>
                    <span className="flex-1 text-[13px] font-medium text-foreground truncate">{r.label}</span>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">→</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Platform status strip ── */}
          <div className={`rounded-2xl p-4 border flex items-start gap-3 ${
            platformMode === "LIVE" ? "bg-green-50 border-green-200" :
            platformMode === "TEST" ? "bg-blue-50 border-blue-200" :
            "bg-orange-50 border-orange-200"
          }`}>
            <span className={`text-[20px] flex-shrink-0 ${
              platformMode === "LIVE" ? "text-green-600" :
              platformMode === "TEST" ? "text-blue-600" : "text-orange-500"
            }`}>
              {platformMode === "LIVE" ? "🟢" : platformMode === "TEST" ? "🔵" : "🟠"}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-[13px] ${
                platformMode === "LIVE" ? "text-green-700" :
                platformMode === "TEST" ? "text-blue-700" : "text-orange-700"
              }`}>{cfg.label} — {cfg.desc}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {platformMode === "DEMO"
                  ? "Nothing is real, nothing is sent, nothing can break. Safe to explore everything."
                  : platformMode === "TEST"
                  ? "Testing mode active. All actions are logged but no real transactions or messages occur."
                  : "Live mode active. Actions, messages, and content generation are fully operational."
                }
              </p>
            </div>
            <button onClick={() => openApp("admin")}
              className="text-[11px] font-semibold text-primary bg-white border border-border/50 rounded-lg px-3 py-1.5 hover:bg-muted transition-colors flex-shrink-0">
              Manage
            </button>
          </div>

        </div>
      </div>

      {/* Close mode menu on outside click */}
      {showModeMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowModeMenu(false)} />
      )}
    </div>
  );
}
