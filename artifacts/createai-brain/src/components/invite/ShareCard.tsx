/**
 * ShareCard — minimal shareable image-style card
 * ------------------------------------------------
 * Renders title, tagline, QR code, and optional icon.
 * Pulls all data from registry + ShareHelpers. No hardcoded surfaces.
 *
 * Usage:
 *   <ShareCard surfaceId="broadcast" />
 *   <ShareCard surfaceId="invite-someone" />
 */

import React from "react";
import QRCode from "qrcode";
import useInviteSurface from "./useInviteSurface";
import { getSharePayload } from "./ShareHelpers";

export default function ShareCard({ surfaceId }: { surfaceId: string }) {
  const surface = useInviteSurface(surfaceId);
  const [qr, setQr] = React.useState<string>("");

  React.useEffect(() => {
    if (surface?.link) {
      QRCode.toDataURL(surface.link).then(setQr).catch(() => {});
    }
  }, [surface]);

  if (!surface) return null;

  const share = getSharePayload(surfaceId);

  return (
    <div style={styles.card}>
      {surface.icon && <div style={styles.icon}>{surface.icon}</div>}
      <h2 style={styles.title}>{surface.title}</h2>
      <p style={styles.tagline}>{surface.tagline}</p>

      {qr && <img src={qr} alt="QR" style={styles.qr} />}

      <div style={styles.linkBox}>
        <code style={styles.code}>{share.url}</code>
      </div>
    </div>
  );
}

const styles = {
  card: {
    width: "280px",
    padding: "20px",
    borderRadius: "12px",
    background: "white",
    border: "1px solid #ddd",
    textAlign: "center" as const,
  },
  icon: {
    fontSize: "32px",
    marginBottom: "8px",
  },
  title: {
    margin: "0 0 6px 0",
    fontSize: "20px",
  },
  tagline: {
    margin: "0 0 12px 0",
    fontSize: "14px",
    color: "#555",
  },
  qr: {
    width: "140px",
    height: "140px",
    margin: "12px auto",
    display: "block",
  },
  linkBox: {
    marginTop: "12px",
    padding: "8px",
    background: "#f7f7f7",
    borderRadius: "8px",
  },
  code: {
    fontSize: "12px",
    wordBreak: "break-all" as const,
  },
};
