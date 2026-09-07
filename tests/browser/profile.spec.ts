import { test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
test('renderer cost isolation', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/'); await page.locator('#play').click();
  await page.waitForFunction(() => (window as any).__game.input.locked);
  await page.waitForFunction(() => (window as any).__game.render.frameBudget < 20);
  await page.evaluate(() => { const g=(window as any).__game; g.director.load(1); g.render.slowFrames=-1000000; g.render.resolution=1; g.render.resize(); });
  await page.waitForTimeout(3000);
  const results=[];
  for(const mode of ['baseline','clouds-off','reflection-cached','bloom-off','shadows-off','scale-70']) {
    const result=await page.evaluate(async mode=>{
      const g=(window as any).__game,r=g.render,reflection=g.director.level.reflection;
      const original=reflection.onBeforeRender;
      g.director.city.clouds.children.forEach((m:any)=>m.visible=mode!=='clouds-off');
      if(mode==='reflection-cached')reflection.onBeforeRender=()=>{};
      r.bloom.enabled=mode!=='bloom-off';r.gl.shadowMap.enabled=mode!=='shadows-off';
      r.resolution=mode==='scale-70'?.7:1;r.resize();
      r.bloom.enabled=mode!=='bloom-off';r.gl.shadowMap.enabled=mode!=='shadows-off';
      const samples:number[]=[],cpu:number[]=[],calls:number[]=[],triangles:number[]=[];let prev=performance.now();const render=r.render.bind(r);
      r.render=(dt:number)=>{const start=performance.now();render(dt);cpu.push(performance.now()-start);calls.push(r.gl.info.render.calls);triangles.push(r.gl.info.render.triangles);};
      for(let i=0;i<120;i++)await new Promise<void>(resolve=>requestAnimationFrame(now=>{if(i>20)samples.push(now-prev);prev=now;resolve();}));
      r.render=render;reflection.onBeforeRender=original;
      samples.sort((a,b)=>a-b);cpu.sort((a,b)=>a-b);
      const materials=new Set(),textures=new Set();let lights=0,points=0;
      r.scene.traverse((o:any)=>{if(o.material)materials.add(o.material);if(o.isLight)lights++;if(o.isPoints)points+=o.geometry.attributes.position.count;});
      const gl=r.gl.getContext();
      return {mode,active:g.input.locked,frameBudget:r.frameBudget,tier:r.tier,dpr:r.gl.getPixelRatio(),peakCalls:Math.max(...calls),peakTriangles:Math.max(...triangles),p50:samples[Math.floor(samples.length*.5)],p95:samples[Math.floor(samples.length*.95)],cpuP50:cpu[Math.floor(cpu.length*.5)],calls:r.gl.info.render.calls,triangles:r.gl.info.render.triangles,materials:materials.size,lights,particles:points,memory:r.gl.info.memory,gpuMs:r.gpu.ms,gpuTimer:!!gl.getExtension('EXT_disjoint_timer_query_webgl2'),loadMs:performance.getEntriesByType('navigation')[0].duration};
    },mode);results.push(result);console.log(result);
  }
  writeFileSync('artifacts/optimization-profile.json',JSON.stringify(results,null,2));
});
