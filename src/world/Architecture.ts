import { BoxGeometry, BufferGeometry, CylinderGeometry, Group, InstancedMesh, Material, Matrix4, Mesh, Object3D, Quaternion, TorusGeometry, Vector3 } from 'three';
import * as M from '../render/materials';
import { Physics } from '../physics/Physics';
import { KitBatch } from './AssetKit';

const boxGeometry = new BoxGeometry(1, 1, 1);
export class Architecture {
  readonly kit = new KitBatch();
  private batches = new Map<Material, Matrix4[]>();
  private transform = new Object3D();
  constructor(readonly group: Group, readonly physics?: Physics) {}
  box(x: number, y: number, z: number, w: number, h: number, d: number, material: Material = M.stone, solid = false, rotation = new Quaternion()) {
    this.transform.position.set(x, y, z); this.transform.scale.set(w, h, d); this.transform.quaternion.copy(rotation); this.transform.updateMatrix();
    if (!this.batches.has(material)) this.batches.set(material, []);
    this.batches.get(material)!.push(this.transform.matrix.clone());
    if (solid && this.physics) this.physics.box(new Vector3(w, h, d), new Vector3(x, y, z), rotation);
  }
  finish() {
    this.kit.finish(this.group);
    for (const [material, matrices] of this.batches) {
      const mesh = new InstancedMesh(boxGeometry, material, matrices.length);
      mesh.castShadow = material !== M.light; mesh.receiveShadow = true;
      matrices.forEach((m, i) => mesh.setMatrixAt(i, m)); mesh.computeBoundingSphere(); this.group.add(mesh);
    }
    this.batches.clear();
  }
  tower(x: number, y: number, z: number, height: number, width: number) {
    this.kit.add(z < -180 && height < 250 ? 'tower_lod' : 'tower', x, y, z, width / 9, height / 50, width / 9);
  }
  monolith(x: number, z: number, height = 15, width = 2.5, y = 0) {
    this.kit.add(z < -65 ? 'monolith_lod' : 'monolith', x, y, z, width / 2, height / 15, width / 2);
  }
  arch(x: number, y: number, z: number, width: number, height: number, depth = 1) {
    this.kit.add(z < -65 ? 'arch_lod' : 'arch', x, y, z, width / 8, height / 13, depth / 1.6);
  }
  tiles(x: number, z: number, w: number, d: number, y = 0) {
    this.box(x, y - .42, z, w, .64, d, M.dark);
    this.physics?.box(new Vector3(w, .64, d), new Vector3(x, y - .32, z));
    const countX = Math.max(1, Math.round(w / 3)), countZ = Math.max(1, Math.round(d / 3));
    for (let i = 0; i < countX; i++) for (let j = 0; j < countZ; j++) {
      this.box(x - w / 2 + (i + .5) * w / countX, y - .035, z - d / 2 + (j + .5) * d / countZ, w / countX - .025, .07, d / countZ - .025, M.floor);
    }
    for (const s of [-1, 1]) this.box(x + s * (w / 2 - .22), y + .012, z, .028, .025, d, M.gold);
  }
}
export function torus(radius: number, tube = .03, material: Material = M.light, arc = Math.PI * 2) { return new Mesh(new TorusGeometry(radius, tube, 6, Math.max(48, Math.round(radius * 8)), arc), material); }
export function plinth(radius: number, height: number, material: Material = M.dark) { return new Mesh(new CylinderGeometry(radius, radius * 1.02, height, 64), material); }
export function disposeGroup(group: Group) {
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>();
  group.traverse(o => {
    const drawable = o as Mesh;
    if (drawable.geometry && drawable.geometry !== boxGeometry && !drawable.geometry.userData.shared) geometries.add(drawable.geometry);
    if (drawable.material) for (const material of Array.isArray(drawable.material) ? drawable.material : [drawable.material]) if (!material.userData.shared) materials.add(material);
  });
  geometries.forEach(g => g.dispose());
  materials.forEach(m => { const textured = m as Material & { map?: { dispose(): void } }; textured.map?.dispose(); m.dispose(); });
  group.clear(); group.removeFromParent();
}

