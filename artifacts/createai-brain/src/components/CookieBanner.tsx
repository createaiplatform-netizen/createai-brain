import { useState, useEffect } from "react";

const STORAGE_KEY = "cai_cookie_consent";
const SAGE        = "#7a9068";

type ConsentState = "accepted" | "declined" | null;

export function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [visible, setVisible]  = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentState | null;
    if (!stored) {
      // Small delay so banner doesn't flash on every hard load
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
    setConsent(stored);
    return undefined;
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setConsent("accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setConsent("declined");
    setVisible(false);
  };

  if (!visible || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      style={{
        position:        "fixed",
        bottom:          20,
        left:            "50%",
        transform:       "translateX(-50%)",
        zIndex:          99999,
        width:           "calc(100% - 32px)",
        maxWidth:        560,
        background:      "#ffffff",
        border:          `1px solid ${SAGE}30`,
        borderRadius:    16,
        boxShadow:       "0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
        padding:         "20px 24px",
        display:         "flex",
        flexDirection:   "column",
        gap:             14,
        fontFamily:      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        animation:       "cai-banner-in 0.3s ease",
      }}
    >
      <style>{`
        @keyframes cai-banner-in {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: `${SAGE}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}
        >
          🍪
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a1916" }}>
            We use cookies
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b6660", lineHeight: 1.6 }}>
            CreateAI Brain uses essential cookies to keep you signed in and remember your preferences.
            We also use analytics cookies to improve the platform. You can decline non-essential cookies
            at any time.{" "}
            <a
              href="/privacy"
              style={{ color: SAGE, textDecoration: "underline", fontWeight: 600 }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button
          onClick={handleDecline}
          style={{
            padding:      "9px 18px",
            borderRadius: 10,
            border:       "1px solid rgba(0,0,0,0.10)",
            background:   "transparent",
            fontSize:     13,
            fontWeight:   600,
            color:        "#6b6660",
            cursor:       "pointer",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          Decline optional
        </button>
        <button
          onClick={handleAccept}
          style={{
            padding:      "9px 22px",
            borderRadius: 10,
            border:       "none",
            background:   SAGE,
            fontSize:     13,
            fontWeight:   700,
            color:        "#ffffff",
            cursor:       "pointer",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#5d7a52"; }}
          onMouseLeave={e => { e.currentTarget.style.background = SAGE; }}
        >
          Accept all
        </button>
      </div>

      {/* GDPR note */}
      <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", textAlign: "center" }}>
        Compliant with GDPR · CCPA · ePrivacy Directive · Lakeside Trinity LLC
      </p>
    </div>
  );
}
