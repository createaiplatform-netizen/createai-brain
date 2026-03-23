import React, { useState, useEffect, useRef, useCallback } from "react";
import { useOS, ALL_APPS } from "@/os/OSContext";
import type { AppId } from "@/os/OSContext";
import { PlatformStore } from "@/engine/PlatformStore";

const SAGE = "#7a9068";

interface QuickLauncherProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  system:     "Core",
  tools:      "Tools",
  world:      "World Building",
  creative:   "Creative",
  business:   "Business",
  enterprise: "Enterprise",
  lifestyle:  "Lifestyle",
  learning:   "Learning",
  health:     "Health",
  ai:         "AI & Tech",
  game:       "Game Design",
  legal:      "Legal",
  education:  "Education",
};

export function QuickLauncher({ open, onClose }: QuickLauncherProps) {
  const { openApp } = useOS();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  // Recents from PlatformStore
  const recentIds = PlatformStore.getRecent().map(r => r.appId) as AppId[];

  const filtered = (() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Show recents first, then all apps
      const recentApps = recentIds
        .map(id => ALL_APPS.find(a => a.id === id))
        .filter(Boolean) as typeof ALL_APPS;
      const rest = ALL_APPS.filter(a => !recentIds.includes(a.id as AppId));
      return [...recentApps, ...rest].slice(0, 50);
    }
    return ALL_APPS.filter(a =>
      a.label.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.category?.toLowerCase().includes(q)
    ).slice(0, 40);
  })();

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const launch = useCallback((id: AppId) => {
    openApp(id);
    onClose();
  }, [openApp, onClose]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); if (filtered[cursor]) launch(filtered[cursor].id as AppId); }
    if (e.key === "Escape")    { e.preventDefault(); onClose(); }
  }, [filtered, cursor, launch, onClose]);

  if (!open) return null;

  const q = query.toLowerCase().trim();
  const showRecentLabel = !q && recentIds.length > 0;
  const recentCount = !q ? recentIds.length : 0;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "12vh" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }} onClick={onClose} />

      {/* Panel */}
      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 560,
        background: "#fff", borderRadius: 20,
        boxShadow: "0 24px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)",
        overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "70vh",
      }}>
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: 16, color: "#94a3b8", flexShrink: 0 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={handleKey}
            placeholder="Search 408 apps — type anything…"
            style={{
              flex: 1, border: "none", outline: "none", fontSize: 15,
              color: "#0f172a", background: "transparent", fontWeight: 500,
            }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setCursor(0); inputRef.current?.focus(); }}
              style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#64748b", cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>
              Clear
            </button>
          )}
          <kbd style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, padding: "2px 6px", fontSize: 11, color: "#64748b", flexShrink: 0 }}>
            esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ overflowY: "auto", flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>No apps match "{query}"</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Try a different keyword or category</p>
            </div>
          ) : (
            <div style={{ padding: "8px 8px" }}>
              {showRecentLabel && (
                <div style={{ padding: "6px 10px 4px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Recent
                </div>
              )}
              {filtered.map((app, idx) => {
                const isActive = idx === cursor;
                const isRecent = idx < recentCount;
                const showDivider = !q && idx === recentCount && recentCount > 0;
                return (
                  <React.Fragment key={app.id}>
                    {showDivider && (
                      <div style={{ padding: "8px 10px 4px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", borderTop: "1px solid #f1f5f9", marginTop: 4 }}>
                        All Apps
                      </div>
                    )}
                    <button
                      data-idx={idx}
                      onClick={() => launch(app.id as AppId)}
                      onMouseEnter={() => setCursor(idx)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, width: "100%",
                        padding: "9px 10px", border: "none", borderRadius: 12, cursor: "pointer",
                        background: isActive ? "#f0f4ee" : "transparent",
                        textAlign: "left", transition: "background 0.1s ease",
                      }}
                    >
                      <span style={{
                        fontSize: 20, flexShrink: 0, width: 36, height: 36,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: (app.color || SAGE) + "18", borderRadius: 10,
                      }}>
                        {app.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? SAGE : "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                          {app.label}
                          {isRecent && <span style={{ fontSize: 9, background: "#f1f5f9", color: "#94a3b8", borderRadius: 4, padding: "1px 5px", fontWeight: 700, letterSpacing: "0.04em" }}>RECENT</span>}
                        </div>
                        {app.description && (
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {app.description}
                          </div>
                        )}
                      </div>
                      {app.category && (
                        <span style={{ fontSize: 10, color: "#94a3b8", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "2px 7px", flexShrink: 0, fontWeight: 600 }}>
                          {CATEGORY_LABELS[app.category] ?? app.category}
                        </span>
                      )}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "8px 16px 10px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 16, background: "#fafafa" }}>
          {[["↑↓", "Navigate"], ["↵", "Open"], ["esc", "Close"]].map(([key, label]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <kbd style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 5, padding: "2px 6px", fontSize: 10, color: "#64748b", fontWeight: 700 }}>{key}</kbd>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{label}</span>
            </div>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#94a3b8" }}>
            {filtered.length} app{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
