/**
 * EmotionalSafetyPanel.tsx
 * Kid-friendly emotional expression tools + parent response tools.
 * Gentle, warm, non-judgmental. localStorage-backed. No AI required.
 */
import React, { useState, useEffect } from "react";

const SAGE    = "#9CAF88";
const SAGE_D  = "#7a9068";
const WARM    = "#fdf8f0";
const TEXT    = "#2d2a24";
const MUTED   = "#6b6560";
const BORDER  = "rgba(0,0,0,0.07)";

const LS_FEELINGS = "family_feelings_v1";
const LS_CHECKINS = "family_checkins_v1";

interface FeelingLog  { id: string; who: string; feeling: string; emoji: string; note: string; date: string; parentSeen: boolean; parentReply: string }
interface DailyCheckin { id: string; who: string; energy: number; mood: string; oneWord: string; date: string }

function uid() { return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2); }
function loadJ<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } }
function saveJ(k: string, v: unknown) { localStorage.setItem(k, JSON.stringify(v)); }

const FEELINGS = [
  { emoji: "😊", label: "Happy",    color: "#f59e0b", intensity: "good"    },
  { emoji: "😌", label: "Calm",     color: "#10b981", intensity: "good"    },
  { emoji: "😔", label: "Sad",      color: "#60a5fa", intensity: "hard"    },
  { emoji: "😤", label: "Frustrated",color: "#f97316", intensity: "hard"   },
  { emoji: "😟", label: "Worried",  color: "#8b5cf6", intensity: "hard"    },
  { emoji: "😡", label: "Angry",    color: "#ef4444", intensity: "hard"    },
  { emoji: "😴", label: "Tired",    color: "#94a3b8", intensity: "neutral" },
  { emoji: "🤩", label: "Excited",  color: "#f59e0b", intensity: "good"    },
  { emoji: "😕", label: "Confused", color: "#f97316", intensity: "neutral" },
  { emoji: "💙", label: "Loved",    color: SAGE_D,    intensity: "good"    },
  { emoji: "😥", label: "Hurt",     color: "#ec4899", intensity: "hard"    },
  { emoji: "🌟", label: "Proud",    color: "#f59e0b", intensity: "good"    },
];

const GENTLE_PROMPTS: Record<string, string[]> = {
  "Sad":        ["It's ok to feel sad. Your feelings are real.", "Would you like to talk about it, or just be heard?", "Is there something that would help you feel a little better?"],
  "Frustrated": ["Frustration is so hard. You're not alone.", "What happened? You can share as much or as little as you want.", "It's ok to feel this way. We're here."],
  "Worried":    ["Worry can feel so heavy. You're safe here.", "What is your worry about? Sometimes saying it helps.", "You don't have to carry this alone."],
  "Angry":      ["Anger is a signal that something matters to you.", "When you're ready, we'd love to understand what's going on.", "You're safe to feel this here."],
  "Hurt":       ["I'm so sorry you're hurting. Your feelings matter.", "You don't have to explain everything. Just know we care.", "We're here with you."],
};

const PARENT_RESPONSES = [
  "I see you. I hear you. 💛",
  "Thank you for sharing this with me.",
  "I love you no matter what you're feeling.",
  "Would you like a hug?",
  "You're so brave for telling me this.",
  "I'm proud of you for sharing your feelings.",
  "We can talk about it whenever you're ready.",
  "Is there anything I can do to help?",
  "That sounds really hard. I'm here.",
  "Your feelings make sense. I understand.",
];

