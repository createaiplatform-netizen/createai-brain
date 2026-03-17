// Auto-generated app — Curriculum Designer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "curriculumdesigner",
  title: "Curriculum Designer",
  icon: "🎓",
  color: "#7c3aed",
  description: "Course design, curriculum mapping, learning pathways, and instructional frameworks.",
  engines: [
    {
      id: "CourseDesignEngine",
      name: "Course Designer",
      icon: "🗺️",
      tagline: "Course architect",
      description: "Designs complete course structures with modules, sequence, objectives, and learning outcomes.",
      placeholder: "What subject, audience, and learning outcomes should this course achieve?",
      example: "e.g. An 8-week online course on negotiation for mid-career professionals who negotiate daily but feel unprepared",
      color: "#7c3aed",
    },
    {
      id: "CurriculumMapEngine",
      name: "Curriculum Map",
      icon: "🗺️",
      tagline: "Map architect",
      description: "Creates curriculum maps with scope and sequence across grade levels or course sequences.",
      placeholder: "What subject, grade range, and learning progression need to be mapped?",
      example: "e.g. Map mathematics learning progression from 6th through 12th grade aligned to career readiness",
      color: "#6d28d9",
    },
    {
      id: "LearningPathwayEngine",
      name: "Learning Pathway",
      icon: "🛤️",
      tagline: "Pathway architect",
      description: "Designs personalized learning pathways for self-directed learners with prerequisite mapping.",
      placeholder: "What mastery goal and starting knowledge level is this pathway for?",
      example: "e.g. A pathway from zero programming knowledge to being able to build and deploy a web application",
      color: "#7c3aed",
    },
    {
      id: "InstructionalFrameworkEngine",
      name: "Instructional Framework",
      icon: "🏛️",
      tagline: "Framework architect",
      description: "Selects and applies instructional design frameworks — UDL, backwards design, 5E — to course design.",
      placeholder: "What course are you designing and what learner challenges do you anticipate?",
      example: "e.g. A corporate training on inclusive leadership for managers who think they're already inclusive",
      color: "#6d28d9",
    },
    {
      id: "CompetencyFrameworkEngine",
      name: "Competency Framework",
      icon: "✅",
      tagline: "Competency architect",
      description: "Designs competency frameworks with observable behaviors, proficiency levels, and assessment criteria.",
      placeholder: "What role or domain needs a competency framework?",
      example: "e.g. A competency framework for data analysts at three career levels — analyst, senior, lead",
      color: "#7c3aed",
    }
  ],
};

export function CurriculumDesignerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
