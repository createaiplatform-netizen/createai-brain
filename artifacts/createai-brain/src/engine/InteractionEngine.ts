// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL INTERACTION ENGINE
// All actions are INTERNAL ONLY — no real APIs, no real data, no real submissions.
// ═══════════════════════════════════════════════════════════════════════════

export const STORAGE_KEY = "createai_interaction_v1";

// ─── Mock Data Lists ──────────────────────────────────────────────────────

export const MOCK_ROLES = [
  { id: "admin",          label: "System Admin",         icon: "⚙️",  level: "system" },
  { id: "care-coord",     label: "Care Coordinator",     icon: "🩺",  level: "clinical" },
  { id: "provider",       label: "Provider",             icon: "👨‍⚕️", level: "clinical" },
  { id: "payer",          label: "Payer Representative", icon: "💳",  level: "financial" },
  { id: "state-agency",   label: "State Agency Officer", icon: "🏛️",  level: "government" },
  { id: "vendor",         label: "Vendor Manager",       icon: "🔧",  level: "operations" },
  { id: "viewer",         label: "Read-Only Viewer",     icon: "👁️",  level: "access" },
  { id: "family",         label: "Family Member",        icon: "🏡",  level: "access" },
  { id: "ops-manager",    label: "Operations Manager",   icon: "📊",  level: "operations" },
  { id: "clinical-lead",  label: "Clinical Lead",        icon: "🔬",  level: "clinical" },
  { id: "compliance",     label: "Compliance Officer",   icon: "📋",  level: "compliance" },
  { id: "data-analyst",   label: "Data Analyst",         icon: "📈",  level: "analytics" },
  { id: "billing",        label: "Billing Specialist",   icon: "💵",  level: "financial" },
  { id: "it-lead",        label: "IT Lead",              icon: "💻",  level: "system" },
  { id: "exec",           label: "Executive",            icon: "🏢",  level: "leadership" },
];

export const MOCK_DEPARTMENTS = [
  { id: "clinical",         label: "Clinical",              icon: "🩺" },
  { id: "operations",       label: "Operations",            icon: "⚙️" },
  { id: "billing",          label: "Billing",               icon: "💵" },
  { id: "compliance",       label: "Compliance",            icon: "📋" },
  { id: "it",               label: "Information Technology",icon: "💻" },
  { id: "hr",               label: "Human Resources",       icon: "👥" },
  { id: "finance",          label: "Finance",               icon: "📊" },
  { id: "legal",            label: "Legal",                 icon: "⚖️" },
  { id: "marketing",        label: "Marketing",             icon: "📣" },
  { id: "quality",          label: "Quality Assurance",     icon: "✅" },
  { id: "patient-svcs",     label: "Patient Services",      icon: "❤️" },
  { id: "pharmacy",         label: "Pharmacy",              icon: "💊" },
  { id: "research",         label: "Research & Innovation", icon: "🔬" },
  { id: "administration",   label: "Administration",        icon: "🗂️" },
  { id: "executive",        label: "Executive Office",      icon: "🏢" },
];

