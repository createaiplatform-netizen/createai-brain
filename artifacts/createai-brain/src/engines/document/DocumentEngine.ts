// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT ENGINE — Core document processing logic (no React dependency)
// Parses raw text/markdown → DocumentSchema, builds from scratch, templates.
// ═══════════════════════════════════════════════════════════════════════════

import type {
  DocumentSchema,
  DocumentSection,
  DocumentBlock,
  DocumentMeta,
  DocumentListItem,
  DocumentTable,
  DocumentTableRow,
} from "./DocumentSchema";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mkId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function todayFormatted(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function parseListText(raw: string): string {
  return raw.replace(/^[\-\*•→▸►►]\s+/, "").replace(/^\d+[\.\)]\s+/, "").trim();
}

function isUnorderedBullet(line: string): boolean {
  return /^[\-\*•→▸►]\s/.test(line.trimStart());
}

function isOrderedBullet(line: string): boolean {
  return /^\d+[\.\)]\s/.test(line.trimStart());
}

function isSubBullet(line: string): boolean {
  return /^[ \t]{2,}[\-\*•→▸►]/.test(line) || /^[ \t]{2,}\d+[\.\)]/.test(line);
}

function isTableLine(line: string): boolean {
  return /^\|.+\|$/.test(line.trim());
}

function isSeparatorRow(line: string): boolean {
  return /^\|[\s\-|:]+\|$/.test(line.trim());
}

function isKeyValue(line: string): boolean {
  if (line.startsWith("#") || line.startsWith(">") || line.startsWith("|")) return false;
  const m = line.match(/^([A-Za-z][A-Za-z\s\-\/]{1,35}?):\s+(.+)$/);
  if (!m) return false;
  const key = m[1].trim();
  const val = m[2].trim();
  if (key.split(" ").length > 4) return false;
  if (val.includes("://")) return false;
  return key.length >= 2 && val.length >= 1;
}

function extractKeyValue(line: string): { key: string; value: string } {
  const idx = line.indexOf(":");
  return { key: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .trim();
}

// ─── Markdown table parser ────────────────────────────────────────────────────

function parseMarkdownTable(lines: string[]): DocumentTable | null {
  const dataLines = lines.filter(l => !isSeparatorRow(l));
  if (dataLines.length < 1) return null;

  const parseRow = (line: string): string[] =>
    line.trim().replace(/^\||\|$/g, "").split("|").map(c => stripInlineMarkdown(c.trim()));

  const headerCells = parseRow(dataLines[0]);
  const columns = headerCells.map(label => ({ label }));

  const rows: DocumentTableRow[] = dataLines.slice(1).map(line => ({
    cells: parseRow(line),
  }));

  return { columns, rows };
}

// ─── List item parser ─────────────────────────────────────────────────────────

function parseListItems(lines: string[]): DocumentListItem[] {
  const items: DocumentListItem[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isSubBullet(line)) {
      if (items.length > 0) {
        const sub = items[items.length - 1];
        if (!sub.sub) sub.sub = [];
        sub.sub.push({ text: parseListText(line.trimStart()) });
      }
    } else {
      items.push({ text: parseListText(line) });
    }
    i++;
  }
  return items;
}

// ─── Core section builder ─────────────────────────────────────────────────────

function pushBlock(section: DocumentSection, block: DocumentBlock): void {
  section.blocks.push(block);
}

function flushList(
  section: DocumentSection,
  buf: string[],
  ordered: boolean,
): void {
  if (buf.length === 0) return;
  pushBlock(section, { type: "list", ordered, items: parseListItems(buf) });
}

function flushKv(
  section: DocumentSection,
  buf: Array<{ key: string; value: string }>,
): void {
  if (buf.length === 0) return;
  pushBlock(section, { type: "keyvalue", pairs: buf.map(p => ({ key: p.key, value: p.value })) });
}

// ─── Main markdown parser ─────────────────────────────────────────────────────

