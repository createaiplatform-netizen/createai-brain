/**
 * EnhancedFamilyBankPanel.tsx
 * Full family-level value system:
 *   Creativity | Kindness | Effort | Participation → Points → Parent-defined Rewards
 * VIRTUAL ONLY — no real money. localStorage-backed.
 */
import React, { useState, useEffect, useCallback } from "react";

const SAGE    = "#9CAF88";
const SAGE_D  = "#7a9068";
const WARM    = "#fdf8f0";
const TEXT    = "#2d2a24";
const MUTED   = "#6b6560";
const BORDER  = "rgba(0,0,0,0.07)";

const LS_MEMBERS  = "efb_members_v1";
const LS_LEDGER   = "efb_ledger_v1";
const LS_REWARDS  = "efb_rewards_v1";

type ValueCategory = "creativity" | "kindness" | "effort" | "participation" | "other";

const VALUE_CATS: { id: ValueCategory; label: string; emoji: string; color: string; desc: string }[] = [
  { id: "creativity",    label: "Creativity",    emoji: "🎨", color: "#f97316", desc: "Making something new, thinking outside the box" },
  { id: "kindness",      label: "Kindness",      emoji: "💛", color: "#f59e0b", desc: "Being caring, thoughtful, or helping others" },
  { id: "effort",        label: "Effort",        emoji: "💪", color: "#10b981", desc: "Working hard, not giving up, persevering" },
  { id: "participation", label: "Participation", emoji: "🌟", color: "#8b5cf6", desc: "Joining in, showing up, contributing to the family" },
  { id: "other",         label: "Other",         emoji: "✨", color: SAGE_D,    desc: "Anything else worth celebrating" },
];

interface Member    { id: string; name: string; emoji: string; isParent: boolean }
interface LedgerEntry {
  id:       string;
  memberId: string;
  category: ValueCategory;
  points:   number;          // always positive
  type:     "earn" | "redeem";
  note:     string;
  date:     string;
}
interface Reward {
  id:      string;
  name:    string;
  emoji:   string;
  cost:    number;
  active:  boolean;
}

function uid() { return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2); }
function loadJ<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } }
function saveJ(k: string, v: unknown) { localStorage.setItem(k, JSON.stringify(v)); }

const DEFAULT_MEMBERS: Member[] = [
  { id: "m1", name: "Parent",  emoji: "👨‍👩‍👦", isParent: true  },
  { id: "m2", name: "Child 1", emoji: "🌟",      isParent: false },
];
const DEFAULT_REWARDS: Reward[] = [
  { id: "r1", name: "Choose dinner",  emoji: "🍕", cost: 25,  active: true },
  { id: "r2", name: "Movie night pick", emoji: "🎬", cost: 40, active: true },
  { id: "r3", name: "Stay up 30 min later", emoji: "🌙", cost: 50, active: true },
  { id: "r4", name: "Extra screen time", emoji: "📱", cost: 30,   active: true },
  { id: "r5", name: "Special outing",    emoji: "🌈", cost: 100,  active: true },
];

function catInfo(id: ValueCategory) { return VALUE_CATS.find(c => c.id === id) ?? VALUE_CATS[4]; }

function memberBalance(memberId: string, ledger: LedgerEntry[]) {
  return ledger.filter(e => e.memberId === memberId).reduce(
    (sum, e) => e.type === "earn" ? sum + e.points : sum - e.points,
    0
  );
}

