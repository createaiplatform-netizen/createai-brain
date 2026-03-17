// Auto-generated app — Lesson Planner
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "lessonplanner",
  title: "Lesson Planner",
  icon: "📚",
  color: "#0369a1",
  description: "Lesson plans, learning objectives, activities, and teaching strategies.",
  engines: [
    {
      id: "LessonPlanEngine",
      name: "Lesson Plan Builder",
      icon: "📋",
      tagline: "Learning architect",
      description: "Builds complete lesson plans with objectives, hook, instruction, practice, and assessment.",
      placeholder: "What subject, grade level, and learning objective are you planning?",
      example: "e.g. A 50-minute 8th grade lesson on the causes of World War I for students who've never studied it",
      color: "#0369a1",
    },
    {
      id: "LearningObjectiveEngine",
      name: "Learning Objective Writer",
      icon: "🎯",
      tagline: "Objective architect",
      description: "Writes Bloom's taxonomy-aligned learning objectives at appropriate cognitive levels.",
      placeholder: "What content and what level of understanding do you want students to reach?",
      example: "e.g. Students should leave understanding photosynthesis well enough to explain it, apply it, and analyze it",
      color: "#0284c7",
    },
    {
      id: "ActivityDesignEngine",
      name: "Activity Designer",
      icon: "🎮",
      tagline: "Activity architect",
      description: "Designs classroom activities — discussion, simulation, problem-solving — aligned to learning goals.",
      placeholder: "What learning objective and what student engagement style works for your class?",
      example: "e.g. An activity that helps high school students understand how propaganda works without feeling lectured at",
      color: "#0369a1",
    },
    {
      id: "DifferentiationEngine",
      name: "Differentiation Strategies",
      icon: "🔀",
      tagline: "Differentiation architect",
      description: "Designs differentiation strategies for diverse learners in the same classroom.",
      placeholder: "What lesson content and what range of learner needs do you have in your class?",
      example: "e.g. A class with advanced readers, English language learners, and 2 students with IEPs — same lesson on fractions",
      color: "#0284c7",
    },
    {
      id: "AssessmentDesignEngine",
      name: "Assessment Designer",
      icon: "✅",
      tagline: "Assessment architect",
      description: "Designs assessments — formative and summative — aligned to learning objectives and student level.",
      placeholder: "What learning objectives and student context should this assessment measure?",
      example: "e.g. Assess whether 5th graders can apply the water cycle concept to real-world weather events",
      color: "#0369a1",
    }
  ],
};

export function LessonPlannerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
