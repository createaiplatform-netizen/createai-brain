// Auto-generated app — Meeting Planner
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "meetingplanner",
  title: "Meeting Planner",
  icon: "🗓️",
  color: "#0891b2",
  description: "Meeting agendas, minutes, retrospectives, and facilitation guides.",
  engines: [
    {
      id: "AgendaBuilderEngine",
      name: "Agenda Builder",
      icon: "📋",
      tagline: "Meeting architect",
      description: "Builds structured meeting agendas with time blocks, owners, and desired outcomes.",
      placeholder: "What type of meeting is this, who attends, and what must be decided?",
      example: "e.g. A quarterly planning meeting for a 12-person product team deciding next quarter's roadmap",
      color: "#0891b2",
    },
    {
      id: "MeetingMinutesEngine",
      name: "Meeting Minutes",
      icon: "📝",
      tagline: "Minutes writer",
      description: "Writes clean, action-oriented meeting minutes with decisions, action items, and owners.",
      placeholder: "Summarize what was discussed and decided in the meeting",
      example: "e.g. We reviewed Q2 results, decided to pause Feature X, and agreed on a new hiring freeze policy",
      color: "#0e7490",
    },
    {
      id: "RetrospectiveEngine",
      name: "Retrospective Facilitator",
      icon: "🔄",
      tagline: "Retro architect",
      description: "Designs retrospective agendas and prompts for sprint, project, or quarterly retrospectives.",
      placeholder: "What project or period are you retrospecting on?",
      example: "e.g. A post-mortem after a product launch that was delayed by 3 months",
      color: "#0891b2",
    },
    {
      id: "FacilitationGuideEngine",
      name: "Facilitation Guide",
      icon: "🎤",
      tagline: "Facilitator architect",
      description: "Writes detailed facilitation guides for workshops, strategy sessions, and team meetings.",
      placeholder: "What is the workshop goal and who are the participants?",
      example: "e.g. A 3-hour strategic planning workshop with 20 healthcare executives from different specialties",
      color: "#0e7490",
    },
    {
      id: "DecisionFrameworkEngine",
      name: "Decision Framework",
      icon: "⚖️",
      tagline: "Decision architect",
      description: "Designs decision-making frameworks for complex team decisions with criteria, weighting, and process.",
      placeholder: "What decision does your team need to make?",
      example: "e.g. Whether to build our own data warehouse or buy a third-party analytics platform",
      color: "#0891b2",
    }
  ],
};

export function MeetingPlannerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
