import { test } from 'node:test';
import assert from 'node:assert/strict';
import { perspectiveScale, screenMatch } from '../src/mechanics/scale/math.ts';
test('perspective preserves apparent size and rejects unsafe distances', () => {
  assert.equal(perspectiveScale(96, 24), .25);
  for (const distance of [0, -1, NaN, Infinity]) assert.equal(perspectiveScale(distance, 24), null);
  assert.equal(perspectiveScale(100, .01), null);
});
test('screen alignment rejects occluded/behind-camera and displaced anchors', () => {
  assert.equal(screenMatch({ x: 0, y: 0, z: .5 }, { x: .01, y: .01, z: .9 }), true);
  assert.equal(screenMatch({ x: 0, y: 0, z: 2 }, { x: 0, y: 0, z: .9 }), false);
  assert.equal(screenMatch({ x: .2, y: 0, z: .5 }, { x: 0, y: 0, z: .9 }), false);
});
