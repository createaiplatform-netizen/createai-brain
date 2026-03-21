/**
 * NpaGatewayPage.tsx
 * ──────────────────
 * Handles incoming web+npa:// protocol links.
 *
 * When a user has registered the platform as the web+npa: handler via
 * registerProtocolHandler(), clicking any link like:
 *   <a href="web+npa://CreateAIDigital/dashboard">
 * causes the browser to navigate to:
 *   https://[platform-origin]/npa-gateway?q=web+npa://CreateAIDigital/dashboard
 *
 * This page parses the handle and optional path from ?q=, then:
 *   - If the path maps to an internal app, fires the NEXUS intent
 *   - Otherwise navigates to the root OS
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function NpaGatewayPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState("Resolving handle…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") ?? "";

    // Strip scheme: web+npa://Handle/path → /path
    const cleaned = q.replace(/^web\+npa:\/\/[^/]*/i, "");
    const path = cleaned || "/";

    setStatus(`Routing to ${path || "/"}…`);

    const timer = setTimeout(() => {
      navigate(path);
    }, 600);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        background: "#020617",
        color: "#94a3b8",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        ⚡
      </div>
      <p style={{ fontSize: "0.85rem" }}>{status}</p>
    </div>
  );
}
