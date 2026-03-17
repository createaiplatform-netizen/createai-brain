import React, { Suspense } from "react";
import { useOS } from "./OSContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { AppId } from "./OSContext";

// ── Lazy imports — every app is code-split into its own chunk ────────────────
// Core apps (kept lazy for consistency & future bundle size control)
const ChatApp           = React.lazy(() => import("@/Apps/ChatApp").then(m => ({ default: m.ChatApp })));
const ProjectsApp       = React.lazy(() => import("@/Apps/ProjectsApp").then(m => ({ default: m.ProjectsApp })));
const ToolsApp          = React.lazy(() => import("@/Apps/ToolsApp").then(m => ({ default: m.ToolsApp })));
const CreatorApp        = React.lazy(() => import("@/Apps/CreatorApp").then(m => ({ default: m.CreatorApp })));
const PeopleApp         = React.lazy(() => import("@/Apps/PeopleApp").then(m => ({ default: m.PeopleApp })));
const DocumentsApp      = React.lazy(() => import("@/Apps/DocumentsApp").then(m => ({ default: m.DocumentsApp })));
const MarketingApp      = React.lazy(() => import("@/Apps/MarketingApp").then(m => ({ default: m.MarketingApp })));
const AdminApp          = React.lazy(() => import("@/Apps/AdminApp").then(m => ({ default: m.AdminApp })));
const FamilyApp         = React.lazy(() => import("@/Apps/FamilyApp").then(m => ({ default: m.FamilyApp })));
const IntegrationApp    = React.lazy(() => import("@/Apps/IntegrationApp").then(m => ({ default: m.IntegrationApp })));
const MonetizationApp   = React.lazy(() => import("@/Apps/MonetizationApp").then(m => ({ default: m.MonetizationApp })));
const SimulationApp     = React.lazy(() => import("@/Apps/SimulationApp").then(m => ({ default: m.SimulationApp })));
const UniversalApp      = React.lazy(() => import("@/Apps/UniversalApp").then(m => ({ default: m.UniversalApp })));
const BusinessCreationApp = React.lazy(() => import("@/Apps/BusinessCreationApp").then(m => ({ default: m.BusinessCreationApp })));
const BusinessEntityApp = React.lazy(() => import("@/Apps/BusinessEntityApp").then(m => ({ default: m.BusinessEntityApp })));
const BizUniverseApp    = React.lazy(() => import("@/Apps/BizUniverseApp").then(m => ({ default: m.BizUniverseApp })));
const BizDevApp         = React.lazy(() => import("@/Apps/BizDevApp").then(m => ({ default: m.BizDevApp })));
const ProjectBuilderApp = React.lazy(() => import("@/Apps/ProjectBuilderApp").then(m => ({ default: m.ProjectBuilderApp })));
const ProjectOSApp      = React.lazy(() => import("@/Apps/ProjectOSApp").then(m => ({ default: m.ProjectOSApp })));
const NotificationsApp  = React.lazy(() => import("@/Apps/NotificationsApp").then(m => ({ default: m.NotificationsApp })));
const BrainHubApp       = React.lazy(() => import("@/Apps/BrainHubApp").then(m => ({ default: m.BrainHubApp })));
const ResearchHubApp    = React.lazy(() => import("@/Apps/ResearchHubApp").then(m => ({ default: m.ResearchHubApp })));
const LearningCenterApp = React.lazy(() => import("@/Apps/LearningCenterApp").then(m => ({ default: m.LearningCenterApp })));
const PersonaStudioApp  = React.lazy(() => import("@/Apps/PersonaStudioApp").then(m => ({ default: m.PersonaStudioApp })));
const DataStudioApp     = React.lazy(() => import("@/Apps/DataStudioApp").then(m => ({ default: m.DataStudioApp })));
const PricingStudioApp  = React.lazy(() => import("@/Apps/PricingStudioApp").then(m => ({ default: m.PricingStudioApp })));
const TractionDashboardApp = React.lazy(() => import("@/Apps/TractionDashboardApp").then(m => ({ default: m.TractionDashboardApp })));
const OpportunityApp    = React.lazy(() => import("@/Apps/OpportunityApp").then(m => ({ default: m.OpportunityApp })));
const ImaginationLabApp = React.lazy(() => import("@/Apps/ImaginationLabApp").then(m => ({ default: m.ImaginationLabApp })));
const LoreForgeApp      = React.lazy(() => import("@/Apps/LoreForgeApp").then(m => ({ default: m.LoreForgeApp })));
const NarratorOSApp     = React.lazy(() => import("@/Apps/NarratorOSApp").then(m => ({ default: m.NarratorOSApp })));
const CivilizationForgeApp = React.lazy(() => import("@/Apps/CivilizationForgeApp").then(m => ({ default: m.CivilizationForgeApp })));
const EcologyForgeApp   = React.lazy(() => import("@/Apps/EcologyForgeApp").then(m => ({ default: m.EcologyForgeApp })));
const SoundscapeStudioApp = React.lazy(() => import("@/Apps/SoundscapeStudioApp").then(m => ({ default: m.SoundscapeStudioApp })));
const TimelineForgeApp  = React.lazy(() => import("@/Apps/TimelineForgeApp").then(m => ({ default: m.TimelineForgeApp })));
const MythweaveStudioApp = React.lazy(() => import("@/Apps/MythweaveStudioApp").then(m => ({ default: m.MythweaveStudioApp })));
const LanguageForgeApp  = React.lazy(() => import("@/Apps/LanguageForgeApp").then(m => ({ default: m.LanguageForgeApp })));
const MagicSystemStudioApp = React.lazy(() => import("@/Apps/MagicSystemStudioApp").then(m => ({ default: m.MagicSystemStudioApp })));
const UrbanWorldEngineApp = React.lazy(() => import("@/Apps/UrbanWorldEngineApp").then(m => ({ default: m.UrbanWorldEngineApp })));
const WarloreStudioApp  = React.lazy(() => import("@/Apps/WarloreStudioApp").then(m => ({ default: m.WarloreStudioApp })));
const CharacterForgeApp = React.lazy(() => import("@/Apps/CharacterForgeApp").then(m => ({ default: m.CharacterForgeApp })));
const TechForgeApp      = React.lazy(() => import("@/Apps/TechForgeApp").then(m => ({ default: m.TechForgeApp })));
const VisualWorldStudioApp = React.lazy(() => import("@/Apps/VisualWorldStudioApp").then(m => ({ default: m.VisualWorldStudioApp })));
const ReligionForgeApp  = React.lazy(() => import("@/Apps/ReligionForgeApp").then(m => ({ default: m.ReligionForgeApp })));
const CosmologyForgeApp = React.lazy(() => import("@/Apps/CosmologyForgeApp").then(m => ({ default: m.CosmologyForgeApp })));
const GameWorldStudioApp = React.lazy(() => import("@/Apps/GameWorldStudioApp").then(m => ({ default: m.GameWorldStudioApp })));

