// ─── Private Journal ─────────────────────────────────────────────────────────
// Personal reflection space. Private by default. Never shared without consent.
// No comparisons, no leaderboards, no public views. Warm, minimal, quiet.

import { useState, useEffect } from "react";

const SAGE = "#7a9068";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.14)";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

const MOODS = [
  { key: "wonderful", emoji: "🌟", label: "Wonderful" },
  { key: "good",      emoji: "😊", label: "Good" },
  { key: "okay",      emoji: "😌", label: "Okay" },
  { key: "tired",     emoji: "😴", label: "Tired" },
  { key: "hard",      emoji: "💙", label: "Hard day" },
  { key: "grateful",  emoji: "🙏", label: "Grateful" },
  { key: "unsure",    emoji: "🤔", label: "Unsure" },
];

function moodEmoji(mood: string | null) {
  return MOODS.find(m => m.key === mood)?.emoji ?? "📝";
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

type View = "list" | "compose" | "read";

export function PrivateJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [form, setForm] = useState({ title: "", content: "", mood: "", entryDate: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/journal?limit=30", { credentials: "include" });
      if (res.ok) {
        const d = (await res.json()) as { entries: JournalEntry[]; total: number };
        setEntries(d.entries);
        setTotal(d.total);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleSave() {
    if (!form.content.trim() && !form.title.trim()) return;
    setSaving(true);
    try {
      if (isEditing && selected) {
        await fetch(`/api/journal/${selected.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: form.title, content: form.content, mood: form.mood || undefined, entryDate: form.entryDate }),
        });
      } else {
        await fetch("/api/journal", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: form.title, content: form.content, mood: form.mood || undefined, entryDate: form.entryDate }),
        });
      }
      setForm({ title: "", content: "", mood: "", entryDate: new Date().toISOString().slice(0, 10) });
      setIsEditing(false);
      setSelected(null);
      setView("list");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this entry? This cannot be undone.")) return;
    await fetch(`/api/journal/${id}`, { method: "DELETE", credentials: "include" });
    setView("list");
    setSelected(null);
    await load();
  }

  function openEntry(entry: JournalEntry) {
    setSelected(entry);
    setView("read");
  }

  function startNew() {
    setForm({ title: "", content: "", mood: "", entryDate: new Date().toISOString().slice(0, 10) });
    setIsEditing(false);
    setSelected(null);
    setView("compose");
  }

  function startEdit(entry: JournalEntry) {
    setForm({ title: entry.title, content: entry.content, mood: entry.mood ?? "", entryDate: entry.entry_date?.slice(0, 10) });
    setSelected(entry);
    setIsEditing(true);
    setView("compose");
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="flex flex-col gap-4">
        <div className="p-3 rounded-xl text-[11px] leading-snug"
          style={{ background: `${SAGE}08`, border: `1px solid ${SAGE}18`, color: MUTED }}>
          🔒 <strong>Completely private.</strong> Your journal entries are never visible to anyone else unless you explicitly choose to share them.
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold" style={{ color: TEXT }}>
              {total} {total === 1 ? "entry" : "entries"}
            </p>
          </div>
          <button
            onClick={startNew}
            className="px-4 py-2 rounded-xl text-[13px] font-bold text-white"
            style={{ background: SAGE }}
          >
            + Write today
          </button>
        </div>

        {loading && <div className="py-8 text-center text-[12px]" style={{ color: MUTED }}>Loading…</div>}

        {!loading && entries.length === 0 && (
          <div className="py-10 text-center">
            <div className="text-4xl mb-3">📖</div>
            <p className="text-[15px] font-bold" style={{ color: TEXT }}>Your private journal</p>
            <p className="text-[13px] mt-2 leading-relaxed max-w-xs mx-auto" style={{ color: MUTED }}>
              A quiet space just for you. Write anything — your thoughts, your day, what you noticed, what you felt.
            </p>
            <button
              onClick={startNew}
              className="mt-4 px-6 py-2.5 rounded-2xl font-bold text-[14px] text-white"
              style={{ background: SAGE }}
            >
              Write your first entry
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {entries.map(e => (
            <button
              key={e.id}
              onClick={() => openEntry(e)}
              className="p-4 rounded-2xl text-left transition-all"
              style={{ background: "white", border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">{moodEmoji(e.mood)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[14px] font-bold truncate" style={{ color: TEXT }}>
                      {e.title || fmtDate(e.entry_date)}
                    </p>
                    <p className="text-[11px] flex-shrink-0" style={{ color: MUTED }}>
                      {new Date(e.entry_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  {e.content && (
                    <p className="text-[12px] mt-0.5 leading-snug line-clamp-2" style={{ color: MUTED }}>
                      {e.content}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Read/view entry ───────────────────────────────────────────────────────────
  if (view === "read" && selected) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView("list"); setSelected(null); }}
            className="text-[13px] font-semibold"
            style={{ color: SAGE }}>
            ← Back
          </button>
        </div>

        <div className="p-5 rounded-3xl" style={{ background: "white", border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">{moodEmoji(selected.mood)}</div>
            <div>
              <p className="text-[15px] font-black" style={{ color: TEXT }}>
                {selected.title || "Untitled"}
              </p>
              <p className="text-[12px]" style={{ color: MUTED }}>
                {fmtDate(selected.entry_date)}
              </p>
            </div>
          </div>

          <div className="h-px mb-4" style={{ background: BORDER }} />

          <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: TEXT }}>
            {selected.content || <span style={{ color: MUTED, fontStyle: "italic" }}>No content</span>}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => startEdit(selected)}
            className="flex-1 py-2.5 rounded-2xl font-bold text-[13px] text-white"
            style={{ background: SAGE }}
          >
            Edit entry
          </button>
          <button
            onClick={() => handleDelete(selected.id)}
            className="px-5 py-2.5 rounded-2xl font-bold text-[13px]"
            style={{ background: "rgba(197,48,48,0.08)", color: "#c53030" }}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  // ── Compose view ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={() => { setView("list"); setIsEditing(false); }}
          className="text-[13px] font-semibold"
          style={{ color: SAGE }}>
          ← Back
        </button>
        <p className="text-[14px] font-black" style={{ color: TEXT }}>
          {isEditing ? "Edit entry" : "New entry"}
        </p>
        <button
          onClick={handleSave}
          disabled={saving || (!form.content.trim() && !form.title.trim())}
          className="px-4 py-1.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-40"
          style={{ background: SAGE }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Mood picker */}
      <div>
        <p className="text-[11px] font-semibold mb-1.5" style={{ color: MUTED }}>How are you feeling?</p>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map(m => (
            <button
              key={m.key}
              onClick={() => setForm(p => ({ ...p, mood: p.mood === m.key ? "" : m.key }))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
              style={{
                background: form.mood === m.key ? `${SAGE}18` : "white",
                border: `1.5px solid ${form.mood === m.key ? SAGE : BORDER}`,
                color: TEXT,
              }}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-[11px] font-semibold mb-1" style={{ color: MUTED }}>Date</label>
        <input
          type="date"
          value={form.entryDate}
          onChange={e => setForm(p => ({ ...p, entryDate: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
          style={{ background: "white", border: `1.5px solid ${BORDER}`, color: TEXT }}
        />
      </div>

      {/* Title */}
      <div>
        <label className="block text-[11px] font-semibold mb-1" style={{ color: MUTED }}>Title (optional)</label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="Give this entry a name, or leave it blank…"
          className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
          style={{ background: "white", border: `1.5px solid ${BORDER}`, color: TEXT }}
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-[11px] font-semibold mb-1" style={{ color: MUTED }}>Your thoughts</label>
        <textarea
          value={form.content}
          onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
          placeholder="Write anything you want. This is your space."
          rows={10}
          className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none resize-none leading-relaxed"
          style={{ background: "white", border: `1.5px solid ${BORDER}`, color: TEXT }}
        />
      </div>

      <p className="text-[10px] text-center" style={{ color: MUTED }}>
        🔒 Saved privately · only you can see this
      </p>
    </div>
  );
}
