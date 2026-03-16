import React, { useState } from "react";

const INTEGRATIONS = [
  {
    name: "Electronic Health Records", category: "Healthcare", icon: "🏥", color: "#34C759",
    desc: "Connect EHR workflows, patient records, and clinical data pipelines.",
    steps: ["Enter API endpoint URL", "Provide OAuth 2.0 credentials", "Select data scopes", "Run test ping"],
    fields: [
      { label: "API Endpoint", placeholder: "https://ehr.yourprovider.com/api/v2", type: "url" },
      { label: "Client ID", placeholder: "client_xxxxxxxxxxxx", type: "text" },
      { label: "Client Secret", placeholder: "••••••••••••••••", type: "password" },
    ],
    warning: "Real EHR integration requires HIPAA compliance, legal agreements, and expert configuration.",
  },
  {
    name: "Payment Processor (Stripe)", category: "Financial", icon: "💳", color: "#007AFF",
    desc: "Enable billing, subscriptions, invoices, and revenue tracking.",
    steps: ["Add Stripe publishable key", "Add Stripe secret key", "Choose webhook events", "Verify with test charge"],
    fields: [
      { label: "Publishable Key", placeholder: "pk_test_xxxxxxxxxxxx", type: "text" },
      { label: "Secret Key", placeholder: "sk_test_••••••••••••", type: "password" },
      { label: "Webhook Secret", placeholder: "whsec_xxxxxxxxxxxx", type: "password" },
    ],
    warning: "No real charges will be made. This is a structural mock of the Stripe integration flow.",
  },
  {
    name: "CRM System", category: "Business", icon: "📊", color: "#5856D6",
    desc: "Sync contacts, deals, pipeline stages, and activity logs.",
    steps: ["Select CRM provider", "Enter API token", "Map data fields", "Sync test record"],
    fields: [
      { label: "CRM Provider", placeholder: "HubSpot / Salesforce / Pipedrive", type: "text" },
      { label: "API Token", placeholder: "Bearer xxxxxxxxxxxxxxxxxx", type: "password" },
      { label: "Workspace ID", placeholder: "ws_xxxxxxxxxxxx", type: "text" },
    ],
    warning: "This is a mock integration wizard. No real CRM system is connected.",
  },
  {
    name: "Email Platform", category: "Marketing", icon: "📧", color: "#FF9500",
    desc: "Automate campaigns, sequences, and transactional emails.",
    steps: ["Enter SMTP or API credentials", "Verify sender domain", "Set sending limits", "Send test email"],
    fields: [
      { label: "API Key", placeholder: "SG.xxxxxxxxxxxxxxxxxxxx", type: "password" },
      { label: "Sender Email", placeholder: "hello@yourdomain.com", type: "email" },
      { label: "Sending Domain", placeholder: "mail.yourdomain.com", type: "text" },
    ],
    warning: "No real emails will be sent. This wizard is a structural mock for demonstration only.",
  },
  {
    name: "SMS Provider", category: "Messaging", icon: "💬", color: "#30B0C7",
    desc: "Send notifications, reminders, and two-way SMS messages.",
    steps: ["Enter Account SID", "Enter Auth Token", "Select phone number", "Send test SMS"],
    fields: [
      { label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", type: "text" },
      { label: "Auth Token", placeholder: "••••••••••••••••••••••••••••••••", type: "password" },
      { label: "From Number", placeholder: "+1 (555) 000-0000", type: "tel" },
    ],
    warning: "No real SMS messages are sent. This is a mock wizard for the Twilio/SMS integration flow.",
  },
  {
    name: "Document Storage", category: "Files", icon: "☁️", color: "#BF5AF2",
    desc: "Store, sync, and retrieve documents from cloud providers.",
    steps: ["Choose storage provider", "Authorize bucket access", "Set folder structure", "Upload test file"],
    fields: [
      { label: "Storage Provider", placeholder: "AWS S3 / GCS / Azure Blob", type: "text" },
      { label: "Bucket Name", placeholder: "my-app-documents", type: "text" },
      { label: "Access Key", placeholder: "AKIA••••••••••••••••", type: "password" },
    ],
    warning: "No real files are stored. This wizard is structural only — for planning purposes.",
  },
];

type ConnStatus = "idle" | "connecting" | "connected" | "failed";

export function IntegrationApp() {
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<ConnStatus>("idle");
  const [connections, setConnections] = useState<Set<string>>(new Set());

  const intg = INTEGRATIONS.find(i => i.name === selected);

  const reset = () => {
    setSelected(null); setStep(0);
    setFields({}); setStatus("idle");
  };

  const simulateConnect = () => {
    setStatus("connecting");
    setTimeout(() => {
      const success = Math.random() > 0.15;
      if (success) {
        setStatus("connected");
        setConnections(prev => new Set([...prev, selected!]));
      } else {
        setStatus("failed");
      }
    }, 2200);
  };

  if (intg) {
    const isConnected = connections.has(intg.name);

    if (status === "connected") {
      return (
        <div className="p-6 space-y-5">
          <button onClick={reset} className="text-primary text-sm font-medium">‹ Integrations</button>
          <div className="flex flex-col items-center text-center py-6 space-y-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: intg.color + "22" }}>{intg.icon}</div>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center -mt-8 -mr-12 self-end text-green-600 text-2xl font-bold border-2 border-background">✓</div>
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-foreground">{intg.name}</h2>
            <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-green-100 text-green-700">Connected (Mock)</span>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-1">
            <p className="text-[13px] font-semibold text-green-800">✓ Mock connection established</p>
            <p className="text-[12px] text-green-700">In a real environment, the platform would now have access to {intg.category.toLowerCase()} data and workflows through this integration.</p>
          </div>
          <div className="space-y-2">
            {intg.steps.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/40">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-[11px] font-bold flex-shrink-0">✓</div>
                <span className="text-[13px] text-foreground">{s}</span>
              </div>
            ))}
          </div>
          <button onClick={reset}
            className="w-full py-2.5 rounded-xl text-[13px] font-semibold bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
            ← Back to Integrations
          </button>
          <p className="text-[10px] text-muted-foreground text-center">{intg.warning}</p>
        </div>
      );
    }

    if (status === "failed") {
      return (
        <div className="p-6 space-y-5">
          <button onClick={reset} className="text-primary text-sm font-medium">‹ Integrations</button>
          <div className="text-center py-4 space-y-2">
            <p className="text-4xl">⚠️</p>
            <h2 className="text-xl font-bold text-foreground">Connection Failed (Mock)</h2>
            <p className="text-[13px] text-muted-foreground">In a real environment, this would indicate invalid credentials or network issues.</p>
          </div>
          <button onClick={() => setStatus("idle")}
            className="w-full py-3 rounded-xl text-white font-semibold text-[13px] hover:opacity-90 transition-opacity"
            style={{ backgroundColor: intg.color }}>
            ↺ Try Again
          </button>
        </div>
      );
    }

    if (status === "connecting") {
      return (
        <div className="p-6 space-y-5 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-2"
            style={{ backgroundColor: intg.color + "22" }}>{intg.icon}</div>
          <div className="flex flex-col items-center gap-3">
            <span className="inline-block w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: intg.color, borderTopColor: "transparent" }} />
            <p className="text-[14px] font-semibold text-foreground">Connecting to {intg.name}…</p>
            <p className="text-[12px] text-muted-foreground text-center">Running handshake, verifying credentials, mapping endpoints…</p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-8">{intg.warning}</p>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-5">
        <button onClick={reset} className="text-primary text-sm font-medium">‹ Integrations</button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: intg.color + "22" }}>{intg.icon}</div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{intg.name}</h2>
            <p className="text-[11px] text-muted-foreground">{intg.category} · {intg.desc}</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-[11px] text-amber-700">⚠️ {intg.warning}</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Steps</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {intg.steps.map((s, i) => (
              <div key={i} className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                i < step ? "bg-green-100 text-green-700 border-green-200" :
                i === step ? "border-2 text-white font-bold" : "bg-muted text-muted-foreground border-border/40"
              }`} style={i === step ? { backgroundColor: intg.color, borderColor: intg.color } : {}}>
                {i < step ? "✓" : <span className="font-bold">{i + 1}</span>}
                <span className="hidden sm:inline">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {step < intg.fields.length
          ? <div className="space-y-4">
              <h3 className="text-[14px] font-bold text-foreground">{intg.steps[step]}</h3>
              {[intg.fields[step]].map(f => (
                <div key={f.label}>
                  <label className="text-[12px] font-semibold text-foreground block mb-1.5">{f.label}</label>
                  <input
                    type={f.type === "password" ? "password" : "text"}
                    placeholder={f.placeholder}
                    value={fields[f.label] ?? ""}
                    onChange={e => setFields(p => ({ ...p, [f.label]: e.target.value }))}
                    className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                  />
                </div>
              ))}
              <button
                onClick={() => setStep(s => s + 1)}
                className="w-full py-2.5 rounded-xl text-white font-semibold text-[13px] hover:opacity-90 transition-opacity"
                style={{ backgroundColor: intg.color }}>
                Next →
              </button>
            </div>
          : <div className="space-y-4">
              <h3 className="text-[14px] font-bold text-foreground">Ready to connect</h3>
              <div className="space-y-2">
                {intg.fields.map(f => (
                  <div key={f.label} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/40">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-[10px] font-bold flex-shrink-0">✓</div>
                    <span className="text-[12px] text-muted-foreground flex-shrink-0 w-28">{f.label}</span>
                    <span className="text-[12px] text-foreground font-mono truncate">
                      {fields[f.label] ? "•".repeat(Math.min(fields[f.label].length, 12)) || f.placeholder.slice(0, 10) + "…" : f.placeholder.slice(0, 12) + "…"}
                    </span>
                  </div>
                ))}
              </div>
              <button onClick={simulateConnect}
                className="w-full py-3 rounded-xl text-white font-bold text-[14px] hover:opacity-90 transition-opacity"
                style={{ backgroundColor: intg.color }}>
                🔌 Connect {intg.name} (Mock)
              </button>
              <button onClick={() => setStep(0)} className="w-full text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                ← Edit credentials
              </button>
            </div>
        }
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Integration Hub</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">Connect your platform to real-world services. All connection flows are mock simulations — no real systems are linked.</p>
      </div>
      {connections.size > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-[12px] text-green-700 font-semibold">✓ {connections.size} mock connection{connections.size > 1 ? "s" : ""} established this session</p>
        </div>
      )}
      <div className="space-y-2">
        {INTEGRATIONS.map(intg => {
          const isConnected = connections.has(intg.name);
          return (
            <button key={intg.name} onClick={() => { setSelected(intg.name); setStep(0); setFields({}); setStatus("idle"); }}
              className="w-full flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: intg.color + "22" }}>{intg.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] text-foreground">{intg.name}</p>
                <p className="text-[11px] text-muted-foreground">{intg.category} · {intg.desc.slice(0, 40)}…</p>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${isConnected ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                {isConnected ? "Connected" : "Configure"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
