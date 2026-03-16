import React from "react";

const FAMILY_APPS = [
  { name: "My Projects", icon: "📁", desc: "Your personal projects and workspaces" },
  { name: "My Apps", icon: "📱", desc: "Apps available to you" },
  { name: "My Documents", icon: "📄", desc: "Files and documents you've created" },
  { name: "Help & Guidance", icon: "💡", desc: "How to get started and what to do next" },
];

export function FamilyApp() {
  return (
    <div className="p-6 space-y-5">
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-3xl bg-blue-100 flex items-center justify-center text-3xl mx-auto mb-3">🏡</div>
        <h2 className="text-xl font-bold text-foreground">Welcome Home</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Here's everything that's yours.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {FAMILY_APPS.map(app => (
          <div key={app.name} className="flex flex-col items-center gap-2 p-5 bg-background rounded-2xl border border-border/50 text-center">
            <span className="text-3xl">{app.icon}</span>
            <p className="font-semibold text-[13px] text-foreground">{app.name}</p>
            <p className="text-[11px] text-muted-foreground">{app.desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-blue-50 rounded-2xl p-4">
        <h3 className="font-semibold text-[14px] text-blue-800 mb-2">💡 Getting Started</h3>
        <div className="space-y-2">
          {[
            "Tap any app above to get started",
            "Ask the AI Chat any question — it knows you",
            "Your documents are always saved and ready",
            "Need help? Tap Help & Guidance",
          ].map((tip, i) => (
            <p key={i} className="text-[12px] text-blue-700 flex items-start gap-2">
              <span className="font-bold">{i + 1}.</span>
              <span>{tip}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
