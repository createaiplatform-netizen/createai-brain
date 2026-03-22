// ─── Family Bank ──────────────────────────────────────────────────────────────
// Virtual family bank with balances, goals, and transaction history.
// IMPORTANT: This is a virtual points/rewards tracker only.
// Real money never moves here. External payment providers handle actual payments.

import { useState, useEffect } from "react";

const SAGE = "#7a9068";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.14)";

interface BankAccount {
  id: string;
  display_name: string;
  balance_cents: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: string;
  amount_cents: number;
  reason: string;
  notes: string | null;
  created_at: string;
}

interface Goal {
  id: string;
  name: string;
  emoji: string;
  target_cents: number;
  current_cents: number;
  deadline: string | null;
  completed: boolean;
}

function fmt(cents: number) {
  return `$${Math.abs(cents / 100).toFixed(2)}`;
}

function fmtDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TXN_TYPE_INFO: Record<string, { icon: string; label: string; sign: string }> = {
  earn:         { icon: "⬆️", label: "Earned",       sign: "+" },
  spend:        { icon: "⬇️", label: "Spent",        sign: "-" },
  reward:       { icon: "🌟", label: "Reward",       sign: "+" },
  transfer:     { icon: "↔️", label: "Transfer",     sign: "+"  },
  goal_deposit: { icon: "🎯", label: "Goal deposit", sign: "+"  },
};

type Tab = "balance" | "goals" | "history";

interface FamilyBankProps {
  showFamilyView?: boolean;
}

