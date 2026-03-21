import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

export const pageViews = pgTable("page_views", {
  id:          serial("id").primaryKey(),
  path:        text("path").notNull(),
  industry:    text("industry"),
  refCode:     text("ref_code"),
  utmSource:   text("utm_source"),
  utmMedium:   text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  sessionId:   text("session_id"),
  referrer:    text("referrer"),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("pv_path_idx").on(t.path),
  index("pv_industry_idx").on(t.industry),
  index("pv_created_idx").on(t.createdAt),
  index("pv_session_idx").on(t.sessionId),
]);

export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = typeof pageViews.$inferInsert;
