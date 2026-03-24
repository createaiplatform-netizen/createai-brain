// ─── Family Universe ──────────────────────────────────────────────────────────
// Protected private space for family adults. Warm, safe, wonder-filled.
// Family Universe Standing Law always active.

import { useState, useEffect } from "react";
import { FamilyInviteModal } from "@/components/FamilyInviteModal";
import { GuardianApprovalPanel } from "@/components/GuardianApprovalPanel";
import { BillPay } from "@/components/BillPay";
import { FamilyBank } from "@/components/FamilyBank";
import { FamilyMessages } from "@/components/FamilyMessages";
import { LifeOSPanel } from "@/components/LifeOSPanel";
import { HabitsGoals } from "@/components/HabitsGoals";
import { PrivateJournal } from "@/components/PrivateJournal";
import { GentleSuggestions } from "@/components/GentleSuggestions";
import { generateIdentity, avatarStyle } from "@/lib/identityEngine";
import { MemoryGardenPanel }       from "@/components/family/MemoryGardenPanel";
import { FamilyToolsPanel }        from "@/components/family/FamilyToolsPanel";
import { EnhancedFamilyBankPanel } from "@/components/family/EnhancedFamilyBankPanel";
import { EmotionalSafetyPanel }    from "@/components/family/EmotionalSafetyPanel";
import { DiscoveryEnginePanel }    from "@/components/family/DiscoveryEnginePanel";
import { FamilyAssistantPanel }    from "@/components/family/FamilyAssistantPanel";
import { useFamilyTheme } from "@/hooks/useFamilyTheme";

type Tab = "home" | "family" | "bills" | "bank" | "messages" | "life" | "habits" | "journal" | "create" | "memory" | "tools" | "discover" | "safety" | "assistant";

interface FamilyIdentity {
  display_name: string;
  avatar_emoji: string;
  avatar_color: string;
  bio: string | null;
  member_type: string;
}

interface FamilyMember {
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  avatar_color: string;
  role: string;
  member_type: string;
}

const CREATION_IDEAS = [
  { emoji: "📖", title: "Family story",      subtitle: "Write or record a memory together" },
  { emoji: "🎨", title: "Art space",         subtitle: "Share drawings, photos, and creations" },
  { emoji: "🌿", title: "Garden journal",    subtitle: "Track your garden and seasons" },
  { emoji: "🎵", title: "Music playlist",    subtitle: "Songs that matter to your family" },
  { emoji: "🗺️", title: "Adventure map",    subtitle: "Places you've been and want to go" },
  { emoji: "💌", title: "Letters",           subtitle: "Notes and messages to save forever" },
];

