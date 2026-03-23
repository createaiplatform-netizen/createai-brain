/**
 * EmbeddedInvite — lightweight wrapper for strategic placement
 * ------------------------------------------------------------
 * Drop on any page, dashboard, onboarding screen, empty state, or success screen.
 * Pulls all data from registry.ts — no props required beyond the surface id.
 *
 * Usage:
 *   <EmbeddedInvite id="broadcast" />
 *   <EmbeddedInvite id="invite-someone" compact />
 */

import InviteCard from "./InviteCard";
import { getSurface } from "./registry";

interface Props {
  id:      string;
  compact?: boolean;
}

export default function EmbeddedInvite({ id, compact }: Props) {
  const surface = getSurface(id);
  if (!surface) return null;

  if (compact) {
    const color = surface.color ?? "#9CAF88";
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        background: color + "18", border: `1px solid ${color}44`,
        borderRadius: 40, padding: "7px 16px",
      }}>
        {surface.icon && <span style={{ fontSize: 16 }}>{surface.icon}</span>}
        <span style={{ fontSize: 13, color, fontWeight: 600 }}>{surface.tagline}</span>
        <a
          href={surface.link}
          style={{
            background: color, color: "#fff", textDecoration: "none",
            borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700,
          }}
        >
          {surface.joinLabel ?? "Join"}
        </a>
      </div>
    );
  }

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #f3f4f6",
      borderRadius: 16,
      padding: "20px",
      boxShadow: "0 2px 12px rgba(0,0,0,.06)",
    }}>
      <InviteCard surface={surface} />
    </div>
  );
}
