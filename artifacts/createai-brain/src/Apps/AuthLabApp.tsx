import { useState, useEffect } from "react";

const API = "/api";

export default function AuthLabApp() {
  const [tab, setTab] = useState<"overview"|"magiclink"|"devices"|"sessions">("overview");
  const [status, setStatus] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [deviceLabel, setDeviceLabel] = useState("My Desktop");
  const [devFingerprint] = useState(() => btoa(navigator.userAgent + screen.width + screen.height).slice(0, 32));
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch(`${API}/auth/magic-link/status`, { credentials: "include" }).then(r => r.json()).then(d => { if (d.ok) setStatus(d); });
  }, []);

  function loadDevices() {
    fetch(`${API}/auth/magic-link/devices?email=${encodeURIComponent(email)}`, { credentials: "include" })
      .then(r => r.json()).then(d => { if (d.ok) setDevices(d.devices); });
  }

  async function sendMagicLink() {
    if (!email.includes("@")) { setMsg({ text: "Enter a valid email address.", ok: false }); return; }
    setSending(true); setSent(false); setDevLink(null); setMsg(null);
    try {
      const r = await fetch(`${API}/auth/magic-link/send`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, deviceFingerprint: devFingerprint, deviceLabel })
      });
      const d = await r.json();
      if (d.ok) {
        setSent(true);
        setDevLink(d.devLink ?? null);
        setMsg({ text: d.message, ok: true });
      } else {
        setMsg({ text: d.error ?? "Failed to send magic link.", ok: false });
      }
    } catch { setMsg({ text: "Network error.", ok: false }); } finally { setSending(false); }
  }

  async function registerDevice() {
    if (!email.includes("@")) { setMsg({ text: "Enter your email first.", ok: false }); return; }
    const r = await fetch(`${API}/auth/magic-link/register`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fingerprint: devFingerprint, label: deviceLabel })
    });
    const d = await r.json();
    setMsg({ text: d.ok ? `Device '${deviceLabel}' registered as trusted.` : d.error, ok: d.ok });
    if (d.ok) loadDevices();
  }

  async function revokeDevice(deviceId: string) {
    const r = await fetch(`${API}/auth/magic-link/device/${deviceId}`, { method: "DELETE", credentials: "include" });
    const d = await r.json();
    setMsg({ text: d.ok ? "Device revoked." : d.error, ok: d.ok });
    if (d.ok) setDevices(prev => prev.filter(dev => dev.id !== deviceId));
  }

  const T = {
    tab: "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
    active: "bg-indigo-600 text-white",
    inactive: "text-slate-400 hover:text-white hover:bg-slate-800",
    card: "bg-slate-900 border border-slate-800 rounded-xl p-5",
    label: "text-xs text-slate-500 uppercase tracking-wider mb-1",
    input: "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none",
    btn: "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50",
    h2: "text-lg font-bold text-white mb-4",
  };

  const TABS = [
    { id: "overview", label: "🔐 Overview" },
    { id: "magiclink", label: "✉️ Magic Link" },
    { id: "devices", label: "📱 Trusted Devices" },
    { id: "sessions", label: "🔑 Auth Methods" },
  ] as const;

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Authentication Lab</h1>
            <p className="text-xs text-slate-500 mt-0.5">Advanced auth methods — passwordless, device fingerprinting, trusted sessions</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded border border-green-500/30">ACTIVE</span>
          </div>
        </div>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`${T.tab} ${tab === t.id ? T.active : T.inactive}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {msg && (
          <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${msg.ok ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
            {msg.text}
          </div>
        )}

        {tab === "overview" && (
          <div className="space-y-5">
            <div className={T.card}>
              <div className={T.h2}>Authentication Architecture</div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { method: "Replit OIDC + PKCE", status: "active", type: "Primary Auth", desc: "OAuth 2.0 with PKCE code challenge. Zero password stored. Replit identity provider.", icon: "🔵" },
                  { method: "Email Magic Link", status: "active", type: "Passwordless", desc: "One-time SHA-256 hashed token delivered via Resend. 15-minute TTL. Single use.", icon: "✉️" },
                  { method: "Owner Password Auth", status: "active", type: "Admin Access", desc: "Bcrypt-hashed passphrase gate for platform owner (Sara Stadler). CORE_OWNER_PASS env.", icon: "🔑" },
                  { method: "OTP (One-Time Password)", status: "active", type: "Two-Factor", desc: "Time-bound numeric codes for mobile-first verification flows.", icon: "📱" },
                  { method: "Trusted Device Registry", status: "active", type: "Device Auth", desc: "Browser fingerprint-based device registration. Persistent trusted session on known devices.", icon: "💻" },
                  { method: "SSO (Single Sign-On)", status: "active", type: "Enterprise", desc: "SAML / OAuth SSO bridge for enterprise team authentication.", icon: "🏢" },
                ].map((m, i) => (
                  <div key={i} className="bg-slate-800 rounded-lg p-4 flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">{m.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm">{m.method}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${m.status === "active" ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-400"}`}>{m.status.toUpperCase()}</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-400">{m.type}</span>
                      </div>
                      <div className="text-xs text-slate-400">{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {status && (
              <div className={T.card}>
                <div className={T.h2}>Magic Link Status</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className={T.label}>Email Delivery</div>
                    <div className={`text-sm font-bold ${status.emailDelivery === "active" ? "text-green-400" : "text-amber-400"}`}>{status.emailDelivery}</div>
                  </div>
                  <div>
                    <div className={T.label}>Token TTL</div>
                    <div className="text-sm font-bold text-white">{status.tokenTtlMinutes} minutes</div>
                  </div>
                  <div>
                    <div className={T.label}>Rate Limit</div>
                    <div className="text-sm font-bold text-white">{status.rateLimitPerHour}/hour</div>
                  </div>
                  <div>
                    <div className={T.label}>Active Tokens</div>
                    <div className="text-sm font-bold text-indigo-400">{status.activeTokens}</div>
                  </div>
                  <div>
                    <div className={T.label}>Trusted Devices</div>
                    <div className="text-sm font-bold text-purple-400">{status.trustedDevices}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className={T.label}>Security Features</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {status.features?.map((f: string, i: number) => (
                      <span key={i} className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "magiclink" && (
          <div className="space-y-5">
            <div className={T.card}>
              <div className={T.h2}>Send Magic Link</div>
              <p className="text-xs text-slate-500 mb-5">Passwordless authentication via one-time email link. Token expires in 15 minutes. SHA-256 hashed. Single use.</p>
              <div className="space-y-4">
                <div>
                  <div className={T.label}>Email Address</div>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                    placeholder="user@example.com"
                    className={`${T.input} mt-1`} />
                </div>
                <div>
                  <div className={T.label}>Device Label</div>
                  <input value={deviceLabel} onChange={e => setDeviceLabel(e.target.value)}
                    placeholder="e.g. My Work Desktop, iPhone 15"
                    className={`${T.input} mt-1`} />
                </div>
                <div>
                  <div className={T.label}>Device Fingerprint (auto-generated)</div>
                  <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-500 font-mono mt-1 break-all">{devFingerprint}</div>
                </div>
                <button onClick={sendMagicLink} disabled={sending || !email}
                  className={`${T.btn} w-full py-3`}>
                  {sending ? "Sending…" : "✉️ Send Magic Link"}
                </button>
              </div>
            </div>

            {sent && (
              <div className={T.card}>
                <div className="font-bold text-green-400 mb-3">✅ Magic Link Sent</div>
                <p className="text-sm text-slate-300 mb-4">A one-time sign-in link has been sent to <strong>{email}</strong>. It expires in 15 minutes.</p>
                {devLink && (
                  <div>
                    <div className={T.label}>Development Link (non-production only)</div>
                    <div className="bg-slate-800 rounded p-3 text-xs font-mono text-indigo-400 break-all mt-1">{devLink}</div>
                  </div>
                )}
              </div>
            )}

            <div className={T.card}>
              <div className={T.h2}>How It Works</div>
              <div className="space-y-3">
                {[
                  ["1. Request", "User enters email. System generates a cryptographically random 256-bit token."],
                  ["2. Hash", "Token is SHA-256 hashed before storage. Raw token is never persisted."],
                  ["3. Deliver", "Magic link with raw token sent via Resend to user's email. 15-minute TTL."],
                  ["4. Verify", "User clicks link → raw token hashed → compared to stored hash → session established."],
                  ["5. Invalidate", "Token marked as used immediately. Cannot be replayed."],
                  ["6. Session", "Standard session cookie established. Trusted device can be registered for future logins."],
                ].map(([step, desc], i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-xs font-black text-indigo-400 w-20 flex-shrink-0 mt-0.5">{step}</span>
                    <span className="text-xs text-slate-400">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "devices" && (
          <div className="space-y-5">
            <div className={T.card}>
              <div className={T.h2}>Register Trusted Device</div>
              <div className="space-y-4">
                <div>
                  <div className={T.label}>Your Email</div>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                    placeholder="your@email.com" className={`${T.input} mt-1`} />
                </div>
                <div>
                  <div className={T.label}>Device Name</div>
                  <input value={deviceLabel} onChange={e => setDeviceLabel(e.target.value)}
                    placeholder="e.g. My MacBook, Work PC" className={`${T.input} mt-1`} />
                </div>
                <div className="flex gap-3">
                  <button onClick={registerDevice} className={`${T.btn} flex-1`}>
                    💻 Register This Device
                  </button>
                  <button onClick={loadDevices} disabled={!email}
                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-300 transition-colors disabled:opacity-50">
                    🔄 Load My Devices
                  </button>
                </div>
              </div>
            </div>
            {devices.length > 0 && (
              <div className={T.card}>
                <div className={T.h2}>Trusted Devices ({devices.length})</div>
                <div className="space-y-3">
                  {devices.map(d => (
                    <div key={d.id} className="bg-slate-800 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white text-sm">{d.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Registered: {new Date(d.registeredAt).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-600 mt-0.5 truncate max-w-48">{d.userAgent}</div>
                      </div>
                      <button onClick={() => revokeDevice(d.id)}
                        className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-xs font-bold transition-colors">
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "sessions" && (
          <div className="space-y-5">
            <div className={T.card}>
              <div className={T.h2}>Authentication Method Comparison</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {["Method", "Type", "Password Required", "Email Required", "2FA Support", "Enterprise Ready"].map(h => (
                        <th key={h} className="text-left text-slate-500 uppercase tracking-wider pb-3 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {[
                      ["Replit OIDC", "OAuth 2.0 / PKCE", "❌ No", "✅ Yes", "✅ Yes", "✅ Yes"],
                      ["Magic Link", "Passwordless", "❌ No", "✅ Yes", "🔶 Via device", "✅ Yes"],
                      ["Owner Password", "Passphrase", "✅ Yes", "❌ No", "❌ No", "🔶 Admin only"],
                      ["OTP Code", "Token", "❌ No", "✅ Yes", "✅ Yes", "✅ Yes"],
                      ["Trusted Device", "Fingerprint", "❌ No", "✅ Yes (setup)", "✅ Built-in", "✅ Yes"],
                      ["SSO / SAML", "Federation", "❌ No", "✅ Yes", "✅ Via IdP", "✅ Yes"],
                    ].map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} className={`py-3 pr-4 ${j === 0 ? "font-bold text-white" : "text-slate-400"}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={T.card}>
              <div className={T.h2}>Security Posture</div>
              <div className="space-y-2">
                {[
                  { label: "Password storage", value: "None — zero passwords stored in any database", good: true },
                  { label: "Token hashing", value: "SHA-256 for magic link tokens. bcrypt for owner passphrase.", good: true },
                  { label: "Session management", value: "Server-side encrypted sessions via cookie-session middleware", good: true },
                  { label: "Rate limiting", value: "5 magic link requests per email per hour", good: true },
                  { label: "Token TTL", value: "15 minutes for magic links, single-use invalidation", good: true },
                  { label: "Device trust", value: "Browser fingerprint registration for low-friction repeat auth", good: true },
                  { label: "CORS", value: "Strict origin policy — no cross-origin credential leakage", good: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-800 rounded-lg p-3">
                    <span className={item.good ? "text-green-400" : "text-red-400"}>✓</span>
                    <div>
                      <span className="text-sm font-semibold text-white">{item.label}: </span>
                      <span className="text-sm text-slate-400">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
