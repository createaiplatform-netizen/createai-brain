// ─── Kids Universe ────────────────────────────────────────────────────────────
// Gentle, wonder-filled, safe space for family children.
// No comparisons. No embarrassment. Big text. Bright but warm tones.
// Family Universe Standing Law always active.

import { useState, useEffect, useCallback } from "react";
import { generateIdentity } from "@/lib/identityEngine";
import { EmotionalSafetyPanel }  from "@/components/family/EmotionalSafetyPanel";
import { DiscoveryEnginePanel }  from "@/components/family/DiscoveryEnginePanel";

const SAGE = "#7a9068";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.15)";

interface FamilyIdentity {
  display_name: string;
  avatar_emoji: string;
  avatar_color: string;
}

const ACTIVITIES = [
  { emoji: "🎨", title: "Draw something",  desc: "Create art, scribbles, masterpieces!" },
  { emoji: "📖", title: "Tell a story",    desc: "What adventures happened today?" },
  { emoji: "🎵", title: "Make music",      desc: "Hum, clap, or find a song you love" },
  { emoji: "🌿", title: "Explore nature",  desc: "Find something interesting outside" },
  { emoji: "🧩", title: "Build a puzzle",  desc: "Take your time, there's no rush" },
  { emoji: "💌", title: "Write a note",    desc: "Send a message to someone you care about" },
  { emoji: "🌟", title: "Daydream",        desc: "Close your eyes and imagine something wonderful" },
  { emoji: "🏡", title: "Play pretend",    desc: "Be anyone, anything, anywhere!" },
];

const FEELINGS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😴", label: "Tired" },
  { emoji: "😌", label: "Calm" },
  { emoji: "🤩", label: "Excited" },
  { emoji: "😔", label: "Sad" },
  { emoji: "🤔", label: "Wondering" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "😂", label: "Silly" },
];

interface KidsHabit {
  id: string;
  name: string;
  emoji: string;
  current_streak: number;
  last_done_at: string | null;
}

const KIDS_HABIT_SUGGESTIONS = [
  { emoji: "🦷", name: "Brush my teeth" },
  { emoji: "📖", name: "Read something" },
  { emoji: "💧", name: "Drink water" },
  { emoji: "🛏️", name: "Make my bed" },
  { emoji: "🌿", name: "Go outside" },
  { emoji: "💌", name: "Say something kind" },
];

