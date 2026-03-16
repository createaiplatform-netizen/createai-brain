import React, { useState, useEffect } from "react";
import { PlatformStore, PlatformUser } from "@/engine/PlatformStore";
import { BrainGen } from "@/engine/BrainGen";

// ─── Helpers ───────────────────────────────────────────────────────────────
function statusCls(status: PlatformUser["status"]) {
  return status === "Active"  ? "bg-green-100 text-green-700"  :
         status === "Invited" ? "bg-blue-100 text-blue-700"    :
                                "bg-orange-100 text-orange-700";
}

function Avatar({ name, size = 10 }: { name: string; size?: number }) {
  return (
    <div className={`w-${size} h-${size} rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0`}
      style={{ fontSize: size * 1.4 + "px" }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

type View = "list" | "profile" | "invite" | "add" | "inviteDetail";

// ─── Profile View ──────────────────────────────────────────────────────────
function ProfileView({ user, onBack }: { user: PlatformUser; onBack: () => void }) {
  const [status, setStatus] = useState<PlatformUser["status"]>(user.status);
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied]   = useState<"msg" | "link" | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleStatusChange = (s: PlatformUser["status"]) => {
    setStatus(s);
    PlatformStore.updateUserStatus(user.id, s);
  };

  const handleGenerateInvite = async () => {
    setGenerating(true);
    const link = PlatformStore.generateInviteLink(user.name);
    setInviteLink(link);
    const msg = PlatformStore.generateInviteMessage(user.name, user.role, link);
    setInviteMsg(msg);
    setGenerating(false);
  };

  const copy = (what: "msg" | "link") => {
    navigator.clipboard.writeText(what === "msg" ? inviteMsg : inviteLink);
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <button onClick={onBack} className="text-primary text-sm font-medium">‹ People</button>

      {/* Avatar */}
      <div className="flex flex-col items-center text-center py-4 space-y-2">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
          {user.name[0]}
        </div>
        <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusCls(status)}`}>{status}</span>
        <p className="text-[13px] text-muted-foreground">{user.role}</p>
      </div>

      {/* Contact rows */}
      <div className="bg-background rounded-2xl border border-border/50 divide-y divide-border/30">
        {[
          { label: "Email", value: user.email, href: user.email ? `mailto:${user.email}` : null },
          { label: "Phone", value: user.phone, href: user.phone ? `tel:${user.phone}` : null },
          { label: "Role",  value: user.role,  href: null },
          { label: "Added", value: new Date(user.addedAt).toLocaleDateString(), href: null },
        ].map(row => (
          <div key={row.label} className="flex items-center px-4 py-3 gap-3">
            <span className="text-[12px] text-muted-foreground w-14 flex-shrink-0">{row.label}</span>
            {row.href
              ? <a href={row.href} className="text-[13px] text-primary font-medium hover:underline flex-1">{row.value || "—"}</a>
              : <span className="text-[13px] text-foreground font-medium flex-1">{row.value || "—"}</span>
            }
          </div>
        ))}
      </div>

      {/* Tags */}
      {user.tags.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tags</p>
          <div className="flex gap-1.5 flex-wrap">
            {user.tags.map(t => (
              <span key={t} className="text-[11px] bg-muted px-2.5 py-1 rounded-full text-muted-foreground">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Status change */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Change Status</p>
        <div className="flex gap-2">
          {(["Active", "Invited", "Pending"] as PlatformUser["status"][]).map(s => (
            <button key={s} onClick={() => handleStatusChange(s)}
              className={`flex-1 text-[11px] font-semibold py-2 rounded-xl border transition-all
                ${status === s ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Contact actions */}
      <div className="flex gap-2">
        {user.email && (
          <a href={`mailto:${user.email}?subject=Hello ${user.name}!`}
            className="flex-1 text-center text-[12px] bg-primary/10 text-primary font-semibold py-2.5 rounded-xl hover:bg-primary/20 transition-colors">
            📧 Email
          </a>
        )}
        {user.phone && (
          <a href={`sms:${user.phone}`}
            className="flex-1 text-center text-[12px] bg-green-100 text-green-700 font-semibold py-2.5 rounded-xl hover:bg-green-200 transition-colors">
            💬 Text
          </a>
        )}
        {user.phone && (
          <a href={`tel:${user.phone}`}
            className="flex-1 text-center text-[12px] bg-muted text-muted-foreground font-semibold py-2.5 rounded-xl hover:bg-muted/80 transition-colors">
            📞 Call
          </a>
        )}
      </div>

      {/* Brain invite generator */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-3">
        <p className="font-semibold text-[13px] text-foreground">🧠 Generate Platform Invite</p>
        <p className="text-[11px] text-muted-foreground">The Brain writes a personalized invite message with your platform link — ready to copy and send.</p>
        <button onClick={handleGenerateInvite} disabled={generating}
          className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
          {generating ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</> : "✨ Generate Invite"}
        </button>
        {inviteMsg && (
          <div className="space-y-2">
            <div className="bg-background border border-border/50 rounded-xl p-3 max-h-48 overflow-y-auto">
              <pre className="text-[11px] text-foreground whitespace-pre-wrap font-sans">{inviteMsg}</pre>
            </div>
            <div className="flex gap-2">
              <button onClick={() => copy("msg")}
                className="flex-1 text-[11px] bg-muted text-muted-foreground font-semibold py-2 rounded-xl hover:bg-muted/80 transition-colors">
                {copied === "msg" ? "✓ Copied Message" : "Copy Message"}
              </button>
              <button onClick={() => copy("link")}
                className="flex-1 text-[11px] bg-primary/10 text-primary font-semibold py-2 rounded-xl hover:bg-primary/20 transition-colors">
                {copied === "link" ? "✓ Copied Link" : "Copy Link Only"}
              </button>
            </div>
            {user.email && (
              <a href={`mailto:${user.email}?subject=Your Invite to CreateAI Brain&body=${encodeURIComponent(inviteMsg)}`}
                className="block w-full text-center text-[12px] bg-green-100 text-green-700 font-semibold py-2.5 rounded-xl hover:bg-green-200 transition-colors">
                📧 Open in Email App
              </a>
            )}
            {user.phone && (
              <a href={`sms:${user.phone}&body=${encodeURIComponent(inviteMsg.slice(0, 320))}`}
                className="block w-full text-center text-[12px] bg-blue-100 text-blue-700 font-semibold py-2.5 rounded-xl hover:bg-blue-200 transition-colors">
                💬 Open in Messages App
              </a>
            )}
          </div>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">Tapping Email or Text opens your device's native app. Nothing is sent automatically.</p>
    </div>
  );
}

// ─── Invite View (bulk paste) ───────────────────────────────────────────────
function InviteView({ onBack, onSaved }: { onBack: () => void; onSaved: () => void }) {
  const [pastedText, setPastedText] = useState("");
  const [parsed, setParsed]         = useState<{ name: string; email: string; phone: string; role: string }[]>([]);
  const [saved, setSaved]           = useState(false);
  const [inviteMsg, setInviteMsg]   = useState("");
  const [generatingMsg, setGeneratingMsg] = useState(false);
  const [copied, setCopied]         = useState(false);

  const handleParse = () => {
    const lines = pastedText.split("\n").filter(Boolean);
    const results = lines.map(line => ({
      name:  line.match(/([A-Z][a-z]+ [A-Z][a-z]+|[A-Z][a-z]+)/)?.[1] || "Unknown",
      email: line.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || "",
      phone: line.match(/[\d]{3}[-.\s]?[\d]{3}[-.\s]?[\d]{4}/)?.[0] || "",
      role:  line.toLowerCase().includes("admin") ? "Admin" :
             line.toLowerCase().includes("view")  ? "Viewer" : "Creator",
    }));
    setParsed(results);
  };

  const handleSaveAll = () => {
    parsed.forEach(p => {
      PlatformStore.addUser({
        name: p.name, email: p.email, phone: p.phone, role: p.role,
        tags: [], status: "Invited", createdBy: "sara",
      });
    });
    setSaved(true);
    setTimeout(() => { onSaved(); }, 1200);
  };

  const handleGenerateBulkMsg = async () => {
    setGeneratingMsg(true);
    const names = parsed.map(p => p.name.split(" ")[0]).join(", ");
    const res = await BrainGen.generate(`Platform invite for ${names} — write a warm, exciting invitation to join the CreateAI Brain platform`);
    setInviteMsg(res.content);
    setGeneratingMsg(false);
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-foreground flex-1">Invite People</h2>
        <button onClick={onBack} className="bg-muted text-muted-foreground text-sm font-medium px-4 py-2 rounded-xl hover:bg-muted/80 transition-colors">← Back</button>
      </div>
      <p className="text-[13px] text-muted-foreground">Paste any list of contacts — names, emails, phone numbers. The Brain parses and organizes automatically.</p>
      <textarea value={pastedText} onChange={e => setPastedText(e.target.value)}
        placeholder={"Jake Smith, jake@email.com, 555-0101, son, funny, loves fishing\nMaria Lopez, maria@email.com, bilingual, cousin\nTom B., tom@email.com, 555-0103, friend, construction"}
        className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
        rows={5} />
      <button onClick={handleParse} disabled={!pastedText.trim()}
        className="bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40">
        Parse Contacts
      </button>

      {parsed.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-foreground flex-1">{parsed.length} Contact{parsed.length > 1 ? "s" : ""} Parsed</h3>
            {!saved && (
              <button onClick={handleSaveAll}
                className="text-[12px] bg-green-600 text-white font-semibold px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity">
                Save All to People
              </button>
            )}
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-green-700 font-semibold text-[13px]">✓ All contacts saved to People!</p>
            </div>
          )}

          {parsed.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/50">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] text-foreground">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">{[p.email, p.phone].filter(Boolean).join(" · ") || "No contact info"}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {p.email && (
                  <a href={`mailto:${p.email}?subject=Your Invite&body=Hi ${p.name}! You've been invited to join the platform.`}
                    className="text-[11px] bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-colors">
                    Email
                  </a>
                )}
                {p.phone && (
                  <a href={`sms:${p.phone}&body=Hi ${p.name}! You've been invited to join the platform.`}
                    className="text-[11px] bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-green-200 transition-colors">
                    Text
                  </a>
                )}
              </div>
            </div>
          ))}

          {/* Brain-generated group invite */}
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-3">
            <p className="font-semibold text-[13px] text-foreground">🧠 Generate Group Invite Message</p>
            <button onClick={handleGenerateBulkMsg} disabled={generatingMsg}
              className="w-full bg-primary text-white text-sm font-semibold py-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
              {generatingMsg ? "Generating…" : "✨ Write Invite with Brain"}
            </button>
            {inviteMsg && (
              <div className="space-y-2">
                <div className="bg-background border border-border/50 rounded-xl p-3 max-h-40 overflow-y-auto">
                  <pre className="text-[11px] text-foreground whitespace-pre-wrap font-sans">{inviteMsg}</pre>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(inviteMsg); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  className="w-full text-[11px] bg-muted text-muted-foreground font-semibold py-2 rounded-xl hover:bg-muted/80 transition-colors">
                  {copied ? "✓ Copied!" : "Copy Message"}
                </button>
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">Tapping Email or Text opens your device's mail/messages app. Nothing is sent automatically.</p>
        </div>
      )}
    </div>
  );
}

