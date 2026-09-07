import { CloudVolumes } from './CloudVolumes';
import { BackSide, BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Points, PointsMaterial, ShaderMaterial, SphereGeometry, Vector3 } from 'three';
import { Architecture, torus } from './Architecture';
import * as M from '../render/materials';
import { Atmosphere } from './Atmosphere';

export class City {
  readonly orbHome = new Vector3(0, 100, -310);
  group = new Group(); district = new Group(); orb = new Group(); material = M.sphereMaterial();
  atmosphere = new Atmosphere(); clouds = new CloudVolumes();
  constructor() {
    this.group.add(this.district); const a = new Architecture(this.district);
    this.district.add(this.atmosphere, this.clouds);
    a.kit.add('hero_tower', -70, -72, -60, 1.65, 2.3, 1.65, .24, 0x657a92);
    a.kit.add('arch', -50, -28, -70, 4.5, 5.5, 5, .45, 0x8294a8);
    a.kit.add('wall_bay', 57, -40, -58, 2.4, 2.5, 4, -.35, 0x586c85);
    // The far silhouette is intentionally sparse: air separates the city districts.
    for (let i = -5; i <= 5; i++) if (i !== 0) {
      a.kit.add('tower_lod', i * 100 + Math.sin(i * 8) * 27, -100, -650 - Math.abs(i) * 26, 2 + Math.abs(i % 3), 3.2 + Math.sin(i * 19) * 1.4, 2, .15 * i, 0xbacadd);
    }
    // Authored sightline is kept clear; seeded variation is confined to the skyline.
    for (let row = 0; row < 3; row++) for (let col = -5; col <= 5; col++) {
      if (col === 0 || (Math.abs(col) < 2 && row < 2)) continue;
      const seed = Math.abs(Math.sin(row * 19.17 + col * 72.41));
      a.tower(col * 43 + Math.sin(row * 3) * 10, -62 - seed * 35, -100 - row * 100, 70 + seed * 120, 10 + seed * 11);
    }
    for (const side of [-1, 1]) {
      a.kit.add('hero_tower', side * 88, -52, -235, 1.5, 2.7, 1.5, side * .25);
      a.kit.add('tower', side * 47, -30, -195, .9, 2.2, .9);
    }
    a.kit.add('hero_tower', 0, -140, -440, 3.2, 4.5, 3.2);
    a.kit.add('ring', 0, 70, -435, 9, 9, 6);
    a.kit.add('ring', -130, 56, -230, 4.4, 4.4, 3, .4);
    a.kit.add('ring', 150, 80, -330, 5.2, 5.2, 3, -.5);
    // Upper aqueduct lies behind the focal sphere; lower viaducts establish depth beneath it.
    for (let x = -260; x <= 260; x += 40) {
      if (Math.abs(x) < 75) continue;
      a.kit.add('arch_lod', x, 27, -365, 4.6, 3.8, 4, 0, 0xe1e4e5);
    }
    for (const z of [-150, -250]) {
      a.box(0, 9, z, 440, 2.5, 7, M.pale);
      a.box(0, 10.5, z, 440, .12, 7.2, M.gold);
      for (let x = -210; x <= 210; x += 24) a.arch(x, -23, z, 22, 32, 5);
      for (let x = -220; x <= 220; x += 12) a.box(x, 12, z + 3, .5, 4, .5, M.stone);
    }
    for (let i = 0; i < 35; i++) {
      const x = Math.sin(i * 52.6) * 210, z = -120 - (i % 6) * 45;
      if (i % 3 === 0) a.kit.add('platform', x, -15 + Math.cos(i * 72) * 30, z, 1.1);
      else a.monolith(x, z, 11 + i % 13, 2, 55 + Math.cos(i * 72) * 45);
    }
    // Suspended landings give the city horizontal masses between its needles.
    a.kit.add('suspended_terrace', -41, -7, -84, 1.6, 1.5, 1.6, .22, 0xa6b4c1);
    a.kit.add('suspended_terrace', 58, 6, -140, 2.5, 2.3, 2.1, -.17);
    a.kit.add('suspended_terrace', -130, 32, -245, 3.2, 3.5, 2.7, .32);
    a.kit.add('suspended_terrace', 165, 66, -340, 4, 4.1, 3.4, -.2);
    a.finish();
    const moon = new Mesh(new SphereGeometry(145, 64, 32), new MeshStandardMaterial({ color: 0x8496ae, roughness: .9, metalness: .1, fog: false, transparent: true, opacity: .22, depthWrite: false }));
    moon.position.set(270, 220, -730); this.district.add(moon);
    const moonRing = torus(180, .22, M.stone); moonRing.rotation.set(1.1, .4, -.35); moonRing.position.copy(moon.position); this.district.add(moonRing);
    const sphere = new Mesh(new SphereGeometry(62, 80, 48), this.material); this.orb.add(sphere);
    const ring = torus(82, .16, M.pale); ring.rotation.x = 1.12; ring.rotation.z = -.2; this.orb.add(ring);
    const inner = torus(80, .045); inner.rotation.copy(ring.rotation); this.orb.add(inner);
    const upright = torus(91, .055, M.light); upright.rotation.y = -.2; this.orb.add(upright);
    const seam = torus(62.15, .075); this.orb.add(seam);
    this.orb.position.copy(this.orbHome); this.group.add(this.orb); this.orb.traverse(object => object.layers.enable(1));
    const sky = new Mesh(new SphereGeometry(1700, 32, 16), new ShaderMaterial({ side: BackSide, depthWrite: false,
      vertexShader: 'varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec3 vPos;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
        void main(){vec3 d=normalize(vPos);float h=d.y;vec3 color=mix(vec3(.64,.67,.68),vec3(.10,.22,.36),smoothstep(-.12,.7,h));
        vec2 p=d.xz/(abs(h)+.18)*7.;float cloud=noise(p)*.52+noise(p*2.1)*.25+noise(p*4.3)*.13+noise(p*8.7)*.07+noise(p*17.3)*.03;
        float amount=smoothstep(.48,.68,cloud)*smoothstep(.8,.05,h);color=mix(color,vec3(.94,.87,.73),amount*.72);
        float sunDot=max(0.,dot(d,normalize(vec3(-.62,.14,-1.))));
        color+=pow(sunDot,18.)*vec3(.22,.13,.045)+pow(sunDot,700.)*vec3(2.8,1.9,.85);
        gl_FragColor=vec4(color,1.);}` })); sky.layers.enable(1); this.group.add(sky);
    const vertices: number[] = []; for (let i = 0; i < 550; i++) vertices.push(Math.sin(i * 134.2) * 180, Math.sin(i * 66.3) * 60 + 20, Math.cos(i * 47.1) * 180 - 180);
    const geometry = new BufferGeometry(); geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.group.add(new Points(geometry, new PointsMaterial({ color: 0xf4dfbd, size: .13, transparent: true, opacity: .5, depthWrite: false })));
  }
  update(time: number, instability = 0) {
    this.atmosphere.update(time); this.clouds.update(time);
    this.material.uniforms.time.value = time;
    this.orb.rotation.z = Math.sin(time * .05) * .025 + instability * .3;
    this.district.rotation.z = instability * .16;
  }
}
