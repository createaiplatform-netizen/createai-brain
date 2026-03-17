import React from "react";
import { useOS } from "./OSContext";
import { ChatApp } from "@/Apps/ChatApp";
import { ProjectsApp } from "@/Apps/ProjectsApp";
import { ToolsApp } from "@/Apps/ToolsApp";
import { CreatorApp } from "@/Apps/CreatorApp";
import { PeopleApp } from "@/Apps/PeopleApp";
import { DocumentsApp } from "@/Apps/DocumentsApp";
import { MarketingApp } from "@/Apps/MarketingApp";
import { AdminApp } from "@/Apps/AdminApp";
import { FamilyApp } from "@/Apps/FamilyApp";
import { IntegrationApp } from "@/Apps/IntegrationApp";
import { MonetizationApp } from "@/Apps/MonetizationApp";
import { UniversalApp } from "@/Apps/UniversalApp";
import { SimulationApp } from "@/Apps/SimulationApp";
import { BusinessCreationApp } from "@/Apps/BusinessCreationApp";
import { BusinessEntityApp } from "@/Apps/BusinessEntityApp";
import { BizUniverseApp } from "@/Apps/BizUniverseApp";
import { BizDevApp } from "@/Apps/BizDevApp";
import { ProjectBuilderApp } from "@/Apps/ProjectBuilderApp";
import { ProjectOSApp } from "@/Apps/ProjectOSApp";
import type { AppId } from "./OSContext";

const APP_LABELS: Record<AppId, string> = {
  chat:         "Chat",
  projects:     "Projects",
  tools:        "Tools",
  creator:      "Creator",
  people:       "People",
  documents:    "Documents",
  marketing:    "Marketing",
  admin:        "Admin",
  family:       "Family",
  integration:  "Integration",
  monetization: "Monetization",
  simulation:   "Simulate",
  universal:    "Universal",
  business:     "Business Creation Engine",
  entity:       "Business Entity Engine",
  bizcreator:   "Biz Universe Engine",
  bizdev:       "Real-World Business Planner",
  projbuilder:  "Project File Builder",
  projos:       "Universal Project Platform",
};

const APP_ICONS: Record<AppId, string> = {
  chat:         "💬",
  projects:     "📁",
  tools:        "🔧",
  creator:      "✨",
  people:       "👥",
  documents:    "📄",
  marketing:    "📣",
  admin:        "⚙️",
  family:       "🏡",
  integration:  "🔗",
  monetization: "💰",
  simulation:   "🧪",
  universal:    "🌐",
  business:     "🏗️",
  entity:       "🧬",
  bizcreator:   "🌌",
  bizdev:       "⚡",
  projbuilder:  "📋",
  projos:       "📂",
};

const APP_COMPONENTS: Record<AppId, React.ComponentType<any>> = {
  chat:         ChatApp,
  projects:     ProjectsApp,
  tools:        ToolsApp,
  creator:      CreatorApp,
  people:       PeopleApp,
  documents:    DocumentsApp,
  marketing:    MarketingApp,
  admin:        AdminApp,
  family:       FamilyApp,
  integration:  IntegrationApp,
  monetization: MonetizationApp,
  simulation:   SimulationApp,
  universal:    UniversalApp,
  business:     BusinessCreationApp,
  entity:       BusinessEntityApp,
  bizcreator:   BizUniverseApp,
  bizdev:       BizDevApp,
  projbuilder:  ProjectBuilderApp,
  projos:       ProjectOSApp,
};

interface AppWindowProps {
  onHamburger?: () => void;
  children?: React.ReactNode;
}

export function AppWindow({ onHamburger }: AppWindowProps) {
  const { activeApp, history, closeApp, goBack } = useOS();

  if (!activeApp) return null;

  const AppComponent = APP_COMPONENTS[activeApp];
  const label        = APP_LABELS[activeApp];
  const icon         = APP_ICONS[activeApp];

  return (
    <div key={activeApp} className="flex-1 flex flex-col overflow-hidden min-w-0 animate-fade-up" style={{ animationDuration: "0.32s" }}>

      {/* ── Top bar ── */}
      <header
        className="flex items-center h-14 px-4 gap-3 flex-shrink-0 z-10 glass-topbar"
      >
        {/* Hamburger — mobile only */}
        {onHamburger && (
          <button
            onClick={onHamburger}
            aria-label="Open navigation"
            className="w-8 h-8 flex flex-col items-center justify-center gap-[5px] rounded-xl transition-all duration-150 flex-shrink-0"
            style={{ color: "#6b7280" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <span className="w-4 h-[1.5px] rounded-full block" style={{ background: "#6b7280" }} />
            <span className="w-4 h-[1.5px] rounded-full block" style={{ background: "#6b7280" }} />
            <span className="w-4 h-[1.5px] rounded-full block" style={{ background: "#6b7280" }} />
          </button>
        )}

        {/* Back / Home */}
        <button
          onClick={history.length > 0 ? goBack : closeApp}
          className="flex items-center gap-1 text-sm font-medium transition-opacity duration-150 flex-shrink-0 hover:opacity-70"
          style={{ color: "#6366f1" }}
        >
          <span className="text-[18px] leading-none font-light">‹</span>
          <span className="hidden sm:inline text-[13px]" style={{ letterSpacing: "-0.01em" }}>
            {history.length > 0 ? "Back" : "Home"}
          </span>
        </button>

        {/* Separator */}
        <div className="h-4 w-px flex-shrink-0" style={{ background: "rgba(0,0,0,0.10)" }} />

        {/* Title */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-base leading-none">{icon}</span>
          <h1
            className="font-semibold text-[15px] truncate"
            style={{ color: "#0f172a", letterSpacing: "-0.02em" }}
          >
            {label}
          </h1>
        </div>

        {/* Close */}
        <button
          onClick={closeApp}
          aria-label="Close app"
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all duration-150 font-medium"
          style={{ background: "rgba(0,0,0,0.05)", color: "#9ca3af", border: "1px solid rgba(0,0,0,0.07)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.10)";
            (e.currentTarget as HTMLElement).style.color = "#ef4444";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.20)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)";
            (e.currentTarget as HTMLElement).style.color = "#9ca3af";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)";
          }}
        >
          ✕
        </button>
      </header>

      {/* ── App content ── */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ background: "hsl(220,20%,97%)" }}
      >
        <AppComponent />
      </div>
    </div>
  );
}
