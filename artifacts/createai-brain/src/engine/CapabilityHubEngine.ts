// ─── Universal Capability Hub Engine ─────────────────────────────────────────
// Prepares ALL industry capability packets internally.
// All packets start as READY — AWAITING API KEYS.
// Simulation packets exist ONLY in memory — never stored, never mixed with real data.
// Real activation requires explicit partner approval + real API keys provided by user.

export type HubStatus = "ready-awaiting" | "simulation" | "real-active";

export interface FieldMapping {
  sourceField:   string;
  platformField: string;
  type:          "string" | "number" | "date" | "boolean" | "object" | "array";
  required:      boolean;
  transform?:    string;   // description of any data transformation needed
}

export interface MigrationStep {
  step:  number;
  label: string;
  desc:  string;
  safe:  boolean;  // true = no real data moved (preview only)
}

export interface CapabilityDef {
  id:              string;
  industryId:      string;
  systemName:      string;
  icon:            string;
  category:        string;
  description:     string;
  fieldMap:        FieldMapping[];
  migrationSteps:  MigrationStep[];
  complianceFlags: string[];
  projectTypes:    string[];
  status:          HubStatus;
}

export interface IndustryDef {
  id:             string;
  name:           string;
  icon:           string;
  color:          string;
  description:    string;
  capabilities:   CapabilityDef[];
  complianceFlags: string[];
}

// ─── Field mapping helper ──────────────────────────────────────────────────────
function field(
  sourceField: string, platformField: string,
  type: FieldMapping["type"], required: boolean, transform?: string
): FieldMapping {
  return { sourceField, platformField, type, required, transform };
}

// ─── Migration step helper ─────────────────────────────────────────────────────
function step(step: number, label: string, desc: string, safe = true): MigrationStep {
  return { step, label, desc, safe };
}

// ─── Shared safe migration steps ──────────────────────────────────────────────
const PREVIEW_STEPS = (system: string): MigrationStep[] => [
  step(1, "Discover Fields",     `Scan ${system} schema — identify all fields, types, and required values. No data moved.`),
  step(2, "Build Field Map",     `Map ${system} fields to platform fields. Auto-generate missing fields as needed.`),
  step(3, "Synthetic Preview",   `Run simulation using 100% synthetic packets. Verify mapping works correctly. Memory only.`),
  step(4, "Readiness Report",    `Generate full readiness report. Document all gaps and compliance requirements.`),
  step(5, "Await Partner Keys",  `Platform is 100% prepared. Waiting for ${system} to provide real API keys to go live.`),
];

