import React from "react";
import QRCode from "qrcode";

export default function BroadcastInvite({
  title = "Join My Broadcast Network",
  message = "Get direct updates instantly.",
  link = "/broadcast"
}) {
  const [qr, setQr] = React.useState("");

  React.useEffect(() => {
    QRCode.toDataURL(link).then(setQr);
  }, [link]);

  return (
    <div style={styles.container}>
      <h2>{title}</h2>
      <p>{message}</p>

      <a href={link} style={styles.joinButton}>
        Join Broadcast
      </a>

      {qr && <img src={qr} alt="QR Code" style={styles.qr} />}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    maxWidth: "320px"
  },
  joinButton: {
    display: "inline-block",
    padding: "10px 16px",
    background: "#007bff",
    color: "white",
    borderRadius: "8px",
    textDecoration: "none",
    marginTop: "12px"
  },
  qr: {
    marginTop: "16px",
    width: "140px",
    height: "140px"
  }
};
