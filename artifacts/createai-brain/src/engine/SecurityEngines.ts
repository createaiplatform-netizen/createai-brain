// SECURITY ENGINE MODULE — CreateAI Brain
// Provides system prompt and series definitions for the security suite.
import { ALL_ENGINES } from "./CapabilityEngine";

export const SECURITY_ENGINE_IDS = [
  "ZeroTrustEngine",
  "ThreatModelEngine",
  "SOCEngine",
  "PenTestEngine",
  "IncidentResponseEngine",
  "IAMEngine",
  "EncryptionEngine",
  "VulnerabilityEngine",
  "SecurityAuditEngine",
  "CloudSecEngine",
  "NetworkSecEngine",
  "AppSecEngine",
  "EndpointSecEngine",
  "PrivacyDesignEngine",
  "RedTeamEngine",
  "SecureSDLCEngine",
  "CyberResilienceEngine",
  "SecurityPostureEngine"
];

export function getSecurityEngines() {
  return ALL_ENGINES.filter(e => e.category === "security");
}

export const SECURITY_ICON = "🔐";
export const SECURITY_COLOR = "#EF4444";
