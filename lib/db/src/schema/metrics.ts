import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const metrics = pgTable("metrics", {
  id:        serial("id").primaryKey(),
  type:      text("type").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  projectId: text("project_id"),
  metadata:  jsonb("metadata").default({}),
});

export const insertMetricSchema = createInsertSchema(metrics).omit({
  id:        true,
  timestamp: true,
});

export type Metric       = typeof metrics.$inferSelect;
export type InsertMetric = z.infer<typeof insertMetricSchema>;
