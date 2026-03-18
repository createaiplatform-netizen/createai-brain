import React, { useState, useRef } from "react";
import { streamEngine } from "@/controller";

type Mode = "path" | "lesson" | "quiz" | "mentor";

interface LearningItem {
  id: string;
  mode: Mode;
  topic: string;
  output: string;
  ts: number;
}

const MODE_META: Record<Mode, { label: string; icon: string; color: string; engine: string; hint: string }> = {
  path:   { label: "Learning Path",  icon: "🗺️", color: "#5856D6", engine: "LearningEngine",  hint: "Full curriculum, milestones, resources, and progression for any subject" },
  lesson: { label: "Lesson Design",  icon: "📚", color: "#007AFF", engine: "LearningEngine",  hint: "Structured lesson plan with objectives, activities, assessments" },
  quiz:   { label: "Quiz Generator", icon: "❓", color: "#FF9500", engine: "LearningEngine",  hint: "MCQ, short answer, and scenario-based assessments with answer keys" },
  mentor: { label: "MENTOR Advice",  icon: "🧭", color: "#34C759", engine: "MENTOR",          hint: "Personalized coaching, skill gap analysis, and growth guidance" },
};

export function LearningCenterApp() {
  const [mode, setMode]       = useState<Mode>("path");
  const [topic, setTopic]     = useState("");
  const [loading, setLoading] = useState(false);
  const [stream, setStream]   = useState("");
  const [items, setItems]     = useState<LearningItem[]>([]);
  const [view, setView]       = useState<"run" | "history">("run");
  const abortRef              = useRef<AbortController | null>(null);

  async function run() {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setStream("");
    const meta = MODE_META[mode];
    try {
      await streamEngine({
        engineId: meta.engine,
        topic: `[${meta.label}] ${topic}`,
        onChunk: (chunk) => setStream(s => s + chunk),
        onDone: async (full) => {
          setItems(it => [{ id: crypto.randomUUID(), mode, topic, output: full, ts: Date.now() }, ...it]);
          await fetch("/api/documents", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `[${meta.label}] ${topic}`, content: full, type: "learning" }),
          });
        },
        onError: (err) => setStream(`Error — ${err}`),
      });
    } finally {
      setLoading(false);
    }
  }

  const meta = MODE_META[mode];

  return (
    <div className="flex flex-col h-full" style={{ background: "hsl(220,20%,97%)" }}>
      <div className="px-4 pt-5 pb-4 flex-shrink-0" style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "rgba(88,86,214,0.10)" }}>🎓</div>
          <div>
            <h2 className="font-bold text-[17px]" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Learning Center</h2>
            <p className="text-[12px]" style={{ color: "#94a3b8" }}>Paths · Lessons · Quizzes · Mentorship</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(["run", "history"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
              style={view === v
                ? { background: "#5856D6", color: "white" }
                : { background: "rgba(0,0,0,0.05)", color: "#64748b" }}
            >
              {v === "run" ? "Learn" : `History (${items.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {view === "run" ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(MODE_META) as Mode[]).map(m => {
                const mm   = MODE_META[m];
                const active = mode === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className="p-3 rounded-2xl text-left transition-all border"
                    style={active
                      ? { background: mm.color, color: "white", borderColor: mm.color }
                      : { background: "white", color: "#374151", borderColor: "rgba(0,0,0,0.08)" }}
                  >
                    <div className="text-lg mb-1">{mm.icon}</div>
                    <div className="text-[12px] font-bold">{mm.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-70 leading-tight">{mm.hint.slice(0, 50)}…</div>
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <label className="text-[11px] font-semibold uppercase tracking-wide mb-2 block" style={{ color: "#94a3b8" }}>Subject / Topic</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder={`What would you like to ${meta.label.toLowerCase()}?`}
                className="w-full resize-none text-[14px] outline-none"
                style={{ color: "#0f172a", minHeight: 72, background: "transparent" }}
              />
            </div>

            <button
              onClick={run}
              disabled={loading || !topic.trim()}
              className="w-full py-3 rounded-2xl font-bold text-[14px] text-white transition-all"
              style={{ background: loading ? "#c7d2fe" : meta.color, opacity: !topic.trim() ? 0.5 : 1 }}
            >
              {loading ? "Generating…" : `Generate ${meta.label}`}
            </button>

            {(loading || stream) && (
              <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: meta.color }} />
                  <span className="text-[11px] font-semibold" style={{ color: meta.color }}>
                    {loading ? `${meta.icon} Streaming…` : "Complete — saved to Documents"}
                  </span>
                </div>
                <pre className="text-[13px] leading-relaxed whitespace-pre-wrap font-sans" style={{ color: "#1e293b" }}>{stream}</pre>
              </div>
            )}
          </>
        ) : (
          items.length === 0 ? (
            <div className="text-center py-16" style={{ color: "#94a3b8" }}>
              <div className="text-4xl mb-3">🎓</div>
              <p className="text-[14px]">No learning sessions yet</p>
              <p className="text-[12px]">Generate a learning path to get started</p>
            </div>
          ) : items.map(r => (
            <div key={r.id} className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full mr-2" style={{ background: `${MODE_META[r.mode].color}15`, color: MODE_META[r.mode].color }}>
                    {MODE_META[r.mode].icon} {MODE_META[r.mode].label}
                  </span>
                  <p className="font-semibold text-[14px] mt-1.5" style={{ color: "#0f172a" }}>{r.topic}</p>
                </div>
                <span className="text-[10px] flex-shrink-0" style={{ color: "#94a3b8" }}>{new Date(r.ts).toLocaleDateString()}</span>
              </div>
              <p className="text-[12px] line-clamp-3" style={{ color: "#64748b" }}>{r.output.slice(0, 280)}…</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
