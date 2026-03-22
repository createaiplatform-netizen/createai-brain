// ─── Secure Auth Layer ────────────────────────────────────────────────────────
// State-machine orchestrator for phone OTP + trusted device + biometric auth.
// Applied to family/customer roles after Replit OIDC + NDA.
// Admin/founder/user/viewer bypass this layer entirely.
//
// State machine:
//   idle → checking → (trusted_with_biometric → biometric_gate)
//                     (trusted_no_biometric   → authorized)
//                     (untrusted              → phone_otp → trust_prompt → authorized)

import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  getStoredDeviceToken,
  storeDeviceToken,
  clearDeviceToken,
  getDeviceName,
  validateDeviceToken,
} from "@/lib/deviceAuth";
import { PhoneOTPScreen } from "./PhoneOTPScreen";
import { TrustedDevicePrompt } from "./TrustedDevicePrompt";
import { BiometricGate } from "./BiometricGate";
import type { AppRole } from "@/lib/roles";

type AuthState =
  | { status: "checking" }
  | { status: "authorized" }
  | { status: "phone_otp" }
  | { status: "trust_prompt"; deviceToken: string; deviceName: string }
  | { status: "biometric_gate"; deviceToken: string; deviceName: string; hasBiometric: boolean }
  | { status: "error"; message: string };

// Roles that require extra verification
const REQUIRES_EXTRA_AUTH: AppRole[] = ["family_adult", "family_child", "customer"];

interface SecureAuthLayerProps {
  role: AppRole | null;
  children: ReactNode;
}

export function SecureAuthLayer({ role, children }: SecureAuthLayerProps) {
  const [state, setState] = useState<AuthState>({ status: "checking" });

  const checkDevice = useCallback(async () => {
    if (!role || !REQUIRES_EXTRA_AUTH.includes(role)) {
      setState({ status: "authorized" });
      return;
    }

    const token = getStoredDeviceToken();
    if (!token) {
      setState({ status: "phone_otp" });
      return;
    }

    const result = await validateDeviceToken(token);
    if (!result.valid) {
      clearDeviceToken();
      setState({ status: "phone_otp" });
      return;
    }

    if (result.hasBiometric) {
      setState({
        status: "biometric_gate",
        deviceToken: token,
        deviceName: result.deviceName || getDeviceName(),
        hasBiometric: true,
      });
    } else {
      setState({ status: "authorized" });
    }
  }, [role]);

  useEffect(() => {
    checkDevice();
  }, [checkDevice]);

  // ── Phone OTP verified → save token → show trust prompt ─────────────────
  function handleOtpVerified(deviceToken: string) {
    const deviceName = getDeviceName();
    storeDeviceToken(deviceToken, deviceName);
    setState({ status: "trust_prompt", deviceToken, deviceName });
  }

  // ── Trust prompt done ────────────────────────────────────────────────────
  function handleTrustDone(_trusted: boolean) {
    setState({ status: "authorized" });
  }

  // ── Biometric success ────────────────────────────────────────────────────
  function handleBiometricSuccess() {
    setState({ status: "authorized" });
  }

  // ── Biometric fallback → show phone OTP ─────────────────────────────────
  function handleBiometricFallback() {
    clearDeviceToken();
    setState({ status: "phone_otp" });
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (state.status === "checking") {
    return <AuthCheckScreen />;
  }

  if (state.status === "authorized") {
    return <>{children}</>;
  }

  if (state.status === "phone_otp") {
    return <PhoneOTPScreen onVerified={handleOtpVerified} />;
  }

  if (state.status === "trust_prompt") {
    return (
      <>
        {children}
        <TrustedDevicePrompt
          deviceToken={state.deviceToken}
          deviceName={state.deviceName}
          onDone={handleTrustDone}
        />
      </>
    );
  }

  if (state.status === "biometric_gate") {
    return (
      <>
        {children}
        <BiometricGate
          deviceToken={state.deviceToken}
          deviceName={state.deviceName}
          hasBiometric={state.hasBiometric}
          onSuccess={handleBiometricSuccess}
          onFallback={handleBiometricFallback}
        />
      </>
    );
  }

  if (state.status === "error") {
    return <AuthErrorScreen message={state.message} onRetry={() => setState({ status: "checking" })} />;
  }

  return null;
}

// ── Loading Screen ───────────────────────────────────────────────────────────

function AuthCheckScreen() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "#faf9f6" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: "rgba(122,144,104,0.12)" }}
        >
          🌱
        </div>
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "#7a9068 transparent transparent transparent" }} />
      </div>
    </div>
  );
}

// ── Error Screen ─────────────────────────────────────────────────────────────

function AuthErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-6"
      style={{ background: "#faf9f6" }}
    >
      <div className="flex flex-col items-center gap-5 max-w-xs text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: "rgba(197,48,48,0.10)" }}
        >
          ⚠️
        </div>
        <div>
          <p className="text-[18px] font-bold" style={{ color: "#1a1916" }}>
            Something went wrong
          </p>
          <p className="text-[13px] mt-1.5" style={{ color: "#6b6660" }}>
            {message || "We couldn't verify your identity. Please try again."}
          </p>
        </div>
        <button
          onClick={onRetry}
          className="px-8 py-3 rounded-2xl font-bold text-white text-[14px]"
          style={{ background: "#7a9068" }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
