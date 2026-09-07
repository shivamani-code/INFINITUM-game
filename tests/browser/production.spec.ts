import { test, expect } from '@playwright/test';
test('production bundle boots locally without external assets or developer hooks', async ({ page }) => {
  const errors: string[] = [], external: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  page.on('request', r => { if (r.url().startsWith('http') && !r.url().startsWith('http://127.0.0.1:4173')) external.push(r.url()); });
  await page.goto('http://127.0.0.1:4173'); await expect(page.locator('#play')).toBeEnabled();
  expect(await page.evaluate(() => (window as any).__game)).toBeUndefined();
  await page.locator('#play').click(); await expect(page.locator('#hud')).toBeVisible();
  await page.keyboard.down('KeyW'); await page.waitForTimeout(800); await page.keyboard.up('KeyW');
  await page.keyboard.press('Escape'); await expect(page.locator('#menu')).toBeVisible();
  await page.screenshot({ path: 'test-results/production.png' });
  expect(errors).toEqual([]); expect(external).toEqual([]);
});
