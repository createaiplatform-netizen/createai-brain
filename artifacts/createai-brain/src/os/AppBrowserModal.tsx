import React, { useState, useEffect } from "react";
import { useOS, ALL_APPS, AppId } from "./OSContext";

const APP_CATEGORIES = [
  { key: "all",      label: "All"      },
  { key: "core",     label: "Core"     },
  { key: "business", label: "Business" },
  { key: "tools",    label: "Creative" },
  { key: "system",   label: "System"   },
];

export function AppBrowserModal({ onClose }: { onClose: () => void }) {
  const { openApp } = useOS();
  const [query, setQuery] = useState("");
  const [cat, setCat]     = useState("all");

  const filtered = ALL_APPS.filter(a => {
    const matchCat   = cat === "all" || (a.category ?? "tools") === cat;
    const matchQuery = !query
      || a.label.toLowerCase().includes(query.toLowerCase())
      || (a.description ?? "").toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQuery;
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col w-full max-w-2xl mx-auto mt-8 rounded-t-3xl sm:rounded-3xl overflow-hidden flex-1 sm:flex-none sm:max-h-[80vh] sm:mb-8"
        style={{ background: "hsl(220,20%,97%)", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="flex-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5"
            style={{ background: "#f3f4f6" }}>
            <span className="text-[15px]">🔍</span>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search all apps…"
              className="flex-1 bg-transparent outline-none text-[14px]"
              style={{ color: "#0f172a" }}
            />
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] transition-all flex-shrink-0"
            style={{ background: "rgba(0,0,0,0.06)", color: "#374151" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.10)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.06)")}
          >✕</button>
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 px-5 py-3 overflow-x-auto flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          {APP_CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCat(c.key)}
              className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={cat === c.key
                ? { background: "#6366f1", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.30)" }
                : { background: "#f3f4f6", color: "#6b7280" }}
            >{c.label}</button>
          ))}
        </div>

        {/* Count */}
        <div className="px-5 py-2 flex-shrink-0">
          <p className="text-[11px] font-medium" style={{ color: "#9ca3af" }}>
            {filtered.length} app{filtered.length !== 1 ? "s" : ""}
            {query ? ` matching "${query}"` : cat !== "all"
              ? ` in ${APP_CATEGORIES.find(c => c.key === cat)?.label}`
              : " available"}
          </p>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 overscroll-contain">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-4xl">🔍</span>
              <p className="text-[14px] font-medium" style={{ color: "#6b7280" }}>Nothing found for "{query}"</p>
              <button onClick={() => { setQuery(""); setCat("all"); }}
                className="text-[12px] font-semibold px-4 py-2 rounded-full"
                style={{ background: "#eef2ff", color: "#6366f1" }}>Clear search</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
              {filtered.map(app => (
                <button key={app.id}
                  onClick={() => { openApp(app.id as AppId); onClose(); }}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "#f8fafc";
                    (e.currentTarget as HTMLElement).style.borderColor = (app.color ?? "#6366f1") + "35";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "#fff";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.06)";
                  }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: (app.color ?? "#6366f1") + "18" }}>
                    {app.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] leading-tight truncate" style={{ color: "#0f172a" }}>{app.label}</p>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: "#9ca3af" }}>{app.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
