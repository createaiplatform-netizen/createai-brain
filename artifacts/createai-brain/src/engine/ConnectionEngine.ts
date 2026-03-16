// ─── Internal Connection Layer ────────────────────────────────────────────────
// Links modules ↔ flows ↔ dashboards ↔ data structures ↔ demo packets ↔
// UI states ↔ brain logic. ALL connections are INTERNAL ONLY.
// Non-operational outside this system. Demo / structural only.

export type NodeType =
  | "module"
  | "flow"
  | "dashboard"
  | "data-structure"
  | "demo-packet"
  | "ui-state"
  | "brain-logic";

export interface ConnectionNode {
  id: string;
  type: NodeType;
  name: string;
  description: string;
  links: string[];           // IDs of linked nodes
  status: "active" | "ready" | "blueprint";
  metadata?: Record<string, string>;
}

export const NODE_TYPE_CFG: Record<NodeType, { label: string; icon: string; color: string; bg: string }> = {
  "module":         { label: "Engine Module",   icon: "⚙️", color: "#007AFF", bg: "bg-blue-50"    },
  "flow":           { label: "Flow",            icon: "→",  color: "#5856D6", bg: "bg-purple-50"  },
  "dashboard":      { label: "Dashboard",       icon: "📊", color: "#34C759", bg: "bg-green-50"   },
  "data-structure": { label: "Data Structure",  icon: "🗄️", color: "#FF9500", bg: "bg-orange-50"  },
  "demo-packet":    { label: "Demo Packet",     icon: "🔌", color: "#30B0C7", bg: "bg-cyan-50"    },
  "ui-state":       { label: "UI State",        icon: "🖥️", color: "#BF5AF2", bg: "bg-violet-50"  },
  "brain-logic":    { label: "Brain Logic",     icon: "🧠", color: "#FF2D55", bg: "bg-rose-50"    },
};

