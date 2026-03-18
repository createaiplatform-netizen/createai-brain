import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { AuthForm, type AuthUser } from "./components/AuthForm";
import { config } from "./config";

import { Dashboard }      from "./pages/Dashboard";
import { Projects }       from "./pages/Projects";
import { Patients }       from "./pages/Patients";
import { Users }          from "./pages/Users";
import { Organizations }  from "./pages/Organizations";
import { AuditLog }       from "./pages/AuditLog";
import { Integrations }   from "./pages/Integrations";
import { Account }        from "./pages/Account";

// ─── App ──────────────────────────────────────────────────────────────────────
// Session is restored from the signed cookie via GET /auth/me on page load.
// Shows AuthForm when unauthenticated; the full shell when authenticated.

export interface ApiStatus {
  status: "ok" | "degraded" | "unreachable";
  services?: { database: string };
}

export default function App() {
  const [user,        setUser]        = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [apiStatus,   setApiStatus]   = useState<ApiStatus | null>(null);

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

  // ── Poll API health ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const check = () =>
      fetch(`${config.apiBase}/health`, { credentials: "include" })
        .then((r) => r.json() as Promise<ApiStatus>)
        .then(setApiStatus)
        .catch(() => setApiStatus({ status: "unreachable" }));
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  async function handleLogout() {
    await fetch(`${config.apiBase}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setUser(null);
    setApiStatus(null);
  }

  if (!authChecked) {
    return (
      <div style={styles.centered}>
        <span style={{ color: "#94a3b8", fontSize: 14 }}>Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuth={setUser} />;
  }

  return (
    <BrowserRouter>
      <div style={styles.shell}>
        <Sidebar user={user} onLogout={handleLogout} apiStatus={apiStatus} />
        <main style={styles.main}>
          <Routes>
            <Route path="/"              element={<Dashboard user={user} apiStatus={apiStatus} />} />
            <Route path="/projects"      element={<Projects  user={user} />} />
            <Route path="/patients"      element={<Patients />} />
            <Route path="/users"         element={<Users     user={user} />} />
            <Route path="/organizations" element={<Organizations user={user} />} />
            <Route path="/audit"         element={<AuditLog  user={user} />} />
            <Route path="/integrations"  element={<Integrations user={user} />} />
            <Route path="/account"       element={<Account   user={user} onUserUpdate={setUser} />} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display:  "flex",
    height:   "100vh",
    overflow: "hidden",
    background: "#f8fafc",
  },
  main: {
    flex:     1,
    overflow: "auto",
    padding:  "32px 36px",
    background: "#f8fafc",
  },
  centered: {
    height:         "100vh",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
  },
};
