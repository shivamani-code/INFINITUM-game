import { BoxGeometry, Color, EdgesGeometry, Group, LineBasicMaterial, LineSegments, Mesh, PerspectiveCamera, Vector3 } from 'three';
import { Physics, RAPIER } from '../../physics/Physics';
import { screenMatch, perspectiveScale } from './math';
import { dark, gold, light } from '../../render/materials';
import { torus } from '../../world/Architecture';

export class ScaleSystem {
  group = new Group(); object = new Group(); socket = new Group();
  source = new Vector3(0, -6.14, -88); target = new Vector3(0, -.35, -16);
  size = new Vector3(20, 2.8, 64); targetSize = new Vector3(5, .7, 16);
  captured = false; committed = false; progress = 0; collider?: RAPIER.Collider;
  anchor = new Vector3(0, 0, 8); outlineMaterial = new LineBasicMaterial({ color: 0xb9a580, transparent: true, opacity: .65 });
  private sourceProjected = new Vector3(); private targetProjected = new Vector3(); private aimProjected = new Vector3();
  constructor(readonly physics: Physics, key = false) {
    if (key) { this.source.set(7.92, 12, -60); this.target.set(7.92, 12, -14); this.size.set(8, 8, 8); this.targetSize.set(1.6, 1.6, 1.6); this.anchor.set(9.44, 12, -2.5); }
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), dark); mesh.castShadow = mesh.receiveShadow = true; this.object.add(mesh);
    const edges = new LineSegments(new EdgesGeometry(mesh.geometry), new LineBasicMaterial({ color: 0xd6ba86 })); edges.scale.setScalar(1.002); this.object.add(edges);
    for (const x of [-.46, .46]) { const seam = new Mesh(new BoxGeometry(.004, .005, .99), light); seam.position.set(x, .504, 0); this.object.add(seam); }
    const sigil = torus(.21, .004, gold); sigil.position.set(0, .506, 0); sigil.rotation.x = -Math.PI / 2; this.object.add(sigil);
    this.object.position.copy(this.source); this.object.scale.copy(this.size); this.group.add(this.object);
    const socket = new LineSegments(new EdgesGeometry(new BoxGeometry(this.targetSize.x, this.targetSize.y, this.targetSize.z)), this.outlineMaterial);
    this.socket.add(socket); this.socket.position.copy(this.target); this.group.add(this.socket);
    const mark = torus(1.1, .023, gold); mark.rotation.x = -Math.PI / 2; mark.position.copy(this.anchor).add(new Vector3(0, .018, 0)); this.group.add(mark);
    if (key) { mark.rotation.set(0, -Math.PI / 2, 0); const front = torus(.23, .005, light); front.position.z = .503; this.object.add(front); }
  }
  aimed(camera: PerspectiveCamera) {
    const point = this.aimProjected.copy(this.object.position).project(camera);
    return Math.hypot(point.x, point.y) < .19 && point.z > -1 && point.z < 1;
  }
  aligned(camera: PerspectiveCamera) {
    this.sourceProjected.copy(this.source).project(camera); this.targetProjected.copy(this.target).project(camera);
    const ratio = perspectiveScale(camera.position.distanceTo(this.source), camera.position.distanceTo(this.target));
    return this.aimed(camera) && screenMatch(this.sourceProjected, this.targetProjected, .035) && ratio !== null && Math.abs(ratio - this.targetSize.x / this.size.x) < .04;
  }
  capture(camera: PerspectiveCamera) { if (!this.committed && this.aimed(camera)) { this.captured = !this.captured; return true; } return false; }
  commit(camera: PerspectiveCamera, playerPosition: Vector3) {
    if (!this.captured || this.committed || !this.aligned(camera)) return false;
    // Reject a placement containing the player, even if projected alignment is valid.
    const d = playerPosition.clone().sub(this.target);
    if (Math.abs(d.x) < this.targetSize.x / 2 + .4 && Math.abs(d.y) < this.targetSize.y / 2 + .9 && Math.abs(d.z) < this.targetSize.z / 2 + .4) return false;
    this.committed = true; this.captured = false; return true;
  }
  update(dt: number, camera: PerspectiveCamera) {
    if (this.committed && this.progress < 1) {
      this.progress = Math.min(1, this.progress + dt / .48); const t = this.progress * this.progress * (3 - 2 * this.progress);
      this.object.position.lerpVectors(this.source, this.target, t); this.object.scale.lerpVectors(this.size, this.targetSize, t);
      if (this.progress === 1 && !this.collider) this.collider = this.physics.box(this.targetSize, this.target);
    }
    this.outlineMaterial.color.setHex(this.committed ? 0xe6ca8a : this.captured && this.aligned(camera) ? 0xffe4ad : 0x84909c);
    this.outlineMaterial.opacity = this.captured ? .95 : .45;
  }
}
