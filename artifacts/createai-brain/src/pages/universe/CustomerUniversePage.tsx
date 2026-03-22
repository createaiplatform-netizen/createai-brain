// ─── Customer Universe ────────────────────────────────────────────────────────
// Clean, professional space for customers. Shows their bills and account info.

import { useState, useEffect } from "react";
import { BillPay } from "@/components/BillPay";

const SAGE = "#7a9068";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.13)";

type Tab = "home" | "bills" | "account";

interface UserInfo {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  nda_signed?: boolean;
}

interface BillSummary {
  pending: number;
  overdue: number;
  totalDueCents: number;
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CustomerUniversePage() {
  const [tab, setTab] = useState<Tab>("home");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [billSummary, setBillSummary] = useState<BillSummary | null>(null);

  useEffect(() => {
    void loadUser();
    void loadBillSummary();
  }, []);

  async function loadUser() {
    const res = await fetch("/api/auth/user", { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as UserInfo;
      setUser(data);
    }
  }

  async function loadBillSummary() {
    const res = await fetch("/api/bills/summary", { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as BillSummary;
      setBillSummary(data);
    }
  }

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : (user?.email ?? "");

  return (
    <div className="min-h-screen" style={{ background: CREAM }}>
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: `${SAGE}15` }}
          >
            🧭
          </div>
          <div>
            <p className="text-[13px]" style={{ color: MUTED }}>Your workspace</p>
            <h1 className="text-[22px] font-black" style={{ color: TEXT }}>
              {displayName || "Welcome"}
            </h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 flex gap-1 mb-6">
        {([
          { key: "home",    label: "Home",    icon: "🏠" },
          { key: "bills",   label: "Bills",   icon: "📋" },
          { key: "account", label: "Account", icon: "👤" },
        ] as { key: Tab; label: string; icon: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-1.5 transition-all"
            style={{
              background: tab === t.key ? SAGE : "transparent",
              color: tab === t.key ? "white" : MUTED,
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="px-6 pb-10">
        {/* ── Home ── */}
        {tab === "home" && (
          <div className="flex flex-col gap-4">
            {/* Bill summary */}
            {billSummary && billSummary.totalDueCents > 0 && (
              <div
                className="p-4 rounded-2xl flex items-center justify-between"
                style={{
                  background: billSummary.overdue > 0 ? "rgba(197,48,48,0.06)" : `${SAGE}10`,
                  border: `1px solid ${billSummary.overdue > 0 ? "rgba(197,48,48,0.15)" : BORDER}`,
                }}
              >
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: MUTED }}>
                    {billSummary.overdue > 0 ? "⚠️ Overdue balance" : "Balance due"}
                  </p>
                  <p
                    className="text-[26px] font-black"
                    style={{ color: billSummary.overdue > 0 ? "#c53030" : TEXT }}
                  >
                    {fmt(billSummary.totalDueCents)}
                  </p>
                  <p className="text-[11px]" style={{ color: MUTED }}>
                    {billSummary.pending} pending · {billSummary.overdue} overdue
                  </p>
                </div>
                <button
                  onClick={() => setTab("bills")}
                  className="px-4 py-2 rounded-xl text-[13px] font-bold text-white"
                  style={{ background: SAGE }}
                >
                  View bills
                </button>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "📋", title: "Manage bills",   action: () => setTab("bills")   },
                { icon: "👤", title: "My account",     action: () => setTab("account") },
                { icon: "📱", title: "Trusted devices", action: () => setTab("account") },
                { icon: "🔔", title: "Notifications",  action: () => {}                },
              ].map((a, i) => (
                <button
                  key={i}
                  onClick={a.action}
                  className="p-4 rounded-2xl flex flex-col items-start gap-2 text-left transition-all active:scale-98"
                  style={{ background: "white", border: `1px solid ${BORDER}` }}
                >
                  <div className="text-2xl">{a.icon}</div>
                  <span className="text-[13px] font-bold" style={{ color: TEXT }}>{a.title}</span>
                </button>
              ))}
            </div>

            {(!billSummary || billSummary.totalDueCents === 0) && (
              <div
                className="p-5 rounded-2xl text-center"
                style={{ background: `${SAGE}08`, border: `1px solid ${BORDER}` }}
              >
                <div className="text-3xl mb-2">✅</div>
                <p className="text-[15px] font-bold" style={{ color: TEXT }}>You're all caught up</p>
                <p className="text-[12px] mt-1" style={{ color: MUTED }}>No outstanding balance</p>
              </div>
            )}
          </div>
        )}

        {/* ── Bills ── */}
        {tab === "bills" && <BillPay />}

        {/* ── Account ── */}
        {tab === "account" && (
          <div className="flex flex-col gap-4">
            {user && (
              <div
                className="p-4 rounded-2xl"
                style={{ background: "white", border: `1px solid ${BORDER}` }}
              >
                <h3 className="text-[14px] font-bold mb-3" style={{ color: TEXT }}>Account info</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Email",  value: user.email },
                    { label: "Name",   value: displayName || "—" },
                    { label: "NDA",    value: user.nda_signed ? "Signed ✓" : "Not signed" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-1.5">
                      <span className="text-[12px] font-semibold" style={{ color: MUTED }}>{row.label}</span>
                      <span className="text-[13px] font-bold" style={{ color: TEXT }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className="p-4 rounded-2xl"
              style={{ background: "white", border: `1px solid ${BORDER}` }}
            >
              <h3 className="text-[14px] font-bold mb-2" style={{ color: TEXT }}>Trusted devices</h3>
              <p className="text-[12px]" style={{ color: MUTED }}>
                Your trusted devices are managed securely. To remove a device, contact your account administrator.
              </p>
              <button
                className="mt-3 text-[13px] font-semibold"
                style={{ color: SAGE }}
                onClick={() => window.location.href = "/"}
              >
                Go to settings →
              </button>
            </div>

            <button
              onClick={() => {
                if (confirm("Are you sure you want to sign out?")) {
                  window.location.href = "/api/logout";
                }
              }}
              className="w-full py-3 rounded-2xl font-bold text-[14px]"
              style={{ background: "rgba(197,48,48,0.08)", color: "#c53030" }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
