import { pgTable, serial, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull().default("General"),
  status: text("status").notNull().default("ready"),
  configJson: jsonb("config_json"),
  webhookUrl: text("webhook_url"),
  isEnabled: boolean("is_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;
