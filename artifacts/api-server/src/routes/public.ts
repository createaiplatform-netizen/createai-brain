/**
 * public.ts — Public Integration Demo + Live Simulation Endpoints
 *
 * No authentication required. Returns sanitized, view-only integration
 * capability data for external IT reviewer demonstrations.
 *
 * IMPORTANT: No real PHI, credentials, tokens, or proprietary logic
 * is exposed through any endpoint in this file.
 */

import { Router } from "express";
import type { Response } from "express";
import { ADAPTERS, INDUSTRY_META, getAdapter, type Industry } from "../adapters/registry";

const router = Router();

// ─── SSE client registry ────────────────────────────────────────────────────
const sseClients = new Set<Response>();

// ─── Last-activity tracker per adapter ─────────────────────────────────────
const lastActivity = new Map<string, { ts: string; latencyMs: number; label: string }>();

// ─── Live event ring buffer (last 120 events) ───────────────────────────────
interface SimEvent {
  id: string;
  adapterId: string;
  adapterLabel: string;
  industry: string;
  type: string;
  dir: "IN" | "OUT";
  status: "success" | "error";
  label: string;
  summary: string;
  latencyMs: number;
  ts: string;
  payload: unknown;
}

const eventBuffer: SimEvent[] = [];

function pushEvent(event: SimEvent) {
  eventBuffer.unshift(event);
  if (eventBuffer.length > 120) eventBuffer.pop();
  lastActivity.set(event.adapterId, {
    ts: event.ts,
    latencyMs: event.latencyMs,
    label: event.label,
  });
  const data = JSON.stringify({ type: "event", event });
  for (const client of [...sseClients]) {
    try { client.write(`data: ${data}\n\n`); }
    catch { sseClients.delete(client); }
  }
}

// ─── Static demo connection points ─────────────────────────────────────────
const CONNECTED_SYSTEMS = [
  { id: "rest-api",       label: "REST API Layer",          category: "Transport",  icon: "🌐", status: "live",    detail: "315 versioned endpoints · GET/POST/PUT/PATCH/DELETE · JSON:API" },
  { id: "sse",            label: "Server-Sent Events",      category: "Transport",  icon: "📡", status: "live",    detail: "Real-time SSE streaming · 86 engine outputs · long-running process support" },
  { id: "tls",            label: "TLS 1.3 Encryption",      category: "Security",   icon: "🔒", status: "live",    detail: "In-transit encryption · mTLS proxy · certificate pinning" },
  { id: "aes256",         label: "AES-256 At Rest",         category: "Security",   icon: "🔐", status: "live",    detail: "Encrypted database fields · key rotation ready" },
  { id: "rbac",           label: "Role-Based Access",       category: "Auth",       icon: "👤", status: "live",    detail: "owner / editor / viewer roles · per-resource isolation" },
  { id: "jwt",            label: "JWT Service Auth",        category: "Auth",       icon: "🎫", status: "live",    detail: "HS256 signed tokens · 1h TTL · refresh flow" },
  { id: "session",        label: "Session Management",      category: "Auth",       icon: "🔑", status: "live",    detail: "Secure HTTPOnly cookies · 7-day TTL · server-side store" },
  { id: "fhir-r4",        label: "FHIR R4 Engine",          category: "Healthcare", icon: "🏨", status: "live",    detail: "Patient / Encounter / Observation / MedicationRequest / DocumentReference" },
  { id: "hl7-v2",         label: "HL7 v2.6 Parser",         category: "Healthcare", icon: "🔀", status: "live",    detail: "ADT · ORM · ORU · ACK — bidirectional transformation engine" },
  { id: "phi-flow",       label: "PHI Data Flow",           category: "Healthcare", icon: "🏥", status: "live",    detail: "Minimum-necessary access · field-level masking · no PHI in logs" },
  { id: "audit-log",      label: "Audit Logging",           category: "Compliance", icon: "📋", status: "live",    detail: "All actions logged · actor + timestamp + resource + change · immutable" },
  { id: "hipaa",          label: "HIPAA Controls",          category: "Compliance", icon: "📜", status: "live",    detail: "Technical safeguards blueprint · BA agreements · breach notification" },
  { id: "webhook-ingest", label: "Webhook Ingestion",       category: "Transport",  icon: "📥", status: "live",    detail: "Inbound webhook validation · HMAC-SHA256 signature verification" },
];

const PENDING_SYSTEMS = [
  { id: "webhook-out", label: "Outbound Webhook Dispatch", category: "Transport", icon: "🔔", status: "pending", detail: "Requires target URL configuration — ready to activate" },
  { id: "graphql",     label: "GraphQL Gateway",           category: "Transport", icon: "◈",  status: "pending", detail: "Unified query layer — Phase 1 design complete" },
  { id: "ws",          label: "WebSocket (Bidirectional)",  category: "Transport", icon: "⚡",  status: "pending", detail: "Bidirectional real-time channel — spec complete" },
  { id: "saml",        label: "SAML 2.0 SSO",              category: "Auth",      icon: "🏢", status: "pending", detail: "Enterprise SSO — IdP connector ready" },
  { id: "mfa",         label: "Multi-Factor Auth",         category: "Auth",      icon: "🛡️", status: "pending", detail: "TOTP/SMS — config UI complete" },
];

