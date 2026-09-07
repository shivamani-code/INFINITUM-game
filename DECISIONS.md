# Production decisions

## Reflection movement correction
- User-visible floor lag came from the previous 50-100 ms moving-view cache. Supersede all prior moving reflection cadence settings: redraw every changed camera frame at existing target quality. Cache only a fully unchanged camera/projection/surface/puzzle state for up to 500 ms. Resize and force-update also invalidate it.
- Accepted tradeoff: higher moving-view GPU cost in exchange for correct temporal alignment. Do not describe lower-frequency moving reflections as visually equivalent; the user observed the lag.

## Performance stabilization follow-up, 2026-09-07
- Preserve geometry, materials, lighting and signature effects. Keep MSAA on the scene target only; full-screen bloom composition writes to a single-sample buffer. Reset composer buffer roles every frame.
- Refresh shadows when visible casters/light transforms or instance-buffer versions change, including scene/reset changes. Fixed directional shadow frusta do not need a redraw merely because the player turns. Future animated alpha/displacement shadow materials or moving light targets must explicitly invalidate the cache.
- Apply gravity-camera easing once per displayed frame. Physics-time queries synchronize camera position/matrices without advancing easing. Keep fixed 60 Hz physics and render interpolation.
- Retain mobile 30 FPS target with a deadline-based limiter to avoid accumulated scheduling drift. Scale reductions require GPU pressure when timing is available; recover resolution gradually after sustained headroom. AO fallback remains the prior behavior.
- Compare local frame-time distributions, not only average FPS. The host has variable GPU load; improved samples are not a universal performance guarantee. The recording is 30 FPS and cannot expose every game-frame spike.

- Production Bible is primary; reference sheets guide concrete visual composition. First person follows the Bible even where sheets depict a traveler for scale.
- No existing code was present. Preserve the original documents/images; build a modular app alongside them.
- Start with WebGLRenderer, isolated in a rendering module. Custom GLSL, stable postprocessing and planar reflection are immediately testable; do not claim WebGPU support until implemented and verified. See https://threejs.org/manual/en/webgpurenderer.
- Rapier handles capsule collision and ground queries; the motor owns acceleration, gravity frame and comfort. See https://rapier.rs/docs/user_guides/javascript/character_controller/.
- Production polish uses a mandatory hybrid pipeline: Blender-authored GLB modules for architecture; Three.js instances and animates them. The initial MCP export and in-scene import were verified. Blender CLI continues reproducible exports when MCP is disconnected. Existing Rapier colliders and authored routes remain unchanged.
- Only persist chapter-stable state. Echo paths are zone-local fixed-tick data, never full-world snapshots.
- Echoes hold the last recorded pose until cleared. This makes the first temporal puzzles readable and avoids brittle precision timing. Three Echoes maximum; recordings are limited to 18 seconds.
- The combined lock requires an Echo-held stabilizer at gravity activation and scale commit. The correction shifts the exit rather than invalidating a successful solution or introducing a new rule.
- Gravity uses real player-local up and capsule rotation. World-group motion is reserved for correction/collapse; camera roll is eased and can be shortened through reduced-motion settings.
- Repeated geometry and materials are explicitly shared; room-specific geometry, materials and text maps are disposed on rebuild. Reset-resource checks protect this contract.
- Application, Three.js and Rapier bundles are separated. The remaining bundle warning reflects the known embedded WASM size, not an unresolved build failure.
- First polish milestone is restricted to Chamber and Observer’s Bridge/City. Shared architecture can improve later chapters incidentally; no mechanic or puzzle expansion is authorized while fidelity remains unfinished.
- Distant modules use Blender-decimated variants and do not enter the local shadow pass. Adaptive rendering drops expensive AO before reducing resolution, based on measured Intel UHD frame cost. Preserve safe mode and report quality settings alongside performance numbers.
- Collision proxies ship with the kit but are excluded from visual loading. Existing colliders stay authoritative until an intentional topology change needs a proxy; decorative relief is kept out of the central puzzle lane.
- Evaluate Blender source-scene transforms before building the separate preview gallery. Never use inactive-scene matrices for asset review or move authoring origins just to lay out a gallery.
- Precompile chamber and city lighting/material variants during loading, before enabling Play, rather than charging cold shader compilation to first interaction.


## 2026-09-07 — Observer’s Bridge depth benchmark
The new Sep 7 image is the strongest exterior composition reference. Existing scale source/target transforms, colliders, controls and chapter progression remain authoritative gameplay contracts. Larger monoliths, sphere, city layers and cloud volumes are visual changes only.

Use bounded raymarched cloud meshes rather than a background screenshot. Use a selective, softened planar floor reflection (near geometry + sky + sphere), refreshed at most 20 times/sec. Full-city reflection exceeded the 450k triangle budget and cost over 40 ms/frame on Intel UHD. The terrace omits GTAO; safe graphics removes reflection and volumes. Imported architecture remains shared and instanced, with per-instance tint for spatial layering.

Blender MCP was confirmed connected and used to modify/re-export the real monolith kit; CLI saved the reproducible canonical blend. Corrected the plinth’s Z-up dimensions and refined rails/sigil placement. Collision proxies remain exported but are not added to the established physical route.


### Contact shading and suspended districts
Added a suspended terrace asset to break the repetitive vertical skyline with cornices, horizontal landings and descending piers. Blender bakes local ambient occlusion into vertex colors using eight hemisphere rays per vertex, at a 2.2m local range. Export uses `export_vertex_color='ACTIVE'` (the default material-based export omitted the attribute). Shared Three materials enable vertex colors; this combines with instance tint and needs no runtime AO pass. This is local crevice shading, not baked global illumination or inter-building shadowing.

The sphere’s home transform is now stored on City and reused by finale restoration, avoiding separate magic coordinates. No collision or mechanic transforms changed.


Baked-color materials are cached clones used only by imported geometry carrying a color attribute. Procedural geometry keeps the original materials; globally enabling vertex colors caused black procedural rings/frames and was caught in visual review. The clones retain the procedural surface shader hooks and shared-resource lifecycle.

## Optimization delivery - 2026-09-07
- Latest user direction supersedes visual expansion: retain the accepted composition and mechanics, optimize delivery first.
- Reduce effect cost rather than delete the effect: three-pass separable HDR bloom, shared 64-cubed R8 cloud noise and cadence-limited planar reflections. All six cloud volumes and hero architecture remain.
- Quality presets tune render pixels, MSAA/FXAA, shadow maps, cloud samples and reflection targets. Automatic chooses Mobile on coarse pointers, Balanced on Intel/low-core hardware, otherwise High; user overrides are persisted. Hardware inference is a heuristic, not a benchmark.
- Mobile targets 30 FPS with the same fixed 60 Hz gameplay simulation; desktop targets 60. Hidden pages suspend rendering and clear input. Touch controls drive the existing input/motor and puzzle actions.
- Blender meshopt compression changes storage, not mesh detail; decode locally through Three.js. Keep canonical Blender source and baked contact colors.
- Use asynchronous disjoint GPU queries where available. CPU render time is submission time, not total simulation time. Keep browser frame scheduling, GPU cost and asset size separate in reports.
- A test must wait for pointer lock/active frame budget before profiling desktop gameplay. Single-frame draw counts vary with shadow/reflection cadence; retain peak counts in profiles.
- WebGL2 remains the verified renderer. WebGPU, physical phone/Safari validation and measured first-play pacing are not claimed complete.