// ─── Feeling Expression (for kids) ───────────────────────────────────────────
function FeelingExpressionTool({ who }: { who: string }) {
  const [step,    setStep]    = useState<"pick" | "note" | "sent">("pick");
  const [picked,  setPicked]  = useState<typeof FEELINGS[number] | null>(null);
  const [note,    setNote]    = useState("");
  const [logs,    setLogs]    = useState<FeelingLog[]>([]);

  useEffect(() => { setLogs(loadJ(LS_FEELINGS, [])); }, []);

  const submit = () => {
    if (!picked) return;
    const entry: FeelingLog = {
      id: uid(), who, feeling: picked.label, emoji: picked.emoji,
      note: note.trim(), date: new Date().toISOString(),
      parentSeen: false, parentReply: "",
    };
    const next = [entry, ...logs];
    saveJ(LS_FEELINGS, next);
    setLogs(next);
    setStep("sent");
  };

  const prompt = picked ? GENTLE_PROMPTS[picked.label]?.[0] : null;
  const todayLog = logs.find(l => l.who === who && new Date(l.date).toDateString() === new Date().toDateString());

  if (step === "sent") return (
    <div className="rounded-2xl p-6 text-center" style={{ background: `linear-gradient(135deg, ${SAGE}15, ${SAGE_D}08)`, border: `1px solid ${SAGE}25` }}>
      <div className="text-5xl mb-3">{picked?.emoji}</div>
      <p className="font-bold text-[16px] mb-2" style={{ color: TEXT }}>Thank you for sharing. 💛</p>
      <p className="text-[13px] mb-4" style={{ color: MUTED }}>Your feelings are safe here. Someone who loves you will see this.</p>
      {prompt && <p className="text-[12px] italic" style={{ color: SAGE_D }}>{prompt}</p>}
      <button onClick={() => { setStep("pick"); setPicked(null); setNote(""); }}
        className="mt-4 px-5 py-2 rounded-xl text-[13px] font-semibold"
        style={{ background: "white", border: `1px solid ${BORDER}`, color: TEXT }}>
        Share another
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {todayLog && step === "pick" && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: `${SAGE}12`, border: `1px solid ${SAGE}25` }}>
          <span className="text-lg">{todayLog.emoji}</span>
          <p className="text-[12px]" style={{ color: SAGE_D }}>You shared feeling <b>{todayLog.feeling}</b> today. {todayLog.parentReply ? "Your parent replied! 💛" : ""}</p>
        </div>
      )}

      <div className="rounded-2xl p-4" style={{ background: WARM, border: `1px solid ${BORDER}` }}>
        <p className="font-bold text-[14px] mb-3" style={{ color: TEXT }}>How are you feeling right now, {who}?</p>
        <div className="grid grid-cols-4 gap-2">
          {FEELINGS.map(f => (
            <button key={f.label} onClick={() => { setPicked(f); setStep("note"); }}
              className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all"
              style={{ background: picked?.label === f.label ? f.color + "18" : "white", borderColor: picked?.label === f.label ? f.color : BORDER }}>
              <span className="text-2xl">{f.emoji}</span>
              <span className="text-[9px] font-semibold" style={{ color: TEXT }}>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {step === "note" && picked && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "white", border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <span className="text-3xl">{picked.emoji}</span>
            <div>
              <p className="font-bold text-[13px]" style={{ color: TEXT }}>Feeling {picked.label}</p>
              {prompt && <p className="text-[11px] italic" style={{ color: MUTED }}>{prompt}</p>}
            </div>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            placeholder="Tell us more (or leave it blank — that's ok too) …"
            className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none resize-none"
            style={{ background: "#fafafa", borderColor: BORDER, color: TEXT }} />
          <div className="flex gap-2">
            <button onClick={() => setStep("pick")} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold" style={{ background: "white", border: `1px solid ${BORDER}`, color: MUTED }}>← Back</button>
            <button onClick={submit} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${SAGE_D}, ${SAGE})` }}>Send 💛</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Daily Check-in ───────────────────────────────────────────────────────────
function DailyCheckinPanel({ who }: { who: string }) {
  const [energy,  setEnergy]  = useState(3);
  const [mood,    setMood]    = useState("");
  const [oneWord, setOneWord] = useState("");
  const [done,    setDone]    = useState(false);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);

  const MOODS    = ["🌞 Great", "🌤️ Good", "🌥️ Okay", "🌧️ Tough", "⛈️ Hard"];
  const ENERGIES = [1,2,3,4,5];

  useEffect(() => {
    const saved = loadJ<DailyCheckin[]>(LS_CHECKINS, []);
    setCheckins(saved);
    const today = saved.find(c => c.who === who && new Date(c.date).toDateString() === new Date().toDateString());
    if (today) { setDone(true); setEnergy(today.energy); setMood(today.mood); setOneWord(today.oneWord); }
  }, [who]);

  const submit = () => {
    const entry: DailyCheckin = { id: uid(), who, energy, mood, oneWord: oneWord.trim(), date: new Date().toISOString() };
    const next = [entry, ...checkins.filter(c => !(c.who === who && new Date(c.date).toDateString() === new Date().toDateString()))];
    saveJ(LS_CHECKINS, next);
    setCheckins(next);
    setDone(true);
  };

  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ background: WARM, border: `1px solid ${BORDER}` }}>
      <p className="font-bold text-[14px]" style={{ color: TEXT }}>Daily check-in, {who} 👋</p>

      <div>
        <p className="text-[11px] font-semibold mb-2" style={{ color: MUTED }}>ENERGY LEVEL</p>
        <div className="flex gap-2">
          {ENERGIES.map(e => (
            <button key={e} onClick={() => !done && setEnergy(e)}
              className="flex-1 py-2.5 rounded-xl text-[18px] font-bold border transition-all"
              style={{ background: energy === e ? SAGE_D : "white", borderColor: energy === e ? SAGE_D : BORDER }}>
              {["🪫","😴","🙂","⚡","🚀"][e-1]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold mb-2" style={{ color: MUTED }}>HOW IS TODAY?</p>
        <div className="grid grid-cols-2 gap-1.5">
          {MOODS.map(m => (
            <button key={m} onClick={() => !done && setMood(m)}
              className="px-3 py-2 rounded-xl text-[12px] font-semibold border"
              style={{ background: mood === m ? `${SAGE}15` : "white", borderColor: mood === m ? SAGE : BORDER, color: TEXT }}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold mb-1" style={{ color: MUTED }}>ONE WORD TO DESCRIBE TODAY</p>
        <input value={oneWord} onChange={e => !done && setOneWord(e.target.value)}
          disabled={done} placeholder="e.g. peaceful, tough, exciting…"
          className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
          style={{ background: done ? "#fafafa" : "white", borderColor: BORDER, color: TEXT }} />
      </div>

      {!done ? (
        <button onClick={submit} disabled={!mood}
          className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${SAGE_D}, ${SAGE})` }}>
          Done for today ✓
        </button>
      ) : (
        <div className="rounded-xl px-4 py-3 text-center" style={{ background: `${SAGE}12`, border: `1px solid ${SAGE}25` }}>
          <p className="text-[13px] font-semibold" style={{ color: SAGE_D }}>Check-in complete! 💛 See you tomorrow.</p>
        </div>
      )}
    </div>
  );
}

