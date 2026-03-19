import React, { useState, useRef, useCallback, useEffect } from "react";
import { UltimateRenderEngineApp } from "./MovieProductionApp";

// ─── Types ────────────────────────────────────────────────────────────────────

type RenderMode =
  | "cinematic" | "game" | "app" | "book"
  | "course"    | "pitch" | "showcase"
  | "music"     | "podcast" | "document";

interface RenderFrame {
  index:       number;
  title:       string;
  imageUrl:    string;
  content:     string;
  subContent?: string;
  badge?:      string;
  moodColor?:  string;
  durationSec?: number;
}

interface RenderManifest {
  projectName:   string;
  projectType:   string;
  renderMode:    RenderMode;
  titleCard:     { title: string; tagline: string; creditLines: string[] };
  frames:        RenderFrame[];
  generatedCode?: string;
  generatedAt:   string;
}

interface LogEntry {
  type:    "status" | "progress" | "done" | "error" | "frame";
  message: string;
  frame?:  number;
  total?:  number;
  step?:   string;
}

interface Props {
  projectId:   string | number;
  projectName: string;
  projectType: string;
  onClose:     () => void;
}

// ─── UI constants ─────────────────────────────────────────────────────────────

const MODE_META: Record<RenderMode, { label: string; icon: string; action: string }> = {
  cinematic: { label: "Cinematic Film",    icon: "🎬", action: "Producing Film"         },
  game:      { label: "Playable Game",     icon: "🎮", action: "Generating Game"         },
  app:       { label: "Interactive App",   icon: "💻", action: "Building App Prototype"  },
  book:      { label: "Book Chapters",     icon: "📖", action: "Writing Chapters"        },
  course:    { label: "Course Content",    icon: "📚", action: "Generating Lessons"      },
  pitch:     { label: "Pitch Deck",        icon: "📊", action: "Building Pitch Deck"     },
  showcase:  { label: "Product Showcase",  icon: "🛍️", action: "Generating Showcase"     },
  music:     { label: "Album & Lyrics",    icon: "🎵", action: "Writing Tracks"          },
  podcast:   { label: "Episode Script",    icon: "🎙️", action: "Writing Episode"         },
  document:  { label: "Full Document",     icon: "📄", action: "Generating Document"     },
};

function detectMode(industry: string): RenderMode {
  if (["Film / Movie", "Documentary"].includes(industry))   return "cinematic";
  if (industry === "Video Game")                            return "game";
  if (["Mobile App", "Web App / SaaS"].includes(industry)) return "app";
  if (industry === "Book / Novel")                          return "book";
  if (industry === "Online Course")                         return "course";
  if (["Business", "Startup"].includes(industry))           return "pitch";
  if (industry === "Physical Product")                      return "showcase";
  if (industry === "Music / Album")                         return "music";
  if (industry === "Podcast")                               return "podcast";
  return "document";
}

// ─── Production Console ───────────────────────────────────────────────────────

function ProductionConsole({
  log, frames, total, renderMode,
}: {
  log:        LogEntry[];
  frames:     RenderFrame[];
  total:      number;
  renderMode: RenderMode;
}) {
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);
  const meta = MODE_META[renderMode];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0c0f1a" }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>{meta.icon}</span>
        <div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{meta.action}…</div>
          <div style={{ color: "#64748b", fontSize: 11 }}>{renderMode} render engine active</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {Array.from({ length: total || 5 }).map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: "50%",
              background: i < frames.length ? "#6366f1" : "rgba(255,255,255,0.12)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>
      </div>

      {/* Log stream */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px", fontFamily: "monospace" }}>
        {log.map((entry, i) => (
          <div key={i} style={{
            marginBottom: 6, fontSize: 11,
            color: entry.type === "error" ? "#f87171"
              : entry.type === "done"   ? "#4ade80"
              : entry.type === "frame"  ? "#818cf8"
              : entry.type === "status" ? "#94a3b8"
              : "#64748b",
          }}>
            {entry.type === "progress" && entry.frame && entry.total
              ? `▶ [${entry.frame}/${entry.total}] ${entry.step?.toUpperCase()} — ${entry.message}`
              : entry.type === "frame"
              ? `✓ Frame ${entry.frame} complete`
              : entry.type === "done"
              ? `✦ Generation complete — ${entry.message}`
              : entry.type === "error"
              ? `✕ ${entry.message}`
              : `· ${entry.message}`
            }
          </div>
        ))}
        <div ref={bottom} />
      </div>
    </div>
  );
}

// ─── Cinematic Player ─────────────────────────────────────────────────────────

