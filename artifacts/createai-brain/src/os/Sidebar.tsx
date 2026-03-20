// ═══════════════════════════════════════════════════════════════════════════
// Sidebar — Premium light design. Warm gray rail, clean indigo accents.
// Inspired by Linear / Stripe / Apple. No dark, no neon, no glow.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useOS, ALL_APPS, AppId } from "./OSContext";
import { AppBrowserModal } from "./AppBrowserModal";
import { useContextStore } from "@/controller";
import { LocalSyncIndicator } from "@/components/LocalSyncIndicator";
import { favGetAll } from "@/services/EngineFavoritesService";
import { ALL_ENGINES } from "@/engine/CapabilityEngine";
import { dispatchLaunchEngine } from "@/components/GlobalCommandPalette";
import { getProposalStats } from "@/engine/ContinuousImprovementEngine";

// ─── Pinned apps ──────────────────────────────────────────────────────────────
const PINNED_IDS: AppId[] = [
  "chat"          as AppId,
  "projos"        as AppId,
  "creator"       as AppId,
  "brainhub"      as AppId,
  "marketing"     as AppId,
  "documents"     as AppId,
  "simulation"    as AppId,
  "people"        as AppId,
  "commandcenter" as AppId,
  "admin"         as AppId,
];

// ─── Tokens ───────────────────────────────────────────────────────────────────
const BG         = "#F7F8FA";           // warm off-white rail
const BG_HOVER   = "rgba(0,0,0,0.04)";
const BORDER_COL = "rgba(0,0,0,0.07)";
const TEXT_DIM   = "#94a3b8";
const TEXT_BASE  = "#64748b";
const TEXT_DARK  = "#1e293b";
const ACCENT     = "#4f46e5";           // slightly deeper indigo for readability on white
const ACCENT_BG  = "rgba(79,70,229,0.08)";

interface SidebarProps {
  onNav?: () => void;
  forceCollapsed?: boolean;
  forceExpanded?: boolean;
}

