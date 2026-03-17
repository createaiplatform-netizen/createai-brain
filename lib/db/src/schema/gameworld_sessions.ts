import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gameworldSessions = pgTable("gameworld_sessions", {
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

export const insertGameworldSessionSchema = createInsertSchema(gameworldSessions).omit({ id: true, createdAt: true });
export type GameworldSession       = typeof gameworldSessions.$inferSelect;
export type InsertGameworldSession = z.infer<typeof insertGameworldSessionSchema>;
