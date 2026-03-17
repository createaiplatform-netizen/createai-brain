import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useOS } from "./OSContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Sidebar } from "./Sidebar";
import MetricsPage from "@/pages/MetricsPage";
import { Dashboard } from "./Dashboard";
import { AppWindow } from "./AppWindow";
import { ChatApp } from "@/Apps/ChatApp";
import { ProjectsApp } from "@/Apps/ProjectsApp";
import { ToolsApp } from "@/Apps/ToolsApp";
import { PeopleApp } from "@/Apps/PeopleApp";
import { DocumentsApp } from "@/Apps/DocumentsApp";
import { MarketingApp } from "@/Apps/MarketingApp";
import { AdminApp } from "@/Apps/AdminApp";
import { FamilyApp } from "@/Apps/FamilyApp";
import { IntegrationApp } from "@/Apps/IntegrationApp";
import { MonetizationApp } from "@/Apps/MonetizationApp";
import { CreatorApp } from "@/Apps/CreatorApp";
import { UniversalApp } from "@/Apps/UniversalApp";
import { SimulationApp } from "@/Apps/SimulationApp";
import { BusinessCreationApp } from "@/Apps/BusinessCreationApp";
import { BusinessEntityApp } from "@/Apps/BusinessEntityApp";
import { BizUniverseApp } from "@/Apps/BizUniverseApp";
import { BizDevApp } from "@/Apps/BizDevApp";
import { ProjectBuilderApp } from "@/Apps/ProjectBuilderApp";
import { ProjectOSApp } from "@/Apps/ProjectOSApp";
import { OpportunityApp } from "@/Apps/OpportunityApp";
import { ImaginationLabApp } from "@/Apps/ImaginationLabApp";
import { LoreForgeApp } from "@/Apps/LoreForgeApp";
import { ConversationOverlay } from "./ConversationOverlay";
import { UCPXAgent } from "@/ucpx/UCPXAgent";
import { GuidedTour } from "./GuidedTour";

const APP_COMPONENTS: Record<string, React.ComponentType> = {
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
  opportunity:  OpportunityApp,
  imaginationlab: ImaginationLabApp,
  loreforge:      LoreForgeApp,
};

/**
 * Three layout tiers — derived from width + orientation:
 *
 *  NARROW   (< 768px)           → hamburger overlay, no sidebar, full-screen panels
 *  MEDIUM   (768–1023px)        → icon-only sidebar (60px flex sibling), no hamburger
 *  WIDE     (≥ 1024px)          → full sidebar (220px), no hamburger
 */
export function OSLayout() {
  const { activeApp, openApp } = useOS();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const isMetrics = location === "/metrics";

  // Breakpoints
  const isMediumPlus = useMediaQuery("(min-width: 768px)");   // tablet+
  const isWidePlus    = useMediaQuery("(min-width: 1024px)");  // desktop

  // Close overlay when the screen widens past the narrow threshold
  useEffect(() => {
    if (isMediumPlus) setMobileMenuOpen(false);
  }, [isMediumPlus]);

  const isNarrow      = !isMediumPlus;                         // phone portrait / narrow
  const showHamburger = isNarrow;
  const showSidebar   = isMediumPlus;                          // medium + wide
  const sidebarIconOnly = isMediumPlus && !isWidePlus;         // medium only → icon-only

  const ActiveComponent = activeApp ? APP_COMPONENTS[activeApp] : null;
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden" style={{ background: "hsl(220,20%,97%)" }}>
      {/* ── Guided Tour Overlay — triggered from Dashboard ── */}
      <GuidedTour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onOpenApp={(id) => { openApp(id); setTourOpen(false); }}
      />

      {/* ── Global Conversation Overlay — available on every screen ── */}
      <ConversationOverlay />

      {/* ── UCP-X Meta-AI Agent Layer — injected platform-wide ── */}
      <UCPXAgent />

      {/* ── Persistent sidebar (medium+) ── */}
      {showSidebar && (
        <Sidebar
          onNav={closeMobileMenu}
          forceCollapsed={sidebarIconOnly}
        />
      )}

      {/* ── Overlay sidebar (narrow / hamburger mode) ── */}
      {isNarrow && mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{ background: "rgba(15,23,42,0.35)" }}
            onClick={closeMobileMenu}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 animate-in slide-in-from-left-4 duration-200">
            <Sidebar onNav={closeMobileMenu} forceExpanded />
          </div>
        </>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {isMetrics ? (
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 animate-fade-up" style={{ animationDuration: "0.32s" }}>
            {/* Top bar — matches AppWindow exactly */}
            <header className="flex items-center h-14 px-4 gap-3 flex-shrink-0 z-10 glass-topbar">
              {showHamburger && (
                <button
                  onClick={() => setMobileMenuOpen(true)}
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
              <button
                onClick={() => setLocation("/")}
                className="flex items-center gap-1 text-sm font-medium transition-opacity duration-150 flex-shrink-0 hover:opacity-70"
                style={{ color: "#6366f1" }}
              >
                <span className="text-[18px] leading-none font-light">‹</span>
                <span className="hidden sm:inline text-[13px]" style={{ letterSpacing: "-0.01em" }}>Home</span>
              </button>
              <div className="h-4 w-px flex-shrink-0" style={{ background: "rgba(0,0,0,0.10)" }} />
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span className="text-base leading-none">📊</span>
                <h1 className="font-semibold text-[15px] truncate" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
                  Metrics
                </h1>
              </div>
            </header>
            {/* Breadcrumb — matches AppWindow exactly */}
            <div
              className="flex items-center gap-1.5 px-4 h-7 flex-shrink-0"
              style={{ background: "rgba(99,102,241,0.04)", borderBottom: "1px solid rgba(99,102,241,0.08)" }}
            >
              <span className="text-[10px]" style={{ color: "#94a3b8" }}>CreateAI Brain</span>
              <span className="text-[9px]" style={{ color: "#c7d2fe" }}>›</span>
              <span className="text-[10px]" style={{ color: "#c7d2fe" }}>📊</span>
              <span className="text-[10px] font-medium" style={{ color: "#6366f1" }}>Metrics</span>
            </div>
            {/* Scrollable content */}
            <div
              className="flex-1 overflow-y-auto"
              style={{ background: "hsl(220,20%,97%)", overscrollBehavior: "contain" }}
            >
              <MetricsPage />
            </div>
          </div>
        ) : activeApp && ActiveComponent ? (
          <AppWindow onHamburger={showHamburger ? () => setMobileMenuOpen(true) : undefined}>
            <ActiveComponent />
          </AppWindow>
        ) : (
          <Dashboard
            onHamburger={showHamburger ? () => setMobileMenuOpen(true) : undefined}
            isNarrow={isNarrow}
            onShowTour={() => setTourOpen(true)}
          />
        )}
      </div>
    </div>
  );
}
