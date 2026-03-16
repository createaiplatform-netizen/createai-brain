// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL MOCK DATA ENGINE
// Covers ALL industries, ALL roles, ALL domains. INTERNAL + DEMO ONLY.
// No real data. No real organizations. All fictional & non-operational.
// ═══════════════════════════════════════════════════════════════════════════

export interface IndustryDefinition {
  id:          string;
  label:       string;
  icon:        string;
  color:       string;
  domains:     string[];
  roles:       string[];
  departments: string[];
  workflows:   string[];
  programs:    string[];
  vendors:     string[];
  regulations: string[];
  scenarios:   string[];
}

// ─── Industry Library ─────────────────────────────────────────────────────

export const UNIVERSAL_INDUSTRIES: IndustryDefinition[] = [
  {
    id: "healthcare", label: "Healthcare", icon: "🏥", color: "#007AFF",
    domains: ["Clinical", "Behavioral Health", "Public Health", "Pharmacy", "Home Health", "Long-Term Care"],
    roles: ["Physician", "Nurse Practitioner", "Care Coordinator", "Medical Coder", "Compliance Officer", "CMO", "Clinical Lead"],
    departments: ["Clinical", "Billing", "Compliance", "Quality", "Patient Services", "Pharmacy", "Administration"],
    workflows: ["Patient Intake", "Prior Authorization", "Care Plan Development", "Claims Submission", "Quality Reporting", "Discharge Planning"],
    programs: ["Medicaid Managed Care", "ACO", "CCBHC", "Value-Based Care", "PCMH", "1115 Waiver"],
    vendors: ["Nexus Health EHR", "ClaimStream Processing", "CareBridge Solutions", "MediLink Interop", "TeleMedi Connect"],
    regulations: ["HIPAA", "HITECH", "CMS Conditions of Participation", "ADA/WCAG", "SOC 2"],
    scenarios: ["Patient admitted for chronic condition", "Prior auth denied — appeal initiated", "Annual wellness visit scheduled", "HEDIS measure gap identified"],
  },
  {
    id: "human-services", label: "Human Services", icon: "🤝", color: "#34C759",
    domains: ["Child Welfare", "Family Services", "Aging Services", "Housing", "Employment Support", "Crisis Services"],
    roles: ["Case Manager", "Social Worker", "Intake Specialist", "Program Director", "Benefits Navigator", "Foster Care Coordinator"],
    departments: ["Intake", "Family Services", "Benefits", "Crisis Response", "Foster Care", "Aging & Disability"],
    workflows: ["Intake Assessment", "Case Plan Creation", "Benefits Enrollment", "Home Visit", "Safety Assessment", "Case Closure"],
    programs: ["TANF", "SNAP Administration", "Title IV-E Foster Care", "SSBG", "Community Development Block Grant"],
    vendors: ["CaseWorthy Platform", "Penelope Case Mgmt", "Social Solutions ETO", "Apricot by Bonterra", "Un1ty Platform"],
    regulations: ["HIPAA (Limited)", "FERPA", "Title IV-E", "CAPTA", "ADA"],
    scenarios: ["New family referred by school", "Foster placement disruption", "Elder abuse report filed", "Benefits application submitted"],
  },
  {
    id: "government", label: "Government / Public Sector", icon: "🏛️", color: "#5856D6",
    domains: ["Federal", "State", "County", "Municipal", "Tribal", "Defense", "Public Safety"],
    roles: ["Program Officer", "Grant Manager", "Policy Analyst", "Contracting Officer", "Agency Director", "Budget Analyst"],
    departments: ["Policy", "Procurement", "Budget", "Legal", "Communications", "IT", "Compliance"],
    workflows: ["Grant Application", "Contract Award", "Policy Review", "Budget Cycle", "FOIA Request", "Audit Response"],
    programs: ["CDBG", "AmeriCorps", "Title I Education", "Workforce Innovation", "Emergency Management", "Infrastructure Program"],
    vendors: ["Salesforce Government Cloud", "Tyler Technologies", "Granicus", "ServiceNow Gov", "Carahsoft Platform"],
    regulations: ["FAR/DFARS", "CFR Title 2", "FISMA", "FedRAMP", "Open Government Act"],
    scenarios: ["Grant disbursement delayed", "Emergency procurement initiated", "Public comment period open", "Inspector general audit launched"],
  },
  {
    id: "education", label: "Education", icon: "🎓", color: "#FF9500",
    domains: ["K-12", "Higher Education", "Vocational", "Special Education", "Adult Learning", "Early Childhood"],
    roles: ["Teacher", "Principal", "District Administrator", "Curriculum Designer", "Special Ed Coordinator", "Financial Aid Officer"],
    departments: ["Curriculum", "Student Services", "Finance", "HR", "Special Education", "Technology", "Athletics"],
    workflows: ["Student Enrollment", "IEP Development", "Curriculum Review", "Faculty Hiring", "Accreditation Prep", "Budget Allocation"],
    programs: ["Title I", "IDEA", "Head Start", "Pell Grant", "Work-Study", "STEM Initiative", "Dual Enrollment"],
    vendors: ["Blackboard LMS", "Canvas LMS", "PowerSchool SIS", "Schoology", "Infinite Campus", "Naviance"],
    regulations: ["FERPA", "IDEA", "Title IX", "Section 504", "CIPA", "Every Student Succeeds Act"],
    scenarios: ["Student with IEP transitioning to new grade", "Title I school improvement plan", "Accreditation self-study due", "Campus emergency drill"],
  },
  {
    id: "finance", label: "Finance & Banking", icon: "💰", color: "#FFD60A",
    domains: ["Retail Banking", "Investment", "Insurance", "Wealth Management", "Risk", "Compliance", "FinTech"],
    roles: ["Financial Advisor", "Risk Analyst", "Compliance Officer", "Loan Officer", "Portfolio Manager", "CFO", "Auditor"],
    departments: ["Risk", "Compliance", "Treasury", "Lending", "Wealth Mgmt", "Operations", "Finance"],
    workflows: ["Loan Origination", "KYC/AML Review", "Trade Settlement", "Audit Cycle", "Risk Assessment", "Account Opening"],
    programs: ["CRA Requirements", "Basel III Compliance", "Dodd-Frank Reporting", "FDIC Insurance Review"],
    vendors: ["Fiserv Platform", "Finastra Core Banking", "nCino LOS", "Bloomberg Terminal", "Moody's Analytics"],
    regulations: ["SOX", "BSA/AML", "FINRA/SEC", "GDPR (EU Clients)", "CFPB Regulations", "Basel III"],
    scenarios: ["Suspicious transaction flagged", "Quarterly earnings report", "Regulatory exam initiated", "New product launch review"],
  },
  {
    id: "technology", label: "Technology", icon: "💻", color: "#32ADE6",
    domains: ["SaaS", "Enterprise Software", "Cloud", "Cybersecurity", "AI/ML", "DevOps", "Hardware"],
    roles: ["Software Engineer", "Product Manager", "DevOps Engineer", "Data Scientist", "Security Analyst", "CTO", "UX Designer"],
    departments: ["Engineering", "Product", "Design", "Data", "Security", "Sales Engineering", "Customer Success"],
    workflows: ["Sprint Planning", "Code Review", "Release Deployment", "Incident Response", "Product Launch", "Security Audit"],
    programs: ["SOC 2 Audit", "ISO 27001", "Bug Bounty Program", "Agile Transformation", "Cloud Migration"],
    vendors: ["AWS", "Azure", "GitHub Enterprise", "Datadog", "Jira", "Confluence", "Snowflake"],
    regulations: ["GDPR", "CCPA", "SOC 2", "ISO 27001", "FedRAMP", "HIPAA (Health Tech)"],
    scenarios: ["Production outage at 2am", "Major feature launch delayed", "Security breach detected", "SOC 2 audit starting"],
  },
  {
    id: "nonprofit", label: "Nonprofit & NGO", icon: "❤️", color: "#FF2D55",
    domains: ["Social Services", "Advocacy", "International Development", "Arts & Culture", "Faith-Based", "Environmental"],
    roles: ["Executive Director", "Development Officer", "Program Manager", "Grant Writer", "Volunteer Coordinator", "Board Member"],
    departments: ["Development", "Programs", "Finance", "Communications", "Volunteer Mgmt", "HR", "Board"],
    workflows: ["Grant Writing", "Donor Cultivation", "Program Evaluation", "Event Planning", "Impact Reporting", "Board Meeting"],
    programs: ["United Way Partnership", "Community Impact Fund", "HUD Funding", "Foundation Grant", "Corporate Sponsorship"],
    vendors: ["Salesforce Nonprofit", "Bloomerang CRM", "DonorPerfect", "GrantStation", "Apricot by Bonterra"],
    regulations: ["IRS Form 990", "State Charitable Registration", "Uniform Guidance", "GDPR (International)", "Employment Law"],
    scenarios: ["Major donor lapsed", "Federal grant reporting due", "Board conflict of interest", "Annual gala planning"],
  },
  {
    id: "retail", label: "Retail & E-Commerce", icon: "🛍️", color: "#FF6B6B",
    domains: ["Brick & Mortar", "E-Commerce", "Omnichannel", "Luxury", "Grocery", "Wholesale", "Direct-to-Consumer"],
    roles: ["Store Manager", "Merchandiser", "Buyer", "Loss Prevention", "E-Commerce Manager", "Customer Experience Lead", "Supply Chain Lead"],
    departments: ["Buying", "Merchandising", "Operations", "E-Commerce", "Loss Prevention", "Customer Experience", "Supply Chain"],
    workflows: ["Inventory Replenishment", "Product Launch", "Returns Processing", "Seasonal Planning", "Vendor Negotiation", "Markdown Execution"],
    programs: ["Loyalty Program", "Vendor Compliance Program", "Private Label Initiative", "BOPIS (Buy Online Pickup In Store)", "Omnichannel Strategy"],
    vendors: ["Shopify Enterprise", "SAP Retail", "Manhattan Associates", "Salesforce Commerce", "Oracle Retail"],
    regulations: ["PCI DSS", "Consumer Protection Laws", "ADA (Physical + Digital)", "CCPA", "FTC Guidelines"],
    scenarios: ["Flash sale traffic spike", "Vendor shipment delay", "Holiday staffing shortage", "Product recall initiated"],
  },
  {
    id: "manufacturing", label: "Manufacturing", icon: "🏭", color: "#8E8E93",
    domains: ["Automotive", "Aerospace", "Food & Beverage", "Pharma Manufacturing", "Electronics", "Industrial", "Consumer Goods"],
    roles: ["Plant Manager", "Quality Engineer", "Operations Manager", "Safety Officer", "Supply Chain Manager", "Production Supervisor"],
    departments: ["Production", "Quality", "Safety", "Supply Chain", "Maintenance", "Engineering", "R&D"],
    workflows: ["Production Planning", "Quality Inspection", "OSHA Safety Audit", "Supplier Qualification", "Equipment Maintenance", "ISO Audit"],
    programs: ["Lean Manufacturing", "Six Sigma", "ISO 9001", "Kaizen Initiative", "ERP Implementation"],
    vendors: ["SAP Manufacturing", "Oracle ERP", "Rockwell Automation", "Siemens Digital Industries", "PTC ThingWorx"],
    regulations: ["OSHA", "EPA", "FDA (Pharma/Food)", "ISO 9001", "ISO 14001", "REACH (EU)"],
    scenarios: ["Line stoppage at peak production", "Supplier quality failure", "OSHA inspection notice", "New product line launch"],
  },
  {
    id: "logistics", label: "Logistics & Supply Chain", icon: "🚚", color: "#FF9500",
    domains: ["Freight", "Last-Mile Delivery", "Warehousing", "Cold Chain", "Customs/Trade", "Fleet Management"],
    roles: ["Logistics Coordinator", "Warehouse Manager", "Fleet Manager", "Customs Broker", "Procurement Lead", "Transport Planner"],
    departments: ["Transportation", "Warehousing", "Customs", "Procurement", "Fleet", "Last Mile", "Operations"],
    workflows: ["Shipment Booking", "Warehouse Receiving", "Customs Clearance", "Route Optimization", "Returns Management", "Fleet Scheduling"],
    programs: ["C-TPAT Program", "Lean Warehousing", "Just-in-Time Delivery", "Reverse Logistics Program"],
    vendors: ["Oracle TMS", "SAP TM", "FedEx Enterprise", "Project44", "Flexport", "Manhattan WMS"],
    regulations: ["FMCSA", "DOT", "CBP/Trade Regulations", "IATA (Air Freight)", "Hazmat Regulations"],
    scenarios: ["Port congestion delay", "Driver shortage", "Cold chain temperature excursion", "Customs hold on shipment"],
  },
  {
    id: "hospitality", label: "Hospitality & Tourism", icon: "🏨", color: "#BF5AF2",
    domains: ["Hotels", "Restaurants", "Events", "Tourism", "Cruise", "Airlines", "Vacation Rental"],
    roles: ["General Manager", "Revenue Manager", "Front Office Manager", "Food & Beverage Director", "Event Coordinator", "Concierge"],
    departments: ["Front Office", "Housekeeping", "F&B", "Events", "Revenue Management", "Marketing", "HR"],
    workflows: ["Guest Check-in", "Event Setup", "Room Inspection", "Revenue Forecasting", "Staff Scheduling", "Guest Complaint Resolution"],
    programs: ["Loyalty Rewards Program", "Revenue Management Initiative", "Sustainability Program", "Brand Standards Audit"],
    vendors: ["Oracle Hospitality OPERA", "Amadeus Property Mgmt", "Revinate CRM", "IDeaS Revenue Solutions", "HotSOS"],
    regulations: ["ADA", "Food Safety (HACCP)", "Fire Safety Codes", "Labor Law", "Privacy (CCPA/GDPR)"],
    scenarios: ["Group booking cancellation", "Peak season overbook", "Health inspection alert", "VIP guest complaint"],
  },
  {
    id: "construction", label: "Construction & Real Estate", icon: "🏗️", color: "#FF6B6B",
    domains: ["Commercial Construction", "Residential", "Infrastructure", "Property Management", "Development", "Architecture"],
    roles: ["Project Manager", "Site Superintendent", "Architect", "Estimator", "Safety Officer", "Subcontractor Manager", "Property Manager"],
    departments: ["Project Management", "Estimating", "Safety", "Subcontractor Mgmt", "Architecture", "Property Mgmt", "Finance"],
    workflows: ["Project Bidding", "Permit Application", "Site Safety Inspection", "Change Order Processing", "Subcontractor Onboarding", "Project Closeout"],
    programs: ["LEED Certification", "OSHA 30 Training", "BIM Implementation", "Lean Construction", "Green Building Initiative"],
    vendors: ["Procore Project Mgmt", "PlanGrid", "Autodesk BIM 360", "Bluebeam", "Viewpoint Spectrum"],
    regulations: ["OSHA Construction Standards", "IBC (International Building Code)", "ADA", "EPA (Environmental)", "Local Building Codes"],
    scenarios: ["Permit delay causing schedule slip", "Subcontractor dispute", "OSHA violation found", "Change order dispute with owner"],
  },
  {
    id: "energy", label: "Energy & Utilities", icon: "⚡", color: "#FFD60A",
    domains: ["Electric Utility", "Oil & Gas", "Renewable Energy", "Nuclear", "Water Utility", "Natural Gas"],
    roles: ["Grid Operator", "Field Technician", "Environmental Engineer", "Regulatory Affairs Lead", "Asset Manager", "Operations Engineer"],
    departments: ["Operations", "Engineering", "Environmental", "Regulatory", "Asset Management", "Safety", "Customer Service"],
    workflows: ["Outage Management", "Permit to Work", "Environmental Impact Assessment", "Rate Case Filing", "Asset Inspection", "Emergency Response"],
    programs: ["Renewable Portfolio Standard", "Energy Efficiency Program", "Grid Modernization Initiative", "Carbon Reduction Plan"],
    vendors: ["Siemens Energy", "GE Grid Solutions", "OSIsoft PI System", "IBM Maximo", "eSuite EAM", "Itron Metering"],
    regulations: ["NERC CIP", "EPA Clean Air Act", "FERC", "NRC (Nuclear)", "State PUC Regulations"],
    scenarios: ["Grid emergency event", "Regulatory rate case hearing", "Renewable integration issue", "Environmental spill reported"],
  },
  {
    id: "insurance", label: "Insurance", icon: "🛡️", color: "#30B0C7",
    domains: ["Property & Casualty", "Life & Annuity", "Health Insurance", "Specialty Lines", "Reinsurance", "Brokerage"],
    roles: ["Underwriter", "Claims Adjuster", "Actuary", "Broker", "Risk Manager", "Compliance Officer", "Policy Analyst"],
    departments: ["Underwriting", "Claims", "Actuarial", "Distribution", "Risk", "Compliance", "Finance"],
    workflows: ["Policy Issuance", "Claims Processing", "Loss Adjustment", "Renewal Review", "Regulatory Filing", "Fraud Investigation"],
    programs: ["State Regulatory Exam", "Actuarial Review Cycle", "Anti-Fraud Initiative", "Digital Claims Transformation"],
    vendors: ["Guidewire PolicyCenter", "Majesco", "Duck Creek Technologies", "Verisk Analytics", "ISO ClaimSearch"],
    regulations: ["NAIC Model Laws", "State Insurance Regulations", "ACA (Health)", "GDPR (EU Clients)", "Solvency II (EU)"],
    scenarios: ["Catastrophic weather claim surge", "Fraudulent claim detected", "Regulatory market conduct exam", "Reinsurance treaty renewal"],
  },
  {
    id: "hr-workforce", label: "HR & Workforce", icon: "👥", color: "#34C759",
    domains: ["Talent Acquisition", "Learning & Development", "Compensation", "Employee Relations", "DEIB", "Payroll", "Workforce Planning"],
    roles: ["CHRO", "Recruiter", "L&D Manager", "Compensation Analyst", "HR Business Partner", "Payroll Manager", "EEO Officer"],
    departments: ["Talent Acquisition", "L&D", "Compensation", "HRBP", "Payroll", "DEIB", "Employee Relations"],
    workflows: ["Job Requisition", "Interview Process", "Onboarding", "Performance Review", "Compensation Planning", "Termination"],
    programs: ["Leadership Development Program", "DEIB Initiative", "Employee Wellness Program", "Succession Planning", "Compliance Training"],
    vendors: ["Workday HCM", "ADP Workforce", "Greenhouse ATS", "Cornerstone LMS", "Lattice Performance", "BambooHR"],
    regulations: ["FLSA", "FMLA", "EEOC", "ADA", "OSHA (Workplace Safety)", "WARN Act"],
    scenarios: ["Layoff planning", "EEOC charge filed", "New HRIS implementation", "Annual compensation review"],
  },
  {
    id: "marketing", label: "Marketing & Advertising", icon: "📣", color: "#FF2D55",
    domains: ["Digital Marketing", "Brand Strategy", "Content Marketing", "Performance Marketing", "PR", "Events", "Creative"],
    roles: ["CMO", "Brand Manager", "Content Strategist", "Paid Media Manager", "SEO Specialist", "Creative Director", "Analytics Manager"],
    departments: ["Brand", "Digital", "Content", "Performance", "PR", "Creative", "Analytics"],
    workflows: ["Campaign Planning", "Content Creation", "Ad Launch", "A/B Testing", "Campaign Reporting", "Brand Audit"],
    programs: ["Brand Refresh Initiative", "Marketing Automation Implementation", "Account-Based Marketing", "Voice of Customer Program"],
    vendors: ["HubSpot", "Marketo", "Salesforce Marketing Cloud", "Google Ads", "Meta Business Suite", "Hootsuite"],
    regulations: ["CAN-SPAM", "GDPR (Email)", "CCPA", "FTC Endorsement Guidelines", "Cookie Consent Laws"],
    scenarios: ["Campaign underperforming", "Brand crisis on social media", "New product launch campaign", "Agency contract renewal"],
  },
  {
    id: "legal-compliance", label: "Legal & Compliance", icon: "⚖️", color: "#636366",
    domains: ["Corporate Law", "Compliance", "Regulatory Affairs", "Litigation", "IP", "Privacy", "Employment Law"],
    roles: ["General Counsel", "Compliance Manager", "Regulatory Affairs Specialist", "Privacy Officer", "Legal Analyst", "Paralegal"],
    departments: ["Legal", "Compliance", "Regulatory Affairs", "Privacy", "IP", "Contracts", "Litigation Support"],
    workflows: ["Contract Review", "Regulatory Filing", "Compliance Audit", "Litigation Hold", "Privacy Impact Assessment", "Policy Update"],
    programs: ["Ethics & Compliance Program", "Third-Party Risk Management", "Privacy Program", "Regulatory Calendar Management"],
    vendors: ["Relativity eDiscovery", "Thomson Reuters Practical Law", "Navex Ethics Point", "OneTrust Privacy", "Ironclad CLM"],
    regulations: ["GDPR", "CCPA", "SOX", "FCPA", "Dodd-Frank", "Industry-Specific Regulations"],
    scenarios: ["Regulatory investigation opened", "Contract dispute escalated", "Data breach response", "M&A due diligence"],
  },
  {
    id: "emergency-services", label: "Emergency Services", icon: "🚨", color: "#FF3B30",
    domains: ["Law Enforcement", "Fire & Rescue", "Emergency Medical", "Dispatch", "Emergency Management", "Homeland Security"],
    roles: ["Chief", "Captain", "Dispatcher", "Emergency Manager", "Paramedic", "Fire Inspector", "Public Safety Analyst"],
    departments: ["Patrol", "Fire Suppression", "EMS", "Dispatch", "Training", "Emergency Management", "Community Liaison"],
    workflows: ["Incident Response", "Dispatch Call", "After-Action Review", "Training Drill", "Mutual Aid Request", "Mass Casualty Incident"],
    programs: ["NIMS/ICS Compliance", "Community Policing Initiative", "Fire Prevention Program", "Mass Casualty Plan"],
    vendors: ["Motorola Solutions", "Tyler New World", "Axon Enterprise", "ImageTrend", "ESO Solutions"],
    regulations: ["NIMS", "OSHA Emergency Services", "HIPAA (EMS)", "State POST Requirements", "NFPA Standards"],
    scenarios: ["Multi-vehicle accident response", "Structure fire", "Active threat incident", "Natural disaster activation"],
  },
  {
    id: "creative-media", label: "Creative & Media", icon: "🎬", color: "#BF5AF2",
    domains: ["Film & TV", "Digital Content", "Publishing", "Music", "Gaming", "Podcasting", "Live Events", "Animation"],
    roles: ["Executive Producer", "Creative Director", "Editor", "Writer", "Animator", "Sound Designer", "Art Director"],
    departments: ["Production", "Post-Production", "Creative", "Distribution", "Marketing", "Legal/Rights", "Finance"],
    workflows: ["Pre-Production Planning", "Script Development", "Production Shoot", "Post-Production Edit", "Distribution Planning", "Rights Clearance"],
    programs: ["Content Licensing Program", "Co-Production Partnership", "Original Content Initiative", "Syndication Strategy"],
    vendors: ["Adobe Creative Cloud", "Final Cut Pro", "Avid Media Composer", "DaVinci Resolve", "Frame.io", "Celtx"],
    regulations: ["SAG-AFTRA Agreements", "Copyright Law", "FCC (Broadcasting)", "GDPR (European Co-Productions)", "MPAA Ratings"],
    scenarios: ["Post-production deadline crunch", "Script revisions after pilot screening", "Distribution deal negotiation", "Content rights dispute"],
  },
  {
    id: "research-science", label: "Research & Science", icon: "🔬", color: "#32ADE6",
    domains: ["Clinical Research", "Biotech", "Academic Research", "Market Research", "Social Science", "Environmental Science"],
    roles: ["Principal Investigator", "Research Coordinator", "Biostatistician", "IRB Reviewer", "Lab Manager", "Data Analyst", "Research Scientist"],
    departments: ["Research", "Biostatistics", "IRB", "Lab Operations", "Data Science", "Regulatory Affairs", "Grants Management"],
    workflows: ["IRB Submission", "Study Protocol Development", "Data Collection", "Statistical Analysis", "Publication Submission", "Grant Reporting"],
    programs: ["NIH Grant Management", "Clinical Trial Phase I-IV", "FDA Investigational Device Exemption", "IRB Continuing Review"],
    vendors: ["Medidata Rave (EDC)", "Veeva Vault", "REDCap", "SPSS", "SAS Analytics", "LabArchives"],
    regulations: ["FDA 21 CFR", "ICH GCP", "HIPAA (Research)", "Common Rule (45 CFR 46)", "GDPR (EU Studies)"],
    scenarios: ["Protocol deviation detected", "IRB approval pending", "Data lock preparation", "Adverse event reporting"],
  },
];

