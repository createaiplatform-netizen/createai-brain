import React, { useState } from "react";

interface AuthModalProps {
  onAuth: (email: string) => void;
  onClose: () => void;
}

export function AuthModal({ onAuth, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"login" | "nda">("login");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setStep("nda");
  };

  const handleNdaAccept = () => {
    if (!ndaAccepted) { setError("You must accept the NDA to proceed."); return; }
    onAuth(email);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 space-y-6"
        style={{ background: "rgba(14,18,42,0.95)", border: "1px solid rgba(99,102,241,0.25)" }}
      >
        {step === "login" ? (
          <>
            <div className="text-center space-y-2">
              <div className="text-3xl">🔒</div>
              <h2 className="text-xl font-bold text-white">Sign In to Test Mode</h2>
              <p className="text-[13px]" style={{ color: "rgba(148,163,184,0.65)" }}>
                Test Mode uses your real context for personalized data.<br />
                Nothing is sent externally — all data stays local.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(148,163,184,0.5)" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-transparent text-white px-4 py-3 rounded-xl outline-none text-[14px]"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.25)" }}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(148,163,184,0.5)" }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-white px-4 py-3 rounded-xl outline-none text-[14px]"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.25)" }}
                />
              </div>
              {error && (
                <p className="text-[12px] text-red-400">{error}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded-xl text-white font-bold text-[14px] transition-all"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              >
                Continue →
              </button>
            </form>

            <div className="text-center">
              <button onClick={onClose} className="text-[12px] transition-colors" style={{ color: "rgba(148,163,184,0.4)" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#94a3b8")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(148,163,184,0.4)")}
              >
                Cancel — stay in Demo Mode
              </button>
            </div>

            <div className="rounded-xl p-3 text-[11px]" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", color: "rgba(165,180,252,0.7)" }}>
              🔒 Demo platform: any email/password combination works. This simulates the auth flow. No real accounts are created.
            </div>
          </>
        ) : (
          <>
            <div className="text-center space-y-2">
              <div className="text-3xl">📋</div>
              <h2 className="text-xl font-bold text-white">Non-Disclosure Agreement</h2>
              <p className="text-[13px]" style={{ color: "rgba(148,163,184,0.65)" }}>
                Test Mode contains proprietary platform information.<br />
                Please review and accept the NDA to proceed.
              </p>
            </div>

            <div
              className="rounded-xl p-4 text-[12px] max-h-48 overflow-y-auto space-y-2 leading-relaxed"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,184,0.7)" }}
            >
              <p><strong className="text-white">NON-DISCLOSURE AGREEMENT — PLATFORM TEST ACCESS</strong></p>
              <p>By accepting this agreement, you acknowledge that all materials, data, workflows, configurations, and AI outputs accessed through this platform's Test Mode are proprietary and confidential.</p>
              <p>You agree to: (1) not share platform content with third parties without written consent; (2) not reproduce or distribute platform data; (3) use access solely for evaluation purposes; (4) notify the platform operator of any unauthorized disclosure.</p>
              <p>This agreement is effective upon acceptance and remains in effect for 12 months. All data accessed in Test Mode is illustrative and non-binding. No real data is stored or transmitted.</p>
              <p>Platform by Sara Stadler / CreateAI Brain. For questions: contact@createai.com</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <div
                onClick={() => setNdaAccepted(v => !v)}
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-all"
                style={{
                  background: ndaAccepted ? "#6366f1" : "rgba(255,255,255,0.08)",
                  border: `1px solid ${ndaAccepted ? "#6366f1" : "rgba(255,255,255,0.15)"}`,
                }}
              >
                {ndaAccepted && <span className="text-white text-[11px]">✓</span>}
              </div>
              <span className="text-[13px]" style={{ color: "rgba(148,163,184,0.75)" }}>
                I have read and agree to the Non-Disclosure Agreement. I understand this platform is proprietary and I will use it only for authorized evaluation.
              </span>
            </label>

            {error && <p className="text-[12px] text-red-400">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("login")}
                className="flex-1 py-3 rounded-xl text-[13px] font-semibold transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#94a3b8" }}
              >
                ← Back
              </button>
              <button
                onClick={handleNdaAccept}
                className="flex-1 py-3 rounded-xl text-white font-bold text-[14px] transition-all"
                style={{ background: ndaAccepted ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(99,102,241,0.3)", cursor: ndaAccepted ? "pointer" : "not-allowed" }}
              >
                Accept & Enter →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
