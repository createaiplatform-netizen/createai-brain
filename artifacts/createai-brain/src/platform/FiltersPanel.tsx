import React from "react";
import { getAllIndustries, GLOBAL_REGION_GROUPS, ORG_TYPES, type PlatformFilters, type IndustryId, getIndustryConfig } from "@/engine/universeConfig";

interface FiltersPanelProps {
  filters: PlatformFilters;
  onChange: (f: PlatformFilters) => void;
  profile?: { orgName?: string; email?: string };
  mode: string;
  onShowProfile?: () => void;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1.5" style={{ color: "rgba(148,163,184,0.40)" }}>
      {label}
    </div>
  );
}

export function FiltersPanel({ filters, onChange, profile, mode, onShowProfile }: FiltersPanelProps) {
  const industries = getAllIndustries().filter(i => i.id !== "generic");
  const config = getIndustryConfig(filters.industry);

  const set = (key: keyof PlatformFilters, value: string) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Profile strip */}
      {profile?.email && (
        <button
          onClick={onShowProfile}
          className="flex items-center gap-2.5 mx-3 mt-3 mb-1 p-2.5 rounded-xl transition-all text-left"
          style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.20)" }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.40)")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.20)")}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: "rgba(99,102,241,0.25)", color: "#a5b4fc" }}
          >
            {profile.email[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-white truncate">{profile.orgName || "My Organization"}</div>
            <div className="text-[9px] truncate" style={{ color: "rgba(148,163,184,0.5)" }}>{profile.email} · NDA ✓</div>
          </div>
        </button>
      )}

      <div className="px-3 py-3 space-y-5">
        {/* Industry */}
        <div>
          <SectionLabel label="Industry" />
          <div className="grid grid-cols-2 gap-1">
            {industries.map(ind => (
              <button
                key={ind.id}
                onClick={() => { onChange({ ...filters, industry: ind.id as IndustryId, role: "", department: "" }); }}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium text-left transition-all"
                style={{
                  background: filters.industry === ind.id ? ind.color + "22" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${filters.industry === ind.id ? ind.color + "55" : "rgba(255,255,255,0.07)"}`,
                  color: filters.industry === ind.id ? ind.color : "#64748b",
                }}
              >
                <span className="text-sm">{ind.icon}</span>
                <span className="truncate">{ind.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Region / Location */}
        <div>
          <SectionLabel label="Region / Location" />
          <select
            value={filters.state}
            onChange={e => set("state", e.target.value)}
            className="w-full text-white text-[12px] px-3 py-2 rounded-xl outline-none"
            style={{ background: "rgba(14,18,42,0.80)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            {GLOBAL_REGION_GROUPS.map(group => (
              <optgroup key={group.group} label={group.group}>
                {group.regions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Role */}
        <div>
          <SectionLabel label="Role" />
          <div className="space-y-1">
            {["", ...config.roles].map(r => (
              <button
                key={r || "__all__"}
                onClick={() => set("role", r)}
                className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] transition-all"
                style={{
                  background: filters.role === r ? "rgba(99,102,241,0.14)" : "transparent",
                  color: filters.role === r ? "#a5b4fc" : "#64748b",
                  border: `1px solid ${filters.role === r ? "rgba(99,102,241,0.28)" : "transparent"}`,
                }}
              >
                {r || "All Roles"}
              </button>
            ))}
          </div>
        </div>

        {/* Department */}
        <div>
          <SectionLabel label="Department" />
          <div className="space-y-1">
            {["", ...config.departments].map(d => (
              <button
                key={d || "__all__"}
                onClick={() => set("department", d)}
                className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] transition-all"
                style={{
                  background: filters.department === d ? "rgba(99,102,241,0.14)" : "transparent",
                  color: filters.department === d ? "#a5b4fc" : "#64748b",
                  border: `1px solid ${filters.department === d ? "rgba(99,102,241,0.28)" : "transparent"}`,
                }}
              >
                {d || "All Departments"}
              </button>
            ))}
          </div>
        </div>

        {/* Org type */}
        <div>
          <SectionLabel label="Org Type" />
          <div className="space-y-1">
            {["", ...ORG_TYPES].map(ot => (
              <button
                key={ot || "__all__"}
                onClick={() => set("orgType", ot)}
                className="w-full text-left px-3 py-1.5 rounded-lg text-[10px] transition-all"
                style={{
                  background: filters.orgType === ot ? "rgba(99,102,241,0.14)" : "transparent",
                  color: filters.orgType === ot ? "#a5b4fc" : "#64748b",
                  border: `1px solid ${filters.orgType === ot ? "rgba(99,102,241,0.28)" : "transparent"}`,
                }}
              >
                {ot || "All Org Types"}
              </button>
            ))}
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={() => onChange({ state: "California", industry: "healthcare", role: "", department: "", orgType: "" })}
          className="w-full py-2 rounded-xl text-[11px] font-medium transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
