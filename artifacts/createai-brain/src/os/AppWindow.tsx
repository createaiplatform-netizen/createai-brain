import React, { Suspense } from "react";
import { useOS } from "./OSContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { AppId } from "./OSContext";
import { InternalAdBanner } from "@/components/InternalAdBanner";
import { RelatedAppsBar } from "@/components/RelatedAppsBar";

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
const CommandCenterApp  = React.lazy(() => import("@/Apps/CommandCenterApp").then(m => ({ default: m.CommandCenterApp })));
const ResearchHubApp    = React.lazy(() => import("@/Apps/ResearchHubApp").then(m => ({ default: m.ResearchHubApp })));
const LearningCenterApp = React.lazy(() => import("@/Apps/LearningCenterApp").then(m => ({ default: m.LearningCenterApp })));
const PersonaStudioApp  = React.lazy(() => import("@/Apps/PersonaStudioApp").then(m => ({ default: m.PersonaStudioApp })));
const DataStudioApp     = React.lazy(() => import("@/Apps/DataStudioApp").then(m => ({ default: m.DataStudioApp })));
const PricingStudioApp  = React.lazy(() => import("@/Apps/PricingStudioApp").then(m => ({ default: m.PricingStudioApp })));
const TractionDashboardApp = React.lazy(() => import("@/Apps/TractionDashboardApp").then(m => ({ default: m.TractionDashboardApp })));
const OpportunityApp    = React.lazy(() => import("@/Apps/OpportunityApp").then(m => ({ default: m.OpportunityApp })));
const LeadCycleApp      = React.lazy(() => import("@/Apps/LeadCycleApp"));
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
const MetricsPanelApp       = React.lazy(() => import("@/Apps/MetricsPanelApp").then(m => ({ default: m.MetricsPanelApp })));
const IntegrationDashboard  = React.lazy(() => import("@/Apps/IntegrationDashboard").then(m => ({ default: m.IntegrationDashboard })));
const BuilderSpaceApp       = React.lazy(() => import("@/Apps/BuilderSpaceApp").then(m => ({ default: m.BuilderSpaceApp })));
const IdentityManagerApp    = React.lazy(() => import("@/Apps/IdentityManagerApp").then(m => ({ default: m.IdentityManagerApp })));
const CreateAIDashboardApp       = React.lazy(() => import("@/Apps/CreateAIDashboardApp"));
const InfiniteBrainControlPanel  = React.lazy(() => import("@/Apps/InfiniteBrainControlPanel").then(m => ({ default: m.InfiniteBrainControlPanel })));
const InfiniteBrainPortalFull    = React.lazy(() => import("@/Apps/InfiniteBrainPortalFull").then(m => ({ default: m.InfiniteBrainPortalFull })));
const InfiniteBrainDashboard     = React.lazy(() => import("@/Apps/InfiniteBrainDashboard").then(m => ({ default: m.InfiniteBrainDashboard })));
const UCPXAgentApp          = React.lazy(() => import("@/ucpx/UCPXAgent").then(m => ({ default: m.UCPXAgent })));
const UniversalDemoApp      = React.lazy(() => import("@/Apps/UniversalDemoEngine").then(m => ({ default: m.UniversalDemoEngine })));
const GenericEngineWrapperApp = React.lazy(() => import("@/Apps/GenericEngineWrapper").then(m => ({ default: m.GenericEngineWrapper })));

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

