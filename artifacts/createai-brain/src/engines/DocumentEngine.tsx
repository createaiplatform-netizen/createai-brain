import React, { useCallback, useRef } from "react";

// ─── Brand tokens ────────────────────────────────────────────────────────────
const BRAND = {
  accent:      "#6366f1",
  accentLight: "#818cf8",
  accentFaint: "rgba(99,102,241,0.08)",
  text:        "#f1f5f9",
  textMuted:   "#94a3b8",
  textFaint:   "#64748b",
  border:      "rgba(255,255,255,0.08)",
  surface:     "rgba(255,255,255,0.04)",
  surfaceHigh: "rgba(255,255,255,0.08)",
  bg:          "#0f0f1a",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type CellAlign = "left" | "center" | "right";

export interface DocumentTableCell {
  value: string;
  bold?: boolean;
  align?: CellAlign;
  color?: string;
  colspan?: number;
}

export interface DocumentTableRow {
  cells: (string | DocumentTableCell)[];
  isHeader?: boolean;
  highlight?: boolean;
}

export interface DocumentTable {
  caption?: string;
  columns: Array<{ label: string; align?: CellAlign; width?: string }>;
  rows: DocumentTableRow[];
}

export interface DocumentListItem {
  text: string;
  sub?: DocumentListItem[];
}

export type DocumentBlock =
  | { type: "heading";   level: 1 | 2 | 3 | 4;  text: string }
  | { type: "paragraph"; text: string; muted?: boolean }
  | { type: "callout";   text: string; icon?: string; variant?: "info" | "warn" | "success" | "danger" }
  | { type: "table";     table: DocumentTable }
  | { type: "list";      ordered?: boolean; items: DocumentListItem[] }
  | { type: "divider" }
  | { type: "spacer";    size?: "sm" | "md" | "lg" }
  | { type: "keyvalue";  pairs: Array<{ key: string; value: string; mono?: boolean }> }
  | { type: "badge-row"; badges: Array<{ label: string; color?: string; bg?: string }> }
  | { type: "metric-row"; metrics: Array<{ label: string; value: string; sub?: string; color?: string }> }
  | { type: "code";      text: string; language?: string }
  | { type: "quote";     text: string; author?: string };

export interface DocumentSection {
  id?: string;
  title?: string;
  subtitle?: string;
  icon?: string;
  blocks: DocumentBlock[];
  collapsible?: boolean;
  accent?: string;
}

export interface DocumentMeta {
  title: string;
  subtitle?: string;
  description?: string;
  author?: string;
  date?: string;
  tags?: string[];
  docType?: string;
  version?: string;
  status?: "draft" | "review" | "final" | "archived";
  logo?: string;
  footerText?: string;
}

export interface DocumentSchema {
  meta: DocumentMeta;
  sections: DocumentSection[];
  showToc?: boolean;
  printable?: boolean;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function statusColor(status?: DocumentMeta["status"]) {
  switch (status) {
    case "draft":    return { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24" };
    case "review":   return { bg: "rgba(99,102,241,0.12)",  text: "#818cf8" };
    case "final":    return { bg: "rgba(16,185,129,0.12)",  text: "#34d399" };
    case "archived": return { bg: "rgba(148,163,184,0.10)", text: "#94a3b8" };
    default:         return { bg: "rgba(99,102,241,0.12)",  text: "#818cf8" };
  }
}

function calloutStyle(variant?: "info" | "warn" | "success" | "danger") {
  switch (variant) {
    case "warn":    return { border: "#fbbf24", bg: "rgba(251,191,36,0.08)",   icon: "⚠️" };
    case "success": return { border: "#34d399", bg: "rgba(52,211,153,0.08)",   icon: "✅" };
    case "danger":  return { border: "#f87171", bg: "rgba(248,113,113,0.08)",  icon: "🚨" };
    default:        return { border: BRAND.accent, bg: BRAND.accentFaint,      icon: "ℹ️" };
  }
}

function resolveCell(c: string | DocumentTableCell): DocumentTableCell {
  return typeof c === "string" ? { value: c } : c;
}

// ─── Block renderers ──────────────────────────────────────────────────────────

function renderListItems(items: DocumentListItem[], ordered: boolean, depth = 0): React.ReactNode {
  return items.map((item, i) => (
    <li key={i} style={{ marginBottom: 4, paddingLeft: depth > 0 ? 0 : undefined }}>
      <span style={{ color: BRAND.text, fontSize: 14, lineHeight: 1.6 }}>{item.text}</span>
      {item.sub && item.sub.length > 0 && (
        <ol style={{ marginTop: 4, paddingLeft: 18, listStyle: ordered ? "decimal" : "disc" }}>
          {renderListItems(item.sub, ordered, depth + 1)}
        </ol>
      )}
    </li>
  ));
}

function BlockRenderer({ block }: { block: DocumentBlock }) {
  switch (block.type) {
    case "heading": {
      const sizes: Record<number, number> = { 1: 22, 2: 18, 3: 15, 4: 13 };
      const weights: Record<number, number> = { 1: 700, 2: 600, 3: 600, 4: 500 };
      return (
        <div style={{
          fontSize: sizes[block.level],
          fontWeight: weights[block.level],
          color: block.level === 1 ? BRAND.accentLight : BRAND.text,
          marginTop: block.level <= 2 ? 20 : 14,
          marginBottom: 8,
          letterSpacing: block.level === 1 ? "-0.4px" : undefined,
          borderBottom: block.level === 1 ? `1px solid ${BRAND.border}` : undefined,
          paddingBottom: block.level === 1 ? 8 : undefined,
        }}>
          {block.text}
        </div>
      );
    }

    case "paragraph":
      return (
        <p style={{
          fontSize: 14,
          lineHeight: 1.75,
          color: block.muted ? BRAND.textMuted : BRAND.text,
          margin: "6px 0 12px",
          whiteSpace: "pre-wrap",
        }}>
          {block.text}
        </p>
      );

    case "callout": {
      const s = calloutStyle(block.variant);
      return (
        <div style={{
          borderLeft: `3px solid ${s.border}`,
          background: s.bg,
          borderRadius: "0 8px 8px 0",
          padding: "10px 14px",
          margin: "12px 0",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{block.icon ?? s.icon}</span>
          <p style={{ fontSize: 13, color: BRAND.text, lineHeight: 1.6, margin: 0 }}>{block.text}</p>
        </div>
      );
    }

    case "table": {
      const { table } = block;
      return (
        <div style={{ margin: "14px 0", overflowX: "auto" }}>
          {table.caption && (
            <div style={{ fontSize: 12, color: BRAND.textMuted, marginBottom: 6 }}>{table.caption}</div>
          )}
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
            tableLayout: "fixed",
          }}>
            <thead>
              <tr>
                {table.columns.map((col, ci) => (
                  <th key={ci} style={{
                    padding: "8px 12px",
                    textAlign: col.align ?? "left",
                    color: BRAND.textMuted,
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderBottom: `1px solid ${BRAND.border}`,
                    width: col.width,
                    background: BRAND.surface,
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={ri} style={{
                  background: row.highlight ? BRAND.accentFaint : ri % 2 === 0 ? "transparent" : BRAND.surface,
                }}>
                  {row.cells.map((cell, ci) => {
                    const c = resolveCell(cell);
                    const col = table.columns[ci];
                    return (
                      <td
                        key={ci}
                        colSpan={c.colspan}
                        style={{
                          padding: "8px 12px",
                          textAlign: c.align ?? col?.align ?? "left",
                          color: c.color ?? (row.isHeader ? BRAND.accentLight : BRAND.text),
                          fontWeight: (c.bold ?? row.isHeader) ? 600 : 400,
                          borderBottom: `1px solid ${BRAND.border}`,
                          verticalAlign: "top",
                          lineHeight: 1.5,
                        }}
                      >
                        {c.value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "list":
      return (
        <ol style={{
          paddingLeft: 20,
          margin: "8px 0 12px",
          listStyle: block.ordered ? "decimal" : "disc",
        }}>
          {renderListItems(block.items, block.ordered ?? false)}
        </ol>
      );

    case "divider":
      return <hr style={{ border: "none", borderTop: `1px solid ${BRAND.border}`, margin: "16px 0" }} />;

    case "spacer": {
      const heights = { sm: 8, md: 16, lg: 28 };
      return <div style={{ height: heights[block.size ?? "md"] }} />;
    }

    case "keyvalue":
      return (
        <div style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "6px 16px",
          margin: "10px 0 14px",
          fontSize: 13,
        }}>
          {block.pairs.map((p, i) => (
            <React.Fragment key={i}>
              <span style={{ color: BRAND.textMuted, fontWeight: 500, whiteSpace: "nowrap" }}>{p.key}</span>
              <span style={{
                color: BRAND.text,
                fontFamily: p.mono ? "monospace" : undefined,
                fontSize: p.mono ? 12 : 13,
                wordBreak: "break-word",
              }}>
                {p.value}
              </span>
            </React.Fragment>
          ))}
        </div>
      );

    case "badge-row":
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0 12px" }}>
          {block.badges.map((b, i) => (
            <span key={i} style={{
              fontSize: 11,
              fontWeight: 600,
              color: b.color ?? BRAND.accentLight,
              background: b.bg ?? BRAND.accentFaint,
              borderRadius: 6,
              padding: "3px 9px",
              letterSpacing: "0.03em",
            }}>
              {b.label}
            </span>
          ))}
        </div>
      );

    case "metric-row":
      return (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(block.metrics.length, 4)}, 1fr)`,
          gap: 12,
          margin: "12px 0 16px",
        }}>
          {block.metrics.map((m, i) => (
            <div key={i} style={{
              background: BRAND.surface,
              border: `1px solid ${BRAND.border}`,
              borderRadius: 10,
              padding: "12px 14px",
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: m.color ?? BRAND.accentLight, letterSpacing: "-0.5px" }}>
                {m.value}
              </div>
              <div style={{ fontSize: 12, color: BRAND.textMuted, marginTop: 2 }}>{m.label}</div>
              {m.sub && <div style={{ fontSize: 11, color: BRAND.textFaint, marginTop: 2 }}>{m.sub}</div>}
            </div>
          ))}
        </div>
      );

    case "code":
      return (
        <pre style={{
          background: "rgba(0,0,0,0.3)",
          border: `1px solid ${BRAND.border}`,
          borderRadius: 8,
          padding: "12px 14px",
          fontSize: 12,
          color: "#a5f3fc",
          overflowX: "auto",
          margin: "10px 0 14px",
          lineHeight: 1.6,
          fontFamily: "'SF Mono', 'Fira Code', monospace",
        }}>
          <code>{block.text}</code>
        </pre>
      );

    case "quote":
      return (
        <blockquote style={{
          borderLeft: `3px solid ${BRAND.accent}`,
          paddingLeft: 14,
          margin: "12px 0",
          color: BRAND.textMuted,
          fontStyle: "italic",
        }}>
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{block.text}</p>
          {block.author && (
            <cite style={{ fontSize: 12, color: BRAND.textFaint, fontStyle: "normal", marginTop: 4, display: "block" }}>
              — {block.author}
            </cite>
          )}
        </blockquote>
      );

    default:
      return null;
  }
}

// ─── Section renderer ─────────────────────────────────────────────────────────

function SectionRenderer({ section }: { section: DocumentSection }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const accent = section.accent ?? BRAND.accent;

  return (
    <div style={{
      background: BRAND.surface,
      border: `1px solid ${BRAND.border}`,
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
    }}>
      {(section.title || section.icon) && (
        <div
          onClick={() => section.collapsible && setCollapsed(c => !c)}
          style={{
            padding: "14px 18px",
            borderBottom: collapsed ? "none" : `1px solid ${BRAND.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: section.collapsible ? "pointer" : "default",
            background: BRAND.surfaceHigh,
          }}
        >
          {section.icon && <span style={{ fontSize: 18 }}>{section.icon}</span>}
          <div style={{ flex: 1 }}>
            {section.title && (
              <div style={{ fontSize: 15, fontWeight: 600, color: BRAND.text }}>{section.title}</div>
            )}
            {section.subtitle && (
              <div style={{ fontSize: 12, color: BRAND.textMuted, marginTop: 2 }}>{section.subtitle}</div>
            )}
          </div>
          {section.collapsible && (
            <span style={{ color: BRAND.textFaint, fontSize: 14, transform: collapsed ? "rotate(-90deg)" : "none", transition: "transform 0.2s" }}>▾</span>
          )}
          <div style={{ width: 3, height: 32, background: accent, borderRadius: 2, flexShrink: 0 }} />
        </div>
      )}

      {!collapsed && (
        <div style={{ padding: "16px 18px" }}>
          {section.blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Table of contents ────────────────────────────────────────────────────────

function TableOfContents({ sections }: { sections: DocumentSection[] }) {
  const numbered = sections.filter(s => s.title);
  if (numbered.length < 3) return null;
  return (
    <div style={{
      background: BRAND.accentFaint,
      border: `1px solid ${BRAND.border}`,
      borderRadius: 10,
      padding: "14px 18px",
      marginBottom: 20,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.accentLight, marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        Contents
      </div>
      <ol style={{ margin: 0, padding: "0 0 0 18px", listStyle: "decimal" }}>
        {numbered.map((s, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: BRAND.text }}>
              {s.icon && <span style={{ marginRight: 6 }}>{s.icon}</span>}
              {s.title}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Document header ──────────────────────────────────────────────────────────

function DocumentHeader({ meta }: { meta: DocumentMeta }) {
  const sc = statusColor(meta.status);
  return (
    <div style={{
      borderBottom: `1px solid ${BRAND.border}`,
      paddingBottom: 20,
      marginBottom: 24,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          {meta.docType && (
            <div style={{ fontSize: 11, fontWeight: 600, color: BRAND.accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              {meta.docType}
            </div>
          )}
          <h1 style={{ fontSize: 26, fontWeight: 700, color: BRAND.text, margin: "0 0 6px", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
            {meta.title}
          </h1>
          {meta.subtitle && (
            <p style={{ fontSize: 15, color: BRAND.textMuted, margin: "0 0 10px", lineHeight: 1.5 }}>{meta.subtitle}</p>
          )}
          {meta.description && (
            <p style={{ fontSize: 13, color: BRAND.textFaint, margin: 0, lineHeight: 1.6 }}>{meta.description}</p>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          {meta.status && (
            <span style={{ fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.text, padding: "3px 10px", borderRadius: 6 }}>
              {meta.status.toUpperCase()}
            </span>
          )}
          {meta.version && (
            <span style={{ fontSize: 11, color: BRAND.textFaint }}>v{meta.version}</span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 14, alignItems: "center" }}>
        {meta.author && (
          <span style={{ fontSize: 12, color: BRAND.textMuted }}>
            <span style={{ color: BRAND.textFaint }}>By </span>{meta.author}
          </span>
        )}
        {meta.date && (
          <span style={{ fontSize: 12, color: BRAND.textMuted }}>
            <span style={{ color: BRAND.textFaint }}>Date </span>{meta.date}
          </span>
        )}
        {meta.tags && meta.tags.length > 0 && (
          <div style={{ display: "flex", gap: 5 }}>
            {meta.tags.map((tag, i) => (
              <span key={i} style={{ fontSize: 11, background: BRAND.surface, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted, padding: "2px 7px", borderRadius: 5 }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Document footer ──────────────────────────────────────────────────────────

function DocumentFooter({ meta }: { meta: DocumentMeta }) {
  return (
    <div style={{
      borderTop: `1px solid ${BRAND.border}`,
      marginTop: 24,
      paddingTop: 14,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 11, color: BRAND.textFaint }}>
        {meta.footerText ?? "Generated by CreateAI Brain"}
      </span>
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: BRAND.textFaint }}>
        {meta.date && <span>{meta.date}</span>}
        {meta.version && <span>v{meta.version}</span>}
      </div>
    </div>
  );
}

// ─── Export hook ──────────────────────────────────────────────────────────────

export function useDocumentExport(containerRef: React.RefObject<HTMLDivElement | null>) {
  const exportText = useCallback(() => {
    if (!containerRef.current) return;
    const text = containerRef.current.innerText;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "document.txt"; a.click();
    URL.revokeObjectURL(url);
  }, [containerRef]);

  const copyText = useCallback(async () => {
    if (!containerRef.current) return;
    await navigator.clipboard.writeText(containerRef.current.innerText);
  }, [containerRef]);

  const printDoc = useCallback(() => {
    if (!containerRef.current) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><style>
      body { font-family: -apple-system, sans-serif; color: #111; padding: 40px; max-width: 800px; margin: auto; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
      th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; }
      h1 { font-size: 22px; border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
      h2 { font-size: 17px; color: #333; }
      h3 { font-size: 14px; }
      pre { background: #f5f5f5; padding: 12px; border-radius: 6px; font-size: 12px; }
      blockquote { border-left: 3px solid #6366f1; padding-left: 12px; color: #555; }
    </style></head><body>${containerRef.current.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  }, [containerRef]);

  return { exportText, copyText, printDoc };
}

// ─── DocumentEngine ───────────────────────────────────────────────────────────

interface DocumentEngineProps {
  schema: DocumentSchema;
  className?: string;
  style?: React.CSSProperties;
  toolbar?: boolean;
  compact?: boolean;
}

export function DocumentEngine({ schema, style, toolbar = true, compact = false }: DocumentEngineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { exportText, copyText, printDoc } = useDocumentExport(containerRef);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await copyText();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", ...style }}>
      {toolbar && (
        <div style={{
          display: "flex",
          gap: 8,
          padding: "10px 0 14px",
          borderBottom: `1px solid ${BRAND.border}`,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}>
          <span style={{ fontSize: 12, color: BRAND.textMuted, flex: 1 }}>
            {schema.sections.length} section{schema.sections.length !== 1 ? "s" : ""}
          </span>
          {[
            { label: copied ? "Copied!" : "Copy Text", onClick: handleCopy, icon: "📋" },
            { label: "Export .txt",  onClick: exportText,  icon: "⬇️" },
            schema.printable !== false
              ? { label: "Print / PDF", onClick: printDoc, icon: "🖨️" }
              : null,
          ].filter(Boolean).map((btn, i) => (
            <button key={i} onClick={btn!.onClick} style={{
              fontSize: 12,
              padding: "5px 12px",
              background: BRAND.surface,
              border: `1px solid ${BRAND.border}`,
              borderRadius: 7,
              color: BRAND.textMuted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}>
              <span>{btn!.icon}</span>{btn!.label}
            </button>
          ))}
        </div>
      )}

      <div ref={containerRef} style={{ flex: 1, overflowY: "auto", paddingBottom: 24 }}>
        <DocumentHeader meta={schema.meta} />
        {schema.showToc !== false && <TableOfContents sections={schema.sections} />}
        {schema.sections.map((section, i) => (
          <SectionRenderer key={section.id ?? i} section={section} />
        ))}
        <DocumentFooter meta={schema.meta} />
      </div>
    </div>
  );
}

// ─── Helpers to build schemas quickly ────────────────────────────────────────

export function docHeading(text: string, level: 1 | 2 | 3 | 4 = 2): DocumentBlock {
  return { type: "heading", level, text };
}
export function docPara(text: string, muted?: boolean): DocumentBlock {
  return { type: "paragraph", text, muted };
}
export function docCallout(text: string, variant?: "info" | "warn" | "success" | "danger", icon?: string): DocumentBlock {
  return { type: "callout", text, variant, icon };
}
export function docTable(columns: DocumentTable["columns"], rows: DocumentTableRow[], caption?: string): DocumentBlock {
  return { type: "table", table: { columns, rows, caption } };
}
export function docList(items: string[], ordered = false): DocumentBlock {
  return { type: "list", ordered, items: items.map(text => ({ text })) };
}
export function docKeyValue(pairs: Array<{ key: string; value: string; mono?: boolean }>): DocumentBlock {
  return { type: "keyvalue", pairs };
}
export function docMetrics(metrics: Array<{ label: string; value: string; sub?: string; color?: string }>): DocumentBlock {
  return { type: "metric-row", metrics };
}
export function docBadges(labels: string[], color?: string): DocumentBlock {
  return { type: "badge-row", badges: labels.map(label => ({ label, color })) };
}
export function docDivider(): DocumentBlock { return { type: "divider" }; }
export function docSpacer(size?: "sm" | "md" | "lg"): DocumentBlock { return { type: "spacer", size }; }
export function docCode(text: string, language?: string): DocumentBlock { return { type: "code", text, language }; }
export function docQuote(text: string, author?: string): DocumentBlock { return { type: "quote", text, author }; }
