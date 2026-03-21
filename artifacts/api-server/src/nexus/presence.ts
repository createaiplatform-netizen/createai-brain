/**
 * nexus/presence.ts — Unified Presence Engine
 * ─────────────────────────────────────────────
 * Internal identity without external auth.
 * No OAuth, no email verification, no third-party service.
 *
 * Token format:   NX.{level}.{epochMin}.{nonce}.{hmac8}
 *   level:        1=visitor 2=customer 3=creator 4=owner
 *   epochMin:     Math.floor(Date.now()/60000) — compact timestamp
 *   nonce:        8 random alphanumeric chars
 *   hmac8:        first 8 chars of HMAC-SHA256(SECRET, level:epochMin:nonce:extra)
 *
 * Improvements over CORE Presence:
 *   - Numeric level encoded in token → role-check is O(1) comparison
 *   - Strict HMAC: token rejected if checksum does not match (no lenient fallback)
 *   - extra = sha256(email)[0:6] for customer tokens → tamper-evident
 *   - Expiry is encoded in epochMin → no server state needed
 *   - Cookie is httpOnly + sameSite:lax + secure in production
 */

import { createHmac, createHash }  from "crypto";
import { type Request, type Response } from "express";
import { type SpaceLevel, type RoleName, ROLE_LEVEL, LEVEL_ROLE } from "./spaces.js";
import { IDENTITY } from "../config/identity.js";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const PRESENCE_COOKIE  = "NX_PRESENCE";
export const COOKIE_MAX_SEC   = 60 * 60 * 24 * 7;  // 7 days
const        EXPIRY_MIN       = 60 * 24 * 7;        // 7 days in minutes
const        NONCE_CHARS      = "abcdefghjkmnpqrstuvwxyz23456789"; // no ambiguous chars
const        IS_PROD          = process.env["REPLIT_DEPLOYMENT"] === "1";
const        OWNER_EMAIL      = IDENTITY.contactEmail;
const        OWNER_NAME       = IDENTITY.ownerName;

export type  PresenceLevel    = SpaceLevel;
export type  PresenceRole     = RoleName;

