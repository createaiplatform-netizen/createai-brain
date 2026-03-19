import { boolean, integer, pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { projects } from "./projects";

export const projectFolders = pgTable("project_folders", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("📁"),
  isUniversal: boolean("is_universal").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("project_folders_project_id_idx").on(table.projectId),
}));

export const insertProjectFolderSchema = createInsertSchema(projectFolders).omit({
  id: true,
  createdAt: true,
});

export type ProjectFolder = typeof projectFolders.$inferSelect;
export type InsertProjectFolder = z.infer<typeof insertProjectFolderSchema>;
