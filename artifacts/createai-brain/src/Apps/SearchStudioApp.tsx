import React, { useState, useEffect, useRef, useCallback } from "react";

type SearchResult = { domain: string; id: string | number; title: string; excerpt: string; score: number; url: string };
type SearchResponse = { ok: boolean; query: string; total: number; results: SearchResult[]; byDomain: Record<string, SearchResult[]> };

const DOMAIN_ICONS: Record<string, string> = {
  projects: "📁", documents: "📄", people: "👤", leads: "🎯",
  opportunities: "💼", healthcare: "🏥", legal: "⚖️", staffing: "👔", activity: "📊",
};
const DOMAIN_COLORS: Record<string, string> = {
  projects: "#6366f1", documents: "#8b5cf6", people: "#06b6d4", leads: "#f59e0b",
  opportunities: "#10b981", healthcare: "#3b82f6", legal: "#64748b", staffing: "#f97316", activity: "#a855f7",
};

const ALL_DOMAINS = ["projects","documents","people","leads","opportunities","healthcare","legal","staffing","activity"];

const S: Record<string, React.CSSProperties> = {
  root:   { background: "#020617", minHeight: "100%", color: "#e2e8f0", fontFamily: "'Inter',system-ui,sans-serif", padding: "1.5rem", overflowY: "auto" as const },
  h1:     { fontSize: "1.25rem", fontWeight: 700, color: "#a5b4fc" },
  sub:    { fontSize: ".8rem", color: "#64748b", marginTop: ".2rem", marginBottom: "1.25rem" },
  search: { display: "flex", gap: ".75rem", marginBottom: "1rem" },
  inp:    { flex: 1, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "10px", color: "#e2e8f0", padding: ".65rem 1rem", fontSize: ".9rem", outline: "none" },
  btn:    { background: "#6366f1", color: "#fff", border: "none", borderRadius: "10px", padding: ".65rem 1.25rem", fontSize: ".875rem", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" as const },
  filters:{ display: "flex", gap: ".4rem", flexWrap: "wrap" as const, marginBottom: "1.25rem" },
  chip:   { padding: ".25em .65em", borderRadius: "6px", fontSize: ".75rem", cursor: "pointer", border: "1px solid transparent", transition: "all .15s" },
  stats:  { fontSize: ".8rem", color: "#64748b", marginBottom: "1rem" },
  result: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "10px", padding: "1rem 1.1rem", marginBottom: ".65rem", borderLeft: "3px solid" },
  rtop:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: ".35rem" },
  rtitle: { fontSize: ".9rem", fontWeight: 600, color: "#e2e8f0" },
  rexc:   { fontSize: ".8rem", color: "#94a3b8", lineHeight: 1.5 },
  rdomain:{ fontSize: ".72rem", fontWeight: 600, padding: ".1em .45em", borderRadius: "4px" },
  rscore: { fontSize: ".7rem", color: "#64748b" },
  empty:  { textAlign: "center" as const, color: "#64748b", padding: "3rem", fontStyle: "italic", fontSize: ".875rem" },
};

