# INFINITUM: The Last Scale

A desktop browser puzzle experience about perspective, local gravity and cooperating with your past self. Built from the supplied Production Bible and visual references, using authored procedural architecture rather than image backdrops.

## Run

Requires Node.js 22.12+ (developed with Node 24) and a desktop browser with WebGL 2.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Click **Enter the Sphere** to capture the mouse. Audio starts after this gesture. `Esc` releases the mouse and pauses gameplay.

```sh
npm run build
npm run preview
npm test
npm run test:browser
```

Browser tests start the development and production-preview servers automatically, or reuse existing ones. Run `npm run build` first if reusing a preview server. On Windows the default browser is the local Chrome executable; set `CHROMIUM_PATH` to override it. On other platforms, install the test browser with `npx playwright install chromium`.

## Controls

| Input | Action |
| --- | --- |
| WASD / mouse | Move / look in the current gravity frame |
| Shift | Sprint |
| Space | Jump |
| E / left click | Interact or confirm |
| Q / right click | Capture a scale object; begin recording in temporal spaces |
| R | Finish a recording and leave an Echo; otherwise restart the current room |
| C | Clear Echoes |
| Esc | Pause, settings, restart checkpoint, new journey |
| F3 | Development performance overlay |

Scale capture is a toggle. Align the captured object's center and apparent size with the outlined socket before confirming. Observation circles mark the intended viewing region. Gravity anchors require proximity. Echoes replay their recorded route, then hold their final pose until cleared or the room is reset. Recordings are capped at 18 seconds and three simultaneous Echoes.

## Current route

White Chamber → sphere crossing → observer's bridge → wall and ceiling traversal → two-Echo vault → three-rule lock and Curator correction → collapse, Last Scale reveal and credits.

Progress saves at chapter boundaries in local browser storage. Reload restores the chapter's authored starting state, not an in-progress recording. Settings persist separately. No account or network assets are required after the app is served.

## Architecture

- `src/app`: progression and transformations
- `src/player`, `src/input`, `src/physics`: fixed-step Rapier character motor
- `src/mechanics`, `src/timeline`, `src/puzzle`: scale, gravity, Echo and synthesis rules
- `src/world`: modular instanced architecture and authored rooms
- `src/render`: WebGL 2 rendering, materials, reflections and postprocessing
- `src/audio`, `src/ui`: procedural sound, menus, settings and contextual feedback
- `tests`: unit contracts and browser gameplay checks

The working renderer is WebGL 2. WebGPU is not implemented or claimed. This is an initial playable vertical slice; see PROJECT_STATE.md for tested scope and remaining production gaps.

## Production sources

Original documents and reference images are preserved in the root and `images-refrence/`. `docs/PRODUCTION_BIBLE.txt` is a text extraction for development. The original DOCX remains authoritative.

## Third-party notices

Three.js — MIT; Rapier — Apache-2.0; TypeScript — Apache-2.0; Vite — MIT; Playwright — Apache-2.0. Cormorant Garamond and Manrope fonts — SIL Open Font License 1.1, distributed locally via Fontsource. See installed package license files for full terms.
