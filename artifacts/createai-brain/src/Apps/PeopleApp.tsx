import React, { useState } from "react";

const MOCK_PEOPLE = [
  { id: "p1", name: "Jake S.",   role: "Son",    email: "jake@example.com",  phone: "555-0101", tags: ["funny", "outdoorsy", "fishing"], status: "Invited" },
  { id: "p2", name: "Maria L.",  role: "Cousin", email: "maria@example.com", phone: "555-0102", tags: ["bilingual", "adventurous"],       status: "Active"  },
  { id: "p3", name: "Tom B.",    role: "Friend", email: "tom@example.com",   phone: "555-0103", tags: ["serious", "construction"],         status: "Pending" },
];

type PersonView = "list" | "invite" | "profile";

export function PeopleApp() {
  const [view, setView] = useState<PersonView>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [parsed, setParsed] = useState<{ name: string; email: string; phone: string }[]>([]);
  const [userPeople, setUserPeople] = useState<typeof MOCK_PEOPLE>([]);

  const handleParse = () => {
    const lines = pastedText.split("\n").filter(Boolean);
    const results = lines.map(line => ({
      name: line.match(/([A-Z][a-z]+ [A-Z][a-z]+)/)?.[1] || "Unknown",
      email: line.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || "",
      phone: line.match(/[\d]{3}[-.\s]?[\d]{3}[-.\s]?[\d]{4}/)?.[0] || "",
    }));
    setParsed(results);
  };

  const allPeople = [...MOCK_PEOPLE, ...userPeople];
  const person = selectedId ? allPeople.find(p => p.id === selectedId) : null;

  // ── Profile view ──
  if (view === "profile" && person) {
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => { setView("list"); setSelectedId(null); }} className="text-primary text-sm font-medium">‹ People</button>
        <div className="flex flex-col items-center text-center py-4 space-y-2">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
            {person.name[0]}
          </div>
          <h2 className="text-xl font-bold text-foreground">{person.name}</h2>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${person.status === "Active" ? "bg-green-100 text-green-700" : person.status === "Invited" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
            {person.status}
          </span>
          <p className="text-[13px] text-muted-foreground">{person.role}</p>
        </div>

        <div className="bg-background rounded-2xl border border-border/50 divide-y divide-border/30">
          {[
            { label: "Email",  value: person.email,  href: `mailto:${person.email}` },
            { label: "Phone",  value: person.phone,  href: `tel:${person.phone}` },
            { label: "Role",   value: person.role,   href: null },
            { label: "Status", value: person.status, href: null },
          ].map(row => (
            <div key={row.label} className="flex items-center px-4 py-3 gap-3">
              <span className="text-[12px] text-muted-foreground w-14 flex-shrink-0">{row.label}</span>
              {row.href
                ? <a href={row.href} className="text-[13px] text-primary font-medium hover:underline flex-1">{row.value}</a>
                : <span className="text-[13px] text-foreground font-medium flex-1">{row.value}</span>
              }
            </div>
          ))}
        </div>

        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tags</p>
          <div className="flex gap-1.5 flex-wrap">
            {person.tags.map(t => (
              <span key={t} className="text-[11px] bg-muted px-2.5 py-1 rounded-full text-muted-foreground">{t}</span>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {person.email && (
            <a href={`mailto:${person.email}?subject=Hello ${person.name}!`}
              className="flex-1 text-center text-[12px] bg-primary/10 text-primary font-semibold py-2.5 rounded-xl hover:bg-primary/20 transition-colors">
              📧 Email
            </a>
          )}
          {person.phone && (
            <a href={`sms:${person.phone}`}
              className="flex-1 text-center text-[12px] bg-green-100 text-green-700 font-semibold py-2.5 rounded-xl hover:bg-green-200 transition-colors">
              💬 Text
            </a>
          )}
          <a href={`tel:${person.phone}`}
            className="flex-1 text-center text-[12px] bg-muted text-muted-foreground font-semibold py-2.5 rounded-xl hover:bg-muted/80 transition-colors">
            📞 Call
          </a>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">All contact info is mock. No real messages are sent without your action.</p>
      </div>
    );
  }

  // ── Invite view ──
  if (view === "invite") {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground flex-1">Invite People</h2>
          <button onClick={() => { setView("list"); setParsed([]); setPastedText(""); }}
            className="bg-muted text-muted-foreground text-sm font-medium px-4 py-2 rounded-xl hover:bg-muted/80 transition-colors">
            ← People
          </button>
        </div>
        <p className="text-[13px] text-muted-foreground">Paste a list of contacts in any format. Names, emails, phone numbers — the system organizes it automatically.</p>
        <textarea value={pastedText} onChange={e => setPastedText(e.target.value)}
          placeholder={"Jake Smith, jake@email.com, 555-0101, son, funny, loves fishing\nMaria Lopez, maria@email.com, bilingual, cousin"}
          className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
          rows={5} />
        <button onClick={handleParse} disabled={!pastedText.trim()}
          className="bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40">
          Parse Contacts
        </button>
        {parsed.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[13px] font-semibold text-foreground">Parsed Contacts</h3>
            {parsed.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/50">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {p.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13px] text-foreground">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.email} {p.phone}</p>
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
            <p className="text-[10px] text-muted-foreground">Tapping Email or Text opens your device's mail/messages app. Nothing is sent automatically.</p>
          </div>
        )}
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-foreground flex-1">People</h2>
        <button onClick={() => setView("invite")}
          className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
          + Invite
        </button>
      </div>
      <div className="space-y-2">
        {allPeople.map(p => (
          <button key={p.id} onClick={() => { setSelectedId(p.id); setView("profile"); }}
            className="w-full flex items-start gap-4 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {p.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[14px] text-foreground">{p.name}</p>
                <span className="text-[10px] text-muted-foreground">· {p.role}</span>
              </div>
              <p className="text-[12px] text-muted-foreground truncate">{p.email} · {p.phone}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {p.tags.map(t => (
                  <span key={t} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{t}</span>
                ))}
              </div>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${p.status === "Active" ? "bg-green-100 text-green-700" : p.status === "Invited" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
              {p.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
