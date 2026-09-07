import { Group, Vector3 } from 'three';
import { Architecture, torus } from './Architecture';
import { Physics } from '../physics/Physics';
import { GravitySystem } from '../mechanics/gravity/GravitySystem';
import * as M from '../render/materials';
import { inscription } from './Chamber';

export function buildGravityLevel(group: Group, physics: Physics) {
  const a = new Architecture(group, physics);
  a.tiles(0, 5, 20, 34);
  a.box(10, 11, -21, 1, 22, 28, M.pale, true);
  // Facade panels become the street. The collider stays simple and continuous.
  for (let y = 2; y < 22; y += 4) for (let z = -32; z < -7; z += 4) {
    a.box(9.47, y, z, .025, 3.9, 3.9, M.floor);
    a.box(9.42, y - 1.9, z, .03, .025, 3.9, M.gold);
  }
  a.box(-1, 22.5, -33, 23, 1, 20, M.stone, true);
  for (let x = -10; x < 10; x += 4) { a.box(x, 21.98, -33, 3.9, .02, 20, M.floor); a.box(x, 21.94, -33, .025, .025, 20, M.gold); }
  a.monolith(-8, -9, 12, 1.5); a.monolith(-8, 12, 15, 1.6);
  for (let y = 1; y < 19; y += 2) a.box(9.35, y, -12, .04, .5, .08, M.light);
  for (let z = -14; z > -28; z -= 2) a.box(9.35, 18.5, z, .04, .08, .5, M.light);
  const gate = new Vector3(-7, 20.5, -38);
  for (const s of [-1, 1]) { a.box(-7 + s * 2.4, 18.5, -39, .5, 7, .6, M.dark); a.box(-7 + s * 2.12, 18.5, -38.66, .025, 6.8, .03, M.light); }
  a.box(-7, 15, -39, 5.3, .5, .6, M.pale);
  const ring = torus(.6, .02); ring.position.set(-7, 20, -39); group.add(ring);
  const text = inscription('GRAVITY IS A DIRECTION. NOT A RULE.', 11, .8); text.position.set(0, 3, -10); group.add(text);
  a.finish(); const gravity = new GravitySystem(); group.add(gravity.group);
  return { gravity, gate, ring, spawn: new Vector3(0, .86, 13) };
}
