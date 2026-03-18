import React, { useState, useEffect, useCallback } from "react";
import { streamEngine } from "@/controller";

interface Person {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  department: string | null;
  status: string;
  notes: string | null;
  isOwner: boolean;
  createdAt: string;
}

type View = "list" | "profile" | "invite" | "add" | "edit";
type StatusFilter = "All" | "Active" | "Invited" | "Pending";

function statusStyle(status: string) {
  if (status === "Active")  return { background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.22)" };
  if (status === "Invited") return { background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.22)" };
  return { background: "rgba(251,146,60,0.12)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.22)" };
}

function Avatar({ name, size = 10 }: { name: string; size?: number }) {
  return (
    <div className="rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0"
      style={{ width: size * 4, height: size * 4, fontSize: size * 2.2 }}>
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function ProfileView({ person, onBack, onUpdate, onDelete }: {
  person: Person;
  onBack: () => void;
  onUpdate: (p: Person) => void;
  onDelete: (id: number) => void;
}) {
  const [editStatus, setEditStatus] = useState(person.status);
  const [inviteText, setInviteText] = useState("");
  const [copied, setCopied] = useState<"msg" | "link" | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleStatusChange = async (s: string) => {
    setEditStatus(s);
    setSaving(true);
    try {
      const r = await fetch(`/api/people/${person.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: s }),
      });
      if (r.ok) {
        const d = await r.json();
        onUpdate(d.person);
      }
    } catch {}
    finally { setSaving(false); }
  };

  const handleGenerateInvite = async () => {
    setGenerating(true);
    try {
      let text = "";
      await streamEngine({
        engineId: "InteractionEngine",
        topic: `Write a warm, professional 3-sentence platform invite message for ${person.name} who will be joining as ${person.role}. Include a placeholder link [PLATFORM_LINK]. Keep it personal and exciting.`,
        onChunk: chunk => { text += chunk; },
        onDone: () => { setInviteText(text.replace("[PLATFORM_LINK]", window.location.origin)); },
      });
    } catch {}
    finally { setGenerating(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Remove ${person.name} from People?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/people/${person.id}`, { method: "DELETE", credentials: "include" });
      onDelete(person.id);
      onBack();
    } catch {}
    finally { setDeleting(false); }
  };

  const copy = (what: "msg" | "link") => {
    navigator.clipboard.writeText(what === "msg" ? inviteText : window.location.origin);
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="p-5 space-y-5 overflow-y-auto">
      <button onClick={onBack} className="text-primary text-sm font-medium">‹ People</button>

      <div className="flex flex-col items-center text-center py-4 space-y-2">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
          style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)" }}>
          {person.name[0]?.toUpperCase()}
        </div>
        <h2 className="text-[20px] font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>{person.name}</h2>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={statusStyle(editStatus)}>{editStatus}</span>
        <p className="text-[13px] text-muted-foreground">{person.role}{person.department ? ` · ${person.department}` : ""}</p>
        {person.isOwner && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>Account Owner</span>}
      </div>

      <div className="rounded-2xl border border-border/50 divide-y divide-border/30" style={{ background: "rgba(255,255,255,0.03)" }}>
        {[
          { label: "Email", value: person.email, href: person.email ? `mailto:${person.email}` : null },
          { label: "Phone", value: person.phone, href: person.phone ? `tel:${person.phone}` : null },
          { label: "Role",  value: person.role,  href: null },
          { label: "Added", value: new Date(person.createdAt).toLocaleDateString(), href: null },
          ...(person.notes ? [{ label: "Notes", value: person.notes, href: null }] : []),
        ].map(row => (
          <div key={row.label} className="flex items-start px-4 py-3 gap-3">
            <span className="text-[11px] text-muted-foreground w-14 flex-shrink-0 pt-0.5">{row.label}</span>
            {row.href
              ? <a href={row.href} className="text-[13px] text-primary font-medium hover:underline flex-1 break-all">{row.value || "—"}</a>
              : <span className="text-[13px] text-foreground font-medium flex-1 break-words">{row.value || "—"}</span>
            }
          </div>
        ))}
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">Status</p>
        <div className="flex gap-2">
          {["Active", "Invited", "Pending"].map(s => (
            <button key={s} onClick={() => handleStatusChange(s)} disabled={saving}
              className="flex-1 text-[12px] font-semibold py-2 rounded-xl border transition-all"
              style={editStatus === s
                ? { background: "rgba(99,102,241,0.20)", borderColor: "rgba(99,102,241,0.45)", color: "#818cf8" }
                : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.50)" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {(person.email || person.phone) && (
        <div className="flex gap-2">
          {person.email && (
            <a href={`mailto:${person.email}`}
              className="flex-1 text-center text-[12px] font-semibold py-2.5 rounded-xl transition-colors"
              style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.20)" }}>
              📧 Email
            </a>
          )}
          {person.phone && (
            <a href={`sms:${person.phone}`}
              className="flex-1 text-center text-[12px] font-semibold py-2.5 rounded-xl transition-colors"
              style={{ background: "rgba(34,197,94,0.10)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.20)" }}>
              💬 Text
            </a>
          )}
          {person.phone && (
            <a href={`tel:${person.phone}`}
              className="flex-1 text-center text-[12px] font-semibold py-2.5 rounded-xl transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.60)", border: "1px solid rgba(255,255,255,0.10)" }}>
              📞 Call
            </a>
          )}
        </div>
      )}

      <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.14)" }}>
        <p className="font-semibold text-[13px] text-foreground">🧠 Generate Platform Invite</p>
        <p className="text-[11px] text-muted-foreground">Brain writes a personalized invite — ready to copy and send.</p>
        <button onClick={handleGenerateInvite} disabled={generating}
          className="w-full text-white text-[13px] font-semibold py-2.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          {generating ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Writing…</span></> : "✨ Generate Invite"}
        </button>
        {inviteText && (
          <div className="space-y-2">
            <div className="rounded-xl p-3 max-h-40 overflow-y-auto" style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <pre className="text-[11px] text-foreground whitespace-pre-wrap font-sans">{inviteText}</pre>
            </div>
            <div className="flex gap-2">
              <button onClick={() => copy("msg")} className="flex-1 text-[11px] font-semibold py-2 rounded-xl transition-colors"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.70)" }}>
                {copied === "msg" ? "✓ Copied" : "Copy Message"}
              </button>
              {person.email && (
                <a href={`mailto:${person.email}?subject=Your Platform Invite&body=${encodeURIComponent(inviteText)}`}
                  className="flex-1 text-center text-[11px] font-semibold py-2 rounded-xl transition-colors"
                  style={{ background: "rgba(34,197,94,0.10)", color: "#4ade80" }}>
                  📧 Send Email
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <button onClick={handleDelete} disabled={deleting || person.isOwner}
        className="w-full text-[12px] font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-40"
        style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.18)" }}>
        {deleting ? "Removing…" : person.isOwner ? "Account Owner (cannot remove)" : "✕ Remove from People"}
      </button>
    </div>
  );
}

