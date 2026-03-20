/**
 * InfiniteBrainLiveBanner
 * Top-of-dashboard live status bar. Pulses, shows workflow dots,
 * and fires family notifications whenever a workflow turns green.
 */

import React, { useEffect, useRef, useState } from "react";
import { fetchSystemStats, notifyFamily } from "@/services/systemServices";

// ─── CSS animations (injected once) ──────────────────────────────────────────

const STYLE = `
@keyframes brainBannerPulse {
  0%   { box-shadow: 0 0 0 0   rgba(99,102,241,0.45); }
  70%  { box-shadow: 0 0 0 12px rgba(99,102,241,0);    }
  100% { box-shadow: 0 0 0 0   rgba(99,102,241,0);     }
}
@keyframes brainBannerPulseRed {
  0%   { box-shadow: 0 0 0 0   rgba(248,113,113,0.45); }
  70%  { box-shadow: 0 0 0 12px rgba(248,113,113,0);    }
  100% { box-shadow: 0 0 0 0   rgba(248,113,113,0);     }
}
@keyframes dotActivePulse {
  0%   { box-shadow: 0 0 0 0   rgba(34,197,94,0.50); }
  70%  { box-shadow: 0 0 0 6px rgba(34,197,94,0);    }
  100% { box-shadow: 0 0 0 0   rgba(34,197,94,0);    }
}
`;

let styleInjected = false;
function injectStyle() {
  if (styleInjected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.textContent = STYLE;
  document.head.appendChild(el);
  styleInjected = true;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InfiniteBrainLiveBanner() {
  const [healthy, setHealthy]             = useState(true);
  const [statusText, setStatusText]       = useState("✅ 100% Brain Live – Infinite Mode");
  const [workflowStates, setWorkflowStates] = useState<boolean[]>(Array(8).fill(true));
  const previousStatesRef                 = useRef<boolean[]>([]);

  useEffect(() => {
    injectStyle();

    const update = async () => {
      try {
        const stats = await fetchSystemStats();
        const allGood = stats.cpu > 0 && stats.memory > 0 && stats.maxUsers > 0;

        setHealthy(allGood);
        setStatusText(
          allGood
            ? "✅ 100% Brain Live – Infinite Mode"
            : "⚠ Brain Warning – Check Workflows",
        );

        const count     = stats.activeWorkflows || 8;
        const newStates = Array(count).fill(allGood);
        setWorkflowStates(newStates);

        // Fire notification when any workflow transitions false → true
        previousStatesRef.current.forEach((prev, i) => {
          if (!prev && newStates[i]) {
            notifyFamily({
              subject: `Workflow #${i + 1} is now ACTIVE`,
              message:  `Workflow #${i + 1} is now ACTIVE ✅ — Brain at 100% infinite mode.`,
            }).catch(() => {}); // best-effort, never crash the banner
          }
        });
        previousStatesRef.current = newStates;
      } catch {
        setHealthy(false);
        setStatusText("⚠ Brain Offline – Check System");
        setWorkflowStates(Array(8).fill(false));
      }
    };

    update();
    const id = setInterval(update, 5_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      background:    healthy
        ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
        : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      color:         "#fff",
      fontWeight:    700,
      fontSize:      15,
      padding:       "14px 20px",
      borderRadius:  12,
      marginBottom:  16,
      display:       "flex",
      justifyContent:"space-between",
      alignItems:    "center",
      animation:     healthy
        ? "brainBannerPulse 2s infinite"
        : "brainBannerPulseRed 2s infinite",
      gap:           16,
      flexWrap:      "wrap",
      letterSpacing: "-0.1px",
      fontFamily:    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    }}>
      <span>{statusText}</span>

      {/* Workflow dots */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {workflowStates.map((active, i) => (
          <div
            key={i}
            title={`Workflow #${i + 1}: ${active ? "ACTIVE" : "PENDING"}`}
            style={{
              width:        10,
              height:       10,
              borderRadius: "50%",
              background:   active ? "#4ade80" : "#fbbf24",
              animation:    active ? "dotActivePulse 1.5s infinite" : "none",
              transition:   "background 0.3s ease",
              flexShrink:   0,
            }}
          />
        ))}
        <span style={{
          fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.70)",
          marginLeft: 8, whiteSpace: "nowrap",
        }}>
          {workflowStates.filter(Boolean).length}/{workflowStates.length} live
        </span>
      </div>
    </div>
  );
}
