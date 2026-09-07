import { test, expect, type Page } from '@playwright/test';

// Drive the actual motor through the whole authored route. No teleports or chapter skips.
async function walk(page: Page, target: [number, number, number]) {
  const started = Date.now();
  while (Date.now() - started < 20000) {
    const distance = await page.evaluate(target => {
      const p = (window as any).__game.player;
      const local = p.position.clone().fromArray(target).sub(p.position).applyQuaternion(p.frame.clone().invert());
      const distance = Math.hypot(local.x, local.z);
      if (distance > .2) p.yaw = Math.atan2(-local.x, -local.z);
      p.pitch = 0;
      return distance;
    }, target);
    if (distance < .5) {
      await page.keyboard.up('KeyW'); await page.keyboard.up('ShiftLeft'); await page.waitForTimeout(200); return;
    }
    if (distance > 3) await page.keyboard.down('ShiftLeft'); else await page.keyboard.up('ShiftLeft');
    await page.keyboard.down('KeyW'); await page.waitForTimeout(Math.min(140, Math.max(35, distance * 35)));
  }
  throw new Error(`Motor could not reach ${target}: ` + await page.evaluate(() => JSON.stringify((window as any).__game.player.position)));
}
async function aim(page: Page, target: [number, number, number]) {
  await page.evaluate(target => {
    const g = (window as any).__game, p = g.player;
    const local = p.position.clone().fromArray(target).sub(g.render.camera.position).applyQuaternion(p.frame.clone().invert());
    p.yaw = Math.atan2(-local.x, -local.z); p.pitch = Math.atan2(local.y, Math.hypot(local.x, local.z));
  }, target); await page.waitForTimeout(180);
}
async function chapter(page: Page, id: number) { await expect.poll(() => page.evaluate(() => (window as any).__game.director.chapter), { timeout: 10000 }).toBe(id); await page.waitForTimeout(200); }

test('complete fresh journey using real movement and all three mechanics', async ({ page }) => {
  test.setTimeout(240000);
  const errors: string[] = [], metrics: unknown[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.locator('#play')).toBeEnabled(); await page.locator('#play').click();
  await walk(page, [0, 0, -10]); await page.keyboard.press('KeyE'); await chapter(page, 1);
  await walk(page, [0, 0, 8]); await aim(page, [0, -6.14, -88]);
  await page.keyboard.press('KeyQ'); await page.waitForTimeout(150); await page.keyboard.press('KeyE');
  await expect.poll(() => page.evaluate(() => (window as any).__game.director.level.scale.progress)).toBe(1);
  await walk(page, [0, 0, -35]); await page.keyboard.press('KeyE'); await chapter(page, 2);
  await walk(page, [7.4, 0, -10]); await page.keyboard.press('KeyE'); await page.waitForTimeout(1300);
  await walk(page, [8.65, 18.5, -27]); await page.keyboard.press('KeyE'); await page.waitForTimeout(1300);
  await walk(page, [-7, 21, -38]); await page.keyboard.press('KeyE'); await chapter(page, 3);
  for (const x of [-5, 5]) {
    await page.keyboard.press('KeyQ'); await walk(page, [x, 0, -3]); await page.waitForTimeout(400); await page.keyboard.press('KeyR'); await page.waitForTimeout(250);
  }
  await expect.poll(() => page.evaluate(() => (window as any).__game.director.level.doorOpen), { timeout: 10000 }).toBe(true);
  await walk(page, [0, 0, -26]); await page.keyboard.press('KeyE'); await chapter(page, 4);
  await page.keyboard.press('KeyQ'); await walk(page, [-5, 0, 1]); await page.waitForTimeout(400); await page.keyboard.press('KeyR'); await page.waitForTimeout(250);
  await walk(page, [7.4, 0, -4]); await page.keyboard.press('KeyE'); await page.waitForTimeout(1300);
  await walk(page, [8.65, 12, -2.5]); await aim(page, [7.92, 12, -60]);
  await page.keyboard.press('KeyQ'); await page.waitForTimeout(200); await page.keyboard.press('KeyE');
  await expect.poll(() => page.evaluate(() => (window as any).__game.director.level.scale.committed)).toBe(true);
  await walk(page, [8.65, 17, -27]); await page.keyboard.press('KeyE'); await chapter(page, 5);
  metrics.push(await page.evaluate(() => { const r = (window as any).__game.render; return { ms: r.averageMs, calls: r.gl.info.render.calls, triangles: r.gl.info.render.triangles, resolution: r.resolution }; }));
  await walk(page, [0, 0, -18]); await page.keyboard.press('KeyE');
  await expect.poll(() => page.evaluate(() => (window as any).__game.director.level.finale.phase), { timeout: 15000 }).toBe(2);
  await page.keyboard.press('KeyE'); await expect(page.locator('#ending')).toBeVisible();
  console.log('Golden path measured rendering:', metrics);
  expect(errors).toEqual([]);
});
