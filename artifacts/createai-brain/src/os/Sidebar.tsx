import React from "react";
import { useOS, ALL_APPS, AppId, AppDef } from "./OSContext";

interface SidebarProps {
  onNav?: () => void;
  forceCollapsed?: boolean;
  forceExpanded?: boolean;
}

const CATEGORY_META: Record<string, { label: string }> = {
  core:     { label: "Core" },
  tools:    { label: "Build" },
  business: { label: "Business" },
  system:   { label: "System" },
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
  const { activeApp, sidebarCollapsed, openApp, closeApp, toggleSidebar, unreadCount } = useOS();

  const collapsed = forceCollapsed ? true : forceExpanded ? false : sidebarCollapsed;
  const width = collapsed ? 64 : 224;
  const groups = groupApps(ALL_APPS);

  const handleNav = (fn: () => void) => { fn(); onNav?.(); };

  return (
    <aside
      className="flex flex-col h-full flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
      style={{ width, background: "#fff", borderRight: "1px solid rgba(0,0,0,0.08)", boxShadow: "2px 0 8px rgba(0,0,0,0.04)" }}
    >
      {/* ── Brand ── */}
      <div className="flex items-center h-14 px-3 gap-2.5 overflow-hidden flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <button
          onClick={() => { if (!forceCollapsed && !forceExpanded) toggleSidebar(); }}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 transition-all duration-200 hover:scale-105"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 2px 8px rgba(99,102,241,0.30)" }}
          title="CreateAI Brain"
        >
          C
        </button>
        {!collapsed && (
          <span className="font-semibold text-[13px] truncate" style={{ color: "#0f172a", letterSpacing: "-0.01em" }}>
            CreateAI Brain
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

      {/* ── App list ── */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {groups.map(group => (
          <div key={group.category} className="mb-3">
            {!collapsed && (
              <div className="px-2 py-1.5">
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#d1d5db" }}>
                  {CATEGORY_META[group.category]?.label}
                </p>
              </div>
            )}
            {collapsed && group.category !== "core" && (
              <div className="mx-auto w-6 h-px my-2" style={{ background: "rgba(0,0,0,0.08)" }} />
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
                  badge={app.id === "notifications" && unreadCount > 0 ? unreadCount : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Collapse toggle ── */}
      {!forceCollapsed && !forceExpanded && (
        <div className="px-2 pb-3 pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-2 h-8 rounded-xl text-xs font-medium transition-all duration-200"
            style={{ color: "#9ca3af" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#9ca3af"; }}
          >
            <span style={{ fontSize: 11 }}>{collapsed ? "▶" : "◀"}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}
    </aside>
  );
}

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
        : { color: "#6b7280" }
      }
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
      {/* Icon with badge overlay */}
      <span className="relative flex-shrink-0 w-5 text-center leading-none">
        <span className="text-base">{icon}</span>
        {badge !== undefined && badge > 0 && (
          <span
            className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-white font-bold"
            style={{ fontSize: 9, background: "#ef4444", lineHeight: 1, padding: "0 3px" }}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      {!collapsed && (
        <span className="truncate flex-1 text-left" style={{ letterSpacing: "-0.01em" }}>{label}</span>
      )}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span
          className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-bold"
          style={{ fontSize: 10, background: "#ef4444", padding: "0 4px" }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {!collapsed && active && badge === undefined && (
        <span className="w-1 h-4 rounded-full flex-shrink-0"
          style={{ background: accentColor }} />
      )}
    </button>
  );
}
