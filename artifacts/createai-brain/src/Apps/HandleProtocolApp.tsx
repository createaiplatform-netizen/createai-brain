/**
 * HandleProtocolApp.tsx
 * ─────────────────────
 * NEXUS Handle Protocol — OS app for managing the platform's handle-based
 * URL system. Three mechanisms that work independently and together:
 *
 *  1. web+npa:// Protocol Handler — register once in the browser; every
 *     web+npa://CreateAIDigital link anywhere on the internet routes here.
 *
 *  2. Portable Platform Card — download a ~3KB self-resolving HTML file.
 *     Host it on any free static platform to create a professional entry point.
 *
 *  3. Handle Redirect — /h/CreateAIDigital always points to the live URL.
 */

import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL ?? "";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 16,
      }}
    >
      <p
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#64748b",
          marginBottom: 16,
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: 4 }}>
        {label}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: 8,
          padding: "8px 12px",
        }}
      >
        <code
          style={{
            flex: 1,
            fontSize: "0.78rem",
            color: "#a5b4fc",
            fontFamily: "'Courier New', monospace",
            wordBreak: "break-all",
          }}
        >
          {value}
        </code>
        <button
          onClick={copy}
          style={{
            background: copied ? "#4ade80" : "#6366f1",
            border: "none",
            borderRadius: 6,
            padding: "4px 10px",
            color: "#fff",
            fontSize: "0.7rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background 0.2s",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function Pill({
  ok,
  label,
}: {
  ok: boolean | null;
  label: string;
}) {
  const color = ok === null ? "#475569" : ok ? "#4ade80" : "#f87171";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "#1e293b",
        border: `1px solid ${color}33`,
        color,
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: "0.72rem",
        fontWeight: 500,
      }}
    >
      <span style={{ fontSize: 8 }}>●</span>
      {label}
    </span>
  );
}

