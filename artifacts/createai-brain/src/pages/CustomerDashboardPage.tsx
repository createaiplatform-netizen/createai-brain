import { useAuth } from "@workspace/replit-auth-web";

const SAGE = "#7a9068";
const SAND = "#c4a97a";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.15)";

const DASHBOARD_SECTIONS = [
  {
    icon: "📁",
    label: "My Projects",
    description: "Everything you've created and saved",
    color: SAGE,
    badge: null,
  },
  {
    icon: "💬",
    label: "AI Assistant",
    description: "Chat with your personal AI",
    color: "#5a7a68",
    badge: null,
  },
  {
    icon: "📋",
    label: "My Orders",
    description: "Purchase history and receipts",
    color: SAND,
    badge: null,
  },
  {
    icon: "⚙️",
    label: "Account Settings",
    description: "Profile, notifications, and preferences",
    color: MUTED,
    badge: null,
  },
  {
    icon: "🤝",
    label: "Support",
    description: "Get help when you need it",
    color: "#8a7060",
    badge: null,
  },
];

export default function CustomerDashboardPage() {
  const { user, logout } = useAuth();

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : (user?.email?.split("@")[0] ?? "there");

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
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg text-white flex-shrink-0"
            style={{ background: SAGE }}
          >
            🧠
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: TEXT }}>
              CreateAI Brain
            </p>
            <p className="text-[11px]" style={{ color: MUTED }}>
              Member Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
              style={{ background: SAGE }}
            >
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

        {/* Sections */}
        <div className="flex flex-col gap-3">
          {DASHBOARD_SECTIONS.map(({ icon, label, description, color }) => (
            <button
              key={label}
              className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.99] w-full"
              style={{
                background: "white",
                border: `1px solid ${BORDER}`,
                boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${color}40`;
                e.currentTarget.style.boxShadow = `0 4px 14px ${color}12`;
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
                <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
                  {description}
                </p>
              </div>
              <span style={{ color: MUTED, fontSize: 16 }}>›</span>
            </button>
          ))}
        </div>

        {/* Coming soon note */}
        <div
          className="p-4 rounded-2xl text-center"
          style={{ background: `${SAGE}0c`, border: `1px solid ${SAGE}1a` }}
        >
          <p className="text-[13px]" style={{ color: MUTED }}>
            More features are on the way.{" "}
            <span style={{ color: SAGE }}>Thank you for being here.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
