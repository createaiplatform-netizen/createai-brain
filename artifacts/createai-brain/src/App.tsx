import React, { useState, Component, type ReactNode, type ErrorInfo } from "react";
import { Switch, Route, Router as WouterRouter, useParams } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";

import NotFound from "@/pages/not-found";
import StandalonePage from "@/pages/StandalonePage";
import BroadcastPage       from "@/pages/BroadcastPage";
import GlobalBroadcastPage from "@/pages/GlobalBroadcastPage";
import OnboardPage          from "@/pages/OnboardPage";
import PricingPage          from "@/pages/PricingPage";
import PrivacyPage          from "@/pages/PrivacyPage";
import TermsPage            from "@/pages/TermsPage";
import BroadcastFloatingTrigger from "@/components/BroadcastFloatingTrigger";
import CreationPage from "@/pages/CreationPage";
import ProjectPage from "@/pages/ProjectPage";
import IntegrationDemoPage from "@/pages/IntegrationDemoPage";
import SEOLandingPage from "@/pages/SEOLandingPage";
import JoinPage from "@/pages/JoinPage";
import LiveSimDashboard from "@/pages/LiveSimDashboard";
import IntegrationLivePage from "@/pages/IntegrationLivePage";
import IntegrationSuitePage from "@/pages/IntegrationSuitePage";
import StripeIntegrationPage from "@/pages/StripeIntegrationPage";
import SmartFhirCallbackApp from "@/Apps/SmartFhirCallbackApp";
import SmartFhirConnectedApp from "@/Apps/SmartFhirConnectedApp";
import NpaGatewayPage from "@/pages/NpaGatewayPage";
import FamilyHubPage from "@/pages/FamilyHubPage";
import ThemePreviewPage from "@/pages/ThemePreviewPage";
import { ActivatedUniverse } from "@/components/ActivatedUniverse";
import { StorefrontRoutes } from "@/storefront/Storefront";
import { AnalyticsRouteTracker } from "@/components/AnalyticsRouteTracker";
import PublicBridgePage from "@/pages/PublicBridgePage";
import PublicFamilyPage from "@/pages/PublicFamilyPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import CustomerDashboardPage from "@/pages/CustomerDashboardPage";
import KidsHubPage from "@/pages/KidsHubPage";
import KidsCreativeSpacePage from "@/pages/KidsCreativeSpacePage";
import { SmartRoleRouter } from "@/components/SmartRoleRouter";
import { OfflineBanner } from "@/components/OfflineBanner";
import { CookieBanner }  from "@/components/CookieBanner";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { RoleGate } from "@/components/RoleGate";
import { SecureAuthLayer } from "@/components/auth/SecureAuthLayer";
import { NDAGate } from "@/components/auth/NDAGate";
import AdminUniversePage from "@/pages/universe/AdminUniversePage";
import FamilyUniversePage from "@/pages/universe/FamilyUniversePage";
import KidsUniversePage from "@/pages/universe/KidsUniversePage";
import CustomerUniversePage from "@/pages/universe/CustomerUniversePage";
import { useUserRole } from "@/hooks/useUserRole";
import ProjectsPage from "@/pages/ProjectsPage";

