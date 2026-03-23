/**
 * usePushNotifications — Web Push opt-in hook
 * --------------------------------------------
 * 1. Fetches the VAPID public key from the API
 * 2. Requests Notification permission on demand
 * 3. Subscribes via the service worker PushManager
 * 4. POSTs the subscription to /api/push/subscribe
 * 5. Exposes permission state + subscribe / unsubscribe helpers
 */

import { useState, useEffect, useCallback } from "react";

export type PushPermission = "default" | "granted" | "denied";

export interface UsePushNotificationsReturn {
  permission: PushPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  isSupported: boolean;
  requestAndSubscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0))).buffer as ArrayBuffer;
}

async function getVapidKey(): Promise<string | null> {
  try {
    const res = await fetch("/api/push/vapid-key", { credentials: "include" });
    if (!res.ok) return null;
    const { publicKey } = (await res.json()) as { publicKey?: string };
    return publicKey ?? null;
  } catch {
    return null;
  }
}

async function postSubscription(sub: PushSubscription): Promise<void> {
  const json = sub.toJSON();
  await fetch("/api/push/subscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      keys: { p256dh: json.keys?.["p256dh"] ?? "", auth: json.keys?.["auth"] ?? "" },
    }),
  });
}

async function deleteSubscription(sub: PushSubscription): Promise<void> {
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const isSupported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  const [permission, setPermission]   = useState<PushPermission>(
    isSupported ? (Notification.permission as PushPermission) : "denied",
  );
  const [isSubscribed, setSubscribed] = useState(false);
  const [isLoading, setLoading]       = useState(false);

  // Check existing subscription on mount
  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => setSubscribed(!!sub))
      .catch(() => {});
  }, [isSupported]);

  const requestAndSubscribe = useCallback(async () => {
    if (!isSupported) return;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== "granted") return;

      const vapidKey = await getVapidKey();
      if (!vapidKey) {
        console.warn("[Push] VAPID key not available — push not configured yet");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) { setSubscribed(true); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:    true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await postSubscription(sub);
      setSubscribed(true);
    } catch (err) {
      console.error("[Push] Subscribe failed:", err);
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await deleteSubscription(sub);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error("[Push] Unsubscribe failed:", err);
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  return { permission, isSubscribed, isLoading, isSupported, requestAndSubscribe, unsubscribe };
}
