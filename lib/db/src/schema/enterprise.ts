/**
 * enterprise.ts — Enterprise-grade tables for audit logging, analytics,
 * webhooks, multi-tenancy, data retention, and SSO configuration.
 *
 * All tables are designed for additive multi-tenant use. Adding tenantId
 * to queries is the only change needed to switch from single-tenant to
 * multi-tenant mode.
 */

import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Organizations / Tenants ──────────────────────────────────────────────────
/**
 * organizations — each row represents one tenant/workspace.
 * For single-tenant use the default "default" org is used.
 * Add tenantId = org.id to any query to scope it to a tenant.
 */
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default("default"),
  name: text("name").notNull().default("CreateAI Brain"),
  slug: text("slug").notNull().default("createai"),
  plan: text("plan").notNull().default("founder"), // founder | enterprise | pro | free
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// ─── Audit Logs ───────────────────────────────────────────────────────────────
/**
 * auditLogs — centralized, immutable audit trail.
 *
 * Every meaningful action in the system calls auditLog() which inserts here.
 * Use for security review, compliance, and incident investigation.
 *
 * outcome: "success" | "failure" | "denied"
 */
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),                          // null = unauthenticated
  userEmail: text("user_email"),
  role: text("role").default("user"),               // user role at time of action
  tenantId: text("tenant_id").default("default"),
  action: text("action").notNull(),                 // e.g. "project.created"
  resource: text("resource"),                       // e.g. "project:42"
  resourceType: text("resource_type"),              // e.g. "project"
  outcome: text("outcome").notNull().default("success"), // success | failure | denied
  metadata: jsonb("metadata").default({}),          // extra context (ids, diffs)
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("audit_logs_user_idx").on(t.userId),
  index("audit_logs_action_idx").on(t.action),
  index("audit_logs_created_idx").on(t.createdAt),
  index("audit_logs_tenant_idx").on(t.tenantId),
]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── Analytics Events ─────────────────────────────────────────────────────────
/**
 * analyticsEvents — lightweight event tracking for product analytics.
 *
 * Track: user logins, project created, app opened, message sent, etc.
 * Query over time to build usage counts, funnel analysis, and retention curves.
 */
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  tenantId: text("tenant_id").default("default"),
  eventType: text("event_type").notNull(),          // "project.created" | "app.opened" | etc.
  appId: text("app_id"),                            // createai Brain app context
  metadata: jsonb("metadata").default({}),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("analytics_events_user_idx").on(t.userId),
  index("analytics_events_type_idx").on(t.eventType),
  index("analytics_events_created_idx").on(t.createdAt),
  index("analytics_events_tenant_idx").on(t.tenantId),
]);

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

// ─── Webhook Subscriptions ────────────────────────────────────────────────────
/**
 * webhookSubscriptions — registry of outbound webhook endpoints.
 *
 * When a platform event fires (project created, message sent, etc.), the
 * WebhookDispatcher service queries active subscriptions matching that
 * event type and sends a POST to each target URL.
 *
 * secret is stored as a SHA-256 HMAC signing key (never raw).
 * status: "active" | "paused" | "errored"
 */
export const webhookSubscriptions = pgTable("webhook_subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").default("default"),
  label: text("label").notNull(),
  targetUrl: text("target_url").notNull(),
  eventType: text("event_type").notNull(),          // "project.created" | "*" (wildcard)
  secret: text("secret"),                           // HMAC signing secret (encrypted)
  status: text("status").notNull().default("active"),
  headers: jsonb("headers").default({}),            // extra headers to send
  failureCount: serial("failure_count"),
  lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("webhook_subscriptions_tenant_idx").on(t.tenantId),
  index("webhook_subscriptions_event_idx").on(t.eventType),
]);

export const insertWebhookSubscriptionSchema = createInsertSchema(webhookSubscriptions).omit({
  id: true, createdAt: true, updatedAt: true, lastTriggeredAt: true, failureCount: true,
});

