// ─── Customer Universe ────────────────────────────────────────────────────────
// Clean, professional space for customers. Isolated from family/admin data.
// Tabs: home | bills | life | habits | journal | account

import { useState, useEffect } from "react";
import { BillPay } from "@/components/BillPay";
import { LifeOSPanel } from "@/components/LifeOSPanel";
import { HabitsGoals } from "@/components/HabitsGoals";
import { PrivateJournal } from "@/components/PrivateJournal";
import { GentleSuggestions } from "@/components/GentleSuggestions";

const SAGE = "#7a9068";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.13)";

type Tab = "home" | "bills" | "life" | "habits" | "journal" | "account";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "home",    label: "Home",    icon: "🏠" },
  { key: "bills",   label: "Bills",   icon: "📋" },
  { key: "life",    label: "Life",    icon: "🗓️" },
  { key: "habits",  label: "Habits",  icon: "🌱" },
  { key: "journal", label: "Journal", icon: "📖" },
  { key: "account", label: "Account", icon: "👤" },
];

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
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void loadUser();
    void loadBillSummary();
  }, []);

  async function loadUser() {
    const res = await fetch("/api/auth/user", { credentials: "include" });
    if (res.ok) setUser(await res.json() as UserInfo);
  }

  async function loadBillSummary() {
    const res = await fetch("/api/bills/summary", { credentials: "include" });
    if (res.ok) setBillSummary(await res.json() as BillSummary);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/export/my-data", { credentials: "include" });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `createai-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
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
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${SAGE}15` }}>
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

      {/* Scrollable tab bar */}
      <div className="px-6 flex gap-1 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1 transition-all"
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

      <div className="px-6 pb-12">
        {/* ── Home ── */}
        {tab === "home" && (
          <div className="flex flex-col gap-4">
            <GentleSuggestions onNavigate={action => setTab(action as Tab)} />

            {/* Bill summary card */}
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
                  <p className="text-[26px] font-black" style={{ color: billSummary.overdue > 0 ? "#c53030" : TEXT }}>
                    {fmt(billSummary.totalDueCents)}
                  </p>
                  <p className="text-[11px]" style={{ color: MUTED }}>
                    {billSummary.pending} pending · {billSummary.overdue} overdue
                  </p>
                </div>
                <button onClick={() => setTab("bills")} className="px-4 py-2 rounded-xl text-[13px] font-bold text-white" style={{ background: SAGE }}>
                  View bills
                </button>
              </div>
            )}

            {(!billSummary || billSummary.totalDueCents === 0) && (
              <div className="p-5 rounded-2xl text-center" style={{ background: `${SAGE}08`, border: `1px solid ${BORDER}` }}>
                <div className="text-3xl mb-2">✅</div>
                <p className="text-[15px] font-bold" style={{ color: TEXT }}>You're all caught up</p>
                <p className="text-[12px] mt-1" style={{ color: MUTED }}>No outstanding balance</p>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: "📋", title: "Bills",    action: () => setTab("bills")   },
                { icon: "🗓️", title: "Life OS",  action: () => setTab("life")    },
                { icon: "🌱", title: "Habits",   action: () => setTab("habits")  },
                { icon: "📖", title: "Journal",  action: () => setTab("journal") },
                { icon: "👤", title: "Account",  action: () => setTab("account") },
                { icon: "📦", title: "Export",   action: () => void handleExport() },
              ].map((a, i) => (
                <button
                  key={i}
                  onClick={a.action}
                  className="p-3 rounded-2xl flex flex-col items-start gap-1 text-left transition-all"
                  style={{ background: "white", border: `1px solid ${BORDER}` }}
                >
                  <div className="text-xl">{a.icon}</div>
                  <span className="text-[12px] font-bold" style={{ color: TEXT }}>{a.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Bills ── */}
        {tab === "bills" && <BillPay />}

        {/* ── Life OS ── */}
        {tab === "life" && <LifeOSPanel />}

        {/* ── Habits ── */}
        {tab === "habits" && <HabitsGoals />}

        {/* ── Journal ── */}
        {tab === "journal" && <PrivateJournal />}

        {/* ── Account ── */}
        {tab === "account" && (
          <div className="flex flex-col gap-4">
            {user && (
              <div className="p-4 rounded-2xl" style={{ background: "white", border: `1px solid ${BORDER}` }}>
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

            <div className="p-4 rounded-2xl" style={{ background: "white", border: `1px solid ${BORDER}` }}>
              <h3 className="text-[14px] font-bold mb-2" style={{ color: TEXT }}>Trusted devices</h3>
              <p className="text-[12px]" style={{ color: MUTED }}>
                Your trusted devices are managed securely. To remove a device, contact your administrator.
              </p>
            </div>

            <div className="p-4 rounded-2xl" style={{ background: "white", border: `1px solid ${BORDER}` }}>
              <h3 className="text-[14px] font-bold mb-2" style={{ color: TEXT }}>Export your data</h3>
              <p className="text-[12px] mb-3 leading-relaxed" style={{ color: MUTED }}>
                Download a portable copy of your data — bills, life events, habits, journal, and more. Your data is yours.
              </p>
              <button
                onClick={() => void handleExport()}
                disabled={exporting}
                className="px-5 py-2.5 rounded-xl font-bold text-[13px] text-white disabled:opacity-50"
                style={{ background: SAGE }}
              >
                {exporting ? "Preparing export…" : "📦 Download my data"}
              </button>
            </div>

            <button
              onClick={() => { if (confirm("Are you sure you want to sign out?")) window.location.href = "/api/logout"; }}
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
