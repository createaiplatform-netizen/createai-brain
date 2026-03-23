/**
 * InviteBanner — compact banner that can be placed at top or bottom of any page
 * ----------------------------------------------------------------------------
 * Usage:
 *   <InviteBanner id="broadcast" position="bottom" />
 *   <InviteBanner id="invite-someone" position="top" />
 */

import { getSurface } from "./registry";

interface Props {
  id:         string;
  position?:  "top" | "bottom" | "inline";
  onDismiss?: () => void;
}

export default function InviteBanner({ id, position = "inline", onDismiss }: Props) {
  const surface = getSurface(id);
  if (!surface) return null;

  const color = surface.color ?? "#9CAF88";

  const fixed = position === "top" || position === "bottom";
  const posStyle = fixed
    ? {
        position: "fixed" as const,
        [position]: 0,
        left: 0, right: 0,
        zIndex: 8000,
      }
    : {};

  return (
    <div style={{
      ...posStyle,
      background: color,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 20px",
      fontFamily: "system-ui, sans-serif",
    }}>
      {surface.icon && <span style={{ fontSize: 20, flexShrink: 0 }}>{surface.icon}</span>}
      <span style={{ fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{surface.title}</span>
      <span style={{ fontSize: 13, opacity: .9, flex: 1 }}>{surface.tagline}</span>
      <a
        href={surface.link}
        style={{
          background: "rgba(255,255,255,.25)", color: "#fff",
          textDecoration: "none", borderRadius: 20, padding: "5px 16px",
          fontSize: 12, fontWeight: 700, flexShrink: 0, border: "1px solid rgba(255,255,255,.4)",
        }}
      >
        {surface.joinLabel ?? "Join"}
      </a>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,.7)", cursor: "pointer", fontSize: 18, flexShrink: 0, lineHeight: 1 }}
        >✕</button>
      )}
    </div>
  );
}
