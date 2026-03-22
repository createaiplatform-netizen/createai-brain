// ─── Offline Banner ──────────────────────────────────────────────────────────
// Detects offline state and shows a calm, non-alarming banner.
// Sensitive actions are automatically blocked when offline.
// Users can still view cached non-sensitive content.

import { useState, useEffect } from "react";

const SAGE = "#7a9068";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [wasOffline, setWasOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      if (wasOffline) {
        setJustReconnected(true);
        setTimeout(() => {
          setJustReconnected(false);
          setWasOffline(false);
        }, 3000);
      }
    }
    function handleOffline() {
      setIsOnline(false);
      setWasOffline(true);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !justReconnected) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] py-2 px-4 text-center text-[13px] font-semibold transition-all"
      style={{
        background: isOnline ? `${SAGE}18` : "rgba(107,102,96,0.92)",
        color: isOnline ? SAGE : "white",
        backdropFilter: "blur(8px)",
      }}
    >
      {isOnline
        ? "✓ Back online — all features available again"
        : "📶 No connection — you can still view your saved information. Actions that send data are paused until you reconnect."}
    </div>
  );
}

// Hook to check online status for blocking sensitive actions
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return isOnline;
}
