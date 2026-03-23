import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useOS } from "./OSContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { Sidebar } from "./Sidebar";
import MetricsPage from "@/pages/MetricsPage";
import { Dashboard } from "./Dashboard";
import { AppWindow } from "./AppWindow";
import { ConversationOverlay } from "./ConversationOverlay";
import { GuidedTour } from "./GuidedTour";
import { AtmosphericLayer } from "./AtmosphericLayer";
import { SEOMeta } from "@/components/SEOMeta";
import { CustomerOnboardingWizard } from "@/components/CustomerOnboardingWizard";
import { QuickLauncher } from "@/components/QuickLauncher";
import OutputLibraryPage from "@/pages/OutputLibraryPage";

// UCPXAgent is a 963 KB file — lazy-load it so it never blocks the initial paint
const UCPXAgent = React.lazy(() =>
  import("@/ucpx/UCPXAgent").then(m => ({ default: m.UCPXAgent }))
);

/**
 * Three layout tiers — derived from width + orientation:
 *
 *  NARROW   (< 768px)           → hamburger overlay, no sidebar, full-screen panels
 *  MEDIUM   (768–1023px)        → icon-only sidebar (60px flex sibling), no hamburger
 *  WIDE     (≥ 1024px)          → full sidebar (220px), no hamburger
 *
 * App routing: AppWindow.tsx owns all 121 lazy-loaded app components via its
 * own APP_COMPONENTS record. osLayout.tsx only decides WHICH panel to show
 * (Metrics / AppWindow / Dashboard) — it no longer needs its own component map.
 */
export function OSLayout() {
  const { activeApp, openApp } = useOS();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen]       = useState(false);
  const [tourOpen, setTourOpen]                   = useState(false);
  const [quickLauncherOpen, setQuickLauncherOpen] = useState(false);

  // Global 401 interceptor — redirects to /login when session expires
  useSessionGuard();

  const isMetrics = location === "/metrics";
  const isLibrary = location === "/library";

  // ── Global Cmd+K / Ctrl+K quick launcher ──
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setQuickLauncherOpen(prev => !prev);
      }
    };
    const eventHandler = () => setQuickLauncherOpen(true);
    window.addEventListener("keydown", keyHandler);
    window.addEventListener("cai:open-quick-launcher", eventHandler);
    return () => {
      window.removeEventListener("keydown", keyHandler);
      window.removeEventListener("cai:open-quick-launcher", eventHandler);
    };
  }, []);

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

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="atmospheric-bg flex h-[100dvh] w-full overflow-hidden" style={{ position: "relative" }}>
      <SEOMeta
        title="CreateAI Brain — The AI OS for Everything You Do"
        description="CreateAI Brain is the complete AI-powered business OS. 365+ intelligent tools, autonomous revenue generation, and industry-specific AI for healthcare, legal, staffing, finance, and more."
        canonical="https://createai.digital"
        ogTitle="CreateAI Brain — The AI OS for Everything You Do"
        ogDescription="365+ intelligent business tools in one OS. Healthcare, Legal, Staffing, Finance, Marketing AI — replace $100K+ in software. By Lakeside Trinity LLC."
      />
      {/* ── Atmospheric environment — gradient blobs, micro-particles, haze ── */}
      <AtmosphericLayer />

      {/* ── Guided Tour Overlay — triggered from Dashboard ── */}
      <GuidedTour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onOpenApp={(id) => { openApp(id); setTourOpen(false); }}
      />

      {/* ── Customer Onboarding Wizard — first-run for customer role ── */}
      <CustomerOnboardingWizard />

      {/* ── Global Quick Launcher — Cmd+K / Ctrl+K ── */}
      <QuickLauncher open={quickLauncherOpen} onClose={() => setQuickLauncherOpen(false)} />

      {/* ── Global Conversation Overlay — available on every screen ── */}
      <ConversationOverlay />

      {/* ── UCP-X Meta-AI Agent Layer — injected platform-wide (lazy) ── */}
      <Suspense fallback={null}>
        <UCPXAgent />
      </Suspense>

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
      <div id="main-content" className="flex-1 flex flex-col overflow-hidden min-w-0" role="main" aria-label="Application workspace">
        {isLibrary ? (
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 animate-fade-up" style={{ animationDuration: "0.32s" }}>
            <header className="flex items-center h-14 px-4 gap-3 flex-shrink-0 z-10 glass-topbar">
              {showHamburger && (
                <button onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation"
                  className="w-8 h-8 flex flex-col items-center justify-center gap-[5px] rounded-xl transition-all duration-150 flex-shrink-0"
                  style={{ color: "#6b7280" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
                  <span className="w-4 h-[1.5px] rounded-full block" style={{ background: "#6b7280" }} />
                  <span className="w-4 h-[1.5px] rounded-full block" style={{ background: "#6b7280" }} />
                  <span className="w-4 h-[1.5px] rounded-full block" style={{ background: "#6b7280" }} />
                </button>
              )}
              <button onClick={() => setLocation("/")}
                className="flex items-center gap-1 text-sm font-medium transition-opacity duration-150 flex-shrink-0 hover:opacity-70"
                style={{ color: "#7a9068" }}>
                <span className="text-[18px] leading-none font-light">‹</span>
                <span className="hidden sm:inline text-[13px]" style={{ letterSpacing: "-0.01em" }}>Home</span>
              </button>
              <div className="h-4 w-px flex-shrink-0" style={{ background: "rgba(0,0,0,0.10)" }} />
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span className="text-base leading-none">📚</span>
                <h1 className="font-semibold text-[15px] truncate" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Output Library</h1>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto" style={{ background: "hsl(220,20%,97%)", overscrollBehavior: "contain" }}>
              <OutputLibraryPage />
            </div>
          </div>
        ) : isMetrics ? (
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
        ) : activeApp ? (
          /* AppWindow owns all 121 app components via lazy-loaded APP_COMPONENTS */
          <AppWindow onHamburger={showHamburger ? () => setMobileMenuOpen(true) : undefined} />
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
