import React, { useState, useEffect, useCallback } from "react";
import { useOS, type AppId } from "@/os/OSContext";

interface InternalAd {
  id: string; type: string; placement: string[]; headline: string;
  body: string; cta: string; ctaLink: string; color: string;
  priority: number; active: boolean;
}

const CTA_APP_MAP: Record<string, AppId> = {
  "Get Enterprise":       "adsOrchestrator" as AppId,
  "Start Free Trial":     "paygate"         as AppId,
  "Get Healthcare Bundle":"healthos"        as AppId,
  "Get Legal Bundle":     "legalpm"         as AppId,
  "Get Invention Layer":  "inventionLayer"  as AppId,
  "Get Referral Link":    "adsOrchestrator" as AppId,
};

interface InternalAdBannerProps {
  placement?: string;
  compact?: boolean;
}

export function InternalAdBanner({ placement = "all", compact = false }: InternalAdBannerProps) {
  const { openApp } = useOS();
  const [ads, setAds]       = useState<InternalAd[]>([]);
  const [idx, setIdx]       = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/ads/internal")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.ads) {
          const filtered = (d.ads as InternalAd[]).filter(
            a => a.active && (a.placement.includes("all") || a.placement.includes(placement))
          ).sort((a, b) => a.priority - b.priority);
          setAds(filtered);
        }
      })
      .catch(() => {});
  }, [placement]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = compact ? 6000 : 8000;
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % ads.length); setVisible(true); }, 300);
    }, interval);
    return () => clearInterval(t);
  }, [ads.length, compact]);

  const activeAds = ads.filter(a => !dismissed.has(a.id));
  if (!activeAds.length) return null;

  const ad = activeAds[idx % activeAds.length];
  if (!ad) return null;

  const handleCta = () => {
    const appId = CTA_APP_MAP[ad.cta];
    if (appId) { openApp(appId); }
    else { window.open(ad.ctaLink, "_blank"); }
  };

  if (compact) {
    return (
      <div
        style={{
          background: `linear-gradient(90deg, ${ad.color}12, ${ad.color}06)`,
          borderBottom: `1px solid ${ad.color}25`,
          borderLeft: `2px solid ${ad.color}`,
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
          cursor: "pointer",
          flexShrink: 0,
        }}
        onClick={handleCta}
      >
        <div style={{ fontSize: 10, fontWeight: 700, color: ad.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
          {ad.headline}
        </div>
        <div style={{ background: ad.color, color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
          {ad.cta}
        </div>
        <button
          onClick={e => { e.stopPropagation(); setDismissed(d => new Set([...d, ad.id])); }}
          style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 12, cursor: "pointer", padding: "0 2px", lineHeight: 1, flexShrink: 0 }}
          title="Dismiss"
        >×</button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${ad.color}18, ${ad.color}08)`,
        border: `1px solid ${ad.color}30`,
        borderLeft: `3px solid ${ad.color}`,
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
        cursor: "pointer",
        marginTop: 8,
      }}
      onClick={handleCta}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: ad.color, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {ad.headline}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {ad.body}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <div style={{ background: ad.color, color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
          {ad.cta}
        </div>
        {activeAds.length > 1 && (
          <div style={{ display: "flex", gap: 3 }}>
            {activeAds.map((_, i) => (
              <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: i === idx % activeAds.length ? ad.color : "#e2e8f0" }} />
            ))}
          </div>
        )}
      </div>
      <button
        onClick={e => { e.stopPropagation(); setDismissed(d => new Set([...d, ad.id])); }}
        style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 14, cursor: "pointer", padding: "2px 4px", lineHeight: 1, flexShrink: 0 }}
        title="Dismiss"
      >×</button>
    </div>
  );
}
