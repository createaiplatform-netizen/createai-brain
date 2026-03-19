import { integer, pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { projects } from "./projects";
import { projectFolders } from "./project_folders";

export const projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  folderId: integer("folder_id")
    .references(() => projectFolders.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  content: text("content").notNull().default(""),
  fileType: text("file_type").notNull().default("document"),
  size: text("size").notNull().default("0 KB"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("project_files_project_id_idx").on(table.projectId),
  folderIdIdx:  index("project_files_folder_id_idx").on(table.folderId),
}));

export const insertProjectFileSchema = createInsertSchema(projectFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = z.infer<typeof insertProjectFileSchema>;
