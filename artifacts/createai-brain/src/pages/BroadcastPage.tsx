import { useState, useEffect } from "react";

const SAGE = "#9CAF88";
const SAGE_DARK = "#7a9068";
const SAGE_BG = "#f4f7f2";

type Status = "idle" | "requesting" | "subscribed" | "denied" | "error" | "unsupported";

export default function BroadcastPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [liveCount, setLiveCount] = useState<{ sse: number; webhooks: number } | null>(null);
  const [lastBroadcast, setLastBroadcast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Fetch public status ────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/global-pulse/status")
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setLiveCount({ sse: d.liveSSEClients ?? 0, webhooks: d.registeredWebhooks ?? 0 });
          if (d.lastBroadcast?.fired_at) {
            setLastBroadcast(new Date(d.lastBroadcast.fired_at).toLocaleString());
          }
        }
      })
      .catch(() => {});
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }

  async function subscribePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    setStatus("requesting");

    try {
      // 1. Ask browser for permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }

      // 2. Get VAPID public key from our server
      const keyRes = await fetch("/api/push/vapid-key");
      if (!keyRes.ok) throw new Error("VAPID key unavailable");
      const { publicKey } = await keyRes.json() as { publicKey: string };

      // 3. Register service worker if not already registered
      const reg = await navigator.serviceWorker.register("/sw.js").catch(() =>
        navigator.serviceWorker.ready
      );
      const sw = "installing" in reg ? reg : reg;

      // 4. Subscribe to push
      const sub = await (sw as ServiceWorkerRegistration).pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = sub.toJSON() as {
        endpoint:  string;
        keys?: { p256dh?: string; auth?: string };
      };

      // 5. Register with our /api/push/subscribe (internal web push layer)
      await fetch("/api/push/subscribe", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys:     { p256dh: subJson.keys?.p256dh, auth: subJson.keys?.auth },
        }),
      });

      // 6. Also record in ExternalPulse as browser_hook for tracking
      await fetch("/api/external-pulse/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label:       "Browser push subscriber — " + (navigator.userAgent.slice(0, 40)),
          type:        "browser_hook",
          endpointUrl: subJson.endpoint,
        }),
      });

      setStatus("subscribed");
      setLiveCount(prev => prev ? { ...prev, webhooks: prev.webhooks + 1 } : { sse: 0, webhooks: 1 });
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus("error");
    }
  }

  // ── Computed values ────────────────────────────────────────────────────────
  const baseUrl = window.location.origin;
  const sseUrl  = `${baseUrl}/api/global-pulse/stream`;
  const rssUrl  = `${baseUrl}/api/global-pulse/feed.xml`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: SAGE_BG,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "32px 16px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: SAGE, margin: "0 auto 16px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28,
        }}>📡</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1a2e1a", margin: 0 }}>
          CreateAI Brain Broadcast Network
        </h1>
        <p style={{ color: "#4a6741", marginTop: 10, fontSize: 16, maxWidth: 480, margin: "10px auto 0" }}>
          Opt in to receive emergency broadcasts from CreateAI Brain directly to your device.
          You can unsubscribe at any time.
        </p>
      </div>

      {/* Status bar */}
      {liveCount && (
        <div style={{
          display: "flex", gap: 24, marginBottom: 40,
          background: "#fff", borderRadius: 12,
          padding: "12px 28px", boxShadow: "0 1px 4px rgba(0,0,0,.08)",
          flexWrap: "wrap", justifyContent: "center",
        }}>
          <Stat label="Live listeners" value={liveCount.sse} />
          <Stat label="Registered endpoints" value={liveCount.webhooks} />
          {lastBroadcast && <Stat label="Last broadcast" value={lastBroadcast} />}
        </div>
      )}

      {/* Main card */}
      <div style={{
        background: "#fff", borderRadius: 20,
        boxShadow: "0 4px 24px rgba(0,0,0,.08)",
        padding: "40px 36px", maxWidth: 520, width: "100%",
        textAlign: "center",
      }}>
        {status === "idle" && (
          <>
            <p style={{ color: "#374151", marginBottom: 28, lineHeight: 1.6 }}>
              Click the button below to subscribe your browser. You will receive a
              notification every time an emergency broadcast is fired.
              <br /><br />
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                We will never send you unsolicited messages. Broadcasts are sent only
                when you have explicitly subscribed.
              </span>
            </p>
            <button onClick={subscribePush} style={btnStyle(SAGE)}>
              📡 Join Broadcast Network
            </button>
          </>
        )}

        {status === "requesting" && (
          <div>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
            <p style={{ color: "#374151" }}>Requesting notification permission…</p>
          </div>
        )}

        {status === "subscribed" && (
          <div>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ color: SAGE_DARK, fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
              You're in the network
            </h2>
            <p style={{ color: "#4b5563", lineHeight: 1.6 }}>
              Your browser is now subscribed. Emergency broadcasts will appear as
              push notifications on this device.
            </p>
          </div>
        )}

        {status === "denied" && (
          <div>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔕</div>
            <h2 style={{ color: "#92400e", fontSize: 20, fontWeight: 600 }}>
              Notifications blocked
            </h2>
            <p style={{ color: "#78350f", lineHeight: 1.6, fontSize: 14 }}>
              Your browser blocked the permission request. Enable notifications
              for this site in your browser settings, then refresh.
            </p>
          </div>
        )}

        {status === "unsupported" && (
          <div>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <p style={{ color: "#78350f" }}>
              Your browser does not support push notifications. Use the RSS feed
              or live stream links below.
            </p>
          </div>
        )}

        {status === "error" && (
          <div>
            <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
            <p style={{ color: "#991b1b", fontSize: 14 }}>Subscription failed: {errorMsg}</p>
            <button onClick={() => setStatus("idle")} style={{ ...btnStyle("#6b7280"), marginTop: 12 }}>
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Alternative channels */}
      <div style={{
        marginTop: 36, maxWidth: 520, width: "100%",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        <p style={{ textAlign: "center", color: "#6b7280", fontSize: 13, margin: "0 0 4px" }}>
          More ways to subscribe
        </p>

        <Channel
          icon="📻"
          label="Live SSE stream"
          description="Connect any app or terminal to receive broadcasts in real-time"
          url={sseUrl}
          hint="curl -N"
        />
        <Channel
          icon="📰"
          label="RSS feed"
          description="Subscribe with any feed reader to get broadcasts as articles"
          url={rssUrl}
          hint="feed reader"
        />
        <Channel
          icon="🔗"
          label="Webhook"
          description="Register your own HTTPS endpoint to receive POST requests"
          url={null}
          onWebhook={(ep) => {
            if (!ep) return;
            fetch("/api/external-pulse/subscribe", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ label: "User webhook", type: "webhook", endpointUrl: ep }),
            }).then(r => r.json()).then(d => {
              if (d.ok) alert("Webhook registered ✅");
              else alert("Error: " + (d.error ?? "unknown"));
            }).catch(() => alert("Network error"));
          }}
          hint="your server"
        />
      </div>

      <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 32, textAlign: "center" }}>
        CreateAI Brain · No government systems · No carriers · Opt-in only
      </p>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: SAGE_DARK }}>{value}</div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Channel({
  icon, label, description, url, hint, onWebhook,
}: {
  icon: string;
  label: string;
  description: string;
  url: string | null;
  hint: string;
  onWebhook?: (ep: string) => void;
}) {
  const [webhookInput, setWebhookInput] = useState("");
  const [showInput, setShowInput] = useState(false);

  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "14px 18px",
      boxShadow: "0 1px 4px rgba(0,0,0,.06)",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{label}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{description}</div>
        </div>
        {url && (
          <button
            onClick={() => { navigator.clipboard?.writeText(url); }}
            style={btnStyle(SAGE, "small")}
            title="Copy URL"
          >
            Copy
          </button>
        )}
        {onWebhook && !showInput && (
          <button onClick={() => setShowInput(true)} style={btnStyle(SAGE, "small")}>
            Register
          </button>
        )}
      </div>
      {url && (
        <code style={{
          fontSize: 11, background: "#f3f4f6", borderRadius: 6,
          padding: "4px 8px", color: "#374151", wordBreak: "break-all",
        }}>
          {hint && <span style={{ color: "#9ca3af" }}>{hint}  </span>}
          {url}
        </code>
      )}
      {onWebhook && showInput && (
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <input
            value={webhookInput}
            onChange={e => setWebhookInput(e.target.value)}
            placeholder="https://your-server.com/hook"
            style={{
              flex: 1, padding: "6px 10px", borderRadius: 8,
              border: "1px solid #d1d5db", fontSize: 13,
            }}
          />
          <button
            onClick={() => { onWebhook(webhookInput); setShowInput(false); setWebhookInput(""); }}
            style={btnStyle(SAGE, "small")}
          >
            Save
          </button>
          <button
            onClick={() => { setShowInput(false); setWebhookInput(""); }}
            style={btnStyle("#9ca3af", "small")}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function btnStyle(bg: string, size: "normal" | "small" = "normal") {
  return {
    background:   bg,
    color:        "#fff",
    border:       "none",
    borderRadius: size === "small" ? 8 : 12,
    padding:      size === "small" ? "6px 14px" : "14px 32px",
    fontSize:     size === "small" ? 13 : 16,
    fontWeight:   600,
    cursor:       "pointer",
    transition:   "opacity .15s",
    whiteSpace:   "nowrap" as const,
  };
}
