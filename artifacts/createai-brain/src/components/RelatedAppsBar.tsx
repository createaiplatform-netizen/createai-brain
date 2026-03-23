// ═══════════════════════════════════════════════════════════════════════════
// RelatedAppsBar — horizontal strip of 3 apps from the same category.
// Sits after the AppWindow breadcrumb. Non-blocking, renders nothing if <2 peers.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import { ALL_APPS, AppDef, AppId } from "@/os/OSContext";
import { useOS } from "@/os/OSContext";

interface Props {
  currentId: AppId;
  category?: AppDef["category"];
}

export function RelatedAppsBar({ currentId, category }: Props) {
  const { openApp } = useOS();

  const peers = useMemo(() => {
    if (!category) return [];
    return ALL_APPS
      .filter(a => a.category === category && a.id !== currentId && a.enabled !== false)
      .slice(0, 3);
  }, [currentId, category]);

  if (peers.length < 2) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 14px",
        height: 32,
        background: "rgba(122,144,104,0.05)",
        borderBottom: "1px solid rgba(122,144,104,0.12)",
        flexShrink: 0,
        overflowX: "auto",
      }}
    >
      <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap", flexShrink: 0 }}>
        Also in {category}:
      </span>
      {peers.map(app => (
        <button
          key={app.id}
          onClick={() => openApp(app.id as AppId)}
          title={app.description}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            height: 22,
            padding: "0 9px",
            borderRadius: 20,
            border: "1px solid rgba(122,144,104,0.20)",
            background: "rgba(122,144,104,0.07)",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 500,
            color: "#4b5563",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "background 0.13s, border-color 0.13s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(122,144,104,0.15)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(122,144,104,0.35)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(122,144,104,0.07)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(122,144,104,0.20)";
          }}
        >
          <span style={{ fontSize: 12 }}>{app.icon}</span>
          <span>{app.label}</span>
        </button>
      ))}
    </div>
  );
}
