import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Mesh, BoxGeometry, MeshBasicMaterial, DirectionalLight } from 'three';
import { ShadowCache } from '../src/render/ShadowCache.ts';

test('shadow cache invalidates for moving, hidden and removed casters and lights', () => {
  const scene = new Scene(), cache = new ShadowCache();
  const caster = new Mesh(new BoxGeometry(), new MeshBasicMaterial()); caster.castShadow = true;
  const light = new DirectionalLight(); scene.add(caster, light);
  const changed = () => { scene.updateMatrixWorld(); return cache.changed(scene); };
  assert.equal(changed(), true); assert.equal(changed(), false);
  caster.position.x = 2; assert.equal(changed(), true); assert.equal(changed(), false);
  light.position.z = 3; assert.equal(changed(), true);
  caster.visible = false; assert.equal(changed(), true); assert.equal(changed(), false);
  caster.visible = true; assert.equal(changed(), true);
  scene.remove(caster); assert.equal(changed(), true);
  caster.geometry.dispose(); (caster.material as MeshBasicMaterial).dispose();
});
