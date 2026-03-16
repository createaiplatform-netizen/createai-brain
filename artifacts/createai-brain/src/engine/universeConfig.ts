// ─── Universal Platform Configuration ──────────────────────────────────────
// Pattern-based engine: every industry maps to roles, departments, workflows,
// entity types, and document types. Never returns empty — always adapts.

export type IndustryId =
  | "healthcare" | "staffing" | "education" | "finance" | "legal"
  | "construction" | "logistics" | "government" | "technology" | "retail"
  | "manufacturing" | "nonprofit" | "hospitality" | "realestate" | "generic";

export interface IndustryConfig {
  id: IndustryId;
  label: string;
  icon: string;
  color: string;
  entityLabel: string;
  entityPluralLabel: string;
  departments: string[];
  roles: string[];
  workflowTypes: string[];
  documentTypes: string[];
  kpiLabels: string[];
  scenarioTypes: string[];
}

const INDUSTRY_CONFIGS: Record<IndustryId, IndustryConfig> = {
  healthcare: {
    id: "healthcare", label: "Healthcare", icon: "🏥", color: "#06b6d4",
    entityLabel: "Patient", entityPluralLabel: "Patients",
    departments: ["Intake", "Clinical", "Billing", "Compliance", "QA", "HR", "IT", "Operations"],
    roles: ["Chief Medical Officer", "Director of Nursing", "Clinic Manager", "RN / Case Manager", "Billing Specialist", "Compliance Officer", "IT Admin", "Front Desk"],
    workflowTypes: ["Patient Intake", "Care Coordination", "Discharge Planning", "Prior Authorization", "Claims Processing", "Incident Reporting", "Credentialing", "Quality Audit"],
    documentTypes: ["Intake Form", "Care Plan", "Discharge Summary", "Prior Auth Request", "Claim Submission", "Incident Report", "Credential Packet", "Audit Report"],
    kpiLabels: ["Patient Volume", "Average LOS (days)", "Readmission Rate", "Claim Denial Rate", "Prior Auth Turnaround (hrs)", "Staff-to-Patient Ratio", "Compliance Score", "Patient Satisfaction"],
    scenarioTypes: ["High Patient Volume", "Staff Shortage", "Regulatory Audit", "EHR Outage", "Billing Backlog", "Mass Casualty Event", "Reimbursement Rate Change"],
  },
  staffing: {
    id: "staffing", label: "Staffing & Workforce", icon: "👥", color: "#8b5cf6",
    entityLabel: "Candidate", entityPluralLabel: "Candidates",
    departments: ["Recruiting", "Onboarding", "Compliance", "Payroll", "Operations", "Account Management", "HR", "IT"],
    roles: ["VP of Staffing", "Account Executive", "Recruiter", "Compliance Manager", "Onboarding Coordinator", "Payroll Specialist", "Operations Lead", "IT Admin"],
    workflowTypes: ["Candidate Sourcing", "Interview & Selection", "Compliance Check", "Onboarding", "Timesheet Processing", "Contract Management", "Performance Review", "Offboarding"],
    documentTypes: ["Job Order", "Resume / Application", "Compliance Checklist", "Onboarding Packet", "Timesheet", "Contract", "Performance Review", "Separation Notice"],
    kpiLabels: ["Open Orders", "Fill Rate", "Time-to-Fill (days)", "Compliance Rate", "Submittal-to-Hire Ratio", "Active Placements", "Payroll Accuracy", "Client Satisfaction"],
    scenarioTypes: ["Surge in Job Orders", "Compliance Audit", "High Turnover Wave", "Payroll System Outage", "Mass Hiring Event", "Regulatory Change", "Key Account Loss"],
  },
  education: {
    id: "education", label: "Education", icon: "🎓", color: "#f59e0b",
    entityLabel: "Student", entityPluralLabel: "Students",
    departments: ["Enrollment", "Academics", "Student Services", "Finance", "IT", "HR", "Compliance", "Special Programs"],
    roles: ["Superintendent", "Principal", "Department Chair", "Teacher / Instructor", "Counselor", "Financial Aid Officer", "IT Director", "Administrative Assistant"],
    workflowTypes: ["Student Enrollment", "Course Registration", "Grade Reporting", "Financial Aid Processing", "Disciplinary Review", "IEP Management", "Graduation Audit", "Accreditation Review"],
    documentTypes: ["Enrollment Form", "Course Registration", "Transcript", "Financial Aid Award", "Disciplinary Notice", "IEP Document", "Graduation Checklist", "Accreditation Report"],
    kpiLabels: ["Enrollment Count", "Attendance Rate", "Graduation Rate", "Financial Aid Approval Rate", "Average GPA", "Incident Count", "Staff-to-Student Ratio", "Budget Utilization"],
    scenarioTypes: ["Enrollment Surge", "Teacher Shortage", "Compliance Audit", "LMS Outage", "Budget Cuts", "Emergency Closure", "Accreditation Review"],
  },
  finance: {
    id: "finance", label: "Finance & Banking", icon: "🏦", color: "#22c55e",
    entityLabel: "Account", entityPluralLabel: "Accounts",
    departments: ["Retail Banking", "Commercial Lending", "Compliance", "Risk", "Operations", "IT", "HR", "Audit"],
    roles: ["CFO", "Branch Manager", "Loan Officer", "Compliance Officer", "Risk Analyst", "Operations Manager", "IT Security Lead", "Auditor"],
    workflowTypes: ["Account Opening", "Loan Origination", "KYC / AML Review", "Transaction Monitoring", "Dispute Resolution", "Audit Cycle", "Regulatory Reporting", "Fraud Investigation"],
    documentTypes: ["Account Application", "Loan Package", "KYC File", "Suspicious Activity Report", "Dispute Form", "Audit Workpapers", "Regulatory Filing", "Fraud Case File"],
    kpiLabels: ["Active Accounts", "Loan Approval Rate", "KYC Completion Rate", "Suspicious Activity Reports", "Average Processing Time (hrs)", "Compliance Score", "Dispute Resolution Rate", "Fraud Loss Rate"],
    scenarioTypes: ["Audit Exam", "Fraud Spike", "Regulatory Change", "Core Banking Outage", "High Loan Volume", "Staff Turnover", "Market Stress Event"],
  },
  legal: {
    id: "legal", label: "Legal & Law Firm", icon: "⚖️", color: "#a855f7",
    entityLabel: "Matter", entityPluralLabel: "Matters",
    departments: ["Litigation", "Corporate", "Compliance", "Real Estate", "Employment", "Billing", "HR", "IT"],
    roles: ["Managing Partner", "Senior Attorney", "Associate Attorney", "Paralegal", "Legal Admin", "Billing Manager", "Compliance Counsel", "IT Director"],
    workflowTypes: ["Matter Intake", "Discovery", "Contract Review", "Deposition Prep", "Court Filing", "Billing & Invoicing", "Compliance Review", "Matter Close"],
    documentTypes: ["Engagement Letter", "Pleadings", "Discovery Request", "Contract", "Deposition Summary", "Invoice", "Compliance Memo", "Matter Closeout"],
    kpiLabels: ["Open Matters", "Billable Hours", "Realization Rate", "Billing Realization", "Average Matter Duration", "Win Rate", "Compliance Score", "Client Satisfaction"],
    scenarioTypes: ["Litigation Surge", "Key Partner Departure", "Compliance Audit", "DMS Outage", "Large Acquisition Deal", "Regulatory Change", "Data Breach"],
  },
  construction: {
    id: "construction", label: "Construction", icon: "🏗️", color: "#f97316",
    entityLabel: "Project", entityPluralLabel: "Projects",
    departments: ["Pre-Construction", "Operations", "Safety", "Procurement", "Finance", "HR", "IT", "QA"],
    roles: ["CEO / Owner", "Project Manager", "Site Superintendent", "Safety Officer", "Estimator", "Procurement Manager", "Foreman", "Project Engineer"],
    workflowTypes: ["Bid & Estimating", "Subcontractor Management", "Safety Inspection", "RFI Processing", "Change Order Management", "Progress Billing", "Punch List", "Project Close-Out"],
    documentTypes: ["Bid Package", "Subcontract", "Safety Report", "RFI", "Change Order", "Pay Application", "Punch List", "Project Closeout Report"],
    kpiLabels: ["Active Projects", "On-Time Completion Rate", "Budget Variance", "Safety Incidents", "RFI Response Time (days)", "Change Order Volume", "Subcontractor Score", "Quality Defects"],
    scenarioTypes: ["Labor Shortage", "Material Cost Surge", "Safety Incident", "Permit Delay", "Subcontractor Default", "Weather Event", "Regulatory Inspection"],
  },
  logistics: {
    id: "logistics", label: "Logistics & Supply Chain", icon: "🚚", color: "#06b6d4",
    entityLabel: "Shipment", entityPluralLabel: "Shipments",
    departments: ["Warehouse", "Transportation", "Customs", "Procurement", "Customer Service", "Finance", "IT", "QA"],
    roles: ["VP of Operations", "Logistics Manager", "Dispatcher", "Warehouse Manager", "Customs Broker", "Procurement Analyst", "Customer Service Lead", "IT Admin"],
    workflowTypes: ["Order Receipt", "Warehouse Processing", "Carrier Assignment", "Dispatch & Tracking", "Customs Clearance", "Last-Mile Delivery", "Returns Processing", "Invoice & Settlement"],
    documentTypes: ["Purchase Order", "Pick List", "Bill of Lading", "Dispatch Record", "Customs Declaration", "Delivery Confirmation", "Return Authorization", "Settlement Invoice"],
    kpiLabels: ["Shipments In Transit", "On-Time Delivery Rate", "Warehouse Fill Rate", "Customs Clearance Time (hrs)", "Damage Rate", "Cost Per Shipment", "Return Rate", "Customer Satisfaction"],
    scenarioTypes: ["Port Congestion", "Carrier Shortage", "Demand Surge", "Customs Hold", "Warehouse Capacity Issue", "System Outage", "Regulatory Change"],
  },
  government: {
    id: "government", label: "Government Agency", icon: "🏛️", color: "#64748b",
    entityLabel: "Case", entityPluralLabel: "Cases",
    departments: ["Public Services", "Licensing", "Compliance", "Finance", "IT", "HR", "Legal", "Communications"],
    roles: ["Director", "Deputy Director", "Program Manager", "Case Manager", "Licensing Officer", "Compliance Inspector", "IT Manager", "HR Director"],
    workflowTypes: ["Public Request Processing", "License Issuance", "Compliance Inspection", "Grant Administration", "Appeals Processing", "Public Records Request", "Audit Cycle", "Policy Implementation"],
    documentTypes: ["Application Form", "License Certificate", "Inspection Report", "Grant Agreement", "Appeals Decision", "FOIA Response", "Audit Report", "Policy Document"],
    kpiLabels: ["Open Cases", "Processing Time (days)", "Approval Rate", "Compliance Rate", "Public Satisfaction Score", "Budget Utilization", "Appeals Rate", "Staff Productivity"],
    scenarioTypes: ["Surge in Applications", "Compliance Audit", "Budget Cuts", "System Outage", "Emergency Declaration", "Regulatory Change", "Workforce Reduction"],
  },
  technology: {
    id: "technology", label: "Technology / SaaS", icon: "💻", color: "#6366f1",
    entityLabel: "User", entityPluralLabel: "Users",
    departments: ["Engineering", "Product", "Customer Success", "Sales", "Marketing", "HR", "Finance", "Security"],
    roles: ["CTO", "VP of Engineering", "Product Manager", "Engineering Manager", "Customer Success Manager", "Sales Lead", "DevOps Engineer", "Security Analyst"],
    workflowTypes: ["Feature Development", "Bug Triage", "Customer Onboarding", "Incident Response", "Release Management", "Support Ticket Resolution", "Security Review", "Offboarding"],
    documentTypes: ["Product Spec", "Bug Report", "Onboarding Checklist", "Incident Report", "Release Notes", "Support Ticket", "Security Assessment", "Offboarding Guide"],
    kpiLabels: ["Active Users (MAU)", "Churn Rate", "Ticket Resolution Time (hrs)", "Deploy Frequency", "Uptime %", "NPS Score", "Support Backlog", "Sprint Velocity"],
    scenarioTypes: ["Traffic Spike", "Production Outage", "Security Breach", "High Churn", "Major Release", "Team Scaling", "Compliance Audit"],
  },
  retail: {
    id: "retail", label: "Retail & Commerce", icon: "🏪", color: "#ec4899",
    entityLabel: "Order", entityPluralLabel: "Orders",
    departments: ["Store Operations", "Merchandising", "Supply Chain", "HR", "Finance", "Marketing", "IT", "Loss Prevention"],
    roles: ["VP of Retail", "District Manager", "Store Manager", "Department Lead", "Inventory Analyst", "HR Manager", "IT Director", "Loss Prevention Manager"],
    workflowTypes: ["Order Processing", "Inventory Management", "Vendor Management", "Loss Prevention", "Employee Scheduling", "Markdown Management", "Returns", "Store Audit"],
    documentTypes: ["Purchase Order", "Receiving Report", "Vendor Agreement", "Incident Report", "Schedule", "Markdown Authorization", "Return Authorization", "Audit Report"],
    kpiLabels: ["Daily Sales", "Inventory Turnover", "Shrink Rate", "Conversion Rate", "Average Order Value", "Return Rate", "Labor Cost %", "Customer Satisfaction"],
    scenarioTypes: ["Holiday Rush", "Supply Chain Disruption", "Loss Prevention Issue", "System Outage", "Workforce Shortage", "Price War", "Store Audit"],
  },
  manufacturing: {
    id: "manufacturing", label: "Manufacturing", icon: "🏭", color: "#84cc16",
    entityLabel: "Work Order", entityPluralLabel: "Work Orders",
    departments: ["Production", "Quality", "Maintenance", "Supply Chain", "Safety", "HR", "Finance", "Engineering"],
    roles: ["Plant Manager", "Production Supervisor", "Quality Manager", "Maintenance Lead", "Safety Officer", "Supply Chain Manager", "Process Engineer", "HR Manager"],
    workflowTypes: ["Production Planning", "Work Order Processing", "Quality Inspection", "Preventive Maintenance", "Non-Conformance Reporting", "Material Receipt", "Equipment Calibration", "Safety Audit"],
    documentTypes: ["Production Order", "Work Order", "Quality Inspection Report", "Maintenance Log", "NCR Form", "Material Receipt", "Calibration Record", "Safety Audit Report"],
    kpiLabels: ["Units Produced", "OEE %", "Defect Rate (PPM)", "Downtime Hours", "Safety Incidents", "First Pass Yield", "On-Time Production Rate", "Maintenance Compliance"],
    scenarioTypes: ["Equipment Failure", "Supply Shortage", "Quality Issue", "Safety Incident", "High Demand Surge", "Regulatory Inspection", "Labor Action"],
  },
  nonprofit: {
    id: "nonprofit", label: "Non-Profit Org", icon: "🌱", color: "#22c55e",
    entityLabel: "Client", entityPluralLabel: "Clients",
    departments: ["Program Services", "Development", "Finance", "HR", "Volunteers", "Communications", "Compliance", "IT"],
    roles: ["Executive Director", "Program Director", "Development Manager", "Grant Writer", "Case Manager", "Volunteer Coordinator", "Finance Manager", "Compliance Officer"],
    workflowTypes: ["Client Intake", "Program Delivery", "Grant Application", "Donation Processing", "Volunteer Management", "Impact Reporting", "Compliance Filing", "Event Coordination"],
    documentTypes: ["Intake Assessment", "Service Plan", "Grant Proposal", "Donation Receipt", "Volunteer Agreement", "Impact Report", "Form 990", "Event Plan"],
    kpiLabels: ["Active Clients", "Program Completion Rate", "Grant Success Rate", "Total Donations", "Volunteer Hours", "Cost Per Client", "Compliance Rate", "Donor Retention Rate"],
    scenarioTypes: ["Funding Shortfall", "Demand Surge", "Compliance Audit", "Key Staff Departure", "High-Impact Event", "Grant Deadline Rush", "Volunteer Shortage"],
  },
  hospitality: {
    id: "hospitality", label: "Hotel & Hospitality", icon: "🏨", color: "#f59e0b",
    entityLabel: "Reservation", entityPluralLabel: "Reservations",
    departments: ["Front Desk", "Housekeeping", "Food & Beverage", "Maintenance", "HR", "Sales", "Finance", "IT"],
    roles: ["General Manager", "Front Desk Manager", "Executive Housekeeper", "F&B Director", "Maintenance Manager", "HR Director", "Revenue Manager", "IT Manager"],
    workflowTypes: ["Reservation Management", "Check-In / Check-Out", "Room Turnover", "Guest Request", "Event Catering", "Maintenance Request", "Revenue Optimization", "Staff Scheduling"],
    documentTypes: ["Reservation Confirmation", "Check-In Form", "Housekeeping Report", "Guest Request Log", "Banquet Order", "Maintenance Work Order", "Revenue Report", "Staff Schedule"],
    kpiLabels: ["Occupancy Rate", "RevPAR", "Average Daily Rate", "Guest Satisfaction", "Check-In Wait Time (min)", "Housekeeping Score", "F&B Revenue", "Staff Turnover Rate"],
    scenarioTypes: ["Peak Season Rush", "Staff Shortage", "Major Event", "System Outage", "Health Inspection", "Group Cancellation", "Natural Disaster"],
  },
  realestate: {
    id: "realestate", label: "Real Estate", icon: "🏡", color: "#f97316",
    entityLabel: "Listing", entityPluralLabel: "Listings",
    departments: ["Sales", "Property Management", "Legal", "Finance", "Marketing", "HR", "IT", "Compliance"],
    roles: ["Broker / Owner", "Sales Manager", "Agent", "Property Manager", "Transaction Coordinator", "Marketing Manager", "Compliance Officer", "IT Admin"],
    workflowTypes: ["Listing Management", "Buyer Consultation", "Offer & Negotiation", "Due Diligence", "Closing Coordination", "Lease Management", "Maintenance Request", "Market Analysis"],
    documentTypes: ["Listing Agreement", "Buyer Representation Agreement", "Purchase Agreement", "Inspection Report", "HUD Statement", "Lease Agreement", "Maintenance Request", "Market Report"],
    kpiLabels: ["Active Listings", "Days on Market", "Sale-to-List Price Ratio", "Closings Per Month", "Commission Revenue", "Lease Renewal Rate", "Maintenance Tickets", "Client Satisfaction"],
    scenarioTypes: ["Market Surge", "Interest Rate Spike", "Agent Turnover", "MLS Outage", "Regulatory Change", "Economic Downturn", "High Transaction Volume"],
  },
  generic: {
    id: "generic", label: "Professional Services", icon: "💼", color: "#6366f1",
    entityLabel: "Case", entityPluralLabel: "Cases",
    departments: ["Operations", "Client Services", "Finance", "HR", "IT", "Quality", "Compliance", "Marketing"],
    roles: ["Executive Director", "Operations Manager", "Client Success Manager", "Finance Manager", "HR Director", "IT Lead", "Quality Analyst", "Marketing Manager"],
    workflowTypes: ["Intake & Onboarding", "Service Delivery", "Quality Review", "Billing & Collections", "Compliance Audit", "Reporting", "Client Offboarding", "Process Improvement"],
    documentTypes: ["Intake Form", "Service Agreement", "Quality Report", "Invoice", "Compliance Checklist", "Status Report", "Offboarding Packet", "Process Document"],
    kpiLabels: ["Active Cases", "Throughput Rate", "Quality Score", "On-Time Delivery Rate", "Revenue Per Case", "Compliance Rate", "Client Satisfaction", "Staff Utilization"],
    scenarioTypes: ["Volume Surge", "Staff Shortage", "Compliance Audit", "System Outage", "Key Client Loss", "Regulatory Change", "Budget Reduction"],
  },
};

