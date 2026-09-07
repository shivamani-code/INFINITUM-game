import { Color, Group, Mesh, MeshPhysicalMaterial, SphereGeometry, Vector3 } from 'three';
import { Architecture, torus, plinth } from './Architecture';
import { Physics } from '../physics/Physics';
import type { City } from './City';
import type { Renderer } from '../render/Renderer';
import * as M from '../render/materials';

export class Finale {
  group = new Group(); containers = new Group(); orb = new Group(); phase = 0; time = 0;
  gate = new Vector3(0, 1.5, -18); startCamera = new Vector3(); ring: Mesh;
  private originalOrb = new Vector3();
  constructor(physics: Physics) {
    const a = new Architecture(this.group, physics); a.tiles(0, -4, 14, 44);
    for (const s of [-1, 1]) { a.monolith(s * 6, -12, 14, 1.3); a.monolith(s * 6, 4, 18, 1.6); }
    const pedestal = plinth(3.6, .4); pedestal.position.set(0, .2, -21); this.group.add(pedestal);
    const shell = new Mesh(new SphereGeometry(3, 64, 48), new MeshPhysicalMaterial({ color: 0x8fb4cb, metalness: .7, roughness: .08, transparent: true, opacity: .2, depthWrite: false })); this.orb.add(shell);
    this.ring = torus(3.03, .025); this.orb.add(this.ring);
    const orbit = torus(3.8, .016, M.gold); orbit.rotation.x = 1.2; this.orb.add(orbit);
    this.orb.position.set(0, 3.6, -21); this.group.add(this.orb);
    const small = new Architecture(this.orb); for (let i = -2; i <= 2; i++) small.tower(i * .7, -1.6, -.3, 1 + Math.abs(Math.sin(i * 4)) * 1.9, .25); small.finish();
    a.finish();
    const container = new Architecture(this.containers);
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
      container.tower(s * 36, -15, 20 - i * 35, 110, 8);
      container.monolith(s * 25, -10 - i * 30, 35, 3, -8);
    }
    for (const x of [-22, 22, -44, 44]) {
      const dome = new Mesh(new SphereGeometry(5, 40, 24), M.sphereMaterial()); dome.position.set(x, 7, -48 - Math.abs(x)); this.containers.add(dome);
      const ring = torus(5.1, .025); ring.position.copy(dome.position); this.containers.add(ring);
      container.box(x, -1, dome.position.z, 9, 5, 9, M.dark);
    }
    container.box(0, -4, -45, 130, 2, 180, M.floor); container.finish();
    this.containers.position.y = -120; this.containers.visible = false; this.group.add(this.containers);
  }
  begin(renderer: Renderer, city: City) { this.phase = 1; this.time = 0; this.startCamera.copy(renderer.camera.position); this.originalOrb.copy(city.orb.position); this.containers.visible = true; }
  update(dt: number, renderer: Renderer, city: City) {
    this.orb.children[2].rotation.z += dt * .05;
    if (this.phase === 0) return;
    this.time += dt;
    const t = Math.min(1, this.time / 8), ease = t * t * (3 - 2 * t), shrink = Math.exp(-ease * 4);
    city.district.scale.setScalar(shrink); city.district.position.set(0, ease * 3.5, -21 * ease); city.district.rotation.z = Math.sin(t * Math.PI) * .6;
    city.orb.scale.setScalar(shrink); city.orb.position.lerpVectors(this.originalOrb, new Vector3(0, 4, -23), ease);
    this.containers.position.y = -120 * (1 - ease);
    renderer.camera.position.lerpVectors(this.startCamera, new Vector3(0, 8.5, 12), ease);
    renderer.camera.lookAt(0, 4.4, -21);
    renderer.fill.intensity = .8 - .4 * ease; renderer.sun.intensity = 3 - ease;
    if (this.time >= 8 && this.phase === 1) this.phase = 2;
  }
  restore(city: City) { city.district.scale.setScalar(1); city.district.position.set(0, 0, 0); city.orb.scale.setScalar(1); city.orb.position.copy(city.orbHome); }
}
