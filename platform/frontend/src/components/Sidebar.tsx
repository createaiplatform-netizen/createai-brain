import { NavLink, useLocation } from "react-router-dom";
import type { AuthUser }   from "./AuthForm";
import type { ApiStatus }  from "../App";

// ─── Nav items ────────────────────────────────────────────────────────────────

interface NavItem {
  label:      string;
  icon:       string;
  to:         string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",     icon: "⊞", to: "/"              },
  { label: "Projects",      icon: "📁", to: "/projects"      },
  { label: "Patients",      icon: "🏥", to: "/patients"      },
  { label: "Users",         icon: "👤", to: "/users",          adminOnly: true },
  { label: "Organizations", icon: "🏢", to: "/organizations",  adminOnly: true },
  { label: "Integrations",  icon: "🔌", to: "/integrations",   adminOnly: true },
  { label: "Audit Log",     icon: "📋", to: "/audit",           adminOnly: true },
];

interface Props {
  user:      AuthUser;
  onLogout:  () => void;
  apiStatus: ApiStatus | null;
}

export function Sidebar({ user, onLogout, apiStatus }: Props) {
  const location = useLocation();

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user.email[0].toUpperCase();

  const isAdmin = user.role === "admin" || user.role === "super_admin";

  const statusColor =
    apiStatus?.status === "ok"       ? "#10b981" :
    apiStatus?.status === "degraded" ? "#f59e0b" : "#ef4444";

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>◈</span>
        <span style={styles.logoText}>Universal Platform</span>
      </div>

      <nav style={styles.nav}>
        {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
          const active = item.to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={{
                ...styles.navItem,
                ...(active ? styles.navItemActive : {}),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={styles.bottomSection}>
        {/* API status dot */}
        {apiStatus && (
          <div style={styles.statusRow}>
            <span style={{ ...styles.statusDot, background: statusColor }} />
            <span style={styles.statusText}>
              API {apiStatus.status}
              {apiStatus.services?.database && ` · DB ${apiStatus.services.database}`}
            </span>
          </div>
        )}

        {/* Account link */}
        <NavLink to="/account" style={styles.userRow}>
          <div style={styles.userAvatar}>{initials}</div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user.name ?? user.email}</div>
            {user.name && <div style={styles.userEmail}>{user.email}</div>}
          </div>
        </NavLink>

        <button style={styles.logoutBtn} onClick={onLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width:        220,
    minWidth:     220,
    height:       "100vh",
    background:   "#ffffff",
    borderRight:  "1px solid rgba(0,0,0,0.07)",
    display:      "flex",
    flexDirection:"column",
    flexShrink:   0,
    overflow:     "hidden",
  },
  logo: {
    display:      "flex",
    alignItems:   "center",
    gap:          10,
    padding:      "20px 18px 16px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    flexShrink:   0,
  },
  logoIcon: { fontSize: 20, color: "#4f46e5" },
  logoText: { fontWeight: 700, fontSize: 14, color: "#0f172a", letterSpacing: "-0.01em" },
  nav: {
    flex:          1,
    padding:       "12px 10px",
    display:       "flex",
    flexDirection: "column",
    gap:           2,
    overflowY:     "auto",
  },
  navItem: {
    display:        "flex",
    alignItems:     "center",
    gap:            10,
    padding:        "8px 10px",
    borderRadius:   7,
    textDecoration: "none",
    color:          "#334155",
    fontSize:       13,
    fontWeight:     500,
    transition:     "background 0.1s",
  },
  navItemActive: {
    background: "#f1f5f9",
    color:      "#4f46e5",
    fontWeight: 600,
  },
  navIcon: { fontSize: 15, width: 20, textAlign: "center", flexShrink: 0 },
  bottomSection: {
    padding:       "12px 14px 14px",
    borderTop:     "1px solid rgba(0,0,0,0.06)",
    display:       "flex",
    flexDirection: "column",
    gap:           10,
    flexShrink:    0,
  },
  statusRow: {
    display:    "flex",
    alignItems: "center",
    gap:        6,
    padding:    "0 2px",
  },
  statusDot: {
    width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
  },
  statusText: {
    fontSize: 11, color: "#94a3b8",
  },
  userRow: {
    display:        "flex",
    alignItems:     "center",
    gap:            10,
    textDecoration: "none",
    padding:        "6px 2px",
    borderRadius:   7,
  },
  userAvatar: {
    width:          32,
    height:         32,
    borderRadius:   "50%",
    background:     "#4f46e5",
    color:          "#fff",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontSize:       13,
    fontWeight:     700,
    flexShrink:     0,
  },
  userInfo: { minWidth: 0 },
  userName: {
    fontSize: 13, fontWeight: 600, color: "#0f172a",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  userEmail: {
    fontSize: 11, color: "#94a3b8",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  logoutBtn: {
    background:  "none",
    border:      "1px solid rgba(0,0,0,0.1)",
    borderRadius:6,
    padding:     "6px 10px",
    fontSize:    12,
    color:       "#64748b",
    cursor:      "pointer",
    textAlign:   "left",
    fontWeight:  500,
  },
};
