import { FogExp2, Vector3 } from 'three';
import { Renderer } from '../render/Renderer';
import { Physics } from '../physics/Physics';
import { PlayerMotor } from '../player/PlayerMotor';
import { Input } from '../input/Input';
import { Soundscape } from '../audio/Soundscape';
import { UI } from '../ui/UI';
import { Chamber } from '../world/Chamber';
import { City } from '../world/City';
import { PuzzleLevel } from '../world/PuzzleLevel';
import { disposeGroup } from '../world/Architecture';
import { chapters, objectives, checkpoint } from '../world/checkpoint';
import { CombinedPuzzle } from '../puzzle/CombinedPuzzle';

export class Director {
  chamber: Chamber; city = new City(); level?: PuzzleLevel; chapter = 0;
  combined = new CombinedPuzzle();
  get ended() { return this.level?.finale?.phase === 3; }
  elapsed = 0; private messageUntil = 0; private crossing = 0; private crossingStart = new Vector3();
  private portal?: { target: number; time: number; moved: boolean };
  constructor(readonly renderer: Renderer, readonly physics: Physics, readonly player: PlayerMotor, readonly input: Input, readonly audio: Soundscape, readonly ui: UI) {
    this.chamber = new Chamber(physics, renderer.settings.safe); renderer.scene.add(this.chamber.group, this.city.group); this.city.group.visible = false;
  }
  load(chapter: number) {
    this.physics.clearLevel();
    if (this.level) { this.level.finale?.restore(this.city); this.level.echo?.clear(); this.level.reflection?.dispose(); disposeGroup(this.level.group); this.level = undefined; }
    this.chapter = chapter; this.crossing = 0; this.player.enabled = true; this.ui.fade(0);
    this.portal = undefined;
    this.combined = new CombinedPuzzle();
    this.renderer.fill.intensity = .45; this.renderer.sun.intensity = chapter === 0 ? 4 : 2.8;
    this.renderer.scene.fog = new FogExp2(0x8798ab, chapter === 0 ? .008 : .0021);
    this.renderer.reflectiveTerrace = chapter === 1; this.renderer.cityMode = chapter > 0; this.renderer.resize();
    this.chamber.group.visible = chapter === 0; this.city.group.visible = chapter > 0;
    if (chapter === 0) {
      this.chamber.reflection?.dispose(); disposeGroup(this.chamber.group);
      this.chamber = new Chamber(this.physics, this.renderer.settings.safe); this.renderer.scene.add(this.chamber.group);
      this.player.teleport(new Vector3(0, .86, 24)); this.player.pitch = .07;
    } else {
      this.level = new PuzzleLevel(this.physics, chapter, this.renderer.settings.safe); this.renderer.scene.add(this.level.group); this.player.teleport(this.level.spawn);
    }
    this.physics.step(); this.input.clear(); this.ui.chapter(chapter, chapters[chapter], objectives[chapter]); this.ui.cue(''); this.ui.ability('');
    checkpoint(chapter);
  }
  say(text: string, duration = 6) { this.ui.message(text); this.messageUntil = this.elapsed + duration; }
  travel(target: number) { this.portal = { target, time: 0, moved: false }; this.player.enabled = false; this.audio.tone('gravity'); }
  tick(dt: number) {
    this.elapsed += dt;
    if (this.elapsed > this.messageUntil) this.ui.clearMessage();
    if (this.crossing > 0 || this.portal) return;
    if (Math.abs(this.player.position.x) > 60 || this.player.position.y > 65 || this.player.position.y < -28 || this.player.position.z < -100) { this.load(this.chapter); this.say('A different attempt. The same possibility.'); return; }
    if (this.input.take('KeyR')) {
      if (this.level?.echo?.recording) {
        if (this.level.echo.reset(this.player)) { this.audio.tone('echo'); this.say('A moment remains. Its last position will hold.'); }
        else this.say('Give the moment time to exist.');
      } else { this.load(this.chapter); this.say('The room remembers its first shape.'); }
      return;
    }
    if (this.chapter === 5 && this.level?.finale) {
      const finale = this.level.finale;
      const near = this.player.position.distanceTo(finale.gate) < 4;
      this.ui.ability('');
      this.ui.cue(finale.phase === 2 ? 'E  ·  RELEASE THE LAST SCALE' : finale.phase === 0 && near ? 'E  ·  LOOK BEYOND' : finale.phase === 0 ? 'The boundary is another beginning.' : '', near || finale.phase === 2);
      if (this.input.take('KeyE')) {
        if (finale.phase === 0 && near) { finale.begin(this.renderer, this.city); this.player.enabled = false; this.say('You thought you were moving inward.', 8); this.audio.tone('gravity'); }
        else if (finale.phase === 2) { finale.phase = 3; this.input.unlock(); this.ui.ending(); this.audio.tone('complete'); }
      }
    } else if (this.chapter === 4 && this.level) {
      if (this.combined.tick(this.level, this.player, this.input, this.renderer, this.ui, this.audio, text => this.say(text))) { this.travel(5); this.say('There is no outside.'); this.audio.tone('complete'); }
    } else if (this.chapter === 0) {
      const near = this.player.position.distanceTo(new Vector3(0, 1, -11)) < 6;
      this.ui.cue(near ? 'E  ·  DISOBEY' : '', near);
      if (near && this.input.take('KeyE')) {
        this.crossing = .001; this.player.enabled = false; this.crossingStart.copy(this.renderer.camera.position); this.audio.tone('gravity'); this.say('You are not descending.');
      }
    } else if (this.level?.scale) {
      const scale = this.level.scale, camera = this.renderer.camera;
      this.ui.ability('Q  capture / release     E  make real     R  reset');
      if (scale.committed) this.ui.cue(this.player.position.distanceTo(this.level.gate) < 4 ? 'E  ·  CROSS THE THRESHOLD' : 'The bridge is real. Cross it.', true);
      else if (scale.captured) this.ui.cue(scale.aligned(camera) ? 'E  ·  MAKE THIS PERSPECTIVE REAL' : 'Move onto the observation circle. Align the bridge with its outline.', scale.aligned(camera));
      else this.ui.cue(scale.aimed(camera) ? 'Q  ·  CAPTURE THE DISTANT BRIDGE' : 'Find the bridge beyond the empty outline.');
      if (this.input.take('KeyQ')) { if (scale.capture(camera)) this.audio.tone('scale'); else this.audio.tone('deny'); }
      if (this.input.take('KeyE')) {
        if (scale.commit(camera, this.player.position)) { this.audio.tone('complete'); this.say('Distance was only an assumption.'); }
        else if (scale.committed && this.player.position.distanceTo(this.level.gate) < 4) { this.travel(2); this.say('The particles fall toward the wall.'); }
        else if (scale.captured) this.audio.tone('deny');
      }
    } else if (this.level?.echo) {
      const level = this.level, echo = level.echo!;
      if (this.input.take('KeyQ')) { if (echo.begin(this.player)) { this.audio.tone('echo'); this.say('Walk onto a seal. R leaves your past there.'); } else this.say(echo.recording ? 'R ends the recording and leaves an Echo.' : 'Three moments already remain. C clears them.'); }
      if (this.input.take('KeyC')) { echo.clear(); this.say('The timeline is quiet.'); }
      if (echo.tick(this.player, level.plates)) { this.audio.tone('echo'); this.say('The moment is full. Your Echo remains.'); }
      let held = 0;
      for (const plate of level.plates) { const active = echo.held(plate.position, this.player); if (active) held++; plate.material.color.setHex(active ? 0xf4d6a0 : 0x7299af); }
      const wasOpen = level.doorOpen;
      if (level.doorOpen && this.player.position.z < -19) level.doorLatched = true;
      level.doorOpen = held === level.plates.length || level.doorLatched;
      if (level.doorOpen && !wasOpen) this.audio.tone('complete');
      this.ui.ability(echo.recording ? `RECORDING  ${(echo.recorder!.tick / 60).toFixed(1)} / 18s    R  leave Echo` : `${echo.echoes.length} / 3 ECHOES    Q  record    R  restart room    C  clear`);
      const atGate = level.doorOpen && this.player.position.distanceTo(level.gate) < 4;
      this.ui.cue(atGate ? 'E  ·  CROSS THE THRESHOLD' : level.doorOpen ? 'Both moments are held. The passage is open.' : `${held} / ${level.plates.length} seals held. Your past can remain where you cannot.`, level.doorOpen);
      if (atGate && this.input.take('KeyE')) { this.travel(4); this.say('The Curator has separated the rules. You have not.'); }
    } else if (this.level?.gravity) {
      const gravity = this.level.gravity, nearby = gravity.nearby(this.player.position);
      const atGate = gravity.solved && this.player.position.distanceTo(this.level.gate) < 4;
      this.ui.ability('E  reorient gravity     R  reset');
      this.ui.cue(atGate ? 'E  ·  CROSS THE THRESHOLD' : nearby ? 'E  ·  CHOOSE A DIFFERENT DOWN' : !gravity.anchors[0].used ? 'Approach the suspended gold ring.' : !gravity.solved ? 'The facade is a street. Follow its gold seams to the next anchor.' : 'The ceiling is the path. Reach the final ring.', !!nearby || atGate);
      if (this.input.take('KeyE')) {
        if (atGate) { this.travel(3); this.say('Two seals. One traveler. More than one moment.'); this.audio.tone('echo'); }
        else if (gravity.activate(this.player)) { this.audio.tone('gravity'); this.say(gravity.solved ? 'The sky was always a floor.' : 'A different down. The same world.'); }
      }
    }
  }
  update(dt: number) {
    if (this.level?.reflection) this.level.reflection.visible = !this.renderer.settings.safe;
    for (const reflection of [this.level?.reflection, this.chamber.reflection]) if (reflection) {
      const tier = this.renderer.tier;
      if (reflection.userData.quality !== tier) {
        const size = tier === 'mobile' ? 256 : tier === 'balanced' ? 384 : reflection === this.chamber.reflection ? 768 : 512;
        reflection.getRenderTarget().setSize(size, size);
        reflection.userData.quality = tier;
      }
    }
    this.city.clouds.quality(this.renderer.tier);
    this.city.clouds.visible = !this.renderer.settings.safe;
    if (this.portal) {
      const portal = this.portal; portal.time += dt;
      if (portal.time >= .3 && !portal.moved) { this.load(portal.target); portal.moved = true; this.portal = portal; this.player.enabled = false; }
      this.ui.fade(portal.time < .3 ? portal.time / .3 : Math.max(0, 1 - (portal.time - .3) / .4));
      if (portal.time >= .7) { this.portal = undefined; this.player.enabled = true; this.ui.fade(0); }
    }
    if (this.chamber.group.visible) this.chamber.update(this.elapsed);
    if (this.city.group.visible) this.city.update(this.elapsed, this.combined.correction);
    if (this.chapter === 4 && this.level) this.combined.update(dt, this.level);
    this.level?.scale?.update(dt, this.renderer.camera);
    this.level?.gravity?.update(dt, this.renderer.camera.position);
    this.level?.echo?.update(0);
    if (this.level?.finale) {
      const phase = this.level.finale.phase;
      this.level.finale.update(dt, this.renderer, this.city);
      if (phase === 1 && this.level.finale.phase === 2) this.say('There was never a smaller world. Only a wider observer.', 30);
    }
    if (this.level?.door && this.level.doorCollider) {
      const level = this.level;
      level.doorProgress += ((level.doorOpen ? 1 : 0) - level.doorProgress) * Math.min(1, dt * 4);
      level.door!.position.y = 4 + level.doorProgress * 8;
      // Keep a solid gate until the visual aperture can fit the player.
      level.doorCollider!.setEnabled(level.doorProgress < .7);
    }
    if (this.crossing > 0) {
      this.crossing += dt / 3.8; const t = Math.min(this.crossing, 1), smooth = t * t * (3 - 2 * t);
      this.renderer.camera.position.lerpVectors(this.crossingStart, new Vector3(0, 9.2, -21), smooth);
      this.renderer.camera.lookAt(this.chamber.orb.position);
      this.chamber.sphereMaterial.uniforms.reveal.value = Math.max(0, (t - .65) * 3);
      this.ui.fade(Math.max(0, (t - .84) / .16));
      if (t >= 1) { this.load(1); this.say('The world has not grown. You have changed.'); this.audio.tone('complete'); }
    }
  }
}