import AboveTranscendPage from "@/pages/AboveTranscendPage";
import CreateAIDigitalPage from "@/pages/CreateAIDigitalPage";
import RealMarketPage          from "@/pages/RealMarketPage";
import VentonWayPage           from "@/pages/VentonWayPage";
import ElectricNetWayPage      from "@/pages/ElectricNetWayPage";
import EverythingNetWayPage    from "@/pages/EverythingNetWayPage";
import MessagePage             from "@/pages/MessagePage";
import FamilySharePage         from "@/pages/FamilySharePage";
import UltimateTranscendDashboard from "@/pages/UltimateTranscendDashboard";
import CommandCenterPage           from "@/pages/CommandCenterPage";
import PlatformStatusPage          from "@/pages/PlatformStatusPage";
import AnalyticsPage               from "@/pages/AnalyticsPage";
import TeamPage                    from "@/pages/TeamPage";
import SettingsPage                from "@/pages/SettingsPage";
import BillingPage                 from "@/pages/BillingPage";
import DataPage                    from "@/pages/DataPage";
import GlobalPage                  from "@/pages/GlobalPage";
import EvolutionPage               from "@/pages/EvolutionPage";
import UniverseDataPage            from "@/pages/UniverseDataPage";
import UniverseExplorerPage        from "@/pages/UniverseExplorerPage";
import ContinuumDashboardPage      from "@/pages/ContinuumDashboardPage";
import RealityExplorerPage         from "@/pages/RealityExplorerPage";
import SelfExplorerPage            from "@/pages/SelfExplorerPage";
import AllSystemsPage              from "@/pages/AllSystemsPage";
import FamilyModePage              from "@/pages/FamilyModePage";
import PublicExplorerPage          from "@/pages/PublicExplorerPage";
import CeilingPage                 from "@/pages/CeilingPage";
import PublicLandingPage           from "@/pages/PublicLandingPage";
import BroadcastLogPage            from "@/pages/BroadcastLogPage";
import SemanticStorePage           from "@/pages/SemanticStorePage";
import PlatformScorePage           from "@/pages/PlatformScorePage";
import CheckoutPage                from "@/pages/CheckoutPage";
import { OSProvider } from "@/os/OSContext";
import { OSLayout } from "@/os/osLayout";
import { GlobalCommandPalette } from "@/components/GlobalCommandPalette";
import { InteractionProvider } from "@/os/InteractionContext";
import { ConversationProvider } from "@/os/ConversationContext";
import { PlatformProvider } from "@/controller";
import { useUltraInteractionEngine } from "@/hooks/useUltraInteractionEngine";

function EntityUniverseRoute() {
  const { seed = 'root' } = useParams<{ seed: string }>();
  return <ActivatedUniverse seed={seed} kind="world" />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

// L-03: React ErrorBoundary — prevents a runtime error in any subtree from
// crashing the whole OS shell. Logs to console; shows a minimal recovery UI.
interface EBState { hasError: boolean; message: string }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false, message: "" };
  static getDerivedStateFromError(err: Error): EBState {
    return { hasError: true, message: err.message };
  }
  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", err, info.componentStack);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-5 max-w-sm text-center px-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)" }}>
            🧠
          </div>
          <div>
            <p className="text-[18px] font-bold text-slate-900">Something went wrong</p>
            <p className="text-[13px] mt-1.5 text-slate-500">An unexpected error occurred. Reloading usually fixes it.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl text-white font-semibold text-[14px]"
            style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)" }}>
            Reload app
          </button>
          <details className="text-left w-full">
            <summary className="text-[11px] text-slate-400 cursor-pointer">Error details</summary>
            <pre className="mt-1 text-[10px] text-slate-400 whitespace-pre-wrap break-all">{this.state.message}</pre>
          </details>
        </div>
      </div>
    );
  }
}

// ─── App Router ────────────────────────────────────────────────────────────

