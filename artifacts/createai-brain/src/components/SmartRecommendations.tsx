import React, { useEffect, useState, useMemo } from "react";
import { useOS, type AppId } from "@/os/OSContext";
import { useUserRole } from "@/hooks/useUserRole";

// ─── SmartRecommendations ─────────────────────────────────────────────────────
// Persona-aware app recommendations.
// Surfaces 3 relevant apps based on: role → recent activity → time of day.
// Progressive disclosure: never more than 3 cards, always horizontal scroll.

interface Rec { id: AppId; icon: string; label: string; reason: string; color: string; }
interface ActivityItem { id: number; label: string; icon: string; appId: string; createdAt: string; }

// Role-specific default recommendations shown before activity data loads
const ROLE_DEFAULTS: Record<string, Rec[]> = {
  founder: [
    { id: "commandcenter", icon: "🎛️", label: "Command Center", reason: "Full platform overview",           color: "#6366f1" },
    { id: "brainhub",      icon: "⚡", label: "Brain Hub",       reason: "Run strategic engines",            color: "#f59e0b" },
    { id: "opportunity",   icon: "🎯", label: "Opportunities",   reason: "Discover your next move",          color: "#10b981" },
  ],
  admin: [
    { id: "commandcenter", icon: "🎛️", label: "Command Center", reason: "Platform health at a glance",      color: "#6366f1" },
    { id: "brainhub",      icon: "⚡", label: "Brain Hub",       reason: "Generate platform content",        color: "#f59e0b" },
    { id: "projos",        icon: "🗂️", label: "Projects",       reason: "Review active projects",           color: "#0891b2" },
  ],
  customer: [
    { id: "brainhub",      icon: "⚡", label: "Brain Hub",       reason: "Start generating today",           color: "#f59e0b" },
    { id: "creator",       icon: "✨", label: "Create",          reason: "Build something new",              color: "#8b5cf6" },
    { id: "documents",     icon: "📄", label: "Documents",       reason: "View your saved outputs",          color: "#0891b2" },
  ],
  family_adult: [
    { id: "family",        icon: "🏠", label: "Family Hub",      reason: "Your family dashboard",            color: "#10b981" },
    { id: "chat",          icon: "💬", label: "AI Chat",         reason: "Ask the Brain anything",           color: "#007AFF" },
    { id: "opportunity",   icon: "🎯", label: "Opportunities",   reason: "Spot new possibilities",           color: "#f59e0b" },
  ],
  family_child: [
    { id: "chat",          icon: "💬", label: "AI Chat",         reason: "Chat with the Brain",              color: "#007AFF" },
    { id: "creator",       icon: "✨", label: "Create",          reason: "Make something cool",              color: "#f472b6" },
    { id: "brainhub",      icon: "⚡", label: "Brain Hub",       reason: "Explore ideas",                    color: "#f59e0b" },
  ],
};

// Recommendations based on the most-recently-used app
const RELATED: Record<string, Rec[]> = {
  chat: [
    { id: "brainhub",    icon: "⚡", label: "Brain Hub",        reason: "Power up your conversation",      color: "#f59e0b" },
    { id: "documents",   icon: "📄", label: "Documents",        reason: "Save what you created",           color: "#0891b2" },
    { id: "creator",     icon: "✨", label: "Create",           reason: "Go deeper with AI generation",    color: "#8b5cf6" },
  ],
  projos: [
    { id: "people",      icon: "👥", label: "People",           reason: "Manage your project team",        color: "#10b981" },
    { id: "documents",   icon: "📄", label: "Documents",        reason: "Store project assets",            color: "#0891b2" },
    { id: "opportunity", icon: "🎯", label: "Opportunities",    reason: "Track project outcomes",          color: "#f59e0b" },
  ],
  marketing: [
    { id: "brainhub",    icon: "⚡", label: "Brain Hub",        reason: "Run a full content series",       color: "#f59e0b" },
    { id: "simulation",  icon: "🧪", label: "Simulate",         reason: "Model your campaign impact",      color: "#a855f7" },
    { id: "opportunity", icon: "🎯", label: "Opportunities",    reason: "Track campaign results",          color: "#f59e0b" },
  ],
  brainhub: [
    { id: "simulation",    icon: "🧪", label: "Simulate",       reason: "Test your engine output",         color: "#a855f7" },
    { id: "creator",       icon: "✨", label: "Create",         reason: "Generate from any engine",        color: "#f472b6" },
    { id: "commandcenter", icon: "🎛️", label: "Command Center", reason: "Full platform control",           color: "#6366f1" },
  ],
  documents: [
    { id: "projos",      icon: "🗂️", label: "Projects",        reason: "Organise into a project",         color: "#6366f1" },
    { id: "creator",     icon: "✨", label: "Create",           reason: "Generate more content",           color: "#f472b6" },
    { id: "brainhub",    icon: "⚡", label: "Brain Hub",        reason: "AI-write your next document",     color: "#f59e0b" },
  ],
  opportunity: [
    { id: "simulation",  icon: "🧪", label: "Simulate",         reason: "Simulate the opportunity",        color: "#a855f7" },
    { id: "marketing",   icon: "📣", label: "Marketing",        reason: "Build your go-to-market",         color: "#f472b6" },
    { id: "brainhub",    icon: "⚡", label: "Brain Hub",        reason: "Run a strategic series",          color: "#f59e0b" },
  ],
  simulation: [
    { id: "brainhub",    icon: "⚡", label: "Brain Hub",        reason: "Run full engine analysis",        color: "#f59e0b" },
    { id: "opportunity", icon: "🎯", label: "Opportunities",    reason: "Convert insight to action",       color: "#f59e0b" },
    { id: "creator",     icon: "✨", label: "Create",           reason: "Generate from your simulation",   color: "#f472b6" },
  ],
  commandcenter: [
    { id: "brainhub",    icon: "⚡", label: "Brain Hub",        reason: "Generate strategic content",      color: "#f59e0b" },
    { id: "projos",      icon: "🗂️", label: "Projects",        reason: "Review active projects",          color: "#6366f1" },
    { id: "opportunity", icon: "🎯", label: "Opportunities",    reason: "Discover new leads",              color: "#10b981" },
  ],
};

