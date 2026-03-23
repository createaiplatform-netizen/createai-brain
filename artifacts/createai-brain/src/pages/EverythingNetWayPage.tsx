/**
 * EverythingNetWay Engine — Admin Dashboard
 * Unified platform-layer queue: electricity, internet, mobile, messaging, compute, sensor.
 */

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@workspace/replit-auth-web";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LayerStat {
  layer:  string;
  status: string;
  count:  number;
}

interface Totals {
  pending:   number;
  executing: number;
  completed: number;
  failed:    number;
}

interface MessagingStatus {
  engine:        string;
  emailProvider: string;
  smsProvider:   string;
  queue:         { pending: number; sent: number; failed: number; total: number };
}

interface ENWJob {
  id:         number;
  type:       string;
  layer:      string;
  payload:    Record<string, unknown> | null;
  status:     "pending" | "executing" | "completed" | "failed";
  result:     string | null;
  created_at: string;
}

const API = "/api/everything-net-way";

const LAYER_ICON: Record<string, string> = {
  electricity: "⚡",
  internet:    "🌐",
  mobile:      "📱",
  messaging:   "✉️",
  compute:     "💻",
  sensor:      "📡",
};

const BADGE: Record<string, string> = {
  completed: "bg-[#edf4ea] text-[#7a9068]",
  failed:    "bg-red-50 text-red-600",
  executing: "bg-blue-50 text-blue-600",
  pending:   "bg-amber-50 text-amber-700",
};

const STAT_COLOR: Record<string, string> = {
  completed: "text-[#7a9068]",
  failed:    "text-red-500",
  executing: "text-blue-500",
  pending:   "text-amber-600",
};

function fmt(ts: string): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EverythingNetWayPage() {
  const { user } = useAuth();

  const [layerStats, setLayerStats] = useState<LayerStat[]>([]);
  const [totals,     setTotals]     = useState<Totals>({ pending: 0, executing: 0, completed: 0, failed: 0 });
  const [messaging,  setMessaging]  = useState<MessagingStatus | null>(null);
  const [logs,       setLogs]       = useState<ENWJob[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [working,    setWorking]    = useState(false);
  const [toast,      setToast]      = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, lRes] = await Promise.all([
        fetch(API + "/status", { credentials: "include" }),
        fetch(API + "/logs?limit=50", { credentials: "include" }),
      ]);
      if (sRes.ok) {
        const d = await sRes.json() as {
          ok: boolean;
          layerStats: LayerStat[];
          totals: Totals;
          messaging: MessagingStatus;
        };
        setLayerStats(d.layerStats ?? []);
        setTotals(d.totals ?? { pending: 0, executing: 0, completed: 0, failed: 0 });
        setMessaging(d.messaging ?? null);
      }
      if (lRes.ok) {
        const d = await lRes.json() as { ok: boolean; logs: ENWJob[] };
        setLogs(d.logs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
    const id = setInterval(() => { void fetchAll(); }, 5000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const triggerQueue = async () => {
    setWorking(true);
    try {
      const res  = await fetch(API + "/trigger", { method: "POST", credentials: "include" });
      const data = await res.json() as { ok: boolean; completed?: number; failed?: number };
      if (data.ok) {
        showToast(`Queue processed — ${data.completed ?? 0} completed, ${data.failed ?? 0} failed`);
        await fetchAll();
      }
    } finally {
      setWorking(false);
    }
  };

  const retryJob = async (id: number) => {
    await fetch(`${API}/retry/${id}`, { method: "POST", credentials: "include" });
    showToast(`Job #${id} queued for retry`);
    await fetchAll();
  };

  // Group layer stats by layer
  const byLayer: Record<string, Record<string, number>> = {};
  for (const s of layerStats) {
    if (!byLayer[s.layer]) byLayer[s.layer] = {};
    byLayer[s.layer][s.status] = s.count;
  }
  const layers = ["electricity", "internet", "mobile", "messaging", "compute", "sensor"] as const;

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
          <h1 className="text-xl font-bold text-slate-800">EverythingNetWay Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Unified platform queue — electricity · internet · mobile · messaging · compute · sensor
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
          {/* Queue totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["pending", "executing", "completed", "failed"] as const).map(s => (
              <div key={s} className="bg-white border border-slate-100 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-400 capitalize">{s}</p>
                <p className={`text-2xl font-bold mt-0.5 ${STAT_COLOR[s]}`}>
                  {(totals as Record<string, number>)[s] ?? 0}
                </p>
              </div>
            ))}
          </div>

          {/* Layer cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {layers.map(layer => {
              const stats = byLayer[layer] ?? {};
              const total = Object.values(stats).reduce((a, b) => a + b, 0);
              return (
                <div key={layer} className="bg-white border border-slate-100 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span>{LAYER_ICON[layer]}</span>
                    <span className="text-xs font-semibold text-slate-700 capitalize">{layer}</span>
                  </div>
                  {total === 0 ? (
                    <p className="text-[10px] text-slate-300">No jobs</p>
                  ) : (
                    <div className="space-y-1">
                      {Object.entries(stats).map(([st, count]) => (
                        <div key={st} className="flex justify-between items-center">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${BADGE[st] ?? "bg-slate-100 text-slate-500"}`}>
                            {st}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* VentonWay messaging sub-status */}
          {messaging && (
            <div className="bg-white border border-slate-100 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">VentonWay Messaging Layer</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-slate-400">Engine</p>
                  <p className={`font-semibold mt-0.5 ${messaging.engine === "online" ? "text-[#7a9068]" : "text-red-500"}`}>
                    {messaging.engine}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Email</p>
                  <p className={`font-semibold mt-0.5 ${messaging.emailProvider === "configured" ? "text-[#7a9068]" : "text-amber-600"}`}>
                    {messaging.emailProvider}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">SMS</p>
                  <p className={`font-semibold mt-0.5 ${messaging.smsProvider === "configured" ? "text-[#7a9068]" : "text-amber-600"}`}>
                    {messaging.smsProvider}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Queue</p>
                  <p className="font-semibold mt-0.5 text-slate-700">
                    {messaging.queue.pending} pending · {messaging.queue.sent} sent
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Job log */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Recent Jobs</h2>
              <span className="text-[10px] text-slate-400">Auto-refreshes every 5s</span>
            </div>
            {logs.length === 0 ? (
              <p className="text-sm text-slate-400 px-5 py-6">No jobs yet. Queue is empty.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["ID", "Layer", "Type", "Status", "Result", "Created", ""].map(h => (
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
                            <span>{LAYER_ICON[job.layer] ?? "•"}</span>
                            <span className="capitalize text-slate-600">{job.layer}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-600">{job.type}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${BADGE[job.status] ?? "bg-slate-100 text-slate-500"}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 max-w-[200px] truncate">{job.result ?? "—"}</td>
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
