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

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

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