// ── Creative Writing Suite ───────────────────────────────────────────────────
const ScriptwriterApp    = React.lazy(() => import("@/Apps/ScriptwriterApp").then(m => ({ default: m.ScriptwriterApp })));
const ComicScriptStudioApp = React.lazy(() => import("@/Apps/ComicScriptStudioApp").then(m => ({ default: m.ComicScriptStudioApp })));
const PoemForgeApp       = React.lazy(() => import("@/Apps/PoemForgeApp").then(m => ({ default: m.PoemForgeApp })));
const EssayWriterApp     = React.lazy(() => import("@/Apps/EssayWriterApp").then(m => ({ default: m.EssayWriterApp })));
const BlogWriterApp      = React.lazy(() => import("@/Apps/BlogWriterApp").then(m => ({ default: m.BlogWriterApp })));
const CopywriterApp      = React.lazy(() => import("@/Apps/CopywriterApp").then(m => ({ default: m.CopywriterApp })));
const StoryboarderApp    = React.lazy(() => import("@/Apps/StoryboarderApp").then(m => ({ default: m.StoryboarderApp })));
const SpeechwriterApp    = React.lazy(() => import("@/Apps/SpeechwriterApp").then(m => ({ default: m.SpeechwriterApp })));
const BookPlannerApp     = React.lazy(() => import("@/Apps/BookPlannerApp").then(m => ({ default: m.BookPlannerApp })));
const TechnicalWriterApp = React.lazy(() => import("@/Apps/TechnicalWriterApp").then(m => ({ default: m.TechnicalWriterApp })));
const ContentCalendarApp = React.lazy(() => import("@/Apps/ContentCalendarApp").then(m => ({ default: m.ContentCalendarApp })));

