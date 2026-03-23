import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";

const PROJECTS = [
  {
    icon: "🧠",
    title: "CreateAI Brain",
    desc: "The full AI command center — 365+ tools, workflows, and your personal AI OS.",
    href: "/",
    color: "#6366f1",
    bg: "#eef2ff",
  },
  {
    icon: "🌐",
    title: "StaffingOS",
    desc: "Global staffing, candidate tracking, and placement management at scale.",
    href: "/staffing-os/",
    external: true,
    color: "#0284c7",
    bg: "#e0f2fe",
  },
  {
    icon: "🩺",
    title: "HealthOS",
    desc: "Async health consultations, clinical documentation, and care coordination.",
    href: "/health-os/",
    external: true,
    color: "#16a34a",
    bg: "#dcfce7",
  },
  {
    icon: "⚖️",
    title: "Legal Practice Manager",
    desc: "Case management, time tracking, billing, and document workflows for legal teams.",
    href: "/legal-pm/",
    external: true,
    color: "#b45309",
    bg: "#fef3c7",
  },
  {
    icon: "💬",
    title: "AI Chat",
    desc: "Secure, AI-assisted messaging with context-aware conversations and deep platform integration.",
    href: "/chat-app/",
    external: true,
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    icon: "⚡",
    title: "Automation Engine",
    desc: "Connect your tools, automate workflows, and let AI handle repetitive work 24/7.",
    href: "/",
    color: "#dc2626",
    bg: "#fef2f2",
  },
  {
    icon: "📊",
    title: "Analytics Suite",
    desc: "Real-time insights, platform metrics, and performance tracking across all your tools.",
    href: "/analytics",
    color: "#0891b2",
    bg: "#ecfeff",
  },
  {
    icon: "🛡️",
    title: "Security & Audit",
    desc: "End-to-end encryption, audit logs, and full visibility into platform activity.",
    href: "/",
    color: "#374151",
    bg: "#f9fafb",
  },
];

export default function ProjectsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const displayName = user?.firstName
    ? user.firstName
    : (user?.email?.split("@")[0] ?? "");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f8fc",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #ebebf0",
          padding: "0 32px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#888",
              fontSize: 13,
              fontWeight: 600,
              padding: "4px 0",
            }}
          >
            ← Back
          </button>
          <span style={{ color: "#e0e0e0" }}>|</span>
          <span
            style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "#0a0a0a" }}
          >
            Projects
          </span>
        </div>
        {displayName && (
          <span style={{ fontSize: 13, color: "#888" }}>
            Signed in as <strong style={{ color: "#0a0a0a" }}>{displayName}</strong>
          </span>
        )}
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Title */}
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "#0a0a0a",
              marginBottom: 8,
            }}
          >
            All Projects
          </h1>
          <p style={{ fontSize: 16, color: "#666", lineHeight: 1.6 }}>
            Every platform and system in one place. Click any card to open it.
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 18,
          }}
        >
          {PROJECTS.map((p) => (
            <div
              key={p.title}
              onClick={() => {
                if (p.external) {
                  window.location.href = p.href;
                } else {
                  navigate(p.href);
                }
              }}
              style={{
                background: "#fff",
                border: "1.5px solid #ebebf0",
                borderRadius: 14,
                padding: "28px 26px 24px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                transition: "box-shadow 0.16s, transform 0.16s, border-color 0.16s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 8px 32px rgba(0,0,0,0.08)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLDivElement).style.borderColor = p.color + "66";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                (e.currentTarget as HTMLDivElement).style.transform = "none";
                (e.currentTarget as HTMLDivElement).style.borderColor = "#ebebf0";
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: p.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                {p.icon}
              </div>

              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: "#0a0a0a" }}>
                {p.title}
              </div>

              <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6, flex: 1 }}>
                {p.desc}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  color: p.color,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Open {p.external ? "↗" : "→"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
