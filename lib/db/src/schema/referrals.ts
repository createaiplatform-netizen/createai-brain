import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";

export const referrals = pgTable("referrals", {
  id:             serial("id").primaryKey(),
  referralCode:   text("referral_code").notNull().unique(),
  referrerId:     text("referrer_id").notNull(),
  clickCount:     integer("click_count").notNull().default(0),
  convertCount:   integer("convert_count").notNull().default(0),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("referrals_referral_code_idx").on(t.referralCode),
  index("referrals_referrer_id_idx").on(t.referrerId),
]);

export const referralConversions = pgTable("referral_conversions", {
  id:             serial("id").primaryKey(),
  referralCode:   text("referral_code").notNull(),
  referrerId:     text("referrer_id").notNull(),
  referredUserId: text("referred_user_id").notNull(),
  convertedAt:    timestamp("converted_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("ref_conversions_code_idx").on(t.referralCode),
  index("ref_conversions_referred_idx").on(t.referredUserId),
]);

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;
export type ReferralConversion = typeof referralConversions.$inferSelect;
