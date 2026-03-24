/**
 * identity.ts — Single source of truth for all platform branding.
 *
 * This file now delegates to the NEXUS Platform Address (NPA) resolver.
 * No purchased domain is required. The resolver auto-detects the live URL
 * from the Replit runtime environment.
 *
 * Optional secrets (set in Replit → Secrets to upgrade identity):
 *   BRAND_DOMAIN       — your purchased domain (e.g. createai.com)
 *   CONTACT_EMAIL      — your contact address
 *   RESEND_FROM_EMAIL  — your verified Resend sending address
 *
 * Without those secrets the platform resolves its identity automatically
 * using REPLIT_DEV_DOMAIN and Resend's shared sending domain.
 *
 * See: src/config/nexusIdentityResolver.ts for the full NPA specification.
 */

import { resolveNexusIdentity }                  from "./nexusIdentityResolver.js";
import { PLATFORM }                               from "../services/platformIdentity.js";

const id = resolveNexusIdentity();

export const IDENTITY = {
  // ── Dynamic fields (resolved from Replit env / secrets) ──────────────────
  platformName:  id.platformName,
  legalEntity:   id.legalEntity,
  ownerName:     id.ownerName,
  brandDomain:   id.liveDomain,
  platformUrl:   id.liveUrl,
  contactEmail:  id.contactEmail,
  fromEmail:     id.fromEmail,
  fromHeader:    id.fromHeader,
  cashApp:       id.cashApp,
  venmo:         id.venmo,
  shortBio:      id.shortBio,
  mediumBio:     id.mediumBio,
  longBio:       id.longBio,
  linkedInBio:   id.linkedInBio,
  founderBio:    id.founderBio,
  npa:           id.npa,
  handle:        id.handle,
  // ── Static brand values — sourced from platformIdentity (single truth) ────
  brandColor:    PLATFORM.brandColor,
  brandColorLight: PLATFORM.brandColorLight,
  bgColor:       PLATFORM.bgColor,
  textColor:     PLATFORM.textColor,
  mutedColor:    PLATFORM.mutedColor,
  supportEmail:  PLATFORM.supportEmail,
  supportUrl:    PLATFORM.supportUrl,
} as const;