export default function KidsUniversePage() {
  const [identity, setIdentity] = useState<FamilyIdentity | null>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [showFeelings, setShowFeelings] = useState(false);
  const [spark, setSpark] = useState<(typeof ACTIVITIES)[number] | null>(null);

  // Kids habits state
  const [kidsTab, setKidsTab] = useState<"home" | "creative" | "feelings" | "discover">("home");
  const [habits, setHabits] = useState<KidsHabit[]>([]);
  const [completingHabit, setCompletingHabit] = useState<string | null>(null);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [habitPick, setHabitPick] = useState<{ name: string; emoji: string } | null>(null);

  const loadHabits = useCallback(async () => {
    const res = await fetch("/api/habits", { credentials: "include" });
    if (res.ok) {
      const d = (await res.json()) as { habits: KidsHabit[] };
      setHabits(d.habits.filter(h => !("paused" in h && (h as KidsHabit & { paused: boolean }).paused)));
    }
  }, []);

  useEffect(() => {
    void loadIdentity();
    void loadHabits();
  }, [loadHabits]);

  async function loadIdentity() {
    const res = await fetch("/api/family-identity/me", { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as { identity: FamilyIdentity };
      setIdentity(data.identity);
    }
  }

  function drawSpark() {
    const random = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
    setSpark(random);
  }

  async function addHabit(name: string, emoji: string) {
    await fetch("/api/habits", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji, frequency: "daily" }),
    });
    setShowAddHabit(false);
    setHabitPick(null);
    await loadHabits();
  }

  async function completeHabit(id: string) {
    setCompletingHabit(id);
    try {
      await fetch(`/api/habits/${id}/complete`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await loadHabits();
    } finally {
      setCompletingHabit(null);
    }
  }

  function isDoneToday(habit: KidsHabit) {
    if (!habit.last_done_at) return false;
    return String(habit.last_done_at).slice(0, 10) === new Date().toISOString().slice(0, 10);
  }

  const localId = identity
    ? { displayName: identity.display_name, avatarEmoji: identity.avatar_emoji, avatarColor: identity.avatar_color, gradientFrom: identity.avatar_color, gradientTo: identity.avatar_color }
    : generateIdentity("kid", "child");

  return (
    <div
      className="min-h-screen"
      style={{ background: CREAM }}
    >
      {/* Big warm header */}
      <div className="px-6 pt-10 pb-6">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-4"
          style={{
            background: `linear-gradient(135deg, ${localId.avatarColor}30, ${localId.avatarColor}12)`,
          }}
        >
          {identity?.avatar_emoji ?? "🌟"}
        </div>
        <h1
          className="text-[32px] font-black leading-tight"
          style={{ color: TEXT }}
        >
          Hi,<br />{identity?.display_name ?? ""}! 👋
        </h1>
        <p className="text-[16px] mt-2" style={{ color: MUTED }}>
          This is your cozy space. What do you want to explore today?
        </p>
      </div>

      {/* Kids tab bar */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-4 gap-1 rounded-2xl p-1.5" style={{ background: "rgba(0,0,0,0.04)" }}>
          {[
            { id: "home",     icon: "🏠", label: "Home"    },
            { id: "creative", icon: "🎨", label: "Create"  },
            { id: "feelings", icon: "💛", label: "Feelings"},
            { id: "discover", icon: "🌍", label: "Discover"},
          ].map(t => (
            <button key={t.id} onClick={() => setKidsTab(t.id as typeof kidsTab)}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
              style={{
                background: kidsTab === t.id ? SAGE : "transparent",
                color:      kidsTab === t.id ? "white" : MUTED,
              }}>
              <span className="text-[20px]">{t.icon}</span>
              <span className="text-[9px] font-bold">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Creative Space tab — entry portal */}
      {kidsTab === "creative" && (
        <div className="px-4 pb-12 flex flex-col gap-4">
          {/* Hero card */}
          <div className="rounded-3xl p-6 text-center"
            style={{ background: `linear-gradient(135deg, ${SAGE}15, ${SAGE}05)`, border: `1px solid ${SAGE}25` }}>
            <div className="text-5xl mb-3">🎨</div>
            <h2 className="text-[22px] font-black mb-1" style={{ color: TEXT }}>My Creative Space</h2>
            <p className="text-[13px] mb-5" style={{ color: MUTED }}>
              Draw, write stories, and create characters — all just for you and your family.
            </p>
            <button onClick={() => { window.location.href = "/kids/creative"; }}
              className="w-full py-3.5 rounded-2xl text-[15px] font-black text-white"
              style={{ background: `linear-gradient(135deg, ${SAGE}, #9CAF88)` }}>
              Open Creative Space ✨
            </button>
          </div>

          {/* What you can do */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "🎨", label: "Drawing Studio", desc: "Paint anything you imagine" },
              { icon: "📖", label: "Story Studio",   desc: "Write your own stories"       },
              { icon: "🦸", label: "Characters",     desc: "Build amazing characters"      },
              { icon: "🖼️", label: "Gallery",        desc: "See all your creations"        },
            ].map(item => (
              <button key={item.label}
                onClick={() => { window.location.href = "/kids/creative"; }}
                className="p-4 rounded-2xl text-left transition-all active:scale-95"
                style={{ background: "white", border: `1px solid rgba(0,0,0,0.07)` }}>
                <p className="text-2xl mb-1">{item.icon}</p>
                <p className="font-bold text-[12px]" style={{ color: TEXT }}>{item.label}</p>
                <p className="text-[10px]" style={{ color: MUTED }}>{item.desc}</p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl p-3 text-center" style={{ background: `${SAGE}08`, border: `1px solid ${SAGE}18` }}>
            <p className="text-[11px]" style={{ color: MUTED }}>
              🔒 Your creations stay private — only you and your family can see them.
            </p>
          </div>
        </div>
      )}

      {/* Feelings tab — kid-scoped EmotionalSafetyPanel */}
      {kidsTab === "feelings" && (
        <div className="px-4 pb-12">
          <EmotionalSafetyPanel isParent={false} />
        </div>
      )}

      {/* Discover tab — kid-scoped DiscoveryEnginePanel */}
      {kidsTab === "discover" && (
        <div className="px-4 pb-12">
          <DiscoveryEnginePanel />
        </div>
      )}

      {/* Home tab — original content */}
      {kidsTab === "home" && (
      <div className="px-6 flex flex-col gap-5 pb-12">
        {/* ── How are you feeling? ── */}
        <div
          className="p-4 rounded-3xl"
          style={{ background: "white", border: `1px solid ${BORDER}` }}
        >
          <button
            className="w-full flex items-center justify-between"
            onClick={() => setShowFeelings(f => !f)}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedFeeling ?? "🌈"}</span>
              <p className="text-[17px] font-bold" style={{ color: TEXT }}>
                {selectedFeeling ? `Feeling ${FEELINGS.find(f => f.emoji === selectedFeeling)?.label ?? "…"}` : "How are you feeling?"}
              </p>
            </div>
            <span className="text-[20px] text-[#b0a89a]">{showFeelings ? "↑" : "↓"}</span>
          </button>

          {showFeelings && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {FEELINGS.map(f => (
                <button
                  key={f.emoji}
                  onClick={() => { setSelectedFeeling(f.emoji); setShowFeelings(false); }}
                  className="flex flex-col items-center gap-1 py-3 rounded-2xl transition-all active:scale-90"
                  style={{
                    background: selectedFeeling === f.emoji ? `${SAGE}18` : `${SAGE}08`,
                    border: selectedFeeling === f.emoji ? `2px solid ${SAGE}` : "2px solid transparent",
                  }}
                >
                  <span className="text-2xl">{f.emoji}</span>
                  <span className="text-[10px] font-semibold" style={{ color: MUTED }}>{f.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Wonder Spark ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-black" style={{ color: TEXT }}>✨ Wonder Spark</h2>
            <button
              onClick={drawSpark}
              className="px-4 py-2 rounded-xl text-[13px] font-bold text-white"
              style={{ background: SAGE }}
            >
              Surprise me!
            </button>
          </div>

          {spark ? (
            <div
              className="p-5 rounded-3xl flex items-center gap-4"
              style={{
                background: `linear-gradient(135deg, ${SAGE}15, ${SAGE}06)`,
                border: `1.5px solid ${SAGE}25`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: `${SAGE}18` }}
              >
                {spark.emoji}
              </div>
              <div>
                <p className="text-[20px] font-black" style={{ color: TEXT }}>{spark.title}</p>
                <p className="text-[14px] mt-1" style={{ color: MUTED }}>{spark.desc}</p>
              </div>
            </div>
          ) : (
            <div
              className="p-5 rounded-3xl text-center"
              style={{ background: `${SAGE}08`, border: `1.5px dashed ${SAGE}30` }}
            >
              <p className="text-[15px]" style={{ color: MUTED }}>
                Tap "Surprise me!" to get an idea for something fun to do 🌟
              </p>
            </div>
          )}
        </div>

        {/* ── All activities ── */}
        <div>
          <h2 className="text-[18px] font-black mb-3" style={{ color: TEXT }}>Things to explore</h2>
          <div className="grid grid-cols-2 gap-3">
            {ACTIVITIES.map((a, i) => (
              <button
                key={i}
                className="p-4 rounded-2xl text-left flex flex-col gap-2 transition-all active:scale-95"
                style={{ background: "white", border: `1px solid ${BORDER}` }}
              >
                <span className="text-2xl">{a.emoji}</span>
                <div>
                  <p className="text-[14px] font-bold leading-tight" style={{ color: TEXT }}>{a.title}</p>
                  <p className="text-[11px] mt-0.5 leading-snug" style={{ color: MUTED }}>{a.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── My routines (age-appropriate habits) ── */}
        <div>
          <h2 className="text-[20px] font-black mb-3" style={{ color: TEXT }}>
            My routines
          </h2>
          <p className="text-[13px] mb-4" style={{ color: MUTED }}>
            Little things done each day add up to something wonderful.
            No pressure — just notice what you did! ✨
          </p>

          {habits.length > 0 && (
            <div className="flex flex-col gap-2.5 mb-3">
              {habits.map(h => {
                const done = isDoneToday(h);
                return (
                  <button
                    key={h.id}
                    onClick={() => !done && void completeHabit(h.id)}
                    disabled={done || completingHabit === h.id}
                    className="w-full p-4 rounded-2xl flex items-center gap-4 text-left transition-all active:scale-98"
                    style={{
                      background: done ? `${SAGE}15` : "white",
                      border: `2px solid ${done ? `${SAGE}40` : BORDER}`,
                      cursor: done ? "default" : "pointer",
                    }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ background: done ? `${SAGE}20` : `${SAGE}08` }}
                    >
                      {completingHabit === h.id ? "⏳" : done ? "✅" : h.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="text-[17px] font-black" style={{ color: TEXT }}>{h.name}</p>
                      {done ? (
                        <p className="text-[13px] font-semibold mt-0.5" style={{ color: SAGE }}>
                          Done today! You did it! 🌟
                        </p>
                      ) : (
                        <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
                          Tap to check it off
                        </p>
                      )}
                      {h.current_streak > 1 && (
                        <p className="text-[12px] mt-0.5 font-bold" style={{ color: SAGE }}>
                          🔥 {h.current_streak} days in a row!
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setShowAddHabit(true)}
            className="w-full py-3 rounded-2xl text-[16px] font-bold text-white"
            style={{ background: SAGE }}
          >
            + Add something to my routine
          </button>
        </div>

        {/* ── Safe space note ── */}
        <div
          className="p-4 rounded-2xl text-center"
          style={{ background: `${SAGE}08` }}
        >
          <p className="text-[13px]" style={{ color: MUTED }}>
            🌱 This is your safe space. There are no wrong answers here.
            <br />You're doing great just by being you.
          </p>
        </div>
      </div>
      )}

      {/* Add routine modal */}
      {showAddHabit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: "rgba(26,25,22,0.40)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-sm rounded-3xl pb-6"
            style={{ background: CREAM, boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[22px] font-black" style={{ color: TEXT }}>What do you want to do?</h3>
                <button onClick={() => { setShowAddHabit(false); setHabitPick(null); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[18px]"
                  style={{ background: `${SAGE}12`, color: MUTED }}>×</button>
              </div>
              <p className="text-[14px] mb-4" style={{ color: MUTED }}>
                Pick something you'd like to remember each day. You can change it whenever you want!
              </p>
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {KIDS_HABIT_SUGGESTIONS.map(s => (
                  <button
                    key={s.name}
                    onClick={() => setHabitPick(s)}
                    className="p-3.5 rounded-2xl flex items-center gap-2.5 transition-all text-left"
                    style={{
                      background: habitPick?.name === s.name ? `${SAGE}20` : "white",
                      border: `2px solid ${habitPick?.name === s.name ? SAGE : BORDER}`,
                    }}
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="text-[13px] font-bold" style={{ color: TEXT }}>{s.name}</span>
                  </button>
                ))}
              </div>
              {habitPick && (
                <button
                  onClick={() => void addHabit(habitPick.name, habitPick.emoji)}
                  className="w-full py-3.5 rounded-2xl text-[17px] font-black text-white"
                  style={{ background: SAGE }}
                >
                  {habitPick.emoji} Add "{habitPick.name}"!
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
