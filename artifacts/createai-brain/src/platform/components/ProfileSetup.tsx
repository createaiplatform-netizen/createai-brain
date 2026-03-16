import React, { useState } from "react";
import { getAllIndustries, US_STATES, ORG_TYPES, type UserProfile, type IndustryId } from "@/engine/universeConfig";
import { getIndustryConfig } from "@/engine/universeConfig";

interface ProfileSetupProps {
  email: string;
  initialProfile?: Partial<UserProfile>;
  onSave: (profile: UserProfile) => void;
}

export function ProfileSetup({ email, initialProfile, onSave }: ProfileSetupProps) {
  const [orgName, setOrgName] = useState(initialProfile?.orgName ?? "");
  const [state, setState] = useState(initialProfile?.state ?? "California");
  const [industry, setIndustry] = useState<IndustryId>(initialProfile?.industry ?? "healthcare");
  const [role, setRole] = useState(initialProfile?.role ?? "");
  const [department, setDepartment] = useState(initialProfile?.department ?? "");
  const [orgType, setOrgType] = useState(initialProfile?.orgType ?? "");
  const [error, setError] = useState("");

  const config = getIndustryConfig(industry);
  const industries = getAllIndustries();

  const handleSave = () => {
    if (!orgName.trim()) { setError("Please enter your organization name."); return; }
    if (!role) { setError("Please select your role."); return; }
    if (!department) { setError("Please select your department."); return; }
    setError("");
    onSave({
      email,
      orgName: orgName.trim(),
      state,
      industry,
      role,
      department,
      orgType,
      ndaAccepted: true,
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-xl mx-auto px-5 py-8 w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="text-3xl">⚙️</div>
          <h2 className="text-xl font-bold text-white">Set Up Your Profile</h2>
          <p className="text-[13px]" style={{ color: "rgba(148,163,184,0.6)" }}>
            This customizes the platform to your real context.<br />
            Stored locally — nothing is shared.
          </p>
        </div>

        <div className="rounded-xl px-4 py-3 text-[12px]"
          style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", color: "#a5b4fc" }}>
          Signed in as <strong>{email}</strong> · NDA accepted ✓
        </div>

        <div className="space-y-4">
          {/* Org Name */}
          <Field label="Organization Name">
            <input
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="e.g. Riverside Health System, Apex Staffing, Lakewood USD..."
              className="w-full bg-transparent text-white text-[13px] px-3 py-2.5 rounded-xl outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.22)" }}
              autoFocus
            />
          </Field>

          {/* Industry */}
          <Field label="Industry">
            <div className="grid grid-cols-3 gap-2">
              {industries.filter(i => i.id !== "generic").slice(0, 12).map(ind => (
                <button
                  key={ind.id}
                  onClick={() => { setIndustry(ind.id as IndustryId); setRole(""); setDepartment(""); }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[11px] font-medium text-left transition-all"
                  style={{
                    background: industry === ind.id ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${industry === ind.id ? "rgba(99,102,241,0.40)" : "rgba(255,255,255,0.07)"}`,
                    color: industry === ind.id ? "#a5b4fc" : "#64748b",
                  }}
                >
                  <span>{ind.icon}</span>
                  <span className="truncate">{ind.label}</span>
                </button>
              ))}
            </div>
          </Field>

          {/* State */}
          <Field label="State">
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              className="w-full bg-transparent text-white text-[13px] px-3 py-2.5 rounded-xl outline-none"
              style={{ background: "rgba(14,18,42,0.80)", border: "1px solid rgba(99,102,241,0.22)" }}
            >
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          {/* Role */}
          <Field label="Your Role">
            <div className="grid grid-cols-2 gap-2">
              {config.roles.map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className="px-3 py-2 rounded-xl text-[11px] font-medium text-left transition-all"
                  style={{
                    background: role === r ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${role === r ? "rgba(99,102,241,0.38)" : "rgba(255,255,255,0.07)"}`,
                    color: role === r ? "#a5b4fc" : "#64748b",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </Field>

          {/* Department */}
          <Field label="Your Department">
            <div className="grid grid-cols-2 gap-2">
              {config.departments.map(d => (
                <button
                  key={d}
                  onClick={() => setDepartment(d)}
                  className="px-3 py-2 rounded-xl text-[11px] font-medium text-left transition-all"
                  style={{
                    background: department === d ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${department === d ? "rgba(99,102,241,0.38)" : "rgba(255,255,255,0.07)"}`,
                    color: department === d ? "#a5b4fc" : "#64748b",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>

          {/* Org Type */}
          <Field label="Organization Type (optional)">
            <select
              value={orgType}
              onChange={e => setOrgType(e.target.value)}
              className="w-full bg-transparent text-white text-[13px] px-3 py-2.5 rounded-xl outline-none"
              style={{ background: "rgba(14,18,42,0.80)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <option value="">Select type...</option>
              {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        {error && <p className="text-[12px] text-red-400">{error}</p>}

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl text-white font-bold text-[14px] transition-all"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
        >
          Save Profile & Enter Test Mode →
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(148,163,184,0.5)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
