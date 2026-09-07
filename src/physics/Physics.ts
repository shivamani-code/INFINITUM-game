import RAPIER from '@dimforge/rapier3d-compat';
import { Quaternion, Vector3 } from 'three';
export class Physics {
  world: RAPIER.World;
  environment: RAPIER.Collider[] = [];
  constructor() { this.world = new RAPIER.World({ x: 0, y: 0, z: 0 }); this.world.timestep = 1 / 60; }
  static async boot() { await RAPIER.init(); return new Physics(); }
  box(size: Vector3, position: Vector3, rotation = new Quaternion()) {
    const collider = this.world.createCollider(RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2).setTranslation(position.x, position.y, position.z).setRotation(rotation));
    this.environment.push(collider); return collider;
  }
  clearLevel() { for (const c of this.environment) if (c.isValid()) this.world.removeCollider(c, true); this.environment.length = 0; }
  step() { this.world.step(); }
}
export { RAPIER };
