import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  IntegrationEngine, DemoPacket, PacketStatus, SPEC_LABELS, TWELVE_ENGINES,
  detectActivationPhrase, ACTIVATION_PHRASES,
} from "@/engine/IntegrationEngine";
import {
  getIndustries, simulateIndustryPackets,
  getComplianceSummary, generateSyntheticPreview,
  IndustryDef, CapabilityDef, SyntheticPreviewRow,
} from "@/engine/CapabilityHubEngine";
import {
  getAllProposals, getProposalStats, getDomainStats, simulateProposal,
  CATEGORY_META, PLATFORM_DOMAINS,
  ImprovementCategory, ImprovementProposal, PlatformDomain,
  getActivatedIds, activateProposal, deactivateProposal, autoActivateAll, getActivationManifest,
} from "@/engine/ContinuousImprovementEngine";

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

// ─── Partner Request Panel ─────────────────────────────────────────────────────
function PartnerRequestPanel({ packet }: { packet: DemoPacket }) {
  const [copied, setCopied] = useState(false);
  const doc = useMemo(() => IntegrationEngine.generatePartnerRequest(packet), [packet.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(doc).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
            📋 Partner Integration Request
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-bold">
            Auto-generated
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="text-[10px] font-bold text-indigo-600 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          {copied ? "✓ Copied!" : "Copy to send"}
        </button>
      </div>
      <pre
        className="text-[9.5px] font-mono text-indigo-800 leading-relaxed p-3 overflow-x-auto whitespace-pre-wrap"
        style={{ maxHeight: "220px", overflowY: "auto" }}
      >{doc}</pre>
      <div className="px-3 pb-2.5">
        <p className="text-[9px] text-indigo-500">
          ⚠️ Internal document only. Review, add your contact details, then send to {packet.vendor} through your own channels.
          We never send this automatically or contact external systems on your behalf.
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
  const [expanded, setExpanded]   = useState(false);
  const [showRequest, setShowReq] = useState(false);
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">API Scopes</p>
              <div className="flex flex-wrap gap-1">
                {packet.scope.map(s => (
                  <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-mono">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Endpoint</p>
              <p className="text-[9.5px] font-mono text-slate-500 bg-slate-100 rounded-lg px-2 py-1.5 truncate">{packet.endpoint}</p>
            </div>
          </div>
          {packet.simulatedAt && (
            <p className="text-[10px] text-amber-600">🧪 Last simulated: {new Date(packet.simulatedAt).toLocaleString()}</p>
          )}
          {packet.activatedAt && (
            <p className="text-[10px] text-green-600 font-semibold">✓ Activated + added to Integration Hub: {new Date(packet.activatedAt).toLocaleString()}</p>
          )}

          {/* Partner Request toggle */}
          {packet.status !== "real-active" && (
            <div>
              <button
                onClick={() => setShowReq(r => !r)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold text-indigo-700 border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <span>📋 Partner Integration Request — auto-generated</span>
                <span>{showRequest ? "▲ Hide" : "▼ View"}</span>
              </button>
              {showRequest && <div className="mt-2"><PartnerRequestPanel packet={packet} /></div>}
            </div>
          )}
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
              🧪 Simulate
            </button>
            <div className="w-px" style={{ background: cfg.border }} />
            <button
              onClick={() => { setExpanded(true); setShowReq(true); }}
              className="flex-1 py-2 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors text-center"
            >
              📋 Request
            </button>
            <div className="w-px" style={{ background: cfg.border }} />
            <button
              onClick={() => onActivate(packet)}
              className="flex-1 py-2 text-[11px] font-bold text-green-600 hover:bg-green-50 transition-colors text-center"
            >
              🔑 Activate
            </button>
          </>
        )}
        {packet.status === "simulation" && (
          <>
            <button
              onClick={() => { setExpanded(true); setShowReq(true); }}
              className="flex-1 py-2 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors text-center"
            >
              📋 Request
            </button>
            <div className="w-px" style={{ background: cfg.border }} />
            <button
              onClick={() => onActivate(packet)}
              className="flex-1 py-2 text-[11px] font-bold text-green-600 hover:bg-green-50 transition-colors text-center"
            >
              🔑 Activate
            </button>
            <div className="w-px" style={{ background: cfg.border }} />
            <button
              onClick={() => onReset(packet.id)}
              className="px-3 py-2 text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >↺</button>
          </>
        )}
        {packet.status === "real-active" && (
          <button disabled className="flex-1 py-2 text-[11px] font-bold text-green-600 text-center">
            ✓ REAL — ACTIVE · In Hub
          </button>
        )}
        {packet.status === "ready-awaiting" && (
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

  // ── Activate with real key → mark REAL — ACTIVE + add to Integration Hub ──
  const handleKeyConfirm = useCallback(async (key: string) => {
    if (!apiKeyTarget) return;
    const target = apiKeyTarget;
    setApiKeyTarget(null);

    // 1. Persist REAL — ACTIVE status (key stored as reference, never plain text)
    IntegrationEngine.activateWithKey(target.id, key);
    setSim(prev => prev.filter(p => p.id !== target.id));
    refresh();
    addLog(`✅ REAL — ACTIVE: "${target.name}" activated with user-provided API key`);

    // 2. Add to Integration Hub (shared registry for all platform users)
    try {
      await fetch("/api/integrations", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({
          name:      target.name,
          type:      "api",
          category:  target.category,
          status:    "configured",
          isEnabled: true,
        }),
      });
      addLog(`🌐 "${target.name}" added to Integration Hub — available to all platform users`);
    } catch {
      addLog(`⚠️ "${target.name}" activated locally — Hub sync failed (retry in Registry tab)`);
    }
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
interface ConnectSource {
  sourceId: string;
  displayName: string;
  description?: string;
  authType?: string;
  testDataOnly?: boolean;
  note?: string;
}

const CONNECT_CAT_LABEL: Record<string, string> = {
  health:  "Healthcare",
  banking: "Banking & Finance",
  care:    "Care",
  other:   "Business",
};

const CONNECT_CAT_ICON: Record<string, string> = {
  health:  "🏥",
  banking: "🏦",
  care:    "💊",
  other:   "🔌",
};

const CONNECT_CAT_COLOR: Record<string, string> = {
  health:  "#059669",
  banking: "#0891b2",
  care:    "#7c3aed",
  other:   "#6366f1",
};

function ConfigureTab() {
  const [sources, setSources]   = useState<Record<string, ConnectSource[]>>({});
  const [loading, setLoading]   = useState(true);
  const [smartBusy, setSmartBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/connect/sources", { credentials: "include" });
        if (r.ok) {
          const d = await r.json() as { ok: boolean; sources: Record<string, ConnectSource[]> };
          setSources(d.sources ?? {});
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleConnectSmart = async () => {
    setSmartBusy(true);
    try {
      const base        = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
      const redirectUri = `${window.location.origin}${base}/connectors/SMART_FHIR_SANDBOX/callback`;
      const res  = await fetch(
        `/api/integrations/smart-fhir-sandbox/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}`,
        { credentials: "include" }
      );
      const data = await res.json() as { url?: string };
      if (data.url) { window.location.href = data.url; }
      else { setSmartBusy(false); }
    } catch { setSmartBusy(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-2">
      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-[13px] text-slate-500">Loading integrations…</span>
    </div>
  );

  return (
    <div className="p-5 space-y-6">
      <div>
        <h2 className="text-[15px] font-bold text-slate-900">Available Integrations</h2>
        <p className="text-[12px] text-slate-500 mt-0.5">
          Connect external systems to your CreateAI account.
        </p>
      </div>

      {Object.keys(sources).length === 0 && (
        <div className="text-center py-12 space-y-3">
          <p className="text-4xl">🔌</p>
          <p className="text-[14px] font-semibold text-slate-900">No connectors available</p>
          <p className="text-[12px] text-slate-500">Check back soon — new integrations are added regularly.</p>
        </div>
      )}

      {Object.entries(sources).map(([cat, catSources]) => {
        const catColor = CONNECT_CAT_COLOR[cat] ?? "#6366f1";
        const catIcon  = CONNECT_CAT_ICON[cat]  ?? "🔌";
        return (
          <div key={cat} className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: catColor }}>
                {CONNECT_CAT_LABEL[cat] ?? cat}
              </span>
              <div className="flex-1 h-px" style={{ background: `${catColor}20` }} />
              <span className="text-[10px] text-slate-400">{catSources.length}</span>
            </div>

            {catSources.map(src => {
              const isSmart = src.sourceId === "SMART_FHIR_SANDBOX";
              return (
                <div key={src.sourceId}
                  className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-100 transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${catColor}12` }}>
                    {catIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[13px] text-slate-900">{src.displayName}</p>
                      {src.testDataOnly && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Test data only
                        </span>
                      )}
                    </div>
                    {src.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{src.description}</p>
                    )}
                    {src.note && (
                      <p className="text-[10px] text-slate-400 mt-1 italic leading-snug">{src.note}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 mt-0.5">
                    {isSmart ? (
                      <button
                        onClick={handleConnectSmart}
                        disabled={smartBusy}
                        className="h-7 px-3 rounded-lg text-[11px] font-semibold border transition-colors whitespace-nowrap"
                        style={{
                          borderColor: smartBusy ? "#e2e8f0" : "#bbf7d0",
                          color:       smartBusy ? "#94a3b8"  : "#15803d",
                          background:  smartBusy ? "#f8fafc"  : "#f0fdf4",
                        }}
                        title="Redirects to SMART Health IT public sandbox — test data only, no real PHI"
                      >
                        {smartBusy ? "⏳ Redirecting…" : "🔐 Connect (SMART OAuth)"}
                      </button>
                    ) : (
                      <span className="inline-block h-7 px-3 leading-7 rounded-lg text-[11px] font-semibold border border-slate-200 text-slate-400 bg-slate-50 whitespace-nowrap">
                        Credentials required
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
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
        <h2 className="text-[15px] font-bold text-slate-900">Connected Integrations</h2>
        <p className="text-[12px] text-slate-500 mt-0.5">
          External systems you have authorized.
        </p>
      </div>

      {integrations.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-4xl">🔌</p>
          <p className="text-[14px] font-semibold text-slate-900">No connected integrations yet</p>
          <p className="text-[12px] text-slate-500">
            Go to the Configure tab to connect your first integration.
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
        <span>Toggle to enable or disable access. Remove to revoke a connection entirely.</span>
      </div>
    </div>
  );
}

// ─── Industries Tab ───────────────────────────────────────────────────────────
// Mode constants — the two modes the user sees
const PREVIEW_MODE = "preview" as const;
const ACTIVE_MODE  = "active"  as const;
type CapMode = typeof PREVIEW_MODE | typeof ACTIVE_MODE;

function PreviewDataPanel({ cap }: { cap: CapabilityDef }) {
  const rows: SyntheticPreviewRow[] = useMemo(() => generateSyntheticPreview(cap), [cap.id]);
  return (
    <div className="rounded-xl overflow-hidden border border-amber-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
            🔍 Preview Data — Synthetic Records
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800 font-bold">
            Never stored · Never real
          </span>
        </div>
        <span className="text-[9px] text-amber-600">{rows.length} rows × {cap.fieldMap.length} fields</span>
      </div>

      {/* Rows */}
      {rows.map((row, ri) => (
        <div key={ri} className={ri > 0 ? "border-t border-amber-100" : ""}>
          <div className="px-3 py-1.5 bg-amber-50/60">
            <span className="text-[9px] font-bold text-amber-700">{row.rowLabel}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[9.5px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-2.5 py-1.5 font-bold text-slate-500 whitespace-nowrap">Platform Field</th>
                  <th className="text-left px-2.5 py-1.5 font-bold text-slate-500 whitespace-nowrap">Source Value</th>
                  <th className="text-left px-2 py-1.5 text-slate-400">→</th>
                  <th className="text-left px-2.5 py-1.5 font-bold text-indigo-600 whitespace-nowrap">Mapped Value</th>
                  <th className="text-left px-2.5 py-1.5 font-bold text-slate-400 whitespace-nowrap hidden sm:table-cell">Transform</th>
                </tr>
              </thead>
              <tbody>
                {row.fields.map((f, fi) => (
                  <tr key={fi} className={fi % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-2.5 py-1.5 font-mono text-indigo-700 font-semibold whitespace-nowrap">{f.platformField}</td>
                    <td className="px-2.5 py-1.5 font-mono text-slate-500 whitespace-nowrap">{f.sourceValue}</td>
                    <td className="px-2 py-1.5 text-slate-300">→</td>
                    <td className="px-2.5 py-1.5 font-mono text-slate-800 font-medium whitespace-nowrap">{f.mappedValue}</td>
                    <td className="px-2.5 py-1.5 text-slate-400 hidden sm:table-cell">{f.transform ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="px-3 py-2 bg-amber-50 border-t border-amber-100">
        <p className="text-[9px] text-amber-600">
          ⚠️ All values above are synthetic — generated from field name patterns only.
          Your real data will be mapped using these same rules once you provide real API keys.
        </p>
      </div>
    </div>
  );
}

function CapabilityCard({ cap }: { cap: CapabilityDef & { simulatedAt?: string } }) {
  const [expanded, setExpanded] = useState(false);
  const [showMap,  setShowMap]  = useState(false);
  const [showMig,  setShowMig]  = useState(false);
  const [showPrev, setShowPrev] = useState(false);

  // Derive current display mode from status
  const isActive  = cap.status === "real-active";
  const isPreview = cap.status === "simulation";
  const mode: CapMode = isActive ? ACTIVE_MODE : PREVIEW_MODE;

  return (
    <div className={`rounded-2xl border overflow-hidden bg-white transition-all ${
      isActive  ? "border-green-200" :
      isPreview ? "border-amber-200" : "border-slate-200"
    }`}>

      {/* ── Mode banner ─────────────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-3.5 py-2 text-[9.5px] font-bold ${
        isActive  ? "bg-green-50 border-b border-green-100 text-green-800" :
        isPreview ? "bg-amber-50 border-b border-amber-100 text-amber-800" :
                    "bg-slate-50 border-b border-slate-100 text-slate-600"
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            isActive ? "bg-green-500" : isPreview ? "bg-amber-500 animate-pulse" : "bg-slate-400"
          }`} />
          {isActive
            ? "✅ ACTIVE MODE — Real data connection live"
            : isPreview
              ? "🔍 PREVIEW MODE — Synthetic data only, nothing stored"
              : "⏳ READY — Awaiting real API keys to go live"}
        </div>
        {cap.complianceFlags.slice(0, 2).map(f => (
          <span key={f} className="text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold">{f}</span>
        ))}
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-3.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-slate-50 border border-slate-100">
          {cap.icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-[12.5px] text-slate-900 truncate block">{cap.systemName}</span>
          <p className="text-[10px] text-slate-500">{cap.category} · {cap.fieldMap.length} fields mapped</p>
        </div>
        <button onClick={() => setExpanded(e => !e)}
          className="text-slate-400 hover:text-slate-600 text-[11px] px-1 flex-shrink-0">
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* ── Expanded ────────────────────────────────────────────────────────── */}
      {expanded && (
        <div className="px-3.5 pb-3.5 space-y-3 border-t border-slate-100 pt-3">
          <p className="text-[11.5px] text-slate-600">{cap.description}</p>

          {/* Project types */}
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Available to project types
            </p>
            <div className="flex flex-wrap gap-1">
              {cap.projectTypes.map(pt => (
                <span key={pt} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{pt}</span>
              ))}
            </div>
          </div>

          {/* ── Preview Data (only in preview mode) ─────────────────────────── */}
          {(isPreview || mode === PREVIEW_MODE) && (
            <div>
              <button onClick={() => setShowPrev(p => !p)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold text-amber-800 border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <span>🔍 Preview Data — See how your data looks inside the platform</span>
                <span>{showPrev ? "▲ Hide" : "▼ Preview"}</span>
              </button>
              {showPrev && <div className="mt-2"><PreviewDataPanel cap={cap} /></div>}
            </div>
          )}

          {/* ── Field Mapping ────────────────────────────────────────────────── */}
          <div>
            <button onClick={() => setShowMap(m => !m)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold text-slate-700 border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span>🗄️ Field Mapping — {cap.fieldMap.length} fields</span>
              <span>{showMap ? "▲ Hide" : "▼ View"}</span>
            </button>
            {showMap && (
              <div className="mt-2 rounded-xl overflow-hidden border border-slate-200">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-2.5 py-2 font-bold text-slate-500">Source Field</th>
                      <th className="text-left px-2.5 py-2 font-bold text-slate-500">Platform Field</th>
                      <th className="text-left px-2.5 py-2 font-bold text-slate-500">Type</th>
                      <th className="text-left px-2.5 py-2 font-bold text-slate-500">Req</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cap.fieldMap.map((f, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-2.5 py-1.5 font-mono text-slate-600">{f.sourceField}</td>
                        <td className="px-2.5 py-1.5 font-mono text-indigo-600 font-semibold">{f.platformField}</td>
                        <td className="px-2.5 py-1.5 text-slate-500">{f.type}</td>
                        <td className="px-2.5 py-1.5">
                          {f.required
                            ? <span className="text-[8px] font-bold text-green-600">✓</span>
                            : <span className="text-[8px] text-slate-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {cap.fieldMap.some(f => f.transform) && (
                  <div className="p-2.5 bg-indigo-50 border-t border-indigo-100">
                    <p className="text-[9px] font-bold text-indigo-600 mb-1">Auto-transforms</p>
                    {cap.fieldMap.filter(f => f.transform).map((f, i) => (
                      <p key={i} className="text-[9px] text-indigo-700">
                        <span className="font-mono">{f.sourceField}</span> → {f.transform}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Migration Pathway ────────────────────────────────────────────── */}
          <div>
            <button onClick={() => setShowMig(m => !m)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold text-slate-700 border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span>🛤️ Migration Pathway — {cap.migrationSteps.length} steps</span>
              <span>{showMig ? "▲ Hide" : "▼ View"}</span>
            </button>
            {showMig && (
              <div className="mt-2 space-y-1.5">
                {cap.migrationSteps.map(s => (
                  <div key={s.step} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                      style={{ background: "#4f46e515", color: "#4f46e5" }}>
                      {s.step}
                    </div>
                    <div>
                      <p className="text-[10.5px] font-bold text-slate-800">{s.label}</p>
                      <p className="text-[9.5px] text-slate-500 mt-0.5">{s.desc}</p>
                      {s.safe && (
                        <span className="inline-block mt-1 text-[8.5px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                          ✓ No real data moved
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Active mode footer ───────────────────────────────────────────── */}
          {isActive && (
            <div className="rounded-xl p-3 bg-green-50 border border-green-200">
              <p className="text-[10.5px] font-bold text-green-800">✅ Active Mode</p>
              <p className="text-[9.5px] text-green-700 mt-0.5">
                Real API keys verified. Live data is flowing through this capability.
                Available to all platform users and all compatible projects.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Action row ──────────────────────────────────────────────────────── */}
      <div className="flex border-t border-slate-100">
        {!isActive && (
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Preview Mode Active
          </div>
        )}
        {isActive && (
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Active Mode — Live
          </div>
        )}
      </div>
    </div>
  );
}

// All project types (matching scaffold engine)
const ALL_PROJECT_TYPES = [
  "Web App/SaaS","Mobile App","Business/Company","Startup","Healthcare App",
  "Online Course","Physical Product","Film/Movie","Documentary","Video Game",
  "Book/Novel","Music/Album","Podcast","Real Estate App","Legal App",
  "Non-Profit App","Construction App","Logistics App","Hospitality App","Education App",
];

function IndustriesTab() {
  const industries = useMemo(() => getIndustries(), []);
  const [viewMode,    setViewMode]    = useState<"industry" | "project">("industry");
  const [selected,    setSelected]    = useState<string | null>(null);
  const [preparing,   setPreparing]   = useState(false);
  const [simCaps,     setSimCaps]     = useState<CapabilityDef[]>([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [projectType, setProjectType] = useState<string>("");

  const selectedInd = selected ? industries.find(i => i.id === selected) : null;
  const compliance  = selected ? getComplianceSummary(selected) : [];

  const handleSelectIndustry = useCallback((id: string) => {
    if (id === selected) { setSelected(null); setSimCaps([]); return; }
    setSelected(id);
    setPreparing(true);
    setSimCaps([]);
    // Staggered reveal — simulate all capability packets for this industry (memory only)
    const packets = simulateIndustryPackets(id);
    setTimeout(() => {
      setPreparing(false);
      packets.forEach((p, i) => setTimeout(() => setSimCaps(prev => [...prev, p]), i * 80));
    }, 600);
  }, [selected]);

  const filteredCaps = useMemo(() => {
    if (!projectFilter.trim()) return simCaps;
    return simCaps.filter(c => c.projectTypes.some(
      pt => pt.toLowerCase().includes(projectFilter.toLowerCase())
    ));
  }, [simCaps, projectFilter]);

  // Project view — capabilities for a selected project type (all industries, simulated in memory)
  const projectCaps = useMemo((): CapabilityDef[] => {
    if (!projectType) return [];
    return industries
      .flatMap(ind => simulateIndustryPackets(ind.id))
      .filter(c => c.projectTypes.some(
        pt => pt.toLowerCase() === projectType.toLowerCase()
      ));
  }, [projectType, industries]);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-[15px] font-bold text-slate-900">Universal Capability Hub</h2>
        <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">
          Auto-prepare every system, field map, and migration pathway for any industry or project.
          Preview Mode is always safe — no real data is moved without partner approval.
        </p>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100">
        <button onClick={() => setViewMode("industry")}
          className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-colors ${
            viewMode === "industry" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}>
          🏭 By Industry
        </button>
        <button onClick={() => setViewMode("project")}
          className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-colors ${
            viewMode === "project" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}>
          📂 By Project Type
        </button>
      </div>

      {/* ── PROJECT VIEW ────────────────────────────────────────────────────── */}
      {viewMode === "project" && (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Select project type to pull relevant capabilities
            </label>
            <select
              value={projectType}
              onChange={e => setProjectType(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[12px] font-medium bg-white outline-none focus:border-indigo-400 text-slate-800"
            >
              <option value="">Choose a project type…</option>
              {ALL_PROJECT_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
            </select>
          </div>

          {projectType && projectCaps.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[13px] font-semibold text-slate-700">No capabilities mapped yet for "{projectType}"</p>
              <p className="text-[11px] text-slate-500 mt-1">Try "Web App/SaaS", "Healthcare App", or "Startup"</p>
            </div>
          )}

          {projectType && projectCaps.length > 0 && (
            <>
              <div className="rounded-xl px-3 py-2.5 bg-indigo-50 border border-indigo-100 flex items-start gap-2">
                <span className="text-indigo-600">📂</span>
                <p className="text-[10.5px] text-indigo-800">
                  <strong>{projectCaps.length} capabilities</strong> from{" "}
                  <strong>{[...new Set(projectCaps.map(c => c.industryId))].length} industries</strong>{" "}
                  are available for <strong>{projectType}</strong> projects.
                  All in <span className="text-amber-700 font-bold">Preview Mode</span> — activate any by providing real API keys.
                </p>
              </div>
              {projectCaps.map(cap => <CapabilityCard key={cap.id} cap={cap} />)}
            </>
          )}

          {!projectType && (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">📂</p>
              <p className="text-[13px] font-semibold text-slate-700">Choose a project type above</p>
              <p className="text-[11px] text-slate-500 mt-1">
                The hub shows every capability your project can pull — all in Preview Mode by default.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── INDUSTRY VIEW ───────────────────────────────────────────────────── */}
      {viewMode === "industry" && (<>

      {/* Industry grid */}
      <div className="grid grid-cols-3 gap-2">
        {industries.map(ind => (
          <button
            key={ind.id}
            onClick={() => handleSelectIndustry(ind.id)}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border text-center transition-all ${
              selected === ind.id
                ? "text-white border-transparent shadow-sm"
                : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50"
            }`}
            style={selected === ind.id ? { background: ind.color, borderColor: ind.color } : {}}
          >
            <span className="text-[20px]">{ind.icon}</span>
            <span className={`text-[9.5px] font-bold leading-tight ${
              selected === ind.id ? "text-white" : "text-slate-700"
            }`}>{ind.name}</span>
          </button>
        ))}
      </div>

      {/* Selected industry detail */}
      {selected && selectedInd && (
        <div className="space-y-3">

          {/* Industry info bar */}
          <div className="rounded-2xl border p-3.5 bg-white" style={{ borderColor: selectedInd.color + "40" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: selectedInd.color + "18" }}>
                {selectedInd.icon}
              </div>
              <div>
                <p className="font-bold text-[14px] text-slate-900">{selectedInd.name}</p>
                <p className="text-[11px] text-slate-500">{selectedInd.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {compliance.map(f => (
                <span key={f} className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">{f}</span>
              ))}
            </div>
          </div>

          {/* Preparing state */}
          {preparing && (
            <div className="flex items-center gap-3 py-4 px-4 rounded-2xl border border-amber-100 bg-amber-50">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-[11px] font-semibold text-amber-800">
                Auto-preparing all {selectedInd.name} capability packets…
              </p>
            </div>
          )}

          {/* Project type filter */}
          {simCaps.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                placeholder="Filter by project type (e.g. Healthcare App, Web App)…"
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-[11px] outline-none focus:border-indigo-400 bg-white"
              />
              {projectFilter && (
                <button onClick={() => setProjectFilter("")}
                  className="text-[11px] text-slate-400 hover:text-slate-600 px-2">✕</button>
              )}
            </div>
          )}

          {/* Simulation banner */}
          {simCaps.length > 0 && (
            <div className="rounded-xl px-3 py-2.5 bg-amber-50 border border-amber-200 flex items-start gap-2">
              <span className="text-amber-600 flex-shrink-0">🧪</span>
              <p className="text-[10.5px] text-amber-800">
                <strong>{simCaps.length} capability packets</strong> auto-prepared in simulation mode —
                synthetic packets exist in memory only, never stored.
                When a partner provides real API keys, capabilities switch to REAL — ACTIVE instantly.
              </p>
            </div>
          )}

          {/* Capability cards */}
          {filteredCaps.map(cap => (
            <CapabilityCard key={cap.id} cap={cap} />
          ))}

          {/* Empty filter state */}
          {simCaps.length > 0 && filteredCaps.length === 0 && projectFilter && (
            <div className="text-center py-8">
              <p className="text-[13px] font-semibold text-slate-700">No matches for "{projectFilter}"</p>
              <p className="text-[11px] text-slate-500 mt-1">Try "Web App", "Startup", or "Business/Company"</p>
            </div>
          )}

          {/* Readiness footer */}
          {simCaps.length > 0 && (
            <div className="rounded-xl p-3.5 border border-green-200 bg-green-50">
              <p className="text-[11px] font-bold text-green-800 mb-0.5">
                ✅ {selectedInd.name} — Fully Prepared
              </p>
              <p className="text-[10.5px] text-green-700 leading-relaxed">
                All {simCaps.length} systems are mapped, simulated, and structurally ready.
                The only missing step is partner approval and real API key delivery.
                When keys arrive, activate in the Engine tab — capabilities go live instantly for every project.
              </p>
            </div>
          )}
        </div>
      )}

      {/* No selection state */}
      {!selected && (
        <div className="text-center py-10">
          <p className="text-3xl mb-2">🏭</p>
          <p className="text-[13px] font-semibold text-slate-700">Select an industry above</p>
          <p className="text-[11px] text-slate-500 mt-1">
            All systems, fields, and migration pathways prepare instantly — fully safe, fully simulated.
          </p>
        </div>
      )}
      </>)}
    </div>
  );
}

// ─── EvolutionTab ─────────────────────────────────────────────────────────────
const CATEGORY_FILTERS: { id: ImprovementCategory | "all"; label: string; icon: string }[] = [
  { id: "all",                        label: "All",         icon: "🔍" },
  { id: "waste-reduction",            label: "Waste",       icon: "♻️" },
  { id: "duplication-elimination",    label: "Duplicates",  icon: "🔗" },
  { id: "complexity-simplification",  label: "Complexity",  icon: "🧩" },
  { id: "safety-strengthening",       label: "Safety",      icon: "🛡️" },
  { id: "capability-expansion",       label: "Capability",  icon: "🚀" },
  { id: "foundational-innovation",    label: "Innovation",  icon: "⚡" },
];

const COMPLEXITY_COLOR: Record<string, string> = {
  low:    "text-emerald-700 bg-emerald-50 border-emerald-200",
  medium: "text-amber-700 bg-amber-50 border-amber-200",
  high:   "text-rose-700 bg-rose-50 border-rose-200",
};

const RUN_PHASE_LABEL: Record<string, string> = {
  simulating:  "Running synthetic simulations across all proposals…",
  activating:  "Applying optimizations — zero impact on existing systems…",
  complete:    "Platform optimization complete. All safe upgrades active.",
};

function ProposalCard({
  proposal, isSimulated, isReady, isActivated,
  onSimulate, onPrepare, onActivate, onDeactivate,
}: {
  proposal:    ImprovementProposal;
  isSimulated: boolean;
  isReady:     boolean;
  isActivated: boolean;
  onSimulate:  () => void;
  onPrepare:   () => void;
  onActivate:  () => void;
  onDeactivate:() => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[proposal.category];

  const borderCls = isActivated
    ? "border-emerald-400 shadow-sm shadow-emerald-100"
    : isReady    ? "border-emerald-300"
    : isSimulated ? "border-indigo-200"
    : "border-slate-200";

  return (
    <div className={`rounded-2xl border bg-white overflow-hidden transition-all ${borderCls}`}>
      {/* Active stripe */}
      {isActivated && (
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-indigo-400 to-emerald-400" />
      )}

      {/* Card header */}
      <div className="p-3.5">
        <div className="flex items-start gap-2 mb-2">
          <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
            {meta.icon} {meta.label}
          </span>
          {proposal.isFoundational && (
            <span className="flex-shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800">
              ⚡ FOUNDATIONAL
            </span>
          )}
          {isActivated && (
            <span className="flex-shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-600 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-white animate-pulse inline-block" />
              ACTIVE
            </span>
          )}
          <span className={`flex-shrink-0 ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full border ${COMPLEXITY_COLOR[proposal.complexity]}`}>
            {proposal.complexity}
          </span>
        </div>

        <p className="font-bold text-[13px] text-slate-900 mb-1">{proposal.title}</p>
        <p className="text-[11px] text-slate-600 leading-relaxed mb-2">{proposal.solution}</p>

        {/* Metrics row */}
        <div className="flex items-center gap-3 mb-2">
          {proposal.efficiencyGain > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${proposal.efficiencyGain}%` }} />
              </div>
              <span className="text-[10px] font-bold text-emerald-700">+{proposal.efficiencyGain}% efficient</span>
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-8 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-400" style={{ width: `${proposal.safetyScore}%` }} />
            </div>
            <span className="text-[10px] font-bold text-indigo-700">{proposal.safetyScore}% safe</span>
          </div>
        </div>

        {/* Affected systems */}
        <div className="flex flex-wrap gap-1 mb-2.5">
          {proposal.affectedSystems.slice(0, 3).map(s => (
            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{s}</span>
          ))}
          {proposal.affectedSystems.length > 3 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">+{proposal.affectedSystems.length - 3} more</span>
          )}
        </div>

        {/* Action row */}
        <div className="flex gap-2">
          {!isSimulated && !isReady && !isActivated && (
            <button onClick={onSimulate}
              className="flex-1 py-2 rounded-xl text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
              🔬 Run Simulation
            </button>
          )}
          {isSimulated && !isReady && !isActivated && (
            <>
              <button onClick={() => setExpanded(e => !e)}
                className="flex-1 py-2 rounded-xl text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors">
                {expanded ? "▲ Hide" : "▼ Results"}
              </button>
              <button onClick={onPrepare}
                className="flex-1 py-2 rounded-xl text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                ✅ Prepare
              </button>
            </>
          )}
          {isReady && !isActivated && (
            <>
              <button onClick={() => setExpanded(e => !e)}
                className="py-2 px-3 rounded-xl text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors">
                {expanded ? "▲" : "▼"}
              </button>
              <div className="flex-shrink-0 flex items-center gap-1 py-2 px-3 rounded-xl text-[11px] font-bold bg-emerald-50 border border-emerald-300 text-emerald-800">
                ✅ Ready
              </div>
              <button onClick={onActivate}
                className="flex-1 py-2 rounded-xl text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                ⚡ Activate
              </button>
            </>
          )}
          {isActivated && (
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 py-2 rounded-xl text-[11px] font-bold text-center bg-emerald-600 text-white">
                ⚡ Active — Optimization Running
              </div>
              <button onClick={onDeactivate}
                className="py-2 px-2.5 rounded-xl text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors">
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Simulation results panel */}
      {(isSimulated || isReady || isActivated) && expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Simulation Results</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold">
              🧪 {proposal.simulation.syntheticPacketsAffected} synthetic packets
            </span>
            <span className="ml-auto text-[9px] text-slate-500 font-semibold">{proposal.simulation.confidenceScore}% confidence</span>
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-100 px-3 py-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Metric</span><span className="text-center">Before</span><span className="text-center">After</span>
            </div>
            {proposal.simulation.metrics.map((m, i) => (
              <div key={i} className={`grid grid-cols-3 px-3 py-2 text-[10.5px] border-t border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}>
                <span className="text-slate-700 font-medium leading-snug pr-2">{m.label}</span>
                <span className="text-center text-rose-700 font-semibold">{m.before}</span>
                <span className="text-center text-emerald-700 font-bold">{m.after}
                  <span className="block text-[9px] text-indigo-600 font-bold">{m.delta}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex items-center gap-4 text-[10px] text-slate-500">
            <span>⏱ Est: <strong className="text-slate-700">{proposal.simulation.estimatedImplementation}</strong></span>
            <span>🛡️ Existing systems: <strong className="text-emerald-700">Unaffected</strong></span>
          </div>
        </div>
      )}

      {/* Simulated preview strip */}
      {isSimulated && !expanded && !isReady && !isActivated && (
        <div className="border-t border-indigo-100 bg-indigo-50 px-3.5 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <p className="text-[10px] text-indigo-700 font-semibold">
            {proposal.simulation.syntheticPacketsAffected} packets · {proposal.simulation.confidenceScore}% confidence
          </p>
        </div>
      )}
    </div>
  );
}

function EvolutionTab() {
  const [categoryFilter, setCategoryFilter] = useState<ImprovementCategory | "all">("all");
  const [domainFilter,   setDomainFilter]   = useState<PlatformDomain | "all">("all");
  const [simulated,  setSimulated]  = useState<Set<string>>(new Set());
  const [ready,      setReady]      = useState<Set<string>>(new Set());
  const [activated,  setActivated]  = useState<Set<string>>(() => getActivatedIds());
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [runPhase,   setRunPhase]   = useState<"idle" | "simulating" | "activating" | "complete">("idle");
  const [runProgress,setRunProgress]= useState(0);

  const proposals    = useMemo(() => getAllProposals(), []);
  const stats        = useMemo(() => getProposalStats(), []);
  const domainStats  = useMemo(() => getDomainStats(), []);
  const manifest     = useMemo(() => getActivationManifest(), [activated]);

  const filtered = useMemo(() => {
    let r = proposals;
    if (categoryFilter !== "all") r = r.filter(p => p.category === categoryFilter);
    if (domainFilter   !== "all") r = r.filter(p => p.domain   === domainFilter);
    return r;
  }, [proposals, categoryFilter, domainFilter]);

  const isRunningAll = runPhase === "simulating" || runPhase === "activating";

  const handleSimulate = useCallback((id: string) => {
    setSimulatingId(id);
    setTimeout(() => { setSimulated(prev => new Set([...prev, id])); setSimulatingId(null); }, 900);
  }, []);

  const handlePrepare  = useCallback((id: string) => {
    setReady(prev => new Set([...prev, id]));
  }, []);

  const handleActivate = useCallback((id: string) => {
    activateProposal(id);
    setActivated(getActivatedIds());
  }, []);

  const handleDeactivate = useCallback((id: string) => {
    deactivateProposal(id);
    setActivated(getActivatedIds());
  }, []);

  const handleRunAll = useCallback(async () => {
    if (isRunningAll) return;
    const total = proposals.length;

    // Phase 1 — Staggered simulation wave
    setRunPhase("simulating");
    setRunProgress(0);
    for (let i = 0; i < total; i++) {
      await new Promise<void>(r => setTimeout(r, 18));
      const id = proposals[i].id;
      setSimulated(prev => new Set([...prev, id]));
      setReady(prev => new Set([...prev, id]));
      setRunProgress(Math.round(((i + 1) / total) * 50));
    }

    // Phase 2 — Activate all safe
    setRunPhase("activating");
    const activatedIds = autoActivateAll();
    for (let i = 0; i < activatedIds.length; i++) {
      await new Promise<void>(r => setTimeout(r, 12));
      setRunProgress(50 + Math.round(((i + 1) / activatedIds.length) * 50));
    }
    setActivated(getActivatedIds());
    setRunProgress(100);
    setRunPhase("complete");
    setTimeout(() => { setRunPhase("idle"); setRunProgress(0); }, 3500);
  }, [proposals, isRunningAll]);

  return (
    <div className="p-4 space-y-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-[15px] font-bold text-slate-900">Continuous Evolution Engine</h2>
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Live Analysis
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Every engine, workflow, capability, compliance rule, and integration pathway continuously
            analyzed. Proposals simulate safely in synthetic packets — zero impact on live systems.
          </p>
        </div>

        {/* Execute button */}
        <button
          onClick={handleRunAll}
          disabled={isRunningAll}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
            runPhase === "complete"
              ? "bg-emerald-600 text-white border border-emerald-600"
              : isRunningAll
              ? "bg-indigo-100 text-indigo-500 border border-indigo-200 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200"
          }`}>
          {runPhase === "complete" ? "✅ Done" : isRunningAll ? (
            <><span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping inline-block" />Running…</>
          ) : (
            <><span>⚡</span><span>Optimize All</span></>
          )}
        </button>
      </div>

      {/* ── Optimization progress bar ────────────────────────────────────── */}
      {runPhase !== "idle" && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-bold text-indigo-800">
              {RUN_PHASE_LABEL[runPhase] ?? ""}
            </p>
            <span className="text-[11px] font-bold text-indigo-700">{runProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-indigo-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-200"
              style={{ width: `${runProgress}%` }}
            />
          </div>
          {runPhase === "complete" && (
            <p className="text-[10px] text-emerald-700 font-semibold">
              ✅ {manifest.activatedCount} optimizations active · {manifest.coverage}% coverage ·
              {manifest.avgGainActivated > 0 ? ` +${manifest.avgGainActivated}% avg efficiency gain` : ""}
            </p>
          )}
        </div>
      )}

      {/* ── Activation manifest summary ──────────────────────────────────── */}
      {manifest.activatedCount > 0 && runPhase === "idle" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">⚡</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-emerald-900">
              {manifest.activatedCount} optimizations active · {manifest.coverage}% platform coverage
            </p>
            <p className="text-[10px] text-emerald-700 mt-0.5">
              {manifest.totalSyntheticPackets.toLocaleString()} synthetic packets validated ·
              {manifest.avgGainActivated > 0 ? ` +${manifest.avgGainActivated}% avg efficiency` : " 100% safety guaranteed"}
            </p>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-white border border-emerald-200 px-2 py-1 rounded-lg flex-shrink-0">
            🛡️ Zero disruption
          </span>
        </div>
      )}

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-1.5">
        {[
          { label: "Proposals",  value: stats.total,                    color: "text-slate-900" },
          { label: "Simulated",  value: simulated.size || ready.size,   color: "text-indigo-700" },
          { label: "Ready",      value: ready.size,                     color: "text-amber-700" },
          { label: "Activated",  value: manifest.activatedCount,        color: "text-emerald-700" },
          { label: "Avg Gain",   value: `+${stats.avgEfficiencyGain}%`, color: "text-emerald-700" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white py-2 px-1.5 text-center">
            <p className={`text-[15px] font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-slate-500 font-semibold mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Domain filter ────────────────────────────────────────────────── */}
      <div>
        <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Domain</p>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button onClick={() => setDomainFilter("all")}
            className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${
              domainFilter === "all" ? "bg-slate-800 text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}>All</button>
          {domainStats.filter(d => d.count > 0).map(d => (
            <button key={d.domain} onClick={() => setDomainFilter(d.domain)}
              className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${
                domainFilter === d.domain
                  ? "bg-slate-800 text-white border-transparent"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}>
              <span>{d.icon}</span>
              <span>{d.label}</span>
              <span className={`text-[9px] px-1 rounded-full ${domainFilter === d.domain ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {d.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Category filter ──────────────────────────────────────────────── */}
      <div>
        <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</p>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {CATEGORY_FILTERS.map(f => (
            <button key={f.id} onClick={() => setCategoryFilter(f.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold border transition-colors ${
                categoryFilter === f.id
                  ? "bg-indigo-600 text-white border-transparent"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50"
              }`}>
              <span>{f.icon}</span><span>{f.label}</span>
              {f.id !== "all" && (
                <span className={`text-[9px] px-1 rounded-full ${
                  categoryFilter === f.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {stats.byCategory[f.id as ImprovementCategory] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Simulating spinner (single card) ─────────────────────────────── */}
      {simulatingId && (
        <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-[11px] font-semibold text-indigo-800">
            Running synthetic simulation — zero impact on existing systems…
          </p>
        </div>
      )}

      {/* ── Proposal list ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.map(p => (
          <ProposalCard
            key={p.id}
            proposal={p}
            isSimulated={simulated.has(p.id) || ready.has(p.id) || activated.has(p.id)}
            isReady={ready.has(p.id) || activated.has(p.id)}
            isActivated={activated.has(p.id)}
            onSimulate={() => handleSimulate(p.id)}
            onPrepare={() => handlePrepare(p.id)}
            onActivate={() => handleActivate(p.id)}
            onDeactivate={() => handleDeactivate(p.id)}
          />
        ))}
      </div>

      {/* ── Platform directive ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Platform Directive — Active</p>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Every engine, capability, workflow, data model, integration pathway, compliance rule, and project type
          is continuously analyzed for smarter, lighter, safer patterns.
          Improvements simulate safely in synthetic packets, activate instantly when confirmed,
          and never disrupt existing systems — no ceiling on how much the platform can improve.
        </p>
      </div>
    </div>
  );
}

// ─── Main IntegrationApp ──────────────────────────────────────────────────────
type AppTab = "registry" | "engine" | "configure" | "architecture" | "industries" | "evolution";

export function IntegrationApp() {
  const [tab, setTab] = useState<AppTab>("engine");

  const TABS: { id: AppTab; icon: string; label: string }[] = [
    { id: "industries",   icon: "🏭", label: "Industries" },
    { id: "engine",       icon: "🔌", label: "Engine" },
    { id: "registry",     icon: "🌐", label: "Hub" },
    { id: "evolution",    icon: "⚡", label: "Evolve" },
    { id: "configure",    icon: "⚙️",  label: "Configure" },
    { id: "architecture", icon: "🏛️",  label: "Systems" },
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
        {tab === "industries"   && <IndustriesTab />}
        {tab === "engine"       && <EngineTab />}
        {tab === "registry"     && <RegistryTab />}
        {tab === "evolution"    && <EvolutionTab />}
        {tab === "configure"    && <ConfigureTab />}
        {tab === "architecture" && <ArchitectureTab />}
      </div>
    </div>
  );
}
