import { boolean, index, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invites = pgTable("invites", {
  id:             serial("id").primaryKey(),
  code:           varchar("code", { length: 32 }).notNull().unique(),
  email:          text("email"),
  tier:           text("tier").notNull().default("starter"),
  platformCutPct: integer("platform_cut_pct").notNull().default(25),
  maxUses:        integer("max_uses").notNull().default(1),
  usesCount:      integer("uses_count").notNull().default(0),
  createdBy:      text("created_by"),
  usedBy:         text("used_by"),
  usedAt:         timestamp("used_at",     { withTimezone: true }),
  expiresAt:      timestamp("expires_at",  { withTimezone: true }),
  notes:          text("notes"),
  isRevoked:      boolean("is_revoked").notNull().default(false),
  createdAt:      timestamp("created_at",  { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("invites_code_idx").on(t.code),
  index("invites_created_by_idx").on(t.createdBy),
]);

export const insertInviteSchema = createInsertSchema(invites).omit({
  id: true, createdAt: true, usedAt: true, usesCount: true,
});

export type Invite = typeof invites.$inferSelect;
export type InsertInvite = z.infer<typeof insertInviteSchema>;