// ─── Award Points modal ───────────────────────────────────────────────────────
function AwardModal({ members, onAward, onClose }: {
  members: Member[];
  onAward: (memberId: string, category: ValueCategory, points: number, note: string) => void;
  onClose: () => void;
}) {
  const [memberId,  setMemberId]  = useState(members[0]?.id ?? "");
  const [category,  setCategory]  = useState<ValueCategory>("kindness");
  const [points,    setPoints]    = useState(10);
  const [note,      setNote]      = useState("");

  const QUICK_AMOUNTS = [5, 10, 15, 20, 25, 50];
  const QUICK_NOTES: Record<ValueCategory, string[]> = {
    creativity:    ["Made something beautiful", "Had an amazing idea", "Created without prompting"],
    kindness:      ["Was kind to a sibling", "Helped without being asked", "Said something sweet"],
    effort:        ["Tried really hard", "Didn't give up", "Did their best"],
    participation: ["Joined family activity", "Was present and engaged", "Contributed to the family"],
    other:         ["Did something great", "Made us proud", "Deserves recognition"],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: WARM }}>
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: BORDER }}>
          <p className="font-bold text-[15px]" style={{ color: TEXT }}>Award Points</p>
          <button onClick={onClose} className="text-xl opacity-40 hover:opacity-70">×</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Member */}
          <div>
            <p className="text-[11px] font-semibold mb-1.5" style={{ color: MUTED }}>WHO EARNED IT?</p>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button key={m.id} onClick={() => setMemberId(m.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border"
                  style={{ background: memberId === m.id ? SAGE_D : "white", color: memberId === m.id ? "white" : TEXT, borderColor: memberId === m.id ? SAGE_D : BORDER }}>
                  {m.emoji} {m.name}
                </button>
              ))}
            </div>
          </div>
          {/* Category */}
          <div>
            <p className="text-[11px] font-semibold mb-1.5" style={{ color: MUTED }}>WHY?</p>
            <div className="grid grid-cols-2 gap-2">
              {VALUE_CATS.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold border text-left"
                  style={{ background: category === c.id ? c.color + "18" : "white", borderColor: category === c.id ? c.color : BORDER, color: TEXT }}>
                  <span className="text-[16px]">{c.emoji}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Points */}
          <div>
            <p className="text-[11px] font-semibold mb-1.5" style={{ color: MUTED }}>POINTS</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setPoints(a)}
                  className="w-10 h-10 rounded-xl text-[13px] font-bold border"
                  style={{ background: points === a ? SAGE_D : "white", color: points === a ? "white" : TEXT, borderColor: points === a ? SAGE_D : BORDER }}>
                  {a}
                </button>
              ))}
            </div>
            <input type="number" value={points} onChange={e => setPoints(Math.max(1, parseInt(e.target.value) || 1))} min={1} max={500}
              className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
              style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          </div>
          {/* Note */}
          <div>
            <p className="text-[11px] font-semibold mb-1.5" style={{ color: MUTED }}>QUICK NOTE</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {QUICK_NOTES[category].map(n => (
                <button key={n} onClick={() => setNote(n)}
                  className="text-[10px] px-2 py-1 rounded-full border"
                  style={{ background: note === n ? `${SAGE}15` : "white", borderColor: note === n ? SAGE : BORDER, color: MUTED }}>
                  {n}
                </button>
              ))}
            </div>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Or write your own…"
              className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
              style={{ background: "white", borderColor: BORDER, color: TEXT }} />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold" style={{ background: "white", border: `1px solid ${BORDER}`, color: MUTED }}>Cancel</button>
          <button onClick={() => { onAward(memberId, category, points, note); onClose(); }} disabled={!memberId}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${SAGE_D}, ${SAGE})` }}>
            Award {points} pts 🌟
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Redeem modal ─────────────────────────────────────────────────────────────
function RedeemModal({ members, ledger, rewards, onRedeem, onClose }: {
  members: Member[]; ledger: LedgerEntry[]; rewards: Reward[];
  onRedeem: (memberId: string, rewardId: string, cost: number, name: string) => void;
  onClose: () => void;
}) {
  const [memberId, setMemberId] = useState(members.filter(m => !m.isParent)[0]?.id ?? members[0]?.id ?? "");

  const balance = memberBalance(memberId, ledger);
  const available = rewards.filter(r => r.active && r.cost <= balance);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: WARM }}>
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: BORDER }}>
          <p className="font-bold text-[15px]" style={{ color: TEXT }}>Redeem a Reward</p>
          <button onClick={onClose} className="text-xl opacity-40 hover:opacity-70">×</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-[11px] font-semibold mb-1.5" style={{ color: MUTED }}>WHO IS REDEEMING?</p>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button key={m.id} onClick={() => setMemberId(m.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border"
                  style={{ background: memberId === m.id ? SAGE_D : "white", color: memberId === m.id ? "white" : TEXT, borderColor: memberId === m.id ? SAGE_D : BORDER }}>
                  {m.emoji} {m.name} · {memberBalance(m.id, ledger)} pts
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold mb-1.5" style={{ color: MUTED }}>AVAILABLE REWARDS ({balance} pts)</p>
            {available.length === 0 ? (
              <p className="text-[12px] py-4 text-center" style={{ color: MUTED }}>Not enough points for any reward yet. Keep going! 🌟</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {rewards.filter(r => r.active).map(r => {
                  const canAfford = r.cost <= balance;
                  return (
                    <button key={r.id} onClick={() => canAfford && (onRedeem(memberId, r.id, r.cost, r.name), onClose())}
                      disabled={!canAfford}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left border transition-all disabled:opacity-40"
                      style={{ background: "white", borderColor: canAfford ? SAGE : BORDER }}>
                      <span className="text-2xl">{r.emoji}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-[13px]" style={{ color: TEXT }}>{r.name}</p>
                        <p className="text-[11px]" style={{ color: MUTED }}>{r.cost} points</p>
                      </div>
                      {canAfford && <span className="text-[11px] font-bold" style={{ color: SAGE_D }}>Redeem</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="px-5 pb-5">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl text-[12px] font-semibold" style={{ background: "white", border: `1px solid ${BORDER}`, color: MUTED }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
type BankTab = "overview" | "ledger" | "rewards";

export function EnhancedFamilyBankPanel() {
  const [members,    setMembers]    = useState<Member[]>(DEFAULT_MEMBERS);
  const [ledger,     setLedger]     = useState<LedgerEntry[]>([]);
  const [rewards,    setRewards]    = useState<Reward[]>(DEFAULT_REWARDS);
  const [tab,        setTab]        = useState<BankTab>("overview");
  const [showAward,  setShowAward]  = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [newReward,  setNewReward]  = useState({ name: "", emoji: "🎁", cost: 25 });
  const [addingRew,  setAddingRew]  = useState(false);
  const [newMember,  setNewMember]  = useState({ name: "", emoji: "🌟" });
  const [addingMem,  setAddingMem]  = useState(false);

  useEffect(() => {
    setMembers(loadJ(LS_MEMBERS, DEFAULT_MEMBERS));
    setLedger(loadJ(LS_LEDGER, []));
    setRewards(loadJ(LS_REWARDS, DEFAULT_REWARDS));
  }, []);

  const saveMem  = (n: Member[])      => { setMembers(n);  saveJ(LS_MEMBERS,  n); };
  const saveLed  = (n: LedgerEntry[]) => { setLedger(n);   saveJ(LS_LEDGER,   n); };
  const saveRew  = (n: Reward[])      => { setRewards(n);  saveJ(LS_REWARDS,  n); };

  const awardPoints = useCallback((memberId: string, category: ValueCategory, points: number, note: string) => {
    const entry: LedgerEntry = { id: uid(), memberId, category, points, type: "earn", note: note || catInfo(category).desc, date: new Date().toISOString() };
    const next = [entry, ...ledger];
    saveLed(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledger]);

  const redeemReward = useCallback((memberId: string, _rewardId: string, cost: number, name: string) => {
    const entry: LedgerEntry = { id: uid(), memberId, category: "other", points: cost, type: "redeem", note: `Redeemed: ${name}`, date: new Date().toISOString() };
    saveLed([entry, ...ledger]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledger]);

  const addMember = () => {
    if (!newMember.name.trim()) return;
    saveMem([...members, { id: uid(), name: newMember.name.trim(), emoji: newMember.emoji, isParent: false }]);
    setNewMember({ name: "", emoji: "🌟" });
    setAddingMem(false);
  };

  const addReward = () => {
    if (!newReward.name.trim()) return;
    saveRew([...rewards, { id: uid(), name: newReward.name.trim(), emoji: newReward.emoji, cost: newReward.cost, active: true }]);
    setNewReward({ name: "", emoji: "🎁", cost: 25 });
    setAddingRew(false);
  };

  const totalEarned = ledger.filter(e => e.type === "earn").reduce((s, e) => s + e.points, 0);

  const MEM_EMOJIS = ["🌟","🌈","🦋","🐾","🎵","🎨","⚽","🚀","🌻","🦊","🐘","🌙"];
  const REW_EMOJIS = ["🎬","🍕","🌙","📱","🌈","🎮","🎵","🎁","🏆","🍦","🎠","🌟"];

  return (
    <div className="flex flex-col gap-4">
      {/* VIRTUAL ONLY notice */}
      <div className="rounded-xl px-4 py-2.5 flex items-center gap-2" style={{ background: "#fef9ec", border: "1px solid #fde68a" }}>
        <span className="text-[13px]">⚠️</span>
        <p className="text-[11px] font-semibold" style={{ color: "#92400e" }}>FamilyBank is VIRTUAL ONLY — for fun, values, and motivation. Not real money.</p>
      </div>

      {/* Header + quick actions */}
      <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, #1a2e1a, #2d4a2d)` }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white font-bold text-[16px]">FamilyBank</p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Values · Points · Rewards</p>
          </div>
          <div className="text-right">
            <p className="text-[22px] font-black text-white">{totalEarned.toLocaleString()}</p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>total points earned</p>
          </div>
        </div>

        {/* Member balances */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {members.map(m => {
            const bal = memberBalance(m.id, ledger);
            return (
              <div key={m.id} className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span>{m.emoji}</span>
                  <span className="text-[11px] text-white font-semibold truncate">{m.name}</span>
                  {m.isParent && <span className="text-[8px] px-1 rounded" style={{ background: `${SAGE}30`, color: SAGE }}>Parent</span>}
                </div>
                <p className="text-[18px] font-black text-white">{bal}</p>
                <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>points</p>
              </div>
            );
          })}
        </div>

        {/* Category breakdown */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {VALUE_CATS.map(c => {
            const pts = ledger.filter(e => e.category === c.id && e.type === "earn").reduce((s, e) => s + e.points, 0);
            return (
              <div key={c.id} className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: c.color + "25" }}>
                <span className="text-[12px]">{c.emoji}</span>
                <span className="text-[10px] font-semibold text-white">{pts}</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setShowAward(true)}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${SAGE_D}, ${SAGE})` }}>
            🌟 Award Points
          </button>
          <button onClick={() => setShowRedeem(true)}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold"
            style={{ background: "rgba(255,255,255,0.12)", color: "white" }}>
            🎁 Redeem
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {(["overview","ledger","rewards"] as BankTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-xl text-[12px] font-semibold capitalize"
            style={{ background: tab === t ? SAGE_D : "white", color: tab === t ? "white" : TEXT, border: `1px solid ${tab === t ? SAGE_D : BORDER}` }}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-3">
          {/* Value categories */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: `1px solid ${BORDER}` }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: BORDER }}>
              <p className="font-bold text-[13px]" style={{ color: TEXT }}>Value Categories</p>
            </div>
            {VALUE_CATS.map(c => {
              const pts = ledger.filter(e => e.category === c.id && e.type === "earn").reduce((s, e) => s + e.points, 0);
              const max = totalEarned || 1;
              return (
                <div key={c.id} className="px-4 py-3 border-b last:border-b-0" style={{ borderColor: BORDER }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span>{c.emoji}</span>
                    <span className="font-semibold text-[12px]" style={{ color: TEXT }}>{c.label}</span>
                    <span className="ml-auto text-[12px] font-bold" style={{ color: c.color }}>{pts} pts</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${c.color}18` }}>
                    <div className="h-full rounded-full" style={{ width: `${(pts / max) * 100}%`, background: c.color }} />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: MUTED }}>{c.desc}</p>
                </div>
              );
            })}
          </div>
          {/* Members */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: `1px solid ${BORDER}` }}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
              <p className="font-bold text-[13px]" style={{ color: TEXT }}>Members</p>
              <button onClick={() => setAddingMem(a => !a)} className="text-[11px] px-2 py-1 rounded-lg font-semibold" style={{ background: `${SAGE}15`, color: SAGE_D }}>+ Add</button>
            </div>
            {addingMem && (
              <div className="px-4 py-3 border-b space-y-2" style={{ borderColor: BORDER }}>
                <div className="flex flex-wrap gap-1">
                  {MEM_EMOJIS.map(e => (
                    <button key={e} onClick={() => setNewMember(m => ({ ...m, emoji: e }))}
                      className="w-7 h-7 rounded-lg text-[14px] flex items-center justify-center"
                      style={{ background: newMember.emoji === e ? `${SAGE}25` : "transparent", outline: newMember.emoji === e ? `2px solid ${SAGE}` : "none" }}>
                      {e}
                    </button>
                  ))}
                </div>
                <input value={newMember.name} onChange={e => setNewMember(m => ({ ...m, name: e.target.value }))} placeholder="Name"
                  className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
                  style={{ background: "#fafafa", borderColor: BORDER, color: TEXT }} />
                <div className="flex gap-2">
                  <button onClick={() => setAddingMem(false)} className="flex-1 py-2 rounded-xl text-[11px]" style={{ background: "white", border: `1px solid ${BORDER}`, color: MUTED }}>Cancel</button>
                  <button onClick={addMember} disabled={!newMember.name.trim()} className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white disabled:opacity-40" style={{ background: SAGE_D }}>Add</button>
                </div>
              </div>
            )}
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0" style={{ borderColor: BORDER }}>
                <span className="text-2xl">{m.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-[13px]" style={{ color: TEXT }}>{m.name}</p>
                  {m.isParent && <p className="text-[10px]" style={{ color: MUTED }}>Can award points</p>}
                </div>
                <p className="font-bold text-[18px]" style={{ color: SAGE_D }}>{memberBalance(m.id, ledger)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ledger */}
      {tab === "ledger" && (
        <div className="space-y-2">
          {ledger.length === 0 && (
            <div className="rounded-2xl p-8 text-center" style={{ background: "white", border: `1px solid ${BORDER}` }}>
              <p className="text-3xl mb-2">📖</p>
              <p className="text-[13px] font-semibold mb-1" style={{ color: TEXT }}>No entries yet</p>
              <p className="text-[12px]" style={{ color: MUTED }}>Award your first points to get started!</p>
            </div>
          )}
          {ledger.map(e => {
            const member = members.find(m => m.id === e.memberId);
            const cat    = catInfo(e.category);
            return (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "white", border: `1px solid ${BORDER}` }}>
                <span className="text-xl">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[12px] truncate" style={{ color: TEXT }}>{member?.emoji} {member?.name}</p>
                  <p className="text-[11px] truncate" style={{ color: MUTED }}>{e.note || cat.label}</p>
                  <p className="text-[10px]" style={{ color: MUTED }}>{new Date(e.date).toLocaleDateString()}</p>
                </div>
                <p className="font-bold text-[15px] flex-shrink-0" style={{ color: e.type === "earn" ? SAGE_D : "#dc2626" }}>
                  {e.type === "earn" ? "+" : "−"}{e.points}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Rewards */}
      {tab === "rewards" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-[13px]" style={{ color: TEXT }}>Parent-Defined Rewards</p>
            <button onClick={() => setAddingRew(a => !a)} className="text-[12px] px-3 py-1.5 rounded-xl font-semibold text-white" style={{ background: SAGE_D }}>+ Add</button>
          </div>
          {addingRew && (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: WARM, border: `1px solid ${BORDER}` }}>
              <div className="flex flex-wrap gap-1">
                {REW_EMOJIS.map(e => (
                  <button key={e} onClick={() => setNewReward(r => ({ ...r, emoji: e }))}
                    className="w-7 h-7 rounded-lg text-[14px] flex items-center justify-center"
                    style={{ background: newReward.emoji === e ? `${SAGE}25` : "transparent", outline: newReward.emoji === e ? `2px solid ${SAGE}` : "none" }}>
                    {e}
                  </button>
                ))}
              </div>
              <input value={newReward.name} onChange={e => setNewReward(r => ({ ...r, name: e.target.value }))} placeholder="Reward name"
                className="w-full rounded-xl px-3 py-2 text-[13px] border outline-none"
                style={{ background: "white", borderColor: BORDER, color: TEXT }} />
              <div>
                <p className="text-[11px] font-semibold mb-1" style={{ color: MUTED }}>POINT COST</p>
                <div className="flex gap-1 flex-wrap">
                  {[10,15,20,25,30,40,50,75,100].map(v => (
                    <button key={v} onClick={() => setNewReward(r => ({ ...r, cost: v }))}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                      style={{ background: newReward.cost === v ? SAGE_D : "white", color: newReward.cost === v ? "white" : TEXT, borderColor: newReward.cost === v ? SAGE_D : BORDER }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAddingRew(false)} className="flex-1 py-2 rounded-xl text-[12px] font-semibold" style={{ background: "white", border: `1px solid ${BORDER}`, color: MUTED }}>Cancel</button>
                <button onClick={addReward} disabled={!newReward.name.trim()} className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-40" style={{ background: SAGE_D }}>Add Reward</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {rewards.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "white", border: `1px solid ${BORDER}` }}>
                <span className="text-2xl">{r.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-[13px]" style={{ color: TEXT }}>{r.name}</p>
                  <p className="text-[11px] font-bold" style={{ color: SAGE_D }}>{r.cost} points</p>
                </div>
                <button onClick={() => saveRew(rewards.map(rw => rw.id === r.id ? { ...rw, active: !rw.active } : rw))}
                  className="text-[11px] px-2 py-1 rounded-lg font-semibold"
                  style={{ background: r.active ? `${SAGE}15` : "#f3f4f6", color: r.active ? SAGE_D : MUTED }}>
                  {r.active ? "Active" : "Hidden"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAward  && <AwardModal  members={members} onAward={awardPoints} onClose={() => setShowAward(false)} />}
      {showRedeem && <RedeemModal members={members} ledger={ledger} rewards={rewards} onRedeem={redeemReward} onClose={() => setShowRedeem(false)} />}
    </div>
  );
}
