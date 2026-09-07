# INFINITUM — project state

## Assessment
The supplied repository had no application, package configuration, assets beyond visual references, or existing gameplay to preserve. All original production materials remain intact. The full DOCX text is extracted in docs/PRODUCTION_BIBLE.txt.

## Current milestone
Reflection-motion fix: removed the 50/66/100 ms moving-view throttle that made the floor reflection lag behind movement. Camera, projection, surface, puzzle or render-target changes now refresh immediately; only an unchanged view uses the 500 ms cache. Reflection appearance and target resolutions are retained. Build, seven unit tests and five targeted browser tests passed, including actual walking/turning in chamber and city with per-frame reflection-update assertions. Moving reflections now cost a render each displayed frame; do not reintroduce temporal throttling to improve FPS.

Performance stabilization follow-up, 2026-09-07: see `docs/STABILIZATION.md`. Preserved scene design, effects, materials and gameplay. Removed redundant post-process MSAA, cached unchanged shadows, separated physics camera synchronization from visual gravity easing, suppressed unchanged HUD writes, skipped inactive-area updates and added gradual resolution recovery. Full 17-test browser run passed; two targeted camera/adaptive checks passed afterward, as did six unit tests and build. Bridge full-resolution p95 improved from 166.5 to 50.1 ms in the local sweep; chamber spikes remain. Do not claim universal lag-free or locked 60 FPS behavior.

### Previous optimization milestone
Optimization / performance / responsive delivery, 2026-09-07. The accepted six-chapter build and visual composition are preserved. Do not resume feature expansion or major visual redesign without a new request. The current optimization pass includes a cheaper bloom pipeline, sampled cloud noise, tiered rendering, reflection/shadow scheduling, compressed Blender assets and touch controls.

- Full 15-test Chrome browser suite and 5 unit tests passed; the browser suite covers the real six-chapter route, mechanics, production boot, resource disposal, visuals and mobile emulation.
- Profiling tests now wait for active gameplay before measuring. Intel UHD GPU timing improved from approximately 26.45 ms before the pass to 20.69-23.71 ms in repeated post-pass samples. Browser scheduling varied between approximately 30 and 60 FPS; no universal 60 FPS claim.
- Architecture GLB: 2,812,300 to 1,483,824 bytes (47.2% smaller), retaining mesh topology, baked contact colors and all modules. Blender CLI export and in-scene decoding are verified.
- GPU texture object count: 21 to 13 in the profiled city. This is an object count, not a VRAM byte measurement.
- Mobile: simultaneous touch movement/look, actions, pause, portrait/landscape and safe-area layout implemented. Chrome emulation is verified; physical Android/iOS performance and Safari remain unverified.
- See docs/PERFORMANCE.md for methodology, tier settings, evidence and remaining risks. Reference-perfect fidelity, measured 15-30 minute first-play pacing and WebGPU remain deferred, not completed.

## Blender pipeline — verified
- Blender 5.2.1 LTS is installed at `D:/project astra/blender.exe`. MCP is connected again as of the latest run and was used to create, revise and export real geometry. CLI/Python also successfully rebuilt the kit when MCP was disconnected.
- Reproducible source: `assets/blender/build_kit.py`; editable file: `assets/blender/infinitum-kit.blend`; runtime: `public/assets/models/infinitum-kit.glb`, approximately 1.48 MB (meshopt compressed). `preview_kit.py` creates an independent Blender gallery in `infinitum-kit-preview.blend`; rendered evidence is `artifacts/blender-kit-gallery.png`.
- Modules: monolith, tower, clustered hero tower, wall bay, stone vault/arch, structural ring, portal, sphere support, floating platform, suspended district terrace, panel, trim, hooded sentinel, distant LODs and separate collision proxies.
- `src/world/AssetKit.ts` loads once, bakes GLTF transforms, maps shared materials and instances geometry. Existing Rapier collision remains authoritative; proxies are exported but deliberately not added to existing routes.
- In-scene screenshots and browser assertions verify imported monolith/tower instances. Latest Blender export has no mesh-validation warnings. Original Blender default scene and project reference files are preserved.

## Current visual changes
- Chamber: modeled facade bays, buttresses, masonry vaults, apse ring, hooded sculptures, recessed monoliths, support dais, inset floor panels, portal frame and trim. Added localized sphere lighting, low mist and reflective sphere coating.
- City: clustered central hero tower with four separated subordinate spires and a visible crown, detailed skyline modules, arch bridges, solid segmented structural rings, floating fragments, cloud banks and finer sky clouds. Bridge floor insets and edge trim leave the central puzzle lane clear.
- Shared stone has restrained vein/roughness variation and course joints. Bloom remains restrained; geometry carries the silhouette.
- Distant LODs and separate shadow batches reduced the city rendering workload. Adaptive AO disables under sustained load before dynamic resolution reduces pixel cost. This is a local Intel UHD performance compromise, not a universal 60 FPS claim.
- Both chamber and city material/lighting variants are compiled during loading before Play is enabled, reducing first-interaction shader stalls.

