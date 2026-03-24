/**
 * FamilyAssistantPanel.tsx
 * Gentle, contextual, non-invasive parent-only helper.
 * Reads localStorage counts and surfaces calm suggestions.
 * No live AI calls. No pressure. No judgment.
 * Parent view only.
 */
import React, { useState, useEffect } from "react";

const SAGE   = "#9CAF88";
const SAGE_D = "#7a9068";
const TEXT   = "#2d2a24";
const MUTED  = "#6b6560";
const BORDER = "rgba(0,0,0,0.07)";

// ─── Read counts from all family localStorage stores ─────────────────────────
interface FamilySnapshot {
  unseenFeelings:  number;
  todayCheckins:   number;
  choresDone:      number;
  choresTotal:     number;
  memoryCount:     number;
  lastMemoryDays:  number;   // how many days ago last memory was added
  pendingReminders:number;
  activeGoals:     number;
  storiesCount:    number;
}

function readSnapshot(): FamilySnapshot {
  const today = new Date().toDateString();
  let unseenFeelings  = 0;
  let todayCheckins   = 0;
  let choresDone      = 0;
  let choresTotal     = 0;
  let memoryCount     = 0;
  let lastMemoryDays  = 999;
  let pendingReminders= 0;
  let activeGoals     = 0;
  let storiesCount    = 0;

  try {
    const feelings = JSON.parse(localStorage.getItem("family_feelings_v1") ?? "[]") as { parentSeen: boolean; date: string }[];
    unseenFeelings = feelings.filter(f => !f.parentSeen).length;
    todayCheckins  = feelings.filter(f => new Date(f.date).toDateString() === today).length;
  } catch {}

  try {
    const chores = JSON.parse(localStorage.getItem("family_chores_v1") ?? "[]") as { done: boolean }[];
    choresTotal = chores.length;
    choresDone  = chores.filter(c => c.done).length;
  } catch {}

  try {
    const memories = JSON.parse(localStorage.getItem("family_memory_garden_v1") ?? "[]") as { date: string }[];
    memoryCount = memories.length;
    if (memories.length > 0) {
      const last = new Date(memories[0].date);
      lastMemoryDays = Math.floor((Date.now() - last.getTime()) / 86400000);
    }
  } catch {}

  try {
    const reminders = JSON.parse(localStorage.getItem("family_reminders_v1") ?? "[]") as { done: boolean }[];
    pendingReminders = reminders.filter(r => !r.done).length;
  } catch {}

  try {
    const goals = JSON.parse(localStorage.getItem("family_goals_v1") ?? "[]") as { done: boolean }[];
    activeGoals = goals.filter(g => !g.done).length;
  } catch {}

  try {
    const stories = JSON.parse(localStorage.getItem("kids_creative_stories_v1") ?? "[]") as unknown[];
    storiesCount = stories.length;
  } catch {}

  return { unseenFeelings, todayCheckins, choresDone, choresTotal, memoryCount, lastMemoryDays, pendingReminders, activeGoals, storiesCount };
}

// ─── Suggestion card ──────────────────────────────────────────────────────────
interface Suggestion {
  id:      string;
  icon:    string;
  text:    string;
  color:   string;
  action?: string;
}