function CinematicPlayer({ manifest }: { manifest: RenderManifest }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frames    = manifest.frames;
  const frame     = frames[active];
  if (!frame) return null;

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

  useEffect(() => {
    if (playing) {
      clearTimer();
      timerRef.current = setTimeout(() => {
        setActive(a => (a + 1) % frames.length);
      }, (frame.durationSec ?? 45) * 1000);
    } else clearTimer();
    return clearTimer;
  }, [playing, active, frame.durationSec, frames.length]);

  const speak = () => {
    if (!frame.content || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(frame.content.replace(/[A-Z]+:/g, "").trim());
    utt.rate = 0.9; utt.pitch = 1;
    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const bg  = frame.moodColor ?? "#0f172a";
  const [r, g, b] = bg.startsWith("#") && bg.length === 7
    ? [parseInt(bg.slice(1,3),16), parseInt(bg.slice(3,5),16), parseInt(bg.slice(5,7),16)]
    : [15, 23, 42];

  const dialogueLines = (frame.content ?? "").split("\n").filter(l => l.trim());

  return (
    <div style={{ height: "100%", background: "#000", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Letterbox bars */}
      <div style={{ height: 36, background: "#000", flexShrink: 0 }} />

      {/* Scene image */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {frame.imageUrl ? (
          <img src={frame.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `rgb(${r},${g},${b})` }} />
        )}
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.15) 100%)`,
        }} />

        {/* Badge */}
        {frame.badge && (
          <div style={{
            position: "absolute", top: 12, left: 16,
            background: "rgba(99,102,241,0.9)", color: "#fff",
            fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            letterSpacing: "0.08em",
          }}>{frame.badge}</div>
        )}

        {/* Sub-content badges */}
        {frame.subContent && frame.subContent.replace(/\|/g, "").trim() && (
          <div style={{ position: "absolute", top: 12, right: 16, display: "flex", gap: 6 }}>
            {frame.subContent.split("|").map((s, i) => s.trim() && (
              <div key={i} style={{
                background: "rgba(0,0,0,0.65)", color: "#94a3b8",
                fontSize: 9, padding: "3px 8px", borderRadius: 12, backdropFilter: "blur(4px)",
              }}>{s.trim()}</div>
            ))}
          </div>
        )}

        {/* Dialogue */}
        <div style={{ position: "absolute", bottom: 16, left: 20, right: 20 }}>
          {dialogueLines.map((line, i) => {
            const colon = line.indexOf(":");
            const speaker = colon > 0 ? line.slice(0, colon).trim() : null;
            const text    = colon > 0 ? line.slice(colon + 1).trim() : line;
            return (
              <div key={i} style={{ marginBottom: 6, textAlign: "center" }}>
                {speaker && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", marginBottom: 2, letterSpacing: "0.1em" }}>
                    {speaker.toUpperCase()}
                  </div>
                )}
                <div style={{
                  fontSize: 14, color: "#fff", lineHeight: 1.5,
                  textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                  fontStyle: "italic",
                }}>{text}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ height: 36, background: "#000", flexShrink: 0 }} />

      {/* Controls */}
      <div style={{
        position: "absolute", bottom: 44, left: "50%", transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        borderRadius: 30, padding: "8px 16px", border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <button onClick={() => setActive(a => Math.max(0, a - 1))}
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 14 }}>⏮</button>
        <button onClick={() => setPlaying(p => !p)}
          style={{ background: "#6366f1", border: "none", color: "#fff", cursor: "pointer",
            width: 32, height: 32, borderRadius: "50%", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {playing ? "⏸" : "▶"}
        </button>
        <button onClick={() => setActive(a => Math.min(frames.length - 1, a + 1))}
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 14 }}>⏭</button>
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)", margin: "0 4px" }} />
        <button onClick={speak}
          style={{ background: "none", border: "none", color: speaking ? "#818cf8" : "#94a3b8", cursor: "pointer", fontSize: 12 }}>
          {speaking ? "🔊" : "🎙"}
        </button>
        {/* Scene dots */}
        <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
          {frames.map((_, i) => (
            <div key={i} onClick={() => { clearTimer(); setActive(i); }}
              style={{
                width: 6, height: 6, borderRadius: "50%", cursor: "pointer",
                background: i === active ? "#6366f1" : "rgba(255,255,255,0.25)",
              }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Game Player ─────────────────────────────────────────────────────────────

function GamePlayer({ manifest }: { manifest: RenderManifest }) {
  const [view, setView] = useState<"art" | "game">("art");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrl   = useRef<string | null>(null);
  const frames    = manifest.frames;
  const [activeArt, setActiveArt] = useState(0);

  useEffect(() => {
    if (manifest.generatedCode && !blobUrl.current) {
      const blob = new Blob([manifest.generatedCode], { type: "text/html" });
      blobUrl.current = URL.createObjectURL(blob);
    }
    return () => { if (blobUrl.current) URL.revokeObjectURL(blobUrl.current); };
  }, [manifest.generatedCode]);

  if (view === "game" && manifest.generatedCode) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0c0f1a" }}>
        <div style={{
          padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ color: "#818cf8", fontSize: 11, fontWeight: 700 }}>🎮 {manifest.projectName} — LIVE GAME</div>
          <button onClick={() => setView("art")}
            style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8", padding: "4px 12px", borderRadius: 8, fontSize: 10, cursor: "pointer" }}>
            ← Art Gallery
          </button>
        </div>
        <iframe
          ref={iframeRef}
          src={blobUrl.current ?? ""}
          sandbox="allow-scripts allow-same-origin"
          style={{ flex: 1, border: "none", background: "#000" }}
          title="Generated Game"
        />
      </div>
    );
  }

  const frame = frames[activeArt];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0c0f1a" }}>
      <div style={{
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <span style={{ fontSize: 16 }}>🎨</span>
        <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{manifest.projectName} — Concept Art</div>
        {manifest.generatedCode && (
          <button onClick={() => setView("game")}
            style={{
              marginLeft: "auto",
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none",
              color: "#fff", padding: "6px 16px", borderRadius: 20,
              fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}>
            🎮 Play Game
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {frame?.imageUrl ? (
          <img src={frame.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#334155", fontSize: 32 }}>🎮</span>
          </div>
        )}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
          padding: "24px 16px 12px",
        }}>
          <div style={{ color: "#818cf8", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{frame?.badge}</div>
          <div style={{ color: "#fff", fontSize: 13 }}>{frame?.title}</div>
        </div>
      </div>
      <div style={{ padding: "8px 16px", display: "flex", gap: 6, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {frames.map((_, i) => (
          <div key={i} onClick={() => setActiveArt(i)}
            style={{
              flex: 1, height: 4, borderRadius: 2, cursor: "pointer",
              background: i === activeArt ? "#6366f1" : "rgba(255,255,255,0.12)",
            }} />
        ))}
      </div>
    </div>
  );
}

// ─── App Player ───────────────────────────────────────────────────────────────

function AppPlayer({ manifest }: { manifest: RenderManifest }) {
  const [view, setView] = useState<"screens" | "app">("screens");
  const blobUrl = useRef<string | null>(null);
  const frames  = manifest.frames;
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    if (manifest.generatedCode && !blobUrl.current) {
      const blob = new Blob([manifest.generatedCode], { type: "text/html" });
      blobUrl.current = URL.createObjectURL(blob);
    }
    return () => { if (blobUrl.current) URL.revokeObjectURL(blobUrl.current); };
  }, [manifest.generatedCode]);

  if (view === "app" && manifest.generatedCode) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{
          padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}>
          <div style={{ color: "#6366f1", fontSize: 11, fontWeight: 700 }}>💻 {manifest.projectName} — Live Prototype</div>
          <button onClick={() => setView("screens")}
            style={{ background: "#f1f5f9", border: "none", color: "#64748b", padding: "4px 12px", borderRadius: 8, fontSize: 10, cursor: "pointer" }}>
            ← Screens
          </button>
        </div>
        <iframe
          src={blobUrl.current ?? ""}
          sandbox="allow-scripts allow-same-origin"
          style={{ flex: 1, border: "none", background: "#fff" }}
          title="Generated App"
        />
      </div>
    );
  }

  const frame = frames[activeScreen];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      <div style={{
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
        background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)",
      }}>
        <span style={{ fontSize: 16 }}>🖥️</span>
        <div style={{ color: "#0f172a", fontSize: 12, fontWeight: 700 }}>UI Screen Mockups</div>
        {manifest.generatedCode && (
          <button onClick={() => setView("app")}
            style={{
              marginLeft: "auto",
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none",
              color: "#fff", padding: "6px 16px", borderRadius: 20,
              fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}>
            ▶ Open Live App
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflow: "hidden", position: "relative", background: "#f1f5f9" }}>
        {frame?.imageUrl ? (
          <img src={frame.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 32, color: "#cbd5e1" }}>🖥️</span>
          </div>
        )}
      </div>
      <div style={{
        padding: "12px 16px", background: "#fff",
        borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", gap: 6,
      }}>
        {frames.map((f, i) => (
          <button key={i} onClick={() => setActiveScreen(i)}
            style={{
              flex: 1, padding: "6px 4px", borderRadius: 10,
              background: i === activeScreen ? "#6366f1" : "#f8fafc",
              border: `1px solid ${i === activeScreen ? "#6366f1" : "rgba(0,0,0,0.08)"}`,
              color: i === activeScreen ? "#fff" : "#64748b",
              fontSize: 10, fontWeight: 600, cursor: "pointer",
            }}>
            {f.title}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Book Reader ──────────────────────────────────────────────────────────────

function BookReader({ manifest }: { manifest: RenderManifest }) {
  const [chapter, setChapter] = useState(0);
  const frame = manifest.frames[chapter];

  return (
    <div style={{ height: "100%", display: "flex", background: "#faf9f7" }}>
      {/* Sidebar */}
      <div style={{
        width: 160, flexShrink: 0, background: "#fff",
        borderRight: "1px solid rgba(0,0,0,0.08)", padding: 12, overflowY: "auto",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 10, letterSpacing: "0.08em" }}>CONTENTS</div>
        {manifest.frames.map((f, i) => (
          <button key={i} onClick={() => setChapter(i)}
            style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "8px 10px", borderRadius: 8, marginBottom: 2,
              background: i === chapter ? "rgba(99,102,241,0.08)" : "transparent",
              border: "none",
              color: i === chapter ? "#6366f1" : "#374151",
              fontSize: 11, fontWeight: i === chapter ? 600 : 400, cursor: "pointer",
            }}>
            {f.title}
          </button>
        ))}
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 12, paddingTop: 12 }}>
          <button onClick={() => window.print()}
            style={{
              display: "block", width: "100%", padding: "7px 0",
              background: "#6366f1", border: "none", borderRadius: 8,
              color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer",
            }}>
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Reading pane */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 48px" }}>
        {frame?.imageUrl && (
          <img src={frame.imageUrl} alt="" style={{
            width: "100%", maxHeight: 220, objectFit: "cover",
            borderRadius: 12, marginBottom: 28,
          }} />
        )}
        <div style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>
          {frame?.badge?.toUpperCase()}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 24 }}>{frame?.title}</h2>
        <div style={{
          fontSize: 15, lineHeight: 1.85, color: "#374151",
          fontFamily: "Georgia, 'Times New Roman', serif",
          whiteSpace: "pre-wrap",
        }}>
          {frame?.content}
        </div>
      </div>
    </div>
  );
}

// ─── Course Player ────────────────────────────────────────────────────────────

function CoursePlayer({ manifest }: { manifest: RenderManifest }) {
  const [module, setModule] = useState(0);
  const frame = manifest.frames[module];

  const parseQuiz = (text: string) => {
    const qBlocks = text.split(/Q\d+:/).filter(b => b.trim());
    return qBlocks.slice(0, 3).map((block) => {
      const lines = block.trim().split("\n").filter(l => l.trim());
      const question = lines[0] ?? "";
      const opts     = lines.slice(1, 5).filter(l => /^[A-D]\)/.test(l.trim()));
      const corrLine = lines.find(l => l.toLowerCase().includes("correct:"));
      const correct  = corrLine ? corrLine.replace(/.*correct:\s*/i, "").trim() : "";
      return { question, opts, correct };
    });
  };

  const [selected, setSelected] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { setSelected({}); setRevealed(false); }, [module]);

  const quiz = frame ? parseQuiz(frame.content) : [];
  const contentWithoutQuiz = (frame?.content ?? "").split(/Q1:/)[0] ?? "";

  return (
    <div style={{ height: "100%", display: "flex", background: "#f8fafc" }}>
      {/* Module list */}
      <div style={{ width: 160, flexShrink: 0, background: "#fff", borderRight: "1px solid rgba(0,0,0,0.08)", padding: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 10, letterSpacing: "0.08em" }}>MODULES</div>
        {manifest.frames.map((f, i) => (
          <button key={i} onClick={() => setModule(i)}
            style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "8px 10px", borderRadius: 8, marginBottom: 2,
              background: i === module ? "rgba(99,102,241,0.08)" : "transparent",
              border: "none",
              color: i === module ? "#6366f1" : "#374151",
              fontSize: 11, fontWeight: i === module ? 600 : 400, cursor: "pointer",
            }}>
            {f.title}
          </button>
        ))}
      </div>

      {/* Lesson pane */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {frame?.imageUrl && (
          <img src={frame.imageUrl} alt="" style={{ width: "100%", height: 120, objectFit: "cover" }} />
        )}
        <div style={{ padding: "24px 32px" }}>
          <div style={{ color: "#6366f1", fontSize: 10, fontWeight: 700, marginBottom: 6, letterSpacing: "0.08em" }}>{frame?.badge}</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>{frame?.title}</h2>
          <div style={{ fontSize: 13, lineHeight: 1.75, color: "#374151", whiteSpace: "pre-wrap", marginBottom: 24 }}>
            {contentWithoutQuiz}
          </div>

          {/* Quiz */}
          {quiz.length > 0 && (
            <div style={{
              background: "#fff", borderRadius: 14, padding: 20,
              border: "1px solid rgba(99,102,241,0.15)", marginTop: 8,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>📝 Module Quiz</div>
              {quiz.map((q, qi) => (
                <div key={qi} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                    {qi + 1}. {q.question}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {q.opts.map((opt, oi) => {
                      const letter = opt.trim().slice(0, 1);
                      const isSelected = selected[qi] === letter;
                      const isCorrect  = revealed && letter === q.correct.slice(0, 1);
                      const isWrong    = revealed && isSelected && !isCorrect;
                      return (
                        <button key={oi} onClick={() => !revealed && setSelected(prev => ({ ...prev, [qi]: letter }))}
                          style={{
                            textAlign: "left", padding: "7px 12px", borderRadius: 8,
                            border: `1px solid ${isCorrect ? "#4ade80" : isWrong ? "#f87171" : isSelected ? "#6366f1" : "rgba(0,0,0,0.08)"}`,
                            background: isCorrect ? "rgba(74,222,128,0.08)" : isWrong ? "rgba(248,113,113,0.08)" : isSelected ? "rgba(99,102,241,0.08)" : "#f8fafc",
                            color: "#374151", fontSize: 12, cursor: revealed ? "default" : "pointer",
                          }}>
                          {opt.trim()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {!revealed ? (
                <button onClick={() => setRevealed(true)}
                  style={{
                    marginTop: 4, padding: "8px 20px", borderRadius: 10,
                    background: "#6366f1", border: "none", color: "#fff",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}>
                  Submit Answers
                </button>
              ) : (
                <div style={{ color: "#4ade80", fontSize: 12, fontWeight: 600 }}>
                  ✓ Answers revealed — green = correct
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pitch Deck Viewer ────────────────────────────────────────────────────────

function PitchDeckViewer({ manifest }: { manifest: RenderManifest }) {
  const [slide, setSlide] = useState(0);
  const frame = manifest.frames[slide];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      {/* Slide */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {frame?.imageUrl ? (
          <img src={frame.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }} />
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%)",
          display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "24px 32px",
        }}>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: "0.08em" }}>
            {frame?.badge?.toUpperCase()} — {manifest.projectName}
          </div>
          <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{frame?.title}</h2>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {frame?.content}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{
        padding: "10px 16px", background: "#fff", borderTop: "1px solid rgba(0,0,0,0.08)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <button onClick={() => setSlide(s => Math.max(0, s - 1))}
          style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.1)", color: "#374151", padding: "5px 12px", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>←</button>
        <div style={{ display: "flex", gap: 4, flex: 1, justifyContent: "center" }}>
          {manifest.frames.map((_, i) => (
            <div key={i} onClick={() => setSlide(i)}
              style={{
                width: i === slide ? 20 : 6, height: 6, borderRadius: 3, cursor: "pointer",
                background: i === slide ? "#6366f1" : "rgba(0,0,0,0.12)", transition: "width 0.2s",
              }} />
          ))}
        </div>
        <button onClick={() => setSlide(s => Math.min(manifest.frames.length - 1, s + 1))}
          style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.1)", color: "#374151", padding: "5px 12px", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>→</button>
        <button onClick={() => window.print()}
          style={{ background: "#6366f1", border: "none", color: "#fff", padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          PDF
        </button>
      </div>
    </div>
  );
}

// ─── Product Showcase ─────────────────────────────────────────────────────────

function ProductShowcase({ manifest }: { manifest: RenderManifest }) {
  const [view, setView] = useState(0);
  const frame = manifest.frames[view];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {frame?.imageUrl ? (
          <img src={frame.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", background: "#f8fafc" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 48, color: "#e2e8f0" }}>📦</span>
          </div>
        )}
      </div>
      <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <div style={{ color: "#6366f1", fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{frame?.badge}</div>
        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, marginBottom: 12, whiteSpace: "pre-wrap" }}>
          {frame?.content}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {manifest.frames.map((f, i) => (
            <button key={i} onClick={() => setView(i)}
              style={{
                flex: 1, padding: "6px 4px", borderRadius: 8,
                background: i === view ? "#6366f1" : "#f8fafc",
                border: `1px solid ${i === view ? "#6366f1" : "rgba(0,0,0,0.08)"}`,
                color: i === view ? "#fff" : "#64748b",
                fontSize: 10, fontWeight: 600, cursor: "pointer",
              }}>
              {f.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Music Player ─────────────────────────────────────────────────────────────

function MusicPlayer({ manifest }: { manifest: RenderManifest }) {
  const [track, setTrack] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const frame = manifest.frames[track];

  const readLyrics = () => {
    if (!frame?.content || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = frame.content.replace(/\[(.*?)\]/g, "").replace(/\n+/g, " ").trim();
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 0.85; utt.pitch = 1.05;
    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  return (
    <div style={{ height: "100%", display: "flex", background: "#0c0f1a" }}>
      {/* Track list */}
      <div style={{
        width: 160, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.06)",
        padding: 12, overflowY: "auto",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 10, letterSpacing: "0.08em" }}>TRACKS</div>
        {manifest.frames.map((f, i) => (
          <button key={i} onClick={() => { window.speechSynthesis?.cancel(); setSpeaking(false); setTrack(i); }}
            style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "8px 10px", borderRadius: 8, marginBottom: 2,
              background: i === track ? "rgba(99,102,241,0.15)" : "transparent",
              border: "none",
              color: i === track ? "#818cf8" : "#64748b",
              fontSize: 11, fontWeight: i === track ? 600 : 400, cursor: "pointer",
            }}>
            {f.title}
          </button>
        ))}
      </div>

      {/* Lyrics pane */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Art + controls */}
        <div style={{ padding: 16, display: "flex", gap: 16, alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {frame?.imageUrl ? (
            <img src={frame.imageUrl} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🎵</div>
          )}
          <div>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{frame?.title}</div>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 8 }}>{manifest.projectName}</div>
            <button onClick={speaking ? () => { window.speechSynthesis?.cancel(); setSpeaking(false); } : readLyrics}
              style={{
                background: speaking ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)", color: speaking ? "#818cf8" : "#6366f1",
                padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}>
              {speaking ? "⏹ Stop" : "▶ Read Lyrics"}
            </button>
          </div>
        </div>

        {/* Lyrics */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {(frame?.content ?? "").split("\n").map((line, i) => {
            const isSection = /^\[.+\]$/.test(line.trim());
            return (
              <div key={i} style={{
                marginBottom: isSection ? 12 : 3,
                color:  isSection ? "#6366f1" : line.trim() === "" ? "transparent" : "#94a3b8",
                fontSize: isSection ? 10 : 13,
                fontWeight: isSection ? 700 : 400,
                letterSpacing: isSection ? "0.1em" : "normal",
                lineHeight: 1.6,
              }}>
                {line || "\u00A0"}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Podcast Player ───────────────────────────────────────────────────────────

function PodcastPlayer({ manifest }: { manifest: RenderManifest }) {
  const [speaking, setSpeaking]   = useState(false);
  const [activeTab, setActiveTab] = useState<"script" | "notes">("script");
  const scriptFrame = manifest.frames.find(f => f.index === 0);
  const notesFrame  = manifest.frames.find(f => f.index === 1);

  const readScript = () => {
    if (!scriptFrame?.content || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = scriptFrame.content.replace(/\[.*?\]/g, "").replace(/HOST:/g, "").trim();
    const utt   = new SpeechSynthesisUtterance(clean);
    utt.rate = 0.88; utt.pitch = 1;
    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0c0f1a" }}>
      {/* Cover + play */}
      <div style={{
        padding: "16px 20px", display: "flex", gap: 16, alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {scriptFrame?.imageUrl ? (
          <img src={scriptFrame.imageUrl} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" }} />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: 10, background: "linear-gradient(135deg,#ea580c,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🎙️</div>
        )}
        <div>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Episode 1</div>
          <div style={{ color: "#64748b", fontSize: 11, marginBottom: 8 }}>{manifest.projectName}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={speaking ? () => { window.speechSynthesis?.cancel(); setSpeaking(false); } : readScript}
              style={{
                background: speaking ? "rgba(234,88,12,0.2)" : "rgba(234,88,12,0.15)",
                border: "1px solid rgba(234,88,12,0.3)", color: speaking ? "#f97316" : "#ea580c",
                padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}>
              {speaking ? "⏹ Stop Playback" : "🔊 Play Episode"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {(["script", "notes"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: "10px 0", background: "none", border: "none",
              borderBottom: `2px solid ${activeTab === tab ? "#ea580c" : "transparent"}`,
              color: activeTab === tab ? "#f97316" : "#64748b",
              fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em",
            }}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
        {(activeTab === "script" ? scriptFrame?.content : notesFrame?.content ?? "")
          ?.split("\n").map((line, i) => {
            const isTag    = /^\[.*\]$/.test(line.trim());
            const isHost   = line.trim().startsWith("HOST:");
            return (
              <div key={i} style={{
                marginBottom: isTag ? 12 : 3,
                color:   isTag  ? "#f97316" : isHost ? "#94a3b8" : "#6b7280",
                fontSize: isTag  ? 10 : 13,
                fontWeight: isTag  ? 700 : isHost ? 600 : 400,
                lineHeight: 1.65,
                letterSpacing: isTag ? "0.08em" : "normal",
              }}>
                {line || "\u00A0"}
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── Document Reader ──────────────────────────────────────────────────────────

function DocumentReader({ manifest }: { manifest: RenderManifest }) {
  const [section, setSection] = useState(0);
  const frame = manifest.frames[section];

  return (
    <div style={{ height: "100%", display: "flex", background: "#faf9f7" }}>
      <div style={{ width: 160, flexShrink: 0, background: "#fff", borderRight: "1px solid rgba(0,0,0,0.08)", padding: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 10, letterSpacing: "0.08em" }}>SECTIONS</div>
        {manifest.frames.map((f, i) => (
          <button key={i} onClick={() => setSection(i)}
            style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "8px 10px", borderRadius: 8, marginBottom: 2,
              background: i === section ? "rgba(99,102,241,0.08)" : "transparent",
              border: "none", color: i === section ? "#6366f1" : "#374151",
              fontSize: 11, fontWeight: i === section ? 600 : 400, cursor: "pointer",
            }}>
            {f.title}
          </button>
        ))}
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 12, paddingTop: 12 }}>
          <button onClick={() => window.print()}
            style={{ display: "block", width: "100%", padding: "7px 0", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
            📄 Export PDF
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 48px" }}>
        {frame?.imageUrl && (
          <img src={frame.imageUrl} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 12, marginBottom: 24 }} />
        )}
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>{frame?.title}</h2>
        <div style={{ fontSize: 14, lineHeight: 1.8, color: "#374151", whiteSpace: "pre-wrap" }}>{frame?.content}</div>
      </div>
    </div>
  );
}

// ─── Output Router ────────────────────────────────────────────────────────────

function OutputViewer({ manifest }: { manifest: RenderManifest }) {
  switch (manifest.renderMode) {
    case "cinematic": return <CinematicPlayer manifest={manifest} />;
    case "game":      return <GamePlayer manifest={manifest} />;
    case "app":       return <AppPlayer manifest={manifest} />;
    case "book":      return <BookReader manifest={manifest} />;
    case "course":    return <CoursePlayer manifest={manifest} />;
    case "pitch":     return <PitchDeckViewer manifest={manifest} />;
    case "showcase":  return <ProductShowcase manifest={manifest} />;
    case "music":     return <MusicPlayer manifest={manifest} />;
    case "podcast":   return <PodcastPlayer manifest={manifest} />;
    default:          return <DocumentReader manifest={manifest} />;
  }
}

// ─── Main RenderEngineApp ─────────────────────────────────────────────────────

export function RenderEngineApp({ projectId, projectName, projectType, onClose }: Props) {
  const [phase, setPhase]         = useState<"idle" | "generating" | "done" | "error">("idle");
  const [log, setLog]             = useState<LogEntry[]>([]);
  const [frames, setFrames]       = useState<RenderFrame[]>([]);
  const [total, setTotal]         = useState(0);
  const [manifest, setManifest]   = useState<RenderManifest | null>(null);
  const [view, setView]           = useState<"console" | "output">("console");
  const abortRef                  = useRef<AbortController | null>(null);

  const renderMode = detectMode(projectType);
  const meta       = MODE_META[renderMode];

  const addLog = useCallback((entry: LogEntry) => {
    setLog(prev => [...prev, entry]);
  }, []);

  const startGeneration = useCallback(async () => {
    setPhase("generating");
    setLog([]);
    setFrames([]);
    setTotal(0);
    setManifest(null);
    setView("console");

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const resp = await fetch("/api/render/generate", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ projectId }),
        signal:      abortRef.current.signal,
      });

      if (!resp.ok || !resp.body) {
        setPhase("error");
        addLog({ type: "error", message: `Server returned ${resp.status}` });
        return;
      }

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data:")) continue;
          try {
            const evt = JSON.parse(line.slice(5).trim()) as {
              type: string; message?: string; frame?: number; total?: number; step?: string;
              data?: RenderFrame; manifest?: RenderManifest; codeType?: string; preview?: string;
            };

            if (evt.type === "status")   addLog({ type: "status",   message: evt.message ?? "" });
            if (evt.type === "start")    { setTotal(evt.total ?? 5); addLog({ type: "status", message: `Starting — ${evt.total} segments to generate` }); }
            if (evt.type === "progress") addLog({ type: "progress",  message: evt.message ?? "", frame: evt.frame, total: evt.total, step: evt.step });
            if (evt.type === "frame_done") {
              if (evt.data) setFrames(prev => [...prev, evt.data!]);
              addLog({ type: "frame", message: `Frame ${evt.frame} complete`, frame: evt.frame });
            }
            if (evt.type === "code_ready") {
              addLog({ type: "status", message: `${evt.codeType === "game" ? "🎮 Playable game" : "💻 Interactive app"} code generated` });
            }
            if (evt.type === "error") {
              setPhase("error");
              addLog({ type: "error", message: evt.message ?? "Generation failed" });
            }
            if (evt.type === "done" && evt.manifest) {
              setManifest(evt.manifest);
              setPhase("done");
              setView("output");
              addLog({ type: "done", message: `${evt.manifest.frames.length} frames ready` });
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setPhase("error");
        addLog({ type: "error", message: (err as Error).message });
      }
    }
  }, [projectId, addLog]);

  useEffect(() => { return () => abortRef.current?.abort(); }, []);

  const typeColor: Record<RenderMode, string> = {
    cinematic: "#dc2626", game: "#7c3aed", app: "#2563eb",
    book: "#6b7280", course: "#0891b2", pitch: "#d97706",
    showcase: "#b45309", music: "#db2777", podcast: "#ea580c",
    document: "#475569",
  };
  const accent = typeColor[renderMode];

  // Film projects: delegate to the full UltimateRenderEngineApp cinematic engine
  // (hooks are already declared above — this conditional return is safe)
  if (renderMode === "cinematic") {
    return (
      <UltimateRenderEngineApp
        projectId={projectId}
        projectName={projectName}
        projectType="Film"
        onClose={onClose}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,0.08)",
        background: "#fff", flexShrink: 0,
      }}>
        <span style={{ fontSize: 20 }}>{meta.icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{projectName}</div>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>{meta.label} · {renderMode} engine</div>
        </div>

        {phase === "done" && (
          <div style={{ marginLeft: 12, display: "flex", gap: 6 }}>
            {(["console", "output"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{
                  padding: "5px 14px", borderRadius: 20,
                  background: view === v ? accent : "#f1f5f9",
                  border: "none", color: view === v ? "#fff" : "#64748b",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}>
                {v === "console" ? "📟 Log" : `${meta.icon} Output`}
              </button>
            ))}
          </div>
        )}

        {frames.length > 0 && phase === "generating" && (
          <div style={{
            marginLeft: 12, padding: "4px 12px", borderRadius: 20,
            background: "rgba(99,102,241,0.1)", color: "#6366f1",
            fontSize: 10, fontWeight: 700,
          }}>
            {frames.length}/{total || "?"} ready
          </div>
        )}

        <button onClick={onClose}
          style={{
            marginLeft: "auto", background: "none", border: "none",
            color: "#94a3b8", cursor: "pointer", fontSize: 18, lineHeight: 1,
          }}>✕</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {phase === "idle" ? (
          /* ── Launch screen ── */
          <div style={{
            height: "100%", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", padding: 32,
            background: "#f8fafc",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, marginBottom: 20,
            }}>
              {meta.icon}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8, textAlign: "center" }}>
              {meta.label} Generator
            </div>
            <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", maxWidth: 380, lineHeight: 1.6, marginBottom: 28 }}>
              {renderMode === "game"
                ? "GPT will read your Game Design Document and generate a complete, playable HTML5 canvas game — with keyboard controls, game loop, characters, and scoring."
                : renderMode === "app"
                ? "GPT will read your PRD and generate a fully interactive HTML prototype with navigation, mock data, and working UI elements."
                : renderMode === "book"
                ? "GPT will write full chapter text from your outline, plus DALL-E 3 illustrations. Export to PDF with one click."
                : renderMode === "course"
                ? "GPT will generate full lesson content, practice exercises, and quizzes for each module, with DALL-E 3 slide headers."
                : renderMode === "pitch"
                ? "GPT + DALL-E 3 will generate a complete investor pitch deck — visuals + full slide copy. Export to PDF."
                : renderMode === "music"
                ? "GPT will write complete lyrics for each track in the album, plus DALL-E 3 artwork. Listen via browser voice."
                : renderMode === "podcast"
                ? "GPT will write a complete episode script with cues and transitions. Hit Play to hear it via browser voice."
                : renderMode === "showcase"
                ? "DALL-E 3 will render 4 professional product views — hero, lifestyle, detail, packaging — with marketing copy."
                : "GPT will generate a complete, well-structured document from your project files. Export to PDF."
              }
            </div>
            <button onClick={startGeneration}
              style={{
                padding: "14px 36px", borderRadius: 16,
                background: `linear-gradient(135deg, ${accent}, #8b5cf6)`,
                border: "none", color: "#fff",
                fontSize: 14, fontWeight: 800, cursor: "pointer",
                boxShadow: `0 8px 24px ${accent}40`,
              }}>
              {meta.icon} {meta.action}
            </button>
          </div>
        ) : view === "output" && manifest ? (
          <OutputViewer manifest={manifest} />
        ) : (
          <ProductionConsole log={log} frames={frames} total={total} renderMode={renderMode} />
        )}
      </div>

      {/* Footer — show partial output button as soon as frames arrive */}
      {phase === "generating" && frames.length > 0 && manifest === null && (
        <div style={{
          padding: "8px 20px", background: "#f8fafc", borderTop: "1px solid rgba(0,0,0,0.06)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#f1f5f9", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              background: `linear-gradient(90deg, ${accent}, #8b5cf6)`,
              width: `${Math.round((frames.length / (total || 1)) * 100)}%`,
              transition: "width 0.5s",
            }} />
          </div>
          <div style={{ fontSize: 10, color: "#64748b", whiteSpace: "nowrap" }}>
            {frames.length} of {total || "?"} ready
          </div>
        </div>
      )}

      {/* Error retry */}
      {phase === "error" && (
        <div style={{ padding: "12px 20px", background: "#fef2f2", borderTop: "1px solid #fecaca" }}>
          <button onClick={startGeneration}
            style={{ padding: "7px 20px", borderRadius: 10, background: "#dc2626", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