// ─── 12 Industry Definitions ──────────────────────────────────────────────────
export const INDUSTRY_MAP: Record<string, IndustryDef> = {

  // ── Healthcare ──────────────────────────────────────────────────────────────
  healthcare: {
    id: "healthcare", name: "Healthcare", icon: "🏥", color: "#34C759",
    description: "EHR, billing, pharmacy, and clinical data systems.",
    complianceFlags: ["HIPAA", "HL7 FHIR", "HITECH", "SOC 2"],
    capabilities: [
      {
        id: "hc-ehr", industryId: "healthcare", systemName: "EHR / Patient Records",
        icon: "🩺", category: "Clinical", status: "ready-awaiting",
        description: "Patient demographics, clinical notes, diagnoses, and encounter history.",
        complianceFlags: ["HIPAA", "HL7 FHIR"],
        projectTypes: ["Healthcare App", "Web App/SaaS"],
        fieldMap: [
          field("patient_id",       "hub_patient_id",      "string",  true),
          field("date_of_birth",    "hub_dob",             "date",    true,  "ISO 8601 format"),
          field("diagnosis_code",   "hub_icd10_code",      "string",  true,  "ICD-10 validation"),
          field("provider_npi",     "hub_provider_id",     "string",  true),
          field("appointment_ts",   "hub_encounter_date",  "date",    false, "UTC normalisation"),
          field("insurance_member", "hub_insurance_id",    "string",  false),
        ],
        migrationSteps: PREVIEW_STEPS("EHR / Patient Records"),
      },
      {
        id: "hc-billing", industryId: "healthcare", systemName: "Billing / RCM",
        icon: "🧾", category: "Revenue Cycle", status: "ready-awaiting",
        description: "Claims, CPT codes, payer management, and revenue cycle workflows.",
        complianceFlags: ["HIPAA", "EDI 837/835"],
        projectTypes: ["Healthcare App", "Business/Company"],
        fieldMap: [
          field("claim_id",        "hub_claim_id",    "string", true),
          field("cpt_code",        "hub_cpt",         "string", true,  "CPT-4 validation"),
          field("billed_amount",   "hub_billed",      "number", true,  "USD cents"),
          field("payer_id",        "hub_payer_id",    "string", true),
          field("service_date",    "hub_service_date","date",   true,  "ISO 8601"),
          field("allowed_amount",  "hub_allowed",     "number", false, "USD cents"),
        ],
        migrationSteps: PREVIEW_STEPS("Billing / RCM"),
      },
      {
        id: "hc-lab", industryId: "healthcare", systemName: "Lab Results",
        icon: "🔬", category: "Clinical", status: "ready-awaiting",
        description: "Lab orders, test results, reference ranges, and critical value alerts.",
        complianceFlags: ["HIPAA", "CLIA"],
        projectTypes: ["Healthcare App"],
        fieldMap: [
          field("order_id",        "hub_order_id",    "string", true),
          field("loinc_code",      "hub_test_code",   "string", true,  "LOINC validation"),
          field("result_value",    "hub_result",      "string", true),
          field("collection_ts",   "hub_collected_at","date",   true,  "UTC normalisation"),
          field("reference_range", "hub_ref_range",   "string", false),
        ],
        migrationSteps: PREVIEW_STEPS("Lab Results"),
      },
      {
        id: "hc-pharmacy", industryId: "healthcare", systemName: "Pharmacy System",
        icon: "💊", category: "Clinical", status: "ready-awaiting",
        description: "Prescriptions, NDC codes, dispensing, and medication reconciliation.",
        complianceFlags: ["HIPAA", "DEA"],
        projectTypes: ["Healthcare App"],
        fieldMap: [
          field("rx_number",       "hub_rx_id",         "string", true),
          field("ndc_code",        "hub_ndc",           "string", true,  "NDC-11 validation"),
          field("patient_id",      "hub_patient_id",    "string", true),
          field("prescriber_npi",  "hub_prescriber_id", "string", true),
          field("dispense_date",   "hub_dispensed_at",  "date",   true,  "ISO 8601"),
          field("quantity",        "hub_qty",           "number", true),
        ],
        migrationSteps: PREVIEW_STEPS("Pharmacy System"),
      },
    ],
  },

  // ── Construction ────────────────────────────────────────────────────────────
  construction: {
    id: "construction", name: "Construction", icon: "🏗️", color: "#FF9500",
    description: "Project management, BIM, procurement, and document control.",
    complianceFlags: ["OSHA", "AIA", "ISO 9001"],
    capabilities: [
      {
        id: "con-pm", industryId: "construction", systemName: "Project Management",
        icon: "📋", category: "Operations", status: "ready-awaiting",
        description: "Project phases, budgets, milestones, and contractor assignments.",
        complianceFlags: ["AIA", "ISO 9001"],
        projectTypes: ["Web App/SaaS", "Business/Company", "Startup"],
        fieldMap: [
          field("project_id",   "hub_project_id",  "string", true),
          field("phase",        "hub_phase",       "string", true,  "Normalise to: Pre-Con/Construction/Close"),
          field("budget_usd",   "hub_budget",      "number", true,  "USD cents"),
          field("start_date",   "hub_start_date",  "date",   true,  "ISO 8601"),
          field("end_date",     "hub_end_date",    "date",   false, "ISO 8601"),
          field("contractor_id","hub_contractor",  "string", false),
        ],
        migrationSteps: PREVIEW_STEPS("Project Management"),
      },
      {
        id: "con-doc", industryId: "construction", systemName: "Document Control",
        icon: "📁", category: "Documents", status: "ready-awaiting",
        description: "Drawings, submittals, RFIs, and revision-controlled documents.",
        complianceFlags: ["AIA G702", "ISO 19650"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("doc_id",        "hub_doc_id",      "string", true),
          field("revision",      "hub_revision",    "string", true,  "Normalise to A/B/C... or 00/01/02"),
          field("drawing_no",    "hub_drawing_no",  "string", true),
          field("submit_date",   "hub_submitted_at","date",   true,  "ISO 8601"),
          field("status",        "hub_status",      "string", true,  "Map to: Draft/Submitted/Approved/Rejected"),
        ],
        migrationSteps: PREVIEW_STEPS("Document Control"),
      },
      {
        id: "con-bim", industryId: "construction", systemName: "BIM / CAD Integration",
        icon: "🏛️", category: "Design", status: "ready-awaiting",
        description: "3D model data, discipline coordination, and clash detection.",
        complianceFlags: ["IFC", "ISO 19650"],
        projectTypes: ["Web App/SaaS"],
        fieldMap: [
          field("model_id",    "hub_model_id",    "string", true),
          field("discipline",  "hub_discipline",  "string", true,  "Map to: Arch/Struct/MEP/Civil"),
          field("level",       "hub_level",       "string", false),
          field("component_id","hub_component",   "string", false),
          field("ifc_type",    "hub_ifc_type",    "string", false, "IFC 4.x classification"),
        ],
        migrationSteps: PREVIEW_STEPS("BIM / CAD"),
      },
      {
        id: "con-proc", industryId: "construction", systemName: "Procurement",
        icon: "📦", category: "Supply Chain", status: "ready-awaiting",
        description: "Purchase orders, vendors, cost codes, and delivery scheduling.",
        complianceFlags: ["SOX", "ISO 9001"],
        projectTypes: ["Business/Company", "Startup"],
        fieldMap: [
          field("po_number",    "hub_po_id",       "string", true),
          field("vendor_id",    "hub_vendor_id",   "string", true),
          field("cost_code",    "hub_cost_code",   "string", true,  "CSI MasterFormat"),
          field("delivery_date","hub_delivery_date","date",  false, "ISO 8601"),
          field("line_items",   "hub_line_items",  "array",  true,  "Normalise to [{sku, qty, unit_price}]"),
        ],
        migrationSteps: PREVIEW_STEPS("Procurement"),
      },
    ],
  },

  // ── Retail ──────────────────────────────────────────────────────────────────
  retail: {
    id: "retail", name: "Retail", icon: "🛍️", color: "#FF2D55",
    description: "POS, inventory, e-commerce, and customer analytics.",
    complianceFlags: ["PCI DSS", "GDPR", "CCPA"],
    capabilities: [
      {
        id: "ret-pos", industryId: "retail", systemName: "Point of Sale",
        icon: "🏪", category: "Sales", status: "ready-awaiting",
        description: "Transactions, SKUs, payment methods, and sales staff assignments.",
        complianceFlags: ["PCI DSS"],
        projectTypes: ["Business/Company", "Startup", "Web App/SaaS"],
        fieldMap: [
          field("txn_id",       "hub_transaction_id", "string", true),
          field("sku",          "hub_sku",            "string", true),
          field("qty",          "hub_quantity",       "number", true),
          field("unit_price",   "hub_price",          "number", true,  "USD cents"),
          field("txn_ts",       "hub_timestamp",      "date",   true,  "UTC normalisation"),
          field("payment_type", "hub_payment_method", "string", false, "Map to: CARD/CASH/MOBILE"),
        ],
        migrationSteps: PREVIEW_STEPS("Point of Sale"),
      },
      {
        id: "ret-inv", industryId: "retail", systemName: "Inventory Management",
        icon: "📊", category: "Operations", status: "ready-awaiting",
        description: "Stock levels, warehouse locations, reorder points, and supplier links.",
        complianceFlags: ["ISO 9001"],
        projectTypes: ["Business/Company", "Startup", "Web App/SaaS"],
        fieldMap: [
          field("sku",          "hub_sku",          "string", true),
          field("warehouse_id", "hub_warehouse_id", "string", true),
          field("stock_level",  "hub_stock",        "number", true),
          field("reorder_point","hub_reorder_pt",   "number", false),
          field("supplier_id",  "hub_supplier_id",  "string", false),
        ],
        migrationSteps: PREVIEW_STEPS("Inventory Management"),
      },
      {
        id: "ret-ecom", industryId: "retail", systemName: "E-Commerce Platform",
        icon: "🛒", category: "Sales", status: "ready-awaiting",
        description: "Online orders, cart data, shipping addresses, and fulfilment status.",
        complianceFlags: ["PCI DSS", "GDPR"],
        projectTypes: ["Web App/SaaS", "Startup", "Business/Company"],
        fieldMap: [
          field("order_id",      "hub_order_id",      "string", true),
          field("customer_id",   "hub_customer_id",   "string", true),
          field("line_items",    "hub_items",         "array",  true, "Normalise to [{sku, qty, price}]"),
          field("shipping_addr", "hub_shipping",      "object", true, "Normalise to address object"),
          field("status",        "hub_order_status",  "string", true, "Map to: PENDING/SHIPPED/DELIVERED/RETURNED"),
        ],
        migrationSteps: PREVIEW_STEPS("E-Commerce Platform"),
      },
      {
        id: "ret-crm", industryId: "retail", systemName: "Customer CRM",
        icon: "👥", category: "Customers", status: "ready-awaiting",
        description: "Customer profiles, purchase history, loyalty points, and segments.",
        complianceFlags: ["GDPR", "CCPA"],
        projectTypes: ["Business/Company", "Startup", "Web App/SaaS"],
        fieldMap: [
          field("customer_id",     "hub_customer_id",    "string", true),
          field("email",           "hub_email",          "string", true,  "Lowercase + trim"),
          field("purchase_history","hub_purchases",      "array",  false, "Normalise to [{order_id, date, amount}]"),
          field("loyalty_pts",     "hub_loyalty",        "number", false),
          field("segment",         "hub_segment",        "string", false, "Map to: VIP/Regular/New/Churned"),
        ],
        migrationSteps: PREVIEW_STEPS("Customer CRM"),
      },
    ],
  },

  // ── Finance / Banking ────────────────────────────────────────────────────────
  finance: {
    id: "finance", name: "Finance / Banking", icon: "🏦", color: "#007AFF",
    description: "Core banking, payments, compliance, and financial analytics.",
    complianceFlags: ["PCI DSS", "SOX", "AML", "KYC", "GDPR"],
    capabilities: [
      {
        id: "fin-core", industryId: "finance", systemName: "Core Banking",
        icon: "💰", category: "Accounts", status: "ready-awaiting",
        description: "Account balances, transactions, routing, and account lifecycle.",
        complianceFlags: ["SOX", "AML"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("account_id",   "hub_account_id",  "string", true),
          field("balance_cents","hub_balance",      "number", true,  "USD cents, never float"),
          field("routing_no",   "hub_routing",     "string", true),
          field("txn_id",       "hub_txn_id",      "string", true),
          field("txn_ts",       "hub_txn_date",    "date",   true,  "UTC normalisation"),
        ],
        migrationSteps: PREVIEW_STEPS("Core Banking"),
      },
      {
        id: "fin-pay", industryId: "finance", systemName: "Payment Processing",
        icon: "💳", category: "Payments", status: "ready-awaiting",
        description: "Card transactions, merchant settlement, and payment gateway events.",
        complianceFlags: ["PCI DSS"],
        projectTypes: ["Web App/SaaS", "Startup", "Business/Company"],
        fieldMap: [
          field("payment_id",   "hub_payment_id",  "string", true),
          field("amount_cents", "hub_amount",      "number", true, "USD cents"),
          field("merchant_id",  "hub_merchant_id", "string", true),
          field("card_last4",   "hub_card_last4",  "string", false,"Never store full PAN"),
          field("status",       "hub_pay_status",  "string", true, "Map to: PENDING/CAPTURED/FAILED/REFUNDED"),
        ],
        migrationSteps: PREVIEW_STEPS("Payment Processing"),
      },
      {
        id: "fin-kyc", industryId: "finance", systemName: "Compliance / KYC",
        icon: "🛡️", category: "Compliance", status: "ready-awaiting",
        description: "Customer due diligence, identity verification, and risk scoring.",
        complianceFlags: ["AML", "KYC", "GDPR"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("customer_id",  "hub_customer_id", "string", true),
          field("kyc_status",   "hub_kyc_status",  "string", true, "Map to: PENDING/VERIFIED/REJECTED"),
          field("doc_type",     "hub_doc_type",    "string", true, "Map to: PASSPORT/DL/NATIONAL_ID"),
          field("verified_at",  "hub_verified_at", "date",   false,"ISO 8601"),
          field("risk_score",   "hub_risk_score",  "number", false,"0–100 scale"),
        ],
        migrationSteps: PREVIEW_STEPS("Compliance / KYC"),
      },
      {
        id: "fin-analytics", industryId: "finance", systemName: "Financial Analytics",
        icon: "📈", category: "Reporting", status: "ready-awaiting",
        description: "Revenue, expense, margin, and cash flow reporting pipelines.",
        complianceFlags: ["SOX", "GAAP"],
        projectTypes: ["Business/Company", "Startup"],
        fieldMap: [
          field("report_id",   "hub_report_id",   "string", true),
          field("period",      "hub_period",      "string", true, "ISO 8601 period (YYYY-MM)"),
          field("revenue",     "hub_revenue",     "number", true, "USD cents"),
          field("expenses",    "hub_expenses",    "number", true, "USD cents"),
          field("margin_pct",  "hub_margin",      "number", false,"Decimal 0.0–1.0"),
        ],
        migrationSteps: PREVIEW_STEPS("Financial Analytics"),
      },
    ],
  },

  // ── Legal ──────────────────────────────────────────────────────────────────
  legal: {
    id: "legal", name: "Legal", icon: "⚖️", color: "#5856D6",
    description: "Case management, documents, time tracking, and court scheduling.",
    complianceFlags: ["ABA", "GDPR", "SOC 2"],
    capabilities: [
      {
        id: "leg-case", industryId: "legal", systemName: "Case Management",
        icon: "📂", category: "Cases", status: "ready-awaiting",
        description: "Case files, matter types, client links, and litigation timelines.",
        complianceFlags: ["ABA", "GDPR"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("case_id",      "hub_case_id",    "string", true),
          field("case_type",    "hub_case_type",  "string", true, "Map to: Litigation/Transactional/Regulatory/Advisory"),
          field("client_id",    "hub_client_id",  "string", true),
          field("filed_date",   "hub_filed_date", "date",   true, "ISO 8601"),
          field("status",       "hub_status",     "string", true, "Map to: OPEN/PENDING/CLOSED"),
        ],
        migrationSteps: PREVIEW_STEPS("Case Management"),
      },
      {
        id: "leg-doc", industryId: "legal", systemName: "Legal Documents",
        icon: "📜", category: "Documents", status: "ready-awaiting",
        description: "Contracts, NDAs, executed documents, and version history.",
        complianceFlags: ["eSign", "GDPR"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("doc_id",      "hub_doc_id",      "string", true),
          field("doc_type",    "hub_doc_type",    "string", true, "Map to: CONTRACT/NDA/BRIEF/ORDER"),
          field("client_id",   "hub_client_id",   "string", true),
          field("executed_at", "hub_executed_at", "date",   false,"ISO 8601"),
          field("version",     "hub_version",     "string", false),
        ],
        migrationSteps: PREVIEW_STEPS("Legal Documents"),
      },
      {
        id: "leg-billing", industryId: "legal", systemName: "Time & Billing",
        icon: "⏱️", category: "Billing", status: "ready-awaiting",
        description: "Billable hours, attorney rates, matter invoicing, and trust accounting.",
        complianceFlags: ["ABA", "IOLTA"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("matter_id",  "hub_matter_id",   "string", true),
          field("hours",      "hub_hours",       "number", true, "Decimal hours"),
          field("rate_usd",   "hub_rate",        "number", true, "USD cents / hour"),
          field("invoice_date","hub_invoice_date","date",  true, "ISO 8601"),
          field("status",     "hub_status",      "string", true, "Map to: DRAFT/SENT/PAID/OVERDUE"),
        ],
        migrationSteps: PREVIEW_STEPS("Time & Billing"),
      },
      {
        id: "leg-court", industryId: "legal", systemName: "Court Calendar",
        icon: "🗓️", category: "Scheduling", status: "ready-awaiting",
        description: "Hearing dates, courtroom assignments, judge calendars, and deadline tracking.",
        complianceFlags: ["ABA"],
        projectTypes: ["Web App/SaaS"],
        fieldMap: [
          field("hearing_id",  "hub_hearing_id",  "string", true),
          field("case_id",     "hub_case_id",     "string", true),
          field("courtroom",   "hub_courtroom",   "string", false),
          field("sched_date",  "hub_sched_date",  "date",   true, "ISO 8601"),
          field("judge",       "hub_judge_name",  "string", false),
        ],
        migrationSteps: PREVIEW_STEPS("Court Calendar"),
      },
    ],
  },

  // ── Real Estate ─────────────────────────────────────────────────────────────
  realEstate: {
    id: "realEstate", name: "Real Estate", icon: "🏘️", color: "#34AADC",
    description: "Property management, MLS, leasing, and maintenance workflows.",
    complianceFlags: ["Fair Housing Act", "GDPR", "SOC 2"],
    capabilities: [
      {
        id: "re-prop", industryId: "realEstate", systemName: "Property Management",
        icon: "🏠", category: "Properties", status: "ready-awaiting",
        description: "Property records, unit details, occupancy, and rent tracking.",
        complianceFlags: ["Fair Housing Act"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("property_id", "hub_property_id", "string", true),
          field("address",     "hub_address",     "object", true, "Normalise to {street, city, state, zip}"),
          field("sqft",        "hub_sqft",        "number", false),
          field("bedrooms",    "hub_bedrooms",    "number", false),
          field("rent_cents",  "hub_rent",        "number", true, "USD cents / month"),
        ],
        migrationSteps: PREVIEW_STEPS("Property Management"),
      },
      {
        id: "re-mls", industryId: "realEstate", systemName: "MLS Integration",
        icon: "🔍", category: "Listings", status: "ready-awaiting",
        description: "Active listings, sold data, price history, and agent assignments.",
        complianceFlags: ["NAR MLS Policy"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("mls_id",      "hub_mls_id",      "string", true),
          field("list_date",   "hub_listed_at",   "date",   true, "ISO 8601"),
          field("ask_price",   "hub_ask_price",   "number", true, "USD cents"),
          field("status",      "hub_status",      "string", true, "Map to: ACTIVE/PENDING/SOLD/EXPIRED"),
          field("agent_id",    "hub_agent_id",    "string", false),
        ],
        migrationSteps: PREVIEW_STEPS("MLS Integration"),
      },
      {
        id: "re-lease", industryId: "realEstate", systemName: "Lease Management",
        icon: "📝", category: "Leasing", status: "ready-awaiting",
        description: "Lease terms, tenant records, renewals, and expiry alerts.",
        complianceFlags: ["Fair Housing Act", "GDPR"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("lease_id",    "hub_lease_id",    "string", true),
          field("tenant_id",   "hub_tenant_id",   "string", true),
          field("start_date",  "hub_start_date",  "date",   true, "ISO 8601"),
          field("end_date",    "hub_end_date",    "date",   true, "ISO 8601"),
          field("monthly_rent","hub_monthly_rent","number", true, "USD cents"),
        ],
        migrationSteps: PREVIEW_STEPS("Lease Management"),
      },
      {
        id: "re-maint", industryId: "realEstate", systemName: "Maintenance",
        icon: "🔧", category: "Operations", status: "ready-awaiting",
        description: "Work orders, priority queues, technician assignments, and cost tracking.",
        complianceFlags: ["ISO 41001"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("wo_id",       "hub_wo_id",       "string", true),
          field("property_id", "hub_property_id", "string", true),
          field("priority",    "hub_priority",    "string", true, "Map to: EMERGENCY/HIGH/MEDIUM/LOW"),
          field("sched_date",  "hub_sched_date",  "date",   false,"ISO 8601"),
          field("cost_cents",  "hub_cost",        "number", false,"USD cents"),
        ],
        migrationSteps: PREVIEW_STEPS("Maintenance"),
      },
    ],
  },

  // ── Manufacturing ────────────────────────────────────────────────────────────
  manufacturing: {
    id: "manufacturing", name: "Manufacturing", icon: "🏭", color: "#FF6B35",
    description: "ERP, quality control, supply chain, and predictive maintenance.",
    complianceFlags: ["ISO 9001", "ISO 14001", "OSHA", "FDA 21 CFR"],
    capabilities: [
      {
        id: "mfg-erp", industryId: "manufacturing", systemName: "ERP System",
        icon: "🔄", category: "Production", status: "ready-awaiting",
        description: "Production orders, batch records, material costs, and completion tracking.",
        complianceFlags: ["ISO 9001", "FDA 21 CFR"],
        projectTypes: ["Business/Company", "Web App/SaaS"],
        fieldMap: [
          field("batch_id",    "hub_batch_id",    "string", true),
          field("prod_order",  "hub_prod_order",  "string", true),
          field("quantity",    "hub_qty",         "number", true),
          field("mat_cost",    "hub_mat_cost",    "number", true, "USD cents"),
          field("completed_at","hub_completed_at","date",   false,"ISO 8601"),
        ],
        migrationSteps: PREVIEW_STEPS("ERP System"),
      },
      {
        id: "mfg-qc", industryId: "manufacturing", systemName: "Quality Control",
        icon: "✅", category: "Quality", status: "ready-awaiting",
        description: "Inspection records, defect codes, sampling plans, and corrective actions.",
        complianceFlags: ["ISO 9001"],
        projectTypes: ["Business/Company"],
        fieldMap: [
          field("inspection_id","hub_inspection_id","string",true),
          field("product_id",  "hub_product_id",  "string", true),
          field("defect_code", "hub_defect_code", "string", false,"Map to standard defect taxonomy"),
          field("inspector_id","hub_inspector",   "string", true),
          field("passed",      "hub_passed",      "boolean",true),
        ],
        migrationSteps: PREVIEW_STEPS("Quality Control"),
      },
      {
        id: "mfg-sc", industryId: "manufacturing", systemName: "Supply Chain",
        icon: "📦", category: "Supply Chain", status: "ready-awaiting",
        description: "Supplier records, part numbers, lead times, and cost tracking.",
        complianceFlags: ["ISO 28000", "SOX"],
        projectTypes: ["Business/Company", "Startup"],
        fieldMap: [
          field("supplier_id", "hub_supplier_id", "string", true),
          field("part_no",     "hub_part_no",     "string", true),
          field("lead_time",   "hub_lead_time",   "number", false,"Days"),
          field("unit_cost",   "hub_unit_cost",   "number", true, "USD cents"),
          field("reorder_qty", "hub_reorder_qty", "number", false),
        ],
        migrationSteps: PREVIEW_STEPS("Supply Chain"),
      },
      {
        id: "mfg-cmms", industryId: "manufacturing", systemName: "Asset Maintenance",
        icon: "⚙️", category: "Maintenance", status: "ready-awaiting",
        description: "Machine assets, scheduled maintenance, technician logs, and downtime.",
        complianceFlags: ["ISO 55000", "OSHA"],
        projectTypes: ["Business/Company"],
        fieldMap: [
          field("asset_id",    "hub_asset_id",    "string", true),
          field("maint_type",  "hub_maint_type",  "string", true, "Map to: PREVENTIVE/CORRECTIVE/PREDICTIVE"),
          field("sched_date",  "hub_sched_date",  "date",   true, "ISO 8601"),
          field("tech_id",     "hub_tech_id",     "string", false),
          field("cost_cents",  "hub_cost",        "number", false,"USD cents"),
        ],
        migrationSteps: PREVIEW_STEPS("Asset Maintenance"),
      },
    ],
  },

  // ── Education ────────────────────────────────────────────────────────────────
  education: {
    id: "education", name: "Education", icon: "🎓", color: "#30B0C7",
    description: "Student records, LMS, financial aid, and campus systems.",
    complianceFlags: ["FERPA", "COPPA", "GDPR"],
    capabilities: [
      {
        id: "edu-sis", industryId: "education", systemName: "Student Information System",
        icon: "🎒", category: "Students", status: "ready-awaiting",
        description: "Student demographics, GPA, enrollment status, and academic history.",
        complianceFlags: ["FERPA", "COPPA"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("student_id",  "hub_student_id",  "string", true),
          field("grade",       "hub_grade",       "string", true),
          field("gpa",         "hub_gpa",         "number", false,"Decimal 0.0–4.0"),
          field("enroll_date", "hub_enrolled_at", "date",   true, "ISO 8601"),
          field("status",      "hub_status",      "string", true, "Map to: ACTIVE/WITHDRAWN/GRADUATED"),
        ],
        migrationSteps: PREVIEW_STEPS("Student Information System"),
      },
      {
        id: "edu-lms", industryId: "education", systemName: "Learning Management System",
        icon: "📚", category: "Learning", status: "ready-awaiting",
        description: "Courses, module progress, assessments, and completion certificates.",
        complianceFlags: ["FERPA", "SCORM", "xAPI"],
        projectTypes: ["Web App/SaaS", "Online Course", "Startup"],
        fieldMap: [
          field("course_id",   "hub_course_id",   "string", true),
          field("student_id",  "hub_student_id",  "string", true),
          field("progress_pct","hub_progress",    "number", true, "0–100"),
          field("grade",       "hub_grade",       "string", false,"Map to: A/B/C/D/F or numeric"),
          field("completed_at","hub_completed_at","date",   false,"ISO 8601"),
        ],
        migrationSteps: PREVIEW_STEPS("Learning Management System"),
      },
      {
        id: "edu-aid", industryId: "education", systemName: "Financial Aid",
        icon: "💸", category: "Finance", status: "ready-awaiting",
        description: "Aid packages, disbursements, satisfactory academic progress tracking.",
        complianceFlags: ["FERPA", "Title IV"],
        projectTypes: ["Web App/SaaS"],
        fieldMap: [
          field("student_id",  "hub_student_id",  "string", true),
          field("aid_type",    "hub_aid_type",    "string", true, "Map to: GRANT/LOAN/SCHOLARSHIP/WORKSTUDY"),
          field("amount",      "hub_amount",      "number", true, "USD cents"),
          field("disburse_date","hub_disbursed_at","date",  true, "ISO 8601"),
          field("status",      "hub_status",      "string", true, "Map to: PENDING/DISBURSED/RETURNED"),
        ],
        migrationSteps: PREVIEW_STEPS("Financial Aid"),
      },
      {
        id: "edu-library", industryId: "education", systemName: "Library System",
        icon: "📖", category: "Resources", status: "ready-awaiting",
        description: "Catalogue, checkouts, holds, renewals, and overdue fines.",
        complianceFlags: ["ALA", "GDPR"],
        projectTypes: ["Web App/SaaS"],
        fieldMap: [
          field("patron_id",   "hub_patron_id",   "string", true),
          field("isbn",        "hub_isbn",        "string", true, "ISBN-13 normalisation"),
          field("checkout_date","hub_checked_out", "date",  true, "ISO 8601"),
          field("due_date",    "hub_due_date",    "date",   true, "ISO 8601"),
          field("fines_cents", "hub_fines",       "number", false,"USD cents"),
        ],
        migrationSteps: PREVIEW_STEPS("Library System"),
      },
    ],
  },

  // ── Hospitality ──────────────────────────────────────────────────────────────
  hospitality: {
    id: "hospitality", name: "Hospitality", icon: "🏨", color: "#FFCC00",
    description: "Property management, restaurant POS, spa, and revenue management.",
    complianceFlags: ["PCI DSS", "GDPR", "ADA"],
    capabilities: [
      {
        id: "hosp-pms", industryId: "hospitality", systemName: "Property Management",
        icon: "🛏️", category: "Reservations", status: "ready-awaiting",
        description: "Reservations, room assignments, check-in/out, and guest profiles.",
        complianceFlags: ["PCI DSS", "GDPR"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("reservation_id","hub_reservation_id","string",true),
          field("guest_id",    "hub_guest_id",    "string", true),
          field("check_in",    "hub_check_in",    "date",   true, "ISO 8601"),
          field("check_out",   "hub_check_out",   "date",   true, "ISO 8601"),
          field("room_type",   "hub_room_type",   "string", true, "Normalise to: STANDARD/DELUXE/SUITE"),
        ],
        migrationSteps: PREVIEW_STEPS("Property Management"),
      },
      {
        id: "hosp-pos", industryId: "hospitality", systemName: "Restaurant POS",
        icon: "🍽️", category: "F&B", status: "ready-awaiting",
        description: "Table orders, server assignments, menu items, and settlement.",
        complianceFlags: ["PCI DSS"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("table_id",    "hub_table_id",    "string", true),
          field("server_id",   "hub_server_id",   "string", false),
          field("items",       "hub_items",       "array",  true, "Normalise to [{menu_item_id, qty, price}]"),
          field("total_cents", "hub_total",       "number", true, "USD cents"),
          field("pay_method",  "hub_pay_method",  "string", true, "Map to: CARD/CASH/ROOM_CHARGE"),
        ],
        migrationSteps: PREVIEW_STEPS("Restaurant POS"),
      },
      {
        id: "hosp-spa", industryId: "hospitality", systemName: "Spa & Activities",
        icon: "🧖", category: "Services", status: "ready-awaiting",
        description: "Service bookings, treatment schedules, therapist assignments.",
        complianceFlags: ["GDPR"],
        projectTypes: ["Web App/SaaS"],
        fieldMap: [
          field("booking_id",  "hub_booking_id",  "string", true),
          field("guest_id",    "hub_guest_id",    "string", true),
          field("service_id",  "hub_service_id",  "string", true),
          field("sched_date",  "hub_sched_date",  "date",   true, "ISO 8601"),
          field("duration_min","hub_duration",    "number", false,"Minutes"),
        ],
        migrationSteps: PREVIEW_STEPS("Spa & Activities"),
      },
      {
        id: "hosp-rev", industryId: "hospitality", systemName: "Revenue Management",
        icon: "📊", category: "Analytics", status: "ready-awaiting",
        description: "Room rates, occupancy, RevPAR, and demand forecasting.",
        complianceFlags: ["SOX"],
        projectTypes: ["Business/Company"],
        fieldMap: [
          field("room_id",     "hub_room_id",     "string", true),
          field("date",        "hub_date",        "date",   true, "ISO 8601"),
          field("rate_cents",  "hub_rate",        "number", true, "USD cents / night"),
          field("occupancy",   "hub_occupancy",   "number", true, "0.0–1.0"),
          field("revpar",      "hub_revpar",      "number", false,"USD cents"),
        ],
        migrationSteps: PREVIEW_STEPS("Revenue Management"),
      },
    ],
  },

  // ── Logistics / Supply Chain ─────────────────────────────────────────────────
  logistics: {
    id: "logistics", name: "Logistics", icon: "🚚", color: "#8E8E93",
    description: "Transportation, warehouse, fleet, and last-mile delivery systems.",
    complianceFlags: ["DOT", "IATA", "ISO 28000"],
    capabilities: [
      {
        id: "log-tms", industryId: "logistics", systemName: "Transport Management",
        icon: "🛣️", category: "Transport", status: "ready-awaiting",
        description: "Shipment routing, carrier selection, ETA tracking, and freight costs.",
        complianceFlags: ["DOT", "IATA"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("shipment_id",  "hub_shipment_id",  "string", true),
          field("origin",       "hub_origin",       "object", true, "Address object"),
          field("destination",  "hub_destination",  "object", true, "Address object"),
          field("carrier_id",   "hub_carrier_id",   "string", true),
          field("eta",          "hub_eta",          "date",   false,"ISO 8601"),
        ],
        migrationSteps: PREVIEW_STEPS("Transport Management"),
      },
      {
        id: "log-wms", industryId: "logistics", systemName: "Warehouse Management",
        icon: "🏭", category: "Warehouse", status: "ready-awaiting",
        description: "Bin locations, SKU inventory, inbound/outbound flows, and cycle counts.",
        complianceFlags: ["ISO 9001"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("location_id", "hub_location_id", "string", true),
          field("sku",         "hub_sku",         "string", true),
          field("qty",         "hub_qty",         "number", true),
          field("last_moved",  "hub_last_moved",  "date",   false,"ISO 8601"),
          field("zone",        "hub_zone",        "string", false),
        ],
        migrationSteps: PREVIEW_STEPS("Warehouse Management"),
      },
      {
        id: "log-fleet", industryId: "logistics", systemName: "Fleet Management",
        icon: "🚛", category: "Fleet", status: "ready-awaiting",
        description: "Vehicle tracking, driver assignments, fuel logs, and maintenance schedules.",
        complianceFlags: ["DOT", "ELD Mandate"],
        projectTypes: ["Business/Company"],
        fieldMap: [
          field("vehicle_id",  "hub_vehicle_id",  "string", true),
          field("driver_id",   "hub_driver_id",   "string", false),
          field("route_id",    "hub_route_id",    "string", false),
          field("fuel_litres", "hub_fuel",        "number", false),
          field("odometer_km", "hub_odometer",    "number", false),
        ],
        migrationSteps: PREVIEW_STEPS("Fleet Management"),
      },
      {
        id: "log-lastmile", industryId: "logistics", systemName: "Last Mile Delivery",
        icon: "📬", category: "Delivery", status: "ready-awaiting",
        description: "Package tracking, proof of delivery, route optimisation, and exceptions.",
        complianceFlags: ["GDPR", "DOT"],
        projectTypes: ["Web App/SaaS", "Startup"],
        fieldMap: [
          field("package_id",  "hub_package_id",  "string", true),
          field("tracking_no", "hub_tracking_no", "string", true),
          field("address",     "hub_address",     "object", true, "Address object"),
          field("status",      "hub_status",      "string", true, "Map to: IN_TRANSIT/OUT_FOR_DELIVERY/DELIVERED/FAILED"),
          field("ts",          "hub_updated_at",  "date",   true, "UTC normalisation"),
        ],
        migrationSteps: PREVIEW_STEPS("Last Mile Delivery"),
      },
    ],
  },

  // ── Technology / SaaS ────────────────────────────────────────────────────────
  technology: {
    id: "technology", name: "Technology / SaaS", icon: "💻", color: "#4f46e5",
    description: "Auth, analytics, billing, monitoring, and developer tooling.",
    complianceFlags: ["SOC 2", "GDPR", "CCPA", "ISO 27001"],
    capabilities: [
      {
        id: "tech-auth", industryId: "technology", systemName: "Auth / SSO",
        icon: "🔐", category: "Identity", status: "ready-awaiting",
        description: "User identity, roles, OIDC/SAML providers, and session management.",
        complianceFlags: ["SOC 2", "GDPR"],
        projectTypes: ["Web App/SaaS", "Mobile App", "Startup"],
        fieldMap: [
          field("user_id",     "hub_user_id",     "string", true),
          field("email",       "hub_email",       "string", true, "Lowercase + trim"),
          field("roles",       "hub_roles",       "array",  true, "Normalise to string[]"),
          field("last_login",  "hub_last_login",  "date",   false,"ISO 8601"),
          field("sso_provider","hub_sso",         "string", false,"Map to: GOOGLE/MICROSOFT/OKTA/NONE"),
        ],
        migrationSteps: PREVIEW_STEPS("Auth / SSO"),
      },
      {
        id: "tech-analytics", industryId: "technology", systemName: "Product Analytics",
        icon: "📊", category: "Analytics", status: "ready-awaiting",
        description: "Event tracking, user journeys, funnels, and retention cohorts.",
        complianceFlags: ["GDPR", "CCPA"],
        projectTypes: ["Web App/SaaS", "Mobile App", "Startup"],
        fieldMap: [
          field("event_id",    "hub_event_id",    "string", true),
          field("user_id",     "hub_user_id",     "string", true),
          field("event_type",  "hub_event_type",  "string", true),
          field("ts",          "hub_timestamp",   "date",   true, "UTC epoch ms → ISO 8601"),
          field("properties",  "hub_properties",  "object", false,"Flatten to key-value pairs"),
        ],
        migrationSteps: PREVIEW_STEPS("Product Analytics"),
      },
      {
        id: "tech-billing", industryId: "technology", systemName: "Subscription Billing",
        icon: "💳", category: "Billing", status: "ready-awaiting",
        description: "Customers, plans, subscription lifecycle, and invoice management.",
        complianceFlags: ["PCI DSS", "SOX"],
        projectTypes: ["Web App/SaaS", "Startup", "Business/Company"],
        fieldMap: [
          field("customer_id",  "hub_customer_id",  "string", true),
          field("sub_id",       "hub_sub_id",       "string", true),
          field("plan",         "hub_plan",         "string", true, "Map to: FREE/STARTER/PRO/ENTERPRISE"),
          field("amount_cents", "hub_amount",       "number", true, "USD cents"),
          field("next_billing", "hub_next_billing", "date",   false,"ISO 8601"),
        ],
        migrationSteps: PREVIEW_STEPS("Subscription Billing"),
      },
      {
        id: "tech-monitor", industryId: "technology", systemName: "Monitoring",
        icon: "🟢", category: "DevOps", status: "ready-awaiting",
        description: "Service uptime, error rates, latency percentiles, and alert thresholds.",
        complianceFlags: ["SOC 2", "ISO 27001"],
        projectTypes: ["Web App/SaaS", "Startup"],
        fieldMap: [
          field("service_id",  "hub_service_id",  "string", true),
          field("uptime_pct",  "hub_uptime",      "number", true, "0.0–1.0"),
          field("latency_p99", "hub_latency_p99", "number", false,"Milliseconds"),
          field("error_rate",  "hub_error_rate",  "number", false,"0.0–1.0"),
          field("alert_level", "hub_alert_level", "string", true, "Map to: OK/WARN/CRITICAL"),
        ],
        migrationSteps: PREVIEW_STEPS("Monitoring"),
      },
    ],
  },

  // ── Non-Profit ────────────────────────────────────────────────────────────────
  nonprofit: {
    id: "nonprofit", name: "Non-Profit", icon: "💛", color: "#FF9500",
    description: "Donor management, volunteers, grants, and programme tracking.",
    complianceFlags: ["IRS 990", "GDPR", "CCPA"],
    capabilities: [
      {
        id: "np-donor", industryId: "nonprofit", systemName: "Donor Management",
        icon: "❤️", category: "Fundraising", status: "ready-awaiting",
        description: "Donor profiles, gift history, campaign attribution, and recognition levels.",
        complianceFlags: ["IRS 990", "GDPR"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("donor_id",    "hub_donor_id",    "string", true),
          field("amount_cents","hub_amount",       "number", true, "USD cents"),
          field("campaign_id", "hub_campaign_id", "string", false),
          field("gift_date",   "hub_gift_date",   "date",   true, "ISO 8601"),
          field("recognition", "hub_recognition", "string", false,"Map to: ANONYMOUS/STANDARD/NAMED/MAJOR"),
        ],
        migrationSteps: PREVIEW_STEPS("Donor Management"),
      },
      {
        id: "np-volunteer", industryId: "nonprofit", systemName: "Volunteer Management",
        icon: "🤝", category: "People", status: "ready-awaiting",
        description: "Volunteer profiles, skill sets, shift scheduling, and logged hours.",
        complianceFlags: ["GDPR"],
        projectTypes: ["Web App/SaaS"],
        fieldMap: [
          field("volunteer_id","hub_volunteer_id","string", true),
          field("skills",      "hub_skills",     "array",  false,"Normalise to string[]"),
          field("availability","hub_availability","object", false,"Normalise to {days: string[]}"),
          field("total_hours", "hub_total_hours", "number", false,"Decimal hours"),
          field("status",      "hub_status",      "string", true, "Map to: ACTIVE/INACTIVE/PENDING"),
        ],
        migrationSteps: PREVIEW_STEPS("Volunteer Management"),
      },
      {
        id: "np-grant", industryId: "nonprofit", systemName: "Grant Management",
        icon: "📋", category: "Funding", status: "ready-awaiting",
        description: "Grant applications, funder relationships, budgets, and reporting deadlines.",
        complianceFlags: ["IRS 990", "OMB A-133"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("grant_id",    "hub_grant_id",    "string", true),
          field("funder",      "hub_funder_name", "string", true),
          field("amount_cents","hub_amount",       "number", true, "USD cents"),
          field("apply_date",  "hub_applied_at",  "date",   true, "ISO 8601"),
          field("status",      "hub_status",      "string", true, "Map to: DRAFT/SUBMITTED/AWARDED/DECLINED"),
        ],
        migrationSteps: PREVIEW_STEPS("Grant Management"),
      },
      {
        id: "np-program", industryId: "nonprofit", systemName: "Programme Tracking",
        icon: "🎯", category: "Impact", status: "ready-awaiting",
        description: "Programme enrolments, outcomes, budgets, and impact reporting.",
        complianceFlags: ["IRS 990"],
        projectTypes: ["Web App/SaaS", "Business/Company"],
        fieldMap: [
          field("program_id",  "hub_program_id",  "string", true),
          field("participants","hub_participants", "number", true),
          field("outcomes",    "hub_outcomes",    "array",  false,"Normalise to string[]"),
          field("budget_cents","hub_budget",       "number", false,"USD cents"),
          field("report_date", "hub_report_date", "date",   false,"ISO 8601"),
        ],
        migrationSteps: PREVIEW_STEPS("Programme Tracking"),
      },
    ],
  },
};

