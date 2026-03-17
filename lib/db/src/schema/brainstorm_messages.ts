import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { brainstormSessions } from "./brainstorm_sessions";

export const brainstormMessages = pgTable("brainstorm_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => brainstormSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertBrainstormMessageSchema = createInsertSchema(brainstormMessages).omit({
  id: true,
  createdAt: true,
});

export type BrainstormMessage = typeof brainstormMessages.$inferSelect;
export type InsertBrainstormMessage = z.infer<typeof insertBrainstormMessageSchema>;
