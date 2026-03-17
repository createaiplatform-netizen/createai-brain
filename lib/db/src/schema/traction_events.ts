import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const tractionEvents = pgTable("traction_events", {
  id:          serial("id").primaryKey(),
  eventType:   text("event_type").notNull(),
  category:    text("category").notNull().default("traction"),
  subCategory: text("sub_category"),
  userId:      text("user_id"),
  metadata:    jsonb("metadata").default({}),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type TractionEvent     = typeof tractionEvents.$inferSelect;
export type InsertTractionEvent = typeof tractionEvents.$inferInsert;
