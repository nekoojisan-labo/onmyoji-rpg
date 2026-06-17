import { test, expect } from '@playwright/test';

test('スモーク：#app に canvas が出てフレームが進む', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://127.0.0.1:5173/');

  // #app 配下に canvas が1枚だけ装着される
  const canvas = page.locator('#app canvas');
  await expect(canvas).toHaveCount(1);

  // canvas が内部解像度 1280x720 で生成されている
  const dims = await canvas.evaluate((el) => ({
    w: (el as HTMLCanvasElement).width,
    h: (el as HTMLCanvasElement).height,
  }));
  expect(dims.w).toBe(1280);
  expect(dims.h).toBe(720);

  // WebGL コンテキストが取れている（黒画面=取得失敗 を弾く）
  const hasGl = await canvas.evaluate((el) => {
    const c = el as HTMLCanvasElement;
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  });
  expect(hasGl).toBe(true);

  // ランタイムエラーが無い
  expect(errors).toEqual([]);

  await page.screenshot({ path: 'tools/shots/smoke.png' });
});
