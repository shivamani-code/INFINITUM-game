import { test, expect } from '@playwright/test';
test('crossing, perspective rejection, bridge collision and reset', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.locator('#play')).toBeEnabled(); await page.locator('#play').click();
  await page.evaluate(() => { const g = (window as any).__game; g.player.teleport(g.player.position.clone().set(0, .86, -10)); });
  await page.waitForTimeout(250); await page.keyboard.press('KeyE');
  await expect.poll(() => page.evaluate(() => (window as any).__game.director.chapter), { timeout: 10000 }).toBe(1);
  await page.waitForTimeout(300); await page.screenshot({ path: 'test-results/city-scale.png' });
  // A side view must never commit merely because the player presses confirm.
  await page.evaluate(() => { const g = (window as any).__game; g.player.yaw = .5; });
  await page.waitForTimeout(150);
  await page.keyboard.press('KeyQ'); await page.keyboard.press('KeyE');
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => (window as any).__game.director.level.scale.committed)).toBe(false);
  await page.evaluate(() => {
    const g = (window as any).__game; g.player.teleport(g.player.position.clone().set(0, .86, 8));
    g.player.pitch = Math.atan2(-6.14 - 1.58, 96);
  });
  await page.waitForTimeout(300); await page.keyboard.press('KeyQ');
  await expect.poll(() => page.evaluate(() => (window as any).__game.director.level.scale.captured)).toBe(true);
  await page.keyboard.press('KeyE');
  await expect.poll(() => page.evaluate(() => (window as any).__game.director.level.scale.progress)).toBe(1);
  expect(await page.evaluate(() => !!(window as any).__game.director.level.scale.collider)).toBe(true);
  await page.keyboard.down('KeyW'); await page.keyboard.down('ShiftLeft'); await page.waitForTimeout(5300); await page.keyboard.up('KeyW'); await page.keyboard.up('ShiftLeft');
  expect(await page.evaluate(() => (window as any).__game.player.position.z)).toBeLessThan(-24);
  expect(await page.evaluate(() => (window as any).__game.player.position.y)).toBeGreaterThan(-2.3);
  await page.screenshot({ path: 'test-results/bridge-crossed.png' });
  await page.keyboard.press('KeyR');
  await expect.poll(() => page.evaluate(() => (window as any).__game.director.level.scale.committed)).toBe(false);
  expect(errors).toEqual([]);
});
