import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const opportunities = pgTable("opportunities", {
  id:             serial("id").primaryKey(),
  userId:         text("user_id").notNull(),
  title:          text("title").notNull(),
  description:    text("description"),
  type:           text("type").notNull().default("Market"),
  status:         text("status").notNull().default("New"),
  priority:       text("priority").notNull().default("Medium"),
  score:          integer("score").default(0),
  market:         text("market"),
  estimatedValue: text("estimated_value"),
  confidence:     text("confidence").default("Medium"),
  source:         text("source"),
  aiInsight:      text("ai_insight"),
  notes:          text("notes"),
  tags:           text("tags"),
  dueDate:        text("due_date"),
  assignedTo:     text("assigned_to"),
  projectId:      text("project_id"),
  isStarred:      boolean("is_starred").notNull().default(false),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Opportunity    = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
