import { test, expect } from '@playwright/test';

test('floor reflection follows every moving camera frame in chamber and city', async ({ page }) => {
  await page.goto('/'); await page.locator('#play').click();
  await page.waitForFunction(() => (window as any).__game.input.locked);
  for (const chapter of [0,1]) {
    await page.evaluate(chapter => (window as any).__game.director.load(chapter), chapter);
    await page.waitForTimeout(600);
    const result = await page.evaluate(async () => {
      const g=(window as any).__game, r=g.director.level?.reflection ?? g.director.chamber.reflection;
      const getCamera=r.getReflectionCamera, render=g.render.render;
      let frames=0, stale=0, refreshed=false;
      r.getReflectionCamera=function(camera:any){ if(camera===g.render.camera)refreshed=true;return getCamera.call(this,camera); };
      g.render.render=function(dt:number){
        refreshed=false;render.call(this,dt);frames++;if(!refreshed)stale++;
      };
      const start=g.player.position.z;
      g.input.keys.add('KeyW');
      for(let i=0;i<60;i++) await new Promise<void>(resolve=>requestAnimationFrame(()=>{
        g.player.yaw+=.001; resolve();
      }));
      g.input.keys.delete('KeyW');g.render.render=render;r.getReflectionCamera=getCamera;
      return {frames,stale,moved:Math.abs(g.player.position.z-start)};
    });
    expect(result.frames).toBeGreaterThan(40);
    // The first sampled frame may still have the unchanged, stationary view.
    expect(result.stale).toBeLessThanOrEqual(1);
    expect(result.moved).toBeGreaterThan(1);
    await page.screenshot({path:`artifacts/reflection-motion-${chapter}.png`});
  }
});
