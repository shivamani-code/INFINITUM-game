import { Group, Vector3 } from 'three';
import { TimelineRecorder, TimelinePlayback } from '../../timeline/Timeline';
import { EchoVisual } from './EchoVisual';
import { PlayerMotor } from '../../player/PlayerMotor';

export class EchoSystem {
  group = new Group(); recorder?: TimelineRecorder;
  echoes: { playback: TimelinePlayback; visual: EchoVisual }[] = [];
  playbackTick = 0; lastPlates = new Set<string>();
  get recording() { return !!this.recorder; }
  begin(player: PlayerMotor) {
    if (this.recorder || this.echoes.length >= 3) return false;
    this.recorder = new TimelineRecorder(); this.record(player); return true;
  }
  private record(player: PlayerMotor) { return this.recorder?.add(player.position.toArray(), player.up.toArray(), player.yaw, player.grounded); }
  tick(player: PlayerMotor, plates: { id: string; position: Vector3 }[]) {
    this.playbackTick++;
    if (this.recorder) {
      this.record(player);
      for (const plate of plates) {
        const on = this.onPlate(player.position, plate.position);
        if (on !== this.lastPlates.has(plate.id)) { this.recorder.event(on ? 'plate.enter' : 'plate.exit', plate.id); if (on) this.lastPlates.add(plate.id); else this.lastPlates.delete(plate.id); }
      }
      if (this.recorder.tick >= this.recorder.maxTicks) return this.reset(player);
    }
    return false;
  }
  reset(player: PlayerMotor) {
    const recording = this.recorder?.finish();
    if (!recording) return false;
    const visual = new EchoVisual(); this.group.add(visual.group);
    this.echoes.push({ playback: new TimelinePlayback(recording), visual });
    this.recorder = undefined; this.playbackTick = 0; this.lastPlates.clear();
    const initial = recording.samples[0]; player.teleport(new Vector3().fromArray(initial.position), new Vector3().fromArray(initial.up), initial.yaw);
    return true;
  }
  onPlate(position: Vector3, plate: Vector3) { return Math.hypot(position.x - plate.x, position.z - plate.z) < 1.12 && Math.abs(position.y - plate.y - .85) < .5; }
  held(plate: Vector3, player: PlayerMotor, echoOnly = false) {
    if (!echoOnly && this.onPlate(player.position, plate)) return true;
    return this.echoes.some(e => this.onPlate(new Vector3().fromArray(e.playback.sample(this.playbackTick).position), plate));
  }
  update(alpha: number) {
    for (const echo of this.echoes) {
      const sample = echo.playback.sample(this.playbackTick + alpha);
      const before = echo.playback.sample(this.playbackTick - 1);
      const moving = sample.position.some((v, i) => Math.abs(v - before.position[i]) > .001);
      echo.visual.update(sample, this.playbackTick / 60, moving);
    }
  }
  clear() { this.echoes.forEach(e => e.visual.dispose()); this.echoes = []; this.recorder = undefined; this.playbackTick = 0; this.lastPlates.clear(); }
}