// ─── Helper: get all industries as array ──────────────────────────────────────
export function getIndustries(): IndustryDef[] {
  return Object.values(INDUSTRY_MAP);
}

// ─── Helper: get all capabilities for an industry ─────────────────────────────
export function getIndustryCapabilities(industryId: string): CapabilityDef[] {
  return INDUSTRY_MAP[industryId]?.capabilities ?? [];
}

// ─── Helper: get capabilities that match a project type ───────────────────────
export function getCapabilitiesForProjectType(projectType: string): CapabilityDef[] {
  return getIndustries()
    .flatMap(i => i.capabilities)
    .filter(c => c.projectTypes.some(
      pt => pt.toLowerCase() === projectType.toLowerCase()
    ));
}

// ─── Helper: build simulated (memory-only) copies of an industry's packets ───
// NEVER store these — caller must discard them after use
export function simulateIndustryPackets(industryId: string): CapabilityDef[] {
  const ts = new Date().toISOString();
  return getIndustryCapabilities(industryId).map(c => ({
    ...c,
    status:      "simulation" as HubStatus,
    simulatedAt: ts,
  }));
}

// ─── Helper: get compliance summary for an industry ──────────────────────────
export function getComplianceSummary(industryId: string): string[] {
  const ind = INDUSTRY_MAP[industryId];
  if (!ind) return [];
  const all = new Set([
    ...ind.complianceFlags,
    ...ind.capabilities.flatMap(c => c.complianceFlags),
  ]);
  return Array.from(all).sort();
}

