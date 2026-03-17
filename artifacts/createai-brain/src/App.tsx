import React, { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";

import NotFound from "@/pages/not-found";
import StandalonePage from "@/pages/StandalonePage";
import CreationPage from "@/pages/CreationPage";
import ProjectPage from "@/pages/ProjectPage";

import { OSProvider } from "@/os/OSContext";
import { OSLayout } from "@/os/osLayout";
import { InteractionProvider } from "@/os/InteractionContext";
import { ConversationProvider } from "@/os/ConversationContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

// ─── App Router ────────────────────────────────────────────────────────────

function Router() {
  return (
    <Switch>
      <Route path="/" component={OSLayout} />
      <Route path="/metrics" component={OSLayout} />
      <Route path="/project/:projectId" component={ProjectPage} />
      <Route path="/standalone/creation/:creationId" component={CreationPage} />
      <Route path="/standalone/:projectId" component={StandalonePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// ─── Shared design tokens ──────────────────────────────────────────────────

const INDIGO = "#6366f1";
const PURPLE = "#8b5cf6";
const DARK_BG = "linear-gradient(135deg, hsl(220,20%,10%) 0%, hsl(240,25%,14%) 50%, hsl(255,30%,12%) 100%)";

const APP_PREVIEW = [
  { icon: "💬", label: "AI Chat" },
  { icon: "🗂️", label: "Projects" },
  { icon: "✨", label: "Creator" },
  { icon: "📣", label: "Marketing" },
  { icon: "📄", label: "Documents" },
  { icon: "🧠", label: "BrainGen" },
  { icon: "🧪", label: "Simulate" },
  { icon: "👥", label: "People" },
  { icon: "💰", label: "Monetize" },
  { icon: "🌐", label: "Integrations" },
  { icon: "🏢", label: "Business" },
  { icon: "🛠️", label: "Tools" },
  { icon: "🚀", label: "BizCreator" },
  { icon: "📊", label: "BizDev" },
  { icon: "🏗️", label: "ProjBuilder" },
  { icon: "🎯", label: "ProjOS" },
  { icon: "🤖", label: "Universal" },
  { icon: "👨‍👩‍👧", label: "Family" },
  { icon: "⚙️", label: "Admin" },
  { icon: "🧬", label: "EntityGen" },
  { icon: "⚡", label: "Brain Hub" },
  { icon: "🔬", label: "Research Hub" },
  { icon: "🎓", label: "Learning Center" },
  { icon: "👤", label: "Persona Studio" },
  { icon: "🗄️", label: "Data Studio" },
  { icon: "💡", label: "Pricing Studio" },
  { icon: "📈", label: "Traction" },
  { icon: "🎯", label: "Opportunities" },
  { icon: "✨", label: "ImaginationLab" },
];

// ─── Loading Screen ────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#f0f0f5" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)` }}>
          🧠
        </div>
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

// ─── Public Preview / Login Screen ────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ background: DARK_BG }}>
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 40% at 50% 20%, rgba(99,102,241,0.13) 0%, transparent 70%)" }} />

      <div className="relative z-10 flex flex-col items-center gap-12 px-6 py-16 max-w-lg mx-auto">

        {/* Hero */}
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)`,
              boxShadow: "0 0 48px rgba(99,102,241,0.35), 0 20px 60px rgba(0,0,0,0.5)" }}>
            🧠
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">CreateAI Brain</h1>
            <p className="text-[15px] mt-2" style={{ color: "rgba(148,163,184,0.75)" }}>
              A full AI-powered OS for building real products
            </p>
          </div>

          <button onClick={onLogin}
            className="mt-2 px-8 py-4 rounded-2xl font-bold text-[15px] text-white transition-all active:scale-95"
            style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)`,
              boxShadow: "0 8px 32px rgba(99,102,241,0.40)" }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 12px 40px rgba(99,102,241,0.55)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.40)")}>
            Log in to get started
          </button>
          <p className="text-[11px]" style={{ color: "rgba(148,163,184,0.40)" }}>
            NDA required for full access · Your data stays private
          </p>
        </div>

        {/* Public preview: app grid */}
        <div className="w-full">
          <p className="text-center text-[12px] font-semibold uppercase tracking-widest mb-5"
            style={{ color: "rgba(148,163,184,0.45)" }}>
            121 AI-POWERED APPS INSIDE
          </p>
          <div className="grid grid-cols-4 gap-3">
            {APP_PREVIEW.map(({ icon, label }) => (
              <div key={label}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-2xl">{icon}</span>
                <span className="text-[10px] font-medium text-center leading-tight"
                  style={{ color: "rgba(203,213,225,0.70)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Value props */}
        <div className="w-full flex flex-col gap-3">
          {[
            { icon: "🔒", head: "Real products, real data", body: "Everything you create is live and fully functional — no demos, no placeholders." },
            { icon: "📝", head: "One-time NDA to unlock", body: "Sign once and get full access to all 121 apps, forever." },
            { icon: "🤖", head: "AI does the heavy lifting", body: "Chat, generate, simulate, and ship — all from one intelligent OS." },
          ].map(({ icon, head, body }) => (
            <div key={head} className="flex items-start gap-4 p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
              <div>
                <p className="font-semibold text-[13px] text-white">{head}</p>
                <p className="text-[12px] mt-0.5" style={{ color: "rgba(203,213,225,0.65)" }}>{body}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onLogin}
          className="w-full py-4 rounded-2xl font-bold text-[16px] text-white transition-all active:scale-95"
          style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, ${PURPLE} 100%)`,
            boxShadow: "0 8px 32px rgba(99,102,241,0.40)" }}>
          Log in with Replit
        </button>
      </div>
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

          <p className="text-center text-[11px]" style={{ color: "#94a3b8" }}>
            Signed digitally on {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Stored securely
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Gate (handles login + NDA) ──────────────────────────────────────

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, user, login, refreshUser, setUser } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated || !user) return <LoginScreen onLogin={login} />;

  if (!user.ndaSigned) {
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

// ─── App ───────────────────────────────────────────────────────────────────

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthGate>
          <InteractionProvider>
            <ConversationProvider>
              <OSProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
              </OSProvider>
            </ConversationProvider>
          </InteractionProvider>
        </AuthGate>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
