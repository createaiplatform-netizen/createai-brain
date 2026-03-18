// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT RENDERER — Professional React document display component
// Renders any DocumentSchema as a fully formatted, PDF-quality document.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useRef, useState } from "react";
import type {
  DocumentSchema,
  DocumentSection,
  DocumentBlock,
  DocumentListItem,
  DocumentTableCell,
} from "./DocumentSchema";
import {
  DOC_BRAND as B,
  DOC_FONT,
  SPACER_H,
  HEADING_SIZE,
  HEADING_WEIGHT,
  STATUS_STYLE,
  CONF_STYLE,
  CALLOUT_STYLE,
  THEME_ACCENT,
  docTypeIcon,
  formatDocDate,
} from "./DocumentStyles";
import { documentToPlainText } from "./DocumentEngine";

// ─── Cell resolver ────────────────────────────────────────────────────────────

function resolveCell(c: string | DocumentTableCell): DocumentTableCell {
  return typeof c === "string" ? { value: c } : c;
}

// ─── Sub-list items ───────────────────────────────────────────────────────────

function ListItems({ items, ordered, depth = 0 }: {
  items: DocumentListItem[];
  ordered: boolean;
  depth?: number;
}): React.ReactElement {
  return (
    <>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: depth === 0 ? 5 : 3, paddingLeft: 0 }}>
          <span style={{
            color:      item.muted ? B.textFaint : B.text,
            fontWeight: item.bold ? 600 : 400,
            fontSize:   14,
            lineHeight: 1.6,
          }}>
            {item.icon && <span style={{ marginRight: 6 }}>{item.icon}</span>}
            {item.text}
          </span>
          {item.sub && item.sub.length > 0 && (
            <ul style={{
              marginTop: 4, paddingLeft: 18,
              listStyle: ordered ? "lower-alpha" : "circle",
            }}>
              <ListItems items={item.sub} ordered={false} depth={depth + 1} />
            </ul>
          )}
        </li>
      ))}
    </>
  );
}

// ─── Block renderer ───────────────────────────────────────────────────────────