export const MOCK_AGENCIES = [
  { id: "cms",        label: "Centers for Medicare & Medicaid Services (CMS)",     abbrev: "CMS" },
  { id: "hhs",        label: "U.S. Dept. of Health & Human Services (HHS)",        abbrev: "HHS" },
  { id: "fda",        label: "Food & Drug Administration (FDA)",                    abbrev: "FDA" },
  { id: "cdc",        label: "Centers for Disease Control & Prevention (CDC)",      abbrev: "CDC" },
  { id: "ahrq",       label: "Agency for Healthcare Research & Quality (AHRQ)",    abbrev: "AHRQ" },
  { id: "va",         label: "Veterans Affairs (VA)",                               abbrev: "VA" },
  { id: "samhsa",     label: "Substance Abuse & Mental Health Services (SAMHSA)",   abbrev: "SAMHSA" },
  { id: "acl",        label: "Administration for Community Living (ACL)",           abbrev: "ACL" },
  { id: "nih",        label: "National Institutes of Health (NIH)",                 abbrev: "NIH" },
  { id: "omh",        label: "Office of Minority Health (OMH)",                    abbrev: "OMH" },
  { id: "onc",        label: "Office of the National Coordinator for HIT (ONC)",   abbrev: "ONC" },
  { id: "hrsa",       label: "Health Resources & Services Administration (HRSA)",  abbrev: "HRSA" },
  { id: "ihs",        label: "Indian Health Service (IHS)",                        abbrev: "IHS" },
  { id: "bphc",       label: "Bureau of Primary Health Care (BPHC)",              abbrev: "BPHC" },
  { id: "chip",       label: "Children's Health Insurance Program (CHIP)",         abbrev: "CHIP" },
  { id: "aca",        label: "Affordable Care Act Programs Office (ACA)",          abbrev: "ACA" },
  { id: "medicaid",   label: "State Medicaid Program Office",                      abbrev: "SMA" },
  { id: "tricare",    label: "TRICARE / Defense Health Agency",                    abbrev: "DHA" },
];

export const MOCK_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","District of Columbia",
];

export const MOCK_VENDORS = [
  { id: "nexus-health",    label: "Nexus Health Systems",       category: "EHR",            status: "active" },
  { id: "clearpath",       label: "ClearPath Analytics",        category: "Analytics",      status: "active" },
  { id: "medilink",        label: "MediLink Interop",           category: "Interoperability",status: "active" },
  { id: "provaid",         label: "ProvAid Networks",           category: "Provider Portal", status: "demo" },
  { id: "claimstream",     label: "ClaimStream Processing",     category: "Claims",         status: "active" },
  { id: "carebridge",      label: "CareBridge Solutions",       category: "Care Mgmt",      status: "active" },
  { id: "formulax",        label: "FormulaX Pharmacy",          category: "Pharmacy",       status: "demo" },
  { id: "dataforce",       label: "DataForce Warehouse",        category: "Data Platform",  status: "active" },
  { id: "billingpro",      label: "BillingPro Services",        category: "Revenue Cycle",  status: "active" },
  { id: "telemedi",        label: "TeleMedi Connect",           category: "Telehealth",     status: "demo" },
  { id: "complianceiq",    label: "ComplianceIQ Platform",      category: "Compliance",     status: "active" },
  { id: "engagehealth",    label: "EngageHealth CRM",           category: "CRM",            status: "active" },
  { id: "safetynet",       label: "SafetyNet Monitoring",       category: "Safety",         status: "demo" },
  { id: "priortrack",      label: "PriorTrack Auth",            category: "Prior Auth",     status: "active" },
  { id: "predictix",       label: "PredictIX AI",               category: "AI/ML",          status: "demo" },
  { id: "refermatch",      label: "ReferMatch Referrals",       category: "Referral Mgmt",  status: "active" },
  { id: "qualityplus",     label: "QualityPlus HEDIS",          category: "Quality Metrics",status: "active" },
  { id: "memberportal",    label: "MemberPortal Pro",           category: "Member Portal",  status: "demo" },
  { id: "auditshield",     label: "AuditShield Compliance",     category: "Audit",          status: "active" },
  { id: "careops",         label: "CareOps Workforce",          category: "Workforce",      status: "demo" },
];

