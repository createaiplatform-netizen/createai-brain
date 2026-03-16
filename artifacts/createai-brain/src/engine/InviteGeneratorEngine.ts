// ═══════════════════════════════════════════════════════════════════════════
// INSTANT INVITE GENERATOR ENGINE
// All contacts, messages, and send events are MOCK / DEMO-ONLY / NON-OPERATIONAL.
// No real emails, SMS, or notifications are sent. All data is fictional.
// ═══════════════════════════════════════════════════════════════════════════

export interface MockContact {
  id:      string;
  name:    string;
  role:    string;
  channel: "Email" | "SMS" | "Platform";
  address: string;
}

export interface InviteRecord {
  id:          string;
  timestamp:   string;
  recipients:  MockContact[];
  message:     string;
  channel:     string;
  status:      "sent" | "queued" | "delivered";
  safetyNote:  string;
}

// ─── Pre-stored mock contacts ──────────────────────────────────────────────
export const MOCK_CONTACTS: MockContact[] = [
  { id: "c1",  name: "Jordan Rivera",      role: "Care Coordinator",     channel: "Email",    address: "jordan.rivera@demo.internal" },
  { id: "c2",  name: "Priya Nair",         role: "Clinical Lead",        channel: "Email",    address: "p.nair@demo.internal" },
  { id: "c3",  name: "Marcus Webb",        role: "Operations Manager",   channel: "SMS",      address: "+1-555-010-0001" },
  { id: "c4",  name: "Aisha Johnson",      role: "Compliance Officer",   channel: "Platform", address: "@aisha.j" },
  { id: "c5",  name: "Chen Li",            role: "Data Analyst",         channel: "Email",    address: "chen.li@demo.internal" },
  { id: "c6",  name: "Sara Stadler",       role: "Executive",            channel: "Platform", address: "@sara.s" },
  { id: "c7",  name: "Devon Park",         role: "IT Lead",              channel: "Email",    address: "d.park@demo.internal" },
  { id: "c8",  name: "Luisa Mendez",       role: "Billing Specialist",   channel: "SMS",      address: "+1-555-010-0002" },
  { id: "c9",  name: "Theo Okafor",        role: "Provider",             channel: "Platform", address: "@theo.o" },
  { id: "c10", name: "Natalie Brooks",     role: "State Agency Officer", channel: "Email",    address: "n.brooks@demo.internal" },
  { id: "c11", name: "Ryan Castellano",    role: "Payer Representative", channel: "Email",    address: "r.castellano@demo.internal" },
  { id: "c12", name: "Yuki Tanaka",        role: "Vendor Manager",       channel: "Platform", address: "@yuki.t" },
];

// ─── Message templates ─────────────────────────────────────────────────────
const TEMPLATES = [
  (name: string) =>
    `Hi ${name},\n\nYou're invited to join the CreateAI Brain platform session.\n\nClick the link below to access your personalized dashboard, review your assigned workflows, and connect with the team.\n\n[DEMO LINK — non-operational]\n\nBest,\nCreateAI Brain\n\n⚠️ Demo only — no real invitation is sent.`,
  (name: string) =>
    `Hello ${name},\n\nThis is an automated invite from the CreateAI Brain Instant Invite Generator.\n\nYour role has been pre-configured. Please log in to review your assignments, active workflows, and pending items.\n\n[ACCESS PORTAL — demo link]\n\nRegards,\nCreateAI OS\n\n⚠️ Fictional — all data is mock and non-operational.`,
  (name: string) =>
    `Hey ${name} 👋\n\nYou've been added to the CreateAI Brain workspace. Here's what's waiting for you:\n\n• Your role and agency context\n• Active workflows\n• Pending packets\n• Team updates\n\n[JOIN SESSION — demo link]\n\nSee you inside!\nCreateAI Brain\n\n⚠️ Demo simulation only.`,
];

// ─── Storage ──────────────────────────────────────────────────────────────
const STORAGE_KEY = "createai_invites_v1";

function loadLog(): InviteRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLog(log: InviteRecord[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(log.slice(-50))); } catch { /* ignore */ }
}

// ─── Engine ───────────────────────────────────────────────────────────────
class InviteGeneratorEngineClass {

  generateMessage(recipientName: string, templateIndex = 0): string {
    const fn = TEMPLATES[templateIndex % TEMPLATES.length];
    return fn(recipientName);
  }

  generateBulkMessage(contacts: MockContact[]): string {
    const firstName = contacts[0]?.name.split(" ")[0] ?? "Team";
    const others    = contacts.length > 1 ? ` (and ${contacts.length - 1} others)` : "";
    return TEMPLATES[0](`${firstName}${others}`);
  }

  send(recipients: MockContact[], message: string): InviteRecord {
    const record: InviteRecord = {
      id:         `inv_${Date.now()}`,
      timestamp:  new Date().toISOString(),
      recipients,
      message,
      channel:    recipients.map(r => r.channel).join(", "),
      status:     "sent",
      safetyNote: "DEMO ONLY — No real message was sent. All contacts and data are fictional.",
    };
    const log = loadLog();
    log.push(record);
    saveLog(log);
    return record;
  }

  getLog(): InviteRecord[] {
    return loadLog();
  }

  getContacts(): MockContact[] {
    return MOCK_CONTACTS;
  }
}

export const InviteGeneratorEngine = new InviteGeneratorEngineClass();
