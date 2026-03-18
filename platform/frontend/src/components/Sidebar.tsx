// ─── Sidebar ──────────────────────────────────────────────────────────────────
// Primary navigation for the platform.
//
// Future: Render navigation items dynamically based on user role.
//   Admins see: Users, Organizations, Audit Log, Compliance.
//   Staff see: Projects, My Work, Messages.
// Future: Add active route highlighting (via react-router).
// Future: Add organization switcher at the top for multi-facility users.
// Future: Collapse to icon-only mode on smaller screens.

interface NavItem {
  label: string;
  icon: string;
  href: string;
  placeholder?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",     icon: "⊞", href: "/",              },
  { label: "Projects",      icon: "📁", href: "/projects",      },
  { label: "Users",         icon: "👤", href: "/users",         placeholder: true },
  { label: "Organizations", icon: "🏢", href: "/organizations", placeholder: true },
  // Future: { label: "AI Agent",   icon: "🤖", href: "/ai" }
  // Future: { label: "Compliance", icon: "✅", href: "/compliance" }
  // Future: { label: "Audit Log",  icon: "📋", href: "/audit" }  (admin only)
];

export function Sidebar() {
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
            {item.placeholder && (
              <span style={styles.pill}>Soon</span>
            )}
          </a>
        ))}
      </nav>

      {/* Future: User profile + logout button at the bottom */}
      <div style={styles.bottomSection}>
        <div style={styles.userPlaceholder}>
          <span style={styles.userAvatar}>?</span>
          <div>
            <div style={styles.userName}>Not signed in</div>
            <div style={styles.userRole}>Auth coming soon</div>
          </div>
        </div>
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
    padding: "0",
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
    transition: "background 0.15s",
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
    padding: "12px 14px",
    borderTop: "1px solid rgba(0,0,0,0.06)",
  },
  userPlaceholder: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    color: "#94a3b8",
    flexShrink: 0,
  },
  userName: {
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
  },
  userRole: {
    fontSize: 11,
    color: "#94a3b8",
  },
};
