import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";

const SAGE = "#7a9068";
const SAND = "#c4a97a";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.15)";

const ADMIN_SECTIONS = [
  {
    icon: "🧠",
    label: "Full OS Platform",
    description: "Access every app, tool, and workspace",
    path: "/",
    color: SAGE,
  },
  {
    icon: "📊",
    label: "Metrics",
    description: "Live platform data and performance",
    path: "/metrics",
    color: "#5a7a68",
  },
  {
    icon: "🌍",
    label: "Global Expansion",
    description: "Manage markets, reach, and growth",
    path: "/global-expansion",
    color: "#8a7060",
  },
  {
    icon: "⚡",
    label: "Platform Status",
    description: "Health, uptime, and service monitor",
    path: "/platform-status",
    color: "#6b7a5a",
  },
  {
    icon: "👥",
    label: "Team",
    description: "People, roles, and access management",
    path: "/team",
    color: "#7a6858",
  },
  {
    icon: "📈",
    label: "Analytics",
    description: "Usage, behavior, and insights",
    path: "/analytics",
    color: "#5a6878",
  },
];

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : (user?.email?.split("@")[0] ?? "Admin");

  return (
    <div
      className="min-h-screen"
      style={{ background: CREAM, color: TEXT }}
    >
      {/* Top bar */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(250,249,246,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{ background: SAGE }}
          >
            🧠
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: TEXT }}>
              CreateAI Brain
            </p>
            <p className="text-[11px]" style={{ color: MUTED }}>
              Admin Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-[12px] px-3 py-1 rounded-full font-medium"
            style={{ background: `${SAGE}18`, color: SAGE }}
          >
            Admin
          </span>
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
      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Welcome */}
        <div>
          <h1 className="text-[26px] font-black tracking-tight" style={{ color: TEXT }}>
            Welcome back, {displayName}
          </h1>
          <p className="text-[14px] mt-1" style={{ color: MUTED }}>
            You have full platform access. Where do you want to go?
          </p>
        </div>

        {/* Quick access cards */}
        <div className="flex flex-col gap-3">
          {ADMIN_SECTIONS.map(({ icon, label, description, path, color }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.99]"
              style={{
                background: "white",
                border: `1px solid ${BORDER}`,
                boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${color}40`;
                e.currentTarget.style.boxShadow = `0 4px 16px ${color}14`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = BORDER;
                e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.04)";
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${color}14` }}
              >
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold" style={{ color: TEXT }}>
                  {label}
                </p>
                <p className="text-[12px] mt-0.5 truncate" style={{ color: MUTED }}>
                  {description}
                </p>
              </div>
              <span style={{ color: MUTED, fontSize: 16 }}>›</span>
            </button>
          ))}
        </div>

        {/* System note */}
        <div
          className="p-4 rounded-2xl"
          style={{ background: `${SAGE}0c`, border: `1px solid ${SAGE}20` }}
        >
          <p className="text-[12px]" style={{ color: MUTED }}>
            <strong style={{ color: SAGE }}>Admin access:</strong> You can access all platform areas
            except the customer storefront. Use the Full OS Platform link above for the complete workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
