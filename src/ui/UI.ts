import type { Settings } from '../core/settings';
export class UI {
  menu: HTMLElement; hud: HTMLElement; prompt: HTMLElement; narrative: HTMLElement; stats: HTMLElement;
  onPlay = () => {}; onReset = () => {}; onSettings = () => {}; onNew = () => {};
  constructor(readonly settings: Settings) {
    const app = document.querySelector<HTMLDivElement>('#app')!;
    app.insertAdjacentHTML('beforeend', `<div class="vignette"></div>
      <main id="menu"><div class="edition">AN EXPERIMENT IN PERCEPTION <span>VOL. 001</span></div>
      <section class="title-block"><div class="sigil"><i></i></div><p class="eyebrow">A WORLD BEYOND MEASURE</p><h1>INFINITUM</h1><div class="subtitle"><span></span>THE LAST SCALE<span></span></div><p class="tagline">Some places are not found.<br>They are realized.</p>
      <nav><button id="play" class="primary" disabled><span id="play-label">ASSEMBLING REALITY</span><b>↗</b></button><button id="settings-button">SETTINGS <span>+</span></button><button id="credits-button">CREDITS <span>+</span></button><button id="reset" hidden>RESTART CHECKPOINT <span>↺</span></button><button id="new" hidden>NEW JOURNEY <span>↗</span></button></nav></section>
      <footer><span>WORLDS WITHIN WORLDS</span><span>HEADPHONES RECOMMENDED <i>·</i> KEYBOARD + MOUSE</span></footer>
      <div class="scene-caption"><span>01 / THE WHITE CHAMBER</span><p>“Do not enter the sphere.”</p></div></main>
      <section id="settings" class="dialog" hidden><p class="eyebrow">YOUR FRAME OF REFERENCE</p><h2>Settings</h2>
      <label>Graphics quality <select id="quality"><option value="auto">Automatic</option><option value="high">High</option><option value="balanced">Balanced</option><option value="mobile">Mobile · 30 FPS</option></select></label>
      <label>Field of view <input id="fov" type="range" min="55" max="90" value="${settings.fov}"></label>
      <label>Look sensitivity <input id="sensitivity" type="range" min="0.2" max="2" step=".1" value="${settings.sensitivity}"></label>
      <label>Master volume <input id="volume" type="range" min="0" max="1" step=".05" value="${settings.volume}"></label>
      <label>Reduced camera motion <input id="reducedMotion" type="checkbox" ${settings.reducedMotion ? 'checked' : ''}></label>
      <label>Invert look Y <input id="invertY" type="checkbox" ${settings.invertY ? 'checked' : ''}></label>
      <label>Bloom <input id="bloom" type="checkbox" ${settings.bloom ? 'checked' : ''}></label>
      <label>Safe graphics <input id="safe" type="checkbox" ${settings.safe ? 'checked' : ''}></label>
      <button class="close">BACK TO THE WORLD ↗</button></section>
      <section id="credits" class="dialog" hidden><p class="eyebrow">INFINITUM / THE LAST SCALE</p><h2>A wider view.</h2><p>Concept, production direction and visual references<br>Project Astra</p><p>Built with Three.js, Rapier, TypeScript and Vite.<br>Procedural architecture, materials and Web Audio.</p><p class="muted">Three.js / MIT · Rapier / Apache-2.0<br>TypeScript / Apache-2.0 · Vite / MIT<br>Cormorant Garamond & Manrope / SIL OFL 1.1</p><button class="close">RETURN ↗</button></section>
      <section id="ending" hidden><p class="eyebrow">THE LAST SCALE</p><h2>There is no outside.</h2><p>You were never descending.<br>You were becoming visible.</p><div class="end-sigil">∞</div><p class="muted">INFINITUM<br>Concept & direction · Project Astra<br>Three.js · Rapier · TypeScript · Vite<br>Procedural architecture and sound</p><button id="replay">ANOTHER PERSPECTIVE ↗</button></section>
      <div id="hud" hidden><div class="chapter"><span id="chapter-number">01</span><div><small id="chapter-name">THE WHITE CHAMBER</small><p id="objective">Approach the impossible.</p></div></div><div id="reticle"><i></i></div><div id="prompt"></div><div id="narrative" aria-live="polite"></div><div class="controls"><span>W A S D <small>move</small></span><span>MOUSE <small>look</small></span><span>SPACE <small>jump</small></span><span>ESC <small>pause</small></span></div><div id="ability"></div><div class="corner-brand">INFINITUM <small>THE LAST SCALE</small></div></div><pre id="stats" hidden></pre><div id="fade"></div><div id="error" hidden></div>`);
    this.menu = document.querySelector('#menu')!; this.hud = document.querySelector('#hud')!;
    this.prompt = document.querySelector('#prompt')!; this.narrative = document.querySelector('#narrative')!; this.stats = document.querySelector('#stats')!;
    document.querySelector('#play')!.addEventListener('click', () => this.onPlay());
    document.querySelector('#reset')!.addEventListener('click', () => this.onReset());
    document.querySelector('#new')!.addEventListener('click', () => this.onNew());
    document.querySelector('#replay')!.addEventListener('click', () => { document.querySelector<HTMLElement>('#ending')!.hidden = true; this.onNew(); });
    for (const id of ['settings', 'credits']) document.querySelector(`#${id}-button`)!.addEventListener('click', () => { document.querySelector<HTMLElement>(`#${id}`)!.hidden = false; });
    document.querySelectorAll('.close').forEach(button => button.addEventListener('click', () => document.querySelectorAll<HTMLElement>('.dialog').forEach(d => d.hidden = true)));
    const quality = document.querySelector<HTMLSelectElement>('#quality')!; quality.value = settings.quality;
    quality.addEventListener('change', () => { settings.quality = quality.value as Settings['quality']; this.onSettings(); });
    document.querySelectorAll<HTMLInputElement>('#settings input').forEach(input => input.addEventListener('input', () => {
      (settings as unknown as Record<string, number | boolean>)[input.id] = input.type === 'checkbox' ? input.checked : Number(input.value); this.onSettings();
    }));
  }
  ready(continuing: boolean) { const play = document.querySelector<HTMLButtonElement>('#play')!; play.disabled = false; document.querySelector('#play-label')!.textContent = continuing ? 'CONTINUE JOURNEY' : 'ENTER THE SPHERE'; }
  ending() { this.menu.hidden = true; this.hud.hidden = true; document.querySelector<HTMLElement>('#ending')!.hidden = false; }
  playing(active: boolean, started = true) {
    this.menu.hidden = active; this.hud.hidden = !active;
    if (started) { document.querySelector('#play-label')!.textContent = 'RESUME JOURNEY'; document.querySelector<HTMLElement>('#reset')!.hidden = false; document.querySelector<HTMLElement>('#new')!.hidden = false; }
  }
  chapter(index: number, name: string, objective: string) {
    document.querySelector('#chapter-number')!.textContent = String(index + 1).padStart(2, '0');
    document.querySelector('#chapter-name')!.textContent = name; document.querySelector('#objective')!.textContent = objective;
  }
  cue(text: string, valid = false) { if (this.prompt.textContent !== text) this.prompt.textContent = text; document.querySelector('#reticle')!.classList.toggle('valid', valid); }
  message(text: string) { this.narrative.textContent = text; this.narrative.classList.add('visible'); }
  clearMessage() { this.narrative.classList.remove('visible'); }
  ability(text: string) { const element = document.querySelector('#ability')!; if (element.textContent !== text) element.textContent = text; }
  fade(value: number) { document.querySelector<HTMLElement>('#fade')!.style.opacity = String(value); }
  error(message: string) { const el = document.querySelector<HTMLElement>('#error')!; el.hidden = false; el.textContent = message; }
}
