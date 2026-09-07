import { AdditiveBlending, Color, DoubleSide, MeshBasicMaterial, MeshStandardMaterial, ShaderMaterial } from 'three';
export const stone = new MeshStandardMaterial({ color: 0xc9c8c4, metalness: .12, roughness: .47 });
export const pale = new MeshStandardMaterial({ color: 0xe5e2da, metalness: .14, roughness: .36 });
export const dark = new MeshStandardMaterial({ color: 0x131b25, metalness: .78, roughness: .27 });
export const floor = new MeshStandardMaterial({ color: 0x333f4c, metalness: .65, roughness: .25 });
export const gold = new MeshStandardMaterial({ color: 0x97784e, metalness: .8, roughness: .3 });
export const light = new MeshBasicMaterial({ color: new Color(3.2, 2.05, .95), toneMapped: false });
export const blue = new MeshBasicMaterial({ color: new Color(.5, 1.6, 2.6), toneMapped: false });
export const sphereCoat = new MeshStandardMaterial({ color: 0x8895a3, metalness: 1, roughness: .13, transparent: true, opacity: .08, depthWrite: false, envMapIntensity: 1.8 });
export const skylight = new MeshBasicMaterial({ color: new Color(1.3, 1.5, 1.8), toneMapped: false });
for (const material of [stone, pale, dark, floor, gold, light, blue, sphereCoat, skylight]) material.userData.shared = true;
// World-space veins remain fine at architectural scale without large texture downloads.
for (const material of [stone, pale, dark, floor]) {
  const masonry = material === stone || material === pale;
  material.customProgramCacheKey = () => `infinitum-surface-3-${masonry}`;
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWorldDetail;').replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
      vec4 detailPosition = vec4(transformed,1.0);
      #ifdef USE_INSTANCING
      detailPosition = instanceMatrix * detailPosition;
      #endif
      vWorldDetail = (modelMatrix * detailPosition).xyz;`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vWorldDetail;
      float surfaceHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float surfaceNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(mix(surfaceHash(i),surfaceHash(i+vec3(1,0,0)),f.x),mix(surfaceHash(i+vec3(0,1,0)),surfaceHash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(surfaceHash(i+vec3(0,0,1)),surfaceHash(i+vec3(1,0,1)),f.x),mix(surfaceHash(i+vec3(0,1,1)),surfaceHash(i+1.),f.x),f.y),f.z);}
      `).replace('#include <color_fragment>', `#include <color_fragment>
      float grain = sin(vWorldDetail.x*24.0+vWorldDetail.y*13.0)*sin(vWorldDetail.z*22.0)*.5+.5;
      float cloud = surfaceNoise(vWorldDetail*.7);
      float vein = abs(surfaceNoise(vWorldDetail*1.9+cloud*2.)-.5);
      diffuseColor.rgb *= .91 + cloud*.12 + grain*.025 - (1.-smoothstep(.004,.02,vein))*.065;
      ${masonry ? `vec2 courses=vec2(vWorldDetail.x+vWorldDetail.z,vWorldDetail.y)*vec2(.5,.2);
      vec2 edge=abs(fract(courses)-.5);vec2 aa=max(fwidth(courses),vec2(.002));
      float joint=max(smoothstep(.495-aa.x,.5,edge.x),smoothstep(.496-aa.y,.5,edge.y));
      diffuseColor.rgb*=1.-joint*.16;` : ''}
      `).replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      // Derivative bump gives the existing procedural stone grain a lighting response.
      vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);
      vec3 rx=cross(dy,normal),ry=cross(normal,dx);float determinant=dot(dx,rx);
      float relief=cloud*.012+grain*.0007;
      vec3 gradient=sign(determinant)*(dFdx(relief)*rx+dFdy(relief)*ry);
      normal=normalize(max(abs(determinant),1.e-8)*normal-gradient);
      `).replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      roughnessFactor=clamp(roughnessFactor+(surfaceNoise(vWorldDetail*3.)-.5)*.08,.08,1.);`);
  };
}
export function sphereMaterial() {
  return new ShaderMaterial({ uniforms: { time: { value: 0 }, reveal: { value: 0 } }, vertexShader: `varying vec3 vN; varying vec3 vP; varying vec3 vW;
    void main(){vN=normalize(normalMatrix*normal);vP=(modelViewMatrix*vec4(position,1.)).xyz;vW=position;gl_Position=projectionMatrix*vec4(vP,1.);}`,
  fragmentShader: `uniform float time; uniform float reveal; varying vec3 vN; varying vec3 vP; varying vec3 vW;
    float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+1.),f.x),f.y),f.z);}
    void main(){vec3 n=normalize(vN);vec3 w=normalize(vW);float rim=pow(1.-max(0.,dot(n,normalize(-vP))),5.);
    vec3 p=w*4.+vec3(time*.007,0.,0.);float cloud=noise(p)*.65+noise(p*2.1)*.25+noise(p*4.3)*.1;
    float stars=step(.999,hash(floor(w*180.)));
    float cracks=pow(1.-abs(sin(w.x*8.+w.y*3.+cloud*9.)),170.);
    vec3 base=mix(vec3(.005,.011,.02),vec3(.035,.075,.13),smoothstep(.3,.8,cloud));
    base+=rim*vec3(.45,.6,.85)+stars*.3+cracks*vec3(.25,.14,.045);
    base+=pow(max(0.,dot(n,normalize(vec3(-.6,1.,.4)))),52.)*vec3(.3,.42,.65);
    gl_FragColor=vec4(base+reveal*vec3(.4,.28,.1),1.);}` });
}
export function beamMaterial() {
  return new ShaderMaterial({ transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending, uniforms: {}, vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`, fragmentShader: `varying vec2 vUv;void main(){float a=pow(sin(vUv.x*3.14159),3.)*.045;gl_FragColor=vec4(.7,.79,1.,a*(.2+.8*vUv.y));}` });
}
