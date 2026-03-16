import React from "react";

const PROJECTS = [
  { name: "Healthcare System – Legal Safe", mode: "DEMO", pages: 6, icon: "🏥", color: "#34C759" },
  { name: "Healthcare System – Mach 1", mode: "FUTURE", pages: 5, icon: "🔬", color: "#BF5AF2" },
  { name: "Monetary System – Legal Safe", mode: "DEMO", pages: 7, icon: "💳", color: "#007AFF" },
  { name: "Monetary System – Mach 1", mode: "FUTURE", pages: 5, icon: "🚀", color: "#FF9500" },
  { name: "Marketing Hub", mode: "DEMO", pages: 6, icon: "📣", color: "#FF2D55" },
  { name: "Operations Builder", mode: "TEST", pages: 9, icon: "🏗️", color: "#5856D6" },
];

const SUB_PAGES = ["Overview", "Apps", "Tools", "Documents", "Forms", "Brochures", "Marketing", "Settings", "AI Assistant"];

export function ProjectsApp() {
  const [selected, setSelected] = React.useState<string | null>(null);

  if (selected) {
    const proj = PROJECTS.find(p => p.name === selected)!;
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="text-primary text-sm font-medium">‹ Projects</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{proj.icon}</span>
          <div>
            <h2 className="text-xl font-bold text-foreground">{proj.name}</h2>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${proj.mode === "FUTURE" ? "bg-purple-100 text-purple-700" : proj.mode === "TEST" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
              {proj.mode}
            </span>
          </div>
        </div>
        <div>
          <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pages</h3>
          <div className="grid grid-cols-3 gap-2">
            {SUB_PAGES.slice(0, proj.pages).map(page => (
              <div key={page} className="bg-background rounded-xl border border-border/50 p-3 text-center">
                <p className="text-[12px] font-medium text-foreground">{page}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Mock content</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Modes</h3>
          <div className="flex gap-2">
            {["Demo Mode", "Test Mode", "Live Mode"].map(mode => (
              <div key={mode} className="flex-1 bg-background rounded-xl border border-border/50 p-3 text-center">
                <p className="text-[12px] font-medium text-foreground">{mode}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Projects</h2>
        <button className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
          + New Project
        </button>
      </div>
      <div className="space-y-3">
        {PROJECTS.map(proj => (
          <button
            key={proj.name}
            onClick={() => setSelected(proj.name)}
            className="w-full flex items-center gap-4 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: proj.color + "22" }}>
              {proj.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14px] text-foreground truncate">{proj.name}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{proj.pages} pages</p>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${proj.mode === "FUTURE" ? "bg-purple-100 text-purple-700" : proj.mode === "TEST" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
              {proj.mode}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
