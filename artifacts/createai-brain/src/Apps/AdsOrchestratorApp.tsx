import React, { useState, useEffect, useCallback } from "react";

const API = "/api";

type Tab = "overview" | "networks" | "campaigns" | "internal" | "reporting" | "guide" | "creatives" | "tracking";

interface NetworkSummary {
  id: string; name: string; platforms: string[]; icon: string; color: string;
  connected: boolean; credentialsSet: number; credentialsTotal: number;
  readyToDeploy: boolean; campaignCount: number; setupTime: string; minBudgetDay: number;
  setupUrl: string;
  credentialFields: { key: string; label: string; placeholder: string; helpUrl: string; set: boolean }[];
}
interface Campaign {
  id: string; networkId: string; name: string; objective: string; audience: string;
  dailyBudget: number; creative: { format: string; headline: string; body: string; cta: string };
  networkName: string; networkIcon: string; networkColor: string;
  networkConnected: boolean; deployStatus: string;
}
interface InternalAd {
  id: string; type: string; placement: string[]; headline: string; body: string;
  cta: string; ctaLink: string; color: string; priority: number; active: boolean;
}
interface NetworkReport {
  networkId: string; name: string; connected: boolean;
  impressions: number | null; clicks: number | null; spend: number | null;
  leads: number | null; cpc: number | null; ctr: number | null; note: string;
}
interface AdStatus {
  ok: boolean; networksLive: number; networksTotal: number; campaignsReady: number;
  campaignsQueued: number; campaignsTotal: number; internalAdsLive: number;
  summary: string; requiredActions: { category: string; timeRequired: string; actions: { network: string; setupTime: string; setupUrl: string; steps: { item: string; note: string }[] }[] }[];
}
interface CreativeSet {
  campaignId: string; networkId: string; campaignName: string; generatedAt: string;
  headlines: string[]; bodies: string[]; hooks: string[]; ctas: string[];
  hashtags: string[]; keywords: string[]; longFormCopy: string;
  primaryHeadline: string; primaryBody: string; primaryCta: string;
}
interface TrackingLink {
  networkId: string; networkName: string; campaignId: string; campaignName: string;
  offerId: string; offerName: string; offerPrice: string; url: string; shortParams: string;
}
interface Offer {
  id: string; name: string; price: string; baseUrl: string; category: string; paymentNote: string;
}

