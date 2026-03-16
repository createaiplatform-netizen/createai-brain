import React, { useState, useCallback, useEffect } from "react";
import type { PlatformMode, PlatformFilters, UserProfile } from "@/engine/universeConfig";
import { DEFAULT_FILTERS } from "@/engine/universeConfig";
import type { GuideContext } from "@/engine/guideEngine";
import { FiltersPanel } from "./FiltersPanel";
import { WorkspacePanel } from "./WorkspacePanel";
import { GuidePanel } from "./GuidePanel";
import { AuthModal } from "./components/AuthModal";
import { ProfileSetup } from "./components/ProfileSetup";

const LS_PROFILE = "cai_platform_profile";
const LS_FILTERS = "cai_platform_filters";

function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LS_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveProfile(p: UserProfile) {
  try { localStorage.setItem(LS_PROFILE, JSON.stringify(p)); } catch { /* noop */ }
}

function loadFilters(): PlatformFilters {
  try {
    const raw = localStorage.getItem(LS_FILTERS);
    return raw ? { ...DEFAULT_FILTERS, ...JSON.parse(raw) } : DEFAULT_FILTERS;
  } catch { return DEFAULT_FILTERS; }
}

function saveFilters(f: PlatformFilters) {
  try { localStorage.setItem(LS_FILTERS, JSON.stringify(f)); } catch { /* noop */ }
}

const MODE_CONFIG: Record<PlatformMode, { label: string; icon: string; desc: string; color: string; border: string }> = {
  demo:       { label: "Demo",       icon: "🎬", desc: "Public · No login",     color: "rgba(99,102,241,0.80)",  border: "rgba(99,102,241,0.50)" },
  test:       { label: "Test",       icon: "🔬", desc: "Login + NDA",           color: "rgba(34,197,94,0.70)",   border: "rgba(34,197,94,0.45)" },
  simulation: { label: "Simulation", icon: "⚡", desc: "Stress scenarios",      color: "rgba(168,85,247,0.75)",  border: "rgba(168,85,247,0.45)" },
};

