import { test, expect } from '@playwright/test';
test('fixed-tick recording remains bounded under CPU throttling', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#play')).toBeEnabled(); await page.locator('#play').click();
  await page.evaluate(() => (window as any).__game.director.load(3)); await page.waitForTimeout(200);
  const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await page.keyboard.press('KeyQ'); await page.keyboard.down('KeyW'); await page.waitForTimeout(2200); await page.keyboard.up('KeyW');
  const track = await page.evaluate(() => (window as any).__game.director.level.echo.recorder.samples);
  expect(track.length).toBeGreaterThan(30); expect(track.length).toBeLessThan(300);
  expect(track.every((s: any, i: number) => s.tick === i && s.position.every(Number.isFinite))).toBe(true);
  await page.keyboard.press('KeyR'); await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as any).__game.director.level.echo.echoes.length)).toBe(1);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
});
