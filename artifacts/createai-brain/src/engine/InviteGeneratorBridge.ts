// ─── Invite Generator Bridge ──────────────────────────────────────────────
// Tiny callback bridge so ConversationContext can trigger the InviteGenerator
// popup that lives inside UniversalApp — without circular imports or shared state.

let _openFn: (() => void) | null = null;

export function registerInviteOpen(fn: () => void): void {
  _openFn = fn;
}

export function triggerInviteOpen(): void {
  _openFn?.();
}
