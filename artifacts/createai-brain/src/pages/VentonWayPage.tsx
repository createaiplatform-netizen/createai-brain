import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@workspace/replit-auth-web";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VentonStatus {
  engine:        "online" | "degraded" | "offline";
  emailProvider: "configured" | "setup_required";
  smsProvider:   "configured" | "setup_required";
  queue: { pending: number; sent: number; failed: number; total: number };
  lastProcessed: string | null;
}

interface ChannelStatus {
  webPush:       { configured: boolean; subscriptions: number };
  smtpCustom:    { configured: boolean; connected: boolean; host: string; reason?: string };
  shareableLink: { configured: boolean };
  providerEmail: { configured: boolean };
  providerSms:   { configured: boolean };
}

interface LogEntry {
  id:          number;
  type:        "email" | "sms";
  recipient:   string;
  subject:     string | null;
  status:      "pending" | "sent" | "failed" | "retrying";
  attempts:    number;
  maxAttempts: number;
  result:      string | null;
  createdAt:   string;
  sentAt:      string | null;
}

const API = "/api/venton-way";

function fmt(ts: string | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_COLOR: Record<string, string> = {
  online:         "bg-[#9CAF88] text-white",
  degraded:       "bg-amber-400 text-white",
  offline:        "bg-red-500 text-white",
  configured:     "bg-[#9CAF88] text-white",
  setup_required: "bg-amber-400 text-slate-900",
  sent:           "text-[#7a9068] font-medium",
  failed:         "text-red-500 font-medium",
  pending:        "text-amber-600 font-medium",
  retrying:       "text-blue-500 font-medium",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function VentonWayPage() {
  const { user } = useAuth();
  const [status,    setStatus]    = useState<VentonStatus | null>(null);
  const [channels,  setChannels]  = useState<ChannelStatus | null>(null);
  const [logs,      setLogs]      = useState<LogEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [working,   setWorking]   = useState(false);
  const [toast,     setToast]     = useState<string | null>(null);

  // test send state
  const [testType,  setTestType]  = useState<"email" | "sms">("email");
  const [testTo,    setTestTo]    = useState("");
  const [testSubj,  setTestSubj]  = useState("VentonWay Test");
  const [testBody,  setTestBody]  = useState("This is a VentonWay delivery test.");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      const [sRes, lRes, cRes] = await Promise.all([
        fetch(API + "/status",       { credentials: "include" }),
        fetch(API + "/logs?limit=50",{ credentials: "include" }),
        fetch(API + "/channels",     { credentials: "include" }),
      ]);
      if (sRes.ok) setStatus(await sRes.json() as VentonStatus);
      if (lRes.ok) {
        const data = await lRes.json() as { logs: LogEntry[] };
        setLogs(data.logs ?? []);
      }
      if (cRes.ok) {
        const data = await cRes.json() as { channels: ChannelStatus };
        setChannels(data.channels ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const triggerQueue = async () => {
    setWorking(true);
    const res = await fetch(API + "/trigger", { method: "POST", credentials: "include" });
    const d = await res.json() as { processed?: number; sent?: number; failed?: number };
    showToast(`Processed ${d.processed ?? 0} — sent ${d.sent ?? 0}, failed ${d.failed ?? 0}`);
    await fetchData();
    setWorking(false);
  };

  const retry = async (id: number) => {
    const res = await fetch(`${API}/retry/${id}`, { method: "POST", credentials: "include" });
    const d = await res.json() as { ok: boolean };
    if (d.ok) { showToast("Message queued for retry"); void fetchData(); }
  };

  const sendTest = async () => {
    if (!testTo.trim()) { showToast("Enter a recipient first"); return; }
    setWorking(true);
    const res = await fetch(API + "/send-test", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: testType, recipient: testTo.trim(), subject: testSubj, body: testBody }),
    });
    const d = await res.json() as { ok: boolean; processed?: { sent?: number } };
    showToast(d.ok ? `Test sent (${d.processed?.sent ?? 0} delivered)` : "Test failed — check logs");
    await fetchData();
    setWorking(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-400 text-sm">Loading VentonWay…</div>
      </div>
    );
  }

  const q = status?.queue ?? { pending: 0, sent: 0, failed: 0, total: 0 };
  const needsSetup = status?.emailProvider === "setup_required" && status?.smsProvider === "setup_required";

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#7a9068] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#9CAF88] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">VentonWay Messaging Engine</h1>
              <p className="text-xs text-slate-400 mt-0.5">Internal delivery engine · Admin control panel</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${STATUS_COLOR[status?.engine ?? "offline"]}`}>
            {status?.engine ?? "unknown"}
          </span>
          <button
            onClick={() => void fetchData()}
            className="px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* Activation warning */}
        {needsSetup && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex gap-4 items-start">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">Delivery not yet active</p>
              <p className="text-xs text-amber-700 mt-1">
                To enable message delivery, complete one-time provider setup:
                verify your sending domain for email, and upgrade your messaging account for SMS.
                Messages will queue and deliver automatically once setup is complete.
              </p>
            </div>
          </div>
        )}

        {/* Delivery Channels */}
        <div className="bg-white border border-slate-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Delivery Channels — Priority Order</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <ChannelCard
              priority={1}
              label="Web Push"
              sublabel="Browser notifications"
              active={channels?.webPush.configured ?? false}
              detail={channels?.webPush.configured
                ? `${channels.webPush.subscriptions} subscription${channels.webPush.subscriptions !== 1 ? "s" : ""}`
                : "No subscribers yet"}
              always={false}
            />
            <ChannelCard
              priority={2}
              label="Custom SMTP"
              sublabel="Your own mail server"
              active={channels?.smtpCustom.connected ?? false}
              detail={channels?.smtpCustom.configured
                ? (channels.smtpCustom.connected ? channels.smtpCustom.host : `Unreachable: ${channels.smtpCustom.reason ?? "check config"}`)
                : "Set SMTP_HOST to activate"}
              always={false}
            />
            <ChannelCard
              priority={3}
              label="Shareable Link"
              sublabel="Zero-dependency delivery"
              active={true}
              detail="Always generated — works on any device"
              always={true}
            />
            <ChannelCard
              priority={4}
              label="Provider Email"
              sublabel="Email delivery"
              active={channels?.providerEmail.configured ?? false}
              detail={channels?.providerEmail.configured ? "Configured" : "Add credentials to activate"}
              always={false}
            />
            <ChannelCard
              priority={5}
              label="Provider SMS"
              sublabel="SMS delivery"
              active={channels?.providerSms.configured ?? false}
              detail={channels?.providerSms.configured ? "Configured" : "Add credentials to activate"}
              always={false}
            />
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Each message is routed through channels 1→5 in order. The first successful channel wins. Shareable links are always generated regardless of delivery outcome.
          </p>
        </div>

        {/* Provider + Queue Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ProviderCard label="Email Delivery" status={status?.emailProvider ?? "setup_required"} />
          <ProviderCard label="SMS Delivery"   status={status?.smsProvider   ?? "setup_required"} />
          <StatCard label="Pending"  value={q.pending} color="text-amber-600" />
          <StatCard label="Sent"     value={q.sent}    color="text-[#7a9068]" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Failed"    value={q.failed} color="text-red-500" />
          <StatCard label="Total"     value={q.total}  color="text-slate-700" />
          <div className="col-span-2 bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Last processed</p>
              <p className="text-sm font-medium text-slate-700 mt-0.5">{fmt(status?.lastProcessed ?? null)}</p>
            </div>
            <button
              disabled={working}
              onClick={() => void triggerQueue()}
              className="px-4 py-2 bg-[#9CAF88] text-white text-xs font-semibold rounded-lg hover:bg-[#7a9068] disabled:opacity-50 transition"
            >
              {working ? "Processing…" : "Process Queue"}
            </button>
          </div>
        </div>

        {/* Send Test Message */}
        <div className="bg-white border border-slate-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Send Test Message</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                {(["email","sms"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTestType(t)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      testType === t ? "bg-[#9CAF88] text-white border-[#9CAF88]" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#9CAF88]"
                placeholder={testType === "email" ? "Recipient email" : "Phone (+1xxxxxxxxxx)"}
                value={testTo}
                onChange={e => setTestTo(e.target.value)}
              />
              {testType === "email" && (
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#9CAF88]"
                  placeholder="Subject"
                  value={testSubj}
                  onChange={e => setTestSubj(e.target.value)}
                />
              )}
            </div>
            <div className="flex flex-col gap-3">
              <textarea
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#9CAF88] resize-none"
                rows={3}
                placeholder="Message body"
                value={testBody}
                onChange={e => setTestBody(e.target.value)}
              />
              <button
                disabled={working}
                onClick={() => void sendTest()}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 disabled:opacity-50 transition self-end"
              >
                {working ? "Sending…" : "Send Test"}
              </button>
            </div>
          </div>
        </div>

        {/* Delivery Log */}
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Delivery Log</h2>
            <span className="text-xs text-slate-400">{logs.length} entries</span>
          </div>
          {logs.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">
              No messages in the queue yet. Send a test message to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Recipient</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Result</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmt(log.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${log.type === "email" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                          {log.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">{log.recipient}</td>
                      <td className={`px-4 py-3 text-xs capitalize ${STATUS_COLOR[log.status] ?? "text-slate-600"}`}>
                        {log.status}
                        {log.attempts > 1 && (
                          <span className="ml-1 text-slate-400">({log.attempts}/{log.maxAttempts})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{log.result ?? "—"}</td>
                      <td className="px-4 py-3">
                        {log.status === "failed" && (
                          <button
                            onClick={() => void retry(log.id)}
                            className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-[#9CAF88] hover:text-white transition font-medium"
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChannelCard({
  priority, label, sublabel, active, detail, always,
}: {
  priority: number; label: string; sublabel: string;
  active: boolean; detail: string; always: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-1.5 ${always ? "border-[#9CAF88] bg-[#f0f4ee]" : "border-slate-100 bg-white"}`}>
      <div className="flex items-center justify-between">
        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
          {priority}
        </span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
          always ? "bg-[#9CAF88] text-white" : active ? "bg-[#edf4ea] text-[#7a9068]" : "bg-slate-100 text-slate-400"
        }`}>
          {always ? "ALWAYS ON" : active ? "ACTIVE" : "INACTIVE"}
        </span>
      </div>
      <p className="text-xs font-semibold text-slate-800 leading-none">{label}</p>
      <p className="text-[10px] text-slate-400">{sublabel}</p>
      <p className="text-[10px] text-slate-500 mt-auto pt-1 border-t border-slate-100">{detail}</p>
    </div>
  );
}

function ProviderCard({ label, status }: { label: string; status: string }) {
  const configured = status === "configured";
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-4 py-3">
      <p className="text-xs text-slate-400">{label}</p>
      <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${configured ? "bg-[#edf4ea] text-[#7a9068]" : "bg-amber-50 text-amber-700"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${configured ? "bg-[#7a9068]" : "bg-amber-400"}`} />
        {configured ? "Active" : "Setup Required"}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-4 py-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
