import { test, expect } from '@playwright/test';

test('physics camera synchronization does not advance gravity easing', async ({ page }) => {
  await page.goto('/'); await page.locator('#play').click();
  await page.waitForFunction(() => (window as any).__game.input.locked);
  const result = await page.evaluate(() => {
    const g = (window as any).__game, p = g.player;
    p.setGravity(p.up.clone().set(-1,0,0));
    const start = p.visualFrame.clone();
    for (let i=0;i<60;i++) p.syncCamera();
    const drift = p.visualFrame.angleTo(start);
    p.render(.5,1/30); const first = p.visualFrame.clone();
    p.visualFrame.copy(start); p.render(.5,1/60); p.render(.5,1/60);
    return { drift, difference: p.visualFrame.angleTo(first), finite: p.camera.position.toArray().every(Number.isFinite) };
  });
  expect(result.drift).toBeLessThan(1e-6); expect(result.difference).toBeLessThan(1e-6); expect(result.finite).toBe(true);
});

test('adaptive resolution recovers with headroom and ignores slow browser cadence without GPU pressure', async ({ page }) => {
  await page.goto('/'); await page.waitForFunction(() => !!(window as any).__game);
  const result = await page.evaluate(() => {
    const r = (window as any).__game.render;
    // Isolate the controller from real GPU timing; do not submit synthetic frames.
    r.composer.render = () => {}; r.gpu.begin = () => {}; r.gpu.end = () => {};
    r.settings.quality = 'balanced'; r.frameBudget = 1000/60; r.adaptiveEnabled = true;
    r.resolution = .8; r.averageMs = 16.67; r.gpu.ms = 5; r.resize();
    for (let i=0;i<670;i++) r.render(1/60);
    const recovered = r.resolution;
    r.resolution = 1; r.averageMs = 33.33; r.slowFrames = 0;
    for (let i=0;i<240;i++) r.render(1/30);
    const schedulingOnly = r.resolution;
    r.gpu.ms = 40;
    for (let i=0;i<240;i++) r.render(1/30);
    return { recovered, schedulingOnly, pressured: r.resolution };
  });
  expect(result.recovered).toBeGreaterThan(.8);
  expect(result.schedulingOnly).toBe(1);
  expect(result.pressured).toBeLessThan(1);
});