function ActivateModal({ onClose, orgName }: { onClose: () => void; orgName?: string }) {
  const [step, setStep] = useState<"overview" | "confirm" | "done">("overview");

  const bullets = [
    { icon: "⚙️", label: "Complete operational system", desc: "All workflows, documents, roles, and metrics — live and connected" },
    { icon: "🔒", label: "Compliance-ready from day one", desc: "Built-in regulatory guardrails for your industry and state" },
    { icon: "🤖", label: "AI automation on every workflow", desc: "Intelligent routing, anomaly detection, and real-time recommendations" },
    { icon: "📊", label: "Live KPI dashboard", desc: "Real data, real-time trends, AI-powered root-cause analysis" },
    { icon: "👥", label: "Team deployment included", desc: "Role-based access, onboarding flows, and training materials" },
    { icon: "🛡️", label: "Audit trail and fraud prevention", desc: "Full activity logs, dual controls, and automated compliance checks" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}
    >
      <div
        className="w-full max-w-xl rounded-3xl overflow-hidden"
        style={{ background: "rgba(14,18,42,0.97)", border: "1px solid rgba(34,197,94,0.30)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ background: "linear-gradient(135deg,rgba(34,197,94,0.12),rgba(99,102,241,0.12))", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div>
            <div className="text-[16px] font-bold text-white">
              {step === "done" ? "🎉 You're Activated!" : "Activate Full Platform"}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "rgba(148,163,184,0.60)" }}>
              {orgName ? `For ${orgName}` : "Complete business system — ready to deploy"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)", color: "#94a3b8" }}
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {step === "overview" && (
            <div className="space-y-4">
              <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.70)" }}>
                You've evaluated the platform in Demo, Test, and Simulation mode. Activation deploys the complete system — every workflow, every document template, every KPI dashboard — live and connected to your team.
              </p>
              <div className="space-y-2">
                {bullets.map(b => (
                  <div
                    key={b.label}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <span className="text-lg flex-shrink-0">{b.icon}</span>
                    <div>
                      <div className="text-[12px] font-bold text-white">{b.label}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "rgba(148,163,184,0.55)" }}>{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.22)" }}
              >
                <span className="text-[20px]">✅</span>
                <p className="text-[12px] leading-snug" style={{ color: "rgba(134,239,172,0.80)" }}>
                  Everything you've tested is exactly what you get. No hidden features, no bait-and-switch. This is the real system.
                </p>
              </div>
              <button
                onClick={() => setStep("confirm")}
                className="w-full py-3.5 rounded-xl text-white font-bold text-[14px] transition-all"
                style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", boxShadow: "0 0 24px rgba(34,197,94,0.30)" }}
              >
                Continue to Activation →
              </button>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4">
              <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.70)" }}>
                Confirm activation for {orgName || "your organization"}. A CreateAI specialist will contact you within 1 business day to begin your deployment.
              </p>
              <div className="space-y-3">
                {[
                  { label: "Implementation timeline", value: "5-10 business days" },
                  { label: "Training included", value: "Role-based onboarding for your full team" },
                  { label: "Data migration", value: "Handled by your dedicated implementation lead" },
                  { label: "Support", value: "24/7 platform support + dedicated success manager" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-[12px]" style={{ color: "rgba(148,163,184,0.60)" }}>{row.label}</span>
                    <span className="text-[12px] font-semibold text-white">{row.value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep("done")}
                className="w-full py-3.5 rounded-xl text-white font-bold text-[14px] transition-all"
                style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", boxShadow: "0 0 24px rgba(34,197,94,0.30)" }}
              >
                🚀 Activate Platform
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="text-center space-y-4 py-4">
              <div className="text-6xl">🎉</div>
              <div className="text-[16px] font-bold text-white">Platform Activated!</div>
              <p className="text-[13px] leading-relaxed" style={{ color: "rgba(148,163,184,0.70)" }}>
                Your deployment request has been received. A CreateAI specialist will reach out within 1 business day to begin your implementation.
              </p>
              <div
                className="p-4 rounded-xl text-left"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.22)" }}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(134,239,172,0.60)" }}>What happens next</div>
                {["Kickoff call scheduled within 24 hours", "Implementation lead assigned", "Data migration plan created", "Team onboarding sessions scheduled", "Go-live in 5-10 business days"].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className="text-[11px] font-bold" style={{ color: "#22c55e" }}>{i + 1}.</span>
                    <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.70)" }}>{s}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-semibold text-[13px] transition-all"
                style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.10)" }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Shell() {
  const [mode, setMode] = useState<PlatformMode>("demo");
  const [filters, setFilters] = useState<PlatformFilters>(loadFilters);
  const [profile, setProfile] = useState<UserProfile | null>(loadProfile);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [pendingMode, setPendingMode] = useState<PlatformMode | null>(null);
  const [guideSection, setGuideSection] = useState<GuideContext["section"]>("welcome");
  const [guideTileTitle, setGuideTileTitle] = useState<string | undefined>();
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [showActivate, setShowActivate] = useState(false);

  const handleFiltersChange = useCallback((f: PlatformFilters) => {
    setFilters(f);
    saveFilters(f);
  }, []);

  const handleModeSwitch = (m: PlatformMode) => {
    if (m === "test" || m === "simulation") {
      if (!profile?.ndaAccepted) {
        setPendingMode(m);
        setShowAuth(true);
        return;
      }
    }
    setMode(m);
    setGuideSection("welcome");
  };

  const handleAuth = (email: string) => {
    setShowAuth(false);
    setShowProfileSetup(true);
    const partial: Partial<UserProfile> = { email, ndaAccepted: true };
    if (profile) {
      setProfile({ ...profile, ...partial });
    } else {
      setProfile({ email, ndaAccepted: true, orgName: "", state: "California", industry: "healthcare", role: "", department: "", orgType: "" });
    }
  };

  const handleProfileSave = (p: UserProfile) => {
    saveProfile(p);
    setProfile(p);
    setShowProfileSetup(false);
    const f: PlatformFilters = { ...filters, industry: p.industry, state: p.state, role: p.role, department: p.department, orgType: p.orgType };
    handleFiltersChange(f);
    if (pendingMode) {
      setMode(pendingMode);
      setPendingMode(null);
    }
    setGuideSection("welcome");
  };

  const handleGuideCtxChange = useCallback((section: string, tileTitle?: string) => {
    setGuideSection(section as GuideContext["section"]);
    setGuideTileTitle(tileTitle);
  }, []);

  const guideCtx: GuideContext = {
    mode,
    section: guideSection,
    filters,
    activeTileTitle: guideTileTitle,
    profileOrgName: profile?.orgName,
  };

  const mc = MODE_CONFIG[mode];

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top Mode Bar ── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5"
        style={{ background: "rgba(14,18,42,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-1.5 mr-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: mc.border }}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.50)" }}>
            Mode
          </span>
        </div>

        {/* Mode switcher */}
        <div
          className="flex gap-0.5 p-0.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {(["demo", "test", "simulation"] as PlatformMode[]).map(m => {
            const c = MODE_CONFIG[m];
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => handleModeSwitch(m)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                style={{
                  background: active ? c.color : "transparent",
                  color: active ? "white" : "rgba(148,163,184,0.50)",
                  boxShadow: active ? `0 0 12px ${c.border}` : "none",
                }}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mode description */}
        <span className="text-[10px]" style={{ color: "rgba(148,163,184,0.40)" }}>{mc.desc}</span>

        <div className="flex-1" />

        {/* Activate CTA — shown in Test or Simulation mode after profile setup */}
        {profile?.ndaAccepted && (
          <button
            onClick={() => setShowActivate(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all"
            style={{
              background: "linear-gradient(135deg,rgba(34,197,94,0.25),rgba(22,163,74,0.35))",
              border: "1px solid rgba(34,197,94,0.45)",
              color: "#86efac",
              boxShadow: "0 0 12px rgba(34,197,94,0.15)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(34,197,94,0.30)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,0.65)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px rgba(34,197,94,0.15)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,0.45)";
            }}
          >
            🚀 Activate Platform
          </button>
        )}

        {/* Context info */}
        {profile?.ndaAccepted && (
          <button
            onClick={() => setShowProfileSetup(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}
          >
            ⚙️ {profile.orgName || "My Profile"}
          </button>
        )}

        {/* Panel toggles */}
        <button
          onClick={() => setLeftCollapsed(v => !v)}
          className="px-2 py-1.5 rounded-lg text-[11px] transition-all"
          style={{ background: "rgba(255,255,255,0.04)", color: leftCollapsed ? "#a5b4fc" : "#64748b" }}
          title="Toggle filters panel"
        >
          ☰
        </button>
        <button
          onClick={() => setRightCollapsed(v => !v)}
          className="px-2 py-1.5 rounded-lg text-[11px] transition-all"
          style={{ background: "rgba(255,255,255,0.04)", color: rightCollapsed ? "#a5b4fc" : "#64748b" }}
          title="Toggle guide panel"
        >
          🧠
        </button>
      </div>

      {/* ── Three-Panel Layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Filters */}
        {!leftCollapsed && (
          <div
            className="flex-shrink-0 h-full overflow-hidden border-r transition-all"
            style={{ width: 240, borderColor: "rgba(255,255,255,0.07)" }}
          >
            <FiltersPanel
              filters={filters}
              onChange={handleFiltersChange}
              profile={profile ? { email: profile.email, orgName: profile.orgName } : undefined}
              mode={mode}
              onShowProfile={() => setShowProfileSetup(true)}
            />
          </div>
        )}

        {/* Center: Workspace */}
        <div className="flex-1 overflow-hidden">
          <WorkspacePanel
            mode={mode}
            filters={filters}
            onGuideCtxChange={handleGuideCtxChange}
          />
        </div>

        {/* Right: Guide */}
        {!rightCollapsed && (
          <div
            className="flex-shrink-0 h-full overflow-hidden border-l transition-all"
            style={{ width: 300, borderColor: "rgba(255,255,255,0.07)" }}
          >
            <GuidePanel ctx={guideCtx} />
          </div>
        )}
      </div>

      {/* ── Activate Modal ── */}
      {showActivate && (
        <ActivateModal
          onClose={() => setShowActivate(false)}
          orgName={profile?.orgName}
        />
      )}

      {/* ── Auth Modal ── */}
      {showAuth && (
        <AuthModal
          onAuth={handleAuth}
          onClose={() => { setShowAuth(false); setPendingMode(null); }}
        />
      )}

      {/* ── Profile Setup ── */}
      {showProfileSetup && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(12px)" }}
        >
          <div
            className="w-full max-w-2xl my-4 rounded-3xl overflow-hidden"
            style={{ background: "rgba(14,18,42,0.97)", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-[14px] font-bold text-white">Profile Settings</div>
              <button
                onClick={() => setShowProfileSetup(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>
            <ProfileSetup
              email={profile?.email || ""}
              initialProfile={profile ?? undefined}
              onSave={handleProfileSave}
            />
          </div>
        </div>
      )}
    </div>
  );
}
