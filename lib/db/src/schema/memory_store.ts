import { pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

export const memoryStore = pgTable("memory_store", {
  id:             serial("id").primaryKey(),
  userId:         text("user_id").notNull(),
  key:            text("key").notNull(),
  valueEncrypted: text("value_encrypted").notNull(),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique("memory_store_user_key_unique").on(t.userId, t.key),
]);

export type MemoryEntry    = typeof memoryStore.$inferSelect;
export type InsertMemory   = typeof memoryStore.$inferInsert;
