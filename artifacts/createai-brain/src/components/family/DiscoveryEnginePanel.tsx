/**
 * DiscoveryEnginePanel.tsx
 * Family discovery: seasonal adventures, growth paths, story challenges,
 * family games, creative prompts, and weekly challenge calendar.
 * localStorage-backed. Uses /api/ai/generate for AI content when available.
 */
import React, { useState, useEffect, useCallback } from "react";

const SAGE    = "#9CAF88";
const SAGE_D  = "#7a9068";
const WARM    = "#fdf8f0";
const TEXT    = "#2d2a24";
const MUTED   = "#6b6560";
const BORDER  = "rgba(0,0,0,0.07)";

const LS_COMPLETED = "family_discovery_completed_v1";

interface Challenge {
  id:       string;
  title:    string;
  desc:     string;
  emoji:    string;
  category: "story" | "game" | "adventure" | "creative" | "growth" | "seasonal";
  duration: string;
  age:      string;
  season?:  string;
}

// ─── Static challenge library ─────────────────────────────────────────────────
const CHALLENGES: Challenge[] = [
  // Stories
  { id: "s1", title: "Round-Robin Story", desc: "Each family member adds one sentence. Where does the story go?", emoji: "📖", category: "story", duration: "15 min", age: "All ages" },
  { id: "s2", title: "Finish the Story", desc: "Start with: 'One morning, a mysterious package arrived at the door…' Everyone writes or tells their ending.", emoji: "🖊️", category: "story", duration: "20 min", age: "All ages" },
  { id: "s3", title: "Family Legend", desc: "Tell a story where every family member is a hero. What is the quest?", emoji: "⚔️", category: "story", duration: "25 min", age: "6+" },
  { id: "s4", title: "The Kindness Hero", desc: "Create a superhero whose power is kindness. What do they do? Draw them together.", emoji: "🦸", category: "story", duration: "30 min", age: "All ages" },

  // Games
  { id: "g1", title: "Gratitude Scavenger Hunt", desc: "Find 5 things in your home you are grateful for. Share why each one matters.", emoji: "🔍", category: "game", duration: "15 min", age: "All ages" },
  { id: "g2", title: "Family Trivia Night", desc: "Each person asks 3 trivia questions about themselves. Who knows each other best?", emoji: "🎯", category: "game", duration: "30 min", age: "All ages" },
  { id: "g3", title: "Compliment Chain", desc: "Go around the circle — each person gives a genuine compliment to the next person.", emoji: "💛", category: "game", duration: "10 min", age: "All ages" },
  { id: "g4", title: "Memory Map", desc: "Draw a map of your favorite family memory together. What details do you remember?", emoji: "🗺️", category: "game", duration: "25 min", age: "5+" },

  // Adventures
  { id: "a1", title: "Backyard Safari", desc: "Explore your backyard or local park. Find and sketch 5 living things you've never noticed before.", emoji: "🌿", category: "adventure", duration: "45 min", age: "All ages" },
  { id: "a2", title: "Sunset Watch", desc: "Stop everything, go outside, and watch the sunset together. No phones. Just presence.", emoji: "🌅", category: "adventure", duration: "20 min", age: "All ages" },
  { id: "a3", title: "Family Walk Interview", desc: "On a walk, interview each family member with 3 questions. Record on paper or voice memo.", emoji: "🎙️", category: "adventure", duration: "30 min", age: "All ages" },
  { id: "a4", title: "Stargazing Night", desc: "Lay out a blanket at night. Find 3 constellations. Make up a story about one.", emoji: "⭐", category: "adventure", duration: "40 min", age: "All ages" },

  // Creative
  { id: "c1", title: "Family Portrait Challenge", desc: "Everyone draws a portrait of the family member on their left. Gallery show at the end!", emoji: "🎨", category: "creative", duration: "20 min", age: "All ages" },
  { id: "c2", title: "Collaborative Mural", desc: "One large paper. Each person has 5 minutes to add to the drawing. No erasing!", emoji: "🖼️", category: "creative", duration: "30 min", age: "All ages" },
  { id: "c3", title: "Family Song", desc: "Write 4 lines of a family song together. Pick a tune you all know. Perform it.", emoji: "🎵", category: "creative", duration: "25 min", age: "All ages" },
  { id: "c4", title: "Dream Home Blueprint", desc: "Design your dream family home together. What rooms does it have? Who gets what space?", emoji: "🏡", category: "creative", duration: "30 min", age: "All ages" },

  // Growth
  { id: "gr1", title: "30-Day Kindness Chain", desc: "Every day, each person does one small kind thing. Track it on paper. See the chain grow!", emoji: "💪", category: "growth", duration: "30 days", age: "All ages" },
  { id: "gr2", title: "Skill Swap", desc: "Each family member teaches another something they know. What will you learn from each other?", emoji: "🔄", category: "growth", duration: "1 hour", age: "8+" },
  { id: "gr3", title: "Family Goal Board", desc: "Each person shares one personal goal. Write them all on a board. Check in weekly.", emoji: "🎯", category: "growth", duration: "20 min", age: "All ages" },
  { id: "gr4", title: "Acts of Service Day", desc: "Pick one day where each family member does one thing to help another without being asked.", emoji: "🤝", category: "growth", duration: "1 day", age: "All ages" },

  // Seasonal
  { id: "se1", title: "Spring Nature Journal", desc: "Observe and sketch 7 signs of spring over 7 days. Share your journal at the end of the week.", emoji: "🌸", category: "seasonal", season: "Spring", duration: "7 days", age: "All ages" },
  { id: "se2", title: "Summer Adventure List", desc: "Brainstorm 20 summer adventures. Pick 5 you'll actually do. Start planning!", emoji: "☀️", category: "seasonal", season: "Summer", duration: "1 hour", age: "All ages" },
  { id: "se3", title: "Harvest Gratitude Jar", desc: "Each day in November, write one thing you're grateful for. Open all the notes on Thanksgiving.", emoji: "🍂", category: "seasonal", season: "Autumn", duration: "30 days", age: "All ages" },
  { id: "se4", title: "Winter Kindness Advent", desc: "Create 25 family kindness acts for December. One per day. Track them on a calendar.", emoji: "❄️", category: "seasonal", season: "Winter", duration: "25 days", age: "All ages" },
];

