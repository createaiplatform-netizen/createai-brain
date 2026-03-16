import React from "react";

const PLANS = [
  { name: "Starter", price: "$29/mo", features: ["5 projects", "Basic tools", "Chat access", "Email support"], color: "#34C759" },
  { name: "Creator", price: "$79/mo", features: ["Unlimited projects", "All tools", "Priority AI", "Marketing engine", "Phone support"], color: "#007AFF" },
  { name: "Enterprise", price: "Custom", features: ["White-label", "Custom engines", "Dedicated support", "API access", "Live mode ready"], color: "#BF5AF2" },
];

export function MonetizationApp() {
  const [tab, setTab] = React.useState<"plans" | "revenue" | "storefront">("plans");

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Monetization Hub</h2>
        <p className="text-[13px] text-muted-foreground mt-1">All content is mock and structural only. Revenue share default: 25% (editable).</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {(["plans", "revenue", "storefront"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-colors ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "plans" && (
        <div className="space-y-3">
          {PLANS.map(plan => (
            <div key={plan.name} className="p-4 bg-background rounded-2xl border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-[15px] text-foreground">{plan.name}</p>
                  <p className="text-[13px] font-semibold" style={{ color: plan.color }}>{plan.price}</p>
                </div>
                <span className="text-[10px] bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">MOCK</span>
              </div>
              <div className="space-y-1">
                {plan.features.map(f => (
                  <p key={f} className="text-[12px] text-muted-foreground flex items-center gap-2">
                    <span className="text-green-500">✓</span> {f}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "revenue" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Monthly Revenue (Mock)", value: "$3,240", color: "#34C759" },
              { label: "Platform Share (25%)", value: "$810", color: "#007AFF" },
              { label: "Active Users (Mock)", value: "14", color: "#5856D6" },
              { label: "Pending Payouts", value: "$2,430", color: "#FF9500" },
            ].map(stat => (
              <div key={stat.label} className="bg-background rounded-2xl border border-border/50 p-4 text-center">
                <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
            <p className="text-[12px] text-orange-700">All figures are mock. No real transactions are processed. Revenue share is adjustable by the founder, including 0%.</p>
          </div>
        </div>
      )}

      {tab === "storefront" && (
        <div className="space-y-3">
          <p className="text-[13px] text-muted-foreground">Your user storefront and marketplace — where subscribers access tools, apps, and services.</p>
          {["My Storefront", "System Marketplace", "App Sales (Mock)", "Service Sales (Mock)", "Creator Earnings (Mock)"].map(item => (
            <div key={item} className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border/50">
              <p className="font-semibold text-[13px] text-foreground">{item}</p>
              <span className="text-[11px] text-muted-foreground">Coming in LIVE mode</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
