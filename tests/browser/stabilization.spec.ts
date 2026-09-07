import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';

test('active scene frame pacing and update costs', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/'); await page.locator('#play').click();
  await page.waitForFunction(() => (window as any).__game.input.locked);
  const results = [];
  for (const chapter of [0, 1, 2, 3]) {
    await page.evaluate(chapter => {
      const g = (window as any).__game; g.director.load(chapter);
      g.render.settings.quality = 'high'; g.render.resolution = 1;
      g.render.slowFrames = -1000000; g.render.resize();
    }, chapter);
    await page.waitForTimeout(1500);
    const result = await page.evaluate(async chapter => {
      const g = (window as any).__game;
      const costs: Record<string, number[]> = {}, restore: (() => void)[] = [];
      for (const [label, owner, key] of [
        ['motor', g.player, 'tick'], ['physics', g.physics, 'step'],
        ['logic', g.director, 'tick'], ['visual', g.director, 'update'],
        ['camera', g.player, 'render'], ['render', g.render, 'render'],
      ] as const) {
        const original = owner[key]; costs[label] = [];
        owner[key] = function(...args: any[]) {
          const start = performance.now(); const value = original.apply(this, args);
          costs[label].push(performance.now() - start); return value;
        };
        restore.push(() => { owner[key] = original; });
      }
      let mutations = 0; const observer = new MutationObserver(entries => { mutations += entries.length; });
      observer.observe(document.querySelector('#hud')!, { subtree: true, childList: true, attributes: true, characterData: true });
      const frames: number[] = []; let previous = performance.now();
      for (let i = 0; i < 180; i++) await new Promise<void>(resolve => requestAnimationFrame(now => {
        frames.push(now - previous); previous = now;
        // Repeatable gentle camera sweep, without changing simulation or puzzle state.
        g.player.yaw = Math.sin(i / 60) * .18; resolve();
      }));
      observer.disconnect(); restore.forEach(fn => fn());
      const stats = (values: number[]) => { const v = [...values].sort((a,b) => a-b); return {
        count: v.length, mean: v.reduce((a,b) => a+b,0)/v.length,
        p95: v[Math.floor(v.length*.95)], p99: v[Math.floor(v.length*.99)], max: v.at(-1),
      }; };
      return { chapter, active: g.input.locked, frames: stats(frames),
        costs: Object.fromEntries(Object.entries(costs).map(([key,value]) => [key,stats(value)])),
        mutations, gpuMs: g.render.gpu.ms, resolution: g.render.resolution,
        textures: g.render.gl.info.memory.textures };
    }, chapter);
    expect(result.active).toBe(true); results.push(result); console.log(JSON.stringify(result));
    if (chapter < 2) await page.screenshot({ path: `artifacts/stabilization-${process.env.PERF_PHASE || 'current'}-${chapter}.png` });
  }
  writeFileSync(`artifacts/stabilization-${process.env.PERF_PHASE || 'current'}.json`, JSON.stringify(results,null,2));
});
