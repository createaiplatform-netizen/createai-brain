// EDUCATION ENGINE MODULE — CreateAI Brain
// Provides system prompt and series definitions for the education suite.
import { ALL_ENGINES } from "./CapabilityEngine";

export const EDUCATION_ENGINE_IDS = [
  "CurriculumDesignEngine",
  "LearningPathEngine",
  "AssessmentDesignEngine",
  "LMSArchEngine",
  "InstructionalEngine",
  "MicrolearningEngine",
  "GameBasedLearningEngine",
  "AdaptiveLearningEngine",
  "EdTechStackEngine",
  "CredentialDesignEngine",
  "VirtualClassroomEngine",
  "K12StrategyEngine",
  "HigherEduEngine",
  "TeacherToolsEngine",
  "StudentEngagementEngine",
  "EduAnalyticsEngine",
  "EduAccessEngine"
];

export function getEducationEngines() {
  return ALL_ENGINES.filter(e => e.category === "education");
}

export const EDUCATION_ICON = "📚";
export const EDUCATION_COLOR = "#7C3AED";
