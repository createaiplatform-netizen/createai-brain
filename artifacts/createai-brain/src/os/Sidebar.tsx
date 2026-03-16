import React from "react";
import { useOS, ALL_APPS, AppId } from "./OSContext";

interface SidebarProps {
  onNav?: () => void;
  forceCollapsed?: boolean;
  forceExpanded?: boolean;
}

export function Sidebar({ onNav, forceCollapsed, forceExpanded }: SidebarProps) {
  const { activeApp, sidebarCollapsed, openApp, closeApp, toggleSidebar } = useOS();

  const collapsed     = forceCollapsed ? true : forceExpanded ? false : sidebarCollapsed;
  const width         = collapsed ? 64 : 224;

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
          onClick={() => {
            if (!forceCollapsed && !forceExpanded) toggleSidebar();
          }}
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

      {/* ── App list ── */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {!collapsed && (
          <p
            className="text-[9.5px] font-bold uppercase tracking-widest px-2 py-2"
            style={{ color: "rgba(255,255,255,0.28)", letterSpacing: "0.10em" }}
          >
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

      {/* ── Collapse toggle ── */}
      {!forceCollapsed && !forceExpanded && (
        <div
          className="px-2 pb-3 pt-1"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
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
      title={collapsed ? label : undefined}
      className="w-full flex items-center gap-2.5 h-9 rounded-xl px-2 text-[13px] font-medium transition-all duration-150"
      style={
        active
          ? {
              background: "rgba(99,102,241,0.18)",
              color: "#a5b4fc",
              boxShadow: "inset 0 0 0 1px rgba(99,102,241,0.25)",
            }
          : {
              color: "rgba(255,255,255,0.45)",
            }
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
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
        }
      }}
    >
      <span className="text-base flex-shrink-0 w-5 text-center leading-none">{icon}</span>
      {!collapsed && (
        <span className="truncate" style={{ letterSpacing: "-0.01em" }}>
          {label}
        </span>
      )}
    </button>
  );
}