// ─── Add Person (manual) ────────────────────────────────────────────────────
function AddPersonView({ onBack, onAdded }: { onBack: () => void; onAdded: (u: PlatformUser) => void }) {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole]   = useState("Creator");
  const [tags, setTags]   = useState("");
  const [done, setDone]   = useState(false);

  const handleAdd = () => {
    if (!name.trim()) return;
    const u = PlatformStore.addUser({
      name: name.trim(), email: email.trim(), phone: phone.trim(),
      role, tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      status: "Invited", createdBy: "sara",
    });
    setDone(true);
    setTimeout(() => onAdded(u), 900);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-foreground flex-1">Add Person</h2>
        <button onClick={onBack} className="bg-muted text-muted-foreground text-sm font-medium px-4 py-2 rounded-xl hover:bg-muted/80 transition-colors">← Back</button>
      </div>

      {done && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-green-700 font-semibold">✓ Person added! Returning to People…</p>
        </div>
      )}

      {[
        { label: "Full Name *", value: name,  set: setName,  type: "text",  ph: "Jake Smith" },
        { label: "Email",      value: email, set: setEmail, type: "email", ph: "jake@email.com" },
        { label: "Phone",      value: phone, set: setPhone, type: "tel",   ph: "555-0101" },
        { label: "Tags (comma-separated)", value: tags, set: setTags, type: "text", ph: "funny, outdoorsy, fishing" },
      ].map(f => (
        <div key={f.label}>
          <label className="block text-[12px] font-semibold text-muted-foreground mb-1">{f.label}</label>
          <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph}
            className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>
      ))}

      <div>
        <label className="block text-[12px] font-semibold text-muted-foreground mb-1">Role</label>
        <div className="flex gap-2">
          {["Creator", "Viewer", "Admin"].map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`flex-1 text-[12px] font-semibold py-2.5 rounded-xl border transition-all
                ${role === r ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleAdd} disabled={!name.trim() || done}
        className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
        Add to Platform
      </button>
    </div>
  );
}

// ─── Main PeopleApp ─────────────────────────────────────────────────────────
export function PeopleApp() {
  const [view, setView]         = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [users, setUsers]       = useState<PlatformUser[]>([]);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState<PlatformUser["status"] | "All">("All");

  const loadUsers = () => setUsers(PlatformStore.getUsers());

  useEffect(() => {
    loadUsers();
    window.addEventListener("cai:users-change", loadUsers);
    return () => window.removeEventListener("cai:users-change", loadUsers);
  }, []);

  const selectedUser = selectedId ? users.find(u => u.id === selectedId) : null;

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    All: users.length,
    Active: users.filter(u => u.status === "Active").length,
    Invited: users.filter(u => u.status === "Invited").length,
    Pending: users.filter(u => u.status === "Pending").length,
  };

  if (view === "profile" && selectedUser) {
    return <ProfileView user={selectedUser} onBack={() => { setView("list"); setSelectedId(null); }} />;
  }

  if (view === "invite") {
    return <InviteView onBack={() => setView("list")} onSaved={() => { loadUsers(); setView("list"); }} />;
  }

  if (view === "add") {
    return <AddPersonView onBack={() => setView("list")} onAdded={() => { loadUsers(); setView("list"); }} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 pb-3 border-b border-border/50 space-y-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-foreground flex-1">People</h2>
          <button onClick={() => setView("add")}
            className="text-[12px] bg-muted text-muted-foreground font-semibold px-3 py-2 rounded-xl hover:bg-muted/80 transition-colors">
            + Add
          </button>
          <button onClick={() => setView("invite")}
            className="text-[12px] bg-primary text-white font-semibold px-3 py-2 rounded-xl hover:opacity-90 transition-opacity">
            + Invite
          </button>
        </div>

        {/* Search */}
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, role…"
          className="w-full bg-muted/50 border border-border/30 rounded-xl px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />

        {/* Status filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {(["All", "Active", "Invited", "Pending"] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all
                ${filterStatus === s ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}>
              {s} ({counts[s]})
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <p className="text-4xl">👥</p>
            <p className="text-muted-foreground text-[13px]">No people found. Tap + Invite or + Add to get started.</p>
          </div>
        )}
        {filtered.map(u => (
          <button key={u.id} onClick={() => { setSelectedId(u.id); setView("profile"); }}
            className="w-full flex items-start gap-4 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {u.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[14px] text-foreground">{u.name}</p>
                <span className="text-[10px] text-muted-foreground">· {u.role}</span>
              </div>
              <p className="text-[12px] text-muted-foreground truncate">
                {[u.email, u.phone].filter(Boolean).join(" · ") || "No contact info"}
              </p>
              {u.tags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {u.tags.slice(0, 3).map(t => (
                    <span key={t} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusCls(u.status)}`}>
              {u.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