// ─── Countries ────────────────────────────────────────────────────────────

export const UNIVERSAL_COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany", "France",
  "Japan", "South Korea", "India", "Brazil", "Mexico", "Netherlands", "Sweden",
  "Norway", "Denmark", "Switzerland", "Austria", "Spain", "Italy", "Portugal",
  "New Zealand", "Singapore", "South Africa", "Nigeria", "Kenya", "Ghana",
  "Argentina", "Chile", "Colombia", "Peru", "Israel", "UAE", "Saudi Arabia",
  "Philippines", "Thailand", "Vietnam", "Indonesia", "Poland", "Czech Republic",
  "Hungary", "Romania", "Ukraine", "Egypt", "Morocco", "Ethiopia",
];

// ─── Domains ──────────────────────────────────────────────────────────────

export const UNIVERSAL_DOMAINS = [
  "Operations", "Compliance", "Clinical", "Financial", "Technical", "Creative",
  "Research", "Policy", "Training", "Customer Experience", "Risk Management",
  "Sales", "Marketing", "HR", "Legal", "Quality Assurance", "Data & Analytics",
  "Product", "Engineering", "Community", "Advocacy", "Environment", "Safety",
];

// ─── Platform Modes ───────────────────────────────────────────────────────

export const UNIVERSAL_MODES = [
  { id: "demo",       label: "Demo Mode",           icon: "🎭", description: "Safe fictional interactions only" },
  { id: "training",   label: "Training Mode",        icon: "🎓", description: "Guided learning with test mode active" },
  { id: "simulation", label: "Simulation Mode",      icon: "🔬", description: "Full workflow simulation with mock outcomes" },
  { id: "blueprint",  label: "Blueprint Mode",       icon: "🏗️", description: "Design-only — view API, data, regulatory blueprints" },
  { id: "creative",   label: "Creative Production",  icon: "🎬", description: "Generate production packages and scripts" },
];

