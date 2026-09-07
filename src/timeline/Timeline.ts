export type Vec3Tuple = [number, number, number];
export interface TransformSample { tick: number; position: Vec3Tuple; up: Vec3Tuple; yaw: number; grounded: boolean }
export interface TimelineEvent { tick: number; type: 'plate.enter' | 'plate.exit' | 'interact'; entityId: string }
export interface Recording { samples: TransformSample[]; events: TimelineEvent[]; duration: number }
export class TimelineRecorder {
  samples: TransformSample[] = []; events: TimelineEvent[] = []; tick = 0;
  readonly maxTicks = 18 * 60;
  add(position: Vec3Tuple, up: Vec3Tuple, yaw: number, grounded: boolean) {
    if (this.tick >= this.maxTicks) return false;
    this.samples.push({ tick: this.tick++, position: [...position], up: [...up], yaw, grounded }); return true;
  }
  event(type: TimelineEvent['type'], entityId: string) { this.events.push({ tick: Math.max(0, this.tick - 1), type, entityId }); }
  finish(): Recording | null { return this.samples.length >= 12 ? { samples: this.samples, events: this.events, duration: this.tick / 60 } : null; }
}
export class TimelinePlayback {
  readonly recording: Recording;
  constructor(recording: Recording) { this.recording = recording; }
  sample(tick: number): TransformSample {
    const samples = this.recording.samples, t = Math.max(0, Math.min(tick, samples.length - 1));
    const a = samples[Math.floor(t)], b = samples[Math.min(Math.floor(t) + 1, samples.length - 1)], f = t - Math.floor(t);
    return { tick: t, position: a.position.map((v, i) => v + (b.position[i] - v) * f) as Vec3Tuple, up: [...a.up], yaw: a.yaw + Math.atan2(Math.sin(b.yaw - a.yaw), Math.cos(b.yaw - a.yaw)) * f, grounded: a.grounded };
  }
  eventsAt(tick: number) { return this.recording.events.filter(e => e.tick === tick); }
}