// ─── Growth Paths ─────────────────────────────────────────────────────────────
const GROWTH_PATHS = [
  {
    id: "gp1", title: "Empathy Builder",  emoji: "💛", color: "#f59e0b",
    desc: "A 4-week path to deepen your family's empathy and compassion muscles.",
    weeks: [
      { week: 1, focus: "Listen to understand, not to reply",   action: "Each day, let someone finish speaking before responding." },
      { week: 2, focus: "Name feelings without judgment",        action: "Practice saying 'I feel…' instead of 'You made me…'" },
      { week: 3, focus: "Acts of invisible kindness",           action: "Do one kind thing for a family member without telling them." },
      { week: 4, focus: "Gratitude for being known",            action: "Write a note about something you love about each family member." },
    ],
  },
  {
    id: "gp2", title: "Creativity Lab",   emoji: "🎨", color: "#f97316",
    desc: "A 4-week path to unlock your family's creative potential together.",
    weeks: [
      { week: 1, focus: "No wrong answers",    action: "Brainstorm without editing. Write everything. Filter nothing." },
      { week: 2, focus: "Make something ugly", action: "Create art together with the goal of making it deliberately imperfect." },
      { week: 3, focus: "Remix a classic",     action: "Take a fairy tale and rewrite it from the villain's perspective." },
      { week: 4, focus: "Public debut",        action: "Share one creative work with someone outside your family." },
    ],
  },
  {
    id: "gp3", title: "Resilience Path",  emoji: "💪", color: "#10b981",
    desc: "A 4-week path to build emotional resilience together as a family.",
    weeks: [
      { week: 1, focus: "Name the hard thing",         action: "Each day, identify one challenge without immediately trying to fix it." },
      { week: 2, focus: "Small wins compound",         action: "Celebrate one small win per person each evening." },
      { week: 3, focus: "What we can control",         action: "Sort family worries into: can control, can influence, can release." },
      { week: 4, focus: "Gratitude in hard moments",   action: "Find one thing to be grateful for even on a difficult day." },
    ],
  },
];

