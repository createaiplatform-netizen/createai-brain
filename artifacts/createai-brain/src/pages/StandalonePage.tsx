import React from "react";
import { useParams } from "wouter";
import { HealthcareProduct } from "@/standalone/HealthcareProduct";
import { GenericProduct } from "@/standalone/GenericProduct";

const PROJECT_MAP: Record<string, { component: "healthcare" | "generic"; name: string; icon: string; color: string; industry: string }> = {
  "healthcare-legal-safe": {
    component: "healthcare",
    name: "Healthcare System – Legal Safe",
    icon: "🏥", color: "#34C759", industry: "Healthcare",
  },
  "healthcare-mach1": {
    component: "generic",
    name: "Healthcare System – Mach 1",
    icon: "🔬", color: "#BF5AF2", industry: "Healthcare",
  },
  "monetary-legal-safe": {
    component: "generic",
    name: "Monetary System – Legal Safe",
    icon: "💳", color: "#007AFF", industry: "Finance",
  },
  "monetary-mach1": {
    component: "generic",
    name: "Monetary System – Mach 1",
    icon: "🚀", color: "#FF9500", industry: "Finance",
  },
  "marketing-hub": {
    component: "generic",
    name: "Marketing Hub",
    icon: "📣", color: "#FF2D55", industry: "Marketing",
  },
  "operations-builder": {
    component: "generic",
    name: "Operations Builder",
    icon: "🏗️", color: "#5856D6", industry: "Operations",
  },
};

export default function StandalonePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId ?? "";
  const config = PROJECT_MAP[projectId];

  if (!config) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground">
        <p className="text-4xl">🔍</p>
        <h1 className="text-xl font-bold">Project Not Found</h1>
        <p className="text-muted-foreground text-sm">No standalone product for "{projectId}"</p>
        <button onClick={() => window.close()} className="mt-4 bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90">
          Close Tab
        </button>
      </div>
    );
  }

  if (config.component === "healthcare") {
    return <HealthcareProduct />;
  }

  return (
    <GenericProduct
      projectId={projectId}
      name={config.name}
      icon={config.icon}
      color={config.color}
      industry={config.industry}
    />
  );
}