// ── Business & Strategy Suite ────────────────────────────────────────────────
const BusinessStrategistApp = React.lazy(() => import("@/Apps/BusinessStrategistApp").then(m => ({ default: m.BusinessStrategistApp })));
const ReportBuilderApp   = React.lazy(() => import("@/Apps/ReportBuilderApp").then(m => ({ default: m.ReportBuilderApp })));
const ProposalBuilderApp = React.lazy(() => import("@/Apps/ProposalBuilderApp").then(m => ({ default: m.ProposalBuilderApp })));
const EmailComposerApp   = React.lazy(() => import("@/Apps/EmailComposerApp").then(m => ({ default: m.EmailComposerApp })));
const HiringAssistantApp = React.lazy(() => import("@/Apps/HiringAssistantApp").then(m => ({ default: m.HiringAssistantApp })));
const MeetingPlannerApp  = React.lazy(() => import("@/Apps/MeetingPlannerApp").then(m => ({ default: m.MeetingPlannerApp })));
const PresentationBuilderApp = React.lazy(() => import("@/Apps/PresentationBuilderApp").then(m => ({ default: m.PresentationBuilderApp })));
const BudgetPlannerApp   = React.lazy(() => import("@/Apps/BudgetPlannerApp").then(m => ({ default: m.BudgetPlannerApp })));
const PerformanceReviewerApp = React.lazy(() => import("@/Apps/PerformanceReviewerApp").then(m => ({ default: m.PerformanceReviewerApp })));
const ContractDrafterApp = React.lazy(() => import("@/Apps/ContractDrafterApp").then(m => ({ default: m.ContractDrafterApp })));

// ── World & Universe Building ────────────────────────────────────────────────
const AlienSpeciesForgeApp    = React.lazy(() => import("@/Apps/AlienSpeciesForgeApp").then(m => ({ default: m.AlienSpeciesForgeApp })));
const PlanetBuilderApp        = React.lazy(() => import("@/Apps/PlanetBuilderApp").then(m => ({ default: m.PlanetBuilderApp })));
const FutureCivilizationApp   = React.lazy(() => import("@/Apps/FutureCivilizationApp").then(m => ({ default: m.FutureCivilizationApp })));
const MonsterForgeApp         = React.lazy(() => import("@/Apps/MonsterForgeApp").then(m => ({ default: m.MonsterForgeApp })));
const ArtifactForgeApp        = React.lazy(() => import("@/Apps/ArtifactForgeApp").then(m => ({ default: m.ArtifactForgeApp })));
const DimensionBuilderApp     = React.lazy(() => import("@/Apps/DimensionBuilderApp").then(m => ({ default: m.DimensionBuilderApp })));
const DystopiaBuilderApp      = React.lazy(() => import("@/Apps/DystopiaBuilderApp").then(m => ({ default: m.DystopiaBuilderApp })));
const UtopiaBuilderApp        = React.lazy(() => import("@/Apps/UtopiaBuilderApp").then(m => ({ default: m.UtopiaBuilderApp })));
const AncientCivilizationApp  = React.lazy(() => import("@/Apps/AncientCivilizationApp").then(m => ({ default: m.AncientCivilizationApp })));

// ── Learning & Research ──────────────────────────────────────────────────────
const ResearchAssistantApp   = React.lazy(() => import("@/Apps/ResearchAssistantApp").then(m => ({ default: m.ResearchAssistantApp })));
const ConceptExplainerApp    = React.lazy(() => import("@/Apps/ConceptExplainerApp").then(m => ({ default: m.ConceptExplainerApp })));
const DebatePrepApp          = React.lazy(() => import("@/Apps/DebatePrepApp").then(m => ({ default: m.DebatePrepApp })));
const CriticalThinkingCoachApp = React.lazy(() => import("@/Apps/CriticalThinkingCoachApp").then(m => ({ default: m.CriticalThinkingCoachApp })));
const PhilosophyExplorerApp  = React.lazy(() => import("@/Apps/PhilosophyExplorerApp").then(m => ({ default: m.PhilosophyExplorerApp })));
const StudyPlannerApp        = React.lazy(() => import("@/Apps/StudyPlannerApp").then(m => ({ default: m.StudyPlannerApp })));
const ScienceExplainerApp    = React.lazy(() => import("@/Apps/ScienceExplainerApp").then(m => ({ default: m.ScienceExplainerApp })));
const MathSolverApp          = React.lazy(() => import("@/Apps/MathSolverApp").then(m => ({ default: m.MathSolverApp })));