// ─── PROJECT TYPE → INDUSTRY MAP (for pulling capabilities into projects) ─────
export const PROJECT_INDUSTRY_MAP: Record<string, string[]> = {
  "Healthcare App":       ["healthcare"],
  "Web App/SaaS":         ["technology", "finance"],
  "Mobile App":           ["technology"],
  "Business/Company":     ["finance", "retail", "manufacturing"],
  "Startup":              ["technology", "finance", "retail"],
  "Film/Movie":           ["technology"],
  "Documentary":          ["technology"],
  "Video Game":           ["technology"],
  "Book/Novel":           ["technology"],
  "Music/Album":          ["technology"],
  "Podcast":              ["technology"],
  "Online Course":        ["education", "technology"],
  "Physical Product":     ["manufacturing", "logistics", "retail"],
  "Real Estate App":      ["realEstate"],
  "Legal App":            ["legal"],
  "Non-Profit App":       ["nonprofit"],
  "Construction App":     ["construction"],
  "Logistics App":        ["logistics"],
  "Hospitality App":      ["hospitality"],
  "Education App":        ["education"],
};

// ─── Helper: get recommended industries for a project type ────────────────────
export function getIndustriesForProject(projectType: string): IndustryDef[] {
  const ids = PROJECT_INDUSTRY_MAP[projectType] ?? ["technology"];
  return ids.map(id => INDUSTRY_MAP[id]).filter(Boolean);
}
