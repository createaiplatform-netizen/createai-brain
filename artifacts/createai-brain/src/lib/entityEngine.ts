// src/lib/entityEngine.ts
import {
  buildUniversalIdentity,
  buildUniversalTheme,
  type UniversalIdentity,
} from './universalIdentityEngine';
import type { FamilyTheme } from './familyThemes';

export type EntityKind =
  | 'person'
  | 'family'
  | 'group'
  | 'team'
  | 'business'
  | 'community'
  | 'project'
  | 'world'
  | 'system'
  | 'concept'
  | 'object'
  | 'space'
  | 'unknown'
  | string;

export type EntityId = string;

export type Entity = {
  id: EntityId;
  seed: string;
  kind: EntityKind;
  meta?: Record<string, unknown>;
};

export function createEntity(seed: string, kind: EntityKind = 'unknown', meta?: Record<string, unknown>): Entity {
  const id = seed || `entity-${Math.random().toString(36).slice(2)}`;
  return { id, seed: seed || id, kind, meta };
}

// Identity
export type EntityIdentity = UniversalIdentity & { entityId: EntityId };

export function getEntityIdentity(entity: Entity): EntityIdentity {
  const base = buildUniversalIdentity(entity.seed);
  return { ...base, entityId: entity.id };
}

// Theme
export type EntityTheme = {
  entityId: EntityId;
  theme: FamilyTheme;
};

export function getEntityTheme(entity: Entity): EntityTheme {
  const identity = buildUniversalIdentity(entity.seed);
  const theme = buildUniversalTheme(entity.seed, identity);
  return { entityId: entity.id, theme };
}

// Universe
export type UniverseLayoutKind = 'dashboard' | 'room' | 'board' | 'timeline' | 'map' | 'feed' | 'canvas' | 'mixed';

export type EntityUniverseModule =
  | 'overview'
  | 'members'
  | 'tasks'
  | 'messages'
  | 'memories'
  | 'settings'
  | 'story'
  | 'relations'
  | 'timeline'
  | 'suggestions';

export type EntityUniverse = {
  entityId: EntityId;
  layout: UniverseLayoutKind;
  modules: EntityUniverseModule[];
};

export function getEntityUniverse(entity: Entity): EntityUniverse {
  const kind = entity.kind;
  let layout: UniverseLayoutKind = 'dashboard';
  if (kind === 'world' || kind === 'system') layout = 'map';
  else if (kind === 'project') layout = 'board';
  else if (kind === 'person' || kind === 'family') layout = 'timeline';

  const modules: EntityUniverseModule[] = ['overview', 'relations', 'timeline', 'story', 'suggestions'];
  if (kind === 'person' || kind === 'family') modules.push('memories');
  if (kind === 'team' || kind === 'business' || kind === 'project') modules.push('tasks', 'members', 'messages');

  return { entityId: entity.id, layout, modules };
}

// Relationships
export type RelationKind =
  | 'parent' | 'child' | 'member-of' | 'contains'
  | 'depends-on' | 'influences' | 'mirrors'
  | 'protects' | 'supports' | 'related' | string;

export type EntityRelation = {
  from: EntityId;
  to: EntityId;
  kind: RelationKind;
  strength?: number;
  directed?: boolean;
};

export function createRelation(from: Entity, to: Entity, kind: RelationKind, strength = 1, directed = true): EntityRelation {
  return { from: from.id, to: to.id, kind, strength, directed };
}

// Time
export type EntityEventKind =
  | 'created' | 'updated' | 'joined' | 'left'
  | 'completed' | 'paused' | 'resumed'
  | 'archived' | 'revived' | 'custom';

export type EntityEvent = {
  id: string;
  entityId: EntityId;
  kind: EntityEventKind;
  at: string;
  payload?: Record<string, unknown>;
};

export function createEvent(entity: Entity, kind: EntityEventKind, payload?: Record<string, unknown>): EntityEvent {
  return {
    id: `evt-${entity.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    entityId: entity.id,
    kind,
    at: new Date().toISOString(),
    payload,
  };
}

// Emotion
export type MoodTone = 'playful' | 'calm' | 'grounded' | 'cozy' | 'elegant' | 'steady' | 'protective' | 'celebratory';

export type EntityMood = {
  entityId: EntityId;
  tone: MoodTone;
  intensity: number;
};

export function getEntityMood(entity: Entity): EntityMood {
  const identity = buildUniversalIdentity(entity.seed);
  const toneMap: Record<string, MoodTone> = {
    playful: 'playful', calm: 'calm', grounded: 'grounded', cozy: 'cozy', elegant: 'elegant',
  };
  const tone = toneMap[identity.tone] ?? 'steady';
  return { entityId: entity.id, tone, intensity: 0.7 };
}

// Narrative
export type StoryPhase = 'beginning' | 'middle' | 'turning-point' | 'resolution' | 'open';

export type EntityStoryArc = {
  entityId: EntityId;
  title: string;
  phase: StoryPhase;
  summary?: string;
};

export function getDefaultStoryArc(entity: Entity): EntityStoryArc {
  const identity = getEntityIdentity(entity);
  return {
    entityId: entity.id,
    title: `${identity.label} · First Chapter`,
    phase: 'beginning',
    summary: 'This entity has just entered the universe. Its story is just starting.',
  };
}

// Ecosystem
export type EntityCluster = {
  id: string;
  label: string;
  entityIds: EntityId[];
};

export function createCluster(label: string, entities: Entity[]): EntityCluster {
  return {
    id: `cluster-${label.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2)}`,
    label,
    entityIds: entities.map((e) => e.id),
  };
}

// Possibility
export type SuggestionKind =
  | 'new-entity' | 'new-relation' | 'new-universe-module'
  | 'new-story-arc' | 'new-cluster' | 'custom';

export type EntitySuggestion = {
  id: string;
  kind: SuggestionKind;
  forEntityId?: EntityId;
  label: string;
  details?: string;
};

export function suggestNextForEntity(entity: Entity): EntitySuggestion[] {
  const identity = getEntityIdentity(entity);
  return [
    {
      id: `sugg-universe-${entity.id}`,
      kind: 'new-universe-module',
      forEntityId: entity.id,
      label: `Add a story space for ${identity.label}`,
      details: 'Create a Story module to track arcs, milestones, and turning points.',
    },
    {
      id: `sugg-relation-${entity.id}`,
      kind: 'new-relation',
      forEntityId: entity.id,
      label: `Link ${identity.label} to related entities`,
      details: 'Connect this entity to others it depends on, supports, or belongs with.',
    },
  ];
}

// Full View
export type EntityView = {
  entity: Entity;
  identity: EntityIdentity;
  theme: EntityTheme;
  universe: EntityUniverse;
  mood: EntityMood;
  story: EntityStoryArc;
  suggestions: EntitySuggestion[];
};

export function buildEntityView(entity: Entity): EntityView {
  return {
    entity,
    identity: getEntityIdentity(entity),
    theme: getEntityTheme(entity),
    universe: getEntityUniverse(entity),
    mood: getEntityMood(entity),
    story: getDefaultStoryArc(entity),
    suggestions: suggestNextForEntity(entity),
  };
}
