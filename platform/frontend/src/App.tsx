import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { AuthForm, type AuthUser } from "./components/AuthForm";
import { config } from "./config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
}

interface ApiStatus {
  status: "ok" | "degraded" | "unreachable";
  services?: { database: string };
}

// ─── App ──────────────────────────────────────────────────────────────────────
// Checks /auth/me on load to restore session from the signed cookie.
// Shows AuthForm when not authenticated. Shows the workspace when authenticated.
//
// Future: Replace top-level auth state with a proper AuthContext + useAuth hook.
// Future: Add react-router-dom so each page is its own route.
// Future: Add a loading skeleton instead of a blank white flash on startup.

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Restore session on page load ──────────────────────────────────────────
  useEffect(() => {
    fetch(`${config.apiBase}/auth/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: { user: AuthUser | null }) => {
        setUser(data.user ?? null);
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  // ── Load projects + API health when user is authenticated ─────────────────
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    Promise.all([
      fetch(`${config.apiBase}/health`, { credentials: "include" })
        .then((r) => r.json() as Promise<ApiStatus>)
        .catch(() => ({ status: "unreachable" as const })),
      fetch(`${config.apiBase}/projects`, { credentials: "include" })
        .then((r) => r.json() as Promise<{ projects: Project[] }>)
        .catch(() => ({ projects: [] })),
    ])
      .then(([health, proj]) => {
        setApiStatus(health);
        setProjects(proj.projects ?? []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function handleLogout() {
    await fetch(`${config.apiBase}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setUser(null);
    setProjects([]);
    setApiStatus(null);
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch(`${config.apiBase}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newProjectName.trim(), type: "general" }),
      });
      const data = await res.json() as { project?: Project };
      if (data.project) {
        setProjects((prev) => [data.project!, ...prev]);
        setNewProjectName("");
      }
    } finally {
      setCreating(false);
    }
  }

  // ── Wait for session check before showing anything ────────────────────────
  if (!authChecked) {
    return (
      <div style={styles.centered}>
        <span style={{ color: "#94a3b8", fontSize: 14 }}>Loading…</span>
      </div>
    );
  }

  // ── Show auth form when not logged in ─────────────────────────────────────
  if (!user) {
    return <AuthForm onAuth={setUser} />;
  }

  // ── Authenticated workspace ───────────────────────────────────────────────
  return (
    <div style={styles.shell}>
      <Sidebar user={user} onLogout={handleLogout} />
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.heading}>Projects</h1>
            <p style={styles.subheading}>
              Signed in as <strong>{user.email}</strong>
              {user.name ? ` · ${user.name}` : ""}{" "}
              <span style={styles.roleChip}>{user.role}</span>
            </p>
          </div>
          <ApiStatusBadge status={apiStatus} />
        </header>

        <section style={styles.section}>
          {/* New project form */}
          <form onSubmit={handleCreateProject} style={styles.newForm}>
            <input
              style={styles.newInput}
              type="text"
              placeholder="New project name…"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <button style={styles.newButton} type="submit" disabled={creating || !newProjectName.trim()}>
              {creating ? "Creating…" : "+ Add Project"}
            </button>
          </form>

          {loading ? (
            <div style={styles.emptyState}>Loading projects…</div>
          ) : projects.length === 0 ? (
            <div style={styles.emptyState}>
              No projects yet. Create your first one above.
              {!user.organizationId && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#f59e0b" }}>
                  Note: You are not assigned to an organization yet. An admin must assign you before projects can be created.
                  {/* Future: Add org self-setup flow for the first admin user */}
                </div>
              )}
            </div>
          ) : (
            <div style={styles.projectGrid}>
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  const typeColors: Record<string, string> = {
    care_plan:   "#10b981",
    compliance:  "#6366f1",
    operational: "#f59e0b",
    training:    "#0ea5e9",
    general:     "#64748b",
  };
  const color = typeColors[project.type] ?? "#94a3b8";

  return (
    <div style={styles.card}>
      <div style={{ ...styles.cardAccent, background: color }} />
      <div style={styles.cardBody}>
        <div style={styles.cardType}>{project.type.replace("_", " ")}</div>
        <div style={styles.cardName}>{project.name}</div>
        <div style={styles.cardMeta}>
          {new Date(project.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

// ─── API Status Badge ─────────────────────────────────────────────────────────

function ApiStatusBadge({ status }: { status: ApiStatus | null }) {
  if (!status) return null;
  const colors = { ok: "#10b981", degraded: "#f59e0b", unreachable: "#ef4444" };
  const color = colors[status.status];
  return (
    <div style={{ ...styles.badge, borderColor: color, color }}>
      <span style={{ ...styles.dot, background: color }} />
      API {status.status}
      {status.services?.database && ` · DB ${status.services.database}`}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
  },
  main: {
    flex: 1,
    overflow: "auto",
    padding: "32px 36px",
    background: "#f8fafc",
  },
  centered: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },
  subheading: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  roleChip: {
    fontSize: 10,
    fontWeight: 700,
    background: "#f1f5f9",
    color: "#4f46e5",
    borderRadius: 4,
    padding: "2px 6px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  section: {
    background: "#ffffff",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.07)",
    padding: 24,
  },
  newForm: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
  },
  newInput: {
    flex: 1,
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 7,
    padding: "8px 12px",
    fontSize: 14,
    color: "#0f172a",
    outline: "none",
  },
  newButton: {
    background: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: 7,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  projectGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 14,
  },
  card: {
    border: "1px solid rgba(0,0,0,0.07)",
    borderRadius: 10,
    overflow: "hidden",
    background: "#ffffff",
  },
  cardAccent: {
    height: 4,
    width: "100%",
  },
  cardBody: {
    padding: "14px 16px",
  },
  cardType: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#94a3b8",
    marginBottom: 4,
  },
  cardName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: 6,
  },
  cardMeta: {
    fontSize: 12,
    color: "#94a3b8",
  },
  emptyState: {
    color: "#94a3b8",
    fontSize: 14,
    padding: "24px 0",
    textAlign: "center",
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 500,
    border: "1px solid",
    borderRadius: 6,
    padding: "5px 10px",
    background: "#ffffff",
    flexShrink: 0,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
  },
};
