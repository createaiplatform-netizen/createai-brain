import React from "react";
import { InvitePanel } from "./invite";

export default function BroadcastFloatingTrigger() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={styles.fab as React.CSSProperties}
        title="Invite & Join"
      >
        +
      </button>

      {open && (
        <div style={styles.overlay as React.CSSProperties} onClick={() => setOpen(false)}>
          <div style={styles.modal as React.CSSProperties} onClick={e => e.stopPropagation()}>
            <InvitePanel onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  fab: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#007bff",
    color: "white",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    zIndex: 9999,
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9998,
  },
  modal: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    maxWidth: "420px",
    width: "90%",
  },
};
