import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { projects } from "./projects";
import { projectFiles } from "./project_files";

export const fileVersions = pgTable("file_versions", {
  id:         serial("id").primaryKey(),
  fileId:     integer("file_id").notNull().references(() => projectFiles.id, { onDelete: "cascade" }),
  projectId:  integer("project_id").notNull().references(() => projects.id,  { onDelete: "cascade" }),
  userId:     text("user_id"),
  content:    text("content").notNull().default(""),
  versionNum: integer("version_num").notNull().default(1),
  label:      text("label"),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("file_versions_file_idx").on(t.fileId),
  index("file_versions_project_idx").on(t.projectId),
]);

export type FileVersion = typeof fileVersions.$inferSelect;
