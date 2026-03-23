import React from "react";
import { getSurfacesForRoute, type InviteSurface } from "./registry";
import InviteCard from "./InviteCard";

const CATEGORY_LABELS: Record<string, string> = {
  invite:   "Invite & Share",
  internal: "Core",
  app:      "Tools",
  social:   "Social",
};

interface Props {
  onClose?: () => void;
}

export default function InvitePanel({ onClose }: Props) {
  const route   = typeof window !== "undefined" ? window.location.pathname : "/";
  const surfaces = getSurfacesForRoute(route);
  const [active, setActive] = React.useState<InviteSurface>(surfaces[0]!);

  // Group surfaces by category for section headers
  const groups = React.useMemo(() => {
    const seen = new Map<string, InviteSurface[]>();
    for (const s of surfaces) {
      const cat = s.category ?? "other";
      if (!seen.has(cat)) seen.set(cat, []);
      seen.get(cat)!.push(s);
    }
    return seen;
  }, [surfaces]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", width: "100%", maxWidth: 420 }}>
      {/* Title bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>Invite &amp; Join</span>
        {onClose && (
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}
          >✕</button>
        )}
      </div>

      {/* Grouped surface picker */}
      <div style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 10, maxHeight: 220, overflowY: "auto" }}>
        {[...groups.entries()].map(([cat, items]) => (
          <div key={cat}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>
              {CATEGORY_LABELS[cat] ?? cat}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {items.map(s => {
                const isActive  = active.id === s.id;
                const isRoute   = !!s.routeHint && route.startsWith(s.routeHint);
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s)}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "4px 11px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      cursor: "pointer",
                      border: isRoute && !isActive ? `1.5px solid ${s.color ?? "#9CAF88"}` : "none",
                      background: isActive ? (s.color ?? "#9CAF88") : "#f3f4f6",
                      color: isActive ? "#fff" : "#374151",
                      transition: "background .12s",
                    }}
                  >
                    {s.icon && <span style={{ fontSize: 13 }}>{s.icon}</span>}
                    <span>{s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#f3f4f6", marginBottom: 16 }} />

      {/* Active surface card */}
      <InviteCard surface={active} />
    </div>
  );
}