// Time-of-day defaults (used when activity is empty and role unknown)
function timeRecs(): Rec[] {
  const h = new Date().getHours();
  if (h < 11) return [
    { id: "projos",    icon: "🗂️", label: "Projects",      reason: "Start your morning with a plan",  color: "#6366f1" },
    { id: "chat",      icon: "💬", label: "AI Chat",       reason: "Plan your day with the Brain",     color: "#007AFF" },
    { id: "brainhub",  icon: "⚡", label: "Brain Hub",     reason: "Generate ideas for today",         color: "#f59e0b" },
  ];
  if (h < 17) return [
    { id: "simulation",  icon: "🧪", label: "Simulate",     reason: "Test your business model",         color: "#a855f7" },
    { id: "opportunity", icon: "🎯", label: "Opportunities", reason: "Spot your next move",              color: "#f59e0b" },
    { id: "marketing",   icon: "📣", label: "Marketing",    reason: "Build your audience",              color: "#f472b6" },
  ];
  return [
    { id: "documents",   icon: "📄", label: "Documents",    reason: "Document today's work",            color: "#0891b2" },
    { id: "creator",     icon: "✨", label: "Create",       reason: "End the day with creation",        color: "#f472b6" },
    { id: "opportunity", icon: "🎯", label: "Opportunities", reason: "Review your pipeline",            color: "#f59e0b" },
  ];
}

export function SmartRecommendations() {
  const { openApp } = useOS();
  const { role }    = useUserRole();
  const [recs, setRecs]     = useState<Rec[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/activity?limit=20", { credentials: "include" })
      .then(r => r.ok ? r.json() : { activity: [] })
      .then((d: { activity?: ActivityItem[] }) => {
        const acts = d.activity ?? [];
        // Count apps by usage frequency
        const counts: Record<string, number> = {};
        acts.forEach(a => { if (a.appId) counts[a.appId] = (counts[a.appId] ?? 0) + 1; });
        const topApp = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];

        // Priority: activity-based → role-based → time-based
        let result: Rec[];
        if (topApp && RELATED[topApp]) {
          result = RELATED[topApp];
        } else if (role && ROLE_DEFAULTS[role]) {
          result = ROLE_DEFAULTS[role]!;
        } else {
          result = timeRecs();
        }
        setRecs(result.slice(0, 3));
      })
      .catch(() => {
        const fallback = (role && ROLE_DEFAULTS[role]) ? ROLE_DEFAULTS[role]! : timeRecs();
        setRecs(fallback.slice(0, 3));
      })
      .finally(() => setLoaded(true));
  }, [role]);

  if (!loaded || recs.length === 0) return null;

  return (
    <div style={{ padding: "0 16px 4px" }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: "#94a3b8",
        letterSpacing: "0.07em", textTransform: "uppercase",
        marginBottom: 8,
      }}>Suggested for you</div>

      <div style={{
        display: "flex", gap: 8, overflowX: "auto",
        scrollbarWidth: "none", paddingBottom: 2,
      }}>
        {recs.map(rec => (
          <button
            key={rec.id}
            onClick={() => openApp(rec.id)}
            style={{
              background: "#fff", border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 12, padding: "10px 14px",
              cursor: "pointer", textAlign: "left", flexShrink: 0,
              minWidth: 148, maxWidth: 200,
              transition: "all 0.15s", fontFamily: "inherit",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = `${rec.color}40`;
              (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 12px ${rec.color}15`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 5 }}>{rec.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 2, letterSpacing: "-0.01em" }}>
              {rec.label}
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.4 }}>{rec.reason}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
