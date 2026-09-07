import { test, expect } from '@playwright/test';
test('collapse reveals the containers, offers final interaction and credits replay', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.locator('#play')).toBeEnabled(); await page.locator('#play').click();
  await expect(page.locator('#hud')).toBeVisible();
  await page.waitForFunction(() => (window as any).__game.input.locked);
  await page.evaluate(() => { const g = (window as any).__game; g.director.load(5); g.player.teleport(g.player.position.clone().set(0, .86, -18)); });
  await page.waitForTimeout(200); await page.keyboard.press('KeyE');
  await expect.poll(() => page.evaluate(() => (window as any).__game.director.level.finale.phase), { timeout: 15000 }).toBe(2);
  await page.screenshot({ path: 'test-results/last-scale.png' });
  await page.keyboard.press('KeyE'); await expect(page.locator('#ending')).toBeVisible();
  await expect(page.locator('#menu')).toBeHidden(); await page.screenshot({ path: 'test-results/ending.png' });
  await page.locator('#replay').click(); await expect(page.locator('#hud')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__game.director.chapter)).toBe(0);
  expect(errors).toEqual([]);
});