// ─── Parent Response Panel ────────────────────────────────────────────────────
function ParentResponsePanel() {
  const [logs,  setLogs]  = useState<FeelingLog[]>([]);
  const [reply, setReply] = useState<Record<string, string>>({});

  useEffect(() => { setLogs(loadJ<FeelingLog[]>(LS_FEELINGS, [])); }, []);

  const sendReply = (id: string) => {
    const text = reply[id]?.trim();
    if (!text) return;
    const next = logs.map(l => l.id === id ? { ...l, parentSeen: true, parentReply: text } : l);
    saveJ(LS_FEELINGS, next);
    setLogs(next);
    setReply(r => ({ ...r, [id]: "" }));
  };

  const unseen = logs.filter(l => !l.parentSeen);
  const seen   = logs.filter(l => l.parentSeen).slice(0, 10);

  return (
    <div className="space-y-3">
      {unseen.length > 0 && (
        <div className="rounded-xl px-4 py-2" style={{ background: "#fef9ec", border: "1px solid #fde68a" }}>
          <p className="text-[12px] font-bold" style={{ color: "#92400e" }}>🔔 {unseen.length} unseen feeling{unseen.length > 1 ? "s" : ""} from your family</p>
        </div>
      )}

      {logs.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: WARM, border: `1px solid ${BORDER}` }}>
          <p className="text-3xl mb-2">💛</p>
          <p className="text-[13px] font-semibold mb-1" style={{ color: TEXT }}>Nothing shared yet</p>
          <p className="text-[12px]" style={{ color: MUTED }}>When a family member shares a feeling, it will appear here for you to respond.</p>
        </div>
      )}

      {logs.slice(0, 20).map(l => (
        <div key={l.id} className="rounded-2xl overflow-hidden" style={{ background: "white", border: `1px solid ${l.parentSeen ? BORDER : `${SAGE}40`}` }}>
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{l.emoji}</span>
              <div>
                <p className="font-semibold text-[13px]" style={{ color: TEXT }}>{l.who} felt <b>{l.feeling}</b></p>
                <p className="text-[10px]" style={{ color: MUTED }}>{new Date(l.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              {!l.parentSeen && <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${SAGE}20`, color: SAGE_D }}>New</span>}
            </div>
            {l.note && <p className="text-[12px] mb-2 px-2 py-1.5 rounded-xl" style={{ background: "#fafafa", color: MUTED }}>{l.note}</p>}
            {l.parentReply ? (
              <div className="rounded-xl px-3 py-2" style={{ background: `${SAGE}10`, border: `1px solid ${SAGE}20` }}>
                <p className="text-[10px] font-semibold mb-0.5" style={{ color: SAGE_D }}>Your reply:</p>
                <p className="text-[12px]" style={{ color: TEXT }}>{l.parentReply}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {PARENT_RESPONSES.map(r => (
                    <button key={r} onClick={() => setReply(prev => ({ ...prev, [l.id]: r }))}
                      className="text-[10px] px-2 py-1 rounded-full border"
                      style={{ background: reply[l.id] === r ? `${SAGE}15` : "white", borderColor: reply[l.id] === r ? SAGE : BORDER, color: MUTED }}>
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={reply[l.id] ?? ""} onChange={e => setReply(r => ({ ...r, [l.id]: e.target.value }))}
                    placeholder="Write your own response…"
                    className="flex-1 rounded-xl px-3 py-2 text-[12px] border outline-none"
                    style={{ background: "#fafafa", borderColor: BORDER, color: TEXT }} />
                  <button onClick={() => sendReply(l.id)} disabled={!reply[l.id]?.trim()}
                    className="px-3 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-40"
                    style={{ background: SAGE_D }}>Send 💛</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {seen.length > 0 && unseen.length > 0 && (
        <details className="text-[11px]" style={{ color: MUTED }}>
          <summary className="cursor-pointer px-2">▸ {seen.length} past responses</summary>
        </details>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
type SafeTab = "express" | "checkin" | "parent";

export function EmotionalSafetyPanel({ isParent = false }: { isParent?: boolean }) {
  const [tab,  setTab]  = useState<SafeTab>(isParent ? "parent" : "express");
  const [name, setName] = useState("");
  const [nameSet, setNameSet] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("family_safety_name");
    if (saved) { setName(saved); setNameSet(true); }
  }, []);

  const saveName = () => {
    if (!name.trim()) return;
    localStorage.setItem("family_safety_name", name.trim());
    setNameSet(true);
  };

  const TABS: { id: SafeTab; label: string; icon: string; parentOnly?: boolean }[] = [
    { id: "express", label: "My Feelings", icon: "💛" },
    { id: "checkin", label: "Check-in",    icon: "🌤️" },
    { id: "parent",  label: "Parent View", icon: "👨‍👩‍👦", parentOnly: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, #e8f4e8, #f0f8f0)`, border: `1px solid ${SAGE}30` }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌱</span>
          <div>
            <p className="font-bold text-[15px]" style={{ color: TEXT }}>Emotional Safety Space</p>
            <p className="text-[12px]" style={{ color: MUTED }}>A gentle, judgment-free place to share how you feel.</p>
          </div>
        </div>
        {!nameSet && (
          <div className="mt-3 flex gap-2">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name (e.g. Lily, Dad)"
              className="flex-1 rounded-xl px-3 py-2 text-[13px] border outline-none"
              style={{ background: "white", borderColor: BORDER, color: TEXT }}
              onKeyDown={e => e.key === "Enter" && saveName()} />
            <button onClick={saveName} disabled={!name.trim()} className="px-4 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-40" style={{ background: SAGE_D }}>Go</button>
          </div>
        )}
        {nameSet && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {TABS.filter(t => !t.parentOnly || isParent).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-semibold border"
                style={{ background: tab === t.id ? SAGE_D : "white", color: tab === t.id ? "white" : TEXT, borderColor: tab === t.id ? SAGE_D : BORDER }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {nameSet && (
        <>
          {tab === "express" && <FeelingExpressionTool who={name} />}
          {tab === "checkin" && <DailyCheckinPanel     who={name} />}
          {tab === "parent"  && <ParentResponsePanel />}
        </>
      )}
    </div>
  );
}
