import { test, expect } from '@playwright/test';
test('two recorded attempts hold independent seals and open the temporal gate', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.locator('#play')).toBeEnabled(); await page.locator('#play').click();
  await page.evaluate(() => (window as any).__game.director.load(3)); await page.waitForTimeout(200);
  for (const x of [-5, 5]) {
    await page.keyboard.press('KeyQ'); await page.waitForTimeout(250);
    await page.evaluate(x => { const g = (window as any).__game; g.player.teleport(g.player.position.clone().set(x, .86, -3)); }, x);
    await page.waitForTimeout(500); await page.keyboard.press('KeyR'); await page.waitForTimeout(250);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__game.director.level.echo.echoes.length)).toBe(2);
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => (window as any).__game.director.level.doorOpen)).toBe(true);
  expect(await page.evaluate(() => (window as any).__game.director.level.doorCollider.isEnabled())).toBe(false);
  await page.screenshot({ path: 'test-results/echo-vault.png' });
  await page.keyboard.press('KeyC'); await page.waitForTimeout(800);
  expect(await page.evaluate(() => (window as any).__game.director.level.echo.echoes.length)).toBe(0);
  expect(await page.evaluate(() => (window as any).__game.director.level.doorCollider.isEnabled())).toBe(true);
  expect(errors).toEqual([]);
});