function Router() {
  const { role } = useUserRole();

  return (
    <Switch>
      <Route path="/broadcast" component={BroadcastPage} />
      <Route path="/integration-demo" component={IntegrationDemoPage} />
      <Route path="/above-transcend" component={AboveTranscendPage} />
      <Route path="/semantic-store" component={SemanticStorePage} />
      <Route path="/platform-score" component={PlatformScorePage} />
      <Route path="/project/:projectId" component={ProjectPage} />
      <Route path="/projects" component={ProjectsPage} />
      {/* Legacy path kept for backwards compat */}
      <Route path="/family-hub" component={FamilyHubPage} />
      {/* Theme preview — visual-only, no auth bypass, no data changes */}
      <Route path="/preview-theme/:themeId" component={ThemePreviewPage} />
      {/* Entity Universe — deterministic identity + theme from any seed */}
      <Route path="/entity/:seed" component={EntityUniverseRoute} />
      <Route path="/standalone/creation/:creationId" component={CreationPage} />
      <Route path="/standalone/:projectId" component={StandalonePage} />

      {/* ── Internal pages — require auth, moved from public bypass ────── */}
      <Route path="/transcend-dashboard" component={UltimateTranscendDashboard} />
      <Route path="/command-center" component={CommandCenterPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/venton-way" component={VentonWayPage} />
      <Route path="/electric-net-way" component={ElectricNetWayPage} />
      <Route path="/everything-net-way" component={EverythingNetWayPage} />
      <Route path="/team" component={TeamPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/billing" component={BillingPage} />
      <Route path="/data" component={DataPage} />
      <Route path="/global-expansion" component={GlobalPage} />
      <Route path="/evolution" component={EvolutionPage} />
      <Route path="/universe-data"        component={UniverseDataPage} />
      <Route path="/universe-explorer"    component={UniverseExplorerPage} />
      <Route path="/continuum-dashboard"  component={ContinuumDashboardPage} />
      <Route path="/reality-explorer"     component={RealityExplorerPage} />
      <Route path="/self-explorer"        component={SelfExplorerPage} />
      <Route path="/all-systems"          component={AllSystemsPage} />
      <Route path="/family-mode"          component={FamilyModePage} />
      <Route path="/ceiling"              component={CeilingPage} />
      <Route path="/broadcast-log"        component={BroadcastLogPage} />

      {/* ── Role-based Universe routes ──────────────────────────────────── */}
      {/* Admin Universe — admin/founder full control center */}
      <Route path="/admin">
        <RoleGate allowed={["admin", "founder"]}>
          <AdminUniversePage />
        </RoleGate>
      </Route>
      {/* Kids Creative Space — standalone route */}
      <Route path="/kids/creative">
        <RoleGate allowed={["family_child", "family_adult", "admin", "founder"]}>
          <NDAGate>
            <SecureAuthLayer role={role}>
              <KidsCreativeSpacePage />
            </SecureAuthLayer>
          </NDAGate>
        </RoleGate>
      </Route>
      {/* Kids Universe — must come before /family so wouter matches first */}
      <Route path="/family/kids">
        <RoleGate allowed={["family_child", "family_adult", "admin", "founder"]}>
          <NDAGate>
            <SecureAuthLayer role={role}>
              <KidsUniversePage />
            </SecureAuthLayer>
          </NDAGate>
        </RoleGate>
      </Route>
      {/* Family Universe — family adults with NDA gate + secure auth layer */}
      <Route path="/family">
        <RoleGate allowed={["family_adult", "family_child", "admin", "founder"]}>
          <NDAGate>
            <SecureAuthLayer role={role}>
              <FamilyUniversePage />
            </SecureAuthLayer>
          </NDAGate>
        </RoleGate>
      </Route>
      {/* Customer Universe — customers with NDA gate + secure auth layer */}
      <Route path="/dashboard">
        <RoleGate allowed={["customer", "admin", "founder"]}>
          <NDAGate>
            <SecureAuthLayer role={role}>
              <CustomerUniversePage />
            </SecureAuthLayer>
          </NDAGate>
        </RoleGate>
      </Route>

      {/* Shareable family message pages — public, no login */}
      <Route path="/msg/:token" component={MessagePage} />
      <Route path="/family-portal-intro" component={FamilySharePage} />

      {/* Full OS — catch-all; OSLayout uses useLocation() to render /library, /metrics, etc. */}
      <Route component={OSLayout} />
      <Route component={NotFound} />
    </Switch>
  );
}

// ─── Shared design tokens ──────────────────────────────────────────────────

const INDIGO = "#6366f1";
const PURPLE = "#8b5cf6";
const DARK_BG = "linear-gradient(135deg, hsl(220,20%,10%) 0%, hsl(240,25%,14%) 50%, hsl(255,30%,12%) 100%)";

// 12 featured apps shown on the landing page — clean preview, no overwhelm
const APP_PREVIEW = [
  { icon: "💬", label: "AI Chat"       },
  { icon: "🗂️", label: "Projects"      },
  { icon: "✨", label: "Creator"       },
  { icon: "📣", label: "Marketing"     },
  { icon: "🧠", label: "BrainGen"      },
  { icon: "⚡", label: "Brain Hub"     },
  { icon: "📚", label: "Book Planner"  },
  { icon: "♟️", label: "Strategist"   },
  { icon: "🪐", label: "Planet Builder"},
  { icon: "🎬", label: "Scriptwriter"  },
  { icon: "🔬", label: "Research"      },
  { icon: "💙", label: "Mental Health" },
];
const EXTRA_APP_COUNT = 110; // shown as "+110 more"

// ─── Loading Screen ────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#f0f0f5" }}
      role="status" aria-label="Loading CreateAI Brain" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
          aria-hidden="true"
          style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)` }}>
          🧠
        </div>
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"
          aria-hidden="true" />
        <span className="sr-only">Loading, please wait…</span>
      </div>
    </div>
  );
}

// ─── Public Storefront / Login Screen ─────────────────────────────────────

const PRICING_TIERS = [
  {
    name: "Solo",
    price: "$29",
    period: "/mo",
    desc: "Perfect for solo creators and founders.",
    features: ["Full platform access", "122+ AI apps", "Personal workspace", "AI chat & generation", "Email support"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Business",
    price: "$79",
    period: "/mo",
    desc: "For teams building real products.",
    features: ["Everything in Solo", "Team workspace", "Client portals", "Advanced analytics", "Priority support"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$299",
    period: "/mo",
    desc: "Full-scale OS for large operations.",
    features: ["Everything in Business", "Unlimited seats", "Custom integrations", "Dedicated success manager", "SLA + uptime guarantee"],
    cta: "Contact Us",
    highlight: false,
  },
] as const;

const PRODUCT_FEATURES = [
  { icon: "🧠", title: "AI Brain OS", desc: "One intelligent OS with 122+ AI-powered apps across every domain — from legal to healthcare to finance." },
  { icon: "⚡", title: "Real-Time Generation", desc: "Generate content, documents, strategies, and code instantly. Everything is live and functional." },
  { icon: "🏥", title: "HealthOS", desc: "Complete healthcare management: patient records, scheduling, billing, and clinical workflows." },
  { icon: "⚖️", title: "Legal PM", desc: "Full legal practice manager: matters, contracts, time tracking, and document automation." },
  { icon: "👥", title: "StaffingOS", desc: "End-to-end staffing platform: candidates, placements, timesheets, and client management." },
  { icon: "💬", title: "AI Chat Suite", desc: "Multi-model AI chat with memory, file uploads, and context-aware responses across all your projects." },
] as const;

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}
      role="main" aria-label="CreateAI Brain — public storefront">

      {/* ── Nav ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)", borderBottom: "1px solid #f0f0f0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            🧠
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#0a0a0a", letterSpacing: "-0.5px" }}>CreateAI Brain</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onLogin} type="button"
            style={{ background: "transparent", border: "none", color: "#374151", fontSize: 14,
              fontWeight: 600, cursor: "pointer", padding: "8px 16px", borderRadius: 8 }}>
            Log in
          </button>
          <button onClick={onLogin} type="button"
            style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)`,
              border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: "pointer", padding: "8px 20px", borderRadius: 8,
              boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}>
            Sign up free
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "96px 32px 80px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.20)", borderRadius: 100,
          padding: "6px 16px", marginBottom: 32 }}>
          <span style={{ fontSize: 12 }}>✨</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: INDIGO }}>122+ AI-powered apps. One platform.</span>
        </div>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 900, color: "#0a0a0a",
          lineHeight: 1.1, letterSpacing: "-2px", margin: "0 0 24px" }}>
          The complete AI OS<br />
          <span style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            for building real things
          </span>
        </h1>
        <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "#6b7280", lineHeight: 1.6,
          maxWidth: 600, margin: "0 auto 48px", fontWeight: 400 }}>
          Healthcare, legal, staffing, finance, content — every domain covered.
          Generate, automate, and ship from one intelligent workspace.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onLogin} type="button"
            style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)`,
              border: "none", color: "#fff", fontSize: 16, fontWeight: 700,
              cursor: "pointer", padding: "16px 36px", borderRadius: 12,
              boxShadow: "0 8px 32px rgba(99,102,241,0.40)" }}>
            Start for free →
          </button>
          <button onClick={onLogin} type="button"
            style={{ background: "#fff", border: "1.5px solid #e5e7eb", color: "#374151",
              fontSize: 16, fontWeight: 600, cursor: "pointer", padding: "16px 32px", borderRadius: 12 }}>
            See what's inside
          </button>
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: "#9ca3af" }}>
          No credit card required · Cancel anytime
        </p>
      </section>

      {/* ── App preview grid ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 32px 80px" }}>
        <p style={{ textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "#9ca3af", marginBottom: 20 }}>
          A few of the 122+ apps inside
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 10 }}
          role="list" aria-label="Sample apps inside CreateAI Brain">
          {APP_PREVIEW.map(({ icon, label }) => (
            <div key={label} role="listitem"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "14px 8px", borderRadius: 14, background: "#f9fafb",
                border: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: 22 }} aria-hidden="true">{icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: "#6b7280", textAlign: "center", lineHeight: 1.3 }}>{label}</span>
            </div>
          ))}
          <div role="listitem" aria-label={`Plus ${EXTRA_APP_COUNT} more apps`}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, padding: "14px 8px", borderRadius: 14,
              background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: INDIGO }}>+{EXTRA_APP_COUNT}</span>
            <span style={{ fontSize: 9, color: INDIGO, opacity: 0.7 }}>more</span>
          </div>
        </div>
      </section>

      {/* ── Products ── */}
      <section style={{ background: "#f9fafb", padding: "80px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "#0a0a0a",
            textAlign: "center", marginBottom: 16, letterSpacing: "-1px" }}>
            Everything in one OS
          </h2>
          <p style={{ fontSize: 16, color: "#6b7280", textAlign: "center", marginBottom: 56 }}>
            Six complete platforms — all connected, all AI-powered.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {PRODUCT_FEATURES.map(({ icon, title, desc }) => (
              <div key={title}
                style={{ background: "#fff", borderRadius: 16, padding: "28px 24px",
                  border: "1px solid #f0f0f0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0a0a0a", marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ padding: "80px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "#0a0a0a",
            textAlign: "center", marginBottom: 16, letterSpacing: "-1px" }}>
            Simple, honest pricing
          </h2>
          <p style={{ fontSize: 16, color: "#6b7280", textAlign: "center", marginBottom: 56 }}>
            Full access from day one. No feature gating.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {PRICING_TIERS.map(({ name, price, period, desc, features, cta, highlight }) => (
              <div key={name}
                style={{ borderRadius: 20, padding: "32px 28px",
                  background: highlight ? `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)` : "#fff",
                  border: highlight ? "none" : "1.5px solid #e5e7eb",
                  boxShadow: highlight ? "0 16px 48px rgba(99,102,241,0.35)" : "0 2px 12px rgba(0,0,0,0.04)",
                  position: "relative" }}>
                {highlight && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: "#0a0a0a", color: "#fff", fontSize: 11, fontWeight: 800,
                    padding: "4px 14px", borderRadius: 100, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                    MOST POPULAR
                  </div>
                )}
                <p style={{ fontSize: 13, fontWeight: 700, color: highlight ? "rgba(255,255,255,0.7)" : "#6b7280",
                  marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: highlight ? "#fff" : "#0a0a0a",
                    letterSpacing: "-2px" }}>{price}</span>
                  <span style={{ fontSize: 14, color: highlight ? "rgba(255,255,255,0.6)" : "#9ca3af" }}>{period}</span>
                </div>
                <p style={{ fontSize: 14, color: highlight ? "rgba(255,255,255,0.75)" : "#6b7280",
                  marginBottom: 28, lineHeight: 1.5 }}>{desc}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14,
                      color: highlight ? "rgba(255,255,255,0.9)" : "#374151" }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%",
                        background: highlight ? "rgba(255,255,255,0.20)" : "rgba(99,102,241,0.10)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: highlight ? "#fff" : INDIGO, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onLogin} type="button"
                  style={{ width: "100%", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 700,
                    cursor: "pointer", border: "none",
                    background: highlight ? "#fff" : `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)`,
                    color: highlight ? INDIGO : "#fff",
                    boxShadow: highlight ? "none" : "0 4px 16px rgba(99,102,241,0.30)" }}>
                  {cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "#0a0a0a", padding: "80px 32px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "#fff",
          marginBottom: 20, letterSpacing: "-1.5px" }}>
          Ready to build your AI-powered business?
        </h2>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", marginBottom: 40, maxWidth: 500, margin: "0 auto 40px" }}>
          Join CreateAI Brain and access 122+ apps from a single intelligent workspace.
        </p>
        <button onClick={onLogin} type="button"
          style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)`,
            border: "none", color: "#fff", fontSize: 17, fontWeight: 700,
            cursor: "pointer", padding: "18px 48px", borderRadius: 14,
            boxShadow: "0 8px 40px rgba(99,102,241,0.50)" }}>
          Get started free →
        </button>
        <p style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.30)" }}>
          No credit card required · Free plan available
        </p>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#0a0a0a", borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "32px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
          © {new Date().getFullYear()} Lakeside Trinity LLC · createai.digital · All rights reserved
        </p>
      </footer>
    </div>
  );
}

