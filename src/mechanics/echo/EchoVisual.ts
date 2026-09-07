import { BufferGeometry, CylinderGeometry, Float32BufferAttribute, Group, Mesh, ShaderMaterial, SphereGeometry, Vector3, Quaternion } from 'three';
import type { TransformSample } from '../../timeline/Timeline';
const up = new Vector3(0, 1, 0);
export class EchoVisual {
  group = new Group(); material: ShaderMaterial; left: Mesh; right: Mesh;
  constructor() {
    this.material = new ShaderMaterial({ transparent: true, depthWrite: false,
      uniforms: { time: { value: 0 } }, vertexShader: 'varying vec3 vN;varying vec3 vP;varying vec3 vLocal;void main(){vLocal=position;vN=normalize(normalMatrix*normal);vP=(modelViewMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*vec4(vP,1.);}',
      fragmentShader: `uniform float time;varying vec3 vN;varying vec3 vP;varying vec3 vLocal;void main(){float rim=pow(1.-abs(dot(normalize(vN),normalize(-vP))),2.);float scan=.75+.25*sin(vLocal.y*110.-time*3.);gl_FragColor=vec4(mix(vec3(.13,.35,.55),vec3(.8,1.25,1.6),rim),(.25+rim*.6)*scan);}` });
    const body = new Mesh(new CylinderGeometry(.21, .3, .8, 10), this.material); body.position.y = -.08; this.group.add(body);
    const head = new Mesh(new SphereGeometry(.2, 16, 12), this.material); head.position.y = .52; this.group.add(head);
    // Folded silhouette echoes the traveler reference rather than a generic capsule.
    const points: number[] = [];
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, b = (i + 1) / 12 * Math.PI * 2;
      points.push(Math.sin(a) * .2, .28, Math.cos(a) * .2, Math.sin(a) * .43, -.84 + (i % 2) * .06, Math.cos(a) * .43, Math.sin(b) * .43, -.84 + ((i + 1) % 2) * .06, Math.cos(b) * .43);
    }
    const geometry = new BufferGeometry(); geometry.setAttribute('position', new Float32BufferAttribute(points, 3)); geometry.computeVertexNormals(); this.group.add(new Mesh(geometry, this.material));
    this.left = new Mesh(new CylinderGeometry(.06, .055, .62, 8), this.material); this.left.position.set(-.27, -.05, 0); this.group.add(this.left);
    this.right = this.left.clone(); this.right.position.x = .27; this.group.add(this.right);
  }
  update(sample: TransformSample, time: number, moving: boolean) {
    this.group.position.fromArray(sample.position); this.group.quaternion.setFromUnitVectors(up, new Vector3().fromArray(sample.up));
    this.group.quaternion.multiply(new Quaternion().setFromAxisAngle(up, sample.yaw));
    this.material.uniforms.time.value = time;
    this.left.rotation.x = moving ? Math.sin(time * 7) * .3 : 0; this.right.rotation.x = -this.left.rotation.x;
  }
  dispose() { this.group.traverse(o => { if (o instanceof Mesh) o.geometry.dispose(); }); this.material.dispose(); this.group.removeFromParent(); }
}
