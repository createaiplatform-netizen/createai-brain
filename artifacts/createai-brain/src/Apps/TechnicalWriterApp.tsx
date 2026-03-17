// Auto-generated app — Technical Writer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "technicalwriter",
  title: "Technical Writer",
  icon: "⚙️",
  color: "#475569",
  description: "Technical documentation, user guides, API references, and process manuals.",
  engines: [
    {
      id: "UserGuideEngine",
      name: "User Guide Writer",
      icon: "📘",
      tagline: "Clarity architect",
      description: "Writes clear, step-by-step user guides optimized for non-technical readers.",
      placeholder: "What product or process needs a user guide?",
      example: "e.g. A guide for first-time users of a healthcare billing software portal",
      color: "#475569",
    },
    {
      id: "APIDocEngine",
      name: "API Documentation",
      icon: "🔌",
      tagline: "Developer doc writer",
      description: "Writes developer-ready API documentation with endpoints, parameters, examples, and error codes.",
      placeholder: "Describe the API endpoint or feature to document",
      example: "e.g. A REST endpoint that accepts a patient ID and returns their appointment history in JSON",
      color: "#334155",
    },
    {
      id: "SOPEngine",
      name: "SOP Writer",
      icon: "📋",
      tagline: "Process document architect",
      description: "Writes Standard Operating Procedures with clear steps, roles, checkpoints, and decision trees.",
      placeholder: "What process needs a Standard Operating Procedure?",
      example: "e.g. The process for handling a customer complaint escalation in a healthcare contact center",
      color: "#475569",
    },
    {
      id: "ReleaseNotesEngine",
      name: "Release Notes",
      icon: "🚀",
      tagline: "Update communicator",
      description: "Writes clear, useful software release notes — features, fixes, and breaking changes explained.",
      placeholder: "What version changes need to be communicated?",
      example: "e.g. Version 3.2 of our app adds real-time collaboration, fixes 3 critical bugs, removes legacy API",
      color: "#334155",
    },
    {
      id: "TroubleshootingEngine",
      name: "Troubleshooting Guide",
      icon: "🔧",
      tagline: "Problem-solver writer",
      description: "Writes troubleshooting guides with error-symptom trees, solutions, and escalation paths.",
      placeholder: "What system or product needs a troubleshooting guide?",
      example: "e.g. A troubleshooting guide for a medical device that displays sensor error codes 01–15",
      color: "#475569",
    }
  ],
};

export function TechnicalWriterApp() {
  return <GenericEngineApp config={CONFIG} />;
}
