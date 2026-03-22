import { boolean, index, integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const legalClients = pgTable("legal_clients", {
  id:        serial("id").primaryKey(),
  name:      text("name").notNull(),
  email:     text("email"),
  phone:     text("phone"),
  address:   text("address"),
  type:      text("type").notNull().default("individual"),
  notes:     text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  typeIdx:      index("legal_clients_type_idx").on(table.type),
  createdAtIdx: index("legal_clients_created_at_idx").on(table.createdAt),
}));

export const legalMatters = pgTable("legal_matters", {
  id:          serial("id").primaryKey(),
  clientId:    integer("client_id").notNull().references(() => legalClients.id, { onDelete: "cascade" }),
  title:       text("title").notNull(),
  type:        text("type").notNull().default("General"),
  status:      text("status").notNull().default("open"),
  description: text("description"),
  billingType: text("billing_type").notNull().default("hourly"),
  hourlyRate:  numeric("hourly_rate", { precision: 10, scale: 2 }),
  flatFee:     numeric("flat_fee", { precision: 10, scale: 2 }),
  openedAt:    timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt:    timestamp("closed_at", { withTimezone: true }),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  clientIdx:    index("legal_matters_client_idx").on(table.clientId),
  statusIdx:    index("legal_matters_status_idx").on(table.status),
  openedAtIdx:  index("legal_matters_opened_at_idx").on(table.openedAt),
}));

export const legalTimeEntries = pgTable("legal_time_entries", {
  id:          serial("id").primaryKey(),
  matterId:    integer("matter_id").notNull().references(() => legalMatters.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  hours:       numeric("hours", { precision: 8, scale: 2 }).notNull(),
  rate:        numeric("rate", { precision: 10, scale: 2 }).notNull(),
  amount:      numeric("amount", { precision: 10, scale: 2 }).notNull(),
  date:        timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  isBilled:    boolean("is_billed").notNull().default(false),
  invoiceId:   integer("invoice_id"),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  matterIdx:   index("legal_time_entries_matter_idx").on(table.matterId),
  isBilledIdx: index("legal_time_entries_is_billed_idx").on(table.isBilled),
  dateIdx:     index("legal_time_entries_date_idx").on(table.date),
}));

export const legalInvoices = pgTable("legal_invoices", {
  id:            serial("id").primaryKey(),
  clientId:      integer("client_id").notNull().references(() => legalClients.id, { onDelete: "cascade" }),
  matterId:      integer("matter_id").references(() => legalMatters.id),
  invoiceNumber: text("invoice_number").notNull(),
  status:        text("status").notNull().default("draft"),
  total:         numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  notes:         text("notes"),
  issuedAt:      timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
  dueAt:         timestamp("due_at", { withTimezone: true }),
  paidAt:        timestamp("paid_at", { withTimezone: true }),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  clientIdx:  index("legal_invoices_client_idx").on(table.clientId),
  matterIdx:  index("legal_invoices_matter_idx").on(table.matterId),
  statusIdx:  index("legal_invoices_status_idx").on(table.status),
  issuedAtIdx: index("legal_invoices_issued_at_idx").on(table.issuedAt),
}));

export const legalInvoiceItems = pgTable("legal_invoice_items", {
  id:          serial("id").primaryKey(),
  invoiceId:   integer("invoice_id").notNull().references(() => legalInvoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity:    numeric("quantity", { precision: 8, scale: 2 }).notNull(),
  rate:        numeric("rate", { precision: 10, scale: 2 }).notNull(),
  amount:      numeric("amount", { precision: 10, scale: 2 }).notNull(),
}, (table) => ({
  invoiceIdx: index("legal_invoice_items_invoice_idx").on(table.invoiceId),
}));

export const legalTasks = pgTable("legal_tasks", {
  id:          serial("id").primaryKey(),
  matterId:    integer("matter_id").notNull().references(() => legalMatters.id, { onDelete: "cascade" }),
  title:       text("title").notNull(),
  description: text("description"),
  priority:    text("priority").notNull().default("medium"),
  isCompleted: boolean("is_completed").notNull().default(false),
  dueAt:       timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  matterIdx:      index("legal_tasks_matter_idx").on(table.matterId),
  isCompletedIdx: index("legal_tasks_is_completed_idx").on(table.isCompleted),
  dueAtIdx:       index("legal_tasks_due_at_idx").on(table.dueAt),
}));

export const legalNotes = pgTable("legal_notes", {
  id:        serial("id").primaryKey(),
  matterId:  integer("matter_id").notNull().references(() => legalMatters.id, { onDelete: "cascade" }),
  content:   text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  matterIdx: index("legal_notes_matter_idx").on(table.matterId),
}));

export type LegalClient     = typeof legalClients.$inferSelect;
export type LegalMatter     = typeof legalMatters.$inferSelect;
export type LegalTimeEntry  = typeof legalTimeEntries.$inferSelect;
export type LegalInvoice    = typeof legalInvoices.$inferSelect;
export type LegalInvoiceItem= typeof legalInvoiceItems.$inferSelect;
export type LegalTask       = typeof legalTasks.$inferSelect;
export type LegalNote       = typeof legalNotes.$inferSelect;
