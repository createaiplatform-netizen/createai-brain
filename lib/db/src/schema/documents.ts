import { boolean, index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  projectId: text("project_id"),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  docType: text("doc_type").notNull().default("Note"),
  tags: text("tags").notNull().default(""),
  isTemplate: boolean("is_template").notNull().default(false),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("documents_user_id_idx").on(t.userId),
  index("documents_project_id_idx").on(t.projectId),
  index("documents_user_id_project_id_idx").on(t.userId, t.projectId),
  index("documents_is_pinned_idx").on(t.userId, t.isPinned),
]);

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
