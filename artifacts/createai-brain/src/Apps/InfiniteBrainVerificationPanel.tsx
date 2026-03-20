/**
 * InfiniteBrainVerificationPanel
 * Runs all 6 verification steps automatically, displays results live,
 * and fires family notifications when ALL steps PASS.
 *
 * Integrates with BrainAutoExecutor + CoreEngine via POST /api/brain/verify.
 * The backend wraps each step in executeInfinitely() with CoreEngine validation.
 */

import React, { useState } from "react";
import {
  fetchVerificationReport,
  notifyFamilyEvent,
  type VerificationReport,
  type VerificationStep,
} from "@/services/systemServices";

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  accent:  "#6366f1",
  ok:      "#22c55e",
  okBg:    "#dcfce7",
  okText:  "#166534",
  failBg:  "#fee2e2",
  failText:"#991b1b",
  surface: "#ffffff",
  border:  "rgba(15,23,42,0.07)",
  shadow:  "0 2px 8px rgba(15,23,42,0.07)",
  text1:   "#0f172a",
  text2:   "#475569",
  text3:   "#94a3b8",
  font:    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
  radius:  10,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepRow({ step }: { step: VerificationStep }) {
  const pass = step.status === "PASS";
  return (
    <div style={{
      display:         "flex",
      justifyContent:  "space-between",
      alignItems:      "center",
      padding:         "10px 14px",
      background:      pass ? T.okBg : T.failBg,
      borderRadius:    8,
      marginBottom:    6,
      transition:      "background 0.2s",
      gap:             12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 650, color: T.text1, fontFamily: T.font }}>
          {step.step}. {step.label}
        </span>
        {step.detail && (
          <span style={{ fontSize: 11, color: T.text2, fontFamily: T.font, opacity: 0.85 }}>
            — {step.detail}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{
          fontSize:   11, fontWeight: 700, letterSpacing: "0.3px",
          color:      pass ? T.okText : T.failText,
          fontFamily: T.font,
        }}>
          {pass ? "PASS ✅" : "FAIL ❌"}
        </span>
        <span style={{ fontSize: 11, color: T.text3, fontFamily: T.font }}>
          {step.durationMs}ms
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InfiniteBrainVerificationPanel() {
  const [loading, setLoading]   = useState(false);
  const [report, setReport]     = useState<VerificationReport | null>(null);
  const [allPassed, setAllPassed] = useState(false);
  const [hov, setHov]           = useState(false);

  const runVerification = async () => {
    setLoading(true);
    setReport(null);
    setAllPassed(false);

    try {
      // fetchVerificationReport() calls POST /api/brain/verify,
      // which runs each step inside executeInfinitely() + CoreEngine on the backend.
      const fullReport = await fetchVerificationReport();
      setReport(fullReport);

      const passed = fullReport.steps.every(s => s.status === "PASS");
      setAllPassed(passed);

      if (passed) {
        await notifyFamilyEvent(
          `💎 ALL SYSTEMS 100% LIVE\nRun ID: ${fullReport.runId}\nAll 6 steps passed in ${fullReport.totalMs}ms.`,
        );
      }
    } catch (err) {
      console.error("[VerificationPanel]", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background:   T.surface,
      padding:      "20px",
      borderRadius: T.radius,
      boxShadow:    T.shadow,
      border:       `1px solid ${T.border}`,
      marginBottom: 16,
      fontFamily:   T.font,
    }}>

      {/* All-pass banner */}
      {allPassed && (
        <div style={{
          background:    T.ok,
          color:         "#fff",
          fontWeight:    800,
          padding:       "12px 16px",
          borderRadius:  8,
          textAlign:     "center",
          marginBottom:  16,
          fontSize:      15,
          letterSpacing: "-0.2px",
          boxShadow:     "0 4px 16px rgba(34,197,94,0.35)",
        }}>
          💎 ALL SYSTEMS 100% LIVE — INFINITE EXECUTION VERIFIED
        </div>
      )}

      {/* Run button */}
      <button
        onClick={runVerification}
        disabled={loading}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background:    loading ? "#e2e8f0" : hov
            ? "linear-gradient(135deg, #818cf8, #6366f1)"
            : "linear-gradient(135deg, #6366f1, #4f46e5)",
          color:         loading ? T.text3 : "#fff",
          fontWeight:    700,
          padding:       "11px 22px",
          borderRadius:  8,
          border:        "none",
          cursor:        loading ? "not-allowed" : "pointer",
          transition:    "all 0.18s ease",
          fontSize:      13,
          marginBottom:  report ? 18 : 0,
          letterSpacing: "-0.1px",
          display:       "flex",
          alignItems:    "center",
          gap:           8,
          boxShadow:     loading ? "none" : hov
            ? "0 4px 16px rgba(99,102,241,0.45)"
            : "0 2px 8px rgba(99,102,241,0.25)",
          transform:     hov && !loading ? "translateY(-1px)" : "translateY(0)",
        }}
      >
        {loading ? (
          <>
            <span style={{
              display:       "inline-block",
              width:         14, height: 14,
              border:        "2px solid #94a3b8",
              borderTopColor:"transparent",
              borderRadius:  "50%",
              animation:     "verifySpinner 0.7s linear infinite",
            }} />
            Running Verification…
          </>
        ) : "✅ Run Full Verification"}
      </button>

      {/* Spinner keyframe */}
      <style>{`@keyframes verifySpinner { to { transform: rotate(360deg); } }`}</style>

      {/* Step results */}
      {report?.steps?.map((step, i) => (
        <StepRow key={i} step={step} />
      ))}

      {/* Summary footer */}
      {report && (
        <div style={{
          marginTop:   14, paddingTop: 10,
          borderTop:   `1px solid ${T.border}`,
          display:     "flex", justifyContent: "space-between",
          fontSize:    11, color: T.text3,
        }}>
          <span>Run ID: {report.runId}</span>
          <span>
            {report.steps.filter(s => s.status === "PASS").length}/{report.steps.length} passed · {report.totalMs}ms
          </span>
        </div>
      )}
    </div>
  );
}
