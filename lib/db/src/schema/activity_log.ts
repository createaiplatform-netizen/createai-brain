import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  label: text("label").notNull(),
  icon: text("icon").notNull().default("✨"),
  appId: text("app_id"),
  projectId: text("project_id"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;
