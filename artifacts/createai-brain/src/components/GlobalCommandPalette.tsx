// ═══════════════════════════════════════════════════════════════════════════
// GlobalCommandPalette — Cmd+K universal search. Clean premium light UI.
// No dark glass. Clean white modal, subtle shadow, indigo accent only.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ALL_ENGINES, ALL_SERIES } from "@/engine/CapabilityEngine";
import { useOS } from "@/os/OSContext";
import type { AppId } from "@/os/OSContext";
import { useLocation } from "wouter";
import { usePlatformMode, type PlatformMode } from "@/components/ModeSwitcher";

// ── Custom event helpers ──────────────────────────────────────────────────────

export function dispatchLaunchEngine(engineId: string) {
  window.dispatchEvent(new CustomEvent("cai:launch-engine", { detail: { engineId } }));
}
export function dispatchLaunchSeries(seriesId: string) {
  window.dispatchEvent(new CustomEvent("cai:launch-series", { detail: { seriesId } }));
}

// ── Types ─────────────────────────────────────────────────────────────────────

type CmdKind = "app" | "engine" | "series" | "action";

interface CmdItem {
  id: string; kind: CmdKind; label: string; sub: string;
  icon: string; color?: string; action: () => void;
}

function matches(item: CmdItem, q: string) {
  if (!q) return true;
  const hay = `${item.label} ${item.sub}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

// ── Highlight matching text ───────────────────────────────────────────────────

function Hl({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return <>
    {text.slice(0, i)}
    <mark style={{ background: "rgba(79,70,229,0.12)", color: "#4f46e5", borderRadius: 2, padding: "0 1px" }}>
      {text.slice(i, i + q.length)}
    </mark>
    {text.slice(i + q.length)}
  </>;
}

// ── Badge chips ───────────────────────────────────────────────────────────────

const CHIP: Record<CmdKind, { label: string; bg: string; color: string } | null> = {
  engine:  { label: "Engine",  bg: "rgba(79,70,229,0.08)",  color: "#4f46e5" },
  series:  { label: "Series",  bg: "rgba(124,58,237,0.08)", color: "#7c3aed" },
  action:  null,
  app:     null,
};

// ── Main component ────────────────────────────────────────────────────────────

export function GlobalCommandPalette() {
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState("");
  const [cursor, setCursor] = useState(0);
  const { openApp, appRegistry } = useOS();
  const [, setLocation] = useLocation();
  const { setMode } = usePlatformMode();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault(); setOpen(o => !o); setQuery(""); setCursor(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 40); }, [open]);

  const commands: CmdItem[] = React.useMemo(() => {
    const nav = (path: string) => { setLocation(path); setOpen(false); };
    const switchMode = (m: PlatformMode) => { setMode(m); setOpen(false); };
    const actions: CmdItem[] = [
      { id: "act:vault",           kind: "action", label: "Open Output Vault",    sub: "All saved engine outputs",        icon: "\uD83D\uDDB4",  action: () => { openApp("brainhub"); setTimeout(() => window.dispatchEvent(new CustomEvent("cai:nav", { detail: { view: "vault" } })), 120); setOpen(false); } },
      { id: "act:compliance",      kind: "action", label: "Compliance Panel",     sub: "Safety & regulatory overview",    icon: "\uD83D\uDEE1\uFE0F", action: () => { openApp("brainhub"); setTimeout(() => window.dispatchEvent(new CustomEvent("cai:nav", { detail: { view: "compliance" } })), 120); setOpen(false); } },
      { id: "act:intelligence",    kind: "action", label: "Intelligence Panel",   sub: "Session context & insights",      icon: "\uD83E\uDDE0", action: () => { openApp("brainhub"); setTimeout(() => window.dispatchEvent(new CustomEvent("cai:nav", { detail: { view: "intelligence" } })), 120); setOpen(false); } },
      { id: "act:dash",            kind: "action", label: "BrainHub Dashboard",   sub: "Engines, series, agents",         icon: "\u26A1",  action: () => { openApp("brainhub"); setOpen(false); } },
      { id: "act:full-auto",       kind: "action", label: "Full Auto Create",      sub: "AI-orchestrated project creation", icon: "\uD83E\uDD16", action: () => nav("/full-auto-create") },
      { id: "act:universe-map",    kind: "action", label: "Universe Map",          sub: "Visual platform topology",        icon: "\uD83C\uDF0C", action: () => nav("/universe-map") },
      { id: "act:autonomous-exec", kind: "action", label: "Autonomous Execution",  sub: "Goal-driven AI engine orchestrator", icon: "\u26A1",   action: () => nav("/autonomous-execution") },
      { id: "act:project-library", kind: "action", label: "Project Library",       sub: "All generated projects",          icon: "\uD83D\uDCDA", action: () => nav("/projects/library") },
      { id: "act:self-check",      kind: "action", label: "System Self-Check",     sub: "Admin: platform health scan",     icon: "\uD83D\uDEE1\uFE0F", action: () => nav("/system/self-check") },
      { id: "mode:build",    kind: "action", label: "Mode \u2192 Build",    sub: "Switch to Build mode",    icon: "\uD83D\uDD27", action: () => switchMode("Build") },
      { id: "mode:explore",  kind: "action", label: "Mode \u2192 Explore",  sub: "Switch to Explore mode",  icon: "\uD83D\uDD2D", action: () => switchMode("Explore") },
      { id: "mode:operate",  kind: "action", label: "Mode \u2192 Operate",  sub: "Switch to Operate mode",  icon: "\u26A1",       action: () => switchMode("Operate") },
      { id: "mode:analyze",  kind: "action", label: "Mode \u2192 Analyze",  sub: "Switch to Analyze mode",  icon: "\uD83D\uDCCA", action: () => switchMode("Analyze") },
      { id: "mode:expand",   kind: "action", label: "Mode \u2192 Expand",   sub: "Switch to Expand mode",   icon: "\uD83C\uDF10", action: () => switchMode("Expand") },
    ];
    const apps: CmdItem[] = appRegistry.map(app => ({
      id: `app:${app.id}`, kind: "app" as CmdKind, label: app.label,
      sub: app.description ?? "Open app", icon: app.icon,
      action: () => { openApp(app.id as AppId); setOpen(false); },
    }));
    const engines: CmdItem[] = ALL_ENGINES.slice(0, 258).map(eng => ({
      id: `eng:${eng.id}`, kind: "engine" as CmdKind, label: eng.name,
      sub: eng.category ?? "Engine", icon: eng.icon ?? "⚙️", color: eng.color,
      action: () => { openApp("brainhub"); setTimeout(() => dispatchLaunchEngine(eng.id), 120); setOpen(false); },
    }));
    const series: CmdItem[] = ALL_SERIES.map(s => ({
      id: `ser:${s.id}`, kind: "series" as CmdKind, label: s.name,
      sub: `${s.engines?.length ?? 0} engines`, icon: s.icon ?? "🧬", color: s.color,
      action: () => { openApp("brainhub"); setTimeout(() => dispatchLaunchSeries(s.id), 120); setOpen(false); },
    }));
    return [...actions, ...apps, ...engines, ...series];
  }, [appRegistry, openApp, setLocation, setMode]);

  const filtered = React.useMemo(() => commands.filter(c => matches(c, query)), [commands, query]);

  const groups: { label: string; items: CmdItem[] }[] = React.useMemo(() => {
    const by: Record<CmdKind, CmdItem[]> = { action: [], app: [], engine: [], series: [] };
    filtered.forEach(c => by[c.kind].push(c));
    const out: { label: string; items: CmdItem[] }[] = [];
    if (by.action.length)  out.push({ label: "Quick actions", items: by.action });
    if (by.app.length)     out.push({ label: "Apps",          items: by.app });
    if (by.engine.length)  out.push({ label: "Engines",       items: by.engine.slice(0, query ? 30 : 8) });
    if (by.series.length)  out.push({ label: "Series",        items: by.series.slice(0, query ? 20 : 4) });
    return out;
  }, [filtered, query]);

  const flat = groups.flatMap(g => g.items);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === "Enter") { flat[cursor]?.action(); }
  }, [flat, cursor]);

  useEffect(() => { setCursor(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  let idx = 0;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.18)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "10vh",
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.10)",
          borderRadius: 14, width: "100%", maxWidth: 600,
          boxShadow: "0 24px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.07)",
          overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "65vh",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 16px", borderBottom: "1px solid rgba(0,0,0,0.07)",
        }}>
          <span style={{ fontSize: 14, color: "#94a3b8" }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search engines, apps, series…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 14, color: "#0f172a", caretColor: "#4f46e5",
            }}
          />
          <kbd style={{
            fontSize: 10, color: "#94a3b8", background: "rgba(0,0,0,0.05)",
            borderRadius: 5, padding: "2px 7px", fontFamily: "monospace", border: "1px solid rgba(0,0,0,0.08)",
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ overflowY: "auto", flex: 1 }}>
          {groups.length === 0 ? (
            <div style={{ padding: "36px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              No results for "{query}"
            </div>
          ) : groups.map(g => (
            <div key={g.label}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "#94a3b8",
                letterSpacing: "0.07em", textTransform: "uppercase",
                padding: "10px 16px 3px",
              }}>{g.label}</div>
              {g.items.map(item => {
                const myIdx = idx++;
                const active = myIdx === cursor;
                const chip = CHIP[item.kind];
                return (
                  <div
                    key={item.id}
                    data-idx={myIdx}
                    onClick={item.action}
                    onMouseEnter={() => setCursor(myIdx)}
                    style={{
                      display: "flex", alignItems: "center", gap: 11,
                      padding: "8px 16px", cursor: "pointer",
                      background: active ? "rgba(79,70,229,0.06)" : "transparent",
                      transition: "background 0.08s",
                    }}
                  >
                    <span style={{
                      fontSize: 17, flexShrink: 0, width: 26, textAlign: "center",
                    }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: active ? 600 : 400,
                        color: active ? "#0f172a" : "#1e293b",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        <Hl text={item.label} q={query} />
                      </div>
                      <div style={{
                        fontSize: 11, color: "#94a3b8", marginTop: 0.5,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        <Hl text={item.sub} q={query} />
                      </div>
                    </div>
                    {chip && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, background: chip.bg, color: chip.color,
                        borderRadius: 4, padding: "2px 6px", flexShrink: 0,
                      }}>{chip.label}</span>
                    )}
                    {active && (
                      <kbd style={{
                        fontSize: 10, color: "#94a3b8", background: "rgba(0,0,0,0.04)",
                        borderRadius: 4, padding: "2px 6px", fontFamily: "monospace",
                        border: "1px solid rgba(0,0,0,0.08)", flexShrink: 0,
                      }}>↵</kbd>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: "7px 16px", borderTop: "1px solid rgba(0,0,0,0.06)",
          display: "flex", gap: 14, alignItems: "center", background: "#FAFAFA",
        }}>
          {[["↑↓", "navigate"], ["↵", "open"], ["Esc", "close"]].map(([key, lbl]) => (
            <span key={key} style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <kbd style={{
                fontSize: 10, color: "#64748b", background: "#fff",
                border: "1px solid rgba(0,0,0,0.12)", borderRadius: 4,
                padding: "1px 5px", fontFamily: "monospace",
              }}>{key}</kbd>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{lbl}</span>
            </span>
          ))}
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: "#cbd5e1" }}>
            {ALL_ENGINES.length} engines · {ALL_SERIES.length} series
          </span>
        </div>
      </div>
    </div>
  );
}
