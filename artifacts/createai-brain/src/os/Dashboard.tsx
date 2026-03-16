import React from "react";
import { useOS, ALL_APPS, AppId } from "./OSContext";

const RECENT_ITEMS = [
  { icon: "💬", label: "Main Brain — last session", app: "chat" as AppId },
  { icon: "📁", label: "Healthcare System – Legal Safe", app: "projects" as AppId },
  { icon: "📣", label: "Brand Kit Draft", app: "marketing" as AppId },
  { icon: "👥", label: "People List — 3 pending invites", app: "people" as AppId },
];

const QUICK_ACTIONS = [
  { icon: "✨", label: "Create Anything", app: "creator" as AppId },
  { icon: "💬", label: "Open Chat", app: "chat" as AppId },
  { icon: "📁", label: "New Project", app: "projects" as AppId },
  { icon: "📣", label: "Marketing", app: "marketing" as AppId },
];

interface DashboardProps {
  onHamburger?: () => void;
}

export function Dashboard({ onHamburger }: DashboardProps) {
  const { openApp } = useOS();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/20 min-w-0">
      {/* Top bar */}
      <header className="h-14 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center px-4 gap-3 sticky top-0 z-10 flex-shrink-0">
        {/* Hamburger (mobile only) */}
        {onHamburger && (
          <button
            onClick={onHamburger}
            className="w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
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
          <span className="text-[11px] text-muted-foreground font-medium">Live</span>
        </div>
      </header>

      {/* Scrollable content — centered with max-width */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

          {/* Quick Actions */}
          <section>
            <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map(qa => (
                <button
                  key={qa.label}
                  onClick={() => openApp(qa.app)}
                  className="flex flex-col items-center gap-1.5 p-3 bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{qa.icon}</span>
                  <span className="text-[11px] font-medium text-foreground text-center leading-snug">{qa.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* App Grid */}
          <section>
            <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              All Apps
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {ALL_APPS.map(app => (
                <button
                  key={app.id}
                  onClick={() => openApp(app.id as AppId)}
                  className="flex flex-col items-start gap-2 p-4 bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group text-left"
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: app.color + "22", color: app.color }}
                  >
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

          {/* Recent Items */}
          <section>
            <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Recent
            </h2>
            <div className="bg-background rounded-2xl border border-border/50 shadow-sm divide-y divide-border/30">
              {RECENT_ITEMS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => openApp(item.app)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <span className="text-[13px] text-foreground font-medium flex-1 truncate">{item.label}</span>
                  <span className="text-muted-foreground text-xs flex-shrink-0">→</span>
                </button>
              ))}
            </div>
          </section>

          {/* System Status */}
          <section>
            <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              System Status
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Engines Active", value: "30+", color: "#34C759" },
                { label: "Mode", value: "DEMO", color: "#007AFF" },
                { label: "Safety Shell", value: "ON", color: "#34C759" },
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
