# INFINITUM performance delivery - 2026-09-07

The six-chapter gameplay, authored architecture and accepted scene composition remain intact. This pass optimizes rendering and delivery; it does not establish reference-perfect fidelity, WebGPU support or physical phone certification.

## Findings and changes

The exterior is primarily GPU/pixel-cost limited on this Intel UHD system. Initial isolated runs showed the largest useful reductions from bloom and render scale. Reflection/shadow work adds periodic scene redraws; cloud density previously evaluated many trigonometric hashes per pixel. Effect isolation is noisy on a shared GPU and is not an additive cost breakdown.

- Bloom: replace the 13-draw mip chain with a three-draw HDR threshold/blur/composite pipeline. Preserve restrained glow and final tone mapping.
- Clouds: replace repeated hash arithmetic with a shared 64-cubed R8 noise texture (256 KiB). Retain six world-space volumes and their placement; mobile uses four rather than six march samples.
- Reflections: retain planar reflections, refresh stationary views at 2 Hz and moving views/puzzles at tier-dependent intervals. Skip override-material passes.
- Shadows: retain the directional shadow, bound refresh cadence and map size. No new shadow-casting lights.
- Assets: Blender CLI exports meshopt-compressed GLB; Three.js uses its bundled local decoder. Module topology, contact colors, placement and collision contracts are retained.
- CPU: reuse motor temporaries, update debug text at 4 Hz, stop hidden-page rendering, cap menu/mobile rendering while retaining fixed 60 Hz gameplay simulation.
- Delivery: persisted Automatic/High/Balanced/Mobile settings, pixel budgets and adaptive scale. Mobile uses FXAA, safe-area UI and simultaneous movement/look/action touch controls.

## Measurements

Chrome / ANGLE D3D11 / Intel UHD, desktop viewport 1440 x 900. Automatic now selects Balanced on this hardware; this is a before/after delivery comparison, not an identical-preset shader microbenchmark. Queries are asynchronous EXT_disjoint_timer_query_webgl2 samples; the reported GPU value is an EWMA. CPU render timing measures submission, not total physics/input CPU time.

| Metric | Before | After |
| --- | ---: | ---: |
| Architectural GLB bytes | 2,812,300 | 1,483,824 (-47.2%) |
| Allocated texture objects in profiled city | 21 | 13 |
| Observed GPU time, effects enabled | 26.45 ms | 20.69-23.71 ms across runs; latest 21.95 ms |
| Latest peak rendered triangles | baseline sample 324,897 | 324,887 |
| Latest peak draw calls | baseline sample 169 | 159 |

Post-pass active gameplay RAF measurements varied between approximately 16.7 and 33.3 ms. Latest isolated test: median 33.3 ms, p95 33.7 ms, CPU render median 3.0 ms. The full real-movement route previously reported 16.92 ms at 90% render scale. All these observations are retained rather than selecting the best run as a guarantee. Safe mode also exhibited 33 ms browser cadence. Pointer lock and a 16.67 ms requested frame budget were verified in the latest profile, so the latest 30 FPS observation is not the menu cap. External scheduling/driver contention may contribute, but has not been isolated.

Effect-off results fluctuate (one cached-reflection sample was slower); do not infer a regression or precise per-effect savings from one EWMA. Navigation duration is not asset-ready/cold-load latency. Texture object counts do not measure VRAM bytes. No 60 FPS or phone-hardware guarantee is made.

## Quality settings

| Setting | High | Balanced | Mobile |
| --- | --- | --- | --- |
| DPR cap / pixel budget | 1.5 / 3.7M | 1.25 / 2.1M | 1 / 0.9M |
| Scene antialiasing | 4x MSAA | 2x MSAA | FXAA |
| Shadow map / cadence | 2048 / 33 ms | 1024 / 100 ms | 1024 / 100 ms |
| Bloom resolution factor | .75 | .5 | .35 |
| Moving reflection interval | 50 ms | 66 ms | 100 ms |
| Render target | 60 FPS | 60 FPS | 30 FPS |

Automatic uses coarse pointer for Mobile, Intel/low-core hardware for Balanced, otherwise High. These are heuristics; overrides persist. Dynamic resolution can reduce to 65% under sustained load. Geometry/puzzle state is independent of quality. Explicit Safe Graphics retains its existing reduced-effects recovery behavior.

## Verification and evidence

- Build and five unit tests passed.
- Full 15-test Chrome suite passed: real six-chapter route, scale, gravity, Echo, combined puzzle, finale, reset/recovery, stable resources, production boot and visuals.
- Targeted profiling/visual/render-budget rerun passed after adding active-play guards.
- Extended mobile test passed: simultaneous touch movement/look, Echo actions, cancellation, pause, portrait/landscape bounds, minimum 44 px buttons, persisted quality override and return to Automatic.
- `artifacts/optimization-before.json`: initial profile.
- `artifacts/optimization-profile.json`: latest active-play profile, including peak draw/triangle counts and tier/DPR.
- `artifacts/optimization-validation.log`: full regression output.
- `artifacts/bridge-depth-pass.png`, `bridge-depth-offset.png`, `chamber-depth-pass.png`: inspected desktop views.
- `artifacts/mobile-portrait.png`, `mobile-landscape.png`, `mobile-settings.png`: inspected Chrome touch-emulation layouts.

Run `npm run build`, `npm test`, `npm run test:browser`. Isolate rendering with `npx playwright test tests/browser/profile.spec.ts`. Close unrelated GPU workloads for more repeatable measurements. F3 displays frame, GPU, CPU submission, tier and draw diagnostics.

## Remaining risks / next work

1. Physical Android/iOS, Safari/Firefox and discrete GPU validation are outstanding. Emulated touch is not a phone GPU benchmark.
2. Profile cold cache asset-ready time, bandwidth throttling and actual memory bytes. Rapier's bundled WASM contributes to the large startup chunk; retain behavior until a measured loading change is justified.
3. Review reflection cadence under rapid movement on physical devices and long-session thermal behavior.
4. Resolve or characterize existing ANGLE shader warnings, including upstream FXAA diagnostics, on the browser matrix. Current tests observe no runtime page errors.
5. WebGPU is still unimplemented; keep WebGL2 as the verified path. Pacing and further visual expansion remain deferred under the latest user direction.
