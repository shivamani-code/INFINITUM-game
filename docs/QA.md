# Verification ledger

## Passed at implementation checkpoints
- TypeScript check and Vite production build.
- Perspective ratio bounds and projected alignment unit tests.
- Bounded timeline, copied samples, semantic event serialization and final-pose playback unit tests.
- Corrupt/incompatible checkpoint rejection.
- Browser: opening render, movement, jump/landing, pause and resize.
- Browser: sphere crossing, scale rejection/commit, physical bridge crossing and reset.
- Browser: wall movement, jump away from wall, ceiling landing and gravity reset.
- Browser: two recordings, two plate occupancy, gate opening, clear and closure.
- Browser: combined Echo → gravity → scale dependency and shifted exit.
- Browser: collapse, final interaction, credits and replay.

## Additional passed checks
- Complete route with actual locomotion and no chapter skips/teleports, from chamber to credits.
- Reload recovery, safe graphics and fall recovery.
- Sixfold CPU throttling: bounded consecutive fixed-tick samples and successful Echo creation.
- Repeated reset: stable collider and geometry counts.
- Production bundle: zero external asset requests, successful pointer lock and pause, development hooks absent.
- Latest city visual pass: ~8.4 ms/frame, 170 calls, 163,944 triangles at full resolution on local Chrome. MSAA/shadows/GTAO/bloom enabled.

## Review still needed
- Unassisted new-player playtest and actual first-time duration.
- Physical low-end hardware, Firefox/Safari and any future WebGPU backend.
- Production art fidelity, accessibility and audio mix.

## Scope of evidence
Automated checks validate mechanics and progression; they do not establish a first-time player's understanding or target playtime. Browser frame-time samples are local measurements, not a universal hardware guarantee. WebGPU and non-Chromium browsers have not been validated.