export const MOCK_HEALTHCARE_CATEGORIES = [
  { id: "primary-care",    label: "Primary Care",               icon: "🏥" },
  { id: "behavioral",      label: "Behavioral Health",          icon: "🧠" },
  { id: "pharmacy",        label: "Pharmacy Services",          icon: "💊" },
  { id: "dental",          label: "Dental",                     icon: "🦷" },
  { id: "vision",          label: "Vision",                     icon: "👁️" },
  { id: "home-health",     label: "Home Health",                icon: "🏡" },
  { id: "long-term",       label: "Long-Term Care",             icon: "🛏️" },
  { id: "telehealth",      label: "Telehealth",                 icon: "📱" },
  { id: "emergency",       label: "Emergency Services",         icon: "🚨" },
  { id: "specialty",       label: "Specialty Care",             icon: "🔬" },
  { id: "preventive",      label: "Preventive Care",            icon: "💉" },
  { id: "maternal",        label: "Maternal & Child Health",    icon: "👶" },
  { id: "oncology",        label: "Oncology",                   icon: "🎗️" },
  { id: "rehabilitation",  label: "Rehabilitation Services",    icon: "🏋️" },
  { id: "palliative",      label: "Palliative & Hospice",       icon: "🕊️" },
];

export const MOCK_PROVIDER_TYPES = [
  "Physician (MD/DO)", "Nurse Practitioner (NP)", "Physician Assistant (PA)",
  "Registered Nurse (RN)", "Licensed Clinical Social Worker (LCSW)",
  "Psychologist (PhD/PsyD)", "Psychiatrist (MD)", "Physical Therapist (PT)",
  "Occupational Therapist (OT)", "Speech-Language Pathologist (SLP)",
  "Pharmacist (PharmD)", "Dentist (DDS/DMD)", "Optometrist (OD)",
  "Chiropractor (DC)", "Certified Nurse Midwife (CNM)", "Radiologist (MD)",
  "Hospitalist", "Cardiologist", "Oncologist", "Endocrinologist",
];

export const MOCK_PAYER_TYPES = [
  { id: "medicare",        label: "Medicare (Part A/B/C/D)",    icon: "🏛️" },
  { id: "medicaid",        label: "Medicaid (State-Based)",     icon: "📋" },
  { id: "chip",            label: "CHIP",                       icon: "👶" },
  { id: "commercial",      label: "Commercial Insurance",       icon: "🏢" },
  { id: "self-pay",        label: "Self-Pay / Uninsured",       icon: "💵" },
  { id: "tricare",         label: "TRICARE (Military)",         icon: "🎖️" },
  { id: "va-benefits",     label: "VA Benefits",                icon: "🏅" },
  { id: "marketplace",     label: "ACA Marketplace Plan",       icon: "🏥" },
  { id: "dual-eligible",   label: "Dual-Eligible (Medicare + Medicaid)", icon: "⭐" },
  { id: "employer",        label: "Employer-Sponsored Plan",    icon: "👔" },
  { id: "cobra",           label: "COBRA Coverage",             icon: "🔄" },
  { id: "mltss",           label: "MLTSS / Managed Long-Term", icon: "🛏️" },
];

export const MOCK_FACILITIES = [
  { id: "hospital-gen",    label: "General Hospital",            type: "acute" },
  { id: "hospital-crit",   label: "Critical Access Hospital",    type: "acute" },
  { id: "fqhc",            label: "FQHC / Community Health Center", type: "primary" },
  { id: "rural-clinic",    label: "Rural Health Clinic (RHC)",   type: "primary" },
  { id: "asc",             label: "Ambulatory Surgery Center",   type: "surgical" },
  { id: "snf",             label: "Skilled Nursing Facility (SNF)", type: "long-term" },
  { id: "alf",             label: "Assisted Living Facility",    type: "long-term" },
  { id: "home-agency",     label: "Home Health Agency",          type: "home" },
  { id: "hospice",         label: "Hospice Organization",        type: "palliative" },
  { id: "rehab",           label: "Inpatient Rehabilitation Facility", type: "rehab" },
  { id: "psych",           label: "Inpatient Psychiatric Facility", type: "behavioral" },
  { id: "substance",       label: "Substance Use Treatment Center", type: "behavioral" },
  { id: "urgent-care",     label: "Urgent Care Center",          type: "primary" },
  { id: "telehealth-org",  label: "Telehealth Organization",     type: "virtual" },
  { id: "pharmacy-chain",  label: "Pharmacy Chain / Retail",     type: "pharmacy" },
  { id: "lab",             label: "Clinical Laboratory",         type: "ancillary" },
];

