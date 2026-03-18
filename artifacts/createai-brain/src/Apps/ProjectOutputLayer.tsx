import React, { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectLike {
  id: string;
  name: string;
  industry: string;
  icon: string;
  color: string;
  files: Array<{ id: string; name: string; type: string; content?: string }>;
}

interface RendererProps {
  project: ProjectLike;
  compact: boolean;
}

export interface ProjectOutputLayerProps {
  project: ProjectLike;
  compact?: boolean;
}

type OutputType =
  | "film" | "documentary" | "video"
  | "game" | "app" | "website" | "block"
  | "book" | "music" | "podcast" | "course"
  | "business" | "startup" | "product" | "document"
  | "dashboard";

// ─── Type Detection ───────────────────────────────────────────────────────────

function detectOutputType(industry: string): OutputType {
  const s = industry.toLowerCase();
  if (s.includes("documentary"))                              return "documentary";
  if (s.includes("film") || s.includes("movie"))             return "film";
  if (s.includes("game"))                                     return "game";
  if (s.includes("mobile app"))                               return "app";
  if (s.includes("web app") || s.includes("saas"))           return "website";
  if (s.includes("block") || s.includes("page builder"))     return "block";
  if (s.includes("book") || s.includes("novel"))             return "book";
  if (s.includes("music") || s.includes("album"))            return "music";
  if (s.includes("podcast"))                                  return "podcast";
  if (s.includes("course"))                                   return "course";
  if (s.includes("startup"))                                  return "startup";
  if (s.includes("business"))                                 return "business";
  if (s.includes("physical product") || s.includes("product")) return "product";
  return "dashboard";
}

function getContent(project: ProjectLike, keywords: string[]): string {
  for (const kw of keywords) {
    const f = project.files.find(
      f => f.name.toLowerCase().includes(kw.toLowerCase()) && f.content,
    );
    if (f?.content) return f.content;
  }
  return "";
}

// ─── Shared Shell ─────────────────────────────────────────────────────────────

function OutputShell({
  label, icon, color, tag, children, compact,
}: {
  label: string; icon: string; color: string; tag?: string;
  children: React.ReactNode; compact: boolean;
}) {
  return (
    <div style={{
      height: compact ? 200 : "100%",
      background: "#ffffff",
      borderRadius: compact ? 16 : 0,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      border: compact ? "1px solid rgba(0,0,0,0.08)" : "none",
      boxShadow: compact ? "0 2px 12px rgba(0,0,0,0.06)" : "none",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
        padding: compact ? "7px 12px" : "9px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        background: "#fafafa",
      }}>
        <span style={{ fontSize: compact ? 13 : 15 }}>{icon}</span>
        <span style={{ fontSize: compact ? 11 : 12, fontWeight: 700, color: "#0f172a", flex: 1 }}>{label}</span>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
          background: `${color}15`, color, border: `1px solid ${color}30`,
          textTransform: "uppercase", letterSpacing: 0.5,
        }}>{tag ?? "LIVE OUTPUT"}</span>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

// ─── 1. Film Storyboard Output ────────────────────────────────────────────────

const SHOT_TYPES = ["WIDE", "MED", "CU", "ECU", "OTS", "POV", "AERIAL"];
const SHOT_COLORS: Record<string, string> = {
  WIDE: "#6366f1", MED: "#0ea5e9", CU: "#10b981", ECU: "#f59e0b",
  OTS: "#8b5cf6", POV: "#ec4899", AERIAL: "#06b6d4",
};

function FilmStoryboardOutput({ project, compact }: RendererProps) {
  const [selectedPanel, setSelectedPanel] = useState<number | null>(null);
  const content = getContent(project, ["treatment", "shot list", "logline", "script", "scenes", "scene"]);

  const rawScenes = content.split("\n").filter(l => l.trim().length > 15).slice(0, 9);
  const panels = rawScenes.length >= 4 ? rawScenes : [
    "EXT. CITY SKYLINE — DAWN. Camera drifts across the skyline as first light breaks.",
    "INT. PROTAGONIST'S APARTMENT — DAY. She stands at the window, coffee in hand, staring at nothing.",
    "EXT. ALLEY — NIGHT. Footsteps echo. A figure disappears into shadow.",
    "INT. INTERROGATION ROOM — NIGHT. Fluorescent flicker. Two people. One truth.",
    "EXT. ROOFTOP — GOLDEN HOUR. The wind picks up. Everything changes in one breath.",
    "INT. HOSPITAL — DAY. Machines beeping. Hands gripping the railing.",
    "EXT. BRIDGE — NIGHT. Rain falls in sheets. The car skids to a stop.",
    "INT. LIVING ROOM — FLASHBACK. Children laughing. Sunlight through curtains.",
    "EXT. OPEN FIELD — SUNRISE. She walks away. The frame holds long after she's gone.",
  ];

  const cols = compact ? 3 : 3;
  const visible = compact ? panels.slice(0, 3) : panels.slice(0, 9);

  return (
    <OutputShell label={`${project.name} — Storyboard`} icon="🎬" color="#dc2626" tag="STORYBOARD" compact={compact}>
      <div style={{ height: "100%", overflowY: "auto", padding: compact ? 8 : 16, background: "#f8fafc" }}>
        {/* Storyboard panels grid */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: compact ? 6 : 12 }}>
          {visible.map((scene, i) => {
            const shot = SHOT_TYPES[i % SHOT_TYPES.length];
            const shotColor = SHOT_COLORS[shot];
            const isSelected = selectedPanel === i;
            return (
              <div
                key={i}
                onClick={() => setSelectedPanel(isSelected ? null : i)}
                style={{
                  background: "#fff",
                  border: isSelected ? `2px solid ${shotColor}` : "1px solid rgba(0,0,0,0.09)",
                  borderRadius: compact ? 8 : 10,
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: isSelected ? `0 4px 16px ${shotColor}25` : "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                {/* Film frame */}
                <div style={{
                  height: compact ? 52 : 80,
                  background: `linear-gradient(135deg, #${(i * 37 + 100).toString(16).slice(-3)}0${(i * 23 + 100).toString(16).slice(-3)}00, #1e293b)`,
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {/* Film perforations */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: compact ? 4 : 6, background: "#000", display: "flex", gap: compact ? 4 : 6, padding: "0 4px" }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <div key={j} style={{ width: compact ? 4 : 6, height: "100%", background: "#1a1a1a", borderRadius: 1 }} />
                    ))}
                  </div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: compact ? 4 : 6, background: "#000", display: "flex", gap: compact ? 4 : 6, padding: "0 4px" }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <div key={j} style={{ width: compact ? 4 : 6, height: "100%", background: "#1a1a1a", borderRadius: 1 }} />
                    ))}
                  </div>
                  {/* Scene number */}
                  <div style={{ position: "absolute", top: compact ? 6 : 9, left: compact ? 5 : 8, fontSize: compact ? 8 : 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
                    SC {String(i + 1).padStart(2, "0")}
                  </div>
                  {/* Shot badge */}
                  <div style={{ position: "absolute", top: compact ? 6 : 9, right: compact ? 5 : 8, fontSize: compact ? 7 : 9, fontWeight: 800, padding: "1px 5px", borderRadius: 4, background: shotColor, color: "#fff" }}>
                    {shot}
                  </div>
                </div>
                {/* Scene text */}
                <div style={{ padding: compact ? "4px 6px" : "7px 9px" }}>
                  <p style={{ fontSize: compact ? 8 : 10, color: "#1e293b", lineHeight: 1.4, margin: 0 }}>
                    {scene.slice(0, compact ? 48 : 90)}{scene.length > (compact ? 48 : 90) ? "…" : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected panel detail */}
        {!compact && selectedPanel !== null && (
          <div style={{ marginTop: 12, padding: "12px 14px", background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6, background: SHOT_COLORS[SHOT_TYPES[selectedPanel % SHOT_TYPES.length]] + "20", color: SHOT_COLORS[SHOT_TYPES[selectedPanel % SHOT_TYPES.length]] }}>
                SCENE {String(selectedPanel + 1).padStart(2, "0")} · {SHOT_TYPES[selectedPanel % SHOT_TYPES.length]} SHOT
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.7, margin: 0 }}>{panels[selectedPanel]}</p>
          </div>
        )}
      </div>
    </OutputShell>
  );
}

// ─── 2. Documentary Output ────────────────────────────────────────────────────

function DocumentaryOutput({ project, compact }: RendererProps) {
  const [activeSegment, setActiveSegment] = useState(0);
  const content = getContent(project, ["story arc", "outline", "pitch", "segment", "subject", "research"]);
  const lines = content.split("\n").filter(l => l.trim().length > 10);

  const segments = [
    { title: "ACT I — Setup", icon: "🎯", color: "#6366f1", desc: lines[0] || "Introduce the world, the subject, and the central question this documentary asks.", tags: ["Opening", "World-building"] },
    { title: "ACT II — Conflict", icon: "⚡", color: "#f59e0b", desc: lines[1] || "Rising stakes. New revelations shift our understanding. Complications deepen.", tags: ["Twist", "Investigation"] },
    { title: "ACT III — Truth", icon: "💡", color: "#10b981", desc: lines[2] || "The answer surfaces. The emotional payoff lands. The audience is changed.", tags: ["Resolution", "Impact"] },
  ];

  const subjects = lines.slice(3, 7);

  return (
    <OutputShell label={`${project.name}`} icon="📺" color="#0284c7" tag="DOCUMENTARY" compact={compact}>
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
        {/* Act selector */}
        <div style={{ width: compact ? 80 : 120, flexShrink: 0, background: "#f8fafc", borderRight: "1px solid rgba(0,0,0,0.07)", padding: "8px 0", overflowY: "auto" }}>
          {segments.map((seg, i) => (
            <button key={i} onClick={() => setActiveSegment(i)} style={{
              width: "100%", textAlign: "left", padding: compact ? "8px 8px" : "10px 12px",
              background: activeSegment === i ? `${seg.color}10` : "transparent",
              border: "none", cursor: "pointer",
              borderLeft: activeSegment === i ? `3px solid ${seg.color}` : "3px solid transparent",
            }}>
              <div style={{ fontSize: compact ? 14 : 18, marginBottom: 2 }}>{seg.icon}</div>
              <div style={{ fontSize: compact ? 8 : 9, fontWeight: 700, color: activeSegment === i ? seg.color : "#94a3b8", lineHeight: 1.3 }}>
                {seg.title.split(" — ")[1] || seg.title}
              </div>
            </button>
          ))}
        </div>

        {/* Segment content */}
        <div style={{ flex: 1, overflowY: "auto", padding: compact ? "10px 12px" : "16px 18px" }}>
          {(() => {
            const seg = segments[activeSegment];
            return (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: compact ? 18 : 24 }}>{seg.icon}</span>
                  <div>
                    <div style={{ fontSize: compact ? 11 : 14, fontWeight: 800, color: "#0f172a" }}>{seg.title}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                      {seg.tags.map(t => (
                        <span key={t} style={{ fontSize: 8, padding: "1px 7px", borderRadius: 20, background: `${seg.color}15`, color: seg.color, fontWeight: 600 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: compact ? 10 : 12, color: "#475569", lineHeight: 1.7, marginBottom: compact ? 10 : 16 }}>{seg.desc}</p>
                {!compact && subjects.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Interview Subjects</div>
                    {subjects.map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#f8fafc", borderRadius: 8, marginBottom: 4, border: "1px solid rgba(0,0,0,0.07)" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${seg.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>👤</div>
                        <span style={{ fontSize: 12, color: "#1e293b" }}>{s.slice(0, 60)}{s.length > 60 ? "…" : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 3. Block-Building Output ─────────────────────────────────────────────────

interface Block {
  id: string; type: "heading" | "text" | "button" | "image" | "divider" | "card";
  content: string; x: number; y: number; w: number; h: number; color: string;
}

function BlockOutput({ project, compact }: RendererProps) {
  const projectColor = project.color || "#6366f1";
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "b1", type: "heading", content: project.name, x: 20, y: 16, w: 320, h: 36, color: "#0f172a" },
    { id: "b2", type: "text", content: `Welcome to ${project.name}. This is your page builder output — drag and resize blocks freely.`, x: 20, y: 64, w: 260, h: 52, color: "#64748b" },
    { id: "b3", type: "button", content: "Get Started →", x: 20, y: 130, w: 120, h: 36, color: projectColor },
    { id: "b4", type: "card", content: "✨ Feature A\nPowerful tools built for speed and scale.", x: 20, y: 180, w: 148, h: 80, color: "#f8fafc" },
    { id: "b5", type: "card", content: "🔒 Feature B\nEnterprise-grade security at every layer.", x: 178, y: 180, w: 148, h: 80, color: "#f8fafc" },
    { id: "b6", type: "divider", content: "", x: 20, y: 272, w: 306, h: 2, color: "#e2e8f0" },
  ]);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    if (compact) return;
    e.stopPropagation();
    setSelected(id);
    setDragging({ id, ox: e.clientX, oy: e.clientY });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.ox;
    const dy = e.clientY - dragging.oy;
    setBlocks(prev => prev.map(b => b.id === dragging.id ? { ...b, x: Math.max(0, b.x + dx), y: Math.max(0, b.y + dy) } : b));
    setDragging({ ...dragging, ox: e.clientX, oy: e.clientY });
  };
  const deleteSelected = () => {
    if (!selected) return;
    setBlocks(prev => prev.filter(b => b.id !== selected));
    setSelected(null);
  };
  const addBlock = (type: Block["type"]) => {
    const id = `b${Date.now()}`;
    setBlocks(prev => [...prev, {
      id, type,
      content: type === "heading" ? "New Heading" : type === "button" ? "Click Me" : type === "divider" ? "" : type === "card" ? "✦ New Card\nYour content here." : "New text block",
      x: 20 + Math.random() * 100, y: 20 + Math.random() * 80, w: 200, h: type === "heading" ? 36 : type === "divider" ? 2 : 60, color: type === "button" ? projectColor : type === "card" ? "#f8fafc" : type === "heading" ? "#0f172a" : "#64748b",
    }]);
    setAdding(false);
  };

  const renderBlock = (b: Block) => {
    const isSelected = selected === b.id && !compact;
    const base: React.CSSProperties = {
      position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h,
      border: isSelected ? `2px solid ${projectColor}` : "1px solid transparent",
      cursor: compact ? "default" : "grab", userSelect: "none",
      borderRadius: b.type === "button" ? 8 : b.type === "card" ? 10 : 4,
      boxShadow: isSelected ? `0 0 0 3px ${projectColor}20` : "none",
      boxSizing: "border-box",
    };
    switch (b.type) {
      case "heading": return (
        <div key={b.id} style={{ ...base, display: "flex", alignItems: "center" }} onMouseDown={e => onMouseDown(e, b.id)}>
          <span style={{ fontSize: compact ? 14 : 18, fontWeight: 800, color: b.color, lineHeight: 1.2 }}>{b.content}</span>
        </div>
      );
      case "text": return (
        <div key={b.id} style={{ ...base }} onMouseDown={e => onMouseDown(e, b.id)}>
          <p style={{ fontSize: compact ? 9 : 11, color: b.color, lineHeight: 1.6, margin: 0 }}>{b.content}</p>
        </div>
      );
      case "button": return (
        <div key={b.id} style={{ ...base, background: b.color, display: "flex", alignItems: "center", justifyContent: "center" }} onMouseDown={e => onMouseDown(e, b.id)}>
          <span style={{ fontSize: compact ? 9 : 12, fontWeight: 700, color: "#fff" }}>{b.content}</span>
        </div>
      );
      case "card": return (
        <div key={b.id} style={{ ...base, background: b.color, border: isSelected ? `2px solid ${projectColor}` : "1px solid rgba(0,0,0,0.09)", padding: "10px 12px" }} onMouseDown={e => onMouseDown(e, b.id)}>
          {b.content.split("\n").map((line, i) => (
            <p key={i} style={{ fontSize: compact ? 8 : 11, color: i === 0 ? "#1e293b" : "#64748b", fontWeight: i === 0 ? 700 : 400, margin: "0 0 2px" }}>{line}</p>
          ))}
        </div>
      );
      case "divider": return (
        <div key={b.id} style={{ ...base, background: b.color, borderRadius: 2 }} onMouseDown={e => onMouseDown(e, b.id)} />
      );
      case "image": return (
        <div key={b.id} style={{ ...base, background: "#f1f5f9", border: isSelected ? `2px solid ${projectColor}` : "1px dashed rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }} onMouseDown={e => onMouseDown(e, b.id)}>
          <span style={{ fontSize: 20 }}>🖼️</span>
          <span style={{ fontSize: 9, color: "#94a3b8" }}>Image block</span>
        </div>
      );
      default: return null;
    }
  };

  return (
    <OutputShell label={`${project.name} — Page Builder`} icon="🧱" color={projectColor} tag="BLOCK EDITOR" compact={compact}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Toolbar */}
        {!compact && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.07)", flexShrink: 0, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginRight: 4 }}>ADD:</span>
            {(["heading", "text", "button", "card", "image", "divider"] as Block["type"][]).map(t => (
              <button key={t} onClick={() => addBlock(t)} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.10)", background: "#fff", fontSize: 10, color: "#374151", cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
            ))}
            {selected && (
              <button onClick={deleteSelected} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)", fontSize: 10, color: "#ef4444", cursor: "pointer", marginLeft: "auto" }}>🗑 Delete</button>
            )}
          </div>
        )}
        {/* Canvas */}
        <div
          ref={canvasRef}
          style={{ flex: 1, position: "relative", overflow: "hidden", background: "#ffffff", cursor: "default" }}
          onMouseMove={onMouseMove}
          onMouseUp={() => setDragging(null)}
          onMouseLeave={() => setDragging(null)}
          onClick={e => { if (e.target === canvasRef.current) setSelected(null); }}
        >
          {/* Grid lines */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)", backgroundSize: "20px 20px", pointerEvents: "none" }} />
          {blocks.map(renderBlock)}
          {!compact && blocks.length === 0 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 32 }}>🧱</span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Add blocks from the toolbar above</span>
            </div>
          )}
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 4. Video Output (generic) ────────────────────────────────────────────────

function VideoOutput({ project, compact }: RendererProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(12);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);
  const playRef = useRef(playing);
  playRef.current = playing;

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const draw = () => {
      frameRef.current++;
      const t = frameRef.current;
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.65);
      sky.addColorStop(0, "#0a1628"); sky.addColorStop(1, "#1a3a5c");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.65);
      for (let i = 0; i < 50; i++) {
        const sx = (i * 137 + 23) % W, sy = (i * 71 + 11) % (H * 0.55);
        ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(t * 0.05 + i)})`;
        ctx.beginPath(); ctx.arc(sx, sy, 0.7, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = "#0d2410"; ctx.fillRect(0, H * 0.58, W, H * 0.42);
      const scroll = playRef.current ? (t * 1.5) % W : 0;
      for (let i = 0; i < 7; i++) {
        const tx = ((i * 95 + W - scroll * 0.4) % (W + 60)) - 30, th = 35 + (i % 3) * 18;
        ctx.fillStyle = "#082008"; ctx.beginPath();
        ctx.moveTo(tx, H * 0.62); ctx.lineTo(tx - 15, H * 0.62 - th); ctx.lineTo(tx + 15, H * 0.62 - th); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = "#f0e060"; ctx.shadowColor = "#f0e060"; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(W * 0.78, H * 0.22, 18, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      if (playRef.current) { for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2); } }
      const bh = H * 0.13; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh);
      animRef.current = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(animRef.current);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setProgress(p => Math.min(p + 0.35, 100)), 200);
    return () => clearInterval(iv);
  }, [playing]);

  return (
    <OutputShell label={`${project.name} — Preview`} icon="🎬" color="#6366f1" compact={compact}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ flex: 1, position: "relative", background: "#000" }}>
          <canvas ref={canvasRef} width={640} height={200} style={{ width: "100%", height: "100%", display: "block" }} />
          {!playing && <button onClick={() => setPlaying(true)} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.92)", border: "none", cursor: "pointer", fontSize: 20 }}>▶</button>}
        </div>
        <div style={{ background: "#111", padding: "8px 12px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <button onClick={() => setPlaying(p => !p)} style={{ background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" }}>{playing ? "⏸" : "▶"}</button>
            <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, cursor: "pointer" }} onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setProgress(((e.clientX - r.left) / r.width) * 100); }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "#6366f1", borderRadius: 2 }} />
            </div>
            <span style={{ color: "#94a3b8", fontSize: 10 }}>{Math.floor(progress * 1.2)}:{String(Math.floor((progress * 1.2 % 1) * 60)).padStart(2, "0")} / 2:00</span>
          </div>
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 5. Game Output ───────────────────────────────────────────────────────────

function GameOutput({ project, compact }: RendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stRef = useRef({ x: 80, y: 140, vy: 0, grounded: true, score: 0, obstacles: [{ x: 500, h: 32 }, { x: 720, h: 44 }, { x: 940, h: 28 }] as { x: number; h: number }[], t: 0 });
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const W = canvas.width, H = canvas.height, G = 0.6, FL = H - 50;
    const onKey = (e: KeyboardEvent) => { e.type === "keydown" ? keysRef.current.add(e.key) : keysRef.current.delete(e.key); };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey);
    const loop = () => {
      const s = stRef.current; s.t++;
      if ((keysRef.current.has(" ") || keysRef.current.has("ArrowUp")) && s.grounded) { s.vy = -12; s.grounded = false; }
      s.vy += G; s.y += s.vy;
      if (s.y >= FL) { s.y = FL; s.vy = 0; s.grounded = true; }
      s.obstacles.forEach(ob => { ob.x -= 3; if (ob.x < -30) { ob.x = W + 50 + Math.random() * 200; ob.h = 24 + Math.random() * 28; s.score++; } });
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#dbeafe"); sky.addColorStop(1, "#eff6ff");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 3; i++) { const cx = ((s.t * 0.35 + i * 170) % (W + 80)) - 40; ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.beginPath(); ctx.ellipse(cx, 28 + i * 14, 36, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx + 22, 23 + i * 14, 24, 12, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = "#4ade80"; ctx.fillRect(0, FL + 8, W, H - FL - 8);
      ctx.fillStyle = "#86efac"; ctx.fillRect(0, FL + 6, W, 4);
      s.obstacles.forEach(ob => { ctx.fillStyle = "#ef4444"; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(ob.x - 11, FL + 8 - ob.h, 22, ob.h, 4); else ctx.rect(ob.x - 11, FL + 8 - ob.h, 22, ob.h); ctx.fill(); });
      const bob = s.grounded ? Math.sin(s.t * 0.3) * 2 : 0;
      ctx.fillStyle = project.color || "#6366f1"; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(s.x - 15, s.y - 30 + bob, 30, 30, 6); else ctx.rect(s.x - 15, s.y - 30 + bob, 30, 30); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillRect(s.x - 8, s.y - 24 + bob, 5, 7); ctx.fillRect(s.x + 3, s.y - 24 + bob, 5, 7);
      ctx.fillStyle = "#1e293b"; ctx.fillRect(s.x - 6, s.y - 22 + bob, 3, 4); ctx.fillRect(s.x + 5, s.y - 22 + bob, 3, 4);
      ctx.fillStyle = "#1e293b"; ctx.font = "bold 12px system-ui"; ctx.fillText(`Score: ${s.score}`, 12, 22);
      ctx.fillStyle = "#64748b"; ctx.font = "10px system-ui"; ctx.fillText("SPACE / ↑ to jump", W - 120, 22);
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); };
  }, [project.color]);
  return (
    <OutputShell label={`${project.name} — Game Preview`} icon="🎮" color="#8b5cf6" compact={compact}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f0f9ff" }}>
        <canvas ref={canvasRef} width={640} height={compact ? 120 : 240} style={{ width: "100%", flex: 1, display: "block", cursor: "pointer" }} tabIndex={0}
          onClick={() => { const s = stRef.current; if (s.grounded) { s.vy = -12; s.grounded = false; } }} />
        {!compact && <div style={{ padding: "6px 12px", background: "#f8fafc", borderTop: "1px solid rgba(0,0,0,0.06)", fontSize: 11, color: "#64748b" }}>
          Click canvas or press <kbd style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 4, fontSize: 10 }}>SPACE</kbd> to jump
        </div>}
      </div>
    </OutputShell>
  );
}

// ─── 6. App Output ────────────────────────────────────────────────────────────

function AppOutput({ project, compact }: RendererProps) {
  const [screen, setScreen] = useState(0);
  const screens = [
    { label: "Home", icon: "🏠", body: getContent(project, ["home", "dashboard"]) || `Welcome to ${project.name}\n\nYour AI-powered mobile experience starts here.` },
    { label: "Features", icon: "✨", body: getContent(project, ["feature"]) || "Core Features\n\n• Smart notifications\n• Real-time sync\n• Offline mode" },
    { label: "Profile", icon: "👤", body: getContent(project, ["profile", "user"]) || "User Profile\n\nManage your account and customize your experience." },
  ];
  const cur = screens[screen];
  return (
    <OutputShell label={`${project.name} — App`} icon="📱" color="#06b6d4" compact={compact}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)", padding: compact ? 6 : 16 }}>
        <div style={{ width: compact ? 130 : 210, height: compact ? 176 : 360, background: "#1e293b", borderRadius: compact ? 16 : 26, padding: compact ? 3 : 5, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column" }}>
          <div style={{ background: project.color || "#6366f1", borderRadius: compact ? 13 : 21, padding: compact ? "4px 8px" : "7px 12px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: compact ? 7 : 10, color: "#fff", fontWeight: 700 }}>{cur.icon} {cur.label}</span>
            <span style={{ fontSize: compact ? 7 : 9, color: "rgba(255,255,255,0.6)" }}>9:41</span>
          </div>
          <div style={{ flex: 1, background: "#fff", margin: compact ? "3px 0" : "4px 0", borderRadius: 8, padding: compact ? "6px 7px" : "10px", overflow: "hidden" }}>
            <div style={{ fontSize: compact ? 7 : 10, color: "#1e293b", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{cur.body.slice(0, compact ? 110 : 280)}</div>
          </div>
          <div style={{ display: "flex", background: "#f8fafc", borderRadius: "0 0 18px 18px", padding: compact ? 3 : 5, gap: 2 }}>
            {screens.map((s, i) => (
              <button key={i} onClick={() => setScreen(i)} style={{ flex: 1, background: screen === i ? (project.color || "#6366f1") : "transparent", border: "none", cursor: "pointer", borderRadius: 6, padding: compact ? "2px 0" : "4px 0", fontSize: compact ? 10 : 13, color: screen === i ? "#fff" : "#94a3b8" }}>{s.icon}</button>
            ))}
          </div>
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 7. Website Output ────────────────────────────────────────────────────────

function WebOutput({ project, compact }: RendererProps) {
  const content = getContent(project, ["landing", "homepage", "about"]);
  const hero = content.split("\n").find(l => l.trim().length > 20) || `The future of ${project.name} starts here`;
  const blurb = content.split("\n").filter(l => l.trim().length > 30 && !l.startsWith("#")).slice(0, 2).join(" ") || `Build, launch, and scale ${project.name} with AI powering every decision.`;
  return (
    <OutputShell label={`${project.name} — Website`} icon="🌐" color="#10b981" compact={compact}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ background: "#f1f5f9", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "6px 10px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 4 }}>{["#f87171", "#fbbf24", "#4ade80"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}</div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 10, color: "#64748b", border: "1px solid rgba(0,0,0,0.08)" }}>https://{project.name.toLowerCase().replace(/\s+/g, "-")}.app</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", background: "#fff" }}>
          <div style={{ position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "9px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: project.color || "#6366f1" }}>{project.icon} {project.name}</span>
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#64748b" }}>{["Features", "Pricing", "About"].map(l => <span key={l} style={{ cursor: "pointer" }}>{l}</span>)}</div>
          </div>
          <div style={{ padding: compact ? "16px 18px" : "40px 24px", textAlign: "center", background: `linear-gradient(135deg, ${project.color || "#6366f1"}08, transparent)` }}>
            <div style={{ fontSize: compact ? 15 : 22, fontWeight: 800, color: "#0f172a", marginBottom: 10, lineHeight: 1.25, maxWidth: 440, margin: "0 auto 10px" }}>{hero}</div>
            <p style={{ fontSize: compact ? 10 : 12, color: "#64748b", maxWidth: 360, margin: "0 auto 14px", lineHeight: 1.6 }}>{blurb}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button style={{ padding: "7px 16px", borderRadius: 8, background: project.color || "#6366f1", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Get Started →</button>
              <button style={{ padding: "7px 16px", borderRadius: 8, background: "transparent", color: "#64748b", border: "1px solid rgba(0,0,0,0.12)", fontSize: 11, cursor: "pointer" }}>Demo</button>
            </div>
          </div>
          {!compact && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, padding: "20px 18px" }}>
              {["⚡ Fast", "🔒 Secure", "🌍 Global"].map((f, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 10, border: "1px solid rgba(0,0,0,0.07)", textAlign: "center" }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{f.split(" ")[0]}</div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#0f172a", marginBottom: 4 }}>{f.split(" ")[1]}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>Enterprise-grade for {project.name}.</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 8. Book Output ───────────────────────────────────────────────────────────

function BookOutput({ project, compact }: RendererProps) {
  const [page, setPage] = useState(0);
  const content = getContent(project, ["chapter", "manuscript", "outline", "synopsis"]);
  const paras = content.split("\n\n").filter(p => p.trim().length > 20);
  const total = Math.max(paras.length, 3);
  return (
    <OutputShell label={`${project.name} — Reader`} icon="📖" color="#f59e0b" compact={compact}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fffbf0" }}>
        <div style={{ flex: 1, display: "flex", padding: compact ? "8px 10px" : "16px 20px", gap: compact ? 8 : 14, overflow: "hidden" }}>
          {[0, 1].map(side => side === 1 && compact ? null : (
            <div key={side} style={{ flex: 1, background: "#fffef8", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 4, padding: compact ? "8px 10px" : "18px 16px", boxShadow: side === 0 ? "2px 4px 12px rgba(0,0,0,0.06)" : "-2px 4px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div style={{ fontSize: compact ? 7 : 9, color: "#94a3b8", marginBottom: 8, textAlign: "center", textTransform: "uppercase", letterSpacing: 1 }}>{project.name}</div>
              <div style={{ fontSize: compact ? 8 : 13, color: "#1e293b", lineHeight: 1.75, fontFamily: "Georgia, serif" }}>
                {paras[page * 2 + side] || (side === 0 ? `Chapter ${page + 1}\n\nThe story of ${project.name} begins here. Every great narrative starts with a single defining moment.` : "Continued…\n\nEvery scene crafted with purpose. The world breathes with authentic, lived-in detail.")}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "7px 12px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#faf7ee" }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 6, padding: "4px 10px", cursor: page === 0 ? "not-allowed" : "pointer", fontSize: 11, color: "#64748b", opacity: page === 0 ? 0.4 : 1 }}>◀</button>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>Page {page * 2 + 1}</span>
          <button onClick={() => setPage(p => Math.min(total - 1, p + 1))} disabled={page >= total - 1} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 6, padding: "4px 10px", cursor: page >= total - 1 ? "not-allowed" : "pointer", fontSize: 11, color: "#64748b", opacity: page >= total - 1 ? 0.4 : 1 }}>▶</button>
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 9. Music Output ──────────────────────────────────────────────────────────

function MusicOutput({ project, compact }: RendererProps) {
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState(0);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tickRef = useRef(0);
  const playRef = useRef(playing); playRef.current = playing;
  const rawTracks = getContent(project, ["tracklist", "track", "album"]).split("\n").filter(l => l.trim().length > 2).slice(0, 8).map(l => l.trim());
  const tracks = rawTracks.length > 0 ? rawTracks : ["01. Opening Theme", "02. Rising Action", "03. The Bridge", "04. Climax", "05. Resolution", "06. Outro"];
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const W = canvas.width, H = canvas.height, bars = 52;
    const draw = () => {
      tickRef.current++; const t = tickRef.current;
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, W, H);
      const bw = W / bars;
      for (let i = 0; i < bars; i++) {
        const active = playRef.current ? 1 : 0.12;
        const h = active * (H * 0.12 + H * 0.65 * Math.abs(Math.sin(t * 0.08 + i * 0.4) * Math.cos(t * 0.05 + i * 0.2)));
        ctx.fillStyle = `hsla(${240 + i * 3}, 75%, 60%, ${playRef.current ? 0.85 : 0.25})`;
        ctx.fillRect(i * bw + 1, H - h, bw - 2, h);
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(animRef.current);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setProgress(p => { if (p >= 100) { setTrack(t => (t + 1) % tracks.length); return 0; } return p + 0.5; }), 150);
    return () => clearInterval(iv);
  }, [playing, tracks.length]);
  return (
    <OutputShell label={`${project.name} — Album`} icon="🎵" color="#ec4899" compact={compact}>
      <div style={{ display: "flex", height: "100%" }}>
        <div style={{ flex: compact ? 1 : "0 0 58%", display: "flex", flexDirection: "column" }}>
          <canvas ref={canvasRef} width={400} height={compact ? 100 : 150} style={{ width: "100%", flexShrink: 0 }} />
          <div style={{ background: "#1e293b", padding: "8px 12px", flexShrink: 0 }}>
            <div style={{ textAlign: "center", fontSize: compact ? 10 : 12, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{tracks[track]?.slice(0, 28) || "Track 1"}</div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.12)", borderRadius: 2, marginBottom: 7 }}><div style={{ width: `${progress}%`, height: "100%", background: "#ec4899", borderRadius: 2 }} /></div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button onClick={() => setTrack(t => (t - 1 + tracks.length) % tracks.length)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 15, cursor: "pointer" }}>⏮</button>
              <button onClick={() => setPlaying(p => !p)} style={{ background: "#ec4899", border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", fontSize: 13, cursor: "pointer" }}>{playing ? "⏸" : "▶"}</button>
              <button onClick={() => setTrack(t => (t + 1) % tracks.length)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 15, cursor: "pointer" }}>⏭</button>
            </div>
          </div>
        </div>
        {!compact && (
          <div style={{ flex: 1, overflowY: "auto", background: "#f8fafc", borderLeft: "1px solid rgba(0,0,0,0.06)", padding: "6px 0" }}>
            {tracks.map((t, i) => (
              <button key={i} onClick={() => { setTrack(i); setProgress(0); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: track === i ? "rgba(236,72,153,0.08)" : "transparent", border: "none", cursor: "pointer", textAlign: "left", borderLeft: track === i ? "3px solid #ec4899" : "3px solid transparent" }}>
                <span style={{ fontSize: 10, color: "#94a3b8", width: 16, textAlign: "right" }}>{i + 1}</span>
                <span style={{ fontSize: 11, color: track === i ? "#ec4899" : "#1e293b", fontWeight: track === i ? 600 : 400 }}>{t.slice(0, 26)}</span>
                {track === i && playing && <span style={{ marginLeft: "auto", fontSize: 9, color: "#ec4899" }}>▶</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </OutputShell>
  );
}

// ─── 10. Podcast Output ───────────────────────────────────────────────────────

function PodcastOutput({ project, compact }: RendererProps) {
  const [playing, setPlaying] = useState(false);
  const [ep, setEp] = useState(0);
  const [progress, setProgress] = useState(0);
  const notes = getContent(project, ["episode", "show notes", "outline"]);
  const episodes = [
    { title: `EP 01: Introducing ${project.name}`, dur: "42:18", desc: notes.split("\n").filter(l => l.trim().length > 10)[0] || "The first episode explores the origin story and why this project exists." },
    { title: "EP 02: Deep Dive", dur: "58:44", desc: "Going deeper on core concepts and real-world applications with experts." },
    { title: "EP 03: Interview Edition", dur: "51:09", desc: "Conversations with industry leaders and experienced practitioners." },
  ];
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setProgress(p => Math.min(p + 0.3, 100)), 200);
    return () => clearInterval(iv);
  }, [playing]);
  return (
    <OutputShell label={`${project.name} Podcast`} icon="🎙️" color="#8b5cf6" compact={compact}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "linear-gradient(135deg, #1e1b4b, #312e81)" }}>
        <div style={{ padding: compact ? "10px 12px" : "16px 18px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 12, marginBottom: 10 }}>
            <div style={{ width: compact ? 44 : 60, height: compact ? 44 : 60, borderRadius: 10, background: `linear-gradient(135deg, ${project.color || "#8b5cf6"}, #6d28d9)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: compact ? 18 : 26, flexShrink: 0 }}>🎙️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: compact ? 10 : 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{episodes[ep].title}</div>
              <div style={{ fontSize: compact ? 8 : 10, color: "rgba(255,255,255,0.45)" }}>{episodes[ep].dur}</div>
            </div>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.12)", borderRadius: 2, marginBottom: 8 }}><div style={{ width: `${progress}%`, height: "100%", background: "#a78bfa", borderRadius: 2 }} /></div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <button onClick={() => setEp(e => (e - 1 + episodes.length) % episodes.length)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.55)", fontSize: 15, cursor: "pointer" }}>⏮</button>
            <button onClick={() => setPlaying(p => !p)} style={{ background: "#a78bfa", border: "none", borderRadius: "50%", width: 34, height: 34, color: "#fff", fontSize: 15, cursor: "pointer" }}>{playing ? "⏸" : "▶"}</button>
            <button onClick={() => { setEp(e => (e + 1) % episodes.length); setProgress(0); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.55)", fontSize: 15, cursor: "pointer" }}>⏭</button>
          </div>
        </div>
        {!compact && (
          <div style={{ flex: 1, overflowY: "auto", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {episodes.map((e, i) => (
              <button key={i} onClick={() => { setEp(i); setProgress(0); }} style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: ep === i ? "rgba(167,139,250,0.15)" : "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: ep === i ? "#a78bfa" : "#e2e8f0", marginBottom: 2 }}>{e.title}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>{e.desc.slice(0, 58)}{e.desc.length > 58 ? "…" : ""}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </OutputShell>
  );
}

// ─── 11. Course Output ────────────────────────────────────────────────────────

function CourseOutput({ project, compact }: RendererProps) {
  const [lesson, setLesson] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const content = getContent(project, ["module", "lesson", "curriculum", "outline"]);
  const raw = content.split("\n").filter(l => l.trim().length > 5).slice(0, 6);
  const lessons = raw.length > 0 ? raw : ["Module 1: Foundations", "Module 2: Core Concepts", "Module 3: Application", "Module 4: Advanced", "Module 5: Case Studies", "Module 6: Final Project"];
  return (
    <OutputShell label={`${project.name} — Course`} icon="🎓" color="#0ea5e9" compact={compact}>
      <div style={{ display: "flex", height: "100%" }}>
        {!compact && (
          <div style={{ width: 170, flexShrink: 0, borderRight: "1px solid rgba(0,0,0,0.07)", background: "#f8fafc", overflowY: "auto", padding: "6px 0" }}>
            <div style={{ padding: "6px 12px", fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Curriculum · {completed.length}/{lessons.length}</div>
            {lessons.map((l, i) => (
              <button key={i} onClick={() => setLesson(i)} style={{ width: "100%", textAlign: "left", padding: "8px 12px", background: lesson === i ? "rgba(14,165,233,0.08)" : "transparent", border: "none", cursor: "pointer", borderLeft: lesson === i ? "3px solid #0ea5e9" : "3px solid transparent", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: completed.includes(i) ? "#22c55e" : "#94a3b8" }}>{completed.includes(i) ? "✓" : `${i + 1}.`}</span>
                <span style={{ fontSize: 11, color: lesson === i ? "#0ea5e9" : "#1e293b", lineHeight: 1.3 }}>{l.slice(0, 24)}{l.length > 24 ? "…" : ""}</span>
              </button>
            ))}
          </div>
        )}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, padding: compact ? "10px 12px" : "18px 22px", overflowY: "auto" }}>
            <div style={{ fontSize: compact ? 11 : 15, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{lessons[lesson]}</div>
            <div style={{ fontSize: compact ? 9 : 12, color: "#64748b", lineHeight: 1.7, marginBottom: 14 }}>
              {content.split("\n\n")[lesson] || `This module covers the essential concepts and practical techniques for ${project.name}. Build real skills through interactive exercises.`}
            </div>
            {!compact && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {["📹 Video Lesson", "📝 Reading", "🧪 Quiz", "💡 Discussion"].map(r => (
                  <div key={r} style={{ padding: "9px 11px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", fontSize: 11, color: "#64748b" }}>{r}</div>
                ))}
              </div>
            )}
          </div>
          <div style={{ padding: "9px 14px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#f8fafc", flexShrink: 0 }}>
            <button onClick={() => { if (!completed.includes(lesson)) setCompleted(c => [...c, lesson]); setLesson(l => Math.min(l + 1, lessons.length - 1)); }} style={{ width: "100%", padding: "8px 0", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {completed.includes(lesson) ? "Next Module →" : "Mark Complete ✓"}
            </button>
          </div>
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 12. Business / Startup Output ───────────────────────────────────────────

function BusinessOutput({ project, compact }: RendererProps) {
  const [slide, setSlide] = useState(0);
  const content = getContent(project, ["pitch", "deck", "overview", "vision", "one-pager"]);
  const lines = content.split("\n").filter(l => l.trim().length > 8);
  const slides = [
    { title: project.name, subtitle: lines[0] || "Building the future, one product at a time.", icon: project.icon, color: project.color || "#6366f1" },
    { title: "The Problem", subtitle: lines[1] || "Existing solutions are fragmented, slow, and expensive.", icon: "🎯", color: "#f59e0b" },
    { title: "Our Solution", subtitle: lines[2] || "An AI-native platform that automates 90% of the workflow.", icon: "✨", color: "#10b981" },
    { title: "Market Size", subtitle: "$48B TAM growing at 34% CAGR. Land-and-expand GTM.", icon: "📊", color: "#6366f1" },
    { title: "Traction", subtitle: "1,200 waitlist · 3 pilots · $180K pre-seed committed.", icon: "🚀", color: "#8b5cf6" },
    { title: "The Ask", subtitle: "Raising $2M seed to hire 4 engineers and reach 1K paying customers.", icon: "💰", color: "#ec4899" },
  ];
  const cur = slides[slide];
  return (
    <OutputShell label={`${project.name} — Pitch Deck`} icon="📊" color={project.color || "#6366f1"} compact={compact}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ flex: 1, background: `linear-gradient(135deg, ${cur.color}12, ${cur.color}05)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: compact ? 16 : 30, textAlign: "center" }}>
          <div style={{ fontSize: compact ? 26 : 44, marginBottom: compact ? 8 : 14 }}>{cur.icon}</div>
          <div style={{ fontSize: compact ? 13 : 22, fontWeight: 800, color: "#0f172a", marginBottom: compact ? 5 : 10 }}>{cur.title}</div>
          <div style={{ fontSize: compact ? 10 : 13, color: "#64748b", maxWidth: 380, lineHeight: 1.6 }}>{cur.subtitle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "7px 12px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#fafafa", flexShrink: 0 }}>
          <button onClick={() => setSlide(s => Math.max(0, s - 1))} disabled={slide === 0} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11, color: "#64748b", opacity: slide === 0 ? 0.3 : 1 }}>◀</button>
          <div style={{ display: "flex", gap: 5 }}>{slides.map((_, i) => <button key={i} onClick={() => setSlide(i)} style={{ width: 7, height: 7, borderRadius: "50%", border: "none", cursor: "pointer", background: slide === i ? cur.color : "#e2e8f0" }} />)}</div>
          <button onClick={() => setSlide(s => Math.min(slides.length - 1, s + 1))} disabled={slide === slides.length - 1} style={{ background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11, color: "#64748b", opacity: slide === slides.length - 1 ? 0.3 : 1 }}>▶</button>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>{slide + 1}/{slides.length}</span>
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 13. Physical Product Output ──────────────────────────────────────────────

function ProductOutput({ project, compact }: RendererProps) {
  const [rotating, setRotating] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const angleRef = useRef(0);
  const rotRef = useRef(rotating); rotRef.current = rotating;
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2;
    const draw = () => {
      if (rotRef.current) angleRef.current += 0.015;
      const a = angleRef.current, p = 0.3 + 0.2 * Math.abs(Math.cos(a));
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = "#f8fafc"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(0,0,0,0.05)"; ctx.beginPath(); ctx.ellipse(cx, cy + 58, 58 * Math.abs(Math.cos(a)) + 18, 9, 0, 0, Math.PI * 2); ctx.fill();
      const color = project.color || "#6366f1", w = 76, h = 86, d = 28;
      ctx.fillStyle = color; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 5); else ctx.rect(cx - w / 2, cy - h / 2, w, h); ctx.fill();
      ctx.fillStyle = `color-mix(in srgb, ${color} 55%, white)`;
      ctx.beginPath(); ctx.moveTo(cx - w / 2, cy - h / 2); ctx.lineTo(cx - w / 2 + d * p, cy - h / 2 - d * p); ctx.lineTo(cx + w / 2 + d * p, cy - h / 2 - d * p); ctx.lineTo(cx + w / 2, cy - h / 2); ctx.fill();
      ctx.fillStyle = `color-mix(in srgb, ${color} 38%, #000)`;
      ctx.beginPath(); ctx.moveTo(cx + w / 2, cy - h / 2); ctx.lineTo(cx + w / 2 + d * p, cy - h / 2 - d * p); ctx.lineTo(cx + w / 2 + d * p, cy + h / 2 - d * p); ctx.lineTo(cx + w / 2, cy + h / 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = `bold ${compact ? 11 : 14}px system-ui`; ctx.textAlign = "center"; ctx.fillText(project.icon, cx, cy - 6);
      ctx.font = `${compact ? 7 : 9}px system-ui`; ctx.fillText(project.name.slice(0, 12), cx, cy + 12); ctx.textAlign = "left";
      animRef.current = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(animRef.current);
  }, [project.color, project.icon, project.name, compact]);
  const specs = getContent(project, ["spec", "product"]).split("\n").filter(l => l.trim().length > 5).slice(0, 4);
  return (
    <OutputShell label={`${project.name} — Product`} icon="📦" color={project.color || "#6366f1"} compact={compact}>
      <div style={{ display: "flex", height: "100%" }}>
        <div style={{ flex: compact ? 1 : "0 0 55%", position: "relative" }}>
          <canvas ref={canvasRef} width={280} height={compact ? 150 : 230} style={{ width: "100%", height: "100%", cursor: "pointer" }} onClick={() => setRotating(r => !r)} />
          <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "#94a3b8" }}>{rotating ? "Click to pause" : "Click to rotate"}</div>
        </div>
        {!compact && (
          <div style={{ flex: 1, padding: "14px 12px", borderLeft: "1px solid rgba(0,0,0,0.07)", overflowY: "auto" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Product Specs</div>
            {(specs.length > 0 ? specs : ["Materials: Premium aluminum alloy", "Dimensions: 15 × 10 × 5 cm", "Weight: 280g", "Certification: CE / FCC"]).map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7, fontSize: 11, color: "#64748b", alignItems: "flex-start" }}>
                <span style={{ color: project.color || "#6366f1", fontWeight: 700, flexShrink: 0 }}>·</span><span>{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </OutputShell>
  );
}

// ─── 14. Document Output ──────────────────────────────────────────────────────

function DocumentOutput({ project, compact }: RendererProps) {
  const content = getContent(project, ["document", "report", "brief", "proposal"]);
  const sections = content.split("\n\n").filter(p => p.trim().length > 10);
  const defaultSections = [
    "Executive Summary\n\nThis document outlines the key objectives, methodology, and expected outcomes for the project.",
    "Background & Context\n\nThe market has shifted significantly, creating a unique opportunity for innovation.",
    "Proposed Approach\n\nOur strategy centers on three pillars: speed, quality, and scalability.",
  ];
  return (
    <OutputShell label={`${project.name} — Document`} icon="📄" color="#0ea5e9" compact={compact}>
      <div style={{ height: "100%", overflowY: "auto", background: "#f1f5f9", padding: compact ? 8 : 14 }}>
        <div style={{ maxWidth: 560, margin: "0 auto", background: "#fff", borderRadius: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: compact ? "12px 14px" : "28px 32px" }}>
          <div style={{ borderBottom: `3px solid ${project.color || "#0ea5e9"}`, paddingBottom: 10, marginBottom: 16 }}>
            <div style={{ fontSize: compact ? 13 : 18, fontWeight: 800, color: "#0f172a" }}>{project.name}</div>
            <div style={{ fontSize: compact ? 9 : 10, color: "#94a3b8", marginTop: 3 }}>Generated Document · {new Date().toLocaleDateString()}</div>
          </div>
          {(sections.length > 0 ? sections : defaultSections).slice(0, compact ? 2 : 5).map((s, i) => {
            const [title, ...body] = s.split("\n");
            return (
              <div key={i} style={{ marginBottom: compact ? 10 : 18 }}>
                <div style={{ fontSize: compact ? 10 : 12, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: compact ? 9 : 11, color: "#64748b", lineHeight: 1.7 }}>{body.join(" ")}</div>
              </div>
            );
          })}
        </div>
      </div>
    </OutputShell>
  );
}

// ─── 15. Dashboard Output (generic) ───────────────────────────────────────────

function DashboardOutput({ project, compact }: RendererProps) {
  const metrics = [
    { label: "Progress", value: "68%", trend: "+12%", color: "#10b981" },
    { label: "Tasks Done", value: "24", trend: "+3 today", color: "#6366f1" },
    { label: "Files", value: String(project.files.length), trend: "active", color: "#f59e0b" },
    { label: "Score", value: "A+", trend: "excellent", color: "#ec4899" },
  ];
  return (
    <OutputShell label={`${project.name}`} icon={project.icon} color={project.color || "#6366f1"} compact={compact}>
      <div style={{ height: "100%", overflowY: "auto", padding: compact ? 10 : 18, background: "#f8fafc" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: compact ? 8 : 11, marginBottom: compact ? 8 : 14 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ background: "#fff", borderRadius: 10, padding: compact ? "10px 12px" : "12px 14px", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: compact ? 9 : 9, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: compact ? 18 : 22, fontWeight: 800, color: m.color, marginBottom: 1 }}>{m.value}</div>
              <div style={{ fontSize: compact ? 8 : 9, color: "#64748b" }}>{m.trend}</div>
            </div>
          ))}
        </div>
        {!compact && (
          <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Project Files ({project.files.length})</div>
            {project.files.slice(0, 5).map(f => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <span style={{ fontSize: 13 }}>{f.type === "document" ? "📄" : f.type === "image" ? "🖼️" : "📁"}</span>
                <span style={{ fontSize: 11, color: "#1e293b", flex: 1 }}>{f.name}</span>
                <span style={{ fontSize: 9, color: "#94a3b8" }}>{f.type}</span>
              </div>
            ))}
            {project.files.length === 0 && <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", padding: "10px 0" }}>No files yet — scaffold will populate these</div>}
          </div>
        )}
      </div>
    </OutputShell>
  );
}

// ─── Renderer Registry (fully extensible) ────────────────────────────────────

const OUTPUT_RENDERERS: Record<OutputType, React.ComponentType<RendererProps>> = {
  film:        FilmStoryboardOutput,
  documentary: DocumentaryOutput,
  video:       VideoOutput,
  game:        GameOutput,
  app:         AppOutput,
  website:     WebOutput,
  block:       BlockOutput,
  book:        BookOutput,
  music:       MusicOutput,
  podcast:     PodcastOutput,
  course:      CourseOutput,
  business:    BusinessOutput,
  startup:     BusinessOutput,
  product:     ProductOutput,
  document:    DocumentOutput,
  dashboard:   DashboardOutput,
};

// ─── Main Export ──────────────────────────────────────────────────────────────

export function ProjectOutputLayer({ project, compact = false }: ProjectOutputLayerProps) {
  const outputType = detectOutputType(project.industry);
  const Renderer = OUTPUT_RENDERERS[outputType] ?? DashboardOutput;
  return <Renderer project={project} compact={compact} />;
}