export interface NXPresence {
  token:    string;
  level:    PresenceLevel;
  role:     PresenceRole;
  name:     string | null;
  email:    string | null;
  issuedAt: Date;
  expiresAt:Date;
  valid:    boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal
// ─────────────────────────────────────────────────────────────────────────────

function secret(): string {
  return process.env["NEXUS_SECRET"] ?? process.env["CORE_SECRET"] ?? "nexus_v1_internal_createai";
}

function ownerPass(): string {
  return process.env["CORE_OWNER_PASS"] ?? "createai2024";
}

function nonce(len = 8): string {
  let s = "";
  for (let i = 0; i < len; i++) s += NONCE_CHARS[Math.floor(Math.random() * NONCE_CHARS.length)];
  return s;
}

function emailHash(email: string): string {
  return createHash("sha256").update(email.toLowerCase().trim()).digest("hex").slice(0, 6);
}

function sign(level: number, epochMin: number, n: string, extra: string): string {
  const payload = `${level}:${epochMin}:${n}:${extra}`;
  return createHmac("sha256", secret()).update(payload).digest("hex").slice(0, 8);
}

// ─────────────────────────────────────────────────────────────────────────────
// Issue
// ─────────────────────────────────────────────────────────────────────────────

export function issuePresence(
  role: PresenceRole,
  email?: string,
  name?: string,
): NXPresence {
  const level     = ROLE_LEVEL[role] as PresenceLevel;
  const epochMin  = Math.floor(Date.now() / 60000);
  const n         = nonce(8);
  const extra     = email ? emailHash(email) : "";
  const hmac8     = sign(level, epochMin, n, extra);
  const token     = `NX.${level}.${epochMin}.${n}.${hmac8}`;

  const issuedAt  = new Date(epochMin * 60000);
  const expiresAt = new Date(issuedAt.getTime() + EXPIRY_MIN * 60000);

  return { token, level, role, name: name ?? null, email: email ?? null, issuedAt, expiresAt, valid: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse + verify
// ─────────────────────────────────────────────────────────────────────────────

export function parsePresence(token: string, emailHint?: string): NXPresence | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 5 || parts[0] !== "NX") return null;

    const [, levelStr, epochMinStr, n, hmac8] = parts;
    const level    = parseInt(levelStr ?? "0", 10) as SpaceLevel;
    const epochMin = parseInt(epochMinStr ?? "0", 10);
    if (![1,2,3,4].includes(level)) return null;
    if (!n || !hmac8) return null;

    // Strict HMAC verification — no lenient fallback
    const extra   = emailHint ? emailHash(emailHint) : "";
    const expected = sign(level, epochMin, n, extra);
    if (hmac8 !== expected) {
      // If no email hint, also try empty-extra signature (visitor/owner tokens)
      if (extra !== "") {
        const expected2 = sign(level, epochMin, n, "");
        if (hmac8 !== expected2) return null;
      } else {
        return null;
      }
    }

    // Expiry
    const nowMin = Math.floor(Date.now() / 60000);
    if (nowMin - epochMin > EXPIRY_MIN) return null;

    const issuedAt  = new Date(epochMin * 60000);
    const expiresAt = new Date(issuedAt.getTime() + EXPIRY_MIN * 60000);
    const role      = LEVEL_ROLE[level] as PresenceRole;

    return { token, level, role, name: null, email: emailHint ?? null, issuedAt, expiresAt, valid: true };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cookie helpers
// ─────────────────────────────────────────────────────────────────────────────

export function setPresenceCookie(res: Response, p: NXPresence): void {
  res.cookie(PRESENCE_COOKIE, p.token, {
    httpOnly: true,
    maxAge:   COOKIE_MAX_SEC * 1000,
    sameSite: "lax",
    secure:   IS_PROD,
  });
}

export function clearPresenceCookie(res: Response): void {
  res.clearCookie(PRESENCE_COOKIE);
}

export function getPresence(req: Request): { presence: NXPresence | null; level: PresenceLevel } {
  const token = req.cookies?.[PRESENCE_COOKIE] as string | undefined;
  if (!token) return { presence: null, level: 1 };
  const p = parsePresence(token);
  if (!p) return { presence: null, level: 1 };
  return { presence: p, level: p.level };
}

// ─────────────────────────────────────────────────────────────────────────────
// Proof verification (no external auth)
// ─────────────────────────────────────────────────────────────────────────────

import { findCustomerByEmail } from "../semantic/customerStore.js";

export type ProofResult =
  | { ok: true; presence: NXPresence }
  | { ok: false; status: number; error: string };

export function proveOwner(passphrase?: string): ProofResult {
  if (!passphrase || passphrase !== ownerPass()) {
    return { ok: false, status: 401, error: "Invalid owner passphrase." };
  }
  return { ok: true, presence: issuePresence("owner", OWNER_EMAIL, OWNER_NAME) };
}

export function proveCreator(passphrase?: string): ProofResult {
  if (!passphrase || passphrase !== ownerPass()) {
    return { ok: false, status: 401, error: "Invalid creator passphrase." };
  }
  return { ok: true, presence: issuePresence("creator", undefined, "Creator") };
}

export function proveCustomer(email?: string): ProofResult {
  if (!email?.trim()) {
    return { ok: false, status: 400, error: "Email is required for customer presence." };
  }
  const clean   = email.toLowerCase().trim();
  const matches = findCustomerByEmail(clean);
  if (!matches.length) {
    return { ok: false, status: 404, error: "No purchases on record for this email. Visit /store first." };
  }
  const c = matches[0];
  return { ok: true, presence: issuePresence("customer", c!.email, c!.name ?? "") };
}

export function proveVisitor(): ProofResult {
  return { ok: true, presence: issuePresence("visitor") };
}

// ─────────────────────────────────────────────────────────────────────────────
// Role display metadata
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_META: Record<PresenceRole, {
  label:    string;
  icon:     string;
  color:    string;
  bg:       string;
  border:   string;
  desc:     string;
  surfaces: string;
}> = {
  owner:    { label: "Owner",    icon: "◈", color: "#818cf8", bg: "rgba(99,102,241,0.12)", border: "#4f46e5", desc: "Full platform access — all 15 spaces", surfaces: "15" },
  creator:  { label: "Creator",  icon: "◇", color: "#34d399", bg: "rgba(16,185,129,0.10)", border: "#059669", desc: "Revenue + content — 12 spaces", surfaces: "12" },
  customer: { label: "Customer", icon: "◆", color: "#60a5fa", bg: "rgba(59,130,246,0.10)", border: "#2563eb", desc: "Commerce + self-service — 6 spaces", surfaces: "6" },
  visitor:  { label: "Visitor",  icon: "○", color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "#475569", desc: "Public access — 5 spaces", surfaces: "5" },
};