// ── Enterprise Suite (generated) ───────────────────────────────────────────────
const ZeroTrustApp = React.lazy(() => import("@/Apps/ZeroTrustApp").then(m => ({ default: m.ZeroTrustApp })));
const ThreatModelApp = React.lazy(() => import("@/Apps/ThreatModelApp").then(m => ({ default: m.ThreatModelApp })));
const SOCDashboardApp = React.lazy(() => import("@/Apps/SOCDashboardApp").then(m => ({ default: m.SOCDashboardApp })));
const PenTestPlanApp = React.lazy(() => import("@/Apps/PenTestPlanApp").then(m => ({ default: m.PenTestPlanApp })));
const IncidentResponseApp = React.lazy(() => import("@/Apps/IncidentResponseApp").then(m => ({ default: m.IncidentResponseApp })));
const IAMStudioApp = React.lazy(() => import("@/Apps/IAMStudioApp").then(m => ({ default: m.IAMStudioApp })));
const EncryptionPlannerApp = React.lazy(() => import("@/Apps/EncryptionPlannerApp").then(m => ({ default: m.EncryptionPlannerApp })));
const VulnScannerApp = React.lazy(() => import("@/Apps/VulnScannerApp").then(m => ({ default: m.VulnScannerApp })));
const SecurityAuditStudioApp = React.lazy(() => import("@/Apps/SecurityAuditStudioApp").then(m => ({ default: m.SecurityAuditStudioApp })));
const CloudSecurityApp = React.lazy(() => import("@/Apps/CloudSecurityApp").then(m => ({ default: m.CloudSecurityApp })));
const NetworkDefenseApp = React.lazy(() => import("@/Apps/NetworkDefenseApp").then(m => ({ default: m.NetworkDefenseApp })));
const AppSecurityApp = React.lazy(() => import("@/Apps/AppSecurityApp").then(m => ({ default: m.AppSecurityApp })));
const EndpointSecurityApp = React.lazy(() => import("@/Apps/EndpointSecurityApp").then(m => ({ default: m.EndpointSecurityApp })));
const SecureSDLCApp = React.lazy(() => import("@/Apps/SecureSDLCApp").then(m => ({ default: m.SecureSDLCApp })));
const PrivacyByDesignApp = React.lazy(() => import("@/Apps/PrivacyByDesignApp").then(m => ({ default: m.PrivacyByDesignApp })));
const CyberResilienceApp = React.lazy(() => import("@/Apps/CyberResilienceApp").then(m => ({ default: m.CyberResilienceApp })));
const RedTeamPlannerApp = React.lazy(() => import("@/Apps/RedTeamPlannerApp").then(m => ({ default: m.RedTeamPlannerApp })));
const SecurityPostureApp = React.lazy(() => import("@/Apps/SecurityPostureApp").then(m => ({ default: m.SecurityPostureApp })));
const CveTrackerApp = React.lazy(() => import("@/Apps/CveTrackerApp").then(m => ({ default: m.CveTrackerApp })));
const SecurityPolicyApp = React.lazy(() => import("@/Apps/SecurityPolicyApp").then(m => ({ default: m.SecurityPolicyApp })));
const FinancialModelerApp = React.lazy(() => import("@/Apps/FinancialModelerApp").then(m => ({ default: m.FinancialModelerApp })));
const RevenueRecognitionApp = React.lazy(() => import("@/Apps/RevenueRecognitionApp").then(m => ({ default: m.RevenueRecognitionApp })));
const CashFlowPlannerApp = React.lazy(() => import("@/Apps/CashFlowPlannerApp").then(m => ({ default: m.CashFlowPlannerApp })));
const InvestmentThesisApp = React.lazy(() => import("@/Apps/InvestmentThesisApp").then(m => ({ default: m.InvestmentThesisApp })));
const FundraisingStudioApp = React.lazy(() => import("@/Apps/FundraisingStudioApp").then(m => ({ default: m.FundraisingStudioApp })));
const TaxStrategyApp = React.lazy(() => import("@/Apps/TaxStrategyApp").then(m => ({ default: m.TaxStrategyApp })));
const EquityPlannerApp = React.lazy(() => import("@/Apps/EquityPlannerApp").then(m => ({ default: m.EquityPlannerApp })));
const UnitEconomicsApp = React.lazy(() => import("@/Apps/UnitEconomicsApp").then(m => ({ default: m.UnitEconomicsApp })));
const AuditPrepApp = React.lazy(() => import("@/Apps/AuditPrepApp").then(m => ({ default: m.AuditPrepApp })));
const BudgetBuilderApp = React.lazy(() => import("@/Apps/BudgetBuilderApp").then(m => ({ default: m.BudgetBuilderApp })));
const MAAnalyzerApp = React.lazy(() => import("@/Apps/MAAnalyzerApp").then(m => ({ default: m.MAAnalyzerApp })));
const IPOReadinessApp = React.lazy(() => import("@/Apps/IPOReadinessApp").then(m => ({ default: m.IPOReadinessApp })));
const GrantWriterApp = React.lazy(() => import("@/Apps/GrantWriterApp").then(m => ({ default: m.GrantWriterApp })));
const CryptoTokenomicsApp = React.lazy(() => import("@/Apps/CryptoTokenomicsApp").then(m => ({ default: m.CryptoTokenomicsApp })));
const InsurancePlannerApp = React.lazy(() => import("@/Apps/InsurancePlannerApp").then(m => ({ default: m.InsurancePlannerApp })));
const DebtStructureApp = React.lazy(() => import("@/Apps/DebtStructureApp").then(m => ({ default: m.DebtStructureApp })));
const FPADashboardApp = React.lazy(() => import("@/Apps/FPADashboardApp").then(m => ({ default: m.FPADashboardApp })));
const TreasuryManagerApp = React.lazy(() => import("@/Apps/TreasuryManagerApp").then(m => ({ default: m.TreasuryManagerApp })));
const FinanceReportApp = React.lazy(() => import("@/Apps/FinanceReportApp").then(m => ({ default: m.FinanceReportApp })));
const CapTableApp = React.lazy(() => import("@/Apps/CapTableApp").then(m => ({ default: m.CapTableApp })));
const EHRIntegrationApp = React.lazy(() => import("@/Apps/EHRIntegrationApp").then(m => ({ default: m.EHRIntegrationApp })));
const ClinicalWorkflowApp = React.lazy(() => import("@/Apps/ClinicalWorkflowApp").then(m => ({ default: m.ClinicalWorkflowApp })));
const PatientEngagementApp = React.lazy(() => import("@/Apps/PatientEngagementApp").then(m => ({ default: m.PatientEngagementApp })));
const HealthcareComplianceApp = React.lazy(() => import("@/Apps/HealthcareComplianceApp").then(m => ({ default: m.HealthcareComplianceApp })));
const TelehealthBuilderApp = React.lazy(() => import("@/Apps/TelehealthBuilderApp").then(m => ({ default: m.TelehealthBuilderApp })));
const ClinicalTrialApp = React.lazy(() => import("@/Apps/ClinicalTrialApp").then(m => ({ default: m.ClinicalTrialApp })));
const MedicalCodingApp = React.lazy(() => import("@/Apps/MedicalCodingApp").then(m => ({ default: m.MedicalCodingApp })));
const HealthAnalyticsApp = React.lazy(() => import("@/Apps/HealthAnalyticsApp").then(m => ({ default: m.HealthAnalyticsApp })));
const CareCoordinationApp = React.lazy(() => import("@/Apps/CareCoordinationApp").then(m => ({ default: m.CareCoordinationApp })));
const HealthcareAPIApp = React.lazy(() => import("@/Apps/HealthcareAPIApp").then(m => ({ default: m.HealthcareAPIApp })));
const MentalHealthPlatformApp = React.lazy(() => import("@/Apps/MentalHealthPlatformApp").then(m => ({ default: m.MentalHealthPlatformApp })));
const HomeHealthOSApp = React.lazy(() => import("@/Apps/HomeHealthOSApp").then(m => ({ default: m.HomeHealthOSApp })));
const PharmacyOSApp = React.lazy(() => import("@/Apps/PharmacyOSApp").then(m => ({ default: m.PharmacyOSApp })));
const MedicalDeviceApp = React.lazy(() => import("@/Apps/MedicalDeviceApp").then(m => ({ default: m.MedicalDeviceApp })));
const HealthDataGovernanceApp = React.lazy(() => import("@/Apps/HealthDataGovernanceApp").then(m => ({ default: m.HealthDataGovernanceApp })));
const ClinicalDecisionApp = React.lazy(() => import("@/Apps/ClinicalDecisionApp").then(m => ({ default: m.ClinicalDecisionApp })));
const HealthBillingApp = React.lazy(() => import("@/Apps/HealthBillingApp").then(m => ({ default: m.HealthBillingApp })));
const PopulationHealthApp = React.lazy(() => import("@/Apps/PopulationHealthApp").then(m => ({ default: m.PopulationHealthApp })));
const HIPAADashboardApp = React.lazy(() => import("@/Apps/HIPAADashboardApp").then(m => ({ default: m.HIPAADashboardApp })));
const FHIRBuilderApp = React.lazy(() => import("@/Apps/FHIRBuilderApp").then(m => ({ default: m.FHIRBuilderApp })));
const LearningPathBuilderApp = React.lazy(() => import("@/Apps/LearningPathBuilderApp").then(m => ({ default: m.LearningPathBuilderApp })));
const AssessmentBuilderApp = React.lazy(() => import("@/Apps/AssessmentBuilderApp").then(m => ({ default: m.AssessmentBuilderApp })));
const StudentEngagementApp = React.lazy(() => import("@/Apps/StudentEngagementApp").then(m => ({ default: m.StudentEngagementApp })));
const LMSBuilderApp = React.lazy(() => import("@/Apps/LMSBuilderApp").then(m => ({ default: m.LMSBuilderApp })));
const EdTechStackApp = React.lazy(() => import("@/Apps/EdTechStackApp").then(m => ({ default: m.EdTechStackApp })));
const EduAccessibilityApp = React.lazy(() => import("@/Apps/EduAccessibilityApp").then(m => ({ default: m.EduAccessibilityApp })));
const InstructionalDesignApp = React.lazy(() => import("@/Apps/InstructionalDesignApp").then(m => ({ default: m.InstructionalDesignApp })));
const MicrolearningStudioApp = React.lazy(() => import("@/Apps/MicrolearningStudioApp").then(m => ({ default: m.MicrolearningStudioApp })));
const GameLearningApp = React.lazy(() => import("@/Apps/GameLearningApp").then(m => ({ default: m.GameLearningApp })));
const VirtualClassroomApp = React.lazy(() => import("@/Apps/VirtualClassroomApp").then(m => ({ default: m.VirtualClassroomApp })));
const CredentialBuilderApp = React.lazy(() => import("@/Apps/CredentialBuilderApp").then(m => ({ default: m.CredentialBuilderApp })));
const AdaptiveLearningApp = React.lazy(() => import("@/Apps/AdaptiveLearningApp").then(m => ({ default: m.AdaptiveLearningApp })));
const ParentPortalApp = React.lazy(() => import("@/Apps/ParentPortalApp").then(m => ({ default: m.ParentPortalApp })));
const TeacherToolboxApp = React.lazy(() => import("@/Apps/TeacherToolboxApp").then(m => ({ default: m.TeacherToolboxApp })));
const K12PlatformApp = React.lazy(() => import("@/Apps/K12PlatformApp").then(m => ({ default: m.K12PlatformApp })));
const HigherEduOSApp = React.lazy(() => import("@/Apps/HigherEduOSApp").then(m => ({ default: m.HigherEduOSApp })));
const ContinuingEduApp = React.lazy(() => import("@/Apps/ContinuingEduApp").then(m => ({ default: m.ContinuingEduApp })));
const SchoolAnalyticsApp = React.lazy(() => import("@/Apps/SchoolAnalyticsApp").then(m => ({ default: m.SchoolAnalyticsApp })));
const EduMarketplaceApp = React.lazy(() => import("@/Apps/EduMarketplaceApp").then(m => ({ default: m.EduMarketplaceApp })));
const SupplyChainOSApp = React.lazy(() => import("@/Apps/SupplyChainOSApp").then(m => ({ default: m.SupplyChainOSApp })));
const InventoryOSApp = React.lazy(() => import("@/Apps/InventoryOSApp").then(m => ({ default: m.InventoryOSApp })));
const QualityManagementApp = React.lazy(() => import("@/Apps/QualityManagementApp").then(m => ({ default: m.QualityManagementApp })));
const FacilitiesOSApp = React.lazy(() => import("@/Apps/FacilitiesOSApp").then(m => ({ default: m.FacilitiesOSApp })));
const ProcessMinerApp = React.lazy(() => import("@/Apps/ProcessMinerApp").then(m => ({ default: m.ProcessMinerApp })));
const LogisticsOSApp = React.lazy(() => import("@/Apps/LogisticsOSApp").then(m => ({ default: m.LogisticsOSApp })));
const ProcurementOSApp = React.lazy(() => import("@/Apps/ProcurementOSApp").then(m => ({ default: m.ProcurementOSApp })));
const VendorOSApp = React.lazy(() => import("@/Apps/VendorOSApp").then(m => ({ default: m.VendorOSApp })));
const OpsAnalyticsApp = React.lazy(() => import("@/Apps/OpsAnalyticsApp").then(m => ({ default: m.OpsAnalyticsApp })));
const LeanSigmaApp = React.lazy(() => import("@/Apps/LeanSigmaApp").then(m => ({ default: m.LeanSigmaApp })));
const ChangeManagementApp = React.lazy(() => import("@/Apps/ChangeManagementApp").then(m => ({ default: m.ChangeManagementApp })));
const BCPBuilderApp = React.lazy(() => import("@/Apps/BCPBuilderApp").then(m => ({ default: m.BCPBuilderApp })));
const KPIBuilderApp = React.lazy(() => import("@/Apps/KPIBuilderApp").then(m => ({ default: m.KPIBuilderApp })));
const WorkflowRPAApp = React.lazy(() => import("@/Apps/WorkflowRPAApp").then(m => ({ default: m.WorkflowRPAApp })));
const FieldOpsApp = React.lazy(() => import("@/Apps/FieldOpsApp").then(m => ({ default: m.FieldOpsApp })));
const CapacityPlannerApp = React.lazy(() => import("@/Apps/CapacityPlannerApp").then(m => ({ default: m.CapacityPlannerApp })));
const OKRStudioApp = React.lazy(() => import("@/Apps/OKRStudioApp").then(m => ({ default: m.OKRStudioApp })));
const OpExDashboardApp = React.lazy(() => import("@/Apps/OpExDashboardApp").then(m => ({ default: m.OpExDashboardApp })));
const SLAManagerApp = React.lazy(() => import("@/Apps/SLAManagerApp").then(m => ({ default: m.SLAManagerApp })));
const OperationsWikiApp = React.lazy(() => import("@/Apps/OperationsWikiApp").then(m => ({ default: m.OperationsWikiApp })));
const ESGReporterApp = React.lazy(() => import("@/Apps/ESGReporterApp").then(m => ({ default: m.ESGReporterApp })));
const CarbonTrackerApp = React.lazy(() => import("@/Apps/CarbonTrackerApp").then(m => ({ default: m.CarbonTrackerApp })));
const SustainabilityPlannerApp = React.lazy(() => import("@/Apps/SustainabilityPlannerApp").then(m => ({ default: m.SustainabilityPlannerApp })));
const CircularEconomyApp = React.lazy(() => import("@/Apps/CircularEconomyApp").then(m => ({ default: m.CircularEconomyApp })));
const RenewableEnergyApp = React.lazy(() => import("@/Apps/RenewableEnergyApp").then(m => ({ default: m.RenewableEnergyApp })));
const SustainableSupplyApp = React.lazy(() => import("@/Apps/SustainableSupplyApp").then(m => ({ default: m.SustainableSupplyApp })));
const GreenBuildingApp = React.lazy(() => import("@/Apps/GreenBuildingApp").then(m => ({ default: m.GreenBuildingApp })));
const WasteTrackerApp = React.lazy(() => import("@/Apps/WasteTrackerApp").then(m => ({ default: m.WasteTrackerApp })));
const WaterStewardshipApp = React.lazy(() => import("@/Apps/WaterStewardshipApp").then(m => ({ default: m.WaterStewardshipApp })));
const BiodiversityApp = React.lazy(() => import("@/Apps/BiodiversityApp").then(m => ({ default: m.BiodiversityApp })));
const SocialImpactApp = React.lazy(() => import("@/Apps/SocialImpactApp").then(m => ({ default: m.SocialImpactApp })));
const GreenFinanceApp = React.lazy(() => import("@/Apps/GreenFinanceApp").then(m => ({ default: m.GreenFinanceApp })));
const LCABuilderApp = React.lazy(() => import("@/Apps/LCABuilderApp").then(m => ({ default: m.LCABuilderApp })));
const ClimateRiskApp = React.lazy(() => import("@/Apps/ClimateRiskApp").then(m => ({ default: m.ClimateRiskApp })));
const SustainabilityReportApp = React.lazy(() => import("@/Apps/SustainabilityReportApp").then(m => ({ default: m.SustainabilityReportApp })));
const SDGAlignmentApp = React.lazy(() => import("@/Apps/SDGAlignmentApp").then(m => ({ default: m.SDGAlignmentApp })));
const CorpSustainabilityApp = React.lazy(() => import("@/Apps/CorpSustainabilityApp").then(m => ({ default: m.CorpSustainabilityApp })));
const EnvironmentalOSApp = React.lazy(() => import("@/Apps/EnvironmentalOSApp").then(m => ({ default: m.EnvironmentalOSApp })));
const NetZeroRoadmapApp = React.lazy(() => import("@/Apps/NetZeroRoadmapApp").then(m => ({ default: m.NetZeroRoadmapApp })));
const GreenProcurementApp = React.lazy(() => import("@/Apps/GreenProcurementApp").then(m => ({ default: m.GreenProcurementApp })));
const TalentAcquisitionApp = React.lazy(() => import("@/Apps/TalentAcquisitionApp").then(m => ({ default: m.TalentAcquisitionApp })));
const EmployeeExperienceApp = React.lazy(() => import("@/Apps/EmployeeExperienceApp").then(m => ({ default: m.EmployeeExperienceApp })));
const PerformanceOSApp = React.lazy(() => import("@/Apps/PerformanceOSApp").then(m => ({ default: m.PerformanceOSApp })));
const LDStudioApp = React.lazy(() => import("@/Apps/LDStudioApp").then(m => ({ default: m.LDStudioApp })));
const CompBenchmarkApp = React.lazy(() => import("@/Apps/CompBenchmarkApp").then(m => ({ default: m.CompBenchmarkApp })));
const WorkforcePlannerApp = React.lazy(() => import("@/Apps/WorkforcePlannerApp").then(m => ({ default: m.WorkforcePlannerApp })));
const DEIStudioApp = React.lazy(() => import("@/Apps/DEIStudioApp").then(m => ({ default: m.DEIStudioApp })));
const OffboardingApp = React.lazy(() => import("@/Apps/OffboardingApp").then(m => ({ default: m.OffboardingApp })));
const HRAnalyticsApp = React.lazy(() => import("@/Apps/HRAnalyticsApp").then(m => ({ default: m.HRAnalyticsApp })));
const EngagementSurveyApp = React.lazy(() => import("@/Apps/EngagementSurveyApp").then(m => ({ default: m.EngagementSurveyApp })));
const SuccessionPlannerApp = React.lazy(() => import("@/Apps/SuccessionPlannerApp").then(m => ({ default: m.SuccessionPlannerApp })));
const HRISDesignerApp = React.lazy(() => import("@/Apps/HRISDesignerApp").then(m => ({ default: m.HRISDesignerApp })));
const RemoteWorkOSApp = React.lazy(() => import("@/Apps/RemoteWorkOSApp").then(m => ({ default: m.RemoteWorkOSApp })));
const OrgDesignApp = React.lazy(() => import("@/Apps/OrgDesignApp").then(m => ({ default: m.OrgDesignApp })));
const EmployerBrandingApp = React.lazy(() => import("@/Apps/EmployerBrandingApp").then(m => ({ default: m.EmployerBrandingApp })));
const HRComplianceApp = React.lazy(() => import("@/Apps/HRComplianceApp").then(m => ({ default: m.HRComplianceApp })));
const WellnessProgramApp = React.lazy(() => import("@/Apps/WellnessProgramApp").then(m => ({ default: m.WellnessProgramApp })));
const TalentPipelineApp = React.lazy(() => import("@/Apps/TalentPipelineApp").then(m => ({ default: m.TalentPipelineApp })));
const OnboardingOSApp = React.lazy(() => import("@/Apps/OnboardingOSApp").then(m => ({ default: m.OnboardingOSApp })));
const PeopleOpsApp = React.lazy(() => import("@/Apps/PeopleOpsApp").then(m => ({ default: m.PeopleOpsApp })));
const LegalResearchApp = React.lazy(() => import("@/Apps/LegalResearchApp").then(m => ({ default: m.LegalResearchApp })));
const ComplianceMappingApp = React.lazy(() => import("@/Apps/ComplianceMappingApp").then(m => ({ default: m.ComplianceMappingApp })));
const LegalRiskApp = React.lazy(() => import("@/Apps/LegalRiskApp").then(m => ({ default: m.LegalRiskApp })));
const IPStrategyApp = React.lazy(() => import("@/Apps/IPStrategyApp").then(m => ({ default: m.IPStrategyApp })));
const LitigationPlannerApp = React.lazy(() => import("@/Apps/LitigationPlannerApp").then(m => ({ default: m.LitigationPlannerApp })));
const CorporateGovernanceApp = React.lazy(() => import("@/Apps/CorporateGovernanceApp").then(m => ({ default: m.CorporateGovernanceApp })));
const LegalTemplateApp = React.lazy(() => import("@/Apps/LegalTemplateApp").then(m => ({ default: m.LegalTemplateApp })));
const DueDiligenceApp = React.lazy(() => import("@/Apps/DueDiligenceApp").then(m => ({ default: m.DueDiligenceApp })));
const PrivacyLawApp = React.lazy(() => import("@/Apps/PrivacyLawApp").then(m => ({ default: m.PrivacyLawApp })));
const LaborLawApp = React.lazy(() => import("@/Apps/LaborLawApp").then(m => ({ default: m.LaborLawApp })));
const TradeComplianceApp = React.lazy(() => import("@/Apps/TradeComplianceApp").then(m => ({ default: m.TradeComplianceApp })));
const RegulatoryFilingApp = React.lazy(() => import("@/Apps/RegulatoryFilingApp").then(m => ({ default: m.RegulatoryFilingApp })));
const LegalAnalyticsApp = React.lazy(() => import("@/Apps/LegalAnalyticsApp").then(m => ({ default: m.LegalAnalyticsApp })));
const ADRStudioApp = React.lazy(() => import("@/Apps/ADRStudioApp").then(m => ({ default: m.ADRStudioApp })));
const ProductDiscoveryApp = React.lazy(() => import("@/Apps/ProductDiscoveryApp").then(m => ({ default: m.ProductDiscoveryApp })));
const UserResearchApp = React.lazy(() => import("@/Apps/UserResearchApp").then(m => ({ default: m.UserResearchApp })));
const JTBDStudioApp = React.lazy(() => import("@/Apps/JTBDStudioApp").then(m => ({ default: m.JTBDStudioApp })));
const RoadmapBuilderApp = React.lazy(() => import("@/Apps/RoadmapBuilderApp").then(m => ({ default: m.RoadmapBuilderApp })));
const FeaturePrioritizerApp = React.lazy(() => import("@/Apps/FeaturePrioritizerApp").then(m => ({ default: m.FeaturePrioritizerApp })));
const UserStoryMapperApp = React.lazy(() => import("@/Apps/UserStoryMapperApp").then(m => ({ default: m.UserStoryMapperApp })));
const DesignSprintApp = React.lazy(() => import("@/Apps/DesignSprintApp").then(m => ({ default: m.DesignSprintApp })));
const PrototypingStudioApp = React.lazy(() => import("@/Apps/PrototypingStudioApp").then(m => ({ default: m.PrototypingStudioApp })));
const UsabilityTestApp = React.lazy(() => import("@/Apps/UsabilityTestApp").then(m => ({ default: m.UsabilityTestApp })));
const ProductMetricsApp = React.lazy(() => import("@/Apps/ProductMetricsApp").then(m => ({ default: m.ProductMetricsApp })));
const CompetitiveProductApp = React.lazy(() => import("@/Apps/CompetitiveProductApp").then(m => ({ default: m.CompetitiveProductApp })));
const LaunchPlannerApp = React.lazy(() => import("@/Apps/LaunchPlannerApp").then(m => ({ default: m.LaunchPlannerApp })));
const FeedbackSystemApp = React.lazy(() => import("@/Apps/FeedbackSystemApp").then(m => ({ default: m.FeedbackSystemApp })));
const DesignSystemBuilderApp = React.lazy(() => import("@/Apps/DesignSystemBuilderApp").then(m => ({ default: m.DesignSystemBuilderApp })));
const ProductCultureApp = React.lazy(() => import("@/Apps/ProductCultureApp").then(m => ({ default: m.ProductCultureApp })));
const PrimaryResearchApp = React.lazy(() => import("@/Apps/PrimaryResearchApp").then(m => ({ default: m.PrimaryResearchApp })));
const MarketSurveyApp = React.lazy(() => import("@/Apps/MarketSurveyApp").then(m => ({ default: m.MarketSurveyApp })));
const CIFrameworkApp = React.lazy(() => import("@/Apps/CIFrameworkApp").then(m => ({ default: m.CIFrameworkApp })));
const InsightSynthesisApp = React.lazy(() => import("@/Apps/InsightSynthesisApp").then(m => ({ default: m.InsightSynthesisApp })));
const ResearchReportApp = React.lazy(() => import("@/Apps/ResearchReportApp").then(m => ({ default: m.ResearchReportApp })));
const DataCollectionApp = React.lazy(() => import("@/Apps/DataCollectionApp").then(m => ({ default: m.DataCollectionApp })));
const HypothesisBuilderApp = React.lazy(() => import("@/Apps/HypothesisBuilderApp").then(m => ({ default: m.HypothesisBuilderApp })));
const ExperimentDesignApp = React.lazy(() => import("@/Apps/ExperimentDesignApp").then(m => ({ default: m.ExperimentDesignApp })));
const StatAnalyticsApp = React.lazy(() => import("@/Apps/StatAnalyticsApp").then(m => ({ default: m.StatAnalyticsApp })));
const EthnographicResearchApp = React.lazy(() => import("@/Apps/EthnographicResearchApp").then(m => ({ default: m.EthnographicResearchApp })));
const ResearchMethodApp = React.lazy(() => import("@/Apps/ResearchMethodApp").then(m => ({ default: m.ResearchMethodApp })));
const KnowledgeBaseApp = React.lazy(() => import("@/Apps/KnowledgeBaseApp").then(m => ({ default: m.KnowledgeBaseApp })));
const TrendsSentinelApp = React.lazy(() => import("@/Apps/TrendsSentinelApp").then(m => ({ default: m.TrendsSentinelApp })));
const APIPlaygroundApp = React.lazy(() => import("@/Apps/APIPlaygroundApp").then(m => ({ default: m.APIPlaygroundApp })));
const DatabaseStudioApp = React.lazy(() => import("@/Apps/DatabaseStudioApp").then(m => ({ default: m.DatabaseStudioApp })));
const IntegrationBuilderApp = React.lazy(() => import("@/Apps/IntegrationBuilderApp").then(m => ({ default: m.IntegrationBuilderApp })));
const WebhookManagerApp = React.lazy(() => import("@/Apps/WebhookManagerApp").then(m => ({ default: m.WebhookManagerApp })));
const DataPipelineApp = React.lazy(() => import("@/Apps/DataPipelineApp").then(m => ({ default: m.DataPipelineApp })));
const EventStreamApp = React.lazy(() => import("@/Apps/EventStreamApp").then(m => ({ default: m.EventStreamApp })));
const NotificationBuilderApp = React.lazy(() => import("@/Apps/NotificationBuilderApp").then(m => ({ default: m.NotificationBuilderApp })));
const WorkspaceOSApp = React.lazy(() => import("@/Apps/WorkspaceOSApp").then(m => ({ default: m.WorkspaceOSApp })));
const SearchStudioApp = React.lazy(() => import("@/Apps/SearchStudioApp").then(m => ({ default: m.SearchStudioApp })));
const AIAgentBuilderApp = React.lazy(() => import("@/Apps/AIAgentBuilderApp").then(m => ({ default: m.AIAgentBuilderApp })));
const PluginManagerApp = React.lazy(() => import("@/Apps/PluginManagerApp").then(m => ({ default: m.PluginManagerApp })));
const ExtensionStoreApp = React.lazy(() => import("@/Apps/ExtensionStoreApp").then(m => ({ default: m.ExtensionStoreApp })));
const WidgetBuilderApp = React.lazy(() => import("@/Apps/WidgetBuilderApp").then(m => ({ default: m.WidgetBuilderApp })));
const DashboardBuilderApp = React.lazy(() => import("@/Apps/DashboardBuilderApp").then(m => ({ default: m.DashboardBuilderApp })));
const ReportingStudioApp = React.lazy(() => import("@/Apps/ReportingStudioApp").then(m => ({ default: m.ReportingStudioApp })));
const AutomationCenterApp = React.lazy(() => import("@/Apps/AutomationCenterApp").then(m => ({ default: m.AutomationCenterApp })));
const WorkflowBuilderApp = React.lazy(() => import("@/Apps/WorkflowBuilderApp").then(m => ({ default: m.WorkflowBuilderApp })));
const TriggerManagerApp = React.lazy(() => import("@/Apps/TriggerManagerApp").then(m => ({ default: m.TriggerManagerApp })));
const SchedulerApp = React.lazy(() => import("@/Apps/SchedulerApp").then(m => ({ default: m.SchedulerApp })));
const JobManagerApp = React.lazy(() => import("@/Apps/JobManagerApp").then(m => ({ default: m.JobManagerApp })));
const BatchProcessorApp = React.lazy(() => import("@/Apps/BatchProcessorApp").then(m => ({ default: m.BatchProcessorApp })));
const DataTransformerApp = React.lazy(() => import("@/Apps/DataTransformerApp").then(m => ({ default: m.DataTransformerApp })));
const MappingStudioApp = React.lazy(() => import("@/Apps/MappingStudioApp").then(m => ({ default: m.MappingStudioApp })));
const HealthOSApp      = React.lazy(() => import("@/projects/HealthOSApp").then(m => ({ default: m.HealthOSApp })));
const LegalPMApp       = React.lazy(() => import("@/projects/LegalPMApp").then(m => ({ default: m.LegalPMApp })));
const StaffingOSApp    = React.lazy(() => import("@/projects/StaffingOSApp").then(m => ({ default: m.StaffingOSApp })));
const AdsHubApp           = React.lazy(() => import("@/Apps/AdsHubApp"));
const AdsOrchestratorApp  = React.lazy(() => import("@/Apps/AdsOrchestratorApp"));
const ReferralApp          = React.lazy(() => import("@/Apps/ReferralApp"));
const GrowthEngineApp      = React.lazy(() => import("@/Apps/GrowthEngineApp"));
const NPASettingsApp       = React.lazy(() => import("@/Apps/NPASettingsApp"));
const SelfHostApp          = React.lazy(() => import("@/Apps/SelfHostApp"));
const HandleProtocolApp    = React.lazy(() => import("@/Apps/HandleProtocolApp"));
const PlatformReportApp    = React.lazy(() => import("@/Apps/PlatformReportApp"));
const AuthLabApp       = React.lazy(() => import("@/Apps/AuthLabApp"));
const PayGateApp       = React.lazy(() => import("@/Apps/PayGateApp"));
const InventionLayerApp    = React.lazy(() => import("@/Apps/InventionLayerApp"));
const PercentageEngineApp      = React.lazy(() => import("@/Apps/PercentageEngineApp"));
const ActivationCommandApp     = React.lazy(() => import("@/Apps/ActivationCommandApp"));
const CredentialsHubApp        = React.lazy(() => import("@/Apps/CredentialsHubApp"));
const SchemaBuilderApp = React.lazy(() => import("@/Apps/SchemaBuilderApp").then(m => ({ default: m.SchemaBuilderApp })));
// ── Domain Gap Engines ────────────────────────────────────────────────────────
const DomainHubApp         = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainHubApp })));
const DomainCRMApp         = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainCRMApp })));
const DomainLedgerApp      = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainLedgerApp })));
const DomainOrdersApp      = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainOrdersApp })));
const DomainCasesApp       = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainCasesApp })));
const DomainContentApp     = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainContentApp })));
const DomainKPIApp         = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainKPIApp })));
const DomainAgreementsApp  = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainAgreementsApp })));
const DomainGrowthPathApp  = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainGrowthPathApp })));
const DomainAssetsApp      = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainAssetsApp })));
const DomainEngagementApp  = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainEngagementApp })));
const DomainValueExchangeApp = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainValueExchangeApp })));
const DomainRiskCoverageApp  = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainRiskCoverageApp })));
const DomainPropertyFlowApp  = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainPropertyFlowApp })));
const DomainWorkforceApp     = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainWorkforceApp })));
const DomainPerfReviewApp    = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainPerfReviewApp })));
const DomainCampaignsApp     = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainCampaignsApp })));
const DomainRegulatoryApp    = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainRegulatoryApp })));
const DomainFiscalApp        = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainFiscalApp })));
const DomainRecurringApp     = React.lazy(() => import("@/Apps/DomainAppsBundle").then(m => ({ default: m.DomainRecurringApp })));
// Extended Domain Engine Suite v2.0
const ProjectsCmdApp    = React.lazy(() => import("@/Apps/DomainAppsBundle2").then(m => ({ default: m.ProjectsCmdApp })));
const PartnerNetApp     = React.lazy(() => import("@/Apps/DomainAppsBundle2").then(m => ({ default: m.PartnerNetApp })));
const EventBookingApp   = React.lazy(() => import("@/Apps/DomainAppsBundle2").then(m => ({ default: m.EventBookingApp })));
const EducationHubApp   = React.lazy(() => import("@/Apps/DomainAppsBundle2").then(m => ({ default: m.EducationHubApp })));
const SocialCmdApp      = React.lazy(() => import("@/Apps/DomainAppsBundle2").then(m => ({ default: m.SocialCmdApp })));
const SupplyChainOpsApp = React.lazy(() => import("@/Apps/DomainAppsBundle2").then(m => ({ default: m.SupplyChainOpsApp })));
const FranchiseOpsApp   = React.lazy(() => import("@/Apps/DomainAppsBundle2").then(m => ({ default: m.FranchiseOpsApp })));
const BrandVaultApp     = React.lazy(() => import("@/Apps/DomainAppsBundle2").then(m => ({ default: m.BrandVaultApp })));
const RevenueIntelApp   = React.lazy(() => import("@/Apps/DomainAppsBundle2").then(m => ({ default: m.RevenueIntelApp })));
const AIStrategyApp     = React.lazy(() => import("@/Apps/DomainAppsBundle2").then(m => ({ default: m.AIStrategyApp })));
const DistributionHubApp = React.lazy(() => import("@/Apps/DistributionHub"));
const ConfigManagerApp      = React.lazy(() => import("@/Apps/ConfigManagerApp").then(m => ({ default: m.ConfigManagerApp })));
// ── Evolutionary Intelligence Systems ────────────────────────────────────────
const IntelligenceOracleApp   = React.lazy(() => import("@/Apps/IntelligenceOracleApp").then(m => ({ default: m.IntelligenceOracleApp })));
const TemporalAnalyticsApp    = React.lazy(() => import("@/Apps/TemporalAnalyticsApp").then(m => ({ default: m.TemporalAnalyticsApp })));
const PlatformDNAApp          = React.lazy(() => import("@/Apps/PlatformDNAApp").then(m => ({ default: m.PlatformDNAApp })));
const FeatureFlagsApp         = React.lazy(() => import("@/Apps/FeatureFlagsApp").then(m => ({ default: m.FeatureFlagsApp })));
const CrossDomainInsightsApp  = React.lazy(() => import("@/Apps/CrossDomainInsightsApp").then(m => ({ default: m.CrossDomainInsightsApp })));
const PlatformEvolutionTrackerApp = React.lazy(() => import("@/Apps/PlatformEvolutionTrackerApp").then(m => ({ default: m.PlatformEvolutionTrackerApp })));