export function parseMarkdownToDocument(
  rawText: string,
  metaOverride: Partial<DocumentMeta> = {},
): DocumentSchema {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");

  const sections: DocumentSection[] = [];
  let current: DocumentSection | null = null;
  let listBuf: string[] = [];
  let listOrdered = false;
  let kvBuf: Array<{ key: string; value: string }> = [];
  let codeBuf: string[] = [];
  let codeLang = "";
  let inCode = false;
  let sectionIdx = 0;

  const ensureSection = (title?: string) => {
    if (!current) {
      current = { id: `s-${sectionIdx++}`, title, blocks: [] };
    }
  };

  const flushSection = () => {
    if (listBuf.length > 0) { flushList(current!, listBuf, listOrdered); listBuf = []; }
    if (kvBuf.length > 0)   { flushKv(current!, kvBuf);  kvBuf = []; }
    if (current && current.blocks.length > 0) sections.push(current);
    current = null;
  };

  const flushBuffers = () => {
    if (current) {
      if (listBuf.length > 0) { flushList(current, listBuf, listOrdered); listBuf = []; }
      if (kvBuf.length > 0)   { flushKv(current, kvBuf);  kvBuf = []; }
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw  = lines[i];
    const line = raw.trimEnd();

    // ── Code fence ──────────────────────────────────────────────────────────
    if (line.startsWith("```")) {
      if (!inCode) {
        inCode = true; codeLang = line.slice(3).trim();
        flushBuffers(); ensureSection();
      } else {
        inCode = false;
        pushBlock(current!, { type: "code", text: codeBuf.join("\n"), language: codeLang || undefined });
        codeBuf = [];
      }
      continue;
    }
    if (inCode) { codeBuf.push(raw); continue; }

    // ── H1 — document title / top-level section ──────────────────────────────
    if (/^# /.test(line)) {
      flushSection();
      current = { id: `s-${sectionIdx++}`, title: line.slice(2).trim(), blocks: [] };
      continue;
    }

    // ── H2 — major section ────────────────────────────────────────────────────
    if (/^## /.test(line)) {
      flushSection();
      current = { id: `s-${sectionIdx++}`, title: line.slice(3).trim(), blocks: [] };
      continue;
    }

    // ── H3 — sub-heading block ────────────────────────────────────────────────
    if (/^### /.test(line)) {
      flushBuffers(); ensureSection();
      pushBlock(current!, { type: "heading", level: 3, text: line.slice(4).trim() });
      continue;
    }

    // ── H4 — minor heading ────────────────────────────────────────────────────
    if (/^#### /.test(line)) {
      flushBuffers(); ensureSection();
      pushBlock(current!, { type: "heading", level: 4, text: line.slice(5).trim() });
      continue;
    }

    // ── Horizontal rule ───────────────────────────────────────────────────────
    if (/^[-*_]{3,}$/.test(line.trim())) {
      flushBuffers(); ensureSection();
      pushBlock(current!, { type: "divider" });
      continue;
    }

    // ── Blockquote ────────────────────────────────────────────────────────────
    if (/^> /.test(line)) {
      flushBuffers(); ensureSection();
      pushBlock(current!, { type: "quote", text: line.slice(2).trim() });
      continue;
    }

    // ── Markdown table ────────────────────────────────────────────────────────
    if (isTableLine(line)) {
      const tableLines: string[] = [];
      while (i < lines.length && (isTableLine(lines[i]) || isSeparatorRow(lines[i]))) {
        tableLines.push(lines[i]);
        i++;
      }
      i--;
      const table = parseMarkdownTable(tableLines);
      if (table) {
        flushBuffers(); ensureSection();
        pushBlock(current!, { type: "table", table });
      }
      continue;
    }

    // ── Unordered list ────────────────────────────────────────────────────────
    if (isUnorderedBullet(line) || (isSubBullet(line) && !listOrdered && listBuf.length > 0)) {
      if (kvBuf.length > 0 && current) { flushKv(current, kvBuf); kvBuf = []; }
      ensureSection();
      if (listOrdered && listBuf.length > 0) { flushList(current!, listBuf, true); listBuf = []; }
      listOrdered = false;
      listBuf.push(line);
      continue;
    }

    // ── Ordered list ──────────────────────────────────────────────────────────
    if (isOrderedBullet(line) || (isSubBullet(line) && listOrdered && listBuf.length > 0)) {
      if (kvBuf.length > 0 && current) { flushKv(current, kvBuf); kvBuf = []; }
      ensureSection();
      if (!listOrdered && listBuf.length > 0) { flushList(current!, listBuf, false); listBuf = []; }
      listOrdered = true;
      listBuf.push(line);
      continue;
    }

    // ── Sub-bullet continuation ───────────────────────────────────────────────
    if (isSubBullet(line) && listBuf.length > 0) {
      listBuf.push(line);
      continue;
    }

    // ── Key-value pair ────────────────────────────────────────────────────────
    if (isKeyValue(line)) {
      if (listBuf.length > 0 && current) { flushList(current, listBuf, listOrdered); listBuf = []; }
      ensureSection();
      kvBuf.push(extractKeyValue(line));
      continue;
    }

    // ── Empty line ────────────────────────────────────────────────────────────
    if (line.trim() === "") {
      flushBuffers();
      continue;
    }

    // ── Paragraph ─────────────────────────────────────────────────────────────
    flushBuffers(); ensureSection();
    const text = stripInlineMarkdown(line.trim());
    if (text) {
      const last = current!.blocks[current!.blocks.length - 1];
      if (last?.type === "paragraph") {
        (last as Extract<DocumentBlock, { type: "paragraph" }>).text += " " + text;
      } else {
        pushBlock(current!, { type: "paragraph", text });
      }
    }
  }

  // Flush remaining
  flushSection();

  // Guard: always at least one section
  if (sections.length === 0) {
    sections.push({
      id: "s-0",
      blocks: [{ type: "paragraph", text: rawText.trim() || "(empty document)" }],
    });
  }

  const title = metaOverride.title ?? extractTitle(rawText) ?? "Document";

  return {
    id:   mkId(),
    meta: {
      title,
      docType: metaOverride.docType ?? inferDocType(title, rawText),
      date:    metaOverride.date    ?? todayFormatted(),
      status:  metaOverride.status  ?? "final",
      ...metaOverride,
    },
    sections,
    printable:  true,
    exportable: true,
  };
}

// ─── Smart body → schema parser ───────────────────────────────────────────────

export function parseBodyToSchema(
  body: string,
  meta: Partial<DocumentMeta> = {},
): DocumentSchema {
  if (!body || !body.trim()) {
    return buildDocument(
      { title: meta.title ?? "Untitled", docType: meta.docType ?? "Document", ...meta },
      [{ id: "s-0", blocks: [{ type: "paragraph", text: "(No content yet.)", muted: true }] }],
    );
  }

  if (body.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(body) as Partial<DocumentSchema>;
      if (parsed.meta && Array.isArray(parsed.sections)) {
        return parsed as DocumentSchema;
      }
    } catch { /* fall through to markdown parse */ }
  }

  return parseMarkdownToDocument(body, meta);
}

