/**
 * PushNotificationManager
 * -----------------------
 * Soft opt-in banner for browser push notifications.
 * - Appears once, after a 4-second delay, only if permission is "default"
 * - Dismissible — remembers via localStorage key `cai_push_dismissed`
 * - On "Enable" → requests permission and subscribes via service worker
 * - Sages-green brand colors throughout
 */

import { useEffect, useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const SAGE        = "#7a9068";
const SAGE_LIGHT  = "rgba(122,144,104,0.10)";
const SAGE_BORDER = "rgba(122,144,104,0.25)";
const DISMISSED_KEY = "cai_push_dismissed";

export function PushNotificationManager() {
  const { permission, isSubscribed, isLoading, isSupported, requestAndSubscribe } =
    usePushNotifications();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    if (permission !== "default") return;
    if (isSubscribed) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, [isSupported, permission, isSubscribed]);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  async function handleEnable() {
    await requestAndSubscribe();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Enable push notifications"
      style={{
        position:     "fixed",
        bottom:       24,
        right:        24,
        zIndex:       9999,
        background:   "#fff",
        border:       `1px solid ${SAGE_BORDER}`,
        borderRadius: 16,
        padding:      "18px 20px",
        maxWidth:     320,
        boxShadow:    "0 8px 32px rgba(0,0,0,0.10)",
        display:      "flex",
        flexDirection:"column",
        gap:          12,
        fontFamily:   "inherit",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 26 }}>🔔</div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 18, color: "#94a3b8", padding: 0, lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>
          Stay in the loop
        </div>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
          Get instant alerts for key events — new messages, bills due, and platform updates.
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleEnable}
          disabled={isLoading}
          style={{
            flex:          1,
            background:    SAGE,
            color:         "#fff",
            border:        "none",
            borderRadius:  10,
            padding:       "9px 14px",
            fontSize:      13,
            fontWeight:    700,
            cursor:        isLoading ? "default" : "pointer",
            opacity:       isLoading ? 0.7 : 1,
            fontFamily:    "inherit",
          }}
        >
          {isLoading ? "Setting up…" : "Enable"}
        </button>
        <button
          onClick={dismiss}
          style={{
            background:  SAGE_LIGHT,
            color:       SAGE,
            border:      `1px solid ${SAGE_BORDER}`,
            borderRadius:10,
            padding:     "9px 14px",
            fontSize:    13,
            fontWeight:  600,
            cursor:      "pointer",
            fontFamily:  "inherit",
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