const COMPLIANCE = [
  { framework: "HIPAA",   status: "blueprint-ready", domains: ["Technical Safeguards", "PHI Access Controls", "Audit Logging", "Breach Notification"],      coverage: 89 },
  { framework: "FHIR R4", status: "live",            domains: ["Patient", "Encounter", "Observation", "MedicationRequest", "DocumentReference"],            coverage: 95 },
  { framework: "HL7 v2",  status: "live",            domains: ["ADT", "ORM", "ORU", "ACK", "QRY/QRF"],                                                     coverage: 92 },
  { framework: "SOC 2",   status: "blueprint-ready", domains: ["Availability", "Confidentiality", "Processing Integrity", "Security"],                      coverage: 74 },
  { framework: "GDPR",    status: "blueprint-ready", domains: ["Right to Erasure", "Data Minimization", "Consent Management", "DPA"],                       coverage: 68 },
  { framework: "PCI-DSS", status: "blueprint-ready", domains: ["Cardholder Data", "Transmission Encryption", "Access Controls"],                            coverage: 61 },
];

// ─── Per-adapter simulation payloads ───────────────────────────────────────
function rnd(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function uid() { return `sim-${Date.now()}-${rnd(1000, 9999)}`; }

function buildAdapterPayload(adapterId: string, now: string): {
  type: string; dir: "IN" | "OUT"; label: string; summary: string; latencyMs: number; payload: unknown;
} {
  switch (adapterId) {
    // ── Healthcare ──────────────────────────────────────────────────────────
    case "epic-fhir":
      return {
        type: "FHIR", dir: "IN", latencyMs: rnd(60, 120),
        label: "Epic EHR → FHIR R4 Patient",
        summary: "FHIR R4 Patient resource ingested from Epic · PHI placeholder only",
        payload: {
          _note: "SIMULATED — No real PHI",
          resourceType: "Patient",
          id: uid(),
          meta: { source: "epic-fhir", profile: ["http://hl7.org/fhir/StructureDefinition/Patient"], lastUpdated: now },
          identifier: [{ system: "urn:oid:1.2.840.114350.1.13.861.1.7.5.737384.14", value: `EPC-${rnd(100000, 999999)}` }],
          active: true,
          name: [{ use: "official", family: "[REDACTED]", given: ["[REDACTED]"] }],
          gender: "unknown",
          birthDate: "[REDACTED]",
          address: [{ use: "home", city: "[REDACTED]", state: "[REDACTED]", country: "US" }],
          telecom: [{ system: "phone", use: "mobile", value: "[REDACTED]" }],
          _transformedBy: "epic-fhir adapter · transformInbound()",
        },
      };

    case "cerner-fhir":
      return {
        type: "FHIR", dir: "IN", latencyMs: rnd(55, 115),
        label: "Cerner/Oracle → FHIR R4 Encounter",
        summary: "FHIR R4 Encounter resource received from Cerner · outpatient visit",
        payload: {
          _note: "SIMULATED — No real PHI",
          resourceType: "Encounter",
          id: uid(),
          meta: { source: "cerner-fhir", lastUpdated: now },
          status: "finished",
          class: { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "AMB", display: "ambulatory" },
          type: [{ coding: [{ system: "http://snomed.info/sct", code: "308335008", display: "Patient encounter procedure" }] }],
          period: { start: "[REDACTED]", end: "[REDACTED]" },
          reasonCode: [{ text: "Routine checkup [SIMULATED]" }],
          _transformedBy: "cerner-fhir adapter · transformInbound()",
        },
      };

    case "athena-health":
      return {
        type: "FHIR", dir: "IN", latencyMs: rnd(70, 130),
        label: "athenahealth → FHIR R4 DocumentReference",
        summary: "Clinical document reference received · discharge summary placeholder",
        payload: {
          _note: "SIMULATED — No real PHI",
          resourceType: "DocumentReference",
          id: uid(),
          meta: { source: "athena-health", lastUpdated: now },
          status: "current",
          type: { coding: [{ system: "http://loinc.org", code: "18842-5", display: "Discharge Summary" }] },
          category: [{ coding: [{ system: "http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category", code: "clinical-note" }] }],
          content: [{ attachment: { contentType: "text/plain", language: "en-US", title: "[SIMULATED DOCUMENT — no real content]" } }],
          context: { period: { start: "[REDACTED]", end: "[REDACTED]" } },
          _transformedBy: "athena-health adapter · transformInbound()",
        },
      };

    // ── Payments ────────────────────────────────────────────────────────────
    case "stripe":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(12, 35),
        label: "Stripe Webhook → payment_intent.succeeded",
        summary: "Payment intent succeeded · $1,250.00 · signature verified · HMAC-SHA256",
        payload: {
          _note: "SIMULATED — No real transaction data",
          id: `evt_${uid()}`,
          object: "event",
          type: "payment_intent.succeeded",
          created: Math.floor(Date.now() / 1000),
          data: {
            object: {
              id: `pi_${uid()}`,
              object: "payment_intent",
              amount: 125000,
              currency: "usd",
              status: "succeeded",
              description: "[SIMULATED PAYMENT — demo only]",
              metadata: { source: "createai-brain-demo" },
            },
          },
          livemode: false,
          _transformedBy: "stripe adapter · transformInbound()",
        },
      };

    case "paypal":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(18, 40),
        label: "PayPal IPN → PAYMENT.CAPTURE.COMPLETED",
        summary: "PayPal capture completed · order webhook received · signature verified",
        payload: {
          _note: "SIMULATED — No real transaction data",
          id: uid(),
          event_type: "PAYMENT.CAPTURE.COMPLETED",
          event_version: "1.0",
          resource_type: "capture",
          resource: {
            id: `CAPTURE-${uid()}`,
            status: "COMPLETED",
            amount: { currency_code: "USD", value: "89.00" },
            final_capture: true,
            create_time: now,
            update_time: now,
          },
          _transformedBy: "paypal adapter · transformInbound()",
        },
      };

    case "square":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(15, 38),
        label: "Square Webhook → payment.completed",
        summary: "Square POS payment completed · receipt generated · inventory updated",
        payload: {
          _note: "SIMULATED — No real transaction data",
          merchant_id: `DEMO_MERCHANT_${rnd(1000, 9999)}`,
          type: "payment.completed",
          event_id: uid(),
          created_at: now,
          data: {
            type: "payment",
            id: uid(),
            object: {
              payment: {
                id: uid(),
                status: "COMPLETED",
                amount_money: { amount: 4500, currency: "USD" },
                source_type: "CARD",
              },
            },
          },
          _transformedBy: "square adapter · transformInbound()",
        },
      };

    // ── CRM ─────────────────────────────────────────────────────────────────
    case "salesforce":
      return {
        type: "REST", dir: "IN", latencyMs: rnd(45, 90),
        label: "Salesforce → Contact.Created event",
        summary: "New Salesforce Contact synced · CRM pipeline update · SOQL-validated",
        payload: {
          _note: "SIMULATED — No real CRM data",
          event: { replayId: rnd(10000, 99999), createdDate: now },
          sobject: {
            Id: uid(),
            Type: "Contact",
            FirstName: "[REDACTED]",
            LastName: "[REDACTED]",
            Email: "[REDACTED]",
            Phone: "[REDACTED]",
            AccountId: `ACC${rnd(10000, 99999)}`,
            LeadSource: "Web",
            CreatedDate: now,
          },
          _transformedBy: "salesforce adapter · transformInbound()",
        },
      };

    case "hubspot":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(20, 55),
        label: "HubSpot → contact.creation webhook",
        summary: "HubSpot contact created · lifecycle stage: lead · property sync complete",
        payload: {
          _note: "SIMULATED — No real CRM data",
          eventId: rnd(100000, 999999),
          subscriptionType: "contact.creation",
          portalId: rnd(10000000, 99999999),
          occurredAt: Date.now(),
          objectId: rnd(10000, 99999),
          changeSource: "CRM_UI",
          properties: {
            firstname: { value: "[REDACTED]" },
            lastname: { value: "[REDACTED]" },
            email: { value: "[REDACTED]" },
            lifecyclestage: { value: "lead" },
          },
          _transformedBy: "hubspot adapter · transformInbound()",
        },
      };

    case "pipedrive":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(22, 48),
        label: "Pipedrive → deal.updated event",
        summary: "Deal stage moved to Negotiation · value updated · owner notified",
        payload: {
          _note: "SIMULATED — No real CRM data",
          event: "updated.deal",
          retry: 0,
          data: {
            id: rnd(1000, 9999),
            title: "[SIMULATED DEAL]",
            status: "open",
            stage_id: rnd(1, 10),
            value: 18000,
            currency: "USD",
            pipeline_id: 1,
            owner_id: rnd(1000, 9999),
            update_time: now,
          },
          _transformedBy: "pipedrive adapter · transformInbound()",
        },
      };

    // ── Communication ───────────────────────────────────────────────────────
    case "twilio":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(25, 60),
        label: "Twilio → Inbound SMS received",
        summary: "Inbound SMS received · TwiML ACK sent · message logged",
        payload: {
          _note: "SIMULATED — No real message content",
          MessageSid: `SM${uid().replace(/-/g, "").slice(0, 32)}`,
          AccountSid: `AC[REDACTED]`,
          From: "[REDACTED PHONE]",
          To: "+1-800-DEMO-NUM",
          Body: "[SIMULATED MESSAGE BODY — no real content]",
          NumMedia: "0",
          SmsStatus: "received",
          ApiVersion: "2010-04-01",
          _transformedBy: "twilio adapter · transformInbound()",
        },
      };

    case "sendgrid":
      return {
        type: "WEBHOOK", dir: "OUT", latencyMs: rnd(30, 70),
        label: "SendGrid → Transactional email dispatched",
        summary: "Transactional email queued · template rendered · delivery confirmed",
        payload: {
          _note: "SIMULATED — No real email content or recipient",
          messageId: uid(),
          event: "delivered",
          email: "[REDACTED]@[REDACTED].example",
          timestamp: Math.floor(Date.now() / 1000),
          templateId: "d-[DEMO-TEMPLATE-ID]",
          subject: "[SIMULATED EMAIL SUBJECT]",
          category: ["transactional", "demo"],
          smtp_id: `<${uid()}@sendgrid.net>`,
          _transformedBy: "sendgrid adapter · transformInbound()",
        },
      };

    case "mailchimp":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(18, 45),
        label: "Mailchimp → List subscribe event",
        summary: "New subscriber added to list · double opt-in confirmed · welcome sequence queued",
        payload: {
          _note: "SIMULATED — No real subscriber data",
          type: "subscribe",
          fired_at: now,
          data: {
            id: uid(),
            list_id: `DEMO_LIST_${rnd(1000, 9999)}`,
            email: "[REDACTED]@[REDACTED].example",
            email_type: "html",
            ip_signup: "0.0.0.0",
            merges: { FNAME: "[REDACTED]", LNAME: "[REDACTED]" },
            status: "subscribed",
          },
          _transformedBy: "mailchimp adapter · transformInbound()",
        },
      };

    // ── Cloud ───────────────────────────────────────────────────────────────
    case "aws":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(8, 25),
        label: "AWS → S3 ObjectCreated notification",
        summary: "S3 PutObject event received via SNS/SQS · Lambda trigger queued",
        payload: {
          _note: "SIMULATED — No real AWS resources",
          Records: [{
            eventVersion: "2.1",
            eventSource: "aws:s3",
            awsRegion: "us-east-1",
            eventTime: now,
            eventName: "ObjectCreated:Put",
            requestParameters: { sourceIPAddress: "0.0.0.0" },
            s3: {
              s3SchemaVersion: "1.0",
              bucket: { name: "demo-integration-bucket", arn: "arn:aws:s3:::demo-integration-bucket" },
              object: { key: `uploads/demo/${uid()}.json`, size: rnd(1024, 102400), eTag: uid() },
            },
          }],
          _transformedBy: "aws adapter · transformInbound()",
        },
      };

    case "google-cloud":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(10, 30),
        label: "GCP → Pub/Sub message received",
        summary: "Google Cloud Pub/Sub push subscription · message decoded · ack sent",
        payload: {
          _note: "SIMULATED — No real GCP resources",
          message: {
            messageId: `${rnd(1000000000000, 9999999999999)}`,
            publishTime: now,
            data: Buffer.from(JSON.stringify({ event: "demo.trigger", source: "createai-brain" })).toString("base64"),
            attributes: { origin: "demo", version: "1.0" },
          },
          subscription: "projects/demo-project/subscriptions/createai-brain-demo",
          _transformedBy: "google-cloud adapter · transformInbound()",
        },
      };

    case "azure":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(12, 32),
        label: "Azure → Event Hub message received",
        summary: "Azure Event Hub message ingested · partition key resolved · offset committed",
        payload: {
          _note: "SIMULATED — No real Azure resources",
          id: uid(),
          source: "/subscriptions/[DEMO-SUBSCRIPTION]/resourceGroups/demo-rg/providers/Microsoft.EventHub/namespaces/demo-ns",
          type: "Microsoft.EventHub.CaptureFileCreated",
          subject: `demo-hub/0`,
          time: now,
          data: {
            fileUrl: "https://demo.blob.core.windows.net/demo-container/demo.avro",
            fileType: "AzureBlockBlob",
            partitionId: "0",
            sizeInBytes: rnd(512, 10240),
            eventCount: rnd(1, 50),
          },
          _transformedBy: "azure adapter · transformInbound()",
        },
      };

    // ── E-Commerce ──────────────────────────────────────────────────────────
    case "shopify":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(20, 50),
        label: "Shopify → orders/create webhook",
        summary: "New Shopify order received · inventory check triggered · fulfillment queued",
        payload: {
          _note: "SIMULATED — No real order data",
          id: rnd(1000000000, 9999999999),
          email: "[REDACTED]",
          created_at: now,
          updated_at: now,
          number: rnd(1000, 9999),
          total_price: "149.99",
          subtotal_price: "129.99",
          currency: "USD",
          financial_status: "paid",
          fulfillment_status: null,
          line_items: [{ id: rnd(10000, 99999), title: "[DEMO PRODUCT]", quantity: 1, price: "129.99", sku: `SKU-${rnd(100, 999)}` }],
          shipping_address: { first_name: "[REDACTED]", city: "[REDACTED]", country: "US" },
          _transformedBy: "shopify adapter · transformInbound()",
        },
      };

    case "amazon-sp":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(35, 75),
        label: "Amazon SP-API → ORDER_CHANGE notification",
        summary: "Amazon order state change received · fulfillment channel: MFN · ACK sent",
        payload: {
          _note: "SIMULATED — No real Amazon order data",
          NotificationType: "ORDER_CHANGE",
          PayloadVersion: "1.0",
          EventTime: now,
          NotificationMetadata: { ApplicationId: "amzn1.sellerapps.app.DEMO", SubscriptionId: uid(), PublishTime: now, NotificationId: uid() },
          Payload: {
            OrderChangeNotification: {
              SellerId: `[REDACTED-SELLER-ID]`,
              AmazonOrderId: `${rnd(100, 999)}-${rnd(1000000, 9999999)}-${rnd(1000000, 9999999)}`,
              OrderChangeType: "OrderStatusChange",
              OrderStatus: "Shipped",
            },
          },
          _transformedBy: "amazon-sp adapter · transformInbound()",
        },
      };

    case "woocommerce":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(18, 45),
        label: "WooCommerce → order.created webhook",
        summary: "WooCommerce order received · payment verified · order queued for fulfillment",
        payload: {
          _note: "SIMULATED — No real order data",
          id: rnd(1000, 9999),
          parent_id: 0,
          number: `${rnd(1000, 9999)}`,
          status: "processing",
          currency: "USD",
          date_created: now,
          total: "79.99",
          billing: { first_name: "[REDACTED]", email: "[REDACTED]", city: "[REDACTED]", country: "US" },
          line_items: [{ id: rnd(1, 999), name: "[DEMO PRODUCT]", quantity: 1, total: "69.99" }],
          payment_method: "stripe",
          transaction_id: uid(),
          _transformedBy: "woocommerce adapter · transformInbound()",
        },
      };

    // ── Productivity ────────────────────────────────────────────────────────
    case "slack":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(10, 25),
        label: "Slack → message.channels event",
        summary: "Slack channel message received · bot mention detected · workflow trigger queued",
        payload: {
          _note: "SIMULATED — No real Slack workspace data",
          token: "[REDACTED]",
          team_id: `T${uid().slice(0, 8).toUpperCase()}`,
          api_app_id: `A${uid().slice(0, 8).toUpperCase()}`,
          event: {
            type: "message",
            channel: `C${uid().slice(0, 8).toUpperCase()}`,
            user: `U${uid().slice(0, 8).toUpperCase()}`,
            text: "[SIMULATED MESSAGE — no real content]",
            ts: `${Math.floor(Date.now() / 1000)}.${rnd(100000, 999999)}`,
          },
          type: "event_callback",
          event_id: `Ev${uid().toUpperCase()}`,
          event_time: Math.floor(Date.now() / 1000),
          _transformedBy: "slack adapter · transformInbound()",
        },
      };

    case "notion":
      return {
        type: "REST", dir: "IN", latencyMs: rnd(40, 80),
        label: "Notion → page.created event",
        summary: "New Notion page created in workspace · database record synced · AI content queued",
        payload: {
          _note: "SIMULATED — No real Notion workspace data",
          object: "page",
          id: uid(),
          created_time: now,
          last_edited_time: now,
          parent: { type: "database_id", database_id: uid() },
          properties: {
            Name: { title: [{ plain_text: "[SIMULATED PAGE TITLE]" }] },
            Status: { select: { name: "In Progress" } },
            Tags: { multi_select: [{ name: "Demo" }] },
          },
          url: `https://www.notion.so/[SIMULATED]`,
          _transformedBy: "notion adapter · transformInbound()",
        },
      };

    case "github":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(8, 22),
        label: "GitHub → push event",
        summary: "GitHub push to main · 2 commits · automated review workflow triggered",
        payload: {
          _note: "SIMULATED — No real repository data",
          ref: "refs/heads/main",
          repository: { id: rnd(100000000, 999999999), name: "demo-repo", full_name: "[REDACTED]/demo-repo", private: false },
          pusher: { name: "[REDACTED]", email: "[REDACTED]" },
          commits: [
            { id: uid().replace(/-/g, "").slice(0, 40), message: "[SIMULATED COMMIT MESSAGE]", author: { name: "[REDACTED]" }, added: ["src/demo.ts"], modified: [], removed: [] },
          ],
          head_commit: { id: uid().replace(/-/g, "").slice(0, 40), message: "[SIMULATED COMMIT]", timestamp: now },
          _transformedBy: "github adapter · transformInbound()",
        },
      };

    case "google-workspace":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(30, 65),
        label: "Google Workspace → Gmail message received",
        summary: "Gmail push notification received · message decoded · thread synced",
        payload: {
          _note: "SIMULATED — No real email content or Google Workspace data",
          emailAddress: "[REDACTED]@[REDACTED].example",
          historyId: `${rnd(10000000, 99999999)}`,
          message: {
            id: uid().replace(/-/g, ""),
            threadId: uid().replace(/-/g, ""),
            labelIds: ["INBOX", "UNREAD"],
            snippet: "[SIMULATED EMAIL SNIPPET — no real content]",
            internalDate: `${Date.now()}`,
            payload: {
              headers: [
                { name: "From", value: "[REDACTED]@[REDACTED].example" },
                { name: "Subject", value: "[SIMULATED SUBJECT]" },
              ],
            },
          },
          _transformedBy: "google-workspace adapter · transformInbound()",
        },
      };

    // ── Data ────────────────────────────────────────────────────────────────
    case "snowflake":
      return {
        type: "REST", dir: "OUT", latencyMs: rnd(120, 280),
        label: "Snowflake → SQL query executed",
        summary: "Snowflake SQL API query completed · result set streamed · warehouse auto-suspended",
        payload: {
          _note: "SIMULATED — No real Snowflake account or data",
          statementHandle: uid(),
          message: "Statement executed successfully.",
          createdOn: now,
          statementStatusUrl: `https://demo.snowflakecomputing.com/api/v2/statements/${uid()}`,
          resultSetMetaData: {
            numRows: rnd(10, 1000),
            format: "jsonv2",
            partitionInfo: [{ rowCount: rnd(10, 1000), uncompressedSize: rnd(1024, 102400) }],
            rowType: [
              { name: "demo_id", type: "TEXT" },
              { name: "created_at", type: "TIMESTAMP_TZ" },
              { name: "value", type: "FLOAT" },
            ],
          },
          data: [["[DEMO_ID_1]", now, `${rnd(1, 999)}.${rnd(10, 99)}`]],
          _transformedBy: "snowflake adapter · transformOutbound()",
        },
      };

    case "bigquery":
      return {
        type: "REST", dir: "OUT", latencyMs: rnd(90, 200),
        label: "BigQuery → Streaming insert completed",
        summary: "BigQuery streaming insert API call · rows accepted · job ID returned",
        payload: {
          _note: "SIMULATED — No real BigQuery project or data",
          kind: "bigquery#tableDataInsertAllResponse",
          jobReference: { projectId: "demo-project", jobId: `bq_job_${uid()}` },
          status: { state: "DONE" },
          statistics: {
            creationTime: `${Date.now()}`,
            endTime: `${Date.now() + rnd(100, 500)}`,
            totalBytesProcessed: `${rnd(1024, 102400)}`,
          },
          insertErrors: [],
          _transformedBy: "bigquery adapter · transformOutbound()",
        },
      };

    // ── Web3 / IoT ──────────────────────────────────────────────────────────
    case "alchemy":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(15, 40),
        label: "Alchemy → eth_blockNumber event",
        summary: "Ethereum block mined · transaction index updated · on-chain state synced",
        payload: {
          _note: "SIMULATED — No real blockchain data",
          webhookId: uid(),
          id: uid(),
          createdAt: now,
          type: "MINED_TRANSACTION",
          event: {
            data: {
              block: {
                hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
                number: rnd(19000000, 20000000),
                timestamp: Math.floor(Date.now() / 1000),
                transactions: [{ hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`, from: `0x[REDACTED]`, to: `0x[REDACTED]`, value: `${rnd(1, 999)}000000000000000000` }],
              },
            },
            network: "ETH_MAINNET",
          },
          _transformedBy: "alchemy adapter · transformInbound()",
        },
      };

    case "aws-iot":
      return {
        type: "WEBHOOK", dir: "IN", latencyMs: rnd(5, 20),
        label: "AWS IoT → Device telemetry received",
        summary: "IoT device telemetry ingested via MQTT · rules engine evaluated · shadow updated",
        payload: {
          _note: "SIMULATED — No real IoT device or data",
          topic: `devices/demo-device-${rnd(1, 999)}/telemetry`,
          timestamp: Math.floor(Date.now() / 1000),
          deviceId: `device-${rnd(1000, 9999)}`,
          thingName: `CreateAI-Demo-Device-${rnd(1, 99)}`,
          payload: {
            temperature: `${(20 + Math.random() * 10).toFixed(2)}`,
            humidity: `${(40 + Math.random() * 30).toFixed(2)}`,
            battery: `${rnd(60, 100)}`,
            status: "online",
            firmware: "2.4.1",
            location: { lat: "0.0000 [REDACTED]", lng: "0.0000 [REDACTED]" },
          },
          shadowUpdate: { state: { reported: { connected: true, lastSeen: now } } },
          _transformedBy: "aws-iot adapter · transformInbound()",
        },
      };

    default:
      return {
        type: "REST", dir: "IN", latencyMs: rnd(30, 60),
        label: `${adapterId} → Generic simulation`,
        summary: "Generic adapter simulation · validation passed · event logged",
        payload: { _note: "SIMULATED — generic adapter test", adapterId, ts: now },
      };
  }
}

// ─── SSE stream endpoint ────────────────────────────────────────────────────
router.get("/events/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  sseClients.add(res as Response);

  // Immediately send the buffered events
  res.write(`data: ${JSON.stringify({ type: "init", events: eventBuffer.slice(0, 50) })}\n\n`);

  const heartbeat = setInterval(() => {
    try { res.write(`: heartbeat\n\n`); }
    catch { clearInterval(heartbeat); sseClients.delete(res as Response); }
  }, 20000);

  req.on("close", () => {
    sseClients.delete(res as Response);
    clearInterval(heartbeat);
  });
});

// ─── GET /api/public/adapter-activity ──────────────────────────────────────
router.get("/adapter-activity", (_req, res) => {
  const activity: Record<string, { ts: string; latencyMs: number; label: string } | null> = {};
  for (const a of ADAPTERS) {
    activity[a.id] = lastActivity.get(a.id) ?? null;
  }
  res.json({ ok: true, activity });
});

// ─── POST /api/public/simulate/adapter/:id ─────────────────────────────────
router.post("/simulate/adapter/:id", (req, res) => {
  const adapterId = req.params.id as string;
  const adapter = getAdapter(adapterId);
  if (!adapter) {
    res.status(404).json({ error: `Unknown adapter: ${adapterId}` });
    return;
  }

  const now = new Date().toISOString();
  const sim = buildAdapterPayload(adapterId, now);

  // Run through the real adapter transform function
  let transformedPayload: unknown;
  try {
    transformedPayload = adapter.transformInbound(sim.payload as Record<string, unknown>);
  } catch {
    transformedPayload = sim.payload;
  }

  const event: SimEvent = {
    id: uid(),
    adapterId,
    adapterLabel: adapter.label,
    industry: adapter.industry,
    type: sim.type,
    dir: sim.dir,
    status: "success",
    label: sim.label,
    summary: sim.summary,
    latencyMs: sim.latencyMs,
    ts: now,
    payload: {
      raw: sim.payload,
      transformed: transformedPayload,
      adapter: {
        id: adapter.id,
        label: adapter.label,
        authType: adapter.authType,
        complianceFlags: adapter.complianceFlags ?? [],
        industry: adapter.industry,
      },
      _note: "SIMULATED EVENT — No real external system called. No real PHI.",
    },
  };

  pushEvent(event);

  res.json({ ok: true, event, _note: "SIMULATED — No real credentials, PHI, or external calls." });
});

// ─── GET /api/public/integration-demo ──────────────────────────────────────
router.get("/integration-demo", (_req, res) => {
  const adaptersByIndustry = {} as Record<Industry, typeof ADAPTERS>;
  for (const a of ADAPTERS) {
    (adaptersByIndustry[a.industry] ??= []).push(a);
  }

  res.json({
    _disclaimer: "DEMO / REVIEW ONLY — No real PHI, credentials, or proprietary logic exposed. For authorized IT reviewer use.",
    platform: {
      name:      "CreateAI Brain",
      version:   "v3.0 — Omega Packet Engine",
      buildMode: "DEMO — View Only",
      stats: {
        restEndpoints:       315,
        aiEngines:           86,
        platformSystems:     37,
        registeredAdapters:  ADAPTERS.length,
        industries:          Object.keys(INDUSTRY_META).length,
        connectedSystems:    CONNECTED_SYSTEMS.length,
        pendingSystems:      PENDING_SYSTEMS.length,
        complianceFrameworks: COMPLIANCE.length,
      },
    },
    connections: {
      live:    CONNECTED_SYSTEMS,
      pending: PENDING_SYSTEMS,
    },
    compliance: COMPLIANCE,
    eventLog:   eventBuffer.length > 0 ? eventBuffer.slice(0, 20) : makeDemoEvents(),
    adapters: {
      byIndustry: Object.fromEntries(
        Object.entries(INDUSTRY_META).map(([id, meta]) => [
          id,
          {
            ...meta,
            adapters: (adaptersByIndustry[id as Industry] ?? []).map(a => ({
              id: a.id, label: a.label, icon: a.icon,
              authType: a.authType,
              complianceFlags: a.complianceFlags ?? [],
              docsUrl: a.docsUrl,
              website: a.website,
            })),
          },
        ])
      ),
      total: ADAPTERS.length,
    },
  });
});

// ─── POST /api/public/simulate/:type (legacy simple types) ─────────────────
router.post("/simulate/:type", (req, res) => {
  const type = req.params.type as string;
  const now = new Date().toISOString();

  const legacyMap: Record<string, string> = {
    fhir: "epic-fhir",
    hl7: "cerner-fhir",
    webhook: "stripe",
    rest: "salesforce",
  };

  // Native HL7 v2 simulation — return raw HL7 message format, not FHIR
  if (type.toLowerCase() === "hl7") {
    const msgId = `MSG${rnd(1000, 9999)}`;
    const ts14 = now.replace(/[-:T.Z]/g, "").slice(0, 14);
    const event: SimEvent = {
      id: uid(),
      adapterId: "hl7-v2-engine",
      adapterLabel: "HL7 v2.6 Parser",
      industry: "healthcare",
      type: "HL7",
      dir: "IN",
      status: "success",
      label: "HL7 ADT^A01 — Admit Patient [SIMULATED]",
      summary: "HL7 v2.6 admit message parsed · ACK AA returned · no real PHI",
      latencyMs: rnd(14, 38),
      ts: now,
      payload: {
        raw: `MSH|^~\\&|CREATEAI-DEMO|DEMO-FACILITY|RECEIVER|RECV-FACILITY|${ts14}||ADT^A01|${msgId}|P|2.6\nEVN|A01|${ts14}\nPID|1||[REDACTED-MRN]^^^DEMO-FACILITY^MR||[REDACTED]^[REDACTED]||[REDACTED]|[REDACTED]|||[REDACTED]|||||||[REDACTED]\nPV1|1|I|[REDACTED]^[REDACTED]^[REDACTED]^DEMO-FACILITY||||[REDACTED]^[REDACTED]|||||||[REDACTED]|[REDACTED]||[REDACTED]|[REDACTED]`,
        parsed: {
          messageType: "ADT^A01",
          version: "2.6",
          messageId: msgId,
          sendingApp: "CREATEAI-DEMO",
          sendingFacility: "DEMO-FACILITY",
          eventType: "Admit Patient",
          timestamp: now,
          segments: {
            MSH: { sendingApp: "CREATEAI-DEMO", messageType: "ADT^A01", version: "2.6" },
            EVN: { eventType: "A01", recordedDateTime: ts14 },
            PID: { patientId: "[REDACTED — no PHI]", name: "[REDACTED]", dob: "[REDACTED]", gender: "[REDACTED]" },
            PV1: { patientClass: "I", admitDateTime: ts14, attendingDoctor: "[REDACTED]" },
          },
        },
        ack: `MSH|^~\\&|RECEIVER|RECV-FACILITY|CREATEAI-DEMO|DEMO-FACILITY|${ts14}||ACK^A01|ACK${rnd(100, 999)}|P|2.6\nMSA|AA|${msgId}|Message accepted successfully`,
        validation: { schemaCheck: "PASSED", segmentCount: 4, fieldCount: 42, encodingCheck: "PASSED" },
        _note: "SIMULATED DATA — No real PHI. HL7 v2.6 ADT^A01 Admit Message.",
      },
    };
    pushEvent(event);
    return res.json({ ok: true, event, _note: "SIMULATED — No real external system called. No real PHI." });
  }

  const mappedId = legacyMap[type.toLowerCase()];
  if (!mappedId) {
    res.status(400).json({ error: `Unknown type. Valid: ${Object.keys(legacyMap).join(", ")}` });
    return;
  }

  const sim = buildAdapterPayload(mappedId, now);
  const event: SimEvent = {
    id: uid(),
    adapterId: mappedId,
    adapterLabel: sim.label,
    industry: mappedId.includes("fhir") || mappedId.includes("health") ? "healthcare" : mappedId === "stripe" ? "payments" : mappedId === "salesforce" ? "crm" : "rest",
    type: sim.type,
    dir: sim.dir,
    status: "success",
    label: sim.label,
    summary: sim.summary,
    latencyMs: sim.latencyMs,
    ts: now,
    payload: sim.payload,
  };
  pushEvent(event);

  return res.json({ ok: true, event, _note: "SIMULATED EVENT — No real external system called. No real PHI." });
});

// ─── Pre-seeded demo events (used as fallback) ──────────────────────────────
function makeDemoEvents() {
  const now = Date.now();
  return [
    { id: "e1",  adapterId: "epic-fhir",        adapterLabel: "Epic EHR",      industry: "healthcare", type: "FHIR",    dir: "IN",  status: "success", label: "Epic → FHIR R4 Patient Bundle",      summary: "Patient resource received · 14 fields · PHI masked",       latencyMs: 87,  ts: new Date(now - 60000).toISOString() },
    { id: "e2",  adapterId: "cerner-fhir",       adapterLabel: "Cerner",        industry: "healthcare", type: "FHIR",    dir: "IN",  status: "success", label: "Cerner → FHIR R4 Encounter",         summary: "Outpatient encounter · status=finished · 45min",            latencyMs: 94,  ts: new Date(now - 120000).toISOString() },
    { id: "e3",  adapterId: "stripe",            adapterLabel: "Stripe",        industry: "payments",   type: "WEBHOOK", dir: "IN",  status: "success", label: "Stripe → payment_intent.succeeded",  summary: "$1,250.00 · signature verified · HMAC-SHA256",             latencyMs: 18,  ts: new Date(now - 200000).toISOString() },
    { id: "e4",  adapterId: "slack",             adapterLabel: "Slack",         industry: "productivity",type: "WEBHOOK", dir: "IN",  status: "success", label: "Slack → workflow trigger",            summary: "Bot mention · workflow queued · 200 OK",                   latencyMs: 67,  ts: new Date(now - 310000).toISOString() },
    { id: "e5",  adapterId: "github",            adapterLabel: "GitHub",        industry: "productivity",type: "WEBHOOK", dir: "IN",  status: "success", label: "GitHub → push to main",               summary: "3 commits · automated review triggered · payload verified", latencyMs: 14,  ts: new Date(now - 420000).toISOString() },
    { id: "e6",  adapterId: "aws",               adapterLabel: "AWS",           industry: "cloud",      type: "WEBHOOK", dir: "IN",  status: "success", label: "AWS → S3 ObjectCreated",              summary: "S3 PutObject · Lambda trigger queued",                     latencyMs: 9,   ts: new Date(now - 530000).toISOString() },
    { id: "e7",  adapterId: "shopify",           adapterLabel: "Shopify",       industry: "ecommerce",  type: "WEBHOOK", dir: "IN",  status: "success", label: "Shopify → orders/create",             summary: "Order #1234 · $149.99 · fulfillment queued",               latencyMs: 38,  ts: new Date(now - 640000).toISOString() },
    { id: "e8",  adapterId: "salesforce",        adapterLabel: "Salesforce",    industry: "crm",        type: "REST",    dir: "IN",  status: "success", label: "Salesforce → Contact.Created",        summary: "New contact synced · pipeline updated",                    latencyMs: 72,  ts: new Date(now - 720000).toISOString() },
    { id: "e9",  adapterId: "aws-iot",           adapterLabel: "AWS IoT",       industry: "web3-iot",   type: "WEBHOOK", dir: "IN",  status: "success", label: "AWS IoT → Device telemetry",          summary: "Sensor data received · shadow updated",                    latencyMs: 6,   ts: new Date(now - 830000).toISOString() },
    { id: "e10", adapterId: "google-workspace",  adapterLabel: "Google Workspace",industry:"productivity",type: "WEBHOOK", dir: "IN",  status: "success", label: "Gmail → message.created",             summary: "Gmail push · thread synced · AI draft queued",             latencyMs: 52,  ts: new Date(now - 970000).toISOString() },
  ];
}

export default router;
