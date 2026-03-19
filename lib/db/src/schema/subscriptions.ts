import { boolean, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { usersTable } from "./auth";

export const userSubscriptions = pgTable("user_subscriptions", {
  id:             serial("id").primaryKey(),
  userId:         text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tier:           text("tier").notNull().default("free"),
  tokenBalance:   integer("token_balance").notNull().default(0),
  monthlyLimit:   integer("monthly_limit").notNull().default(50),
  platformCutPct: integer("platform_cut_pct").notNull().default(25),
  overriddenBy:   text("overridden_by"),
  overriddenAt:   timestamp("overridden_at", { withTimezone: true }),
  notes:          text("notes"),
  isActive:       boolean("is_active").notNull().default(true),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("user_subscriptions_user_idx").on(t.userId),
  index("user_subscriptions_tier_idx").on(t.tier),
]);

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true, createdAt: true, updatedAt: true,
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
