import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ecologyforgeSessions = pgTable("ecologyforge_sessions", {
  id:         serial("id").primaryKey(),
  userId:     text("user_id").notNull(),
  engineId:   text("engine_id").notNull(),
  engineName: text("engine_name").notNull(),
  topic:      text("topic").notNull(),
  output:     text("output").notNull(),
  title:      text("title"),
  tags:       text("tags"),
  projectId:  text("project_id"),
  isStarred:  boolean("is_starred").notNull().default(false),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertEcologyforgeSessionSchema = createInsertSchema(ecologyforgeSessions).omit({
  id: true, createdAt: true,
});

export type EcologyforgeSession       = typeof ecologyforgeSessions.$inferSelect;
export type InsertEcologyforgeSession = z.infer<typeof insertEcologyforgeSessionSchema>;