export default function AdsOrchestratorApp() {
  const [tab, setTab]               = useState<Tab>("overview");
  const [status, setStatus]         = useState<AdStatus | null>(null);
  const [networks, setNetworks]     = useState<NetworkSummary[]>([]);
  const [campaigns, setCampaigns]   = useState<Campaign[]>([]);
  const [internalAds, setInternal]  = useState<InternalAd[]>([]);
  const [report, setReport]         = useState<NetworkReport[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedNet, setSelectedNet] = useState<NetworkSummary | null>(null);
  const [inputs, setInputs]         = useState<Record<string, string>>({});
  const [saving, setSaving]         = useState<Record<string, boolean>>({});
  const [saved, setSaved]           = useState<Record<string, string>>({});
  const [copied, setCopied]         = useState<string | null>(null);
  const [launching, setLaunching]   = useState<Record<string, boolean>>({});
  const [launchResults, setLaunchResults] = useState<Record<string, { ok: boolean; launched: number; activateUrl: string; nextStep: string; error?: string }>>({});
  const [launchingAll, setLaunchingAll] = useState(false);
  const [creatives, setCreatives]   = useState<CreativeSet[]>([]);
  const [trackingLinks, setTrackingLinks] = useState<TrackingLink[]>([]);
  const [offers, setOffers]         = useState<Offer[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult]   = useState<{ generated: number; skipped: number; errors: string[] } | null>(null);
  const [expandedCreative, setExpandedCreative] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [st, nw, cp, ia, rp, cr, tl] = await Promise.all([
        fetch(`${API}/ads/status`).then(r => r.json()).catch(() => null),
        fetch(`${API}/ads/networks`).then(r => r.json()).catch(() => null),
        fetch(`${API}/ads/campaigns`).then(r => r.json()).catch(() => null),
        fetch(`${API}/ads/internal`).then(r => r.json()).catch(() => null),
        fetch(`${API}/ads/reporting`).then(r => r.json()).catch(() => null),
        fetch(`${API}/ads/creatives`).then(r => r.json()).catch(() => null),
        fetch(`${API}/ads/tracking-links`).then(r => r.json()).catch(() => null),
      ]);
      if (st?.ok)  setStatus(st);
      if (nw?.ok)  setNetworks(nw.networks ?? []);
      if (cp?.ok)  setCampaigns(cp.campaigns ?? []);
      if (ia?.ok)  setInternal(ia.ads ?? []);
      if (rp?.ok)  setReport(rp.byNetwork ?? []);
      if (cr?.ok)  setCreatives(cr.creatives ?? []);
      if (tl?.ok)  { setTrackingLinks(tl.links ?? []); setOffers(tl.offers ?? []); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveCred = async (key: string, networkId: string) => {
    const val = inputs[key]?.trim();
    if (!val) return;
    setSaving(s => ({ ...s, [key]: true }));
    try {
      const r = await fetch(`${API}/ads/credentials/set`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: val }),
      });
      const d = await r.json();
      setSaved(s => ({ ...s, [key]: d.message ?? (d.ok ? "Saved" : d.error) }));
      setInputs(i => ({ ...i, [key]: "" }));
      await load();
      if (selectedNet?.id === networkId) {
        const nr = await fetch(`${API}/ads/networks/${networkId}`).then(r => r.json());
        if (nr.ok) setSelectedNet({ ...selectedNet, ...nr.network });
      }
    } catch { setSaved(s => ({ ...s, [key]: "Network error" })); }
    finally { setSaving(sv => ({ ...sv, [key]: false })); }
  };

  const clearCred = async (key: string) => {
    await fetch(`${API}/ads/credentials/${key}`, { method: "DELETE" });
    await load();
  };

  const launchNet = async (networkId: string) => {
    setLaunching(l => ({ ...l, [networkId]: true }));
    try {
      const r = await fetch(`${API}/ads/launch/${networkId}`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const d = await r.json();
      setLaunchResults(lr => ({ ...lr, [networkId]: { ok: d.ok, launched: d.launched ?? 0, activateUrl: d.activateUrl ?? "", nextStep: d.nextStep ?? d.error ?? "Done", error: d.ok ? undefined : (d.error ?? d.nextStep) } }));
      await load();
    } catch { setLaunchResults(lr => ({ ...lr, [networkId]: { ok: false, launched: 0, activateUrl: "", nextStep: "Network error", error: "Network error" } })); }
    finally { setLaunching(l => ({ ...l, [networkId]: false })); }
  };

  const launchAll = async () => {
    setLaunchingAll(true);
    try {
      const r = await fetch(`${API}/ads/launch/all`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const d = await r.json();
      if (d.results) {
        const newResults: typeof launchResults = {};
        for (const res of d.results) { newResults[res.networkId] = { ok: res.ok, launched: res.launched, activateUrl: res.activateUrl, nextStep: res.nextStep, error: res.error }; }
        setLaunchResults(lr => ({ ...lr, ...newResults }));
      }
      await load();
    } catch { /* ignore */ }
    finally { setLaunchingAll(false); }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const liveCount  = networks.filter(n => n.connected).length;
  const totalNets  = networks.length;
  const objColor   = (o: string) => ({ awareness: "#60a5fa", traffic: "#34d399", leads: "#a78bfa", conversions: "#f59e0b", retargeting: "#f87171" }[o] ?? "#64748b");

  if (loading) return (
    <div style={{ background: "#020617", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontFamily: "Inter,sans-serif" }}>
      Loading Ad Orchestrator…
    </div>
  );

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#e2e8f0", fontFamily: "'Inter',sans-serif", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e1b4b)", borderBottom: "1px solid #1e293b", padding: "26px 32px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#f1f5f9" }}>Universal Ad Orchestrator</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              {liveCount}/{totalNets} networks connected
              {" · "}{status?.campaignsTotal ?? 0} campaigns pre-built
              {" · "}{status?.internalAdsLive ?? 0} internal ads live now
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <div style={{ background: status?.internalAdsLive ? "#052e16" : "#0f172a", border: `1px solid ${status?.internalAdsLive ? "#166534" : "#1e293b"}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, color: status?.internalAdsLive ? "#4ade80" : "#475569" }}>
              {status?.internalAdsLive ?? 0} Internal Ads Live
            </div>
            <div style={{ background: liveCount > 0 ? "#052e16" : "#0f172a", border: `1px solid ${liveCount > 0 ? "#166534" : "#1e293b"}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, color: liveCount > 0 ? "#4ade80" : "#475569" }}>
              {liveCount}/{totalNets} Networks
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "#0f172a", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {([["overview","📊 Overview"],["networks","🌐 Networks"],["campaigns","🚀 Campaigns"],["internal","📢 Internal Ads"],["reporting","📈 Reporting"],["guide","📋 Setup Guide"],["creatives","✍️ Creatives"],["tracking","🔗 Tracking"]] as [Tab,string][]).map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "#6366f1" : "transparent", color: tab === t ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 32px 0" }}>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div>
            {/* LAUNCH ALL row */}
            {liveCount > 0 && (
              <div style={{ background: "#1e1b4b", border: "2px solid #6366f1", borderRadius: 12, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>🚀 {liveCount} network{liveCount > 1 ? "s" : ""} connected — ready to launch</div>
                  <div style={{ fontSize: 11, color: "#818cf8", marginTop: 3 }}>Campaigns deploy and create on each network immediately. One click per network to activate spend.</div>
                </div>
                <button
                  onClick={launchAll}
                  disabled={launchingAll}
                  style={{ background: "#6366f1", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: launchingAll ? "not-allowed" : "pointer", opacity: launchingAll ? 0.6 : 1, whiteSpace: "nowrap" }}>
                  {launchingAll ? "Launching all…" : `🚀 LAUNCH ALL ${liveCount} Networks`}
                </button>
              </div>
            )}

            {/* Status banner */}
            <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, padding: "16px 20px", marginBottom: 20, fontSize: 13, color: "#93c5fd", lineHeight: 1.7 }}>
              <strong style={{ color: "#60a5fa", display: "block", marginBottom: 4 }}>How this system works</strong>
              Every campaign is pre-built and queued. The moment you enter credentials for a network in the <strong>Networks</strong> tab, those campaigns are ready to deploy with one click. Internal platform ads are live right now across the OS — no accounts needed. External network campaigns require only a one-time account + billing setup per network.
            </div>

            {/* 5 stat tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Networks Live",      value: liveCount + "/" + totalNets,         color: liveCount > 0 ? "#4ade80" : "#475569" },
                { label: "Campaigns Queued",   value: status?.campaignsQueued ?? 0,         color: "#818cf8" },
                { label: "Campaigns Ready",    value: status?.campaignsReady ?? 0,          color: "#4ade80" },
                { label: "Internal Ads Live",  value: (status?.internalAdsLive ?? 0) + " ads", color: "#34d399" },
                { label: "Actions Required",   value: status?.networksTotal === liveCount ? "✓ None" : totalNets - liveCount + " setups", color: "#f59e0b" },
              ].map(tile => (
                <div key={tile.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: tile.color, marginBottom: 4 }}>{String(tile.value)}</div>
                  <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tile.label}</div>
                </div>
              ))}
            </div>

            {/* Network grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {networks.map(net => (
                <div key={net.id} onClick={() => { setSelectedNet(net); setTab("networks"); }}
                  style={{ background: "#0f172a", border: `1px solid ${net.connected ? "#166534" : "#1e293b"}`, borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "border-color 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{net.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9" }}>{net.name}</span>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: net.connected ? "#22c55e" : "#334155", boxShadow: net.connected ? "0 0 6px #22c55e" : "none" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>{net.platforms.join(" · ")}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: net.connected ? "#4ade80" : "#64748b" }}>
                      {net.connected ? "✓ Connected" : `${net.credentialsSet}/${net.credentialsTotal} credentials`}
                    </span>
                    <span style={{ fontSize: 11, color: "#6366f1" }}>{net.campaignCount} campaigns →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── NETWORKS ─────────────────────────────────────────────────────────── */}
        {tab === "networks" && (
          <div style={{ display: "flex", gap: 20 }}>
            {/* Network list */}
            <div style={{ width: 240, flexShrink: 0 }}>
              {networks.map(net => (
                <div key={net.id} onClick={() => setSelectedNet(net)}
                  style={{ background: selectedNet?.id === net.id ? "#1e1b4b" : "#0f172a", border: `1px solid ${selectedNet?.id === net.id ? "#6366f1" : net.connected ? "#166534" : "#1e293b"}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{net.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{net.name}</div>
                      <div style={{ fontSize: 10, color: net.connected ? "#4ade80" : "#475569", marginTop: 2 }}>
                        {net.connected ? "Connected" : `${net.credentialsSet}/${net.credentialsTotal} creds`}
                      </div>
                    </div>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: net.connected ? "#22c55e" : "#334155" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Network detail */}
            <div style={{ flex: 1 }}>
              {!selectedNet ? (
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "40px", textAlign: "center", color: "#475569" }}>
                  Select a network to see setup steps and enter credentials
                </div>
              ) : (
                <div>
                  <div style={{ background: "#0f172a", border: `1px solid ${selectedNet.connected ? "#166534" : "#1e293b"}`, borderRadius: 14, padding: "22px 24px", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <span style={{ fontSize: 28 }}>{selectedNet.icon}</span>
                      <div>
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f1f5f9" }}>{selectedNet.name}</h2>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{selectedNet.platforms.join(" · ")} · Setup: {selectedNet.setupTime} · Min ${selectedNet.minBudgetDay}/day</div>
                      </div>
                      {selectedNet.connected && <span style={{ marginLeft: "auto", background: "#052e16", color: "#4ade80", padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>✓ CONNECTED</span>}
                    </div>

                    {/* Credential fields */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Credentials</div>
                      {selectedNet.credentialFields.map(cf => (
                        <div key={cf.key} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: cf.set ? "#22c55e" : "#334155" }} />
                            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{cf.label}</span>
                            {cf.set && <span style={{ fontSize: 10, color: "#4ade80" }}>Active</span>}
                            <a href={cf.helpUrl} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: "#6366f1", marginLeft: "auto" }}>Where to find ↗</a>
                          </div>
                          {cf.set ? (
                            <div style={{ display: "flex", gap: 6 }}>
                              <div style={{ flex: 1, background: "#052e16", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#4ade80" }}>Credential active</div>
                              <button onClick={() => clearCred(cf.key)} style={{ background: "#1c0a0a", color: "#f87171", border: "1px solid #450a0a", borderRadius: 8, padding: "8px 12px", fontSize: 11, cursor: "pointer" }}>Clear</button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: 6 }}>
                              <input
                                type="password"
                                placeholder={cf.placeholder}
                                value={inputs[cf.key] ?? ""}
                                onChange={e => setInputs(i => ({ ...i, [cf.key]: e.target.value }))}
                                onKeyDown={e => { if (e.key === "Enter") saveCred(cf.key, selectedNet.id); }}
                                style={{ flex: 1, background: "#020617", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#f1f5f9", fontSize: 12, outline: "none" }}
                              />
                              <button
                                onClick={() => saveCred(cf.key, selectedNet.id)}
                                disabled={saving[cf.key] || !inputs[cf.key]?.trim()}
                                style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: (saving[cf.key] || !inputs[cf.key]?.trim()) ? 0.5 : 1 }}>
                                {saving[cf.key] ? "…" : "Save"}
                              </button>
                            </div>
                          )}
                          {saved[cf.key] && <div style={{ marginTop: 4, fontSize: 11, color: saved[cf.key].includes("error") || saved[cf.key].includes("Error") ? "#f87171" : "#4ade80" }}>{saved[cf.key]}</div>}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <a href={selectedNet.setupUrl} target="_blank" rel="noreferrer"
                        style={{ background: "#1e293b", color: "#e2e8f0", padding: "10px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                        Open Dashboard ↗
                      </a>
                      {selectedNet.connected && (
                        <button
                          onClick={() => launchNet(selectedNet.id)}
                          disabled={!!launching[selectedNet.id]}
                          style={{ background: "#6366f1", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: launching[selectedNet.id] ? "not-allowed" : "pointer", opacity: launching[selectedNet.id] ? 0.6 : 1 }}>
                          {launching[selectedNet.id] ? "Launching…" : "🚀 LAUNCH Campaigns"}
                        </button>
                      )}
                    </div>

                    {/* Launch result for this network */}
                    {launchResults[selectedNet.id] && (
                      <div style={{ marginTop: 14, background: launchResults[selectedNet.id].ok ? "#052e16" : "#1c0a0a", border: `1px solid ${launchResults[selectedNet.id].ok ? "#166534" : "#450a0a"}`, borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: launchResults[selectedNet.id].ok ? "#4ade80" : "#f87171", marginBottom: 6 }}>
                          {launchResults[selectedNet.id].ok ? `✓ ${launchResults[selectedNet.id].launched} campaigns created` : "Launch error"}
                        </div>
                        <div style={{ fontSize: 12, color: launchResults[selectedNet.id].ok ? "#86efac" : "#fca5a5", marginBottom: launchResults[selectedNet.id].activateUrl ? 10 : 0 }}>
                          {launchResults[selectedNet.id].nextStep}
                        </div>
                        {launchResults[selectedNet.id].activateUrl && launchResults[selectedNet.id].ok && (
                          <a href={launchResults[selectedNet.id].activateUrl} target="_blank" rel="noreferrer"
                            style={{ display: "inline-block", background: "#4ade80", color: "#052e16", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                            Activate Campaigns →
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Campaigns for this network */}
                  <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "20px 22px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>Pre-Built Campaigns ({campaigns.filter(c => c.networkId === selectedNet.id).length})</div>
                    {campaigns.filter(c => c.networkId === selectedNet.id).map(c => (
                      <div key={c.id} style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9" }}>{c.name}</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <span style={{ background: "#1e293b", color: objColor(c.objective), padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{c.objective}</span>
                            <span style={{ background: "#1e293b", color: "#94a3b8", padding: "2px 8px", borderRadius: 6, fontSize: 10 }}>${c.dailyBudget}/day</span>
                            <span style={{ background: c.deployStatus === "ready" ? "#052e16" : "#172036", color: c.deployStatus === "ready" ? "#4ade80" : "#60a5fa", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                              {c.deployStatus === "ready" ? "READY" : "QUEUED"}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{c.creative.format}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}><strong style={{ color: "#e2e8f0" }}>Headline:</strong> {c.creative.headline}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{c.creative.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CAMPAIGNS ────────────────────────────────────────────────────────── */}
        {tab === "campaigns" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {[
                { label: "All", count: campaigns.length, filter: "all" },
                { label: "Ready to Deploy", count: campaigns.filter(c => c.deployStatus === "ready").length, filter: "ready" },
                { label: "Queued (need creds)", count: campaigns.filter(c => c.deployStatus === "queued").length, filter: "queued" },
              ].map(f => (
                <div key={f.filter} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 16px" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: f.filter === "ready" ? "#4ade80" : f.filter === "queued" ? "#818cf8" : "#f1f5f9" }}>{f.count}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{f.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {campaigns.map(c => (
                <div key={c.id} style={{ background: "#0f172a", border: `1px solid ${c.deployStatus === "ready" ? "#1e3a20" : "#1e293b"}`, borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ fontSize: 20, marginTop: 2 }}>{c.networkIcon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>{c.name}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <span style={{ background: "#1e293b", color: objColor(c.objective), padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "capitalize" }}>{c.objective}</span>
                          <span style={{ background: "#1e293b", color: "#94a3b8", padding: "2px 8px", borderRadius: 6, fontSize: 10 }}>${c.dailyBudget}/day</span>
                          <span style={{ background: c.deployStatus === "ready" ? "#052e16" : "#172036", color: c.deployStatus === "ready" ? "#4ade80" : "#818cf8", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                            {c.deployStatus === "ready" ? "✓ READY" : "⏳ QUEUED"}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{c.networkName} · {c.creative.format}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div style={{ background: "#020617", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>Headline</div>
                          <div style={{ fontSize: 12, color: "#e2e8f0" }}>{c.creative.headline}</div>
                        </div>
                        <div style={{ background: "#020617", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>Target Audience</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.audience}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── INTERNAL ADS ─────────────────────────────────────────────────────── */}
        {tab === "internal" && (
          <div>
            <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#4ade80", lineHeight: 1.6 }}>
              <strong>✓ All {internalAds.filter(a => a.active).length} internal ads are live right now</strong> — no external accounts, billing, or verification required. These are served within the platform immediately.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
              {internalAds.map(ad => (
                <div key={ad.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "20px 22px", borderTop: `3px solid ${ad.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ background: ad.active ? "#052e16" : "#1c0a0a", color: ad.active ? "#4ade80" : "#f87171", padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                      {ad.active ? "✓ LIVE" : "PAUSED"}
                    </span>
                    <span style={{ background: "#1e293b", color: "#94a3b8", padding: "2px 8px", borderRadius: 6, fontSize: 10, textTransform: "uppercase" }}>{ad.type}</span>
                  </div>
                  <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{ad.headline}</h3>
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{ad.body}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ background: "#1e293b", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#e2e8f0", fontWeight: 600 }}>{ad.cta} →</div>
                    <div style={{ fontSize: 10, color: "#475569" }}>Placement: {ad.placement.join(", ")}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REPORTING ────────────────────────────────────────────────────────── */}
        {tab === "reporting" && (
          <div>
            <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#93c5fd", lineHeight: 1.6 }}>
              <strong style={{ color: "#60a5fa" }}>Live reporting activates per-network</strong> as credentials are entered and campaigns begin spending. Performance data appears after the first 24h of spend per network.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {report.map(r => {
                const net = networks.find(n => n.id === r.networkId);
                return (
                  <div key={r.networkId} style={{ background: "#0f172a", border: `1px solid ${r.connected ? "#1e3a20" : "#1e293b"}`, borderRadius: 12, padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 18 }}>{net?.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>{r.name}</span>
                      <span style={{ background: r.connected ? "#052e16" : "#0f172a", color: r.connected ? "#4ade80" : "#475569", border: `1px solid ${r.connected ? "#166534" : "#334155"}`, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                        {r.connected ? "Connected" : "Not connected"}
                      </span>
                    </div>
                    {r.connected ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
                        {[
                          { label: "Impressions", value: r.impressions },
                          { label: "Clicks",      value: r.clicks },
                          { label: "Spend",       value: r.spend !== null ? "$" + r.spend : null },
                          { label: "Leads",       value: r.leads },
                          { label: "CPC",         value: r.cpc !== null ? "$" + r.cpc?.toFixed(2) : null },
                        ].map(m => (
                          <div key={m.label} style={{ background: "#020617", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: m.value !== null ? "#4ade80" : "#334155" }}>{m.value ?? "—"}</div>
                            <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{m.label}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "#475569" }}>{r.note}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SETUP GUIDE ──────────────────────────────────────────────────────── */}
        {tab === "guide" && (
          <div>
            <div style={{ background: "#1c0a0a", border: "2px solid #7c2d12", borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#fed7aa", marginBottom: 8 }}>Your Required Actions (unavoidable — identity + billing only)</div>
              <div style={{ fontSize: 13, color: "#fdba74", lineHeight: 1.7 }}>
                Every single campaign is already pre-built. All creative, targeting, budgets, and copy are configured.
                The only thing that requires your involvement is creating an account and adding a payment method at each ad network — because these require your legal name and a billing card. Once you complete those steps and paste the API credentials here, everything deploys automatically.
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "#f97316", fontWeight: 600 }}>
                ⏱ Total estimated time: 2–4 hours across all networks (can be done in sessions).
                Networks with API review delays (Google, Twitter) are noted separately.
              </div>
            </div>

            {networks.filter(n => !n.connected).map((net, i) => (
              <div key={net.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "20px 24px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1e1b4b", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                  <span style={{ fontSize: 18 }}>{net.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>{net.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{net.setupTime} · ${net.minBudgetDay}/day minimum</div>
                  </div>
                  <a href={net.setupUrl} target="_blank" rel="noreferrer"
                    style={{ marginLeft: "auto", background: "#6366f1", color: "#fff", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                    Open Dashboard ↗
                  </a>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Identity + Billing steps (your actions)</div>
                    {networks.find(nn => nn.id === net.id) && status?.requiredActions[0]?.actions.find(a => a.network === net.name)?.steps.map((step, si) => (
                      <div key={si} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#7c2d12", color: "#fed7aa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{si + 1}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
                          <strong style={{ color: "#e2e8f0" }}>{step.item}:</strong> {step.note}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Then enter credentials here</div>
                    {net.credentialFields.map(cf => (
                      <div key={cf.key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: cf.set ? "#22c55e" : "#334155", flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: cf.set ? "#4ade80" : "#94a3b8" }}>{cf.label}</span>
                        {!cf.set && (
                          <button onClick={() => { setSelectedNet(net); setTab("networks"); }}
                            style={{ background: "none", border: "none", color: "#6366f1", fontSize: 10, cursor: "pointer", marginLeft: "auto" }}>Enter →</button>
                        )}
                      </div>
                    ))}
                    <div style={{ marginTop: 8, fontSize: 11, color: "#475569" }}>
                      {net.campaignCount} campaigns queued — auto-deploy when credentials entered
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {liveCount === networks.length && (
              <div style={{ background: "#052e16", border: "2px solid #166534", borderRadius: 14, padding: "24px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#4ade80" }}>All {networks.length} networks connected</div>
                <div style={{ fontSize: 13, color: "#4ade80", marginTop: 4 }}>No further action required — all campaigns are ready to deploy</div>
              </div>
            )}
          </div>
        )}

        {/* ── CREATIVES ─────────────────────────────────────────────────────────── */}
        {tab === "creatives" && (
          <div>
            {/* Header + Generate button */}
            <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>AI-Generated Ad Creatives</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {creatives.length > 0
                    ? `${creatives.length}/15 campaigns have generated creatives — headlines, copy variants, hooks, CTAs, hashtags, and keywords`
                    : "No creatives generated yet. Click Generate All to use GPT-4o to write platform-optimized copy for all 15 campaigns."
                  }
                </div>
              </div>
              <button
                onClick={async () => {
                  setGenerating(true); setGenResult(null);
                  try {
                    const r = await fetch(`${API}/ads/creatives/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
                    const d = await r.json();
                    setGenResult(d);
                    await load();
                  } catch { /* ignore */ }
                  finally { setGenerating(false); }
                }}
                disabled={generating}
                style={{ background: "#6366f1", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.6 : 1, whiteSpace: "nowrap" }}>
                {generating ? "Generating…" : "✍️ Generate All Creatives"}
              </button>
            </div>

            {genResult && (
              <div style={{ background: genResult.errors.length > 0 ? "#1c0a0a" : "#052e16", border: `1px solid ${genResult.errors.length > 0 ? "#450a0a" : "#166534"}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: genResult.errors.length > 0 ? "#f87171" : "#4ade80" }}>
                  {genResult.generated} generated · {genResult.skipped} already cached · {genResult.errors.length} errors
                </div>
                {genResult.errors.length > 0 && <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 4 }}>{genResult.errors.join(", ")}</div>}
              </div>
            )}

            {creatives.length === 0 && !generating && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✍️</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b" }}>No creatives generated yet</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Click Generate All to write GPT-4o ad copy for all 15 campaigns</div>
              </div>
            )}

            {creatives.map(c => {
              const network = networks.find(n => n.id === c.networkId);
              const isExpanded = expandedCreative === c.campaignId;
              return (
                <div key={c.campaignId} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "18px 22px", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isExpanded ? 16 : 0, cursor: "pointer" }} onClick={() => setExpandedCreative(isExpanded ? null : c.campaignId)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{network?.icon ?? "📡"}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{c.campaignName}</div>
                        <div style={{ fontSize: 11, color: "#475569" }}>{c.networkName ?? c.networkId} · Generated {new Date(c.generatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ background: "#1e293b", padding: "3px 10px", borderRadius: 6, fontSize: 11, color: "#94a3b8" }}>{c.headlines.length} headlines</div>
                      <span style={{ color: "#475569" }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      {/* Headlines */}
                      <div style={{ background: "#020617", borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Headlines</div>
                        {c.headlines.map((h, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <div style={{ flex: 1, fontSize: 12, color: "#e2e8f0", lineHeight: 1.4 }}>{h}</div>
                            <button onClick={() => { navigator.clipboard.writeText(h); copy(h, `h-${c.campaignId}-${i}`); }} style={{ background: "none", border: "1px solid #334155", borderRadius: 6, color: "#64748b", fontSize: 10, padding: "2px 8px", cursor: "pointer" }}>
                              {copied === `h-${c.campaignId}-${i}` ? "✓" : "Copy"}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Hooks / Scroll-Stoppers */}
                      <div style={{ background: "#020617", borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Scroll-Stop Hooks</div>
                        {c.hooks.map((h, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <div style={{ flex: 1, fontSize: 12, color: "#e2e8f0", lineHeight: 1.4 }}>{h}</div>
                            <button onClick={() => { navigator.clipboard.writeText(h); copy(h, `hook-${c.campaignId}-${i}`); }} style={{ background: "none", border: "1px solid #334155", borderRadius: 6, color: "#64748b", fontSize: 10, padding: "2px 8px", cursor: "pointer" }}>
                              {copied === `hook-${c.campaignId}-${i}` ? "✓" : "Copy"}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Body copy */}
                      <div style={{ background: "#020617", borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Body Copy Variants</div>
                        {c.bodies.map((b, i) => (
                          <div key={i} style={{ background: "#0f172a", borderRadius: 8, padding: "8px 10px", marginBottom: 8, display: "flex", gap: 8 }}>
                            <div style={{ flex: 1, fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>{b}</div>
                            <button onClick={() => { navigator.clipboard.writeText(b); copy(b, `body-${c.campaignId}-${i}`); }} style={{ background: "none", border: "1px solid #334155", borderRadius: 6, color: "#64748b", fontSize: 10, padding: "2px 8px", cursor: "pointer", alignSelf: "flex-start" }}>
                              {copied === `body-${c.campaignId}-${i}` ? "✓" : "Copy"}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* CTAs + Keywords/Hashtags */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ background: "#020617", borderRadius: 10, padding: "14px 16px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#8b5cf6", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>CTA Variants</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {c.ctas.map((cta, i) => (
                              <button key={i} onClick={() => { navigator.clipboard.writeText(cta); copy(cta, `cta-${c.campaignId}-${i}`); }}
                                style={{ background: copied === `cta-${c.campaignId}-${i}` ? "#10b981" : "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                {cta}
                              </button>
                            ))}
                          </div>
                        </div>
                        {(c.keywords.length > 0 || c.hashtags.length > 0) && (
                          <div style={{ background: "#020617", borderRadius: 10, padding: "14px 16px" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#06b6d4", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                              {c.keywords.length > 0 ? "Keywords" : "Hashtags"}
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {(c.keywords.length > 0 ? c.keywords : c.hashtags).map((kw, i) => (
                                <span key={i} onClick={() => { navigator.clipboard.writeText(kw); }}
                                  style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#94a3b8", cursor: "pointer" }}>
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Long-form copy */}
                      {c.longFormCopy && (
                        <div style={{ gridColumn: "1 / -1", background: "#020617", borderRadius: 10, padding: "14px 16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#f472b6", textTransform: "uppercase", letterSpacing: 1 }}>Long-Form / Video Script</div>
                            <button onClick={() => { navigator.clipboard.writeText(c.longFormCopy); copy(c.longFormCopy, `lf-${c.campaignId}`); }} style={{ background: "none", border: "1px solid #334155", borderRadius: 6, color: "#64748b", fontSize: 10, padding: "2px 8px", cursor: "pointer" }}>
                              {copied === `lf-${c.campaignId}` ? "✓ Copied" : "Copy All"}
                            </button>
                          </div>
                          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{c.longFormCopy}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── TRACKING LINKS ────────────────────────────────────────────────────── */}
        {tab === "tracking" && (
          <div>
            {/* Offer catalog */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>Offer Catalog — {offers.length} Monetizable Products</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                {offers.map(offer => (
                  <div key={offer.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{offer.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#6366f1", marginBottom: 6 }}>{offer.price}</div>
                    <div style={{ fontSize: 11, color: "#475569" }}>{offer.paymentNote}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking links by network */}
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>
              UTM Tracking Links — {trackingLinks.length} total ({networks.length} networks × campaigns)
            </div>
            {networks.map(net => {
              const netLinks = trackingLinks.filter(l => l.networkId === net.id);
              if (!netLinks.length) return null;
              return (
                <div key={net.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "18px 22px", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 18 }}>{net.icon}</span>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{net.name}</div>
                    <div style={{ marginLeft: "auto", fontSize: 11, color: "#475569" }}>{netLinks.length} links</div>
                  </div>
                  {netLinks.map(link => (
                    <div key={link.campaignId} style={{ background: "#020617", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{link.campaignName}</div>
                          <div style={{ fontSize: 11, color: "#6366f1", marginTop: 2 }}>{link.offerName} · {link.offerPrice}</div>
                        </div>
                        <button
                          onClick={() => { navigator.clipboard.writeText(link.url); copy(link.url, `tl-${link.campaignId}`); }}
                          style={{ background: copied === `tl-${link.campaignId}` ? "#10b981" : "#1e293b", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                          {copied === `tl-${link.campaignId}` ? "✓ Copied" : "Copy URL"}
                        </button>
                      </div>
                      <div style={{ background: "#0f172a", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#475569", fontFamily: "monospace", wordBreak: "break-all" }}>
                        {link.url}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {trackingLinks.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b" }}>Tracking links are being generated…</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Reload the page if this persists</div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