function buildSuggestions(s: FamilySnapshot): Suggestion[] {
  const out: Suggestion[] = [];

  if (s.unseenFeelings > 0) {
    out.push({
      id: "feelings",
      icon: "💛",
      text: s.unseenFeelings === 1
        ? "Someone shared a feeling — they might appreciate a reply today."
        : `${s.unseenFeelings} feelings were shared and haven't been responded to yet.`,
      color: "#f59e0b",
      action: "Check Feelings tab",
    });
  }

  if (s.choresTotal > 0 && s.choresDone < s.choresTotal) {
    const remaining = s.choresTotal - s.choresDone;
    out.push({
      id: "chores",
      icon: "🧹",
      text: `${remaining} chore${remaining > 1 ? "s" : ""} left today. Maybe one person could use a helpful nudge.`,
      color: "#10b981",
    });
  } else if (s.choresTotal > 0 && s.choresDone === s.choresTotal) {
    out.push({
      id: "chores-done",
      icon: "🌟",
      text: "All chores are done for today! Your family is crushing it.",
      color: SAGE_D,
    });
  }

  if (s.lastMemoryDays > 7) {
    out.push({
      id: "memory",
      icon: "🌻",
      text: s.memoryCount === 0
        ? "You haven't added any memories yet. A small moment is worth capturing."
        : `It's been ${s.lastMemoryDays} days since your last memory. Want to plant a new one?`,
      color: "#f97316",
      action: "Open Memory Garden",
    });
  }

  if (s.pendingReminders > 0) {
    out.push({
      id: "reminders",
      icon: "🔔",
      text: `${s.pendingReminders} reminder${s.pendingReminders > 1 ? "s" : ""} waiting. One thing at a time is enough.`,
      color: "#8b5cf6",
    });
  }

  if (s.activeGoals > 0) {
    out.push({
      id: "goals",
      icon: "🎯",
      text: `${s.activeGoals} active goal${s.activeGoals > 1 ? "s" : ""} in progress. Small steps every day add up.`,
      color: "#3b82f6",
    });
  }

  if (s.storiesCount > 0) {
    out.push({
      id: "stories",
      icon: "📖",
      text: `Your kids have written ${s.storiesCount} ${s.storiesCount === 1 ? "story" : "stories"} in their Creative Space. Did you read the latest one?`,
      color: "#6a8db5",
    });
  }

  // Always add at least one gentle prompt if nothing specific
  if (out.length === 0) {
    const GENTLE = [
      { icon: "💛", text: "Everything looks calm today. A good moment to ask someone how they really are." },
      { icon: "🌱", text: "Quiet days are a gift. Consider adding a simple routine or goal to make tomorrow easier." },
      { icon: "🤗", text: "Your family is doing great just by showing up every day. Celebrate that." },
      { icon: "🌻", text: "No tasks, no pressure — just a reminder that presence matters more than perfection." },
    ];
    const pick = GENTLE[new Date().getDay() % GENTLE.length];
    out.push({ id: "gentle", icon: pick.icon, text: pick.text, color: SAGE_D });
  }

  return out;
}

// ─── Daily reflection prompts ─────────────────────────────────────────────────
const REFLECTION_PROMPTS = [
  "What did your family laugh about today?",
  "Who in your family might need extra patience tomorrow?",
  "What's one thing you're proud of from this week?",
  "What's one thing you can let go of today?",
  "Is there a conversation you've been meaning to have?",
  "What's something small that would make tomorrow easier?",
];

