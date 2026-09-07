export const chapters = ['THE WHITE CHAMBER', 'THE OBSERVER’S BRIDGE', 'A DIFFERENT DOWN', 'THE COPY REMEMBERS', 'THE IMPOSSIBLE LOCK', 'THE LAST SCALE'] as const;
export const objectives = ['Approach the impossible.', 'Make the distant bridge a path.', 'Let the wall become your floor.', 'Leave a moment behind. Open the way.', 'One past. Three broken rules.', 'Find the edge of the world.'];
export function parseCheckpoint(raw: string | null): number {
  try { const c = JSON.parse(raw || 'null'); return c?.version === 1 && Number.isInteger(c.chapter) && c.chapter >= 0 && c.chapter < chapters.length ? c.chapter : 0; } catch { return 0; }
}
export function loadCheckpoint() { try { return parseCheckpoint(localStorage.getItem('infinitum.checkpoint')); } catch { return 0; } }
export function checkpoint(chapter: number) { try { localStorage.setItem('infinitum.checkpoint', JSON.stringify({ version: 1, chapter })); } catch { /* Persistence is optional; play remains available. */ } }
