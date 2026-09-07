# Production queue

## NOW
- Reflection motion delay fixed and covered by per-frame walking/turning checks. Preserve immediate refresh on camera movement; future reflection performance work must reduce render cost, not skip moving-camera updates.
- Stabilization follow-up: investigate remaining chamber GPU spikes (latest sweep p99 133.7 ms); keep the accepted appearance. See docs/STABILIZATION.md and artifacts/stabilization-before.json / stabilization-after.json.
- Keep the new camera-easing, shadow-cache and adaptive-recovery regression checks. The six-chapter journey and mobile checks pass after stabilization.
- Preserve the accepted art, architecture, controls and six-chapter puzzle flow while validating the optimization pass.
- Benchmark on physical Android/iOS and a discrete GPU; Chrome touch emulation does not establish phone performance or Safari compatibility.
- Measure cold cache asset-ready latency and memory under realistic network throttling. Navigation duration is not complete game startup time.
- Collect repeatable GPU and frame-time distributions with other GPU workloads closed; this host's browser cadence varies between 30 and 60 FPS.
- Inspect cached reflections during rapid camera motion on hardware and tune update cadence if visible lag outweighs the savings.
- Preserve the 450k rendered-triangle budget and reset-resource checks; do not raise thresholds to conceal regressions.

## COMPLETED IN OPTIMIZATION PASS
- Async GPU timing and isolated effect profiling, with active-play guards.
- Three-draw bloom replacing the larger mip chain; cloud noise lookup texture; bounded shadow/reflection cadence.
- Auto/High/Balanced/Mobile presets, pixel budgets, mobile FXAA, adaptive scale and 30 FPS mobile/menu cap.
- Blender meshopt export and local decoder; no architecture removed.
- Touch movement/look/action controls, orientation-aware UI, cancellation and persisted quality settings.
- Full gameplay regression suite, production boot and visual captures.

## DEFERRED UNTIL PERFORMANCE VALIDATION
- Refine sphere crossing and collapse choreography; improve Echo silhouette and locomotion animation.
- Preserve the current mechanics and puzzle scope during fidelity work.
- Add optional hints and additional accessibility controls; separate audio buses.

## LATER
- Evaluate WebGPU/TSL and test on physical lower-end hardware plus Firefox/Safari.
- Validate 15–30 minute first-play pacing; compose adaptive audio.
- Profile cold loading and decide whether to externalize embedded Rapier WASM.
- Deployment hardening and final release QA.

## CUT
- Open world, combat, inventory, multiplayer, paid asset dependency.

## VERIFIED BASELINE
- Sep 7 depth pass: 13 browser tests and five unit tests pass; current captures and full verification log are in artifacts. Blender contact shading and suspended terraces are integrated.
- Blender MCP and CLI export, GLB integration, instanced architectural kit, distant LODs and in-scene asset assertions.
- Complete six-chapter route, all three mechanics, combined lock, correction, ending and replay.
- Fixed-step motor, collisions, checkpoints, fall/reset recovery and safe graphics.
- Unit contracts, full locomotion route, throttled recording, resource stability and production boot.
