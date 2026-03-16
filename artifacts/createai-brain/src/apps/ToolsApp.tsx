import React from "react";

const TOOLS = [
  { name: "Brochure Builder", icon: "📋", description: "Generate professional brochures for any service or product. Describe your offering and receive a structured, print-ready layout with sections, headlines, and mock content.", color: "#007AFF" },
  { name: "Document Creator", icon: "📄", description: "Create structured documents — proposals, reports, summaries, SOPs — with intelligent sectioning, mock data, and professional formatting.", color: "#34C759" },
  { name: "Page Generator", icon: "🖼️", description: "Generate full page layouts — landing pages, about pages, feature pages — with mock copy, section structure, and navigation hierarchy.", color: "#FF9500" },
  { name: "App Layout Generator", icon: "📱", description: "Design the structural layout of any app: screens, navigation flows, components, and mock UI with labels and descriptions for each section.", color: "#BF5AF2" },
];

export function ToolsApp() {
  const [active, setActive] = React.useState<string | null>(null);
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState<string | null>(null);

  const handleGenerate = () => {
    if (!input.trim() || !active) return;
    setOutput(`[Mock Output — ${active}]\n\nBased on: "${input}"\n\nSection 1: Overview\nThis section provides a high-level summary of the subject matter, establishing context and purpose for the reader.\n\nSection 2: Key Features\n• Feature A — describes the primary capability in clear, benefit-focused language\n• Feature B — highlights the secondary value proposition\n• Feature C — addresses the most common user need\n\nSection 3: How It Works\nA step-by-step conceptual flow outlining the process from start to completion, written in plain language for any audience.\n\nSection 4: Next Steps\nRecommended actions, contact details (mock), and call-to-action buttons.\n\n[All content is mock and structural only. No real data or operational logic.]`);
  };

  if (active) {
    const tool = TOOLS.find(t => t.name === active)!;
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => { setActive(null); setOutput(null); setInput(""); }} className="text-primary text-sm font-medium">‹ Tools</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{tool.icon}</span>
          <h2 className="text-xl font-bold text-foreground">{tool.name}</h2>
        </div>
        <p className="text-[13px] text-muted-foreground">{tool.description}</p>
        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-2">Describe what you want to create</label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. A brochure for a horse boarding facility in rural Minnesota..."
            className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
            rows={4}
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={!input.trim()}
          className="bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Generate (Mock)
        </button>
        {output && (
          <div className="bg-muted/50 border border-border/50 rounded-xl p-4">
            <pre className="text-[12px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">{output}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <h2 className="text-xl font-bold text-foreground">Tools</h2>
      <div className="grid grid-cols-1 gap-3">
        {TOOLS.map(tool => (
          <button
            key={tool.name}
            onClick={() => setActive(tool.name)}
            className="flex items-start gap-4 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: tool.color + "22" }}>
              {tool.icon}
            </div>
            <div>
              <p className="font-semibold text-[14px] text-foreground">{tool.name}</p>
              <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{tool.description.slice(0, 80)}…</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
