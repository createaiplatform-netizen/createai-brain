/**
 * utils/launchFlags.ts — Launch & Outbound Control Flag Reader
 * ─────────────────────────────────────────────────────────────
 * Lightweight helper for reading launch-control feature flags from
 * platform_feature_flags. Used by all outbound flows to gate sends.
 *
 * All launch flags default to OFF — nothing fires until explicitly enabled
 * through the Launch & Outbound Control screen (admin/founder only).
 */

import { getSql } from "../lib/db.js";

export const LAUNCH_FLAG_KEYS = {
  PRODUCTION_MODE:      "launch_production_mode",
  MAGICLINK_EMAILS:     "launch_magiclink_emails",
  FAMILY_INVITES:       "launch_family_invites",
  FAMILY_WELCOME_EMAILS:"launch_family_welcome_emails",
  POST_PURCHASE_EMAILS: "launch_post_purchase_emails",
  NURTURE_SEQUENCES:    "launch_nurture_sequences",
  AD_CAMPAIGNS:         "launch_ad_campaigns",
} as const;

export type LaunchFlagKey = typeof LAUNCH_FLAG_KEYS[keyof typeof LAUNCH_FLAG_KEYS];

/** Returns true if the given launch flag is enabled in the DB. Falls back to false on error. */
export async function getLaunchFlag(key: LaunchFlagKey): Promise<boolean> {
  try {
    const sql = getSql();
    const [row] = await sql<[{ enabled: boolean }]>`
      SELECT enabled FROM platform_feature_flags WHERE key = ${key} LIMIT 1
    `;
    return row?.enabled === true;
  } catch {
    return false;
  }
}

/** Returns all launch flags as a map of key → enabled. Falls back to all-false on error. */
export async function getAllLaunchFlags(): Promise<Record<LaunchFlagKey, boolean>> {
  const defaults = Object.fromEntries(
    Object.values(LAUNCH_FLAG_KEYS).map(k => [k, false])
  ) as Record<LaunchFlagKey, boolean>;

  try {
    const sql = getSql();
    const rows = await sql<Array<{ key: string; enabled: boolean }>>`
      SELECT key, enabled FROM platform_feature_flags
      WHERE key = ANY(${Object.values(LAUNCH_FLAG_KEYS)})
    `;
    for (const row of rows) {
      const k = row.key as LaunchFlagKey;
      if (k in defaults) defaults[k] = row.enabled;
    }
    return defaults;
  } catch {
    return defaults;
  }
}
