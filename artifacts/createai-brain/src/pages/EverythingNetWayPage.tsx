/**
 * EverythingNetWay Dashboard
 * Shows live data from all three infrastructure layers:
 * electric grid nodes, mesh internet nodes, and the unified job queue.
 */

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@workspace/replit-auth-web";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ElectricNode {
  id:           number;
  node_name:    string;
  location:     string;
  capacity_kwh: number;
  status:       string;
  last_update:  string;
}

interface MeshNode {
  id:             number;
  node_name:      string;
  location:       string;
  bandwidth_mbps: number;
  status:         string;
  last_update:    string;
}

interface MeshStats {
  total: number; active: number; totalBandwidthMbps: number;
}

interface LayerStat  { layer: string; status: string; count: number; }
interface QueueTotals { pending: number; executing: number; completed: number; failed: number; }
interface MessagingStatus {
  engine: string; emailProvider: string; smsProvider: string;
  queue: { pending: number; sent: number; failed: number; total: number };
}

const BADGE: Record<string, string> = {
  active:    "bg-[#edf4ea] text-[#7a9068]",
  inactive:  "bg-slate-100 text-slate-400",
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
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="text-center py-6 text-slate-300 text-xs">
      <div className="text-2xl mb-1">{icon}</div>
      {label}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EverythingNetWayPage() {
  useAuth();

  const [electricNodes, setElectricNodes] = useState<ElectricNode[]>([]);
  const [meshNodes,     setMeshNodes]     = useState<MeshNode[]>([]);
  const [meshStats,     setMeshStats]     = useState<MeshStats | null>(null);
  const [layerStats,    setLayerStats]    = useState<LayerStat[]>([]);
  const [qTotals,       setQTotals]       = useState<QueueTotals>({ pending: 0, executing: 0, completed: 0, failed: 0 });
  const [messaging,     setMessaging]     = useState<MessagingStatus | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [working,       setWorking]       = useState(false);
  const [toast,         setToast]         = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [eRes, mRes, qRes] = await Promise.all([
        fetch("/api/electric-net-way/nodes",     { credentials: "include" }),
        fetch("/api/mesh-net-way/status",        { credentials: "include" }),
        fetch("/api/everything-net-way/status",  { credentials: "include" }),
      ]);
      if (eRes.ok) {
        const d = await eRes.json() as { ok: boolean; nodes: ElectricNode[] };
        setElectricNodes(d.nodes ?? []);
      }
      if (mRes.ok) {
        const d = await mRes.json() as { ok: boolean; nodes: MeshNode[]; stats: MeshStats };
        setMeshNodes(d.nodes ?? []);
        setMeshStats(d.stats ?? null);
      }
      if (qRes.ok) {
        const d = await qRes.json() as {
          ok: boolean; layerStats: LayerStat[]; totals: QueueTotals; messaging: MessagingStatus;
        };
        setLayerStats(d.layerStats ?? []);
        setQTotals(d.totals ?? { pending: 0, executing: 0, completed: 0, failed: 0 });
        setMessaging(d.messaging ?? null);
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
      const res  = await fetch("/api/everything-net-way/trigger", { method: "POST", credentials: "include" });
      const data = await res.json() as { ok: boolean; completed?: number; failed?: number };
      if (data.ok) showToast(`Queue processed — ${data.completed ?? 0} completed, ${data.failed ?? 0} failed`);
      await fetchAll();
    } finally {
      setWorking(false);
    }
  };

  // Build queue by-layer map
  const byLayer: Record<string, Record<string, number>> = {};
  for (const s of layerStats) {
    if (!byLayer[s.layer]) byLayer[s.layer] = {};
    byLayer[s.layer][s.status] = s.count;
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] p-6 space-y-6">

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
            Infrastructure overview — electric grid · mesh internet · messaging queue · auto-refreshes every 5s
          </p>
        </div>
        <button
          onClick={triggerQueue} disabled={working}
          className="px-4 py-2 bg-[#9CAF88] hover:bg-[#7a9068] text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
        >
          {working ? "Processing…" : "Run Queue Now"}
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading…</div>
      ) : (
        <>
          {/* ── Electric Nodes ─────────────────────────────────────────────── */}
          <section className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <h2 className="text-sm font-semibold text-slate-700">Electric Grid Nodes</h2>
              <span className="ml-auto text-xs text-slate-400">{electricNodes.length} node{electricNodes.length !== 1 ? "s" : ""}</span>
            </div>
            {electricNodes.length === 0 ? (
              <EmptyState icon="⚡" label="No electric nodes registered. Add nodes via API." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Node", "Location", "Capacity (kWh)", "Status", "Last Update"].map(h => (
                        <th key={h} className="text-left text-slate-400 font-medium px-4 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {electricNodes.map(n => (
                      <tr key={n.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-medium text-slate-700">{n.node_name}</td>
                        <td className="px-4 py-2.5 text-slate-500">{n.location || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-600">{n.capacity_kwh > 0 ? `${n.capacity_kwh} kWh` : "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${BADGE[n.status] ?? "bg-slate-100 text-slate-500"}`}>
                            {n.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-400">{fmt(n.last_update)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Mesh Nodes ─────────────────────────────────────────────────── */}
          <section className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <span className="text-lg">🌐</span>
              <h2 className="text-sm font-semibold text-slate-700">Mesh Internet Nodes</h2>
              {meshStats && (
                <span className="ml-auto text-xs text-slate-400">
                  {meshStats.active}/{meshStats.total} active · {meshStats.totalBandwidthMbps} Mbps total
                </span>
              )}
            </div>
            {meshNodes.length === 0 ? (
              <EmptyState icon="🌐" label="No mesh nodes registered. Add nodes via API." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Node", "Location", "Bandwidth", "Status", "Last Update"].map(h => (
                        <th key={h} className="text-left text-slate-400 font-medium px-4 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {meshNodes.map(n => (
                      <tr key={n.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-medium text-slate-700">{n.node_name}</td>
                        <td className="px-4 py-2.5 text-slate-500">{n.location || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-600">{n.bandwidth_mbps > 0 ? `${n.bandwidth_mbps} Mbps` : "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${BADGE[n.status] ?? "bg-slate-100 text-slate-500"}`}>
                            {n.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-400">{fmt(n.last_update)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Job Queue Totals ───────────────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Messaging Queue Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(["pending", "executing", "completed", "failed"] as const).map(s => (
                <div key={s} className="bg-white border border-slate-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-400 capitalize">{s}</p>
                  <p className={`text-2xl font-bold mt-0.5 ${STAT_COLOR[s]}`}>
                    {(qTotals as Record<string, number>)[s] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── VentonWay Messaging Sub-Status ────────────────────────────── */}
          {messaging && (
            <div className="bg-white border border-slate-100 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">✉️ VentonWay Messaging Layer</h2>
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
        </>
      )}
    </div>
  );
}
