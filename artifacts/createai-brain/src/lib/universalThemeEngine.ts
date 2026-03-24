// File: src/lib/universalThemeEngine.ts

import { defaultFamilyTheme, type FamilyTheme } from './familyThemes';

function hashStringToInt(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

export function buildUniversalTheme(seed: string, base?: FamilyTheme): FamilyTheme {
  const source = base ?? defaultFamilyTheme;
  const hash = hashStringToInt(seed || 'default-seed');

  const huePrimary = hash % 360;
  const hueSecondary = (hash * 3) % 360;
  const hueAccent = (hash * 7) % 360;

  const primary = hslToHex(huePrimary, 55, 40);
  const secondary = hslToHex(hueSecondary, 50, 35);
  const accent = hslToHex(hueAccent, 65, 55);

  return {
    ...source,
    id: source.id,
    name: source.name,
    primary,
    secondary,
    accent,
  };
}
