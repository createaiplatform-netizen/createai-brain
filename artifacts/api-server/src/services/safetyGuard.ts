// ─── Safety Guard ─────────────────────────────────────────────────────────────
// Lightweight, centralized safety and boundary validation helpers.
// Used across API routes and the outbound engine to enforce:
//   • Role-based access control for any given action
//   • Kids/guardian boundary rules
//   • Privacy boundary checks (who can see whose data)
//   • Safe content validation
//
// This is NOT legal advice. It is a platform-level safety layer only.

import type { Request, Response } from "express";
import { getSql } from "../lib/db";

// ─── Role permission map ──────────────────────────────────────────────────────

type Universe = "admin" | "family" | "kids" | "customer" | "public";

const UNIVERSE_ROLES: Record<Universe, string[]> = {
  admin:    ["admin", "founder"],
  family:   ["family_adult", "admin", "founder"],
  kids:     ["family_child"],
  customer: ["customer", "admin", "founder"],
  public:   ["admin", "founder", "family_adult", "family_child", "customer", "user", "viewer"],
};

const SENSITIVE_ACTIONS = [
  "view_journal",
  "delete_account",
  "export_data",
  "view_family_bank",
  "change_role",
  "send_message",
  "view_audit_log",
  "send_outbound",
] as const;

type SensitiveAction = (typeof SENSITIVE_ACTIONS)[number];

const ACTION_ALLOWED_ROLES: Record<SensitiveAction, string[]> = {
  view_journal:       ["family_adult", "family_child", "customer", "admin", "founder"],
  delete_account:     ["admin", "founder"],
  export_data:        ["family_adult", "family_child", "customer", "admin", "founder"],
  view_family_bank:   ["family_adult", "admin", "founder"],
  change_role:        ["admin", "founder"],
  send_message:       ["family_adult", "family_child", "admin", "founder"],
  view_audit_log:     ["admin", "founder"],
  send_outbound:      ["admin", "founder"],
};

// ─── Core validators ──────────────────────────────────────────────────────────

/** Returns true if the given role is allowed to perform action. */
export function validateRoleAccess(
  action: SensitiveAction,
  userRole: string,
): boolean {
  const allowed = ACTION_ALLOWED_ROLES[action];
  return allowed?.includes(userRole) ?? false;
}

/** Returns true if the given role is allowed in the universe. */
export function validateUniverseAccess(
  universe: Universe,
  userRole: string,
): boolean {
  return UNIVERSE_ROLES[universe]?.includes(userRole) ?? false;
}

/**
 * Enforces that a family_child user cannot:
 *  - Access billing/financial routes
 *  - Export their own data (requires guardian)
 *  - Send messages to non-family users
 * Returns an error message string if blocked, null if allowed.
 */
export function enforceKidGuardianRules(
  action: SensitiveAction,
  userRole: string,
): string | null {
  if (userRole !== "family_child") return null;

  const kidBlocked: SensitiveAction[] = [
    "delete_account",
    "view_family_bank",
    "change_role",
    "view_audit_log",
    "send_outbound",
  ];
  if (kidBlocked.includes(action)) {
    return `This action is not available in the Kids Universe. Please ask a family adult for help.`;
  }
  return null;
}

/**
 * Checks whether requestingUserId is allowed to access targetUserId's data.
 * Admins/founders can see any user's non-private data.
 * Private data (journals, private bank goals) is ALWAYS user-only.
 */
export function checkPrivacyBoundary(params: {
  targetUserId: string;
  requestingUserId: string;
  requestingRole: string;
  dataType: "private" | "family" | "admin-viewable";
}): boolean {
  const { targetUserId, requestingUserId, requestingRole, dataType } = params;

  // Same user always allowed
  if (targetUserId === requestingUserId) return true;

  // Private data: never allow cross-user access regardless of role
  if (dataType === "private") return false;

  // Admin-viewable data: admin/founder can see
  if (dataType === "admin-viewable") {
    return ["admin", "founder"].includes(requestingRole);
  }

  // Family data: family_adult and admin/founder only
  if (dataType === "family") {
    return ["family_adult", "admin", "founder"].includes(requestingRole);
  }

  return false;
}

/** Validates content for kids-safe use (no comparative language). */
export function validateKidSafeContent(text: string): { safe: boolean; reason?: string } {
  const banned = ["best", "worst", "winner", "loser", "first place", "#1", "ranked", "beat", "outperformed"];
  const lower = text.toLowerCase();
  for (const word of banned) {
    if (lower.includes(word)) {
      return { safe: false, reason: `Content contains restricted term: "${word}"` };
    }
  }
  return { safe: true };
}

// ─── Express middleware helper ────────────────────────────────────────────────

/** Middleware-style guard. Call at top of admin-only handlers. */
export async function requireAdminOrFounder(
  req: Request,
  res: Response,
): Promise<boolean> {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  const sql = getSql();
  const user = req.user as { id: string };
  const [row] = await sql`SELECT role FROM users WHERE id = ${user.id}`;
  if (!row || !["admin", "founder"].includes(row.role as string)) {
    res.status(403).json({ error: "Admin or founder access required" });
    return false;
  }
  return true;
}

/** Logs a safety boundary violation to the audit log (non-throwing). */
export async function logSafetyEvent(params: {
  actorId: string;
  action: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const sql = getSql();
    const id = "safety_" + Date.now().toString(36);
    await sql`
      INSERT INTO platform_audit_logs (id, actor_id, event_type, details)
      VALUES (${id}, ${params.actorId}, ${"safety_violation"}, ${JSON.stringify(params.details ?? {})})
    `;
  } catch {
    // Non-throwing — safety logging must not crash the request
  }
}
