import { useState } from "react";
import type { AuthUser } from "../components/AuthForm";
import { config } from "../config";

interface Props {
  user:          AuthUser;
  onUserUpdate:  (u: AuthUser) => void;
}

export function Account({ user, onUserUpdate }: Props) {
  const [phase, setPhase] = useState<"idle" | "setup" | "confirm" | "done">("idle");
  const [qrCode,    setQrCode]    = useState<string | null>(null);
  const [secret,    setSecret]    = useState<string | null>(null);
  const [confirmToken, setConfirmToken] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function startSetup() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${config.apiBase}/auth/mfa/setup`, {
        method: "POST", credentials: "include",
      });
      const data = await res.json() as { secret?: string; qrCode?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to start MFA setup."); return; }
      setSecret(data.secret ?? null);
      setQrCode(data.qrCode ?? null);
      setPhase("setup");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup() {
    if (confirmToken.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${config.apiBase}/auth/mfa/confirm`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body:    JSON.stringify({ token: confirmToken }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to verify code."); return; }
      setPhase("done");
      setSuccess("MFA is now enabled on your account.");
      onUserUpdate({ ...user, mfaEnabled: true });
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function disableMfa() {
    if (!disableToken) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${config.apiBase}/auth/mfa`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body:    JSON.stringify({ token: disableToken }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to disable MFA."); return; }
      setSuccess("MFA has been disabled.");
      setDisableToken("");
      onUserUpdate({ ...user, mfaEnabled: false });
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 style={styles.heading}>Account</h1>
      <p style={styles.sub}>Manage your profile and security settings.</p>

      {/* Profile card */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Profile</h2>
        <div style={styles.row}>
          <div style={styles.avatar}>
            {(user.name ?? user.email)[0].toUpperCase()}
          </div>
          <div>
            <div style={styles.profileName}>{user.name ?? "—"}</div>
            <div style={styles.profileEmail}>{user.email}</div>
            <span style={styles.roleChip}>{user.role}</span>
          </div>
        </div>
      </div>

      {/* MFA section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Two-Factor Authentication (TOTP)</h2>
        <p style={styles.sectionDesc}>
          Add an extra layer of security. After enabling MFA, you will need
          an authenticator app (Google Authenticator, Authy, 1Password) to sign in.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color:      user.mfaEnabled ? "#10b981" : "#94a3b8",
          }}>
            {user.mfaEnabled ? "✓ MFA is enabled" : "○ MFA is not enabled"}
          </span>
        </div>

        {success && (
          <div style={styles.successBox}>{success}</div>
        )}
        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}

        {/* Enable flow */}
        {!user.mfaEnabled && phase === "idle" && (
          <button style={styles.btn} onClick={startSetup} disabled={loading}>
            {loading ? "Loading…" : "Set up MFA"}
          </button>
        )}

        {!user.mfaEnabled && phase === "setup" && qrCode && (
          <div>
            <p style={styles.step}>
              1. Scan this QR code with your authenticator app.
            </p>
            <img
              src={qrCode}
              alt="MFA QR code"
              style={{ width: 180, height: 180, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, display: "block", marginBottom: 16 }}
            />
            {secret && (
              <p style={styles.secretNote}>
                Or enter this secret manually:{" "}
                <code style={styles.secretCode}>{secret}</code>
              </p>
            )}
            <p style={styles.step}>2. Enter the 6-digit code from your app to confirm.</p>
            <div style={styles.tokenRow}>
              <input
                style={{ ...styles.tokenInput }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={confirmToken}
                onChange={(e) => setConfirmToken(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoComplete="one-time-code"
              />
              <button
                style={styles.btn}
                onClick={confirmSetup}
                disabled={loading || confirmToken.length !== 6}
              >
                {loading ? "Verifying…" : "Enable MFA"}
              </button>
            </div>
          </div>
        )}

        {/* Disable flow */}
        {user.mfaEnabled && phase !== "done" && (
          <div>
            <p style={styles.sectionDesc}>
              To disable MFA, enter a 6-digit code from your authenticator app.
            </p>
            <div style={styles.tokenRow}>
              <input
                style={styles.tokenInput}
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
              />
              <button
                style={{ ...styles.btn, background: "#ef4444" }}
                onClick={disableMfa}
                disabled={loading || disableToken.length !== 6}
              >
                {loading ? "Disabling…" : "Disable MFA"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Session info */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Session</h2>
        <p style={styles.sectionDesc}>
          Sessions expire after 7 days of absolute inactivity, or after 30 minutes
          of idle time (whichever comes first). You will be signed out automatically.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading:     { fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 4 },
  sub:         { fontSize: 13, color: "#64748b", marginBottom: 24 },
  section:     { background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: "20px 24px", marginBottom: 16 },
  sectionTitle:{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 8 },
  sectionDesc: { fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.6 },
  row:         { display: "flex", alignItems: "center", gap: 14 },
  avatar: {
    width: 48, height: 48, borderRadius: "50%", background: "#4f46e5",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, fontWeight: 700, flexShrink: 0,
  },
  profileName:  { fontSize: 15, fontWeight: 600, color: "#0f172a" },
  profileEmail: { fontSize: 13, color: "#64748b", margin: "2px 0" },
  roleChip:     { fontSize: 10, fontWeight: 700, background: "#ede9fe", color: "#7c3aed", borderRadius: 4, padding: "2px 7px", textTransform: "uppercase" },
  btn: {
    background: "#4f46e5", color: "#fff", border: "none",
    borderRadius: 7, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  step:        { fontSize: 13, color: "#0f172a", fontWeight: 600, marginBottom: 12 },
  secretNote:  { fontSize: 12, color: "#64748b", marginBottom: 16 },
  secretCode:  { fontFamily: "monospace", background: "#f1f5f9", borderRadius: 4, padding: "2px 6px", color: "#0f172a" },
  tokenRow:    { display: "flex", gap: 10, alignItems: "center" },
  tokenInput: {
    border: "1px solid rgba(0,0,0,0.12)", borderRadius: 7,
    padding: "9px 14px", fontSize: 20, letterSpacing: "0.25em",
    textAlign: "center", width: 120, outline: "none", color: "#0f172a",
  },
  successBox:  { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 7, color: "#15803d", fontSize: 13, padding: "10px 14px", marginBottom: 16 },
  errorBox:    { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, color: "#dc2626", fontSize: 13, padding: "10px 14px", marginBottom: 16 },
};
