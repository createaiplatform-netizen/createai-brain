/**
 * semantic/viewStore.ts
 * ---------------------
 * Shared in-memory view counter for semantic product pages.
 * Imported by both semanticStore.ts (writes) and semanticAnalytics.ts (reads).
 */

const _viewCounts = new Map<string, number>();

export function trackView(productId: string): void {
  _viewCounts.set(productId, (_viewCounts.get(productId) ?? 0) + 1);
}

export function getViewCount(productId: string): number {
  return _viewCounts.get(productId) ?? 0;
}

export function getAllViewCounts(): Map<string, number> {
  return _viewCounts;
}

export function getTotalViews(): number {
  let total = 0;
  for (const v of _viewCounts.values()) total += v;
  return total;
}
