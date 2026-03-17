// ═══════════════════════════════════════════════════════════════════════════
// NARRATOR ENGINE — NarratorOS Frontend Intelligence Layer
// 13 cinematic/narrative engines + 5 series. Fictional, safe, family-friendly.
// ═══════════════════════════════════════════════════════════════════════════

export interface NarratorEngineDefinition {
  id: string; name: string; icon: string; color: string; gradient: string;
  tagline: string; description: string; placeholder: string; example: string; series?: string;
}

export const NARRATOR_ENGINES: NarratorEngineDefinition[] = [
  { id: "SceneEngine", name: "Scene Engine", icon: "🎬", color: "#e11d48", gradient: "linear-gradient(135deg, #e11d48, #be123c)", tagline: "Scene Architect", description: "Designs fully realized cinematic scenes with location, lighting, action, subtext, and emotional register.", placeholder: "What scene should I design?", example: "e.g. The moment a general surrenders her sword to someone she once saved, in a throne room full of enemies who expect her to fight", series: "screenplay" },
  { id: "DialogueEngine", name: "Dialogue Engine", icon: "💬", color: "#7c3aed", gradient: "linear-gradient(135deg, #7c3aed, #6d28d9)", tagline: "Dialogue Architect", description: "Writes character dialogue with subtext, rhythm, contradiction, and voice — each line doing double work.", placeholder: "What conversation should I write?", example: "e.g. Two estranged siblings meeting at their parent's funeral who cannot say what they actually mean to each other", series: "screenplay" },
  { id: "ActStructureEngine", name: "Act Structure Engine", icon: "📐", color: "#0369a1", gradient: "linear-gradient(135deg, #0369a1, #0284c7)", tagline: "Structure Architect", description: "Designs three and five-act story structures with beats, turning points, midpoints, and emotional escalations.", placeholder: "What story structure should I design?", example: "e.g. A five-act tragedy about a reformer who becomes the thing they were trying to fix", series: "screenplay" },
  { id: "ConflictEngine", name: "Conflict Engine", icon: "⚔️", color: "#dc2626", gradient: "linear-gradient(135deg, #dc2626, #b91c1c)", tagline: "Conflict Architect", description: "Designs layered conflict structures — internal, interpersonal, societal, and cosmic — and how they escalate.", placeholder: "What conflict should I design?", example: "e.g. A conflict where both sides are right and both sides are wrong in ways they cannot see about themselves", series: "drama" },
  { id: "ThemeEngine", name: "Theme Engine", icon: "🌊", color: "#0f766e", gradient: "linear-gradient(135deg, #0f766e, #0d9488)", tagline: "Theme Architect", description: "Builds thematic layers — the surface story, the real question, the argument the narrative makes, and how it is proven.", placeholder: "What theme should I explore?", example: "e.g. A story that seems to be about ambition but is actually about the fear of being truly known", series: "drama" },
  { id: "ArcEngine", name: "Arc Engine", icon: "🌙", color: "#7e22ce", gradient: "linear-gradient(135deg, #7e22ce, #9333ea)", tagline: "Arc Architect", description: "Designs complete character arcs — belief, wound, ghost, want, need, transformation, and final statement.", placeholder: "What character arc should I design?", example: "e.g. A healer who believes strength means never needing help, whose arc forces them to let someone save them", series: "drama" },
  { id: "NarrativeVoiceEngine", name: "Narrative Voice Engine", icon: "🎙️", color: "#ca8a04", gradient: "linear-gradient(135deg, #ca8a04, #b45309)", tagline: "Voice Architect", description: "Designs narrative POV and voice — tense, distance, reliability, personality, and what the narrator knows or hides.", placeholder: "What narrative voice should I design?", example: "e.g. An unreliable first-person narrator who is slowly realizing, mid-telling, that they were the villain of the story", series: "voice" },
  { id: "MonologueEngine", name: "Monologue Engine", icon: "🎭", color: "#be185d", gradient: "linear-gradient(135deg, #be185d, #db2777)", tagline: "Monologue Architect", description: "Writes powerful internal and external monologues — the character says what they cannot say any other way.", placeholder: "What monologue should I write?", example: "e.g. A queen's private confession to a mirror, the night before she makes the decision that will destroy everything she built", series: "voice" },
  { id: "SubplotEngine", name: "Subplot Engine", icon: "🔀", color: "#16a34a", gradient: "linear-gradient(135deg, #16a34a, #15803d)", tagline: "Subplot Architect", description: "Designs subplot structures that mirror, contrast, and complicate the main plot without competing with it.", placeholder: "What subplot should I design?", example: "e.g. A romance subplot that shows the protagonist everything they're sacrificing for their mission", series: "voice" },
  { id: "EnsembleDynamicsEngine", name: "Ensemble Dynamics Engine", icon: "👥", color: "#1d4ed8", gradient: "linear-gradient(135deg, #1d4ed8, #1e40af)", tagline: "Ensemble Architect", description: "Designs group character dynamics — alliances, rivalries, roles, power shifts, and how the ensemble evolves.", placeholder: "What ensemble dynamic should I design?", example: "e.g. A team of six where the one person everyone trusts is secretly making decisions for reasons no one understands", series: "ensemble" },
  { id: "OpeningEngine", name: "Opening Engine", icon: "🚀", color: "#0891b2", gradient: "linear-gradient(135deg, #0891b2, #0e7490)", tagline: "Opening Architect", description: "Designs story openings — the first image, first line, first scene, and the promise the story makes to the reader.", placeholder: "What opening should I design?", example: "e.g. A story that opens at the end, with a character who has already lost everything, explaining why they would do it all again", series: "ensemble" },
  { id: "EndingEngine", name: "Ending Engine", icon: "🌅", color: "#d97706", gradient: "linear-gradient(135deg, #d97706, #b45309)", tagline: "Ending Architect", description: "Designs story endings — resolution, the final image, what is left unanswered, and what the ending proves.", placeholder: "What ending should I design?", example: "e.g. An ending that gives the character exactly what they wanted and shows, gently, that it is not what they needed", series: "ensemble" },
  { id: "PlotTwistEngine", name: "Plot Twist Engine", icon: "🌀", color: "#6b7280", gradient: "linear-gradient(135deg, #6b7280, #4b5563)", tagline: "Twist Architect", description: "Designs earned plot twists — reversals and revelations that recontextualize everything while feeling inevitable in hindsight.", placeholder: "What plot twist should I design?", example: "e.g. A twist where the villain and hero were working toward the same goal from opposite sides, neither knowing about the other", series: "drama" },
];

