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
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={OSLayout} />
      <Route path="/project/:projectId" component={ProjectPage} />
      <Route path="/standalone/creation/:creationId" component={CreationPage} />
      <Route path="/standalone/:projectId" component={StandalonePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, hsl(220,20%,10%) 0%, hsl(240,25%,14%) 50%, hsl(255,30%,12%) 100%)" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-sm w-full">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              boxShadow: "0 0 40px rgba(99,102,241,0.35), 0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            🧠
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">CreateAI Brain</h1>
            <p className="text-[14px] mt-1.5" style={{ color: "rgba(148,163,184,0.70)" }}>
              Your AI-powered OS for building anything
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-3 w-full">
          {[
            { icon: "🗂️", label: "Your own workspace — projects, files, and folders" },
            { icon: "🤖", label: "19 AI apps — chat, create, simulate, build" },
            { icon: "💾", label: "Everything saves to your account automatically" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="text-xl flex-shrink-0">{icon}</span>
              <span className="text-[13px]" style={{ color: "rgba(203,213,225,0.85)" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onLogin}
          className="w-full py-4 rounded-2xl font-bold text-[16px] text-white transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            boxShadow: "0 8px 32px rgba(99,102,241,0.40)",
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 12px 40px rgba(99,102,241,0.55)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.40)")}
        >
          Log in to get started
        </button>

        <p className="text-[11px]" style={{ color: "rgba(148,163,184,0.40)" }}>
          Secure login · Your data stays private
        </p>
      </div>
    </div>
  );
}

// ─── Loading Screen ────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "hsl(220,20%,97%)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
        >
          🧠
        </div>
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

// ─── Auth Gate ─────────────────────────────────────────────────────────────

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <LoginScreen onLogin={login} />;
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