function InviteView({ onBack, onSaved }: { onBack: () => void; onSaved: () => void }) {
  const [pastedText, setPastedText] = useState("");
  const [parsed, setParsed] = useState<{ name: string; email: string; phone: string; role: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleParse = () => {
    const lines = pastedText.split("\n").filter(Boolean);
    const results = lines.map(line => ({
      name:  line.match(/([A-Z][a-z]+ [A-Z][a-z]+|[A-Z][a-z]+)/)?.[1] || "Unknown",
      email: line.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || "",
      phone: line.match(/[\d]{3}[-.\s]?[\d]{3}[-.\s]?[\d]{4}/)?.[0] || "",
      role:  line.toLowerCase().includes("admin") ? "Admin" :
             line.toLowerCase().includes("view")  ? "Viewer" : "Member",
    }));
    setParsed(results);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const p of parsed) {
        await fetch("/api/people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: p.name, email: p.email || null, phone: p.phone || null, role: p.role, status: "Invited" }),
        });
      }
      setSaved(true);
      setTimeout(() => onSaved(), 1000);
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div className="p-5 space-y-5 overflow-y-auto">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-primary text-sm font-medium">‹ People</button>
        <h2 className="text-[18px] font-bold text-foreground flex-1">Invite People</h2>
      </div>
      <p className="text-[13px] text-muted-foreground">Paste any list of contacts — names, emails, phone numbers. The Brain parses and organizes automatically.</p>

      <textarea value={pastedText} onChange={e => setPastedText(e.target.value)}
        placeholder={"Jake Smith, jake@email.com, 555-0101\nMaria Lopez, maria@email.com, bilingual\nTom B., tom@email.com, admin"}
        className="w-full rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none font-mono"
        style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}
        rows={5} />

      <button onClick={handleParse} disabled={!pastedText.trim()}
        className="w-full text-white text-[13px] font-semibold py-2.5 rounded-xl disabled:opacity-40 transition-all"
        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
        Parse Contacts
      </button>

      {parsed.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-foreground flex-1">{parsed.length} contact{parsed.length > 1 ? "s" : ""} found</p>
            {!saved && (
              <button onClick={handleSaveAll} disabled={saving}
                className="text-[12px] text-white font-semibold px-3 py-1.5 rounded-xl disabled:opacity-50"
                style={{ background: "rgba(34,197,94,0.80)" }}>
                {saving ? "Saving…" : "Save All"}
              </button>
            )}
          </div>
          {saved && <div className="rounded-xl p-3 text-center text-[13px] font-semibold" style={{ background: "rgba(34,197,94,0.10)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.20)" }}>✓ All contacts saved to People!</div>}
          {parsed.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/40"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] text-foreground">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">{[p.email, p.phone].filter(Boolean).join(" · ") || "No contact info"}</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>{p.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddPersonView({ onBack, onAdded }: { onBack: () => void; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Member");
  const [department, setDepartment] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const r = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          role,
          department: department.trim() || null,
          notes: notes.trim() || null,
          status: "Active",
        }),
      });
      if (r.ok) {
        setDone(true);
        setTimeout(() => onAdded(), 900);
      }
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div className="p-5 space-y-5 overflow-y-auto">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-primary text-sm font-medium">‹ People</button>
        <h2 className="text-[18px] font-bold text-foreground flex-1">Add Person</h2>
      </div>

      {done && (
        <div className="rounded-xl p-3 text-center text-[13px] font-semibold" style={{ background: "rgba(34,197,94,0.10)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.20)" }}>
          ✓ Added! Returning to People…
        </div>
      )}

      <div className="space-y-4">
        {[
          { label: "Full Name *", value: name,  set: setName,  type: "text",  ph: "Jane Smith" },
          { label: "Email",       value: email, set: setEmail, type: "email", ph: "jane@example.com" },
          { label: "Phone",       value: phone, set: setPhone, type: "tel",   ph: "555-0101" },
          { label: "Department",  value: department, set: setDepartment, type: "text", ph: "Operations" },
        ].map(f => (
          <div key={f.label}>
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">{f.label}</label>
            <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              className="w-full rounded-xl px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
              style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }} />
          </div>
        ))}

        <div>
          <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Role</label>
          <div className="flex gap-2">
            {["Member", "Creator", "Admin", "Viewer"].map(r => (
              <button key={r} onClick={() => setRole(r)}
                className="flex-1 text-[11px] font-semibold py-2 rounded-xl border transition-all"
                style={role === r
                  ? { background: "rgba(99,102,241,0.20)", borderColor: "rgba(99,102,241,0.45)", color: "#818cf8" }
                  : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.50)" }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this person…"
            rows={2} className="w-full rounded-xl px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none resize-none"
            style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }} />
        </div>

        <button onClick={handleAdd} disabled={!name.trim() || saving || done}
          className="w-full text-white text-[14px] font-semibold py-3 rounded-xl disabled:opacity-40 transition-all"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          {saving ? "Adding…" : "Add to People"}
        </button>
      </div>
    </div>
  );
}