// ── Industry Elevation Suite — 13 sectors ────────────────────────────────────
const FleetLogisticsApp  = React.lazy(() => import("@/Apps/FleetLogisticsApp"));
const RetailEngineApp    = React.lazy(() => import("@/Apps/RetailEngineApp"));
const ManufacturingApp   = React.lazy(() => import("@/Apps/ManufacturingApp"));
const HospitalityApp     = React.lazy(() => import("@/Apps/HospitalityApp"));
const EnergyApp          = React.lazy(() => import("@/Apps/EnergyApp"));
const RealEstateApp      = React.lazy(() => import("@/Apps/RealEstateApp"));
const TransportationApp  = React.lazy(() => import("@/Apps/TransportationApp"));
const NonprofitApp       = React.lazy(() => import("@/Apps/NonprofitApp"));
const ConstructionApp    = React.lazy(() => import("@/Apps/ConstructionApp"));
const GovernmentApp      = React.lazy(() => import("@/Apps/GovernmentApp"));
const HomeServicesApp    = React.lazy(() => import("@/Apps/HomeServicesApp"));
const InsuranceApp       = React.lazy(() => import("@/Apps/InsuranceApp"));
const AgricultureApp     = React.lazy(() => import("@/Apps/AgricultureApp"));

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
  commandcenter:  CommandCenterApp,
  researchhub:    ResearchHubApp,
  learningcenter: LearningCenterApp,
  personastudio:  PersonaStudioApp,
  datastudio:     DataStudioApp,
  pricingstudio:  PricingStudioApp,
  traction:       TractionDashboardApp,
  opportunity:    OpportunityApp,
  leadCycle:      LeadCycleApp,
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
  // Enterprise Suite
  zeroTrust: ZeroTrustApp,
  threatModel: ThreatModelApp,
  socDashboard: SOCDashboardApp,
  penTestPlan: PenTestPlanApp,
  incidentResponse: IncidentResponseApp,
  iamStudio: IAMStudioApp,
  encryptionPlanner: EncryptionPlannerApp,
  vulnScanner: VulnScannerApp,
  securityAuditStudio: SecurityAuditStudioApp,
  cloudSecurity: CloudSecurityApp,
  networkDefense: NetworkDefenseApp,
  appSecurity: AppSecurityApp,
  endpointSecurity: EndpointSecurityApp,
  secureSDLC: SecureSDLCApp,
  privacyByDesign: PrivacyByDesignApp,
  cyberResilience: CyberResilienceApp,
  redTeamPlanner: RedTeamPlannerApp,
  securityPosture: SecurityPostureApp,
  cveTracker: CveTrackerApp,
  securityPolicy: SecurityPolicyApp,
  financialModeler: FinancialModelerApp,
  revenueRecognition: RevenueRecognitionApp,
  cashFlowPlanner: CashFlowPlannerApp,
  investmentThesis: InvestmentThesisApp,
  fundraisingStudio: FundraisingStudioApp,
  taxStrategy: TaxStrategyApp,
  equityPlanner: EquityPlannerApp,
  unitEconomics: UnitEconomicsApp,
  auditPrep: AuditPrepApp,
  budgetBuilder: BudgetBuilderApp,
  maAnalyzer: MAAnalyzerApp,
  ipoReadiness: IPOReadinessApp,
  grantWriter: GrantWriterApp,
  cryptoTokenomics: CryptoTokenomicsApp,
  insurancePlanner: InsurancePlannerApp,
  debtStructure: DebtStructureApp,
  fpaDashboard: FPADashboardApp,
  treasuryManager: TreasuryManagerApp,
  financeReport: FinanceReportApp,
  capTable: CapTableApp,
  ehrIntegration: EHRIntegrationApp,
  clinicalWorkflow: ClinicalWorkflowApp,
  patientEngagement: PatientEngagementApp,
  healthcareCompliance: HealthcareComplianceApp,
  telehealthBuilder: TelehealthBuilderApp,
  clinicalTrial: ClinicalTrialApp,
  medicalCoding: MedicalCodingApp,
  healthAnalytics: HealthAnalyticsApp,
  careCoordination: CareCoordinationApp,
  healthcareAPI: HealthcareAPIApp,
  mentalHealthPlatform: MentalHealthPlatformApp,
  homeHealthOS: HomeHealthOSApp,
  pharmacyOS: PharmacyOSApp,
  medicalDevice: MedicalDeviceApp,
  healthDataGovernance: HealthDataGovernanceApp,
  clinicalDecision: ClinicalDecisionApp,
  healthBilling: HealthBillingApp,
  populationHealth: PopulationHealthApp,
  hipaaDashboard: HIPAADashboardApp,
  fhirBuilder: FHIRBuilderApp,
  learningPathBuilder: LearningPathBuilderApp,
  assessmentBuilder: AssessmentBuilderApp,
  studentEngagement: StudentEngagementApp,
  lmsBuilder: LMSBuilderApp,
  edTechStack: EdTechStackApp,
  eduAccessibility: EduAccessibilityApp,
  instructionalDesign: InstructionalDesignApp,
  microlearningStudio: MicrolearningStudioApp,
  gameLearning: GameLearningApp,
  virtualClassroom: VirtualClassroomApp,
  credentialBuilder: CredentialBuilderApp,
  adaptiveLearning: AdaptiveLearningApp,
  parentPortal: ParentPortalApp,
  teacherToolbox: TeacherToolboxApp,
  k12Platform: K12PlatformApp,
  higherEduOS: HigherEduOSApp,
  continuingEdu: ContinuingEduApp,
  schoolAnalytics: SchoolAnalyticsApp,
  eduMarketplace: EduMarketplaceApp,
  supplyChainOS: SupplyChainOSApp,
  inventoryOS: InventoryOSApp,
  qualityManagement: QualityManagementApp,
  facilitiesOS: FacilitiesOSApp,
  processMiner: ProcessMinerApp,
  logisticsOS: LogisticsOSApp,
  procurementOS: ProcurementOSApp,
  vendorOS: VendorOSApp,
  opsAnalytics: OpsAnalyticsApp,
  leanSigma: LeanSigmaApp,
  changeManagement: ChangeManagementApp,
  bcpBuilder: BCPBuilderApp,
  kpiBuilder: KPIBuilderApp,
  workflowRPA: WorkflowRPAApp,
  fieldOps: FieldOpsApp,
  capacityPlanner: CapacityPlannerApp,
  okrStudio: OKRStudioApp,
  opExDashboard: OpExDashboardApp,
  slaManager: SLAManagerApp,
  operationsWiki: OperationsWikiApp,
  esgReporter: ESGReporterApp,
  carbonTracker: CarbonTrackerApp,
  sustainabilityPlanner: SustainabilityPlannerApp,
  circularEconomy: CircularEconomyApp,
  renewableEnergy: RenewableEnergyApp,
  sustainableSupply: SustainableSupplyApp,
  greenBuilding: GreenBuildingApp,
  wasteTracker: WasteTrackerApp,
  waterStewardship: WaterStewardshipApp,
  biodiversity: BiodiversityApp,
  socialImpact: SocialImpactApp,
  greenFinance: GreenFinanceApp,
  lcaBuilder: LCABuilderApp,
  climateRisk: ClimateRiskApp,
  sustainabilityReport: SustainabilityReportApp,
  sdgAlignment: SDGAlignmentApp,
  corpSustainability: CorpSustainabilityApp,
  environmentalOS: EnvironmentalOSApp,
  netZeroRoadmap: NetZeroRoadmapApp,
  greenProcurement: GreenProcurementApp,
  talentAcquisition: TalentAcquisitionApp,
  employeeExperience: EmployeeExperienceApp,
  performanceOS: PerformanceOSApp,
  ldStudio: LDStudioApp,
  compBenchmark: CompBenchmarkApp,
  workforcePlanner: WorkforcePlannerApp,
  deiStudio: DEIStudioApp,
  offboarding: OffboardingApp,
  hrAnalytics: HRAnalyticsApp,
  engagementSurvey: EngagementSurveyApp,
  successionPlanner: SuccessionPlannerApp,
  hrisDesigner: HRISDesignerApp,
  remoteWorkOS: RemoteWorkOSApp,
  orgDesign: OrgDesignApp,
  employerBranding: EmployerBrandingApp,
  hrCompliance: HRComplianceApp,
  wellnessProgram: WellnessProgramApp,
  talentPipeline: TalentPipelineApp,
  onboardingOS: OnboardingOSApp,
  peopleOps: PeopleOpsApp,
  legalResearch: LegalResearchApp,
  complianceMapping: ComplianceMappingApp,
  legalRisk: LegalRiskApp,
  ipStrategy: IPStrategyApp,
  litigationPlanner: LitigationPlannerApp,
  corporateGovernance: CorporateGovernanceApp,
  legalTemplate: LegalTemplateApp,
  dueDiligence: DueDiligenceApp,
  privacyLaw: PrivacyLawApp,
  laborLaw: LaborLawApp,
  tradeCompliance: TradeComplianceApp,
  regulatoryFiling: RegulatoryFilingApp,
  legalAnalytics: LegalAnalyticsApp,
  adrStudio: ADRStudioApp,
  productDiscovery: ProductDiscoveryApp,
  userResearch: UserResearchApp,
  jtbdStudio: JTBDStudioApp,
  roadmapBuilder: RoadmapBuilderApp,
  featurePrioritizer: FeaturePrioritizerApp,
  userStoryMapper: UserStoryMapperApp,
  designSprint: DesignSprintApp,
  prototypingStudio: PrototypingStudioApp,
  usabilityTest: UsabilityTestApp,
  productMetrics: ProductMetricsApp,
  competitiveProduct: CompetitiveProductApp,
  launchPlanner: LaunchPlannerApp,
  feedbackSystem: FeedbackSystemApp,
  designSystemBuilder: DesignSystemBuilderApp,
  productCulture: ProductCultureApp,
  primaryResearch: PrimaryResearchApp,
  marketSurvey: MarketSurveyApp,
  ciFramework: CIFrameworkApp,
  insightSynthesis: InsightSynthesisApp,
  researchReport: ResearchReportApp,
  dataCollection: DataCollectionApp,
  hypothesisBuilder: HypothesisBuilderApp,
  experimentDesign: ExperimentDesignApp,
  statAnalytics: StatAnalyticsApp,
  ethnographicResearch: EthnographicResearchApp,
  researchMethod: ResearchMethodApp,
  knowledgeBase: KnowledgeBaseApp,
  trendsSentinel: TrendsSentinelApp,
  apiPlayground: APIPlaygroundApp,
  databaseStudio: DatabaseStudioApp,
  integrationBuilder: IntegrationBuilderApp,
  webhookManager: WebhookManagerApp,
  dataPipeline: DataPipelineApp,
  eventStream: EventStreamApp,
  notificationBuilder: NotificationBuilderApp,
  workspaceOS: WorkspaceOSApp,
  searchStudio: SearchStudioApp,
  aiAgentBuilder: AIAgentBuilderApp,
  pluginManager: PluginManagerApp,
  extensionStore: ExtensionStoreApp,
  widgetBuilder: WidgetBuilderApp,
  dashboardBuilder: DashboardBuilderApp,
  reportingStudio: ReportingStudioApp,
  automationCenter: AutomationCenterApp,
  workflowBuilder: WorkflowBuilderApp,
  triggerManager: TriggerManagerApp,
  scheduler: SchedulerApp,
  jobManager: JobManagerApp,
  batchProcessor: BatchProcessorApp,
  dataTransformer: DataTransformerApp,
  mappingStudio: MappingStudioApp,
  schemaBuilder: SchemaBuilderApp,
  configManager:      ConfigManagerApp,
  // Evolutionary Intelligence Systems
  intelligenceOracle:  IntelligenceOracleApp,
  temporalAnalytics:   TemporalAnalyticsApp,
  platformDNA:         PlatformDNAApp,
  featureFlags:        FeatureFlagsApp,
  crossDomainInsights: CrossDomainInsightsApp,
  evolutionTracker:    PlatformEvolutionTrackerApp,
  // Platform
  ucpx:                   UCPXAgentApp,
  universalDemo:          UniversalDemoApp,
  genericEngine:          GenericEngineWrapperApp,
  metricsPanel:           MetricsPanelApp,
  integrationDashboard:   IntegrationDashboard,
  builder:                BuilderSpaceApp,
  identityManager:        IdentityManagerApp,
  createaiDashboard:      CreateAIDashboardApp,
  infiniteBrainControl:  InfiniteBrainControlPanel,
  infiniteBrainPortal:   InfiniteBrainPortalFull,
  infiniteBrainDashboard: InfiniteBrainDashboard,
  // ── Industry OS ──────────────────────────────────────────────────────────
  healthos:       HealthOSApp,
  legalpm:        LegalPMApp,
  staffingos:     StaffingOSApp,
  // ── New Platform Capabilities ─────────────────────────────────────────────
  adshub:          AdsHubApp,
  adsOrchestrator: AdsOrchestratorApp,
  referral:        ReferralApp,
  growthEngine:    GrowthEngineApp,
  npaSettings:     NPASettingsApp,
  selfHost:        SelfHostApp,
  handleProtocol:  HandleProtocolApp,
  platformReport:  PlatformReportApp,
  authlab:        AuthLabApp,
  paygate:        PayGateApp,
  inventionLayer:    InventionLayerApp,
  percentageEngine:  PercentageEngineApp,
  activation:        ActivationCommandApp,
  credentialsHub:    CredentialsHubApp,
  // ── Domain Gap Engines ────────────────────────────────────────────────────
  domainHub:          DomainHubApp,
  domainCRM:          DomainCRMApp,
  domainLedger:       DomainLedgerApp,
  domainOrders:       DomainOrdersApp,
  domainCases:        DomainCasesApp,
  domainContent:      DomainContentApp,
  domainKPI:          DomainKPIApp,
  domainAgreements:   DomainAgreementsApp,
  domainGrowthPath:   DomainGrowthPathApp,
  domainAssets:       DomainAssetsApp,
  domainEngagement:   DomainEngagementApp,
  domainValueExchange: DomainValueExchangeApp,
  domainRiskCoverage:  DomainRiskCoverageApp,
  domainPropertyFlow:  DomainPropertyFlowApp,
  domainWorkforce:     DomainWorkforceApp,
  domainPerfReview:    DomainPerfReviewApp,
  domainCampaigns:     DomainCampaignsApp,
  domainRegulatory:    DomainRegulatoryApp,
  domainFiscal:        DomainFiscalApp,
  domainRecurring:     DomainRecurringApp,
  // Extended Domain Engine Suite v2.0
  projectsCmd:    ProjectsCmdApp,
  partnerNet:     PartnerNetApp,
  eventBooking:   EventBookingApp,
  educationHub:   EducationHubApp,
  socialCmd:      SocialCmdApp,
  supplyChainOps: SupplyChainOpsApp,
  franchiseOps:   FranchiseOpsApp,
  brandVault:     BrandVaultApp,
  revenueIntel:   RevenueIntelApp,
  aiStrategy:     AIStrategyApp,
  distributionHub: DistributionHubApp,
  // ── Industry Elevation Suite — 13 sectors at 100% ────────────────────────
  fleetLogistics:  FleetLogisticsApp,
  retailEngine:    RetailEngineApp,
  manufacturing:   ManufacturingApp,
  hospitality:     HospitalityApp,
  energyMgmt:      EnergyApp,
  realEstate:      RealEstateApp,
  transportation:  TransportationApp,
  nonprofit:       NonprofitApp,
  construction:    ConstructionApp,
  government:      GovernmentApp,
  homeServices:    HomeServicesApp,
  insuranceMgmt:   InsuranceApp,
  agriculture:     AgricultureApp,
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

      {/* ── Related apps bar ── */}
      <RelatedAppsBar currentId={activeApp} category={appDef?.category} />

      {/* ── Contextual ad strip (non-ad/orchestrator apps only) ── */}
      {activeApp !== "adshub" && activeApp !== "adsOrchestrator" && (
        <InternalAdBanner placement="all" compact />
      )}

      {/* ── App content with Suspense boundary ── */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain min-w-0"
        style={{ background: "hsl(220,20%,97%)" }}
      >
        <ErrorBoundary appName={label}>
          <Suspense fallback={<AppSkeleton />}>
            {AppComponent ? (
              <AppComponent />
            ) : (
              <UniversalApp />
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
