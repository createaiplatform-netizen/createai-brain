import React from "react";
import QRCode from "qrcode";
import type { InviteSurface } from "./registry";

interface Props {
  surface: InviteSurface;
  onClose?: () => void;
}

export default function InviteCard({ surface, onClose }: Props) {
  const [qr, setQr] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const color = surface.color ?? "#9CAF88";
  const fullLink = window.location.origin + surface.link;

  React.useEffect(() => {
    QRCode.toDataURL(fullLink, { width: 140, margin: 1 }).then(setQr).catch(() => {});
  }, [fullLink]);

  function copy() {
    navigator.clipboard?.writeText(fullLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        {surface.icon && <span style={{ fontSize: 26 }}>{surface.icon}</span>}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>{surface.title}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{surface.tagline}</div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>✕</button>
        )}
      </div>

      {/* QR + button */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 14 }}>
        {qr
          ? <img src={qr} alt="QR" width={100} height={100} style={{ borderRadius: 8, border: "1px solid #e5e7eb", flexShrink: 0 }} />
          : <div style={{ width: 100, height: 100, borderRadius: 8, background: "#f3f4f6", flexShrink: 0 }} />}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: "#4b5563", margin: "0 0 10px", lineHeight: 1.5 }}>
            Scan the QR code or click the button to join.
          </p>
          <a
            href={surface.link}
            style={{
              display: "block", textAlign: "center",
              background: color, color: "#fff", textDecoration: "none",
              borderRadius: 8, padding: "9px 0",
              fontSize: 13, fontWeight: 700,
            }}
          >
            {surface.joinLabel ?? "Join"}
          </a>
        </div>
      </div>

      {/* Link row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", borderRadius: 8, padding: "7px 10px" }}>
        <code style={{ flex: 1, fontSize: 10, color: "#374151", wordBreak: "break-all" }}>{fullLink}</code>
        <button onClick={copy} style={{ background: color, color: "#fff", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
