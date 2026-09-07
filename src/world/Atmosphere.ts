import { DoubleSide, Group, Mesh, PlaneGeometry, ShaderMaterial } from 'three';

/** Layered, depth-tested cloud banks. No fullscreen bloom or gameplay occlusion. */
export class Atmosphere extends Group {
  private materials: ShaderMaterial[] = [];
  constructor(chamber = false) {
    super(); this.name = 'Low atmospheric banks';
    const geometry = new PlaneGeometry(1, 1);
    const layers = chamber ? 3 : 6;
    for (let i = 0; i < layers; i++) {
      const material = new ShaderMaterial({ transparent: true, depthWrite: false, side: DoubleSide,
        uniforms: { time: { value: 0 }, seed: { value: i * 13.7 }, opacity: { value: chamber ? .12 : .38 } },
        vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec2 vUv;uniform float time,seed,opacity;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
        float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<5;i++){n+=noise(p)*a;p=p*2.03+17.1;a*=.5;}return n;}
        void main(){vec2 p=vUv*vec2(17.,4.)+vec2(seed+time*.008,seed);
        float n=fbm(p);float edge=.51+n*.35;
        float cloud=smoothstep(edge+.07,edge-.12,vUv.y)*smoothstep(0.,.24,vUv.y);
        cloud*=smoothstep(0.,.1,vUv.x)*smoothstep(1.,.9,vUv.x);
        vec3 shade=mix(vec3(.20,.28,.39),vec3(.72,.77,.82),smoothstep(.2,.8,vUv.y+n*.25));
        gl_FragColor=vec4(shade,cloud*opacity);}` });
      const mesh = new Mesh(geometry, material);
      mesh.scale.set(chamber ? 48 : 700 + i * 110, chamber ? 3 : 150 + i * 18, 1);
      mesh.position.set(0, chamber ? .25 : -35 - i * 4, chamber ? -18 - i * 10 : -100 - i * 95);
      this.materials.push(material); this.add(mesh);
    }
  }
  update(time: number) { this.materials.forEach(material => material.uniforms.time.value = time); }
}
