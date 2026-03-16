import React, { useState } from "react";
import { useOS } from "./OSContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "./Dashboard";
import { AppWindow } from "./AppWindow";
import { ChatApp } from "@/apps/ChatApp";
import { ProjectsApp } from "@/apps/ProjectsApp";
import { ToolsApp } from "@/apps/ToolsApp";
import { PeopleApp } from "@/apps/PeopleApp";
import { DocumentsApp } from "@/apps/DocumentsApp";
import { MarketingApp } from "@/apps/MarketingApp";
import { AdminApp } from "@/apps/AdminApp";
import { FamilyApp } from "@/apps/FamilyApp";
import { IntegrationApp } from "@/apps/IntegrationApp";
import { MonetizationApp } from "@/apps/MonetizationApp";
import { CreatorApp } from "@/apps/CreatorApp";

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
};

export function OSLayout() {
  const { activeApp } = useOS();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const ActiveComponent = activeApp ? APP_COMPONENTS[activeApp] : null;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">

      {/* ── Desktop sidebar (always visible, flex sibling) ── */}
      {isDesktop && (
        <Sidebar onNav={closeMobileMenu} />
      )}

      {/* ── Mobile overlay sidebar ── */}
      {!isDesktop && mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
          {/* Slide-in panel */}
          <div className="fixed left-0 top-0 bottom-0 z-50 animate-in slide-in-from-left-4 duration-200">
            <Sidebar onNav={closeMobileMenu} forceExpanded />
          </div>
        </>
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {activeApp && ActiveComponent ? (
          <AppWindow onHamburger={isDesktop ? undefined : () => setMobileMenuOpen(true)}>
            <ActiveComponent />
          </AppWindow>
        ) : (
          <Dashboard onHamburger={isDesktop ? undefined : () => setMobileMenuOpen(true)} />
        )}
      </div>
    </div>
  );
}
