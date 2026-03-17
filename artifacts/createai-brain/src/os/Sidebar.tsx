import React, { useState } from "react";
import { useLocation } from "wouter";
import { useOS, ALL_APPS, AppId } from "./OSContext";
import { AppBrowserModal } from "./AppBrowserModal";

// ─── Pinned app IDs shown permanently in the sidebar ─────────────────────────
// These are the highest-value apps for daily use.
// Everything else is accessible via the App Browser.
const PINNED_IDS: AppId[] = [
  "chat"         as AppId,
  "projos"       as AppId,
  "creator"      as AppId,
  "brainhub"     as AppId,
  "brainGen"     as AppId,
  "marketing"    as AppId,
  "documents"    as AppId,
  "simulation"   as AppId,
  "people"       as AppId,
  "commandcenter" as AppId,
  "admin"        as AppId,
];

interface SidebarProps {
  onNav?: () => void;
  forceCollapsed?: boolean;
  forceExpanded?: boolean;
}

export function Sidebar({ onNav, forceCollapsed, forceExpanded }: SidebarProps) {
  const { activeApp, sidebarCollapsed, openApp, closeApp, toggleSidebar, unreadCount } = useOS();
  const [location, setLocation] = useLocation();
  const [showBrowser, setShowBrowser] = useState(false);

  const collapsed = forceCollapsed ? true : forceExpanded ? false : sidebarCollapsed;
  const width = collapsed ? 64 : 220;

  const handleNav = (fn: () => void) => { fn(); onNav?.(); };

  // Build pinned apps list — preserving the order from PINNED_IDS
  const pinnedApps = PINNED_IDS
    .map(id => ALL_APPS.find(a => a.id === id))
    .filter((a): a is NonNullable<typeof a> => !!a);

  return (
    <>
      <aside
        className="flex flex-col h-full flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
        style={{ width, background: "#fff", borderRight: "1px solid rgba(0,0,0,0.08)", boxShadow: "2px 0 8px rgba(0,0,0,0.03)" }}
      >
        {/* ── Brand ── */}
        <div className="flex items-center h-14 px-3 gap-2.5 overflow-hidden flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <button
            onClick={() => { if (!forceCollapsed && !forceExpanded) toggleSidebar(); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 transition-all duration-200 hover:scale-105"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 2px 8px rgba(99,102,241,0.28)" }}
            title="CreateAI Brain"
          >C</button>
          {!collapsed && (
            <span className="font-semibold text-[13px] truncate" style={{ color: "#0f172a", letterSpacing: "-0.01em" }}>
              CreateAI Brain
            </span>
          )}
        </div>

        {/* ── Home + Metrics ── */}
        <div className="px-2 pt-3 pb-1 space-y-0.5">
          <SidebarItem
            icon="🏠" label="Home"
            active={activeApp === null && location === "/"}
            collapsed={collapsed}
            onClick={() => handleNav(() => { closeApp(); setLocation("/"); })}
          />
          <SidebarItem
            icon="📊" label="Metrics"
            active={location === "/metrics"}
            collapsed={collapsed}
            onClick={() => handleNav(() => setLocation("/metrics"))}
          />
        </div>

        {/* ── Divider ── */}
        <div className="mx-3 my-1" style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

        {/* ── Pinned Apps ── */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 overscroll-contain">
          {!collapsed && (
            <p className="px-2 pt-2 pb-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "#d1d5db" }}>
              Apps
            </p>
          )}
          <div className="space-y-0.5">
            {pinnedApps.map(app => (
              <SidebarItem
                key={app.id}
                icon={app.icon}
                label={app.label}
                active={activeApp === app.id}
                collapsed={collapsed}
                onClick={() => handleNav(() => openApp(app.id as AppId))}
                color={app.color}
                badge={app.id === "notifications" && unreadCount > 0 ? unreadCount : undefined}
              />
            ))}
          </div>
        </div>

        {/* ── Browse all apps ── */}
        <div className="px-2 pb-2 pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <button
            onClick={() => setShowBrowser(true)}
            className="w-full flex items-center gap-2.5 h-9 rounded-xl px-2 text-[12px] font-semibold transition-all duration-150"
            style={{ color: "#6366f1", background: "rgba(99,102,241,0.06)" }}
            title={collapsed ? "Browse all apps" : undefined}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.12)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.06)"; }}
          >
            <span className="flex-shrink-0 text-[16px] text-center w-5">⊞</span>
            {!collapsed && <span className="truncate flex-1 text-left">Browse all apps</span>}
          </button>
        </div>

        {/* ── Collapse toggle ── */}
        {!forceCollapsed && !forceExpanded && (
          <div className="px-2 pb-3 pt-0.5" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center gap-2 h-8 rounded-xl text-xs font-medium transition-all duration-200"
              style={{ color: "#c4c9d4" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#c4c9d4"; }}
            >
              <span style={{ fontSize: 10 }}>{collapsed ? "▶" : "◀"}</span>
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>
        )}
      </aside>

      {/* ── App Browser Modal ── */}
      {showBrowser && <AppBrowserModal onClose={() => setShowBrowser(false)} />}
    </>
  );
}

// ─── SidebarItem ──────────────────────────────────────────────────────────────

function SidebarItem({ icon, label, active, collapsed, onClick, color, badge }: {
  icon: string; label: string; active: boolean; collapsed: boolean;
  onClick: () => void; color?: string; badge?: number;
}) {
  const accentColor = color ?? "#6366f1";

  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className="w-full flex items-center gap-2.5 h-9 rounded-xl px-2 text-[13px] font-medium transition-all duration-150"
      style={active
        ? { background: `${accentColor}14`, color: accentColor }
        : { color: "#6b7280" }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)";
          (e.currentTarget as HTMLElement).style.color = "#0f172a";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "#6b7280";
        }
      }}
    >
      <span className="relative flex-shrink-0 w-5 text-center leading-none">
        <span className="text-base">{icon}</span>
        {badge !== undefined && badge > 0 && (
          <span
            className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-white font-bold"
            style={{ fontSize: 9, background: "#ef4444", lineHeight: 1, padding: "0 3px" }}
          >{badge > 99 ? "99+" : badge}</span>
        )}
      </span>
      {!collapsed && (
        <span className="truncate flex-1 text-left" style={{ letterSpacing: "-0.01em" }}>{label}</span>
      )}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-bold"
          style={{ fontSize: 10, background: "#ef4444", padding: "0 4px" }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {!collapsed && active && badge === undefined && (
        <span className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: accentColor }} />
      )}
    </button>
  );
}
