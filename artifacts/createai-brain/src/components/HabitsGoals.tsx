// ─── Habits & Goals ───────────────────────────────────────────────────────────
// Gentle habit tracking. No shaming, no comparisons.
// Users control everything. Can pause, change, or delete at any time.

import { useState, useEffect } from "react";

const SAGE = "#7a9068";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.14)";

interface Habit {
  id: string;
  name: string;
  emoji: string;
  frequency: string;
  current_streak: number;
  longest_streak: number;
  last_done_at: string | null;
  paused: boolean;
  total_completions: number;
  pending_approvals: number;
  has_pending_today: boolean;
}

const FREQ_LABELS: Record<string, string> = {
  daily: "Every day",
  weekly: "Once a week",
  weekdays: "Weekdays",
  weekends: "Weekends",
  custom: "Custom",
};

const SUGGESTED_HABITS = [
  { emoji: "💧", name: "Drink water", frequency: "daily" },
  { emoji: "🚶", name: "Take a walk", frequency: "daily" },
  { emoji: "📖", name: "Read for 10 minutes", frequency: "daily" },
  { emoji: "😴", name: "Good sleep routine", frequency: "daily" },
  { emoji: "🌱", name: "Check in with family", frequency: "daily" },
  { emoji: "🎵", name: "Do something creative", frequency: "weekly" },
  { emoji: "📝", name: "Write in journal", frequency: "weekly" },
  { emoji: "🧹", name: "Tidy up", frequency: "weekdays" },
];

