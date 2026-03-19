// ═══════════════════════════════════════════════════════════════════════════
// MEMORY SERVICE CLASS — Encrypted key-value store backed by memory_store.
//
// Constructor receives EncryptionService — never imports it directly.
// All dependencies wired through ServiceContainer (container/bootstrap.ts).
//
// No container import — this class is a pure dependency, not a resolver.
// Routes use the backward-compat shims in memoryService.ts which delegate here.
// ═══════════════════════════════════════════════════════════════════════════

import { and, eq }             from "drizzle-orm";
import { db, memoryStore }     from "@workspace/db";
import type { EncryptionService } from "./encryption.service";

export class MemoryService {
  constructor(private readonly enc: EncryptionService) {}

  /**
   * save — encrypt value and upsert into memory_store.
   * (userId, key) is a unique index — existing entries are overwritten.
   */
  async save(userId: string, key: string, value: string): Promise<void> {
    const valueEncrypted = this.enc.encrypt(value);
    await db
      .insert(memoryStore)
      .values({ userId, key, valueEncrypted })
      .onConflictDoUpdate({
        target: [memoryStore.userId, memoryStore.key],
        set: { valueEncrypted, updatedAt: new Date() },
      });
  }

  /**
   * load — retrieve and decrypt a stored value.
   * Returns null if the key does not exist for this user.
   */
  async load(userId: string, key: string): Promise<string | null> {
    const [row] = await db
      .select()
      .from(memoryStore)
      .where(and(eq(memoryStore.userId, userId), eq(memoryStore.key, key)))
      .limit(1);
    if (!row) return null;
    return this.enc.decrypt(row.valueEncrypted);
  }

  /**
   * delete — remove a stored entry. No-op if the key is not found.
   */
  async delete(userId: string, key: string): Promise<void> {
    await db
      .delete(memoryStore)
      .where(and(eq(memoryStore.userId, userId), eq(memoryStore.key, key)));
  }

  /**
   * listKeys — return all key names for a user. Values are never returned.
   */
  async listKeys(userId: string): Promise<string[]> {
    const rows = await db
      .select({ key: memoryStore.key })
      .from(memoryStore)
      .where(eq(memoryStore.userId, userId));
    return rows.map(r => r.key);
  }

  /**
   * has — check existence of a key without decrypting the value.
   */
  async has(userId: string, key: string): Promise<boolean> {
    const [row] = await db
      .select({ id: memoryStore.id })
      .from(memoryStore)
      .where(and(eq(memoryStore.userId, userId), eq(memoryStore.key, key)))
      .limit(1);
    return !!row;
  }
}
