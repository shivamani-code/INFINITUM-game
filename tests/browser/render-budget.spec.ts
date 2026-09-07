import { test, expect } from '@playwright/test';
test('profile warm city rendering paths and imported geometry budget', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#play')).toBeEnabled(); await page.locator('#play').click();
  await page.waitForFunction(() => (window as any).__game.input.locked);
  await page.waitForFunction(() => (window as any).__game.render.frameBudget < 20);
  await page.evaluate(() => (window as any).__game.director.load(1));
  for (const mode of ['adaptive-high', 'withoutAO', 'safe']) {
    await page.evaluate(mode => {
      const r = (window as any).__game.render;
      if (mode === 'withoutAO') r.ao.enabled = false;
      if (mode === 'safe') { r.settings.safe = true; r.resize(); }
    }, mode);
    await page.waitForTimeout(5000);
    const sample = await page.evaluate(() => {
      const r = (window as any).__game.render, gl = r.gl.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
      return { ms: r.averageMs, resolution: r.resolution, calls: r.gl.info.render.calls, triangles: r.gl.info.render.triangles,
        gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unavailable' };
    });
    console.log(mode, sample); expect(sample.triangles).toBeLessThan(450000);
  }
});
