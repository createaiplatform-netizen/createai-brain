// Auto-generated app — Study Planner
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "studyplanner",
  title: "Study Planner",
  icon: "📖",
  color: "#16a34a",
  description: "Study schedules, spaced repetition, exam prep, and learning roadmaps.",
  engines: [
    {
      id: "StudyScheduleEngine",
      name: "Study Schedule Builder",
      icon: "📅",
      tagline: "Schedule architect",
      description: "Builds realistic study schedules with time blocks, subjects, and review cycles.",
      placeholder: "What are you studying, when is your exam/goal, and how many hours per day can you study?",
      example: "e.g. MCAT in 4 months, 4 hours a day available, weak in biochemistry and psychology",
      color: "#16a34a",
    },
    {
      id: "SpacedRepetitionEngine",
      name: "Spaced Repetition Planner",
      icon: "🔄",
      tagline: "Memory architect",
      description: "Designs spaced repetition review schedules using evidence-based intervals for any subject.",
      placeholder: "What material needs to be memorized and how long until the test?",
      example: "e.g. 400 anatomy terms for a practical exam in 6 weeks",
      color: "#15803d",
    },
    {
      id: "ActiveRecallEngine",
      name: "Active Recall Designer",
      icon: "❓",
      tagline: "Recall architect",
      description: "Transforms passive notes into active recall questions, flashcard fronts, and self-testing prompts.",
      placeholder: "What notes or topic should I convert to active recall format?",
      example: "e.g. The key concepts of cognitive behavioral therapy for a psychology exam",
      color: "#16a34a",
    },
    {
      id: "WeakSpotEngine",
      name: "Weak Spot Identifier",
      icon: "🎯",
      tagline: "Gap detector",
      description: "Identifies knowledge gaps from performance data and designs targeted remediation plans.",
      placeholder: "What subject are you studying and where are you struggling?",
      example: "e.g. I keep getting organic chemistry reaction mechanisms wrong — I understand the theory but fail the problems",
      color: "#15803d",
    },
    {
      id: "ExamStrategyEngine",
      name: "Exam Strategy",
      icon: "✅",
      tagline: "Strategy architect",
      description: "Designs exam strategies — time allocation, question ordering, and pressure management.",
      placeholder: "What exam are you taking and how is it structured?",
      example: "e.g. A 4-hour bar exam with 200 multiple choice in the morning and essays in the afternoon",
      color: "#16a34a",
    }
  ],
};

export function StudyPlannerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