function BlockRenderer({ block, accent }: { block: DocumentBlock; accent: string }): React.ReactElement | null {
  switch (block.type) {

    // ── Heading ───────────────────────────────────────────────────────────────
    case "heading": {
      const size   = HEADING_SIZE[block.level]   ?? 13;
      const weight = HEADING_WEIGHT[block.level] ?? 500;
      const isLead = block.level <= 2;
      return (
        <div style={{
          fontSize:      size,
          fontWeight:    weight,
          color:         block.level === 1 ? accent : block.level === 2 ? B.accentLight : B.text,
          marginTop:     isLead ? 22 : 14,
          marginBottom:  8,
          letterSpacing: block.level <= 2 ? "-0.3px" : undefined,
          borderBottom:  block.level === 2 ? `1px solid ${B.border}` : undefined,
          paddingBottom: block.level === 2 ? 6 : undefined,
          fontFamily:    DOC_FONT.sans,
        }}>
          {block.text}
        </div>
      );
    }

    // ── Paragraph ─────────────────────────────────────────────────────────────
    case "paragraph":
      return (
        <p style={{
          fontSize:    block.lead ? 15 : 14,
          lineHeight:  1.75,
          color:       block.muted ? B.textMuted : B.text,
          margin:      "4px 0 12px",
          whiteSpace:  "pre-wrap",
          fontWeight:  block.lead ? 500 : 400,
          fontFamily:  DOC_FONT.sans,
        }}>
          {block.text}
        </p>
      );

    // ── Callout ───────────────────────────────────────────────────────────────
    case "callout": {
      const s = CALLOUT_STYLE[block.variant ?? "default"] ?? CALLOUT_STYLE.info;
      return (
        <div style={{
          borderLeft:   `3px solid ${s.border}`,
          background:   s.bg,
          borderRadius: "0 10px 10px 0",
          padding:      "10px 14px",
          margin:       "12px 0",
          display:      "flex",
          gap:          10,
          alignItems:   "flex-start",
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{block.icon ?? s.icon}</span>
          <p style={{ fontSize: 13, color: B.text, lineHeight: 1.65, margin: 0 }}>{block.text}</p>
        </div>
      );
    }

    // ── Table ─────────────────────────────────────────────────────────────────
    case "table": {
      const { table } = block;
      return (
        <div style={{ margin: "14px 0", overflowX: "auto", borderRadius: 10, border: `1px solid ${B.border}` }}>
          {table.caption && (
            <div style={{ fontSize: 11, color: B.textMuted, padding: "6px 12px 0", fontStyle: "italic" }}>
              {table.caption}
            </div>
          )}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "auto" }}>
            <thead>
              <tr>
                {table.columns.map((col, ci) => (
                  <th key={ci} style={{
                    padding:         "9px 13px",
                    textAlign:       col.align ?? "left",
                    color:           B.textMuted,
                    fontWeight:      600,
                    fontSize:        11,
                    textTransform:   "uppercase",
                    letterSpacing:   "0.05em",
                    borderBottom:    `1px solid ${B.border}`,
                    width:           col.width,
                    background:      B.surfaceHigh,
                    whiteSpace:      "nowrap",
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={ri} style={{
                  background: row.highlight
                    ? B.accentFaint
                    : (table.zebra !== false && ri % 2 !== 0) ? B.surface : "transparent",
                }}>
                  {row.cells.map((cell, ci) => {
                    const c   = resolveCell(cell);
                    const col = table.columns[ci];
                    return (
                      <td key={ci} colSpan={c.colspan} style={{
                        padding:        "8px 13px",
                        textAlign:      c.align ?? col?.align ?? "left",
                        color:          c.color ?? (row.isHeader ? accent : c.muted ? B.textFaint : B.text),
                        fontWeight:     (c.bold ?? row.isHeader) ? 600 : 400,
                        borderBottom:   `1px solid ${B.borderLight}`,
                        verticalAlign:  "top",
                        lineHeight:     1.5,
                        fontSize:       13,
                      }}>
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

    // ── List ──────────────────────────────────────────────────────────────────
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag style={{
          paddingLeft: 20,
          margin:      block.tight ? "4px 0 8px" : "8px 0 14px",
          listStyle:   block.ordered ? "decimal" : "disc",
          color:       B.text,
        }}>
          <ListItems items={block.items} ordered={block.ordered ?? false} />
        </Tag>
      );
    }

    // ── Divider ───────────────────────────────────────────────────────────────
    case "divider":
      return (
        <div style={{ margin: "18px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: B.border }} />
          {block.label && (
            <span style={{ fontSize: 10, color: B.textFaint, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {block.label}
            </span>
          )}
          {block.label && <div style={{ flex: 1, height: 1, background: B.border }} />}
        </div>
      );

    // ── Spacer ────────────────────────────────────────────────────────────────
    case "spacer":
      return <div style={{ height: SPACER_H[block.size ?? "md"] }} />;

    // ── Key-value ─────────────────────────────────────────────────────────────
    case "keyvalue": {
      const cols = block.columns === 2 ? "1fr 1fr" : "auto 1fr";
      return (
        <div style={{
          display:               "grid",
          gridTemplateColumns:   cols,
          gap:                   "5px 16px",
          margin:                "10px 0 14px",
          fontSize:              13,
          background:            B.surfaceCard,
          borderRadius:          8,
          padding:               "10px 14px",
          border:                `1px solid ${B.border}`,
        }}>
          {block.pairs.map((p, i) => (
            <React.Fragment key={i}>
              <span style={{ color: B.textMuted, fontWeight: 500, whiteSpace: "nowrap", fontSize: 12 }}>{p.key}</span>
              <span style={{
                color:      p.muted ? B.textFaint : B.text,
                fontFamily: p.mono ? DOC_FONT.mono : undefined,
                fontSize:   p.mono ? 12 : 13,
                wordBreak:  "break-word",
              }}>
                {p.value}
              </span>
            </React.Fragment>
          ))}
        </div>
      );
    }

    // ── Badge row ─────────────────────────────────────────────────────────────
    case "badge-row":
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0 12px" }}>
          {block.badges.map((badge, i) => (
            <span key={i} style={{
              fontSize:        11,
              fontWeight:      600,
              color:           badge.color ?? B.accentLight,
              background:      badge.bg    ?? B.accentFaint,
              border:          `1px solid ${badge.border ?? B.accentBorder}`,
              borderRadius:    20,
              padding:         "3px 10px",
              letterSpacing:   "0.03em",
              whiteSpace:      "nowrap",
            }}>
              {badge.label}
            </span>
          ))}
        </div>
      );

    // ── Metric row ────────────────────────────────────────────────────────────
    case "metric-row":
      return (
        <div style={{
          display:               "grid",
          gridTemplateColumns:   `repeat(${Math.min(block.metrics.length, 4)}, 1fr)`,
          gap:                   10,
          margin:                "12px 0 16px",
        }}>
          {block.metrics.map((m, i) => {
            const trendColor = m.trend === "up" ? B.success : m.trend === "down" ? B.danger : B.textFaint;
            const trendIcon  = m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : undefined;
            return (
              <div key={i} style={{
                background:   B.surface,
                border:       `1px solid ${B.border}`,
                borderRadius: 10,
                padding:      "13px 14px",
              }}>
                <div style={{
                  fontSize:      22,
                  fontWeight:    700,
                  color:         m.color ?? accent,
                  letterSpacing: "-0.5px",
                  display:       "flex",
                  alignItems:    "baseline",
                  gap:           6,
                }}>
                  {m.value}
                  {trendIcon && (
                    <span style={{ fontSize: 13, color: trendColor }}>{trendIcon}</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: B.textMuted, marginTop: 3, fontWeight: 500 }}>{m.label}</div>
                {m.sub && <div style={{ fontSize: 11, color: B.textFaint, marginTop: 2 }}>{m.sub}</div>}
              </div>
            );
          })}
        </div>
      );

    // ── Code ──────────────────────────────────────────────────────────────────
    case "code":
      return (
        <div style={{ margin: "10px 0 14px" }}>
          {block.caption && (
            <div style={{ fontSize: 10, color: B.textFaint, marginBottom: 4, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {block.caption}
            </div>
          )}
          <pre style={{
            background:   "rgba(0,0,0,0.40)",
            border:       `1px solid ${B.border}`,
            borderRadius: 8,
            padding:      "12px 14px",
            fontSize:     12,
            color:        "#a5f3fc",
            overflowX:    "auto",
            lineHeight:   1.65,
            fontFamily:   DOC_FONT.mono,
            margin:       0,
          }}>
            <code>{block.text}</code>
          </pre>
        </div>
      );

    // ── Quote ─────────────────────────────────────────────────────────────────
    case "quote":
      return (
        <blockquote style={{
          borderLeft:  `3px solid ${accent}`,
          paddingLeft: 16,
          margin:      "14px 0",
          fontStyle:   "italic",
        }}>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: B.textMuted, margin: 0 }}>
            "{block.text}"
          </p>
          {(block.author || block.role) && (
            <cite style={{
              fontSize:   12,
              color:      B.textFaint,
              fontStyle:  "normal",
              marginTop:  6,
              display:    "block",
              fontWeight: 500,
            }}>
              — {block.author}{block.role ? `, ${block.role}` : ""}
            </cite>
          )}
        </blockquote>
      );

    // ── Signature ─────────────────────────────────────────────────────────────
    case "signature":
      return (
        <div style={{
          background:   B.surfaceCard,
          border:       `1px solid ${B.border}`,
          borderRadius: 10,
          padding:      "16px 18px",
          margin:       "14px 0",
        }}>
          {block.title && (
            <div style={{ fontSize: 11, fontWeight: 700, color: B.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              {block.title}
            </div>
          )}
          <div style={{
            display:             "grid",
            gridTemplateColumns: "1fr 1fr",
            gap:                 16,
          }}>
            {block.lines.map((line, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, color: B.textMuted, fontWeight: 500, marginBottom: 6 }}>{line.label}</div>
                <div style={{
                  borderBottom: `1px solid ${B.border}`,
                  minHeight:    32,
                  paddingBottom: 4,
                  fontSize:     13,
                  color:        line.value ? B.text : B.textFaint,
                }}>
                  {line.value || ""}
                  {line.subtitle && (
                    <div style={{ fontSize: 10, color: B.textFaint, marginTop: 3 }}>{line.subtitle}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {block.date && (
            <div style={{ fontSize: 11, color: B.textFaint, marginTop: 12 }}>Date: {block.date}</div>
          )}
        </div>
      );

    // ── Cover ─────────────────────────────────────────────────────────────────
    case "cover":
      return (
        <div style={{
          background:   `linear-gradient(135deg, ${B.accentGlow}, transparent)`,
          border:       `1px solid ${B.accentBorder}`,
          borderRadius: 16,
          padding:      "28px 24px",
          margin:       "0 0 20px",
          textAlign:    "center",
        }}>
          {block.badge && (
            <div style={{
              display:       "inline-block",
              background:    B.accentFaint,
              border:        `1px solid ${B.accentBorder}`,
              borderRadius:  20,
              padding:       "3px 12px",
              fontSize:      11,
              fontWeight:    700,
              color:         B.accentLight,
              letterSpacing: "0.06em",
              marginBottom:  16,
            }}>
              {block.badge}
            </div>
          )}
          <h1 style={{ fontSize: 26, fontWeight: 800, color: B.text, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
            {block.title}
          </h1>
          {block.subtitle && (
            <p style={{ fontSize: 15, color: B.textMuted, margin: "0 0 20px" }}>{block.subtitle}</p>
          )}
          {block.meta && block.meta.length > 0 && (
            <div style={{
              display:   "flex",
              flexWrap:  "wrap",
              gap:       12,
              justifyContent: "center",
              marginTop: 16,
            }}>
              {block.meta.map((m, i) => (
                <div key={i} style={{
                  background:   B.surfaceCard,
                  borderRadius: 8,
                  padding:      "6px 14px",
                  border:       `1px solid ${B.border}`,
                  textAlign:    "left",
                }}>
                  <div style={{ fontSize: 10, color: B.textFaint, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{m.label}</div>
                  <div style={{ fontSize: 13, color: B.text, fontWeight: 600, marginTop: 2 }}>{m.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

// ─── Section renderer ─────────────────────────────────────────────────────────

function SectionRenderer({ section, accent, sectionNumber }: {
  section: DocumentSection;
  accent: string;
  sectionNumber?: number;
}): React.ReactElement {
  const [collapsed, setCollapsed] = useState(false);
  const sectionAccent = section.accent ?? accent;

  return (
    <div style={{
      background:   B.surface,
      border:       `1px solid ${B.border}`,
      borderRadius: 12,
      marginBottom: 14,
      overflow:     "hidden",
    }}>
      {(section.title || section.icon) && (
        <div
          onClick={() => section.collapsible && setCollapsed(c => !c)}
          style={{
            padding:      "13px 18px",
            borderBottom: collapsed ? "none" : `1px solid ${B.border}`,
            display:      "flex",
            alignItems:   "center",
            gap:          10,
            cursor:       section.collapsible ? "pointer" : "default",
            background:   B.surfaceHigh,
            userSelect:   "none",
          }}
        >
          {sectionNumber !== undefined && (
            <div style={{
              width:        22,
              height:       22,
              borderRadius: "50%",
              background:   `${sectionAccent}22`,
              border:       `1px solid ${sectionAccent}44`,
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              fontSize:     10,
              fontWeight:   700,
              color:        sectionAccent,
              flexShrink:   0,
            }}>
              {sectionNumber}
            </div>
          )}
          {section.icon && (
            <span style={{ fontSize: 16, flexShrink: 0 }}>{section.icon}</span>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: B.text, letterSpacing: "-0.1px" }}>
              {section.title}
            </div>
            {section.subtitle && (
              <div style={{ fontSize: 11, color: B.textFaint, marginTop: 1 }}>{section.subtitle}</div>
            )}
          </div>
          {section.collapsible && (
            <span style={{ fontSize: 13, color: B.textFaint, transform: collapsed ? "rotate(-90deg)" : "none", transition: "transform 0.2s" }}>
              ▾
            </span>
          )}
        </div>
      )}
      {!collapsed && (
        <div style={{ padding: "16px 18px" }}>
          {section.blocks.map((block, bi) => (
            <BlockRenderer key={bi} block={block} accent={sectionAccent} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Table of contents ───────────────────────────────────────────────────────

function TableOfContents({ sections }: { sections: DocumentSection[] }): React.ReactElement {
  const numbered = sections.filter(s => s.title);
  if (numbered.length < 3) return <></>;
  return (
    <div style={{
      background:   B.surfaceCard,
      border:       `1px solid ${B.border}`,
      borderRadius: 10,
      padding:      "14px 18px",
      marginBottom: 18,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: B.textFaint, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
        Contents
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {numbered.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: B.textFaint, fontWeight: 500, minWidth: 16 }}>{i + 1}.</span>
            <span style={{ fontSize: 13, color: B.textMuted, fontWeight: 400 }}>{s.icon ? `${s.icon} ` : ""}{s.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Document header ─────────────────────────────────────────────────────────

function DocumentHeader({ schema, accent }: { schema: DocumentSchema; accent: string }): React.ReactElement {
  const { meta } = schema;
  const status = meta.status ? STATUS_STYLE[meta.status] : null;
  const conf   = meta.confidentiality ? CONF_STYLE[meta.confidentiality] : null;

  return (
    <div style={{
      background:   `linear-gradient(180deg, ${B.surfaceHigh} 0%, ${B.surface} 100%)`,
      borderBottom: `1px solid ${B.border}`,
      padding:      "18px 20px 16px",
      marginBottom: 18,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width:          44,
          height:         44,
          borderRadius:   12,
          background:     `${accent}18`,
          border:         `1px solid ${accent}33`,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       22,
          flexShrink:     0,
        }}>
          {docTypeIcon(meta.docType)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: B.text, margin: 0, letterSpacing: "-0.3px", lineHeight: 1.2 }}>
              {meta.title}
            </h1>
            {status && (
              <span style={{
                fontSize:    10,
                fontWeight:  700,
                color:       status.text,
                background:  status.bg,
                border:      `1px solid ${status.border}`,
                borderRadius: 20,
                padding:     "2px 8px",
                letterSpacing: "0.06em",
                whiteSpace:  "nowrap",
              }}>
                {status.label}
              </span>
            )}
            {conf && (
              <span style={{
                fontSize:     10,
                fontWeight:   700,
                color:        conf.text,
                background:   conf.bg,
                border:       `1px solid ${conf.border}`,
                borderRadius: 20,
                padding:      "2px 8px",
                letterSpacing: "0.06em",
                whiteSpace:   "nowrap",
              }}>
                🔒 {conf.label}
              </span>
            )}
          </div>
          {meta.subtitle && (
            <p style={{ fontSize: 13, color: B.textMuted, margin: "0 0 8px" }}>{meta.subtitle}</p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 11, color: B.textFaint }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: accent }}>●</span>
              {meta.docType}
            </span>
            {meta.author && <span>By {meta.author}</span>}
            {meta.organization && <span>{meta.organization}</span>}
            {meta.date && <span>{formatDocDate(meta.date)}</span>}
            {meta.version && <span>v{meta.version}</span>}
            {meta.reference && <span>Ref: {meta.reference}</span>}
          </div>
          {meta.tags && meta.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {meta.tags.map((tag, i) => (
                <span key={i} style={{
                  fontSize:     10,
                  color:        B.textFaint,
                  background:   B.surfaceCard,
                  borderRadius: 4,
                  padding:      "2px 6px",
                  border:       `1px solid ${B.border}`,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function Toolbar({ schema, containerRef }: {
  schema: DocumentSchema;
  containerRef: React.RefObject<HTMLDivElement | null>;
}): React.ReactElement {
  const [copied, setCopied]   = useState(false);
  const [printing, setPrinting] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = documentToPlainText(schema);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [schema]);

  const handleExport = useCallback(() => {
    const text = documentToPlainText(schema);
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${schema.meta.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [schema]);

  const handlePrint = useCallback(() => {
    if (!containerRef.current) return;
    setPrinting(true);
    const html = containerRef.current.innerHTML;
    const win  = window.open("", "_blank", "width=800,height=900");
    if (!win) { setPrinting(false); return; }
    win.document.write(`<!DOCTYPE html><html><head><title>${schema.meta.title}</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 40px; color: #1e293b; font-size: 13px; line-height: 1.6; }
        h1,h2,h3,h4 { color: #1e293b; margin-top: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th,td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
        th { background: #f8fafc; font-weight: 600; font-size: 11px; text-transform: uppercase; }
        pre { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; overflow-x: auto; }
        blockquote { border-left: 3px solid #6366f1; padding-left: 14px; color: #64748b; font-style: italic; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); setPrinting(false); }, 400);
  }, [schema, containerRef]);

  const btns: Array<{ label: string; icon: string; onClick: () => void; active?: boolean }> = [
    { label: copied ? "Copied!" : "Copy",   icon: copied ? "✓" : "📋", onClick: handleCopy,   active: copied },
    { label: "Export",                        icon: "⬇️",                onClick: handleExport },
  ];
  if (schema.printable !== false) {
    btns.push({ label: printing ? "Opening…" : "Print", icon: "🖨️", onClick: handlePrint });
  }

  return (
    <div style={{
      display:        "flex",
      gap:            6,
      padding:        "8px 20px",
      borderTop:      `1px solid ${B.border}`,
      background:     B.surfaceCard,
      justifyContent: "flex-end",
    }}>
      {btns.map((btn, i) => (
        <button key={i} onClick={btn.onClick} style={{
          background:   btn.active ? B.accentFaint : B.surface,
          border:       `1px solid ${btn.active ? B.accentBorder : B.border}`,
          borderRadius: 8,
          padding:      "5px 12px",
          fontSize:     11,
          fontWeight:   600,
          color:        btn.active ? B.accentLight : B.textMuted,
          cursor:       "pointer",
          display:      "flex",
          alignItems:   "center",
          gap:          5,
        }}>
          <span>{btn.icon}</span>
          <span>{btn.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main DocumentRenderer ────────────────────────────────────────────────────

export interface DocumentRendererProps {
  schema:   DocumentSchema;
  style?:   React.CSSProperties;
  compact?: boolean;
  toolbar?: boolean;
  showToc?: boolean;
}

export function DocumentRenderer({
  schema,
  style,
  compact  = false,
  toolbar  = true,
  showToc,
}: DocumentRendererProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const accent = THEME_ACCENT[schema.theme ?? "default"] ?? B.accent;
  const showContents = showToc ?? (schema.showToc !== false && !compact && schema.sections.length >= 3);
  const pad = compact ? 14 : 20;

  const numberedSections = schema.meta ? schema.sections.filter(s => s.numbered !== false) : [];

  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      background:    B.bg,
      borderRadius:  compact ? 10 : 14,
      border:        `1px solid ${B.border}`,
      overflow:      "hidden",
      fontFamily:    DOC_FONT.sans,
      fontSize:      14,
      color:         B.text,
      ...style,
    }}>
      {/* Header */}
      <DocumentHeader schema={schema} accent={accent} />

      {/* Body */}
      <div
        ref={containerRef}
        style={{
          flex:       1,
          overflowY:  "auto",
          padding:    `0 ${pad}px ${pad}px`,
        }}
      >
        {/* TOC */}
        {showContents && <TableOfContents sections={schema.sections} />}

        {/* Sections */}
        {schema.sections.map((section, si) => (
          <SectionRenderer
            key={section.id ?? si}
            section={section}
            accent={accent}
            sectionNumber={section.numbered !== false && section.title && !compact ? si + 1 : undefined}
          />
        ))}
      </div>

      {/* Toolbar */}
      {toolbar && <Toolbar schema={schema} containerRef={containerRef} />}
    </div>
  );
}
