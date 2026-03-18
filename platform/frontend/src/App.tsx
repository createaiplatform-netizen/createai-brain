import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { config } from "./config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  _placeholder?: boolean;
}

interface ApiStatus {
  status: "ok" | "degraded" | "unreachable";
  services?: { database: string };
}

// ─── App ──────────────────────────────────────────────────────────────────────
// Future: Replace this with a proper router (react-router-dom).
//   Each route maps to a page component: Dashboard, Projects, Users, etc.
// Future: Wrap with AuthGuard — redirect to /login if no session.
// Future: Load user + org context from /api/auth/user on mount.

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Check API health
        const healthRes = await fetch(`${config.apiBase}/health`);
        const health: ApiStatus = await healthRes.json();
        setApiStatus(health);

        // Load projects
        const projRes = await fetch(`${config.apiBase}/projects`);
        const projData = await projRes.json();
        setProjects(projData.projects ?? []);
      } catch {
        setApiStatus({ status: "unreachable" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={styles.shell}>
      <Sidebar />
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.heading}>Universal Platform</h1>
            <p style={styles.subheading}>
              Minimal, real, and ready to build on.
            </p>
          </div>
          <ApiStatusBadge status={apiStatus} />
        </header>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Projects</h2>
            <button style={styles.newButton}>
              + New Project
              {/* Future: onClick opens create project modal */}
            </button>
          </div>

          {loading ? (
            <div style={styles.emptyState}>Loading…</div>
          ) : projects.length === 0 ? (
            <div style={styles.emptyState}>No projects yet.</div>
          ) : (
            <div style={styles.projectGrid}>
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </section>

        {/* Future: Dashboard widgets — recent activity, compliance status, AI usage */}
        {/* Future: Notifications panel */}
        {/* Future: Quick-access recent files */}
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
    other:       "#94a3b8",
  };
  const color = typeColors[project.type] ?? typeColors.other;

  return (
    <div style={styles.card}>
      <div style={{ ...styles.cardAccent, background: color }} />
      <div style={styles.cardBody}>
        <div style={styles.cardType}>{project.type.replace("_", " ")}</div>
        <div style={styles.cardName}>{project.name}</div>
        <div style={styles.cardMeta}>
          Created {new Date(project.createdAt).toLocaleDateString()}
          {project._placeholder && (
            <span style={styles.placeholderTag}> · placeholder</span>
          )}
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
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  heading: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },
  subheading: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  section: {
    background: "#ffffff",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.07)",
    padding: 24,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#0f172a",
  },
  newButton: {
    background: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: 7,
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  projectGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 14,
  },
  card: {
    border: "1px solid rgba(0,0,0,0.07)",
    borderRadius: 10,
    overflow: "hidden",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
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
  placeholderTag: {
    color: "#cbd5e1",
    fontStyle: "italic",
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
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
  },
};