// ─── Scenarios ────────────────────────────────────────────────────────────

export const UNIVERSAL_SCENARIOS = [
  { id: "s-onboarding",    label: "New User Onboarding",         industry: "any" },
  { id: "s-audit",         label: "Regulatory Audit In Progress", industry: "any" },
  { id: "s-crisis",        label: "Crisis / Emergency Response",  industry: "any" },
  { id: "s-launch",        label: "New Product / Program Launch", industry: "any" },
  { id: "s-review",        label: "Annual Review Cycle",          industry: "any" },
  { id: "s-migration",     label: "System Migration",             industry: "technology" },
  { id: "s-breach",        label: "Data Breach Response",         industry: "technology" },
  { id: "s-claim",         label: "Major Claims Event",           industry: "insurance" },
  { id: "s-incident",      label: "Patient Safety Incident",      industry: "healthcare" },
  { id: "s-recall",        label: "Product Recall",               industry: "manufacturing" },
  { id: "s-filing",        label: "Regulatory Filing Due",        industry: "finance" },
  { id: "s-election",      label: "Grant Cycle Opening",          industry: "nonprofit" },
  { id: "s-disaster",      label: "Natural Disaster Activation",  industry: "emergency-services" },
  { id: "s-premiere",      label: "Content Premiere / Launch",    industry: "creative-media" },
  { id: "s-trial",         label: "Clinical Trial Phase Advance",  industry: "research-science" },
];

