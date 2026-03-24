/**
 * KidsCreativeSpacePage.tsx
 * Safe, imagination-first creative hub for kids.
 * Family Universe Standing Law applies in full.
 * All data is family-local (localStorage). No external sharing. No social feeds.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";

const SAGE   = "#7a9068";
const CREAM  = "#faf9f6";
const TEXT   = "#1a1916";
const MUTED  = "#6b6660";
const BORDER = "rgba(122,144,104,0.15)";

const LS_DRAWINGS   = "kids_creative_drawings_v1";
const LS_STORIES    = "kids_creative_stories_v1";
const LS_CHARACTERS = "kids_creative_characters_v1";

function uid() { return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2); }
function loadJ<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } }
function saveJ(k: string, v: unknown) { localStorage.setItem(k, JSON.stringify(v)); }

interface Drawing    { id: string; name: string; dataUrl: string; date: string }
interface Story      { id: string; title: string; body: string; date: string }
interface Character  { id: string; name: string; type: string; color: string; ability: string; emoji: string; date: string }

// ─── Drawing Studio ───────────────────────────────────────────────────────────
const PALETTE = ["#1a1916","#e8826a","#7a9068","#6a8db5","#9a7ab5","#f59e0b","#ec4899","#10b981","#f97316","#ffffff","#fde68a","#bfdbfe"];

function DrawingStudio({ onSave }: { onSave: () => void }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const drawing    = useRef(false);
  const lastPos    = useRef<{ x: number; y: number } | null>(null);

  const [color,     setColor]     = useState("#1a1916");
  const [brushSize, setBrushSize] = useState(4);
  const [tool,      setTool]      = useState<"draw" | "erase">("draw");
  const [name,      setName]      = useState("");
  const [saved,     setSaved]     = useState(false);

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  // Fill with white on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width  / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    lastPos.current = getPos(e);
    const ctx = getCtx();
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(lastPos.current.x, lastPos.current.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === "erase" ? "#ffffff" : color;
    ctx.fill();
  }

  function doDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !lastPos.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "erase" ? "#ffffff" : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  }

  function stopDraw() { drawing.current = false; lastPos.current = null; }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function saveDrawing() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const drawings = loadJ<Drawing[]>(LS_DRAWINGS, []);
    const entry: Drawing = { id: uid(), name: name.trim() || "My Drawing", dataUrl, date: new Date().toISOString() };
    saveJ(LS_DRAWINGS, [entry, ...drawings]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave();
  }

  const BRUSH_SIZES = [2, 4, 8, 14, 22];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: `1px solid ${BORDER}` }}>
        <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: BORDER }}>
          <p className="font-black text-[15px]" style={{ color: TEXT }}>🎨 Drawing Studio</p>
          <div className="flex gap-2">
            <button onClick={clearCanvas}
              className="text-[11px] px-3 py-1.5 rounded-xl font-semibold"
              style={{ background: "#fef2f2", color: "#dc2626" }}>
              Clear
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="px-3 pt-3">
          <canvas
            ref={canvasRef}
            width={600} height={400}
            className="w-full rounded-xl touch-none"
            style={{ cursor: tool === "erase" ? "cell" : "crosshair", border: `1px solid ${BORDER}`, background: "white" }}
            onPointerDown={startDraw}
            onPointerMove={doDraw}
            onPointerUp={stopDraw}
            onPointerLeave={stopDraw}
          />
        </div>

        {/* Controls */}
        <div className="p-3 space-y-3">
          {/* Tools */}
          <div className="flex gap-2">
            <button onClick={() => setTool("draw")}
              className="flex-1 py-2 rounded-xl text-[12px] font-bold"
              style={{ background: tool === "draw" ? SAGE : "white", color: tool === "draw" ? "white" : MUTED, border: `1px solid ${tool === "draw" ? SAGE : BORDER}` }}>
              ✏️ Draw
            </button>
            <button onClick={() => setTool("erase")}
              className="flex-1 py-2 rounded-xl text-[12px] font-bold"
              style={{ background: tool === "erase" ? "#f97316" : "white", color: tool === "erase" ? "white" : MUTED, border: `1px solid ${tool === "erase" ? "#f97316" : BORDER}` }}>
              ✏️ Erase
            </button>
          </div>

          {/* Palette */}
          <div>
            <p className="text-[10px] font-semibold mb-1.5" style={{ color: MUTED }}>COLOR</p>
            <div className="flex flex-wrap gap-1.5">
              {PALETTE.map(c => (
                <button key={c} onClick={() => { setColor(c); setTool("draw"); }}
                  className="w-7 h-7 rounded-lg transition-all"
                  style={{
                    background: c,
                    border: color === c && tool === "draw" ? "3px solid #1a1916" : `1px solid ${BORDER}`,
                    transform: color === c && tool === "draw" ? "scale(1.2)" : "none",
                  }} />
              ))}
            </div>
          </div>

          {/* Brush size */}
          <div>
            <p className="text-[10px] font-semibold mb-1.5" style={{ color: MUTED }}>BRUSH SIZE</p>
            <div className="flex gap-2 items-center">
              {BRUSH_SIZES.map(s => (
                <button key={s} onClick={() => setBrushSize(s)}
                  className="rounded-full flex items-center justify-center transition-all"
                  style={{
                    width: Math.max(18, s + 10),
                    height: Math.max(18, s + 10),
                    background: brushSize === s ? (tool === "erase" ? "#f97316" : SAGE) : "#f0f0f0",
                    border: brushSize === s ? "2px solid transparent" : `1px solid ${BORDER}`,
                  }} />
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex gap-2">
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Name your drawing (optional)"
              className="flex-1 rounded-xl px-3 py-2 text-[12px] border outline-none"
              style={{ background: "#fafafa", borderColor: BORDER, color: TEXT }} />
            <button onClick={saveDrawing}
              className="px-4 py-2 rounded-xl text-[13px] font-black text-white"
              style={{ background: saved ? "#10b981" : `linear-gradient(135deg, ${SAGE}, #9CAF88)` }}>
              {saved ? "Saved! 🌟" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Story Studio ─────────────────────────────────────────────────────────────
const STORY_PROMPTS = [
  "A day in our family universe…",
  "My favorite imaginary world…",
  "The bravest thing I ever did…",
  "Once, a magical creature appeared at school…",
  "If I could fly anywhere, I would go to…",
  "The best superpower would be…",
  "One day, my family found a secret door that led to…",
  "My robot friend could do anything. It helped me…",
];

function StoryStudio({ onSave }: { onSave: () => void }) {
  const [title,  setTitle]  = useState("");
  const [body,   setBody]   = useState("");
  const [saved,  setSaved]  = useState(false);

  function applyPrompt(p: string) { setBody(p + " "); }

  function saveStory() {
    if (!body.trim()) return;
    const stories = loadJ<Story[]>(LS_STORIES, []);
    const entry: Story = { id: uid(), title: title.trim() || "My Story", body: body.trim(), date: new Date().toISOString() };
    saveJ(LS_STORIES, [entry, ...stories]);
    setSaved(true);
    setTimeout(() => { setSaved(false); setTitle(""); setBody(""); }, 2000);
    onSave();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: `1px solid ${BORDER}` }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: BORDER }}>
          <p className="font-black text-[15px]" style={{ color: TEXT }}>📖 Story Studio</p>
          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Write anything — your stories are only for you and your family.</p>
        </div>
        <div className="p-4 space-y-3">
          {/* Starter prompts */}
          <div>
            <p className="text-[10px] font-semibold mb-1.5" style={{ color: MUTED }}>START WITH A PROMPT</p>
            <div className="flex flex-wrap gap-1.5">
              {STORY_PROMPTS.map(p => (
                <button key={p} onClick={() => applyPrompt(p)}
                  className="text-[10px] px-2.5 py-1 rounded-full border transition-all"
                  style={{ background: "white", borderColor: BORDER, color: MUTED }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Story title (optional)"
            className="w-full rounded-xl px-3 py-2.5 text-[14px] font-semibold border outline-none"
            style={{ background: "#fafafa", borderColor: BORDER, color: TEXT }} />
          <textarea value={body} onChange={e => setBody(e.target.value)}
            rows={8} placeholder="Write your story here. There are no wrong answers — just let your imagination go!"
            className="w-full rounded-xl px-3 py-2.5 text-[13px] border outline-none resize-none leading-relaxed"
            style={{ background: "#fafafa", borderColor: BORDER, color: TEXT }} />
          <div className="flex items-center justify-between">
            <p className="text-[10px]" style={{ color: MUTED }}>{body.length} characters</p>
            <button onClick={saveStory} disabled={!body.trim()}
              className="px-5 py-2.5 rounded-xl text-[13px] font-black text-white disabled:opacity-40"
              style={{ background: saved ? "#10b981" : `linear-gradient(135deg, ${SAGE}, #9CAF88)` }}>
              {saved ? "Saved! 🌟" : "Save Story"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Character Creator ────────────────────────────────────────────────────────
const CHAR_TYPES = [
  { id: "human",    label: "Human",   emoji: "🧑" },
  { id: "animal",   label: "Animal",  emoji: "🐾" },
  { id: "creature", label: "Creature",emoji: "🦄" },
  { id: "robot",    label: "Robot",   emoji: "🤖" },
  { id: "wizard",   label: "Wizard",  emoji: "🧙" },
  { id: "dragon",   label: "Dragon",  emoji: "🐉" },
  { id: "alien",    label: "Alien",   emoji: "👽" },
  { id: "superhero",label: "Hero",    emoji: "🦸" },
];

const ABILITIES = [
  "Flying", "Time travel", "Super strength", "Invisibility", "Healing",
  "Mind reading", "Talking to animals", "Breathing underwater", "Teleportation",
  "Making plants grow", "Controlling weather", "Speaking all languages",
];

const CHAR_COLORS = ["#e8826a","#7a9068","#6a8db5","#9a7ab5","#f59e0b","#ec4899","#10b981","#f97316","#64748b","#c4a97a"];

function CharacterCreator({ onSave }: { onSave: () => void }) {
  const [name,    setName]    = useState("");
  const [type,    setType]    = useState("human");
  const [clr,     setClr]     = useState("#7a9068");
  const [ability, setAbility] = useState("");
  const [saved,   setSaved]   = useState(false);

  const charEmoji = CHAR_TYPES.find(t => t.id === type)?.emoji ?? "🧑";

  function saveChar() {
    if (!name.trim()) return;
    const chars = loadJ<Character[]>(LS_CHARACTERS, []);
    const entry: Character = { id: uid(), name: name.trim(), type, color: clr, ability: ability || "Unknown power", emoji: charEmoji, date: new Date().toISOString() };
    saveJ(LS_CHARACTERS, [entry, ...chars]);
    setSaved(true);
    setTimeout(() => { setSaved(false); setName(""); setAbility(""); }, 2000);
    onSave();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: `1px solid ${BORDER}` }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: BORDER }}>
          <p className="font-black text-[15px]" style={{ color: TEXT }}>🦸 Character Creator</p>
          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Build a character. Give them powers. Tell their story.</p>
        </div>
        <div className="p-4 space-y-4">
          {/* Preview */}
          <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: clr + "15", border: `1px solid ${clr}30` }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl" style={{ background: clr + "25" }}>
              {charEmoji}
            </div>
            <div>
              <p className="font-black text-[18px]" style={{ color: TEXT }}>{name || "Unnamed Hero"}</p>
              <p className="text-[12px]" style={{ color: MUTED }}>{CHAR_TYPES.find(t => t.id === type)?.label} · {ability || "Power unknown"}</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <p className="text-[10px] font-semibold mb-1" style={{ color: MUTED }}>CHARACTER NAME</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Captain Starshine"
              className="w-full rounded-xl px-3 py-2.5 text-[14px] font-semibold border outline-none"
              style={{ background: "#fafafa", borderColor: BORDER, color: TEXT }} />
          </div>

          {/* Type */}
          <div>
            <p className="text-[10px] font-semibold mb-1.5" style={{ color: MUTED }}>TYPE</p>
            <div className="grid grid-cols-4 gap-1.5">
              {CHAR_TYPES.map(t => (
                <button key={t.id} onClick={() => setType(t.id)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all"
                  style={{ background: type === t.id ? `${clr}15` : "white", borderColor: type === t.id ? clr : BORDER }}>
                  <span className="text-2xl">{t.emoji}</span>
                  <span className="text-[9px] font-semibold" style={{ color: TEXT }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Favorite color */}
          <div>
            <p className="text-[10px] font-semibold mb-1.5" style={{ color: MUTED }}>FAVORITE COLOR</p>
            <div className="flex flex-wrap gap-1.5">
              {CHAR_COLORS.map(c => (
                <button key={c} onClick={() => setClr(c)}
                  className="w-8 h-8 rounded-xl transition-all"
                  style={{ background: c, border: clr === c ? "3px solid #1a1916" : `1px solid ${BORDER}`, transform: clr === c ? "scale(1.15)" : "none" }} />
              ))}
            </div>
          </div>

          {/* Special ability */}
          <div>
            <p className="text-[10px] font-semibold mb-1.5" style={{ color: MUTED }}>SPECIAL ABILITY</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {ABILITIES.map(a => (
                <button key={a} onClick={() => setAbility(a)}
                  className="text-[10px] px-2.5 py-1 rounded-full border"
                  style={{ background: ability === a ? `${clr}20` : "white", borderColor: ability === a ? clr : BORDER, color: MUTED }}>
                  {a}
                </button>
              ))}
            </div>
            <input value={ability} onChange={e => setAbility(e.target.value)} placeholder="Or invent your own power!"
              className="w-full rounded-xl px-3 py-2 text-[12px] border outline-none"
              style={{ background: "#fafafa", borderColor: BORDER, color: TEXT }} />
          </div>

          <button onClick={saveChar} disabled={!name.trim()}
            className="w-full py-3 rounded-xl text-[15px] font-black text-white disabled:opacity-40"
            style={{ background: saved ? "#10b981" : `linear-gradient(135deg, ${SAGE}, #9CAF88)` }}>
            {saved ? "Character Created! 🌟" : "Create Character"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Creative Gallery ─────────────────────────────────────────────────────────
function CreativeGallery() {
  const [drawings,    setDrawings]    = useState<Drawing[]>([]);
  const [stories,     setStories]     = useState<Story[]>([]);
  const [characters,  setCharacters]  = useState<Character[]>([]);
  const [view, setView]               = useState<"drawings" | "stories" | "characters">("drawings");

  useEffect(() => {
    setDrawings(loadJ(LS_DRAWINGS, []));
    setStories(loadJ(LS_STORIES, []));
    setCharacters(loadJ(LS_CHARACTERS, []));
  }, []);

  const deleteDrawing = (id: string) => {
    const next = drawings.filter(d => d.id !== id);
    setDrawings(next); saveJ(LS_DRAWINGS, next);
  };
  const deleteStory = (id: string) => {
    const next = stories.filter(s => s.id !== id);
    setStories(next); saveJ(LS_STORIES, next);
  };
  const deleteChar = (id: string) => {
    const next = characters.filter(c => c.id !== id);
    setCharacters(next); saveJ(LS_CHARACTERS, next);
  };

  const total = drawings.length + stories.length + characters.length;

  return (
    <div className="flex flex-col gap-4">
      {total === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: "white", border: `1px solid ${BORDER}` }}>
          <div className="text-5xl mb-3">🌟</div>
          <p className="font-black text-[16px] mb-2" style={{ color: TEXT }}>Your gallery is empty</p>
          <p className="text-[13px]" style={{ color: MUTED }}>Create drawings, stories, or characters — they'll all appear here!</p>
        </div>
      ) : (
        <>
          {/* Filter tabs */}
          <div className="flex gap-1.5">
            {[
              { id: "drawings",   label: "Drawings",   count: drawings.length,   icon: "🎨" },
              { id: "stories",    label: "Stories",    count: stories.length,    icon: "📖" },
              { id: "characters", label: "Characters", count: characters.length, icon: "🦸" },
            ].map(t => (
              <button key={t.id} onClick={() => setView(t.id as typeof view)}
                className="flex-1 py-2 rounded-xl text-[11px] font-bold border"
                style={{ background: view === t.id ? SAGE : "white", color: view === t.id ? "white" : MUTED, borderColor: view === t.id ? SAGE : BORDER }}>
                {t.icon} {t.label} ({t.count})
              </button>
            ))}
          </div>

          {/* Drawings */}
          {view === "drawings" && (
            <div className="grid grid-cols-2 gap-2">
              {drawings.length === 0 && <p className="col-span-2 text-center text-[12px] py-4" style={{ color: MUTED }}>No drawings yet</p>}
              {drawings.map(d => (
                <div key={d.id} className="rounded-2xl overflow-hidden" style={{ background: "white", border: `1px solid ${BORDER}` }}>
                  <img src={d.dataUrl} alt={d.name} className="w-full" style={{ imageRendering: "pixelated" }} />
                  <div className="p-2">
                    <p className="font-semibold text-[11px] truncate" style={{ color: TEXT }}>{d.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px]" style={{ color: MUTED }}>{new Date(d.date).toLocaleDateString()}</span>
                      <button onClick={() => deleteDrawing(d.id)} className="text-[10px] opacity-30 hover:opacity-70">×</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stories */}
          {view === "stories" && (
            <div className="space-y-2">
              {stories.length === 0 && <p className="text-center text-[12px] py-4" style={{ color: MUTED }}>No stories yet</p>}
              {stories.map(s => (
                <div key={s.id} className="rounded-2xl p-4" style={{ background: "white", border: `1px solid ${BORDER}` }}>
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-black text-[14px]" style={{ color: TEXT }}>📖 {s.title}</p>
                    <button onClick={() => deleteStory(s.id)} className="text-[12px] opacity-30 hover:opacity-70 flex-shrink-0 ml-2">×</button>
                  </div>
                  <p className="text-[12px] leading-relaxed line-clamp-3" style={{ color: MUTED }}>{s.body}</p>
                  <p className="text-[9px] mt-2" style={{ color: MUTED }}>{new Date(s.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}

          {/* Characters */}
          {view === "characters" && (
            <div className="grid grid-cols-2 gap-2">
              {characters.length === 0 && <p className="col-span-2 text-center text-[12px] py-4" style={{ color: MUTED }}>No characters yet</p>}
              {characters.map(c => (
                <div key={c.id} className="rounded-2xl p-3 relative" style={{ background: c.color + "12", border: `1px solid ${c.color}30` }}>
                  <button onClick={() => deleteChar(c.id)} className="absolute top-2 right-2 text-[11px] opacity-30 hover:opacity-60">×</button>
                  <div className="text-4xl mb-2">{c.emoji}</div>
                  <p className="font-black text-[13px]" style={{ color: TEXT }}>{c.name}</p>
                  <p className="text-[10px]" style={{ color: MUTED }}>{CHAR_TYPES.find(t => t.id === c.type)?.label}</p>
                  <p className="text-[10px] font-semibold mt-1" style={{ color: c.color }}>{c.ability}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type CreativeTab = "draw" | "story" | "character" | "gallery";

const CREATIVE_TABS: { id: CreativeTab; label: string; icon: string; color: string }[] = [
  { id: "draw",      label: "Draw",      icon: "🎨", color: "#e8826a" },
  { id: "story",     label: "Stories",   icon: "📖", color: "#6a8db5" },
  { id: "character", label: "Characters",icon: "🦸", color: "#9a7ab5" },
  { id: "gallery",   label: "Gallery",   icon: "🖼️", color: SAGE     },
];

export default function KidsCreativeSpacePage() {
  const [tab,    setTab]    = useState<CreativeTab>("draw");
  const [galKey, setGalKey] = useState(0); // force gallery refresh after saves

  const refreshGallery = useCallback(() => {
    if (tab === "gallery") setGalKey(k => k + 1);
  }, [tab]);

  return (
    <div className="min-h-screen pb-28" style={{ background: CREAM }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3"
        style={{ background: "rgba(250,249,246,0.97)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()}
            className="text-[13px] font-semibold" style={{ color: MUTED }}>
            ← Back
          </button>
          <div className="flex-1 text-center">
            <p className="font-black text-[16px]" style={{ color: TEXT }}>My Creative Space ✨</p>
          </div>
          <div className="w-12" />
        </div>
      </div>

      {/* Hero */}
      <div className="px-4 pt-5 pb-3 text-center">
        <p className="text-[14px]" style={{ color: MUTED }}>
          Everything here is just for you and your family. Make, imagine, create!
        </p>
      </div>

      {/* Tab bar */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-4 gap-1.5 rounded-2xl p-1.5" style={{ background: "rgba(0,0,0,0.04)" }}>
          {CREATIVE_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
              style={{
                background: tab === t.id ? t.color : "transparent",
                color: tab === t.id ? "white" : MUTED,
              }}>
              <span className="text-[20px]">{t.icon}</span>
              <span className="text-[9px] font-bold">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        {tab === "draw"      && <DrawingStudio   onSave={refreshGallery} />}
        {tab === "story"     && <StoryStudio     onSave={refreshGallery} />}
        {tab === "character" && <CharacterCreator onSave={refreshGallery} />}
        {tab === "gallery"   && <CreativeGallery key={galKey} />}
      </div>

      {/* Safety note */}
      <div className="mx-4 mt-6 p-3 rounded-2xl text-center" style={{ background: `${SAGE}08`, border: `1px solid ${SAGE}18` }}>
        <p className="text-[11px]" style={{ color: MUTED }}>
          🔒 Your creations are private — only you and your family can see them.
        </p>
      </div>

      {/* Fixed bottom tab bar (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-40"
        style={{ background: "rgba(250,249,246,0.97)", backdropFilter: "blur(10px)", borderTop: `1px solid ${BORDER}` }}>
        <div className="flex">
          {CREATIVE_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-3 transition-all"
              style={{ color: tab === t.id ? t.color : MUTED }}>
              <span className="text-[20px]">{t.icon}</span>
              <span className="text-[9px] font-bold">{t.label}</span>
              {tab === t.id && <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: t.color }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
