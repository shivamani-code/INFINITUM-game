import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, PerspectiveCamera, Scene } from 'three';
import type { Reflector } from 'three/addons/objects/Reflector.js';
import { budgetReflection } from '../src/render/reflectionBudget.ts';

test('moving reflections refresh immediately; only unchanged views are cached', () => {
  let draws = 0, motion = 0;
  const target = { width: 512, height: 512 };
  const reflector = { matrixWorld: new Matrix4(), forceUpdate: false,
    getRenderTarget: () => target, onBeforeRender: () => { draws++; } } as unknown as Reflector;
  budgetReflection(reflector, () => motion);
  const camera = new PerspectiveCamera(), scene = new Scene();
  const render = () => (reflector.onBeforeRender as Function)(null, scene, camera);
  render(); assert.equal(draws, 1);
  render(); assert.equal(draws, 1);
  // Same synchronous turn: no 50/66/100 ms timer may delay movement.
  for (let i=1;i<=10;i++) { camera.position.x=i*.01; camera.updateMatrixWorld(); render(); }
  assert.equal(draws, 11);
  camera.fov=75; camera.updateProjectionMatrix(); render(); assert.equal(draws, 12);
  reflector.matrixWorld.makeTranslation(0,1,0); render(); assert.equal(draws, 13);
  motion++; render(); assert.equal(draws, 14);
  target.width=384; render(); assert.equal(draws, 15);
  render(); assert.equal(draws, 15);
});