// ── Lifestyle & Personal ─────────────────────────────────────────────────────
const JournalStudioApp      = React.lazy(() => import("@/Apps/JournalStudioApp").then(m => ({ default: m.JournalStudioApp })));
const GoalPlannerApp        = React.lazy(() => import("@/Apps/GoalPlannerApp").then(m => ({ default: m.GoalPlannerApp })));
const TravelPlannerApp      = React.lazy(() => import("@/Apps/TravelPlannerApp").then(m => ({ default: m.TravelPlannerApp })));
const RecipeCreatorApp      = React.lazy(() => import("@/Apps/RecipeCreatorApp").then(m => ({ default: m.RecipeCreatorApp })));
const FitnessCoachApp       = React.lazy(() => import("@/Apps/FitnessCoachApp").then(m => ({ default: m.FitnessCoachApp })));
const MeditationGuideApp    = React.lazy(() => import("@/Apps/MeditationGuideApp").then(m => ({ default: m.MeditationGuideApp })));
const FinanceAdvisorApp     = React.lazy(() => import("@/Apps/FinanceAdvisorApp").then(m => ({ default: m.FinanceAdvisorApp })));
const RelationshipCoachApp  = React.lazy(() => import("@/Apps/RelationshipCoachApp").then(m => ({ default: m.RelationshipCoachApp })));

// ── Music & Audio ────────────────────────────────────────────────────────────
const LyricsWriterApp       = React.lazy(() => import("@/Apps/LyricsWriterApp").then(m => ({ default: m.LyricsWriterApp })));
const SongStructureStudioApp = React.lazy(() => import("@/Apps/SongStructureStudioApp").then(m => ({ default: m.SongStructureStudioApp })));
const PodcastPlannerApp     = React.lazy(() => import("@/Apps/PodcastPlannerApp").then(m => ({ default: m.PodcastPlannerApp })));
const MusicTheoryStudioApp  = React.lazy(() => import("@/Apps/MusicTheoryStudioApp").then(m => ({ default: m.MusicTheoryStudioApp })));
const SoundDesignerApp      = React.lazy(() => import("@/Apps/SoundDesignerApp").then(m => ({ default: m.SoundDesignerApp })));

// ── Game Design ──────────────────────────────────────────────────────────────
const QuestDesignerApp      = React.lazy(() => import("@/Apps/QuestDesignerApp").then(m => ({ default: m.QuestDesignerApp })));
const NPCCreatorApp         = React.lazy(() => import("@/Apps/NPCCreatorApp").then(m => ({ default: m.NPCCreatorApp })));
const DungeonBuilderApp     = React.lazy(() => import("@/Apps/DungeonBuilderApp").then(m => ({ default: m.DungeonBuilderApp })));
const ItemForgeApp          = React.lazy(() => import("@/Apps/ItemForgeApp").then(m => ({ default: m.ItemForgeApp })));
const GameNarrativeStudioApp = React.lazy(() => import("@/Apps/GameNarrativeStudioApp").then(m => ({ default: m.GameNarrativeStudioApp })));
const BalanceDesignerApp    = React.lazy(() => import("@/Apps/BalanceDesignerApp").then(m => ({ default: m.BalanceDesignerApp })));

// ── AI & Technology ──────────────────────────────────────────────────────────
const PromptEngineerApp     = React.lazy(() => import("@/Apps/PromptEngineerApp").then(m => ({ default: m.PromptEngineerApp })));
const DataStorytellerApp    = React.lazy(() => import("@/Apps/DataStorytellerApp").then(m => ({ default: m.DataStorytellerApp })));
const SystemDesignerApp     = React.lazy(() => import("@/Apps/SystemDesignerApp").then(m => ({ default: m.SystemDesignerApp })));
const CodeReviewerApp       = React.lazy(() => import("@/Apps/CodeReviewerApp").then(m => ({ default: m.CodeReviewerApp })));
const DevPlannerApp         = React.lazy(() => import("@/Apps/DevPlannerApp").then(m => ({ default: m.DevPlannerApp })));

