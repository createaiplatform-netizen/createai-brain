import React, { useState } from "react";

export type StandaloneMode = "Demo" | "Test" | "Live";

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface StandaloneLayoutProps {
  productName: string;
  productIcon: string;
  productColor: string;
  navItems: NavItem[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  mode: StandaloneMode;
  onModeChange: (m: StandaloneMode) => void;
  children: React.ReactNode;
  disclaimer?: string;
}

export function StandaloneLayout({
  productName, productIcon, productColor, navItems,
  activeSection, onSectionChange,
  mode, onModeChange,
  children, disclaimer,
}: StandaloneLayoutProps) {
  const [navOpen, setNavOpen] = useState(false);

  const modeColor = {
    Demo: "bg-green-100 text-green-700",
    Test: "bg-orange-100 text-orange-700",
    Live: "bg-gray-100 text-gray-400",
  }[mode];

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden font-sans">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-border/50 bg-background/95">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border/30 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: productColor + "22" }}>
            {productIcon}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-foreground truncate leading-tight">{productName}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${modeColor}`}>{mode}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(item => (
            <button key={item.id} onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-[13px] font-medium
                ${activeSection === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <span className="text-base flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Mode switcher */}
        <div className="p-3 border-t border-border/30 space-y-1.5">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Mode</p>
          <div className="flex gap-1">
            {(["Demo", "Test", "Live"] as StandaloneMode[]).map(m => (
              <button key={m} onClick={() => m !== "Live" && onModeChange(m)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all
                  ${mode === m
                    ? { Demo: "bg-green-100 text-green-700", Test: "bg-orange-100 text-orange-700", Live: "bg-gray-100 text-gray-400" }[m]
                    : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {m === "Live" ? "🔒" : m}
              </button>
            ))}
          </div>
          <button onClick={() => window.close()} className="w-full py-1.5 rounded-xl text-[11px] text-muted-foreground hover:bg-muted transition-colors border border-border/40">
            ← Back to OS
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar + overlay nav ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="md:hidden h-14 bg-background/95 border-b border-border/50 flex items-center px-4 gap-3 flex-shrink-0 z-10">
          <button onClick={() => setNavOpen(true)}
            className="w-8 h-8 flex flex-col items-center justify-center gap-[5px] rounded-lg hover:bg-muted transition-colors">
            <span className="w-5 h-0.5 bg-foreground/70 rounded-full" />
            <span className="w-5 h-0.5 bg-foreground/70 rounded-full" />
            <span className="w-5 h-0.5 bg-foreground/70 rounded-full" />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: productColor + "22" }}>
            {productIcon}
          </div>
          <span className="font-semibold text-[13px] text-foreground truncate flex-1">{productName}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${modeColor}`}>{mode}</span>
        </header>

        {/* Mobile nav overlay */}
        {navOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setNavOpen(false)} />
            <div className="fixed left-0 top-0 bottom-0 z-50 w-56 bg-background border-r border-border/50 flex flex-col animate-in slide-in-from-left-4 duration-200">
              <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border/30">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: productColor + "22" }}>
                  {productIcon}
                </div>
                <p className="text-[12px] font-bold text-foreground truncate">{productName}</p>
              </div>
              <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                {navItems.map(item => (
                  <button key={item.id} onClick={() => { onSectionChange(item.id); setNavOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-[13px] font-medium
                      ${activeSection === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
              <div className="p-3 border-t border-border/30">
                <div className="flex gap-1 mb-2">
                  {(["Demo", "Test", "Live"] as StandaloneMode[]).map(m => (
                    <button key={m} onClick={() => { if (m !== "Live") { onModeChange(m); setNavOpen(false); } }}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold ${mode === m ? { Demo: "bg-green-100 text-green-700", Test: "bg-orange-100 text-orange-700", Live: "bg-gray-100 text-gray-400" }[m] : "bg-muted text-muted-foreground"}`}>
                      {m === "Live" ? "🔒" : m}
                    </button>
                  ))}
                </div>
                <button onClick={() => window.close()} className="w-full py-1.5 rounded-xl text-[11px] text-muted-foreground hover:bg-muted border border-border/40">
                  ← Back to OS
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Top bar (desktop) ── */}
        <div className="hidden md:flex h-14 border-b border-border/50 bg-background/80 backdrop-blur-xl items-center px-5 gap-4 flex-shrink-0">
          <div className="flex-1">
            <h1 className="text-[15px] font-bold text-foreground">{navItems.find(n => n.id === activeSection)?.label ?? "Dashboard"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] text-muted-foreground font-medium">All engines active</span>
          </div>
          <button onClick={() => window.close()} className="text-[12px] text-muted-foreground hover:text-foreground border border-border/50 px-3 py-1.5 rounded-xl hover:bg-muted transition-colors">
            ← OS
          </button>
        </div>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto">
          {children}
          {disclaimer && (
            <div className="px-5 py-3 border-t border-border/20">
              <p className="text-[10px] text-muted-foreground text-center">{disclaimer}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
