// ═══════════════════════════════════════════════════════════════════════════
// ModeSwitcher.tsx
// 5-mode platform mode switcher: Build / Explore / Operate / Analyze / Expand.
// Stores mode in localStorage. Exposes a context hook for consumers.
// ═══════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

// ── Types ────────────────────────────────────────────────────────────────────

export type PlatformMode = "Build" | "Explore" | "Operate" | "Analyze" | "Expand";

const MODES: {
  id:          PlatformMode;
  icon:        string;
  color:       string;
  description: string;
  routes:      string[];
}[] = [
  {
    id: "Build", icon: "🔨", color: "#6366f1",
    description: "Create, generate, and build systems.",
    routes: ["/full-auto-create", "/auto-project", "/projects", "/studio"],
  },
  {
    id: "Explore", icon: "🌌", color: "#7c3aed",
    description: "Discover the Universe OS and reality layers.",
    routes: ["/universe-map", "/universe", "/ceiling", "/reality", "/self", "/public-explorer"],
  },
  {
    id: "Operate", icon: "⚡", color: "#059669",
    description: "Run workflows, manage family, and route operations.",
    routes: ["/family", "/venton-way", "/broadcast", "/electric", "/everything", "/live-sim"],
  },
  {
    id: "Analyze", icon: "📊", color: "#0284c7",
    description: "Review scores, analytics, and growth metrics.",
    routes: ["/platform-score", "/system-status", "/analytics", "/traction", "/cohorts", "/growth"],
  },
  {
    id: "Expand", icon: "🚀", color: "#d97706",
    description: "Expand the universe, engines, and capabilities.",
    routes: ["/universe-map", "/expansion", "/growth-path", "/creation-engines"],
  },
];

// ── Context ───────────────────────────────────────────────────────────────────

interface ModeContextValue {
  mode:    PlatformMode;
  setMode: (m: PlatformMode) => void;
  modes:   typeof MODES;
}

const ModeContext = createContext<ModeContextValue>({
  mode:    "Build",
  setMode: () => {},
  modes:   MODES,
});

const LS_KEY = "cai_platform_mode";

export function ModeSwitcherProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<PlatformMode>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    return (MODES.find(m => m.id === saved)?.id ?? "Build") as PlatformMode;
  });

  const setMode = useCallback((m: PlatformMode) => {
    setModeState(m);
    localStorage.setItem(LS_KEY, m);
  }, []);

  return (
    <ModeContext.Provider value={{ mode, setMode, modes: MODES }}>
      {children}
    </ModeContext.Provider>
  );
}

export function usePlatformMode() {
  return useContext(ModeContext);
}

// ── ModeSwitcher widget ───────────────────────────────────────────────────────

export function ModeSwitcher({ compact = false }: { compact?: boolean }) {
  const { mode, setMode, modes } = usePlatformMode();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const current = modes.find(m => m.id === mode)!;

  if (compact) {
    return (
      <div style={{ position: "relative", display: "inline-flex" }}>
        <button
          onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: `${current.color}15`, border: `1px solid ${current.color}30`,
            color: current.color, borderRadius: 8, padding: "4px 10px",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
          }}
        >
          <span>{current.icon}</span>
          <span>{current.id}</span>
          <span style={{ fontSize: 9, color: current.color, opacity: 0.7 }}>▼</span>
        </button>

        {open && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0,
              background: "#0F172A", border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 12, padding: "6px", minWidth: 220, zIndex: 9999,
              boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
            }}
          >
            {modes.map(m => (
              <button
                key={m.id}
                onClick={() => {
                  setMode(m.id);
                  const route = m.routes[0];
                  if (route) setLocation(route);
                  setOpen(false);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "8px 10px", borderRadius: 8,
                  background: mode === m.id ? `${m.color}15` : "transparent",
                  border: "none", cursor: "pointer", textAlign: "left",
                  transition: "background 0.1s",
                }}
              >
                <span style={{ fontSize: 16 }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: mode === m.id ? 700 : 500, color: mode === m.id ? m.color : "#cbd5e1" }}>
                    {m.id}
                  </div>
                  <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.3 }}>
                    {m.description}
                  </div>
                </div>
                {mode === m.id && (
                  <span style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full horizontal bar
  return (
    <div style={{
      display: "flex", gap: 4, overflowX: "auto",
      padding: "4px 0",
    }}>
      {modes.map(m => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            title={m.description}
            onClick={() => {
              setMode(m.id);
              const route = m.routes[0];
              if (route) setLocation(route);
            }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 8,
              background: active ? `${m.color}18` : "transparent",
              border: `1px solid ${active ? m.color + "40" : "transparent"}`,
              color: active ? m.color : "#64748b",
              fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer",
              transition: "all 0.12s", whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 13 }}>{m.icon}</span>
            <span>{m.id}</span>
          </button>
        );
      })}
    </div>
  );
}

export { MODES };
