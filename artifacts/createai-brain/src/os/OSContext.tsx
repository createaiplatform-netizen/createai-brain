import React, { createContext, useContext, useState, useCallback } from "react";

export type AppId =
  | "chat"
  | "projects"
  | "tools"
  | "people"
  | "documents"
  | "marketing"
  | "admin"
  | "family"
  | "integration"
  | "monetization";

export interface AppDef {
  id: AppId;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const ALL_APPS: AppDef[] = [
  { id: "chat", label: "AI Chat", icon: "💬", color: "#007AFF", description: "Talk to the CreateAI Brain" },
  { id: "projects", label: "Projects", icon: "📁", color: "#5856D6", description: "All your projects & workspaces" },
  { id: "tools", label: "Tools", icon: "🛠️", color: "#FF9500", description: "Brochures, docs, pages & more" },
  { id: "people", label: "People", icon: "👥", color: "#34C759", description: "Contacts, profiles & invites" },
  { id: "documents", label: "Documents", icon: "📄", color: "#FF6B6B", description: "Files, forms & structured docs" },
  { id: "marketing", label: "Marketing", icon: "📣", color: "#FF2D55", description: "Brand, campaigns & content" },
  { id: "admin", label: "Admin", icon: "⚙️", color: "#636366", description: "Platform control & settings" },
  { id: "family", label: "Family", icon: "🏡", color: "#30B0C7", description: "Family-friendly simplified view" },
  { id: "integration", label: "Integration", icon: "🔌", color: "#BF5AF2", description: "Connect & map existing tools" },
  { id: "monetization", label: "Monetize", icon: "💰", color: "#FFD60A", description: "Storefront, plans & earnings" },
];

interface OSState {
  activeApp: AppId | null;
  sidebarCollapsed: boolean;
  history: AppId[];
}

interface OSContextValue extends OSState {
  openApp: (id: AppId) => void;
  closeApp: () => void;
  goBack: () => void;
  toggleSidebar: () => void;
}

const OSContext = createContext<OSContextValue | null>(null);

export function OSProvider({ children }: { children: React.ReactNode }) {
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [history, setHistory] = useState<AppId[]>([]);

  const openApp = useCallback((id: AppId) => {
    setHistory(prev => activeApp ? [...prev, activeApp] : prev);
    setActiveApp(id);
  }, [activeApp]);

  const closeApp = useCallback(() => {
    setActiveApp(null);
    setHistory([]);
  }, []);

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setActiveApp(prev);
    } else {
      setActiveApp(null);
    }
  }, [history]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  return (
    <OSContext.Provider value={{ activeApp, sidebarCollapsed, history, openApp, closeApp, goBack, toggleSidebar }}>
      {children}
    </OSContext.Provider>
  );
}

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error("useOS must be used within OSProvider");
  return ctx;
}
