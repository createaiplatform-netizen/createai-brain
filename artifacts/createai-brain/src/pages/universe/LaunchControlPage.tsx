// ─── Launch & Outbound Control ────────────────────────────────────────────────
// Admin/founder-only screen. Single control surface for enabling platform
// outbound systems. All changes persist to platform_feature_flags table
// and are logged to the admin audit trail.

import { useState, useEffect, useCallback } from "react";

const SAGE   = "#7a9068";
const CREAM  = "#faf9f6";
const TEXT   = "#1a1916";
const MUTED  = "#6b6660";
const BORDER = "rgba(122,144,104,0.13)";

interface LaunchFlag {
  key:         string;
  group:       string;
  label:       string;
  description: string;
  noopNote?:   string;
  enabled:     boolean;
}

const GROUP_ORDER = [
  "Platform",
  "Access",
  "Family outbound",
  "Marketing outbound",
  "Ads",
];

const GROUP_ICONS: Record<string, string> = {
  "Platform":          "🚀",
  "Access":            "🔑",
  "Family outbound":   "🏡",
  "Marketing outbound":"📧",
  "Ads":               "📢",
};

export default function LaunchControlPage() {
  const [flags,   setFlags]   = useState<LaunchFlag[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [result,  setResult]  = useState<{ ok: boolean; message: string } | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/launch/config", { credentials: "include" });
      const data = (await res.json()) as { ok: boolean; config: LaunchFlag[] };
      if (data.ok) {
        setFlags(data.config);
        const init: Record<string, boolean> = {};
        for (const f of data.config) init[f.key] = f.enabled;
        setChecked(init);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadConfig(); }, [loadConfig]);

  const handleApply = async () => {
    setSaving(true);
    setResult(null);
    try {
      const res  = await fetch("/api/launch/apply", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ flags: checked }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      setResult({ ok: data.ok, message: data.message });
      if (data.ok) await loadConfig();
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setSaving(false);
    }
  };

  // Group flags
  const grouped: Record<string, LaunchFlag[]> = {};
  for (const f of flags) {
    if (!grouped[f.group]) grouped[f.group] = [];
    grouped[f.group]!.push(f);
  }

  const anyChanged = flags.some(f => (checked[f.key] ?? false) !== f.enabled);
  const enabledCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-5 pb-10">

      {/* Header card */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: `1px solid ${BORDER}` }}>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: `${SAGE}14` }}>
            🎛️
          </div>
          <div>
            <p className="text-[17px] font-black" style={{ color: TEXT }}>Launch &amp; Outbound Control</p>
            <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
              Founder / Admin only. Enable or disable platform outbound systems.
              Each flag is persisted to the database and logged. Nothing sends until explicitly enabled here.
            </p>
          </div>
        </div>
      </div>

      {/* Flag groups */}
      {loading ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: "white", border: `1px solid ${BORDER}` }}>
          <p className="text-[13px]" style={{ color: MUTED }}>Loading launch configuration…</p>
        </div>
      ) : (
        <>
          {GROUP_ORDER.filter(g => grouped[g]?.length).map(group => (
            <div key={group} className="rounded-2xl p-5" style={{ background: "white", border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{GROUP_ICONS[group] ?? "⚙️"}</span>
                <p className="text-[15px] font-black" style={{ color: TEXT }}>{group}</p>
              </div>

              <div className="flex flex-col gap-3">
                {(grouped[group] ?? []).map(flag => (
                  <label
                    key={flag.key}
                    className="flex items-start gap-3 px-4 py-4 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: checked[flag.key] ? `${SAGE}08` : `${CREAM}`,
                      border: `1.5px solid ${checked[flag.key] ? `${SAGE}35` : BORDER}`,
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={checked[flag.key] ?? false}
                        onChange={e =>
                          setChecked(prev => ({ ...prev, [flag.key]: e.target.checked }))
                        }
                        className="w-4 h-4 rounded cursor-pointer"
                        style={{ accentColor: SAGE }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-bold" style={{ color: TEXT }}>{flag.label}</p>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: checked[flag.key] ? `${SAGE}18` : "rgba(107,102,96,0.1)",
                            color:      checked[flag.key] ? SAGE        : MUTED,
                          }}
                        >
                          {checked[flag.key] ? "ON" : "OFF"}
                        </span>
                      </div>
                      <p className="text-[12px] mt-1" style={{ color: MUTED, lineHeight: 1.55 }}>
                        {flag.description}
                      </p>
                      {flag.noopNote && (
                        <p className="text-[11px] mt-1.5 px-2 py-1 rounded-lg inline-block"
                          style={{ background: "rgba(196,169,122,0.12)", color: "#8a7040" }}>
                          ⚠️ {flag.noopNote}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Confirm & Launch */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: `1px solid ${BORDER}` }}>
            <p className="text-[13px] mb-4 leading-relaxed" style={{ color: MUTED }}>
              By confirming, I understand this will activate all checked outbound systems
              and start sending real messages where configured. This action is logged.
              {enabledCount > 0 && (
                <span className="block mt-1 font-semibold" style={{ color: TEXT }}>
                  {enabledCount} system{enabledCount !== 1 ? "s" : ""} will be enabled.
                </span>
              )}
            </p>

            {result && (
              <div
                className="px-4 py-3 rounded-xl mb-4 text-[13px] font-semibold"
                style={{
                  background: result.ok ? `${SAGE}10` : "rgba(197,48,48,0.08)",
                  color:      result.ok ? SAGE        : "#c53030",
                  border:     `1px solid ${result.ok ? `${SAGE}30` : "rgba(197,48,48,0.2)"}`,
                }}
              >
                {result.ok ? "✅" : "⚠️"} {result.message}
              </div>
            )}

            <button
              onClick={() => void handleApply()}
              disabled={saving}
              className="w-full py-3.5 rounded-xl text-[15px] font-black text-white transition-all"
              style={{
                background: saving ? `${SAGE}80` : SAGE,
                cursor:     saving ? "wait" : "pointer",
              }}
            >
              {saving ? "Applying…" : anyChanged ? "Launch Selected Systems →" : "Save Configuration →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Mini status summary — embed in Agency tab or Overview */
export function LaunchStatusSummary({ compact = false }: { compact?: boolean }) {
  const [flags, setFlags] = useState<LaunchFlag[]>([]);

  useEffect(() => {
    fetch("/api/launch/config", { credentials: "include" })
      .then(r => r.json())
      .then((d: { ok: boolean; config: LaunchFlag[] }) => {
        if (d.ok) setFlags(d.config);
      })
      .catch(() => {});
  }, []);

  if (flags.length === 0) return null;

  if (compact) {
    const on  = flags.filter(f => f.enabled).length;
    const off = flags.filter(f => !f.enabled).length;
    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: on > 0 ? `${SAGE}18` : "rgba(107,102,96,0.1)", color: on > 0 ? SAGE : MUTED }}>
          {on} ON
        </span>
        <span className="text-[11px]" style={{ color: MUTED }}>{off} OFF</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: "white", border: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🎛️</span>
        <p className="text-[13px] font-black" style={{ color: TEXT }}>Launch Systems Status</p>
      </div>
      <div className="flex flex-col gap-1.5">
        {flags.map(f => (
          <div key={f.key} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg"
            style={{ background: CREAM }}>
            <p className="text-[12px] font-semibold flex-1 min-w-0 truncate" style={{ color: TEXT }}>
              {f.label}
            </p>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: f.enabled ? `${SAGE}18` : "rgba(107,102,96,0.1)",
                color:      f.enabled ? SAGE        : MUTED,
              }}
            >
              {f.enabled ? "ON" : "OFF"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
