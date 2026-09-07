import { Group, Mesh, SphereGeometry, Vector3 } from 'three';
import { PlayerMotor } from '../../player/PlayerMotor';
import { torus } from '../../world/Architecture';
import * as M from '../../render/materials';

export interface GravityAnchor { id: string; position: Vector3; up: Vector3; visual: Group; used: boolean }
export class GravitySystem {
  group = new Group(); anchors: GravityAnchor[] = []; cooldown = 0;
  constructor(combined = false) {
    if (combined) this.add('lock.wall', new Vector3(7.4, 1.4, -4), new Vector3(-1, 0, 0));
    else {
      this.add('canyon.wall', new Vector3(7.4, 1.4, -10), new Vector3(-1, 0, 0));
      this.add('canyon.ceiling', new Vector3(8.6, 18.5, -27), new Vector3(0, -1, 0));
    }
  }
  private add(id: string, position: Vector3, up: Vector3) {
    const visual = new Group(); const ring = torus(.65, .022); visual.add(ring);
    const shell = torus(.88, .009, M.gold); shell.rotation.y = .7; visual.add(shell);
    const core = new Mesh(new SphereGeometry(.13, 16, 12), M.light); visual.add(core);
    visual.position.copy(position); this.group.add(visual); this.anchors.push({ id, position, up, visual, used: false });
  }
  nearby(position: Vector3) { return this.anchors.find((a, i) => !a.used && (i === 0 || this.anchors[i - 1].used) && a.position.distanceTo(position) < 3.5); }
  activate(player: PlayerMotor, allowed = true) {
    const anchor = this.nearby(player.position);
    if (!anchor || this.cooldown > 0 || !allowed) return false;
    anchor.used = true; this.cooldown = 1.25; player.setGravity(anchor.up); return true;
  }
  update(dt: number, cameraPosition: Vector3) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    for (const anchor of this.anchors) {
      anchor.visual.lookAt(cameraPosition);
      anchor.visual.children[1].rotation.z += dt * .15;
      anchor.visual.scale.setScalar(anchor.used ? .65 : 1);
    }
  }
  get solved() { return this.anchors.every(a => a.used); }
}