// ─── AI Story Generator ───────────────────────────────────────────────────────
function AIStoryPromptGenerator() {
  const [theme,  setTheme]  = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const THEMES = ["Kindness", "Adventure", "Courage", "Friendship", "Discovery", "Magic", "Teamwork", "Home"];

  const generate = useCallback(async () => {
    const t = theme || "Family adventure";
    setLoading(true);
    setResult("");
    try {
      const r = await fetch("/api/ai/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          prompt: `Create a short, warm family story starter (3-4 sentences) for the theme "${t}". It should spark imagination and be suitable for all ages. End with an open-ended question that invites children to continue the story.`,
          max_tokens: 200,
        }),
      });
      const data = await r.json() as { text?: string; result?: string; content?: string };
      setResult(data.text ?? data.result ?? data.content ?? "");
    } catch {
      setResult("Once upon a time, in a cozy house where the windows glowed orange at night, a family discovered something extraordinary in their backyard… What do you think they found?");
    } finally {
      setLoading(false);
    }
  }, [theme]);

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: WARM, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">✨</span>
        <p className="font-bold text-[14px]" style={{ color: TEXT }}>AI Story Starter</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {THEMES.map(t => (
          <button key={t} onClick={() => setTheme(t)}
            className="text-[11px] px-3 py-1 rounded-full border"
            style={{ background: theme === t ? `${SAGE}15` : "white", borderColor: theme === t ? SAGE : BORDER, color: theme === t ? SAGE_D : MUTED }}>
            {t}
          </button>
        ))}
      </div>
      <button onClick={generate} disabled={loading}
        className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: `linear-gradient(135deg, ${SAGE_D}, ${SAGE})` }}>
        {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Generating…</span></> : "✨ Generate Story Starter"}
      </button>
      {result && (
        <div className="rounded-xl px-4 py-3" style={{ background: "white", border: `1px solid ${BORDER}` }}>
          <p className="text-[13px] leading-relaxed italic" style={{ color: TEXT }}>{result}</p>
        </div>
      )}
    </div>
  );
}

