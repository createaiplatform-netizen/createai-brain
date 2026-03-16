// ─── Regulatory Readiness Blueprint Layer ─────────────────────────────────────
// "Regulatory Readiness Blueprint – Internal, Non-Operational, Not Legally Binding."
// This layer models regulatory flow STRUCTURES ONLY. It is architecturally coherent
// but performs NO real compliance, NO real certification, and has NO legal authority.
// Real certified teams must implement actual compliance before deployment.

export interface RegulatoryClause {
  id: string;
  reference: string;     // e.g. "§164.312(a)(1)"
  title: string;
  description: string;
  mockStatus: "mapped" | "partial" | "gap" | "not-applicable";
  implementationNote: string;
}

export interface ConsentFlow {
  id: string;
  name: string;
  steps: string[];
  dataCollected: string[];
  retentionPeriod: string;
  withdrawalProcess: string;
  note: string;
}

export interface AuditTrailSpec {
  event: string;
  actor: string;
  dataLogged: string[];
  retention: string;
  mockOnly: boolean;
}

export interface RegulatoryBlueprint {
  id: string;
  domain: string;
  framework: string;
  title: string;
  version: string;
  status: "blueprint-draft" | "blueprint-ready";
  summary: string;
  applicableTo: string[];
  clauses: RegulatoryClause[];
  dataGovernance: string[];
  accessPatterns: string[];
  securityFlows: string[];
  auditTrail: AuditTrailSpec[];
  consentFlows: ConsentFlow[];
  complianceNotes: string[];
  gapAnalysis: string[];
  disclaimer: string;
}

const DISCLAIMER = "REGULATORY READINESS BLUEPRINT — Internal, Non-Operational, Not Legally Binding. This document is a structural model only. It does not constitute legal advice, real certification, regulatory approval, or compliance authorization. Real implementation requires certified legal, compliance, and security professionals.";

