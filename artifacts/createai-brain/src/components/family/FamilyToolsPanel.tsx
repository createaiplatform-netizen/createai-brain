/**
 * FamilyToolsPanel.tsx
 * Shared lists, reminders, routines, gratitude notes, chore helpers, and calendar.
 * localStorage-only. No fake data.
 */
import React, { useState, useEffect, useCallback } from "react";

const SAGE    = "#9CAF88";
const SAGE_D  = "#7a9068";
const WARM    = "#fdf8f0";
const TEXT    = "#2d2a24";
const MUTED   = "#6b6560";
const BORDER  = "rgba(0,0,0,0.07)";

// ─── Shared Lists ────────────────────────────────────────────────────────────
const LS_LISTS    = "family_shared_lists_v1";
const LS_CHORES   = "family_chores_v1";
const LS_REMIND   = "family_reminders_v1";
const LS_GRATEFUL = "family_gratitude_v1";

interface ListItem { id: string; text: string; done: boolean }
interface SharedList { id: string; name: string; emoji: string; items: ListItem[] }
interface Chore { id: string; name: string; assignee: string; emoji: string; done: boolean; recurring: boolean }
interface Reminder { id: string; text: string; date: string; done: boolean }
interface GratitudeNote { id: string; text: string; from: string; to: string; date: string }

function uid() { return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2); }

function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; }
}
function saveJSON(key: string, val: unknown) { localStorage.setItem(key, JSON.stringify(val)); }

// ─── Shared Lists ─────────────────────────────────────────────────────────────
function SharedListsPanel() {
  const [lists, setLists]     = useState<SharedList[]>([]);
  const [active, setActive]   = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📋");
  const [newItem, setNewItem] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { setLists(loadJSON(LS_LISTS, [])); }, []);

  const save = (next: SharedList[]) => { setLists(next); saveJSON(LS_LISTS, next); };

  const addList = () => {
    if (!newName.trim()) return;
    const nl: SharedList = { id: uid(), name: newName.trim(), emoji: newEmoji, items: [] };
    save([nl, ...lists]);
    setActive(nl.id);
    setNewName("");
    setCreating(false);
  };

  const addItem = (listId: string) => {
    if (!newItem.trim()) return;
    save(lists.map(l => l.id === listId ? { ...l, items: [...l.items, { id: uid(), text: newItem.trim(), done: false }] } : l));
    setNewItem("");
  };

  const toggleItem = (listId: string, itemId: string) => {
    save(lists.map(l => l.id === listId ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) } : l));
  };

  const deleteItem = (listId: string, itemId: string) => {
    save(lists.map(l => l.id === listId ? { ...l, items: l.items.filter(i => i.id !== itemId) } : l));
  };

  const deleteList = (listId: string) => {
    save(lists.filter(l => l.id !== listId));
    if (active === listId) setActive(null);
  };

  const LIST_EMOJIS = ["📋","🛒","🎁","📚","🧹","🍽️","🌿","💊","🏃","✅","📝","🎯"];
  const currentList = lists.find(l => l.id === active);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[14px]" style={{ color: TEXT }}>Shared Lists</p>
        <button onClick={() => setCreating(c => !c)}
          className="text-[12px] px-3 py-1.5 rounded-xl font-semibold text-white"
          style={{ background: SAGE_D }}>
          + New List
        </button>
      </div>

      {creating && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: WARM, border: `1px solid ${BORDER}` }}>
          <div className="flex flex-wrap gap-1">
            {LIST_EMOJIS.map(e => (
              <button key={e} onClick={() => setNewEmoji(e)}
                className="w-7 h-7 rounded-lg text-[15px] flex items-center justify-center"
                style={{ background: newEmoji === e ? `${SAGE}25` : "transparent", outline: newEmoji === e ? `2px solid ${SAGE}` : "none" }}>
                {e}
              </button>
            ))}
          </div>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="List name (e.g. Grocery, Weekend Plans)"
            className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
            style={{ background: "white", borderColor: BORDER, color: TEXT }}
            onKeyDown={ev => ev.key === "Enter" && addList()} />
          <div className="flex gap-2">
            <button onClick={() => setCreating(false)}
              className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
              style={{ background: "white", border: `1px solid ${BORDER}`, color: MUTED }}>Cancel</button>
            <button onClick={addList} disabled={!newName.trim()}
              className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-40"
              style={{ background: SAGE_D }}>Create</button>
          </div>
        </div>
      )}

      {/* List selector */}
      {lists.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {lists.map(l => (
            <button key={l.id} onClick={() => setActive(l.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border"
              style={{
                background: active === l.id ? SAGE_D : "white",
                color: active === l.id ? "white" : TEXT,
                borderColor: active === l.id ? SAGE_D : BORDER,
              }}>
              {l.emoji} {l.name}
              <span className="opacity-50 text-[10px]">({l.items.length})</span>
            </button>
          ))}
        </div>
      )}

      {/* Active list */}
      {currentList && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: `1px solid ${BORDER}` }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: BORDER }}>
            <p className="font-bold text-[13px]" style={{ color: TEXT }}>{currentList.emoji} {currentList.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: MUTED }}>{currentList.items.filter(i => i.done).length}/{currentList.items.length} done</span>
              <button onClick={() => deleteList(currentList.id)}
                className="text-[11px] px-2 py-1 rounded-lg" style={{ background: "#fef2f2", color: "#dc2626" }}>Delete</button>
            </div>
          </div>
          <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
            {currentList.items.length === 0 && (
              <p className="text-[12px] text-center py-4" style={{ color: MUTED }}>No items yet — add one below</p>
            )}
            {currentList.items.map(item => (
              <div key={item.id} className="flex items-center gap-2 py-1">
                <button onClick={() => toggleItem(currentList.id, item.id)}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ borderColor: item.done ? SAGE_D : BORDER, background: item.done ? SAGE_D : "white" }}>
                  {item.done && <span className="text-white text-[10px]">✓</span>}
                </button>
                <span className="flex-1 text-[13px]" style={{ color: item.done ? MUTED : TEXT, textDecoration: item.done ? "line-through" : "none" }}>
                  {item.text}
                </span>
                <button onClick={() => deleteItem(currentList.id, item.id)}
                  className="text-[11px] opacity-30 hover:opacity-60">×</button>
              </div>
            ))}
          </div>
          <div className="px-3 pb-3 flex gap-2 border-t pt-2" style={{ borderColor: BORDER }}>
            <input value={newItem} onChange={e => setNewItem(e.target.value)}
              placeholder="Add item…"
              className="flex-1 rounded-xl px-3 py-2 text-[13px] border outline-none"
              style={{ background: "#fafafa", borderColor: BORDER, color: TEXT }}
              onKeyDown={ev => ev.key === "Enter" && addItem(currentList.id)} />
            <button onClick={() => addItem(currentList.id)} disabled={!newItem.trim()}
              className="px-3 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-40"
              style={{ background: SAGE_D }}>Add</button>
          </div>
        </div>
      )}

      {lists.length === 0 && !creating && (
        <p className="text-[12px] text-center py-4" style={{ color: MUTED }}>Create your first shared list</p>
      )}
    </div>
  );
}

