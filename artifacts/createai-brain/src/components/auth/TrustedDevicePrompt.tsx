// ─── Trusted Device Prompt ────────────────────────────────────────────────────
// After phone OTP verification, ask user if they want to trust this device.
// Trusted devices use biometrics on next login (Face ID / Touch ID / fingerprint).

import { useState } from "react";
import { isWebAuthnSupported, registerPasskey } from "@/lib/deviceAuth";

const SAGE = "#7a9068";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.15)";

interface TrustedDevicePromptProps {
  deviceToken: string;
  deviceName: string;
  onDone: (trusted: boolean) => void;
}

export function TrustedDevicePrompt({ deviceToken, deviceName, onDone }: TrustedDevicePromptProps) {
  const [registering, setRegistering] = useState(false);
  const [step, setStep] = useState<"ask" | "biometric" | "done">("ask");
  const supportsWebAuthn = isWebAuthnSupported();

  async function handleTrustWithBiometric() {
    setRegistering(true);
    setStep("biometric");
    try {
      const ok = await registerPasskey(deviceToken);
      if (ok) {
        setStep("done");
        setTimeout(() => onDone(true), 1200);
      } else {
        // Biometric failed — device is still trusted via phone token
        onDone(true);
      }
    } catch {
      onDone(true);
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(26,25,22,0.55)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: CREAM, boxShadow: "0 24px 80px rgba(0,0,0,0.20)" }}
      >
        <div className="px-8 pt-8 pb-8 flex flex-col items-center gap-5 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: `${SAGE}18` }}
          >
            {step === "done" ? "✅" : step === "biometric" ? "🔐" : "🛡️"}
          </div>

          {step === "ask" && (
            <>
              <div>
                <h2 className="text-[20px] font-black" style={{ color: TEXT }}>
                  Trust this device?
                </h2>
                <p className="text-[13px] mt-2 leading-relaxed" style={{ color: MUTED }}>
                  {supportsWebAuthn
                    ? `Save ${deviceName} as a trusted device. Next time, just use your face or fingerprint — no code needed.`
                    : `Save ${deviceName} as a trusted device. You'll stay logged in on this device.`
                  }
                </p>
              </div>

              <div className="w-full flex flex-col gap-2.5">
                {supportsWebAuthn && (
                  <button
                    onClick={handleTrustWithBiometric}
                    disabled={registering}
                    className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white transition-all active:scale-95"
                    style={{ background: SAGE }}
                  >
                    Trust with Face ID / Touch ID
                  </button>
                )}
                <button
                  onClick={() => onDone(true)}
                  className="w-full py-3.5 rounded-2xl font-bold text-[15px] transition-all active:scale-95"
                  style={{
                    background: "white",
                    border: `1.5px solid ${BORDER}`,
                    color: SAGE,
                  }}
                >
                  {supportsWebAuthn ? "Trust device, skip biometrics" : "Yes, trust this device"}
                </button>
                <button
                  onClick={() => onDone(false)}
                  className="text-[13px] py-1.5 font-medium"
                  style={{ color: MUTED }}
                >
                  Not now — ask me every time
                </button>
              </div>

              <div
                className="w-full p-3 rounded-xl text-left"
                style={{ background: `${SAGE}0a`, border: `1px solid ${SAGE}18` }}
              >
                <p className="text-[11px] leading-snug" style={{ color: MUTED }}>
                  🔒 We never store your biometrics. Your face or fingerprint stays on your device only.
                  You can remove this device from your account at any time.
                </p>
              </div>
            </>
          )}

          {step === "biometric" && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: `${SAGE} transparent transparent transparent` }} />
              <p className="text-[14px] font-semibold" style={{ color: TEXT }}>
                Setting up biometric login…
              </p>
              <p className="text-[12px]" style={{ color: MUTED }}>
                Follow your device's prompt to confirm your identity
              </p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-[17px] font-bold" style={{ color: TEXT }}>
                Device trusted!
              </p>
              <p className="text-[13px]" style={{ color: MUTED }}>
                You're all set. Next login will use biometrics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
