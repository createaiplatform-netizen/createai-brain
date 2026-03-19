// ═══════════════════════════════════════════════════════════════════════════
// MEMORY SERVICE — Encrypted key-value store backed by memory_store table.
//
// Wraps the existing AES-256-GCM encryption.ts utilities with DB persistence.
// All values are encrypted at rest using the ENCRYPTION_KEY env var.
// API keys, tokens, and secrets must flow through this service — never plain.
// ═══════════════════════════════════════════════════════════════════════════

import { and, eq }   from "drizzle-orm";
import { db }        from "@workspace/db";
import { memoryStore } from "@workspace/db";
import { encrypt, decrypt } from "./encryption";

/**
 * saveMemory — encrypt value and upsert into memory_store.
 * If a row for (userId, key) already exists it is overwritten.
 */
export async function saveMemory(
  userId: string,
  key:    string,
  value:  string,
): Promise<void> {
  const valueEncrypted = encrypt(value);
  await db
    .insert(memoryStore)
    .values({ userId, key, valueEncrypted })
    .onConflictDoUpdate({
      target:  [memoryStore.userId, memoryStore.key],
      set: {
        valueEncrypted,
        updatedAt: new Date(),
      },
    });
}

/**
 * loadMemory — retrieve and decrypt a stored value.
 * Returns null if no matching entry exists.
 */
export async function loadMemory(
  userId: string,
  key:    string,
): Promise<string | null> {
  const [row] = await db
    .select()
    .from(memoryStore)
    .where(and(eq(memoryStore.userId, userId), eq(memoryStore.key, key)))
    .limit(1);
  if (!row) return null;
  return decrypt(row.valueEncrypted);
}

/**
 * deleteMemory — remove a stored entry. No-op if not found.
 */
export async function deleteMemory(
  userId: string,
  key:    string,
): Promise<void> {
  await db
    .delete(memoryStore)
    .where(and(eq(memoryStore.userId, userId), eq(memoryStore.key, key)));
}

/**
 * listMemoryKeys — return all stored key names for a user.
 * Values are never returned — keys only.
 */
export async function listMemoryKeys(userId: string): Promise<string[]> {
  const rows = await db
    .select({ key: memoryStore.key })
    .from(memoryStore)
    .where(eq(memoryStore.userId, userId));
  return rows.map(r => r.key);
}

/**
 * hasMemory — check if a specific key exists for a user (no decryption).
 */
export async function hasMemory(userId: string, key: string): Promise<boolean> {
  const [row] = await db
    .select({ id: memoryStore.id })
    .from(memoryStore)
    .where(and(eq(memoryStore.userId, userId), eq(memoryStore.key, key)))
    .limit(1);
  return !!row;
}
