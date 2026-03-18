import type { AuthUser } from "./AuthForm";

// ─── Sidebar ──────────────────────────────────────────────────────────────────
// Primary navigation. Receives the authenticated user so it can show their
// name and a logout button.
//
// Future: Render nav items dynamically based on user.role.
//   Admins see: Users, Organizations, Audit Log, Compliance.
//   Members see: Projects, My Work.
// Future: Add react-router Link components instead of plain <a> tags.
// Future: Add active route highlighting.
// Future: Add organization switcher for multi-facility users.

interface NavItem {
  label: string;
  icon: string;
  href: string;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",     icon: "⊞", href: "/"              },
  { label: "Projects",      icon: "📁", href: "/projects"      },
  { label: "Users",         icon: "👤", href: "/users",         comingSoon: true },
  { label: "Organizations", icon: "🏢", href: "/organizations", comingSoon: true },
  // Future: { label: "AI Agent",    icon: "🤖", href: "/ai" }
  // Future: { label: "Compliance",  icon: "✅", href: "/compliance" }
  // Future: { label: "Audit Log",   icon: "📋", href: "/audit" }   (admin only)
];

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: Props) {
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>◈</span>
        <span style={styles.logoText}>Universal Platform</span>
      </div>

      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <a key={item.href} href={item.href} style={styles.navItem}>
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
            {item.comingSoon && <span style={styles.pill}>Soon</span>}
          </a>
        ))}
      </nav>

      {/* Authenticated user + logout */}
      <div style={styles.bottomSection}>
        <div style={styles.userRow}>
          <div style={styles.userAvatar}>{initials}</div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user.name ?? user.email}</div>
            {user.name && <div style={styles.userEmail}>{user.email}</div>}
          </div>
        </div>
        <button style={styles.logoutBtn} onClick={onLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 220,
    minWidth: 220,
    height: "100vh",
    background: "#ffffff",
    borderRight: "1px solid rgba(0,0,0,0.07)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "20px 18px 16px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  logoIcon: {
    fontSize: 20,
    color: "#4f46e5",
  },
  logoText: {
    fontWeight: 700,
    fontSize: 14,
    color: "#0f172a",
    letterSpacing: "-0.01em",
  },
  nav: {
    flex: 1,
    padding: "12px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 7,
    textDecoration: "none",
    color: "#334155",
    fontSize: 13,
    fontWeight: 500,
  },
  navIcon: {
    fontSize: 15,
    width: 20,
    textAlign: "center",
  },
  pill: {
    marginLeft: "auto",
    fontSize: 10,
    fontWeight: 600,
    background: "#f1f5f9",
    color: "#94a3b8",
    borderRadius: 4,
    padding: "1px 6px",
  },
  bottomSection: {
    padding: "12px 14px 14px",
    borderTop: "1px solid rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#4f46e5",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  userInfo: {
    minWidth: 0,
  },
  userName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0f172a",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userEmail: {
    fontSize: 11,
    color: "#94a3b8",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    background: "none",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 12,
    color: "#64748b",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: 500,
  },
};