// ── Health & Wellness ────────────────────────────────────────────────────────
const HealthCoachApp        = React.lazy(() => import("@/Apps/HealthCoachApp").then(m => ({ default: m.HealthCoachApp })));
const MentalHealthSupportApp = React.lazy(() => import("@/Apps/MentalHealthSupportApp").then(m => ({ default: m.MentalHealthSupportApp })));
const NutritionPlannerApp   = React.lazy(() => import("@/Apps/NutritionPlannerApp").then(m => ({ default: m.NutritionPlannerApp })));
const SleepCoachApp         = React.lazy(() => import("@/Apps/SleepCoachApp").then(m => ({ default: m.SleepCoachApp })));
const ParentingGuideApp     = React.lazy(() => import("@/Apps/ParentingGuideApp").then(m => ({ default: m.ParentingGuideApp })));

// ── Arts & Culture ───────────────────────────────────────────────────────────
const ArtCritiqueStudioApp  = React.lazy(() => import("@/Apps/ArtCritiqueStudioApp").then(m => ({ default: m.ArtCritiqueStudioApp })));
const FilmAnalysisStudioApp = React.lazy(() => import("@/Apps/FilmAnalysisStudioApp").then(m => ({ default: m.FilmAnalysisStudioApp })));
const CulturalExplorerApp   = React.lazy(() => import("@/Apps/CulturalExplorerApp").then(m => ({ default: m.CulturalExplorerApp })));

// ── Legal & Professional ─────────────────────────────────────────────────────
const LegalDrafterApp       = React.lazy(() => import("@/Apps/LegalDrafterApp").then(m => ({ default: m.LegalDrafterApp })));
const IPProtectionStudioApp = React.lazy(() => import("@/Apps/IPProtectionStudioApp").then(m => ({ default: m.IPProtectionStudioApp })));
const PrivacyPolicyStudioApp = React.lazy(() => import("@/Apps/PrivacyPolicyStudioApp").then(m => ({ default: m.PrivacyPolicyStudioApp })));

// ── Education & Teaching ─────────────────────────────────────────────────────
const LessonPlannerApp      = React.lazy(() => import("@/Apps/LessonPlannerApp").then(m => ({ default: m.LessonPlannerApp })));
const CurriculumDesignerApp = React.lazy(() => import("@/Apps/CurriculumDesignerApp").then(m => ({ default: m.CurriculumDesignerApp })));

