import React, { useState, useEffect, useCallback } from "react";

const API = "/api";

interface CredStatus {
  key: string; label: string; channel: string; set: boolean; source: "bridge"|"env"|"none"; helpUrl: string;
}
interface CredDef {
  key: string; label: string; channel: string; description: string; placeholder: string; helpUrl: string;
}
interface DnsRecord {
  type: string; name: string; value: string; ttl: string; verified: boolean;
  godaddy: { type: string; host: string; value: string; ttl: string };
  namecheap: { type: string; host: string; value: string; ttl: string };
  cloudflare: { type: string; name: string; content: string; proxy: boolean; ttl: string };
}

type Tab = "tokens" | "dns" | "links";

export default function CredentialsHubApp() {
  const [status, setStatus]       = useState<CredStatus[]>([]);
  const [defs, setDefs]           = useState<CredDef[]>([]);
  const [dns, setDns]             = useState<{ ok: boolean; domain?: string; verified?: boolean; records?: DnsRecord[]; instructions?: string; actionUrl?: string; status?: string; error?: string } | null>(null);
  const [tab, setTab]             = useState<Tab>("tokens");
  const [inputs, setInputs]       = useState<Record<string, string>>({});
  const [saving, setSaving]       = useState<Record<string, boolean>>({});
  const [saved, setSaved]         = useState<Record<string, string>>({});
  const [dnsLoading, setDnsLoading] = useState(false);
  const [copied, setCopied]       = useState<string | null>(null);
  const [registrar, setRegistrar] = useState<"godaddy"|"namecheap"|"cloudflare">("godaddy");

  const load = useCallback(async () => {
    const [sRes, dRes] = await Promise.all([
      fetch(`${API}/credentials/status`).then(r => r.json()).catch(() => null),
      fetch(`${API}/credentials/defs`).then(r => r.json()).catch(() => null),
    ]);
    if (sRes?.credentials) setStatus(sRes.credentials);
    if (dRes?.defs)        setDefs(dRes.defs);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDns = async () => {
    setDnsLoading(true);
    try {
      const r = await fetch(`${API}/credentials/dns-records`);
      setDns(await r.json());
    } catch { setDns({ ok: false, error: "Could not reach API" }); }
    finally { setDnsLoading(false); }
  };

  useEffect(() => { if (tab === "dns") loadDns(); }, [tab]);

  const handleSave = async (key: string) => {
    const val = inputs[key]?.trim();
    if (!val) return;
    setSaving(s => ({ ...s, [key]: true }));
    try {
      const r = await fetch(`${API}/credentials/set`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: val }),
      });
      const d = await r.json();
      if (d.ok) {
        setSaved(s => ({ ...s, [key]: d.message }));
        setInputs(i => ({ ...i, [key]: "" }));
        await load();
      } else {
        setSaved(s => ({ ...s, [key]: "Error: " + d.error }));
      }
    } catch { setSaved(s => ({ ...s, [key]: "Network error" })); }
    finally { setSaving(sv => ({ ...sv, [key]: false })); }
  };

  const handleClear = async (key: string) => {
    await fetch(`${API}/credentials/clear/${key}`, { method: "DELETE" });
    await load();
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const statusFor = (key: string) => status.find(s => s.key === key);
  const defFor    = (key: string) => defs.find(d => d.key === key);
  const live      = status.filter(s => s.set).length;

  const reg = (rec: DnsRecord) => registrar === "godaddy"
    ? { ...rec.godaddy, label_name: "Host", label_value: "Value" }
    : registrar === "namecheap"
    ? { type: rec.namecheap.type, host: rec.namecheap.host, label_name: "Host", label_value: "Value", value: rec.namecheap.value, ttl: rec.namecheap.ttl }
    : { type: rec.cloudflare.type, host: rec.cloudflare.name, label_name: "Name", label_value: "Content", value: rec.cloudflare.content, ttl: rec.cloudflare.ttl };

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#e2e8f0", fontFamily: "'Inter', sans-serif", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e1b4b)", borderBottom: "1px solid #1e293b", padding: "26px 32px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔗</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#f1f5f9" }}>Credentials Hub</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              Enter API tokens here — they activate instantly without navigating to Replit Secrets.
              {live > 0 ? <span style={{ color: "#4ade80", marginLeft: 8 }}>✓ {live}/{status.length} channels live</span> : null}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 32px 0" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#0f172a", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {(["tokens","dns","links"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "#6366f1" : "transparent", color: tab === t ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {t === "tokens" ? "🔑 Marketplace Tokens" : t === "dns" ? "🌐 Resend DNS Setup" : "🔗 Client Link Bypass"}
            </button>
          ))}
        </div>

        {/* ── TOKENS TAB ──────────────────────────────────────────────────────── */}
        {tab === "tokens" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, padding: "14px 18px", marginBottom: 4, fontSize: 13, color: "#93c5fd", lineHeight: 1.6 }}>
              <strong style={{ color: "#60a5fa" }}>How this works:</strong> Enter a token below. It saves to an encrypted local store, injects directly into the running server, and immediately activates publishing to that marketplace. No Replit Secrets navigation, no restart required.
            </div>

            {defs.map(def => {
              const st    = statusFor(def.key);
              const isLive = st?.set ?? false;
              return (
                <div key={def.key} style={{ background: "#0f172a", border: `1px solid ${isLive ? "#166534" : "#1e293b"}`, borderRadius: 14, padding: "20px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: isLive ? "#22c55e" : "#334155", boxShadow: isLive ? "0 0 8px #22c55e" : "none" }} />
                      <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 14 }}>{def.label}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {isLive && (
                        <span style={{ background: "#052e16", color: "#4ade80", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>✓ LIVE</span>
                      )}
                      {st?.source === "bridge" && (
                        <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "3px 10px", borderRadius: 6, fontSize: 11 }}>bridge</span>
                      )}
                      {st?.source === "env" && (
                        <span style={{ background: "#172036", color: "#60a5fa", padding: "3px 10px", borderRadius: 6, fontSize: 11 }}>env</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, lineHeight: 1.5 }}>{def.description}</div>

                  {!isLive ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="password"
                        placeholder={def.placeholder}
                        value={inputs[def.key] ?? ""}
                        onChange={e => setInputs(i => ({ ...i, [def.key]: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") handleSave(def.key); }}
                        style={{ flex: 1, background: "#020617", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", color: "#f1f5f9", fontSize: 13, outline: "none" }}
                      />
                      <button
                        onClick={() => handleSave(def.key)}
                        disabled={saving[def.key] || !inputs[def.key]?.trim()}
                        style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", opacity: (saving[def.key] || !inputs[def.key]?.trim()) ? 0.5 : 1 }}
                      >
                        {saving[def.key] ? "Saving…" : "Activate"}
                      </button>
                      <a href={def.helpUrl} target="_blank" rel="noreferrer" style={{ background: "#1e293b", color: "#94a3b8", border: "none", borderRadius: 8, padding: "10px 14px", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center" }}>Get token ↗</a>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, background: "#052e16", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#4ade80" }}>
                        Token active — {def.channel} publishing is live
                      </div>
                      <button onClick={() => handleClear(def.key)} style={{ background: "#1c0a0a", color: "#f87171", border: "1px solid #450a0a", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
                        Clear
                      </button>
                    </div>
                  )}

                  {saved[def.key] && (
                    <div style={{ marginTop: 8, fontSize: 12, color: saved[def.key].startsWith("Error") ? "#f87171" : "#4ade80" }}>
                      {saved[def.key]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── DNS TAB ─────────────────────────────────────────────────────────── */}
        {tab === "dns" && (
          <div>
            <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#93c5fd", lineHeight: 1.6 }}>
              <strong style={{ color: "#60a5fa" }}>Email activation:</strong> Adding these DNS records to your domain registrar verifies LakesideTrinity.com with Resend and unlocks full email delivery to any client address. This is a one-time action.
            </div>

            {dnsLoading && <div style={{ color: "#475569", padding: 40, textAlign: "center" }}>Fetching DNS records from Resend…</div>}

            {dns && !dnsLoading && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div style={{ fontSize: 14, color: dns.verified ? "#4ade80" : "#f59e0b", fontWeight: 700 }}>
                    {dns.verified ? "✓ Domain verified — email delivery active" : dns.domain ? `⚠ ${dns.domain} — verification pending` : "Domain setup required"}
                  </div>
                  {!dns.verified && dns.actionUrl && (
                    <a href={dns.actionUrl} target="_blank" rel="noreferrer" style={{ background: "#6366f1", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Open Resend Dashboard ↗</a>
                  )}
                </div>

                {dns.instructions && (
                  <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#94a3b8" }}>
                    {dns.instructions}
                  </div>
                )}

                {dns.records && dns.records.length > 0 && (
                  <>
                    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                      <span style={{ fontSize: 13, color: "#64748b", marginRight: 8, alignSelf: "center" }}>Format for:</span>
                      {(["godaddy","namecheap","cloudflare"] as const).map(r => (
                        <button key={r} onClick={() => setRegistrar(r)} style={{ background: registrar === r ? "#6366f1" : "#1e293b", color: registrar === r ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                          {r === "godaddy" ? "GoDaddy" : r === "namecheap" ? "Namecheap" : "Cloudflare"}
                        </button>
                      ))}
                    </div>

                    {dns.records.map((rec, i) => {
                      const r = reg(rec);
                      return (
                        <div key={i} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "18px 20px", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{rec.type}</span>
                            {rec.verified && <span style={{ color: "#4ade80", fontSize: 12 }}>✓ Verified</span>}
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {[
                              { lbl: r.label_name ?? "Host", val: r.host },
                              { lbl: r.label_value ?? "Value", val: r.value },
                              { lbl: "Type", val: r.type },
                              { lbl: "TTL", val: r.ttl },
                            ].map(field => (
                              <div key={field.lbl} style={{ background: "#020617", borderRadius: 8, padding: "10px 12px" }}>
                                <div style={{ fontSize: 10, color: "#475569", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>{field.lbl}</div>
                                <div style={{ fontSize: 12, color: "#f1f5f9", wordBreak: "break-all", fontFamily: "monospace" }}>{field.val}</div>
                                <button onClick={() => copy(field.val, `${i}-${field.lbl}`)} style={{ background: "none", border: "none", color: copied === `${i}-${field.lbl}` ? "#4ade80" : "#6366f1", fontSize: 11, cursor: "pointer", padding: "4px 0 0", fontWeight: 600 }}>
                                  {copied === `${i}-${field.lbl}` ? "✓ Copied" : "Copy"}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {dns.error && (
                  <div style={{ background: "#1c0a0a", border: "1px solid #450a0a", borderRadius: 10, padding: "12px 16px", color: "#f87171", fontSize: 13 }}>
                    {dns.error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── LINKS TAB ─────────────────────────────────────────────────────── */}
        {tab === "links" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "#93c5fd", lineHeight: 1.6 }}>
              <strong style={{ color: "#60a5fa" }}>Email bypass:</strong> Every invoice has a shareable client link. Share it by text, WhatsApp, DM, or any channel. The client sees the full invoice with Cash App and Venmo payment instructions — no email needed.
            </div>

            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "24px 26px" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>How to share an invoice link</div>
              {[
                "Create an invoice in PayGate",
                'Copy the "Client Link" that appears (format: /api/payments/invoice/{id}/html)',
                "Send the link to your client via text, WhatsApp, email, or any channel",
                "Client opens the link and sees their invoice with full Cash App + Venmo instructions",
                "Client pays — you tap Mark Paid in PayGate",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{step}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "24px 26px" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Zero email required</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>While Resend domain verification is pending, this link method delivers invoices to 100% of clients without any email infrastructure.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { channel: "📱 iMessage / SMS", note: "Paste the link — client taps to open" },
                  { channel: "💬 WhatsApp", note: "Link preview shows invoice details" },
                  { channel: "📧 Any email client", note: "Works regardless of Resend status" },
                  { channel: "🔗 Any other channel", note: "URL works on any device or browser" },
                ].map(c => (
                  <div key={c.channel} style={{ background: "#020617", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 3 }}>{c.channel}</div>
                    <div style={{ fontSize: 11, color: "#475569" }}>{c.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