## Implemented
- TypeScript/Vite/Three.js WebGL 2, Rapier capsule motor at 60 Hz, acceleration, jump buffer/coyote time, local gravity, pointer-lock pause and resize.
- White Chamber with Blender architecture/sculptures, orbital sphere, polished floor reflection, procedural material detail, atmosphere and sphere crossing.
- Authored perspective bridge with capture, camera alignment, bounded transform, physical collision commit and reset.
- Wall and ceiling gravity traversal with eased camera orientation and two anchors.
- Fixed-tick Echo recording (18 seconds, three Echoes), semantic plate events, interpolated playback, retained final pose and two-seal gate.
- Combined lock: Echo stabilizer enables gravity; wall viewpoint enables key scaling; Curator correction moves the final exit.
- World collapse into a miniature city, surrounding containers, final interaction, credits and replay.
- Procedural Web Audio with reverb; local fonts; minimal menus/HUD; persisted controls/audio/comfort/quality settings; chapter checkpoints and fall recovery.
- Rendering path: MSAA, directional shadows, reduced-resolution adaptive city GTAO, restrained bloom. Safe path removes heavy effects. Dynamic resolution responds to sustained slow frames.

## Verification
- `npm run build` and five unit tests pass.
- Final depth-pass validation: 13/13 browser tests passed (3.2 minutes), logged at `artifacts/depth-validation.log`. Includes in-scene baked-color validation, offset camera capture, reflection texture stability across resets, safe-mode effect disabling, and the full real-locomotion journey.
- Visual review then caught globally enabled vertex colors darkening procedural meshes. Fixed with cached imported-material clones, rebuilt production, and passed four targeted visual/perspective/reset/performance tests (`artifacts/depth-material-validation.log`). Final captures were re-inspected.
- Current Intel UHD depth-pass samples: visual capture 26.5 ms at 90% resolution, AO off; rich path 27.6–33 ms across warmup/resolution adaptation; safe 16.7 ms at 80%. Rendered work ranges 273,725–324,897 triangles depending on reflection refresh, below the unchanged 450k budget. Full-route sample 19.8 ms at 80%. These are observed samples, not a locked framerate guarantee.
- Latest full 13-test browser suite passes, including the complete route driven by real locomotion, all mechanics, finale/replay, CPU-throttled recording, reset/resource checks, production boot and imported-asset/render-budget checks.
- Production boot has no external asset requests or development hooks. Both upgraded areas were captured and visually inspected after the final export. Persistent captures are in `artifacts/`.
- Previous Blender-pass profiling (before the new depth pass) on Intel UHD: full-route sample ~17.4 ms/frame at 80% resolution; standalone city ~22.9 ms at 90% resolution, AO disabled, 106 calls and 179,019 triangles. Safe mode sampled ~16.7 ms. Report resolution/AO with frame time; the older prototype's 8.4 ms figure is obsolete.
- Two isolated tests initially raced mouse capture during cold shader loading. They now wait for visible HUD and confirmed pointer lock; finale and gravity retests pass. Gameplay was not changed to accommodate the tests.
- Repeated vault resets preserve collider count and stable geometry count.
- Dev server: http://127.0.0.1:5173. Built preview: http://127.0.0.1:4173. Check listeners before use; test-managed servers may stop after a suite.

## Production target
One transforming megaspace; sphere crossing; authored perspective bridge; local gravity traversal; fixed-tick temporal Echoes; combined lock; Curator correction; collapse and Last Scale reveal. Original references control silhouette, scale, materials and composition.

## Remaining production gaps
- Visual fidelity remains below the cinematic sheets despite the verified Blender kit. Refine architecture proportions, hero lighting/reflections and cloud volume/readability in the first two areas. Later chapters retain existing layouts and share improved reusable architecture; they have not received a dedicated art pass.
- First-time player testing, accessibility/readability review, puzzle difficulty and 15–30 minute pacing are unverified. Automated known-solution traversal is much shorter; do not pad it with walking.
- WebGPU, Firefox/Safari, mobile, and lower-end physical hardware are unvalidated. Current working backend is WebGL 2.
- Audio is procedural rather than a composed/adaptive score. Separate music/effects buses and additional accessibility options remain.
- Vite warns about large dependency chunks. Application code is ~59 KB; Rapier's embedded WASM is ~2.85 MB raw / 1.09 MB gzip. It is split from Three.js and app code for independent caching. Consider a separate WASM asset only after measuring real load bottlenecks.
- No public deployment or external publishing has been performed.

## Immediate continuation
Read TODO.md and docs/QA.md. Stable URLs are dev http://127.0.0.1:5173 and built preview http://127.0.0.1:4173; do not assume an old 5174 tab is current. Preserve `artifacts/white-chamber.png` and `observer-bridge.png` as pre-polish baselines. New captures are `chamber-blender-pass.png` and `city-blender-pass.png`. Run the existing journey test before changing level topology. Capture after visual changes; build success alone is not visual QA.
