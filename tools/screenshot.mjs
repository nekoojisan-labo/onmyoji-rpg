// 検証ハーネス：dev サーバを起動しテストシーンを headless Chromium で撮影する。
// 契約 §5.2 の「描画/手触りは Playwright スクショで検証」流儀。
// 使い方: npm run screenshot  → tools/shots/scene.png を出力。
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from '@playwright/test';

const URL = 'http://127.0.0.1:5173/';
const OUT_DIR = 'tools/shots';

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // サーバ起動待ち
    }
    await sleep(500);
  }
  return false;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const dev = spawn('npm', ['run', 'dev'], { stdio: 'ignore' });
  const cleanup = () => {
    if (!dev.killed) dev.kill('SIGTERM');
  };
  process.on('exit', cleanup);

  try {
    const up = await waitForServer(URL, 30_000);
    if (!up) throw new Error('dev サーバが 30s 以内に起動しませんでした');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(URL, { waitUntil: 'networkidle' });
    // 数フレーム描画させてから撮影
    await sleep(1000);
    await page.screenshot({ path: `${OUT_DIR}/scene.png` });
    await browser.close();
    console.log(`screenshot saved: ${OUT_DIR}/scene.png`);
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
