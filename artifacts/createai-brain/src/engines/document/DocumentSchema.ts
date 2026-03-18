// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT SCHEMA — Unified structured-document type system
// Every document produced by CreateAI Brain conforms to this schema.
// ═══════════════════════════════════════════════════════════════════════════

export type CellAlign = "left" | "center" | "right";

// ─── Table primitives ────────────────────────────────────────────────────────

export interface DocumentTableCell {
  value:    string;
  bold?:    boolean;
  align?:   CellAlign;
  color?:   string;
  colspan?: number;
  muted?:   boolean;
}

export interface DocumentTableRow {
  cells:      (string | DocumentTableCell)[];
  isHeader?:  boolean;
  highlight?: boolean;
  color?:     string;
}

export interface DocumentTable {
  caption?: string;
  columns:  Array<{ label: string; align?: CellAlign; width?: string }>;
  rows:     DocumentTableRow[];
  zebra?:   boolean;
}

// ─── List primitives ─────────────────────────────────────────────────────────

export interface DocumentListItem {
  text:     string;
  bold?:    boolean;
  muted?:   boolean;
  icon?:    string;
  sub?:     DocumentListItem[];
}

// ─── Signature primitives ────────────────────────────────────────────────────

export interface SignatureLine {
  label:    string;
  value?:   string;
  subtitle?: string;
}

// ─── Cover page primitives ───────────────────────────────────────────────────

export interface CoverMetaItem {
  label:  string;
  value:  string;
}

// ─── All block types ─────────────────────────────────────────────────────────

export type DocumentBlock =
  | { type: "heading";    level: 1 | 2 | 3 | 4;  text: string; anchor?: string }
  | { type: "paragraph";  text: string;  muted?: boolean; lead?: boolean }
  | { type: "callout";    text: string;  icon?: string;   variant?: "info" | "warn" | "success" | "danger" }
  | { type: "table";      table: DocumentTable }
  | { type: "list";       ordered?: boolean;  items: DocumentListItem[];  tight?: boolean }
  | { type: "divider";    label?: string }
  | { type: "spacer";     size?: "xs" | "sm" | "md" | "lg" | "xl" }
  | { type: "keyvalue";   pairs: Array<{ key: string; value: string; mono?: boolean; muted?: boolean }>; columns?: 1 | 2 }
  | { type: "badge-row";  badges: Array<{ label: string; color?: string; bg?: string; border?: string }> }
  | { type: "metric-row"; metrics: Array<{ label: string; value: string; sub?: string; color?: string; trend?: "up" | "down" | "flat" }> }
  | { type: "code";       text: string; language?: string; caption?: string }
  | { type: "quote";      text: string; author?: string; role?: string }
  | { type: "signature";  lines: SignatureLine[]; date?: string; title?: string }
  | { type: "cover";      title: string; subtitle?: string; meta?: CoverMetaItem[]; badge?: string };

// ─── Section ─────────────────────────────────────────────────────────────────

export interface DocumentSection {
  id?:          string;
  title?:       string;
  subtitle?:    string;
  icon?:        string;
  blocks:       DocumentBlock[];
  collapsible?: boolean;
  accent?:      string;
  numbered?:    boolean;
}

// ─── Document metadata ───────────────────────────────────────────────────────

export type DocStatus = "draft" | "review" | "final" | "approved" | "archived";
export type DocConfidentiality = "public" | "internal" | "confidential" | "restricted";
export type DocTheme = "default" | "legal" | "medical" | "technical" | "creative" | "financial";

export interface DocumentMeta {
  title:            string;
  subtitle?:        string;
  description?:     string;
  author?:          string;
  organization?:    string;
  date?:            string;
  version?:         string;
  reference?:       string;
  tags?:            string[];
  docType:          string;
  status?:          DocStatus;
  confidentiality?: DocConfidentiality;
  logo?:            string;
  footerText?:      string;
}

// ─── Root document ───────────────────────────────────────────────────────────

export interface DocumentSchema {
  id?:        string;
  meta:       DocumentMeta;
  sections:   DocumentSection[];
  showToc?:   boolean;
  printable?: boolean;
  exportable?: boolean;
  theme?:     DocTheme;
}
