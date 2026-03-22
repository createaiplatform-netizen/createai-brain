/**
 * routes/launch.ts — Launch & Outbound Control API
 * ──────────────────────────────────────────────────
 * Admin/founder-only endpoint for reading and applying launch flags.
 * All launch flags are backed by platform_feature_flags table.
 *
 * GET  /api/launch/config   — returns current state of all launch flags
 * POST /api/launch/apply    — bulk-sets launch flags + logs the action
 */

import { Router, type Request, type Response } from "express";
import { getSql }                               from "../lib/db.js";
import { requireAuth }                          from "../middlewares/requireAuth.js";
import { getAllLaunchFlags, LAUNCH_FLAG_KEYS, type LaunchFlagKey } from "../utils/launchFlags.js";

const router = Router();

/** Metadata for each launch flag — displayed in UI and audit logs */
export const LAUNCH_FLAG_META: Record<LaunchFlagKey, {
  group: string;
  label: string;
  description: string;
  noopNote?: string;
}> = {
  [LAUNCH_FLAG_KEYS.PRODUCTION_MODE]: {
    group: "Platform",
    label: "Go live with app + all universes",
    description: "Enables full production mode — all universes (Admin, Family, Kids, Customer) become active.",
  },
  [LAUNCH_FLAG_KEYS.MAGICLINK_EMAILS]: {
    group: "Access",
    label: "Enable magic-link login emails",
    description: "When ON, passwordless login links are emailed to users via Resend. Requires RESEND_API_KEY.",
  },
  [LAUNCH_FLAG_KEYS.FAMILY_INVITES]: {
    group: "Family outbound",
    label: "Enable family invites",
    description: "When ON, family member invitation messages and emails can be dispatched through the platform.",
  },
  [LAUNCH_FLAG_KEYS.FAMILY_WELCOME_EMAILS]: {
    group: "Family outbound",
    label: "Enable family welcome emails",
    description: "When ON, first-login welcome emails are sent to family-role users via the outbound engine.",
  },
  [LAUNCH_FLAG_KEYS.POST_PURCHASE_EMAILS]: {
    group: "Marketing outbound",
    label: "Enable post-purchase emails",
    description: "When ON, T+3 day follow-up emails are scheduled and sent after each product purchase.",
  },
  [LAUNCH_FLAG_KEYS.NURTURE_SEQUENCES]: {
    group: "Marketing outbound",
    label: "Enable nurture / upsell sequences",
    description: "When ON, T+7 day upsell emails are scheduled and sent after each product purchase.",
  },
  [LAUNCH_FLAG_KEYS.AD_CAMPAIGNS]: {
    group: "Ads",
    label: "Enable ad campaigns (Google / Meta / etc.)",
    description: "When ON, ad campaigns are attempted via connected ad platforms. This is a NO-OP unless ad credentials (META_ACCESS_TOKEN, GOOGLE_ADS_DEVELOPER_TOKEN, etc.) are present.",
    noopNote: "NO-OP unless ad credentials are configured.",
  },
};

/** Ensure all 7 launch flags exist in platform_feature_flags (all default OFF) */
async function ensureLaunchFlags() {
  const sql = getSql();
  const entries = Object.entries(LAUNCH_FLAG_META) as [LaunchFlagKey, typeof LAUNCH_FLAG_META[LaunchFlagKey]][];
  for (const [key, meta] of entries) {
    await sql`
      INSERT INTO platform_feature_flags (key, name, description, enabled, rollout_pct, environment)
      VALUES (
        ${key},
        ${meta.label},
        ${meta.description},
        FALSE,
        100,
        'all'
      )
      ON CONFLICT (key) DO NOTHING
    `.catch(() => {});
  }
}

ensureLaunchFlags().catch(() => {});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/launch/config — returns all launch flags with metadata
// ─────────────────────────────────────────────────────────────────────────────
router.get("/config", requireAuth, async (_req: Request, res: Response) => {
  const flags = await getAllLaunchFlags();
  const config = (Object.entries(LAUNCH_FLAG_META) as [LaunchFlagKey, typeof LAUNCH_FLAG_META[LaunchFlagKey]][])
    .map(([key, meta]) => ({
      key,
      group:       meta.group,
      label:       meta.label,
      description: meta.description,
      noopNote:    meta.noopNote,
      enabled:     flags[key] ?? false,
    }));
  res.json({ ok: true, config });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/launch/apply — bulk-sets launch flags + logs action
// Body: { flags: Record<string, boolean>, actorId?: string }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/apply", requireAuth, async (req: Request, res: Response) => {
  const body = req.body as { flags?: Record<string, boolean> };
  if (!body.flags || typeof body.flags !== "object") {
    res.status(400).json({ error: "flags object required" });
    return;
  }

  const sql = getSql();
  const session = req.session as { userId?: string; role?: string } | undefined;
  const actorId   = session?.userId ?? "unknown";
  const actorRole = session?.role   ?? "unknown";

  const validKeys = new Set(Object.values(LAUNCH_FLAG_KEYS));
  const applied: Record<string, boolean> = {};
  const errors:  Array<{ key: string; error: string }> = [];

  for (const [key, enabled] of Object.entries(body.flags)) {
    if (!validKeys.has(key as LaunchFlagKey)) {
      errors.push({ key, error: "not a launch flag key" });
      continue;
    }
    try {
      await sql`
        INSERT INTO platform_feature_flags (key, name, description, enabled, rollout_pct, environment)
        VALUES (
          ${key},
          ${LAUNCH_FLAG_META[key as LaunchFlagKey].label},
          ${LAUNCH_FLAG_META[key as LaunchFlagKey].description},
          ${enabled},
          100,
          'all'
        )
        ON CONFLICT (key) DO UPDATE SET enabled = ${enabled}, updated_at = NOW()
      `;
      applied[key] = enabled;
    } catch (e) {
      errors.push({ key, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Audit log ───────────────────────────────────────────────────────────────
  try {
    await sql`
      INSERT INTO platform_audit_logs (actor_id, event_type, details)
      VALUES (
        ${actorId},
        'launch_control_apply',
        ${JSON.stringify({ actorRole, applied, errors, appliedAt: new Date().toISOString() })}::jsonb
      )
    `;
  } catch {
    /* audit log failure is non-fatal */
  }

  res.json({
    ok:      errors.length === 0,
    applied,
    errors,
    message: `${Object.keys(applied).length} flag(s) updated.${errors.length ? ` ${errors.length} error(s).` : ""}`,
  });
});

export default router;
