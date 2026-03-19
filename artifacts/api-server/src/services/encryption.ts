/**
 * encryption.ts — Field-level encryption utilities
 *
 * Encrypts sensitive values (API keys, secrets, tokens) before storing in DB.
 * Uses AES-256-GCM (authenticated encryption — provides integrity + confidentiality).
 *
 * Key source: process.env.ENCRYPTION_KEY (32-byte hex string, 64 hex chars).
 * If key is not set, encryption is skipped with a warning (dev-only fallback).
 *
 * Usage:
 *   const encrypted = encrypt("my-secret-token");
 *   const plain     = decrypt(encrypted);
 *
 * Stored format: "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */

import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_ENV   = "ENCRYPTION_KEY";

function getKey(): Buffer | null {
  const hex = process.env[KEY_ENV];
  if (!hex || hex.length !== 64) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[encryption] ENCRYPTION_KEY is required in production. " +
        "Set a 64-character hex string (32 random bytes) in the environment secrets.",
      );
    }
    console.warn("[encryption] ENCRYPTION_KEY not set. Sensitive fields stored unencrypted. (dev-only)");
    return null;
  }
  return Buffer.from(hex, "hex");
}

/**
 * encrypt — AES-256-GCM encrypt a string value.
 * Returns "<iv>:<authTag>:<ciphertext>" or the original value if no key.
 */
export function encrypt(value: string): string {
  const key = getKey();
  if (!key) return value; // no-op if key not configured

  const iv     = randomBytes(12);                            // 96-bit nonce for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ct     = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag    = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${ct.toString("hex")}`;
}

/**
 * decrypt — reverse of encrypt. Returns original plaintext.
 * Returns the input unchanged if it doesn't match the encrypted format.
 */
export function decrypt(value: string): string {
  const key = getKey();
  if (!key) return value;

  const parts = value.split(":");
  if (parts.length !== 3) return value; // not encrypted format

  const [ivHex, tagHex, ctHex] = parts;
  try {
    const iv       = Buffer.from(ivHex, "hex");
    const tag      = Buffer.from(tagHex, "hex");
    const ct       = Buffer.from(ctHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch {
    console.warn("[encryption] Decryption failed — returning raw value");
    return value;
  }
}

/**
 * isEncrypted — check if a string looks like an encrypted value.
 * Useful before calling decrypt() on optional fields.
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  return parts.length === 3 && parts.every(p => /^[0-9a-f]+$/.test(p));
}

/**
 * deriveProjectKey — derive a deterministic per-project AES-256-GCM key.
 *
 * Uses HKDF (RFC 5869) to stretch the master ENCRYPTION_KEY with a
 * project-specific salt so each project's documents are encrypted under
 * a unique key, preventing cross-project decryption.
 *
 * Algorithm: HKDF-SHA-256
 *   IKM  = master ENCRYPTION_KEY (32 bytes)
 *   Salt = "createai-project-key-v1" (constant info prefix)
 *   Info = projectId (project-specific context)
 *   OKM  = 32 bytes → AES-256 key
 *
 * Returns null when no master key is set (dev environment).
 */
export function deriveProjectKey(projectId: string): Buffer | null {
  const masterKey = getKey();
  if (!masterKey) return null;

  const salt    = Buffer.from("createai-project-key-v1");
  const info    = Buffer.from(projectId, "utf8");
  const hashLen = 32; // SHA-256 → 32 bytes

  // HKDF-Extract: PRK = HMAC-SHA256(salt, IKM)
  const prk = createHmac("sha256", salt).update(masterKey).digest();

  // HKDF-Expand: OKM = T(1) where T(1) = HMAC-SHA256(PRK, info || 0x01)
  const t1Input = Buffer.concat([info, Buffer.from([0x01])]);
  const okm     = createHmac("sha256", prk).update(t1Input).digest();

  return okm.subarray(0, hashLen);
}

/**
 * encryptForProject — encrypt a value using a per-project derived key.
 * Falls back to the global encrypt() when no master key is configured.
 */
export function encryptForProject(value: string, projectId: string): string {
  const projectKey = deriveProjectKey(projectId);
  if (!projectKey) return value;

  const iv      = randomBytes(12);
  const cipher  = createCipheriv(ALGORITHM, projectKey, iv) as import("crypto").CipherGCM;
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * decryptForProject — decrypt a value using a per-project derived key.
 * Falls back to the raw value when no master key is configured.
 */
export function decryptForProject(value: string, projectId: string): string {
  if (!isEncrypted(value)) return value;

  const projectKey = deriveProjectKey(projectId);
  if (!projectKey) return value;

  const [ivHex, authTagHex, cipherHex] = value.split(":");
  const iv         = Buffer.from(ivHex,      "hex");
  const authTag    = Buffer.from(authTagHex, "hex");
  const cipherText = Buffer.from(cipherHex,  "hex");

  const decipher = createDecipheriv(ALGORITHM, projectKey, iv) as import("crypto").DecipherGCM;
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
  return decrypted.toString("utf8");
}
