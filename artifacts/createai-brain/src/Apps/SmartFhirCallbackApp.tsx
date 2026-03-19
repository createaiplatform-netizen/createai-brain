/**
 * SMART-on-FHIR Sandbox — OAuth Callback Handler
 *
 * This page is the redirect target after the user authorizes on the SMART Health IT
 * public sandbox (https://launch.smarthealthit.org).
 *
 * It reads the `code` + `state` params from the URL, calls the backend to exchange
 * the authorization code for an access token, stores a connectionKey in sessionStorage,
 * and then navigates to the Connected confirmation page.
 *
 * This is test data only — no real PHI. Public SMART-on-FHIR sandbox.
 * Architecture is identical to what would be used for Epic/MyChart production.
 */

import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function SmartFhirCallbackApp() {
  const [, navigate] = useLocation();
  const [error, setError]     = useState<string | null>(null);
  const [status, setStatus]   = useState<"exchanging" | "error">("exchanging");

  useEffect(() => {
    const params      = new URLSearchParams(window.location.search);
    const code        = params.get("code");
    const state       = params.get("state");
    const errorParam  = params.get("error");
    const errorDesc   = params.get("error_description");

    // The SMART sandbox may return an error instead of a code
    if (errorParam) {
      setError(errorDesc ?? errorParam);
      setStatus("error");
      return;
    }

    if (!code || !state) {
      setError("Missing authorization code or state. Please try connecting again.");
      setStatus("error");
      return;
    }

    // Build the redirect_uri that was used in the original /auth-url request.
    // It must EXACTLY match what was sent so the token exchange succeeds.
    const base        = import.meta.env.BASE_URL.replace(/\/$/, "");
    const redirectUri = `${window.location.origin}${base}/connectors/SMART_FHIR_SANDBOX/callback`;

    fetch(
      `/api/integrations/smart-fhir-sandbox/callback?` +
        new URLSearchParams({ code, state, redirect_uri: redirectUri }).toString(),
      { credentials: "include" }
    )
      .then(r => r.json())
      .then((data: { ok?: boolean; connectionKey?: string; error?: string }) => {
        if (data.ok && data.connectionKey) {
          // Store the connection key in sessionStorage (never stores the raw token)
          sessionStorage.setItem("smartFhirConnectionKey", data.connectionKey);
          navigate("/connectors/SMART_FHIR_SANDBOX/connected");
        } else {
          setError(data.error ?? "Token exchange failed. Please try again.");
          setStatus("error");
        }
      })
      .catch(() => {
        setError("Network error during token exchange. Please try again.");
        setStatus("error");
      });
  }, [navigate]);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div style={{
      minHeight:       "100vh",
      background:      "#f8fafc",
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "center",
      fontFamily:      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background:    "#ffffff",
        border:        "1px solid rgba(0,0,0,0.08)",
        borderRadius:  20,
        padding:       "40px 48px",
        maxWidth:      460,
        width:         "100%",
        textAlign:     "center",
        boxShadow:     "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        {status === "exchanging" ? (
          <>
            {/* Spinner */}
            <div style={{
              width:        40,
              height:       40,
              borderRadius: "50%",
              border:       "3px solid rgba(99,102,241,0.15)",
              borderTop:    "3px solid #6366f1",
              animation:    "spin 0.8s linear infinite",
              margin:       "0 auto 20px",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
              Completing authorization…
            </div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
              Exchanging your authorization code with the SMART Health IT sandbox.
            </div>

            <div style={{
              marginTop:     20,
              background:    "rgba(99,102,241,0.06)",
              border:        "1px solid rgba(99,102,241,0.15)",
              borderRadius:  10,
              padding:       "10px 14px",
              fontSize:      11,
              color:         "#6366f1",
              lineHeight:    1.5,
            }}>
              Public SMART-on-FHIR Sandbox · Test data only · No real PHI
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
              Authorization failed
            </div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
              {error}
            </div>
            <a
              href={`${base}/`}
              style={{
                display:       "inline-block",
                background:    "#6366f1",
                color:         "#fff",
                padding:       "10px 24px",
                borderRadius:  10,
                fontSize:      13,
                fontWeight:    600,
                textDecoration:"none",
              }}
            >
              Back to CreateAI Brain
            </a>
          </>
        )}
      </div>
    </div>
  );
}
