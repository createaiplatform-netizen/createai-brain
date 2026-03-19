import { integer, pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { projects } from "./projects";

export const projectChatMessages = pgTable("project_chat_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("project_chat_messages_project_id_idx").on(table.projectId),
}));

export const insertProjectChatMessageSchema = createInsertSchema(projectChatMessages).omit({
  id: true,
  createdAt: true,
});

export type ProjectChatMessage = typeof projectChatMessages.$inferSelect;
export type InsertProjectChatMessage = z.infer<typeof insertProjectChatMessageSchema>;
