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
