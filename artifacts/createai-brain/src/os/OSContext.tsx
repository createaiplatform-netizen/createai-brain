import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { PlatformStore, PlatformMode } from "@/engine/PlatformStore";

// ─── App Registry ──────────────────────────────────────────────────────────
export type AppId =
  | "chat" | "projects" | "tools" | "creator" | "people"
  | "documents" | "marketing" | "admin" | "family"
  | "integration" | "monetization" | "universal" | "simulation";

export interface AppDef {
  id: AppId;
  label: string;
  icon: string;
  color: string;
  description: string;
  category?: "core" | "tools" | "business" | "system";
  enabled?: boolean;
}

export const DEFAULT_APPS: AppDef[] = [
  { id: "chat",         label: "AI Chat",     icon: "💬", color: "#007AFF", description: "Talk to the CreateAI Brain",                  category: "core" },
  { id: "projects",     label: "Projects",    icon: "📁", color: "#5856D6", description: "All your projects & workspaces",               category: "core" },
  { id: "tools",        label: "Tools",       icon: "🛠️", color: "#FF9500", description: "Brochures, docs, pages & more",               category: "tools" },
  { id: "creator",      label: "Create",      icon: "✨", color: "#FF2D55", description: "Generate anything — docs, workflows, modules", category: "tools" },
  { id: "people",       label: "People",      icon: "👥", color: "#34C759", description: "Contacts, profiles & invites",                 category: "business" },
  { id: "documents",    label: "Documents",   icon: "📄", color: "#FF6B6B", description: "Files, forms & structured docs",              category: "business" },
  { id: "marketing",    label: "Marketing",   icon: "📣", color: "#FF2D55", description: "Brand, campaigns & content",                  category: "business" },
  { id: "admin",        label: "Admin",       icon: "⚙️", color: "#636366", description: "Platform control & settings",                 category: "system" },
  { id: "family",       label: "Family",      icon: "🏡", color: "#30B0C7", description: "Family-friendly simplified view",             category: "system" },
  { id: "integration",  label: "Integration", icon: "🔌", color: "#BF5AF2", description: "Connect & map existing tools",                category: "system" },
  { id: "monetization", label: "Monetize",    icon: "💰", color: "#FFD60A", description: "Storefront, plans & earnings",                category: "business" },
  { id: "simulation",   label: "Simulate",    icon: "🧪", color: "#a855f7", description: "Simulations, gap analysis & ad packets",       category: "tools" },
  { id: "universal",    label: "Universal",   icon: "🌐", color: "#007AFF", description: "Universal interaction hub — all flows wired", category: "system" },
];

export const ALL_APPS = DEFAULT_APPS;

// ─── Preference Brain ──────────────────────────────────────────────────────
export type ToneOption = "Professional" | "Plain Language" | "Executive Brief" | "Educational" | "Empowering" | "Clinical Structural";
export type LanguageOption = "English" | "Tamil" | "Tamil–English" | "Spanish" | "French";
export type StyleOption = "Guided" | "Smart" | "Fast" | "Adaptive";

export interface PreferenceBrain {
  tone: ToneOption;
  language: LanguageOption;
  interactionStyle: StyleOption;
  interests: string[];
  groupMembers: string[];
  zeroOverwhelmMode: boolean;
  revenueShare: number;
}

const DEFAULT_PREFERENCES: PreferenceBrain = {
  tone: "Empowering",
  language: "English",
  interactionStyle: "Adaptive",
  interests: ["Healthcare", "Marketing", "Operations"],
  groupMembers: ["Sara (Founder)", "Jake (Creator)", "Maria (Viewer)"],
  zeroOverwhelmMode: false,
  revenueShare: 25,
};

// ─── Intent Routing ────────────────────────────────────────────────────────
const INTENT_MAP: { keywords: string[]; target: AppId }[] = [
  { keywords: ["chat", "talk", "ask", "message", "brain"],                target: "chat" },
  { keywords: ["create", "generate", "build", "make", "write"],           target: "creator" },
  { keywords: ["project", "workspace", "healthcare", "medical"],          target: "projects" },
  { keywords: ["tool", "brochure", "document", "page", "generator"],      target: "tools" },
  { keywords: ["simulate", "simulation", "analyze", "gap", "scenario", "stress", "ad packet", "advertising"], target: "simulation" },
  { keywords: ["marketing", "campaign", "brand", "social", "email"],      target: "marketing" },
  { keywords: ["people", "contact", "invite", "person"],                  target: "people" },
  { keywords: ["file", "doc", "document"],                                 target: "documents" },
  { keywords: ["money", "monetize", "revenue", "earn", "funnel", "offer"],target: "monetization" },
  { keywords: ["admin", "settings", "control", "mode", "user"],           target: "admin" },
  { keywords: ["family", "home", "personal"],                              target: "family" },
  { keywords: ["integration", "connect", "api", "third-party"],           target: "integration" },
];

