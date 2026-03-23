/**
 * ebs/schemaRegistry.ts — In-memory event schema registry
 *
 * Registers expected payload shapes for every platform event type.
 * validate() returns ok:true or ok:false + list of violations.
 * No DB needed — pure TypeScript singleton.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type FieldType = "string" | "number" | "boolean" | "object" | "array" | "any";

export interface FieldDef {
  type:     FieldType;
  required: boolean;
  desc?:    string;
}

export interface EventSchema {
  topic:      string;
  event_type: string;
  version:    number;
  fields:     Record<string, FieldDef>;
  desc?:      string;
}

export interface ValidationResult {
  ok:         boolean;
  violations: string[];
}

// ─── Registry singleton ──────────────────────────────────────────────────────

class _SchemaRegistry {
  private _schemas = new Map<string, EventSchema>();

  register(schema: EventSchema): void {
    const key = `${schema.topic}::${schema.event_type}`;
    this._schemas.set(key, schema);
  }

  get(topic: string, event_type: string): EventSchema | undefined {
    return this._schemas.get(`${topic}::${event_type}`);
  }

  list(): EventSchema[] {
    return Array.from(this._schemas.values());
  }

  validate(topic: string, event_type: string, payload: Record<string, unknown>): ValidationResult {
    const schema = this.get(topic, event_type);
    if (!schema) return { ok: true, violations: [] }; // unknown events pass through

    const violations: string[] = [];

    for (const [field, def] of Object.entries(schema.fields)) {
      const val = payload[field];

      if (def.required && (val === undefined || val === null)) {
        violations.push(`Missing required field: ${field}`);
        continue;
      }

      if (val === undefined || val === null) continue;

      if (def.type !== "any") {
        const actual = Array.isArray(val) ? "array" : typeof val;
        if (actual !== def.type) {
          violations.push(`Field "${field}" expected ${def.type}, got ${actual}`);
        }
      }
    }

    return { ok: violations.length === 0, violations };
  }
}

export const schemaRegistry = new _SchemaRegistry();

// ─── Built-in platform schemas ────────────────────────────────────────────────

schemaRegistry.register({
  topic: "payments", event_type: "customer.created", version: 1,
  desc: "Stripe customer.created webhook",
  fields: {
    email:        { type: "string",  required: true  },
    name:         { type: "string",  required: false },
    stripe_id:    { type: "string",  required: false },
    source:       { type: "string",  required: false },
  },
});

schemaRegistry.register({
  topic: "payments", event_type: "invoice.paid", version: 1,
  desc: "Stripe invoice.paid webhook",
  fields: {
    email:          { type: "string",  required: true  },
    amount_paid:    { type: "number",  required: true  },
    subscription_id:{ type: "string",  required: false },
    invoice_id:     { type: "string",  required: false },
  },
});

schemaRegistry.register({
  topic: "payments", event_type: "checkout.session.completed", version: 1,
  desc: "Stripe checkout.session.completed webhook",
  fields: {
    email:          { type: "string",  required: true  },
    session_id:     { type: "string",  required: true  },
    amount_total:   { type: "number",  required: false },
    payment_intent: { type: "string",  required: false },
  },
});

schemaRegistry.register({
  topic: "payments", event_type: "subscription.updated", version: 1,
  desc: "Subscription plan change",
  fields: {
    email:     { type: "string", required: true  },
    old_plan:  { type: "string", required: false },
    new_plan:  { type: "string", required: true  },
    sub_id:    { type: "string", required: false },
  },
});

schemaRegistry.register({
  topic: "payments", event_type: "subscription.deleted", version: 1,
  desc: "Subscription cancelled",
  fields: {
    email:  { type: "string", required: true  },
    sub_id: { type: "string", required: false },
    reason: { type: "string", required: false },
  },
});

schemaRegistry.register({
  topic: "payments", event_type: "payment.failed", version: 1,
  desc: "Payment attempt failed",
  fields: {
    email:          { type: "string", required: true  },
    amount:         { type: "number", required: false },
    failure_reason: { type: "string", required: false },
  },
});

schemaRegistry.register({
  topic: "user", event_type: "user.created", version: 1,
  desc: "New platform account created",
  fields: {
    user_id:  { type: "string", required: true  },
    email:    { type: "string", required: true  },
    role:     { type: "string", required: false },
    username: { type: "string", required: false },
  },
});

schemaRegistry.register({
  topic: "user", event_type: "user.login", version: 1,
  desc: "User authenticated",
  fields: {
    user_id: { type: "string", required: true  },
    email:   { type: "string", required: false },
    ip:      { type: "string", required: false },
  },
});

schemaRegistry.register({
  topic: "engagement", event_type: "app.opened", version: 1,
  desc: "User opened a platform app",
  fields: {
    user_id: { type: "string", required: true  },
    app_id:  { type: "string", required: true  },
    app_name:{ type: "string", required: false },
  },
});

schemaRegistry.register({
  topic: "engagement", event_type: "micro.revenue", version: 1,
  desc: "UltraInteractionEngine micro-revenue event",
  fields: {
    userId:   { type: "string", required: true  },
    amount:   { type: "number", required: true  },
    source:   { type: "string", required: false },
    currency: { type: "string", required: false },
  },
});

schemaRegistry.register({
  topic: "family", event_type: "family.command", version: 1,
  desc: "FamilyAI agent command executed",
  fields: {
    member: { type: "string", required: true  },
    command:{ type: "string", required: true  },
  },
});

schemaRegistry.register({
  topic: "delivery", event_type: "email.sent", version: 1,
  desc: "Outbound email delivered",
  fields: {
    to:      { type: "string", required: true  },
    subject: { type: "string", required: false },
    provider:{ type: "string", required: false },
  },
});

schemaRegistry.register({
  topic: "delivery", event_type: "sms.sent", version: 1,
  desc: "Outbound SMS delivered",
  fields: {
    to:     { type: "string", required: true  },
    length: { type: "number", required: false },
  },
});

schemaRegistry.register({
  topic: "delivery", event_type: "webhook.dispatched", version: 1,
  desc: "Outbound webhook dispatched",
  fields: {
    url:        { type: "string", required: true  },
    event_type: { type: "string", required: true  },
    status_code:{ type: "number", required: false },
  },
});

schemaRegistry.register({
  topic: "system", event_type: "health.check", version: 1,
  desc: "Platform health check cycle",
  fields: {
    endpoints_up:   { type: "number", required: true  },
    endpoints_total:{ type: "number", required: true  },
  },
});

schemaRegistry.register({
  topic: "inbound", event_type: "webhook.received", version: 1,
  desc: "Generic inbound webhook received",
  fields: {
    source:     { type: "string", required: true  },
    event_type: { type: "string", required: false },
    raw_size:   { type: "number", required: false },
  },
});

console.log(`[EBS:SchemaRegistry] ✅ ${schemaRegistry.list().length} schemas registered`);
