/**
 * MemoryGardenPanel.tsx
 * A warm, personal space for family memories — photos, moments, inside jokes,
 * celebrations, and notes. localStorage-only. No fake data.
 */
import React, { useState, useEffect, useCallback } from "react";

const SAGE    = "#9CAF88";
const SAGE_D  = "#7a9068";
const WARM    = "#fdf8f0";
const WARM_B  = "#f5ede0";
const TEXT    = "#2d2a24";
const MUTED   = "#6b6560";
const BORDER  = "rgba(0,0,0,0.07)";

const LS_KEY = "family_memory_garden_v1";

type Category = "moment" | "joke" | "celebration" | "note" | "milestone";

interface Memory {
  id:         string;
  title:      string;
  body:       string;
  category:   Category;
  emoji:      string;
  date:       string;          // ISO date string
  pinned:     boolean;
}

const CATEGORIES: { id: Category; label: string; emoji: string; color: string }[] = [
  { id: "moment",      label: "Moment",      emoji: "💛", color: "#f59e0b" },
  { id: "joke",        label: "Inside Joke", emoji: "😄", color: "#f97316" },
  { id: "celebration", label: "Celebration", emoji: "🎉", color: "#8b5cf6" },
  { id: "note",        label: "Love Note",   emoji: "💌", color: "#ec4899" },
  { id: "milestone",   label: "Milestone",   emoji: "🌟", color: SAGE_D   },
];

function catInfo(c: Category) {
  return CATEGORIES.find(x => x.id === c) ?? CATEGORIES[0];
}

function loadMemories(): Memory[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveMemories(list: Memory[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

// ─── Add memory modal ────────────────────────────────────────────────────────
function AddMemoryModal({ onAdd, onClose }: { onAdd: (m: Memory) => void; onClose: () => void }) {
  const [title,    setTitle]    = useState("");
  const [body,     setBody]     = useState("");
  const [category, setCategory] = useState<Category>("moment");
  const [emoji,    setEmoji]    = useState("💛");

  const EMOJI_OPTS = ["💛","😄","🎉","💌","🌟","📸","🏡","🌈","🎂","🏆","🌻","🐾","⛄","🌊","🎵","✨","🤗","💪","🌙","☀️"];

  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      id:       crypto.randomUUID?.() ?? Date.now().toString(),
      title:    title.trim(),
      body:     body.trim(),
      category,
      emoji,
      date:     new Date().toISOString(),
      pinned:   false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: WARM }}>
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: BORDER }}>
          <p className="font-bold text-[15px]" style={{ color: TEXT }}>Add a Memory</p>
          <button onClick={onClose} className="text-xl opacity-40 hover:opacity-70">×</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {/* Category */}
          <div>
            <p className="text-[11px] font-semibold mb-1.5" style={{ color: MUTED }}>TYPE</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)}
                  className="text-[11px] font-semibold px-3 py-1 rounded-full border transition-all"
                  style={{
                    background: category === c.id ? c.color : "white",
                    color:      category === c.id ? "white"  : TEXT,
                    borderColor: category === c.id ? c.color : BORDER,
                  }}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>
          {/* Emoji */}
          <div>
            <p className="text-[11px] font-semibold mb-1.5" style={{ color: MUTED }}>EMOJI</p>
            <div className="flex flex-wrap gap-1">
              {EMOJI_OPTS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className="w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all"
                  style={{ background: emoji === e ? `${SAGE}22` : "transparent", outline: emoji === e ? `2px solid ${SAGE}` : "none" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          {/* Title */}
          <div>
            <p className="text-[11px] font-semibold mb-1" style={{ color: MUTED }}>TITLE</p>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Dad's famous pancake story"
              className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
              style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          </div>
          {/* Body */}
          <div>
            <p className="text-[11px] font-semibold mb-1" style={{ color: MUTED }}>DETAILS (optional)</p>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              rows={3} placeholder="Tell the full story…"
              className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none resize-none"
              style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{ background: "white", border: `1px solid ${BORDER}`, color: MUTED }}>
            Cancel
          </button>
          <button onClick={submit} disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-40 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${SAGE_D}, ${SAGE})` }}>
            Save Memory
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Memory card ─────────────────────────────────────────────────────────────
function MemoryCard({ memory, onPin, onDelete }: {
  memory: Memory;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cat = catInfo(memory.category);
  const dateStr = new Date(memory.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: "white", border: `1px solid ${BORDER}`, boxShadow: memory.pinned ? `0 0 0 2px ${SAGE}` : "none" }}>
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 p-4 text-left">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: cat.color + "18" }}>
          {memory.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-[13px]" style={{ color: TEXT }}>{memory.title}</span>
            {memory.pinned && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${SAGE}20`, color: SAGE_D }}>📌 Pinned</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: cat.color + "18", color: cat.color }}>{cat.emoji} {cat.label}</span>
            <span className="text-[10px]" style={{ color: MUTED }}>{dateStr}</span>
          </div>
        </div>
        <span className="text-[10px] mt-1 flex-shrink-0" style={{ color: MUTED }}>{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: BORDER }}>
          {memory.body && (
            <p className="text-[12px] leading-relaxed pt-3 mb-3" style={{ color: MUTED }}>{memory.body}</p>
          )}
          <div className="flex gap-2">
            <button onClick={() => onPin(memory.id)}
              className="text-[11px] px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: `${SAGE}15`, color: SAGE_D }}>
              {memory.pinned ? "Unpin" : "📌 Pin"}
            </button>
            <button onClick={() => onDelete(memory.id)}
              className="text-[11px] px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: "#fef2f2", color: "#dc2626" }}>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────