// ─── Main component ───────────────────────────────────────────────────────────
export function FamilyAssistantPanel() {
  const [snap,       setSnap]       = useState<FamilySnapshot | null>(null);
  const [dismissed,  setDismissed]  = useState<string[]>([]);
  const [reflection, setReflection] = useState<string>("");
  const [refAnswer,  setRefAnswer]  = useState("");
  const [saved,      setSaved]      = useState(false);
  const [expanded,   setExpanded]   = useState(true);

  useEffect(() => {
    setSnap(readSnapshot());
    const idx = new Date().getDay() % REFLECTION_PROMPTS.length;
    setReflection(REFLECTION_PROMPTS[idx]);
  }, []);

  const dismiss = (id: string) => setDismissed(d => [...d, id]);

  const suggestions = snap ? buildSuggestions(snap).filter(s => !dismissed.includes(s.id)) : [];

  const saveReflection = () => {
    if (!refAnswer.trim()) return;
    const LS_KEY = "family_daily_reflections_v1";
    const saved_list = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as { prompt: string; answer: string; date: string }[];
    localStorage.setItem(LS_KEY, JSON.stringify([{ prompt: reflection, answer: refAnswer.trim(), date: new Date().toISOString() }, ...saved_list.slice(0, 29)]));
    setSaved(true);
    setTimeout(() => { setSaved(false); setRefAnswer(""); }, 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, #f8fbf6, #f0f8f0)`, border: `1px solid ${SAGE}25` }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌿</span>
          <div className="flex-1">
            <p className="font-bold text-[15px]" style={{ color: TEXT }}>Family Assistant</p>
            <p className="text-[12px]" style={{ color: MUTED }}>A calm helper — no pressure, just gentle awareness.</p>
          </div>
          <button onClick={() => setExpanded(e => !e)}
            className="text-[11px] px-3 py-1.5 rounded-xl" style={{ background: `${SAGE}15`, color: SAGE_D }}>
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold px-1" style={{ color: MUTED }}>TODAY'S GENTLE NUDGES</p>
              {suggestions.map(s => (
                <div key={s.id} className="rounded-2xl p-4 flex gap-3 items-start"
                  style={{ background: "white", border: `1px solid ${BORDER}` }}>
                  <span className="text-2xl flex-shrink-0">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] leading-relaxed" style={{ color: TEXT }}>{s.text}</p>
                    {s.action && (
                      <p className="text-[11px] font-semibold mt-1" style={{ color: s.color }}>→ {s.action}</p>
                    )}
                  </div>
                  <button onClick={() => dismiss(s.id)}
                    className="text-[12px] opacity-20 hover:opacity-50 flex-shrink-0 mt-0.5">×</button>
                </div>
              ))}
            </div>
          )}

          {/* Family snapshot */}
          {snap && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: `1px solid ${BORDER}` }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: BORDER }}>
                <p className="font-bold text-[13px]" style={{ color: TEXT }}>Today at a Glance</p>
              </div>
              <div className="grid grid-cols-3 divide-x" style={{ borderColor: BORDER }}>
                {[
                  { label: "Feelings shared",  value: snap.todayCheckins,   icon: "💛" },
                  { label: "Chores done",       value: `${snap.choresDone}/${snap.choresTotal}`, icon: "🧹" },
                  { label: "Memories planted",  value: snap.memoryCount,    icon: "🌻" },
                ].map(item => (
                  <div key={item.label} className="px-3 py-3 text-center">
                    <p className="text-2xl mb-1">{item.icon}</p>
                    <p className="font-black text-[18px]" style={{ color: TEXT }}>{item.value}</p>
                    <p className="text-[9px]" style={{ color: MUTED }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily reflection */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: `linear-gradient(135deg, #fdf8f0, #fff4e8)`, border: "1px solid #fde8cc" }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">🪞</span>
              <p className="font-bold text-[13px]" style={{ color: TEXT }}>Daily Reflection</p>
            </div>
            <p className="text-[13px] leading-relaxed italic" style={{ color: TEXT }}>{reflection}</p>
            <textarea value={refAnswer} onChange={e => setRefAnswer(e.target.value)}
              rows={2} placeholder="Write your thoughts (just for you)…"
              className="w-full rounded-xl px-3 py-2 text-[12px] border outline-none resize-none"
              style={{ background: "white", borderColor: BORDER, color: TEXT }} />
            <button onClick={saveReflection} disabled={!refAnswer.trim()}
              className="w-full py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-40"
              style={{ background: saved ? "#10b981" : SAGE_D }}>
              {saved ? "Saved ✓" : "Save reflection"}
            </button>
          </div>

          {/* Parenting support tips */}
          <details className="rounded-2xl overflow-hidden" style={{ background: "white", border: `1px solid ${BORDER}` }}>
            <summary className="px-4 py-3 text-[13px] font-bold cursor-pointer" style={{ color: TEXT }}>
              💡 Quick parenting reminders
            </summary>
            <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: BORDER }}>
              {[
                "Children feel safe when they see that big feelings don't break relationships.",
                "Consistency in small rituals (bedtime, meals) reduces anxiety in kids.",
                "Named feelings calm down the nervous system — help kids label emotions.",
                "A 10-minute one-on-one moment per day matters more than you think.",
                "When you repair after a hard moment, you model emotional intelligence.",
                "Rest is not laziness. Model it. It matters.",
              ].map(tip => (
                <div key={tip} className="flex items-start gap-2 py-1.5 border-b last:border-b-0" style={{ borderColor: BORDER }}>
                  <span className="text-[12px] flex-shrink-0 mt-0.5" style={{ color: SAGE_D }}>•</span>
                  <p className="text-[12px] leading-relaxed" style={{ color: MUTED }}>{tip}</p>
                </div>
              ))}
            </div>
          </details>
        </>
      )}
    </div>
  );
}