// ── App registry ─────────────────────────────────────────────────────────────
const APP_COMPONENTS: Record<AppId, React.LazyExoticComponent<React.ComponentType<any>>> = {
  // Core
  chat:         ChatApp,
  projects:     ProjectsApp,
  tools:        ToolsApp,
  creator:      CreatorApp,
  people:       PeopleApp,
  documents:    DocumentsApp,
  marketing:    MarketingApp,
  admin:        AdminApp,
  family:       FamilyApp,
  integration:  IntegrationApp,
  monetization: MonetizationApp,
  simulation:   SimulationApp,
  universal:    UniversalApp,
  business:     BusinessCreationApp,
  entity:       BusinessEntityApp,
  bizcreator:   BizUniverseApp,
  bizdev:       BizDevApp,
  projbuilder:  ProjectBuilderApp,
  projos:         ProjectOSApp,
  notifications:  NotificationsApp,
  brainhub:       BrainHubApp,
  researchhub:    ResearchHubApp,
  learningcenter: LearningCenterApp,
  personastudio:  PersonaStudioApp,
  datastudio:     DataStudioApp,
  pricingstudio:  PricingStudioApp,
  traction:       TractionDashboardApp,
  opportunity:    OpportunityApp,
  imaginationlab: ImaginationLabApp,
  loreforge:          LoreForgeApp,
  narratoros:         NarratorOSApp,
  civilizationforge:  CivilizationForgeApp,
  ecologyforge:       EcologyForgeApp,
  soundscape:         SoundscapeStudioApp,
  timelineforge:      TimelineForgeApp,
  mythweave:          MythweaveStudioApp,
  languageforge:   LanguageForgeApp,
  magicsystem:     MagicSystemStudioApp,
  urbanworld:      UrbanWorldEngineApp,
  warlore:         WarloreStudioApp,
  characterforge:  CharacterForgeApp,
  techforge:       TechForgeApp,
  visualworld:     VisualWorldStudioApp,
  religionforge:   ReligionForgeApp,
  cosmologyforge:  CosmologyForgeApp,
  gameworld:       GameWorldStudioApp,
  // Creative Writing
  scriptwriter:    ScriptwriterApp,
  comicscript:     ComicScriptStudioApp,
  poemforge:       PoemForgeApp,
  essaywriter:     EssayWriterApp,
  blogwriter:      BlogWriterApp,
  copywriter:      CopywriterApp,
  storyboarder:    StoryboarderApp,
  speechwriter:    SpeechwriterApp,
  bookplanner:     BookPlannerApp,
  technicalwriter: TechnicalWriterApp,
  contentcalendar: ContentCalendarApp,
  // Business & Strategy
  strategist:      BusinessStrategistApp,
  reportbuilder:   ReportBuilderApp,
  proposalbuilder: ProposalBuilderApp,
  emailcomposer:   EmailComposerApp,
  hiringassist:    HiringAssistantApp,
  meetingplanner:  MeetingPlannerApp,
  presentbuilder:  PresentationBuilderApp,
  budgetplanner:   BudgetPlannerApp,
  perfreviewer:    PerformanceReviewerApp,
  contractdraft:   ContractDrafterApp,
  // World Building
  alienspecies:       AlienSpeciesForgeApp,
  planetbuilder:      PlanetBuilderApp,
  futurecivilization: FutureCivilizationApp,
  monsterforge:       MonsterForgeApp,
  artifactforge:      ArtifactForgeApp,
  dimensionbuilder:   DimensionBuilderApp,
  dystopia:           DystopiaBuilderApp,
  utopia:             UtopiaBuilderApp,
  ancientcivilization:AncientCivilizationApp,
  // Learning & Research
  researchassist:     ResearchAssistantApp,
  conceptexplainer:   ConceptExplainerApp,
  debateprep:         DebatePrepApp,
  criticalthinking:   CriticalThinkingCoachApp,
  philosophyexplorer: PhilosophyExplorerApp,
  studyplanner:       StudyPlannerApp,
  scienceexplainer:   ScienceExplainerApp,
  mathsolver:         MathSolverApp,
  // Lifestyle
  journal:            JournalStudioApp,
  goalplanner:        GoalPlannerApp,
  travelplanner:      TravelPlannerApp,
  recipecreator:      RecipeCreatorApp,
  fitnesscoach:       FitnessCoachApp,
  meditationguide:    MeditationGuideApp,
  financeadvisor:     FinanceAdvisorApp,
  relationshipcoach:  RelationshipCoachApp,
  // Music & Audio
  lyricswriter:    LyricsWriterApp,
  songstructure:   SongStructureStudioApp,
  podcastplanner:  PodcastPlannerApp,
  musictheory:     MusicTheoryStudioApp,
  sounddesigner:   SoundDesignerApp,
  // Game Design
  questdesigner:   QuestDesignerApp,
  npccreator:      NPCCreatorApp,
  dungeonbuilder:  DungeonBuilderApp,
  itemforge:       ItemForgeApp,
  gamenarrative:   GameNarrativeStudioApp,
  balancedesigner: BalanceDesignerApp,
  // AI & Tech
  promptengineer:  PromptEngineerApp,
  datastoryteller: DataStorytellerApp,
  systemdesigner:  SystemDesignerApp,
  codereviewer:    CodeReviewerApp,
  devplanner:      DevPlannerApp,
  // Health & Wellness
  healthcoach:       HealthCoachApp,
  mentalhealth:      MentalHealthSupportApp,
  nutritionplanner:  NutritionPlannerApp,
  sleepcoach:        SleepCoachApp,
  parentingguide:    ParentingGuideApp,
  // Arts & Culture
  artcritique:     ArtCritiqueStudioApp,
  filmanalysis:    FilmAnalysisStudioApp,
  culturalexplorer:CulturalExplorerApp,
  // Legal
  legaldrafter:    LegalDrafterApp,
  ipprotection:    IPProtectionStudioApp,
  privacypolicy:   PrivacyPolicyStudioApp,
  // Education
  lessonplanner:      LessonPlannerApp,
  curriculumdesigner: CurriculumDesignerApp,
};

