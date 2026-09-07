import { budgetReflection } from '../render/reflectionBudget';
import { CanvasTexture, DoubleSide, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Points, BufferGeometry, Float32BufferAttribute, PointsMaterial, ShaderMaterial, SphereGeometry, PointLight } from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { Architecture, plinth, torus } from './Architecture';
import * as M from '../render/materials';
import { Physics } from '../physics/Physics';
import { Atmosphere } from './Atmosphere';

export function inscription(text: string, width: number, height = width / 12, color = '#c9b185') {
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 160;
  const ctx = canvas.getContext('2d')!; ctx.clearRect(0, 0, 2048, 160); ctx.fillStyle = color;
  ctx.font = '38px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text.split('').join(' '), 1024, 80);
  const mesh = new Mesh(new PlaneGeometry(width, height), new MeshBasicMaterial({ map: new CanvasTexture(canvas), transparent: true, depthWrite: false, side: DoubleSide }));
  return mesh;
}
export class Chamber {
  group = new Group(); orb = new Group(); sphereMaterial = M.sphereMaterial(); rings: Mesh[] = [];
  reflection?: Reflector; dust: Points;
  atmosphere = new Atmosphere(true);
  constructor(physics: Physics, safe: boolean) {
    const a = new Architecture(this.group, physics);
    this.group.add(this.atmosphere);
    const sphereLight = new PointLight(0xd4e5ff, 380, 42, 2);
    sphereLight.position.set(0, 13, -27); this.group.add(sphereLight);
    const footLight = new PointLight(0xffd49b, 85, 23, 2);
    footLight.position.set(0, 1.3, -22); this.group.add(footLight);
    a.kit.add('support', 0, -.5, -22);
    a.kit.add('portal', 0, 0, 32.6, 2, 3.5, 1.5, Math.PI);
    a.tiles(0, -5, 50, 78);
    for (const z of [-35, -26, -17, -8, 1, 10, 19, 28]) for (const side of [-1, 1]) {
      a.kit.add('panel', side * 20, .015, z, .95, .4, .95);
      a.kit.add('trim', side * 23, 4.1, z, 1.2, 1, 1, Math.PI / 2);
    }
    // Collider walls are separate from the thin facade ribs.
    a.box(-25.5, 25, -5, 1, 50, 78, M.stone, true); a.box(25.5, 25, -5, 1, 50, 78, M.stone, true);
    a.box(0, 25, -44, 52, 50, 1, M.stone, true);
    a.box(0, 25, 34, 52, 50, 1, M.stone, true);
    for (let z = -39; z < 34; z += 8) for (const s of [-1, 1]) {
      a.kit.add('wall_bay', s * 25.1, 0, z, 1, 1, 1, -s * Math.PI / 2);
      a.box(s * 23.5, 26, z, 1.7, 52, 2.2, M.pale);
      a.box(s * 22.5, 21, z, .4, 42, 1.15, M.stone);
      a.box(s * 23, 29, z + 1.2, .13, 40, .12, M.gold);
      a.box(s * 24.91, 25, z + 3.8, .03, 48, .14, M.light);
      a.monolith(s * 19.8, z, 18, 2.1, 4);
      a.box(s * 23, .35, z, 4, .7, 5, M.pale, true);
      a.arch(s * 17.5, 25, z, 8, 17, 1.5);
      a.kit.add('tower', s * 23.8, 0, z, .42, .83, .42);
    }
    for (const x of [-20, -12, 12, 20]) a.kit.add('wall_bay', x, 0, -43.4);
    // The apse aperture supplies a strong backlit silhouette behind the sphere.
    a.box(0, 29, -42.85, 8, 40, .06, M.skylight);
    for (const side of [-1, 1]) {
      a.box(side * 4.2, 27, -42.6, .35, 44, .5, M.pale);
      a.box(side * 6.3, 31, -42.85, .22, 36, .06, M.skylight);
    }
    a.kit.add('ring', 0, 28, -42, 1.7, 1.7, .7);
    for (const z of [-34, -24, -14, -4, 6, 16, 26]) for (const s of [-1, 1]) {
      a.box(s * 12.5, .3, z, 1.5, .6, 1.5, M.dark);
      a.box(s * 12.5, .63, z, .5, .035, .5, M.light);
    }
    for (const z of [-33, -13, 7, 25]) for (const s of [-1, 1]) {
      a.box(s * 16.5, .65, z, 2.1, 1.3, 2.1, M.stone, true);
      a.box(s * 16.5, 1.35, z, 2.4, .14, 2.4, M.pale);
      a.kit.add('sentinel', s * 16.5, 1.43, z, 2.15, 2.15, 2.15, -s * .45);
    }
    for (const radius of [22, 23.5, 24]) {
      const crown = torus(radius, radius === 23.5 ? .17 : .05, radius === 23.5 ? M.pale : M.gold);
      crown.rotation.x = -Math.PI / 2; crown.position.set(0, 46, -15); this.group.add(crown);
    }
    // Concentric inlays carry the eye to the sphere while leaving a flat, accessible floor.
    for (const r of [9.5, 10, 12, 15, 18]) { const ring = torus(r, .025, M.gold); ring.rotation.x = -Math.PI / 2; ring.position.set(0, .035, -22); this.group.add(ring); }
    const base = plinth(8, .18); base.position.set(0, .09, -22); this.group.add(base);
    const sphere = new Mesh(new SphereGeometry(7.6, 96, 64), this.sphereMaterial); this.orb.add(sphere);
    const coat = new Mesh(sphere.geometry, M.sphereCoat); coat.scale.setScalar(1.0005); this.orb.add(coat);
    const halo = torus(7.72, .033); halo.rotation.x = .12; this.orb.add(halo);
    const equator = torus(9.1, .022); equator.rotation.set(1.25, .1, -.24); this.orb.add(equator); this.rings.push(equator);
    const orbit = torus(9.5, .017, M.gold); orbit.rotation.set(.45, -.65, .5); this.orb.add(orbit); this.rings.push(orbit);
    const mark = torus(1.9, .018); mark.position.z = 7.4; this.orb.add(mark);
    const seam = new Mesh(new PlaneGeometry(.035, 15.5), M.light); seam.position.z = 7.5; this.orb.add(seam);
    this.orb.position.set(0, 9.2, -22); this.group.add(this.orb);
    const label = inscription('DO NOT ENTER THE SPHERE', 15); label.position.set(0, 1.25, -11.5); this.group.add(label);
    const back = inscription('OBSERVATION CHAMBER     /     001', 18, 1, '#6a737c'); back.position.set(0, 7, 33.4); back.rotation.y = Math.PI; this.group.add(back);
    a.box(0, 11, 33.3, 7, 22, .4, M.dark);
    a.box(0, 11, 33, .05, 22, .06, M.light);
    a.finish();
    const beamMat = M.beamMaterial();
    for (const x of [-17, -7, 7, 17]) {
      const beam = new Mesh(new PlaneGeometry(7, 50), beamMat); beam.position.set(x, 25, -29); beam.rotation.z = -.13; this.group.add(beam);
    }
    if (!safe) {
      this.reflection = new Reflector(new PlaneGeometry(48, 76), { textureWidth: 768, textureHeight: 768, color: 0x626976, clipBias: .003 });
      this.reflection.rotation.x = -Math.PI / 2; this.reflection.position.set(0, .008, -5);
      const reflectorMaterial = this.reflection.material as ShaderMaterial;
      reflectorMaterial.transparent = true;
      reflectorMaterial.fragmentShader = reflectorMaterial.fragmentShader.replace('vec4( blendOverlay( base.rgb, color ), 1.0 )', 'vec4( blendOverlay( base.rgb, color ), 0.24 )');
      // Partial polished insets, with opaque stone tiles above, avoid a mirror-room appearance.
      budgetReflection(this.reflection);
      this.group.add(this.reflection);
    }
    const data = new Float32Array(360 * 3);
    for (let i = 0; i < data.length; i += 3) { data[i] = Math.sin(i * 43.13) * 23; data[i + 1] = (i % 47) * .6 + 1; data[i + 2] = Math.cos(i * 13.73) * 37 - 5; }
    const geometry = new BufferGeometry(); geometry.setAttribute('position', new Float32BufferAttribute(data, 3));
    this.dust = new Points(geometry, new PointsMaterial({ color: 0xf8dfb8, size: .034, transparent: true, opacity: .5, depthWrite: false })); this.group.add(this.dust);
  }
  update(time: number) {
    this.atmosphere.update(time);
    this.sphereMaterial.uniforms.time.value = time;
    this.orb.position.y = 9.2 + Math.sin(time * .25) * .08;
    this.rings[0].rotation.z = -.24 + time * .008;
    this.dust.rotation.y = Math.sin(time * .015) * .04;
  }
}
