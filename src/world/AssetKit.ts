import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { BufferGeometry, Color, Group, InstancedMesh, Material, Matrix4, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as M from '../render/materials';

type Part = { geometry: BufferGeometry; material: Material };
const modules = new Map<string, Part[]>();
const bakedMaterials = new Map<MeshStandardMaterial, MeshStandardMaterial>();
/** Load once. Geometry is shared across scene resets and instanced placements. */
export async function loadAssetKit() {
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/assets/models/infinitum-kit.glb');
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const name = object.name.split('__')[0];
    if (name.startsWith('collision_')) return;
    const source = Array.isArray(object.material) ? object.material[0] : object.material;
    const palette: Record<string, MeshStandardMaterial> = { Kit_Stone: M.stone, Kit_Pale: M.pale, Kit_Obsidian: M.dark, Kit_Gold: M.gold };
    const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
    geometry.userData.shared = true;
    const base = palette[source.name] ?? M.stone;
    let material = base;
    if (geometry.hasAttribute('color')) {
      material = bakedMaterials.get(base)!;
      if (!material) {
        material = base.clone(); material.vertexColors = true;
        material.onBeforeCompile = base.onBeforeCompile;
        material.customProgramCacheKey = base.customProgramCacheKey;
        material.userData.shared = true; bakedMaterials.set(base, material);
      }
    }
    const parts = modules.get(name) ?? [];
    parts.push({ geometry, material }); modules.set(name, parts);
  });
  if (!modules.has('monolith') || !modules.has('tower')) throw new Error('Architectural kit is incomplete');
}

export class KitBatch {
  private placements = new Map<string, { matrix: Matrix4; tint: Color }[]>();
  private transform = new Object3D();
  add(name: string, x: number, y: number, z: number, sx = 1, sy = sx, sz = sx, rotationY = 0, tint = 0xffffff) {
    if (!modules.has(name)) throw new Error(`Missing architectural module: ${name}`);
    this.transform.position.set(x, y, z); this.transform.scale.set(sx, sy, sz);
    this.transform.rotation.set(0, rotationY, 0); this.transform.updateMatrix();
    // Distant architecture lies outside the local gameplay shadow volume.
    // Split batches so one nearby instance cannot pull the whole skyline into it.
    const key = `${name}|${z > -65 ? 'shadow' : 'distant'}`;
    const list = this.placements.get(key) ?? []; list.push({ matrix: this.transform.matrix.clone(), tint: new Color(tint) }); this.placements.set(key, list);
  }
  finish(group: Group) {
    for (const [key, matrices] of this.placements) {
      const [name, shadow] = key.split('|');
      for (const part of modules.get(name)!) {
        const mesh = new InstancedMesh(part.geometry, part.material, matrices.length);
        matrices.forEach((placement, i) => { mesh.setMatrixAt(i, placement.matrix); mesh.setColorAt(i, placement.tint); });
        mesh.name = `Blender / ${name}`; mesh.castShadow = shadow === 'shadow'; mesh.receiveShadow = true;
        mesh.computeBoundingSphere(); group.add(mesh);
      }
    }
    this.placements.clear();
  }
}