// ─── Universal Role Library ───────────────────────────────────────────────

export const UNIVERSAL_ROLES = [
  // Leadership
  "CEO", "COO", "CFO", "CMO", "CTO", "CHRO", "CLO", "CPO",
  "Executive Director", "Managing Director", "President", "Vice President",
  "Board Member", "Program Director", "Department Head", "Division Lead",
  // Operations
  "Operations Manager", "Project Manager", "Program Manager", "Coordinator",
  "Analyst", "Specialist", "Administrator", "Supervisor", "Team Lead",
  // Technical
  "Software Engineer", "Data Engineer", "DevOps Engineer", "Security Analyst",
  "Data Scientist", "IT Manager", "Systems Architect", "QA Engineer",
  // Clinical / Human Services
  "Physician", "Nurse Practitioner", "Social Worker", "Case Manager",
  "Counselor", "Therapist", "Pharmacist", "Dietitian", "Physical Therapist",
  // Finance
  "Financial Analyst", "Accountant", "Auditor", "Controller", "Treasurer",
  "Underwriter", "Actuary", "Loan Officer", "Risk Manager", "Budget Analyst",
  // Creative
  "Creative Director", "Designer", "Writer", "Editor", "Producer",
  "Content Strategist", "Art Director", "Animator", "Sound Designer",
  // Compliance / Legal
  "Compliance Officer", "General Counsel", "Privacy Officer", "Paralegal",
  "Regulatory Affairs Lead", "Ethics Officer", "Contract Manager",
  // Customer / Community
  "Customer Success Manager", "Account Manager", "Community Liaison",
  "Public Affairs Officer", "Grant Writer", "Volunteer Coordinator",
];