export interface NarratorSeriesDefinition {
  id: string; name: string; symbol: string; icon: string; gradient: string; description: string; engines: string[]; estimatedMinutes: number;
}

export const NARRATOR_SERIES: NarratorSeriesDefinition[] = [
  { id: "screenplay", name: "SCREENPLAY-Series", symbol: "SC", icon: "🎬", gradient: "linear-gradient(135deg, #e11d48, #7c3aed, #0369a1)", description: "Cinematic Trifecta — Scene, Dialogue, and Act Structure combined into a complete screenplay blueprint.", engines: ["SceneEngine", "DialogueEngine", "ActStructureEngine"], estimatedMinutes: 3 },
  { id: "drama", name: "DRAMA-Series", symbol: "DR", icon: "⚔️", gradient: "linear-gradient(135deg, #dc2626, #0f766e, #6b7280)", description: "Dramatic Trifecta — Conflict, Theme, Arc, and Twist layered into a story with real dramatic weight.", engines: ["ConflictEngine", "ThemeEngine", "ArcEngine"], estimatedMinutes: 3 },
  { id: "voice", name: "VOICE-Series", symbol: "VO", icon: "🎙️", gradient: "linear-gradient(135deg, #ca8a04, #be185d, #16a34a)", description: "Voice Trifecta — Narrative Voice, Monologue, and Subplot — the interior life of the story.", engines: ["NarrativeVoiceEngine", "MonologueEngine", "SubplotEngine"], estimatedMinutes: 3 },
  { id: "ensemble", name: "ENSEMBLE-Series", symbol: "EN", icon: "👥", gradient: "linear-gradient(135deg, #1d4ed8, #0891b2, #d97706)", description: "Story Frame Trifecta — Ensemble Dynamics, Opening, and Ending — the container the story lives in.", engines: ["EnsembleDynamicsEngine", "OpeningEngine", "EndingEngine"], estimatedMinutes: 3 },
  { id: "fullstory", name: "FULLSTORY-Series", symbol: "FS", icon: "📖", gradient: "linear-gradient(135deg, #e11d48, #7c3aed, #0f766e)", description: "Complete Story Trifecta — Act Structure, Arc, and Theme — the skeleton, soul, and argument of a full narrative.", engines: ["ActStructureEngine", "ArcEngine", "ThemeEngine"], estimatedMinutes: 3 },
];

export function getNarratorEngineById(id: string): NarratorEngineDefinition | undefined { return NARRATOR_ENGINES.find(e => e.id === id); }
export function getNarratorEngineColor(id: string): string { return getNarratorEngineById(id)?.color ?? "#e11d48"; }
export function getNarratorEngineIcon(id: string): string { return getNarratorEngineById(id)?.icon ?? "🎬"; }

export async function runNarratorEngine(opts: { engineId: string; engineName: string; topic: string; context?: string; onChunk: (t: string) => void; onDone?: () => void; onError?: (e: string) => void; }): Promise<void> {
  const { engineId, engineName, topic, context, onChunk, onDone, onError } = opts;
  try {
    const resp = await fetch("/api/openai/engine-run", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ engineId, engineName, topic, context }) });
    if (!resp.ok || !resp.body) { onError?.(`Engine returned ${resp.status}`); return; }
    const reader = resp.body.getReader(); const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      for (const line of decoder.decode(value).split("\n")) {
        if (!line.startsWith("data:")) continue;
        try { const p = JSON.parse(line.slice(5).trim()) as { content?: string; done?: boolean }; if (p.content) onChunk(p.content); if (p.done) onDone?.(); } catch { /* skip */ }
      }
    }
  } catch (err) { onError?.(String(err)); }
}

export async function runNarratorSeries(opts: { seriesId: string; topic: string; context?: string; onSectionStart: (id: string, i: number) => void; onChunk: (t: string) => void; onSectionEnd: (id: string) => void; onDone?: () => void; onError?: (e: string) => void; }): Promise<void> {
  const { seriesId, topic, context, onSectionStart, onChunk, onSectionEnd, onDone, onError } = opts;
  try {
    const resp = await fetch("/api/openai/series-run", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seriesId, topic, context }) });
    if (!resp.ok || !resp.body) { onError?.(`Series returned ${resp.status}`); return; }
    const reader = resp.body.getReader(); const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      for (const line of decoder.decode(value).split("\n")) {
        if (!line.startsWith("data:")) continue;
        try { const p = JSON.parse(line.slice(5).trim()) as { type?: string; content?: string; engineId?: string; sectionIndex?: number; done?: boolean }; if (p.type === "section-start" && p.engineId) onSectionStart(p.engineId, p.sectionIndex ?? 0); if (p.content) onChunk(p.content); if (p.type === "section-end" && p.engineId) onSectionEnd(p.engineId); if (p.done) onDone?.(); } catch { /* skip */ }
      }
    }
  } catch (err) { onError?.(String(err)); }
}