export function PeopleApp() {
  const [view, setView] = useState<View>("list");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("All");
  const [authUser, setAuthUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);

  const loadPeople = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/people", { credentials: "include" });
      if (r.ok) {
        const d = await r.json();
        setPeople(d.people ?? []);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadPeople();
    fetch("/api/user/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.id) setAuthUser(d); })
      .catch(() => {});
  }, []);

  const handleUpdate = (updated: Person) => {
    setPeople(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPerson(updated);
  };

  const handleDelete = (id: number) => {
    setPeople(prev => prev.filter(p => p.id !== id));
  };

  const filtered = people.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    All: people.length,
    Active: people.filter(p => p.status === "Active").length,
    Invited: people.filter(p => p.status === "Invited").length,
    Pending: people.filter(p => p.status === "Pending").length,
  };

  if (view === "profile" && selectedPerson) {
    return <ProfileView person={selectedPerson} onBack={() => { setView("list"); setSelectedPerson(null); }} onUpdate={handleUpdate} onDelete={handleDelete} />;
  }
  if (view === "invite") {
    return <InviteView onBack={() => setView("list")} onSaved={() => { loadPeople(); setView("list"); }} />;
  }
  if (view === "add") {
    return <AddPersonView onBack={() => setView("list")} onAdded={() => { loadPeople(); setView("list"); }} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 pb-3 border-b flex-shrink-0 space-y-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <h2 className="text-[20px] font-bold text-foreground flex-1" style={{ letterSpacing: "-0.02em" }}>People</h2>
          <button onClick={() => setView("add")}
            className="text-[12px] font-semibold px-3 py-2 rounded-xl transition-all"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}>
            + Add
          </button>
          <button onClick={() => setView("invite")}
            className="text-[12px] text-white font-semibold px-3 py-2 rounded-xl transition-all"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            + Invite
          </button>
        </div>

        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, role…"
          className="w-full rounded-xl px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
          style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }} />

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {(["All", "Active", "Invited", "Pending"] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all"
              style={filterStatus === s
                ? { background: "rgba(99,102,241,0.20)", borderColor: "rgba(99,102,241,0.45)", color: "#818cf8" }
                : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.50)" }}>
              {s} ({counts[s]})
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {authUser && (
          <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              {authUser.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[14px] text-foreground">{authUser.name}</p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>You</span>
              </div>
              <p className="text-[12px] text-muted-foreground">{authUser.email}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-8 justify-center text-[13px] text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading people…
          </div>
        ) : filtered.length === 0 && people.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-4xl">👥</p>
            <p className="text-[15px] font-semibold text-foreground">No people yet</p>
            <p className="text-[13px] text-muted-foreground">Add team members or import contacts with the Invite button.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">No people match your filter.</div>
        ) : (
          filtered.map(person => (
            <button key={person.id}
              onClick={() => { setSelectedPerson(person); setView("profile"); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.30)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>
                {person.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] text-foreground truncate">{person.name}</p>
                <p className="text-[12px] text-muted-foreground truncate">{person.role}{person.department ? ` · ${person.department}` : ""}</p>
                {person.email && <p className="text-[11px] text-muted-foreground/60 truncate">{person.email}</p>}
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={statusStyle(person.status)}>{person.status}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
