import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const brainstormSessions = pgTable("brainstorm_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("New Brainstorm"),
  userId: text("user_id").notNull().default("sara"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertBrainstormSessionSchema = createInsertSchema(brainstormSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type BrainstormSession = typeof brainstormSessions.$inferSelect;
export type InsertBrainstormSession = z.infer<typeof insertBrainstormSessionSchema>;