export function SearchStudioApp() {
  const [query,     setQuery]    = useState("");
  const [domains,   setDomains]  = useState<string[]>(ALL_DOMAINS);
  const [results,   setResults]  = useState<SearchResult[]>([]);
  const [total,     setTotal]    = useState(0);
  const [loading,   setLoading]  = useState(false);
  const [searched,  setSearched] = useState(false);
  const [elapsed,   setElapsed]  = useState(0);
  const [suggests,  setSuggests] = useState<{ label: string; domain: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    const t0 = Date.now();
    const params = new URLSearchParams({ q, limit: "50" });
    domains.forEach(d => params.append("domains[]", d));
    const r = await fetch(`/api/search?${params.toString()}`, { credentials: "include" }).then(x => x.json()).catch(() => ({ ok: false, results: [], total: 0 })) as SearchResponse;
    setResults(r.results ?? []);
    setTotal(r.total ?? 0);
    setLoading(false);
    setSearched(true);
    setElapsed(Date.now() - t0);
    setSuggests([]);
  }, [domains]);

  const handleInput = (v: string) => {
    setQuery(v);
    clearTimeout(debounceRef.current);
    if (v.length >= 2) {
      debounceRef.current = setTimeout(() => {
        fetch(`/api/search/suggest?q=${encodeURIComponent(v)}`, { credentials: "include" })
          .then(r => r.json())
          .then((d: { suggestions?: { label: string; domain: string }[] }) => setSuggests(d.suggestions?.slice(0, 6) ?? []))
          .catch(() => {});
      }, 200);
    } else { setSuggests([]); }
  };

  const toggleDomain = (d: string) => {
    setDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  return (
    <div style={S.root} role="main">
      <a href="#results" style={{ position: "absolute", left: -999, top: 0 }}>Skip to results</a>
      <div style={S.h1}>🔍 Universal Search</div>
      <div style={S.sub}>Full-text search across all platform domains simultaneously</div>

      <div style={S.search}>
        <div style={{ position: "relative" as const, flex: 1 }}>
          <input
            ref={inputRef}
            style={S.inp}
            value={query}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search(query)}
            placeholder="Search projects, people, leads, patients, legal cases, candidates…"
            aria-label="Universal search query"
            aria-autocomplete="list"
          />
          {suggests.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", borderRadius: "8px", zIndex: 10, marginTop: ".25rem" }}>
              {suggests.map((s, i) => (
                <div key={i} style={{ padding: ".55rem 1rem", cursor: "pointer", fontSize: ".8rem", color: "#e2e8f0", borderBottom: "1px solid rgba(255,255,255,.06)" }}
                  onClick={() => { setQuery(s.label); setSuggests([]); void search(s.label); }}>
                  <span style={{ color: DOMAIN_COLORS[s.domain] ?? "#6366f1", fontSize: ".7rem", marginRight: ".4rem" }}>{DOMAIN_ICONS[s.domain] ?? "•"}</span>
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>
        <button style={S.btn} onClick={() => search(query)} disabled={loading}>{loading ? "…" : "Search"}</button>
      </div>

      {/* Domain filters */}
      <div style={S.filters}>
        <span
          style={{ ...S.chip, background: domains.length === ALL_DOMAINS.length ? "rgba(99,102,241,.25)" : "rgba(255,255,255,.05)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.3)" }}
          onClick={() => setDomains(ALL_DOMAINS)} role="button" tabIndex={0}>All domains</span>
        {ALL_DOMAINS.map(d => {
          const on = domains.includes(d);
          const c  = DOMAIN_COLORS[d] ?? "#6366f1";
          return (
            <span key={d} style={{ ...S.chip, background: on ? `${c}22` : "rgba(255,255,255,.03)", color: on ? c : "#64748b", border: `1px solid ${on ? c : "transparent"}` }}
              onClick={() => toggleDomain(d)} role="button" tabIndex={0} aria-pressed={on}>
              {DOMAIN_ICONS[d] ?? ""} {d}
            </span>
          );
        })}
      </div>

      {/* Stats */}
      {searched && !loading && (
        <div style={S.stats}>{total} results in {elapsed}ms across {domains.length} domains</div>
      )}

      {/* Results */}
      <div id="results">
        {loading && <div style={S.empty}>Searching…</div>}
        {!loading && searched && results.length === 0 && (
          <div style={S.empty}>No results for "{query}" in the selected domains. Try different keywords.</div>
        )}
        {!loading && !searched && (
          <div style={S.empty}>Type a query and press Enter or click Search to begin.</div>
        )}
        {!loading && results.map((r, i) => {
          const c = DOMAIN_COLORS[r.domain] ?? "#6366f1";
          return (
            <div key={`${r.domain}-${r.id}-${i}`} style={{ ...S.result, borderLeftColor: c }}>
              <div style={S.rtop}>
                <div style={S.rtitle}>{r.title || "(Untitled)"}</div>
                <div style={{ display: "flex", gap: ".4rem", alignItems: "center" }}>
                  <span style={{ ...S.rdomain, background: `${c}22`, color: c }}>{DOMAIN_ICONS[r.domain] ?? ""} {r.domain}</span>
                  <span style={S.rscore}>score: {r.score.toFixed(4)}</span>
                </div>
              </div>
              {r.excerpt && <div style={S.rexc}>{r.excerpt}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
