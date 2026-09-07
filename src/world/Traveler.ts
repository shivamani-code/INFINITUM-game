import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
let statueGeometry: BufferGeometry | undefined;
export function travelerGeometry() {
  if (statueGeometry) return statueGeometry;
  const parts: BufferGeometry[] = [], vertices: number[] = [];
  // Weighted folds and a recessed face keep the silhouette legible at architectural scale.
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2, b = (i + 1) / 24 * Math.PI * 2;
    const ra = i % 2 ? .34 : .39, rb = (i + 1) % 2 ? .34 : .39;
    const topA = [Math.sin(a) * .2, 1.35, Math.cos(a) * .15], topB = [Math.sin(b) * .2, 1.35, Math.cos(b) * .15];
    const lowA = [Math.sin(a) * ra, .15 + .04 * Math.sin(a * 3), Math.cos(a) * ra], lowB = [Math.sin(b) * rb, .15 + .04 * Math.sin(b * 3), Math.cos(b) * rb];
    vertices.push(...topA, ...lowA, ...lowB, ...topA, ...lowB, ...topB);
  }
  const cloak = new BufferGeometry(); cloak.setAttribute('position', new Float32BufferAttribute(vertices, 3)); cloak.computeVertexNormals(); parts.push(cloak);
  const hood = new SphereGeometry(.225, 20, 14, .42, Math.PI * 2 - .84); hood.scale(1, 1.25, .9); hood.translate(0, 1.6, 0); parts.push(hood.toNonIndexed());
  const face = new SphereGeometry(.135, 12, 10); face.scale(1, 1.25, .7); face.translate(0, 1.59, -.03); parts.push(face.toNonIndexed());
  for (const s of [-1, 1]) {
    const foot = new BoxGeometry(.18, .17, .33); foot.translate(s * .16, .085, .04); parts.push(foot.toNonIndexed());
    const arm = new BoxGeometry(.13, .55, .14); arm.rotateZ(s * .16); arm.translate(s * .27, 1.04, .01); parts.push(arm.toNonIndexed());
    const hand = new SphereGeometry(.07, 8, 8); hand.translate(s * .31, .77, .03); parts.push(hand.toNonIndexed());
  }
  parts.forEach(p => p.deleteAttribute('uv'));
  statueGeometry = mergeGeometries(parts); statueGeometry.userData.shared = true; parts.forEach(p => p.dispose()); return statueGeometry;
}
export function statue(position: Vector3, scale: number, material: MeshStandardMaterial) {
  const mesh = new Mesh(travelerGeometry(), material); mesh.position.copy(position); mesh.scale.setScalar(scale); mesh.castShadow = mesh.receiveShadow = true; return mesh;
}