export type WebhookSubscription = typeof webhookSubscriptions.$inferSelect;
export type InsertWebhookSubscription = z.infer<typeof insertWebhookSubscriptionSchema>;

// ─── Data Retention Policies ──────────────────────────────────────────────────
/**
 * dataRetentionPolicies — defines how long data of each type is kept.
 *
 * A background job should read these and run retention-based cleanup.
 * anonymizeAfterDays: replace PII with "[REDACTED]" instead of deleting.
 * deleteAfterDays: hard-delete the record.
 */
export const dataRetentionPolicies = pgTable("data_retention_policies", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").default("default"),
  resourceType: text("resource_type").notNull(),   // "message" | "document" | "audit_log"
  keepDays: serial("keep_days"),                   // hard delete after N days (0 = never)
  anonymizeAfterDays: serial("anonymize_after_days"), // anonymize after N days (0 = never)
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type DataRetentionPolicy = typeof dataRetentionPolicies.$inferSelect;

// ─── SSO Providers (Scaffold) ─────────────────────────────────────────────────
/**
 * ssoProviders — scaffold table for OAuth2 / OpenID Connect providers.
 *
 * To add Google/Microsoft/Okta/GitHub SSO:
 *   1. Insert a row here with clientId + encrypted clientSecret + discoveryUrl
 *   2. Mount routes/sso.ts under /api/auth/sso/:providerId
 *   3. Use openid-client (already installed) to complete the PKCE flow
 *
 * status: "configured" | "active" | "disabled"
 */
export const ssoProviders = pgTable("sso_providers", {
  id: varchar("id").primaryKey(),                  // e.g. "google" | "microsoft" | "okta"
  tenantId: text("tenant_id").default("default"),
  providerName: text("provider_name").notNull(),   // "Google Workspace" | "Microsoft Entra"
  clientId: text("client_id"),                     // from provider OAuth app
  clientSecretEncrypted: text("client_secret_encrypted"), // encrypted at rest
  discoveryUrl: text("discovery_url"),             // OIDC .well-known URL
  scopes: text("scopes").default("openid email profile"),
  status: text("status").notNull().default("configured"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SsoProvider = typeof ssoProviders.$inferSelect;

// ─── Expansion Runs ───────────────────────────────────────────────────────────
/**
 * expansionRuns — persistent record of every Expansion Engine run.
 *
 * Every call to expandToLimit() writes a row here so the founder can
 * review the full history of platform expansions. The complete summary
 * (including the full step log) is stored as JSONB in `summary`.
 *
 * status: "completed" | "partial" | "no_viable_paths"
 */
export const expansionRuns = pgTable("expansion_runs", {
  id:               serial("id").primaryKey(),
  idea:             text("idea").notNull(),
  status:           text("status").notNull().default("completed"),
  totalIterations:  integer("total_iterations").notNull().default(0),
  totalPaths:       integer("total_paths").notNull().default(0),
  viablePaths:      integer("viable_paths").notNull().default(0),
  executedPaths:    integer("executed_paths").notNull().default(0),
  newRegistryItems: integer("new_registry_items").notNull().default(0),
  totalRegistrySize: integer("total_registry_size").notNull().default(0),
  protectionsApplied: integer("protections_applied").notNull().default(0),
  optimizations:    integer("optimizations").notNull().default(0),
  durationMs:       integer("duration_ms").notNull().default(0),
  summary:          jsonb("summary").default({}),
  triggeredBy:      text("triggered_by").default("founder"),
  startedAt:        timestamp("started_at",   { withTimezone: true }).notNull().defaultNow(),
  completedAt:      timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt:        timestamp("created_at",   { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("expansion_runs_status_idx").on(t.status),
  index("expansion_runs_created_idx").on(t.createdAt),
]);

export type ExpansionRun = typeof expansionRuns.$inferSelect;
export type InsertExpansionRun = typeof expansionRuns.$inferInsert;
