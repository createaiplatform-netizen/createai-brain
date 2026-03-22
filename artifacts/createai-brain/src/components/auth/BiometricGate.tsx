// ─── Biometric Gate ───────────────────────────────────────────────────────────
// Shown to users on trusted devices. Prompts for biometric/passkey verification.
// Falls back to phone re-auth if biometric fails or isn't registered.

import { useState, useEffect } from "react";
import { authenticateWithPasskey, isWebAuthnSupported } from "@/lib/deviceAuth";

const SAGE = "#7a9068";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";

interface BiometricGateProps {
  deviceToken: string;
  deviceName: string;
  hasBiometric: boolean;
  onSuccess: () => void;
  onFallback: () => void;
}

type GateState = "prompt" | "verifying" | "failed";

export function BiometricGate({ deviceToken, deviceName, hasBiometric, onSuccess, onFallback }: BiometricGateProps) {
  const [state, setState] = useState<GateState>("prompt");
  const [errorMsg, setErrorMsg] = useState("");

  // If no biometric registered, the device token alone is sufficient — pass through
  useEffect(() => {
    if (!hasBiometric || !isWebAuthnSupported()) {
      onSuccess();
    }
  }, [hasBiometric, onSuccess]);

  async function handleBiometric() {
    setState("verifying");
    setErrorMsg("");
    try {
      const ok = await authenticateWithPasskey(deviceToken);
      if (ok) {
        onSuccess();
      } else {
        setState("failed");
        setErrorMsg("Biometric verification didn't match. Please try again or use your phone.");
      }
    } catch {
      setState("failed");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  if (!hasBiometric || !isWebAuthnSupported()) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(250,249,246,0.98)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-xs rounded-3xl overflow-hidden"
        style={{ background: "white", boxShadow: "0 16px 60px rgba(0,0,0,0.12)" }}
      >
        <div className="px-8 pt-10 pb-8 flex flex-col items-center gap-6 text-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
            style={{ background: `${SAGE}12` }}
          >
            {state === "verifying" ? "⏳" : state === "failed" ? "⚠️" : "🔐"}
          </div>

          <div>
            <h2 className="text-[19px] font-black" style={{ color: TEXT }}>
              {state === "verifying" ? "Verifying…" : state === "failed" ? "Try again" : "Welcome back"}
            </h2>
            <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: MUTED }}>
              {state === "verifying"
                ? "Follow your device's prompt to confirm identity"
                : state === "failed"
                ? errorMsg
                : `Confirm it's you on ${deviceName}`
              }
            </p>
          </div>

          {state === "verifying" ? (
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${SAGE} transparent transparent transparent` }} />
          ) : (
            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={handleBiometric}
                className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white transition-all active:scale-95"
                style={{ background: SAGE }}
              >
                {state === "failed" ? "Try again" : "Use Face ID / Touch ID"}
              </button>
              <button
                onClick={onFallback}
                className="text-[13px] py-1 font-medium"
                style={{ color: MUTED }}
              >
                Use phone verification instead
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
