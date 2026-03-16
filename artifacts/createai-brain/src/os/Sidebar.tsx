import React from "react";
import { useOS, ALL_APPS, AppId } from "./OSContext";

interface SidebarProps {
  /** Called after any nav action — used to close mobile overlay */
  onNav?: () => void;
  /** Force icon-only collapsed display (medium breakpoint sidebar) */
  forceCollapsed?: boolean;
  /** Force full expanded display (mobile overlay) */
  forceExpanded?: boolean;
}

export function Sidebar({ onNav, forceCollapsed, forceExpanded }: SidebarProps) {
  const { activeApp, sidebarCollapsed, openApp, closeApp, toggleSidebar } = useOS();

  // Resolve collapsed state:
  //   forceCollapsed → always icon-only
  //   forceExpanded  → always full
  //   otherwise      → user-controlled from context
  const collapsed = forceCollapsed ? true : forceExpanded ? false : sidebarCollapsed;
  const width     = collapsed ? 60 : 220;

  const handleNav = (fn: () => void) => {
    fn();
    onNav?.();
  };

  return (
    <aside
      className="flex flex-col h-full bg-background border-r border-border/50 transition-all duration-300 flex-shrink-0 overflow-hidden"
      style={{ width }}
    >
      {/* Branding row */}
      <div className="flex items-center h-14 px-3 border-b border-border/50 gap-2 overflow-hidden">
        <button
          onClick={() => {
            if (!forceCollapsed && !forceExpanded) toggleSidebar();
          }}
          className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0 hover:opacity-90 transition-opacity"
          title="CreateAI OS"
        >
          C
        </button>
        {!collapsed && (
          <span className="font-semibold text-sm text-foreground truncate">CreateAI OS</span>
        )}
      </div>

      {/* Home */}
      <div className="px-2 pt-3 pb-1">
        <SidebarItem
          icon="🏠"
          label="Home"
          active={activeApp === null}
          collapsed={collapsed}
          onClick={() => handleNav(closeApp)}
        />
      </div>

      {/* App list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
            Apps
          </p>
        )}
        {ALL_APPS.map(app => (
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

      {/* Collapse toggle — only when user can control it (not force-pinned) */}
      {!forceCollapsed && !forceExpanded && (
        <div className="px-2 pb-3 pt-1 border-t border-border/50">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-2 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-xs"
          >
            <span>{collapsed ? "→" : "←"}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}
    </aside>
  );
}

function SidebarItem({
  icon, label, active, collapsed, onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-full flex items-center gap-2.5 h-9 rounded-lg px-2 transition-colors text-sm font-medium ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <span className="text-base flex-shrink-0 w-5 text-center">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}