// ─── NDA Signing Screen ────────────────────────────────────────────────────

const NDA_TEXT = `NON-DISCLOSURE AND PLATFORM ACCESS AGREEMENT

Effective Date: Upon digital signature below.

This Non-Disclosure and Platform Access Agreement ("Agreement") is entered into between CreateAI Brain, LLC ("Company") and the individual signing below ("User").

1. PLATFORM ACCESS. Upon execution of this Agreement, Company grants User a non-exclusive, non-transferable license to access and use the CreateAI Brain platform ("Platform"), including all 19 integrated AI applications, project workspaces, file systems, content generation tools, simulation engines, and related services.

2. CONFIDENTIALITY. User agrees to maintain strict confidentiality regarding: (a) any proprietary methodologies, algorithms, or AI systems embedded within the Platform; (b) any business, technical, or financial information about the Company disclosed through or in connection with the Platform; and (c) any information about other users or their projects encountered on the Platform.

3. REAL DATA & LIVE PRODUCTS. User acknowledges that all products, applications, and content created within the Platform are real and functional. User accepts full responsibility for the content they create and publish through the Platform.

4. INTELLECTUAL PROPERTY. User retains ownership of all original content they create. Company retains ownership of the Platform, its AI systems, and underlying technology. User grants Company a limited license to store and process User content solely to provide the Platform services.

5. PERMITTED USE. User agrees to use the Platform solely for lawful purposes and in accordance with the Platform's Terms of Service. User shall not: reverse engineer any Platform component; share login credentials; use the Platform to harm third parties; or violate any applicable law.

6. NO WARRANTY. The Platform is provided "as is." Company makes no warranties regarding uptime, accuracy of AI outputs, or fitness for any particular purpose.

7. TERM. This Agreement remains in effect for the duration of User's access to the Platform and survives termination with respect to confidentiality obligations.

8. GOVERNING LAW. This Agreement is governed by the laws of the State of Delaware, United States.

By signing below, User acknowledges they have read, understood, and agree to be bound by all terms of this Agreement.`;

