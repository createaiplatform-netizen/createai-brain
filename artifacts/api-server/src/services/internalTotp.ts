/**
 * internalTotp.ts — Internal TOTP Engine (RFC 6238)
 *
 * Pure Node.js implementation of TOTP (Time-based One-Time Password).
 * No external packages. Uses only Node's built-in `crypto` module.
 * Algorithm: HMAC-SHA1 over a time counter, per RFC 4226 (HOTP) +
 *            RFC 6238 (TOTP time window).
 *
 * This deploys the "TOTP / authenticator app support" stability feature.
 * Compatible with Google Authenticator, Authy, 1Password, and any TOTP app.
 */

import { createHmac, randomBytes } from "crypto";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Encode a Buffer to Base32 (RFC 4648) */
function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i]!;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_CHARS[(value << (5 - bits)) & 31];
  while (output.length % 8 !== 0) output += "=";
  return output;
}

/** Decode a Base32 string to Buffer */
function base32Decode(str: string): Buffer {
  const input = str.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of input) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

/** Generate a cryptographically secure TOTP secret (20 bytes → 32-char Base32) */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** Compute TOTP code for a given secret and timestamp (defaults to now) */
export function computeTotp(secret: string, ts?: number): string {
  const time = Math.floor((ts ?? Date.now()) / 1000 / 30);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(time));
  const key = base32Decode(secret);
  const hmac = createHmac("sha1", key).update(counter).digest();
  const offset = (hmac[19]! & 0x0f);
  const code =
    ((hmac[offset]!     & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8)  |
     (hmac[offset + 3]! & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

/** Verify a TOTP code (±1 window tolerance = ±30s) */
export function verifyTotp(secret: string, token: string, ts?: number): boolean {
  const now = ts ?? Date.now();
  for (const window of [-1, 0, 1]) {
    if (computeTotp(secret, now + window * 30_000) === token.trim()) return true;
  }
  return false;
}

/** Generate an otpauth:// URI for QR code scanners */
export function totpUri(secret: string, account: string, issuer = "CreateAI Brain"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/** Platform TOTP state — in-memory store (production: migrate to DB) */
interface TotpRecord {
  userId: string;
  secret: string;
  verified: boolean;
  createdAt: string;
}

const _store = new Map<string, TotpRecord>();

export function enrollTotp(userId: string): { secret: string; uri: string } {
  const secret = generateTotpSecret();
  _store.set(userId, { userId, secret, verified: false, createdAt: new Date().toISOString() });
  const uri = totpUri(secret, userId);
  return { secret, uri };
}

export function confirmTotpEnrollment(userId: string, token: string): boolean {
  const record = _store.get(userId);
  if (!record) return false;
  const valid = verifyTotp(record.secret, token);
  if (valid) {
    _store.set(userId, { ...record, verified: true });
  }
  return valid;
}

export function getTotpStatus(userId: string): { enrolled: boolean; verified: boolean } {
  const record = _store.get(userId);
  return {
    enrolled: !!record,
    verified: record?.verified ?? false,
  };
}

export function getTotpStats(): { totalEnrolled: number; totalVerified: number } {
  let totalVerified = 0;
  for (const r of _store.values()) if (r.verified) totalVerified++;
  return { totalEnrolled: _store.size, totalVerified };
}
