import React from "react";

interface Props {
  content: string;
  className?: string;
  compact?: boolean;
}

const NEXT_STEPS_PATTERNS = [
  /^##\s*(smart next steps|next steps|what to do next|what to do first|recommended next steps|your next steps)/i,
];
const CALLOUT_PATTERNS = [
  /^##\s*(what to do first|start here|immediate action|first step)/i,
];
const SUMMARY_PATTERNS = [
  /^##\s*(summary|overview|tldr|tl;dr|at a glance)/i,
];
const WARNING_PATTERNS = [
  /^##\s*(warning|caution|important|critical|danger|risk)/i,
];
const SUCCESS_PATTERNS = [
  /^##\s*(success|completed|result|outcome|achieved|win)/i,
];
const INFO_PATTERNS = [
  /^##\s*(note|info|context|background|definition|tip|hint)/i,
];

function isNextStepsHeading(line: string)  { return NEXT_STEPS_PATTERNS.some(p => p.test(line)); }
function isCalloutHeading(line: string)    { return CALLOUT_PATTERNS.some(p => p.test(line)); }
function isSummaryHeading(line: string)    { return SUMMARY_PATTERNS.some(p => p.test(line)); }
function isWarningHeading(line: string)    { return WARNING_PATTERNS.some(p => p.test(line)); }
function isSuccessHeading(line: string)    { return SUCCESS_PATTERNS.some(p => p.test(line)); }
function isInfoHeading(line: string)       { return INFO_PATTERNS.some(p => p.test(line)); }

// ─── Inline formatting: **bold**, `code`, _italic_ ───────────────────────
function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch   = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch   = remaining.match(/`(.+?)`/);
    const italicMatch = remaining.match(/_(.+?)_/);

    const boldIdx   = boldMatch?.index   ?? Infinity;
    const codeIdx   = codeMatch?.index   ?? Infinity;
    const italicIdx = italicMatch?.index ?? Infinity;

    const minIdx = Math.min(boldIdx, codeIdx, italicIdx);

    if (minIdx === Infinity) { parts.push(remaining); break; }

    if (minIdx === boldIdx && boldMatch) {
      if (boldIdx > 0) parts.push(remaining.slice(0, boldIdx));
      parts.push(<strong key={key++} className="font-semibold text-foreground">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldIdx + boldMatch[0].length);
    } else if (minIdx === codeIdx && codeMatch) {
      if (codeIdx > 0) parts.push(remaining.slice(0, codeIdx));
      parts.push(
        <code key={key++} className="px-1 py-0.5 rounded text-[11px] font-mono"
          style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.15)" }}>
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeIdx + codeMatch[0].length);
    } else if (minIdx === italicIdx && italicMatch) {
      if (italicIdx > 0) parts.push(remaining.slice(0, italicIdx));
      parts.push(<em key={key++} className="italic text-foreground/70">{italicMatch[1]}</em>);
      remaining = remaining.slice(italicIdx + italicMatch[0].length);
    } else {
      parts.push(remaining); break;
    }
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

// ─── Inline blockquote callout (> ⚠️ ... or > ℹ️ ...) ───────────────────
function parseBlockquote(text: string): { type: "warning" | "info" | "success" | "default"; body: string } {
  const t = text.trim();
  if (/^(⚠️|warning|warn|!)/i.test(t)) return { type: "warning", body: t.replace(/^(⚠️|warning|warn|!)[:.\s]*/i, "") };
  if (/^(✅|success|done|ok|good)/i.test(t)) return { type: "success", body: t.replace(/^(✅|success|done|ok|good)[:.\s]*/i, "") };
  if (/^(ℹ️|info|note|tip|hint)/i.test(t)) return { type: "info", body: t.replace(/^(ℹ️|info|note|tip|hint)[:.\s]*/i, "") };
  return { type: "default", body: t };
}

const BLOCKQUOTE_STYLES = {
  warning: { bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.25)", icon: "⚠️", color: "#fbbf24" },
  success: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)", icon: "✅", color: "#4ade80" },
  info:    { bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.25)", icon: "ℹ️", color: "#818cf8" },
  default: { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.12)", icon: "›", color: "rgba(255,255,255,0.55)" },
};

