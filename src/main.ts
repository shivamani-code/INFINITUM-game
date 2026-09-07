import './style.css';
import '@fontsource/cormorant-garamond/latin-300.css';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/manrope/latin-400.css';
import { Vector3 } from 'three';
import { readSettings, saveSettings } from './core/settings';
import { Renderer } from './render/Renderer';
import { Physics } from './physics/Physics';
import { Input } from './input/Input';
import { PlayerMotor } from './player/PlayerMotor';
import { Soundscape } from './audio/Soundscape';
import { UI } from './ui/UI';
import { Director } from './app/Director';
import { loadCheckpoint } from './world/checkpoint';
import { loadAssetKit } from './world/AssetKit';

async function boot() {
  const settings = readSettings(), ui = new UI(settings);
  try {
    const render = new Renderer(settings); document.querySelector('#app')!.prepend(render.gl.domElement);
    const [physics] = await Promise.all([Physics.boot(), loadAssetKit()]), input = new Input(render.gl.domElement);
    const player = new PlayerMotor(physics, input, render.camera, settings);
    const audio = new Soundscape(); let started = false, active = false, elapsed = 0, acc = 0, last = performance.now(), lastStep = 0, lastStats = 0;
    const director = new Director(render, physics, player, input, audio, ui);
    // Compile both lighting configurations while the Play button is still disabled.
    // Cold driver compilation should not interrupt the player's first interaction.
    await render.gl.compileAsync(render.scene, render.camera);
    director.chamber.group.visible = false; director.city.group.visible = true;
    try { await render.gl.compileAsync(render.scene, render.camera); }
    finally { director.chamber.group.visible = true; director.city.group.visible = false; }
    last = performance.now();
    const saved = loadCheckpoint();
    player.teleport(new Vector3(0, .86, 24)); player.pitch = .07;
    ui.onPlay = () => { if (!started && saved > 0) director.load(saved); void input.lock()?.catch(() => director.say('Click Resume to capture the mouse.')); void audio.start(settings.volume); };
    ui.onReset = () => { director.load(director.chapter); ui.onPlay(); };
    ui.onNew = () => { director.load(0); started = true; ui.onPlay(); };
    ui.onSettings = () => { saveSettings(settings); render.resize(); if (director.chamber.reflection) director.chamber.reflection.visible = !settings.safe; audio.volume(settings.volume); };
    input.onLockChange = locked => { active = locked; if (locked) started = true; else audio.suspend(); ui.playing(locked, started); if (director.ended) ui.ending(); acc = 0; };
    ui.ready(saved > 0);
    let nextRender = 0, previousFps = 0;
    function frame(now: number) {
      requestAnimationFrame(frame);
      if (document.hidden) { last = now; acc = 0; nextRender = 0; return; }
      const fps = active ? render.targetFps : 30;
      render.frameBudget = 1000 / fps;
      if (fps !== previousFps) { nextRender = now; previousFps = fps; }
      if (fps === 30) {
        if (now + .5 < nextRender) return;
        const interval = 1000 / fps;
        nextRender += Math.max(1, Math.floor((now - nextRender) / interval) + 1) * interval;
      }
      const dt = Math.min((now - last) / 1000, .1); last = now; elapsed += dt;
      player.look();
      if (active) {
        acc += dt;
        while (acc >= 1 / 60) { player.tick(1 / 60); physics.step(); player.syncCamera(); director.tick(1 / 60); acc -= 1 / 60; }
        player.render(acc * 60, dt);
        if (player.distance - lastStep > 1.85) { audio.tone('step'); lastStep = player.distance; }
        director.update(dt);
      } else if (!started) {
        render.camera.position.set(-10, 4.4, 22); render.camera.lookAt(-11, 9, -22);
      }
      if (!active) {
        if (director.chamber.group.visible) director.chamber.update(elapsed);
        if (director.city.group.visible) director.city.update(elapsed);
      }
      if (input.take('F3')) ui.stats.hidden = !ui.stats.hidden;
      if (!ui.stats.hidden && now - lastStats > 250) { lastStats = now; ui.stats.textContent = `INFINITUM / DEVELOPMENT\n${Math.round(1000 / render.averageMs)} FPS · ${render.averageMs.toFixed(1)} ms\nGPU ${render.gpu.ms.toFixed(1)} ms · CPU render ${render.cpuMs.toFixed(1)} ms\n${render.tier} · DPR ${render.gl.getPixelRatio().toFixed(2)}\nWebGL 2 · ${(render.resolution * 100).toFixed(0)}% scale\n${render.gl.info.render.calls} calls · ${render.gl.info.render.triangles.toLocaleString()} triangles\n${physics.world.colliders.len()} colliders\nUP ${player.up.toArray().join(', ')}\nPOSITION ${player.position.toArray().map(n => n.toFixed(2)).join(', ')}`;
      }
      render.render(dt);
    }
    requestAnimationFrame(frame);
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__game = { player, physics, render, ui, input, director };
    render.gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); active = false; ui.error('The graphics context was interrupted. Reload to restore your checkpoint.'); });
  } catch (error) { console.error(error); ui.error(`INFINITUM could not initialize.\n${error instanceof Error ? error.message : String(error)}\nA browser with WebGL 2 is required.`); }
}
void boot();
