// ─── Guardian Approval Panel ──────────────────────────────────────────────────
// Adults see pending habit completions from kids and can approve or reject them.
// No rankings. No shame. Every review is warm and supportive.

import { useState, useEffect, useCallback } from "react";

const SAGE   = "#7a9068";
const TEXT   = "#1a1916";
const MUTED  = "#6b6660";
const BORDER = "rgba(122,144,104,0.14)";

interface PendingApproval {
  completion_id:       string;
  done_on:             string;
  note:                string | null;
  created_at:          string;
  habit_id:            string;
  habit_name:          string;
  habit_emoji:         string;
  child_user_id:       string;
  child_display_name:  string;
}

interface Props {
  onCountChange?: (count: number) => void;
}

export function GuardianApprovalPanel({ onCountChange }: Props) {
  const [items, setItems]       = useState<PendingApproval[]>([]);
  const [loading, setLoading]   = useState(true);
  const [allowed, setAllowed]   = useState(true);
  const [acting, setActing]     = useState<string | null>(null);
  const [noteMap, setNoteMap]   = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/habits/approvals", { credentials: "include" });
      if (res.status === 403) { setAllowed(false); return; }
      if (!res.ok) return;
      const d = (await res.json()) as { pending: PendingApproval[] };
      setItems(d.pending);
      onCountChange?.(d.pending.length);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => { void load(); }, [load]);

  async function act(completionId: string, action: "approve" | "reject") {
    setActing(completionId);
    try {
      await fetch(`/api/habits/approvals/${completionId}/${action}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note: noteMap[completionId] ?? "" }),
      });
      await load();
    } finally {
      setActing(null);
    }
  }

  if (!allowed) return null;

  if (loading) {
    return (
      <div className="py-4 text-center text-[12px]" style={{ color: MUTED }}>
        Loading approvals…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="p-4 rounded-2xl flex items-center gap-3"
        style={{ background: `${SAGE}08`, border: `1px solid ${SAGE}18` }}
      >
        <span className="text-xl">✅</span>
        <p className="text-[13px] font-semibold" style={{ color: MUTED }}>
          No habits waiting for your review
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: SAGE }}>
        Waiting for your review · {items.length}
      </p>

      {items.map(item => (
        <div
          key={item.completion_id}
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: "white", border: `1px solid ${BORDER}` }}
        >
          {/* Header */}
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: `${SAGE}12` }}
            >
              {item.habit_emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold truncate" style={{ color: TEXT }}>
                {item.habit_name}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                {item.child_display_name} · {new Date(item.done_on).toLocaleDateString("en-US", {
                  month: "short", day: "numeric",
                })}
              </p>
              {item.note && (
                <p className="text-[12px] mt-1 italic" style={{ color: MUTED }}>
                  "{item.note}"
                </p>
              )}
            </div>
          </div>

          {/* Optional note */}
          <input
            type="text"
            placeholder="Add a note (optional)"
            value={noteMap[item.completion_id] ?? ""}
            onChange={e =>
              setNoteMap(p => ({ ...p, [item.completion_id]: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-xl text-[12px] outline-none"
            style={{
              background: "#faf9f6",
              border: `1px solid ${BORDER}`,
              color: TEXT,
            }}
          />

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => void act(item.completion_id, "approve")}
              disabled={acting === item.completion_id}
              className="flex-1 py-2 rounded-xl text-[13px] font-bold transition-all"
              style={{
                background: acting === item.completion_id ? `${SAGE}60` : SAGE,
                color: "white",
              }}
            >
              {acting === item.completion_id ? "…" : "✓ Approve"}
            </button>
            <button
              onClick={() => void act(item.completion_id, "reject")}
              disabled={acting === item.completion_id}
              className="flex-1 py-2 rounded-xl text-[13px] font-bold transition-all"
              style={{
                background: "rgba(197,48,48,0.08)",
                color: "#c53030",
              }}
            >
              {acting === item.completion_id ? "…" : "✗ Needs retry"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