type SectionMode = "normal" | "next-steps" | "callout" | "summary" | "warning" | "success" | "info";

// ─── Code block component ─────────────────────────────────────────────────
function CodeBlock({ lang, code, compact }: { lang: string; code: string; compact: boolean }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className={`rounded-xl overflow-hidden ${compact ? "my-1.5" : "my-2"}`}
      style={{ background: "rgba(6,8,18,0.90)", border: "1px solid rgba(255,255,255,0.10)" }}>
      <div className="flex items-center justify-between px-3 py-1.5"
        style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#818cf8" }}>
          {lang || "code"}
        </span>
        <button onClick={copy}
          className="text-[10px] font-medium px-2 py-0.5 rounded-md transition-all"
          style={{ color: copied ? "#4ade80" : "rgba(255,255,255,0.40)", background: "rgba(255,255,255,0.06)" }}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[11px] font-mono leading-relaxed"
        style={{ color: "rgba(255,255,255,0.82)" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function OutputFormatter({ content, className = "", compact = false }: Props) {
  if (!content?.trim()) return null;

  const rawLines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: { text: string; ordered?: boolean; num?: number }[] = [];
  let listOrdered = false;
  let sectionMode: SectionMode = "normal";
  let sectionContainer: React.ReactNode[] | null = null;
  let idx = 0;

  // ─── Code block accumulator ───────────────────────────────────────────
  let inCode = false;
  let codeLang = "";
  let codeLines: string[] = [];
  const lines: string[] = [];

  for (const raw of rawLines) {
    if (!inCode && raw.startsWith("```")) {
      inCode = true;
      codeLang = raw.slice(3).trim();
      codeLines = [];
    } else if (inCode && raw.trimEnd() === "```") {
      inCode = false;
      lines.push(`\x00CODE\x00${codeLang}\x00${codeLines.join("\n")}\x00`);
    } else if (inCode) {
      codeLines.push(raw);
    } else {
      lines.push(raw);
    }
  }
  if (inCode && codeLines.length > 0) {
    lines.push(`\x00CODE\x00${codeLang}\x00${codeLines.join("\n")}\x00`);
  }

  const flushList = () => {
    if (listItems.length === 0) return;

    const target = sectionContainer ?? elements;

    if (sectionMode === "next-steps") {
      target.push(
        <div key={`ns-list-${idx++}`} className="space-y-2">
          {listItems.map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl px-3 py-2.5"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: "rgba(99,102,241,0.20)", color: "#818cf8" }}>
                {i + 1}
              </span>
              <span className={`leading-relaxed ${compact ? "text-[12px]" : "text-[13px]"} text-foreground/85`}>
                {inlineFormat(item.text)}
              </span>
            </div>
          ))}
        </div>
      );
    } else if (sectionMode === "callout") {
      target.push(
        <div key={`co-list-${idx++}`} className="space-y-1.5">
          {listItems.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-[13px] flex-shrink-0 mt-0.5">✦</span>
              <span className={`leading-relaxed ${compact ? "text-[12px]" : "text-[13px]"} font-medium text-foreground/90`}>
                {inlineFormat(item.text)}
              </span>
            </div>
          ))}
        </div>
      );
    } else if (listOrdered) {
      target.push(
        <ol key={`ol-${idx++}`} className={compact ? "space-y-1" : "space-y-2"}>
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                {item.num ?? i + 1}
              </span>
              <span className={`leading-relaxed ${compact ? "text-[12px]" : "text-[13px]"} text-foreground/80`}>
                {inlineFormat(item.text)}
              </span>
            </li>
          ))}
        </ol>
      );
    } else {
      target.push(
        <ul key={`ul-${idx++}`} className={compact ? "space-y-1" : "space-y-2"}>
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[6px]"
                style={{ background: "rgba(99,102,241,0.6)" }} />
              <span className={`leading-relaxed ${compact ? "text-[12px]" : "text-[13px]"} text-foreground/80`}>
                {inlineFormat(item.text)}
              </span>
            </li>
          ))}
        </ul>
      );
    }
    listItems = [];
  };

  const flushSection = () => {
    if (sectionContainer && sectionContainer.length > 0) {
      elements.push(<React.Fragment key={`sec-${idx++}`}>{sectionContainer}</React.Fragment>);
    }
    sectionContainer = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // ── Fenced code block (pre-parsed as sentinel) ──
    if (line.startsWith("\x00CODE\x00")) {
      flushList();
      flushSection();
      sectionMode = "normal";
      const parts = line.split("\x00");
      const lang  = parts[2] ?? "";
      const code  = parts[3] ?? "";
      elements.push(<CodeBlock key={`code-${i}`} lang={lang} code={code} compact={compact} />);
      continue;
    }

    // ── Blockquote ──
    if (line.startsWith("> ")) {
      flushList();
      const bq = parseBlockquote(line.slice(2));
      const s  = BLOCKQUOTE_STYLES[bq.type];
      const target = sectionContainer ?? elements;
      target.push(
        <div key={`bq-${i}`} className="flex items-start gap-2 rounded-xl px-3 py-2.5"
          style={{ background: s.bg, border: `1px solid ${s.border}` }}>
          <span className="text-[13px] flex-shrink-0 mt-0.5">{s.icon}</span>
          <span className={`leading-relaxed ${compact ? "text-[12px]" : "text-[13px]"}`} style={{ color: s.color }}>
            {inlineFormat(bq.body)}
          </span>
        </div>
      );
      continue;
    }

    // ── H1 ──
    if (line.startsWith("# ")) {
      flushList(); flushSection(); sectionMode = "normal";
      elements.push(
        <h2 key={`h1-${i}`}
          className={`font-bold text-foreground ${compact ? "text-[15px] mt-1" : "text-[18px] mt-2"}`}
          style={{ letterSpacing: "-0.02em" }}>
          {inlineFormat(line.slice(2))}
        </h2>
      );
      continue;
    }

    // ── H2 (special section detection) ──
    if (line.startsWith("## ")) {
      flushList(); flushSection(); sectionMode = "normal";

      if (isNextStepsHeading(line)) {
        sectionMode = "next-steps";
        sectionContainer = [];
        sectionContainer.push(
          <div key={`ns-hdr-${i}`} className="mt-4 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: "#818cf8" }}>
              <span>↗</span> {line.slice(3)}
            </p>
          </div>
        );
      } else if (isCalloutHeading(line)) {
        sectionMode = "callout";
        sectionContainer = [];
        sectionContainer.push(
          <div key={`co-hdr-${i}`}
            className={`rounded-xl px-4 py-3 ${compact ? "mt-2" : "mt-3"}`}
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.10), rgba(139,92,246,0.08))", border: "1px solid rgba(99,102,241,0.22)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: "#a5b4fc" }}>
              <span>✦</span> {line.slice(3)}
            </p>
          </div>
        );
      } else if (isSummaryHeading(line)) {
        sectionMode = "summary";
        elements.push(
          <div key={`sum-${i}`} className={compact ? "mt-2" : "mt-3"}>
            <h3 className={`font-semibold text-foreground ${compact ? "text-[13px]" : "text-[15px]"} pb-1.5 flex items-center gap-2`}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", letterSpacing: "-0.01em" }}>
              <span className="text-primary text-[11px]">◆</span>
              {inlineFormat(line.slice(3))}
            </h3>
          </div>
        );
      } else if (isWarningHeading(line)) {
        sectionMode = "warning";
        sectionContainer = [];
        sectionContainer.push(
          <div key={`warn-hdr-${i}`}
            className={`rounded-xl px-4 py-3 ${compact ? "mt-2" : "mt-3"}`}
            style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.22)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: "#fbbf24" }}>
              <span>⚠️</span> {line.slice(3)}
            </p>
          </div>
        );
      } else if (isSuccessHeading(line)) {
        sectionMode = "success";
        sectionContainer = [];
        sectionContainer.push(
          <div key={`suc-hdr-${i}`}
            className={`rounded-xl px-4 py-3 ${compact ? "mt-2" : "mt-3"}`}
            style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.20)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: "#4ade80" }}>
              <span>✅</span> {line.slice(3)}
            </p>
          </div>
        );
      } else if (isInfoHeading(line)) {
        sectionMode = "info";
        sectionContainer = [];
        sectionContainer.push(
          <div key={`info-hdr-${i}`}
            className={`rounded-xl px-4 py-3 ${compact ? "mt-2" : "mt-3"}`}
            style={{ background: "rgba(14,165,233,0.07)", border: "1px solid rgba(14,165,233,0.22)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: "#38bdf8" }}>
              <span>ℹ️</span> {line.slice(3)}
            </p>
          </div>
        );
      } else {
        elements.push(
          <div key={`h2-${i}`} className={compact ? "mt-2" : "mt-3"}>
            <h3 className={`font-semibold text-foreground ${compact ? "text-[13px]" : "text-[15px]"} pb-1.5`}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", letterSpacing: "-0.01em" }}>
              {inlineFormat(line.slice(3))}
            </h3>
          </div>
        );
      }
      continue;
    }

    // ── H3 ──
    if (line.startsWith("### ")) {
      flushList();
      const target = sectionContainer ?? elements;
      target.push(
        <h4 key={`h3-${i}`}
          className={`font-semibold text-primary ${compact ? "text-[11px]" : "text-[12px]"} uppercase tracking-wider mt-1`}>
          {inlineFormat(line.slice(4))}
        </h4>
      );
      continue;
    }

    // ── Separator pill ──
    if (line.match(/^={2,}\s.+\s={2,}$/)) {
      flushList(); flushSection(); sectionMode = "normal";
      const label = line.replace(/^=+\s/, "").replace(/\s=+$/, "");
      elements.push(
        <div key={`sep-${i}`} className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ color: "#818cf8", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.18)" }}>
            {label}
          </span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>
      );
      continue;
    }

    // ── Bullet list ──
    if (/^[-•*→▸✓✦✅]\s/.test(line)) {
      const text = line.slice(2);
      if (listOrdered && listItems.length > 0) flushList();
      listOrdered = false;
      listItems.push({ text });
      continue;
    }

    // ── Ordered list ──
    if (/^\d+\.\s/.test(line)) {
      const num  = parseInt(line.match(/^(\d+)/)?.[1] ?? "1");
      const text = line.replace(/^\d+\.\s/, "");
      if (!listOrdered && listItems.length > 0) flushList();
      listOrdered = true;
      listItems.push({ text, num });
      continue;
    }

    // ── Blank line ──
    if (line.trim() === "") { flushList(); continue; }

    // ── HR ──
    if (/^---+$|^===+$/.test(line.trim())) {
      flushList(); flushSection(); sectionMode = "normal";
      elements.push(<div key={`hr-${i}`} className="h-px my-1" style={{ background: "rgba(255,255,255,0.07)" }} />);
      continue;
    }

    // ── Paragraph ──
    flushList();
    const target = sectionContainer ?? elements;
    const textColor = sectionMode === "warning" ? "rgba(251,191,36,0.90)"
                    : sectionMode === "success" ? "rgba(74,222,128,0.90)"
                    : sectionMode === "info"    ? "rgba(56,189,248,0.90)"
                    : sectionMode === "callout" ? "rgba(255,255,255,0.88)"
                    : "rgba(255,255,255,0.78)";
    target.push(
      <p key={`p-${i}`}
        className={`leading-relaxed ${compact ? "text-[12px]" : "text-[13px]"}`}
        style={{ color: textColor }}>
        {inlineFormat(line)}
      </p>
    );
  }

  flushList();
  flushSection();

  if (elements.length === 0) {
    return (
      <pre className={`text-[12px] text-foreground/80 whitespace-pre-wrap font-mono leading-relaxed ${className}`}>
        {content}
      </pre>
    );
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {elements}
    </div>
  );
}
