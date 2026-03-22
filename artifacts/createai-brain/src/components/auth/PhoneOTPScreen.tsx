// ─── Phone OTP Screen ────────────────────────────────────────────────────────
// First-time verification for family/customer roles.
// Sends a 6-digit OTP via Twilio SMS.

import { useState, useRef, useEffect } from "react";

const SAGE = "#7a9068";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.18)";
const ERROR_RED = "#c53030";

interface PhoneOTPScreenProps {
  onVerified: (deviceToken: string) => void;
  onDismiss?: () => void;
}

type Step = "phone" | "otp";

export function PhoneOTPScreen({ onVerified, onDismiss }: PhoneOTPScreenProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  async function handleSendOTP(e?: React.FormEvent) {
    e?.preventDefault();
    if (!phone.trim()) { setError("Please enter your phone number"); return; }
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/phone-auth/send-otp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as { success?: boolean; phone?: string; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to send code. Please check your number and try again.");
        return;
      }
      setMaskedPhone(data.phone ?? "");
      setStep("otp");
      setResendCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyOTP() {
    const code = otp.join("");
    if (code.length !== 6) { setError("Please enter the full 6-digit code."); return; }
    setVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/phone-auth/verify-otp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: code }),
      });
      const data = (await res.json()) as { success?: boolean; deviceToken?: string; error?: string };
      if (!res.ok || !data.success || !data.deviceToken) {
        setError(data.error ?? "Incorrect code. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
        return;
      }
      onVerified(data.deviceToken);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  function handleOtpInput(idx: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    setError("");
    if (digit && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
    if (next.every(d => d !== "") && idx === 5) {
      setTimeout(handleVerifyOTP, 80);
    }
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(26,25,22,0.60)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: CREAM, boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 flex flex-col items-center gap-4 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: `${SAGE}18` }}
          >
            {step === "phone" ? "📱" : "🔑"}
          </div>
          <div>
            <h2 className="text-[20px] font-black" style={{ color: TEXT }}>
              {step === "phone" ? "Verify your identity" : "Enter your code"}
            </h2>
            <p className="text-[13px] mt-1.5" style={{ color: MUTED }}>
              {step === "phone"
                ? "We'll send a one-time code to your phone. No password needed."
                : `We sent a 6-digit code to ${maskedPhone}`
              }
            </p>
          </div>
        </div>

        <div className="px-8 pb-8 flex flex-col gap-4">
          {step === "phone" && (
            <form onSubmit={handleSendOTP} className="flex flex-col gap-3">
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: MUTED }}>
                  Phone number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(""); }}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 rounded-xl text-[15px] outline-none transition-all"
                  style={{
                    background: "white",
                    border: `1.5px solid ${error ? ERROR_RED : BORDER}`,
                    color: TEXT,
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = SAGE)}
                  onBlur={e => (e.currentTarget.style.borderColor = error ? ERROR_RED : BORDER)}
                  autoComplete="tel"
                  inputMode="tel"
                  autoFocus
                />
              </div>

              {error && <p className="text-[13px] font-medium" style={{ color: ERROR_RED }}>{error}</p>}

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white transition-all active:scale-95 disabled:opacity-60"
                style={{ background: SAGE }}
              >
                {sending ? "Sending…" : "Send verification code"}
              </button>

              {onDismiss && (
                <button type="button" onClick={onDismiss}
                  className="text-center text-[13px] font-medium py-1"
                  style={{ color: MUTED }}>
                  Skip for now
                </button>
              )}
            </form>
          )}

          {step === "otp" && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpInput(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-11 h-14 text-center text-[22px] font-bold rounded-xl outline-none transition-all"
                    style={{
                      background: "white",
                      border: `2px solid ${digit ? SAGE : BORDER}`,
                      color: TEXT,
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = SAGE)}
                    onBlur={e => (e.currentTarget.style.borderColor = digit ? SAGE : BORDER)}
                  />
                ))}
              </div>

              {error && <p className="text-[13px] font-medium text-center" style={{ color: ERROR_RED }}>{error}</p>}

              <button
                onClick={handleVerifyOTP}
                disabled={verifying || otp.join("").length !== 6}
                className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white transition-all active:scale-95 disabled:opacity-60"
                style={{ background: SAGE }}
              >
                {verifying ? "Verifying…" : "Confirm"}
              </button>

              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-[13px]" style={{ color: MUTED }}>
                    Resend in {resendCooldown}s
                  </p>
                ) : (
                  <button
                    onClick={() => { setOtp(["","","","","",""]); handleSendOTP(); }}
                    className="text-[13px] font-semibold"
                    style={{ color: SAGE }}
                  >
                    Resend code
                  </button>
                )}
              </div>

              <button
                onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setError(""); }}
                className="text-center text-[13px] font-medium py-1"
                style={{ color: MUTED }}
              >
                Use a different number
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
