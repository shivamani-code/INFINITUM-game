import { Group, Mesh, MeshBasicMaterial, BoxGeometry, Vector3 } from 'three';
import { Architecture, torus } from './Architecture';
import { Physics } from '../physics/Physics';
import { EchoSystem } from '../mechanics/echo/EchoSystem';
import { inscription } from './Chamber';
import * as M from '../render/materials';

export interface Plate { id: string; position: Vector3; ring: Mesh; material: MeshBasicMaterial }
export function plate(group: Group, a: Architecture, id: string, position: Vector3): Plate {
  a.box(position.x, position.y + .04, position.z, 2.3, .08, 2.3, M.dark);
  const material = new MeshBasicMaterial({ color: 0x88b8cc });
  const ring = torus(.83, .025, material); ring.rotation.x = -Math.PI / 2; ring.position.copy(position).y += .09; group.add(ring);
  const mark = torus(.5, .01, M.gold); mark.rotation.x = -Math.PI / 2; mark.position.copy(position).y += .09; group.add(mark);
  return { id, position, ring, material };
}
export function buildEchoLevel(group: Group, physics: Physics) {
  const a = new Architecture(group, physics); a.tiles(0, -8, 22, 46);
  for (const s of [-1, 1]) {
    a.box(s * 11.5, 8, -8, 1, 16, 46, M.stone, true);
    for (let z = 10; z > -30; z -= 8) { a.monolith(s * 9.6, z, 12, 1.4); a.box(s * 10.8, 11, z, .5, 22, 1, M.pale); }
    a.box(s * 7.3, 4, -19, 7.4, 8, 1, M.stone, true);
    a.box(s * 3.5, 4, -18.4, .035, 8, .04, M.blue);
  }
  a.box(0, 8, -19, 7.4, .5, 1, M.pale);
  const door = new Mesh(new BoxGeometry(7, 8, .55), M.dark); door.position.set(0, 4, -19); group.add(door);
  const doorCollider = physics.box(new Vector3(7, 8, .55), door.position);
  const plates = [plate(group, a, 'vault.left', new Vector3(-5, 0, -3)), plate(group, a, 'vault.right', new Vector3(5, 0, -3))];
  const echo = new EchoSystem(); group.add(echo.group);
  const text = inscription('THE COPY REMEMBERS YOU', 13, 1); text.position.set(0, 5.5, -18.65); group.add(text);
  const ring = torus(.7, .028, M.blue); ring.position.set(0, 2, -27); group.add(ring);
  for (const plate of plates) {
    const line = new Mesh(new BoxGeometry(.025, .025, 13), M.blue); line.position.set(plate.position.x, .012, -11); group.add(line);
  }
  a.finish(); return { echo, plates, door, doorCollider, gate: new Vector3(0, 1.5, -26), ring };
}
