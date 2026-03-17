import React, { useState } from "react";
import { useOS } from "@/os/OSContext";

interface Props {
  icon: string;
  label: string;
  color: string;
  description: string;
}

const QUICK_ACTIONS = [
  { label: "Generate with AI", icon: "✨" },
  { label: "Create Document", icon: "📄" },
  { label: "Run Analysis", icon: "📊" },
  { label: "Build Template", icon: "🗂️" },
];

export function ModuleShell({ icon, label, color, description }: Props) {
  const { openApp } = useOS();
  const [hoveredAction, setHoveredAction] = useState<number | null>(null);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0"
      style={{ background: "hsl(220,20%,97%)" }}>

      {/* Header */}
      <div className="h-14 flex items-center px-4 gap-3 flex-shrink-0"
        style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: color + "18" }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-[15px] truncate" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
            {label}
          </h1>
        </div>
        <button
          onClick={() => openApp("brainhub")}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-full flex-shrink-0 transition-all"
          style={{ background: "#6366f1", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.28)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#4f46e5")}
          onMouseLeave={e => (e.currentTarget.style.background = "#6366f1")}
        >🧠 AI</button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-xl mx-auto px-4 py-8 space-y-6">

          {/* Hero */}
          <div className="rounded-3xl p-6 flex flex-col items-center text-center gap-3"
            style={{ background: "linear-gradient(135deg," + color + "18 0%, " + color + "0a 100%)", border: "1.5px solid " + color + "28" }}>
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
              style={{ background: color + "22" }}>
              {icon}
            </div>
            <h2 className="text-[20px] font-bold" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>{label}</h2>
            <p className="text-[13px] leading-relaxed max-w-xs" style={{ color: "#6b7280" }}>{description}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
              <span className="text-[11px] font-semibold" style={{ color: "#6b7280" }}>Module active · AI-powered</span>
            </div>
          </div>

          {/* Quick actions */}
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#c4c9d4" }}>
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {QUICK_ACTIONS.map((a, i) => (
                <button key={a.label}
                  onClick={() => openApp("brainhub")}
                  onMouseEnter={() => setHoveredAction(i)}
                  onMouseLeave={() => setHoveredAction(null)}
                  className="flex flex-col items-start gap-2 p-4 rounded-2xl text-left transition-all"
                  style={{
                    background: "#fff",
                    border: hoveredAction === i ? `1.5px solid ${color}40` : "1px solid rgba(0,0,0,0.07)",
                    boxShadow: hoveredAction === i ? `0 4px 16px ${color}18` : "0 1px 4px rgba(0,0,0,0.05)",
                    transform: hoveredAction === i ? "translateY(-1px)" : "",
                  }}>
                  <span className="text-xl">{a.icon}</span>
                  <p className="text-[12px] font-semibold" style={{ color: "#0f172a" }}>{a.label}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Open in BrainHub CTA */}
          <button
            onClick={() => openApp("brainhub")}
            className="w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all"
            style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)", boxShadow: "0 4px 20px rgba(99,102,241,0.22)" }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 28px rgba(99,102,241,0.36)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.22)")}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.18)" }}>🧠</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[14px] text-white">Open in Brain Hub</p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.70)" }}>
                Run the full AI engine for {label}
              </p>
            </div>
            <span className="text-white/50 text-[22px] flex-shrink-0">›</span>
          </button>

        </div>
      </div>
    </div>
  );
}