// ─── Challenge Card ───────────────────────────────────────────────────────────
function ChallengeCard({ challenge, completed, onToggle }: {
  challenge: Challenge;
  completed: boolean;
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const CAT_COLORS: Record<string, string> = {
    story: "#8b5cf6", game: "#f59e0b", adventure: "#10b981",
    creative: "#f97316", growth: "#3b82f6", seasonal: SAGE_D,
  };
  const color = CAT_COLORS[challenge.category] ?? SAGE_D;

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: "white", border: `1px solid ${completed ? color + "40" : BORDER}`, opacity: completed ? 0.75 : 1 }}>
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-start gap-3 p-4 text-left">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: color + "15" }}>
          {challenge.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[13px]" style={{ color: TEXT, textDecoration: completed ? "line-through" : "none" }}>{challenge.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize" style={{ background: color + "15", color }}>{challenge.category}</span>
            <span className="text-[10px]" style={{ color: MUTED }}>⏱️ {challenge.duration}</span>
            <span className="text-[10px]" style={{ color: MUTED }}>👨‍👩‍👧 {challenge.age}</span>
            {challenge.season && <span className="text-[10px]" style={{ color: MUTED }}>🍂 {challenge.season}</span>}
          </div>
        </div>
        {completed && <span className="text-[12px] flex-shrink-0" style={{ color: SAGE_D }}>✓ Done</span>}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: BORDER }}>
          <p className="text-[12px] leading-relaxed pt-3 mb-3" style={{ color: MUTED }}>{challenge.desc}</p>
          <button onClick={() => onToggle(challenge.id)}
            className="px-4 py-2 rounded-xl text-[12px] font-bold text-white"
            style={{ background: completed ? "#94a3b8" : `linear-gradient(135deg, ${SAGE_D}, ${SAGE})` }}>
            {completed ? "Mark as not done" : "Mark as complete ✓"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
type DiscovTab = "challenges" | "paths" | "stories" | "seasonal";

const DISC_TABS: { id: DiscovTab; label: string; icon: string }[] = [
  { id: "challenges", label: "Challenges", icon: "🎯" },
  { id: "paths",      label: "Growth Paths", icon: "🌱" },
  { id: "stories",    label: "Story Lab",  icon: "📖" },
  { id: "seasonal",   label: "Seasonal",   icon: "🍂" },
];

const CAT_FILTERS = [
  { id: "all",       label: "All" },
  { id: "game",      label: "Games" },
  { id: "adventure", label: "Adventures" },
  { id: "creative",  label: "Creative" },
  { id: "growth",    label: "Growth" },
];

export function DiscoveryEnginePanel() {
  const [tab,       setTab]       = useState<DiscovTab>("challenges");
  const [catFilter, setCatFilter] = useState("all");
  const [completed, setCompleted] = useState<string[]>([]);
  const [activeGP,  setActiveGP]  = useState<string | null>(null);

  useEffect(() => { setCompleted(loadJ<string[]>(LS_COMPLETED, [])); }, []);

  function loadJ<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } }

  const toggleComplete = (id: string) => {
    const next = completed.includes(id) ? completed.filter(c => c !== id) : [...completed, id];
    setCompleted(next);
    localStorage.setItem(LS_COMPLETED, JSON.stringify(next));
  };

  const visibleChallenges = CHALLENGES.filter(c => {
    if (tab === "seasonal") return c.category === "seasonal";
    if (catFilter !== "all") return c.category === catFilter;
    return c.category !== "seasonal";
  });

  const activePath = GROWTH_PATHS.find(p => p.id === activeGP);

  // Get current season
  const month  = new Date().getMonth() + 1;
  const season = month >= 3 && month <= 5 ? "Spring" : month >= 6 && month <= 8 ? "Summer" : month >= 9 && month <= 11 ? "Autumn" : "Winter";
  const SEASON_EMOJIS: Record<string, string> = { Spring: "🌸", Summer: "☀️", Autumn: "🍂", Winter: "❄️" };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, #1a2e1a, #2d4a2d)` }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🌍</span>
          <div>
            <p className="font-bold text-[16px] text-white">Discovery Engine</p>
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.5)" }}>Adventures, challenges, stories, and growth paths for your family</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-full text-[11px] font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
            {SEASON_EMOJIS[season]} {season} season
          </div>
          <div className="px-3 py-1.5 rounded-full text-[11px] font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
            ✓ {completed.length} completed
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {DISC_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-semibold border"
            style={{ background: tab === t.id ? SAGE_D : "white", color: tab === t.id ? "white" : TEXT, borderColor: tab === t.id ? SAGE_D : BORDER }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Challenges tab */}
      {tab === "challenges" && (
        <>
          <div className="flex gap-1.5 flex-wrap">
            {CAT_FILTERS.map(f => (
              <button key={f.id} onClick={() => setCatFilter(f.id)}
                className="text-[11px] px-3 py-1 rounded-full border"
                style={{ background: catFilter === f.id ? SAGE_D : "white", color: catFilter === f.id ? "white" : MUTED, borderColor: catFilter === f.id ? SAGE_D : BORDER }}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {visibleChallenges.map(c => (
              <ChallengeCard key={c.id} challenge={c} completed={completed.includes(c.id)} onToggle={toggleComplete} />
            ))}
          </div>
        </>
      )}

      {/* Growth Paths */}
      {tab === "paths" && (
        <div className="space-y-3">
          {!activeGP ? (
            GROWTH_PATHS.map(p => (
              <button key={p.id} onClick={() => setActiveGP(p.id)}
                className="w-full rounded-2xl p-5 text-left" style={{ background: "white", border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{p.emoji}</span>
                  <div>
                    <p className="font-bold text-[14px]" style={{ color: TEXT }}>{p.title}</p>
                    <p className="text-[10px] px-2 py-0.5 rounded-full inline-block" style={{ background: p.color + "15", color: p.color }}>4-week journey</p>
                  </div>
                </div>
                <p className="text-[12px]" style={{ color: MUTED }}>{p.desc}</p>
              </button>
            ))
          ) : activePath ? (
            <div className="space-y-3">
              <button onClick={() => setActiveGP(null)} className="text-[12px] font-semibold" style={{ color: SAGE_D }}>← Back to paths</button>
              <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${activePath.color}12, ${activePath.color}06)`, border: `1px solid ${activePath.color}25` }}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{activePath.emoji}</span>
                  <div>
                    <p className="font-bold text-[16px]" style={{ color: TEXT }}>{activePath.title}</p>
                    <p className="text-[12px]" style={{ color: MUTED }}>{activePath.desc}</p>
                  </div>
                </div>
              </div>
              {activePath.weeks.map(w => (
                <div key={w.week} className="rounded-2xl p-4" style={{ background: "white", border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black text-white" style={{ background: activePath.color }}>
                      {w.week}
                    </div>
                    <p className="font-bold text-[13px]" style={{ color: TEXT }}>Week {w.week}: {w.focus}</p>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: MUTED }}>{w.action}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Story Lab */}
      {tab === "stories" && (
        <div className="space-y-3">
          <AIStoryPromptGenerator />
          {CHALLENGES.filter(c => c.category === "story").map(c => (
            <ChallengeCard key={c.id} challenge={c} completed={completed.includes(c.id)} onToggle={toggleComplete} />
          ))}
        </div>
      )}

      {/* Seasonal */}
      {tab === "seasonal" && (
        <div className="space-y-3">
          <div className="rounded-xl px-4 py-3" style={{ background: `${SAGE}12`, border: `1px solid ${SAGE}25` }}>
            <p className="text-[13px] font-semibold" style={{ color: SAGE_D }}>Currently: {SEASON_EMOJIS[season]} {season}</p>
            <p className="text-[11px]" style={{ color: MUTED }}>Seasonal challenges are designed for this time of year.</p>
          </div>
          {visibleChallenges.map(c => (
            <ChallengeCard key={c.id} challenge={c} completed={completed.includes(c.id)} onToggle={toggleComplete} />
          ))}
        </div>
      )}
    </div>
  );
}