export default function FamilyUniversePage() {
  const theme = useFamilyTheme();
  const SAGE   = theme.primary;
  const CREAM  = theme.background;
  const TEXT   = theme.text;
  const MUTED  = theme.secondary;
  const BORDER = `${theme.primary}20`;

  const [tab, setTab] = useState<Tab>("home");
  const [identity, setIdentity] = useState<FamilyIdentity | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [pendingHabits, setPendingHabits] = useState(0);

  useEffect(() => {
    void loadIdentity();
    void loadMembers();
  }, []);

  async function loadIdentity() {
    const res = await fetch("/api/family-identity/me", { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as { identity: FamilyIdentity };
      setIdentity(data.identity);
    }
  }

  async function loadMembers() {
    const res = await fetch("/api/family-identity/members", { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as { members: FamilyMember[] };
      setMembers(data.members);
    }
  }

  const localIdentity = identity
    ? { displayName: identity.display_name, avatarEmoji: identity.avatar_emoji, avatarColor: identity.avatar_color, gradientFrom: identity.avatar_color, gradientTo: identity.avatar_color }
    : generateIdentity("fallback", "adult");

  return (
    <div className="min-h-screen" style={{ background: CREAM }}>
      {/* Header — identity badge */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            style={{
              ...avatarStyle(localIdentity, 48),
              color: "white",
              fontSize: 22,
            }}
          >
            {identity?.avatar_emoji ?? "🌱"}
          </div>
          <div>
            <p className="text-[13px]" style={{ color: MUTED }}>Welcome home,</p>
            <h1 className="text-[22px] font-black leading-tight" style={{ color: TEXT }}>
              {identity?.display_name ?? "Loading…"}
            </h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 flex gap-1 mb-6 overflow-x-auto scrollbar-hide">
        {([
          { key: "home",     label: "Home",      icon: "🏡" },
          { key: "family",   label: "Family",    icon: "🌿" },
          { key: "bills",    label: "Bills",     icon: "📋" },
          { key: "bank",     label: "Bank",      icon: "🏛️" },
          { key: "messages", label: "Messages",  icon: "💌" },
          { key: "life",     label: "Life OS",   icon: "🗓️" },
          { key: "habits",   label: pendingHabits > 0 ? `Habits (${pendingHabits})` : "Habits", icon: "🔥" },
          { key: "journal",  label: "Journal",   icon: "📖" },
          { key: "memory",   label: "Memories",  icon: "🌻" },
          { key: "tools",    label: "Tools",     icon: "🧰" },
          { key: "discover",   label: "Discover",   icon: "🌍" },
          { key: "safety",     label: "Feelings",   icon: "🌱" },
          { key: "create",     label: "Create",     icon: "✨" },
          { key: "assistant",  label: "Assistant",  icon: "🌿" },
        ] as { key: Tab; label: string; icon: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-xl text-[13px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-all"
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
            <GentleSuggestions onNavigate={action => setTab(action as Tab)} />
            {/* Greeting card */}
            <div
              className="p-5 rounded-3xl"
              style={{
                background: `linear-gradient(135deg, ${localIdentity.gradientFrom}22, ${localIdentity.gradientTo}10)`,
                border: `1px solid ${localIdentity.avatarColor}22`,
              }}
            >
              <p className="text-[15px] leading-relaxed" style={{ color: TEXT }}>
                This is your family's private sanctuary. Everything here belongs to you —
                your stories, your rhythms, your people.
              </p>
              <p className="text-[13px] mt-2" style={{ color: MUTED }}>
                What would you like to do today?
              </p>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "👨‍👩‍👧‍👦", title: "Family circle",  action: () => setTab("family") },
                { icon: "📋",         title: "Bill tracker",   action: () => setTab("bills") },
                { icon: "🏛️",         title: "Family bank",   action: () => setTab("bank") },
                { icon: "💌",         title: "Messages",       action: () => setTab("messages") },
                { icon: "🗓️",         title: "Life OS",        action: () => setTab("life") },
                { icon: "🔥",         title: "Habits",         action: () => setTab("habits") },
                { icon: "✨",         title: "Create together",action: () => setTab("create") },
                { icon: "📖",         title: "Family stories", action: () => {} },
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

            {/* Family members preview */}
            {members.length > 0 && (
              <div
                className="p-4 rounded-2xl"
                style={{ background: "white", border: `1px solid ${BORDER}` }}
              >
                <p className="text-[13px] font-bold mb-3" style={{ color: TEXT }}>Your family</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {members.slice(0, 6).map(m => (
                    <div key={m.user_id} className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: `${m.avatar_color}25` }}
                      >
                        {m.avatar_emoji}
                      </div>
                      <span className="text-[12px] font-semibold" style={{ color: MUTED }}>
                        {m.display_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Family Tab ── */}
        {tab === "family" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px]" style={{ color: MUTED }}>
                Each person has their own identity — no rankings, no comparisons.
              </p>
              <button
                onClick={() => setShowInvite(true)}
                className="px-4 py-2 rounded-xl text-[12px] font-bold flex-shrink-0 ml-3"
                style={{ background: SAGE, color: "white" }}
              >
                + Invite
              </button>
            </div>
            {members.map(m => (
              <div
                key={m.user_id}
                className="p-4 rounded-2xl flex items-center gap-3"
                style={{ background: "white", border: `1px solid ${BORDER}` }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${m.avatar_color}22` }}
                >
                  {m.avatar_emoji}
                </div>
                <div>
                  <p className="text-[15px] font-bold" style={{ color: TEXT }}>{m.display_name}</p>
                  <p className="text-[11px]" style={{ color: MUTED }}>
                    {m.role === "family_child" ? "Young one" : "Adult"}
                  </p>
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <div className="py-8 text-center">
                <div className="text-3xl mb-2">🌱</div>
                <p className="text-[14px] font-semibold" style={{ color: TEXT }}>Just you for now</p>
                <p className="text-[12px] mt-1" style={{ color: MUTED }}>
                  Family members will appear here once they join
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Bills Tab ── */}
        {tab === "bills" && <BillPay />}

        {/* ── Bank Tab ── */}
        {tab === "bank" && <FamilyBank />}

        {/* ── Messages Tab ── */}
        {tab === "messages" && <FamilyMessages />}

        {/* ── Life OS Tab ── */}
        {tab === "life" && <LifeOSPanel />}

        {/* ── Habits Tab ── */}
        {tab === "habits" && (
          <div className="flex flex-col gap-4">
            <GuardianApprovalPanel onCountChange={setPendingHabits} />
            <HabitsGoals />
          </div>
        )}

        {/* ── Journal Tab ── */}
        {tab === "journal" && <PrivateJournal />}

        {/* ── Memory Garden Tab ── */}
        {tab === "memory" && <MemoryGardenPanel />}

        {/* ── Family Tools Tab ── */}
        {tab === "tools" && <FamilyToolsPanel />}

        {/* ── Discovery Engine Tab ── */}
        {tab === "discover" && <DiscoveryEnginePanel />}

        {/* ── Emotional Safety Tab ── */}
        {tab === "safety" && <EmotionalSafetyPanel isParent />}

        {/* ── Enhanced FamilyBank Tab (replaces bank for richer view) ── */}
        {tab === "bank" && (
          <div className="space-y-4">
            <FamilyBank />
            <details className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <summary className="px-4 py-3 text-[13px] font-semibold cursor-pointer" style={{ color: SAGE }}>
                🌟 Enhanced FamilyBank — Values & Rewards
              </summary>
              <div className="p-3 border-t" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
                <EnhancedFamilyBankPanel />
              </div>
            </details>
          </div>
        )}

        {/* ── Create Tab ── */}
        {tab === "create" && (
          <div className="flex flex-col gap-3">
            <p className="text-[13px]" style={{ color: MUTED }}>
              Every creation automatically gets a private family space and a public presence.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {CREATION_IDEAS.map((idea, i) => (
                <button
                  key={i}
                  className="p-4 rounded-2xl flex items-center gap-4 text-left transition-all active:scale-98"
                  style={{ background: "white", border: `1px solid ${BORDER}` }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${SAGE}12` }}
                  >
                    {idea.emoji}
                  </div>
                  <div>
                    <p className="text-[15px] font-bold" style={{ color: TEXT }}>{idea.title}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>{idea.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Assistant Tab ── */}
        {tab === "assistant" && (
          <div className="flex flex-col gap-4">
            <FamilyAssistantPanel />
          </div>
        )}
      </div>

      {showInvite && <FamilyInviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}
