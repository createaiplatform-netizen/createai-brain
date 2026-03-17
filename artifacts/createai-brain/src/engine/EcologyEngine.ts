// ═══════════════════════════════════════════════════════════════════════════
// ECOLOGY ENGINE — EcologyForge Frontend Intelligence Layer
// 13 ecological world-building engines + 5 series. Fictional, safe, family-friendly.
// ═══════════════════════════════════════════════════════════════════════════

export interface EcologyEngineDefinition {
  id: string; name: string; icon: string; color: string; gradient: string;
  tagline: string; description: string; placeholder: string; example: string; series?: string;
}

export const ECOLOGY_ENGINES: EcologyEngineDefinition[] = [
  { id: "BiomeEngine", name: "Biome Engine", icon: "🌿", color: "#15803d", gradient: "linear-gradient(135deg, #15803d, #16a34a)", tagline: "Biome Architect", description: "Designs complete fictional biomes — climate, terrain, dominant life forms, and the stories that happen in them.", placeholder: "What biome should I design?", example: "e.g. A forest where every tree is a single organism connected by roots that carry memories of everything that has died nearby", series: "biome" },
  { id: "EcosystemEngine", name: "Ecosystem Engine", icon: "🕸️", color: "#0f766e", gradient: "linear-gradient(135deg, #0f766e, #0d9488)", tagline: "Ecosystem Architect", description: "Designs complete food webs and ecological balance — who eats whom, what keeps the system stable, what breaks it.", placeholder: "What ecosystem should I design?", example: "e.g. An ecosystem where the apex predator only hunts at intervals of seven years, causing feast and famine cycles across all species", series: "biome" },
  { id: "ApexCreatureEngine", name: "Apex Creature Engine", icon: "🦁", color: "#b45309", gradient: "linear-gradient(135deg, #b45309, #92400e)", tagline: "Apex Architect", description: "Designs apex predators — their biology, hunting behavior, territorial range, and ecological necessity.", placeholder: "What apex creature should I design?", example: "e.g. A silent aerial predator that hunts by detecting the unique bioelectric signature of fear, so its prey has learned to feel no fear at all", series: "evolution" },
  { id: "ExtinctionEngine", name: "Extinction Engine", icon: "💀", color: "#4b5563", gradient: "linear-gradient(135deg, #4b5563, #374151)", tagline: "Extinction Architect", description: "Designs fictional extinction events — what was lost, why, and what the world looks like in their absence.", placeholder: "What extinction event should I design?", example: "e.g. The extinction of the species that pollenated the plants that produced the compound which suppressed aggression in all mammals", series: "evolution" },
  { id: "EvolutionPathEngine", name: "Evolution Path Engine", icon: "🔬", color: "#7c3aed", gradient: "linear-gradient(135deg, #7c3aed, #6d28d9)", tagline: "Evolution Architect", description: "Designs fictional evolutionary adaptation paths — what pressures shaped a species into what it is, and what it might become.", placeholder: "What evolutionary path should I design?", example: "e.g. A species that evolved in total darkness and developed an organ that produces light only when they are in the presence of a mate", series: "evolution" },
  { id: "FloraEngine", name: "Flora Engine", icon: "🌺", color: "#be185d", gradient: "linear-gradient(135deg, #be185d, #db2777)", tagline: "Flora Architect", description: "Invents fictional plant life — biology, behavior, reproduction, and the ecological and cultural role of fictional flora.", placeholder: "What plant life should I design?", example: "e.g. A vine that grows exclusively toward the sound of music, used by navigators who sing to direct it toward water sources", series: "biome" },
  { id: "FaunaEngine", name: "Fauna Engine", icon: "🦋", color: "#0891b2", gradient: "linear-gradient(135deg, #0891b2, #0e7490)", tagline: "Fauna Architect", description: "Designs fictional non-magical animal life — behavior, social structure, adaptation, and role in the ecosystem.", placeholder: "What animal life should I design?", example: "e.g. A herd animal that has evolved to mourn its dead in complex rituals, confusing predators who have learned to wait for the ceremony", series: "biome" },
  { id: "ClimateSystemEngine", name: "Climate System Engine", icon: "🌩️", color: "#1d4ed8", gradient: "linear-gradient(135deg, #1d4ed8, #1e40af)", tagline: "Climate Architect", description: "Designs fictional climate patterns — weather systems, seasonal extremes, and how climate shapes civilization.", placeholder: "What climate system should I design?", example: "e.g. A world with a 40-year drought cycle, where entire civilizations exist as migratory, moving with the rain", series: "climate" },
  { id: "GeologyEngine", name: "Geology Engine", icon: "⛰️", color: "#78350f", gradient: "linear-gradient(135deg, #78350f, #92400e)", tagline: "Geology Architect", description: "Designs fictional geological history — how the land was formed, what it contains, and how it shapes the people living on it.", placeholder: "What geology should I design?", example: "e.g. A continent formed by the collapse of a massive underwater cavern system, leaving a land riddled with sinkholes that open without warning", series: "climate" },
  { id: "OceanicEngine", name: "Oceanic Engine", icon: "🌊", color: "#0369a1", gradient: "linear-gradient(135deg, #0369a1, #0284c7)", tagline: "Ocean Architect", description: "Designs fictional ocean systems — currents, depth zones, sea life, and the civilizations that depend on or fear the sea.", placeholder: "What ocean system should I design?", example: "e.g. An ocean with a permanent bioluminescent layer at 200 meters that ancient navigators used as their only light source at night", series: "climate" },
  { id: "SymbiosisEngine", name: "Symbiosis Engine", icon: "🤝", color: "#16a34a", gradient: "linear-gradient(135deg, #16a34a, #15803d)", tagline: "Symbiosis Architect", description: "Designs fictional symbiotic relationships — mutualistic, parasitic, and commensal bonds between species.", placeholder: "What symbiotic relationship should I design?", example: "e.g. A parasitic relationship between a moss and a large herbivore, where the moss alters the host's behavior to carry it to better sunlight", series: "evolution" },
  { id: "DisasterEngine", name: "Disaster Engine", icon: "🌋", color: "#dc2626", gradient: "linear-gradient(135deg, #dc2626, #991b1b)", tagline: "Disaster Architect", description: "Designs fictional natural disasters and their ecological aftermath — how the world is reshaped by catastrophe.", placeholder: "What natural disaster should I design?", example: "e.g. A seasonal super-storm that lasts 90 days and has shaped an entire civilization to live underground, emerging only in the aftermath", series: "climate" },
  { id: "MigrationEngine", name: "Migration Engine", icon: "🦅", color: "#ca8a04", gradient: "linear-gradient(135deg, #ca8a04, #b45309)", tagline: "Migration Architect", description: "Designs fictional migration patterns — seasonal movements, permanent relocations, and the stories migrations create.", placeholder: "What migration should I design?", example: "e.g. A species that migrates in patterns that perfectly trace the ancient borders of a civilization that disappeared 10,000 years ago", series: "evolution" },
];