export function getIndustryConfig(industryId: string): IndustryConfig {
  return INDUSTRY_CONFIGS[industryId as IndustryId] ?? INDUSTRY_CONFIGS.generic;
}

export function getAllIndustries(): IndustryConfig[] {
  return Object.values(INDUSTRY_CONFIGS);
}

// ─── Global Regions ──────────────────────────────────────────────────────────
// Organized by region group. Displayed in the FiltersPanel region dropdown.
// "state" field name retained internally for backwards compatibility.

export interface RegionGroup {
  group: string;
  regions: string[];
}

export const GLOBAL_REGION_GROUPS: RegionGroup[] = [
  {
    group: "🇺🇸 United States",
    regions: [
      "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
      "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
      "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
      "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
      "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
      "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
      "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
      "Wisconsin","Wyoming","Washington D.C.","Puerto Rico","Guam","U.S. Virgin Islands",
    ],
  },
  {
    group: "🇨🇦 Canada",
    regions: [
      "Alberta","British Columbia","Manitoba","New Brunswick",
      "Newfoundland and Labrador","Northwest Territories","Nova Scotia","Nunavut",
      "Ontario","Prince Edward Island","Quebec","Saskatchewan","Yukon",
    ],
  },
  {
    group: "🇬🇧 United Kingdom",
    regions: ["England","Scotland","Wales","Northern Ireland"],
  },
  {
    group: "🇪🇺 European Union",
    regions: [
      "Austria","Belgium","Bulgaria","Croatia","Cyprus","Czech Republic","Denmark",
      "Estonia","Finland","France","Germany","Greece","Hungary","Ireland","Italy",
      "Latvia","Lithuania","Luxembourg","Malta","Netherlands","Poland","Portugal",
      "Romania","Slovakia","Slovenia","Spain","Sweden",
    ],
  },
  {
    group: "🌏 Asia-Pacific",
    regions: [
      "Australia — New South Wales","Australia — Queensland","Australia — Victoria",
      "Australia — Western Australia","New Zealand","Singapore","Japan","South Korea",
      "India — Maharashtra","India — Karnataka","India — Delhi NCR",
      "Hong Kong","Taiwan","Philippines","Malaysia","Indonesia","Thailand",
    ],
  },
  {
    group: "🌎 Latin America",
    regions: [
      "Brazil — São Paulo","Brazil — Rio de Janeiro","Mexico — Mexico City",
      "Mexico — Monterrey","Argentina — Buenos Aires","Colombia — Bogotá",
      "Chile — Santiago","Peru — Lima","Costa Rica","Panama",
    ],
  },
  {
    group: "🌍 Middle East & Africa",
    regions: [
      "United Arab Emirates","Saudi Arabia","Qatar","Israel","Jordan",
      "South Africa — Gauteng","South Africa — Western Cape","Nigeria — Lagos",
      "Kenya — Nairobi","Egypt — Cairo",
    ],
  },
  {
    group: "🌐 Global / Remote",
    regions: [
      "Global — Remote First","Global — Multiple Locations","International Operations",
    ],
  },
];

// Flat list for backwards-compatible uses
export const US_STATES: string[] = GLOBAL_REGION_GROUPS
  .find(g => g.group.includes("United States"))?.regions ?? [];

// Full flat list for any use that needs all regions
export const ALL_REGIONS: string[] = GLOBAL_REGION_GROUPS.flatMap(g => g.regions);

export const ORG_TYPES = [
  "Small Business (1-50)", "Mid-Size (51-250)", "Large Enterprise (251-1000)",
  "Corporation (1000+)", "Government Agency", "Non-Profit Organization",
  "Startup / Early Stage", "Franchise / Multi-Location", "Global Corporation",
];

export type PlatformMode = "demo" | "test" | "simulation";

export interface UserProfile {
  email: string;
  orgName: string;
  state: string;
  industry: IndustryId;
  role: string;
  department: string;
  orgType: string;
  ndaAccepted: boolean;
}

export interface PlatformFilters {
  state: string;
  industry: IndustryId;
  role: string;
  department: string;
  orgType: string;
}

export const DEFAULT_FILTERS: PlatformFilters = {
  state: "California",
  industry: "healthcare",
  role: "",
  department: "",
  orgType: "",
};