// ─── Chore Helper ─────────────────────────────────────────────────────────────
const CHORE_EMOJIS = ["🧹","🍽️","🗑️","🛁","🐾","🌿","🧺","🍳","🚗","🛏️","📚","🪟"];
const DEFAULT_CHORES: Chore[] = [
  { id: "c1", name: "Tidy living room",  assignee: "", emoji: "🧹", done: false, recurring: true },
  { id: "c2", name: "Dishes",            assignee: "", emoji: "🍽️", done: false, recurring: true },
  { id: "c3", name: "Take out trash",    assignee: "", emoji: "🗑️", done: false, recurring: true },
];

function ChoreHelperPanel() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [newChore, setNewChore] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newEmoji, setNewEmoji] = useState("🧹");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const saved = loadJSON<Chore[]>(LS_CHORES, DEFAULT_CHORES);
    setChores(saved);
  }, []);

  const save = (next: Chore[]) => { setChores(next); saveJSON(LS_CHORES, next); };
  const toggle = (id: string) => save(chores.map(c => c.id === id ? { ...c, done: !c.done } : c));
  const del = (id: string) => save(chores.filter(c => c.id !== id));
  const add = () => {
    if (!newChore.trim()) return;
    save([...chores, { id: uid(), name: newChore.trim(), assignee: newAssignee.trim(), emoji: newEmoji, done: false, recurring: false }]);
    setNewChore(""); setNewAssignee(""); setAdding(false);
  };
  const resetAll = () => save(chores.map(c => ({ ...c, done: false })));

  const doneCount = chores.filter(c => c.done).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-[14px]" style={{ color: TEXT }}>Chore Helper</p>
          <p className="text-[11px]" style={{ color: MUTED }}>{doneCount}/{chores.length} done today</p>
        </div>
        <div className="flex gap-2">
          {doneCount > 0 && (
            <button onClick={resetAll} className="text-[11px] px-3 py-1.5 rounded-xl font-semibold" style={{ background: "#fef9ec", color: "#92400e" }}>Reset</button>
          )}
          <button onClick={() => setAdding(a => !a)} className="text-[12px] px-3 py-1.5 rounded-xl font-semibold text-white" style={{ background: SAGE_D }}>+ Add</button>
        </div>
      </div>

      {/* Progress bar */}
      {chores.length > 0 && (
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${SAGE}20` }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${(doneCount / chores.length) * 100}%`, background: `linear-gradient(90deg, ${SAGE_D}, ${SAGE})` }} />
        </div>
      )}

      {adding && (
        <div className="rounded-2xl p-4 space-y-2" style={{ background: WARM, border: `1px solid ${BORDER}` }}>
          <div className="flex flex-wrap gap-1">
            {CHORE_EMOJIS.map(e => (
              <button key={e} onClick={() => setNewEmoji(e)}
                className="w-7 h-7 rounded-lg text-[14px] flex items-center justify-center"
                style={{ background: newEmoji === e ? `${SAGE}25` : "transparent", outline: newEmoji === e ? `2px solid ${SAGE}` : "none" }}>
                {e}
              </button>
            ))}
          </div>
          <input value={newChore} onChange={e => setNewChore(e.target.value)} placeholder="Chore name"
            className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
            style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          <input value={newAssignee} onChange={e => setNewAssignee(e.target.value)} placeholder="Assigned to (optional)"
            className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
            style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-xl text-[12px] font-semibold" style={{ background: "white", border: `1px solid ${BORDER}`, color: MUTED }}>Cancel</button>
            <button onClick={add} disabled={!newChore.trim()} className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-40" style={{ background: SAGE_D }}>Add</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {chores.map(c => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: c.done ? `${SAGE}08` : "white", border: `1px solid ${c.done ? SAGE + "30" : BORDER}` }}>
            <button onClick={() => toggle(c.id)}
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
              style={{ borderColor: c.done ? SAGE_D : BORDER, background: c.done ? SAGE_D : "white" }}>
              {c.done && <span className="text-white text-[11px]">✓</span>}
            </button>
            <span className="text-[16px]">{c.emoji}</span>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-semibold" style={{ color: c.done ? MUTED : TEXT, textDecoration: c.done ? "line-through" : "none" }}>{c.name}</span>
              {c.assignee && <p className="text-[10px]" style={{ color: MUTED }}>👤 {c.assignee}</p>}
            </div>
            <button onClick={() => del(c.id)} className="text-[11px] opacity-20 hover:opacity-60 flex-shrink-0">×</button>
          </div>
        ))}
        {chores.length === 0 && <p className="text-[12px] text-center py-4" style={{ color: MUTED }}>No chores added yet</p>}
      </div>
    </div>
  );
}

