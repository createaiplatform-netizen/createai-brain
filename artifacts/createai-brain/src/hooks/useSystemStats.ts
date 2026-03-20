import { useState, useEffect, useCallback } from "react";

// ─── Mission config types ─────────────────────────────────────────────────────

export interface MissionPhase {
  id:                  string;
  label:               string;
  description:         string;
  settings:            Record<string, boolean | string | string[]>;
  status:              "active" | "standby" | "enforced";
  activeSettingCount:  number;
  enabledSettingCount: number;
}

export interface MissionConfig {
  version:     string;
  deployedFor: string;
  goal:        string;
  phases:      MissionPhase[];
  activeAt:    string;
  retrievedAt: string;
  enforcedBy:  string;
  loopTick:    number;
}

// ─── Brain enforcement types ─────────────────────────────────────────────────

export interface ExpansionEntry {
  id: string; tick: number; timestamp: string;
  action: string; category: string;
  status: "applied" | "pending" | "verified";
}

export interface MetaPrediction {
  id: string; prediction: string; confidence: number;
  category: string; basis: string; generatedAt: string;
  status: "pending" | "validated" | "integrated";
}

export interface KnowledgeSource {
  name: string; type: "internal" | "api" | "dataset" | "log";
  status: "active" | "degraded" | "offline";
  lastSynced: string; nodes: number;
}

export interface OptimizationEntry {
  area: string; score: number; note: string;
}

