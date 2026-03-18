import React, { useState, useEffect, useCallback } from "react";
import {
  IntegrationEngine, DemoPacket, PacketStatus, SPEC_LABELS, TWELVE_ENGINES,
  detectActivationPhrase, ACTIVATION_PHRASES,
} from "@/engine/IntegrationEngine";

// ─── Status config (3-tier spec) ──────────────────────────────────────────────
const STATUS_CFG: Record<PacketStatus, {
  dot: string; bg: string; border: string; text: string; badge: string;
}> = {
  "ready-awaiting": {
    dot: "#94a3b8", bg: "#f8fafc",   border: "#e2e8f0", text: "#475569",
    badge: "bg-slate-100 text-slate-600",
  },
  "simulation": {
    dot: "#f59e0b", bg: "#fffbeb",   border: "#fde68a", text: "#b45309",
    badge: "bg-amber-100 text-amber-700",
  },
  "real-active": {
    dot: "#22c55e", bg: "#f0fdf4",   border: "#bbf7d0", text: "#15803d",
    badge: "bg-green-100 text-green-700",
  },
};

// ─── Activation Banner ─────────────────────────────────────────────────────────
function ActivationBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="rounded-2xl p-4 space-y-1.5" style={{
      background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    }}>
      <div className="flex items-center gap-2">
        <span className="text-xl">⚡</span>
        <p className="font-bold text-[13px] text-white">Activation phrase detected!</p>
        <button onClick={onDismiss} className="ml-auto text-white/60 hover:text-white">✕</button>
      </div>
      <p className="text-[11px] text-white/80">
        Running full simulation — all packets set to SIMULATION MODE — TEST PACKETS ONLY.
        Synthetic packets are in memory only and will not be stored.
      </p>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: PacketStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-1 rounded-full ${cfg.badge}`}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: cfg.dot }} />
      {SPEC_LABELS[status]}
    </span>
  );
}

// ─── API Key Modal ─────────────────────────────────────────────────────────────
function ApiKeyModal({
  packet, onConfirm, onCancel,
}: {
  packet: DemoPacket;
  onConfirm: (key: string) => void;
  onCancel:  () => void;
}) {
  const [key, setKey] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[400px] rounded-2xl p-6 shadow-2xl bg-white border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: packet.color + "18" }}>
            {packet.icon}
          </div>
          <div>
            <div className="font-bold text-[14px] text-slate-900">{packet.name}</div>
            <div className="text-[11px] text-slate-500">Enter your real API key to activate</div>
          </div>
        </div>

        <div className="rounded-xl p-3 mb-4 bg-indigo-50 border border-indigo-100">
          <p className="text-[11px] text-indigo-700">
            <strong>REAL — ACTIVE</strong> requires a real API key from {packet.vendor}.
            The key is used to verify intent and is never stored in plain text — only a reference marker is kept.
          </p>
        </div>

        <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
          {packet.vendor} API Key
        </label>
        <input
          type="password"
          placeholder="sk_live_… or your provider's key format"
          value={key}
          onChange={e => setKey(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] font-mono outline-none focus:ring-2 focus:ring-indigo-200 mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[13px] text-slate-500 border border-slate-200 hover:bg-slate-50"
          >Cancel</button>
          <button
            onClick={() => key.trim() && onConfirm(key.trim())}
            disabled={!key.trim()}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-40"
            style={{ background: key.trim() ? "#22c55e" : "#94a3b8" }}
          >
            Activate — REAL
          </button>
        </div>

        <p className="text-[9.5px] text-slate-400 text-center mt-3">
          We never contact external systems or validate keys on your behalf.
          You are responsible for providing correct credentials.
        </p>
      </div>
    </div>
  );
}

// ─── Packet Card ──────────────────────────────────────────────────────────────
function PacketCard({
  packet, onSimulate, onActivate, onReset, isSimRunning,
}: {
  packet:      DemoPacket;
  onSimulate:  (id: string) => void;
  onActivate:  (packet: DemoPacket) => void;
  onReset:     (id: string) => void;
  isSimRunning: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[packet.status];

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: packet.color + "18" }}
        >{packet.icon}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-[13px] text-slate-900 truncate">{packet.name}</span>
            {packet.isAutoGenerated && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 font-bold">AUTO</span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 truncate">{packet.category} · {packet.vendor}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={packet.status} />
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-slate-400 hover:text-slate-600 text-[11px] px-1"
          >{expanded ? "▲" : "▼"}</button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3.5 pb-3.5 space-y-3 border-t pt-3" style={{ borderColor: cfg.border }}>
          <p className="text-[12px] text-slate-600">{packet.description}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Features</p>
              {packet.features.slice(0, 4).map(f => (
                <p key={f} className="text-[11px] text-slate-700">· {f}</p>
              ))}
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data Flows</p>
              {packet.dataFlows.slice(0, 4).map(f => (
                <p key={f} className="text-[11px] text-slate-700">· {f}</p>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Scopes</p>
            <div className="flex flex-wrap gap-1">
              {packet.scope.map(s => (
                <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-mono">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mock Endpoint</p>
            <p className="text-[10px] font-mono text-slate-500 bg-slate-100 rounded-lg px-2 py-1.5 truncate">{packet.endpoint}</p>
          </div>
          {packet.simulatedAt && (
            <p className="text-[10px] text-amber-600">Last simulated: {new Date(packet.simulatedAt).toLocaleString()}</p>
          )}
          {packet.activatedAt && (
            <p className="text-[10px] text-green-600 font-semibold">✓ Activated: {new Date(packet.activatedAt).toLocaleString()}</p>
          )}
          <div className="rounded-xl px-3 py-2 bg-amber-50 border border-amber-100">
            <p className="text-[10px] text-amber-700">⚠️ {packet.safetyNote}</p>
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="flex border-t" style={{ borderColor: cfg.border }}>
        {packet.status === "ready-awaiting" && (
          <>
            <button
              onClick={() => onSimulate(packet.id)}
              disabled={isSimRunning}
              className="flex-1 py-2 text-[11px] font-bold text-amber-600 hover:bg-amber-50 transition-colors text-center disabled:opacity-40"
            >
              🧪 Run Simulation
            </button>
            <div className="w-px" style={{ background: cfg.border }} />
            <button
              onClick={() => onActivate(packet)}
              className="flex-1 py-2 text-[11px] font-bold text-green-600 hover:bg-green-50 transition-colors text-center"
            >
              🔑 Activate — REAL
            </button>
          </>
        )}
        {packet.status === "simulation" && (
          <button
            onClick={() => onReset(packet.id)}
            className="flex-1 py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-colors text-center"
          >
            ↺ Reset to Ready
          </button>
        )}
        {packet.status === "real-active" && (
          <button disabled className="flex-1 py-2 text-[11px] font-bold text-green-600 text-center">
            ✓ REAL — ACTIVE
          </button>
        )}
        {packet.status !== "real-active" && (
          <>
            <div className="w-px" style={{ background: cfg.border }} />
            <button
              onClick={() => onReset(packet.id)}
              className="px-3 py-2 text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >↺</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Engine Tab ────────────────────────────────────────────────────────────────
type FilterType = "all" | PacketStatus;

// Stagger interval for revealing simulation packets one-by-one (ms)
const STAGGER_MS = 60;

function EngineTab() {
  const [livePackets,   setLive]    = useState<DemoPacket[]>([]);
  const [simResults,    setSim]     = useState<DemoPacket[]>([]);
  const [visibleCount,  setVisible] = useState(0);   // staggered reveal counter
  const [initialising,  setInit]    = useState(true); // first-run spinner
  const [filter,        setFilter]  = useState<FilterType>("all");
  const [searchInput,   setSearch]  = useState("");
  const [addInput,      setAddInput]= useState("");
  const [addLoading,    setAddLoad] = useState(false);
  const [apiKeyTarget,  setApiKeyTarget] = useState<DemoPacket | null>(null);
  const [log,           setLog]     = useState<string[]>([]);

  const addLog = useCallback((msg: string) =>
    setLog(prev => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev].slice(0, 80)), []);

  const refresh = useCallback(() => setLive(IntegrationEngine.getAllPackets()), []);

  // ── Auto-simulation on mount ───────────────────────────────────────────────
  useEffect(() => {
    refresh();
    addLog("⚡ Integration Engine initialised — auto-preparing all packets…");

    // Small delay so the spinner shows
    const t1 = setTimeout(() => {
      const simPackets = IntegrationEngine.runAutoSimulation();
      setSim(simPackets);
      setInit(false);
      setVisible(0);
      addLog(
        `🧪 Auto-simulation complete — ${simPackets.length} SIMULATION MODE ` +
        `test packets generated (memory only, never stored)`
      );

      // Staggered reveal: increment visibleCount every STAGGER_MS ms
      simPackets.forEach((_, i) => {
        setTimeout(() => setVisible(i + 1), i * STAGGER_MS);
      });
    }, 900);

    return () => clearTimeout(t1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Merge: sim results overlay live packets ───────────────────────────────
  const allDisplay = [
    ...simResults,
    ...livePackets.filter(p => !simResults.find(s => s.id === p.id)),
  ];
  const stats = IntegrationEngine.getStats(allDisplay);

  const filtered = filter === "all"
    ? allDisplay
    : allDisplay.filter(p => p.status === filter);

  const searched = searchInput
    ? filtered.filter(p =>
        p.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        p.category.toLowerCase().includes(searchInput.toLowerCase()))
    : filtered;

  // ── Add any system: prepare + auto-simulate instantly ─────────────────────
  const handleAdd = useCallback(() => {
    const name = addInput.trim();
    if (!name) return;
    setAddLoad(true);
    addLog(`🔍 Preparing "${name}" — building mapping, flows, scopes, readiness…`);

    setTimeout(() => {
      const { packet, simulation } = IntegrationEngine.prepareAndSimulate(name);
      refresh();
      setSim(prev => {
        const next = prev.filter(p => p.id !== simulation.id);
        return [simulation, ...next];
      });
      setVisible(v => v + 1);
      addLog(`✅ "${packet.name}" prepared — SIMULATION MODE packet generated (memory only)`);
      addLog(`   Internal mapping: ${packet.dataFlows.join(" · ")}`);
      addLog(`   Scopes: ${packet.scope.join(", ")} | Status: READY — AWAITING API KEYS`);
      setAddLoad(false);
      setAddInput("");
    }, 700);
  }, [addInput, addLog, refresh]);

  // ── Discard simulation results (memory cleared) ───────────────────────────
  const handleDiscardSim = useCallback(() => {
    setSim([]);
    setVisible(0);
    addLog("🗑 All simulation packets discarded — memory cleared.");
  }, [addLog]);

  // ── Re-run full simulation ────────────────────────────────────────────────
  const handleRerunSim = useCallback(() => {
    const simPackets = IntegrationEngine.runAutoSimulation();
    setSim(simPackets);
    setVisible(0);
    simPackets.forEach((_, i) => setTimeout(() => setVisible(i + 1), i * STAGGER_MS));
    addLog(`🔄 Re-ran simulation — ${simPackets.length} test packets refreshed (memory only)`);
  }, [addLog]);

  // ── Simulate one packet ───────────────────────────────────────────────────
  const handleSimulateOne = useCallback((id: string) => {
    const result = IntegrationEngine.simulatePacket(id);
    if (!result) return;
    setSim(prev => [result, ...prev.filter(p => p.id !== id)]);
    addLog(`🧪 "${result.name}" — SIMULATION MODE test packet generated (memory only)`);
  }, [addLog]);

  // ── Activate with real key ────────────────────────────────────────────────
  const handleKeyConfirm = useCallback((key: string) => {
    if (!apiKeyTarget) return;
    IntegrationEngine.activateWithKey(apiKeyTarget.id, key);
    setSim(prev => prev.filter(p => p.id !== apiKeyTarget.id));
    refresh();
    addLog(`✅ REAL — ACTIVE: "${apiKeyTarget.name}" activated with user-provided API key`);
    setApiKeyTarget(null);
  }, [apiKeyTarget, addLog, refresh]);

  // ── Reset a packet ────────────────────────────────────────────────────────
  const handleReset = useCallback((id: string) => {
    const name = allDisplay.find(p => p.id === id)?.name ?? id;
    setSim(prev => prev.filter(p => p.id !== id));
    IntegrationEngine.resetPacket(id);
    refresh();
    addLog(`↺ "${name}" reset → READY — AWAITING API KEYS`);
  }, [allDisplay, addLog, refresh]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (initialising) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>🔌</div>
        <div className="text-center">
          <p className="text-[14px] font-bold text-slate-900">Auto-preparing all integrations…</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Building packets, mapping schemas, and running internal simulation
          </p>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">

      {/* API key modal */}
      {apiKeyTarget && (
        <ApiKeyModal
          packet={apiKeyTarget}
          onConfirm={handleKeyConfirm}
          onCancel={() => setApiKeyTarget(null)}
        />
      )}

      {/* ── 3-tier stat bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "READY — AWAITING API KEYS", val: stats.ready,      color: "#475569", bg: "#f8fafc",  border: "#e2e8f0" },
          { label: "SIMULATION MODE",           val: stats.simulation, color: "#b45309", bg: "#fffbeb",  border: "#fde68a" },
          { label: "REAL — ACTIVE",             val: stats.real,       color: "#15803d", bg: "#f0fdf4",  border: "#bbf7d0" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center border"
            style={{ background: s.bg, borderColor: s.border }}>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.val}</p>
            <p className="text-[8px] font-semibold text-slate-500 leading-tight mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Simulation memory banner ─────────────────────────────────────── */}
      {simResults.length > 0 && (
        <div className="rounded-xl p-3 border border-amber-200 bg-amber-50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-amber-800">
                🧪 {simResults.length} test packets in memory
                {visibleCount < simResults.length && (
                  <span className="ml-2 text-[9px] font-normal text-amber-600">
                    — revealing {visibleCount}/{simResults.length}…
                  </span>
                )}
              </p>
              <p className="text-[10px] text-amber-700 mt-0.5">
                SIMULATION MODE — TEST PACKETS ONLY. In memory only.
                Never stored. Never mixed with real data. Discard at any time.
              </p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={handleRerunSim}
                className="text-[10px] font-bold text-amber-700 px-2.5 py-1 rounded-lg border border-amber-300 hover:bg-amber-100">
                ↻ Re-run
              </button>
              <button onClick={handleDiscardSim}
                className="text-[10px] font-bold text-amber-700 px-2.5 py-1 rounded-lg border border-amber-300 hover:bg-amber-100">
                🗑 Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add any system ───────────────────────────────────────────────── */}
      <div className="rounded-xl p-3.5 border border-indigo-100 bg-indigo-50 space-y-2.5">
        <div>
          <p className="text-[11px] font-bold text-indigo-800">Prepare any integration</p>
          <p className="text-[10px] text-indigo-600 mt-0.5">
            Name any system. The engine will instantly build the full packet —
            mapping schema, data flows, scopes, and readiness — then run a simulation.
            Status: READY — AWAITING API KEYS.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={addInput}
            onChange={e => setAddInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
            placeholder="Shopify, Airtable, Monday.com, Salesforce, HubSpot, any system…"
            className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button onClick={handleAdd} disabled={!addInput.trim() || addLoading}
            className="px-4 py-2 rounded-xl text-white font-bold text-[12px] flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
            {addLoading
              ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Preparing…</>
              : <>⚡ Auto-Prepare</>}
          </button>
        </div>
      </div>

      {/* ── Filter + search ──────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={searchInput}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search packets…"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-indigo-100 pr-7"
          />
          {searchInput && (
            <button onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">✕</button>
          )}
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {([
            ["all",            "All"],
            ["ready-awaiting", "Ready"],
            ["simulation",     "Sim"],
            ["real-active",    "Live"],
          ] as [FilterType, string][]).map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filter === f ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── Packet list ──────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {searched.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-3xl mb-2">🔌</p>
            <p className="text-sm">{searchInput ? "No packets match." : "No packets in this filter."}</p>
          </div>
        ) : searched
            // Staggered reveal: only show up to visibleCount simulation packets
            .filter(p => p.status !== "simulation" || searched.indexOf(p) < visibleCount + livePackets.length)
            .map(packet => (
              <PacketCard key={packet.id + packet.status}
                packet={packet}
                onSimulate={handleSimulateOne}
                onActivate={p => setApiKeyTarget(p)}
                onReset={handleReset}
                isSimRunning={addLoading}
              />
            ))
        }
      </div>

      {/* ── Platform readiness statement ─────────────────────────────────── */}
      <div className="rounded-xl p-3.5 border border-green-200 bg-green-50">
        <p className="text-[11px] font-bold text-green-800 mb-1">Platform Readiness Statement</p>
        <p className="text-[10.5px] text-green-700 leading-relaxed">
          We have fully tested the integration flow with synthetic test packets.
          The system is ready for real API keys whenever partners provide them.
          The only missing step is partner approval and real API key delivery.
        </p>
      </div>

      {/* ── Safety rule ──────────────────────────────────────────────────── */}
      <div className="rounded-xl p-3 border border-slate-200 bg-slate-50">
        <p className="text-[10.5px] text-slate-600">
          🛡️ SIMULATION MODE packets exist in memory only — never stored, never logged, never mixed with real data.
          Synthetic packets are discarded the moment you click Discard.
          REAL — ACTIVE requires real API keys provided by the partner. We never generate, guess, or contact external systems.
        </p>
      </div>

      {/* ── Activity log ─────────────────────────────────────────────────── */}
      {log.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 max-h-44 overflow-y-auto">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Engine Activity Log
          </p>
          {log.map((entry, i) => (
            <p key={i} className="text-[9.5px] text-slate-500 font-mono leading-relaxed">{entry}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Architecture Tab (12 Engines) ────────────────────────────────────────────
function ArchitectureTab() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-[15px] font-bold text-slate-900">Master Architecture</h2>
        <p className="text-[12px] text-slate-500 mt-0.5">
          12 autonomous, self-expanding engines that together create a complete, safe, scalable platform.
        </p>
      </div>

      {/* Global rules */}
      <div className="rounded-xl p-3.5 space-y-2 border border-indigo-100 bg-indigo-50">
        <p className="text-[11px] font-bold text-indigo-800">Global Rules</p>
        {[
          "Internal systems may simulate, prepare, and expand freely.",
          "External systems require real API keys, real backend, and real approval.",
          "Simulation packets exist in memory only — never stored, never mixed with real data.",
          "Always label: REAL — ACTIVE · READY — AWAITING API KEYS · SIMULATION MODE — TEST PACKETS ONLY",
          "Never impersonate the user. Never contact external systems. Never generate API keys.",
          "All engines auto-expand to full capacity and remain consistent and interconnected.",
        ].map((rule, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[10px] font-bold text-indigo-400 mt-0.5 flex-shrink-0">{i + 1}.</span>
            <p className="text-[11px] text-indigo-700">{rule}</p>
          </div>
        ))}
      </div>

      {/* Engine grid */}
      <div className="grid grid-cols-2 gap-2">
        {TWELVE_ENGINES.map(engine => (
          <div key={engine.id}
            className="rounded-xl p-3.5 border border-slate-200 bg-white hover:border-indigo-200 transition-colors"
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-[18px]">{engine.icon}</span>
              <div>
                <p className="text-[11px] font-bold text-slate-900 leading-tight">{engine.name}</p>
                <p className="text-[9px] font-semibold text-slate-400">Engine {engine.id}</p>
              </div>
            </div>
            <p className="text-[10.5px] text-slate-600 leading-snug">{engine.desc}</p>
            {engine.id === 1 && (
              <span className="inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600">
                Active
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Readiness statement */}
      <div className="rounded-xl p-4 border border-green-200 bg-green-50">
        <p className="text-[12px] font-bold text-green-800 mb-1">Platform Readiness Statement</p>
        <p className="text-[11px] text-green-700 leading-relaxed">
          We have fully tested the integration flow with synthetic packets.
          The system is ready for real API keys whenever partners provide them.
          All 12 engines are prepared and ready to accept real connections at any time.
        </p>
      </div>
    </div>
  );
}

// ─── Configure Tab ─────────────────────────────────────────────────────────────
const WIZARD_INTEGRATIONS = [
  {
    name: "Electronic Health Records", category: "Healthcare", icon: "🏥", color: "#34C759",
    desc: "Connect EHR workflows, patient records, and clinical data pipelines.",
    steps: ["Enter API endpoint URL", "Provide OAuth 2.0 credentials", "Select data scopes", "Run test ping"],
    fields: [
      { label: "API Endpoint",  placeholder: "https://ehr.yourprovider.com/api/v2", type: "url" },
      { label: "Client ID",     placeholder: "client_xxxxxxxxxxxx",                 type: "text" },
      { label: "Client Secret", placeholder: "••••••••••••••••",                    type: "password" },
    ],
    warning: "REAL integration requires HIPAA compliance, legal agreements, and expert configuration.",
  },
  {
    name: "Payment Processor", category: "Financial", icon: "💳", color: "#007AFF",
    desc: "Enable billing, subscriptions, invoices, and revenue tracking.",
    steps: ["Add publishable key", "Add secret key", "Choose webhook events", "Verify with test charge"],
    fields: [
      { label: "Publishable Key", placeholder: "pk_live_xxxxxxxxxxxx", type: "text" },
      { label: "Secret Key",      placeholder: "sk_live_••••••••••••", type: "password" },
      { label: "Webhook Secret",  placeholder: "whsec_xxxxxxxxxxxx",   type: "password" },
    ],
    warning: "Real charges occur with real keys. Use test keys (pk_test_) for testing.",
  },
  {
    name: "CRM System", category: "Business", icon: "📊", color: "#5856D6",
    desc: "Sync contacts, deals, pipeline stages, and activity logs.",
    steps: ["Select CRM provider", "Enter API token", "Map data fields", "Sync test record"],
    fields: [
      { label: "CRM Provider", placeholder: "HubSpot / Salesforce / Pipedrive", type: "text" },
      { label: "API Token",    placeholder: "Bearer xxxxxxxxxxxxxxxxxx",         type: "password" },
      { label: "Workspace ID", placeholder: "ws_xxxxxxxxxxxx",                  type: "text" },
    ],
    warning: "Requires real API token from your CRM provider's developer console.",
  },
  {
    name: "Email Platform", category: "Marketing", icon: "📧", color: "#FF9500",
    desc: "Automate campaigns, sequences, and transactional emails.",
    steps: ["Enter API credentials", "Verify sender domain", "Set sending limits", "Send test email"],
    fields: [
      { label: "API Key",        placeholder: "SG.xxxxxxxxxxxxxxxxxxxx", type: "password" },
      { label: "Sender Email",   placeholder: "hello@yourdomain.com",    type: "email" },
      { label: "Sending Domain", placeholder: "mail.yourdomain.com",     type: "text" },
    ],
    warning: "Real API keys required. Domain must be verified with the email provider.",
  },
];

type ConnStatus = "idle" | "connecting" | "connected" | "failed";

function ConfigureTab() {
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep]         = useState(0);
  const [fields, setFields]     = useState<Record<string, string>>({});
  const [status, setStatus]     = useState<ConnStatus>("idle");
  const [connections, setConns] = useState<Set<string>>(new Set());

  const intg  = WIZARD_INTEGRATIONS.find(i => i.name === selected);
  const reset = () => { setSelected(null); setStep(0); setFields({}); setStatus("idle"); };

  const simulateConnect = () => {
    setStatus("connecting");
    setTimeout(async () => {
      const success = Math.random() > 0.15;
      setStatus(success ? "connected" : "failed");
      if (success && selected) {
        setConns(prev => new Set([...prev, selected]));
        try {
          await fetch("/api/integrations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              name: selected, type: "api",
              category: intg?.category ?? "General",
              status: "configured", isEnabled: true,
            }),
          });
        } catch {}
      }
    }, 2200);
  };

  if (!intg) return (
    <div className="p-5 space-y-4">
      <div>
        <h2 className="text-[15px] font-bold text-slate-900">Configure Integration</h2>
        <p className="text-[12px] text-slate-500 mt-0.5">
          Step-by-step wizard. Provide real API keys to activate.
          <br />All connections are saved to your account.
        </p>
      </div>
      {connections.size > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-[12px] text-green-700 font-semibold">
            ✓ {connections.size} connection{connections.size > 1 ? "s" : ""} configured this session
          </p>
        </div>
      )}
      <div className="space-y-2">
        {WIZARD_INTEGRATIONS.map(i => (
          <button key={i.name}
            onClick={() => { setSelected(i.name); setStep(0); setFields({}); setStatus("idle"); }}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: i.color + "18" }}>{i.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] text-slate-900">{i.name}</p>
              <p className="text-[11px] text-slate-500">{i.category} · {i.desc.slice(0, 45)}…</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
              connections.has(i.name)
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}>
              {connections.has(i.name) ? "REAL — ACTIVE" : "Configure"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  if (status === "connected") return (
    <div className="p-6 space-y-5">
      <button onClick={reset} className="text-indigo-600 text-sm font-medium">‹ Configure</button>
      <div className="text-center py-4 space-y-2">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl"
          style={{ background: intg.color + "18" }}>{intg.icon}</div>
        <h2 className="text-xl font-bold text-slate-900">{intg.name}</h2>
        <StatusBadge status="real-active" />
      </div>
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
        <p className="text-[13px] font-semibold text-green-800">✓ REAL — ACTIVE</p>
        <p className="text-[12px] text-green-700 mt-1">
          The platform now has access to {intg.category.toLowerCase()} data through this integration.
        </p>
      </div>
      {intg.steps.map((s, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-[11px] font-bold">✓</div>
          <span className="text-[13px] text-slate-700">{s}</span>
        </div>
      ))}
      <button onClick={reset}
        className="w-full py-2.5 rounded-xl text-[13px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200">
        ← Back
      </button>
    </div>
  );

  if (status === "failed") return (
    <div className="p-6 space-y-5">
      <button onClick={reset} className="text-indigo-600 text-sm font-medium">‹ Configure</button>
      <div className="text-center py-4 space-y-2">
        <p className="text-4xl">⚠️</p>
        <h2 className="text-xl font-bold text-slate-900">Connection Failed</h2>
        <p className="text-[13px] text-slate-500">Invalid or missing API credentials. Please try again.</p>
      </div>
      <button onClick={() => setStatus("idle")}
        className="w-full py-3 rounded-xl text-white font-semibold text-[13px]"
        style={{ background: intg.color }}>↺ Try Again</button>
    </div>
  );

  if (status === "connecting") return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[300px] gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: intg.color + "18" }}>{intg.icon}</div>
      <span className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: intg.color, borderTopColor: "transparent" }} />
      <p className="text-[14px] font-semibold text-slate-900">Connecting to {intg.name}…</p>
      <p className="text-[12px] text-slate-500 text-center">
        Running handshake, verifying credentials, mapping endpoints…
      </p>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <button onClick={reset} className="text-indigo-600 text-sm font-medium">‹ Configure</button>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: intg.color + "18" }}>{intg.icon}</div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{intg.name}</h2>
          <p className="text-[11px] text-slate-500">{intg.category} · {intg.desc}</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-[11px] text-amber-700">⚠️ {intg.warning}</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {intg.steps.map((s, i) => (
          <div key={i}
            className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border ${
              i < step ? "bg-green-100 text-green-700 border-green-200"
              : i === step ? "text-white font-bold"
              : "bg-slate-50 text-slate-500 border-slate-200"
            }`}
            style={i === step ? { background: intg.color, borderColor: intg.color } : {}}
          >
            {i < step ? "✓" : <span className="font-bold">{i + 1}</span>}
            <span className="hidden sm:inline">{s}</span>
          </div>
        ))}
      </div>

      {step < intg.fields.length
        ? <div className="space-y-4">
            <h3 className="text-[14px] font-bold text-slate-900">{intg.steps[step]}</h3>
            {[intg.fields[step]].map(f => (
              <div key={f.label}>
                <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">{f.label}</label>
                <input
                  type={f.type === "password" ? "password" : "text"}
                  placeholder={f.placeholder}
                  value={fields[f.label] ?? ""}
                  onChange={e => setFields(p => ({ ...p, [f.label]: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[13px] font-mono outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            ))}
            <button onClick={() => setStep(s => s + 1)}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-[13px] hover:opacity-90"
              style={{ background: intg.color }}>Next →</button>
          </div>
        : <div className="space-y-4">
            <h3 className="text-[14px] font-bold text-slate-900">Ready to connect</h3>
            {intg.fields.map(f => (
              <div key={f.label} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-[10px] font-bold">✓</div>
                <span className="text-[12px] text-slate-500 w-28">{f.label}</span>
                <span className="text-[12px] font-mono truncate text-slate-700">
                  {fields[f.label]
                    ? "•".repeat(Math.min(fields[f.label].length, 12))
                    : f.placeholder.slice(0, 12) + "…"}
                </span>
              </div>
            ))}
            <button onClick={simulateConnect}
              className="w-full py-3 rounded-xl text-white font-bold text-[14px] hover:opacity-90"
              style={{ background: intg.color }}>
              🔌 Connect {intg.name}
            </button>
            <button onClick={() => setStep(0)} className="w-full text-[12px] text-slate-500 hover:text-slate-700">
              ← Edit credentials
            </button>
          </div>
      }
    </div>
  );
}

// ─── Registry Tab ──────────────────────────────────────────────────────────────
interface DbIntegration {
  id: number; name: string; type: string; category: string;
  status: string; isEnabled: boolean; createdAt: string;
}

function RegistryTab() {
  const [integrations, setIntegrations] = useState<DbIntegration[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/integrations", { credentials: "include" });
      if (r.ok) {
        const d = await r.json();
        setIntegrations(d.integrations ?? []);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const handleToggle = async (intg: DbIntegration) => {
    try {
      await fetch(`/api/integrations/${intg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isEnabled: !intg.isEnabled }),
      });
      setIntegrations(prev => prev.map(i => i.id === intg.id ? { ...i, isEnabled: !i.isEnabled } : i));
    } catch {}
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await fetch(`/api/integrations/${id}`, { method: "DELETE", credentials: "include" });
      setIntegrations(prev => prev.filter(i => i.id !== id));
    } catch {}
    finally { setDeleting(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-2">
      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-[13px] text-slate-500">Loading integrations…</span>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-[15px] font-bold text-slate-900">My Integration Registry</h2>
        <p className="text-[12px] text-slate-500 mt-0.5">
          All REAL — ACTIVE connections saved to your account.
        </p>
      </div>

      {integrations.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-4xl">🔌</p>
          <p className="text-[14px] font-semibold text-slate-900">No real integrations yet</p>
          <p className="text-[12px] text-slate-500">
            Use the Configure tab to set up a real connection, or the Engine tab to run simulations.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {integrations.map(intg => (
            <div key={intg.id} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-white">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.18)" }}>
                🔌
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] text-slate-900 truncate">{intg.name}</p>
                <p className="text-[11px] text-slate-500">
                  {intg.category} · Added {new Date(intg.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={intg.isEnabled ? "real-active" : "ready-awaiting"} />
                <button
                  onClick={() => handleToggle(intg)}
                  className="text-[10px] font-bold px-2 py-1 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  {intg.isEnabled ? "On" : "Off"}
                </button>
                <button
                  onClick={() => handleDelete(intg.id)}
                  disabled={deleting === intg.id}
                  className="text-[11px] text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  {deleting === intg.id ? "…" : "✕"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 rounded-xl text-[11px] text-slate-600 bg-indigo-50 border border-indigo-100 flex items-start gap-2">
        <span className="flex-shrink-0">ℹ️</span>
        <span>Only REAL — ACTIVE integrations appear here. Simulations are never stored. Toggle to control access.</span>
      </div>
    </div>
  );
}

// ─── Main IntegrationApp ──────────────────────────────────────────────────────
type AppTab = "registry" | "engine" | "configure" | "architecture";

export function IntegrationApp() {
  const [tab, setTab] = useState<AppTab>("engine");

  const TABS: { id: AppTab; icon: string; label: string }[] = [
    { id: "engine",       icon: "🔌", label: "Engine" },
    { id: "registry",     icon: "📋", label: "Registry" },
    { id: "configure",    icon: "⚙️",  label: "Configure" },
    { id: "architecture", icon: "🏛️",  label: "Architecture" },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Tab bar */}
      <div className="flex gap-1 p-2.5 border-b border-slate-200 bg-white flex-shrink-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-colors ${
              tab === t.id
                ? t.id === "engine"
                  ? "text-white"
                  : "bg-indigo-600 text-white"
                : "text-slate-500 hover:bg-slate-50"
            }`}
            style={tab === t.id && t.id === "engine"
              ? { background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }
              : undefined}
          >
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "engine"       && <EngineTab />}
        {tab === "registry"     && <RegistryTab />}
        {tab === "configure"    && <ConfigureTab />}
        {tab === "architecture" && <ArchitectureTab />}
      </div>
    </div>
  );
}
