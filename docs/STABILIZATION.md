# Performance stabilization - 2026-09-07

## Follow-up: floor reflection lag during movement

The moving reflection cache was the direct cause of independent floor judder: it reused both an older image and projection for 50-100 ms while the main camera advanced. Removed that delay. Every camera pose/projection, reflective surface, puzzle-motion or target-size change now updates the reflection immediately. Only unchanged views retain the 500 ms cache. All material, reflection resolution, opacity and reflected-layer settings remain intact.

Validation: production build, seven unit tests and five targeted browser tests passed. The new browser test walks and turns through 60 frames in both chamber and city and verifies reflection updates every moving frame (allowing the first unchanged frame). Scale/collision/reset and reflection resource checks pass. Captures: `artifacts/reflection-motion-0.png` and `artifacts/reflection-motion-1.png`. This fixes temporal reflection lag; the increased refresh rate can cost more GPU time, so the previous performance numbers below predate this fix and are not current moving-view benchmarks.

The supplied 42-second, 30 FPS recording shows the Observer's Bridge scale interaction and the gravity chapter. Sampled recording frames are in `artifacts/stabilization-recording.jpg`. Direct browser measurements supplement the recording because its capture cadence cannot expose every game frame.

## Findings

The dominant cost was GPU work. Physics/motor/logic were generally fractions of a millisecond per fixed tick. The camera applied gravity easing during each physics step and again during rendering, making transition speed depend on the number of simulation steps. Unchanged city HUD text was also replaced twice per tick, generating over 1,000 DOM mutations during a short sweep.

## Changes

- Preserve scene MSAA while removing MSAA from bloom's full-screen output. Explicit composer buffer roles ensure scene geometry always uses the antialiased target.
- Cache unchanged directional shadows, invalidating for caster/light movement, visibility, instance-buffer changes and scene changes. Keep the same shadow resolution and visible shadow look. Reuse scene world matrices in reflection/subsequent passes.
- Advance gravity visual easing once per render frame; fixed-step gameplay camera queries synchronize position and matrices without advancing easing. Preserve interpolated player position and 60 Hz physics.
- Skip updates in the invisible chamber/city. Suppress unchanged HUD text writes and reuse scale-aim math/color objects.
- Use deadline-based mobile/menu frame limiting. Adaptive render scale changes in five-percentage-point steps, requires GPU pressure when timing exists and recovers after ten seconds of sustained headroom. No geometry/effect removal or material redesign.

## Local before/after sweep

Chrome, Intel UHD / ANGLE D3D11; 1440 x 900; High requested; 180 frames per scene with the same gentle camera sweep. Values are milliseconds. The existing automatic AO fallback remained active. Bridge/gravity/Echo stayed at full internal resolution; chamber was 90% before and 95% after. These sequential samples are affected by host/driver load and are not a controlled hardware benchmark.

| Scene | Average before / after | p95 before / after | p99 before / after | GPU EWMA before / after |
| --- | --- | --- | --- | --- |
| Chamber | 72.8 / 43.6 | 249.8 / 67.0 | 283.3 / 133.7 | 56.8 / 33.5 |
| Observer's Bridge | 54.6 / 32.9 | 166.5 / 50.1 | 183.4 / 50.2 | 49.1 / 29.2 |
| Gravity | 56.4 / 30.8 | 83.5 / 50.2 | 99.9 / 67.0 | 39.1 / 20.8 |
| Echo | 47.6 / 26.4 | 66.6 / 50.0 | 67.0 / 50.3 | 38.1 / 22.7 |

Camera render updates dropped from 694-791 calls per 180 frames to exactly 180. City HUD mutations dropped from 1,028-1,222 to 0-2 per sweep. The full real-movement journey separately reported about 20.15 ms at 90% scale. Render submission CPU timing is not total frame CPU time; asynchronous GPU timing is an EWMA, not a per-frame distribution. GC pauses and total VRAM bytes have not been separately attributed.

## Verification

- Production build and six unit tests passed, including shadow invalidation.
- Full 17-test browser run passed: real six-chapter movement, scale, gravity, Echo, combined puzzle, finale, production boot, reset/resources, touch/orientation and visual captures.
- Two targeted camera/adaptive tests passed afterward: physics queries do not advance gravity easing; equivalent elapsed render time produces equivalent rotation; scale recovers with headroom and does not shrink solely because browser cadence is slow when GPU cost is low.
- Before/after bridge screenshots were inspected: composition, architectural edges, materials, cloud depth, glow and reflective-floor identity remain visually close. Orb motion differs with elapsed time; this is not a bit-identical image assertion.
- Evidence: `artifacts/stabilization-before.json`, `stabilization-after.json`, and paired `stabilization-before-0.png` / `stabilization-after-0.png` and `-1.png` captures. Run `PERF_PHASE=before` or `after` through the environment when invoking `tests/browser/stabilization.spec.ts` to label future captures.

## Remaining work

The improvement is material, but the strict no-noticeable-lag success condition is not yet established. Chamber p99 remains high and full-resolution city performance on Intel UHD is still below a locked 60 FPS. Profile chamber shader/reflection and resize/first-use allocation costs further, with background GPU workloads controlled. Validate physical phones, thermal behavior, Safari/Firefox and discrete GPUs. Keep current visuals and mechanics while investigating; do not treat reduced render scale as completion of stabilization.