export function FamilyBank({ showFamilyView = false }: FamilyBankProps) {
  const [tab, setTab] = useState<Tab>("balance");
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: "", emoji: "🎯", targetAmount: "", deadline: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [acctRes, txnRes, goalRes] = await Promise.all([
        fetch("/api/family-bank/account", { credentials: "include" }),
        fetch("/api/family-bank/transactions?limit=20", { credentials: "include" }),
        fetch("/api/family-bank/goals", { credentials: "include" }),
      ]);
      if (acctRes.ok) setAccount(((await acctRes.json()) as { account: BankAccount }).account);
      if (txnRes.ok) setTransactions(((await txnRes.json()) as { transactions: Transaction[] }).transactions);
      if (goalRes.ok) setGoals(((await goalRes.json()) as { goals: Goal[] }).goals);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!goalForm.name.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/family-bank/goals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: goalForm.name,
          emoji: goalForm.emoji,
          targetCents: Math.round(parseFloat(goalForm.targetAmount || "0") * 100),
          deadline: goalForm.deadline || undefined,
        }),
      });
      setShowAddGoal(false);
      setGoalForm({ name: "", emoji: "🎯", targetAmount: "", deadline: "" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleGoalComplete(goalId: string, completed: boolean) {
    await fetch(`/api/family-bank/goals/${goalId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    await load();
  }

  if (loading) {
    return <div className="py-8 text-center text-[13px]" style={{ color: MUTED }}>Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Disclaimer */}
      <div
        className="p-3 rounded-xl text-[11px] leading-snug"
        style={{ background: `${SAGE}08`, border: `1px solid ${SAGE}18`, color: MUTED }}
      >
        🏛️ <strong>Virtual bank only.</strong> This tracks points and goals. Real payments always require your explicit approval through your bank or payment provider.
      </div>

      {/* Balance card */}
      <div
        className="p-5 rounded-3xl"
        style={{ background: `linear-gradient(135deg, ${SAGE}18, ${SAGE}08)`, border: `1px solid ${SAGE}20` }}
      >
        <p className="text-[12px] font-semibold" style={{ color: MUTED }}>Virtual balance</p>
        <p className="text-[36px] font-black mt-1" style={{ color: TEXT }}>
          {fmt(account?.balance_cents ?? 0)}
        </p>
        <p className="text-[11px]" style={{ color: MUTED }}>Points only · not real currency</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {(["balance", "goals", "history"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded-xl text-[12px] font-bold capitalize transition-all"
            style={{
              background: tab === t ? SAGE : "transparent",
              color: tab === t ? "white" : MUTED,
            }}
          >
            {t === "balance" ? "Overview" : t === "goals" ? "Goals" : "History"}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === "balance" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Earned", value: fmt(transactions.filter(t => ["earn","reward"].includes(t.type)).reduce((s,t) => s + t.amount_cents, 0)), icon: "⬆️", color: "#4a7a5a" },
              { label: "Spent",  value: fmt(transactions.filter(t => t.type === "spend").reduce((s,t) => s + t.amount_cents, 0)),  icon: "⬇️", color: "#c53030" },
            ].map(stat => (
              <div key={stat.label} className="p-4 rounded-2xl text-center"
                style={{ background: "white", border: `1px solid ${BORDER}` }}>
                <div className="text-xl mb-1">{stat.icon}</div>
                <div className="text-[18px] font-black" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-[11px]" style={{ color: MUTED }}>{stat.label}</div>
              </div>
            ))}
          </div>
          <div
            className="p-4 rounded-2xl"
            style={{ background: "white", border: `1px solid ${BORDER}` }}
          >
            <p className="text-[13px] font-bold mb-2" style={{ color: TEXT }}>Active goals</p>
            {goals.filter(g => !g.completed).length === 0 ? (
              <p className="text-[12px]" style={{ color: MUTED }}>No active goals yet — add one in the Goals tab!</p>
            ) : (
              goals.filter(g => !g.completed).slice(0, 3).map(g => {
                const pct = g.target_cents > 0 ? Math.min(100, (g.current_cents / g.target_cents) * 100) : 0;
                return (
                  <div key={g.id} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-semibold" style={{ color: TEXT }}>{g.emoji} {g.name}</span>
                      <span className="text-[11px]" style={{ color: MUTED }}>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: `${SAGE}18` }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: SAGE }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Goals Tab ── */}
      {tab === "goals" && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowAddGoal(true)}
            className="w-full py-3 rounded-2xl font-bold text-[14px] text-white"
            style={{ background: SAGE }}
          >
            + Add a goal
          </button>
          {goals.map(g => {
            const pct = g.target_cents > 0 ? Math.min(100, (g.current_cents / g.target_cents) * 100) : 0;
            return (
              <div key={g.id} className="p-4 rounded-2xl" style={{ background: "white", border: `1px solid ${BORDER}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{g.emoji}</span>
                      <span className="text-[15px] font-bold" style={{
                        color: TEXT,
                        textDecoration: g.completed ? "line-through" : "none",
                        opacity: g.completed ? 0.5 : 1,
                      }}>
                        {g.name}
                      </span>
                    </div>
                    {g.target_cents > 0 && (
                      <>
                        <div className="flex justify-between mt-2 mb-1">
                          <span className="text-[12px]" style={{ color: MUTED }}>{fmt(g.current_cents)} of {fmt(g.target_cents)}</span>
                          {g.deadline && <span className="text-[11px]" style={{ color: MUTED }}>by {fmtDate(g.deadline)}</span>}
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: `${SAGE}18` }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: g.completed ? "#4a7a5a" : SAGE }} />
                        </div>
                      </>
                    )}
                  </div>
                  {!g.completed && (
                    <button
                      onClick={() => handleGoalComplete(g.id, true)}
                      className="px-3 py-1.5 rounded-xl text-[12px] font-semibold text-white flex-shrink-0"
                      style={{ background: "#4a7a5a" }}
                    >
                      ✓ Done
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {goals.length === 0 && (
            <div className="py-8 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-[14px] font-semibold" style={{ color: TEXT }}>No goals yet</p>
              <p className="text-[12px] mt-1" style={{ color: MUTED }}>Start a goal and track your progress step by step</p>
            </div>
          )}
        </div>
      )}

      {/* ── History Tab ── */}
      {tab === "history" && (
        <div className="flex flex-col gap-2">
          {transactions.map(t => {
            const info = TXN_TYPE_INFO[t.type] ?? { icon: "●", label: t.type, sign: "+" };
            const isPositive = info.sign === "+";
            return (
              <div key={t.id} className="px-4 py-3 rounded-2xl flex items-center gap-3"
                style={{ background: "white", border: `1px solid ${BORDER}` }}>
                <div className="text-xl">{info.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: TEXT }}>{t.reason || info.label}</p>
                  <p className="text-[11px]" style={{ color: MUTED }}>{fmtDate(t.created_at)}</p>
                </div>
                <span className="text-[15px] font-bold flex-shrink-0"
                  style={{ color: isPositive ? "#4a7a5a" : "#c53030" }}>
                  {info.sign}{fmt(t.amount_cents)}
                </span>
              </div>
            );
          })}
          {transactions.length === 0 && (
            <p className="text-[13px] text-center py-8" style={{ color: MUTED }}>No transactions yet</p>
          )}
        </div>
      )}

      {/* Add goal modal */}
      {showAddGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(26,25,22,0.50)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-sm rounded-3xl" style={{ background: CREAM, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <form onSubmit={handleAddGoal} className="p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[17px] font-black" style={{ color: TEXT }}>New goal</h3>
                <button type="button" onClick={() => setShowAddGoal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: BORDER, color: MUTED }}>×</button>
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Emoji" value={goalForm.emoji}
                  onChange={e => setGoalForm(p => ({ ...p, emoji: e.target.value }))}
                  className="w-16 text-center px-2 py-2.5 rounded-xl text-[22px] outline-none"
                  style={{ background: "white", border: `1.5px solid ${BORDER}` }} maxLength={2} />
                <input type="text" placeholder="Goal name *" value={goalForm.name}
                  onChange={e => setGoalForm(p => ({ ...p, name: e.target.value }))}
                  className="flex-1 px-3 py-2.5 rounded-xl text-[14px] outline-none"
                  style={{ background: "white", border: `1.5px solid ${BORDER}`, color: TEXT }} />
              </div>
              <input type="number" placeholder="Target amount ($, optional)" value={goalForm.targetAmount}
                onChange={e => setGoalForm(p => ({ ...p, targetAmount: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                style={{ background: "white", border: `1.5px solid ${BORDER}`, color: TEXT }} min="0" step="0.01" />
              <input type="date" value={goalForm.deadline}
                onChange={e => setGoalForm(p => ({ ...p, deadline: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                style={{ background: "white", border: `1.5px solid ${BORDER}`, color: TEXT }} />
              <button type="submit" disabled={saving || !goalForm.name.trim()}
                className="w-full py-3 rounded-2xl font-bold text-[14px] text-white"
                style={{ background: SAGE, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Create goal"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
