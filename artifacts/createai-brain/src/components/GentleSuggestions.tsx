// ─── Gentle Suggestions ──────────────────────────────────────────────────────
// Rule-based suggestions from the user's real data. Never alarming, never forced.
// Always dismissible. Platform suggests; user decides. No AI black boxes.

import { useState, useEffect } from "react";

const SAGE = "#7a9068";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.14)";

interface Suggestion {
  id: string;
  type: string;
  icon: string;
  message: string;
  action?: string;
  priority: number;
}

const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  alert:     { bg: "rgba(197,48,48,0.07)",   color: "#c53030" },
  reminder:  { bg: "rgba(196,169,122,0.12)", color: "#9a7a40" },
  celebrate: { bg: `rgba(74,122,90,0.10)`,   color: "#4a7a5a" },
  info:      { bg: `rgba(122,144,104,0.09)`, color: SAGE },
};

interface GentleSuggestionsProps {
  onNavigate?: (action: string) => void;
}

export function GentleSuggestions({ onNavigate }: GentleSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/smart-suggestions", { credentials: "include" });
      if (res.ok) {
        const d = (await res.json()) as { suggestions: Suggestion[] };
        setSuggestions(d.suggestions);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const visible = suggestions.filter(s => !dismissed.has(s.id));

  if (loading || visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-2">
      <p className="text-[11px] font-semibold px-1" style={{ color: MUTED }}>
        A few things to notice today
      </p>
      {visible.map(s => {
        const style = TYPE_STYLES[s.type] ?? TYPE_STYLES.info;
        return (
          <div
            key={s.id}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: style.bg, border: `1px solid ${BORDER}` }}
          >
            <span className="text-xl flex-shrink-0">{s.icon}</span>
            <p className="flex-1 text-[13px] font-semibold leading-snug" style={{ color: style.color }}>
              {s.message}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {s.action && onNavigate && (
                <button
                  onClick={() => { onNavigate(s.action!); setDismissed(d => new Set([...d, s.id])); }}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                  style={{ background: style.color, color: "white" }}
                >
                  View
                </button>
              )}
              <button
                onClick={() => setDismissed(d => new Set([...d, s.id]))}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[12px]"
                style={{ background: "rgba(107,102,96,0.10)", color: MUTED }}
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
