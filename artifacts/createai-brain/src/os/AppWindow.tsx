import React from "react";
import { useOS, ALL_APPS } from "./OSContext";

export function AppWindow({ children }: { children: React.ReactNode }) {
  const { activeApp, history, closeApp, goBack } = useOS();

  if (!activeApp) return null;

  const appDef = ALL_APPS.find(a => a.id === activeApp);

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200">
      {/* App window header */}
      <header className="h-14 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center px-4 gap-3 flex-shrink-0 z-10">
        <button
          onClick={history.length > 0 ? goBack : closeApp}
          className="flex items-center gap-1 text-primary text-sm font-medium hover:opacity-70 transition-opacity"
        >
          <span className="text-base">‹</span>
          <span>{history.length > 0 ? "Back" : "Home"}</span>
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="text-lg">{appDef?.icon}</span>
          <h1 className="font-semibold text-[15px] text-foreground">{appDef?.label}</h1>
        </div>
        <button
          onClick={closeApp}
          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors text-xs"
        >
          ✕
        </button>
      </header>

      {/* App content */}
      <div className="flex-1 overflow-y-auto bg-muted/10">
        {children}
      </div>
    </div>
  );
}
