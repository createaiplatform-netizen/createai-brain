// ─── Future Backend Blueprint Engine ─────────────────────────────────────────
// Design-only API specs, data models, security patterns, logging, and error handling.
// NOT real connections. NOT a real backend. Exists so real engineering teams can
// implement with minimal rework. All endpoints are MOCK SPEC ONLY.

export interface FieldSpec {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

export interface DataModelSpec {
  name: string;
  description: string;
  fields: FieldSpec[];
  indexes?: string[];
  relations?: string[];
}

export interface ApiEndpointSpec {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  roles: string[];
  requestFields?: FieldSpec[];
  responseFields?: FieldSpec[];
  rateLimit?: string;
  exampleRequest?: Record<string, unknown>;
  exampleResponse?: Record<string, unknown>;
  errorCodes?: { code: number; meaning: string }[];
}

export interface SecuritySpec {
  authMethod: string;
  tokenType: string;
  scopeModel: string[];
  sessionTimeout: string;
  mfaRequired: boolean;
  rateLimiting: string;
  ipAllowlist: boolean;
  notes: string[];
}

export interface LoggingSpec {
  event: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  fields: string[];
  retention: string;
  alertOn?: string;
}

export interface ErrorPattern {
  code: number;
  name: string;
  description: string;
  userMessage: string;
  action: string;
}

export interface BackendBlueprint {
  id: string;
  domain: string;
  title: string;
  version: string;
  status: "blueprint-draft" | "blueprint-ready";
  summary: string;
  dataModels: DataModelSpec[];
  apiEndpoints: ApiEndpointSpec[];
  security: SecuritySpec;
  loggingPatterns: LoggingSpec[];
  errorPatterns: ErrorPattern[];
  designNotes: string[];
  disclaimer: string;
}

const DISCLAIMER = "FUTURE BACKEND BLUEPRINT — Design-Only, Mock Spec. No real endpoints deployed. No real data processed. Intended as a structural starting point for real engineering and security teams.";

// ─── Blueprint Library ────────────────────────────────────────────────────────
export const BACKEND_BLUEPRINTS: BackendBlueprint[] = [

  // ── Auth & Identity ────────────────────────────────────────────────────────
  {
    id: "auth-identity",
    domain: "Authentication & Identity",
    title: "Auth & Identity API Blueprint",
    version: "v1-blueprint",
    status: "blueprint-ready",
    summary: "JWT-based auth with RBAC, MFA spec, session management, and invite flow. All endpoints are mock spec only.",
    dataModels: [
      { name: "User", description: "Platform user record",
        fields: [
          { name: "id",           type: "uuid",    required: true,  description: "Unique user identifier",            example: "usr_01HZABCDEF" },
          { name: "email",        type: "string",  required: true,  description: "Verified email address",            example: "sara@example.com" },
          { name: "role",         type: "enum",    required: true,  description: "founder | creator | viewer | admin", example: "founder" },
          { name: "mfa_enabled",  type: "boolean", required: false, description: "MFA enrollment status",             example: "true" },
          { name: "invited_by",   type: "uuid",    required: false, description: "ID of user who sent invite" },
          { name: "created_at",   type: "timestamp",required: true, description: "Account creation timestamp" },
          { name: "last_login_at",type: "timestamp",required: false,description: "Last successful login" },
        ],
        indexes: ["email (unique)", "role", "created_at"],
        relations: ["has_many Sessions", "has_many Invites"] },
      { name: "Session", description: "Active user session",
        fields: [
          { name: "id",          type: "uuid",      required: true,  description: "Session ID" },
          { name: "user_id",     type: "uuid",      required: true,  description: "Owning user" },
          { name: "jwt_jti",     type: "string",    required: true,  description: "JWT unique ID (for revocation)" },
          { name: "ip_address",  type: "string",    required: false, description: "Client IP (hashed)" },
          { name: "expires_at",  type: "timestamp", required: true,  description: "Session expiry" },
        ],
        indexes: ["user_id", "expires_at"] },
    ],
    apiEndpoints: [
      { method: "POST", path: "/api/v1/auth/login",
        description: "Authenticate user with email + password. Returns JWT access + refresh tokens.",
        roles: ["public"],
        requestFields: [
          { name: "email",    type: "string", required: true,  description: "User email" },
          { name: "password", type: "string", required: true,  description: "User password (min 12 chars)" },
          { name: "mfa_code", type: "string", required: false, description: "6-digit TOTP if MFA enrolled" },
        ],
        exampleResponse: { access_token: "eyJ...", refresh_token: "rt_...", expires_in: 900, user: { id: "usr_01HZ", role: "founder" } },
        rateLimit: "10 requests/minute per IP",
        errorCodes: [{ code: 401, meaning: "Invalid credentials" }, { code: 429, meaning: "Rate limit exceeded" }] },
      { method: "POST", path: "/api/v1/auth/logout",
        description: "Revoke current session token.",
        roles: ["authenticated"],
        errorCodes: [{ code: 401, meaning: "Invalid or expired token" }] },
      { method: "POST", path: "/api/v1/auth/invite",
        description: "Send an invite to a new user (Founder only).",
        roles: ["founder"],
        requestFields: [
          { name: "email", type: "string", required: true, description: "Invitee email" },
          { name: "role",  type: "enum",   required: true, description: "creator | viewer" },
        ],
        errorCodes: [{ code: 403, meaning: "Insufficient role" }, { code: 409, meaning: "User already exists" }] },
      { method: "POST", path: "/api/v1/auth/refresh",
        description: "Exchange refresh token for new access token.",
        roles: ["public"],
        rateLimit: "30 requests/minute per user",
        errorCodes: [{ code: 401, meaning: "Invalid refresh token" }, { code: 403, meaning: "Token revoked" }] },
    ],
    security: {
      authMethod: "JWT (RS256, 15-minute access token, 7-day refresh)",
      tokenType: "Bearer",
      scopeModel: ["read:own", "write:own", "read:all (admin)", "write:all (founder)", "invite:users (founder)"],
      sessionTimeout: "15 minutes (access), 7 days (refresh, sliding)",
      mfaRequired: true,
      rateLimiting: "Tiered: 10/min (auth), 100/min (read), 30/min (write)",
      ipAllowlist: false,
      notes: [
        "Store access tokens in memory only (not localStorage) to prevent XSS",
        "Refresh tokens in httpOnly, Secure, SameSite=Strict cookies",
        "JWT revocation via JTI blocklist in Redis (blueprint: not deployed)",
      ],
    },
    loggingPatterns: [
      { event: "auth.login.success",  level: "INFO",  fields: ["user_id", "ip_hash", "timestamp", "mfa_used"], retention: "90 days" },
      { event: "auth.login.failed",   level: "WARN",  fields: ["email_hash", "ip_hash", "timestamp", "reason"], retention: "90 days", alertOn: "5 failures in 60s from same IP" },
      { event: "auth.token.refresh",  level: "DEBUG", fields: ["user_id", "timestamp"], retention: "30 days" },
      { event: "auth.invite.sent",    level: "INFO",  fields: ["inviter_id", "invitee_email_hash", "role", "timestamp"], retention: "1 year" },
    ],
    errorPatterns: [
      { code: 400, name: "ValidationError",     description: "Request body failed schema validation", userMessage: "Please check your input and try again.", action: "Return field-level error details" },
      { code: 401, name: "Unauthorized",        description: "Missing or invalid auth token",         userMessage: "Please log in to continue.",            action: "Redirect to login" },
      { code: 403, name: "Forbidden",           description: "Valid token but insufficient role",      userMessage: "You don't have permission for this.",   action: "Log access attempt, return 403" },
      { code: 429, name: "RateLimitExceeded",   description: "Too many requests",                     userMessage: "Too many requests. Please slow down.",  action: "Return Retry-After header" },
      { code: 500, name: "InternalServerError", description: "Unexpected server error",               userMessage: "Something went wrong. We're on it.",    action: "Alert on-call, log full trace" },
    ],
    designNotes: [
      "Use asymmetric RS256 JWTs so public key can be shared with microservices",
      "Implement token rotation on every refresh to detect token theft",
      "Audit log every privilege escalation event",
    ],
    disclaimer: DISCLAIMER,
  },

  // ── Creation Engine API ────────────────────────────────────────────────────
  {
    id: "creation-api",
    domain: "Creation Engine",
    title: "Universal Creation Engine API Blueprint",
    version: "v1-blueprint",
    status: "blueprint-ready",
    summary: "CRUD endpoints for projects/creations, SSE streaming generation, snapshot management, and export. Mock spec only.",
    dataModels: [
      { name: "Creation", description: "AI-generated creation record",
        fields: [
          { name: "id",           type: "uuid",        required: true,  description: "Creation ID", example: "crt_01HZABCDEF" },
          { name: "user_id",      type: "uuid",        required: true,  description: "Owner" },
          { name: "type",         type: "enum",        required: true,  description: "One of 19 project types", example: "website" },
          { name: "title",        type: "string",      required: true,  description: "Creation title" },
          { name: "status",       type: "enum",        required: false, description: "draft | in-progress | complete | archived", example: "draft" },
          { name: "tags",         type: "string[]",    required: false, description: "User-defined tags" },
          { name: "sections",     type: "Section[]",   required: true,  description: "AI-generated content sections" },
          { name: "theme_color",  type: "string",      required: false, description: "Accent color ID from ThemeEngine" },
          { name: "collection_id",type: "uuid",        required: false, description: "Collection grouping" },
          { name: "snapshots",    type: "Snapshot[]",  required: false, description: "Version snapshots (max 10)" },
          { name: "created_at",   type: "timestamp",   required: true,  description: "Creation timestamp" },
          { name: "updated_at",   type: "timestamp",   required: true,  description: "Last update timestamp" },
        ],
        indexes: ["user_id", "type", "status", "created_at"],
        relations: ["belongs_to User", "has_many Snapshots"] },
    ],
    apiEndpoints: [
      { method: "POST", path: "/api/v1/creations/generate",
        description: "Initiate AI generation. Returns SSE stream of content chunks.",
        roles: ["founder", "creator"],
        requestFields: [
          { name: "prompt",    type: "string",  required: true,  description: "User prompt / intent" },
          { name: "type",      type: "enum",    required: false, description: "Override detected type" },
          { name: "persona_id",type: "string",  required: false, description: "AI persona to use" },
        ],
        exampleResponse: { stream: "text/event-stream", events: ["data: {chunk}", "data: [DONE]"] },
        rateLimit: "20 generations/hour per user",
        errorCodes: [{ code: 402, meaning: "Generation quota exceeded" }, { code: 503, meaning: "AI service unavailable" }] },
      { method: "GET",  path: "/api/v1/creations",          description: "List all creations for authenticated user.", roles: ["founder", "creator", "viewer"], rateLimit: "60/min" },
      { method: "GET",  path: "/api/v1/creations/:id",      description: "Get a single creation by ID.", roles: ["owner", "admin"] },
      { method: "PATCH",path: "/api/v1/creations/:id",      description: "Update creation metadata (title, status, tags, theme).", roles: ["owner"] },
      { method: "DELETE",path: "/api/v1/creations/:id",     description: "Soft-delete a creation (archived).", roles: ["owner", "founder"] },
      { method: "POST", path: "/api/v1/creations/:id/snapshot", description: "Create a point-in-time snapshot of the creation.", roles: ["owner"], errorCodes: [{ code: 409, meaning: "Max 10 snapshots reached" }] },
      { method: "POST", path: "/api/v1/creations/:id/export",   description: "Export creation in requested format. Returns download URL.", roles: ["owner"],
        requestFields: [{ name: "format", type: "enum", required: true, description: "json | markdown | text" }] },
    ],
    security: {
      authMethod: "Bearer JWT (inherited from Auth blueprint)",
      tokenType: "Bearer",
      scopeModel: ["read:creations:own", "write:creations:own", "read:creations:all (admin)"],
      sessionTimeout: "Inherited from session",
      mfaRequired: false,
      rateLimiting: "20 generations/hour, 60 reads/min, 30 writes/min",
      ipAllowlist: false,
      notes: ["Generation endpoint proxied to AI provider — never expose AI API key to client", "SSE stream authenticated via short-lived ticket (5-minute TTL)"],
    },
    loggingPatterns: [
      { event: "creation.generated",  level: "INFO",  fields: ["user_id", "creation_id", "type", "tokens_used", "latency_ms"], retention: "90 days" },
      { event: "creation.exported",   level: "INFO",  fields: ["user_id", "creation_id", "format", "timestamp"], retention: "30 days" },
      { event: "creation.deleted",    level: "WARN",  fields: ["user_id", "creation_id", "timestamp"], retention: "1 year" },
      { event: "generation.failed",   level: "ERROR", fields: ["user_id", "prompt_hash", "error_code", "timestamp"], retention: "90 days", alertOn: "error_rate > 5% in 5 minutes" },
    ],
    errorPatterns: [
      { code: 402, name: "QuotaExceeded",     description: "User has exceeded generation quota", userMessage: "You've reached your generation limit. Please try again later.", action: "Return quota_reset_at timestamp" },
      { code: 422, name: "UnprocessablePrompt",description: "Prompt violates safety policy",     userMessage: "This prompt can't be processed. Please try a different approach.", action: "Log safely, return generic message" },
      { code: 503, name: "AIUnavailable",     description: "Upstream AI service unreachable",    userMessage: "AI service is temporarily unavailable. Please try again.", action: "Retry with exponential backoff (3x), then fail" },
    ],
    designNotes: [
      "Stream SSE via fetch + ReadableStream (never EventSource — browser reconnect is unpredictable)",
      "Store token usage per generation for cost tracking and quota enforcement",
      "Classify prompt intent server-side before forwarding to AI (double safety check)",
    ],
    disclaimer: DISCLAIMER,
  },

  // ── Integration API ────────────────────────────────────────────────────────
  {
    id: "integration-api",
    domain: "Integration Engine",
    title: "Demo Integration Engine API Blueprint",
    version: "v1-blueprint",
    status: "blueprint-draft",
    summary: "API blueprint for managing demo integration packets, status lifecycle, and activation events. All endpoints mock spec only. No real integrations.",
    dataModels: [
      { name: "IntegrationPacket", description: "Demo integration packet record",
        fields: [
          { name: "id",            type: "string",    required: true,  description: "Packet ID", example: "ehr-epic" },
          { name: "name",          type: "string",    required: true,  description: "Integration name" },
          { name: "category",      type: "string",    required: true,  description: "Category (Healthcare, Finance, etc.)" },
          { name: "status",        type: "enum",      required: true,  description: "ready | pending | submitted | connected-demo" },
          { name: "submitted_at",  type: "timestamp", required: false, description: "When packet was submitted (demo)" },
          { name: "connected_at",  type: "timestamp", required: false, description: "When packet reached connected-demo status" },
          { name: "is_auto_generated", type: "boolean", required: false, description: "Auto-generated by auto-generate endpoint" },
          { name: "safety_note",   type: "string",    required: true,  description: "Explicit mock/demo disclaimer" },
        ] },
    ],
    apiEndpoints: [
      { method: "GET",  path: "/api/v1/integrations",             description: "List all demo integration packets.", roles: ["founder", "admin"] },
      { method: "POST", path: "/api/v1/integrations/:id/submit",  description: "Simulate packet submission. Updates status to submitted. No real action.", roles: ["founder"], errorCodes: [{ code: 409, meaning: "Already submitted" }] },
      { method: "POST", path: "/api/v1/integrations/:id/connect", description: "Simulate demo connection. Updates status to connected-demo. No real action.", roles: ["founder"] },
      { method: "POST", path: "/api/v1/integrations/:id/reset",   description: "Reset packet to ready status.", roles: ["founder"] },
      { method: "POST", path: "/api/v1/integrations/prepare-all", description: "Activation endpoint: prepare all packets (pending → submitted → connected-demo). Triggered by activation phrases.", roles: ["founder"] },
      { method: "POST", path: "/api/v1/integrations/auto-generate", description: "Auto-generate a demo packet for a requested integration name.", roles: ["founder"],
        requestFields: [{ name: "name", type: "string", required: true, description: "Integration name to generate packet for" }] },
    ],
    security: {
      authMethod: "Bearer JWT",
      tokenType: "Bearer",
      scopeModel: ["integrations:read", "integrations:submit (founder)", "integrations:manage (founder)"],
      sessionTimeout: "Inherited",
      mfaRequired: false,
      rateLimiting: "60/min reads, 20/min state mutations",
      ipAllowlist: false,
      notes: [
        "All integration endpoints must validate safety_note is present before any submission",
        "No real API calls ever made from these endpoints — all state mutations are internal",
        "Activation phrase detection happens server-side for audit trail completeness",
      ],
    },
    loggingPatterns: [
      { event: "integration.submitted",     level: "INFO", fields: ["user_id", "packet_id", "timestamp"], retention: "30 days" },
      { event: "integration.connected",     level: "INFO", fields: ["user_id", "packet_id", "timestamp"], retention: "30 days" },
      { event: "integration.prepare_all",   level: "INFO", fields: ["user_id", "activation_phrase", "packet_count", "timestamp"], retention: "90 days" },
    ],
    errorPatterns: [
      { code: 409, name: "AlreadySubmitted", description: "Packet is already in submitted/connected state", userMessage: "This connection is already active.", action: "Return current status" },
      { code: 422, name: "InvalidPacket",    description: "Packet ID not found",                            userMessage: "Integration packet not found.",       action: "Return 404 with packet_id" },
    ],
    designNotes: [
      "Packet state is append-only in the audit trail — mutations create new log entries",
      "Activation phrase detection should use fuzzy matching in production (not just exact string)",
      "Auto-generated packets must include auto_generated: true and explicit safety_note",
    ],
    disclaimer: DISCLAIMER,
  },

  // ── User & Access Management ───────────────────────────────────────────────
  {
    id: "user-access",
    domain: "User Management",
    title: "User & Access Management API Blueprint",
    version: "v1-blueprint",
    status: "blueprint-draft",
    summary: "RBAC model, invite flow, role management, and access audit. Mock spec only.",
    dataModels: [
      { name: "Role", description: "System role definition",
        fields: [
          { name: "id",          type: "enum",     required: true, description: "founder | admin | creator | viewer" },
          { name: "permissions", type: "string[]", required: true, description: "Permission scopes granted to this role" },
          { name: "description", type: "string",   required: true, description: "Human-readable role description" },
        ] },
      { name: "Invite", description: "Pending user invite",
        fields: [
          { name: "id",            type: "uuid",      required: true,  description: "Invite ID" },
          { name: "inviter_id",    type: "uuid",      required: true,  description: "Founder who sent invite" },
          { name: "invitee_email", type: "string",    required: true,  description: "Target email" },
          { name: "role",          type: "enum",      required: true,  description: "Role to grant on acceptance" },
          { name: "status",        type: "enum",      required: true,  description: "pending | accepted | expired" },
          { name: "expires_at",    type: "timestamp", required: true,  description: "Invite expiry (72 hours)" },
        ] },
    ],
    apiEndpoints: [
      { method: "GET",    path: "/api/v1/users",            description: "List all users (admin/founder only).", roles: ["founder", "admin"] },
      { method: "GET",    path: "/api/v1/users/:id",        description: "Get user profile.", roles: ["owner", "admin"] },
      { method: "PATCH",  path: "/api/v1/users/:id/role",   description: "Update user role (founder only).", roles: ["founder"] },
      { method: "DELETE", path: "/api/v1/users/:id",        description: "Deactivate user account.", roles: ["founder"] },
      { method: "GET",    path: "/api/v1/invites",          description: "List pending invites.", roles: ["founder", "admin"] },
      { method: "DELETE", path: "/api/v1/invites/:id",      description: "Revoke a pending invite.", roles: ["founder"] },
    ],
    security: {
      authMethod: "Bearer JWT",
      tokenType: "Bearer",
      scopeModel: ["users:read (admin+)", "users:write (founder)", "invites:manage (founder)"],
      sessionTimeout: "Inherited",
      mfaRequired: true,
      rateLimiting: "30/min",
      ipAllowlist: false,
      notes: [
        "Role changes require MFA confirmation",
        "Deactivated users' sessions are immediately revoked",
        "All role changes logged to immutable audit trail",
      ],
    },
    loggingPatterns: [
      { event: "user.role_changed",    level: "WARN", fields: ["actor_id", "target_id", "old_role", "new_role", "timestamp"], retention: "2 years" },
      { event: "user.deactivated",     level: "WARN", fields: ["actor_id", "target_id", "timestamp"], retention: "2 years" },
      { event: "invite.sent",          level: "INFO", fields: ["inviter_id", "invitee_email_hash", "role", "timestamp"], retention: "1 year" },
    ],
    errorPatterns: [
      { code: 403, name: "InsufficientRole", description: "Operation requires higher privilege", userMessage: "You don't have permission for this action.", action: "Log attempt, return 403" },
      { code: 409, name: "UserExists",       description: "Invite sent to existing user",        userMessage: "This user already has an account.",         action: "Return existing user role" },
    ],
    designNotes: [
      "Role hierarchy: founder > admin > creator > viewer",
      "Founder role cannot be self-assigned — requires another founder to grant",
      "Implement row-level security (RLS) in database for multi-tenant isolation",
    ],
    disclaimer: DISCLAIMER,
  },

  // ── Regulatory Readiness API ───────────────────────────────────────────────
  {
    id: "regulatory-api",
    domain: "Regulatory Readiness",
    title: "Regulatory Readiness API Blueprint",
    version: "v1-blueprint",
    status: "blueprint-draft",
    summary: "API spec for loading regulatory blueprints, gap analysis, audit trail simulation, and compliance status reporting. All mock spec only. No real compliance.",
    dataModels: [
      { name: "ComplianceReport", description: "Snapshot of compliance posture for a framework",
        fields: [
          { name: "id",            type: "uuid",      required: true,  description: "Report ID" },
          { name: "framework",     type: "string",    required: true,  description: "HIPAA | GDPR | SOC2 | etc." },
          { name: "generated_at",  type: "timestamp", required: true,  description: "Report generation time" },
          { name: "mapped_count",  type: "integer",   required: true,  description: "Clauses with status: mapped" },
          { name: "gap_count",     type: "integer",   required: true,  description: "Clauses with status: gap" },
          { name: "partial_count", type: "integer",   required: true,  description: "Clauses with status: partial" },
          { name: "overall_status",type: "enum",      required: true,  description: "blueprint-draft | blueprint-ready" },
          { name: "disclaimer",    type: "string",    required: true,  description: "Full non-binding disclaimer" },
        ] },
    ],
    apiEndpoints: [
      { method: "GET",  path: "/api/v1/regulatory/blueprints",           description: "List all regulatory readiness blueprints.", roles: ["founder", "admin"] },
      { method: "GET",  path: "/api/v1/regulatory/blueprints/:id",       description: "Get full blueprint including clauses, audit trail, consent flows.", roles: ["founder", "admin"] },
      { method: "GET",  path: "/api/v1/regulatory/blueprints/:id/gaps",  description: "Get gap analysis for a specific framework.", roles: ["founder", "admin"] },
      { method: "POST", path: "/api/v1/regulatory/reports",              description: "Generate a compliance posture report for a framework.", roles: ["founder"],
        requestFields: [{ name: "framework_id", type: "string", required: true, description: "Blueprint ID to report on" }] },
      { method: "GET",  path: "/api/v1/regulatory/audit-trail",          description: "View simulated audit trail events (all mock).", roles: ["founder", "admin"] },
    ],
    security: {
      authMethod: "Bearer JWT",
      tokenType: "Bearer",
      scopeModel: ["regulatory:read (admin+)", "regulatory:reports (founder)"],
      sessionTimeout: "Inherited",
      mfaRequired: true,
      rateLimiting: "30/min",
      ipAllowlist: false,
      notes: [
        "All regulatory data is internal blueprint only — no external disclosure",
        "Reports must include full disclaimer in payload and any rendered output",
        "Audit trail access restricted to admin+ roles",
      ],
    },
    loggingPatterns: [
      { event: "regulatory.report_generated", level: "INFO", fields: ["user_id", "framework", "timestamp", "gap_count"], retention: "2 years" },
      { event: "regulatory.blueprint_accessed",level: "INFO", fields: ["user_id", "blueprint_id", "timestamp"], retention: "1 year" },
    ],
    errorPatterns: [
      { code: 404, name: "BlueprintNotFound",  description: "Framework blueprint not in library", userMessage: "Regulatory blueprint not found.", action: "Return available framework list" },
      { code: 403, name: "InsufficientRole",   description: "Report generation requires founder", userMessage: "Only founders can generate compliance reports.", action: "Return 403" },
    ],
    designNotes: [
      "All report payloads must include disclaimer field — never omit",
      "Gap analysis should be the primary view for engineering handoff",
      "Future: integrate with real GRC (Governance, Risk, Compliance) platforms via certified APIs",
    ],
    disclaimer: DISCLAIMER,
  },
];

// ─── Engine API ───────────────────────────────────────────────────────────────
export const BackendBlueprintEngine = {
  getAll(): BackendBlueprint[]                   { return BACKEND_BLUEPRINTS; },
  getById(id: string): BackendBlueprint | undefined { return BACKEND_BLUEPRINTS.find(b => b.id === id); },
  getByDomain(domain: string): BackendBlueprint[]  { return BACKEND_BLUEPRINTS.filter(b => b.domain === domain); },

  getStats() {
    const all = BACKEND_BLUEPRINTS;
    const totalEndpoints = all.reduce((sum, b) => sum + b.apiEndpoints.length, 0);
    const totalModels    = all.reduce((sum, b) => sum + b.dataModels.length, 0);
    return {
      blueprints: all.length,
      ready:      all.filter(b => b.status === "blueprint-ready").length,
      draft:      all.filter(b => b.status === "blueprint-draft").length,
      endpoints:  totalEndpoints,
      dataModels: totalModels,
      domains:    all.map(b => b.domain),
    };
  },
};