export function MemoryGardenPanel() {
  const [memories, setMemories]   = useState<Memory[]>([]);
  const [showAdd,  setShowAdd]    = useState(false);
  const [filter,   setFilter]     = useState<Category | "all">("all");

  useEffect(() => { setMemories(loadMemories()); }, []);

  const addMemory = useCallback((m: Memory) => {
    setMemories(prev => {
      const next = [m, ...prev];
      saveMemories(next);
      return next;
    });
    setShowAdd(false);
  }, []);

  const pinMemory = useCallback((id: string) => {
    setMemories(prev => {
      const next = prev.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m);
      saveMemories(next);
      return next;
    });
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setMemories(prev => {
      const next = prev.filter(m => m.id !== id);
      saveMemories(next);
      return next;
    });
  }, []);

  const visible = memories
    .filter(m => filter === "all" || m.category === filter)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${SAGE_D}18, ${SAGE}10)`, border: `1px solid ${SAGE}25` }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌻</span>
          <div>
            <p className="font-bold text-[15px]" style={{ color: TEXT }}>Memory Garden</p>
            <p className="text-[12px]" style={{ color: MUTED }}>Your private space for moments, laughs, milestones, and love notes.</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="ml-auto px-4 py-2 rounded-xl text-[12px] font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${SAGE_D}, ${SAGE})` }}>
            + Add
          </button>
        </div>
        <div className="flex gap-1 mt-3 flex-wrap">
          <button onClick={() => setFilter("all")}
            className="text-[11px] px-3 py-1 rounded-full font-semibold border"
            style={{ background: filter === "all" ? SAGE_D : "white", color: filter === "all" ? "white" : MUTED, borderColor: filter === "all" ? SAGE_D : BORDER }}>
            All ({memories.length})
          </button>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setFilter(c.id)}
              className="text-[11px] px-3 py-1 rounded-full font-semibold border"
              style={{ background: filter === c.id ? c.color : "white", color: filter === c.id ? "white" : MUTED, borderColor: filter === c.id ? c.color : BORDER }}>
              {c.emoji} {c.label} ({memories.filter(m => m.category === c.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: WARM, border: `1px solid ${BORDER}` }}>
          <div className="text-4xl mb-3">🌱</div>
          <p className="font-semibold text-[14px] mb-1" style={{ color: TEXT }}>Your Memory Garden is waiting</p>
          <p className="text-[12px] mb-4" style={{ color: MUTED }}>Plant your first memory — a funny moment, a milestone, an inside joke, a love note.</p>
          <button onClick={() => setShowAdd(true)}
            className="px-5 py-2 rounded-xl text-[13px] font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${SAGE_D}, ${SAGE})` }}>
            Plant a Memory
          </button>
        </div>
      )}

      {/* Memory grid */}
      {visible.length > 0 && (
        <div className="space-y-2">
          {visible.map(m => (
            <MemoryCard key={m.id} memory={m} onPin={pinMemory} onDelete={deleteMemory} />
          ))}
        </div>
      )}

      {showAdd && <AddMemoryModal onAdd={addMemory} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
