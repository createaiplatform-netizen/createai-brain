import React, { useState, useEffect, useCallback } from "react";
import { relativeTime } from "@/ael/time";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  appId: string | null;
  projectId: string | null;
  createdAt: string;
}


function typeIcon(type: string) {
  switch (type) {
    case "success":  return "✅";
    case "warning":  return "⚠️";
    case "error":    return "❌";
    case "ai":       return "🧠";
    case "project":  return "📁";
    case "people":   return "👥";
    case "doc":      return "📄";
    case "task":     return "✓";
    default:         return "🔔";
  }
}

function typeColor(type: string) {
  switch (type) {
    case "success":  return "rgba(34,197,94,0.15)";
    case "warning":  return "rgba(245,158,11,0.15)";
    case "error":    return "rgba(239,68,68,0.15)";
    case "ai":       return "rgba(139,92,246,0.15)";
    case "project":  return "rgba(99,102,241,0.15)";
    default:         return "rgba(99,102,241,0.10)";
  }
}

async function apiFetchNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
  try {
    const r = await fetch("/api/notifications?limit=100", { credentials: "include" });
    if (!r.ok) return { notifications: [], unreadCount: 0 };
    return await r.json() as { notifications: Notification[]; unreadCount: number };
  } catch { return { notifications: [], unreadCount: 0 }; }
}

async function apiMarkRead(id: number): Promise<void> {
  await fetch(`/api/notifications/${id}/read`, { method: "PUT", credentials: "include" });
}

async function apiMarkAllRead(): Promise<void> {
  await fetch("/api/notifications/read-all", { method: "PUT", credentials: "include" });
}

async function apiDelete(id: number): Promise<void> {
  await fetch(`/api/notifications/${id}`, { method: "DELETE", credentials: "include" });
}

async function apiClearAll(): Promise<void> {
  await fetch("/api/notifications", { method: "DELETE", credentials: "include" });
}

export function NotificationsApp() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = useCallback(async () => {
    const result = await apiFetchNotifications();
    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: number) => {
    await apiMarkRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await apiMarkAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotif = async (id: number) => {
    await apiDelete(id);
    const notif = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notif && !notif.read) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = async () => {
    if (!confirm("Clear all notifications? This cannot be undone.")) return;
    await apiClearAll();
    setNotifications([]);
    setUnreadCount(0);
  };

  const visible = filter === "unread" ? notifications.filter(n => !n.read) : notifications;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0 space-y-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <h2 className="text-[20px] font-bold text-white" style={{ letterSpacing: "-0.03em" }}>
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full align-middle"
                  style={{ background: "rgba(99,102,241,0.25)", color: "#a5b4fc" }}>
                  {unreadCount} new
                </span>
              )}
            </h2>
            <p className="text-[12px] text-gray-500 mt-0.5">{notifications.length} total</p>
          </div>
          <div className="flex gap-1.5">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-all"
                style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.20)" }}>
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearAll}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-all"
                style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.15)" }}>
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          {([["all", "All"], ["unread", "Unread"]] as const).map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-1 py-2 text-[12px] font-semibold transition-all"
              style={filter === f
                ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc" }
                : { background: "transparent", color: "#475569" }}>
              {label}
              {f === "unread" && unreadCount > 0 && ` (${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 py-12 justify-center text-[13px] text-gray-500">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-5xl">🔔</p>
            <p className="text-[16px] font-bold text-white">
              {filter === "unread" ? "All caught up!" : "No notifications yet"}
            </p>
            <p className="text-[13px] text-gray-500 max-w-xs mx-auto">
              {filter === "unread"
                ? "You've read all your notifications."
                : "Notifications from your apps, projects, and team will appear here."}
            </p>
          </div>
        ) : (
          visible.map(notif => (
            <div key={notif.id}
              className="flex items-start gap-3 p-4 rounded-2xl transition-all group"
              style={{
                background: notif.read ? "rgba(14,18,42,0.50)" : "rgba(14,18,42,0.85)",
                border: `1px solid ${notif.read ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.20)"}`,
              }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0"
                style={{ background: typeColor(notif.type) }}>
                {typeIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { if (!notif.read) markRead(notif.id); }}>
                <div className="flex items-center gap-2">
                  <p className={`text-[13px] font-${notif.read ? "medium" : "bold"} ${notif.read ? "text-gray-400" : "text-white"} truncate`}>
                    {notif.title}
                  </p>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#6366f1" }} />
                  )}
                </div>
                {notif.body && (
                  <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                )}
                <p className="text-[10px] text-gray-600 mt-1">
                  {relativeTime(notif.createdAt)}
                  {notif.appId && ` · ${notif.appId}`}
                </p>
              </div>
              <button
                onClick={() => deleteNotif(notif.id)}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] flex-shrink-0 transition-all"
                style={{ color: "#f87171", background: "rgba(239,68,68,0.10)" }}>
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