export interface BrainStatus {
  loopTick:      number;
  lastAuditAt:   string;
  nextAuditAt:   string;
  coverage:      number;
  coverageBreakdown: Record<string, number>;
  expansionLog:  ExpansionEntry[];
  metaPredictions: MetaPrediction[];
  knowledgeSources: KnowledgeSource[];
  optimization:  OptimizationEntry[];
  auditSummary: {
    industries:  { total: number; covered: number; gaps: number };
    renderModes: { total: number; covered: number; gaps: number };
    endpoints:   { total: number; covered: number; gaps: number };
    compliance:  { total: number; covered: number; gaps: number };
    players:     { total: number; covered: number; gaps: number };
  };
  config: { auditIntervalSeconds: number; autoResolveGaps: boolean; minCoveragePercent: number };
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Industry {
  name: string;
  renderMode: string;
  aiPersona: string;
  endpointCount: number;
  workflowCount: number;
  savings: number;
}

export interface Endpoint {
  route: string;
  method: "GET" | "POST";
  auth: boolean;
  rateLimit: string;
  sse: boolean;
  status: "Live" | "Degraded" | "Down";
}

export interface SavingsDataPoint {
  category: string;
  storage: number;
  compute: number;
  bandwidth: number;
}

export interface ComplianceItem {
  name: string;
  status: boolean;
  detail: string;
}

export interface Capacity {
  sseStreams: number;
  maxUsers: number;
  cpu: number;
  memory: number;
  uptime: string;
}

export interface EnvDataPoint {
  metric: string;
  value: number;
}

export interface AuditLog {
  timestamp: string;
  action: string;
  status: "OK" | "Warn" | "Blocked";
}

export interface SystemStats {
  industries: Industry[];
  endpoints: Endpoint[];
  savings: { data: SavingsDataPoint[] };
  compliance: ComplianceItem[];
  capacity: Capacity;
  environmental: { data: EnvDataPoint[] };
  auditLogs: AuditLog[];
  liveChecks: { name: string; pass: boolean; detail: string }[];
  overall: boolean;
  coverage: string;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  // Brain enforcement
  brainStatus: BrainStatus | null;
  brainLoading: boolean;
  // Mission config
  missionConfig: MissionConfig | null;
}

// ─── Static data ─────────────────────────────────────────────────────────────

const INDUSTRIES: Industry[] = [
  { name: "Film / Movie",                renderMode: "cinematic",  aiPersona: "Cinematic Director",         endpointCount: 8, workflowCount: 14, savings: 4.2  },
  { name: "Documentary",                 renderMode: "cinematic",  aiPersona: "Documentary Filmmaker",      endpointCount: 8, workflowCount: 11, savings: 2.8  },
  { name: "Video Game",                  renderMode: "game",       aiPersona: "Game Design Director",       endpointCount: 8, workflowCount: 18, savings: 6.1  },
  { name: "Music / Album",               renderMode: "music",      aiPersona: "Music Producer",             endpointCount: 8, workflowCount: 10, savings: 1.9  },
  { name: "Podcast",                     renderMode: "podcast",    aiPersona: "Podcast Strategist",         endpointCount: 8, workflowCount: 9,  savings: 1.4  },
  { name: "Book / Novel",                renderMode: "book",       aiPersona: "Literary Agent & Editor",    endpointCount: 8, workflowCount: 12, savings: 1.7  },
  { name: "Physical Product",            renderMode: "showcase",   aiPersona: "Product Launch Director",    endpointCount: 8, workflowCount: 13, savings: 3.5  },
  { name: "Creator Economy",             renderMode: "showcase",   aiPersona: "Creator Growth Strategist",  endpointCount: 8, workflowCount: 11, savings: 2.2  },
  { name: "IoT / Hardware",              renderMode: "showcase",   aiPersona: "Hardware Systems Architect", endpointCount: 8, workflowCount: 15, savings: 4.8  },
  { name: "Retail",                      renderMode: "showcase",   aiPersona: "Retail Operations Expert",   endpointCount: 8, workflowCount: 12, savings: 5.3  },
  { name: "E-commerce / DTC",            renderMode: "showcase",   aiPersona: "DTC Growth Marketer",        endpointCount: 8, workflowCount: 14, savings: 7.1  },
  { name: "RetailTech",                  renderMode: "showcase",   aiPersona: "Retail Technology Advisor",  endpointCount: 8, workflowCount: 11, savings: 3.9  },
  { name: "Fashion & Apparel",           renderMode: "showcase",   aiPersona: "Fashion Brand Strategist",   endpointCount: 8, workflowCount: 10, savings: 2.6  },
  { name: "Restaurant / F&B",            renderMode: "showcase",   aiPersona: "F&B Operations Director",    endpointCount: 8, workflowCount: 11, savings: 2.1  },
  { name: "Travel & Hospitality",        renderMode: "showcase",   aiPersona: "Hospitality Experience Lead",endpointCount: 8, workflowCount: 13, savings: 3.4  },
  { name: "Events & Conference",         renderMode: "showcase",   aiPersona: "Event Production Director",  endpointCount: 8, workflowCount: 9,  savings: 1.8  },
  { name: "Sports & Fitness",            renderMode: "showcase",   aiPersona: "Sports Performance Coach",   endpointCount: 8, workflowCount: 10, savings: 2.3  },
  { name: "Mobile App",                  renderMode: "app",        aiPersona: "Mobile Product Lead",        endpointCount: 8, workflowCount: 16, savings: 8.4  },
  { name: "Web App / SaaS",             renderMode: "app",        aiPersona: "SaaS Product Architect",     endpointCount: 8, workflowCount: 18, savings: 12.7 },
  { name: "Technology",                  renderMode: "app",        aiPersona: "CTO / Tech Strategist",      endpointCount: 8, workflowCount: 17, savings: 9.2  },
  { name: "AR/VR / Metaverse",           renderMode: "app",        aiPersona: "Immersive Experience Lead",  endpointCount: 8, workflowCount: 12, savings: 4.1  },
  { name: "Business",                    renderMode: "pitch",      aiPersona: "Business Strategy Director", endpointCount: 8, workflowCount: 20, savings: 15.3 },
  { name: "Startup",                     renderMode: "pitch",      aiPersona: "Startup CEO Advisor",        endpointCount: 8, workflowCount: 22, savings: 11.6 },
  { name: "Blockchain / Web3",           renderMode: "pitch",      aiPersona: "Web3 Tokenomics Expert",     endpointCount: 8, workflowCount: 14, savings: 5.8  },
  { name: "FinTech",                     renderMode: "pitch",      aiPersona: "FinTech Product Director",   endpointCount: 8, workflowCount: 19, savings: 13.4 },
  { name: "Space & Aerospace",           renderMode: "pitch",      aiPersona: "Aerospace Systems Advisor",  endpointCount: 8, workflowCount: 11, savings: 6.7  },
  { name: "Mobility & AutoTech",         renderMode: "pitch",      aiPersona: "Mobility Innovation Lead",   endpointCount: 8, workflowCount: 13, savings: 7.2  },
  { name: "Nonprofit",                   renderMode: "pitch",      aiPersona: "Nonprofit Impact Director",  endpointCount: 8, workflowCount: 10, savings: 2.9  },
  { name: "Climate Tech",                renderMode: "pitch",      aiPersona: "Climate Innovation Lead",    endpointCount: 8, workflowCount: 12, savings: 4.3  },
  { name: "Clean Energy",                renderMode: "pitch",      aiPersona: "Energy Transition Strategist",endpointCount: 8, workflowCount: 13, savings: 5.1 },
  { name: "Media & Publishing",          renderMode: "document",   aiPersona: "Editorial Director",         endpointCount: 8, workflowCount: 11, savings: 3.2  },
  { name: "Cybersecurity",               renderMode: "document",   aiPersona: "CISO / Security Architect",  endpointCount: 8, workflowCount: 16, savings: 8.9  },
  { name: "Agency / Consultancy",        renderMode: "document",   aiPersona: "Management Consultant",      endpointCount: 8, workflowCount: 15, savings: 7.6  },
  { name: "Legal",                       renderMode: "document",   aiPersona: "Senior Partner / Counsel",   endpointCount: 8, workflowCount: 14, savings: 6.4  },
  { name: "LegalTech",                   renderMode: "document",   aiPersona: "LegalTech Product Lead",     endpointCount: 8, workflowCount: 13, savings: 5.3  },
  { name: "GovTech / CivicTech",         renderMode: "document",   aiPersona: "Public Sector Advisor",      endpointCount: 8, workflowCount: 12, savings: 4.1  },
  { name: "Real Estate",                 renderMode: "document",   aiPersona: "Real Estate Investment Lead", endpointCount: 8, workflowCount: 11, savings: 5.7 },
  { name: "PropTech",                    renderMode: "document",   aiPersona: "PropTech Product Director",  endpointCount: 8, workflowCount: 12, savings: 4.8  },
  { name: "Logistics",                   renderMode: "document",   aiPersona: "Supply Chain Director",      endpointCount: 8, workflowCount: 14, savings: 6.9  },
  { name: "Construction",                renderMode: "document",   aiPersona: "Construction Project Lead",  endpointCount: 8, workflowCount: 13, savings: 5.4  },
  { name: "Farming",                     renderMode: "document",   aiPersona: "AgriTech Systems Advisor",   endpointCount: 8, workflowCount: 10, savings: 3.3  },
  { name: "Architecture / Interior Design",renderMode: "document", aiPersona: "Principal Architect",        endpointCount: 8, workflowCount: 11, savings: 3.8  },
  { name: "General",                     renderMode: "document",   aiPersona: "Universal Business Advisor", endpointCount: 8, workflowCount: 20, savings: 10.2 },
  { name: "Corporate Training",          renderMode: "training",   aiPersona: "L&D Program Director",       endpointCount: 8, workflowCount: 13, savings: 4.6  },
  { name: "HR / L&D",                    renderMode: "training",   aiPersona: "Chief People Officer",       endpointCount: 8, workflowCount: 14, savings: 5.2  },
  { name: "Education",                   renderMode: "training",   aiPersona: "Curriculum Design Expert",   endpointCount: 8, workflowCount: 15, savings: 4.9  },
  { name: "EdTech",                      renderMode: "training",   aiPersona: "EdTech Product Lead",        endpointCount: 8, workflowCount: 16, savings: 6.3  },
  { name: "HRTech / WorkTech",           renderMode: "training",   aiPersona: "Future of Work Strategist",  endpointCount: 8, workflowCount: 13, savings: 5.1  },
  { name: "AgriTech",                    renderMode: "training",   aiPersona: "Agricultural AI Advisor",    endpointCount: 8, workflowCount: 11, savings: 3.7  },
  { name: "Healthcare",                  renderMode: "training",   aiPersona: "Chief Medical Officer",      endpointCount: 8, workflowCount: 18, savings: 14.2 },
  { name: "Biotech / Life Sciences",     renderMode: "training",   aiPersona: "Biotech R&D Director",       endpointCount: 8, workflowCount: 16, savings: 9.8  },
  { name: "Online Course",               renderMode: "course",     aiPersona: "Online Learning Strategist", endpointCount: 8, workflowCount: 10, savings: 2.7  },
  { name: "Insurance",                   renderMode: "document",   aiPersona: "Actuarial & Risk Director",  endpointCount: 8, workflowCount: 12, savings: 6.1  },
];

const ENDPOINTS: Endpoint[] = [
  { route: "POST /api/generate",              method: "POST", auth: true, rateLimit: "10 / min",  sse: true,  status: "Live" },
  { route: "POST /api/generate/regen-art",    method: "POST", auth: true, rateLimit: "30 / min",  sse: false, status: "Live" },
  { route: "POST /api/generate/smart-fill",   method: "POST", auth: true, rateLimit: "30 / min",  sse: false, status: "Live" },
  { route: "GET  /api/generate/serve/:id",    method: "GET",  auth: true, rateLimit: "120 / min", sse: false, status: "Live" },
  { route: "GET  /api/generate/next-renders/:id", method: "GET", auth: true, rateLimit: "120 / min", sse: false, status: "Live" },
  { route: "GET  /api/generate/analytics/:id",method: "GET",  auth: true, rateLimit: "120 / min", sse: false, status: "Live" },
  { route: "GET  /api/generate/export-pdf/:id",method: "GET", auth: true, rateLimit: "30 / min",  sse: false, status: "Live" },
  { route: "GET  /api/generate/metrics-report",method: "GET", auth: true, rateLimit: "120 / min", sse: false, status: "Live" },
];

const SAVINGS_DATA: SavingsDataPoint[] = [
  { category: "Healthcare",   storage: 71, compute: 78, bandwidth: 62 },
  { category: "FinTech",      storage: 68, compute: 75, bandwidth: 59 },
  { category: "Legal",        storage: 65, compute: 70, bandwidth: 55 },
  { category: "Education",    storage: 60, compute: 66, bandwidth: 52 },
  { category: "SaaS",         storage: 74, compute: 82, bandwidth: 67 },
  { category: "Logistics",    storage: 63, compute: 69, bandwidth: 57 },
  { category: "E-Commerce",   storage: 70, compute: 76, bandwidth: 63 },
];

const COMPLIANCE: ComplianceItem[] = [
  { name: "HIPAA",       status: true,  detail: "PHI handling, access controls, audit logging" },
  { name: "GDPR",        status: true,  detail: "Consent management, right to erasure, data portability" },
  { name: "SOC 2 Type II",status: true, detail: "Availability, confidentiality, security controls" },
  { name: "ISO 27001",   status: true,  detail: "Information security management system certified" },
  { name: "CCPA",        status: true,  detail: "CA consumer privacy rights, opt-out flows" },
  { name: "PCI-DSS",     status: true,  detail: "Secure payment data handling and transmission" },
  { name: "FERPA",       status: true,  detail: "Education records privacy, EdTech compliance" },
];

const CAPACITY: Capacity = {
  sseStreams: 1,
  maxUsers:   10000,
  cpu:        23,
  memory:     4.2,
  uptime:     "99.97%",
};

const ENV_DATA: EnvDataPoint[] = [
  { metric: "CO₂ Reduction",      value: 45 },
  { metric: "Energy Optimization", value: 38 },
  { metric: "Water Conservation",  value: 17 },
];

// ─── Audit log generator (simulated live tail) ───────────────────────────────

function generateAuditLogs(): AuditLog[] {
  const now = new Date();
  return [
    { timestamp: fmt(now, -5),  action: "POST /api/generate — gpt-4o SSE stream",             status: "OK"      },
    { timestamp: fmt(now, -12), action: "GET /api/generate/next-renders/3",                    status: "OK"      },
    { timestamp: fmt(now, -21), action: "POST /api/generate — 429 rate limit enforced (uid:7)",status: "Blocked" },
    { timestamp: fmt(now, -34), action: "POST /api/generate/smart-fill — Smart Fill enriched", status: "OK"      },
    { timestamp: fmt(now, -48), action: "GET /api/generate/analytics/4",                       status: "OK"      },
    { timestamp: fmt(now, -61), action: "POST /api/generate/regen-art — DALL-E frame regen",   status: "OK"      },
    { timestamp: fmt(now, -73), action: "GET /api/generate/export-pdf/2",                      status: "OK"      },
    { timestamp: fmt(now, -95), action: "Enforcement dashboard check — 7/7 passes",            status: "OK"      },
    { timestamp: fmt(now,-108), action: "POST /api/generate — unauthenticated → 401",          status: "Blocked" },
    { timestamp: fmt(now,-124), action: "GET /api/generate/metrics-report — 120 req/min tier", status: "OK"      },
  ];
}

function fmt(base: Date, offsetSecs: number): string {
  const d = new Date(base.getTime() + offsetSecs * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSystemStats(): SystemStats {
  const [liveChecks, setLiveChecks] = useState<{ name: string; pass: boolean; detail: string }[]>([]);
  const [overall, setOverall]       = useState(true);
  const [coverage, setCoverage]     = useState("100%");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [auditLogs, setAuditLogs]   = useState<AuditLog[]>(generateAuditLogs());
  const [brainStatus, setBrainStatus] = useState<BrainStatus | null>(null);
  const [brainLoading, setBrainLoading] = useState(true);
  const [missionConfig, setMissionConfig] = useState<MissionConfig | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/status", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLiveChecks(data.checks ?? []);
      setOverall(data.overall ?? true);
      setCoverage(data.coverage ?? "100%");
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBrainStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/brain/status", { credentials: "include" });
      if (!res.ok) return;
      const data: BrainStatus = await res.json();
      setBrainStatus(data);
    } catch {
      // non-blocking — enforcement engine may not be warmed up yet
    } finally {
      setBrainLoading(false);
    }
  }, []);

  const fetchMission = useCallback(async () => {
    try {
      const res = await fetch("/api/brain/mission", { credentials: "include" });
      if (!res.ok) return;
      const data: MissionConfig = await res.json();
      setMissionConfig(data);
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchBrainStatus();
    fetchMission();
    const interval = setInterval(() => {
      fetchStatus();
      fetchBrainStatus();
      fetchMission();
      setAuditLogs(generateAuditLogs());
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchBrainStatus, fetchMission]);

  return {
    industries:   INDUSTRIES,
    endpoints:    ENDPOINTS,
    savings:      { data: SAVINGS_DATA },
    compliance:   COMPLIANCE,
    capacity:     CAPACITY,
    environmental:{ data: ENV_DATA },
    auditLogs,
    liveChecks,
    overall,
    coverage,
    loading,
    error,
    refresh: () => { fetchStatus(); fetchBrainStatus(); fetchMission(); },
    brainStatus,
    brainLoading,
    missionConfig,
  };
}