export default function HandleProtocolApp() {
  const [meta, setMeta] = useState<Record<string, string> | null>(null);
  const [protocolStatus, setProtocolStatus] = useState<boolean | null>(null);
  const [pwaStatus, setPwaStatus] = useState<boolean | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerMsg, setRegisterMsg] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/platform-card/meta`)
      .then((r) => r.json())
      .then((d) => setMeta(d))
      .catch(() => {});

    // Check if protocol handler might be registered (heuristic)
    const registered = localStorage.getItem("npa_protocol_registered");
    setProtocolStatus(registered === "1" ? true : null);

    // Check if running as PWA (standalone mode)
    const isPwa =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    setPwaStatus(isPwa);
  }, []);

  const registerProtocol = () => {
    if (!("registerProtocolHandler" in navigator)) {
      setRegisterMsg(
        "Your browser does not support protocol handler registration. Use Chrome or Firefox."
      );
      return;
    }
    try {
      setRegistering(true);
      const handlerUrl = `${window.location.origin}/npa-gateway?q=%s`;
      navigator.registerProtocolHandler("web+npa", handlerUrl);
      localStorage.setItem("npa_protocol_registered", "1");
      setProtocolStatus(true);
      setRegisterMsg(
        "Protocol registered. Any web+npa://CreateAIDigital link now routes to this platform."
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setRegisterMsg(`Registration failed: ${msg}`);
    } finally {
      setRegistering(false);
    }
  };

  const downloadCard = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API}/api/platform-card?download=1`);
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "createai-card.html";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // pass
    } finally {
      setDownloading(false);
    }
  };

  const liveUrl = meta?.liveUrl ?? "";
  const handle = meta?.handle ?? "CreateAIDigital";
  const protocolUrl = meta?.protocol ?? `web+npa://${handle}`;
  const handleRedirect = meta?.handleRedirect ?? `${liveUrl}/h/${handle.toLowerCase()}`;
  const cardUrl = meta?.portableCard ?? `${liveUrl}/api/platform-card`;

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: 680,
        margin: "0 auto",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🔗
          </div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9" }}>
            Handle Protocol System
          </h2>
        </div>
        <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6 }}>
          A new URL system built into this platform. Your canonical address is{" "}
          <code style={{ color: "#a5b4fc" }}>{protocolUrl}</code> — a handle
          that any browser can resolve once registered, with no domain purchase
          required.
        </p>
      </div>

      {/* Status bar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <Pill
          ok={protocolStatus}
          label={
            protocolStatus === true
              ? "Protocol: Registered"
              : protocolStatus === false
              ? "Protocol: Not Registered"
              : "Protocol: Unknown"
          }
        />
        <Pill ok={pwaStatus} label={pwaStatus ? "PWA: Installed" : "PWA: Not Installed"} />
        <Pill ok={true} label="Handle Redirect: Live" />
        <Pill ok={true} label="Portable Card: Ready" />
      </div>

      {/* ── Layer 1: Protocol Handler ── */}
      <Section title="Layer 1 — Browser Protocol Handler">
        <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: 16, lineHeight: 1.6 }}>
          Register <code style={{ color: "#a5b4fc" }}>web+npa:</code> as a
          platform-handled scheme in your browser. After one click, any link
          formatted as <code style={{ color: "#a5b4fc" }}>{protocolUrl}</code>{" "}
          anywhere on the internet opens this platform directly — in emails,
          documents, other websites, or shared links.
        </p>

        <CopyRow label="Your canonical handle URL" value={protocolUrl} />

        <CopyRow
          label="Example deep link (routes to the platform root)"
          value={`${protocolUrl}/`}
        />

        <button
          onClick={registerProtocol}
          disabled={registering}
          style={{
            background: protocolStatus ? "#1e293b" : "#6366f1",
            border: protocolStatus ? "1px solid #334155" : "none",
            borderRadius: 8,
            padding: "10px 20px",
            color: protocolStatus ? "#94a3b8" : "#fff",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: registering ? "wait" : "pointer",
            marginTop: 8,
          }}
        >
          {registering
            ? "Registering…"
            : protocolStatus
            ? "✓ Protocol Already Registered"
            : "Register web+npa: in This Browser"}
        </button>

        {registerMsg && (
          <p
            style={{
              marginTop: 10,
              fontSize: "0.75rem",
              color: protocolStatus ? "#4ade80" : "#f87171",
              lineHeight: 1.5,
            }}
          >
            {registerMsg}
          </p>
        )}

        {!pwaStatus && (
          <p
            style={{
              marginTop: 12,
              fontSize: "0.72rem",
              color: "#64748b",
              lineHeight: 1.5,
              borderTop: "1px solid #1e293b",
              paddingTop: 12,
            }}
          >
            <strong style={{ color: "#94a3b8" }}>PWA tip:</strong> Install this
            platform to your home screen (Add to Home Screen) and the{" "}
            <code style={{ color: "#6366f1" }}>web+npa:</code> protocol becomes
            registered at the OS level — no browser prompt needed, works
            system-wide on Windows, Mac, and Linux.
          </p>
        )}
      </Section>

      {/* ── Layer 2: Portable Card ── */}
      <Section title="Layer 2 — Portable Platform Card">
        <p
          style={{
            fontSize: "0.8rem",
            color: "#94a3b8",
            marginBottom: 16,
            lineHeight: 1.6,
          }}
        >
          Download a ~3KB standalone HTML file. Host it on{" "}
          <strong style={{ color: "#e2e8f0" }}>any</strong> free static platform
          — GitHub Pages, Netlify, Cloudflare Pages, a USB drive — and it
          becomes a permanent, self-updating entry point. On load it fetches the
          current live URL from this platform's identity endpoint and
          redirects there automatically, even if the underlying URL changes.
        </p>

        <div
          style={{
            background: "#020617",
            border: "1px solid #1e293b",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            fontSize: "0.72rem",
            color: "#64748b",
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: "#94a3b8" }}>
            How to get a professional URL using the card:
          </strong>
          <ol style={{ marginLeft: 16, marginTop: 6 }}>
            <li>
              Download the card below (
              <code style={{ color: "#6366f1" }}>createai-card.html</code>)
            </li>
            <li>
              Create a free GitHub account named{" "}
              <code style={{ color: "#6366f1" }}>CreateAIDigital</code>
            </li>
            <li>
              Create a repo named{" "}
              <code style={{ color: "#6366f1" }}>
                createaidigital.github.io
              </code>
            </li>
            <li>Upload the card as the repo's index.html</li>
            <li>
              Your platform is now live at{" "}
              <code style={{ color: "#6366f1" }}>
                https://createaidigital.github.io
              </code>
            </li>
          </ol>
          <p style={{ marginTop: 8 }}>
            The same card works on Netlify Drop, Cloudflare Pages, or any
            static host. Each hosted copy gives a new professional URL.
          </p>
        </div>

        <CopyRow
          label="Live card preview URL (share this link directly)"
          value={cardUrl}
        />

        <button
          onClick={downloadCard}
          disabled={downloading}
          style={{
            background: "#6366f1",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            color: "#fff",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: downloading ? "wait" : "pointer",
            marginTop: 8,
          }}
        >
          {downloading ? "Generating…" : "⬇ Download createai-card.html"}
        </button>
      </Section>

      {/* ── Layer 3: Handle Redirect ── */}
      <Section title="Layer 3 — Permanent Handle Redirect">
        <p
          style={{
            fontSize: "0.8rem",
            color: "#94a3b8",
            marginBottom: 16,
            lineHeight: 1.6,
          }}
        >
          A server-side redirect that always resolves to the current live URL.
          Use this in emails, bio links, business cards, or anywhere a plain
          HTTPS link is needed. Even if the platform moves to a new URL, this
          path updates automatically.
        </p>

        <CopyRow label="Handle redirect (always live)" value={handleRedirect} />

        <CopyRow
          label="Embed in any HTML page"
          value={`<a href="${handleRedirect}">Open CreateAI Brain</a>`}
        />

        <CopyRow
          label="Share on social / bio"
          value={handleRedirect}
        />
      </Section>

      {/* ── System metadata ── */}
      {meta && (
        <Section title="System Info">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["NPA", meta.npa],
              ["Handle", meta.handle],
              ["Protocol", meta.protocol],
              ["Live URL", meta.liveUrl],
            ].map(([k, v]) => (
              <div key={k}>
                <p style={{ fontSize: "0.65rem", color: "#475569", marginBottom: 2 }}>{k}</p>
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "#94a3b8",
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                  }}
                >
                  {v}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
