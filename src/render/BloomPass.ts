import { HalfFloatType, ShaderMaterial, Vector2, WebGLRenderTarget, type WebGLRenderer } from 'three';
import { FullScreenQuad, Pass } from 'three/addons/postprocessing/Pass.js';
const vertexShader='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
/** Three-pass HDR bloom: threshold + horizontal blur, vertical blur, linear composite. */
export class BloomPass extends Pass {
  private a=new WebGLRenderTarget(1,1,{type:HalfFloatType,depthBuffer:false});
  private b=new WebGLRenderTarget(1,1,{type:HalfFloatType,depthBuffer:false});
  private blur=new ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{source:{value:null},direction:{value:new Vector2()},prefilter:{value:1}},vertexShader,
    fragmentShader:`varying vec2 vUv;uniform sampler2D source;uniform vec2 direction;uniform float prefilter;
      vec3 tap(vec2 uv){vec3 c=texture2D(source,uv).rgb;float l=max(c.r,max(c.g,c.b));return c*mix(1.,smoothstep(1.8,2.2,l),prefilter);}
      void main(){vec3 c=tap(vUv)*.227027;c+=(tap(vUv+direction*1.384615)+tap(vUv-direction*1.384615))*.316216;c+=(tap(vUv+direction*3.230769)+tap(vUv-direction*3.230769))*.070270;gl_FragColor=vec4(c,1.);}`});
  private composite=new ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{source:{value:null},glow:{value:this.b.texture}},vertexShader,
    fragmentShader:'varying vec2 vUv;uniform sampler2D source,glow;void main(){gl_FragColor=vec4(texture2D(source,vUv).rgb+texture2D(glow,vUv).rgb*.1,1.);}'});
  private quad=new FullScreenQuad(this.blur);
  setSize(w:number,h:number){this.a.setSize(Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));this.b.setSize(this.a.width,this.a.height);}
  render(renderer:WebGLRenderer,write:WebGLRenderTarget,read:WebGLRenderTarget){
    this.quad.material=this.blur;this.blur.uniforms.source.value=read.texture;this.blur.uniforms.prefilter.value=1;this.blur.uniforms.direction.value.set(1/this.a.width,0);
    renderer.setRenderTarget(this.a);this.quad.render(renderer);
    this.blur.uniforms.source.value=this.a.texture;this.blur.uniforms.prefilter.value=0;this.blur.uniforms.direction.value.set(0,1/this.a.height);
    renderer.setRenderTarget(this.b);this.quad.render(renderer);
    this.quad.material=this.composite;this.composite.uniforms.source.value=read.texture;
    renderer.setRenderTarget(this.renderToScreen?null:write);this.quad.render(renderer);
  }
  dispose(){this.a.dispose();this.b.dispose();this.blur.dispose();this.composite.dispose();this.quad.dispose();}
}