// ─── Reminders ───────────────────────────────────────────────────────────────
function RemindersPanel() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { setReminders(loadJSON(LS_REMIND, [])); }, []);
  const save = (next: Reminder[]) => { setReminders(next); saveJSON(LS_REMIND, next); };

  const add = () => {
    if (!text.trim()) return;
    save([{ id: uid(), text: text.trim(), date: date || "", done: false }, ...reminders]);
    setText(""); setDate(""); setAdding(false);
  };
  const toggle = (id: string) => save(reminders.map(r => r.id === id ? { ...r, done: !r.done } : r));
  const del = (id: string) => save(reminders.filter(r => r.id !== id));

  const upcoming  = reminders.filter(r => !r.done);
  const completed = reminders.filter(r => r.done);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[14px]" style={{ color: TEXT }}>Reminders</p>
        <button onClick={() => setAdding(a => !a)} className="text-[12px] px-3 py-1.5 rounded-xl font-semibold text-white" style={{ background: SAGE_D }}>+ Add</button>
      </div>

      {adding && (
        <div className="rounded-2xl p-4 space-y-2" style={{ background: WARM, border: `1px solid ${BORDER}` }}>
          <input value={text} onChange={e => setText(e.target.value)} placeholder="What to remember?"
            className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
            style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
            style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-xl text-[12px] font-semibold" style={{ background: "white", border: `1px solid ${BORDER}`, color: MUTED }}>Cancel</button>
            <button onClick={add} disabled={!text.trim()} className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-40" style={{ background: SAGE_D }}>Save</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {upcoming.map(r => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "white", border: `1px solid ${BORDER}` }}>
            <button onClick={() => toggle(r.id)}
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: BORDER }}>
            </button>
            <div className="flex-1 min-w-0">
              <span className="text-[13px]" style={{ color: TEXT }}>{r.text}</span>
              {r.date && <p className="text-[10px]" style={{ color: MUTED }}>📅 {new Date(r.date).toLocaleDateString()}</p>}
            </div>
            <button onClick={() => del(r.id)} className="text-[11px] opacity-20 hover:opacity-60">×</button>
          </div>
        ))}
        {upcoming.length === 0 && <p className="text-[12px] text-center py-3" style={{ color: MUTED }}>No upcoming reminders</p>}
      </div>

      {completed.length > 0 && (
        <details className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          <summary className="px-4 py-2 text-[11px] font-semibold cursor-pointer" style={{ color: MUTED }}>✓ {completed.length} completed</summary>
          <div className="space-y-1 p-2">
            {completed.map(r => (
              <div key={r.id} className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ opacity: 0.5 }}>
                <span className="text-[11px] line-through flex-1" style={{ color: MUTED }}>{r.text}</span>
                <button onClick={() => del(r.id)} className="text-[10px] opacity-40 hover:opacity-60">×</button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ─── Gratitude Notes ─────────────────────────────────────────────────────────
function GratitudePanel() {
  const [notes, setNotes] = useState<GratitudeNote[]>([]);
  const [text, setText]   = useState("");
  const [from, setFrom]   = useState("");
  const [to, setTo]       = useState("");
  const [adding, setAdding] = useState(false);

  const PROMPTS = [
    "I am grateful for…",
    "Today I noticed…",
    "Something that made me smile…",
    "I appreciate you because…",
    "A moment I want to remember…",
  ];

  useEffect(() => { setNotes(loadJSON(LS_GRATEFUL, [])); }, []);
  const save = (next: GratitudeNote[]) => { setNotes(next); saveJSON(LS_GRATEFUL, next); };

  const add = () => {
    if (!text.trim()) return;
    save([{ id: uid(), text: text.trim(), from: from.trim(), to: to.trim(), date: new Date().toISOString() }, ...notes]);
    setText(""); setFrom(""); setTo(""); setAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[14px]" style={{ color: TEXT }}>Gratitude Notes</p>
        <button onClick={() => setAdding(a => !a)} className="text-[12px] px-3 py-1.5 rounded-xl font-semibold text-white" style={{ background: SAGE_D }}>+ Write</button>
      </div>

      {adding && (
        <div className="rounded-2xl p-4 space-y-2" style={{ background: WARM, border: `1px solid ${BORDER}` }}>
          <div className="flex flex-wrap gap-1.5">
            {PROMPTS.map(p => (
              <button key={p} onClick={() => setText(p)}
                className="text-[11px] px-2 py-1 rounded-full border"
                style={{ background: "white", borderColor: BORDER, color: MUTED }}>
                {p}
              </button>
            ))}
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
            placeholder="Write your gratitude note…"
            className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none resize-none"
            style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          <div className="flex gap-2">
            <input value={from} onChange={e => setFrom(e.target.value)} placeholder="From (optional)"
              className="flex-1 rounded-xl px-3 py-2 text-[13px] border outline-none"
              style={{ background: "white", borderColor: BORDER, color: TEXT }} />
            <input value={to} onChange={e => setTo(e.target.value)} placeholder="To (optional)"
              className="flex-1 rounded-xl px-3 py-2 text-[13px] border outline-none"
              style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-xl text-[12px] font-semibold" style={{ background: "white", border: `1px solid ${BORDER}`, color: MUTED }}>Cancel</button>
            <button onClick={add} disabled={!text.trim()} className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-40" style={{ background: SAGE_D }}>Save</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {notes.map(n => (
          <div key={n.id} className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, #fff8f0, #fff4e8)`, border: `1px solid #fde8cc` }}>
            <p className="text-[13px] leading-relaxed" style={{ color: TEXT }}>{n.text}</p>
            <div className="flex items-center gap-2 mt-2">
              {n.from && <span className="text-[10px]" style={{ color: MUTED }}>From: {n.from}</span>}
              {n.from && n.to && <span style={{ color: MUTED }}>→</span>}
              {n.to && <span className="text-[10px]" style={{ color: MUTED }}>{n.to}</span>}
              <span className="ml-auto text-[10px]" style={{ color: MUTED }}>{new Date(n.date).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {notes.length === 0 && <p className="text-[12px] text-center py-4" style={{ color: MUTED }}>Start writing gratitude notes for your family</p>}
      </div>
    </div>
  );
}

// ─── Family Goals Panel ───────────────────────────────────────────────────────
const LS_GOALS = "family_goals_v1";

interface Goal { id: string; title: string; desc: string; progress: number; emoji: string; done: boolean }

const GOAL_EMOJIS = ["🎯","🌟","💪","🏆","🌱","📚","🎨","🏃","🏡","💛","🌈","✨"];

function GoalsPanel() {
  const [goals,   setGoals]   = useState<Goal[]>([]);
  const [adding,  setAdding]  = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", desc: "", emoji: "🎯" });

  useEffect(() => { setGoals(loadJSON(LS_GOALS, [])); }, []);
  const save = (next: Goal[]) => { setGoals(next); saveJSON(LS_GOALS, next); };

  const add = () => {
    if (!newGoal.title.trim()) return;
    save([...goals, { id: uid(), title: newGoal.title.trim(), desc: newGoal.desc.trim(), progress: 0, emoji: newGoal.emoji, done: false }]);
    setNewGoal({ title: "", desc: "", emoji: "🎯" });
    setAdding(false);
  };

  const updateProgress = (id: string, delta: number) => {
    save(goals.map(g => g.id === id ? { ...g, progress: Math.min(100, Math.max(0, g.progress + delta)), done: g.progress + delta >= 100 } : g));
  };

  const del = (id: string) => save(goals.filter(g => g.id !== id));

  const active    = goals.filter(g => !g.done);
  const completed = goals.filter(g => g.done);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[14px]" style={{ color: TEXT }}>Family Goals</p>
        <button onClick={() => setAdding(a => !a)} className="text-[12px] px-3 py-1.5 rounded-xl font-semibold text-white" style={{ background: SAGE_D }}>+ Add Goal</button>
      </div>

      {adding && (
        <div className="rounded-2xl p-4 space-y-2" style={{ background: WARM, border: `1px solid ${BORDER}` }}>
          <div className="flex flex-wrap gap-1">
            {GOAL_EMOJIS.map(e => (
              <button key={e} onClick={() => setNewGoal(g => ({ ...g, emoji: e }))}
                className="w-7 h-7 rounded-lg text-[14px] flex items-center justify-center"
                style={{ background: newGoal.emoji === e ? `${SAGE}25` : "transparent", outline: newGoal.emoji === e ? `2px solid ${SAGE}` : "none" }}>
                {e}
              </button>
            ))}
          </div>
          <input value={newGoal.title} onChange={e => setNewGoal(g => ({ ...g, title: e.target.value }))} placeholder="Goal title"
            className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
            style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          <input value={newGoal.desc} onChange={e => setNewGoal(g => ({ ...g, desc: e.target.value }))} placeholder="Description (optional)"
            className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
            style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-xl text-[12px] font-semibold" style={{ background: "white", border: `1px solid ${BORDER}`, color: MUTED }}>Cancel</button>
            <button onClick={add} disabled={!newGoal.title.trim()} className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-40" style={{ background: SAGE_D }}>Add Goal</button>
          </div>
        </div>
      )}

      {active.length === 0 && !adding && (
        <p className="text-[12px] text-center py-4" style={{ color: MUTED }}>No active goals yet — add your first one!</p>
      )}

      {active.map(g => (
        <div key={g.id} className="rounded-2xl p-4" style={{ background: "white", border: `1px solid ${BORDER}` }}>
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">{g.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[13px]" style={{ color: TEXT }}>{g.title}</p>
              {g.desc && <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{g.desc}</p>}
            </div>
            <button onClick={() => del(g.id)} className="text-[11px] opacity-20 hover:opacity-60 flex-shrink-0">×</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: `${SAGE}18` }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${g.progress}%`, background: `linear-gradient(90deg, ${SAGE_D}, ${SAGE})` }} />
            </div>
            <span className="text-[11px] font-bold" style={{ color: SAGE_D }}>{g.progress}%</span>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => updateProgress(g.id, -10)} className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold border" style={{ borderColor: BORDER, color: MUTED }}>−10%</button>
            <button onClick={() => updateProgress(g.id, 10)} className="flex-1 py-1.5 rounded-xl text-[11px] font-bold text-white" style={{ background: SAGE_D }}>+10%</button>
            <button onClick={() => updateProgress(g.id, 100 - g.progress)} className="flex-1 py-1.5 rounded-xl text-[11px] font-bold" style={{ background: `${SAGE}15`, color: SAGE_D }}>Done!</button>
          </div>
        </div>
      ))}

      {completed.length > 0 && (
        <details className="rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
          <summary className="px-4 py-2 text-[11px] font-semibold cursor-pointer" style={{ color: MUTED }}>🏆 {completed.length} completed goal{completed.length > 1 ? "s" : ""}</summary>
          {completed.map(g => (
            <div key={g.id} className="flex items-center gap-2 px-4 py-2 border-t" style={{ borderColor: BORDER, opacity: 0.6 }}>
              <span>{g.emoji}</span>
              <p className="text-[12px] line-through flex-1" style={{ color: MUTED }}>{g.title}</p>
              <button onClick={() => save(goals.map(gg => gg.id === g.id ? { ...gg, done: false, progress: 90 } : gg))} className="text-[10px]" style={{ color: SAGE_D }}>Reopen</button>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

// ─── Routines Panel ───────────────────────────────────────────────────────────
const LS_ROUTINES = "family_routines_v1";

interface RoutineStep { id: string; text: string; done: boolean }
interface Routine     { id: string; name: string; time: "morning" | "afternoon" | "evening" | "bedtime"; steps: RoutineStep[]; emoji: string }

const ROUTINE_TIMES = [
  { id: "morning",   label: "Morning",   emoji: "☀️" },
  { id: "afternoon", label: "Afternoon", emoji: "🌤️" },
  { id: "evening",   label: "Evening",   emoji: "🌆" },
  { id: "bedtime",   label: "Bedtime",   emoji: "🌙" },
] as const;

const DEFAULT_ROUTINES: Routine[] = [
  { id: "r1", name: "Morning Routine", time: "morning", emoji: "☀️", steps: [
    { id: "s1", text: "Wake up & stretch",   done: false },
    { id: "s2", text: "Brush teeth",         done: false },
    { id: "s3", text: "Healthy breakfast",   done: false },
    { id: "s4", text: "Get dressed",         done: false },
    { id: "s5", text: "Pack backpack",       done: false },
  ]},
  { id: "r2", name: "Bedtime Routine", time: "bedtime", emoji: "🌙", steps: [
    { id: "s6", text: "Tidy up space",       done: false },
    { id: "s7", text: "Shower / wash up",    done: false },
    { id: "s8", text: "Brush teeth",         done: false },
    { id: "s9", text: "Reading time",        done: false },
    { id: "s10", text: "Lights out",         done: false },
  ]},
];

function RoutinesPanel() {
  const [routines,   setRoutines]   = useState<Routine[]>([]);
  const [activeR,    setActiveR]    = useState<string | null>(null);
  const [newStep,    setNewStep]    = useState("");
  const [adding,     setAdding]     = useState(false);
  const [newRoutine, setNewRoutine] = useState({ name: "", time: "morning" as Routine["time"], emoji: "☀️" });

  useEffect(() => {
    const saved = loadJSON<Routine[]>(LS_ROUTINES, DEFAULT_ROUTINES);
    setRoutines(saved);
    if (saved.length > 0) setActiveR(saved[0].id);
  }, []);

  const save = (next: Routine[]) => { setRoutines(next); saveJSON(LS_ROUTINES, next); };

  const toggleStep = (rId: string, sId: string) =>
    save(routines.map(r => r.id === rId ? { ...r, steps: r.steps.map(s => s.id === sId ? { ...s, done: !s.done } : s) } : r));

  const addStep = (rId: string) => {
    if (!newStep.trim()) return;
    save(routines.map(r => r.id === rId ? { ...r, steps: [...r.steps, { id: uid(), text: newStep.trim(), done: false }] } : r));
    setNewStep("");
  };

  const resetRoutine = (rId: string) =>
    save(routines.map(r => r.id === rId ? { ...r, steps: r.steps.map(s => ({ ...s, done: false })) } : r));

  const addRoutine = () => {
    if (!newRoutine.name.trim()) return;
    const r: Routine = { id: uid(), name: newRoutine.name.trim(), time: newRoutine.time, emoji: newRoutine.emoji, steps: [] };
    const next = [...routines, r];
    save(next);
    setActiveR(r.id);
    setAdding(false);
    setNewRoutine({ name: "", time: "morning", emoji: "☀️" });
  };

  const current = routines.find(r => r.id === activeR);
  const doneCount = current ? current.steps.filter(s => s.done).length : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[14px]" style={{ color: TEXT }}>Routines</p>
        <button onClick={() => setAdding(a => !a)} className="text-[12px] px-3 py-1.5 rounded-xl font-semibold text-white" style={{ background: SAGE_D }}>+ Add</button>
      </div>

      {adding && (
        <div className="rounded-2xl p-4 space-y-2" style={{ background: WARM, border: `1px solid ${BORDER}` }}>
          <input value={newRoutine.name} onChange={e => setNewRoutine(r => ({ ...r, name: e.target.value }))} placeholder="Routine name"
            className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
            style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          <div className="grid grid-cols-4 gap-1.5">
            {ROUTINE_TIMES.map(t => (
              <button key={t.id} onClick={() => setNewRoutine(r => ({ ...r, time: t.id, emoji: t.emoji }))}
                className="py-2 rounded-xl text-center border transition-all"
                style={{ background: newRoutine.time === t.id ? SAGE_D : "white", color: newRoutine.time === t.id ? "white" : TEXT, borderColor: newRoutine.time === t.id ? SAGE_D : BORDER }}>
                <p className="text-lg">{t.emoji}</p>
                <p className="text-[9px] font-semibold">{t.label}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-xl text-[12px] font-semibold" style={{ background: "white", border: `1px solid ${BORDER}`, color: MUTED }}>Cancel</button>
            <button onClick={addRoutine} disabled={!newRoutine.name.trim()} className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-40" style={{ background: SAGE_D }}>Create</button>
          </div>
        </div>
      )}

      {/* Routine selector */}
      <div className="flex flex-wrap gap-1.5">
        {routines.map(r => (
          <button key={r.id} onClick={() => setActiveR(r.id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-semibold border"
            style={{ background: activeR === r.id ? SAGE_D : "white", color: activeR === r.id ? "white" : TEXT, borderColor: activeR === r.id ? SAGE_D : BORDER }}>
            {r.emoji} {r.name}
          </button>
        ))}
      </div>

      {current && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: `1px solid ${BORDER}` }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: BORDER }}>
            <p className="font-bold text-[13px]" style={{ color: TEXT }}>{current.emoji} {current.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: MUTED }}>{doneCount}/{current.steps.length} done</span>
              <button onClick={() => resetRoutine(current.id)} className="text-[11px] px-2 py-1 rounded-lg" style={{ background: "#fef9ec", color: "#92400e" }}>Reset</button>
            </div>
          </div>
          {/* Progress bar */}
          {current.steps.length > 0 && (
            <div className="px-4 pt-3">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${SAGE}18` }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(doneCount / current.steps.length) * 100}%`, background: `linear-gradient(90deg, ${SAGE_D}, ${SAGE})` }} />
              </div>
            </div>
          )}
          <div className="p-3 space-y-1.5">
            {current.steps.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-2 py-2 rounded-xl" style={{ background: s.done ? `${SAGE}08` : "transparent" }}>
                <button onClick={() => toggleStep(current.id, s.id)}
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ borderColor: s.done ? SAGE_D : BORDER, background: s.done ? SAGE_D : "white" }}>
                  {s.done && <span className="text-white text-[11px]">✓</span>}
                </button>
                <span className="text-[13px] flex-1" style={{ color: s.done ? MUTED : TEXT, textDecoration: s.done ? "line-through" : "none" }}>{s.text}</span>
              </div>
            ))}
            {current.steps.length === 0 && <p className="text-[12px] text-center py-2" style={{ color: MUTED }}>No steps yet — add your first one below</p>}
          </div>
          <div className="px-3 pb-3 flex gap-2 border-t pt-2" style={{ borderColor: BORDER }}>
            <input value={newStep} onChange={e => setNewStep(e.target.value)} placeholder="Add step…"
              className="flex-1 rounded-xl px-3 py-2 text-[13px] border outline-none"
              style={{ background: "#fafafa", borderColor: BORDER, color: TEXT }}
              onKeyDown={e => e.key === "Enter" && addStep(current.id)} />
            <button onClick={() => addStep(current.id)} disabled={!newStep.trim()} className="px-3 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-40" style={{ background: SAGE_D }}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared Calendar Panel ────────────────────────────────────────────────────
const LS_EVENTS = "family_calendar_events_v1";

interface CalEvent { id: string; title: string; date: string; time: string; emoji: string; who: string }

const EVENT_EMOJIS = ["📅","🎂","🏫","⚽","🎵","🏥","✈️","🎉","🌿","🤝","🎨","🏃"];

function CalendarPanel() {
  const [events,  setEvents]  = useState<CalEvent[]>([]);
  const [adding,  setAdding]  = useState(false);
  const [newEv,   setNewEv]   = useState({ title: "", date: "", time: "", emoji: "📅", who: "" });

  useEffect(() => { setEvents(loadJSON(LS_EVENTS, [])); }, []);
  const save = (next: CalEvent[]) => { setEvents(next); saveJSON(LS_EVENTS, next); };

  const add = () => {
    if (!newEv.title.trim() || !newEv.date) return;
    save([...events, { id: uid(), ...newEv, title: newEv.title.trim(), who: newEv.who.trim() }].sort((a, b) => a.date.localeCompare(b.date)));
    setNewEv({ title: "", date: "", time: "", emoji: "📅", who: "" });
    setAdding(false);
  };

  const del = (id: string) => save(events.filter(e => e.id !== id));

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter(e => e.date >= today);
  const past     = events.filter(e => e.date < today);

  function fmt(d: string) {
    return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[14px]" style={{ color: TEXT }}>Family Calendar</p>
        <button onClick={() => setAdding(a => !a)} className="text-[12px] px-3 py-1.5 rounded-xl font-semibold text-white" style={{ background: SAGE_D }}>+ Event</button>
      </div>

      {adding && (
        <div className="rounded-2xl p-4 space-y-2" style={{ background: WARM, border: `1px solid ${BORDER}` }}>
          <div className="flex flex-wrap gap-1">
            {EVENT_EMOJIS.map(e => (
              <button key={e} onClick={() => setNewEv(ev => ({ ...ev, emoji: e }))}
                className="w-7 h-7 rounded-lg text-[14px] flex items-center justify-center"
                style={{ background: newEv.emoji === e ? `${SAGE}25` : "transparent", outline: newEv.emoji === e ? `2px solid ${SAGE}` : "none" }}>
                {e}
              </button>
            ))}
          </div>
          <input value={newEv.title} onChange={e => setNewEv(ev => ({ ...ev, title: e.target.value }))} placeholder="Event title"
            className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
            style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          <div className="flex gap-2">
            <input type="date" value={newEv.date} onChange={e => setNewEv(ev => ({ ...ev, date: e.target.value }))}
              className="flex-1 rounded-xl px-3 py-2 text-[13px] border outline-none"
              style={{ background: "white", borderColor: BORDER, color: TEXT }} />
            <input type="time" value={newEv.time} onChange={e => setNewEv(ev => ({ ...ev, time: e.target.value }))}
              className="flex-1 rounded-xl px-3 py-2 text-[13px] border outline-none"
              style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          </div>
          <input value={newEv.who} onChange={e => setNewEv(ev => ({ ...ev, who: e.target.value }))} placeholder="Who? (optional)"
            className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
            style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-xl text-[12px] font-semibold" style={{ background: "white", border: `1px solid ${BORDER}`, color: MUTED }}>Cancel</button>
            <button onClick={add} disabled={!newEv.title.trim() || !newEv.date} className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-40" style={{ background: SAGE_D }}>Save</button>
          </div>
        </div>
      )}

      {upcoming.length === 0 && !adding && (
        <div className="rounded-2xl p-6 text-center" style={{ background: "white", border: `1px solid ${BORDER}` }}>
          <p className="text-3xl mb-2">📅</p>
          <p className="text-[13px] font-semibold mb-1" style={{ color: TEXT }}>No upcoming events</p>
          <p className="text-[11px]" style={{ color: MUTED }}>Add birthdays, activities, appointments — keep your family synced.</p>
        </div>
      )}

      <div className="space-y-2">
        {upcoming.map(ev => {
          const isToday = ev.date === today;
          return (
            <div key={ev.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: isToday ? `${SAGE}10` : "white", border: `1px solid ${isToday ? SAGE + "40" : BORDER}` }}>
              <span className="text-xl">{ev.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px]" style={{ color: TEXT }}>{ev.title}</p>
                <p className="text-[10px]" style={{ color: MUTED }}>
                  {isToday ? "Today" : fmt(ev.date)}{ev.time ? " · " + ev.time : ""}{ev.who ? " · " + ev.who : ""}
                </p>
              </div>
              {isToday && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${SAGE}20`, color: SAGE_D }}>Today!</span>}
              <button onClick={() => del(ev.id)} className="text-[11px] opacity-20 hover:opacity-60 flex-shrink-0">×</button>
            </div>
          );
        })}
      </div>

      {past.length > 0 && (
        <details className="rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
          <summary className="px-4 py-2 text-[11px] font-semibold cursor-pointer" style={{ color: MUTED }}>▸ {past.length} past events</summary>
          {past.slice(0, 5).map(ev => (
            <div key={ev.id} className="flex items-center gap-2 px-4 py-2 border-t" style={{ borderColor: BORDER, opacity: 0.5 }}>
              <span className="text-sm">{ev.emoji}</span>
              <span className="text-[11px] line-through flex-1" style={{ color: MUTED }}>{ev.title}</span>
              <span className="text-[9px]" style={{ color: MUTED }}>{fmt(ev.date)}</span>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────
type ToolTab = "lists" | "chores" | "reminders" | "gratitude" | "goals" | "routines" | "calendar";

const TOOL_TABS: { id: ToolTab; label: string; icon: string }[] = [
  { id: "lists",     label: "Lists",     icon: "📋" },
  { id: "chores",    label: "Chores",    icon: "🧹" },
  { id: "reminders", label: "Reminders", icon: "🔔" },
  { id: "goals",     label: "Goals",     icon: "🎯" },
  { id: "routines",  label: "Routines",  icon: "⏰" },
  { id: "calendar",  label: "Calendar",  icon: "📅" },
  { id: "gratitude", label: "Gratitude", icon: "💛" },
];

export function FamilyToolsPanel() {
  const [tab, setTab] = useState<ToolTab>("lists");

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${SAGE_D}15, ${SAGE}08)`, border: `1px solid ${SAGE}20` }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏡</span>
          <div>
            <p className="font-bold text-[14px]" style={{ color: TEXT }}>Family Tools</p>
            <p className="text-[12px]" style={{ color: MUTED }}>Everything you need to run your family smoothly.</p>
          </div>
        </div>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {TOOL_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-semibold border"
              style={{
                background: tab === t.id ? SAGE_D : "white",
                color: tab === t.id ? "white" : TEXT,
                borderColor: tab === t.id ? SAGE_D : BORDER,
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Panels */}
      {tab === "lists"     && <SharedListsPanel />}
      {tab === "chores"    && <ChoreHelperPanel />}
      {tab === "reminders" && <RemindersPanel />}
      {tab === "gratitude" && <GratitudePanel />}
      {tab === "goals"     && <GoalsPanel />}
      {tab === "routines"  && <RoutinesPanel />}
      {tab === "calendar"  && <CalendarPanel />}
    </div>
  );
}
