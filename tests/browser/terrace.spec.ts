import { test, expect } from '@playwright/test';

test('terrace reflection resources survive resets and honor safe graphics', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#play')).toBeEnabled(); await page.locator('#play').click();
  await page.evaluate(() => (window as any).__game.director.load(1));
  await page.waitForTimeout(700);
  const baseline = await page.evaluate(() => {
    const g = (window as any).__game;
    return { textures: g.render.gl.info.memory.textures, colliders: g.physics.world.colliders.len() };
  });
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => (window as any).__game.director.load(1));
    await page.waitForTimeout(200);
  }
  expect(await page.evaluate(() => (window as any).__game.render.gl.info.memory.textures)).toBeLessThanOrEqual(baseline.textures);
  expect(await page.evaluate(() => (window as any).__game.physics.world.colliders.len())).toBe(baseline.colliders);
  await page.evaluate(() => { const g = (window as any).__game; g.render.settings.safe = true; g.render.resize(); });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => (window as any).__game.director.level.reflection.visible)).toBe(false);
  expect(await page.evaluate(() => (window as any).__game.director.city.clouds.visible)).toBe(false);
});
