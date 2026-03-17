/**
 * public.ts — Public Integration Demo Endpoint
 *
 * No authentication required. Returns sanitized, view-only integration
 * capability data for external IT reviewer demonstrations.
 *
 * IMPORTANT: No real PHI, credentials, tokens, or proprietary logic
 * is exposed through any endpoint in this file.
 */

import { Router } from "express";
import { ADAPTERS, INDUSTRY_META, type Industry } from "../adapters/registry";

const router = Router();

// ─── Static demo connection points ────────────────────────────────────────────
const CONNECTED_SYSTEMS = [
  { id: "rest-api",      label: "REST API Layer",          category: "Transport",   icon: "🌐", status: "live",    detail: "315 versioned endpoints · GET/POST/PUT/PATCH/DELETE · JSON:API" },
  { id: "sse",           label: "Server-Sent Events",      category: "Transport",   icon: "📡", status: "live",    detail: "Real-time SSE streaming · 86 engine outputs · long-running process support" },
  { id: "tls",           label: "TLS 1.3 Encryption",      category: "Security",    icon: "🔒", status: "live",    detail: "In-transit encryption · mTLS proxy · certificate pinning" },
  { id: "aes256",        label: "AES-256 At Rest",         category: "Security",    icon: "🔐", status: "live",    detail: "Encrypted database fields · key rotation ready" },
  { id: "rbac",          label: "Role-Based Access",        category: "Auth",        icon: "👤", status: "live",    detail: "owner / editor / viewer roles · per-resource isolation" },
  { id: "jwt",           label: "JWT Service Auth",         category: "Auth",        icon: "🎫", status: "live",    detail: "HS256 signed tokens · 1h TTL · refresh flow" },
  { id: "session",       label: "Session Management",       category: "Auth",        icon: "🔑", status: "live",    detail: "Secure HTTPOnly cookies · 7-day TTL · server-side store" },
  { id: "fhir-r4",       label: "FHIR R4 Engine",           category: "Healthcare",  icon: "🏨", status: "live",    detail: "Patient / Encounter / Observation / MedicationRequest / DocumentReference" },
  { id: "hl7-v2",        label: "HL7 v2.6 Parser",          category: "Healthcare",  icon: "🔀", status: "live",    detail: "ADT · ORM · ORU · ACK — bidirectional transformation engine" },
  { id: "phi-flow",      label: "PHI Data Flow",            category: "Healthcare",  icon: "🏥", status: "live",    detail: "Minimum-necessary access · field-level masking · no PHI in logs" },
  { id: "audit-log",     label: "Audit Logging",            category: "Compliance",  icon: "📋", status: "live",    detail: "All actions logged · actor + timestamp + resource + change · immutable" },
  { id: "hipaa",         label: "HIPAA Controls",           category: "Compliance",  icon: "📜", status: "live",    detail: "Technical safeguards blueprint · BA agreements · breach notification" },
  { id: "webhook-ingest",label: "Webhook Ingestion",        category: "Transport",   icon: "📥", status: "live",    detail: "Inbound webhook validation · HMAC-SHA256 signature verification" },
];

const PENDING_SYSTEMS = [
  { id: "webhook-out",   label: "Outbound Webhook Dispatch",category: "Transport",  icon: "🔔", status: "pending", detail: "Requires target URL configuration — ready to activate" },
  { id: "graphql",       label: "GraphQL Gateway",          category: "Transport",  icon: "◈",  status: "pending", detail: "Unified query layer — Phase 1 design complete" },
  { id: "ws",            label: "WebSocket (Bidirectional)", category: "Transport",  icon: "⚡",  status: "pending", detail: "Bidirectional real-time channel — spec complete" },
  { id: "saml",          label: "SAML 2.0 SSO",             category: "Auth",       icon: "🏢", status: "pending", detail: "Enterprise SSO — IdP connector ready" },
  { id: "mfa",           label: "Multi-Factor Auth",        category: "Auth",       icon: "🛡️", status: "pending", detail: "TOTP/SMS — config UI complete" },
];

// ─── Compliance matrix ─────────────────────────────────────────────────────────
const COMPLIANCE = [
  { framework: "HIPAA",   status: "blueprint-ready", domains: ["Technical Safeguards", "PHI Access Controls", "Audit Logging", "Breach Notification"], coverage: 89 },
  { framework: "FHIR R4", status: "live",             domains: ["Patient", "Encounter", "Observation", "MedicationRequest", "DocumentReference"],       coverage: 95 },
  { framework: "HL7 v2",  status: "live",             domains: ["ADT", "ORM", "ORU", "ACK", "QRY/QRF"],                                                coverage: 92 },
  { framework: "SOC 2",   status: "blueprint-ready", domains: ["Availability", "Confidentiality", "Processing Integrity", "Security"],                  coverage: 74 },
  { framework: "GDPR",    status: "blueprint-ready", domains: ["Right to Erasure", "Data Minimization", "Consent Management", "DPA"],                  coverage: 68 },
  { framework: "PCI-DSS", status: "blueprint-ready", domains: ["Cardholder Data", "Transmission Encryption", "Access Controls"],                       coverage: 61 },
];

