import { Data3DTexture, LinearFilter, RedFormat, RepeatWrapping, BoxGeometry, Group, Mesh, ShaderMaterial, Vector3 } from 'three';

// One 256 KiB lattice replaces 96 procedural hash evaluations per cloud pixel.
// Hardware interpolation uses the same smoothstep coordinates as the original noise.
const size = 64;
function noiseLattice() {
  const data = new Uint8Array(size ** 3);
  for (let z = 0; z < size; z++) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const n = Math.sin((x-32)*127.1+(y-32)*311.7+(z-32)*74.7)*43758.5453;
    data[x+size*(y+size*z)] = Math.round((n-Math.floor(n))*255);
  }
  const texture = new Data3DTexture(data,size,size,size); texture.format = RedFormat;
  texture.minFilter = texture.magFilter = LinearFilter; texture.wrapS = texture.wrapT = texture.wrapR = RepeatWrapping;
  texture.unpackAlignment = 1; texture.needsUpdate = true; return texture;
}

/** Bounded cloud volumes: density is sampled in world space, so parallax survives free movement. */
export class CloudVolumes extends Group {
  private materials: ShaderMaterial[] = [];
  constructor() {
    super(); this.name = 'City cloud volumes';
    const geometry = new BoxGeometry(1, 1, 1), noiseField = noiseLattice();
    for (const [x, y, z, w, h, d] of [
      [-95, -5, -95, 160, 44, 65], [105, -10, -135, 170, 58, 70],
      [0, -19, -225, 460, 70, 80], [-170, 24, -320, 180, 60, 70],
      [175, 37, -390, 200, 75, 85], [0, -30, -510, 700, 100, 90],
    ]) {
      const material = new ShaderMaterial({ transparent: true, depthWrite: false,
        uniforms: { noiseField: { value: noiseField }, samples: { value: 6 }, time: { value: 0 }, eye: { value: new Vector3() }, extent: { value: new Vector3(w, h, d) } },
        vertexShader: `varying vec3 local; void main(){local=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec3 local; uniform vec3 eye,extent; uniform float time;
          uniform highp sampler3D noiseField; uniform float samples;
          float noise(vec3 p){vec3 f=fract(p);f=f*f*(3.-2.*f);return texture(noiseField,(floor(p)+f+32.5)/64.).r;}
          void main(){vec3 ray=normalize(local-eye);vec3 inv=1./ray;
            vec3 t0=(-.5-eye)*inv,t1=(.5-eye)*inv;
            vec3 lo=min(t0,t1),hi=max(t0,t1);
            float start=max(max(lo.x,lo.y),lo.z),end=min(min(hi.x,hi.y),hi.z);
            float stepSize=max(0.,end-max(start,0.))/samples;vec4 sum=vec4(0.);
            for(int i=0;i<6;i++){
              if(float(i)>=samples)break;
              vec3 p=eye+ray*(max(start,0.)+(float(i)+.5)*stepSize);
              vec3 q=p*extent*.038+vec3(time*.012,0.,0.);
              float n=noise(q)*.72+noise(q*2.1)*.28;
              float edge=smoothstep(.5,.26,abs(p.x))*smoothstep(.5,.25,abs(p.z));
              float crest=.06+(n-.4)*.75;
              float body=(1.-smoothstep(crest-.2,crest+.07,p.y))*smoothstep(-.5,-.28,p.y);
              float density=smoothstep(.28,.65,n)*edge*body;
              float alpha=1.-exp(-density*stepSize*length(ray*extent)*.085);
              vec3 shade=mix(vec3(.27,.36,.47),vec3(.95,.87,.71),clamp(.55+p.y+n*.3-p.x*.17,0.,1.));
              sum.rgb+=(1.-sum.a)*alpha*shade;sum.a+=(1.-sum.a)*alpha;
            }
            gl_FragColor=vec4(sum.rgb/max(sum.a,.001),sum.a*.86);
          }` });
      const mesh = new Mesh(geometry, material); mesh.position.set(x,y,z); mesh.scale.set(w,h,d);
      mesh.onBeforeRender = (_r,_s,camera) => { camera.getWorldPosition(material.uniforms.eye.value); mesh.worldToLocal(material.uniforms.eye.value); };
      this.materials.push(material); this.add(mesh);
    }
  }
  quality(tier: string) { for (const material of this.materials) material.uniforms.samples.value = tier === 'mobile' ? 4 : 6; }
  update(time: number) { for (const material of this.materials) material.uniforms.time.value = time; }
}