export function HabitsGoals() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", emoji: "🌱", frequency: "daily" });
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/habits", { credentials: "include" });
      if (res.ok) {
        const d = (await res.json()) as { habits: Habit[] };
        setHabits(d.habits);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/habits", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowAdd(false);
      setForm({ name: "", emoji: "🌱", frequency: "daily" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(habit: Habit) {
    setCompleting(habit.id);
    try {
      await fetch(`/api/habits/${habit.id}/complete`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await load();
    } finally {
      setCompleting(null);
    }
  }

  async function handleTogglePause(habit: Habit) {
    await fetch(`/api/habits/${habit.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: !habit.paused }),
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this habit? Your progress history will be cleared.")) return;
    await fetch(`/api/habits/${id}`, { method: "DELETE", credentials: "include" });
    await load();
  }

  function isDoneToday(habit: Habit) {
    if (!habit.last_done_at) return false;
    const today = new Date().toISOString().slice(0, 10);
    return String(habit.last_done_at).slice(0, 10) === today;
  }

  const activeHabits = habits.filter(h => !h.paused);
  const pausedHabits = habits.filter(h => h.paused);
  const doneToday = activeHabits.filter(isDoneToday).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Daily progress */}
      {activeHabits.length > 0 && (
        <div className="p-4 rounded-2xl" style={{ background: `${SAGE}10`, border: `1px solid ${SAGE}20` }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-bold" style={{ color: TEXT }}>Today</p>
            <p className="text-[13px] font-bold" style={{ color: SAGE }}>
              {doneToday}/{activeHabits.length}
            </p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: `${SAGE}20` }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${activeHabits.length > 0 ? (doneToday / activeHabits.length) * 100 : 0}%`, background: SAGE }}
            />
          </div>
          {doneToday === activeHabits.length && activeHabits.length > 0 && (
            <p className="text-[12px] mt-2 text-center font-semibold" style={{ color: SAGE }}>
              Everything done today. You did great! 🌟
            </p>
          )}
        </div>
      )}

      {/* Add habit button */}
      <button
        onClick={() => setShowAdd(true)}
        className="w-full py-3 rounded-2xl font-bold text-[14px] text-white"
        style={{ background: SAGE }}
      >
        + Add a habit
      </button>

      {loading && <div className="py-6 text-center text-[12px]" style={{ color: MUTED }}>Loading…</div>}

      {!loading && habits.length === 0 && (
        <div className="py-6 text-center">
          <div className="text-3xl mb-2">🌱</div>
          <p className="text-[14px] font-semibold" style={{ color: TEXT }}>Start small</p>
          <p className="text-[12px] mt-1" style={{ color: MUTED }}>
            Pick one thing you want to do regularly. You can always add more.
          </p>
        </div>
      )}

      {/* Active habits */}
      {activeHabits.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeHabits.map(h => {
            const done = isDoneToday(h);
            return (
              <div
                key={h.id}
                className="p-4 rounded-2xl flex items-center gap-3"
                style={{
                  background: done ? `${SAGE}10` : "white",
                  border: `1px solid ${done ? `${SAGE}30` : BORDER}`,
                  transition: "all 0.2s",
                }}
              >
                <button
                  onClick={() => !done && handleComplete(h)}
                  disabled={done || completing === h.id}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-all"
                  style={{
                    background: done ? `${SAGE}20` : `${SAGE}10`,
                    cursor: done ? "default" : "pointer",
                    opacity: completing === h.id ? 0.6 : 1,
                  }}
                >
                  {completing === h.id ? (
                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: `${SAGE} transparent transparent transparent` }} />
                  ) : done ? "✅" : h.emoji}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-bold truncate" style={{ color: TEXT }}>{h.name}</p>
                    {h.current_streak > 0 && !h.has_pending_today && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${SAGE}18`, color: SAGE }}>
                        🔥 {h.current_streak}
                      </span>
                    )}
                    {h.has_pending_today && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(196,169,122,0.18)", color: "#9a7a3a" }}>
                        ⏳ Awaiting approval
                      </span>
                    )}
                  </div>
                  <p className="text-[11px]" style={{ color: MUTED }}>
                    {FREQ_LABELS[h.frequency] ?? h.frequency}
                    {h.longest_streak > 1 ? ` · best streak: ${h.longest_streak}` : ""}
                  </p>
                </div>

                <div className="flex gap-1.5">
                  <button onClick={() => handleTogglePause(h)}
                    className="text-[11px] px-2 py-1 rounded-lg font-semibold"
                    style={{ background: "rgba(107,102,96,0.08)", color: MUTED }}>
                    Pause
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paused habits */}
      {pausedHabits.length > 0 && (
        <div>
          <p className="text-[12px] font-bold mb-2" style={{ color: MUTED }}>Paused</p>
          <div className="flex flex-col gap-2">
            {pausedHabits.map(h => (
              <div key={h.id} className="p-3 rounded-2xl flex items-center gap-3 opacity-60"
                style={{ background: "white", border: `1px solid ${BORDER}` }}>
                <div className="text-xl">{h.emoji}</div>
                <span className="flex-1 text-[13px] font-semibold truncate" style={{ color: TEXT }}>{h.name}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => handleTogglePause(h)}
                    className="text-[11px] px-2 py-1 rounded-lg font-semibold text-white"
                    style={{ background: SAGE }}>
                    Resume
                  </button>
                  <button onClick={() => handleDelete(h.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px]"
                    style={{ background: "rgba(197,48,48,0.08)", color: "#c53030" }}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add habit modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-5"
          style={{ background: "rgba(26,25,22,0.50)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-sm rounded-3xl" style={{ background: CREAM, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <form onSubmit={handleAdd} className="p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[17px] font-black" style={{ color: TEXT }}>New habit</h3>
                <button type="button" onClick={() => setShowAdd(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: BORDER, color: MUTED }}>×</button>
              </div>

              <div className="flex gap-2">
                <input type="text" placeholder="🌱" value={form.emoji}
                  onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))}
                  className="w-14 text-center px-2 py-2.5 rounded-xl text-[22px] outline-none"
                  style={{ background: "white", border: `1.5px solid ${BORDER}` }} maxLength={2} />
                <input type="text" placeholder="What do you want to do?" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="flex-1 px-3 py-2.5 rounded-xl text-[14px] outline-none"
                  style={{ background: "white", border: `1.5px solid ${BORDER}`, color: TEXT }}
                  autoFocus />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: MUTED }}>How often?</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(FREQ_LABELS).map(([key, label]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setForm(p => ({ ...p, frequency: key }))}
                      className="py-2 rounded-xl text-[12px] font-semibold transition-all"
                      style={{
                        background: form.frequency === key ? SAGE : `${SAGE}10`,
                        color: form.frequency === key ? "white" : MUTED,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick suggestions */}
              <div>
                <p className="text-[11px] font-semibold mb-1.5" style={{ color: MUTED }}>Or pick a suggestion:</p>
                <div className="flex gap-1.5 flex-wrap">
                  {SUGGESTED_HABITS.slice(0, 5).map(s => (
                    <button
                      type="button"
                      key={s.name}
                      onClick={() => setForm(p => ({ ...p, name: s.name, emoji: s.emoji, frequency: s.frequency }))}
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                      style={{ background: `${SAGE}10`, color: MUTED }}
                    >
                      {s.emoji} {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={saving || !form.name.trim()}
                className="w-full py-3 rounded-2xl font-bold text-[14px] text-white mt-1"
                style={{ background: SAGE, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Adding…" : "Add habit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
