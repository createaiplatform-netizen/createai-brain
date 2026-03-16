import React from "react";

const INTEGRATIONS = [
  { name: "Electronic Health Records", category: "Healthcare", status: "Mock", icon: "🏥", color: "#34C759" },
  { name: "Payment Processor (Stripe)", category: "Financial", status: "Mock", icon: "💳", color: "#007AFF" },
  { name: "CRM System", category: "Business", status: "Mock", icon: "📊", color: "#5856D6" },
  { name: "Email Platform", category: "Marketing", status: "Mock", icon: "📧", color: "#FF9500" },
  { name: "SMS Provider", category: "Messaging", status: "Mock", icon: "💬", color: "#30B0C7" },
  { name: "Document Storage", category: "Files", status: "Mock", icon: "☁️", color: "#BF5AF2" },
];

export function IntegrationApp() {
  const [selected, setSelected] = React.useState<string | null>(null);

  if (selected) {
    const intg = INTEGRATIONS.find(i => i.name === selected)!;
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setSelected(null)} className="text-primary text-sm font-medium">‹ Integrations</button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{intg.icon}</span>
          <div>
            <h2 className="text-xl font-bold text-foreground">{intg.name}</h2>
            <span className="text-[11px] bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">MOCK — Future Integration</span>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-[13px] text-orange-800 font-medium">⚠️ This is a conceptual integration layer.</p>
          <p className="text-[12px] text-orange-700 mt-1">Real connections require legal agreements, API credentials, and expert configuration. This view is structural only.</p>
        </div>
        {[
          { label: "Integration Overview", value: `Conceptual connection point for ${intg.name} functionality within the platform.` },
          { label: "Data Structures (Mock)", value: "Patient ID (mock), Record Type (mock), Timestamp (mock), Status (mock)" },
          { label: "Potential Workflows", value: "1. User initiates action → 2. System prepares payload → 3. Integration endpoint receives → 4. Response mapped to platform view" },
          { label: "What's Missing", value: "Real API keys, legal agreements, compliance review, expert configuration, testing environment" },
        ].map(item => (
          <div key={item.label} className="bg-background rounded-xl border border-border/50 p-4">
            <p className="font-semibold text-[13px] text-foreground">{item.label}</p>
            <p className="text-[12px] text-muted-foreground mt-1">{item.value}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Integration Hub</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Conceptual integration layer — mock only. Real connections are LIVE mode features.</p>
      </div>
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
        <p className="text-[12px] text-orange-700 font-medium">All integrations shown are structural placeholders. No real systems are connected.</p>
      </div>
      <div className="space-y-2">
        {INTEGRATIONS.map(intg => (
          <button key={intg.name} onClick={() => setSelected(intg.name)}
            className="w-full flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: intg.color + "22" }}>
              {intg.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] text-foreground">{intg.name}</p>
              <p className="text-[11px] text-muted-foreground">{intg.category}</p>
            </div>
            <span className="text-[11px] bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Mock</span>
          </button>
        ))}
      </div>
    </div>
  );
}