export function Sidebar({ onNav, forceCollapsed, forceExpanded }: SidebarProps) {
  const { activeApp, sidebarCollapsed, openApp, closeApp, toggleSidebar, unreadCount } = useOS();
  const [location, setLocation] = useLocation();
  const [showBrowser, setShowBrowser] = useState(false);
  const { totalRuns } = useContextStore().getState();
  const [favIds, setFavIds] = useState<string[]>(() => favGetAll());

  const collapsed = forceCollapsed ? true : forceExpanded ? false : sidebarCollapsed;
  const width     = collapsed ? 60 : 224;

  const handleNav = (fn: () => void) => { fn(); onNav?.(); };

  const evolutionStats = useMemo(() => getProposalStats(), []);

  const pinnedApps = PINNED_IDS
    .map(id => ALL_APPS.find(a => a.id === id))
    .filter((a): a is NonNullable<typeof a> => !!a);

  // Stay in sync when user pins/unpins engines
  useEffect(() => {
    const sync = () => setFavIds(favGetAll());
    window.addEventListener("cai:fav-changed", sync);
    return () => window.removeEventListener("cai:fav-changed", sync);
  }, []);

  const favEngines = favIds
    .map(id => ALL_ENGINES.find(e => e.id === id))
    .filter(Boolean) as (typeof ALL_ENGINES)[number][];

  return (
    <>
      <aside style={{
        width, flexShrink: 0, display: "flex", flexDirection: "column",
        height: "100%", overflow: "hidden", background: BG,
        borderRight: `1px solid ${BORDER_COL}`,
        transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}>

        {/* Brand */}
        <div style={{
          display: "flex", alignItems: "center", height: 54,
          padding: "0 12px", gap: 10, borderBottom: `1px solid ${BORDER_COL}`, flexShrink: 0,
        }}>
          <button
            onClick={() => { if (!forceCollapsed && !forceExpanded) toggleSidebar(); }}
            style={{
              width: 30, height: 30, borderRadius: 9, flexShrink: 0, border: "none",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              boxShadow: "0 1px 4px rgba(99,102,241,0.30)",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800,
              transition: "transform 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.06)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            title="CreateAI Brain"
          >C</button>
          {!collapsed && (
            <span style={{
              fontSize: 13, fontWeight: 700, color: TEXT_DARK,
              letterSpacing: "-0.02em", flex: 1, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>CreateAI Brain</span>
          )}
        </div>

        {/* Search pill */}
        <div style={{ padding: collapsed ? "8px 10px 4px" : "8px 10px 4px" }}>
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: 8, padding: collapsed ? "6px" : "5px 9px",
              cursor: "pointer", transition: "border-color 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.14)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)"; }}
            title={collapsed ? "Search (⌘K)" : undefined}
          >
            {collapsed
              ? <span style={{ fontSize: 13, color: TEXT_DIM }}>⌘</span>
              : <>
                  <span style={{ fontSize: 11, color: TEXT_DIM }}>Search anything…</span>
                  <kbd style={{
                    fontSize: 9, color: TEXT_DIM, background: "rgba(0,0,0,0.06)",
                    borderRadius: 4, padding: "2px 5px", fontFamily: "monospace", fontWeight: 700,
                  }}>⌘K</kbd>
                </>
            }
          </button>
        </div>

        {/* Favorite engines strip */}
        {favEngines.length > 0 && (
          <div style={{ padding: "4px 10px 2px" }}>
            {!collapsed && (
              <p style={{
                fontSize: 9, fontWeight: 700, color: TEXT_DIM, letterSpacing: "0.08em",
                textTransform: "uppercase", margin: "0 0 4px 2px",
              }}>Engines</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {favEngines.map(eng => (
                <button
                  key={eng.id}
                  title={collapsed ? eng.name : undefined}
                  onClick={() => {
                    handleNav(() => {
                      openApp("brainhub" as AppId);
                      setTimeout(() => dispatchLaunchEngine(eng.id), 120);
                    });
                  }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                    height: 30, borderRadius: 7, padding: collapsed ? "0 6px" : "0 8px",
                    background: "transparent", border: "none", cursor: "pointer",
                    color: TEXT_BASE, fontSize: 11, fontWeight: 500,
                    transition: "background 0.12s, color 0.12s",
                    justifyContent: collapsed ? "center" : "flex-start",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BG_HOVER; (e.currentTarget as HTMLElement).style.color = TEXT_DARK; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = TEXT_BASE; }}
                >
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{eng.icon}</span>
                  {!collapsed && (
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>
                      {eng.name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Apps section */}
        {!collapsed && (
          <p style={{
            fontSize: 9, fontWeight: 700, color: TEXT_DIM, letterSpacing: "0.08em",
            textTransform: "uppercase", margin: "8px 0 2px 12px",
          }}>Apps</p>
        )}

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", padding: "2px 8px" }}>
          <NavItem icon="🏠" label="Home"
            active={activeApp === null && location === "/"}
            collapsed={collapsed}
            onClick={() => handleNav(() => { closeApp(); setLocation("/"); })}
          />
          <div style={{ height: 2 }} />
          {pinnedApps.map(app => (
            <NavItem
              key={app.id}
              icon={app.icon} label={app.label}
              active={activeApp === app.id}
              collapsed={collapsed}
              onClick={() => handleNav(() => openApp(app.id as AppId))}
              color={app.color}
              badge={app.id === "notifications" && unreadCount > 0 ? unreadCount : undefined}
            />
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, margin: "0 12px", background: BORDER_COL }} />

        {/* Above-Transcend Engine */}
        <div style={{ padding: "6px 8px 0" }}>
          <button
            onClick={() => handleNav(() => setLocation("/above-transcend"))}
            title={collapsed ? "▲ Above-Transcend Engine" : undefined}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              gap: collapsed ? 0 : 7, height: 30, borderRadius: 8,
              padding: collapsed ? "0" : "0 8px",
              justifyContent: collapsed ? "center" : "flex-start",
              background: location === "/above-transcend" ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.18)",
              cursor: "pointer", transition: "background 0.12s, border-color 0.12s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.14)"; }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background =
                location === "/above-transcend" ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.06)";
            }}
          >
            <span style={{ fontSize: 13, flexShrink: 0 }}>▲</span>
            {!collapsed && (
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#6366f1", flex: 1, textAlign: "left" }}>
                AboveTranscend
              </span>
            )}
          </button>
        </div>

        {/* Engine run count */}
        {totalRuns > 0 && (
          <div style={{ padding: "6px 8px 0" }}>
            <button
              onClick={() => handleNav(() => openApp("brainhub" as AppId))}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 7,
                height: 30, borderRadius: 7, padding: "0 8px",
                background: ACCENT_BG, border: "none", cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(79,70,229,0.13)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ACCENT_BG; }}
              title={collapsed ? `${totalRuns} engine runs` : undefined}
            >
              <span style={{ fontSize: 13, flexShrink: 0 }}>🧠</span>
              {!collapsed && (
                <span style={{ fontSize: 10, fontWeight: 600, color: ACCENT, flex: 1, textAlign: "left" }}>
                  {totalRuns} run{totalRuns !== 1 ? "s" : ""}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Browse all */}
        <div style={{ padding: "6px 8px" }}>
          <button
            onClick={() => setShowBrowser(true)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 7,
              height: 32, borderRadius: 8, padding: "0 8px",
              background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)",
              cursor: "pointer", fontSize: 11, fontWeight: 600, color: ACCENT,
              transition: "background 0.12s, border-color 0.12s",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = ACCENT_BG; (e.currentTarget as HTMLElement).style.borderColor = "rgba(79,70,229,0.2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.03)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)"; }}
            title={collapsed ? "Browse all apps" : undefined}
          >
            <span style={{ fontSize: 13, flexShrink: 0 }}>⊞</span>
            {!collapsed && <span>All apps</span>}
          </button>
        </div>

        {/* Evolution Pulse — platform-wide continuous improvement indicator */}
        <div style={{ padding: "0 8px 4px" }}>
          <button
            onClick={() => handleNav(() => openApp("commandcenter" as AppId))}
            title={collapsed ? `⚡ ${evolutionStats.total} improvements identified` : undefined}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              gap: collapsed ? 0 : 7,
              height: 30, borderRadius: 8,
              padding: collapsed ? "0" : "0 8px",
              justifyContent: collapsed ? "center" : "flex-start",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.18)",
              cursor: "pointer",
              transition: "background 0.12s, border-color 0.12s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.14)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.30)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.08)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.18)";
            }}
          >
            {/* Pulsing dot */}
            <span style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 18 }}>
              <span style={{
                display: "block", width: 7, height: 7, borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 0 0 rgba(16,185,129,0.5)",
                animation: "evolve-pulse 2s infinite",
              }} />
            </span>
            {!collapsed && (
              <span style={{
                flex: 1, fontSize: 10.5, fontWeight: 700, color: "#047857",
                textAlign: "left", lineHeight: 1.2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                ⚡ {evolutionStats.total} improvements
              </span>
            )}
            {!collapsed && evolutionStats.foundationalCount > 0 && (
              <span style={{
                flexShrink: 0, fontSize: 8.5, fontWeight: 800,
                background: "#f59e0b", color: "#fff",
                borderRadius: 9, padding: "1px 5px",
              }}>{evolutionStats.foundationalCount} new</span>
            )}
          </button>
        </div>

        {/* Local sync */}
        <div style={{ padding: "0 8px 2px" }}>
          <LocalSyncIndicator collapsed={collapsed} />
        </div>

        {/* Collapse toggle */}
        {!forceCollapsed && !forceExpanded && (
          <div style={{ padding: "4px 8px 10px", borderTop: `1px solid ${BORDER_COL}` }}>
            <button
              onClick={toggleSidebar}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                gap: 5, height: 26, borderRadius: 7, border: "none", background: "transparent",
                cursor: "pointer", fontSize: 10, color: TEXT_DIM,
                transition: "background 0.12s, color 0.12s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BG_HOVER; (e.currentTarget as HTMLElement).style.color = TEXT_BASE; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = TEXT_DIM; }}
            >
              <span>{collapsed ? "▶" : "◀"}</span>
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>
        )}
      </aside>

      {showBrowser && <AppBrowserModal onClose={() => setShowBrowser(false)} />}
    </>
  );
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({ icon, label, active, collapsed, onClick, color, badge }: {
  icon: string; label: string; active: boolean; collapsed: boolean;
  onClick: () => void; color?: string; badge?: number;
}) {
  const accent = color ?? ACCENT;
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        width: "100%", display: "flex", alignItems: "center",
        gap: 8, height: 32, borderRadius: 8,
        padding: collapsed ? "0" : "0 9px",
        justifyContent: collapsed ? "center" : "flex-start",
        background: active ? ACCENT_BG : "transparent",
        color: active ? ACCENT : TEXT_BASE,
        fontWeight: active ? 600 : 400,
        fontSize: 12.5, border: "none", cursor: "pointer",
        transition: "background 0.1s, color 0.1s",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = BG_HOVER;
          (e.currentTarget as HTMLElement).style.color = TEXT_DARK;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = TEXT_BASE;
        }
      }}
    >
      <span style={{ position: "relative", flexShrink: 0, fontSize: 14, width: 18, textAlign: "center" }}>
        {icon}
        {badge !== undefined && badge > 0 && (
          <span style={{
            position: "absolute", top: -3, right: -4,
            minWidth: 13, height: 13, borderRadius: 7,
            background: "#ef4444", color: "#fff",
            fontSize: 8, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
          }}>{badge > 99 ? "99+" : badge}</span>
        )}
      </span>
      {!collapsed && (
        <span style={{
          flex: 1, textAlign: "left", overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em",
        }}>{label}</span>
      )}
      {!collapsed && active && (
        <span style={{
          width: 5, height: 5, borderRadius: "50%", background: accent, flexShrink: 0,
        }} />
      )}
    </button>
  );
}
