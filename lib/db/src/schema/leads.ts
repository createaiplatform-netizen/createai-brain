import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

export const leads = pgTable("leads", {
  id:          serial("id").primaryKey(),
  email:       text("email").notNull(),
  name:        text("name"),
  industry:    text("industry"),
  utmSource:   text("utm_source"),
  utmMedium:   text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  refCode:     text("ref_code"),
  ipHash:      text("ip_hash"),
  status:      text("status").notNull().default("new"),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("leads_email_idx").on(t.email),
  index("leads_industry_idx").on(t.industry),
  index("leads_created_idx").on(t.createdAt),
  index("leads_ref_code_idx").on(t.refCode),
]);

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
