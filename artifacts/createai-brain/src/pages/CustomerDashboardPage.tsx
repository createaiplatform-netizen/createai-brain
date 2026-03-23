import React, { useEffect, useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";

const SAGE   = "#7a9068";
const SAND   = "#c4a97a";
const CREAM  = "#faf9f6";
const TEXT   = "#1a1916";
const MUTED  = "#6b6660";
const BORDER = "rgba(122,144,104,0.15)";

const DASHBOARD_SECTIONS = [
  { icon: "📁", label: "My Projects",      description: "Everything you've created and saved", color: SAGE  },
  { icon: "💬", label: "AI Assistant",      description: "Chat with your personal AI",           color: "#5a7a68" },
  { icon: "📋", label: "My Orders",         description: "Purchase history and receipts",         color: SAND  },
  { icon: "⚙️", label: "Account Settings",  description: "Profile, notifications, and preferences", color: MUTED },
  { icon: "🤝", label: "Support",           description: "Get help when you need it",             color: "#8a7060" },
];

interface TopApp {
  appId: string;
  label: string;
  icon:  string;
  opens: number;
}

export default function CustomerDashboardPage() {
  const { user, logout } = useAuth();
  const [topApps, setTopApps]     = useState<TopApp[]>([]);
  const [appsReady, setAppsReady] = useState(false);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : (user?.email?.split("@")[0] ?? "there");

  useEffect(() => {
    fetch("/api/app-usage/mine?limit=6", { credentials: "include" })
      .then(r => r.ok ? r.json() as Promise<{ ok: boolean; top: TopApp[] }> : null)
      .then(d => { if (d?.ok && d.top.length > 0) setTopApps(d.top); })
      .catch(() => {})
      .finally(() => setAppsReady(true));
  }, []);

  const openApp = (appId: string) => {
    window.dispatchEvent(new CustomEvent("cai:open-app", { detail: { appId } }));
  };

  const openQuickLauncher = () => {
    window.dispatchEvent(new CustomEvent("cai:open-quick-launcher"));
  };

  return (
    <div className="min-h-screen" style={{ background: CREAM, color: TEXT }}>

      {/* Top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{ background: "rgba(250,249,246,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg text-white flex-shrink-0" style={{ background: SAGE }}>
            🧠
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: TEXT }}>CreateAI Brain</p>
            <p className="text-[11px]" style={{ color: MUTED }}>Member Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Cmd+K quick launcher button */}
          <button
            onClick={openQuickLauncher}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
            style={{ background: `${SAGE}12`, color: SAGE, border: `1px solid ${SAGE}25` }}
          >
            <span>⌘K</span>
            <span style={{ color: MUTED }}>Find any app</span>
          </button>

          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white" style={{ background: SAGE }}>
              {displayName[0]?.toUpperCase()}
            </div>
          )}
          <button
            onClick={logout}
            className="text-[12px] px-3 py-1.5 rounded-lg font-medium transition-all"
            style={{ background: "rgba(0,0,0,0.05)", color: MUTED }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-6 py-10 flex flex-col gap-8">

        {/* Welcome */}
        <div>
          <h1 className="text-[26px] font-black tracking-tight" style={{ color: TEXT }}>
            Hi, {displayName}
          </h1>
          <p className="text-[14px] mt-1" style={{ color: MUTED }}>
            Welcome to your dashboard. Here's everything in one place.
          </p>
        </div>

        {/* Most-used apps — shown only once usage data is populated */}
        {appsReady && topApps.length > 0 && (
          <div>
            <p className="text-[12px] font-bold uppercase tracking-widest mb-3" style={{ color: MUTED }}>
              Your Most-Used Apps
            </p>
            <div className="flex flex-col gap-2">
              {topApps.map(app => (
                <button
                  key={app.appId}
                  onClick={() => openApp(app.appId)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left w-full transition-all active:scale-[0.99]"
                  style={{
                    background: "white",
                    border: `1px solid ${BORDER}`,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${SAGE}40`;
                    e.currentTarget.style.boxShadow   = `0 3px 12px ${SAGE}12`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = BORDER;
                    e.currentTarget.style.boxShadow   = "0 1px 4px rgba(0,0,0,0.04)";
                  }}
                >
                  <span className="text-xl flex-shrink-0 w-9 text-center">{app.icon || "🧠"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: TEXT }}>{app.label}</p>
                  </div>
                  <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: MUTED }}>
                    {app.opens}× used
                  </span>
                </button>
              ))}
            </div>

            {/* Cmd+K hint — only on mobile where the top bar button is hidden */}
            <button
              onClick={openQuickLauncher}
              className="sm:hidden mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-[12px] font-semibold transition-all"
              style={{ background: `${SAGE}10`, color: SAGE, border: `1px solid ${SAGE}20` }}
            >
              ⌘K — Find any of the 408 apps
            </button>
          </div>
        )}

        {/* Show Cmd+K hint if no usage data yet */}
        {appsReady && topApps.length === 0 && (
          <button
            onClick={openQuickLauncher}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-semibold transition-all"
            style={{ background: `${SAGE}10`, color: SAGE, border: `1px solid ${SAGE}25` }}
          >
            ⌘K — Search 408 AI tools instantly
          </button>
        )}

        {/* Dashboard sections */}
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest mb-3" style={{ color: MUTED }}>
            Your Account
          </p>
          <div className="flex flex-col gap-3">
            {DASHBOARD_SECTIONS.map(({ icon, label, description, color }) => (
              <button
                key={label}
                className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.99] w-full"
                style={{ background: "white", border: `1px solid ${BORDER}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${color}40`;
                  e.currentTarget.style.boxShadow   = `0 4px 14px ${color}12`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = BORDER;
                  e.currentTarget.style.boxShadow   = "0 1px 6px rgba(0,0,0,0.04)";
                }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${color}14` }}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold" style={{ color: TEXT }}>{label}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>{description}</p>
                </div>
                <span style={{ color: MUTED, fontSize: 16 }}>›</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="p-4 rounded-2xl text-center" style={{ background: `${SAGE}0c`, border: `1px solid ${SAGE}1a` }}>
          <p className="text-[13px]" style={{ color: MUTED }}>
            More features are on the way.{" "}
            <span style={{ color: SAGE }}>Thank you for being here.</span>
          </p>
        </div>

      </div>
    </div>
  );
}
