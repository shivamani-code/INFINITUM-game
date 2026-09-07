import { budgetReflection } from '../render/reflectionBudget';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { Group, Mesh, Vector3, PlaneGeometry, ShaderMaterial, Camera } from 'three';
import { Architecture, torus } from './Architecture';
import { inscription } from './Chamber';
import { Physics } from '../physics/Physics';
import { ScaleSystem } from '../mechanics/scale/ScaleSystem';
import * as M from '../render/materials';
import { GravitySystem } from '../mechanics/gravity/GravitySystem';
import { buildGravityLevel } from './gravityLevel';
import { buildEchoLevel, type Plate } from './echoLevel';
import { EchoSystem } from '../mechanics/echo/EchoSystem';
import type { Collider } from '@dimforge/rapier3d-compat';
import { buildCombinedLevel } from './combinedLevel';
import { Finale } from './Finale';

export class PuzzleLevel {
  reflection?: Reflector;
  group = new Group(); scale?: ScaleSystem;
  gravity?: GravitySystem;
  boundary?: Mesh;
  finale?: Finale;
  echo?: EchoSystem; plates: Plate[] = []; door?: Mesh; doorCollider?: Collider; doorOpen = false; doorProgress = 0; doorLatched = false;
  gate = new Vector3(0, -1.5, -36); gateRing: Mesh;
  spawn = new Vector3(0, .86, 13);
  constructor(readonly physics: Physics, readonly chapter: number, safe = false) {
    if (chapter === 5) { this.finale = new Finale(physics); this.group.add(this.finale.group); this.gate = this.finale.gate; this.gateRing = this.finale.ring; return; }
    if (chapter === 4) { const level = buildCombinedLevel(this.group, physics); this.echo = level.echo; this.gravity = level.gravity; this.scale = level.scale; this.plates = level.plates; this.gate = level.gate; this.gateRing = level.ring; this.boundary = level.boundary; return; }
    if (chapter === 2) { const level = buildGravityLevel(this.group, physics); this.gravity = level.gravity; this.gate = level.gate; this.gateRing = level.ring; this.spawn = level.spawn; return; }
    if (chapter === 3) {
      const level = buildEchoLevel(this.group, physics); this.echo = level.echo; this.plates = level.plates; this.door = level.door; this.doorCollider = level.doorCollider; this.gate = level.gate; this.gateRing = level.ring; return;
    }
    const a = new Architecture(this.group, physics);
    a.tiles(0, 6, 18, 28); a.tiles(0, -32, 18, 16, -3);
    // Surface relief stays outside the central observation and traversal lane.
    for (const side of [-1, 1]) {
      for (const z of [-3, 3, 9, 15]) a.kit.add('panel', side * 6, .015, z, .95, .3, .95);
      for (const z of [-4, 4, 12]) a.kit.add('trim', side * 8.9, -.12, z, 2, 1, 1, Math.PI / 2);
      for (const z of [-27, -33, -38]) a.kit.add('panel', side * 6, -2.985, z, .95, .3, .95);
    }
    a.arch(0, -13, -6, 14, 12.5, 2);
    a.kit.add('portal', 0, -3, -37.1, 1.55, 1.3, .7);
    for (const s of [-1, 1]) { a.monolith(s * 7.7, 1, 28, 2.7); a.monolith(s * 7.7, -29, 12, 1.5); }
    for (const side of [-1, 1]) {
      const sigil = torus(.58, .022, M.light); sigil.scale.y = (28 / 15) / (2.7 / 2); sigil.position.set(side * 7.7, 8.77, 1.94); this.group.add(sigil);
      a.box(side * 7.7, 5.2, 1.9, .02, 2.5, .02, M.light);
    }
    this.scale = new ScaleSystem(physics); this.group.add(this.scale.group);
    const text = inscription('SCALE IS A PRIVILEGE OF THE OBSERVER', 12, .8); text.position.set(0, 3.2, -6); this.group.add(text);
    for (const s of [-1, 1]) {
      a.box(s * 3, 1, -37, .55, 8, .7, M.pale, true);
      a.box(s * 2.7, 1, -36.58, .035, 7.8, .04, M.light);
    }
    a.box(0, 5, -37, 6.6, .55, .7, M.pale);
    a.box(0, 4.7, -36.58, 5.4, .04, .04, M.light);
    this.gateRing = torus(.6, .025); this.gateRing.position.set(0, -1, -37); this.group.add(this.gateRing);
    a.finish();
    if (!safe) {
      const reflection = this.reflection = new Reflector(new PlaneGeometry(17.6, 27.6), { textureWidth: 512, textureHeight: 512, color: 0x8893a2, clipBias: .003 });
      reflection.rotation.x = -Math.PI / 2; reflection.position.set(0, .012, 6);
      const mat = reflection.material as ShaderMaterial; mat.transparent = true;
      mat.fragmentShader = mat.fragmentShader.replace('vec4( blendOverlay( base.rgb, color ), 1.0 )', 'vec4( blendOverlay( base.rgb, color ), 0.18 )');
      mat.fragmentShader = mat.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );', `
        vec2 uv = vUv.xy / vUv.w; vec2 blur = vec2(.0025);
        vec4 base = (texture2D(tDiffuse,uv+blur)+texture2D(tDiffuse,uv-blur)+texture2D(tDiffuse,uv+vec2(blur.x,-blur.y))+texture2D(tDiffuse,uv+vec2(-blur.x,blur.y)))*.25;`);
      // Reflection renders the nearby architecture and celestial silhouette, not the entire city twice.
      this.group.traverse(object => object.layers.enable(1));
      const renderReflection = reflection.onBeforeRender;
      reflection.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
        if (scene.overrideMaterial) return;
        // Three r185 exposes this method; the r183 declarations still list the old camera property.
        (reflection as Reflector & { getReflectionCamera(camera: Camera): Camera }).getReflectionCamera(camera).layers.set(1);
        renderReflection.call(reflection, renderer, scene, camera, geometry, material, group);
      };
      budgetReflection(reflection, () => this.scale?.progress ?? 0);
      this.group.add(reflection);
    }
  }
}
