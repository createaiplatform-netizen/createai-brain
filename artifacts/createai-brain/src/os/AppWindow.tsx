import React from "react";
import { useOS, ALL_APPS } from "./OSContext";

interface AppWindowProps {
  children: React.ReactNode;
  onHamburger?: () => void;
}

export function AppWindow({ children, onHamburger }: AppWindowProps) {
  const { activeApp, history, closeApp, goBack } = useOS();

  if (!activeApp) return null;

  const appDef = ALL_APPS.find(a => a.id === activeApp);

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200 min-w-0">
      {/* App window header */}
      <header className="h-14 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center px-4 gap-3 flex-shrink-0 z-10">
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

        {/* Back / Home */}
        <button
          onClick={history.length > 0 ? goBack : closeApp}
          className="flex items-center gap-1 text-primary text-sm font-medium hover:opacity-70 transition-opacity flex-shrink-0"
        >
          <span className="text-base">‹</span>
          <span className="hidden sm:inline">{history.length > 0 ? "Back" : "Home"}</span>
        </button>

        {/* App title */}
        <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
          <span className="text-lg">{appDef?.icon}</span>
          <h1 className="font-semibold text-[15px] text-foreground truncate">{appDef?.label}</h1>
        </div>

        {/* Close */}
        <button
          onClick={closeApp}
          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors text-xs flex-shrink-0"
        >
          ✕
        </button>
      </header>

      {/* App content — scrollable */}
      <div className="flex-1 overflow-y-auto bg-muted/10">
        {children}
      </div>
    </div>
  );
}
