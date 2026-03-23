/**
 * ElectricNetWay Engine — Admin Page
 * Energy, device, internet & data job queue management.
 */

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@workspace/replit-auth-web";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryStat {
  category: string;
  status:   string;
  count:    number;
}

interface NetJob {
  id:         number;
  category:   "energy" | "device" | "internet" | "data";
  type:       string;
  target:     string;
  payload:    Record<string, unknown> | null;
  status:     "pending" | "executing" | "completed" | "failed";
  result:     string | null;
  created_at: string;
  updated_at: string;
}

const API = "/api/electric-net-way";

const CATEGORY_ICON: Record<string, string> = {
  energy:   "⚡",
  device:   "📱",
  internet: "🌐",
  data:     "📡",
};

const STATUS_COLOR: Record<string, string> = {
  completed: "text-[#7a9068] font-semibold",
  failed:    "text-red-500 font-semibold",
  executing: "text-blue-500 font-semibold",
  pending:   "text-amber-600 font-semibold",
};

const BADGE_COLOR: Record<string, string> = {
  completed: "bg-[#edf4ea] text-[#7a9068]",
  failed:    "bg-red-50 text-red-600",
  executing: "bg-blue-50 text-blue-600",
  pending:   "bg-amber-50 text-amber-700",
};

function fmt(ts: string): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ElectricNetWayPage() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState<CategoryStat[]>([]);
  const [logs,    setLogs]    = useState<NetJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [toast,   setToast]   = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      const [sRes, lRes] = await Promise.all([
        fetch(API + "/status", { credentials: "include" }),
        fetch(API + "/logs?limit=50", { credentials: "include" }),
      ]);
      if (sRes.ok) {
        const d = await sRes.json() as { ok: boolean; stats: CategoryStat[] };
        setStats(d.stats ?? []);
      }
      if (lRes.ok) {
        const d = await lRes.json() as { ok: boolean; logs: NetJob[] };
        setLogs(d.logs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const triggerQueue = async () => {
    setWorking(true);
    try {
      const res = await fetch(API + "/trigger", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json() as { ok: boolean; processed?: number; completed?: number; failed?: number };
      if (data.ok) {
        showToast(`Queue processed — ${data.completed ?? 0} completed, ${data.failed ?? 0} failed`);
        await fetchData();
      } else {
        showToast("Queue trigger failed");
      }
    } finally {
      setWorking(false);
    }
  };

  const retryJob = async (id: number) => {
    await fetch(`${API}/retry/${id}`, { method: "POST", credentials: "include" });
    showToast(`Job #${id} queued for retry`);
    await fetchData();
  };

  // Aggregate totals
  const totals = { pending: 0, executing: 0, completed: 0, failed: 0 };
  for (const s of stats) {
    if (s.status in totals) (totals as Record<string, number>)[s.status] += s.count;
  }

  // Category summaries
  const byCategory: Record<string, Record<string, number>> = {};
  for (const s of stats) {
    if (!byCategory[s.category]) byCategory[s.category] = {};
    byCategory[s.category][s.status] = s.count;
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] p-6 space-y-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#9CAF88] text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">ElectricNetWay Engine</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Unified job queue — energy, device, internet &amp; data routing
          </p>
        </div>
        <button
          onClick={triggerQueue}
          disabled={working}
          className="px-4 py-2 bg-[#9CAF88] hover:bg-[#7a9068] text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
        >
          {working ? "Processing…" : "Run Queue Now"}
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading…</div>
      ) : (
        <>
          {/* Queue summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["pending", "executing", "completed", "failed"] as const).map(s => (
              <div key={s} className="bg-white border border-slate-100 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-400 capitalize">{s}</p>
                <p className={`text-2xl font-bold mt-0.5 ${STATUS_COLOR[s]}`}>
                  {(totals as Record<string, number>)[s]}
                </p>
              </div>
            ))}
          </div>

          {/* Category cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(["energy", "device", "internet", "data"] as const).map(cat => {
              const catStats = byCategory[cat] ?? {};
              const total    = Object.values(catStats).reduce((a, b) => a + b, 0);
              return (
                <div key={cat} className="bg-white border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{CATEGORY_ICON[cat]}</span>
                    <span className="text-sm font-semibold text-slate-700 capitalize">{cat}</span>
                    <span className="ml-auto text-xs text-slate-400">{total} job{total !== 1 ? "s" : ""}</span>
                  </div>
                  {total === 0 ? (
                    <p className="text-xs text-slate-300">No jobs yet</p>
                  ) : (
                    <div className="space-y-1">
                      {Object.entries(catStats).map(([st, count]) => (
                        <div key={st} className="flex items-center justify-between">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${BADGE_COLOR[st] ?? "bg-slate-100 text-slate-500"}`}>
                            {st}
                          </span>
                          <span className="text-xs font-medium text-slate-600">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Job log table */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Recent Jobs</h2>
              <button
                onClick={fetchData}
                className="text-xs text-[#7a9068] hover:underline"
              >
                Refresh
              </button>
            </div>
            {logs.length === 0 ? (
              <p className="text-sm text-slate-400 px-5 py-6">No jobs yet. Queue is empty.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["ID", "Category", "Type", "Target", "Status", "Result", "Created", ""].map(h => (
                        <th key={h} className="text-left text-slate-400 font-medium px-4 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(job => (
                      <tr key={job.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-400">#{job.id}</td>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-1">
                            {CATEGORY_ICON[job.category]}
                            <span className="capitalize text-slate-600">{job.category}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 font-mono">{job.type}</td>
                        <td className="px-4 py-2.5 text-slate-600 max-w-[120px] truncate">{job.target}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${BADGE_COLOR[job.status] ?? "bg-slate-100 text-slate-500"}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 max-w-[180px] truncate">
                          {job.result ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400">{fmt(job.created_at)}</td>
                        <td className="px-4 py-2.5">
                          {job.status === "failed" && (
                            <button
                              onClick={() => retryJob(job.id)}
                              className="text-[10px] text-[#7a9068] hover:underline"
                            >
                              Retry
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
