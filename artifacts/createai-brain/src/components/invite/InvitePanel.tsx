import React from "react";
import { getVisibleSurfaces, type InviteSurface } from "./registry";
import InviteCard from "./InviteCard";

interface Props {
  onClose?: () => void;
}

export default function InvitePanel({ onClose }: Props) {
  const surfaces = getVisibleSurfaces();
  const [active, setActive] = React.useState<InviteSurface>(surfaces[0]!);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", width: "100%", maxWidth: 400 }}>
      {/* Title bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>Invite & Join</span>
        {onClose && (
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#9ca3af" }}>✕</button>
        )}
      </div>

      {/* Surface picker tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {surfaces.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: "pointer", border: "none",
              background: active.id === s.id ? (s.color ?? "#9CAF88") : "#f3f4f6",
              color: active.id === s.id ? "#fff" : "#374151",
              transition: "background .15s",
            }}
          >
            {s.icon && <span>{s.icon}</span>}
            {s.title}
          </button>
        ))}
      </div>

      {/* Active card */}
      <InviteCard surface={active} />
    </div>
  );
}
