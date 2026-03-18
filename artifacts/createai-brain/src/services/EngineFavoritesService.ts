// ═══════════════════════════════════════════════════════════════════════════
// EngineFavoritesService — pin up to 8 engines to the sidebar.
// Uses localStorage. Dispatches "cai:fav-changed" so any listener can react.
// ═══════════════════════════════════════════════════════════════════════════

const LS_KEY  = "cai_engine_favs";
const MAX_FAV = 8;

function read(): string[] {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function write(ids: string[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(ids)); } catch { /* quota */ }
  window.dispatchEvent(new CustomEvent("cai:fav-changed"));
}

export function favGetAll():           string[]  { return read(); }
export function favIsFav(id: string):  boolean   { return read().includes(id); }
export function favCount():            number    { return read().length; }

export function favAdd(id: string): void {
  const cur = read();
  if (cur.includes(id)) return;
  write([...cur, id].slice(0, MAX_FAV));
}

export function favRemove(id: string): void {
  write(read().filter(x => x !== id));
}

/** Toggle and return the new pinned state */
export function favToggle(id: string): boolean {
  if (favIsFav(id)) { favRemove(id); return false; }
  favAdd(id); return true;
}