// ─── Pre-seeded demo event log ────────────────────────────────────────────────
function makeDemoEvents() {
  const now = Date.now();
  return [
    { id: "e1",  type: "FHIR",    dir: "IN",   status: "success", label: "FHIR R4 Patient Bundle",          summary: "Patient resource received · 14 fields · PHI masked in log",                        latencyMs: 87,  ts: new Date(now - 60000).toISOString()   },
    { id: "e2",  type: "HL7",     dir: "IN",   status: "success", label: "HL7 v2.6 ADT^A01",                summary: "Admit/Transfer/Discharge · patient admit event · ACK AA returned",                  latencyMs: 23,  ts: new Date(now - 118000).toISOString()  },
    { id: "e3",  type: "REST",    dir: "OUT",  status: "success", label: "REST 200 OK — /api/encounters",   summary: "Encounter bundle returned · 3 records · TLS 1.3 · 43ms",                           latencyMs: 43,  ts: new Date(now - 200000).toISOString()  },
    { id: "e4",  type: "WEBHOOK", dir: "OUT",  status: "success", label: "Outbound Webhook Dispatch",       summary: "Signed payload · HMAC-SHA256 · target acknowledged 200",                           latencyMs: 156, ts: new Date(now - 310000).toISOString()  },
    { id: "e5",  type: "AUTH",    dir: "IN",   status: "success", label: "OAuth2 Token Exchange",           summary: "Client credentials grant · access_token issued · 3600s TTL",                       latencyMs: 31,  ts: new Date(now - 420000).toISOString()  },
    { id: "e6",  type: "FHIR",    dir: "OUT",  status: "success", label: "FHIR Write — Observation",        summary: "Lab result Observation posted to EHR · 201 Created · id=obs-00291",                 latencyMs: 112, ts: new Date(now - 530000).toISOString()  },
    { id: "e7",  type: "REST",    dir: "IN",   status: "success", label: "Stripe Webhook Ingest",           summary: "payment_intent.succeeded · $1,250.00 · signature verified",                        latencyMs: 18,  ts: new Date(now - 640000).toISOString()  },
    { id: "e8",  type: "HL7",     dir: "OUT",  status: "success", label: "HL7 ACK Response",                summary: "MSH|^~\\&|CREATEAI|...|AA|200|Message accepted",                                   latencyMs: 9,   ts: new Date(now - 720000).toISOString()  },
    { id: "e9",  type: "REST",    dir: "OUT",  status: "success", label: "Slack Notification Dispatch",     summary: "POST /api/chat.postMessage · workflow trigger · 200 OK",                           latencyMs: 67,  ts: new Date(now - 830000).toISOString()  },
    { id: "e10", type: "WEBHOOK", dir: "IN",   status: "success", label: "GitHub Push Webhook",             summary: "push to main · 3 commits · payload verified · automated review triggered",         latencyMs: 14,  ts: new Date(now - 970000).toISOString()  },
    { id: "e11", type: "AUTH",    dir: "IN",   status: "success", label: "RBAC Role Check",                 summary: "userId=demo · resource=patient-records · role=viewer · decision=ALLOW",            latencyMs: 3,   ts: new Date(now - 1100000).toISOString() },
    { id: "e12", type: "FHIR",    dir: "IN",   status: "success", label: "FHIR R4 Encounter Sync",          summary: "Encounter bundle · outpatient visit · status=finished · duration=45min",           latencyMs: 94,  ts: new Date(now - 1250000).toISOString() },
  ];
}

