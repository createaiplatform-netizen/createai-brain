import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// role values: "founder" | "admin" | "user" | "viewer"
// tenantId: null = default single-tenant org

// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessionsTable = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const usersTable = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  ndaSigned: boolean("nda_signed").notNull().default(false),
  ndaSignedAt: timestamp("nda_signed_at", { withTimezone: true }),
  // User preference brain — persisted per-user, synced from OSContext
  preferences: jsonb("preferences"),
  // Enterprise additions
  role: varchar("role").notNull().default("user"),              // founder | admin | user | viewer
  tenantId: varchar("tenant_id").default("default"),            // multi-tenant support
  deletedAt: timestamp("deleted_at", { withTimezone: true }),   // soft-delete (null = active)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UpsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;
