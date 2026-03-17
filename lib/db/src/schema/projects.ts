import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  industry: text("industry").notNull().default("General"),
  icon: text("icon").notNull().default("📁"),
  color: text("color").notNull().default("#94a3b8"),
  userId: text("user_id").notNull().default("sara"),
  mode: text("mode").notNull().default("live"),
  status: text("status").notNull().default("active"),
  members: jsonb("members").default([]),
  // Enterprise additions
  tenantId: text("tenant_id").default("default"),             // multi-tenant scoping
  deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft-delete (null = active)
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