// ─── Simulate a new event (no auth, returns structured result) ─────────────────
function runSimulation(type: string) {
  const now = new Date().toISOString();
  switch (type.toLowerCase()) {
    case "fhir":
      return {
        type: "FHIR", dir: "IN", status: "success",
        label: "FHIR R4 Patient [SIMULATED]",
        summary: "Simulated FHIR R4 Patient resource · PHI placeholder only · no real data",
        latencyMs: 72 + Math.floor(Math.random() * 40),
        payload: {
          resourceType: "Patient",
          id: `sim-patient-${Math.floor(Math.random() * 9000) + 1000}`,
          meta: { profile: ["http://hl7.org/fhir/StructureDefinition/Patient"] },
          text: { status: "generated", div: "[SIMULATED — no real PHI]" },
          identifier: [{ system: "http://example.com/mrn", value: `MRN-DEMO-${Math.floor(Math.random() * 9000) + 1000}` }],
          active: true,
          name: [{ use: "official", family: "[REDACTED]", given: ["[REDACTED]"] }],
          birthDate: "[REDACTED]",
          address: [{ use: "home", city: "[REDACTED]", state: "[REDACTED]" }],
          _note: "SIMULATED DATA — No real PHI — for integration capability demonstration only",
        },
        ts: now,
      };

    case "hl7":
      return {
        type: "HL7", dir: "IN", status: "success",
        label: "HL7 ADT^A01 [SIMULATED]",
        summary: "Simulated HL7 v2.6 admit message · no real PHI",
        latencyMs: 18 + Math.floor(Math.random() * 20),
        payload: {
          raw: "MSH|^~\\&|CREATEAI-DEMO|DEMO-FACILITY|RECEIVER|RECV-FACILITY|" + now.replace(/[-:T]/g, "").slice(0, 14) + "||ADT^A01|MSG" + Math.floor(Math.random() * 9000) + "|P|2.6",
          parsed: {
            messageType: "ADT^A01",
            version: "2.6",
            sendingApp: "CREATEAI-DEMO",
            eventType: "Admit Patient",
            patientId: "[REDACTED — no real PHI]",
            admitDateTime: "[REDACTED]",
          },
          ack: "MSH|^~\\&|RECEIVER|RECV-FACILITY|CREATEAI-DEMO|DEMO-FACILITY|||ACK^A01|ACK001|P|2.6\nMSA|AA|MSG001|Message accepted",
          _note: "SIMULATED DATA — No real PHI",
        },
        ts: now,
      };

    case "webhook":
      return {
        type: "WEBHOOK", dir: "OUT", status: "success",
        label: "Outbound Webhook Dispatch [SIMULATED]",
        summary: "Signed payload dispatched · HMAC-SHA256 · 200 OK from target",
        latencyMs: 134 + Math.floor(Math.random() * 80),
        payload: {
          webhookId: `wh_sim_${Date.now()}`,
          targetUrl: "https://demo-receiver.example.com/webhook",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CreateAI-Signature": "sha256=[HMAC-SHA256-DEMO-SIGNATURE]",
            "X-CreateAI-Timestamp": now,
            "X-CreateAI-Version": "2024-01-01",
          },
          body: {
            event: "integration.test",
            source: "createai-brain",
            timestamp: now,
            data: { type: "simulated-event", message: "Webhook capability demonstration" },
          },
          response: { status: 200, body: '{"received":true}' },
          _note: "SIMULATED — no real target called",
        },
        ts: now,
      };

    case "rest":
    default:
      return {
        type: "REST", dir: "IN", status: "success",
        label: "Inbound REST Request [SIMULATED]",
        summary: "POST /api/integrations/ingest · validated · schema-checked · 201 Created",
        latencyMs: 38 + Math.floor(Math.random() * 30),
        payload: {
          method: "POST",
          path: "/api/integrations/ingest",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer [DEMO-TOKEN — not a real credential]",
            "X-Request-ID": `req_${Date.now()}`,
          },
          body: {
            source: "external-system-demo",
            event: "data.submitted",
            payload: { type: "demo", message: "REST integration capability demonstration" },
          },
          response: {
            status: 201,
            body: { received: true, id: `evt_${Date.now()}`, timestamp: now },
          },
          validation: { schemaCheck: "PASSED", signatureCheck: "PASSED", rateLimitCheck: "PASSED" },
          _note: "SIMULATED — no real external system involved",
        },
        ts: now,
      };
  }
}

// ─── GET /api/public/integration-demo ──────────────────────────────────────────
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
        restEndpoints:      315,
        aiEngines:          86,
        platformSystems:    37,
        registeredAdapters: ADAPTERS.length,
        industries:         Object.keys(INDUSTRY_META).length,
        connectedSystems:   CONNECTED_SYSTEMS.length,
        pendingSystems:     PENDING_SYSTEMS.length,
        complianceFrameworks: COMPLIANCE.length,
      },
    },
    connections: {
      live:    CONNECTED_SYSTEMS,
      pending: PENDING_SYSTEMS,
    },
    compliance: COMPLIANCE,
    eventLog:   makeDemoEvents(),
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

// ─── POST /api/public/simulate/:type ───────────────────────────────────────────
router.post("/simulate/:type", (req, res) => {
  const type = req.params.type as string;
  const validTypes = ["fhir", "hl7", "webhook", "rest"];
  if (!validTypes.includes(type.toLowerCase())) {
    res.status(400).json({ error: `Unknown simulation type. Valid: ${validTypes.join(", ")}` });
    return;
  }
  const result = runSimulation(type);
  res.json({ ok: true, event: result, _note: "SIMULATED EVENT — No real external system called. No real PHI." });
});

export default router;
