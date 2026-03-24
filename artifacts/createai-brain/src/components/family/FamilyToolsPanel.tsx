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

// ─── Main panel ──────────────────────────────────────────────────────────────
type ToolTab = "lists" | "chores" | "reminders" | "gratitude";

const TOOL_TABS: { id: ToolTab; label: string; icon: string }[] = [
  { id: "lists",     label: "Lists",     icon: "📋" },
  { id: "chores",    label: "Chores",    icon: "🧹" },
  { id: "reminders", label: "Reminders", icon: "🔔" },
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
    </div>
  );
}