interface NDAScreenProps {
  userName: string;
  onSign: (fullName: string) => Promise<void>;
}

function NDAScreen({ userName, onSign }: NDAScreenProps) {
  const [fullName, setFullName] = useState(userName);
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");

  async function handleSign() {
    if (!fullName.trim()) { setError("Please enter your full name to sign."); return; }
    if (!agreed) { setError("Please check the agreement box to continue."); return; }
    setError("");
    setSigning(true);
    try {
      await onSign(fullName.trim());
    } catch {
      setError("Something went wrong. Please try again.");
      setSigning(false);
    }
  }

  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ background: "hsl(220,18%,97%)" }}>
      <div className="max-w-2xl mx-auto px-5 py-12 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
            style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)` }}>
            🧠
          </div>
          <div>
            <h1 className="text-[26px] font-black tracking-tight" style={{ color: "#0f172a" }}>
              One step away from full access
            </h1>
            <p className="text-[14px] mt-1.5" style={{ color: "#64748b" }}>
              Sign the NDA once to unlock all 121 apps and your personal workspace.
            </p>
          </div>
        </div>

        {/* What you're unlocking */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: "🗂️", label: "Real project workspaces" },
            { icon: "🤖", label: "121 AI-powered apps" },
            { icon: "💾", label: "Files, folders, and data" },
            { icon: "🚀", label: "Ship real products" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <span className="text-xl">{icon}</span>
              <span className="text-[12px] font-medium" style={{ color: "#374151" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* NDA Document */}
        <div className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(0,0,0,0.09)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>

          {/* Doc header */}
          <div className="px-6 py-4 flex items-center gap-3"
            style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)` }}>
            <span className="text-xl">📋</span>
            <div>
              <p className="font-bold text-[14px] text-white">Non-Disclosure Agreement</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.70)" }}>
                CreateAI Brain, LLC — Platform Access Agreement
              </p>
            </div>
          </div>

          {/* Scrollable NDA text */}
          <div className="p-6 h-64 overflow-y-auto" style={{ background: "white" }}>
            <pre className="text-[11.5px] leading-relaxed whitespace-pre-wrap font-sans"
              style={{ color: "#374151" }}>
              {NDA_TEXT}
            </pre>
          </div>
        </div>

        {/* Signature section */}
        <div className="rounded-2xl p-6 flex flex-col gap-5"
          style={{ background: "white", border: "1px solid rgba(0,0,0,0.09)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>

          <div>
            <label className="block text-[13px] font-semibold mb-2" style={{ color: "#0f172a" }}>
              Your full legal name (signature)
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all"
              style={{ background: "#f8fafc", border: "1.5px solid rgba(0,0,0,0.12)",
                color: "#0f172a", fontFamily: "Georgia, serif" }}
              onFocus={e => (e.currentTarget.style.border = `1.5px solid ${INDIGO}`)}
              onBlur={e => (e.currentTarget.style.border = "1.5px solid rgba(0,0,0,0.12)")}
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer" onClick={() => setAgreed(a => !a)}>
            <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all"
              style={{ background: agreed ? INDIGO : "#f1f5f9",
                border: `2px solid ${agreed ? INDIGO : "rgba(0,0,0,0.18)"}` }}>
              {agreed && <span className="text-white text-[10px] font-black">✓</span>}
            </div>
            <span className="text-[13px] leading-snug" style={{ color: "#374151" }}>
              I have read and agree to the Non-Disclosure and Platform Access Agreement. I understand this grants me full, live access to CreateAI Brain and I accept responsibility for all content I create.
            </span>
          </label>

          {error && (
            <p className="text-[13px] font-medium" style={{ color: "#dc2626" }}>{error}</p>
          )}

          <button onClick={handleSign} disabled={signing}
            className="w-full py-4 rounded-2xl font-bold text-[15px] text-white transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)`,
              boxShadow: "0 8px 32px rgba(99,102,241,0.35)" }}>
            {signing ? "Signing…" : "Sign & Unlock Full Access"}
          </button>

          <p className="text-center text-[11px]" style={{ color: "#64748b" }}>
            Signed digitally on {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Stored securely
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Gate (handles login + NDA) ──────────────────────────────────────

// Roles that must sign the NDA before accessing the platform.
// Regular customers bypass the NDA requirement.
const NDA_REQUIRED_ROLES = new Set(["admin", "founder", "family_adult", "family_child"]);

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, user, login, refreshUser, setUser } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();

  // Wait for both auth and role to resolve before making gate decisions
  if (isLoading || (isAuthenticated && roleLoading)) return <LoadingScreen />;

  if (!isAuthenticated || !user) {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/api/login?returnTo=${returnTo}`;
    return <LoadingScreen />;
  }

  // NDA is only required for internal/family/admin roles — not regular customers
  const needsNda = role !== null && NDA_REQUIRED_ROLES.has(role) && !user.ndaSigned;

  if (needsNda) {
    const displayName = user.firstName
      ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
      : (user.email?.split("@")[0] ?? "");

    async function handleSign(fullName: string) {
      const res = await fetch("/api/auth/nda", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { success: boolean; user: typeof user };
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        await refreshUser();
      }
    }

    return <NDAScreen userName={displayName} onSign={handleSign} />;
  }

  return <>{children}</>;
}

// ─── Ultra Interaction Engine Mount ────────────────────────────────────────
// Spec: ULTRA-GLOBAL-ZERO-LIMIT-PLATFORM-ENGINE
// Attaches throttled browser listeners; each event contributes micro-revenue,
// triggers the meta cycle (server-side throttled to 1/min), and enforces
// 100%+ growth. Renders null — purely side-effect driven.

function UltraEngineMount() {
  useUltraInteractionEngine();
  return null;
}

// ─── App ───────────────────────────────────────────────────────────────────

function App() {
  // Public routes bypass auth — check before AuthGate renders
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = window.location.pathname;
  const isPublicRoute =
    path.startsWith(`${base}/integration-demo`) ||
    path.startsWith(`${base}/live-sim`) ||
    path.startsWith(`${base}/integration-live`) ||
    path.startsWith(`${base}/integration-suite`) ||
    path.startsWith(`${base}/createai-digital`) ||
    path.startsWith(`${base}/checkout`) ||
    path.startsWith(`${base}/real-market`) ||
    path.startsWith(`${base}/platform-status`) ||
    path.startsWith(`${base}/semantic-store`) ||
    path.startsWith(`${base}/for/`) ||
    path.startsWith(`${base}/join/`) ||
    // SMART-on-FHIR OAuth callback/connected pages must be accessible without auth gate
    // because the browser redirects here from the external SMART sandbox
    path.startsWith(`${base}/connectors/`) ||
    path.startsWith(`${base}/npa-gateway`) ||
    // External Bridge Layer — full public presence, no auth required
    path.startsWith(`${base}/public`) ||
    // Registry-driven discovery + broadcast — public, no auth required
    path.startsWith(`${base}/discover`) ||
    path.startsWith(`${base}/broadcast`) ||
    // Global Broadcast onboarding entry — token-verified, no auth gate
    path.startsWith(`${base}/onboard`) ||
    path.startsWith(`${base}/global-broadcast`) ||
    // Public info pages — pricing, privacy policy
    path.startsWith(`${base}/pricing`) ||
    path.startsWith(`${base}/privacy`) ||
    path.startsWith(`${base}/terms`) ||
    // CreateAI Digital public pages (exact match to avoid catching /family-hub etc.)
    path === base ||
    path === `${base}/` ||
    path === `${base}/home` ||
    path === `${base}/store` ||
    path === `${base}/family` ||
    path === `${base}/kids` ||
    path === `${base}/dashboard` ||
    path === `${base}/identity` ||
    path === `${base}/universe` ||
    path === `${base}/theme` ||
    path === `${base}/public-explorer` ||
    path === `${base}/world`;

  if (isPublicRoute) {
    return (
      <QueryClientProvider client={queryClient}>
        <BroadcastFloatingTrigger />
        <WouterRouter base={base}>
          <AnalyticsRouteTracker />
          <Route path="/integration-demo"   component={IntegrationDemoPage} />
          <Route path="/live-sim"           component={LiveSimDashboard} />
          <Route path="/integration-live"    component={IntegrationLivePage} />
          <Route path="/integration-suite"  component={IntegrationSuitePage} />
          <Route path="/stripe-integration" component={StripeIntegrationPage} />
          <Route path="/createai-digital"   component={CreateAIDigitalPage} />
          <Route path="/checkout"           component={CheckoutPage} />
          <Route path="/real-market"           component={RealMarketPage} />
          <Route path="/platform-status"     component={PlatformStatusPage} />
          <Route path="/semantic-store"      component={SemanticStorePage} />
          {/* SEO Industry Landing Pages — fully public, no auth required */}
          <Route path="/for/:industry">{(params: { industry: string }) => <SEOLandingPage industry={params.industry} />}</Route>
          {/* Viral Referral Landing Page */}
          <Route path="/join/:code" component={JoinPage} />
          {/* web+npa:// protocol handler — receives protocol callbacks from browser */}
          <Route path="/npa-gateway" component={NpaGatewayPage} />
          {/* SMART-on-FHIR OAuth callback — receives authorization code from sandbox */}
          <Route path="/connectors/SMART_FHIR_SANDBOX/callback"  component={SmartFhirCallbackApp} />
          {/* SMART-on-FHIR connected confirmation + test fetch UI */}
          <Route path="/connectors/SMART_FHIR_SANDBOX/connected" component={SmartFhirConnectedApp} />
          {/* External Bridge Layer — full public presence, auto-indexed */}
          <Route path="/public" component={PublicBridgePage} />
          <Route path="/public/family" component={PublicFamilyPage} />
          <Route path="/public-explorer" component={PublicExplorerPage} />
          <Route path="/world"          component={PublicLandingPage} />
          {/* Registry-driven public discovery grid — auto-expands with publicSurfaces.ts */}
          <Route path="/discover">
            {() => (
              <React.Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Loading…</div>}>
                {React.createElement(React.lazy(() => import("@/pages/DiscoveryPage")))}
              </React.Suspense>
            )}
          </Route>
          {/* Broadcast network — public subscription page */}
          <Route path="/broadcast"        component={BroadcastPage} />
          <Route path="/global-broadcast" component={GlobalBroadcastPage} />
          {/* Global Broadcast entry — token-verified onboarding for anyone with the link */}
          <Route path="/onboard"          component={OnboardPage} />
          {/* Public info pages */}
          <Route path="/pricing"          component={PricingPage} />
          <Route path="/privacy"          component={PrivacyPage} />
          <Route path="/terms"            component={TermsPage} />
          {/* Storefront — home, artifacts, membership, about */}
          <StorefrontRoutes />
        </WouterRouter>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <AuthGate>
            <UltraEngineMount />
            <PlatformProvider>
              <InteractionProvider>
                <ConversationProvider>
                  <OSProvider>
                    <OfflineBanner />
                    <CookieBanner />
                    <PushNotificationManager />
                    <GlobalCommandPalette />
                    <WouterRouter base={base}>
                      <AnalyticsRouteTracker />
                      {/* SmartRoleRouter: fires after login+NDA, redirects to role home */}
                      <SmartRoleRouter />
                      <Router />
                    </WouterRouter>
                  </OSProvider>
                </ConversationProvider>
              </InteractionProvider>
            </PlatformProvider>
          </AuthGate>
        </ErrorBoundary>
        <BroadcastFloatingTrigger />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