export const MOCK_PROGRAMS = [
  { id: "managed-care",    label: "Medicaid Managed Care",       domain: "Medicaid" },
  { id: "value-based",     label: "Value-Based Care Program",    domain: "Quality" },
  { id: "pcmh",            label: "Patient-Centered Medical Home (PCMH)", domain: "Primary Care" },
  { id: "bundled-pay",     label: "Bundled Payment Models",      domain: "Medicare" },
  { id: "aco",             label: "Accountable Care Organization (ACO)", domain: "Medicare" },
  { id: "dshp",            label: "Delivery System Reform (DSRIP/DSHP)", domain: "Medicaid" },
  { id: "1115-waiver",     label: "1115 Waiver Programs",        domain: "Medicaid" },
  { id: "chip-program",    label: "CHIP Program Administration", domain: "CHIP" },
  { id: "care-trans",      label: "Care Transitions Program",    domain: "Quality" },
  { id: "chronic-care",    label: "Chronic Care Management (CCM)", domain: "Medicare" },
  { id: "tcm",             label: "Transitional Care Management (TCM)", domain: "Medicare" },
  { id: "mat",             label: "Medication-Assisted Treatment (MAT)", domain: "Behavioral" },
  { id: "ccbhc",           label: "Certified Community Behavioral Health Clinic (CCBHC)", domain: "Behavioral" },
  { id: "pchp",            label: "Public Health Prevention Programs", domain: "Public Health" },
  { id: "sdoh",            label: "Social Determinants of Health (SDOH) Initiative", domain: "Community" },
  { id: "workforce-dev",   label: "Healthcare Workforce Development", domain: "Workforce" },
];

export const MOCK_SERVICES = [
  { id: "phy-exam",        label: "Annual Physical Exam",        category: "primary-care" },
  { id: "wellness-visit",  label: "Wellness Visit (AWV)",        category: "primary-care" },
  { id: "chronic-mgmt",   label: "Chronic Disease Management",  category: "primary-care" },
  { id: "mh-assessment",  label: "Mental Health Assessment",    category: "behavioral" },
  { id: "therapy-indiv",  label: "Individual Therapy",          category: "behavioral" },
  { id: "med-mgmt",        label: "Medication Management",       category: "behavioral" },
  { id: "rx-dispense",     label: "Rx Dispensing",               category: "pharmacy" },
  { id: "mtm",             label: "Medication Therapy Management (MTM)", category: "pharmacy" },
  { id: "dental-clean",    label: "Dental Cleaning & Exam",      category: "dental" },
  { id: "vision-exam",     label: "Vision Exam & Refraction",    category: "vision" },
  { id: "home-aide",       label: "Home Health Aide Services",   category: "home-health" },
  { id: "pt-session",      label: "Physical Therapy Session",    category: "rehabilitation" },
  { id: "ot-session",      label: "Occupational Therapy Session",category: "rehabilitation" },
  { id: "telehealth-visit",label: "Telehealth Consultation",     category: "telehealth" },
  { id: "emergency-care",  label: "Emergency Room Care",         category: "emergency" },
  { id: "immunization",    label: "Immunization / Vaccine",      category: "preventive" },
  { id: "prenatal",        label: "Prenatal Care Visit",         category: "maternal" },
  { id: "cancer-screening",label: "Cancer Screening",            category: "preventive" },
  { id: "dme",             label: "Durable Medical Equipment (DME)", category: "specialty" },
  { id: "hospice-care",    label: "Hospice Care Services",       category: "palliative" },
  { id: "case-mgmt",       label: "Case Management Services",   category: "primary-care" },
  { id: "nutrition",       label: "Nutrition & Dietitian Services", category: "preventive" },
];

export const MOCK_USER_TYPES = [
  "Enterprise", "Small Practice", "Solo Provider", "State Agency",
  "Health Plan", "Community Organization", "Research Institution",
  "Family / Personal", "Student / Training", "Vendor Partner",
];

