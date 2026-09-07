import type { PuzzleLevel } from '../world/PuzzleLevel';
import type { PlayerMotor } from '../player/PlayerMotor';
import type { Input } from '../input/Input';
import type { Renderer } from '../render/Renderer';
import type { UI } from '../ui/UI';
import type { Soundscape } from '../audio/Soundscape';

export class CombinedPuzzle {
  corrected = false; correction = 0;
  tick(level: PuzzleLevel, player: PlayerMotor, input: Input, renderer: Renderer, ui: UI, audio: Soundscape, say: (text: string) => void) {
    const echo = level.echo!, gravity = level.gravity!, scale = level.scale!;
    if (input.take('KeyC')) { echo.clear(); say('The stabilizer needs a remembered observer.'); }
    echo.tick(player, level.plates);
    const held = echo.held(level.plates[0].position, player, true);
    level.plates[0].material.color.setHex(held ? 0xffdbaa : 0x7198b0);
    const wall = player.up.x < -.9;
    if (input.take('KeyQ')) {
      if (!wall) {
        if (echo.begin(player)) { audio.tone('echo'); say('Leave your past on the stabilizer.'); }
      } else if (held) { if (scale.capture(renderer.camera)) audio.tone('scale'); }
    }
    if (input.take('KeyE')) {
      if (!gravity.solved) {
        if (gravity.activate(player, held)) { audio.tone('gravity'); say('Your past holds this direction in place.'); }
        else if (gravity.nearby(player.position) && !held) { audio.tone('deny'); say('Only a remembered observer can stabilize the field.'); }
      } else if (held && scale.commit(renderer.camera, player.position)) {
        this.corrected = true; audio.tone('complete'); say('CORRECTION IN PROGRESS. The boundary has moved.');
      } else if (this.corrected && player.position.distanceTo(level.gate) < 3.5) return true;
    }
    ui.ability(echo.recording ? `RECORDING ${(echo.recorder!.tick / 60).toFixed(1)} / 18s    R  leave Echo` : wall ? 'Q  capture key    E  make real    R  reset' : 'Q  record    R  leave Echo / reset    E  reorient');
    const aligned = scale.captured && held && scale.aligned(renderer.camera);
    ui.cue(this.corrected ? (player.position.distanceTo(level.gate) < 3.5 ? 'E  ·  BREAK CONTAINMENT' : 'The boundary shifted above you. Follow it.') : !held ? 'A past self must hold the seal.' : !wall ? 'The stabilizer is held. Approach the gravity anchor.' : scale.captured ? (aligned ? 'E  ·  MAKE THE KEY REAL' : 'Align from the circle on the facade.') : 'From this gravity, capture the distant key with Q.', aligned || !!gravity.nearby(player.position) || this.corrected);
    return false;
  }
  update(dt: number, level: PuzzleLevel) {
    if (this.corrected) this.correction = Math.min(1, this.correction + dt / 2.5);
    level.gateRing.position.y = 12 + this.correction * 5;
    if (level.boundary) level.boundary.position.y = 12 + this.correction * 5;
  }
}
