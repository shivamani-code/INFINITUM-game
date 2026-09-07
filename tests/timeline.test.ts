import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TimelineRecorder, TimelinePlayback } from '../src/timeline/Timeline.ts';
import { parseCheckpoint } from '../src/world/checkpoint.ts';
test('recordings are bounded, copied and serialize semantic events', () => {
  const r = new TimelineRecorder(); const p: [number, number, number] = [1, 2, 3];
  r.add(p, [0, 1, 0], 0, true); p[0] = 999;
  assert.equal(r.samples[0].position[0], 1); r.event('interact', 'vault.left');
  for (let i = 0; i < 1200; i++) r.add([i, 0, 0], [0, 1, 0], 0, true);
  const track = r.finish()!; assert.equal(track.samples.length, 1080);
  assert.equal(JSON.parse(JSON.stringify(track)).events[0].entityId, 'vault.left');
});
test('playback interpolates and holds final pose without drifting', () => {
  const r = new TimelineRecorder(); for (let i = 0; i < 20; i++) r.add([i, .85, 0], [0, 1, 0], 0, true);
  const playback = new TimelinePlayback(r.finish()!);
  assert.equal(playback.sample(4.5).position[0], 4.5);
  assert.equal(playback.sample(10000).position[0], 19);
  assert.equal(playback.sample(-1).position[0], 0);
});
test('checkpoint rejects corrupt, incompatible and out-of-range data', () => {
  for (const raw of ['bad', '{}', '{"version":2,"chapter":3}', '{"version":1,"chapter":100}', '{"version":1,"chapter":1.5}']) assert.equal(parseCheckpoint(raw), 0);
  assert.equal(parseCheckpoint('{"version":1,"chapter":4}'), 4);
});
