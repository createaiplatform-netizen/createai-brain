import { useState } from "react";
import { config } from "../config";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:             string;
  email:          string;
  name:           string | null;
  role:           string;
  organizationId?: string | null;
  mfaEnabled?:    boolean;
}

interface Props {
  onAuth: (user: AuthUser) => void;
}

type Mode  = "login" | "register";
type Stage = "credentials" | "mfa";

// ─── AuthForm ─────────────────────────────────────────────────────────────────
// Handles login, register, and the MFA TOTP challenge step.

export function AuthForm({ onAuth }: Props) {
  const [mode,    setMode]    = useState<Mode>("login");
  const [stage,   setStage]   = useState<Stage>("credentials");
  const [email,   setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [name,    setName]    = useState("");
  const [orgName, setOrgName] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaPendingId, setMfaPendingId] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
    const body: Record<string, string> = { email, password };
    if (mode === "register") {
      if (name.trim()) body.name = name.trim();
      if (orgName.trim()) body.organizationName = orgName.trim();
    }

    try {
      const res  = await fetch(`${config.apiBase}${endpoint}`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(body),
      });
      const data = await res.json() as {
        user?: AuthUser;
        error?: string;
        mfaRequired?: boolean;
        mfaPendingId?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // ── MFA required ───────────────────────────────────────────────────────
      if (data.mfaRequired && data.mfaPendingId) {
        setMfaPendingId(data.mfaPendingId);
        setMfaCode("");
        setStage("mfa");
        return;
      }

      if (data.user) {
        onAuth(data.user);
      }
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaChallenge(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaPendingId) return;
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch(`${config.apiBase}/auth/mfa/challenge`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ mfaPendingId, token: mfaCode }),
      });
      const data = await res.json() as { user?: AuthUser; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Invalid code. Please try again.");
        return;
      }
      if (data.user) onAuth(data.user);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  function resetToLogin() {
    setStage("credentials");
    setMfaPendingId(null);
    setMfaCode("");
    setError(null);
  }

  // ── MFA step ─────────────────────────────────────────────────────────────
  if (stage === "mfa") {
    return (
      <div style={styles.backdrop}>
        <div style={styles.card}>
          <div style={styles.logo}>🔐</div>
          <h1 style={styles.heading}>Two-Factor Authentication</h1>
          <p style={styles.sub}>
            Enter the 6-digit code from your authenticator app
          </p>
          <form onSubmit={handleMfaChallenge} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Verification Code</label>
              <input
                style={{ ...styles.input, textAlign: "center", letterSpacing: "0.3em", fontSize: 20 }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoFocus
                autoComplete="one-time-code"
                required
              />
            </div>
            {error && <div style={styles.error}>{error}</div>}
            <button style={styles.submit} type="submit" disabled={loading || mfaCode.length !== 6}>
              {loading ? "Verifying…" : "Verify"}
            </button>
          </form>
          <button style={styles.link} onClick={resetToLogin}>
            ← Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // ── Credentials step ──────────────────────────────────────────────────────
  return (
    <div style={styles.backdrop}>
      <div style={styles.card}>
        <div style={styles.logo}>◈</div>
        <h1 style={styles.heading}>Universal Platform</h1>
        <p style={styles.sub}>
          {mode === "login" ? "Sign in to your account" : "Create your account"}
        </p>

        <form onSubmit={handleCredentials} style={styles.form}>
          {mode === "register" && (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Your Name (optional)</label>
                <input
                  style={styles.input}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Organization / Facility Name</label>
                <input
                  style={styles.input}
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Sunrise Care Center"
                  autoComplete="organization"
                />
              </div>
            </>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button style={styles.submit} type="submit" disabled={loading}>
            {loading
              ? "Please wait…"
              : mode === "login"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        <div style={styles.toggle}>
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                style={styles.link}
                onClick={() => { setMode("register"); setError(null); }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                style={styles.link}
                onClick={() => { setMode("login"); setError(null); }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position:       "fixed",
    inset:          0,
    background:     "#f8fafc",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    zIndex:         100,
  },
  card: {
    background:    "#ffffff",
    border:        "1px solid rgba(0,0,0,0.08)",
    borderRadius:  14,
    padding:       "40px 36px",
    width:         "100%",
    maxWidth:      400,
    boxShadow:     "0 4px 24px rgba(0,0,0,0.06)",
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
  },
  logo:    { fontSize: 32, color: "#4f46e5", marginBottom: 12 },
  heading: { fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.02em" },
  sub:     { fontSize: 13, color: "#64748b", marginBottom: 28, textAlign: "center" },
  form:    { width: "100%", display: "flex", flexDirection: "column", gap: 16 },
  field:   { display: "flex", flexDirection: "column", gap: 5 },
  label:   { fontSize: 12, fontWeight: 600, color: "#374151" },
  input: {
    border: "1px solid rgba(0,0,0,0.12)", borderRadius: 7,
    padding: "9px 12px", fontSize: 14, color: "#0f172a",
    background: "#fff", outline: "none",
  },
  error: {
    background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: 7, color: "#dc2626", fontSize: 13, padding: "8px 12px",
  },
  submit: {
    background: "#4f46e5", color: "#fff", border: "none",
    borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 600,
    cursor: "pointer", marginTop: 4,
  },
  toggle: { marginTop: 20, fontSize: 13, color: "#64748b", textAlign: "center" },
  link: {
    background: "none", border: "none", color: "#4f46e5",
    fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0,
    textDecoration: "underline", marginTop: 8,
  },
};
