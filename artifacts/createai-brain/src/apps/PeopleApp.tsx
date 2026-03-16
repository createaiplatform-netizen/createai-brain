import React from "react";

const MOCK_PEOPLE = [
  { name: "Jake S.", role: "Son", email: "jake@example.com", phone: "555-0101", tags: ["funny", "outdoorsy", "fishing"], status: "Invited" },
  { name: "Maria L.", role: "Cousin", email: "maria@example.com", phone: "555-0102", tags: ["bilingual", "adventurous"], status: "Active" },
  { name: "Tom B.", role: "Friend", email: "tom@example.com", phone: "555-0103", tags: ["serious", "construction"], status: "Pending" },
];

export function PeopleApp() {
  const [view, setView] = React.useState<"list" | "invite">("list");
  const [pastedText, setPastedText] = React.useState("");
  const [parsed, setParsed] = React.useState<{ name: string; email: string; phone: string }[]>([]);

  const handleParse = () => {
    const lines = pastedText.split("\n").filter(Boolean);
    const results = lines.map(line => ({
      name: line.match(/([A-Z][a-z]+ [A-Z][a-z]+)/)?.[1] || "Unknown",
      email: line.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || "",
      phone: line.match(/[\d]{3}[-.\s]?[\d]{3}[-.\s]?[\d]{4}/)?.[0] || "",
    }));
    setParsed(results);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-foreground flex-1">People</h2>
        <button
          onClick={() => setView(v => v === "list" ? "invite" : "list")}
          className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          {view === "list" ? "+ Invite" : "← People"}
        </button>
      </div>

      {view === "list" ? (
        <div className="space-y-3">
          {MOCK_PEOPLE.map(p => (
            <div key={p.name} className="flex items-start gap-4 p-4 bg-background rounded-2xl border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[14px] text-foreground">{p.name}</p>
                  <span className="text-[10px] text-muted-foreground">· {p.role}</span>
                </div>
                <p className="text-[12px] text-muted-foreground">{p.email} · {p.phone}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {p.tags.map(t => (
                    <span key={t} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.status === "Active" ? "bg-green-100 text-green-700" : p.status === "Invited" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] text-muted-foreground">Paste a list of contacts in any format. Names, emails, phone numbers, notes — the system organizes it automatically.</p>
          <textarea
            value={pastedText}
            onChange={e => setPastedText(e.target.value)}
            placeholder={"Jake Smith, jake@email.com, 555-0101, son, funny, loves fishing\nMaria Lopez, maria@email.com, bilingual, cousin"}
            className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
            rows={5}
          />
          <button onClick={handleParse} disabled={!pastedText.trim()} className="bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40">
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
                  <div className="flex gap-1.5">
                    {p.email && (
                      <a href={`mailto:${p.email}?subject=Your Invite&body=Hi ${p.name}! You've been invited to join the platform.`}
                        className="text-[11px] bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-colors">
                        Send Email
                      </a>
                    )}
                    {p.phone && (
                      <a href={`sms:${p.phone}&body=Hi ${p.name}! You've been invited to join the platform.`}
                        className="text-[11px] bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-green-200 transition-colors">
                        Send Text
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