export const MOCK_DEMO_STATUSES = [
  "not-started", "in-progress", "submitted", "under-review",
  "approved-demo", "rejected", "needs-revision", "expired",
] as const;
export type DemoStatus = typeof MOCK_DEMO_STATUSES[number];

// ─── Universal State ──────────────────────────────────────────────────────

export type UniversalView =
  | "home" | "dashboard" | "roles" | "agencies" | "states"
  | "vendors" | "programs" | "packets" | "submissions" | "settings" | "talk"
  | "industries" | "workflows" | "creative" | "games" | "story"
  | "connection" | "strategy" | "architecture";

export interface ActionLogEntry {
  id: string;
  timestamp: string;
  action: string;
  field: string;
  previousValue: string | null;
  newValue: string;
  screen: UniversalView;
}

export interface UniversalState {
  currentRole:         string;
  currentDepartment:   string;
  currentAgency:       string;
  currentState:        string;
  currentVendor:       string;
  currentView:         UniversalView;
  currentUserType:     string;
  currentPacket:       string | null;
  currentDemoStatus:   DemoStatus;
  // Universal Everything Engine fields
  currentIndustry:     string;
  currentCountry:      string;
  currentDomain:       string;
  currentMode:         string;
  currentScenario:     string | null;
  actionLog:           ActionLogEntry[];
  lastUpdated:         string;
}

const DEFAULT_STATE: UniversalState = {
  currentRole:       "care-coord",
  currentDepartment: "clinical",
  currentAgency:     "cms",
  currentState:      "California",
  currentVendor:     "nexus-health",
  currentView:       "home",
  currentUserType:   "Enterprise",
  currentPacket:     null,
  currentDemoStatus: "not-started",
  currentIndustry:   "healthcare",
  currentCountry:    "United States",
  currentDomain:     "Clinical",
  currentMode:       "demo",
  currentScenario:   null,
  actionLog:         [],
  lastUpdated:       new Date().toISOString(),
};

// ─── Engine Class ─────────────────────────────────────────────────────────

class UniversalInteractionEngineClass {
  private state: UniversalState;

  constructor() {
    this.state = this.load();
  }

