import { useState, useCallback, useRef } from "react";

type SearchResult = {
  domain: string; id: number; title: string; excerpt: string;
  score?: number; url?: string; metadata?: Record<string, unknown>;
};

const DOMAINS = ["projects","documents","people","leads","opportunities","healthcare","legal","staffing","tasks"];
const DOMAIN_COLORS: Record<string, string> = {
  projects: "#6366f1", documents: "#8b5cf6", people: "#06b6d4", leads: "#f59e0b",
  opportunities: "#22c55e", healthcare: "#ef4444", legal: "#f97316", staffing: "#ec4899",
  tasks: "#14b8a6", default: "#64748b",
};
const DOMAIN_ICONS: Record<string, string> = {
  projects: "📂", documents: "📄", people: "👤", leads: "🎯",
  opportunities: "💡", healthcare: "🏥", legal: "⚖️", staffing: "👥",
  tasks: "✅", default: "🔍",
};

export default function UniversalSearchApp() {
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<SearchResult[]>([]);
  const [grouped, setGrouped]     = useState<Record<string, SearchResult[]>>({});
  const [selectedDomains, setSel] = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [msg, setMsg]             = useState("");
  const [view, setView]           = useState<"flat"|"grouped">("grouped");
  const inputRef = useRef<HTMLInputElement>(null);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const search = useCallback(async (q: string, domains: string[]) => {
    if (!q.trim()) { notify("Enter a search query"); return; }
    setLoading(true);
    setSearched(false);
    try {
      const params = new URLSearchParams({ q, limit: "50" });
      domains.forEach(d => params.append("domains[]", d));
      const r = await fetch(`/api/search?${params}`, { credentials: "include" });
      const data = await r.json();
      const res: SearchResult[] = data.results ?? [];
      setResults(res);
      const g: Record<string, SearchResult[]> = {};
      res.forEach(item => { (g[item.domain] = g[item.domain] ?? []).push(item); });
      setGrouped(g);
      setSearched(true);
      if (res.length === 0) notify("No results found");
    } catch { notify("Search failed"); } finally { setLoading(false); }
  }, []);

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); search(query, selectedDomains); };

  const toggleDomain = (d: string) =>
    setSel(s => s.includes(d) ? s.filter(x => x !== d) : [...s, d]);

  const col = (domain: string) => DOMAIN_COLORS[domain] ?? DOMAIN_COLORS.default;

  const ResultCard = ({ r }: { r: SearchResult }) => (
    <div style={{ background: "#0f172a", border: `1px solid ${col(r.domain)}33`, borderRadius: 10, padding: 14, display: "flex", gap: 12 }}>
      <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{DOMAIN_ICONS[r.domain] ?? "🔍"}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ background: col(r.domain) + "22", color: col(r.domain), padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{r.domain}</span>
          {r.score != null && <span style={{ fontSize: 11, color: "#475569" }}>score: {Number(r.score).toFixed(3)}</span>}
        </div>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
        {r.excerpt && <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.excerpt}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#f1f5f9", fontFamily: "Inter,sans-serif", padding: "24px" }}>
      <div aria-live="polite" style={{ position: "fixed", top: 16, right: 16, background: msg ? "#6366f1" : "transparent", color: "#fff", padding: msg ? "10px 18px" : 0, borderRadius: 8, fontSize: 14, zIndex: 999, transition: "all .2s" }}>{msg}</div>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔍</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Universal Search</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Full-text search across all platform domains simultaneously</p>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search projects, people, leads, documents, health records, legal matters…"
              style={{ flex: 1, background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: "12px 16px", color: "#f1f5f9", fontSize: 15, outline: "none" }}
              autoFocus />
            <button type="submit" disabled={loading} style={{ padding: "12px 24px", background: "#6366f1", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: 15, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: "#64748b", padding: "4px 0", alignSelf: "center" }}>Filter:</span>
            {DOMAINS.map(d => (
              <button key={d} type="button" onClick={() => toggleDomain(d)}
                style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${selectedDomains.includes(d) ? col(d) : "#334155"}`, background: selectedDomains.includes(d) ? col(d) + "22" : "transparent", color: selectedDomains.includes(d) ? col(d) : "#64748b", fontSize: 12, cursor: "pointer", fontWeight: selectedDomains.includes(d) ? 600 : 400 }}>
                {DOMAIN_ICONS[d]} {d}
              </button>
            ))}
            {selectedDomains.length > 0 && (
              <button type="button" onClick={() => setSel([])} style={{ padding: "4px 12px", borderRadius: 20, border: "1px solid #475569", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>Clear</button>
            )}
          </div>
        </form>

        {searched && results.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#64748b" }}>{results.length} result{results.length !== 1 ? "s" : ""} across {Object.keys(grouped).length} domain{Object.keys(grouped).length !== 1 ? "s" : ""}</div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["grouped","flat"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{ padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, background: view === v ? "#6366f1" : "#1e293b", color: view === v ? "#fff" : "#64748b" }}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 14, height: 72, opacity: 0.5 + i * 0.1 }} />
            ))}
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 48, textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔭</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No results found</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Try broader terms or remove domain filters</div>
          </div>
        )}

        {!loading && searched && results.length > 0 && view === "grouped" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {Object.entries(grouped).map(([domain, items]) => (
              <div key={domain}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>{DOMAIN_ICONS[domain] ?? "🔍"}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, textTransform: "capitalize" }}>{domain}</span>
                  <span style={{ background: col(domain) + "22", color: col(domain), padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{items.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map(r => <ResultCard key={`${r.domain}-${r.id}`} r={r} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && searched && results.length > 0 && view === "flat" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {results.map(r => <ResultCard key={`${r.domain}-${r.id}`} r={r} />)}
          </div>
        )}

        {!searched && !loading && (
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Search Across Everything</div>
            <div style={{ fontSize: 13, color: "#64748b", maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
              Full-text search across projects, documents, people, leads, opportunities, health records, legal matters, staffing candidates, and tasks — all in one query.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 20 }}>
              {DOMAINS.map(d => (
                <div key={d} style={{ background: col(d) + "11", border: `1px solid ${col(d)}33`, borderRadius: 8, padding: "6px 14px", fontSize: 12, color: col(d) }}>
                  {DOMAIN_ICONS[d]} {d}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
