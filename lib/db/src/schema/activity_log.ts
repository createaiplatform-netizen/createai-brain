import { pgTable, serial, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";

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
}, (t) => [
  index("activity_log_user_id_idx").on(t.userId),
  index("activity_log_project_id_idx").on(t.projectId),
  index("activity_log_created_at_idx").on(t.createdAt),
]);

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;
