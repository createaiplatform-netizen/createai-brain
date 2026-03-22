// ─── Kids Universe ────────────────────────────────────────────────────────────
// Gentle, wonder-filled, safe space for family children.
// No comparisons. No embarrassment. Big text. Bright but warm tones.
// Family Universe Standing Law always active.

import { useState, useEffect } from "react";
import { generateIdentity } from "@/lib/identityEngine";

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

export default function KidsUniversePage() {
  const [identity, setIdentity] = useState<FamilyIdentity | null>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [showFeelings, setShowFeelings] = useState(false);
  const [spark, setSpark] = useState<(typeof ACTIVITIES)[number] | null>(null);

  useEffect(() => {
    void loadIdentity();
  }, []);

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
    </div>
  );
}
