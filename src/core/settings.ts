export interface Settings {
  fov: number; sensitivity: number; volume: number; reducedMotion: boolean;
  quality: 'auto' | 'high' | 'balanced' | 'mobile';
  safe: boolean; invertY: boolean; bloom: boolean;
}
export const defaults: Settings = { fov: 68, sensitivity: 1, volume: 0.45, reducedMotion: false, quality: 'auto', safe: false, invertY: false, bloom: true };
export function readSettings(): Settings {
  try {
    const v = JSON.parse(localStorage.getItem('infinitum.settings') || '{}');
    return { quality: ['auto','high','balanced','mobile'].includes(v.quality) ? v.quality : 'auto', fov: bounded(v.fov, 55, 90, 68), sensitivity: bounded(v.sensitivity, 0.2, 2, 1), volume: bounded(v.volume, 0, 1, .45), reducedMotion: v.reducedMotion === true, safe: v.safe === true, invertY: v.invertY === true, bloom: v.bloom !== false };
  } catch { return { ...defaults }; }
}
function bounded(v: unknown, min: number, max: number, fallback: number) { return typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback; }
export function saveSettings(settings: Settings) { try { localStorage.setItem('infinitum.settings', JSON.stringify(settings)); } catch { /* Private browsing may deny persistence. */ } }
