import React from "react";
import { useOS } from "./OSContext";
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
  const ActiveComponent = activeApp ? APP_COMPONENTS[activeApp] : null;

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeApp && ActiveComponent ? (
          <AppWindow>
            <ActiveComponent />
          </AppWindow>
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  );
}