// ─── Build document from scratch ──────────────────────────────────────────────

export function buildDocument(
  meta: DocumentMeta,
  sections: DocumentSection[],
): DocumentSchema {
  return {
    id:         mkId(),
    meta:       { date: todayFormatted(), status: "final", ...meta },
    sections,
    printable:  true,
    exportable: true,
  };
}

// ─── Serialize schema to JSON string (for DB storage) ────────────────────────

export function serializeDocument(schema: DocumentSchema): string {
  return JSON.stringify(schema);
}

// ─── Export schema to plain text ─────────────────────────────────────────────

export function documentToPlainText(schema: DocumentSchema): string {
  const lines: string[] = [];

  const { meta } = schema;
  lines.push(meta.title.toUpperCase());
  if (meta.subtitle) lines.push(meta.subtitle);
  lines.push(`Type: ${meta.docType}  |  Date: ${meta.date ?? ""}  |  Status: ${(meta.status ?? "").toUpperCase()}`);
  if (meta.author)   lines.push(`Author: ${meta.author}`);
  lines.push("", "─".repeat(60), "");

  for (const section of schema.sections) {
    if (section.title) { lines.push("", `${section.title.toUpperCase()}`, "─".repeat(40)); }
    for (const block of section.blocks) {
      switch (block.type) {
        case "heading":   lines.push("", block.text, ""); break;
        case "paragraph": lines.push(block.text, ""); break;
        case "callout":   lines.push(`[${(block.variant ?? "INFO").toUpperCase()}] ${block.text}`, ""); break;
        case "divider":   lines.push("─".repeat(40)); break;
        case "spacer":    lines.push(""); break;
        case "quote":     lines.push(`"${block.text}"${block.author ? ` — ${block.author}` : ""}`, ""); break;
        case "code":      lines.push("```", block.text, "```", ""); break;
        case "list":      block.items.forEach((it, i) => { lines.push(block.ordered ? `${i + 1}. ${it.text}` : `• ${it.text}`); if (it.sub) it.sub.forEach(s => lines.push(`  • ${s.text}`)); }); lines.push(""); break;
        case "keyvalue":  block.pairs.forEach(p => lines.push(`${p.key}: ${p.value}`)); lines.push(""); break;
        case "table": {
          const t = block.table;
          lines.push(t.columns.map(c => c.label).join(" | "));
          lines.push(t.columns.map(() => "---").join(" | "));
          t.rows.forEach(r => lines.push((r.cells as string[]).join(" | ")));
          lines.push("");
          break;
        }
        case "metric-row": block.metrics.forEach(m => lines.push(`${m.label}: ${m.value}${m.sub ? ` (${m.sub})` : ""}`)); lines.push(""); break;
        case "badge-row":  lines.push(block.badges.map(b => b.label).join("  ·  "), ""); break;
        case "signature":  if (block.title) lines.push(block.title, ""); block.lines.forEach(l => lines.push(`${l.label}: ${l.value ?? "_______________"}`)); lines.push(""); break;
        default: break;
      }
    }
  }

  return lines.join("\n");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function extractTitle(text: string): string | null {
  const lines = text.trim().split("\n");
  for (const line of lines) {
    const t = line.replace(/^#+\s*/, "").trim();
    if (t.length > 3 && t.length < 120) return t;
  }
  return null;
}

export function inferDocType(title: string, body: string): string {
  const t = (title + " " + body).toLowerCase();
  if (t.includes("contract") || t.includes("agreement") || t.includes("terms"))    return "Contract";
  if (t.includes("proposal"))                                                         return "Proposal";
  if (t.includes("report"))                                                           return "Report";
  if (t.includes("invoice") || t.includes("receipt"))                                return "Invoice";
  if (t.includes("plan") || t.includes("roadmap") || t.includes("strategy"))        return "Plan";
  if (t.includes("research") || t.includes("analysis") || t.includes("study"))      return "Research";
  if (t.includes("guide") || t.includes("manual") || t.includes("handbook"))        return "Guide";
  if (t.includes("sop") || t.includes("procedure") || t.includes("process"))        return "SOP";
  if (t.includes("letter") || t.includes("correspondence"))                          return "Letter";
  if (t.includes("note") || t.includes("memo"))                                      return "Note";
  if (t.includes("meeting") || t.includes("agenda") || t.includes("minutes"))       return "Meeting Notes";
  if (t.includes("brief") || t.includes("summary"))                                  return "Brief";
  return "Document";
}

// ─── Document template library ────────────────────────────────────────────────

export function getDocumentTemplate(docType: string, context: Partial<DocumentMeta> = {}): DocumentSchema {
  const date = todayFormatted();
  const title = context.title ?? `${docType} Template`;

  const base: Partial<DocumentSchema> = {
    meta: {
      title,
      docType,
      date,
      status:  "draft",
      version: "1.0",
      ...context,
    },
    printable:  true,
    exportable: true,
  };

  const t = docType.toLowerCase();

  // ── Business Proposal ──────────────────────────────────────────────────────
  if (t.includes("proposal") || t.includes("pitch")) {
    return buildDocument(base.meta!, [
      { id: "cover", title: "Executive Summary", icon: "📋", blocks: [
        { type: "paragraph", text: "This proposal outlines the scope, objectives, timeline, and investment required to deliver a successful outcome. Our approach is designed to maximise value while minimising risk." },
        { type: "callout", variant: "info", text: "Prepared specifically for the client's review. All figures are subject to final scoping." },
      ]},
      { id: "problem", title: "Problem Statement", icon: "🎯", blocks: [
        { type: "heading", level: 3, text: "The Challenge" },
        { type: "paragraph", text: "Define the specific challenge or opportunity this proposal addresses." },
        { type: "list", items: [
          { text: "Current pain point one" },
          { text: "Current pain point two" },
          { text: "Current pain point three" },
        ]},
      ]},
      { id: "solution", title: "Proposed Solution", icon: "💡", blocks: [
        { type: "paragraph", text: "Describe the recommended solution and why it is the best approach." },
        { type: "keyvalue", pairs: [
          { key: "Approach",   value: "Detail the methodology here" },
          { key: "Technology", value: "List key tools and platforms" },
          { key: "Team Size",  value: "Number of dedicated team members" },
        ]},
      ]},
      { id: "timeline", title: "Timeline & Milestones", icon: "📅", blocks: [
        { type: "table", table: {
          columns: [{ label: "Phase" }, { label: "Deliverable" }, { label: "Duration" }, { label: "Due Date" }],
          rows: [
            { cells: ["Discovery",       "Requirements & scoping",  "2 weeks", "Week 2" ] },
            { cells: ["Design",          "Wireframes & prototypes",  "3 weeks", "Week 5" ] },
            { cells: ["Development",     "Build & integration",      "6 weeks", "Week 11"] },
            { cells: ["Testing & QA",    "Bug fixes & polish",       "2 weeks", "Week 13"] },
            { cells: ["Launch & Handoff","Final delivery",           "1 week",  "Week 14"] },
          ],
        }},
      ]},
      { id: "investment", title: "Investment", icon: "💰", blocks: [
        { type: "metric-row", metrics: [
          { label: "Total Investment", value: "$XX,XXX", sub: "One-time project fee"   },
          { label: "Timeline",         value: "14 weeks", sub: "From project kick-off" },
          { label: "Team",             value: "4 people",  sub: "Dedicated to project"  },
        ]},
        { type: "callout", variant: "success", text: "Payment terms: 50% upfront, 50% on delivery. Net 30 invoice." },
      ]},
      { id: "sig", title: "Agreement", blocks: [
        { type: "signature", title: "Authorisation", lines: [
          { label: "Client Name",   value: "" }, { label: "Signature", value: "" },
          { label: "Company",       value: "" }, { label: "Date",      value: "" },
          { label: "Provider Name", value: "" }, { label: "Signature", value: "" },
        ]},
      ]},
    ]);
  }

  // ── Report ─────────────────────────────────────────────────────────────────
  if (t.includes("report") || t.includes("analysis")) {
    return buildDocument(base.meta!, [
      { id: "summary", title: "Executive Summary", icon: "📊", blocks: [
        { type: "paragraph", text: "This report presents key findings, analysis, and recommendations based on the data collected during the reporting period." },
        { type: "metric-row", metrics: [
          { label: "Key Metric 1", value: "—", sub: "Description" },
          { label: "Key Metric 2", value: "—", sub: "Description" },
          { label: "Key Metric 3", value: "—", sub: "Description" },
          { label: "Key Metric 4", value: "—", sub: "Description" },
        ]},
      ]},
      { id: "background", title: "Background & Context", icon: "📚", blocks: [
        { type: "paragraph", text: "Provide context and background information relevant to the scope of this report." },
      ]},
      { id: "findings", title: "Key Findings", icon: "🔍", blocks: [
        { type: "heading", level: 3, text: "Finding 1: Title Here" },
        { type: "paragraph", text: "Detailed description of the first finding, supported by data." },
        { type: "heading", level: 3, text: "Finding 2: Title Here" },
        { type: "paragraph", text: "Detailed description of the second finding, supported by data." },
      ]},
      { id: "recommendations", title: "Recommendations", icon: "✅", blocks: [
        { type: "list", ordered: true, items: [
          { text: "First recommendation with supporting rationale" },
          { text: "Second recommendation with supporting rationale" },
          { text: "Third recommendation with supporting rationale" },
        ]},
      ]},
      { id: "conclusion", title: "Conclusion", icon: "🏁", blocks: [
        { type: "paragraph", text: "Summarise the report findings and reinforce the primary recommendations." },
      ]},
    ]);
  }

  // ── Meeting Notes ──────────────────────────────────────────────────────────
  if (t.includes("meeting") || t.includes("minutes") || t.includes("agenda")) {
    return buildDocument(base.meta!, [
      { id: "details", title: "Meeting Details", icon: "📅", blocks: [
        { type: "keyvalue", pairs: [
          { key: "Date",      value: date },
          { key: "Time",      value: "—" },
          { key: "Location",  value: "—" },
          { key: "Attendees", value: "—" },
          { key: "Facilitator", value: "—" },
        ]},
      ]},
      { id: "agenda", title: "Agenda", icon: "📋", blocks: [
        { type: "list", ordered: true, items: [
          { text: "Opening & introductions (5 min)" },
          { text: "Review of previous action items (10 min)" },
          { text: "Main discussion topics (30 min)" },
          { text: "Action items & next steps (10 min)" },
          { text: "Any other business (5 min)" },
        ]},
      ]},
      { id: "discussion", title: "Discussion Notes", icon: "💬", blocks: [
        { type: "heading", level: 3, text: "Topic 1" },
        { type: "paragraph", text: "Record the key points discussed for this agenda item." },
        { type: "heading", level: 3, text: "Topic 2" },
        { type: "paragraph", text: "Record the key points discussed for this agenda item." },
      ]},
      { id: "actions", title: "Action Items", icon: "✅", blocks: [
        { type: "table", table: {
          columns: [{ label: "Action" }, { label: "Owner" }, { label: "Due Date" }, { label: "Status" }],
          rows: [
            { cells: ["Describe the action", "Name", "Date", "Open"] },
            { cells: ["Describe the action", "Name", "Date", "Open"] },
          ],
        }},
      ]},
      { id: "next", title: "Next Steps", icon: "→", blocks: [
        { type: "paragraph", text: "Record the agreed next meeting date and any preparatory work required." },
        { type: "keyvalue", pairs: [{ key: "Next Meeting", value: "—" }, { key: "Location", value: "—" }] },
      ]},
    ]);
  }

  // ── Generic fallback ───────────────────────────────────────────────────────
  return buildDocument(base.meta!, [
    { id: "overview", title: "Overview", icon: "📄", blocks: [
      { type: "paragraph", text: "Add your document content here. This template supports all block types including headings, paragraphs, lists, tables, key-value pairs, callouts, code blocks, and more." },
      { type: "callout", variant: "info", text: "Tip: Structure your content using the available section and block types for a professional, consistent look." },
    ]},
    { id: "content", title: "Content", icon: "📝", blocks: [
      { type: "heading", level: 3, text: "Section Heading" },
      { type: "paragraph", text: "Add your content for this section." },
      { type: "list", items: [
        { text: "Key point one" },
        { text: "Key point two" },
        { text: "Key point three" },
      ]},
    ]},
    { id: "summary", title: "Summary", icon: "✅", blocks: [
      { type: "paragraph", text: "Summarise the key points of this document here." },
    ]},
  ]);
}