// ─── Node Library ─────────────────────────────────────────────────────────────
export const CONNECTION_NODES: ConnectionNode[] = [

  // ── Engine Modules ─────────────────────────────────────────────────────────
  { id: "mod-template",    type: "module", status: "active",
    name: "TemplateLibrary",     description: "19 project types. Template objects for every creation flow.",
    links: ["flow-creation", "ds-creation", "brain-project"],
    metadata: { types: "19", storage: "in-memory" } },

  { id: "mod-intelligence", type: "module", status: "active",
    name: "ProjectIntelligence", description: "Keyword detection + type classification + module routing.",
    links: ["flow-creation", "brain-project", "brain-global"],
    metadata: { keywords: "200+", algorithm: "keyword-map" } },

  { id: "mod-export",      type: "module", status: "active",
    name: "ExportEngine",        description: "JSON / Markdown / Text / Clipboard exports. All filenames include _MOCK suffix.",
    links: ["flow-export", "ds-creation", "ui-viewer"],
    metadata: { formats: "4", safety: "local-only" } },

  { id: "mod-theme",       type: "module", status: "active",
    name: "ThemeEngine",         description: "10 accent colors, 6 preset themes, brand profile generation.",
    links: ["ui-os", "ui-viewer", "brain-preference"],
    metadata: { accents: "10", themes: "6" } },

  { id: "mod-creation",    type: "module", status: "active",
    name: "CreationStore v2",    description: "localStorage creation store. Supports status, tags, snapshots, collections.",
    links: ["ds-creation", "flow-creation", "flow-export", "ui-gallery"],
    metadata: { maxItems: "50", key: "createai_creations_v1" } },

  { id: "mod-integration", type: "module", status: "active",
    name: "IntegrationEngine",   description: "23 demo packets, activation phrases, PacketStatus lifecycle, auto-generate.",
    links: ["flow-integration", "ds-packet", "brain-global", "dash-integration"],
    metadata: { packets: "23", key: "createai_integration_packets_v1" } },

  { id: "mod-connection",  type: "module", status: "active",
    name: "ConnectionEngine",    description: "Internal fabric linking all nodes. Read-only structural graph.",
    links: ["dash-admin", "brain-global"],
    metadata: { nodes: "30+", type: "internal-only" } },

  { id: "mod-regulatory",  type: "module", status: "blueprint",
    name: "RegulatoryEngine",    description: "Regulatory Readiness Blueprints. Non-operational, non-binding structural layer.",
    links: ["flow-regulatory", "ds-regulatory", "dash-regulatory", "brain-regulatory"],
    metadata: { frameworks: "6", status: "blueprint-only" } },

  { id: "mod-backend",     type: "module", status: "blueprint",
    name: "BackendBlueprintEngine", description: "Future backend API specs, data models, security & audit patterns. Design-only.",
    links: ["flow-backend", "ds-api", "dash-admin"],
    metadata: { blueprints: "5", status: "design-only" } },

  // ── Flows ──────────────────────────────────────────────────────────────────
  { id: "flow-creation",    type: "flow", status: "active",
    name: "Creation Flow",       description: "Classify intent → load template → build prompt → stream AI → parse sections → store.",
    links: ["mod-intelligence", "mod-template", "mod-creation", "brain-project", "ui-viewer"],
    metadata: { steps: "6", streaming: "SSE" } },

  { id: "flow-integration", type: "flow", status: "active",
    name: "Integration Flow",    description: "Activation phrase → prepare packets → submit (mock) → connect-demo → log activity.",
    links: ["mod-integration", "ds-packet", "dash-integration", "ui-integration"],
    metadata: { steps: "5", realActions: "none" } },

  { id: "flow-export",      type: "flow", status: "active",
    name: "Export Flow",         description: "Select format → serialize creation → download or copy. Local-only, no network.",
    links: ["mod-export", "mod-creation", "ui-viewer"],
    metadata: { formats: "JSON/MD/TXT/Clipboard" } },

  { id: "flow-regulatory",  type: "flow", status: "blueprint",
    name: "Regulatory Flow",     description: "Blueprint: map domain → load framework → apply clauses → generate audit trail. MOCK only.",
    links: ["mod-regulatory", "ds-regulatory", "brain-regulatory", "dash-regulatory"],
    metadata: { status: "blueprint", binding: "false" } },

  { id: "flow-backend",     type: "flow", status: "blueprint",
    name: "Backend API Flow",    description: "Blueprint: request → auth → validate → process → log → respond. Design spec only.",
    links: ["mod-backend", "ds-api", "brain-global"],
    metadata: { status: "design-only", realBackend: "false" } },

  // ── Dashboards ─────────────────────────────────────────────────────────────
  { id: "dash-admin",       type: "dashboard", status: "active",
    name: "Admin Dashboard",     description: "System mode, engine list, users, audit log, debug panel, blueprint layers.",
    links: ["mod-connection", "mod-regulatory", "mod-backend", "ui-os"],
    metadata: { app: "AdminApp" } },

  { id: "dash-integration", type: "dashboard", status: "active",
    name: "Integration Dashboard", description: "Demo packet stats, status filters, activity log, activation phrase console.",
    links: ["mod-integration", "flow-integration", "ui-integration"],
    metadata: { app: "IntegrationApp" } },

  { id: "dash-regulatory",  type: "dashboard", status: "blueprint",
    name: "Regulatory Dashboard", description: "Blueprint overview: frameworks, compliance status (mock), audit trail viewer.",
    links: ["mod-regulatory", "flow-regulatory"],
    metadata: { status: "blueprint-only" } },

  // ── Data Structures ────────────────────────────────────────────────────────
  { id: "ds-creation",      type: "data-structure", status: "active",
    name: "Creation Schema",     description: "id, type, title, sections[], status, tags[], collectionId, themeColor, snapshots[], timestamps.",
    links: ["mod-creation", "mod-export", "mod-template"],
    metadata: { storage: "localStorage", maxItems: "50" } },

  { id: "ds-packet",        type: "data-structure", status: "active",
    name: "DemoPacket Schema",   description: "id, name, vendor, category, icon, color, features[], dataFlows[], scope[], endpoint, status, safetyNote.",
    links: ["mod-integration", "flow-integration"],
    metadata: { storage: "localStorage", realData: "none" } },

  { id: "ds-regulatory",    type: "data-structure", status: "blueprint",
    name: "Regulatory Schema",   description: "domain, framework, clauses[], roles[], auditTrail[], consentFlows[], complianceNotes[], disclaimer.",
    links: ["mod-regulatory", "flow-regulatory"],
    metadata: { binding: "false", status: "blueprint" } },

  { id: "ds-api",           type: "data-structure", status: "blueprint",
    name: "API Blueprint Schema", description: "endpoint, method, requestShape, responseShape, roles[], rateLimit, errorCodes[], loggingSpec.",
    links: ["mod-backend", "flow-backend"],
    metadata: { realEndpoints: "none", status: "design-only" } },

  // ── Demo Packet Anchors ────────────────────────────────────────────────────
  { id: "dp-healthcare",    type: "demo-packet", status: "active",
    name: "Healthcare Packets",  description: "Epic EHR, Cerner, Telehealth, Pharmacy — all fictional, HIPAA-labeled, DEMO ONLY.",
    links: ["mod-integration", "flow-integration", "ds-packet", "ds-regulatory"],
    metadata: { count: "4", domain: "Healthcare" } },

  { id: "dp-finance",       type: "demo-packet", status: "active",
    name: "Finance Packets",     description: "Stripe, Plaid, QuickBooks — fictional, no real transactions, DEMO ONLY.",
    links: ["mod-integration", "flow-integration", "ds-packet"],
    metadata: { count: "3", domain: "Finance" } },

  { id: "dp-ai",            type: "demo-packet", status: "active",
    name: "AI Engine Packets",   description: "OpenAI, Anthropic, Document AI — routes through CreateAI Brain proxy, DEMO ONLY.",
    links: ["mod-integration", "brain-global", "flow-integration"],
    metadata: { count: "3", domain: "AI" } },

  // ── UI States ──────────────────────────────────────────────────────────────
  { id: "ui-os",            type: "ui-state", status: "active",
    name: "OS State",            description: "OSContext: appRegistry, openApp, activeApp, sidebar collapse, theme.",
    links: ["mod-theme", "dash-admin", "brain-preference"],
    metadata: { provider: "OSContext", responsive: "true" } },

  { id: "ui-viewer",        type: "ui-state", status: "active",
    name: "CreationViewer State", description: "Active section, export format, share state, version history, download trigger.",
    links: ["mod-export", "mod-creation", "flow-export"],
    metadata: { tabs: "4" } },

  { id: "ui-gallery",       type: "ui-state", status: "active",
    name: "Gallery State",       description: "Status filter, tag filter, search, quick actions (cycle/copy/delete).",
    links: ["mod-creation", "flow-creation"],
    metadata: { filters: "status+tag" } },

  { id: "ui-integration",   type: "ui-state", status: "active",
    name: "Integration App State", description: "Active tab, packet filter, submitting ID, activation banner, activity log.",
    links: ["mod-integration", "flow-integration", "dash-integration"],
    metadata: { tabs: "2" } },

  // ── Brain Logic ────────────────────────────────────────────────────────────
  { id: "brain-global",     type: "brain-logic", status: "active",
    name: "Global Brain",        description: "Intent routing: classifyIntent() → app dispatcher. Handles all activation phrases.",
    links: ["mod-intelligence", "mod-integration", "flow-creation", "flow-integration"],
    metadata: { intents: "14+", routing: "keyword-based" } },

  { id: "brain-project",    type: "brain-logic", status: "active",
    name: "Project Brain",       description: "Per-project context: type, active sections, template state, tour steps.",
    links: ["mod-template", "mod-intelligence", "flow-creation"],
    metadata: { scope: "per-project" } },

  { id: "brain-preference", type: "brain-logic", status: "active",
    name: "Preference Brain",    description: "User accent, theme, sidebar state, tour progress, last-used apps.",
    links: ["mod-theme", "ui-os"],
    metadata: { persistence: "localStorage" } },

  { id: "brain-regulatory", type: "brain-logic", status: "blueprint",
    name: "Regulatory Brain",    description: "Blueprint: domain detection → load framework → map clauses → generate audit log. MOCK only.",
    links: ["mod-regulatory", "flow-regulatory", "ds-regulatory"],
    metadata: { status: "blueprint", binding: "false" } },
];

// ─── Engine API ───────────────────────────────────────────────────────────────
export const ConnectionEngine = {
  getAllNodes(): ConnectionNode[] { return CONNECTION_NODES; },

  getByType(type: NodeType): ConnectionNode[] {
    return CONNECTION_NODES.filter(n => n.type === type);
  },

  getNode(id: string): ConnectionNode | undefined {
    return CONNECTION_NODES.find(n => n.id === id);
  },

  getLinked(id: string): ConnectionNode[] {
    const node = this.getNode(id);
    if (!node) return [];
    return node.links.map(lid => this.getNode(lid)).filter(Boolean) as ConnectionNode[];
  },

  getStats() {
    const all = CONNECTION_NODES;
    return {
      total:     all.length,
      active:    all.filter(n => n.status === "active").length,
      blueprint: all.filter(n => n.status === "blueprint").length,
      byType:    Object.fromEntries(
        (Object.keys(NODE_TYPE_CFG) as NodeType[]).map(t => [t, all.filter(n => n.type === t).length])
      ),
    };
  },
};
