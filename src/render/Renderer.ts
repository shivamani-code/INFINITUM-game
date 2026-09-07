import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { GpuTimer } from './GpuTimer';
import { ShadowCache } from './ShadowCache';
import { ACESFilmicToneMapping, Color, DirectionalLight, FogExp2, HemisphereLight, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer, PMREMGenerator, PCFShadowMap } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BloomPass } from './BloomPass';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import type { Settings } from '../core/settings';

export class Renderer {
  scene = new Scene(); camera = new PerspectiveCamera(68, 1, .08, 2200);
  gpu: GpuTimer; cpuMs = 0;
  gl: WebGLRenderer; composer: EffectComposer; bloom: BloomPass;
  fxaa: ShaderPass;
  ao: GTAOPass; cityMode = false; reflectiveTerrace = false; adaptiveAO = true;
  sun = new DirectionalLight(0xffedce, 4); fill = new HemisphereLight(0xcadcef, 0x252b36, .45);
  private automaticTier: 'high' | 'balanced' | 'mobile' = 'high';
  frameBudget = 1000 / 60;
  adaptiveEnabled = true;
  private recoveryTime = 0;
  private scaleCooldown = 0;
  private shadows = new ShadowCache();
  get tier() { return this.settings.quality === 'auto' ? this.automaticTier : this.settings.quality; }
  get targetFps() { return this.tier === 'mobile' ? 30 : 60; }
  resolution = 1; averageMs = 16; private slowFrames = 0; private aoSlowFrames = 0;
  constructor(readonly settings: Settings) {
    this.gl = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.gpu = new GpuTimer(this.gl);
    const context = this.gl.getContext(), vendor = context.getExtension('WEBGL_debug_renderer_info');
    const gpuName = vendor ? String(context.getParameter(vendor.UNMASKED_RENDERER_WEBGL)) : '';
    this.automaticTier = matchMedia('(pointer: coarse)').matches ? 'mobile' : /Intel|UHD|Iris/i.test(gpuName) || navigator.hardwareConcurrency <= 4 ? 'balanced' : 'high';
    this.gl.shadowMap.autoUpdate = false;
    this.gl.setClearColor(0x939fae); this.gl.outputColorSpace = SRGBColorSpace;
    this.gl.toneMapping = ACESFilmicToneMapping; this.gl.toneMappingExposure = 1;
    this.gl.shadowMap.enabled = !settings.safe; this.gl.shadowMap.type = PCFShadowMap;
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -55, right: 55, top: 60, bottom: -60, near: 1, far: 200 });
    this.sun.shadow.bias = -.0003; this.sun.shadow.normalBias = .04;
    this.gl.info.autoReset = false;
    this.gl.domElement.id = 'world'; this.gl.domElement.setAttribute('aria-label', 'INFINITUM game view');
    this.scene.background = new Color(0x8798ab); this.scene.fog = new FogExp2(0x8798ab, .008);
    this.sun.layers.enable(1); this.fill.layers.enable(1);
    this.sun.position.set(-65, 65, -25); this.scene.add(this.sun, this.fill);
    const pmrem = new PMREMGenerator(this.gl); const env = new RoomEnvironment();
    this.scene.environment = pmrem.fromScene(env, .04).texture; this.scene.environmentIntensity = .25; env.dispose(); pmrem.dispose();
    this.composer = new EffectComposer(this.gl); this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.renderTarget1.samples = settings.safe ? 0 : 4; this.composer.renderTarget2.samples = settings.safe ? 0 : 4;
    this.ao = new GTAOPass(this.scene, this.camera, innerWidth / 2, innerHeight / 2);
    this.ao.updateGtaoMaterial({ radius: 2.4, distanceExponent: 1, thickness: .8, samples: 8 }); this.ao.blendIntensity = .65;
    this.ao.updatePdMaterial({ samples: 8, rings: 2, radius: 4 });
    this.composer.addPass(this.ao);
    this.bloom = new BloomPass(); this.composer.addPass(this.bloom); this.composer.addPass(new OutputPass());
    this.fxaa = new ShaderPass(FXAAShader); this.composer.addPass(this.fxaa);
    window.addEventListener('resize', () => this.resize()); this.resize();
  }
  resize() {
    const width = innerWidth, height = innerHeight;
    const tier = this.tier, mobile = tier === 'mobile', high = tier === 'high';
    const cap = this.settings.safe || mobile ? 1 : high ? 1.5 : 1.25;
    const pixelBudget = mobile ? 900000 : high ? 3700000 : 2100000;
    this.gl.setPixelRatio(Math.min(devicePixelRatio, cap, Math.sqrt(pixelBudget / (width * height))) * this.resolution);
    const samples = this.settings.safe || mobile ? 0 : high ? 4 : 2;
    // Only scene geometry needs multisampling. Bloom's full-screen composite does not.
    for (const [target, count] of [[this.composer.renderTarget1, samples], [this.composer.renderTarget2, 0]] as const) if (target.samples !== count) { target.samples = count; target.dispose(); }
    const shadowSize = mobile ? 1024 : high ? 2048 : 1024;
    if (this.sun.shadow.mapSize.x !== shadowSize) { this.sun.shadow.map?.dispose(); this.sun.shadow.map = null; this.sun.shadow.mapSize.set(shadowSize, shadowSize); }
    this.gl.shadowMap.needsUpdate = true;
    this.gl.setSize(width, height); this.composer.setPixelRatio(this.gl.getPixelRatio()); this.composer.setSize(width, height);
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    this.fxaa.enabled = mobile;
    this.fxaa.uniforms.resolution.value.set(1 / (width * this.gl.getPixelRatio()), 1 / (height * this.gl.getPixelRatio()));
    const bloomScale = high ? .75 : mobile ? .35 : .5;
    this.bloom.setSize(Math.round(width * this.gl.getPixelRatio() * bloomScale), Math.round(height * this.gl.getPixelRatio() * bloomScale));
    this.bloom.enabled = this.settings.bloom && !this.settings.safe;
    this.gl.shadowMap.enabled = !this.settings.safe;
    this.ao.enabled = this.tier === 'high' && this.cityMode && !this.reflectiveTerrace && this.adaptiveAO && !this.settings.safe;
    this.ao.setSize(Math.round(width * .35 * this.resolution), Math.round(height * .35 * this.resolution));
  }
  render(dt: number) {
    this.averageMs += (Math.min(dt * 1000, 100) - this.averageMs) * .02;
    if (this.adaptiveEnabled && this.ao.enabled && this.averageMs > 30 && ++this.aoSlowFrames > 60) {
      this.adaptiveAO = false; this.ao.enabled = false; this.slowFrames = 0;
    }
    else if (this.averageMs < 26) this.aoSlowFrames = 0;
    this.scaleCooldown = Math.max(0, this.scaleCooldown - dt);
    const gpuPressure = this.gpu.ms === 0 || this.gpu.ms > this.frameBudget * 1.1;
    if (this.adaptiveEnabled && !this.ao.enabled && gpuPressure && this.averageMs > Math.max(22, this.frameBudget * 1.2) && ++this.slowFrames > 180 && this.resolution > .65 && this.scaleCooldown === 0) {
      this.resolution = Math.max(.65, this.resolution - .05); this.resize(); this.slowFrames = 0; this.scaleCooldown = 3;
    }
    else if (this.averageMs < 20) this.slowFrames = 0;
    // Restore detail only after sustained headroom; avoid repeated shrink/grow cycles.
    if (this.adaptiveEnabled && this.gpu.ms > 0 && this.gpu.ms < this.frameBudget * .65 && this.averageMs < this.frameBudget * 1.15) this.recoveryTime += dt;
    else this.recoveryTime = 0;
    if (this.recoveryTime > 10 && this.scaleCooldown === 0 && this.resolution < 1) {
      this.resolution = Math.min(1, this.resolution + .05); this.resize(); this.scaleCooldown = 5; this.recoveryTime = 0;
    }
    this.scene.updateMatrixWorld();
    if (this.shadows.changed(this.scene)) this.gl.shadowMap.needsUpdate = true;
    // Fix buffer roles each frame so the scene always receives the MSAA target.
    this.composer.readBuffer = this.composer.renderTarget1;
    this.composer.writeBuffer = this.composer.renderTarget2;
    this.gl.info.reset(); this.gpu.begin(); const start = performance.now();
    const auto = this.scene.matrixWorldAutoUpdate; this.scene.matrixWorldAutoUpdate = false;
    try { this.composer.render(); }
    finally { this.scene.matrixWorldAutoUpdate = auto; this.cpuMs = performance.now() - start; this.gpu.end(); }
  }
}