// ─── Blueprint Library ────────────────────────────────────────────────────────
export const REGULATORY_BLUEPRINTS: RegulatoryBlueprint[] = [

  // ── HIPAA ──────────────────────────────────────────────────────────────────
  {
    id: "hipaa",
    domain: "Healthcare",
    framework: "HIPAA",
    title: "HIPAA Privacy & Security Rule Blueprint",
    version: "2024-blueprint-v1",
    status: "blueprint-ready",
    summary: "Structural blueprint modeling HIPAA Privacy Rule (45 CFR Part 164) and Security Rule compliance architecture. All elements are fictional and mock.",
    applicableTo: ["EHR integrations (demo)", "Patient data flows (mock)", "Healthcare AI features (blueprint)"],
    clauses: [
      { id: "hipaa-1", reference: "§164.502", title: "Uses and Disclosures of PHI",
        description: "Covered entities may only use or disclose PHI as permitted by HIPAA Privacy Rule.",
        mockStatus: "mapped",
        implementationNote: "Blueprint: All demo patient data is fictional. No real PHI ever processed by this system." },
      { id: "hipaa-2", reference: "§164.312(a)(1)", title: "Access Control",
        description: "Implement technical policies to allow access only to authorized persons.",
        mockStatus: "partial",
        implementationNote: "Blueprint: RBAC model defined in Security layer. Real ACL requires production implementation." },
      { id: "hipaa-3", reference: "§164.312(c)(1)", title: "Integrity Controls",
        description: "Implement security measures to protect ePHI from improper alteration or destruction.",
        mockStatus: "gap",
        implementationNote: "Blueprint: Data integrity patterns outlined in Backend Blueprint. Real hash/signature logic not yet implemented." },
      { id: "hipaa-4", reference: "§164.312(e)(1)", title: "Transmission Security",
        description: "Implement technical security measures to guard against unauthorized access during transmission.",
        mockStatus: "mapped",
        implementationNote: "Blueprint: All demo endpoints at *.example.com, TLS assumed. No real data transmitted." },
      { id: "hipaa-5", reference: "§164.530(b)", title: "Training Requirements",
        description: "Covered entity must train all workforce members on privacy policies.",
        mockStatus: "not-applicable",
        implementationNote: "Blueprint: Training module structure outlined. Actual workforce training requires human program." },
    ],
    dataGovernance: [
      "All PHI fields must be classified as Sensitive, Confidential, or Public before processing",
      "Data minimization: collect only the minimum necessary PHI for each use case",
      "De-identification: apply Safe Harbor or Expert Determination method before analytics",
      "Retention schedule: PHI retained per state law minimum (typically 6–10 years)",
      "Right to access: patient data access request workflow (Blueprint: 30-day response window)",
      "Business Associate Agreements (BAA) required for all third-party processors — MOCK ONLY",
    ],
    accessPatterns: [
      "Role: Clinical Staff → PHI read, limited write",
      "Role: Admin → PHI audit, no direct read without cause",
      "Role: Patient → own records read, consent management",
      "Role: System/API → tokenized access, scoped by session",
      "All access logged with actor, timestamp, data accessed, and purpose",
    ],
    securityFlows: [
      "Authentication: MFA required for all PHI access (BLUEPRINT — real MFA not implemented)",
      "Authorization: RBAC enforced at API layer before data fetch",
      "Encryption: AES-256 at rest, TLS 1.3 in transit (structural spec, not deployed)",
      "Session timeout: 15-minute inactivity for clinical roles",
      "Audit log: every PHI access/modify/delete event immutably logged",
    ],
    auditTrail: [
      { event: "Patient record accessed",     actor: "Clinical Staff",   dataLogged: ["actor_id", "patient_id", "timestamp", "access_reason", "ip_address"], retention: "6 years", mockOnly: true },
      { event: "PHI exported or downloaded",  actor: "Admin/Clinician",  dataLogged: ["actor_id", "export_format", "records_count", "timestamp"],             retention: "6 years", mockOnly: true },
      { event: "Consent form signed",         actor: "Patient",          dataLogged: ["patient_id", "consent_type", "timestamp", "form_version"],              retention: "life of record", mockOnly: true },
      { event: "Data breach detected",        actor: "System",           dataLogged: ["event_type", "affected_records", "timestamp", "severity"],              retention: "10 years", mockOnly: true },
    ],
    consentFlows: [
      { id: "consent-hipaa-1", name: "Treatment Consent",
        steps: ["Present consent form", "Explain data use", "Patient reviews", "Patient signs (mock)", "Consent stored to record"],
        dataCollected: ["patient_id", "consent_timestamp", "form_version", "scope_agreed"],
        retentionPeriod: "Life of patient record",
        withdrawalProcess: "Patient submits withdrawal request → PHI use restricted within 30 days",
        note: "MOCK ONLY — No real consent collected by this system." },
    ],
    complianceNotes: [
      "Breach Notification Rule (§164.400): 60-day notification window to HHS and affected individuals",
      "Minimum Necessary Rule applies to all PHI disclosures",
      "Business Associate Agreements must be executed before any data sharing",
      "Annual risk assessments required (BLUEPRINT: risk register outlined in Backend Blueprint)",
    ],
    gapAnalysis: [
      "⚠️ GAP: Real PHI encryption not implemented — requires production cryptography layer",
      "⚠️ GAP: Audit log persistence is blueprint-only — requires immutable logging infrastructure",
      "⚠️ GAP: BAA execution process not built — requires legal team and contract workflow",
      "✓ MAPPED: Role-based access control model defined",
      "✓ MAPPED: Consent flow structure documented",
      "✓ MAPPED: Breach notification timeline specified",
    ],
    disclaimer: DISCLAIMER,
  },

  // ── GDPR ───────────────────────────────────────────────────────────────────
  {
    id: "gdpr",
    domain: "Data Protection (EU)",
    framework: "GDPR",
    title: "GDPR Compliance Blueprint",
    version: "2024-blueprint-v1",
    status: "blueprint-ready",
    summary: "Structural blueprint modeling EU General Data Protection Regulation (GDPR) compliance architecture. Fictional and non-binding.",
    applicableTo: ["EU user data flows (blueprint)", "CRM/marketing integrations (mock)", "Analytics features (demo)"],
    clauses: [
      { id: "gdpr-1", reference: "Art. 6", title: "Lawful Basis for Processing",
        description: "Processing is lawful only if a valid lawful basis applies (consent, contract, legal obligation, vital interests, public task, legitimate interests).",
        mockStatus: "mapped",
        implementationNote: "Blueprint: Consent basis assumed for demo. Real lawful basis requires legal analysis per use case." },
      { id: "gdpr-2", reference: "Art. 13–14", title: "Transparency / Privacy Notices",
        description: "Data subjects must be informed of processing purposes, legal basis, retention periods, and their rights.",
        mockStatus: "partial",
        implementationNote: "Blueprint: Privacy notice template outlined. Real notice requires legal drafting." },
      { id: "gdpr-3", reference: "Art. 17", title: "Right to Erasure ('Right to be Forgotten')",
        description: "Data subjects can request deletion of personal data under specified conditions.",
        mockStatus: "partial",
        implementationNote: "Blueprint: Deletion workflow defined. Real implementation requires cascading delete across all stores." },
      { id: "gdpr-4", reference: "Art. 25", title: "Data Protection by Design and Default",
        description: "Privacy must be embedded into product design from the outset.",
        mockStatus: "mapped",
        implementationNote: "Blueprint: Privacy-first architecture principles applied. Demo data is fictional throughout." },
      { id: "gdpr-5", reference: "Art. 33", title: "Breach Notification (72 hours)",
        description: "Notify supervisory authority within 72 hours of becoming aware of a personal data breach.",
        mockStatus: "gap",
        implementationNote: "Blueprint: Breach detection outlined. Real incident response requires dedicated security operations." },
    ],
    dataGovernance: [
      "Data inventory / Record of Processing Activities (RoPA) — structural template only",
      "Data minimization: collect only what is strictly necessary",
      "Purpose limitation: data collected for one purpose must not be repurposed without new consent",
      "Storage limitation: define and enforce per-data-type retention periods",
      "Data subject rights workflow: access, rectification, erasure, portability, restriction, objection",
      "Data Protection Officer (DPO) appointment (required for certain processing activities)",
    ],
    accessPatterns: [
      "Role: User → own data read, rectification, deletion requests",
      "Role: Platform Admin → data management, audit, no unauthorized access",
      "Role: Data Processor (third-party) → strictly scoped access under Data Processing Agreement",
      "Cross-border transfers: adequacy decision or SCCs required for ex-EU transfers",
    ],
    securityFlows: [
      "Pseudonymization: replace direct identifiers with tokens where possible",
      "Encryption: AES-256 at rest, TLS 1.3 in transit (structural spec)",
      "Access logging: all personal data access events logged",
      "DPA execution: Data Processing Agreements required before sharing with processors",
    ],
    auditTrail: [
      { event: "Personal data accessed",   actor: "Admin/System", dataLogged: ["actor", "subject_id", "data_type", "purpose", "timestamp"], retention: "3 years", mockOnly: true },
      { event: "Erasure request received", actor: "User",         dataLogged: ["subject_id", "request_id", "timestamp", "scope"],           retention: "3 years", mockOnly: true },
      { event: "Consent given/withdrawn",  actor: "User",         dataLogged: ["subject_id", "consent_scope", "action", "timestamp"],       retention: "3 years", mockOnly: true },
    ],
    consentFlows: [
      { id: "consent-gdpr-1", name: "Marketing Consent",
        steps: ["Display granular consent options", "User selects purposes", "Consent logged with timestamp and version", "Confirmed by email (mock)", "Stored in consent ledger"],
        dataCollected: ["user_id", "consent_scope[]", "timestamp", "form_version", "ip_hash"],
        retentionPeriod: "Until withdrawn + 2 years",
        withdrawalProcess: "Single-click withdrawal → immediate cessation of processing → confirmation sent",
        note: "MOCK ONLY. No real consent mechanism deployed." },
    ],
    complianceNotes: [
      "GDPR fines: up to €20M or 4% of global annual turnover — blueprint awareness only",
      "SCCs (Standard Contractual Clauses) required for transfers to non-adequate countries",
      "Legitimate interest assessments (LIA) documented before using LI as lawful basis",
    ],
    gapAnalysis: [
      "⚠️ GAP: Real consent management platform not integrated",
      "⚠️ GAP: Automated data subject request handling not built",
      "⚠️ GAP: Cross-border transfer mechanism not implemented",
      "✓ MAPPED: Privacy-by-design principles applied in architecture",
      "✓ MAPPED: Data minimization applied — no unnecessary personal data collected",
    ],
    disclaimer: DISCLAIMER,
  },

  // ── SOC 2 ──────────────────────────────────────────────────────────────────
  {
    id: "soc2",
    domain: "Security & Trust",
    framework: "SOC 2 Type II",
    title: "SOC 2 Type II Readiness Blueprint",
    version: "2024-blueprint-v1",
    status: "blueprint-draft",
    summary: "Structural blueprint for SOC 2 Type II audit readiness across the five Trust Service Criteria (TSC). Blueprint only — not a real audit.",
    applicableTo: ["Platform security architecture (blueprint)", "Customer data handling (mock)", "Access control design"],
    clauses: [
      { id: "soc2-cc6", reference: "CC6", title: "Logical & Physical Access Controls",
        description: "Restrict logical and physical access to protect against threats.",
        mockStatus: "partial",
        implementationNote: "Blueprint: RBAC model and MFA spec defined. Real access controls require security engineering." },
      { id: "soc2-cc7", reference: "CC7", title: "System Operations",
        description: "Detect and mitigate deviations from normal system operations.",
        mockStatus: "gap",
        implementationNote: "Blueprint: Monitoring spec outlined. Real SIEM/alerting requires infrastructure deployment." },
      { id: "soc2-cc8", reference: "CC8", title: "Change Management",
        description: "Changes to infrastructure, data, software, and procedures are authorized and managed.",
        mockStatus: "partial",
        implementationNote: "Blueprint: Change control process documented. CI/CD pipeline review required in real implementation." },
      { id: "soc2-a1", reference: "A1", title: "Availability",
        description: "System is available for operation and use as committed.",
        mockStatus: "gap",
        implementationNote: "Blueprint: SLAs and uptime targets defined. Real availability requires infrastructure SLAs." },
    ],
    dataGovernance: [
      "Asset inventory: all system components classified by data sensitivity",
      "Data classification: Public, Internal, Confidential, Restricted",
      "Vendor management: third-party risk assessments for all integrations",
      "Incident response plan: detection → containment → eradication → recovery → lessons-learned",
    ],
    accessPatterns: [
      "Principle of least privilege enforced across all roles",
      "Privileged access management (PAM) for admin-level operations",
      "MFA required for all production system access",
      "Quarterly access reviews and de-provisioning of terminated accounts",
    ],
    securityFlows: [
      "Vulnerability management: quarterly scans + remediation SLAs (Critical: 24h, High: 7d)",
      "Penetration testing: annual third-party pentest (blueprint requirement)",
      "Security training: annual security awareness program for all team members",
      "Encryption: TLS 1.3 in transit, AES-256 at rest",
    ],
    auditTrail: [
      { event: "Admin login",        actor: "Admin",  dataLogged: ["actor", "timestamp", "ip", "mfa_used", "success"], retention: "1 year", mockOnly: true },
      { event: "Config change",      actor: "DevOps", dataLogged: ["actor", "system", "change_description", "ticket_ref", "timestamp"], retention: "1 year", mockOnly: true },
      { event: "Security alert",     actor: "System", dataLogged: ["alert_type", "severity", "timestamp", "resolved_at"], retention: "2 years", mockOnly: true },
    ],
    consentFlows: [],
    complianceNotes: [
      "SOC 2 Type II covers a period of operations (typically 6–12 months) — not a point-in-time audit",
      "Auditor selection: only AICPA-licensed CPA firms may issue SOC 2 reports",
      "Management assertion required alongside auditor opinion",
    ],
    gapAnalysis: [
      "⚠️ GAP: No real SIEM or monitoring infrastructure deployed",
      "⚠️ GAP: Formal change management process not yet in place",
      "⚠️ GAP: Penetration testing not conducted",
      "✓ MAPPED: RBAC model and access control architecture defined",
      "✓ MAPPED: Data classification schema documented",
      "✓ MAPPED: Incident response plan structure outlined",
    ],
    disclaimer: DISCLAIMER,
  },

  // ── Medicare / Medicaid Pathway ────────────────────────────────────────────
  {
    id: "medicare-medicaid",
    domain: "Government Health (US)",
    framework: "Medicare / Medicaid Pathway",
    title: "Medicare & Medicaid Structural Pathway Blueprint",
    version: "2024-blueprint-v1",
    status: "blueprint-draft",
    summary: "FICTIONAL STRUCTURAL BLUEPRINT modeling Medicare/Medicaid program pathway architecture. Not affiliated with CMS, HHS, or any government body. No real program access.",
    applicableTo: ["Healthcare platform design (blueprint)", "Claims flow modeling (fictional)", "Eligibility check structure (mock)"],
    clauses: [
      { id: "cms-1", reference: "CMS Fictional §1",  title: "Eligibility Verification Structure",
        description: "FICTIONAL: Model of how eligibility verification requests would flow in a real Medicare system.",
        mockStatus: "mapped",
        implementationNote: "Blueprint: Fictional API structure defined. No real CMS API access." },
      { id: "cms-2", reference: "CMS Fictional §2",  title: "Claims Submission Pathway",
        description: "FICTIONAL: Structural model of claims submission flow (837P/837I equivalent, fictional).",
        mockStatus: "partial",
        implementationNote: "Blueprint: Claim data model outlined. Real clearinghouse integration requires certified EDI processing." },
      { id: "cms-3", reference: "CMS Fictional §3",  title: "Remittance Advice Structure",
        description: "FICTIONAL: Model of how ERAs (835 equivalent) would be received and processed.",
        mockStatus: "gap",
        implementationNote: "Blueprint: ERA parsing structure documented. Real implementation requires certified billing software." },
    ],
    dataGovernance: [
      "Fictional beneficiary data: identified with fictional Medicare IDs only",
      "Claims data: fictional claim numbers, fictional NPI numbers",
      "No real CMS portal access, no real provider enrollment",
      "All government program references are structural/educational only",
    ],
    accessPatterns: [
      "FICTIONAL Role: Billing Staff → submit claims (mock), view remittance (mock)",
      "FICTIONAL Role: Clinical Staff → check eligibility (mock), view benefit limits (mock)",
      "FICTIONAL Role: Admin → manage NPI records (mock), view reports (mock)",
    ],
    securityFlows: [
      "FICTIONAL: CMS requires HISP-compliant Direct Messaging for clinical data exchange",
      "FICTIONAL: All Medicare system access requires CMS-approved authentication (not real)",
      "FICTIONAL: Provider enrollment via PECOS system (fictional reference only)",
    ],
    auditTrail: [
      { event: "Eligibility check (MOCK)",    actor: "Billing Staff", dataLogged: ["fictional_beneficiary_id", "timestamp", "payer_id_mock"], retention: "7 years (fictional)", mockOnly: true },
      { event: "Claim submitted (MOCK)",       actor: "Billing System", dataLogged: ["fictional_claim_id", "fictional_npi", "amount", "timestamp"], retention: "7 years (fictional)", mockOnly: true },
    ],
    consentFlows: [
      { id: "consent-cms-1", name: "Fictional Medicare Assignment Consent",
        steps: ["Present fictional assignment form", "Patient reviews fictional coverage", "Fictional signature captured", "Stored in fictional record"],
        dataCollected: ["fictional_patient_id", "fictional_medicare_id", "consent_timestamp"],
        retentionPeriod: "7 years (fictional)",
        withdrawalProcess: "Patient contacts billing department (fictional)",
        note: "COMPLETELY FICTIONAL. No real Medicare consent mechanism. No real government program." },
    ],
    complianceNotes: [
      "This blueprint is NOT affiliated with CMS, HHS, or any government body",
      "Real Medicare/Medicaid integration requires CMS certification, PECOS enrollment, and EDI clearinghouse agreements",
      "All fictional regulatory references are structural models only",
    ],
    gapAnalysis: [
      "⚠️ GAP: No real CMS API access (by design — this is a blueprint only)",
      "⚠️ GAP: No real EDI clearinghouse connection",
      "⚠️ GAP: No real NPI enrollment",
      "✓ MAPPED: Fictional claims flow structure documented",
      "✓ MAPPED: Fictional eligibility check model defined",
    ],
    disclaimer: DISCLAIMER + " This blueprint is NOT affiliated with CMS, HHS, Medicare, Medicaid, or any government program.",
  },

  // ── ADA / WCAG ─────────────────────────────────────────────────────────────
  {
    id: "ada-wcag",
    domain: "Accessibility",
    framework: "ADA / WCAG 2.2",
    title: "ADA & WCAG 2.2 Accessibility Blueprint",
    version: "2024-blueprint-v1",
    status: "blueprint-ready",
    summary: "Structural blueprint for ADA Title III digital accessibility and WCAG 2.2 Level AA conformance. Blueprint guidance only — real audit required for compliance.",
    applicableTo: ["Web app UI (blueprint)", "Mobile app (blueprint)", "All presentation layers"],
    clauses: [
      { id: "wcag-1-1", reference: "WCAG 1.1.1", title: "Non-text Content",
        description: "All non-text content has a text alternative serving the equivalent purpose.",
        mockStatus: "partial",
        implementationNote: "Blueprint: alt text patterns defined. Real implementation requires audit of all images/icons." },
      { id: "wcag-1-4-3", reference: "WCAG 1.4.3", title: "Contrast (Minimum)",
        description: "Text has a contrast ratio of at least 4.5:1 (3:1 for large text).",
        mockStatus: "mapped",
        implementationNote: "Blueprint: Color palette checked for contrast. iOS blue #007AFF on white passes at most sizes." },
      { id: "wcag-2-1-1", reference: "WCAG 2.1.1", title: "Keyboard",
        description: "All functionality is operable through a keyboard interface.",
        mockStatus: "gap",
        implementationNote: "Blueprint: Keyboard navigation spec defined. Real implementation requires tab-order audit." },
      { id: "wcag-4-1-2", reference: "WCAG 4.1.2", title: "Name, Role, Value",
        description: "UI components have names, roles, and values that can be determined programmatically.",
        mockStatus: "partial",
        implementationNote: "Blueprint: ARIA roles documented. Real implementation requires screen reader testing." },
    ],
    dataGovernance: [],
    accessPatterns: [
      "All interactive elements reachable by keyboard (tab + enter/space)",
      "Focus indicators visible and meet 3:1 contrast ratio",
      "Error messages linked to form fields via aria-describedby",
      "Skip navigation link for screen reader users",
    ],
    securityFlows: [],
    auditTrail: [
      { event: "Accessibility test run", actor: "QA Team", dataLogged: ["test_tool", "pages_tested", "violations_found", "timestamp"], retention: "2 years", mockOnly: true },
    ],
    consentFlows: [],
    complianceNotes: [
      "WCAG 2.2 Level AA is the standard for ADA digital accessibility lawsuits",
      "VPATs (Voluntary Product Accessibility Templates) recommended for enterprise customers",
      "Annual manual accessibility audit by a certified accessibility specialist recommended",
    ],
    gapAnalysis: [
      "⚠️ GAP: Full keyboard navigation not audited",
      "⚠️ GAP: Screen reader testing (NVDA/VoiceOver) not completed",
      "⚠️ GAP: Automated axe-core scan not integrated into CI",
      "✓ MAPPED: Color contrast reviewed for primary palette",
      "✓ MAPPED: ARIA role patterns documented",
    ],
    disclaimer: DISCLAIMER,
  },

  // ── FINRA / SEC ────────────────────────────────────────────────────────────
  {
    id: "finra-sec",
    domain: "Finance (US)",
    framework: "FINRA / SEC Blueprint",
    title: "FINRA & SEC Regulatory Blueprint",
    version: "2024-blueprint-v1",
    status: "blueprint-draft",
    summary: "FICTIONAL STRUCTURAL BLUEPRINT modeling FINRA/SEC compliance architecture for financial platform design. Not a real FINRA member firm. No real securities activities.",
    applicableTo: ["Finance feature design (blueprint)", "Billing/payment integrations (mock)", "Financial reporting structures"],
    clauses: [
      { id: "finra-1", reference: "FINRA Fictional §1", title: "Customer Information Protection",
        description: "FICTIONAL: Model of customer financial data protection standards.",
        mockStatus: "mapped",
        implementationNote: "Blueprint: Financial data classification and access control model defined. No real financial data processed." },
      { id: "sec-1",   reference: "SEC Fictional §1",   title: "Books and Records",
        description: "FICTIONAL: Model of transaction record retention and audit requirements.",
        mockStatus: "partial",
        implementationNote: "Blueprint: Audit trail structure outlined. Real records require SEC-registered recordkeeping system." },
    ],
    dataGovernance: [
      "All financial data references are fictional — no real account numbers, no real transactions",
      "Financial data classification: Public, Internal, Customer-Confidential, Regulated",
      "Retention: fictional transaction records retained for 7 years (fictional only)",
    ],
    accessPatterns: [
      "FICTIONAL Role: Compliance Officer → audit access, report generation (mock)",
      "FICTIONAL Role: Financial Advisor → client portfolio view (mock)",
      "FICTIONAL Role: System → automated transaction logging (mock)",
    ],
    securityFlows: [
      "FICTIONAL: Dual control requirement for large transactions (structural model)",
      "FICTIONAL: Segregation of duties between front-office and operations",
    ],
    auditTrail: [
      { event: "Financial transaction (MOCK)",  actor: "System",    dataLogged: ["fictional_txn_id", "fictional_amount", "fictional_account", "timestamp"], retention: "7 years (fictional)", mockOnly: true },
    ],
    consentFlows: [],
    complianceNotes: [
      "This blueprint is NOT affiliated with FINRA, SEC, or any financial regulator",
      "Real broker-dealer registration with FINRA and SEC required for actual securities activities",
      "All financial regulatory references are structural models only",
    ],
    gapAnalysis: [
      "⚠️ GAP: No real FINRA membership (by design — blueprint only)",
      "⚠️ GAP: No real SEC registration",
      "✓ MAPPED: Financial data classification documented",
      "✓ MAPPED: Audit trail structure defined",
    ],
    disclaimer: DISCLAIMER + " NOT affiliated with FINRA, SEC, or any financial regulatory body.",
  },
];

// ─── Engine API ───────────────────────────────────────────────────────────────
export const RegulatoryEngine = {
  getAll(): RegulatoryBlueprint[]                   { return REGULATORY_BLUEPRINTS; },
  getById(id: string): RegulatoryBlueprint | undefined { return REGULATORY_BLUEPRINTS.find(b => b.id === id); },
  getByDomain(domain: string): RegulatoryBlueprint[]  { return REGULATORY_BLUEPRINTS.filter(b => b.domain === domain); },

  getStats() {
    return {
      total:    REGULATORY_BLUEPRINTS.length,
      ready:    REGULATORY_BLUEPRINTS.filter(b => b.status === "blueprint-ready").length,
      draft:    REGULATORY_BLUEPRINTS.filter(b => b.status === "blueprint-draft").length,
      domains:  [...new Set(REGULATORY_BLUEPRINTS.map(b => b.domain))],
      frameworks: REGULATORY_BLUEPRINTS.map(b => b.framework),
    };
  },
};