export interface EcologySeriesDefinition {
  id: string; name: string; symbol: string; icon: string; gradient: string; description: string; engines: string[]; estimatedMinutes: number;
}

export const ECOLOGY_SERIES: EcologySeriesDefinition[] = [
  { id: "biome", name: "BIOME-Series", symbol: "BM", icon: "🌿", gradient: "linear-gradient(135deg, #15803d, #0f766e, #be185d)", description: "Life Trifecta — Biome, Ecosystem, and Flora — the living landscape of a fictional world.", engines: ["BiomeEngine", "EcosystemEngine", "FloraEngine"], estimatedMinutes: 3 },
  { id: "evolution", name: "EVOLUTION-Series", symbol: "EV", icon: "🔬", gradient: "linear-gradient(135deg, #7c3aed, #b45309, #16a34a)", description: "Life Change Trifecta — Apex Creature, Evolution Path, and Symbiosis — how life adapts and interconnects.", engines: ["ApexCreatureEngine", "EvolutionPathEngine", "SymbiosisEngine"], estimatedMinutes: 3 },
  { id: "climate", name: "CLIMATE-Series", symbol: "CL", icon: "🌩️", gradient: "linear-gradient(135deg, #1d4ed8, #78350f, #dc2626)", description: "World Force Trifecta — Climate, Geology, and Disaster — the physical forces that shape all life.", engines: ["ClimateSystemEngine", "GeologyEngine", "DisasterEngine"], estimatedMinutes: 3 },
  { id: "ocean", name: "OCEAN-Series", symbol: "OC", icon: "🌊", gradient: "linear-gradient(135deg, #0369a1, #0891b2, #0f766e)", description: "Sea Trifecta — Oceanic, Climate, and Fauna — the living water world and its inhabitants.", engines: ["OceanicEngine", "ClimateSystemEngine", "FaunaEngine"], estimatedMinutes: 3 },
  { id: "worldlife", name: "WORLDLIFE-Series", symbol: "WL", icon: "🌍", gradient: "linear-gradient(135deg, #15803d, #ca8a04, #4b5563)", description: "Complete Ecology Trifecta — Biome, Migration, and Extinction — birth, movement, and loss of life in a world.", engines: ["BiomeEngine", "MigrationEngine", "ExtinctionEngine"], estimatedMinutes: 3 },
];

export function getEcologyEngineById(id: string): EcologyEngineDefinition | undefined { return ECOLOGY_ENGINES.find(e => e.id === id); }
export function getEcologyEngineColor(id: string): string { return getEcologyEngineById(id)?.color ?? "#15803d"; }
export function getEcologyEngineIcon(id: string): string { return getEcologyEngineById(id)?.icon ?? "🌿"; }

export async function runEcologyEngine(opts: { engineId: string; engineName: string; topic: string; context?: string; onChunk: (t: string) => void; onDone?: () => void; onError?: (e: string) => void; }): Promise<void> {
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

export async function runEcologySeries(opts: { seriesId: string; topic: string; context?: string; onSectionStart: (id: string, i: number) => void; onChunk: (t: string) => void; onSectionEnd: (id: string) => void; onDone?: () => void; onError?: (e: string) => void; }): Promise<void> {
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
