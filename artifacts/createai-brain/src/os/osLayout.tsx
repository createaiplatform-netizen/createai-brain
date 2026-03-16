import React, { useState, useEffect } from "react";
import { useOS } from "./OSContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Sidebar } from "./Sidebar";
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
import { ConversationOverlay } from "./ConversationOverlay";
import { UCPXAgent } from "@/ucpx/UCPXAgent";

const APP_COMPONENTS: Record<string, React.ComponentType> = {
  chat: ChatApp,
  projects: ProjectsApp,
  tools: ToolsApp,
  creator: CreatorApp,
  people: PeopleApp,
  documents: DocumentsApp,
  marketing: MarketingApp,
  admin: AdminApp,
  family: FamilyApp,
  integration: IntegrationApp,
  monetization: MonetizationApp,
  universal: UniversalApp,
};

/**
 * Three layout tiers — derived from width + orientation:
 *
 *  NARROW   (< 768px)           → hamburger overlay, no sidebar, full-screen panels
 *  MEDIUM   (768–1023px)        → icon-only sidebar (60px flex sibling), no hamburger
 *  WIDE     (≥ 1024px)          → full sidebar (220px), no hamburger
 */
export function OSLayout() {
  const { activeApp } = useOS();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="flex h-[100dvh] w-full overflow-hidden" style={{ background: "radial-gradient(ellipse 130% 70% at 50% -5%, rgba(99,102,241,0.13) 0%, transparent 55%), hsl(231, 47%, 6%)" }}>
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
            style={{ background: "rgba(4,5,14,0.70)" }}
            onClick={closeMobileMenu}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 animate-in slide-in-from-left-4 duration-200">
            <Sidebar onNav={closeMobileMenu} forceExpanded />
          </div>
        </>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {activeApp && ActiveComponent ? (
          <AppWindow onHamburger={showHamburger ? () => setMobileMenuOpen(true) : undefined}>
            <ActiveComponent />
          </AppWindow>
        ) : (
          <Dashboard
            onHamburger={showHamburger ? () => setMobileMenuOpen(true) : undefined}
            isNarrow={isNarrow}
          />
        )}
      </div>
    </div>
  );
}
