// ═══════════════════════════════════════════════════════════════════════════
// MEMORY SERVICE — Backward-compatible free-function shims.
//
// All implementations now live in MemoryService.ts (constructor DI class).
// These functions delegate to the container-managed singleton — routes and
// callers are unchanged.
//
// Import graph:
//   routes/* → memoryService.ts → container (get) → MemoryService instance
//   MemoryService.ts receives EncryptionService via constructor (no direct import)
// ═══════════════════════════════════════════════════════════════════════════

import { container }      from "../container";
import { MEMORY_SERVICE } from "../container/tokens";
import type { MemoryService } from "./memory.service";

/** Lazy accessor — container instantiates MemoryService on first call. */
function ms(): MemoryService {
  return container.get<MemoryService>(MEMORY_SERVICE);
}

/**
 * saveMemory — encrypt value and upsert into memory_store.
 * If a row for (userId, key) already exists it is overwritten.
 */
export function saveMemory(
  userId: string,
  key:    string,
  value:  string,
): Promise<void> {
  return ms().save(userId, key, value);
}

/**
 * loadMemory — retrieve and decrypt a stored value.
 * Returns null if no matching entry exists.
 */
export function loadMemory(
  userId: string,
  key:    string,
): Promise<string | null> {
  return ms().load(userId, key);
}

/**
 * deleteMemory — remove a stored entry. No-op if not found.
 */
export function deleteMemory(
  userId: string,
  key:    string,
): Promise<void> {
  return ms().delete(userId, key);
}

/**
 * listMemoryKeys — return all stored key names for a user.
 * Values are never returned — keys only.
 */
export function listMemoryKeys(userId: string): Promise<string[]> {
  return ms().listKeys(userId);
}

/**
 * hasMemory — check if a specific key exists (no decryption).
 */
export function hasMemory(userId: string, key: string): Promise<boolean> {
  return ms().has(userId, key);
}
