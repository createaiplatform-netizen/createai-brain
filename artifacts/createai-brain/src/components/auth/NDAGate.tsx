import { useState, type ReactNode } from "react";
import { useAuth } from "@workspace/replit-auth-web";

const SAGE = "#7a9068";

function getNDAKey(userId?: string): string {
  return userId ? `cai_nda_accepted_${userId}` : "cai_nda_accepted";
}

interface NDAGateProps {
  children: ReactNode;
}

export function NDAGate({ children }: NDAGateProps) {
  const { user } = useAuth();
  const key = getNDAKey(user?.id);
  const [accepted, setAccepted] = useState(() => !!localStorage.getItem(key));

  function accept() {
    localStorage.setItem(key, "1");
    setAccepted(true);
  }

  if (accepted) return <>{children}</>;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(8px)" }}
    >
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: "#fff" }}>
        <div
          className="px-8 py-6"
          style={{ background: `linear-gradient(135deg, ${SAGE} 0%, #5a6d50 100%)` }}
        >
          <div className="text-[22px] mb-1">🌱</div>
          <h2
            className="text-white font-bold text-[18px] leading-tight"
            style={{ letterSpacing: "-0.02em" }}
          >
            Platform Access Agreement
          </h2>
          <p className="mt-1 text-[13px]" style={{ color: "rgba(255,255,255,0.78)" }}>
            One-time acknowledgement required before entering your space.
          </p>
        </div>

        <div className="px-8 py-6">
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: "#374151" }}>
            By accessing this platform you agree to keep all platform content,
            data, and information confidential. You will not share, reproduce,
            or disclose any platform outputs, workflows, or data to third parties
            without written authorization from Lakeside Trinity LLC.
          </p>
          <p className="text-[13px] leading-relaxed mb-6" style={{ color: "#374151" }}>
            This agreement covers all features of CreateAI Brain and is governed
            by the Terms of Service at{" "}
            <a
              href="https://createai.digital/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: SAGE, fontWeight: 600, textDecoration: "underline" }}
            >
              createai.digital/terms
            </a>.
          </p>

          <button
            onClick={accept}
            className="w-full py-3 rounded-xl font-bold text-white text-[14px] transition-opacity hover:opacity-90 active:opacity-80"
            style={{ background: `linear-gradient(135deg, ${SAGE} 0%, #5a6d50 100%)` }}
          >
            I understand and agree
          </button>

          <p className="text-center text-[11px] mt-3" style={{ color: "#9ca3af" }}>
            This acknowledgement is stored locally on this device.
          </p>
        </div>
      </div>
    </div>
  );
}
