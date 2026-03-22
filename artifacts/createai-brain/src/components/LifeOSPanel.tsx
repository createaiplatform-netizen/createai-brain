// ─── Life OS Panel ────────────────────────────────────────────────────────────
// Tracks important life events: civic, health, school, work.
// Neutral, plain-language summaries. Always links to official sources.
// Platform organizes and reminds — never replaces official systems.

import { useState, useEffect } from "react";

const SAGE = "#7a9068";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.14)";

interface LifeEvent {
  id: string;
  category: string;
  title: string;
  description: string | null;
  event_date: string | null;
  official_url: string | null;
  notes: string | null;
  completed: boolean;
}

const CATEGORY_CONFIG = {
  civic:    { icon: "🏛️", label: "Civic & Government",  color: "#6a8db5" },
  health:   { icon: "🏥", label: "Health & Medical",     color: "#e8826a" },
  school:   { icon: "📚", label: "School & Learning",    color: "#9a7ab5" },
  work:     { icon: "💼", label: "Work & Career",        color: "#6aab8a" },
  finance:  { icon: "📊", label: "Finance & Money",      color: "#c4a97a" },
  personal: { icon: "🌿", label: "Personal",             color: "#7a9068" },
};

type Category = keyof typeof CATEGORY_CONFIG | "all";

function fmtDate(d: string | null) {
  if (!d) return "No date set";
  const dt = new Date(d);
  const today = new Date();
  const diffDays = Math.floor((dt.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(event: LifeEvent) {
  if (!event.event_date || event.completed) return false;
  return new Date(event.event_date) < new Date();
}

export function LifeOSPanel() {
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    category: "civic",
    title: "",
    description: "",
    eventDate: "",
    officialUrl: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/life-events", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as { events: LifeEvent[] };
        setEvents(data.events);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/life-events", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          title: form.title,
          description: form.description || undefined,
          eventDate: form.eventDate || undefined,
          officialUrl: form.officialUrl || undefined,
          notes: form.notes || undefined,
        }),
      });
      setShowAdd(false);
      setForm({ category: "civic", title: "", description: "", eventDate: "", officialUrl: "", notes: "" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(event: LifeEvent) {
    await fetch(`/api/life-events/${event.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !event.completed }),
    });
    await load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/life-events/${id}`, { method: "DELETE", credentials: "include" });
    await load();
  }

  const filtered = activeCategory === "all"
    ? events
    : events.filter(e => e.category === activeCategory);

  const overdueCount = events.filter(e => isOverdue(e)).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Safety notice */}
      <div className="p-3 rounded-xl text-[11px] leading-snug"
        style={{ background: `${SAGE}08`, border: `1px solid ${SAGE}18`, color: MUTED }}>
        🔒 <strong>Organize, don't replace.</strong> This helps you track important dates.
        Always visit official websites for submissions, registrations, and legal actions.
        This platform never impersonates government, legal, or medical systems.
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="p-3 rounded-xl text-[12px] font-semibold"
          style={{ background: "rgba(197,48,48,0.07)", border: "1px solid rgba(197,48,48,0.15)", color: "#c53030" }}>
          ⚠️ {overdueCount} overdue item{overdueCount !== 1 ? "s" : ""} — check your schedule
        </div>
      )}

      {/* Category filter + add button */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap flex-1">
          {(["all", ...Object.keys(CATEGORY_CONFIG)] as Category[]).map(cat => {
            const cfg = cat === "all" ? null : CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                style={{
                  background: activeCategory === cat ? (cfg?.color ?? SAGE) : "transparent",
                  color: activeCategory === cat ? "white" : MUTED,
                }}
              >
                {cfg?.icon ?? "🗓️"} {cat === "all" ? "All" : cfg?.label ?? cat}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-1.5 rounded-xl text-[12px] font-bold text-white flex-shrink-0"
          style={{ background: SAGE }}
        >
          + Add
        </button>
      </div>

      {/* Event list */}
      {loading && <div className="py-6 text-center text-[12px]" style={{ color: MUTED }}>Loading…</div>}

      {!loading && filtered.length === 0 && (
        <div className="py-8 text-center">
          <div className="text-3xl mb-2">{activeCategory === "all" ? "🗓️" : CATEGORY_CONFIG[activeCategory as keyof typeof CATEGORY_CONFIG]?.icon ?? "🗓️"}</div>
          <p className="text-[14px] font-semibold" style={{ color: TEXT }}>Nothing here yet</p>
          <p className="text-[12px] mt-1" style={{ color: MUTED }}>Add an event to start tracking</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map(event => {
          const cfg = CATEGORY_CONFIG[event.category as keyof typeof CATEGORY_CONFIG] ?? CATEGORY_CONFIG.personal;
          const overdue = isOverdue(event);
          return (
            <div
              key={event.id}
              className="p-4 rounded-2xl"
              style={{
                background: event.completed ? "transparent" : "white",
                border: `1px solid ${overdue ? "rgba(197,48,48,0.25)" : BORDER}`,
                opacity: event.completed ? 0.6 : 1,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleComplete(event)}
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                    style={{
                      borderColor: event.completed ? "#4a7a5a" : BORDER,
                      background: event.completed ? "#4a7a5a" : "transparent",
                    }}
                  >
                    {event.completed && <span className="text-white text-[10px]">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-bold" style={{
                        color: TEXT,
                        textDecoration: event.completed ? "line-through" : "none",
                      }}>
                        {event.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: `${cfg.color}18`, color: cfg.color }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-[12px] mt-0.5 leading-snug" style={{ color: MUTED }}>{event.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold" style={{ color: overdue ? "#c53030" : MUTED }}>
                        📅 {fmtDate(event.event_date)}
                      </span>
                      {event.official_url && (
                        <a
                          href={event.official_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold underline"
                          style={{ color: SAGE }}
                        >
                          Official site →
                        </a>
                      )}
                    </div>
                    {event.notes && (
                      <p className="text-[11px] mt-1 italic" style={{ color: MUTED }}>{event.notes}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] flex-shrink-0"
                  style={{ background: "rgba(107,102,96,0.08)", color: MUTED }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add event modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(26,25,22,0.50)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-sm rounded-3xl overflow-y-auto max-h-[90vh]"
            style={{ background: CREAM, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <form onSubmit={handleAdd} className="p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[17px] font-black" style={{ color: TEXT }}>Add life event</h3>
                <button type="button" onClick={() => setShowAdd(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: BORDER, color: MUTED }}>×</button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: MUTED }}>Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                  style={{ background: "white", border: `1.5px solid ${BORDER}`, color: TEXT }}>
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
                  ))}
                </select>
              </div>

              {[
                { key: "title",       label: "Title *",          type: "text",   placeholder: "E.g. Voter registration deadline" },
                { key: "description", label: "Description",      type: "text",   placeholder: "Brief plain-language summary" },
                { key: "eventDate",   label: "Date",             type: "date",   placeholder: "" },
                { key: "officialUrl", label: "Official website", type: "url",    placeholder: "https://official-site.gov" },
                { key: "notes",       label: "Your notes",       type: "text",   placeholder: "Anything to remember" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: MUTED }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                    style={{ background: "white", border: `1.5px solid ${BORDER}`, color: TEXT }}
                  />
                </div>
              ))}

              <button type="submit" disabled={saving || !form.title.trim()}
                className="w-full py-3 rounded-2xl font-bold text-[14px] text-white mt-1"
                style={{ background: SAGE, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Add event"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
