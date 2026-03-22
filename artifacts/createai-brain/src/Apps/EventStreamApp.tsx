import React, { useState, useEffect, useRef, useCallback } from "react";

type PlatformEvent = { id: string; topic: string; event: string; data: Record<string, unknown>; timestamp: string };

const TOPIC_COLORS: Record<string, string> = {
  system: "#6366f1", platform: "#8b5cf6", user: "#06b6d4", ai: "#22c55e",
  automation: "#f59e0b", finance: "#10b981", healthcare: "#3b82f6",
  legal: "#64748b", staffing: "#f97316", marketplace: "#ec4899", analytics: "#a855f7",
};

const S: Record<string, React.CSSProperties> = {
  root:    { background: "#020617", minHeight: "100%", color: "#e2e8f0", fontFamily: "'Inter',system-ui,sans-serif", padding: "1.5rem", overflowY: "auto" as const },
  h1:      { fontSize: "1.25rem", fontWeight: 700, color: "#a5b4fc" },
  sub:     { fontSize: ".8rem", color: "#64748b", marginTop: ".2rem" },
  statsR:  { display: "flex", gap: "1rem", alignItems: "center" },
  stat:    { fontSize: ".75rem", color: "#64748b" },
  statV:   { fontWeight: 700, color: "#a5b4fc" },
  card:    { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" },
  h2:      { fontSize: ".875rem", fontWeight: 600, color: "#c7d2fe", marginBottom: ".75rem" },
  feed:    { height: 380, overflowY: "auto" as const, display: "flex", flexDirection: "column-reverse" as const, gap: ".4rem" },
  evt:     { background: "rgba(255,255,255,.04)", borderRadius: "8px", padding: ".6rem .8rem", borderLeft: "3px solid", transition: "opacity .2s" },
  ev_top:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".3rem" },
  chip:    { padding: ".1em .45em", borderRadius: "4px", fontSize: ".7rem", fontWeight: 600 },
  ts:      { fontSize: ".68rem", color: "#64748b" },
  evname:  { fontSize: ".78rem", color: "#c7d2fe", fontWeight: 500 },
  data:    { fontSize: ".72rem", color: "#64748b", fontFamily: "monospace", wordBreak: "break-all" as const },
  btns:    { display: "flex", gap: ".5rem" },
  btn:     { background: "#6366f1", color: "#fff", border: "none", borderRadius: "8px", padding: ".4rem .9rem", fontSize: ".8rem", cursor: "pointer", fontWeight: 600 },
  btnSm:   { background: "rgba(99,102,241,.2)", color: "#a5b4fc", border: "none", borderRadius: "6px", padding: ".3rem .6rem", fontSize: ".75rem", cursor: "pointer" },
  dot:     { width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", display: "inline-block", marginRight: ".4rem" },
  dotOff:  { width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block", marginRight: ".4rem" },
  topicF:  { display: "flex", gap: ".4rem", flexWrap: "wrap" as const, marginBottom: ".75rem" },
  fchip:   { padding: ".2em .55em", borderRadius: "6px", fontSize: ".72rem", cursor: "pointer", border: "1px solid transparent" },
};

export function EventStreamApp() {
  const [events,     setEvents]    = useState<PlatformEvent[]>([]);
  const [connected,  setConnected] = useState(false);
  const [paused,     setPaused]    = useState(false);
  const [filter,     setFilter]    = useState<string | null>(null);
  const [subCount,   setSubCount]  = useState(0);
  const esRef   = useRef<EventSource | null>(null);
  const bufRef  = useRef<PlatformEvent[]>([]);

  const connect = useCallback(() => {
    if (esRef.current) { esRef.current.close(); }
    const url = filter ? `/api/events/stream?topics=${filter}` : "/api/events/stream";
    const es = new EventSource(url, { withCredentials: true });

    es.addEventListener("connected", (e) => {
      try { const d = JSON.parse((e as MessageEvent).data as string) as { subscribers: number }; setSubCount(d.subscribers); } catch { /* skip */ }
      setConnected(true);
    });

    es.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data as string) as PlatformEvent;
        if (!paused) {
          bufRef.current = [evt, ...bufRef.current].slice(0, 200);
          setEvents([...bufRef.current]);
        }
      } catch { /* skip */ }
    };

    es.onerror = () => { setConnected(false); };
    esRef.current = es;
  }, [filter, paused]);

  useEffect(() => {
    connect();
    return () => { esRef.current?.close(); };
  }, [connect]);

  // Also fetch recent events from buffer
  useEffect(() => {
    fetch("/api/events/recent?limit=30", { credentials: "include" })
      .then(r => r.json())
      .then((d: { events?: PlatformEvent[] }) => {
        if (d.events?.length) { bufRef.current = d.events; setEvents([...d.events]); }
      }).catch(() => {});
  }, []);

  const visible = filter ? events.filter(e => e.topic === filter) : events;
  const topics  = [...new Set(events.map(e => e.topic))].sort();

  const emit = async (topic: string, event: string) => {
    await fetch("/api/events/emit", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, event, data: { source: "EventStreamApp", ts: new Date().toISOString() } }),
    }).catch(() => {});
  };

  return (
    <div style={S.root} role="main">
      <a href="#feed" style={{ position: "absolute", left: -999, top: 0 }}>Skip to event feed</a>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <div style={S.h1}>
            <span style={connected ? S.dot : S.dotOff} />
            Real-Time Event Stream
          </div>
          <div style={S.sub}>Live platform events · {visible.length} events · {subCount} subscribers</div>
        </div>
        <div style={S.btns}>
          <button style={{ ...S.btnSm, color: paused ? "#22c55e" : "#f59e0b" }}
            onClick={() => setPaused(p => !p)} aria-pressed={paused}>
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>
          <button style={S.btnSm} onClick={() => { setEvents([]); bufRef.current = []; }}>Clear</button>
          <button style={S.btn} onClick={connect}>↻ Reconnect</button>
        </div>
      </div>

      {/* Topic filter chips */}
      {topics.length > 0 && (
        <div style={S.topicF}>
          <span
            style={{ ...S.fchip, background: filter === null ? "rgba(99,102,241,.3)" : "rgba(255,255,255,.05)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.4)" }}
            onClick={() => setFilter(null)} role="button" tabIndex={0}>All topics</span>
          {topics.map(t => {
            const c = TOPIC_COLORS[t] ?? "#64748b";
            return (
              <span key={t}
                style={{ ...S.fchip, background: filter === t ? `${c}30` : "rgba(255,255,255,.04)", color: c, border: `1px solid ${filter === t ? c : "transparent"}` }}
                onClick={() => setFilter(f => f === t ? null : t)} role="button" tabIndex={0}>{t}</span>
            );
          })}
        </div>
      )}

      {/* Quick emit buttons */}
      <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.25rem", flexWrap: "wrap" as const }}>
        <button style={S.btnSm} onClick={() => emit("platform", "user_action")}>Emit Platform Event</button>
        <button style={S.btnSm} onClick={() => emit("ai", "generation_complete")}>Emit AI Event</button>
        <button style={S.btnSm} onClick={() => emit("automation", "rule_triggered")}>Emit Automation Event</button>
      </div>

      <div style={S.card}>
        <div style={S.h2}>Live Feed {paused && <span style={{ color: "#f59e0b", fontSize: ".7rem", marginLeft: ".5rem" }}>⏸ Paused</span>}</div>
        <div style={S.feed} id="feed" aria-live="polite" aria-label="Platform event feed">
          {visible.length === 0 ? (
            <div style={{ textAlign: "center", color: "#64748b", padding: "2rem", fontStyle: "italic", fontSize: ".8rem" }}>
              {connected ? "Waiting for events…" : "Connecting…"}
            </div>
          ) : visible.map(e => {
            const c = TOPIC_COLORS[e.topic] ?? "#64748b";
            return (
              <div key={e.id} style={{ ...S.evt, borderLeftColor: c }}>
                <div style={S.ev_top}>
                  <div style={{ display: "flex", gap: ".4rem", alignItems: "center" }}>
                    <span style={{ ...S.chip, background: `${c}22`, color: c }}>{e.topic}</span>
                    <span style={S.evname}>{e.event}</span>
                  </div>
                  <span style={S.ts}>{new Date(e.timestamp).toLocaleTimeString()}</span>
                </div>
                {Object.keys(e.data).filter(k => k !== "source").length > 0 && (
                  <div style={S.data}>{JSON.stringify(e.data).slice(0, 120)}{JSON.stringify(e.data).length > 120 ? "…" : ""}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