// ─── Universal Department Library ─────────────────────────────────────────

export const UNIVERSAL_DEPARTMENTS = [
  "Executive", "Operations", "Finance", "Accounting", "Legal", "Compliance",
  "HR", "IT", "Engineering", "Product", "Design", "Research & Development",
  "Sales", "Marketing", "Customer Success", "Business Development",
  "Communications / PR", "Strategy", "Risk Management", "Quality Assurance",
  "Procurement / Supply Chain", "Facilities", "Security", "Data & Analytics",
  "Clinical", "Patient Services", "Social Services", "Education", "Training",
  "Environmental, Health & Safety", "Government Affairs", "Grants Management",
];

// ─── Universal Vendor Library ─────────────────────────────────────────────

export const UNIVERSAL_VENDORS = [
  // Platform / Cloud
  { id: "aws", label: "AWS", category: "Cloud" },
  { id: "azure", label: "Microsoft Azure", category: "Cloud" },
  { id: "gcp", label: "Google Cloud Platform", category: "Cloud" },
  { id: "salesforce", label: "Salesforce", category: "CRM" },
  { id: "servicenow", label: "ServiceNow", category: "ITSM" },
  { id: "workday", label: "Workday", category: "HCM/Finance" },
  { id: "sap", label: "SAP", category: "ERP" },
  { id: "oracle", label: "Oracle Cloud", category: "ERP/CX" },
  { id: "hubspot", label: "HubSpot", category: "Marketing/CRM" },
  { id: "zendesk", label: "Zendesk", category: "Customer Support" },
  // Security
  { id: "crowdstrike", label: "CrowdStrike", category: "Security" },
  { id: "okta", label: "Okta", category: "Identity" },
  { id: "splunk", label: "Splunk", category: "SIEM/Analytics" },
  { id: "palo-alto", label: "Palo Alto Networks", category: "Security" },
  // Data
  { id: "snowflake", label: "Snowflake", category: "Data Warehouse" },
  { id: "databricks", label: "Databricks", category: "Data & AI" },
  { id: "tableau", label: "Tableau", category: "BI/Analytics" },
  { id: "power-bi", label: "Power BI", category: "BI/Analytics" },
  // Compliance / GRC
  { id: "onetrust", label: "OneTrust", category: "Privacy/Compliance" },
  { id: "navex", label: "Navex EthicsPoint", category: "Ethics/Compliance" },
];

// ─── Lookup Helpers ───────────────────────────────────────────────────────

export function getIndustry(id: string): IndustryDefinition | undefined {
  return UNIVERSAL_INDUSTRIES.find(i => i.id === id);
}

export function getIndustriesByDomain(domain: string): IndustryDefinition[] {
  return UNIVERSAL_INDUSTRIES.filter(i =>
    i.domains.some(d => d.toLowerCase().includes(domain.toLowerCase()))
  );
}

export function searchIndustries(query: string): IndustryDefinition[] {
  const q = query.toLowerCase();
  return UNIVERSAL_INDUSTRIES.filter(i =>
    i.label.toLowerCase().includes(q) ||
    i.domains.some(d => d.toLowerCase().includes(q)) ||
    i.roles.some(r => r.toLowerCase().includes(q))
  );
}

export function getRolesForIndustry(industryId: string): string[] {
  const ind = getIndustry(industryId);
  return ind ? ind.roles : UNIVERSAL_ROLES.slice(0, 10);
}

export function getScenariosForIndustry(industryId: string): { id: string; label: string; industry: string }[] {
  return UNIVERSAL_SCENARIOS.filter(s => s.industry === "any" || s.industry === industryId);
}
