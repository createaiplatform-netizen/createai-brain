import React from "react";
import { useOS, ALL_APPS, AppId, AppDef } from "./OSContext";

interface SidebarProps {
  onNav?: () => void;
  forceCollapsed?: boolean;
  forceExpanded?: boolean;
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  core:     { label: "Core",       icon: "⬡" },
  tools:    { label: "Build",      icon: "⚒" },
  business: { label: "Business",   icon: "◈" },
  system:   { label: "System",     icon: "⛭" },
};

const CATEGORY_ORDER = ["core", "tools", "business", "system"];

function groupApps(apps: AppDef[]): { category: string; apps: AppDef[] }[] {
  const groups: Record<string, AppDef[]> = {};
  for (const app of apps) {
    const cat = app.category ?? "core";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(app);
  }
  return CATEGORY_ORDER.filter(c => groups[c]?.length > 0).map(c => ({ category: c, apps: groups[c] }));
}

export function Sidebar({ onNav, forceCollapsed, forceExpanded }: SidebarProps) {
  const { activeApp, sidebarCollapsed, openApp, closeApp, toggleSidebar } = useOS();

  const collapsed = forceCollapsed ? true : forceExpanded ? false : sidebarCollapsed;
  const width = collapsed ? 64 : 224;
  const groups = groupApps(ALL_APPS);

  const handleNav = (fn: () => void) => {
    fn();
    onNav?.();
  };

  return (
    <aside
      className="flex flex-col h-full flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out glass-sidebar"
      style={{ width }}
    >
      {/* ── Brand row ── */}
      <div
        className="flex items-center h-14 px-3 gap-2.5 overflow-hidden flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => { if (!forceCollapsed && !forceExpanded) toggleSidebar(); }}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 transition-all duration-200 hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            boxShadow: "0 2px 12px rgba(99,102,241,0.45)",
          }}
          title="CreateAI Brain"
        >
          C
        </button>
        {!collapsed && (
          <span
            className="font-semibold text-[13px] truncate"
            style={{ color: "rgba(255,255,255,0.88)", letterSpacing: "-0.01em" }}
          >
            CreateAI OS
          </span>
        )}
      </div>

      {/* ── Home ── */}
      <div className="px-2 pt-3 pb-1">
        <SidebarItem
          icon="🏠"
          label="Home"
          active={activeApp === null}
          collapsed={collapsed}
          onClick={() => handleNav(closeApp)}
        />
      </div>

      {/* ── App list with categories ── */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {groups.map(group => (
          <div key={group.category} className="mb-2">
            {!collapsed && (
              <div className="flex items-center gap-2 px-2 py-1.5">
                <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.20)" }}>
                  {CATEGORY_META[group.category]?.icon}
                </span>
                <p
                  className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.22)", letterSpacing: "0.10em" }}
                >
                  {CATEGORY_META[group.category]?.label}
                </p>
              </div>
            )}
            {collapsed && group.category !== "core" && (
              <div className="mx-auto w-4 h-px my-2" style={{ background: "rgba(255,255,255,0.08)" }} />
            )}
            <div className="space-y-0.5">
              {group.apps.map(app => (
                <SidebarItem
                  key={app.id}
                  icon={app.icon}
                  label={app.label}
                  active={activeApp === app.id}
                  collapsed={collapsed}
                  onClick={() => handleNav(() => openApp(app.id as AppId))}
                  color={app.color}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Collapse toggle ── */}
      {!forceCollapsed && !forceExpanded && (
        <div className="px-2 pb-3 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-2 h-8 rounded-xl text-xs font-medium transition-all duration-200"
            style={{ color: "rgba(255,255,255,0.30)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.60)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.30)";
            }}
          >
            <span style={{ fontSize: 11 }}>{collapsed ? "▶" : "◀"}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}
    </aside>
  );
}

function SidebarItem({
  icon, label, active, collapsed, onClick, color,
}: {
  icon: string;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  color?: string;
}) {
  const accentColor = color ?? "#6366f1";

  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className="w-full flex items-center gap-2.5 h-9 rounded-xl px-2 text-[13px] font-medium transition-all duration-150"
      style={
        active
          ? {
              background: `${accentColor}18`,
              color: "#a5b4fc",
              boxShadow: `inset 0 0 0 1px ${accentColor}28`,
            }
          : { color: "rgba(255,255,255,0.42)" }
      }
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.82)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.42)";
        }
      }}
    >
      <span
        className="text-base flex-shrink-0 w-5 text-center leading-none"
        style={active ? {} : {}}
      >
        {icon}
      </span>
      {!collapsed && (
        <span className="truncate flex-1 text-left" style={{ letterSpacing: "-0.01em" }}>
          {label}
        </span>
      )}
      {!collapsed && active && (
        <span
          className="w-1 h-4 rounded-full flex-shrink-0"
          style={{ background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}88)` }}
        />
      )}
    </button>
  );
}
