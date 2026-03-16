import React, { useState } from "react";
import { useOS, AppId } from "./OSContext";

const RECENT_ITEMS = [
  { icon: "💬", label: "Main Brain — last session",         app: "chat"       as AppId },
  { icon: "📁", label: "Healthcare System – Legal Safe",    app: "projects"   as AppId },
  { icon: "📣", label: "Brand Kit Draft",                   app: "marketing"  as AppId },
  { icon: "👥", label: "People List — 3 pending invites",   app: "people"     as AppId },
];

const QUICK_ACTIONS = [
  { icon: "✨", label: "Create Anything", app: "creator"    as AppId },
  { icon: "💬", label: "Open Chat",       app: "chat"       as AppId },
  { icon: "📁", label: "New Project",     app: "projects"   as AppId },
  { icon: "📣", label: "Marketing",       app: "marketing"  as AppId },
];

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
  const { openApp, appRegistry, routeIntent } = useOS();
  const [intentInput, setIntentInput] = useState("");
  const [intentResult, setIntentResult] = useState<{ app: AppId; label: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
          <p className="text-[11px] text-muted-foreground">Demo Mode · All engines active</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">Live</span>
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-7">

          {/* Global Brain — Intent Router */}
          <section>
            <form onSubmit={handleIntentSubmit} className="relative">
              <div className="relative flex items-center bg-background rounded-2xl border border-border/50 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                <span className="pl-4 text-muted-foreground text-lg flex-shrink-0">🧠</span>
                <input
                  value={intentInput}
                  onChange={e => { setIntentInput(e.target.value); handleIntentSearch(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Build anything… or ask the Brain"
                  className="flex-1 bg-transparent border-none outline-none text-[14px] py-3.5 px-3 placeholder:text-muted-foreground"
                />
                {intentInput && intentResult && (
                  <button type="submit"
                    className="mr-2 flex items-center gap-1.5 bg-primary text-white text-[12px] font-semibold px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity flex-shrink-0">
                    Open {intentResult.label} →
                  </button>
                )}
                {!intentInput && (
                  <button type="button" onClick={() => openApp("chat")}
                    className="mr-2 flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                    <span>Ask</span>
                  </button>
                )}
              </div>
              {/* Suggestions dropdown */}
              {showSuggestions && !intentInput && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background rounded-2xl border border-border/50 shadow-lg z-20 overflow-hidden">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-3 pb-1">Suggestions</p>
                  {INTENT_SUGGESTIONS.map((s, i) => (
                    <button key={i} type="button"
                      onClick={() => { setIntentInput(s); handleIntentSearch(s); setShowSuggestions(false); }}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-foreground hover:bg-muted transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </form>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className={`grid gap-3 ${isNarrow ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
              {QUICK_ACTIONS.map(qa => (
                <button key={qa.label} onClick={() => openApp(qa.app)}
                  className="flex flex-col items-center gap-1.5 p-3 bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{qa.icon}</span>
                  <span className="text-[11px] font-medium text-foreground text-center leading-snug">{qa.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* All Apps — from registry (Infinite Expansion Layer) */}
          <section>
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">All Apps</h2>
            <div className={`grid gap-3 ${isNarrow ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"}`}>
              {appRegistry.filter(a => a.enabled !== false).map(app => (
                <button key={app.id} onClick={() => openApp(app.id as AppId)}
                  className="flex flex-col items-start gap-2 p-4 bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group text-left">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: app.color + "22", color: app.color }}>
                    {app.icon}
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="text-[13px] font-semibold text-foreground leading-tight truncate">{app.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{app.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Recent */}
          <section>
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent</h2>
            <div className="bg-background rounded-2xl border border-border/50 shadow-sm divide-y divide-border/30">
              {RECENT_ITEMS.map((item, i) => (
                <button key={i} onClick={() => openApp(item.app)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left first:rounded-t-2xl last:rounded-b-2xl">
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <span className="text-[13px] text-foreground font-medium flex-1 truncate">{item.label}</span>
                  <span className="text-muted-foreground text-xs flex-shrink-0">→</span>
                </button>
              ))}
            </div>
          </section>

          {/* System Status */}
          <section>
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">System Status</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Engines Active", value: "30+",  color: "#34C759" },
                { label: "Mode",           value: "DEMO", color: "#007AFF" },
                { label: "Safety Shell",   value: "ON",   color: "#34C759" },
              ].map(stat => (
                <div key={stat.label} className="bg-background rounded-2xl border border-border/50 p-4 text-center">
                  <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
