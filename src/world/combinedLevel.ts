import { Group, Vector3 } from 'three';
import { Architecture, torus } from './Architecture';
import { Physics } from '../physics/Physics';
import { GravitySystem } from '../mechanics/gravity/GravitySystem';
import { ScaleSystem } from '../mechanics/scale/ScaleSystem';
import { EchoSystem } from '../mechanics/echo/EchoSystem';
import { plate } from './echoLevel';
import { inscription } from './Chamber';
import * as M from '../render/materials';

export function buildCombinedLevel(group: Group, physics: Physics) {
  const a = new Architecture(group, physics); a.tiles(0, 5, 20, 24);
  a.box(10, 11, -14, 1, 22, 36, M.pale, true);
  for (let y = 2; y < 22; y += 4) for (let z = 1; z > -32; z -= 4) {
    a.box(9.46, y, z, .03, 3.92, 3.92, M.floor);
    a.box(9.4, y - 1.95, z, .03, .024, 3.9, M.gold);
  }
  for (let y = 2; y < 13; y += 2) a.box(9.37, y, -2.5, .03, .35, .08, M.light);
  a.monolith(-8, -4, 17, 1.8); a.monolith(-8, 13, 20, 1.8);
  const plates = [plate(group, a, 'lock.stabilizer', new Vector3(-5, 0, 1))];
  const text = inscription('ONE OBSERVER CANNOT HOLD THREE TRUTHS', 14, 1); text.position.set(0, 4, -5); group.add(text);
  const ring = torus(.8, .025); ring.position.set(8.4, 12, -27); group.add(ring);
  const boundary = torus(2.2, .07, M.pale); boundary.position.set(8.4, 12, -28); group.add(boundary);
  a.finish();
  const gravity = new GravitySystem(true), echo = new EchoSystem(), scale = new ScaleSystem(physics, true);
  group.add(gravity.group, echo.group, scale.group);
  return { gravity, echo, scale, plates, gate: new Vector3(8.5, 17, -27), ring, boundary };
}