function routeIntentFn(intent: string): AppId | null {
  const lower = intent.toLowerCase();
  for (const mapping of INTENT_MAP) {
    if (mapping.keywords.some(k => lower.includes(k))) return mapping.target;
  }
  return null;
}

// ─── App icon/label map for recent activity ────────────────────────────────
const APP_META: Record<AppId, { icon: string; label: string }> = {
  chat:         { icon: "💬", label: "AI Chat" },
  projects:     { icon: "📁", label: "Projects" },
  tools:        { icon: "🛠️", label: "Tools" },
  creator:      { icon: "✨", label: "Create" },
  people:       { icon: "👥", label: "People" },
  documents:    { icon: "📄", label: "Documents" },
  marketing:    { icon: "📣", label: "Marketing" },
  admin:        { icon: "⚙️", label: "Admin" },
  family:       { icon: "🏡", label: "Family" },
  integration:  { icon: "🔌", label: "Integration" },
  monetization: { icon: "💰", label: "Monetize" },
  simulation:   { icon: "🧪", label: "Simulate" },
  universal:    { icon: "🌐", label: "Universal" },
};

// ─── OS State ──────────────────────────────────────────────────────────────
interface OSState {
  activeApp: AppId | null;
  sidebarCollapsed: boolean;
  history: AppId[];
  appRegistry: AppDef[];
  preferences: PreferenceBrain;
  platformMode: PlatformMode;
}

interface OSContextValue extends OSState {
  openApp: (id: AppId) => void;
  closeApp: () => void;
  goBack: () => void;
  toggleSidebar: () => void;
  routeIntent: (intent: string) => AppId | null;
  updatePreferences: (patch: Partial<PreferenceBrain>) => void;
  registerApp: (app: AppDef) => void;
  setPlatformMode: (mode: PlatformMode) => void;
}

const OSContext = createContext<OSContextValue | null>(null);

export function OSProvider({ children }: { children: React.ReactNode }) {
  const [activeApp, setActiveApp]         = useState<AppId | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [history, setHistory]             = useState<AppId[]>([]);
  const [appRegistry, setAppRegistry]     = useState<AppDef[]>(DEFAULT_APPS);
  const [preferences, setPreferences]     = useState<PreferenceBrain>(DEFAULT_PREFERENCES);
  const [platformMode, setPlatformModeState] = useState<PlatformMode>(() => PlatformStore.getMode());

  // Sync mode from custom events (e.g. Admin changes it)
  useEffect(() => {
    const handler = (e: Event) => {
      setPlatformModeState((e as CustomEvent<PlatformMode>).detail);
    };
    window.addEventListener("cai:mode-change", handler);
    return () => window.removeEventListener("cai:mode-change", handler);
  }, []);

  const openApp = useCallback((id: AppId) => {
    setHistory(prev => activeApp ? [...prev, activeApp] : prev);
    setActiveApp(id);
    // Track recent activity
    const meta = APP_META[id];
    if (meta) PlatformStore.pushRecent({ appId: id, label: meta.label, icon: meta.icon });
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

  const toggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), []);

  const routeIntent = useCallback((intent: string): AppId | null => routeIntentFn(intent), []);

  const updatePreferences = useCallback((patch: Partial<PreferenceBrain>) => {
    setPreferences(prev => ({ ...prev, ...patch }));
  }, []);

  const registerApp = useCallback((app: AppDef) => {
    setAppRegistry(prev => prev.find(a => a.id === app.id) ? prev : [...prev, app]);
  }, []);

  const setPlatformMode = useCallback((mode: PlatformMode) => {
    PlatformStore.setMode(mode);
    setPlatformModeState(mode);
  }, []);

  return (
    <OSContext.Provider value={{
      activeApp, sidebarCollapsed, history, appRegistry, preferences, platformMode,
      openApp, closeApp, goBack, toggleSidebar, routeIntent,
      updatePreferences, registerApp, setPlatformMode,
    }}>
      {children}
    </OSContext.Provider>
  );
}

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error("useOS must be used within OSProvider");
  return ctx;
}