  private load(): UniversalState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UniversalState>;
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch { /* ignore */ }
    return { ...DEFAULT_STATE };
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch { /* ignore */ }
  }

  private log(action: string, field: string, previousValue: string | null, newValue: string) {
    const entry: ActionLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      field,
      previousValue,
      newValue,
      screen: this.state.currentView,
    };
    this.state.actionLog = [entry, ...this.state.actionLog].slice(0, 200);
  }

  getState(): UniversalState { return { ...this.state }; }

  setRole(roleId: string) {
    const prev = this.state.currentRole;
    this.state.currentRole = roleId;
    this.state.lastUpdated = new Date().toISOString();
    this.log("CHANGE_ROLE", "currentRole", prev, roleId);
    this.save();
  }

  setDepartment(deptId: string) {
    const prev = this.state.currentDepartment;
    this.state.currentDepartment = deptId;
    this.state.lastUpdated = new Date().toISOString();
    this.log("CHANGE_DEPARTMENT", "currentDepartment", prev, deptId);
    this.save();
  }

  setAgency(agencyId: string) {
    const prev = this.state.currentAgency;
    this.state.currentAgency = agencyId;
    this.state.lastUpdated = new Date().toISOString();
    this.log("CHANGE_AGENCY", "currentAgency", prev, agencyId);
    this.save();
  }

  setState(stateName: string) {
    const prev = this.state.currentState;
    this.state.currentState = stateName;
    this.state.lastUpdated = new Date().toISOString();
    this.log("CHANGE_STATE", "currentState", prev, stateName);
    this.save();
  }

  setVendor(vendorId: string) {
    const prev = this.state.currentVendor;
    this.state.currentVendor = vendorId;
    this.state.lastUpdated = new Date().toISOString();
    this.log("CHANGE_VENDOR", "currentVendor", prev, vendorId);
    this.save();
  }

  setView(view: UniversalView) {
    const prev = this.state.currentView;
    this.state.currentView = view;
    this.state.lastUpdated = new Date().toISOString();
    this.log("NAVIGATE", "currentView", prev, view);
    this.save();
  }

  setUserType(userType: string) {
    const prev = this.state.currentUserType;
    this.state.currentUserType = userType;
    this.state.lastUpdated = new Date().toISOString();
    this.log("CHANGE_USER_TYPE", "currentUserType", prev, userType);
    this.save();
  }

  setPacket(packetId: string | null) {
    const prev = this.state.currentPacket;
    this.state.currentPacket = packetId;
    this.state.lastUpdated = new Date().toISOString();
    this.log("OPEN_PACKET", "currentPacket", prev, packetId ?? "null");
    this.save();
  }

  setDemoStatus(status: DemoStatus) {
    const prev = this.state.currentDemoStatus;
    this.state.currentDemoStatus = status;
    this.state.lastUpdated = new Date().toISOString();
    this.log("CHANGE_DEMO_STATUS", "currentDemoStatus", prev, status);
    this.save();
  }

  setIndustry(industryId: string) {
    const prev = this.state.currentIndustry;
    this.state.currentIndustry = industryId;
    this.state.lastUpdated = new Date().toISOString();
    this.log("CHANGE_INDUSTRY", "currentIndustry", prev, industryId);
    this.save();
  }

  setCountry(country: string) {
    const prev = this.state.currentCountry;
    this.state.currentCountry = country;
    this.state.lastUpdated = new Date().toISOString();
    this.log("CHANGE_COUNTRY", "currentCountry", prev, country);
    this.save();
  }

  setDomain(domain: string) {
    const prev = this.state.currentDomain;
    this.state.currentDomain = domain;
    this.state.lastUpdated = new Date().toISOString();
    this.log("CHANGE_DOMAIN", "currentDomain", prev, domain);
    this.save();
  }

  setMode(mode: string) {
    const prev = this.state.currentMode;
    this.state.currentMode = mode;
    this.state.lastUpdated = new Date().toISOString();
    this.log("CHANGE_MODE", "currentMode", prev, mode);
    this.save();
  }

  setScenario(scenario: string | null) {
    const prev = this.state.currentScenario;
    this.state.currentScenario = scenario;
    this.state.lastUpdated = new Date().toISOString();
    this.log("CHANGE_SCENARIO", "currentScenario", prev, scenario ?? "null");
    this.save();
  }

  dispatchAction(action: string, payload?: string) {
    this.log(action, "action", null, payload ?? "triggered");
    this.state.lastUpdated = new Date().toISOString();
    this.save();
  }

  clearLog() {
    this.state.actionLog = [];
    this.state.lastUpdated = new Date().toISOString();
    this.save();
  }

  reset() {
    this.state = { ...DEFAULT_STATE, lastUpdated: new Date().toISOString() };
    this.save();
  }

  // Dashboard stats
  getStats() {
    const log = this.state.actionLog;
    return {
      totalActions:      log.length,
      roleChanges:       log.filter(l => l.action === "CHANGE_ROLE").length,
      agencyChanges:     log.filter(l => l.action === "CHANGE_AGENCY").length,
      stateChanges:      log.filter(l => l.action === "CHANGE_STATE").length,
      vendorChanges:     log.filter(l => l.action === "CHANGE_VENDOR").length,
      navigations:       log.filter(l => l.action === "NAVIGATE").length,
      packetActions:     log.filter(l => l.action === "OPEN_PACKET").length,
      submissionsLogged: log.filter(l => l.action === "SUBMIT").length,
      lastAction:        log[0]?.action ?? "none",
      lastUpdated:       this.state.lastUpdated,
    };
  }
}

export const InteractionEngine = new UniversalInteractionEngineClass();
