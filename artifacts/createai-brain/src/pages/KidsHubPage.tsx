// ─── KidsHubPage — Family Universe Standing Law applies in full ───────────────
// Warm, joyful, safe. No comparisons. No rankings. No embarrassment.
// Age-appropriate layout: bigger text, fun icons, gentle navigation.

import { useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { CreationAffirmation } from "@/components/WonderSpark";

const SAGE = "#7a9068";
const CREAM = "#faf9f6";
const WARM_SAND = "#c4a97a";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.15)";

// Wonder palette — warm, bright, never harsh
const WONDER_COLORS = ["#e8826a", "#7a9068", "#c4a97a", "#6a8db5", "#9a7ab5", "#6aab8a", "#d4845a"];

const KIDS_TOOLS = [
  {
    id: "story",
    icon: "📖",
    label: "My Story",
    description: "Write your own adventure",
    color: "#e8826a",
    affirmation: "Your story is wonderful — keep creating!",
  },
  {
    id: "drawing",
    icon: "🎨",
    label: "Art Corner",
    description: "Make something colorful",
    color: "#7a9068",
    affirmation: "Your art is beautiful. Every creation is yours!",
  },
  {
    id: "journal",
    icon: "📔",
    label: "My Journal",
    description: "Your private thoughts and feelings",
    color: "#c4a97a",
    affirmation: "Thank you for sharing. Your feelings always matter.",
  },
  {
    id: "poems",
    icon: "🌟",
    label: "Poems & Rhymes",
    description: "Play with words and sounds",
    color: "#6a8db5",
    affirmation: "What a beautiful poem! You have a gift with words.",
  },
  {
    id: "ideas",
    icon: "💡",
    label: "Big Ideas",
    description: "Things I want to make or do",
    color: "#9a7ab5",
    affirmation: "That idea is amazing. Dream as big as you want!",
  },
  {
    id: "memories",
    icon: "📸",
    label: "Memories",
    description: "Favorite moments I want to remember",
    color: "#6aab8a",
    affirmation: "What a beautiful memory. Thank you for saving it here.",
  },
  {
    id: "wishes",
    icon: "🌈",
    label: "Wish List",
    description: "Things I'm hoping for",
    color: "#d4845a",
    affirmation: "Every wish matters. Keep dreaming!",
  },
  {
    id: "learning",
    icon: "🔭",
    label: "Things I Learned",
    description: "Cool stuff I discovered today",
    color: "#7a9068",
    affirmation: "Learning new things is a superpower. Keep going!",
  },
];

export default function KidsHubPage() {
  const { user, logout } = useAuth();
  const [lastAffirmation, setLastAffirmation] = useState<{ message: string; color: string } | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const displayName = user?.firstName ?? "Friend";

  function handleToolClick(tool: typeof KIDS_TOOLS[0]) {
    setActiveTool(tool.id === activeTool ? null : tool.id);
  }

  function handleSave(tool: typeof KIDS_TOOLS[0]) {
    setLastAffirmation({ message: tool.affirmation, color: tool.color });
    setActiveTool(null);
  }

  return (
    <div className="min-h-screen" style={{ background: CREAM }}>
      {/* Top bar — simple and friendly */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between px-5 py-4"
        style={{
          background: "rgba(250,249,246,0.94)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: `${SAGE}18` }}
          >
            🌱
          </div>
          <div>
            <p className="text-[16px] font-bold" style={{ color: TEXT }}>
              Hi, {displayName}! 👋
            </p>
            <p className="text-[11px]" style={{ color: MUTED }}>
              Your safe creative space
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="text-[12px] px-3 py-1.5 rounded-xl font-medium"
          style={{ background: "rgba(0,0,0,0.05)", color: MUTED }}
        >
          Sign out
        </button>
      </div>

      {/* Affirmation pop-up (Family Universe Standing Law) */}
      {lastAffirmation && (
        <CreationAffirmation
          message={lastAffirmation.message}
          color={lastAffirmation.color}
          onDone={() => setLastAffirmation(null)}
        />
      )}

      <div className="max-w-lg mx-auto px-5 py-8 flex flex-col gap-7">
        {/* Hero greeting */}
        <div
          className="rounded-3xl p-6 text-center"
          style={{
            background: `linear-gradient(135deg, ${SAGE}14 0%, ${WARM_SAND}14 100%)`,
            border: `1px solid ${BORDER}`,
          }}
        >
          <div className="text-5xl mb-3">✨</div>
          <h1 className="text-[22px] font-black" style={{ color: TEXT }}>
            What do you want to make today?
          </h1>
          <p className="text-[14px] mt-1.5" style={{ color: MUTED }}>
            Everything here is just for you. No one can judge your creations — they're yours.
          </p>
        </div>

        {/* Tool grid */}
        <div className="grid grid-cols-2 gap-3">
          {KIDS_TOOLS.map(tool => (
            <div key={tool.id} className="flex flex-col gap-2">
              {/* Tool card */}
              <button
                onClick={() => handleToolClick(tool)}
                className="flex flex-col items-start gap-3 p-4 rounded-2xl text-left transition-all active:scale-[0.97]"
                style={{
                  background: activeTool === tool.id ? `${tool.color}10` : "white",
                  border: `2px solid ${activeTool === tool.id ? tool.color + "60" : BORDER}`,
                  boxShadow: activeTool === tool.id
                    ? `0 4px 16px ${tool.color}20`
                    : "0 1px 6px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: `${tool.color}14` }}
                >
                  {tool.icon}
                </div>
                <div>
                  <p className="text-[14px] font-bold leading-tight" style={{ color: TEXT }}>
                    {tool.label}
                  </p>
                  <p className="text-[11px] mt-0.5 leading-snug" style={{ color: MUTED }}>
                    {tool.description}
                  </p>
                </div>
              </button>

              {/* Expanded save button */}
              {activeTool === tool.id && (
                <button
                  onClick={() => handleSave(tool)}
                  className="w-full py-2.5 rounded-xl font-bold text-[13px] text-white transition-all active:scale-95"
                  style={{ background: tool.color }}
                >
                  Save ✓
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Safety note — warm, not scary */}
        <div
          className="p-4 rounded-2xl text-center"
          style={{ background: `${SAGE}0a`, border: `1px solid ${SAGE}18` }}
        >
          <p className="text-[13px]" style={{ color: MUTED }}>
            🔒 This is your private space. Only you and your family can see what you make here.
          </p>
        </div>
      </div>
    </div>
  );
}