// ── Loading skeleton ─────────────────────────────────────────────────────────
function AppSkeleton() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.12)", animation: "pulse 1.5s infinite" }} />
      <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Loading…</div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

interface AppWindowProps {
  onHamburger?: () => void;
  children?: React.ReactNode;
}

export function AppWindow({ onHamburger }: AppWindowProps) {
  const { activeApp, appRegistry, history, closeApp, goBack } = useOS();

  if (!activeApp) return null;

  const AppComponent = APP_COMPONENTS[activeApp];
  const appDef = appRegistry.find(a => a.id === activeApp);
  const label  = appDef?.label ?? activeApp;
  const icon   = appDef?.icon  ?? "📱";

  return (
    <div key={activeApp} className="flex-1 flex flex-col overflow-hidden min-w-0 animate-fade-up" style={{ animationDuration: "0.32s" }}>

      {/* ── Top bar ── */}
      <header className="flex items-center h-14 px-4 gap-3 flex-shrink-0 z-10 glass-topbar">
        {/* Hamburger — mobile only */}
        {onHamburger && (
          <button
            onClick={onHamburger}
            aria-label="Open navigation"
            className="w-8 h-8 flex flex-col items-center justify-center gap-[5px] rounded-xl transition-all duration-150 flex-shrink-0"
            style={{ color: "#6b7280" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <span className="w-4 h-[1.5px] rounded-full block" style={{ background: "#6b7280" }} />
            <span className="w-4 h-[1.5px] rounded-full block" style={{ background: "#6b7280" }} />
            <span className="w-4 h-[1.5px] rounded-full block" style={{ background: "#6b7280" }} />
          </button>
        )}

        {/* Back / Home */}
        <button
          onClick={history.length > 0 ? goBack : closeApp}
          className="flex items-center gap-1 text-sm font-medium transition-opacity duration-150 flex-shrink-0 hover:opacity-70"
          style={{ color: "#6366f1" }}
        >
          <span className="text-[18px] leading-none font-light">‹</span>
          <span className="hidden sm:inline text-[13px]" style={{ letterSpacing: "-0.01em" }}>
            {history.length > 0 ? "Back" : "Home"}
          </span>
        </button>

        {/* Separator */}
        <div className="h-4 w-px flex-shrink-0" style={{ background: "rgba(0,0,0,0.10)" }} />

        {/* Title */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-base leading-none">{icon}</span>
          <h1 className="font-semibold text-[15px] truncate" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
            {label}
          </h1>
        </div>

        {/* Close */}
        <button
          onClick={closeApp}
          aria-label="Close app"
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all duration-150 font-medium"
          style={{ background: "rgba(0,0,0,0.05)", color: "#9ca3af", border: "1px solid rgba(0,0,0,0.07)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.10)";
            (e.currentTarget as HTMLElement).style.color = "#ef4444";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.20)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)";
            (e.currentTarget as HTMLElement).style.color = "#9ca3af";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)";
          }}
        >
          ✕
        </button>
      </header>

      {/* ── Breadcrumb bar ── */}
      <div
        className="flex items-center gap-1.5 px-4 h-7 flex-shrink-0"
        style={{ background: "rgba(99,102,241,0.04)", borderBottom: "1px solid rgba(99,102,241,0.08)" }}
      >
        <span className="text-[10px]" style={{ color: "#94a3b8" }}>CreateAI Brain</span>
        <span className="text-[9px]" style={{ color: "#c7d2fe" }}>›</span>
        <span className="text-[10px]" style={{ color: "#c7d2fe" }}>{icon}</span>
        <span className="text-[10px] font-medium" style={{ color: "#6366f1" }}>{label}</span>
      </div>

      {/* ── App content with Suspense boundary ── */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ background: "hsl(220,20%,97%)" }}
      >
        <ErrorBoundary appName={label}>
          <Suspense fallback={<AppSkeleton />}>
            <AppComponent />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
