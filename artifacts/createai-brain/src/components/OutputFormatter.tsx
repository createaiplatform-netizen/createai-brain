import React from "react";

interface Props {
  content: string;
  className?: string;
  compact?: boolean;
}

function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`(.+?)`/);

    const boldIdx = boldMatch?.index ?? Infinity;
    const codeIdx = codeMatch?.index ?? Infinity;

    if (boldIdx === Infinity && codeIdx === Infinity) {
      parts.push(remaining);
      break;
    }

    if (boldIdx <= codeIdx && boldMatch) {
      if (boldIdx > 0) parts.push(remaining.slice(0, boldIdx));
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldIdx + boldMatch[0].length);
    } else if (codeMatch) {
      if (codeIdx > 0) parts.push(remaining.slice(0, codeIdx));
      parts.push(
        <code
          key={key++}
          className="px-1 py-0.5 rounded text-[11px] font-mono"
          style={{
            background: "rgba(99,102,241,0.12)",
            color: "#a5b4fc",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeIdx + codeMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

export function OutputFormatter({ content, className = "", compact = false }: Props) {
  if (!content?.trim()) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: { text: string; ordered?: boolean; num?: number }[] = [];
  let listOrdered = false;
  let idx = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    if (listOrdered) {
      elements.push(
        <ol
          key={`ol-${idx++}`}
          className={compact ? "space-y-1" : "space-y-2"}
        >
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{
                  background: "rgba(99,102,241,0.15)",
                  color: "#818cf8",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              >
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
      elements.push(
        <ul key={`ul-${idx++}`} className={compact ? "space-y-1" : "space-y-2"}>
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[6px]"
                style={{ background: "rgba(99,102,241,0.6)" }}
              />
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

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h2
          key={`h1-${i}`}
          className={`font-bold text-foreground ${compact ? "text-[15px] mt-1" : "text-[18px] mt-2"}`}
          style={{ letterSpacing: "-0.02em" }}
        >
          {inlineFormat(line.slice(2))}
        </h2>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <div key={`h2-${i}`} className={compact ? "mt-2" : "mt-3"}>
          <h3
            className={`font-semibold text-foreground ${compact ? "text-[13px]" : "text-[15px]"} pb-1.5`}
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              letterSpacing: "-0.01em",
            }}
          >
            {inlineFormat(line.slice(3))}
          </h3>
        </div>
      );
    } else if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h4
          key={`h3-${i}`}
          className={`font-semibold text-primary ${compact ? "text-[11px]" : "text-[12px]"} uppercase tracking-wider`}
        >
          {inlineFormat(line.slice(4))}
        </h4>
      );
    } else if (line.match(/^={2,}\s.+\s={2,}$/)) {
      flushList();
      const label = line.replace(/^=+\s/, "").replace(/\s=+$/, "");
      elements.push(
        <div key={`sep-${i}`} className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              color: "#818cf8",
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.18)",
            }}
          >
            {label}
          </span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>
      );
    } else if (line.startsWith("- ") || line.startsWith("• ") || line.startsWith("* ")) {
      const text = line.slice(2);
      if (listOrdered && listItems.length > 0) flushList();
      listOrdered = false;
      listItems.push({ text });
    } else if (/^\d+\.\s/.test(line)) {
      const num = parseInt(line.match(/^(\d+)/)?.[1] ?? "1");
      const text = line.replace(/^\d+\.\s/, "");
      if (!listOrdered && listItems.length > 0) flushList();
      listOrdered = true;
      listItems.push({ text, num });
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p
          key={`p-${i}`}
          className={`leading-relaxed ${compact ? "text-[12px]" : "text-[13px]"} text-foreground/80`}
        >
          {inlineFormat(line)}
        </p>
      );
    }
  }
  flushList();

  if (elements.length === 0) {
    return (
      <pre
        className={`text-[12px] text-foreground/80 whitespace-pre-wrap font-mono leading-relaxed ${className}`}
      >
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
