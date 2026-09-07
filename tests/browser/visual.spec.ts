import { test, expect } from '@playwright/test';
test('capture lighting diagnostic', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/'); await page.locator('#play').waitFor();
  await page.waitForFunction(() => !!(window as any).__game);
  await page.waitForTimeout(2500); await page.screenshot({ path: 'artifacts/chamber-depth-pass.png' });
  expect(await page.evaluate(() => (window as any).__game.director.chamber.group.children.some((o: any) => o.name === 'Blender / monolith' && o.count > 0))).toBe(true);
  expect(await page.evaluate(() => {
    const group = (window as any).__game.director.chamber.group;
    const mesh = group.children.find((o: any) => o.name === 'Blender / monolith');
    const color = mesh.geometry.getAttribute('color');
    if (!color || !mesh.material.vertexColors) return false;
    let min = 1, max = 0;
    for (let i = 0; i < color.count; i++) { min = Math.min(min, color.getX(i)); max = Math.max(max, color.getX(i)); }
    return min < .9 && max > .95;
  })).toBe(true);
  await page.locator('#play').click();
  await page.waitForFunction(() => (window as any).__game.input.locked);
  await page.waitForFunction(() => (window as any).__game.render.frameBudget < 20);
  await page.evaluate(() => { const g = (window as any).__game; g.director.load(1); g.player.pitch = .14; });
  await page.waitForTimeout(8000); await page.screenshot({ path: 'artifacts/bridge-depth-pass.png' });
  expect(await page.evaluate(() => (window as any).__game.director.city.district.children.some((o: any) => o.name === 'Blender / tower' && o.count > 0))).toBe(true);
  console.log(await page.evaluate(() => { const g = (window as any).__game; return { ms: g.render.averageMs, resolution: g.render.resolution, ao: g.render.ao.enabled, calls: g.render.gl.info.render.calls, triangles: g.render.gl.info.render.triangles }; }));
  await page.evaluate(() => { const g = (window as any).__game; g.player.yaw = .3; });
  await page.keyboard.down('KeyD'); await page.waitForTimeout(500); await page.keyboard.up('KeyD');
  await page.waitForTimeout(1000); await page.screenshot({ path: 'artifacts/bridge-depth-offset.png' });
  expect(await page.evaluate(() => {
    const invalid: string[] = [];
    (window as any).__game.render.scene.traverse((object: any) => {
      if (object.isMesh && object.material?.vertexColors && !object.geometry.hasAttribute('color')) invalid.push(object.name || object.type);
    });
    return invalid;
  })).toEqual([]);
  expect(errors).toEqual([]);
});
