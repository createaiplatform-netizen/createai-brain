// Continuum Channels — declarative definitions of expression channels.
// Purely internal. No imports, no side effects, no activation.

export type ContinuumChannel =
  | "presence"
  | "emotion"
  | "narrative"
  | "identity"
  | "relationship"
  | "time"
  | "ecosystem"
  | "possibility";

export const CONTINUUM_CHANNELS: ContinuumChannel[] = [
  "presence",
  "emotion",
  "narrative",
  "identity",
  "relationship",
  "time",
  "ecosystem",
  "possibility"
];

// Returns all channels the Continuum can express through.
export function getContinuumChannels() {
  return CONTINUUM_CHANNELS;
}
