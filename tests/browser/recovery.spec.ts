import { test, expect } from '@playwright/test';
test('checkpoint reload, safe settings, fall recovery and repeated room reset', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.locator('#play')).toBeEnabled(); await page.locator('#play').click();
  await page.evaluate(() => (window as any).__game.director.load(3));
  await page.reload(); await expect(page.locator('#play-label')).toHaveText('CONTINUE JOURNEY'); await page.locator('#play').click();
  expect(await page.evaluate(() => (window as any).__game.director.chapter)).toBe(3);
  const colliders = await page.evaluate(() => (window as any).__game.physics.world.colliders.len());
  await page.waitForTimeout(250);
  const geometries = await page.evaluate(() => (window as any).__game.render.gl.info.memory.geometries);
  for (let i = 0; i < 5; i++) { await page.keyboard.press('KeyR'); await page.waitForTimeout(80); }
  expect(await page.evaluate(() => (window as any).__game.physics.world.colliders.len())).toBe(colliders);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => (window as any).__game.render.gl.info.memory.geometries)).toBeLessThanOrEqual(geometries + 2);
  await page.evaluate(() => { const g = (window as any).__game; g.player.teleport(g.player.position.clone().set(0, -35, 0)); });
  await expect.poll(() => page.evaluate(() => (window as any).__game.player.position.y)).toBeGreaterThan(0);
  await page.keyboard.press('Escape'); await page.locator('#settings-button').click();
  await page.locator('#safe').check(); await page.locator('#reducedMotion').check();
  await page.reload(); await expect(page.locator('#play')).toBeEnabled();
  expect(await page.evaluate(() => (window as any).__game.render.settings.safe)).toBe(true);
  expect(await page.evaluate(() => (window as any).__game.render.bloom.enabled)).toBe(false);
  await page.locator('#play').click(); await page.waitForTimeout(250); await page.setViewportSize({ width: 900, height: 700 });
  await page.screenshot({ path: 'test-results/safe-graphics.png' });
  expect(errors).toEqual([]);
});
